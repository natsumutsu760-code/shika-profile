// 坑道（鹿さんの頼み、2026-10-25。スターデューバレーの ように）。数は すべて 案
// 坑道：パーティに いない なかま（となりの 部屋の 子）が 掘る。鉱石と ガラクタの 素材が 時間で たまる（12 時間で いっぱい）
// 記録：rec.mine = { on: [{ uid, at }], pickaxe?, lamp? }
// 前は 隠れ家の 畑も ここに あったが、2026-11-03 に 消して 新しい 農園（farm-core.js・garden.html）に まとめた（鹿さんの 決め）。スプリンクラーと 肥料も そちら
const H = 3600 * 1000;
// 施設の 作り直し（鹿さんの 決め、2026-11-03「施設から」。数は docs/mono-link-numbers.md の 4 章）：坑道は Lv1〜100。地下の 拡張は なくした
//   掘る 子の 数は 段（Lv1・20・50・80 で 1〜4 体）・1 時間に 2 ＋ Lv / 25 こ（1 体ごと）・掘れる 物は Lv で ふえる

// ---------- 坑道 ----------
// 掘れる 物（その Lv から 足す 重み）。資料：Lv1 小石・レンガ・釘・石炭（石材は まだ ない 素材なので 小石と レンガ）、Lv10 銅鉱石、Lv25 鉄鉱石、Lv45 銀鉱石、Lv60 ときどき 虹水晶、Lv70 金鉱石、Lv85 島 2 の 石
// Lv20 の ろうそく・布・水晶のかけら・Lv50 の 光る石は 前の 坑道 Lv2・Lv3 の 物（Claude の 案で のこした）
export const MINE_ADD = [
  [1, { pebble: 24, brick: 20, oldnail: 20, coal: 14 }], [10, { copperore: 12 }], [20, { candle: 8, oldcloth: 8, crystalbit: 6 }], [25, { ironore: 18 }],
  [40, { crude_oil: 8 }],   // 原油（2026-11-11 鹿さん「…薪、石油、原油を実装してください。」→ カード「1と2」：坑道 Lv40 から）
  [45, { silverore: 6 }], [50, { glowstone: 12, silverore: 4 }], [60, { rainbowcrystal: 1 }], [70, { goldore: 5 }], [85, { capestone: 12, bluestone: 10, obsidian: 10, thunderstone: 8 }],
];
// ドルン鉱業（DEEP LINK/: の 会社の 窓口）で 売る 物と 値段（1 こ）。門番は lounge-company.js の drnBuy・画面は 手に入る 所（mat-pop.js）も 読む
//   燃料は 2026-11-11（カード「1と2」：薪・原油・石油も 店で 買える。石油は 原油 2 こ ＝ 40 より 少し 高い）
export const DRN_SHOP = [["pebble", 10], ["brick", 10], ["firewood", 10], ["coal", 15], ["crude_oil", 20], ["petroleum", 50], ["copperore", 20], ["ironore", 30], ["silverore", 80], ["goldore", 200]];
export function mineFind(lv) { const w = {}; for (const [at, add] of MINE_ADD) if ((lv || 0) >= at) for (const [k, v] of Object.entries(add)) w[k] = (w[k] || 0) + v; return w; }
const BAND_AT = [1, 20, 50, 80];   // facilities.js の 段と 同じ
export const mineSlots = (mineLv) => BAND_AT.filter((x) => (mineLv || 0) >= x).length;   // 掘る 子の 数（1〜4）
export const mineRate = (mineLv) => (mineLv ? 2 + mineLv / 25 : 0);                         // 1 時間に 掘る 数（1 体ごと。Lv100 で 6）
export const MINE_CAP_H = 12;   // 12 時間 ぶんで いっぱい（うけとるまで 止まる）
// 掘れた 数（時間 ぶん。いっぱいまで）
export const mineHours = (at, now) => Math.max(0, Math.min(MINE_CAP_H, Math.floor((now - at) / H)));
// つるはし・ランプ（鹿さんの 決め、2026-10-31）：使うと 12 時間。つるはし＝掘る 数 ×1.3（2026-10-31 に ×1.5 から 下げた。12 時間ごとに 使えば ずっと 効く ため）・ランプ＝銀鉱石と 金鉱石が 2 倍 出やすい（数は Claude の 案）。続けて 使うと 12 時間 のびる
// lv：使える 坑道の Lv（ランプは 銀鉱石が 出る Lv2 から。Lv1 で 使っても 何も かわらない ため）
export const MINE_BOOST = { pickaxe: { h: 12, more: 0.3, lv: 1 }, lamp: { h: 12, rare: 2, lv: 45 } };   // ランプは 銀鉱石が 出る Lv45 から
// 効いて いた 時間（掘った 時間 [a, b] と 使った 時間 [{ from, to }] の 重なり。時間）と、掘れた 数（つるはしの 分も。門番と 画面で 同じ 計算）
export const boostH = (list, a, b) => (Array.isArray(list) ? list.reduce((s, x) => s + Math.max(0, Math.min(b, x.to) - Math.max(a, x.from)), 0) / H : 0);
// fr：前に うけとった ときの 端数（子ごとに 持ちこす。2026-11-11 窓口 #11 おたこまるさん「つまみでレベルを変更した場合つるはしが作用しませんでした」）
//   前は ふつうの 分と つるはしの 分を べつべつに 切りすてて いて、1 時間に 3.33 こ より 少ない（坑道 Lv33 まで・つまみを 下げた とき）と、1 時間ごとに うけとると つるはしの 分が 0 だった
export const mineExact = (h, rate, at, pick, fr = 0) => h * rate + boostH(pick, at, at + h * H) * rate * MINE_BOOST.pickaxe.more + (Number.isFinite(fr) && fr > 0 && fr < 1 ? fr : 0);
export const mineCount = (h, rate, at, pick, fr = 0) => Math.floor(mineExact(h, rate, at, pick, fr) + 1e-9);
export function mineDig(R, mineLv, n, lamp = false) {
  const base = mineFind(mineLv), out = {};
  const w = lamp ? Object.fromEntries(Object.entries(base).map(([k, v]) => [k, /^(silverore|goldore)$/.test(k) ? v * MINE_BOOST.lamp.rare : v])) : base;
  for (let i = 0; i < n; i++) { const id = pickId(R, w); out[id] = (out[id] || 0) + 1; }
  return Object.entries(out).map(([id, k]) => ({ id, q: 0, n: k }));
}
function pickId(R, w) { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return k; return Object.keys(w)[0]; }
