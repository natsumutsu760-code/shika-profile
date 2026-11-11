// 製材所（施設。2026-11-11 鹿さん「施設に製材所と畑で植林できるようにしてからこれらを実装したいです。」）
// カード：製材所「時間で 板と 薪」→ 薪は「工房のみ」「製材所は無し」＝ 製材所は 板だけ。薪は 工房の 加工（docs/mono-link-crafting.md）
// - 畑で 植えた 木（カシ・チャーギ・アカシア）の 原木を のこぎり台に 入れると、1 本ずつ 時間で 板が 2 枚 できる（工房の 炉と 同じ 形）
// - のこぎり台は 製材所 Lv1・20・50・80 で 1〜4 台。1 本の 時間 −0.5% / Lv・板が 1 枚 多く できる 確率 ＋1% / Lv（工房の 道具と 同じ 数え方）
// - 数は Claude の 案。画面は sawmill.html、門番は lounge-sawmill.js
export const SAW = [
  { id: "kashi_board", log: "kashi_log", out: 2, min: 20 },
  { id: "chaagi_board", log: "chaagi_log", out: 2, min: 40 },
  { id: "acacia_board", log: "acacia_log", out: 2, min: 60 },
];
export const SAW_MAX = 50;   // 1 つの 台に 1 回で 入れられる 原木の 本数
export const sawOf = (id) => SAW.find((r) => r.id === id) || null;
export const saws = (lv) => [1, 20, 50, 80].filter((x) => (lv || 0) >= x).length;   // のこぎり台の 数（段）
export const sawOff = (lv) => 0.005 * (lv || 0);                                   // 1 本の 時間 −0.5% / Lv（Lv100 で 半分）
export const sawMore = (lv) => 0.01 * (lv || 0);                                   // 1 本ごとに 板が 1 枚 多く できる 確率 ＋1% / Lv
export const sawMs = (r, lv) => Math.round(r.min * 60000 * (1 - sawOff(lv)));
// 台の ようす。f：{ id, n：のこりの 本数, at：いま 切って いる 1 本目を 入れた 時刻, ms：1 本の 時間 }。done：できた 本数・next：つぎの 1 本・end：ぜんぶ
export function sawDone(f, now) {
  const ms = f.ms || sawOf(f.id).min * 60000, done = Math.max(0, Math.min(f.n, Math.floor((now - f.at) / ms)));
  return { done, left: f.n - done, next: done < f.n ? f.at + (done + 1) * ms : 0, end: f.at + f.n * ms };
}
