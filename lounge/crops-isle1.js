// 島 1（マッサラ島）の 作物（大工事の 農業。鹿さんと 決めた 名前・数は 案。docs/mono-link-farm.md）
// 作物を 足す ときは この 表に 1 行 足して `node stream-layouts/tools/crop-check.mjs`（足し方：.claude/skills/farm-crops）
// 1 行の 中身（くわしくは crops.js の 頭）：
//   id・name・en・kind（seed 種から／cross かけ合わせ／special かけ合わせで だけ・まれ）・lv（seed だけ。農業の Lv）・at（seed だけ。種を 拾える 行き先）
//   from（cross・special の 親 2 つ）・h（育つ 時間）・get（1 マスで とれる 数。書かなければ kind の ふつう）
//   after（放っておくと：書かなければ 枯れる。{ into: 素材の id, taps: たたく 回数 }＝かわる。"flee"＝逃げる）
//   use（使い道）・look（{ form: 絵の 型, c: [実や 花の 色, そえる 色] }。型は crop-art.js の FORM_NAMES）
//   land（なくて よい）名前を とった 土地（世界観を そろえる ための メモ。資料に 出る）
export default {
  isle: 1,
  // 作物から できる 新しい 素材（放っておくと かわる 物）。value は 相場（1 こ。かわる 前の 作物より 少し 高く）。作物 そのものの 素材は 作物の 行から できる
  mats: [
    { id: "iron_bamboo", name: "鉄竹", en: "Iron Bamboo", value: 12, look: { form: "stalk", c: ["#8C8F96", "#C9A86A"] } },
    { id: "night_bamboo", name: "夜竹", en: "Night Bamboo", value: 42, look: { form: "stalk", c: ["#3E4A78", "#9EA7D8"] } },
    { id: "black_bamboo", name: "黒竹", en: "Black Bamboo", value: 55, look: { form: "stalk", c: ["#2A2A33", "#7FA7C9"] } },
    { id: "moonspore", name: "月夜の胞子", en: "Moonlit Spores", value: 50, look: { form: "spore", c: ["#F1E9A8", "#5B5BA8"] } },
    { id: "dreamtree_leaf", name: "夢幻樹の葉", en: "Dreamtree Leaf", value: 700, look: { form: "leaf", c: ["#D7B8FF", "#7FE0D0"] } },
  ],
  crops: [
    // ---- 種から 育てる ----
    { id: "kaido_wheat", name: "街道麦", en: "Highway Wheat", kind: "seed", lv: 1, at: ["hals"], h: 2, get: [4, 6], after: { into: "straw" }, use: "おやつ（パン）", look: { form: "grain", c: ["#E3C15C", "#B58A34"] } },
    { id: "herb", name: "薬草", en: "Herb", kind: "seed", lv: 1, at: ["hals"], h: 2, get: [3, 5], use: "おやつ・薬", look: { form: "leafy", c: ["#5DBB63", "#2F7D45"] } },
    { id: "berry", name: "野いちご", en: "Wild Berry", kind: "seed", lv: 1, at: ["hals"], h: 3, get: [3, 4], use: "おやつ", look: { form: "berry", c: ["#E2465A", "#FFFFFF"] } },
    { id: "ironbamboo_shoot", name: "鉄竹の子", en: "Iron Bamboo Shoot", kind: "seed", lv: 3, at: ["hals"], h: 3, get: [2, 3], after: { into: "iron_bamboo", taps: 3 }, use: "鉄竹は 施設の 建材", look: { form: "bamboo", c: ["#8C8F96", "#C9A86A"] } },
    { id: "wellcap", name: "古井戸茸", en: "Old-Well Mushroom", kind: "seed", lv: 5, at: ["morph"], h: 4, get: [3, 4], use: "おやつ・装備開発の 添え物", look: { form: "mushroom", c: ["#9C7B5B", "#E9DCC3"] } },
    { id: "cloudcotton", name: "雲綿", en: "Cloud Cotton", kind: "seed", lv: 8, at: ["morph"], h: 4, get: [2, 4], use: "布（防具の 開発・家具）", look: { form: "cotton", c: ["#F4F6FA", "#A9B6C9"] } },
    { id: "sleepmoss", name: "ねむり苔", en: "Sleepy Moss", kind: "seed", lv: 10, at: ["kurai"], h: 4, get: [3, 4], use: "おやつ・装備開発", look: { form: "moss", c: ["#7FA7C9", "#4C6E91"] } },
    { id: "wakebean", name: "目覚め豆", en: "Wake Bean", kind: "seed", lv: 12, at: ["kurai"], h: 6, get: [2, 3], use: "家具（コーヒーメーカー）・おやつ", look: { form: "bean", c: ["#7A4A2B", "#C8303A"] } },
    { id: "nightbloom", name: "夜咲き草", en: "Night Bloom", kind: "seed", lv: 15, at: ["kurai"], h: 6, get: [2, 3], use: "装備開発・家具（夜の 明かり）", look: { form: "flower", c: ["#6C5BD4", "#F2E58A"] } },

    // ---- かけ合わせで 生まれる ----
    { id: "inn_wheat", name: "宿場麦", en: "Waystation Barley", kind: "cross", from: ["kaido_wheat", "kaido_wheat"], h: 3, after: { into: "straw" }, use: "おやつ（麦茶）", look: { form: "grain", c: ["#D7A84A", "#8E6A2C"] } },
    { id: "healherb", name: "癒し草", en: "Healing Herb", kind: "cross", from: ["herb", "herb"], h: 3, use: "おやつ（草餅）・薬", look: { form: "leafy", c: ["#8EDB7A", "#3E9A52"] } },
    { id: "rubyberry", name: "紅玉いちご", en: "Ruby Berry", kind: "cross", from: ["berry", "berry"], h: 4, use: "とくべつおやつ", look: { form: "berry", c: ["#B5123A", "#FFD6E0"] } },
    { id: "bellbamboo", name: "鈴笹", en: "Bell Bamboo Grass", kind: "cross", from: ["herb", "ironbamboo_shoot"], h: 4, use: "おやつ（笹だんご）・家具", look: { form: "grass", c: ["#4FA35B", "#E8D27A"] } },
    { id: "nightbamboo_shoot", name: "夜竹の子", en: "Night Bamboo Shoot", kind: "cross", from: ["ironbamboo_shoot", "nightbloom"], h: 5, after: { into: "night_bamboo", taps: 3 }, use: "夜竹は 上の 建材", look: { form: "bamboo", c: ["#3E4A78", "#9EA7D8"] } },
    { id: "starflax", name: "星麻", en: "Star Flax", kind: "cross", from: ["kaido_wheat", "cloudcotton"], h: 5, use: "上の 布（防具の 開発）", look: { form: "flower", c: ["#8FB5F0", "#FFF3B0"] } },
    { id: "skycotton", name: "天綿", en: "Heaven Cotton", kind: "cross", from: ["cloudcotton", "cloudcotton"], h: 6, use: "いちばん 上の 布", look: { form: "cotton", c: ["#FFF7DD", "#F0C75E"] } },
    { id: "drowsegrass", name: "まどろみ草", en: "Drowsy Grass", kind: "cross", from: ["herb", "sleepmoss"], h: 5, use: "家具（ポプリ）・おやつ", look: { form: "leafy", c: ["#9DB7E0", "#5C7FB8"] } },
    { id: "nectarbean", name: "甘露豆", en: "Nectar Bean", kind: "cross", from: ["wakebean", "berry"], h: 6, use: "おやつ（チョコ）", look: { form: "bean", c: ["#5A3524", "#E58FA6"] } },
    { id: "moonshroom", name: "月夜茸", en: "Moonlit Mushroom", kind: "cross", from: ["wellcap", "nightbloom"], h: 6, after: { into: "moonspore" }, use: "家具の 明かり・装備開発", look: { form: "mushroom", c: ["#F1E9A8", "#5B5BA8"] } },

    // ---- かけ合わせで 生まれる・土地の 名前を 付けた 品種（親が 島 1 の 物） ----
    { id: "stardust_wheat", name: "星屑麦", en: "Stardust Wheat", kind: "cross", land: "モーフィアス遺跡（星の砂）", from: ["kaido_wheat", "sleepmoss"], h: 4, after: { into: "straw" }, use: "おやつ（パン）", look: { form: "grain", c: ["#E8E0FF", "#9C8BD8"] } },
    { id: "crystal_shoot", name: "水晶たけのこ", en: "Crystal Bamboo Shoot", kind: "cross", land: "水晶洞窟", from: ["ironbamboo_shoot", "ironbamboo_shoot"], h: 6, after: { into: "crystalbit", taps: 3 }, use: "建材・装備開発", look: { form: "bamboo", c: ["#A8E6F5", "#FFFFFF"] } },
    { id: "wisp_shiitake", name: "鬼火しいたけ", en: "Wisp-Fire Shiitake", kind: "cross", land: "マブイの幽霊船（鬼火）", from: ["wellcap", "wellcap"], h: 6, use: "装備開発・家具（青い 明かり）", look: { form: "mushroom", c: ["#4F8CE8", "#BFE3FF"] } },
    { id: "deep_mushroom", name: "地底きのこ", en: "Deep-Earth Mushroom", kind: "cross", land: "水晶洞窟の 地底", from: ["wellcap", "sleepmoss"], h: 5, use: "装備開発", look: { form: "mushroom", c: ["#7E6A9E", "#C7F0D8"] } },
    { id: "phoenix_coffee", name: "フェニックスコーヒー", en: "Phoenix Coffee", kind: "cross", land: "ウフ火山（火の鳥。目覚め豆の「目覚め」と よみがえり）", from: ["wakebean", "wakebean"], h: 8, use: "家具（コーヒーメーカーの 上の 豆）・おやつ", look: { form: "bush", c: ["#E2492F", "#F7B733"] } },
    { id: "shadow_mugwort", name: "影よもぎ", en: "Shadow Mugwort", kind: "cross", land: "暗い村", from: ["healherb", "nightbloom"], h: 5, use: "薬・おやつ", look: { form: "leafy", c: ["#3F5A4A", "#8C7FD1"] } },
    { id: "ruin_lavender", name: "遺跡ラベンダー", en: "Ruins Lavender", kind: "cross", land: "モーフィアス遺跡", from: ["drowsegrass", "drowsegrass"], h: 6, use: "家具（ポプリ）・装備開発", look: { form: "flower", c: ["#A17BD8", "#D9CBB0"] } },
    { id: "mist_blackbamboo", name: "夜霧黒竹の子", en: "Night-Mist Black Bamboo Shoot", kind: "cross", land: "暗い村", from: ["nightbamboo_shoot", "sleepmoss"], h: 6, after: { into: "black_bamboo", taps: 3 }, use: "黒竹は 夜竹より 上の 建材", look: { form: "bamboo", c: ["#2A2A33", "#7FA7C9"] } },

    // ---- とくべつ（かけ合わせで だけ・まれ） ----
    { id: "clover", name: "四つ葉のクローバー", en: "Four-Leaf Clover", kind: "special", from: ["herb", "berry"], soil: "clay", h: 8, use: "とくべつおやつ・幸運の 素材", look: { form: "clover", c: ["#47B85A", "#FFFFFF"] } },
    { id: "dreamgrass", name: "夢見草", en: "Dreaming Grass", kind: "special", from: ["drowsegrass", "nightbloom"], h: 10, after: { into: "dreamshard" }, use: "装備開発", look: { form: "flower", c: ["#F0A8E0", "#B3E5FF"] } },
    { id: "mandragora", name: "マンドラゴラ", en: "Mandragora", kind: "special", from: ["moonshroom", "drowsegrass"], h: 12, after: "flee", use: "装備開発（★の 高い 物）", look: { form: "root", c: ["#C9A27A", "#6B8E3D"] } },
    { id: "dreamtree_sapling", name: "夢幻樹の苗", en: "Dreamtree Sapling", kind: "special", from: ["mandragora", "dreamgrass"], h: 24, after: { into: "dreamtree_leaf" }, use: "研究・装備開発の いちばん 上の 素材", look: { form: "sapling", c: ["#D7B8FF", "#7FE0D0"] } },
  ],
};
