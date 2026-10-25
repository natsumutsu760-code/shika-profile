// 作業台のレシピ（鹿さんの決め、2026-10-22）。数はすべて案。画面の見本はまだ
// 作る：装備ごとに 決まった レシピ（採取の素材 2 種類 ＋ 敵の素材 1 種類 ＋ 玉）。レシピは その素材を ぜんぶ 1 回 拾うと 出てくる（ヴェルヴェットの「開発」と同じ）
// ★は いつも くじ（品質は 関係ない。宝箱と同じく 表で 決まる。表は 作業台の Lv で かわる）
// OP は ★の数だけ くじ。レシピの 敵の素材ごとに 付きやすい OP がある（くじの 重さ ×8）
// 合成：ヴェルヴェット（白騎士物語）の形。もとの装備 ＋ 決まった もう 1 つの装備 ＋ 素材 ＋ 玉 → 名前のちがう 上の装備（equip.js の UPPER）
//   ★と OP は くじ（もとの装備の ★・OP は のこらない）。ボスの素材の レシピは 25% で とくべつな効果。前の「★上げ（同じ★を 3 つ）」は やめた
// 形の レシピ（tier が ある 物。鹿さんの決め、2026-10-25）：新しい 部位の 形を 作る。素材と 色は くじ（その tier の 素材）。base は 見本に 出す 1 つ
import { OPS, baseOf, comboOf, comboId, pickMat, opCount, COLS } from "./equip.js";

// 敵の素材 → 付きやすい OP（ボスの素材は ★3 から付く とくべつな OP）
export const MAT_OP = {
  hare_horn: "agi", goblin_knife: "crit", kobold_fur: "def", old_score: "mp", crown_shard: "firstStrike",
  golem_stone: "dmgCut", ghost_cloth: "evade", mimic_tooth: "drain", dream_feather: "healUp", sleep_hourglass: "mpRegen",
  wolf_fang: "critDmg", shadow_shard: "itazuraDmg", poison_vial: "wazaDmg", light_drop: "int", midnight_bell: "focusStart",
  crystal_scale: "res", bat_wing: "dex", slime_core: "hp", rainbow_shell: "statusRes", dragon_crystal: "endure",
};
export const OP_BIAS = 8;

// 作る：mats は [素材の id, 数]（さいごの 1 つが 敵の素材）
export const CRAFT = [
  { base: "helmet", mats: [["pebble", 4], ["straw", 3], ["kobold_fur", 1]], balls: 150 },
  { base: "knit", mats: [["oldcloth", 4], ["sleepmoss", 3], ["ghost_cloth", 1]], balls: 200 },
  { base: "straw", mats: [["straw", 5], ["herb", 2], ["hare_horn", 1]], balls: 120 },
  { base: "nabe", mats: [["ironore", 4], ["oldnail", 3], ["golem_stone", 1]], balls: 250 },
  { base: "bowtie", mats: [["oldcloth", 3], ["berry", 3], ["slime_core", 1]], balls: 220 },
  { base: "omamori", mats: [["stardust", 3], ["herb", 3], ["old_score", 1]], balls: 180 },
  { base: "bib", mats: [["oldcloth", 3], ["wellwater", 3], ["mimic_tooth", 1]], balls: 200 },
  { base: "gold", mats: [["glowstone", 3], ["crystalbit", 3], ["bat_wing", 1]], balls: 300 },
  { base: "stick", mats: [["straw", 3], ["pebble", 3], ["goblin_knife", 1]], balls: 100 },
  { base: "pikopiko", mats: [["oldnail", 3], ["candle", 2], ["wolf_fang", 1]], balls: 220 },
  { base: "mizudeppo", mats: [["wellwater", 4], ["sleepmoss", 2], ["light_drop", 1]], balls: 220 },
  { base: "kamifusen", mats: [["stardust", 3], ["deepwater", 3], ["crystal_scale", 1]], balls: 300 },
  // 形の レシピ（うで・あし・オフハンド・アクセサリー と、あたま・くびの 新しい 形）
  { base: "glove.cloth.0", tier: 0, mats: [["herb", 3], ["straw", 3], ["hare_horn", 1]], balls: 120 },
  { base: "socks.cloth.0", tier: 0, mats: [["berry", 3], ["straw", 3], ["kobold_fur", 1]], balls: 120 },
  { base: "brooch.cloth.0", tier: 0, mats: [["pebble", 4], ["berry", 2], ["old_score", 1]], balls: 150 },
  { base: "hood.cloth.0", tier: 0, mats: [["herb", 3], ["pebble", 2], ["kobold_fur", 1]], balls: 150 },
  { base: "band.leather.0", tier: 1, mats: [["oldcloth", 3], ["sleepmoss", 2], ["ghost_cloth", 1]], balls: 200 },
  { base: "sneakers.leather.0", tier: 1, mats: [["brick", 3], ["oldcloth", 3], ["golem_stone", 1]], balls: 220 },
  { base: "scarf.leather.0", tier: 1, mats: [["oldcloth", 4], ["stardust", 2], ["dream_feather", 1]], balls: 200 },
  { base: "book.leather.0", tier: 1, mats: [["stardust", 3], ["sleepmoss", 3], ["mimic_tooth", 1]], balls: 220 },
  { base: "gauntlet.iron.0", tier: 2, mats: [["oldnail", 4], ["candle", 2], ["wolf_fang", 1]], balls: 260 },
  { base: "boots.iron.0", tier: 2, mats: [["wellwater", 3], ["oldnail", 3], ["poison_vial", 1]], balls: 250 },
  { base: "lantern.iron.0", tier: 2, mats: [["candle", 3], ["nightbloom", 3], ["light_drop", 1]], balls: 260 },
  { base: "ring.iron.0", tier: 2, mats: [["nightbloom", 3], ["wellwater", 2], ["shadow_shard", 1]], balls: 250 },
  { base: "bangle.crystal.0", tier: 3, mats: [["crystalbit", 3], ["glowstone", 2], ["crystal_scale", 1]], balls: 300 },
  { base: "geta.crystal.0", tier: 3, mats: [["ironore", 3], ["deepwater", 3], ["rainbow_shell", 1]], balls: 300 },
  { base: "fan.crystal.0", tier: 3, mats: [["deepwater", 3], ["crystalbit", 3], ["bat_wing", 1]], balls: 300 },
  { base: "keychain.crystal.0", tier: 3, mats: [["glowstone", 3], ["ironore", 2], ["slime_core", 1]], balls: 300 },
];
// 合成：main ＋ sub（どちらも 装備。★は なんでも）＋ mats ＋ 玉 → out。boss は ボスの素材の レシピ
export const SYNTH = [
  { out: "stonehelm", main: "helmet", sub: "nabe", mats: [["golem_stone", 3]], balls: 800 },
  { out: "ghosthood", main: "knit", sub: "omamori", mats: [["ghost_cloth", 3], ["shadow_shard", 1]], balls: 900 },
  { out: "kingstraw", main: "straw", sub: "gold", mats: [["crown_shard", 1]], balls: 1500, boss: true },
  { out: "crystalnabe", main: "nabe", sub: "helmet", mats: [["crystal_scale", 3], ["ironore", 4]], balls: 1200 },
  { out: "fangchoker", main: "bowtie", sub: "pikopiko", mats: [["wolf_fang", 3]], balls: 1000 },
  { out: "dreamcharm", main: "omamori", sub: "knit", mats: [["dream_feather", 2]], balls: 900 },
  { out: "sleepbib", main: "bib", sub: "bowtie", mats: [["sleep_hourglass", 1]], balls: 1500, boss: true },
  { out: "nightgold", main: "gold", sub: "bib", mats: [["midnight_bell", 1]], balls: 1500, boss: true },
  { out: "goblinclub", main: "stick", sub: "pikopiko", mats: [["goblin_knife", 3]], balls: 800 },
  { out: "mimichammer", main: "pikopiko", sub: "stick", mats: [["mimic_tooth", 3]], balls: 900 },
  { out: "lampgun", main: "mizudeppo", sub: "kamifusen", mats: [["light_drop", 2], ["candle", 3]], balls: 1000 },
  { out: "dragonfusen", main: "kamifusen", sub: "mizudeppo", mats: [["dragon_crystal", 1]], balls: 2000, boss: true },
];
export const BOSS_FX = 0.25;

