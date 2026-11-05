// ユニーク装備 20 こ（鹿さんの頼み、2026-10-26。決めた こと：島ごとに 10 こ・1 匹（1 人）に 2 つまで・ボスから まれに ＋ 工房で 作る）
// - 手に入れ方①：その 行き先の ボスを たおすと、ごくまれに（UNIQUE_RATE。ミシック 1% より 少ない）その 行き先の ユニークが 1 つ 出る
// - 手に入れ方②：作業台の「ユニーク」で 作る（ボスの 素材 3 ＋ かくし通路の 素材 2 ＋ 玉）。レシピは 素材を ぜんぶ 1 回 拾うと 出る（ほかの レシピと 同じ）
// - ★5・OP は ミシックと 同じ（★5 ＋ 1 つ多い OP）。もとの 強さは 行き先の ミシックと 同じ くらい。効果は いつも 付く（fxp は battle-sim.js の パッシブの 入れ物と 同じ）
// - 1 匹（1 人）に 付けられるのは 2 つまで（UNIQUE_MAX）。まとめて 手放す・自動で 売るの 対象に ならない
// - 見た目：モデリングの 専用スレッドに 頼む（docs/modeling-log.md の「システム側からの お願い」）。届くまでは look の もとの 装備の 絵
// 数字は ぜんぶ 案（鹿さんが 試して 直す）
export const UNIQUE_RATE = 0.004, UNIQUE_MAX = 2;
export const UNIQUE_BALLS = 3000;   // 作る ときの 値段（Lv ごとの 割り引きは なし。ボスの 素材が 本体）。通貨の 作り直し（2026-10-28：玉で 払う 物は 同じ 数の クレジットに）で クレジット
export const UNIQUE_CREDITS = UNIQUE_BALLS;
export const UNIQUE_CRAFT_LV = 2;   // 作業台 Lv2 から（施設の 作り直しで 段 2 ＝ Lv20 から。UNIQUE_BENCH_LV）
export const UNIQUE_BENCH_LV = 20;

