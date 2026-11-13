// クローラー（先行体験版）の 進みを 門番に しまう。モデリングの M-018 → 鹿さんの カード「システム側に頼む」（2026-11-05）：
//   はじまりの サイン・クリアした ミッションが ブラウザの 中だけで、機械を 持ちかえると はじまりから やり直しに なって いた。どの 機械でも 同じ 進みに する
// 進みの 計算は ブラウザ（crawler.html の save）。門番は 形と 大きさを たしかめて しまう だけ
// （クローラーの クレジット・素材は クローラーの 中だけの 物で、ラウンジの 帳簿〈rec.credits・rec.own〉には さわらない）
// 受付：crawl.save {save, replace?}。記録：rec.crawl = { at, save, paid〈本編の ペットに 入れた 経験値の 合計〉, bucket〈ふえ方の 上限の ため〉 }。me の 返事の crawl
import { levelUp } from "./lounge-game.js";
import { clampTo } from "./lounge-border.js";
// 帯の 補正（2026-11-13 鹿さんの カード「① 帯の 補正」。M-031。資料 mono-link-crawler-missions.md「適正レベルへの 補正は 強い 方だけ 下げる」・第 1 章は Lv 50〜）
//   帯より Lv の 高い 本編の ペットは、ボーダーゾーンと 同じ そろえ方（clampTo：ステータスを 帯の Lv の 強さに。装備と スキルツリーは そのまま。鹿さんの 決め）
//   Lv も 帯の Lv に する（傭兵の Lv〈9 割〉と 表示の ため）。帯より 低い ペットは null（その まま 使う）
//   f は 本編の 戦いの 形（fighterOf。me の 返事の build を そのまま 使い、2 回 作らない）
export const CRAWL_BAND = 50;
export const bandOf = (f, band = CRAWL_BAND) => (f && f.lv > band ? { ...clampTo(f, band), lv: band } : null);
export const CRAWL_MAX = 16000;   // しまえる 大きさ（JSON の 字数）
// クローラーの 経験値を 本編の ペットへ（2026-11-13 鹿さんの カード「② 経験値を 本編へ」。M-031）
//   ブラウザの 進みの 経験値（save.exp。ふえて いく 合計）の ふえた 分を、本編の ペット（rec.pets[0]）に 入れる
//   書きかえて 送られても 育ちすぎない ように、1 分に CRAWL_EXP.rate まで（ためて おけるのは cap まで。こえた 分は 次の 保存へ 持ちこす）。数は Claude の 案（〔C〕）
//   第 1 章の 敵（Lv 50）1 体 15・1 回の ミッションで 400〜500 くらい（10 分 前後）→ 1 分 60 なら ふつうに 遊ぶ 分は ぜんぶ 入る
//   はじめて この しくみに 会った ときは、それまでの 分は 入れない（数え はじめ）
//   合計が 前より 小さい（2 台を 同時に 開いて 古い 方が 送った）ときは 何も しない。数え なおすのは 進みを 消した（replace）とき だけ（同じ 分を 2 回 入れない）
//   本編の ペットが いない あいだの 分は 払いずみに する（あとで ペットを 持った ときに まとめて 流れこまない）
export const CRAWL_EXP = { rate: 60, cap: 3600 };
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
  const prev = rec.crawl || {}, got = expToPet(rec, prev, save, now, !!b.replace);
  rec.crawl = { at: now, save, paid: got.paid, bucket: got.bucket };
  return { ok: true, at: now, done: save.done.length, ...(got.exp ? { exp: got.exp, lv: got.lv, up: got.up } : {}) };
}
function expToPet(rec, prev, save, now, replace) {
  const total = Math.max(0, Math.floor(+save.exp || 0)), pet = (rec.pets || [])[0];
  if (prev.paid == null || replace || !(pet && pet.type)) return { paid: total, bucket: prev.bucket || { n: 0, at: now }, exp: 0 };   // 数え はじめ・進みを 消した・ペットが いない
  const b = prev.bucket || { n: 0, at: now }, n = Math.min(CRAWL_EXP.cap, b.n + (Math.max(0, now - b.at) / 60000) * CRAWL_EXP.rate);
  const give = Math.floor(Math.min(Math.max(0, total - prev.paid), n));
  if (!give) return { paid: prev.paid, bucket: { n, at: now }, exp: 0 };
  const up = levelUp(pet, give);
  return { paid: prev.paid + give, bucket: { n: n - give, at: now }, exp: give, lv: pet.lv, up };
}
export const crawlView = (rec) => (rec.crawl ? { at: rec.crawl.at, save: rec.crawl.save } : null);
