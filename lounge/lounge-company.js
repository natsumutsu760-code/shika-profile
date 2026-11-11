// DEEP LINK/: の 会社の 窓口（顔の ない 子会社。2026-11-11 鹿さん「8つの仕組み＋石炭で精錬が早く終わる仕組みも作り実装してください。」）
// 決まりは docs/mono-link-services-plan.md（〔決〕16 回目：銀行は 預金だけ・採掘は 鉱石と 石材を 割高で 売る。数は Claude の 案）
// ・預金（SRN セレナ信託）：bank.put {n}・bank.take {n}・bank.int（たまった 利子を うけとる）。利子は 1 日 0.2%（毎晩 22:00 に たまる）・上限 100,000
// ・採掘の 店（DRN ドルン鉱業）：drn.buy {id, n}。1 日 各 50 こまで。鉱石は ダンジョンでは 出ない（坑道と ここだけ）
// ・注文の 掲示板（CLR クロロシス・バイオテック）：clr.give {i}。会社の 作物の 注文（1 日 3 件）に 届ける
import { bump } from "./lounge-trade.js";
import { putMats } from "./lounge-game.js";
import { sale } from "./lounge-stock.js";
import { jstDay } from "./lounge-rules.js";
import { MAT_NAME, DRN_SHOP } from "./game.js";   // DRN_SHOP：売る 物と 値段（lounge-proto/mine.js。手に入る 所の 窓も 読む）
import { coMult, priced } from "./lounge-faction.js";   // グループの 好感度で 割引・割増
import { roomFxAll, fxOf } from "./lounge-furn.js";   // 家具の 効果（金庫：利子 ＋1%）
import { FURN } from "./lounge-rules.js";
import { FURN_MAX, takeMats } from "./lounge-game.js";
import { CROPS, CROP, cropMarket } from "./crops.js";
import { rng } from "./game.js";

// ---------- 預金（セレナ信託・SRN・ハルモニア）----------
export const BANK = { rate: 0.002, cap: 100000, min: 100, hour: 22 };   // 100 以上 預けて いれば 1 日 少なくとも 1
const bankDay = (now) => Math.floor((now + (9 - BANK.hour) * 3600e3) / 864e5);   // 日本時間の 22:00 で 日が かわる
// boost：家具（金庫）の 上乗せ。端数も かえす（たまった 利子の 端数は 次へ 持ちこす。2026-11-11 診断：前は 1 日ごとに 切りすてて、預金 50,000 未満では 金庫の ＋1% が 0 だった）
export const interestOf = (bal, boost = 0) => (bal >= BANK.min ? Math.round(Math.max(1, bal * BANK.rate * (1 + boost)) * 1000) / 1000 : 0);
function bankOf(rec, now) {
  const B = (rec.bank ||= { bal: 0, acc: 0, d: null });
  const d = bankDay(now);
  if (B.d == null) B.d = d;
  const days = Math.min(365, Math.max(0, d - B.d));
  if (days) { B.acc = Math.round((B.acc + days * interestOf(B.bal, fxOf(rec, "interest"))) * 1000) / 1000; B.d = d; }
  return B;
}
const amount = (b) => (Number.isInteger(b && b.n) && b.n >= 1 ? b.n : 0);
export function bankPut(rec, b, now = Date.now()) {
  const B = bankOf(rec, now), n = amount(b);
  if (!n) return { ok: false, why: "預ける 額を 入れて" };
  if (B.bal + n > BANK.cap) return { ok: false, why: `預けられるのは ${BANK.cap.toLocaleString("ja-JP")} まで（あと ${(BANK.cap - B.bal).toLocaleString("ja-JP")}）` };
  if (n > (rec.credits || 0)) return { ok: false, why: "クレジットが 足りない" };
  rec.credits -= n; B.bal += n;
  bump(rec, { type: "deposit", n: 1 }, jstDay(now));
  return { ok: true, bal: B.bal };
}
export function bankTake(rec, b, now = Date.now()) {
  const B = bankOf(rec, now), n = amount(b);
  if (!n) return { ok: false, why: "引き出す 額を 入れて" };
  if (n > B.bal) return { ok: false, why: `預けて いるのは ${B.bal.toLocaleString("ja-JP")} だけ` };
  B.bal -= n; rec.credits = (rec.credits || 0) + n;
  return { ok: true, bal: B.bal };
}
export function bankInt(rec, b, now = Date.now()) {
  const B = bankOf(rec, now);
  const got = Math.floor(B.acc + 1e-9);
  if (!got) return { ok: false, why: "まだ 利子が ない（毎晩 22:00 に たまる）" };
  B.acc = Math.round((B.acc - got) * 1000) / 1000; rec.credits = (rec.credits || 0) + got;   // 1 に ならない 端数は のこす
  bump(rec, { type: "interest", n: 1 }, jstDay(now));
  return { ok: true, got };
}