// id・島・行き先（dungeon）・部位・名前・効果の 文・もとの 強さ・fxp・look（見た目の 代わりに 使う もとの 装備）
export const UNIQUES = [
  // ---- 島 1（ハルス・モーフィアス・暗い村・水晶洞窟）----
  { id: "uqHalsBoots", isle: 1, dungeon: "hals", slot: "leg", name: "街道ばしりのブーツ", text: "韋駄天：AGI +20%・戦いのはじめ 先に 動く", main: { agi: 0.9, dex: 0.3 }, fxp: { agiMul: 1.2, firstStrike: true }, look: "sneakers.leather.0" },
  { id: "uqHalsKnife", isle: 1, dungeon: "hals", slot: "weapon", name: "盗賊王のナイフ", text: "手ぐせ：会心 +10%・会心の ダメージ +25%", main: { atk: 1.0, dex: 0.5 }, fxp: { crit: 0.1, critDmg: 25 }, look: "stick" },
  { id: "uqHalsClover", isle: 1, dungeon: "hals", slot: "acc", name: "四つ葉の護り", text: "幸運：受ける ダメージ −6%・回避 +6%", main: { luk: 0.9, hp: 0.3 }, fxp: { dmgCut: 6, evade: 0.06 }, look: "brooch.cloth.0" },
  { id: "uqMorphPillow", isle: 1, dungeon: "morph", slot: "off", name: "夢枕の本", text: "いい 夢：自分の 番の はじめに MP +1", main: { int: 0.8, res: 0.4 }, fxp: { mpRegen: 1 }, look: "book.leather.0" },
  { id: "uqMorphGlove", isle: 1, dungeon: "morph", slot: "arm", name: "うたたねの手ぶくろ", text: "さそいの 手：こうげきの とき 15% で 相手を ねむりに", main: { atk: 0.7, res: 0.5 }, fxp: { onHitFx: [["sleep", 0.15, undefined, 1]] }, look: "glove.cloth.0" },
  { id: "uqMorphHood", isle: 1, dungeon: "morph", slot: "head", name: "まどろみのずきん", text: "ねむりしらず：RES +25%", main: { res: 1.0, hp: 0.3 }, fxp: { resMul: 1.25 },   /* 前は「ねむりと 混乱に ならない・RES +15%」（無効）。鹿さんの 決め 2026-11-04 で RES +25% に */ look: "hood.cloth.0" },
  { id: "uqKuraiBell", isle: 1, dungeon: "kurai", slot: "neck", name: "村はずれの 鐘守", text: "弔いの 鐘：自分の 番の はじめに 味方 全員の HP 1.5% 回復", main: { hp: 1.1, mp: 0.4 }, fxp: { teamRegen: 0.015 }, look: "bib" },
  { id: "uqKuraiBlade", isle: 1, dungeon: "kurai", slot: "weapon", name: "夜ふけの 骨のかま", text: "血を すう：与えた ダメージの 8% を 吸う", main: { atk: 1.1 }, fxp: { drain: 8 }, look: "pikopiko" },
  { id: "uqCrystalGauntlet", isle: 1, dungeon: "crystal", slot: "arm", name: "水晶ごけの こて", text: "かたい 手：DEF +20%・受ける ダメージ −5%", main: { def: 1.0, atk: 0.3 }, fxp: { defMul: 1.2, dmgCut: 5 }, look: "gauntlet.iron.0" },
  { id: "uqCrystalWand", isle: 1, dungeon: "crystal", slot: "weapon", name: "竜水晶の 杖", text: "光の 屈折：INT +20%・最初の 攻撃 +20%", main: { int: 1.1 }, fxp: { intMul: 1.2, firstHit: 0.2 }, look: "mizudeppo" },
  // ---- 島 2 ビサイ諸島（行き先ごとに 1 つ）----
  { id: "uqInohPearl", isle: 2, dungeon: "inoh", slot: "neck", name: "浅瀬の 真珠", text: "なぎ：自分の 番の はじめに HP 2% 回復・HP +15%", main: { hp: 1.0, res: 0.4 }, fxp: { hpMul: 1.15, hpRegen: 0.02 }, look: "gold" },
  { id: "uqGamaFlag", isle: 2, dungeon: "gama", slot: "acc", name: "海賊旗の 切れはし", text: "略奪：こうげきの ダメージ +10%・会心 +6%", main: { atk: 0.6, luk: 0.6 }, fxp: { atkMul: 1.1, crit: 0.06 }, look: "ring.iron.0" },
  { id: "uqTidaMirror", isle: 2, dungeon: "tida", slot: "off", name: "霧ばらいの 鏡", text: "見とおす：相手の 回避 −10%・DEX +25%", main: { dex: 0.8, int: 0.5 }, fxp: { foeEvadeCut: 0.1, dexMul: 1.25 },   /* 前は「盲目に ならない・DEX +15%」（無効）。無効を なくして DEX +25%（2026-11-04） */ look: "lantern.iron.0" },
  { id: "uqAtuiSpear", isle: 2, dungeon: "atui", slot: "weapon", name: "タコ墨の 銛", text: "墨だまり：こうげきの とき 20% で 相手を 盲目に", main: { atk: 1.1, dex: 0.3 }, fxp: { onHitFx: [["blind", 0.2, undefined, 2]] }, look: "stick" },
  { id: "uqZanShell", isle: 2, dungeon: "zan", slot: "head", name: "人魚の 髪かざり", text: "うたの 加護：味方 全員の HP 1.5% 回復（自分の 番の はじめ）", main: { res: 0.7, mp: 0.7 }, fxp: { teamRegen: 0.015 }, look: "band.leather.0" },
  { id: "uqUfuBoots", isle: 2, dungeon: "ufu", slot: "leg", name: "溶岩あるきの ブーツ", text: "熱い 足あと：戦いのはじめ 相手の ATK −10%・自分は DEF +10%", main: { def: 0.7, agi: 0.5 }, fxp: { startFoeFx: [["down_atk", 10, 3]], defMul: 1.1 }, look: "boots.iron.0" },
  { id: "uqKajiGeta", isle: 2, dungeon: "kaji", slot: "leg", name: "追い風の げた", text: "風に のる：AGI +25%・回避 +8%", main: { agi: 1.0 }, fxp: { agiMul: 1.25, evade: 0.08 }, look: "geta.crystal.0" },
  { id: "uqNiraiCrown", isle: 2, dungeon: "nirai", slot: "head", name: "海神の 小さな冠", text: "加護：受ける ダメージ −8%・状態異常に なりにくい", main: { res: 0.8, def: 0.6 }, fxp: { dmgCut: 8, statusRes: 20 }, look: "kingstraw" },
  { id: "uqMabuiRing", isle: 2, dungeon: "mabui", slot: "acc", name: "船長の 指輪", text: "最後の 命令：戦いのはじめ 味方 全員の ATK と INT +10%", main: { luk: 0.5, hp: 0.5 }, fxp: { startFx: [["up_atk", 10, 3], ["up_int", 10, 3]] }, look: "ring.iron.0" },
  { id: "uqKanaiKey", isle: 2, dungeon: "kanai", slot: "acc", name: "門番の 鍵", text: "ひらく：最初の 攻撃 +30%・戦いのはじめ 先に 動く", main: { atk: 0.5, dex: 0.5 }, fxp: { firstHit: 0.3, firstStrike: true }, look: "keychain.crystal.0" },
];
export const UNIQUE_IDS = UNIQUES.map((u) => u.id);
export const uniqueOf = (id) => UNIQUES.find((u) => u.id === id) || null;
export const isUnique = (id) => UNIQUES.some((u) => u.id === id);
export const uniquesOf = (dungeon) => UNIQUES.filter((u) => u.dungeon === dungeon);

// 作る：ボスの 素材 3 ＋ かくし通路の 素材 2 ＋ 玉。ボスの 素材と 隠しの 素材は materials.js から 引く（ここでは 行き先の id だけ 持つ）
export function uniqueRecipe(u, bossMat, hiddenMat) {
  return { out: u.id, mats: [[bossMat, 3], [hiddenMat, 2]], credits: UNIQUE_CREDITS };
}
