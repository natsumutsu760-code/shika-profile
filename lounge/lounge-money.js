// 両替（玉・クレジット・リソース。鹿さんの決め、2026-10-25）
// - 玉 ⇄ クレジット：1 対 1。手数料 1 割（10 の 倍数で わたす）
// - リソース：1 を 玉 5,000 か クレジット 5,000 で 買う。売ると 玉 2,000 か クレジット 2,000（レートは かなり 高く）
// 玉と リソースは 帳簿（viewer.js の charge）で 動かす。クレジットは 記録の 中（take で 引き、払えなかったら refund で もどす）
export const RES_BUY = 5000, RES_SELL = 2000, SWAP_FEE = 0.1;
export const CUR = ["balls", "credits", "res"];
export const SWAP_MAX = { coin: 1000000, res: 100 };   // 1 回に わたせる 玉・クレジット、1 回に 買う・売る リソース

// わたす 物・もらう 物（n の 意味：玉 ⇄ クレジットは わたす 数、リソースが からむ ときは リソースの 数）
export function swapQuote(from, to, n) {
  if (!CUR.includes(from) || !CUR.includes(to) || from === to || !Number.isInteger(n) || n < 1) return null;
  if (from !== "res" && to !== "res") {
    if (n % 10 || n > SWAP_MAX.coin) return null;
    return { give: n, get: Math.floor(n * (1 - SWAP_FEE)) };
  }
  if (n > SWAP_MAX.res) return null;
  return to === "res" ? { give: n * RES_BUY, get: n } : { give: n, get: n * RES_SELL };
}

// 計画（charge に わたす 形）。b：{ from, to, n }
export function swapPlan(rec, b) {
  const from = String(b.from), to = String(b.to), q = swapQuote(from, to, b.n);
  if (!q) return { ok: false, why: from !== "res" && to !== "res" ? "10 の 倍数で、100 万まで" : "リソースは 1〜100 こ" };
  if (from === "credits" && rec.credits < q.give) return { ok: false, why: `足りない：クレジット あと ${(q.give - rec.credits).toLocaleString("ja-JP")}` };
  const costs = [], take = [], grant = {}, refund = {};
  if (from === "credits") { take.push(() => { rec.credits -= q.give; }); refund.credits = q.give; }
  else costs.push({ kind: from, d: -q.give });
  if (to === "credits") grant.credits = q.get;
  else costs.push({ kind: to, d: q.get });
  return { costs, why: `swap:${from}>${to}`, take: () => take.forEach((f) => f()), grant, refund: refund.credits ? refund : null, info: { give: q.give, get: q.get, from, to } };
}
