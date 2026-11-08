// 農業の 畑の 決まり（大工事。docs/mono-link-farm.md・docs/mono-link-numbers.md の 7。数は すべて 案）
// 作物の 中身は crops.js だけを 見る。作物を 足しても ここは 直さない
// 前の 隠れ家の 畑（施設の 畑）は 2026-11-03 に 消して、ここに まとめた（鹿さんの 決め。スプリンクラーと 肥料も ここ）
// 時間は ms。くじは R（0〜1 を 返す 関数）。ここの 関数は 記録を 読むか、渡された field だけを 書きかえる
//
// 畑の 記録：field = { lv, xp, soil, cells: [cell | null] × 36, tick }（cells は いちばん 広い 6×6 の 並びで 覚える。マス i は 横 i % 6・縦 i / 6。
//   畑が 広がっても 植えた 物の 場所は ずれない。使えるのは 左上の fieldSize(lv) の 中だけ）
//   cell = { id: 作物, at: 植えた（生まれた）時, cross?: true, fert?: 肥料 } ／ かわった 物は { obj: 素材, taps: のこり } ／ スプリンクラーは { spr: しゅるい }
import { CROP, KIND, afterOf, crossOf } from "./crops.js";

const H = 3600 * 1000;

// ---------- 畑の 広さと 農業の Lv ----------
// 農業の Lv ごとの 広さ [横, 縦]。Lv30 の 6×6 で 止まる
export const FIELD = [[1, 3, 3], [5, 3, 4], [10, 4, 4], [15, 4, 5], [20, 5, 5], [25, 5, 6], [30, 6, 6]];
export const fieldSize = (lv) => { let s = FIELD[0]; for (const f of FIELD) if (lv >= f[0]) s = f; return [s[1], s[2]]; };
export const W = 6;   // 覚える 並びの 横（いちばん 広い 畑）
export const inField = (lv, i) => { const [w, h] = fieldSize(lv); return i >= 0 && i % W < w && Math.floor(i / W) < h; };
export const MAX_LV = 100;
export const xpNext = (lv) => Math.round(10 * lv ** 1.1);   // 次の Lv まで
// 経験：収穫 1 マス ＝ 1 ＋ 育つ 時間 ÷ 2・新しい 品種 50・注文に 届ける 10・金色 20・虹色 100
export const XP = { harvest: (c) => 1 + c.h / 2, discover: 50, order: 10, gold: 20, rainbow: 100 };
// Lv31 から：品質の ボーナス（Lv100 で ＋1）・かけ合わせの 確率（Lv100 で 1.5 倍）
const over30 = (lv) => Math.max(0, Math.min(1, (lv - 30) / 70));
export const qualityBonus = (lv) => over30(lv);
export const crossLvMult = (lv) => 1 + 0.5 * over30(lv);
export function addXp(field, n) {
  field.xp = (field.xp || 0) + n; const ups = [];
  while (field.lv < MAX_LV && field.xp >= xpNext(field.lv)) { field.xp -= xpNext(field.lv); field.lv++; ups.push(field.lv); }
  return ups;
}

// ---------- 土 ----------
// 畑 全体に 1 つ。speed：育つ 速さ・cross：かけ合わせ・grace：実ってからの 猶予・color：色ちがい・get：とれる 数（足す）
// byIsle：作物の 島ごとの 効き（島が ふえたら 土も 足せる）
export const SOILS = {
  normal: { name: "ふつうの土", price: 0 },
  leaf: { name: "腐葉土", price: 200, speed: 1.25, cross: 0.75 },
  clay: { name: "粘土", price: 200, speed: 0.8, cross: 1.25, grace: 1.5 },
  sand: { name: "砂地", price: 300, color: 2, get: -1 },
  ash: { name: "火山灰の土", price: 800, lv: 30, isle: 2, byIsle: { 1: { speed: 0.8 }, 2: { speed: 1.25, cross: 1.5 } } },
};
export const SOIL_LOCK_H = 6;   // かえたら 6 時間は かえられない
const soilFx = (soil, crop) => {
  const s = SOILS[soil] || SOILS.normal, b = (s.byIsle && s.byIsle[crop.isle]) || {};
  return { speed: (s.speed || 1) * (b.speed || 1), cross: (s.cross || 1) * (b.cross || 1), grace: s.grace || 1, color: s.color || 1, get: s.get || 0 };
};

