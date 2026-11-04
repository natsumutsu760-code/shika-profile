// 素材（試作。鹿さんの OK、2026-10-22）。数字はすべて仮
// 採取の素材：行き先ごとに 4 種類 ＋ かくし通路だけのレア 1 種類。階ごとに 2 種類ずつずらして出る（深い階ほどいい、ではない）
// 敵の素材：敵ごとに 1 種類。品質 1〜5 は深い階ほど上がる（希少な敵は ＋1、ボスはいつも 5）
// 使いみち：作業台での装備の作成・合成、施設の強化、DEEP LINK/: のタスク、ラウンジの家具、売って玉にする

import { CROPS, CROP_MATS, farmOpen } from "./crops.js";
import { GATHER3, ENEMY_MAT3 } from "./isle3-data.js";   // ミカネル島（島 3）の 採取と 敵の 素材
import { DUNGEONS_ALL } from "./dungeons.js";   // 敵の 結晶の 名前（敵の 名前 ＋ の結晶）

export const GATHER = {
  hals: { mats: [["herb", "薬草"], ["pebble", "きれいな小石"], ["straw", "麦わら"], ["berry", "野いちご"]], hidden: ["clover", "四つ葉のクローバー"] },
  morph: { mats: [["brick", "古いレンガ"], ["sleepmoss", "ねむり苔"], ["stardust", "星の砂"], ["oldcloth", "色あせた布"]], hidden: ["dreamshard", "夢のかけら"] },
  kurai: { mats: [["oldnail", "古い釘"], ["nightbloom", "夜咲き草"], ["wellwater", "井戸の水"], ["candle", "ろうそく"]], hidden: ["moondrop", "月のしずく"] },
  crystal: { mats: [["crystalbit", "水晶のかけら"], ["glowstone", "光る石"], ["deepwater", "地底の水"], ["ironore", "鉄鉱石"]], hidden: ["rainbowcrystal", "虹水晶"] },
  // 2 つめの 島（ビサイ諸島。isle: 2）。id と 名前は docs/mono-link-island2.md の 表。行き先（DUNGEONS）は まだ ないので、いまは 施設の Lv4 で 使うだけ（dungeons.js の ISLAND_OPEN）
  inoh: { isle: 2, mats: [["whitesand", "白い砂"], ["seashell", "小さな貝殻"], ["coconut", "ヤシの実"], ["aasa", "アーサ"]], hidden: ["pinkcoral", "桃色珊瑚"] },
  gama: { isle: 2, mats: [["sailcloth", "古い帆布"], ["emptybottle", "空きびん"], ["rustchain", "錆びた鎖"], ["oldcoin", "古い金貨"]], hidden: ["mapscrap", "宝の地図の切れはし"] },
  tida: { isle: 2, mats: [["seagrass", "潮風の草"], ["lampglass", "灯台のガラス"], ["capestone", "岬の石"], ["akabanaa", "アカバナー"]], hidden: ["suncrystal", "太陽の結晶"] },
  atui: { isle: 2, mats: [["shipwood", "船の木材"], ["barnacle", "フジツボ"], ["rustfitting", "錆びた金具"], ["brasspart", "真鍮の部品"]], hidden: ["sunkengold", "沈んだ金貨"] },
  zan: { isle: 2, mats: [["pearl", "真珠"], ["fallwater", "滝の水"], ["bluestone", "青い石"], ["glowmoss", "光るコケ"]], hidden: ["mermaidtear", "人魚の涙"] },
  ufu: { isle: 2, mats: [["ash", "火山灰"], ["sulfur", "硫黄"], ["obsidian", "黒曜石"], ["lavarock", "溶岩石"]], hidden: ["fireheart", "火の心"] },
  kaji: { isle: 2, mats: [["driftwood", "流木"], ["thunderstone", "雷の石"], ["seafeather", "海鳥の羽"], ["stormcloud", "嵐の雲"]], hidden: ["windorb", "風のオーブ"] },
  nirai: { isle: 2, mats: [["marble", "白い大理石"], ["bluecoral", "青い珊瑚"], ["holyshell", "聖なる貝"], ["oldbell", "古い鈴"]], hidden: ["seagodpearl", "海神の真珠"] },
  mabui: { isle: 2, mats: [["blacksail", "黒い帆"], ["onibi", "青い鬼火"], ["shipbell", "古い船鐘"], ["bonechip", "骨の破片"]], hidden: ["logbook", "船長の日誌"] },
  kanai: { isle: 2, mats: [["abyssmud", "深海の泥"], ["glowbubble", "光る泡"], ["abyssstone", "深海の石"], ["oldgear", "古代の歯車"]], hidden: ["gatestone", "門の鍵石"] },
};
// クローラーの スクラップ類（漁れる マス：残骸・キャビネット・個人ロッカー。docs/mono-link-crawler-missions.md）。鹿さんの OK、2026-10-30
// 使い道は 装備開発と 施設の 素材。売ると 安い。鉱石では ない（鉱石は 坑道と ドルン鉱業だけ）。会社の 物は その 会社の 施設の 迷宮だけ、rare は 残骸から まれに
export const SCRAP = {
  wreck: [["scrap_iron", "鉄くず"], ["bent_plate", "曲がった鉄板"], ["burnt_wire", "焼けた配線"], ["armor_chip", "装甲の破片"], ["cracked_board", "割れた基板"], ["small_motor", "小さなモーター"]],
  cabinet: [["screw_box", "ねじの小箱"], ["glass_tube", "割れたガラス管"], ["spare_fuse", "予備のヒューズ"], ["dead_terminal", "壊れた端末"]],
  locker: [["spare_battery", "使いかけの電池"], ["work_cloth", "作業着の布"], ["old_padlock", "錆びた南京錠"], ["broken_watch", "止まった腕時計"]],
  sva: [["empty_casing", "空の薬莢"], ["barrel_scrap", "砲身の切れはし"]],
  harmonia: [["used_filter", "使用済みフィルター"], ["empty_ampoule", "空のアンプル"]],
  tcu: [["insulation_scrap", "断熱材のくず"], ["fiber_offcut", "防護繊維の端切れ"]],
  rare: [["control_part", "制御装置のかけら"], ["power_cell", "小さな動力セル"]],
};
export const SCRAP_RARE = new Set(SCRAP.rare.map(([id]) => id));
export const SCRAP_MAT = new Set(Object.values(SCRAP).flatMap((l) => l.map(([id]) => id)));
// ボーダーゾーンだけの 素材（docs/mono-link-border-zone.md）。鹿さんの 決め、2026-10-30：Claude の 案 18 こに 鹿さんの 13 こを 足して 割り振った
// どこでも 7・領地ごと（SVA・ハルモニア・TCU）6・境界 6。使い道は 装備開発と 施設の 素材。島の 素材は ボーダーゾーンでは 出ない
export const BORDER = {
  any: [["scorched_soil", "焦げた土"], ["barbed_wire", "錆びた有刺線"], ["carapace_shard", "ユニットの甲殻片"], ["chip_shard", "制御チップのかけら"], ["waste_root", "荒れ地の根"], ["weathered_canvas", "雨ざらしの帆布"], ["small_circuit", "小さな回路基盤"]],
  sva: [["shell_fragment", "砲弾の破片"], ["slag", "精錬くず"], ["black_oil", "黒い油"], ["vacuum_tube", "真空管"], ["broken_motor", "破損したモーター"], ["liquefied_gas", "液化ガス"]],
  harmonia: [["culture_medium", "試験場の培地"], ["feral_grain", "野生化した穂"], ["leftover_serum", "残った薬液"], ["acrylic_sheet", "アクリル材"], ["polymer_chip", "ポリマー片"], ["plastic_scrap", "プラスチック"]],
  tcu: [["rampart_stone", "防壁の石材"], ["old_girder", "古い鉄骨"], ["rampart_plaster", "城壁の漆喰"], ["kevlar_fiber", "ケブラー繊維"], ["extinguisher", "消火材"], ["rubber_scrap", "ゴム片"]],
  edge: [["mixed_alloy", "まざり合金"], ["molten_marker", "溶けた境界標"], ["torn_flag", "裂けた旗布"], ["solder_resist", "ソルダーレジスト"], ["sync_board", "同期盤"], ["cpu_chip", "CPUチップ"]],
};
export const BORDER_MAT = new Set(Object.values(BORDER).flatMap((l) => l.map(([id]) => id)));
// 鉱石と 延べ棒（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md）。鉱石は 坑道（mine.js の mineFind。鉄鉱石は 水晶洞窟でも 採れる）と 採掘の 会社 DRN だけ。延べ棒は 工房の 炉で 精錬する（workshop.js の SMELT）
// 鉄鉱石は 前から ある 素材（水晶洞窟の 採取・坑道）なので ここには 入れない
export const ORE = [["coal", "石炭"], ["copperore", "銅鉱石"], ["silverore", "銀鉱石"], ["goldore", "金鉱石"]];
export const BARS = [["copper_bar", "銅の延べ棒"], ["iron_bar", "鉄の延べ棒"], ["silver_bar", "銀の延べ棒"], ["gold_bar", "金の延べ棒"]];
export const ORE_MAT = new Set([...ORE, ...BARS].map(([id]) => id));
// 工房で 作物を 加工した 素材（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md）：綿・麻 → 布、竹・わら → 建材。workshop.js の WS_PROC
export const CLOTH = [["cotton_cloth", "綿の布"], ["flax_cloth", "麻の布"], ["sky_cloth", "天の布"], ["whitesand_cloth", "白砂の布"], ["sylph_sail", "シルフ帆布"], ["pearl_silk", "真珠絹"]];
export const LUMBER = [["bamboo_lumber", "竹の建材"], ["nightbamboo_lumber", "夜竹の建材"], ["blackbamboo_lumber", "黒竹の建材"], ["stormbamboo_lumber", "嵐竹の建材"], ["straw_bundle", "わら束"]];
// 敵の素材（キーは敵のツリーの id）
const ENEMY_MAT1 = {
  e_hare: ["hare_horn", "ウサギの角"], e_thief: ["goblin_knife", "ゴブリンのナイフ"], e_watch: ["kobold_fur", "コボルトの毛"], e_bard: ["old_score", "古い楽譜"], e_boss_thief: ["crown_shard", "王冠のかけら"],
  e_sentinel: ["golem_stone", "ゴーレムの石"], e_ghost: ["ghost_cloth", "霊布"], e_trapper: ["mimic_tooth", "ミミックの歯"], e_owl: ["dream_feather", "夢見の羽"], e_boss_sleep: ["sleep_hourglass", "眠りの砂時計"],
  e_wolf: ["wolf_fang", "狼の牙"], e_shade: ["shadow_shard", "影のかけら"], e_witch: ["poison_vial", "毒の小びん"], e_lantern: ["light_drop", "灯火のしずく"], e_boss_mayor: ["midnight_bell", "夜ふけの鐘"],
  e_lizard: ["crystal_scale", "水晶のうろこ"], e_bat: ["bat_wing", "コウモリの羽"], e_crystal: ["slime_core", "スライムの核"], e_turtle: ["rainbow_shell", "七色の甲羅片"], e_boss_crystal: ["dragon_crystal", "竜水晶"],
};
// ビサイ諸島（行き先ごとに 敵 3・希少・ボスの 順。敵の ツリーは まだ ない。ドット絵は sprites.js に ある）
const ENEMY_MAT2 = {
  e_coconutcrab: ["crab_claw", "ヤシガニのはさみ"], e_gull: ["gull_feather", "ウミネコの羽"], e_sahagin: ["sahagin_scale", "サハギンのうろこ"], e_clownfish: ["rainbow_fin", "虹色のひれ"], e_boss_crab: ["king_shell", "王のこうら"],
  e_pirate: ["pirate_bandana", "海賊のバンダナ"], e_parrot: ["parrot_feather", "オウムの羽"], e_barrel: ["barrel_hoop", "樽のたが"], e_mapseller: ["old_compass", "古いコンパス"], e_boss_redbeard: ["red_beard", "赤いひげ"],
  e_keeper: ["keeper_key", "灯台の鍵"], e_harpy: ["harpy_talon", "ハーピーの爪"], e_shisa: ["shisa_tile", "シーサーの瓦"], e_glimmer: ["glimmer_dust", "光の粉"], e_boss_fog: ["fog_core", "霧の核"],
  e_skelsailor: ["sailor_bone", "水夫の骨"], e_barnacle: ["barnacle_plate", "フジツボの板"], e_jelly: ["jelly_gel", "クラゲのゼリー"], e_goldcrab: ["gold_claw", "金のはさみ"], e_boss_octopus: ["octo_ink", "大ダコの墨"],
  e_siren: ["siren_scale", "セイレーンのうろこ"], e_eel: ["eel_skin", "ウナギの皮"], e_clam: ["clam_shell", "大きな貝がら"], e_pearl: ["song_pearl", "歌う真珠"], e_boss_mermaid: ["queen_comb", "女王のくし"],
  e_lavalizard: ["lava_scale", "溶岩のうろこ"], e_hidama: ["hidama_ember", "ヒーダマの火種"], e_obsidian: ["obsidian_core", "黒曜石の芯"], e_firechick: ["firechick_down", "火の鳥の綿毛"], e_boss_salamander: ["salamander_tail", "サラマンダーの尾"],
  e_thunderbird: ["thunder_feather", "雷の羽"], e_whirl: ["whirl_pearl", "渦の玉"], e_stormship: ["storm_plank", "嵐の船板"], e_vane: ["vane_feather", "風見の羽"], e_boss_irabu: ["irabu_fang", "イラブーの牙"],
  e_guard: ["guard_crest", "衛兵の紋章"], e_trident: ["trident_tip", "三叉の穂先"], e_priest: ["priest_scale", "神官のうろこ"], e_dolphin: ["white_fin", "白いひれ"], e_boss_seagod: ["seagod_scale", "海神のうろこ"],
  e_ghostsailor: ["ghost_rope", "幽霊の綱"], e_majimun: ["majimun_mask", "マジムンの面"], e_doll: ["doll_button", "人形のボタン"], e_shipcat: ["cat_bell", "猫の鈴"], e_boss_captain: ["captain_hat", "船長の帽子"],
  e_angler: ["angler_lamp", "アンコウのちょうちん"], e_squid: ["squid_beak", "イカのくちばし"], e_deepgiant: ["giant_shell", "巨人の殻"], e_deepfish: ["deep_glow", "深海の光"], e_boss_gatekeeper: ["gate_shard", "門のかけら"],
};
Object.assign(GATHER, GATHER3);
export const ENEMY_MAT = { ...ENEMY_MAT1, ...ENEMY_MAT2, ...ENEMY_MAT3 };
// 敵の 結晶（装備開発の 中心。鹿さんの 決め、2026-10-28「敵が 結晶を 落とす」）。敵ごとに 1 つ・名前は「敵の 名前 ＋ の結晶」・品質 1〜5 ＝ 結晶Ⅰ〜結晶核Ⅱ
// id は xtal_<ツリーの id から e_ を 取った 物>。倉庫・売値・絵は 敵の 素材と 同じ あつかい（MAT_FROM に 入る）
export const CRYSTAL = Object.fromEntries(DUNGEONS_ALL.flatMap((d) => [...d.foes, d.rare, d.boss]).map((f) => [f.tree, [`xtal_${f.tree.replace(/^e_/, "")}`, `${f.name}の結晶`]]));
export const CRYSTAL_ISLE = Object.fromEntries(DUNGEONS_ALL.flatMap((d) => [...d.foes, d.rare, d.boss].map((f) => [CRYSTAL[f.tree][0], d.isle || 1])));
// 素材が 何番目の 島の 物か（書いて いない 物は 1）。まだ 開いて いない 島の 素材は 一覧に 出さない（matIsle(id) <= ISLAND_OPEN）
export const MAT_ISLE = Object.fromEntries([...Object.values(GATHER).filter((g) => g.isle).flatMap((g) => [...g.mats, g.hidden].map(([id]) => [id, g.isle])), ...Object.values(ENEMY_MAT2).map(([id]) => [id, 2]), ...Object.values(ENEMY_MAT3).map(([id]) => [id, 3]), ["goldore", 2], ["gold_bar", 2], ...Object.entries(CRYSTAL_ISLE)]);   // 金は 坑道 Lv4（ビサイ諸島）から
export const matIsle = (id) => MAT_ISLE[id] || 1;