// ---------- 採掘の 店（ドルン鉱業・DRN・SVA）----------
// 値段（1 こ。相場より 割高。坑道で 掘った 石を 売ると この 3 割）。石材は まだ ない 素材なので 小石と レンガ（坑道と 同じ あつかい）。表は lounge-proto/mine.js の DRN_SHOP（燃料も。2026-11-11）
export { DRN_SHOP };
export const DRN_DAY = 50;
const drnOf = (rec, now) => { const D = (rec.drn ||= { day: -1, got: {}, n: 0 }), day = jstDay(now); if (D.day !== day) { D.day = day; D.got = {}; } return D; };
export function drnBuy(rec, b, now = Date.now()) {
  const D = drnOf(rec, now), row = DRN_SHOP.find(([id]) => id === (b && b.id)), n = amount(b);
  if (!row) return { ok: false, why: "その 品は ない" };
  if (!n) return { ok: false, why: "買う 数を 入れて" };
  const left = DRN_DAY - (D.got[row[0]] || 0);
  if (n > left) return { ok: false, why: left ? `きょうは あと ${left} こまで` : "きょうは 売り切れ（あした もどる）" };
  const cost = priced(row[1], coMult(rec, "DRN")) * n;
  if (cost > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない（${cost.toLocaleString("ja-JP")} いる）` };
  rec.credits -= cost; D.got[row[0]] = (D.got[row[0]] || 0) + n; D.n += 1;
  const put = putMats(rec, [{ id: row[0], q: 0, n, b: 1 }], now);   // 買った 印（b）：商人の「拾った 物」の タスクには 数えない
  sale(rec, "DRN", cost);
  bump(rec, { type: "drnBuy", n: 1, mat: row[0] }, jstDay(now));
  return { ok: true, id: row[0], n, cost, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}

// ---------- リンデン家具工房（LDN・TCU）：効果の ある 新しい 家具を クレジットで 売る ----------
export const LDN_SHOP = FURN.filter((f) => f.ldn);
export function ldnBuy(rec, b, now = Date.now()) {
  const f = LDN_SHOP.find((x) => x.id === (b && b.id));
  if (!f) return { ok: false, why: "その 家具は ない" };
  const own = (rec.own.furniture ||= {});
  if ((own[f.id] || 0) >= FURN_MAX) return { ok: false, why: `もう 持てない（${FURN_MAX} こまで）` };
  const cost = priced(f.ldn, coMult(rec, "LDN"));
  if (cost > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない（${cost.toLocaleString("ja-JP")} いる）` };
  rec.credits -= cost; own[f.id] = (own[f.id] || 0) + 1;
  sale(rec, "LDN", cost);
  bump(rec, { type: "ldnBuy", n: 1, item: f.id }, jstDay(now));
  return { ok: true, id: f.id, cost };
}
// ---------- 注文の 掲示板（クロロシス・バイオテック・CLR・ハルモニア）：会社が 毎日 出す 作物の 注文 ----------
// 〔決〕2026-11-11 カード「CLRも毎日出す」：1 日 3 件・相場の 1.2 倍・その 島の 作物から。視聴者の 作物の 注文は「みんなの依頼」の まま（手数料は CLR の 売り上げ）
// 〔C〕1 件目は いつも 薬草（ウール先生 4-7「CLR の 掲示板で 薬草の 注文に 1 回 届ける」が 止まらない ため）。注文は 1 人 1 回ずつ 届けられる（ほかの 人と 取りあわない）
// 島：その 日 はじめて 見た ときの 島（無線機の Lv ＋ 1。日の 途中で 変わらない）。同じ 島の 人は 同じ 注文
export const CLR = { n: 3, mult: 1.2, first: "herb", seedN: [5, 10], crossN: [2, 4] };
const clrIsle = (rec) => Math.min(3, ((rec.hideout || {}).radio || 0) + 1);
export function clrOrders(isle, day) {
  const R = rng(((day * 2654435761) ^ (isle * 40503)) >>> 0);
  const nOf = (c) => { const [a, b] = c.kind === "seed" ? CLR.seedN : CLR.crossN; return a + Math.floor(R() * (b - a + 1)); };
  const pool = CROPS.filter((c) => c.isle === isle && (c.kind === "seed" || c.kind === "cross") && c.id !== CLR.first);
  const out = [CROP[CLR.first]];
  while (out.length < CLR.n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return out.map((c, i) => { const n = i === 0 ? CLR.seedN[0] : nOf(c); return { i, crop: c.id, mat: c.mat, name: c.name, n, pay: Math.ceil(cropMarket(c) * n * CLR.mult) }; });
}
const clrOf = (rec, now) => { const C = (rec.clr ||= { day: -1, isle: 1, done: [], n: 0 }), day = jstDay(now); if (C.day !== day) { C.day = day; C.isle = clrIsle(rec); C.done = []; } return C; };
const haveOf = (rec, id) => rec.own.mats.reduce((a, m) => a + (m.id === id ? m.n : 0), 0);
export function clrGive(rec, b, now = Date.now()) {
  const i = b && b.i, C = clrOf(rec, now);
  if (!Number.isInteger(i) || i < 0 || i >= CLR.n) return { ok: false, why: "その 注文は ない" };   // 番号は 0〜2 の 整数だけ（"length" などで 配列の 中身で ない 物を 引かない）
  const o = clrOrders(C.isle, C.day)[i];
  if (!o || typeof o.mat !== "string" || !(o.n > 0) || !(o.pay > 0)) return { ok: false, why: "その 注文は ない" };
  if (C.done.includes(o.i)) return { ok: false, why: "その 注文は もう 届けた（あした また 出る）" };
  const t = takeMats(rec, [[o.mat, o.n, 0]]);
  if (t.why) return { ok: false, why: t.why };
  rec.own.mats = t.mats; rec.credits = (Number.isFinite(rec.credits) ? rec.credits : 0) + o.pay; C.done.push(o.i); C.n += 1;
  bump(rec, { type: "order", n: 1, mat: o.mat }, C.day);
  return { ok: true, i: o.i, pay: o.pay };
}
// ---------- 画面に 渡す ようす ----------
export function deskView(rec, now = Date.now()) {
  const B = bankOf(rec, now), D = drnOf(rec, now), boost = fxOf(rec, "interest"), room = roomFxAll(rec);
  return {
    bank: { bal: B.bal, acc: Math.floor(B.acc + 1e-9), cap: BANK.cap, rate: BANK.rate * (1 + boost), next: Math.round(interestOf(B.bal, boost) * 10) / 10 },
    ldn: LDN_SHOP.map((f) => ({ id: f.id, name: f.name, price: priced(f.ldn, coMult(rec, "LDN")), have: (rec.own.furniture || {})[f.id] || 0 })),
    room: { fx: room.fx, syn: room.syn },   // いま 部屋で はたらいて いる 家具の 効果
    clr: (() => { const C = clrOf(rec, now); return clrOrders(C.isle, C.day).map((o) => ({ ...o, done: C.done.includes(o.i), have: haveOf(rec, o.mat) })); })(),
    drn: DRN_SHOP.map(([id, price]) => ({ id, name: MAT_NAME[id] || id, price: priced(price, coMult(rec, "DRN")), left: DRN_DAY - (D.got[id] || 0) })),
  };
}
