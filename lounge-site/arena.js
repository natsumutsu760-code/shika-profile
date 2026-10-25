// 闘技場（鹿さんの頼み、2026-10-25。プライベートラウンジの PVP）。数は すべて 案
// デュエル：いない 相手の「いまの 強さ」と 戦う（相手の ペットの 記録から その場で 組み立てる）。負けても 何も へらない
// トーナメント：毎日 22:00（日本時間）。その日の 22:00 まで 参加を 受けつけ、6 人 そろえば ひらく（32 人まで）
// 戦いは ペット 1 匹 どうしの 1 対 1（配信の バトルと 同じ。battle-sim.js の simulate・弱い 方に「がんばり」）
import { rng } from "./battle-sim.js";

// ---------- デュエル ----------
export const DUEL = { perDay: 20, paidPerDay: 5 };   // 1 日に 挑める 数・ごほうびが もらえる 勝ちの 数（同じ 相手からは 1 日 1 回）
// ごほうび（クレジット中心。鹿さんの決め）：相手の 強さ ÷ 自分の 強さ で きまる
export const DUEL_PAY = [
  { at: 1.5, credits: 1000, res: 1, label: "かなり格上" },
  { at: 1.2, credits: 600, res: 0, label: "格上" },
  { at: 0, credits: 300, res: 0, label: "" },
];
export const duelPay = (myP, foeP) => DUEL_PAY.find((x) => foeP / Math.max(1, myP) >= x.at);
// 相手の 3 つの 枠（格下・同じくらい・格上）
export const TIERS = [["down", "格下"], ["even", "同じくらい"], ["up", "格上"]];
export const tierOf = (myP, foeP) => { const r = foeP / Math.max(1, myP); return r < 0.92 ? "down" : r <= 1.12 ? "even" : "up"; };
// 名簿（list：{ id, power, … }）から 枠ごとに 1 人ずつ。その 枠に いなければ、のこりから 強さの 近い 人
export function pickFoes(list, myId, myP, R) {
  const pool = list.filter((c) => c.id !== myId && c.power > 0), out = [], used = new Set();
  for (const [t] of TIERS) {
    const g = pool.filter((c) => tierOf(myP, c.power) === t && !used.has(c.id));
    if (g.length) { const c = g[Math.floor(R() * g.length)]; used.add(c.id); out.push(c); }
  }
  const near = pool.filter((c) => !used.has(c.id)).sort((a, b) => Math.abs(a.power / myP - 1) - Math.abs(b.power / myP - 1));
  while (out.length < 3 && near.length) { const c = near.shift(); used.add(c.id); out.push(c); }
  return out.sort((a, b) => a.power - b.power);
}

// ---------- トーナメント ----------
export const TOUR = { min: 6, max: 32, hour: 22 };
// ごほうび（参加は 無料。鹿さんの決め）。4：ベスト 4（準決勝で 負けた 2 人）
export const TOUR_PAY = { 1: { credits: 5000, res: 3 }, 2: { credits: 2500, res: 1 }, 4: { credits: 1000, res: 0 }, all: { credits: 200, res: 0 } };
const JST = 9 * 3600e3;
const ymd = (ms) => new Date(ms + JST).toISOString().slice(0, 10);
// 参加が 入る 大会の 日（日本時間で 22:00 より 前なら きょう、あとなら あした）
export const tourDay = (now) => { const d = new Date(now + JST); return d.getUTCHours() < TOUR.hour ? ymd(now) : ymd(now + 864e5); };
export const tourAt = (day) => Date.parse(day + "T00:00:00Z") - JST + TOUR.hour * 3600e3;   // その 日の 22:00（日本時間）
// 組み合わせ：くじで ならべ、2 の 累乗に なるまで 不戦勝（null）を 入れる。不戦勝は 上の 方に かたよらない ように 1 つおき
export function bracketOf(ids, seed) {
  const R = rng(seed), a = [...ids];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  let size = 2; while (size < a.length) size *= 2;
  const byes = size - a.length, slots = [];
  for (let i = 0, k = 0; i < size / 2; i++) { const x = a[k++] ?? null, y = i < byes ? null : a[k++] ?? null; slots.push([x, y]); }
  return slots.map(([x, y]) => ({ a: x, b: y }));
}
// 何回戦か の 名前（のこり 人数で）
export const roundName = (n) => (n === 2 ? "決勝" : n === 4 ? "準決勝" : n === 8 ? "準々決勝" : `${n / 2} 試合`);
// 配信の 帯に 流す 試合：ベスト 8 から（鹿さんの決め、2026-10-25。最大 7 試合・1 試合 30 秒ほど）。不戦勝は 出さない
// a・b は rounds の まま（id）。no：その 回戦の 何試合目か（1 試合だけの 回戦は 0）・next：勝った 方が 進む 回戦
export const TOUR_BAND = 8;
export function bandMatches(rounds) {
  const out = [];
  (rounds || []).forEach((R, r) => {
    const n = R.length * 2; if (n > TOUR_BAND) return;
    const real = R.filter((m) => m.a != null && m.b != null);
    real.forEach((m, k) => out.push({ a: m.a, b: m.b, seed: m.seed, r, label: roundName(n), no: real.length > 1 ? k + 1 : 0, next: n > 2 ? roundName(n / 2) : "", final: n === 2 }));
  });
  return out;
}
// 試合の 種（大会の 日・回戦・番号から 決まる。あとから 見る ときも 同じ 戦いに なる）
export const matchSeed = (day, r, m) => { let h = 2166136261; for (const ch of `${day}:${r}:${m}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------- 派遣先の 戦い（⑤。鹿さんの頼み、2026-10-25） ----------
// 同じ 行き先に 出かけて いる ほかの 人の ペットと、出発の ときに たまに 出会って 戦う（ペット どうしの 1 対 1）
// 時間は かからず、勝っても 負けても 探索は そのまま。ふたりとも リソースを 少し、勝った 方は クレジットも。配信中なら オーバーレイの 帯で その場で 戦う
export const ENC = { chance: 0.3, perDay: 3, res: 1, winCredits: 300 };   // 出会う 確率・1 日に 出会える 回数（ごほうびも この 回数まで）・ふたりの リソース・勝った 方の クレジット