// 採取ポイント 1 か所で 1〜2 こ（70%・30%）。その階の 2 種類から半々。かくし通路の採取ポイントは、レア 1 こ ＋ その階の素材 1 こ
export const GATHER_N = { 1: 70, 2: 30 };
export const floorMats = (did, n) => { const m = GATHER[did].mats; return [m[(n - 1) % 4], m[n % 4]]; };
// 敵の素材を落とす確率（たおした 1 体ごと）と、階ごとの品質
export const ENEMY_DROP = { 通常: 0.3, 希少: 1, ボス: 1 };
// 結晶の 落ちやすさ（敵 1 体ごと。素材とは べつの くじ）：通常 30%・希少と ボスは いつも（ボスは 2 こ）。品質は 素材と 同じ（深い 階ほど 高い・希少 ＋1・ボス 5）。Claude の 案（2026-11-04）
export const CRYSTAL_DROP = { 通常: 0.3, 希少: 1, ボス: 1 };
export const QUALITY = { 1: { 1: 100 }, 2: { 1: 60, 2: 40 }, 3: { 2: 60, 3: 40 }, 4: { 3: 60, 4: 40 }, 5: { 4: 60, 5: 40 } };
// 売ると玉（品質が高いほど高い）
export const SELL = { gather: 20, hidden: 150, enemy: (q) => 10 * 2 ** (q - 1), scrap: 6, scrapRare: 60 };  // スクラップは 売ると 安い（鹿さんの 決め、2026-10-30）

