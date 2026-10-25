// ラウンジの施設（タルコフの隠れ家のように、素材を集めて Lv を上げる）。鹿さんの決め、2026-10-22
// どれも Lv 3 まで。強化はすぐできる（待ち時間なし）。使う物：素材・玉・リソース・クレジット（派遣のゲームの中のお金）・ほかの施設の Lv
// PC は置くだけ（Lv なし。はじめから DEEP LINK/: のぜんぶに入れる）
// 効果・必要な物の数はすべて案（鹿さんとこれから決める）。画面の見本は hideout.html
// need の mats：[素材の id, 数, 品質（敵の素材で 品質 2 以上が いるときだけ。その品質以上）]。fac：[施設の id, Lv]

export const FACILITIES = [
  { id: "bench", name: "作業台", text: "装備を 作る・合成する", lv: [
    { fx: "装備を 作れる（★1〜2 が 出る）", need: { mats: [["pebble", 8], ["goblin_knife", 2]], credits: 400, balls: 300 } },
    { fx: "合成（上の装備を 作る）が できる・★3 も 出る", need: { mats: [["brick", 12], ["golem_stone", 4, 2], ["oldnail", 8]], credits: 2000, balls: 1500, res: 1, fac: [["storage", 1]] } },
    { fx: "★4 も 出る・合成の 玉が 半分", need: { mats: [["ironore", 15], ["crystalbit", 10], ["dragon_crystal", 1, 5], ["crown_shard", 1, 5]], credits: 8000, balls: 6000, res: 4, fac: [["lab", 2]] } },
  ] },
  { id: "lab", name: "研究所", text: "捕まえた敵の 研究が 安くなる", lv: [
    { fx: "研究の リソース −20%", need: { mats: [["old_score", 1], ["stardust", 5]], credits: 600, balls: 300 } },
    { fx: "研究の リソース −35%", need: { mats: [["dream_feather", 2, 2], ["sleepmoss", 10], ["shadow_shard", 3]], credits: 2500, balls: 1500, res: 1, fac: [["bench", 1]] } },
    { fx: "研究の リソース −50%", need: { mats: [["dreamshard", 2], ["light_drop", 2, 3], ["slime_core", 3, 4]], credits: 9000, balls: 6000, res: 4 } },
  ] },
  { id: "snack", name: "おやつ工房", text: "素材から 懐柔の おやつを 作る", lv: [
    { fx: "おやつを 作れる（薬草 2 ＋ 野いちご 1 → おやつ 1）", need: { mats: [["herb", 6], ["berry", 6], ["hare_horn", 2]], credits: 300, balls: 300 } },
    { fx: "作るのに 使う 素材が 3 こ → 2 こ", need: { mats: [["nightbloom", 8], ["wellwater", 8], ["poison_vial", 2, 2]], credits: 1800, balls: 1500, res: 1, fac: [["medic", 1]] } },
    { fx: "とくべつおやつ（なかよしゲージ ＋3）を 作れる", need: { mats: [["clover", 2], ["moondrop", 1], ["deepwater", 10]], credits: 7000, balls: 6000, res: 3 } },
  ] },
  { id: "maproom", name: "地図室", text: "探索が 楽に なる", lv: [
    { fx: "入った階の 階段の 場所が わかる", need: { mats: [["straw", 8], ["kobold_fur", 2]], credits: 500, balls: 300 } },
    { fx: "見える 範囲が まわり 2 マスに", need: { mats: [["oldcloth", 10], ["mimic_tooth", 3, 2], ["candle", 6]], credits: 2500, balls: 1500, res: 1, fac: [["lab", 1]] } },
    { fx: "かくし通路が 探索率 90% で 開く", need: { mats: [["glowstone", 12], ["bat_wing", 3, 4], ["rainbowcrystal", 1]], credits: 9000, balls: 6000, res: 4 } },
  ] },
  { id: "medic", name: "救護室", text: "探索の 休憩で 早く 回復する", lv: [
    { fx: "休憩の 回復 ×1.25", need: { mats: [["herb", 10], ["hare_horn", 1]], credits: 400, balls: 300 } },
    { fx: "休憩の 回復 ×1.5", need: { mats: [["sleepmoss", 8], ["ghost_cloth", 4, 2], ["wellwater", 6]], credits: 2000, balls: 1500, res: 1, fac: [["snack", 1]] } },
    { fx: "倒れた子も 休憩で 起きあがる（HP 1 割）", need: { mats: [["deepwater", 12], ["rainbow_shell", 1, 4], ["sleep_hourglass", 1, 5]], credits: 8000, balls: 6000, res: 4 } },
  ] },
  { id: "gym", name: "トレーニング室", text: "派遣の 経験値が 増える", lv: [
    { fx: "派遣の 経験値 ＋10%", need: { mats: [["pebble", 6], ["kobold_fur", 3]], credits: 500, balls: 300 } },
    { fx: "派遣の 経験値 ＋20%", need: { mats: [["brick", 10], ["wolf_fang", 4, 2], ["oldnail", 6]], credits: 2500, balls: 1500, res: 1, fac: [["medic", 1]] } },
    { fx: "派遣の 経験値 ＋30%", need: { mats: [["ironore", 12], ["crystal_scale", 4, 4], ["midnight_bell", 1, 5]], credits: 9000, balls: 6000, res: 4 } },
  ] },
  { id: "storage", name: "倉庫", text: "1 しゅるいに 置ける 数が 増える（はじめは 50 こ）", lv: [
    { fx: "1 しゅるい 100 こ まで 置ける", need: { mats: [["straw", 6], ["berry", 4]], credits: 300, balls: 300 } },
    { fx: "1 しゅるい 200 こ まで 置ける", need: { mats: [["oldnail", 10], ["oldcloth", 6]], credits: 1500, balls: 1000 } },
    { fx: "1 しゅるい 400 こ まで 置ける", need: { mats: [["ironore", 10], ["crystalbit", 8]], credits: 6000, balls: 4000, res: 2, fac: [["bench", 2]] } },
  ] },
  // 地下の 拡張と 新しい 設備（鹿さんの頼み、2026-10-25。いまの 部屋を 奥へ 広げる 形。スタック数を 増やした ぶん 素材を たくさん 使う）
  { id: "dig", name: "地下の 拡張", text: "地下を 奥へ 広げて、新しい 設備を 置く", lv: [
    { fx: "奥に 広がる（工房・畑を 置ける）", need: { mats: [["pebble", 40], ["brick", 30], ["oldnail", 20]], credits: 3000, balls: 2000 } },
    { fx: "もっと 奥へ（坑道を 掘れる）", need: { mats: [["brick", 80], ["ironore", 40], ["oldcloth", 40], ["golem_stone", 6, 2]], credits: 10000, balls: 6000, res: 2, fac: [["bench", 1]] } },
    { fx: "いちばん 奥まで（畑の マス・坑道の 枠が ふえる）", need: { mats: [["ironore", 120], ["crystalbit", 60], ["glowstone", 60], ["dragon_crystal", 1, 5]], credits: 30000, balls: 15000, res: 6, fac: [["storage", 2]] } },
  ] },
  { id: "workshop", name: "工房", text: "素材から 道具と 武器の アタッチメントを 作る", lv: [
    { fx: "道具・スプリンクラー・アタッチメント（★1〜2）を 作れる", need: { mats: [["oldnail", 20], ["brick", 20], ["candle", 10], ["goblin_knife", 3]], credits: 1500, balls: 1000, fac: [["dig", 1]] } },
    { fx: "アタッチメント ★3 も 出る・元気のお茶・上の スプリンクラー", need: { mats: [["ironore", 40], ["oldcloth", 30], ["wolf_fang", 4, 2], ["light_drop", 2, 2]], credits: 6000, balls: 4000, res: 2, fac: [["bench", 2]] } },
    { fx: "アタッチメント ★4 も 出る（OP 2 つ）・星の スプリンクラー", need: { mats: [["crystalbit", 60], ["glowstone", 40], ["crystal_scale", 4, 4], ["midnight_bell", 1, 5]], credits: 18000, balls: 10000, res: 5, fac: [["dig", 2]] } },
  ] },
  { id: "farm", name: "畑", text: "植物の 素材を 植えて 増やす（スプリンクラーで 品質が 上がる）", lv: [
    { fx: "4 マス（1 列）で 育てられる", need: { mats: [["pebble", 30], ["straw", 30], ["wellwater", 20], ["herb", 10]], credits: 2000, balls: 1500, fac: [["dig", 1]] } },
    { fx: "8 マス・育つ 時間 −20%", need: { mats: [["brick", 40], ["sleepmoss", 30], ["nightbloom", 20], ["kobold_fur", 4, 2]], credits: 8000, balls: 5000, res: 2 } },
    { fx: "12 マス・育つ 時間 −35%", need: { mats: [["ironore", 40], ["deepwater", 40], ["clover", 4], ["rainbow_shell", 2, 3]], credits: 20000, balls: 12000, res: 4, fac: [["dig", 2]] } },
  ] },
  { id: "mine", name: "坑道", text: "パーティに いない なかまが 鉱石と ガラクタを 掘る", lv: [
    { fx: "なかま 1 体が 掘れる（小石・レンガ・釘・鉄鉱石）", need: { mats: [["brick", 50], ["oldnail", 40], ["oldcloth", 30], ["golem_stone", 4, 2]], credits: 6000, balls: 4000, res: 1, fac: [["dig", 2]] } },
    { fx: "2 体・ろうそく・布・水晶のかけらも 出る", need: { mats: [["ironore", 60], ["candle", 30], ["wolf_fang", 6, 3]], credits: 15000, balls: 8000, res: 3 } },
    { fx: "3 体・光る石・ときどき 虹水晶", need: { mats: [["ironore", 120], ["crystalbit", 60], ["bat_wing", 6, 4], ["dragon_crystal", 1, 5]], credits: 30000, balls: 15000, res: 6, fac: [["dig", 3]] } },
  ] },
];
export const STORAGE_CAP = [50, 100, 200, 400];   // 1 しゅるい（素材の id）ごとの 上限。どの しゅるいも 置ける（鹿さんの決め、2026-10-25：前は ぜんぶの 合計で 100・200・400・800）
// おやつ工房で 作る 物（鹿さんの決め、2026-10-25）。Lv2 から ふつうの おやつの 素材が 3 こ → 2 こ。とくべつおやつ（なかよし ＋3）は Lv3 から
export const SNACK_RECIPES = [
  { id: "snack", name: "懐柔のおやつ", gauge: 1, lv: 1, mats: [["herb", 2], ["berry", 1]], lv2: [["herb", 1], ["berry", 1]] },
  { id: "snack3", name: "とくべつおやつ", gauge: 3, lv: 3, mats: [["berry", 3], ["clover", 1]] },
];
export const snackMats = (r, lv) => (lv >= 2 && r.lv2 ? r.lv2 : r.mats);
export const SNACK_CRAFT_MAX = 50;   // 1 回に 作れる 数
export const PC = { id: "pc", name: "PC", text: "DEEP LINK/: に 入れる。置くだけ（Lv なし）" };
