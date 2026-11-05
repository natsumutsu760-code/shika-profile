// クローラー（先行体験版）の 進みを 門番に しまう。モデリングの M-018 → 鹿さんの カード「システム側に頼む」（2026-11-05）：
//   はじまりの サイン・クリアした ミッションが ブラウザの 中だけで、機械を 持ちかえると はじまりから やり直しに なって いた。どの 機械でも 同じ 進みに する
// 進みの 計算は ブラウザ（crawler.html の save）。門番は 形と 大きさを たしかめて しまう だけ
// （クローラーの クレジット・素材は クローラーの 中だけの 物で、ラウンジの 帳簿〈rec.credits・rec.own〉には さわらない）
// 受付：crawl.save {save, replace?}。記録：rec.crawl = { at, save }。me の 返事の crawl
export const CRAWL_MAX = 16000;   // しまえる 大きさ（JSON の 字数）
const ID = /^[a-z0-9]{1,16}$/;
export function crawlSave(rec, b, now = Date.now()) {
  const s = b && b.save;
  if (!s || typeof s !== "object" || Array.isArray(s)) return { ok: false, why: "進みの 形が ちがう" };
  let txt; try { txt = JSON.stringify(s); } catch (e) { return { ok: false, why: "進みの 形が ちがう" }; }
  if (!txt || txt.length > CRAWL_MAX) return { ok: false, why: "進みが 大きすぎる" };
  const save = JSON.parse(txt);   // 関数などは 落ちる（ただの データだけ）
  if (!Array.isArray(save.done) || !save.done.every((x) => typeof x === "string" && ID.test(x))) return { ok: false, why: "クリアの 記録の 形が ちがう" };
  // 別の 機械で 進めた 分を 消さない：クリアと サインは 門番に ある 物と まぜる（replace は「進みを 消す」〈?reset=1〉の とき だけ）
  const old = rec.crawl && rec.crawl.save;
  if (old && !b.replace) { save.done = [...new Set([...(old.done || []), ...save.done])]; if (old.signed && !save.signed) save.signed = old.signed; }
  rec.crawl = { at: now, save };
  return { ok: true, at: now, done: save.done.length };
}
export const crawlView = (rec) => (rec.crawl ? { at: rec.crawl.at, save: rec.crawl.save } : null);
