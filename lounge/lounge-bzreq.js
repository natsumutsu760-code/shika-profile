// ボーダーゾーンの サンプルの 依頼（2026-11-27 鹿さんの カード。docs/mono-link-border-zone.md「完成に 向けて」）
// 鹿さん「商人が求めてくるのでなく各企業、もしくはグループが求めてきます。」→「両方」→ 数と ごほうび「この案」
// - グループ（SVA・ハルモニア・TCU）が 2 つずつ：ボーダーゾーンの サンプルの タブ。ごほうびは 納める 値段の 1.5 倍の クレジット ＋ その グループの 好感度 ＋2（名物は ＋4）
// - 会社 12 社が 1 つずつ（名物か ★3 以上を 1 こ）：DEEP LINK/: の トークンの 会社の 欄。納める 値段の 2 倍 ＋ その 会社の グループの 好感度 ＋1（名物は ＋2）
// - 毎日 入れかわる（日本の 日付）。ボーダーゾーンが 開いた 人だけ。★を 決めた 依頼は 鑑定した サンプルだけ
// 〔C〕依頼の 中身の くじ：グループは 名物 40%・好みの 系統の サンプル 60%（★の しばり なし 40・★2 以上 40・★3 以上 20）。会社は 名物 50%・好みの 系統の ★3 以上 50%。人ごとに ちがう（id と 日付の 種）
// 好感度は gaffAdd（ほかの 2 つは 半分 下がる：グループの 好感度の 決まり）。会社の 依頼も その 会社の グループに 足す（2026-11-28 鹿さんの カード「いまの まま」。前は〔C〕）。納める 値段は samplePrice（鑑定して いない 物は ★1・盟友 ＋20%）
import { SAMPLES, LINE_BUYER, LINE_NAME, GROUP_NAME, samplePrice, bzIsleOk } from "./border.js";
import { orderSigned } from "./lounge-order.js";
import { CO } from "./stocks.js";
import { jstDay } from "./lounge-rules.js";
import { gaffAdd } from "./lounge-faction.js";
import { ensureBz, groupAff } from "./lounge-border.js";

export const BZ_REQ = { group: { n: 2, mult: 1.5, aff: 2, affLocal: 4 }, co: { mult: 2, aff: 1, affLocal: 2, star: 3 }, gLocal: 0.4, gStar: [[0, 40], [2, 40], [3, 20]], coLocal: 0.5 };
export const BZ_GROUPS = Object.keys(GROUP_NAME);
export const REQ_COS = Object.keys(CO).filter((c) => BZ_GROUPS.includes(CO[c].g));   // グループに 入って いる 会社（12 社）
const seedOf = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (s) => { let a = seedOf(s); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (R, xs) => xs[Math.floor(R() * xs.length)];
const pickW = (R, ws) => { const t = ws.reduce((a, [, w]) => a + w, 0); let x = R() * t; for (const [v, w] of ws) { x -= w; if (x < 0) return v; } return ws[ws.length - 1][0]; };
const localOf = (g) => Object.keys(SAMPLES).find((id) => SAMPLES[id].local === g);
const lineOf = (g) => Object.keys(SAMPLES).filter((id) => !SAMPLES[id].local && SAMPLES[id].line && LINE_BUYER[SAMPLES[id].line] === g);

// ボーダーゾーンが 開いた 人（誓約書に サイン・無線機 Lv2・工事の 鍵が ない）。locked：bzLocked の 答え
export const bzReqOpen = (rec, locked) => !locked && orderSigned(rec) && bzIsleOk(rec.hideout);
// その日の 依頼（人ごと）。key：g:グループ:番号 / c:会社
export function bzReqList(rec, now) {
  const day = jstDay(now), R = rngOf(`${rec.id || "x"}:bzreq:${day}`), out = [];
  for (const g of BZ_GROUPS) {
    const seen = new Set();
    for (let i = 0; i < BZ_REQ.group.n; i++) {
      let q = null;
      for (let t = 0; t < 8; t++) { const loc = R() < BZ_REQ.gLocal; q = loc ? { id: localOf(g), star: 0 } : { id: pick(R, lineOf(g)), star: pickW(R, BZ_REQ.gStar) }; if (!seen.has(q.id + q.star)) break; }
      seen.add(q.id + q.star); out.push({ key: `g:${g}:${i}`, kind: "g", who: g, g, ...q });
    }
  }
  for (const co of REQ_COS) { const g = CO[co].g, loc = R() < BZ_REQ.coLocal; out.push({ key: `c:${co}`, kind: "c", who: co, g, ...(loc ? { id: localOf(g), star: 0 } : { id: pick(R, lineOf(g)), star: BZ_REQ.co.star }) }); }
  return { day, list: out };
}
// 依頼に 合う サンプルか（★を 決めた 依頼は 鑑定して ★が とどく 物だけ）
export const fits = (q, s) => !!s && s.id === q.id && (!q.star || (s.known && s.star >= q.star));
export const reqPay = (rec, q, s) => { const P = q.kind === "g" ? BZ_REQ.group : BZ_REQ.co; return Math.round(samplePrice(s, q.g, groupAff(rec, q.g)) * P.mult); };
export const reqAff = (q) => { const P = q.kind === "g" ? BZ_REQ.group : BZ_REQ.co; return SAMPLES[q.id] && SAMPLES[q.id].local ? P.affLocal : P.aff; };
const doneOf = (rec, day) => { const Z = ensureBz(rec); if (!Z.req || Z.req.day !== day) Z.req = { day, done: [] }; return Z.req; };

// 画面に 渡す 形：依頼・済んだか・合う サンプル（高い 順に 3 つまで。ごほうびつき）
export function bzReqView(rec, now, open) {
  if (!open) return null;
  const { day, list } = bzReqList(rec, now), D = (rec.bz && rec.bz.req && rec.bz.req.day === day && rec.bz.req.done) || [], smp = (rec.bz && rec.bz.samples) || [];
  return list.map((q) => ({ ...q, name: SAMPLES[q.id].name, line: SAMPLES[q.id].local ? "名物" : LINE_NAME[SAMPLES[q.id].line], aff: reqAff(q), done: D.includes(q.key),
    cand: smp.filter((s) => fits(q, s)).map((s) => ({ uid: s.uid, star: s.star, known: !!s.known, pay: reqPay(rec, q, s) })).sort((a, b) => b.pay - a.pay).slice(0, 3) }));
}

// 納める（b：{ key, uid }）
export function bzReqDo(rec, b, now, open) {
  if (!open) return { ok: false, why: "ボーダーゾーンが 開いて から" };
  const { day, list } = bzReqList(rec, now), q = list.find((x) => x.key === b.key);
  if (!q) return { ok: false, why: "その 依頼は ない（日が かわった かも）" };
  const D = doneOf(rec, day); if (D.done.includes(q.key)) return { ok: false, why: "もう 納めた" };
  const Z = ensureBz(rec), s = Z.samples.find((x) => x.uid === b.uid);
  if (!s) return { ok: false, why: "サンプルを えらんで" };
  if (!fits(q, s)) return { ok: false, why: q.star && s.id === q.id && !s.known ? "鑑定して から（★を 決めた 依頼）" : "依頼に 合わない サンプル" };
  const pay = reqPay(rec, q, s), aff = gaffAdd(rec, q.g, reqAff(q));
  Z.samples = Z.samples.filter((x) => x !== s); rec.credits = (rec.credits || 0) + pay; D.done.push(q.key);
  return { ok: true, paid: pay, aff, g: q.g, key: q.key };
}