// ★の くじ（作業台の Lv ごと）。作るは Lv1 から、合成は Lv2 から
export const CRAFT_STAR = { 1: { 1: 70, 2: 30 }, 2: { 1: 40, 2: 45, 3: 15 }, 3: { 2: 45, 3: 40, 4: 15 } };
export const SYNTH_STAR = { 2: { 2: 50, 3: 40, 4: 10 }, 3: { 2: 30, 3: 45, 4: 20, 5: 5 } };
export const SYNTH_HALF = 3;   // この Lv から 合成の 玉が 半分

// レシピが 出ているか：素材（合成は 装備も）を ぜんぶ 1 回 手に入れたことがあるか
export const craftOpen = (r, seen) => r.mats.every(([id]) => seen.has(id));
export const synthOpen = (r, seen) => seen.has(r.main) && seen.has(r.sub) && r.mats.every(([id]) => seen.has(id));
export const synthBalls = (r, benchLv) => (benchLv >= SYNTH_HALF ? Math.round(r.balls / 2) : r.balls);

const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// OP の くじ：付きやすい OP は 重さ ×OP_BIAS（その★で 付かない OP は 入らない）
function rollOps(R, star, likes, n = star) {
  const pool = Object.keys(OPS).filter((k) => (OPS[k].from || 1) <= star).map((k) => [k, likes.includes(k) ? OP_BIAS : 1]), ops = [];
  while (ops.length < n && pool.length) { const t = pool.reduce((a, [, w]) => a + w, 0); let x = R() * t, i = 0; while ((x -= pool[i][1]) >= 0) i++; ops.push(pool.splice(i, 1)[0][0]); }
  return ops;
}
const likesOf = (mats) => mats.map(([id]) => MAT_OP[id]).filter(Boolean);
// OP の 数は ★ × 枠の 重み（equip.js の opCount）。形の レシピは 素材と 色も くじ
export function rollCraft(R, r, benchLv) {
  const star = pickW(R, CRAFT_STAR[benchLv]), base = r.tier == null ? r.base : comboId(comboOf(r.base).form, pickMat(R, r.tier), Math.floor(R() * COLS.length));
  return { base, star, ops: rollOps(R, star, likesOf(r.mats), opCount(baseOf(base).slot, star)) };
}
export function rollSynth(R, r, benchLv) { const star = pickW(R, SYNTH_STAR[benchLv]); return { base: r.out, star, ops: rollOps(R, star, likesOf(r.mats), opCount(baseOf(r.out).slot, star)), fx: r.boss && R() < BOSS_FX }; }
