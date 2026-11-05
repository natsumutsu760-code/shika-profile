// 両替（玉・クレジット。鹿さんの決め、2026-10-25。2026-10-28 の 決めで やめた ── 玉と クレジットは 鹿物語の !貸し玉・!換金 だけ。下の cashDo）
// - 玉 ⇄ クレジット：1 対 1。手数料 1 割（10 の 倍数で わたす）
// - アメジストは ここでは 買えない・売れない（鹿さんの決め、2026-10-28「MONO LINK でクレジットで買うのはやめる」。買うのは 鹿物語の
//   !アメジスト交換〈玉 500 → 1〉だけ。前は ここで 玉か クレジット 5,000 で 買えた。2026-10-26 から 売れない）
// 玉は 帳簿（viewer.js の charge）で 動かす。クレジットは 記録の 中（take で 引き、払えなかったら refund で もどす）
import { sale } from "./lounge-stock.js";   // 株：!換金・!貸し玉の 量は ノクス仲介（ヨル）の 売り上げ（鹿さんの 決め「換金の 量で 株が 動く」）
export const AME_PRICE = 500, SWAP_FEE = 0.1;   // AME_PRICE：鹿物語の !アメジスト交換の 値段（案内の 字だけ）
export const CUR = ["balls", "credits"];
export const SWAP_MAX = { coin: 1000000 };   // 1 回に わたせる 玉・クレジット

// わたす 物・もらう 物（n は わたす 数）
export function swapQuote(from, to, n) {
  if (!CUR.includes(from) || !CUR.includes(to) || from === to || !Number.isInteger(n) || n < 1) return null;
  if (n % 10 || n > SWAP_MAX.coin) return null;
  return { give: n, get: Math.floor(n * (1 - SWAP_FEE)) };
}

// 計画（charge に わたす 形）。b：{ from, to, n }
// 2026-10-28 の 決め「MONO LINK の 両替の 画面では 玉を 扱わない」：玉と クレジットは 鹿物語の チャット（!貸し玉・!換金）だけ。ここは ことわる
export const SWAP_OPEN = false;
export function swapPlan(rec, b) {
  if (!SWAP_OPEN) return { ok: false, why: "玉と クレジットは ここでは 両替できない（配信の チャットで !貸し玉・!換金）" };
  const from = String(b.from), to = String(b.to), q = swapQuote(from, to, b.n);
  if (!q) return { ok: false, why: from === "res" || to === "res" ? `アメジストは 両替では 買えない（配信の チャットで !アメジスト交換：玉 ${AME_PRICE} → 1）` : "10 の 倍数で、100 万まで" };
  if (from === "credits" && rec.credits < q.give) return { ok: false, why: `足りない：クレジット あと ${(q.give - rec.credits).toLocaleString("ja-JP")}` };
  const costs = [], take = [], grant = {}, refund = {};
  if (from === "credits") { take.push(() => { rec.credits -= q.give; }); refund.credits = q.give; }
  else costs.push({ kind: from, d: -q.give });
  if (to === "credits") grant.credits = q.get;
  else costs.push({ kind: to, d: q.get });
  return { costs, why: `swap:${from}>${to}`, take: () => take.forEach((f) => f()), grant, refund: refund.credits ? refund : null, info: { give: q.give, get: q.get, from, to } };
}

// ---------- 鹿物語の チャットの !換金・!貸し玉（2026-10-28 の 決め。docs/mono-link-economy.md）----------
// 換金：玉 28 → 100 クレジット（非等価。借りて すぐ 換金すると 1 割ほど 損）・貸し玉：4 クレジット → 玉 1
// 流れ：鹿物語が 玉を 先に 引く（換金）か 待つ（貸し玉）→ オーバーレイ → 部屋の 門番（Lounge の { t: "cash" }）→ ここ。答えで 鹿物語が 玉を 決める
// 同じ 頼み（mid）は 何回 来ても 同じ 答え（rec.cash.done に のこす。返事が とどかなくて やりなおしても 2 重に しない）
// open：MONO LINK の 公開（クレジットを みんな 0 に した あと）まで false。前に 換金すると 公開の ときに 消えて しまう ため（Claude の 案。開けるのは 鹿さんの OK）
export const CASH = { open: false, perBalls: 28, credits: 100, lend: 4, max: 1000000, keep: 200 };
export function cashDo(rec, b, open = CASH.open) {
  const mid = typeof b.mid === "string" && b.mid.length >= 1 && b.mid.length <= 100 ? b.mid : "";
  if (!mid) return { ok: false, why: "こわれた 頼み" };
  rec.cash ||= { done: {}, order: [] };
  if (Object.prototype.hasOwnProperty.call(rec.cash.done, mid)) return { ...rec.cash.done[mid], again: true };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= CASH.max ? b.n : 0;
  let r;
  if (!open) r = { ok: false, why: "MONO LINK の 公開の あとで 使える" };
  else if (b.kind === "cash") {
    const u = Math.floor(n / CASH.perBalls);
    if (u < 1) r = { ok: false, why: `換金は 玉 ${CASH.perBalls} こから（${CASH.perBalls} 玉 → ${CASH.credits} クレジット）` };
    else { rec.credits = (rec.credits || 0) + u * CASH.credits; sale(rec, "NOX", u * CASH.credits); r = { ok: true, kind: "cash", balls: u * CASH.perBalls, credits: u * CASH.credits }; }
  } else if (b.kind === "lend") {
    const cost = n * CASH.lend;
    if (!n) r = { ok: false, why: "借りる 玉の 数を 入れて" };
    else if (cost > (rec.credits || 0)) r = { ok: false, why: `クレジットが 足りない：あと ${(cost - (rec.credits || 0)).toLocaleString("ja-JP")}（玉 1 こ ${CASH.lend} クレジット）` };
    else { rec.credits -= cost; sale(rec, "NOX", cost); r = { ok: true, kind: "lend", balls: n, credits: cost }; }
  } else r = { ok: false, why: "こわれた 頼み" };
  rec.cash.done[mid] = r; rec.cash.order.push(mid);
  while (rec.cash.order.length > CASH.keep) delete rec.cash.done[rec.cash.order.shift()];
  return { ...r, save: true };
}