// ---------- 育ち ----------
// 芽（〜4 割）→ 若葉 → 実り（育つ 時間）→ 猶予（12 時間）が すぎると 放っておいた あと（かわる・枯れる・逃げる）
export const STAGES = ["sprout", "young", "ripe", "over"];
export const SPROUT_END = 0.4, GRACE_H = 12;
// 肥料（工房で 作る。植える ときに 1 マス 1 こ まく。docs/mono-link-crafting.md）：育つ 時間 ×0.7。上の 肥料は 品質も スプリンクラー 1 段ぶん 上がる
export const FERT = { fert: { speed: 0.7, q: 0 }, fert2: { speed: 0.7, q: 1 } };
export const growMs = (crop, soil, fert) => ((crop.h * H) / soilFx(soil, crop).speed) * ((FERT[fert] || {}).speed || 1);
export const graceMs = (crop, soil) => GRACE_H * H * soilFx(soil, crop).grace;
// そのマスの いま → { stage, p（0〜1 の 育ち）, left（次の 段まで ms）}
export function stageAt(cell, now, soil) {
  const c = CROP[cell.id], g = growMs(c, soil, cell.fert), t = now - cell.at;
  if (t < g * SPROUT_END) return { stage: "sprout", p: t / g, left: g * SPROUT_END - t };
  if (t < g) return { stage: "young", p: t / g, left: g - t };
  if (t < g + graceMs(c, soil)) return { stage: "ripe", p: 1, left: g + graceMs(c, soil) - t };
  return { stage: "over", p: 1, left: 0 };
}

// ---------- 時間の 肥料（CLR が 売る。クレジットで 買って その場で 畑 ぜんぶに まく。持ち物には 入らない）----------
// 2026-11-08 鹿さん「クレジットで買える植えた全作物を成長させる肥料を実装してください。」→ カード「農園で買ってすぐまく」・
//   「使える回数上限なし。一回1,3,5,10時間スキップできる物をそれぞれ見合う価格設定にお願いします。」・値段は「畑の中身で決まる」
// 芽と 若葉の 作物が、それぞれ N 時間ぶん 育つ（実る 所で 止まる。実って いる 物・放っておいた あと・かわった 物・スプリンクラーは そのまま）
// 値段：進む ぶんの 作物を CLR に 売った 額の ならし（品質・金色と 虹色の くじも 入れる）× 1.5。上限なしでも「買う → とる → 売る」で もうからない
export const GROW_H = [1, 3, 5, 10];
export const GROW_MULT = 1.5, GROW_MIN = 10;
// その マスを とった ときの CLR の 買い取りの ならし（sell：素材 1 この 売値。materials.js の sellPrice を 渡す。ここは 素材の 表を 読まない）
export function harvestWorth(field, i, sell) {
  const cell = field.cells[i], c = cell && CROP[cell.id]; if (!c) return 0;
  const fx = soilFx(field.soil, c), span = c.get[1] - c.get[0] + 1, one = (q) => sell({ id: c.mat, q, n: 1 });
  let n = 0; for (let k = c.get[0]; k <= c.get[1]; k++) n += Math.max(1, k + fx.get) / span;   // とれる 数（harvest と 同じ：1 こは かならず）
  const pr = COLOR_RATE.rainbow * fx.color, pg = COLOR_RATE.gold * fx.color, up = qualityBonus(field.lv);
  const qw = SPR_Q[Math.min(3, sprTier(field, i) + ((FERT[cell.fert] || {}).q || 0))], tot = Object.values(qw).reduce((a, b) => a + b, 0);
  let plain = 0; for (const [q, w] of Object.entries(qw)) plain += (w / tot) * ((1 - up) * one(+q) + up * one(Math.min(5, +q + 1)));
  return n * ((1 - pr - pg) * plain + pg * one(4) + pr * one(5));
}
// N 時間で どの マスが どれだけ 育つか → [{ i, adv（進む ms）, frac（育つ 時間の うち 進む 割合）, ripe（これで 実る）}]
export function growPlan(field, now, hours) {
  const out = [], cap = hours * H;
  field.cells.forEach((cell, i) => {
    if (!cell || !cell.id || !CROP[cell.id] || !inField(field.lv, i)) return;
    const st = stageAt(cell, now, field.soil); if (st.stage !== "sprout" && st.stage !== "young") return;
    const g = growMs(CROP[cell.id], field.soil, cell.fert), rest = g - (now - cell.at), adv = Math.min(cap, rest);
    if (adv > 0) out.push({ i, adv, frac: adv / g, ripe: adv >= rest });
  });
  return out;
}
// 値段（クレジット。10 きざみで 上げる）。育つ 作物が なければ 0（買えない）
export function growPrice(field, now, hours, sell) {
  const plan = growPlan(field, now, hours); if (!plan.length) return 0;
  const v = plan.reduce((a, p) => a + p.frac * harvestWorth(field, p.i, sell), 0) * GROW_MULT;
  return Math.max(GROW_MIN, Math.ceil(v / 10) * 10);
}
// まく：植えた 時を 前へ ずらす（育ちは 植えた 時からの 時間で 決まる）→ 育った マスの 数
export function growApply(field, now, hours) {
  const plan = growPlan(field, now, hours); for (const p of plan) field.cells[p.i].at -= p.adv;
  return plan;
}

