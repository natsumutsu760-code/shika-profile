// 島 3（ミカネル島）の 作物。無線機 Lv2 の あと（農業の Lv 50 から の 種と、親に 島 3 の 作物が 入る かけ合わせ）
// 書き方は crops.js の 頭と 同じ。ぜんぶ Claude の 案（2026-11-04、鹿さんの カード「Claude が案をぜんぶ作って入れる」）。鹿さんが 直せる
// 名前：種から 育てる 物は 素朴に（いまの 採取の 素材と 同じ id・名前。その 素材が とれる）。かけ合わせは 土地や 自然から、とくべつだけ 伝承の 名前（セラン王）
export default {
  isle: 3,
  mats: [
    { id: "goldtree_leaf", name: "黄金樹の葉", en: "Golden Tree Leaf", value: 2000, look: { form: "leaf", c: ["#FFD86A", "#FFF6C8"] } },
    { id: "acacia_log", name: "アカシアの原木", en: "Acacia Log", value: 100, look: { form: "log", c: ["#E8B860", "#5A3A28"] } },   // 植林（2026-11-11）
  ],
  crops: [
    // ---- 種から 育てる ----
    { id: "date_fruit", name: "ナツメヤシの実", en: "Dates", kind: "seed", lv: 50, at: ["mika", "yaei"], h: 8, get: [1, 2], use: "おやつ・島 3 の 開発", look: { form: "palm", c: ["#7A4A22", "#6FA04A"] } },
    { id: "lotus", name: "スイレン", en: "Water Lily", kind: "seed", lv: 52, at: ["mika"], h: 6, get: [2, 3], use: "家具（飾り）・装備開発", look: { form: "flower", c: ["#F6B6D0", "#3FA36B"] } },
    { id: "desert_sage", name: "砂漠のセージ", en: "Desert Sage", kind: "seed", lv: 54, at: ["karegawa"], h: 4, get: [3, 4], use: "おやつ・薬", look: { form: "leafy", c: ["#9DB59A", "#D8E0C8"] } },
    { id: "cactus", name: "サボテン", en: "Cactus", kind: "seed", lv: 56, at: ["akaiwa", "sakyu"], h: 6, get: [2, 3], use: "おやつ（サボテンの実）", look: { form: "cactus", c: ["#4E9A5A", "#F06A8A"] } },
    { id: "papyrus", name: "パピルス", en: "Papyrus", kind: "seed", lv: 58, at: ["seran"], h: 5, get: [3, 5], use: "家具・装備開発", look: { form: "grass", c: ["#9FBF5A", "#E6D79A"] } },

    // 植林：アカシア（赤い 台地の 木）。育ったら 切って 原木
    { id: "acacia", name: "アカシア", en: "Acacia", kind: "seed", lv: 60, at: ["akaiwa", "noru"], h: 20, get: [3, 5], mat: "acacia_log", value: 100, use: "原木は 製材所で 板", look: { form: "tree", c: ["#7FA040", "#FFD23F"] } },
    // ---- かけ合わせで 生まれる・土地や 自然の 名前 ----
    { id: "mika_lotus", name: "ミカ蓮", en: "Mika Lotus", kind: "cross", land: "ミカの湖", from: ["lotus", "lotus"], h: 8, use: "とくべつおやつ", look: { form: "flower", c: ["#FFD6E8", "#FFF4B0"] } },
    { id: "dune_cotton", name: "砂丘綿", en: "Dune Cotton", kind: "cross", land: "大砂丘", from: ["whitesand_cotton", "desert_sage"], h: 8, use: "布（島 3 の 防具の 開発）", look: { form: "cotton", c: ["#F4E4C0", "#D9B779"] } },
    { id: "salt_barley", name: "塩麦", en: "Salt Barley", kind: "cross", land: "白い塩原", from: ["nirai_barley", "desert_sage"], h: 6, after: { into: "straw" }, use: "おやつ（塩パン）", look: { form: "grain", c: ["#E8E0C8", "#B8A878"] } },
    { id: "sunset_cactus", name: "夕焼けサボテン", en: "Sunset Cactus", kind: "cross", land: "赤岩の台地（夕焼け）", from: ["cactus", "lava_dragonfruit"], h: 10, use: "とくべつおやつ", look: { form: "cactus", c: ["#E8693E", "#FFC870"] } },
    { id: "moon_date", name: "月ナツメ", en: "Moon Dates", kind: "cross", land: "月下の流砂（月）", from: ["date_fruit", "nightbloom"], h: 8, use: "おやつ", look: { form: "palm", c: ["#8E9CC8", "#E8E0FF"] } },

    // ---- とくべつ ----
    { id: "gold_tree", name: "セラン王の黄金樹", en: "Golden Tree of King Seran", kind: "special", land: "セラン王の 伝承（王墓と 巨像の 王）", from: ["world_tree", "mika_lotus"], h: 48, after: { into: "goldtree_leaf" }, use: "研究・装備開発（島 3）", look: { form: "sapling", c: ["#FFD86A", "#B8892E"] } },
  ],
};
