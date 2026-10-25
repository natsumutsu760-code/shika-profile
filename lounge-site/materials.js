// 素材（試作。鹿さんの OK、2026-10-22）。数字はすべて仮
// 採取の素材：行き先ごとに 4 種類 ＋ かくし通路だけのレア 1 種類。階ごとに 2 種類ずつずらして出る（深い階ほどいい、ではない）
// 敵の素材：敵ごとに 1 種類。品質 1〜5 は深い階ほど上がる（希少な敵は ＋1、ボスはいつも 5）
// 使いみち：作業台での装備の作成・合成、施設の強化、DEEP LINK/: のタスク、ラウンジの家具、売って玉にする

export const GATHER = {
  hals: { mats: [["herb", "薬草"], ["pebble", "きれいな小石"], ["straw", "麦わら"], ["berry", "野いちご"]], hidden: ["clover", "四つ葉のクローバー"] },
  morph: { mats: [["brick", "古いレンガ"], ["sleepmoss", "ねむり苔"], ["stardust", "星の砂"], ["oldcloth", "色あせた布"]], hidden: ["dreamshard", "夢のかけら"] },
  kurai: { mats: [["oldnail", "古い釘"], ["nightbloom", "夜咲き草"], ["wellwater", "井戸の水"], ["candle", "ろうそく"]], hidden: ["moondrop", "月のしずく"] },
  crystal: { mats: [["crystalbit", "水晶のかけら"], ["glowstone", "光る石"], ["deepwater", "地底の水"], ["ironore", "鉄鉱石"]], hidden: ["rainbowcrystal", "虹水晶"] },
  // 2 つめの 島（ニライ諸島。isle: 2）。id と 名前は docs/mono-link-island2.md の 表。行き先（DUNGEONS）は まだ ないので、いまは 施設の Lv4 で 使うだけ（dungeons.js の ISLAND_OPEN）
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
// 敵の素材（キーは敵のツリーの id）
const ENEMY_MAT1 = {
  e_hare: ["hare_horn", "ウサギの角"], e_thief: ["goblin_knife", "ゴブリンのナイフ"], e_watch: ["kobold_fur", "コボルトの毛"], e_bard: ["old_score", "古い楽譜"], e_boss_thief: ["crown_shard", "王冠のかけら"],
  e_sentinel: ["golem_stone", "ゴーレムの石"], e_ghost: ["ghost_cloth", "霊布"], e_trapper: ["mimic_tooth", "ミミックの歯"], e_owl: ["dream_feather", "夢見の羽"], e_boss_sleep: ["sleep_hourglass", "眠りの砂時計"],
  e_wolf: ["wolf_fang", "狼の牙"], e_shade: ["shadow_shard", "影のかけら"], e_witch: ["poison_vial", "毒の小びん"], e_lantern: ["light_drop", "灯火のしずく"], e_boss_mayor: ["midnight_bell", "夜ふけの鐘"],
  e_lizard: ["crystal_scale", "水晶のうろこ"], e_bat: ["bat_wing", "コウモリの羽"], e_crystal: ["slime_core", "スライムの核"], e_turtle: ["rainbow_shell", "七色の甲羅片"], e_boss_crystal: ["dragon_crystal", "竜水晶"],
};
// ニライ諸島（行き先ごとに 敵 3・希少・ボスの 順。敵の ツリーは まだ ない。ドット絵は sprites.js に ある）
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
export const ENEMY_MAT = { ...ENEMY_MAT1, ...ENEMY_MAT2 };
// 素材が 何番目の 島の 物か（書いて いない 物は 1）。まだ 開いて いない 島の 素材は 一覧に 出さない（matIsle(id) <= ISLAND_OPEN）
export const MAT_ISLE = Object.fromEntries([...Object.values(GATHER).filter((g) => g.isle).flatMap((g) => [...g.mats, g.hidden].map(([id]) => [id, g.isle])), ...Object.values(ENEMY_MAT2).map(([id]) => [id, 2])]);
export const matIsle = (id) => MAT_ISLE[id] || 1;

// 採取ポイント 1 か所で 1〜2 こ（70%・30%）。その階の 2 種類から半々。かくし通路の採取ポイントは、レア 1 こ ＋ その階の素材 1 こ
export const GATHER_N = { 1: 70, 2: 30 };
export const floorMats = (did, n) => { const m = GATHER[did].mats; return [m[(n - 1) % 4], m[n % 4]]; };
// 敵の素材を落とす確率（たおした 1 体ごと）と、階ごとの品質
export const ENEMY_DROP = { 通常: 0.3, 希少: 1, ボス: 1 };
export const QUALITY = { 1: { 1: 100 }, 2: { 1: 60, 2: 40 }, 3: { 2: 60, 3: 40 }, 4: { 3: 60, 4: 40 }, 5: { 4: 60, 5: 40 } };
// 売ると玉（品質が高いほど高い）
export const SELL = { gather: 20, hidden: 150, enemy: (q) => 10 * 2 ** (q - 1) };

// 素材の名前（id から）
export const MAT_NAME = Object.fromEntries([...Object.values(GATHER).flatMap((g) => [...g.mats, g.hidden]), ...Object.values(ENEMY_MAT)]);
// どの敵の素材か（ドット絵を出すため）
export const MAT_FROM = Object.fromEntries(Object.entries(ENEMY_MAT).map(([tree, [id]]) => [id, tree]));
export const HIDDEN_MAT = new Set(Object.values(GATHER).map((g) => g.hidden[0]));
// 畑で とれた 物（採取の 素材に 品質 1〜5）は 品質が 高いほど 高く 売れる（鹿さんの頼み、2026-10-25。拾った 物は 品質 0）
export const GATHER_Q = [1, 1.5, 2, 3, 4, 6];
export const sellPrice = (m) => (MAT_FROM[m.id] ? SELL.enemy(m.q || 1) : Math.round((HIDDEN_MAT.has(m.id) ? SELL.hidden : SELL.gather) * (GATHER_Q[m.q || 0] || 1)));

// 倉庫が いっぱいの とき（鹿さんの決め、2026-10-23）：入らない分は あずかり箱へ。7 日の うちに 倉庫を あければ うけとれる（すぎると なくなる）
// 倉庫は どの しゅるいも 置ける。上限は 1 しゅるい（素材の id。品質ちがいも あわせて）ごとの 数（鹿さんの決め、2026-10-25。STORAGE_CAP）
// 同じ しゅるいの 中では いい物から 入れる（敵の素材は 品質の 高い順）。入らない 分は 箱へ
export const BOX_DAYS = 7;
const rankMat = (m) => (HIDDEN_MAT.has(m.id) ? 100 : MAT_FROM[m.id] ? 10 + (m.q || 1) : 0);
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
