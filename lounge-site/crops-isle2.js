// 島 2（ビサイ諸島）の 作物。無線機を 作ったあと（農業の Lv 30 から の 種と、親に 島 2 の 作物が 入る かけ合わせ）
// 書き方は crops-isle1.js の 頭と 同じ。名前は ビサイ諸島と 同じ 沖縄の 言葉と、行き先の 土地から
export default {
  isle: 2,
  mats: [
    { id: "salt_hay", name: "潮干し草", en: "Salt Hay", value: 18, look: { form: "hay", c: ["#D9CFA0", "#7FC8A9"] } },
    { id: "worldtree_leaf", name: "世界樹の葉", en: "World Tree Leaf", value: 1200, look: { form: "leaf", c: ["#7FE0D0", "#FFE38A"] } },
    { id: "chaagi_log", name: "チャーギの原木", en: "Chaagi Log", value: 50, look: { form: "log", c: ["#D9A273", "#7A4A32"] } },   // 植林（2026-11-11）
  ],
  crops: [
    // ---- 種から 育てる ----
    { id: "coconut", name: "ヤシの実", en: "Coconut", kind: "seed", lv: 30, at: ["inoh"], h: 8, get: [1, 2], use: "おやつ・島 2 の 開発", look: { form: "palm", c: ["#8A5A32", "#3FA34D"] } },
    { id: "akabanaa", name: "アカバナー", en: "Akabanaa Hibiscus", kind: "seed", lv: 32, at: ["gama"], h: 6, get: [2, 3], use: "家具（飾り）・装備開発", look: { form: "flower", c: ["#E8304A", "#FFD23F"] } },
    { id: "aasa", name: "アーサ", en: "Aasa Seaweed", kind: "seed", lv: 34, at: ["inoh"], h: 4, get: [3, 4], use: "おやつ", look: { form: "seaweed", c: ["#5BC46A", "#2E8B57"] } },
    { id: "seagrass", name: "潮風の草", en: "Sea Breeze Grass", kind: "seed", lv: 36, at: ["inoh"], h: 4, get: [3, 5], after: { into: "salt_hay" }, use: "装備開発。潮干し草は 建設・クラフト", look: { form: "grass", c: ["#7FC8A9", "#E9F5F0"] } },

    // 植林：チャーギ（沖縄の 言葉で イヌマキ。古い 家の 柱の 木）。育ったら 切って 原木
    { id: "chaagi", name: "チャーギ", en: "Chaagi", kind: "seed", lv: 38, at: ["gama", "tida"], h: 16, get: [3, 5], mat: "chaagi_log", value: 50, use: "原木は 製材所で 板", look: { form: "tree", c: ["#2F6B4F", "#C8443C"] } },
    // ---- かけ合わせで 生まれる ----
    { id: "uuji", name: "ウージ", en: "Uuji Sugarcane", kind: "cross", from: ["seagrass", "ironbamboo_shoot"], h: 6, use: "おやつ（黒糖）", look: { form: "cane", c: ["#8DBF4E", "#C9A15A"] } },
    { id: "inoh_grape", name: "イノーぶどう", en: "Inoh Grapes", kind: "cross", from: ["aasa", "aasa"], h: 5, use: "おやつ", look: { form: "vine", c: ["#46B37A", "#B9F0C8"] } },
    { id: "sannin", name: "サンニン", en: "Sannin Shell Ginger", kind: "cross", from: ["akabanaa", "herb"], h: 6, use: "家具（香り）・薬", look: { form: "ginger", c: ["#F4D8E0", "#E2617A"] } },
    { id: "tida_fruit", name: "ティダの実", en: "Tida Fruit", kind: "cross", from: ["akabanaa", "berry"], h: 8, use: "とくべつおやつ", look: { form: "bush", c: ["#FF9A1F", "#FFE066"] } },

    // ---- かけ合わせで 生まれる・土地の 名前を 付けた 品種 ----
    { id: "whitesand_cotton", name: "白砂綿", en: "White Sand Cotton", kind: "cross", land: "イノーの浜", from: ["cloudcotton", "coconut"], h: 6, use: "布（島 2 の 防具の 開発）", look: { form: "cotton", c: ["#FFFDF4", "#E8D7A8"] } },
    { id: "sylph_linen", name: "シルフリネン", en: "Sylph Linen", kind: "cross", land: "カジの海峡（シルフ＝風の 精霊。帆に なる 布）", from: ["starflax", "seagrass"], h: 7, use: "上の 布（帆布）", look: { form: "flower", c: ["#BFE6FF", "#FFFFFF"] } },
    { id: "pearl_silkcotton", name: "真珠絹綿", en: "Pearl Silk Cotton", kind: "cross", land: "ザンの洞窟（真珠）", from: ["skycotton", "aasa"], h: 10, use: "いちばん 上の 布（島 2）", look: { form: "cotton", c: ["#F5F0FF", "#D8C8F0"] } },
    { id: "nirai_barley", name: "ニライ大麦", en: "Nirai Barley", kind: "cross", land: "ニライ寺院", from: ["inn_wheat", "aasa"], h: 5, after: { into: "straw" }, use: "おやつ（麦茶）", look: { form: "grain", c: ["#E9D27C", "#3FA7A0"] } },
    { id: "mermaid_berry", name: "人魚いちご", en: "Mermaid Berry", kind: "cross", land: "ザンの洞窟（人魚）", from: ["rubyberry", "aasa"], h: 6, use: "とくべつおやつ", look: { form: "berry", c: ["#FF7FA8", "#7FE0E8"] } },
    { id: "storm_bamboo", name: "嵐笹", en: "Storm Bamboo Grass", kind: "cross", land: "カジの海峡（嵐）", from: ["bellbamboo", "seagrass"], h: 6, use: "家具", look: { form: "grass", c: ["#5F7F8F", "#D9E6EC"] } },
    { id: "onyx_cacao", name: "オニキスカカオ", en: "Onyx Cacao", kind: "cross", land: "アトゥイ号の沈没船の 深い 海（オニキス＝黒い 宝石）", from: ["nectarbean", "coconut"], h: 8, use: "おやつ（チョコ）", look: { form: "bush", c: ["#2B2230", "#B98A5A"] } },
    { id: "cape_cane", name: "岬さとうきび", en: "Cape Sugarcane", kind: "cross", land: "ティダ岬の灯台", from: ["uuji", "akabanaa"], h: 8, use: "おやつ（黒糖）", look: { form: "cane", c: ["#B9D45A", "#E8304A"] } },
    { id: "abyss_grape", name: "深海ぶどう", en: "Abyssal Grapes", kind: "cross", land: "カナイの門（深海）", from: ["inoh_grape", "nightbloom"], h: 8, use: "おやつ", look: { form: "vine", c: ["#2D3F8F", "#8FB0FF"] } },
    { id: "ryugu_ginger", name: "竜宮月桃", en: "Ryugu Shell Ginger", kind: "cross", land: "ニライ寺院（海の 神の 宮）", from: ["sannin", "sannin"], h: 8, use: "家具（香り）・薬", look: { form: "ginger", c: ["#FFE3A3", "#E25A7A"] } },
    { id: "lava_dragonfruit", name: "溶岩ドラゴンフルーツ", en: "Lava Dragon Fruit", kind: "cross", land: "ウフ火山", from: ["tida_fruit", "tida_fruit"], h: 10, use: "とくべつおやつ", look: { form: "cactus", c: ["#E8336E", "#FF8A1F"] } },

    // ---- とくべつ ----
    { id: "world_tree", name: "ニライカナイの世界樹", en: "World Tree of Nirai Kanai", kind: "special", from: ["dreamtree_sapling", "ryugu_ginger"], h: 36, after: { into: "worldtree_leaf" }, use: "研究・装備開発の いちばん 上の 素材（島 2）", look: { form: "sapling", c: ["#7FE0D0", "#FFE38A"] } },
  ],
};
