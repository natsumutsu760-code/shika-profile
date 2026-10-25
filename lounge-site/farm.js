// 畑と 坑道（鹿さんの頼み、2026-10-25。スターデューバレーの ように）。数は すべて 案
// 畑：植物の 素材を 1 こ 植えると、時間が たつと 何こかに なって とれる。スプリンクラーを 置いた 列は 品質が 上がる（品質が 高いと 高く 売れる）
// 坑道：パーティに いない なかま（となりの 部屋の 子）が 掘る。鉱石と ガラクタの 素材が 時間で たまる（12 時間で いっぱい）
// 記録：rec.farm = { plots: [{ id, at } | null], spr: [null | "sprinkler" | "sprinkler2" | "sprinkler3"] }・rec.mine = { on: [{ uid, at }] }
const H = 3600 * 1000;

// ---------- 畑 ----------
// 植えられる 作物（植物の 採取の 素材）。h：育つ 時間（時間）、get：とれる 数
export const CROPS = [
  { id: "herb", h: 2, get: [3, 5] },
  { id: "straw", h: 2, get: [4, 6] },
  { id: "berry", h: 3, get: [3, 4] },
  { id: "sleepmoss", h: 4, get: [3, 4] },
  { id: "nightbloom", h: 6, get: [2, 3] },
  { id: "clover", h: 12, get: [1, 2] },   // かくし通路の レア
];
export const cropOf = (id) => CROPS.find((c) => c.id === id) || null;
export const ROW = 4;   // 1 列の マス。スプリンクラーは 1 列に 1 つ
// 畑の Lv ごとの マス・育つ 時間の 倍率。地下の 拡張 Lv3 で もう 1 列
export const FARM = { plots: [0, 4, 8, 12], speed: [1, 1, 0.8, 0.65] };
export const plotCount = (farmLv, digLv) => (farmLv ? FARM.plots[farmLv] + (digLv >= 3 ? ROW : 0) : 0);
export const growMs = (crop, farmLv) => Math.round(crop.h * H * (FARM.speed[farmLv] || 1));
// 品質の くじ（スプリンクラー なし・ふつう・上・星）
export const SPRINKLERS = ["sprinkler", "sprinkler2", "sprinkler3"];
export const CROP_Q = { none: { 1: 70, 2: 30 }, sprinkler: { 2: 60, 3: 40 }, sprinkler2: { 3: 60, 4: 40 }, sprinkler3: { 4: 55, 5: 45 } };
const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// とれた 物（1 マス）。R：くじ
export function harvestPlot(R, crop, spr) {
  const n = crop.get[0] + Math.floor(R() * (crop.get[1] - crop.get[0] + 1)), out = {};
  for (let i = 0; i < n; i++) { const q = pickW(R, CROP_Q[spr || "none"]); out[q] = (out[q] || 0) + 1; }
  return Object.entries(out).map(([q, k]) => ({ id: crop.id, q: +q, n: k }));
}

// ---------- 坑道 ----------
// 掘れる 物（坑道の Lv ごとの 重み）。鉱石と ガラクタ
export const MINE_FIND = {
  1: { pebble: 30, brick: 25, oldnail: 25, ironore: 20 },
  2: { pebble: 20, brick: 18, oldnail: 18, ironore: 18, candle: 10, oldcloth: 10, crystalbit: 6 },
  3: { brick: 12, oldnail: 14, ironore: 22, candle: 8, oldcloth: 8, crystalbit: 16, glowstone: 16, rainbowcrystal: 1 },
};
export const MINE_SLOTS = [0, 1, 2, 3];   // 坑道の Lv ごとの 掘る 子の 数。地下の 拡張 Lv3 で ＋1
export const mineSlots = (mineLv, digLv) => (mineLv ? MINE_SLOTS[mineLv] + (digLv >= 3 ? 1 : 0) : 0);
export const MINE_CAP_H = 12;   // 12 時間 ぶんで いっぱい（うけとるまで 止まる）
export const mineRate = (lv) => 2 + Math.floor((lv || 1) / 10);   // 1 時間に 掘る 数（Lv1〜9 は 2・Lv10 から 3・Lv20 から 4…）
// 掘れた 数（時間 ぶん。いっぱいまで）
export const mineHours = (at, now) => Math.max(0, Math.min(MINE_CAP_H, Math.floor((now - at) / H)));
export function mineDig(R, mineLv, n) {
  const w = MINE_FIND[Math.max(1, Math.min(3, mineLv))], out = {};
  for (let i = 0; i < n; i++) { const id = pickId(R, w); out[id] = (out[id] || 0) + 1; }
  return Object.entries(out).map(([id, k]) => ({ id, q: 0, n: k }));
}
function pickId(R, w) { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return k; return Object.keys(w)[0]; }
