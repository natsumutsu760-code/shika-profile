// 坑道（鹿さんの頼み、2026-10-25。スターデューバレーの ように）。数は すべて 案
// 坑道：パーティに いない なかま（となりの 部屋の 子）が 掘る。鉱石と ガラクタの 素材が 時間で たまる（12 時間で いっぱい）
// 記録：rec.mine = { on: [{ uid, at }], pickaxe?, lamp? }
// 前は 隠れ家の 畑も ここに あったが、2026-11-03 に 消して 新しい 農園（farm-core.js・garden.html）に まとめた（鹿さんの 決め）。スプリンクラーと 肥料も そちら
const H = 3600 * 1000;
export const DIG_MORE = [0, 0, 0, 1, 2];   // 地下の 拡張の Lv で ふえる 坑道の 枠

// ---------- 坑道 ----------
// 掘れる 物（坑道の Lv ごとの 重み）。鉱石と ガラクタ
// 石炭・銅・銀・金の 鉱石は 鹿さんの 決め（2026-10-31。docs/mono-link-crafting.md）：Lv1 石炭・銅・鉄 → Lv2 銀 少し → Lv3 銀 ふえる → Lv4 金 少し。工房の 炉で 延べ棒に する
// 石炭は 延べ棒 1 本に 1〜2 こ いるので、鉱石 3 こに 1 こ くらい 出る ように
export const MINE_FIND = {
  1: { pebble: 24, brick: 20, oldnail: 20, ironore: 18, copperore: 12, coal: 12 },
  2: { pebble: 16, brick: 14, oldnail: 14, ironore: 16, copperore: 10, coal: 12, candle: 8, oldcloth: 8, crystalbit: 6, silverore: 4 },
  3: { brick: 10, oldnail: 10, ironore: 18, copperore: 8, coal: 14, candle: 6, oldcloth: 6, crystalbit: 14, glowstone: 14, silverore: 10, rainbowcrystal: 1 },
  4: { ironore: 14, copperore: 6, coal: 14, silverore: 10, goldore: 5, crystalbit: 10, glowstone: 10, capestone: 12, bluestone: 10, obsidian: 10, thunderstone: 8, rainbowcrystal: 1 },   // ニライ諸島の 石も
};
export const MINE_SLOTS = [0, 1, 2, 3, 4];   // 坑道の Lv ごとの 掘る 子の 数。地下の 拡張 Lv3・Lv4 で ＋1 ずつ
export const mineSlots = (mineLv, digLv) => (mineLv ? MINE_SLOTS[mineLv] + (DIG_MORE[digLv] || 0) : 0);
export const MINE_CAP_H = 12;   // 12 時間 ぶんで いっぱい（うけとるまで 止まる）
export const mineRate = (lv) => 2 + Math.floor((lv || 1) / 10);   // 1 時間に 掘る 数（Lv1〜9 は 2・Lv10 から 3・Lv20 から 4…）
// 掘れた 数（時間 ぶん。いっぱいまで）
export const mineHours = (at, now) => Math.max(0, Math.min(MINE_CAP_H, Math.floor((now - at) / H)));
// つるはし・ランプ（鹿さんの 決め、2026-10-31）：使うと 12 時間。つるはし＝掘る 数 ×1.3（2026-10-31 に ×1.5 から 下げた。12 時間ごとに 使えば ずっと 効く ため）・ランプ＝銀鉱石と 金鉱石が 2 倍 出やすい（数は Claude の 案）。続けて 使うと 12 時間 のびる
// lv：使える 坑道の Lv（ランプは 銀鉱石が 出る Lv2 から。Lv1 で 使っても 何も かわらない ため）
export const MINE_BOOST = { pickaxe: { h: 12, more: 0.3, lv: 1 }, lamp: { h: 12, rare: 2, lv: 2 } };
// 効いて いた 時間（掘った 時間 [a, b] と 使った 時間 [{ from, to }] の 重なり。時間）と、掘れた 数（つるはしの 分も。門番と 画面で 同じ 計算）
export const boostH = (list, a, b) => (Array.isArray(list) ? list.reduce((s, x) => s + Math.max(0, Math.min(b, x.to) - Math.max(a, x.from)), 0) / H : 0);
export const mineCount = (h, rate, at, pick) => h * rate + Math.floor(boostH(pick, at, at + h * H) * rate * MINE_BOOST.pickaxe.more);
export function mineDig(R, mineLv, n, lamp = false) {
  const base = MINE_FIND[Math.max(1, Math.min(4, mineLv))], out = {};
  const w = lamp ? Object.fromEntries(Object.entries(base).map(([k, v]) => [k, /^(silverore|goldore)$/.test(k) ? v * MINE_BOOST.lamp.rare : v])) : base;
  for (let i = 0; i < n; i++) { const id = pickId(R, w); out[id] = (out[id] || 0) + 1; }
  return Object.entries(out).map(([id, k]) => ({ id, q: 0, n: k }));
}
function pickId(R, w) { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return k; return Object.keys(w)[0]; }
