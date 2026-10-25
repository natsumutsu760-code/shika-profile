// モンスターの 配合（docs/mono-link-haigou.md。初代 DQMJ に 沿う。はっきり しない 所は ジョーカー2・イルルカ・ジョーカー3）
// 親：なかよしの なかま 2 体（Lv10 以上・♂ × ♀、両性は どちらとも）。配合すると 親は いなく なる
// 子の 候補：位階配合（系統 × 系統と 位階）＋ 特殊配合 ＋ 4 体配合。候補から 1 種 えらぶ
// 子：Lv1・なかよしで 生まれる。＋値・受けついだ 力（両親の 合計 ÷ 4）・スキル（自分の ツリー ＋ サブスキル 2 つ）・スキルポイント（両親の 合計の 半分）
import { DUNGEONS_ALL, SNACK_NEED } from "./dungeons.js";
import { ENEMY_TREES, evoOf } from "./enemy-trees.js";
import { tamedOf } from "./dungeon-sim.js";
import { SUB_MAX, TREE_FULL, FUSE_LV, treesOf, spTotal, spSplit, sexOf, sexOk } from "./monster.js";

// ---------- ランク（初代 DQMJ と 同じ 8 段）。野生の 種族は 出て くる Lv で 決める ----------
export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS"];
const RANK_LV = [8, 16, 26, 36, 46, 56, 66];   // この Lv より 下なら その ランク（F は 8 未満 … SS は 66 以上）
export const rankByLv = (lv) => { const i = RANK_LV.findIndex((x) => lv < x); return i < 0 ? RANKS.length - 1 : i; };

// ---------- 系統（仮。ヴェルヴェットの 種族を 鹿さんから もらったら 差しかえる。いまは 職業 5 タイプ） ----------
export const FAMILIES = {
  attacker: { name: "アタッカー" }, defender: { name: "ディフェンダー" }, caster: { name: "キャスター" }, technician: { name: "テクニシャン" }, healer: { name: "ヒーラー" },
};
const FAM_IDS = Object.keys(FAMILIES);
// かけあわせの 系統（ちがう 系統どうしで、位階の 低い 子が 出る 系統。仮：2 つの どちらでも ない 系統を 決まった 順で）
export function mixFam(a, b) {
  if (a === b) return a;
  const i = (FAM_IDS.indexOf(a) + FAM_IDS.indexOf(b)) % FAM_IDS.length;
  for (let k = 0; k < FAM_IDS.length; k++) { const f = FAM_IDS[(i + k) % FAM_IDS.length]; if (f !== a && f !== b) return f; }
  return a;
}

// ---------- 種族（野生 ＋ 配合限定）と 位階 ----------
// 配合限定（ランクごとに 10 種。鹿さんの決め。名前・系統・ツリー・絵は これから）：{ tree, name, type, fam, rank, only: "4体" か "特殊" なら はしごには 入らない }
export const FUSION_ONLY = [];
const wild = DUNGEONS_ALL.flatMap((d) => [...d.foes, d.rare, d.boss].map((f) => ({ tree: f.tree, name: f.name, type: f.type, lv: f.lv, fam: f.type, rank: rankByLv(f.lv), wild: true })));
export const SPECIES = [...wild, ...FUSION_ONLY.map((s) => ({ lv: 0, ...s, wild: false }))]
  .sort((a, b) => a.rank - b.rank || a.lv - b.lv || (a.tree < b.tree ? -1 : 1))
  .map((s, i) => ({ ...s, pos: i + 1 }));   // 位階（通し番号。大きいほど 上）
const BY_TREE = new Map(SPECIES.map((s) => [s.tree, s]));
export const speciesOf = (tree) => BY_TREE.get(tree) || null;
export const famOf = (tree) => (speciesOf(tree) || {}).fam;
const ladder = (fam) => SPECIES.filter((s) => s.fam === fam && !s.only);

// ---------- 特殊配合・4 体配合 ----------
// 特殊配合：{ a, b, child }（a・b は 種族の ツリー id か「fam:系統」。順は どちらでも）
// 仮（2026-10-25）：となりの 行き先の 希少どうしで、あとの 行き先の ボス。配合限定と いっしょに 鹿さんと 決めなおす
const ORDERED = [...DUNGEONS_ALL].sort((a, b) => a.lv - b.lv);
export const SPECIAL = ORDERED.slice(1).map((d, i) => ({ a: ORDERED[i].rare.tree, b: d.rare.tree, child: d.boss.tree }));
// 4 体配合：{ gp: [祖父母 4 種], child }（両親の 親の 組み合わせ。順は どちらでも）。配合限定の SS と いっしょに 決める
export const FOUR = [];
const hit = (want, c) => (want.startsWith("fam:") ? famOf(c.tree) === want.slice(4) : want === c.tree);
const sameBag = (x, y) => x.length === y.length && [...x].sort().join() === [...y].sort().join();

