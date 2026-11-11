// グループの 好感度（−100〜＋100。2026-11-11 鹿さん「8つの仕組み…作り実装してください」。決まりは docs/mono-link-services-plan.md 5 章）
// 〔決〕グループごとに 持つ（商人の 友好度とは 別）・1 つが ＋10 なら ほかの 2 つは −5 ずつ・高いと 割引／フリマの 枠／ファイトマネー／ボーダーゾーンの サンプル
// 〔決〕トークンを 持って 上がる 上乗せ（×1.1・×1.25）の 分は ほかを 下げない（2026-11-11 カード「トークンの上乗せ」。3 つの 合計が 0 から ふえる）
// rec.gaff = { sva, harmonia, tcu }（lounge-border.js の groupAff・lounge-auction.js の 枠が 読む）。paid：サービスに 払った 額（500 ごとに ＋1・1 日 ＋5 まで）
// ほかの 門番の ファイルは 読まない（lounge-stock.js の sale から 呼ぶ ため）
import { CO, GROUPS } from "./stocks.js";

export const GKEYS = ["sva", "harmonia", "tcu"];
export const TRADER_G = { hunter: "sva", anvil: "sva", doc: "harmonia", minerva: "harmonia", hanger: "tcu", mecha: "tcu" };   // ガラク・ヨルは 中立（どこも 動かさない）
export const GAFF = { min: -100, max: 100, primary: 3, random: 1, svcPer: 500, svcDay: 5, linkDay: 5, oppose: 0.5, hold: [[100, 1.25], [10, 1.1]] };
// 段（numbers 2 章）：値段・フリマの 枠（auction.js の affSlots）・Orbit Arena の ファイトマネー・ボーダーゾーンの サンプル
export const TIERS = [
  { at: 75, name: "盟友", price: -0.15, fight: 0.2, sample: 0.2 },
  { at: 50, name: "信頼", price: -0.1, fight: 0.1 },
  { at: 25, name: "なじみ", price: -0.05 },
  { at: 0, name: "ふつう", price: 0 },
  { at: -49, name: "冷たい", price: 0.1 },
  { at: -100, name: "敵対", price: 0.2 },
];
export const tierOf = (v) => { const x = Math.round(v); return TIERS.find((t) => x >= t.at) || TIERS[TIERS.length - 1]; };   // 段は 丸めた 値で（−0.5 は ふつう）
export const gaffOf = (rec) => { const F = (rec.gaff ||= {}); for (const g of GKEYS) if (!Number.isFinite(F[g])) F[g] = 0; return F; };
const r1 = (x) => Math.round(x * 10) / 10;
// その グループの 子会社の トークンを 合わせて 10 以上 ×1.1・100 以上 ×1.25
export const holdMult = (rec, g) => { const h = (rec.stock && rec.stock.h) || {}; let n = 0; for (const [co, k] of Object.entries(h)) if (CO[co] && CO[co].g === g && k > 0) n += k; return (GAFF.hold.find(([at]) => n >= at) || [0, 1])[1]; };
// 上げる：base × トークンの 倍率 だけ 上がり、ほかの 2 つは base × 0.5 ずつ 下がる。上がった 分を かえす
export function gaffAdd(rec, g, base) {
  if (!GKEYS.includes(g) || !(base > 0)) return 0;
  const F = gaffOf(rec), before = F[g];
  F[g] = Math.min(GAFF.max, r1(F[g] + base * holdMult(rec, g)));
  for (const o of GKEYS) if (o !== g) F[o] = Math.max(GAFF.min, r1(F[o] - base * GAFF.oppose));
  return r1(F[g] - before);
}
// サービスに 払った 額を ためる（lounge-stock.js の sale から）。n が 負：もどした 手数料（refundSale。もう 好感度に した 分は 借りに なり、つぎに 払った 額から 先に うめる）
export function gaffPaid(rec, co, n) {
  const g = CO[co] && CO[co].g;
  if (!GKEYS.includes(g) || !Number.isFinite(n) || !n) return;
  const P = ((rec.gaffPaid ||= { day: -1, n: {}, got: {} }).n);
  P[g] = (P[g] || 0) + n;
}
// ためた 額を 好感度に（500 ごとに ＋1・1 日 ＋5 まで。こえた 分は すてる）。上がった [グループ, 量] の 列を かえす
export function gaffSettle(rec, day) {
  const P = rec.gaffPaid; if (!P) return [];
  if (P.day !== day) { P.day = day; P.got = {}; }
  const out = [];
  for (const g of GKEYS) {
    const k = Math.floor((P.n[g] || 0) / GAFF.svcPer); if (k <= 0) continue;   // 借り（負）の ときは 上がらない
    P.n[g] -= k * GAFF.svcPer;
    const use = Math.min(k, GAFF.svcDay - (P.got[g] || 0)); if (use <= 0) continue;
    P.got[g] = (P.got[g] || 0) + use;
    out.push([g, gaffAdd(rec, g, use)]);
  }
  return out;
}
// 値段の 倍率（その グループの 店・サービス）
export const priceMult = (rec, g) => (GKEYS.includes(g) ? 1 + tierOf(gaffOf(rec)[g]).price : 1);
export const coMult = (rec, co) => priceMult(rec, CO[co] && CO[co].g);
export const tidMult = (rec, tid) => priceMult(rec, TRADER_G[tid]);
export const priced = (n, mult) => (n > 0 ? Math.max(1, Math.round(n * mult)) : 0);
// 画面に 渡す ようす
export const gaffView = (rec) => { const F = gaffOf(rec); return GKEYS.map((g) => { const v = F[g], t = tierOf(v); return { g, name: GROUPS[g].name, v: Math.round(v), tier: t.name, price: t.price, fight: t.fight || 0, sample: t.sample || 0, hold: holdMult(rec, g) }; }); };
