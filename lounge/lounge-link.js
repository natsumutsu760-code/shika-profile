// LINKERS の 契約（2026-11-11 鹿さん「8つの仕組み＋石炭で精錬が早く終わる仕組みも作り実装してください。」。決まりは docs/mono-link-services-plan.md 6 章）
// 〔決〕Orbit Arena の 成績で 格付けし、上ほど 会社から よい 契約。契約した 会社の トークンは その 子の 勝ちで 上がる
// 〔C〕格付けが C から、会社が 3 つ 申しこむ（グループの 好感度が 高い 会社ほど 出やすい。申しこみは 週ごとに かわる）。1 社だけ・7 日
//      1 勝ごと（デュエル・大会の 1 試合）に 段の クレジット（C 5・B 10・A 20・S 40）＋ その グループの 好感度 ＋1（1 日 5 まで）＋ その 会社の 売り上げ 100
//      ファイトマネー（デュエルの ごほうび・大会の 賞金）は、契約した 会社の グループの 好感度の 段（信頼 ＋10%・盟友 ＋20%）と 家具（アーケード筐体 など）で 上がる
// 格付けの 点と 段は Market が 持つ（lounge-arena.js）。Orbit Arena を 開く・戦う たびに rec.arena.rate に 写す（主タスクの「上の 半分」などは これを 読む）
// rec.link = { co, at, until, wins, paid, gd: { day, n } }（契約中。終わったら null）
import { LINK, rng } from "./game.js";
import { STOCKS, CO } from "./stocks.js";
import { gaffOf, gaffAdd, tierOf, GAFF } from "./lounge-faction.js";
import { fxOf } from "./lounge-furn.js";
import { bump } from "./lounge-trade.js";
import { jstDay } from "./lounge-rules.js";
import { winSale } from "./lounge-stock.js";

export const LINK_CO = STOCKS.filter((c) => c.g !== "neutral").map((c) => c.co);   // 中立（ガラク・ノクス）は 契約を 出さない（好感度が ない ため）
const weekOf = (now) => Math.floor((now + 9 * 3600e3 + 3 * 864e5) / (7 * 864e5));
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rateOf = (rec) => (rec.arena && rec.arena.rate) || null;
export const rankNow = (rec) => (rateOf(rec) || {}).rank || "D";
export const canLink = (rec) => LINK.ranks.includes(rankNow(rec));
export function linkOf(rec, now) {
  const L = rec.link;
  if (L && !(L.until > now)) rec.link = null;
  return rec.link || null;
}
// 申しこみ（3 社）。同じ 週・同じ 人なら 同じ（何度 開いても かわらない）
export function linkOffers(rec, now) {
  if (!canLink(rec)) return [];
  const R = rng((hash(rec.id) ^ Math.imul(weekOf(now), 2654435761)) >>> 0), F = gaffOf(rec);
  const pool = LINK_CO.map((co) => ({ co, w: 1 + Math.max(0, F[CO[co].g] || 0) / 25 })), out = [];   // 好感度 ＋50 で 3 倍 出やすい
  while (out.length < LINK.offers && pool.length) {
    let x = R() * pool.reduce((a, p) => a + p.w, 0), i = 0;
    for (; i < pool.length - 1; i++) { x -= pool[i].w; if (x < 0) break; }
    out.push(pool.splice(i, 1)[0].co);
  }
  return out;
}
export function linkSign(rec, b, now = Date.now()) {
  if (linkOf(rec, now)) return { ok: false, why: "いまの 契約が 終わってから（1 社だけ）" };
  if (!canLink(rec)) return { ok: false, why: "格付けが C に なると 会社から 申しこみが 来る（Orbit Arena で 勝つ）" };
  const co = b && b.co;
  if (!linkOffers(rec, now).includes(co)) return { ok: false, why: "その 会社からの 申しこみは ない" };
  rec.link = { co, at: now, until: now + LINK.days * 864e5, wins: 0, paid: 0, gd: { day: -1, n: 0 } };
  bump(rec, { type: "link", n: 1, co }, jstDay(now));
  return { ok: true, co, until: rec.link.until };
}
// ファイトマネーの 上乗せ（0.2 なら ＋20%）
export function fightBonus(rec, now = Date.now()) {
  const L = linkOf(rec, now), g = L && CO[L.co] && CO[L.co].g;
  return Math.round(((g ? tierOf(gaffOf(rec)[g]).fight || 0 : 0) + fxOf(rec, "fight")) * 1000) / 1000;
}
// 契約中に k 回 勝った。払う 物を かえす（契約が なければ null）
export function linkWin(rec, k, now = Date.now()) {
  const L = linkOf(rec, now); if (!L || !(k > 0)) return null;
  const rank = rankNow(rec), per = LINK.pay[rank] || LINK.pay.C, pay = per * k, g = CO[L.co].g, day = jstDay(now);   // 契約中に 段が D に 下がっても C の 額（〔C〕）
  if (L.gd.day !== day) L.gd = { day, n: 0 };
  const use = Math.min(k, GAFF.linkDay - L.gd.n);
  let up = 0;
  if (use > 0) { L.gd.n += use; up = gaffAdd(rec, g, use); if (up > 0) bump(rec, { type: "gaff", n: up, g }, day); }
  rec.credits = (rec.credits || 0) + pay; L.wins += k; L.paid += pay;
  winSale(rec, L.co, LINK.token * k);
  return { co: L.co, wins: k, pay, gaff: up };
}
// 画面に 渡す ようす
export function linkView(rec, now = Date.now()) {
  const L = linkOf(rec, now), r = rateOf(rec);
  return { rate: r, link: L && { co: L.co, name: CO[L.co].name, until: L.until, wins: L.wins, paid: L.paid, per: LINK.pay[rankNow(rec)] || LINK.pay.C },
    offers: L ? [] : linkOffers(rec, now).map((co) => ({ co, name: CO[co].name, g: CO[co].g })), bonus: fightBonus(rec, now), pay: LINK.pay };
}