// 素材の 売値（クレジット。大工事の 経済で SELL と 入れかえる。鹿さんの 頼み、2026-10-29：素材ごとに 名前に 見合った 値を 端数まで・高い 物ほど 採れにくく 落ちにくく）
// 採取の 素材と かくし通路の レアは そのままの 値。敵の 素材は 品質 1 の 値で、品質で QMULT 倍（品質 4・5 で 大きく はねる）。ボスの 素材は いつも 品質 5
export const VALUE = {
  // 採取（島 1）
  herb: 2, pebble: 1, straw: 2, berry: 3, clover: 16,
  brick: 3, sleepmoss: 5, stardust: 7, oldcloth: 4, dreamshard: 36,
  oldnail: 4, nightbloom: 7, wellwater: 4, candle: 5, moondrop: 41,
  crystalbit: 7, glowstone: 6, deepwater: 4, ironore: 5, rainbowcrystal: 46,
  // 採取（島 2）
  whitesand: 3, seashell: 5, coconut: 7, aasa: 6, pinkcoral: 43,
  sailcloth: 11, emptybottle: 5, rustchain: 9, oldcoin: 29, mapscrap: 64,
  seagrass: 6, lampglass: 10, capestone: 7, akabanaa: 9, suncrystal: 58,
  shipwood: 10, barnacle: 6, rustfitting: 9, brasspart: 17, sunkengold: 67,
  pearl: 31, fallwater: 8, bluestone: 15, glowmoss: 13, mermaidtear: 100,
  ash: 5, sulfur: 11, obsidian: 19, lavarock: 13, fireheart: 86,
  driftwood: 9, thunderstone: 23, seafeather: 13, stormcloud: 26, windorb: 110,
  marble: 13, bluecoral: 17, holyshell: 21, oldbell: 12, seagodpearl: 117,
  blacksail: 10, onibi: 16, shipbell: 14, bonechip: 6, logbook: 84,
  abyssmud: 8, glowbubble: 17, abyssstone: 15, oldgear: 21, gatestone: 104,
  // 敵の 素材（品質 1。行き先ごとに 敵 3・希少・ボス）
  hare_horn: 3, goblin_knife: 4, kobold_fur: 3, old_score: 8, crown_shard: 5,
  golem_stone: 5, ghost_cloth: 6, mimic_tooth: 7, dream_feather: 17, sleep_hourglass: 10,
  wolf_fang: 7, shadow_shard: 9, poison_vial: 8, light_drop: 18, midnight_bell: 12,
  crystal_scale: 7, bat_wing: 6, slime_core: 8, rainbow_shell: 15, dragon_crystal: 13,
  crab_claw: 8, gull_feather: 7, sahagin_scale: 10, rainbow_fin: 16, king_shell: 9,
  pirate_bandana: 15, parrot_feather: 13, barrel_hoop: 12, old_compass: 23, red_beard: 14,
  keeper_key: 13, harpy_talon: 11, shisa_tile: 12, glimmer_dust: 20, fog_core: 13,
  sailor_bone: 12, barnacle_plate: 14, jelly_gel: 16, gold_claw: 24, octo_ink: 14,
  siren_scale: 21, eel_skin: 15, clam_shell: 17, song_pearl: 34, queen_comb: 20,
  lava_scale: 17, hidama_ember: 19, obsidian_core: 20, firechick_down: 28, salamander_tail: 17,
  thunder_feather: 25, whirl_pearl: 22, storm_plank: 20, vane_feather: 30, irabu_fang: 21,
  guard_crest: 17, trident_tip: 19, priest_scale: 18, white_fin: 29, seagod_scale: 22,
  ghost_rope: 12, majimun_mask: 15, doll_button: 10, cat_bell: 24, captain_hat: 16,
  angler_lamp: 17, squid_beak: 15, giant_shell: 18, deep_glow: 29, gate_shard: 19,
  // クローラーの スクラップ類（どの 会社でも・会社ごと・まれ）
  scrap_iron: 2, bent_plate: 3, burnt_wire: 4, armor_chip: 6, cracked_board: 8, small_motor: 12,
  screw_box: 3, glass_tube: 4, spare_fuse: 5, dead_terminal: 9,
  spare_battery: 4, work_cloth: 4, old_padlock: 5, broken_watch: 7,
  empty_casing: 5, barrel_scrap: 11, used_filter: 6, empty_ampoule: 8, insulation_scrap: 4, fiber_offcut: 12,
  control_part: 40, power_cell: 45,
  // ボーダーゾーンの 素材（どこでも・SVA・ハルモニア・TCU・境界）
  scorched_soil: 6, barbed_wire: 9, carapace_shard: 14, chip_shard: 22, waste_root: 8, weathered_canvas: 10, small_circuit: 18,
  shell_fragment: 12, slag: 7, black_oil: 15, vacuum_tube: 24, broken_motor: 20, liquefied_gas: 26,
  culture_medium: 14, feral_grain: 9, leftover_serum: 18, acrylic_sheet: 13, polymer_chip: 16, plastic_scrap: 7,
  rampart_stone: 8, old_girder: 15, rampart_plaster: 7, kevlar_fiber: 26, extinguisher: 12, rubber_scrap: 6,
  mixed_alloy: 30, molten_marker: 25, torn_flag: 18, solder_resist: 28, sync_board: 40, cpu_chip: 55,
  // 鉱石と 延べ棒（延べ棒は 鉱石 3 こ ＋ 石炭 の 値に 少し 上乗せ）
  coal: 3, copperore: 4, silverore: 12, goldore: 30,
  copper_bar: 17, iron_bar: 20, silver_bar: 46, gold_bar: 104,
  // 布と 建材（作物 3 この 相場に 少し 上乗せ）
  cotton_cloth: 32, flax_cloth: 115, sky_cloth: 145, whitesand_cloth: 145, sylph_sail: 170, pearl_silk: 250,
  bamboo_lumber: 40, nightbamboo_lumber: 130, blackbamboo_lumber: 170, stormbamboo_lumber: 145, straw_bundle: 8,
  // ミカネル島（Claude の 案、2026-11-04：ビサイ諸島の 線を のばした。採取 9〜60・かくし通路の レア 70〜120・敵の 素材〈品質 1〉11〜33）
  // ミカの湖
  oasis_water: 9, date_fruit: 11, lake_reed: 16, lotus: 25, mika_pearl: 75,
  mizuhebi_skin: 11, frog_vocal: 12, croc_tooth: 12, pink_feather: 17, catfish_whisker: 13,
  // 涸れ川の谷
  dry_clay: 9, river_pebble: 14, desert_sage: 18, fossil_shell: 28, water_vein: 70,
  jackal_fang: 12, dry_fishbone: 12, thorny_scale: 12, raincloud_wisp: 19, centipede_jaw: 12,
  // 白い塩原
  rock_salt: 9, salt_crystal: 13, white_mud: 17, saltbush: 26, salt_rose: 81,
  salt_shell: 12, salt_slime: 11, mirage_fur: 10, salt_sparkle: 21, salt_pillar: 17,
  // 赤岩の台地
  red_sandstone: 11, iron_sand: 15, cactus: 19, ochre: 27, fire_agate: 81,
  vulture_feather: 13, goat_horn: 11, red_golemcore: 12, sunset_scale: 24, roc_talon: 13,
  // 巨竜の化石
  fossil_bone: 13, amber_bit: 16, ancient_fern: 21, bone_dust: 28, dragon_heartstone: 85,
  raptor_bone: 15, bone_wisp: 14, amber_lump: 15, dragon_eggshell: 24, dragon_fossil: 15,
  // セラン王墓
  gold_leaf: 12, papyrus: 17, lapis: 21, old_incense: 31, seran_seal: 82,
  old_bandage: 15, gold_scarab: 13, cursed_shard: 12, tomb_cat_bell: 20, sphinx_stone: 17,
  // ノルの砦
  fort_brick: 14, rusty_spear: 17, old_flag: 21, saltpeter: 33, noru_medal: 90,
  sandstone_shard: 16, ghost_arrow: 12, damp_powder: 12, brass_mouthpiece: 25, general_crest: 19,
  // 隊商の野営地
  camel_milk: 13, spice: 18, woven_rug: 24, caravan_tea: 40, caravan_map: 92,
  camel_hair: 13, jerboa_tail: 14, bandit_scarf: 13, fortune_card: 27, guard_tsuba: 18,
  // 大砂丘
  fine_sand: 14, desert_glass: 19, dune_grass: 22, sun_stone: 38, sand_pearl: 89,
  sand_scale: 17, scorpion_stinger: 16, hot_sand: 16, desert_rose: 25, worm_hide: 21,
  // 沈む砂の穴
  quicksand: 16, sunk_pottery: 21, bottom_sand: 29, sand_root: 42, abyss_stone: 95,
  antlion_jaw: 17, sandcat_whisker: 16, sinking_sand: 13, sand_firefly: 23, antlion_shell: 20,
  // 風の峡谷
  wind_stone: 17, hawk_down: 20, canyon_moss: 25, red_crystal: 43, wind_harp: 104,
  falcon_feather: 14, leopard_fur: 16, whirlwind_core: 14, windchime_wing: 28, griffon_feather: 18,
  // エナ遺跡
  sea_salt: 16, ruin_tile: 19, blue_glass: 27, salt_coral: 43, ena_tablet: 108,
  gargoyle_horn: 14, salt_jellycap: 19, ancient_stone: 15, ancient_scroll: 29, shrine_bell: 22,
  // 岩の大門
  arch_stone: 16, rock_moss: 25, cliff_flower: 29, granite: 44, gate_keystone: 113,
  spider_silk: 15, troll_club: 15, golem_moss: 19, hermit_herb: 31, giant_knuckle: 23,
  // ティルカ灯台
  lamp_oil: 19, lens_glass: 23, old_rope: 34, signal_mirror: 49, eternal_flame: 117,
  torch_crest: 19, lighthouse_claw: 18, light_mote: 19, keeper_lamp: 31, giant_lens: 24,
  // 月下の流砂
  moon_sand: 20, night_flower: 27, silver_sand: 34, night_dew: 54, moon_tear: 105,
  moon_stinger: 19, night_snakeskin: 19, moonbeam_shard: 16, moon_mochi: 28, moon_serpent_scale: 24,
  // セランの巨像
  colossus_sand: 20, bronze_piece: 26, royal_cloth: 33, star_chart: 55, seran_crown: 118,
  colossus_chip: 17, royal_spearhead: 17, night_sand: 16, king_shadow: 34, colossus_core: 24,
  // 風の目
  thunderhead: 18, thunder_shard: 24, wind_pearl: 31, vortex_sand: 52, wind_eye_orb: 114,
  storm_core: 17, gale_feather: 17, windwall_core: 17, breeze_feather: 31, djinn_bangle: 21,
};
// 結晶の 値は その 敵の 素材と 同じ（品質で QMULT 倍。Claude の 案）
for (const [tree, [id]] of Object.entries(CRYSTAL)) if (!(id in VALUE)) VALUE[id] = VALUE[(ENEMY_MAT[tree] || [])[0]] || 10;
export const QMULT = [1, 1, 1.7, 3.1, 6.3, 13.7];
export const matValue = (m) => Math.round((VALUE[m.id] || 0) * (MAT_FROM[m.id] ? QMULT[m.q || 1] : GATHER_Q[m.q || 0] || 1));
// 採れやすさ：同じ 階の 2 種類は、値の √ に 反比例して 選ばれる（r は 0〜1 の 乱数 1 つ。前と 同じ 数だけ 乱数を 使う）
export const gatherPick = (two, r) => { const a = 1 / Math.sqrt(VALUE[two[0][0]] || 1), b = 1 / Math.sqrt(VALUE[two[1][0]] || 1); return two[r < a / (a + b) ? 0 : 1]; };
// 落としやすさ：ふつうの 敵は 30% を 基準に、値が 高い 素材ほど 下がる（12〜40%）。希少と ボスは いつも 落とす
export const dropRate = (rk, id) => (rk === "通常" ? Math.min(0.4, Math.max(0.12, ENEMY_DROP.通常 * (10 / (VALUE[id] || 10)) ** 0.35)) : ENEMY_DROP[rk]);