// ---------- 配合できるか ----------
export function canFuse(A, B, full = (c) => true) {
  if (!A || !B || A === B || A.uid === B.uid) return { ok: false, why: "2 体 えらんで" };
  for (const c of [A, B]) {
    if (!full(c)) return { ok: false, why: `${c.name}は まだ なかよしで ない` };
    if ((c.lv || 1) < FUSE_LV) return { ok: false, why: `${c.name}は Lv${FUSE_LV} から 配合できる` };
  }
  if (!sexOk(A.sex, B.sex)) return { ok: false, why: "♂ と ♀ で 配合する（両性は どちらとも）" };
  return { ok: true };
}

// ---------- 生まれる 子の 候補（1〜5 種）----------
export function candidates(A, B) {
  const a = speciesOf(A.tree), b = speciesOf(B.tree); if (!a || !b) return [];
  const avg = (a.pos + b.pos) / 2, cap = Math.max(a.rank, b.rank) + 1, out = [];   // 子の ランクは 親の 高い 方 ＋1 まで（はしごが すいて いても 飛びすぎない）
  const add = (s, how) => { if (s && !out.some((x) => x.tree === s.tree)) out.push({ tree: s.tree, how }); };
  const above = (fam) => { const L = ladder(fam).filter((s) => s.rank <= cap); return L.find((s) => s.pos > avg) || L[L.length - 1]; };
  const below = (fam) => { const L = ladder(fam).filter((s) => s.pos < avg); return L[L.length - 1] || ladder(fam)[0]; };
  for (const f of FOUR) if (A.par && B.par && sameBag(f.gp, [...A.par, ...B.par])) add(speciesOf(f.child), "4体配合");
  for (const s of SPECIAL) if ((hit(s.a, A) && hit(s.b, B)) || (hit(s.a, B) && hit(s.b, A))) add(speciesOf(s.child), "特殊配合");
  if (a.fam === b.fam) add(above(a.fam), "位階配合");
  else { add(above(a.fam), "位階配合"); add(above(b.fam), "位階配合"); add(below(mixFam(a.fam, b.fam)), "位階配合"); }
  return out.slice(0, 5);
}

// ---------- 受けつぐ スキルの 候補 ----------
// 親の ツリー（自分の ツリーと サブスキル）。最大まで 振った ツリーは「＋」（進化）も 候補に。子の 自分の ツリーは いつも ある ので のぞく
export function skillOptions(A, B, childTree) {
  const out = [];
  for (const c of [A, B]) {
    const { sp } = spSplit(c);
    for (const id of treesOf(c)) {
      if (id !== childTree && ENEMY_TREES[id] && !out.some((o) => o.id === id)) out.push({ id, evo: false });
      const ev = evoOf(id);
      if (ev && ev !== childTree && (sp[id] || 0) >= TREE_FULL && !out.some((o) => o.id === ev)) out.push({ id: ev, evo: true });
    }
  }
  return out;
}

// ---------- 子を 作る ----------
// R：0〜1 の くじ（性別）。uid：新しい 子の uid
export function makeChild(A, B, childTree, subs, R, uid) {
  const sp = speciesOf(childTree); if (!sp) return null;
  const lvSum = (A.lv || 1) + (B.lv || 1);
  const plus = Math.max(A.plus || 0, B.plus || 0) + 1 + (lvSum >= 50 ? 1 : 0) + (lvSum >= 100 ? 1 : 0);
  // スキルポイント：両親の 合計の 半分を 受けつぐ。受けついだ ツリーには 両親が 振って いた 分の 合計の 半分（ジョーカー2）
  const carry = Math.floor((spTotal(A) + spTotal(B)) / 2), sa = spSplit(A).sp, sb = spSplit(B).sp, lock = {};
  for (const id of [childTree, ...subs]) { const v = Math.min(TREE_FULL, Math.floor(((sa[id] || 0) + (sb[id] || 0)) / 2)); if (v) lock[id] = v; }
  // 受けついだ 力：両親の ステータス（装備なし）の 合計 ÷ 4 から、子の Lv1 の ステータスを 引いた 分
  const pa = tamedOf(A, A.lv).stats, pb = tamedOf(B, B.lv).stats, base = tamedOf({ tree: childTree, type: sp.type, name: sp.name }, 1).stats, inh = {};
  for (const k of Object.keys(base)) { const v = Math.floor(((pa[k] || 0) + (pb[k] || 0)) / 4) - base[k]; if (v > 0) inh[k] = v; }
  const rank = (ENEMY_TREES[childTree] || {}).rank || "通常";
  return { uid, tree: childTree, type: sp.type, lv: 1, name: sp.name, exp: 0, gauge: SNACK_NEED[rank] || 0, sex: sexOf(R()), plus, inh, subs: subs.slice(0, SUB_MAX), sp: lock, carry, par: [A.tree, B.tree], gen: Math.max(A.gen || 0, B.gen || 0) + 1 };
}
