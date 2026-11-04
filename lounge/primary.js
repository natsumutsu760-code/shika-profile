// 商人の 友好度（Lv100）と プライマリータスクの 章（鹿さんの 決め、2026-10-29・11-03。docs/mono-link-deeplink-story.md）
// 画面（deeplink.html）と 門番（lounge-trade.js）の 両方が 読む。タスクの 中身は primary-data.js（資料から 道具で 作る）
// - 友好度は 商人ごとに Lv100 まで。10 Lv ごとに 章。章の Lv（10・20…）では、その 章の プライマリーを ぜんぶ 終えないと 上がれない
// - 章は 島が ふえるのに 合わせて 足す。いまは 第 4 章まで（第 4 章を 終えると Lv50 で 止まる。第 5 章が 出たら 先へ）
// - まだ ない しくみを 使う タスク（sys）は 終えられない ので、その 章で 止まる。ほかの タスクは 先に 進められる（鹿さんの 決め「その 章で 止める」）
// 数は docs/mono-link-numbers.md の 案（Claude の 案。鹿さんの 決め「決まって いない 数は Claude の 案で 作る」、2026-11-03）
import { PRIMARY } from "./primary-data.js";
import { ISLAND_OPEN } from "./dungeons.js";
export { PRIMARY };
// 遊べる 章：出て いる 島の 数 ＋ 2（島 1 で 第 1〜3 章・ビサイ諸島で 第 4 章・ミカネル島で 第 5 章）。表に ある 先の 章は 島が 出るまで 出さない
export const CH_OPEN = ISLAND_OPEN + 2;

export const CH_LV = 10, LV_MAX = 100;
// 友好度の 点（docs/mono-link-numbers.md の 1 章の 案）：Lv L → L+1 に 20 ＋ 2 × L 点（Lv1〜10 の 合計 310・Lv1〜20 820・Lv1〜100 12,100）
export const repNeed = (L) => 20 + 2 * L;
export const repAt = (L) => 20 * (L - 1) + (L - 1) * L;   // Lv L に なる 点（Lv1〜L−1 の 合計）
export function lvOfPts(p) { let L = 1; while (L < LV_MAX && p >= repAt(L + 1)) L++; return L; }
export const PRI_REP = () => 30;   // プライマリータスク 1 つの 友好度（資料の 案：1 こ 30 点）

const bit = (no) => 1 << (no - 1);
export const isDone = (done, c, no) => !!(((done || {})[c] || 0) & bit(no));
export const chaptersOf = (tid) => (typeof tid === "string" && Object.prototype.hasOwnProperty.call(PRIMARY, tid) ? PRIMARY[tid].slice(0, CH_OPEN) : []);   // 自分の キーだけ（「__proto__」を 商人に しない）
// 章を ぜんぶ 終えたか（sys の タスクが あれば 終わらない）
export const chapterDone = (tid, done, c) => { const C = chaptersOf(tid)[c - 1]; return !!C && C.tasks.every((k) => isDone(done, c, k.no)); };
// 終えて いない いちばん 前の 章（ぜんぶ 終えて いれば 章の 数 ＋ 1）
export function curChapter(tid, done) { const n = chaptersOf(tid).length; for (let c = 1; c <= n; c++) if (!chapterDone(tid, done, c)) return c; return n + 1; }
// 友好度 Lv：点の Lv を 章の Lv で 止める
export const lvCap = (tid, done) => Math.min(LV_MAX, CH_LV * curChapter(tid, done));
export const lvOf = (tid, pts, done) => Math.min(lvOfPts(pts), lvCap(tid, done));
// 章が 開いて いるか：前の 章を ぜんぶ 終えて、Lv が 章の 1 つ 前の 節目（第 c 章は Lv 10 ×（c − 1））に 着いて いる
export const chapterOpen = (tid, done, c, lv) => c >= 1 && c <= chaptersOf(tid).length && (c === 1 || (chapterDone(tid, done, c - 1) && lv >= CH_LV * (c - 1)));
// いま やる タスク：開いた 章の うち 終えて いない いちばん 前の 章で、まだ ない しくみ（sys）を とばした 最初の 1 つ（物語は 一本道）
export function curTask(tid, done, lv) {
  const c = curChapter(tid, done); if (!chapterOpen(tid, done, c, lv)) return null;
  const k = chaptersOf(tid)[c - 1].tasks.find((x) => !x.sys && !isDone(done, c, x.no));
  return k ? { c, ...k } : null;
}
// 店の 品の 解放（その タスクを 終えると 買える）：品の id → [商人, 章, 番号]
export const UNLOCK_BY = {};
export const KEY_BY = {};   // かくしダンジョンの 鍵：行き先の id → [商人, 章, 番号]
for (const [tid, chs] of Object.entries(PRIMARY)) chs.forEach((C, i) => C.tasks.forEach((k) => { if (k.unlock) UNLOCK_BY[k.unlock] = [tid, i + 1, k.no]; if (k.key) KEY_BY[k.key] = [tid, i + 1, k.no]; }));
export const unlockedBy = (itemId, doneOf) => { const u = UNLOCK_BY[itemId]; return !u || isDone(doneOf(u[0]), u[1], u[2]); };