// 素材の名前（id から）
export const MAT_NAME = Object.fromEntries([...Object.values(GATHER).flatMap((g) => [...g.mats, g.hidden]), ...Object.values(ENEMY_MAT), ...Object.values(CRYSTAL), ...Object.values(SCRAP).flat(), ...Object.values(BORDER).flat(), ...ORE, ...BARS, ...CLOTH, ...LUMBER]);
export const MAT_NAME_BASE = { ...MAT_NAME };   // 作物を 足す 前（tools/crop-check.mjs が「いまの 素材」と して 見る）
// 作物（大工事の 農業）と 作物から できる 素材の 名前も（前から ある 素材は その まま。並びは うしろに 足す）
for (const [id, name] of [...CROPS.map((c) => [c.id, c.name]), ...CROP_MATS.map((m) => [m.id, m.name])]) if (!(id in MAT_NAME)) MAT_NAME[id] = name;
// 大工事の 農業の 畑が つながる まで 手に 入らない 素材（前から ない 作物・作物から できる 物・布・建材。わら束も 使い道が 畑の あとなので 加工は 畑から）。依頼の 板などに 出さない
export const FARM_MAT = new Set([...CROPS.map((c) => c.id), ...CROP_MATS.map((m) => m.id), ...CLOTH.map(([id]) => id), ...LUMBER.map(([id]) => id)].filter((id) => !Object.values(GATHER).some((g) => [...g.mats, g.hidden].some(([x]) => x === id))));
export const matOpen = (id) => farmOpen() || !FARM_MAT.has(id);
// どの敵の素材か（ドット絵を出すため）
export const MAT_FROM = Object.fromEntries([...Object.entries(ENEMY_MAT), ...Object.entries(CRYSTAL)].map(([tree, [id]]) => [id, tree]));   // 結晶も 落とした 敵
export const HIDDEN_MAT = new Set(Object.values(GATHER).map((g) => g.hidden[0]));
// 畑で とれた 物（採取の 素材に 品質 1〜5）は 品質が 高いほど 高く 売れる（鹿さんの頼み、2026-10-25。拾った 物は 品質 0）
export const GATHER_Q = [1, 1.5, 2, 3, 4, 6];
// 延べ棒は 高めに 売れる（鹿さんの 決め、2026-10-31：金の延べ棒を 売れる ように。数は Claude の 案。前は 採取と 同じ 20 玉）
export const BAR_SELL = { copper_bar: 40, iron_bar: 50, silver_bar: 120, gold_bar: 300 };
export const sellPrice = (m) => (BAR_SELL[m.id] ? BAR_SELL[m.id] : MAT_FROM[m.id] ? SELL.enemy(m.q || 1) : SCRAP_MAT.has(m.id) ? (SCRAP_RARE.has(m.id) ? SELL.scrapRare : SELL.scrap) : Math.round((HIDDEN_MAT.has(m.id) ? SELL.hidden : SELL.gather) * (GATHER_Q[m.q || 0] || 1)));

