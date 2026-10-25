// なかま（懐柔した モンスター）の スキルポイント・＋値・性別（配合の 資料：docs/mono-link-haigou.md。DQMJ に 沿う）
// なかまの スキルは 3 つまで：自分の 種族の ツリー（c.tree）＋ サブスキル 2 つ（c.subs。配合で 受けつぐ）
// スキルポイント：Lv × 10 ＋ 配合で 受けついだ 分（c.carry）。c.sp は 振った ことに なった 分（もどせない。DQMJ と 同じ）
// 自動（c.auto が false で ない とき）：のこりを 自分の ツリーから 最大まで → サブスキル 1 → 2 の 順に 振る
import { SP_PER_LV, pathSp } from "./trees.js";

export const SUB_MAX = 2;                 // サブスキルの 数（自分の ツリーと あわせて 3 つ）
export const TREE_FULL = pathSp({});      // ツリー 1 本を 最大まで 振る SP（分岐は 左）
export const PLUS_RATE = 0.02;            // ＋値 1 ごとに ステータス ＋2%
export const FUSE_LV = 10;                // 配合できる Lv
export const SEXES = { m: "♂", f: "♀", b: "両性" };

// 持って いる ツリー（自分の ツリーが さいしょ）
export const treesOf = (c) => [c.tree, ...(c.subs || [])].slice(0, 1 + SUB_MAX);
// スキルポイントの 合計
export const spTotal = (c, lv = c.lv) => SP_PER_LV * (Math.max(1, lv) - 1) + (c.carry || 0);
// ツリーごとの ポイント（振った 分 ＋ 自動で 振る 分）と、まだ 振って いない ポイント
export function spSplit(c, lv = c.lv) {
  const ids = treesOf(c), lock = c.sp || {}, out = {};
  let free = spTotal(c, lv);
  for (const id of ids) { out[id] = Math.min(TREE_FULL, lock[id] || 0); free -= out[id]; }
  free = Math.max(0, free);
  if (c.auto !== false) for (const id of ids) { const k = Math.min(free, TREE_FULL - out[id]); out[id] += k; free -= k; }
  return { sp: out, free };
}
// 戦う ときの 形（builds.js の petAt に わたす）：サブスキルの SP と、合計を そろえる bonusSp（振って いない 分は 入れない）
export function growOf(c, lv = c.lv) {
  if (!c.subs && !c.sp && !c.carry) return null;   // 配合して いない 子は 前と 同じ（自分の ツリーだけ・Lv の 分）
  const { sp } = spSplit(c, lv), main = sp[c.tree] || 0, subs = (c.subs || []).map((id) => [id, sp[id] || 0]);
  return { subs, bonusSp: main + subs.reduce((a, [, s]) => a + s, 0) - SP_PER_LV * (Math.max(1, lv) - 1) };
}
// 性別の くじ（♂ 48%・♀ 48%・両性 4%）。r は 0〜1
export const sexOf = (r) => (r < 0.48 ? "m" : r < 0.96 ? "f" : "b");
// 前から いる 子には uid から 決まった くじで 性別を 付ける（毎回 同じ）
export const sexByUid = (uid) => { let h = 2166136261; for (const ch of String(uid)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return sexOf((h % 10000) / 10000); };
// 配合できる 組み合わせ（♂ × ♀、両性は どちらとも）
export const sexOk = (a, b) => a === "b" || b === "b" || (a === "m" && b === "f") || (a === "f" && b === "m");