// ---------- かけ合わせ ----------
// となりあう（上下左右と ななめ）2 つの 作物が どちらも 実って いると、その 両方に となりあう あいた マスに、1 時間ごとに 芽が 出る ことが ある
export const CROSS_BASE = 0.05;
export const crossChance = (child, soil, lv) => CROSS_BASE * KIND[child.kind].cross * soilFx(soil, child).cross * crossLvMult(lv) * (child.soil && child.soil === soil ? 2 : 1);
const near = (w, h, i) => { const x = i % W, y = Math.floor(i / W), out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * W + nx); } return out; };
// あいた マス i に 生まれうる 作物（親の 組ごと）→ [{ child, a, b }]
export function crossCandidates(field, i, now) {
  const [w, h] = fieldSize(field.lv), ripe = near(w, h, i).filter((j) => field.cells[j] && field.cells[j].id && stageAt(field.cells[j], now, field.soil).stage === "ripe"), out = [];
  for (let x = 0; x < ripe.length; x++) for (let y = x + 1; y < ripe.length; y++) {
    if (!near(w, h, ripe[x]).includes(ripe[y])) continue;   // 親どうしも となりあう
    const child = crossOf(field.cells[ripe[x]].id, field.cells[ripe[y]].id); if (child) out.push({ child, a: ripe[x], b: ripe[y] });
  }
  return out;
}
// 1 時間 進める（あいた マスごとに、生まれうる 作物を 1 つずつ くじ）→ 生まれた [{ i, id }]
export function crossHour(field, now, R, known) {
  const born = [];
  field.cells.forEach((cell, i) => {
    if (cell || !inField(field.lv, i)) return;
    for (const { child } of crossCandidates(field, i, now)) {
      if (R() < crossChance(child, field.soil, field.lv)) { field.cells[i] = { id: child.id, at: now, cross: true }; born.push({ i, id: child.id, isNew: known ? !known.has(child.id) : false }); break; }
    }
  });
  return born;
}
// 前に 進めた 時（field.tick）から now まで、1 時間ずつ かけ合わせを 進める（記録を 開いた ときに 呼ぶ）
export function advance(field, now, R, known) {
  const born = []; field.tick ??= now;
  while (field.tick + H <= now) { field.tick += H; born.push(...crossHour(field, field.tick, R, known)); }
  return born;
}

// ---------- 植える・とる ----------
export function plant(field, i, id, now, fert) {
  if (!CROP[id]) return { ok: false, why: "その 作物は ない" };
  if (!inField(field.lv, i)) return { ok: false, why: "畑の 外" };
  if (field.cells[i]) return { ok: false, why: "あいて いない" };
  if (fert != null && !FERT[fert]) return { ok: false, why: "その 肥料は ない" };
  field.cells[i] = { id, at: now, ...(fert ? { fert } : {}) }; return { ok: true };
}