// 倉庫が いっぱいの とき（鹿さんの決め、2026-10-23）：入らない分は あずかり箱へ。7 日の うちに 倉庫を あければ うけとれる（すぎると なくなる）
// 倉庫は どの しゅるいも 置ける。上限は 1 しゅるい（素材の id。品質ちがいも あわせて）ごとの 数（鹿さんの決め、2026-10-25。STORAGE_CAP）
// 同じ しゅるいの 中では いい物から 入れる（敵の素材は 品質の 高い順）。入らない 分は 箱へ
export const BOX_DAYS = 7;
const rankMat = (m) => (HIDDEN_MAT.has(m.id) || SCRAP_RARE.has(m.id) ? 100 : MAT_FROM[m.id] ? 10 + (m.q || 1) : 0);
// cap：1 しゅるいの 上限、have：いま 倉庫に ある 数（id → こ。stashHave）
export function toStash(mats, cap, have = {}) {
  const stash = [], box = [], room = {};
  for (const m of [...mats].sort((a, b) => rankMat(b) - rankMat(a))) {
    if (!(m.id in room)) room[m.id] = Math.max(0, cap - (have[m.id] || 0));
    const k = Math.min(m.n, room[m.id]); room[m.id] -= k;
    if (k) stash.push({ ...m, n: k }); if (m.n > k) box.push({ ...m, n: m.n - k });
  }
  return { stash, box };
}
// 倉庫に ある 数（id → こ。品質ちがいも あわせて）
export const stashHave = (mats) => (mats || []).reduce((o, m) => ((o[m.id] = (o[m.id] || 0) + m.n), o), {});