// ---------- スプリンクラー（鹿さんの 決め 2026-11-03：マスに 置く）----------
// 置いた マスには 植えられない（かけ合わせの あき マスにも ならない）。まわりの 作物の 品質が 上がる
// ふつう：上下左右 4 マス・上：まわり 8 マス・星：まわり 8 マス（品質 いちばん 上）。2 つ とどく マスは 上の 段が きく
export const SPRINKLERS = { sprinkler: { tier: 1, reach: 4 }, sprinkler2: { tier: 2, reach: 8 }, sprinkler3: { tier: 3, reach: 8 } };
export const sprReach = (field, i) => { const [w, h] = fieldSize(field.lv), x = i % W, y = Math.floor(i / W), k = SPRINKLERS[(field.cells[i] || {}).spr]; return k ? near(w, h, i).filter((j) => k.reach === 8 || j % W === x || Math.floor(j / W) === y) : []; };
// マス i に きく スプリンクラーの 段（0 は なし）
export function sprTier(field, i) {
  const [w, h] = fieldSize(field.lv); let t = 0;
  for (const j of near(w, h, i)) { const c = field.cells[j], k = c && SPRINKLERS[c.spr]; if (k && k.tier > t && sprReach(field, j).includes(i)) t = k.tier; }
  return t;
}
export function placeSpr(field, i, kind) {
  if (!SPRINKLERS[kind]) return { ok: false, why: "その スプリンクラーは ない" };
  if (!inField(field.lv, i)) return { ok: false, why: "畑の 外" };
  if (field.cells[i]) return { ok: false, why: "あいて いない" };
  field.cells[i] = { spr: kind }; return { ok: true };
}
export function takeSpr(field, i) {
  const c = field.cells[i]; if (!c || !c.spr) return { ok: false, why: "スプリンクラーは ない" };
  field.cells[i] = null; return { ok: true, kind: c.spr };
}
// 品質：ふだん 1〜2。スプリンクラーの 段（＋上の 肥料で 1 段）で 上がる。Lv31 から 1 つ 上がる ことが ある（Lv100 で かならず）
export const BASE_Q = { 1: 70, 2: 30 };
export const SPR_Q = [BASE_Q, { 2: 60, 3: 40 }, { 3: 60, 4: 40 }, { 4: 55, 5: 45 }];   // 段ごと（前の 畑と 同じ 数）
export const COLOR_RATE = { gold: 0.02, rainbow: 0.002 };   // 金色は 品質 4、虹色は 品質 5 と 同じ
const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// マス i を とる → { ok, items: [{ id, q, n, color }], xp, why }。実りなら 作物、かわった 物は たたく（のこりが 0 で とれる）、枯れた・逃げた 物は 片づける
export function harvest(field, i, now, R) {
  const cell = field.cells[i]; if (!cell) return { ok: false, why: "何も ない" };
  if (cell.spr) return { ok: false, why: "スプリンクラーは「はずす」で" };
  if (cell.obj) { cell.taps--; if (cell.taps > 0) return { ok: true, items: [], left: cell.taps }; field.cells[i] = null; return { ok: true, items: [{ id: cell.obj, q: 0, n: 1 }], xp: 1 }; }
  const c = CROP[cell.id], st = stageAt(cell, now, field.soil);
  if (st.stage === "sprout" || st.stage === "young") return { ok: false, why: "まだ 実って いない" };
  if (st.stage === "over") {
    const a = afterOf(c);
    if (a.kind === "turn") { field.cells[i] = { obj: a.into, taps: a.taps }; return harvest(field, i, now, R); }
    field.cells[i] = null; return { ok: true, items: [], gone: a.kind };   // 枯れた（wither）・逃げた（flee）
  }
  const fx = soilFx(field.soil, c), n = Math.max(1, c.get[0] + Math.floor(R() * (c.get[1] - c.get[0] + 1)) + fx.get);
  const x = R(), color = x < COLOR_RATE.rainbow * fx.color ? "rainbow" : x < (COLOR_RATE.rainbow + COLOR_RATE.gold) * fx.color ? "gold" : null;
  const out = {}, qw = SPR_Q[Math.min(3, sprTier(field, i) + ((FERT[cell.fert] || {}).q || 0))];
  for (let k = 0; k < n; k++) { const q = color === "rainbow" ? 5 : color === "gold" ? 4 : Math.min(5, pickW(R, qw) + (R() < qualityBonus(field.lv) ? 1 : 0)); out[q] = (out[q] || 0) + 1; }
  field.cells[i] = null;
  return { ok: true, items: Object.entries(out).map(([q, k]) => ({ id: c.mat, q: +q, n: k, color })), xp: XP.harvest(c) + (color ? XP[color] : 0), color };
}
// 土を かえる
export function setSoil(field, soil, now) {
  const s = SOILS[soil]; if (!s) return { ok: false, why: "その 土は ない" };
  if (s.lv && field.lv < s.lv) return { ok: false, why: `農業の Lv ${s.lv} から` };
  if (field.soilAt && now - field.soilAt < SOIL_LOCK_H * H) return { ok: false, why: `かえて ${SOIL_LOCK_H} 時間は かえられない` };
  field.soil = soil; field.soilAt = now; return { ok: true };
}
export const newField = (now) => ({ lv: 1, xp: 0, soil: "normal", cells: Array(W * W).fill(null), tick: now });
