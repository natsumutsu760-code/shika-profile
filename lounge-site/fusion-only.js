// 配合限定の モンスター 80 種（鹿さんの決め、2026-10-25：F〜SS の 8 段 × 10 種。系統は ヴェルヴェットの 16 大種族に 5 種ずつ）
// 野生には 出ない。ふつうは 位階配合の はしごに 入る。生まれ方が「特殊」「4体」の 子は はしごに 入らず、下の 組み合わせだけで 生まれる
// ツリーは enemy-trees.js（rank は "配合"・dungeon は null）。ツリーが まだ ない 子は 候補に 出ない（fusion.js が はぶく）
// 決まりは docs/mono-link-haigou.md

// [ツリー id, 技の 記号, 名前, 英語, 系統, ランク, タイプ, テーマの 状態, 生まれ方, ひとこと]
const ROWS = [
  // ---- F ----
  ["f_puchijelly", "pj", "プチゼリー", "Petit Jelly", "jelly", "F", "technician", "mirage", "位階", "手のひらに のる 小さな ゼリー。ぷるぷる ゆれて 攻撃を かわす"],
  ["f_babydragon", "bd", "ベビードラゴン", "Baby Dragon", "dragon", "F", "attacker", "burn", "位階", "生まれた ばかりの 竜。小さな 火を はく"],
  ["f_imp", "ip", "インプ", "Imp", "demon", "F", "technician", "confusion", "位階", "いたずら好きの 小悪魔。相手の 頭を こんがらがらせる"],
  ["f_bonerat", "br", "ボーンラット", "Bone Rat", "undead", "F", "technician", "rot", "位階", "ほねだけの ねずみ。かじった 傷が くさる"],
  ["f_dokukinoko", "dk", "ドクキノコ", "Toxic Shroom", "plant", "F", "technician", "poison", "位階", "毒の 胞子を まく きのこ"],
  ["f_togemushi", "tm", "トゲムシ", "Thorn Bug", "insect", "F", "defender", "thorns", "位階", "とげだらけの 小さな 虫。さわると 痛い"],
  ["f_chibitenshi", "ct", "ちびてんし", "Little Angel", "divine", "F", "healer", "blessing", "位階", "小さな 天使。やさしい 光で 祝福する"],
  ["f_tatsunoko", "tn", "タツノコ", "Little Seahorse", "aquatic", "F", "healer", "regen", "位階", "小さな たつのおとしご。海の 薬草を 運ぶ"],
  ["f_karakasa", "kr", "カラカサ", "Umbrella Spook", "yokai", "F", "technician", "confusion", "位階", "一本足の からかさ おばけ。くるくる 回って 目を 回させる"],
  ["f_nopperabo", "np", "ノッペラボウ", "Faceless", "specter", "F", "technician", "daze", "位階", "顔の ない 怪異。見た 相手は ぼうっと する"],
  // ---- E ----
  ["f_sodajelly", "sj", "ソーダゼリー", "Soda Jelly", "jelly", "E", "technician", "haste", "位階", "しゅわしゅわ はじける ゼリー。泡の 連打"],
  ["f_kibaneko", "kn", "キバネコ", "Fang Cat", "beast", "E", "attacker", "mastery", "位階", "長い 牙の 山ねこ。急所を ねらう"],
  ["f_nightmare", "nm", "ナイトメア", "Nightmare", "demon", "E", "caster", "sleep", "位階", "悪い 夢を 運ぶ 黒い 馬"],
  ["f_ghoulhound", "gh", "グールハウンド", "Ghoul Hound", "undead", "E", "attacker", "weakness", "位階", "くさった 猟犬。かみつくと 力を うばう"],
  ["f_mandragora", "md", "マンドラゴラ", "Mandragora", "plant", "E", "caster", "silence", "位階", "引きぬくと さけぶ 根っこ。声で 呪文を 止める"],
  ["f_haribachi", "hb", "ハリバチ", "Needle Wasp", "insect", "E", "technician", "venom", "位階", "長い 針の はち。猛毒を さす"],
  ["f_holylantern", "hl", "ホーリーランタン", "Holy Lantern", "divine", "E", "healer", "shield", "位階", "聖なる 火の ランタン。光の 盾を 張る"],
  ["f_koripenguin", "kp", "コオリペンギン", "Ice Penguin", "aquatic", "E", "attacker", "frostbite", "位階", "氷の 上を すべる ペンギン。体当たりで こおらせる"],
  ["f_minaraisenshi", "ms", "みならい戦士", "Squire", "humanoid", "E", "attacker", "armor", "位階", "剣を にぎった ばかりの 戦士。よろいだけは 一人前"],
  ["f_kitsunebi", "kb", "キツネビ", "Foxfire", "yokai", "E", "caster", "activation", "位階", "きつねの ともす 火。少ない 力で 術を つかう"],
  // ---- D ----
  ["f_mistjelly", "mj", "ミストゼリー", "Mist Jelly", "jelly", "D", "healer", "regen", "位階", "霧を ふくんだ ゼリー。ひんやり 傷を いやす"],
  ["f_wyvern", "wy", "ワイバーン", "Wyvern", "dragon", "D", "technician", "pierce", "位階", "腕が 翼の 竜。空から 突きさす"],
  ["f_mummy", "mm", "マミー", "Mummy", "undead", "D", "defender", "reincarnation", "位階", "包帯の 墓守。何度でも 起きあがる"],
  ["f_tetsukuzugolem", "tg", "テツクズゴーレム", "Scrap Golem", "mineral", "D", "defender", "armor", "位階", "鉄くずが 集まって 動きだした ゴーレム"],
  ["f_poltergeist", "pt", "ポルターガイスト", "Poltergeist", "spirit", "D", "technician", "mirage", "位階", "物を 飛ばす いたずら霊。すがたが ゆらぐ"],
  ["f_kazekiritsubame", "ks", "カゼキリツバメ", "Windcutter Swallow", "avian", "D", "technician", "blind", "位階", "風を 切る つばめ。砂を まいて 目を くらます"],
  ["f_harisenbon", "hs", "ハリセンボン", "Porcupinefish", "aquatic", "D", "defender", "thorns", "位階", "ふくらむと とげだらけ"],
  ["f_tabinoshudoshi", "tb", "旅の修道士", "Wandering Monk", "humanoid", "D", "healer", "shield", "位階", "旅を しながら 人を いやす 修道士"],
  ["f_kappa", "ka", "カッパ", "Kappa", "yokai", "D", "healer", "regen", "位階", "川の いたずら者。ひみつの 薬を 知って いる"],
  ["f_eyeball", "eb", "アイボール", "Eyeball", "aberration", "D", "technician", "clarity", "位階", "空に うかぶ 大きな 目玉。弱いところを 見ぬく"],
  // ---- C ----
  ["f_tsunoinoshishi", "ti", "ツノイノシシ", "Horned Boar", "beast", "C", "defender", "charge", "位階", "大きな 角の いのしし。力を ためて 突進する"],
  ["f_yaminojujutsushi", "yj", "やみの呪術師", "Dark Hexer", "demon", "C", "caster", "silence", "位階", "言葉を うばう 呪術を つかう"],
  ["f_amethystguardian", "ag", "アメジストガーディアン", "Amethyst Guardian", "mineral", "C", "healer", "immunity", "位階", "紫水晶の 守り手。悪い 状態を はねかえす"],
  ["f_hitokuiso", "hk", "ヒトクイソウ", "Man-Eater", "plant", "C", "attacker", "poison", "位階", "大きな 口の 花。毒の よだれ"],
  ["f_paladin", "pd", "パラディン", "Paladin", "divine", "C", "defender", "ward", "位階", "聖なる 盾の 騎士。いたずらを ふせぐ"],
  ["f_sylph", "sy", "シルフ", "Sylph", "spirit", "C", "caster", "focus", "位階", "風の 精。心を 静めて 魔力を ためる"],
  ["f_sonicfalcon", "sf", "ソニックファルコン", "Sonic Falcon", "avian", "C", "attacker", "daze", "位階", "音より 速い はやぶさ"],
  ["f_ironknight", "ik", "アイアンナイト", "Iron Knight", "humanoid", "C", "defender", "armor", "位階", "鉄の よろいの 重い 騎士"],
  ["f_mirrorghost", "mg", "ミラーゴースト", "Mirror Ghost", "specter", "C", "caster", "counter", "位階", "鏡の 中に すむ 影。攻撃を はね返す"],
  ["f_tentacles", "tt", "テンタクルス", "Tentacles", "aberration", "C", "attacker", "charge", "位階", "からみつく 触手の かたまり"],
  // ---- B ----
  ["f_quartzjelly", "qj", "クォーツゼリー", "Quartz Jelly", "jelly", "B", "defender", "barrier", "位階", "体の 中に 水晶が 育った ゼリー"],
  ["f_homuradragon", "hd", "ホムラドラゴン", "Blaze Dragon", "dragon", "B", "attacker", "burn", "位階", "角に 炎を ともす 竜"],
  ["f_moonfang", "mf", "ムーンファング", "Moon Fang", "beast", "B", "technician", "clarity", "位階", "月の 夜に 狩る 銀の 狼"],
  ["f_gargoyle", "gg", "ガーゴイル", "Gargoyle", "demon", "B", "defender", "counter", "位階", "屋根の 上で 見張る 石の 悪魔"],
  ["f_dullahan", "du", "デュラハン", "Dullahan", "undead", "B", "attacker", "reincarnation", "位階", "首の ない 騎士。たおれても 立ちあがる"],
  ["f_livingmail", "lm", "リビングメイル", "Living Mail", "mineral", "B", "defender", "ward", "位階", "中身の ない よろい。ひとりでに 動く"],
  ["f_orca", "oc", "オルカ", "Orca", "aquatic", "B", "attacker", "freeze", "位階", "海の 王者。凍える 海で 狩る"],
  ["f_tengu", "tu", "テング", "Tengu", "yokai", "B", "technician", "mirage", "位階", "山に すむ 妖魔。風に まぎれて すがたを くらます"],
  ["f_shadowstalker", "sh", "シャドーストーカー", "Shadow Stalker", "specter", "B", "attacker", "frenzy", "位階", "あとを つける 黒い 影。たがが 外れると 止まらない"],
  ["f_chimera", "cm", "キメラ", "Chimera", "aberration", "B", "caster", "clarity", "位階", "いくつもの 獣が まざった 生き物"],
  // ---- A ----
  ["f_tempestdragon", "td", "テンペストドラゴン", "Tempest Dragon", "dragon", "A", "caster", "paralysis", "位階", "嵐を まとう 竜。雷の 息"],
  ["f_griffon", "gf", "グリフォン", "Griffon", "beast", "A", "attacker", "pierce", "位階", "わしの 頭と 獅子の 体"],
  ["f_demonlord", "dl", "デーモンロード", "Demon Lord", "demon", "A", "attacker", "confusion", "位階", "魔界の 公爵。心を みだす"],
  ["f_eldertreant", "et", "エルダートレント", "Elder Treant", "plant", "A", "defender", "regen", "位階", "森で いちばん 古い 木"],
  ["f_kabutoknight", "kk", "カブトナイト", "Beetle Knight", "insect", "A", "defender", "thorns", "位階", "角の 大きな 甲虫の 騎士"],
  ["f_pegasus", "pg", "ペガサス", "Pegasus", "divine", "A", "healer", "blessing", "位階", "白い 翼の 天馬"],
  ["f_undine", "un", "ウンディーネ", "Undine", "spirit", "A", "healer", "focus", "位階", "水の 精。澄んだ 心で いやす"],
  ["f_rocbird", "rb", "ロック鳥", "Roc", "avian", "A", "attacker", "stun", "位階", "大岩を つかんで 落とす 巨大な 鳥"],
  ["f_runeknight", "rk", "ルーンナイト", "Rune Knight", "humanoid", "A", "technician", "pierce", "位階", "魔法の 文字を 刻んだ 剣の 騎士"],
  ["f_nightcrawler", "nc", "ナイトクローラー", "Nightcrawler", "aberration", "A", "technician", "charge", "位階", "夜の 地面を はう 捕食者"],
  // ---- S ----
  ["f_aurorajelly", "aj", "オーロラゼリー", "Aurora Jelly", "jelly", "S", "caster", "frostbite", "位階", "夜空の 光を すいこんだ ゼリー。冷たい 光の 魔法"],
  ["f_manticore", "mt", "マンティコア", "Manticore", "beast", "S", "technician", "venom", "位階", "さそりの 尾を もつ 獣"],
  ["f_diamondgolem", "dg", "ダイヤモンドゴーレム", "Diamond Golem", "mineral", "S", "defender", "barrier", "位階", "ダイヤで できた ゴーレム。何も 通さない"],
  ["f_queenhornet", "qh", "クイーンホーネット", "Queen Hornet", "insect", "S", "healer", "regen", "位階", "はちの 女王。群れを はげまし 傷を ふさぐ"],
  ["f_voltspirit", "vs", "ヴォルトスピリット", "Volt Spirit", "spirit", "S", "caster", "paralysis", "位階", "雷の 精"],
  ["f_phoenix", "px", "フェニックス", "Phoenix", "avian", "S", "healer", "reincarnation", "特殊", "炎の 中から よみがえる 鳥"],
  ["f_whitewhale", "ww", "ホワイトホエール", "White Whale", "aquatic", "S", "defender", "frostbite", "位階", "氷の 海の 白い くじら"],
  ["f_swordsaint", "ss", "ソードセイント", "Sword Saint", "humanoid", "S", "attacker", "mastery", "位階", "剣を きわめた 剣聖"],
  ["f_kyubi", "kv", "キュウビ", "Nine-Tails", "yokai", "S", "caster", "activation", "特殊", "九つの 尾の きつね。底なしの 妖力"],
  ["f_haunthouse", "hh", "ハウントハウス", "Haunted House", "specter", "S", "defender", "counter", "位階", "夜に 歩きだす 古い 館"],
  // ---- SS ----
  ["f_ancientdragon", "ad", "エンシェントドラゴン", "Ancient Dragon", "dragon", "SS", "attacker", "pierce", "4体", "竜の はじまりと いわれる 古い 竜"],
  ["f_lichking", "lk", "リッチキング", "Lich King", "undead", "SS", "caster", "rot", "特殊", "死を こえた 魔法使いの 王"],
  ["f_starcore", "sc", "スターコア", "Star Core", "mineral", "SS", "caster", "immunity", "特殊", "空から 落ちた 星の 心臓"],
  ["f_sennenju", "sn", "千年樹の精", "Spirit of the Millennium Tree", "plant", "SS", "healer", "regen", "特殊", "千年 生きた 木に やどる 精"],
  ["f_gigapede", "gp", "ギガピード", "Gigapede", "insect", "SS", "attacker", "venom", "特殊", "山を ひと巻き する 大むかで"],
  ["f_haloguardian", "hg", "ヘイローガーディアン", "Halo Guardian", "divine", "SS", "healer", "overheal", "4体", "光の 輪を もつ 守護者"],
  ["f_elementallord", "el", "エレメンタルロード", "Elemental Lord", "spirit", "SS", "caster", "focus", "4体", "風・水・雷を したがえる 精霊の 王"],
  ["f_skylord", "sl", "スカイロード", "Sky Lord", "avian", "SS", "technician", "daze", "特殊", "空の すべてを 見おろす 王の 鳥"],
  ["f_nanashi", "ns", "ナナシ", "Nameless", "specter", "SS", "caster", "frenzy", "4体", "名前の ない 怪異。見た 者は 名前を 忘れる"],
  ["f_abysseye", "ae", "アビスアイ", "Abyss Eye", "aberration", "SS", "caster", "clarity", "特殊", "深淵から のぞく 目"],
];

const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS"];
const LO = [1, 8, 16, 26, 36, 46, 56, 66], WIDTH = [7, 8, 10, 10, 10, 10, 10, 14];   // ランクの Lv の はば（fusion.js の RANK_LV と 合わせる）
const nth = {};
// 位階の 中の 順は「その ランクの 何番目か」で 決めた 仮の Lv（野生の 子と まざって ならぶ）
export const ROSTER = ROWS.map(([tree, code, name, en, fam, rank, type, theme, how, note]) => {
  const r = RANKS.indexOf(rank), i = (nth[r] = (nth[r] ?? -1) + 1);
  return { tree, code, name, en, fam, rank: r, type, theme, how, note, lv: LO[r] + Math.floor(((i + 0.5) * WIDTH[r]) / 10) };
});

// 特殊配合：{ a, b, child }（a・b は 種族の ツリー id か「fam:系統」。親の 順は どちらでも）
export const SPECIAL = [
  { a: "e_firechick", b: "fam:divine", child: "f_phoenix" },           // 火の鳥のひな × 神聖系
  { a: "f_kitsunebi", b: "f_tengu", child: "f_kyubi" },                // キツネビ × テング
  { a: "e_boss_captain", b: "fam:demon", child: "f_lichking" },        // 幽霊船長 × 悪魔系
  { a: "f_diamondgolem", b: "fam:spirit", child: "f_starcore" },       // ダイヤモンドゴーレム × 霊系
  { a: "f_eldertreant", b: "fam:divine", child: "f_sennenju" },        // エルダートレント × 神聖系
  { a: "f_queenhornet", b: "fam:dragon", child: "f_gigapede" },        // クイーンホーネット × ドラゴン系
  { a: "e_thunderbird", b: "f_phoenix", child: "f_skylord" },          // 雷鳥 × フェニックス
  { a: "f_eyeball", b: "e_boss_gatekeeper", child: "f_abysseye" },     // アイボール × 深淵の門番
  // はしごに いる 子の 近道
  { a: "e_lavalizard", b: "e_lizard", child: "f_homuradragon" },       // 溶岩トカゲ × クリスタルリザード
  { a: "e_thunderbird", b: "fam:dragon", child: "f_tempestdragon" },   // 雷鳥 × ドラゴン系
  { a: "e_jelly", b: "fam:spirit", child: "f_voltspirit" },            // 電気クラゲ × 霊系
  { a: "e_dolphin", b: "e_whirl", child: "f_whitewhale" },             // 白いイルカ × 大渦の精
  { a: "e_barrel", b: "fam:specter", child: "f_haunthouse" },          // 樽ミミック × 怪異系
  { a: "e_boss_redbeard", b: "e_trident", child: "f_swordsaint" },     // 赤ひげ船長 × トライデントナイト
];
// 4 体配合：{ gp: [祖父母 4 種], child }（両親の それぞれの 親の 組み合わせ。順は どちらでも）
export const FOUR = [
  { gp: ["e_boss_crystal", "e_boss_salamander", "e_boss_irabu", "f_tempestdragon"], child: "f_ancientdragon" },   // 竜 4 種
  { gp: ["e_boss_seagod", "e_boss_sleep", "f_pegasus", "f_paladin"], child: "f_haloguardian" },                    // 神聖 4 種
  { gp: ["f_sylph", "f_undine", "f_voltspirit", "e_whirl"], child: "f_elementallord" },                            // 風・水・雷・渦の 精
  { gp: ["f_haunthouse", "f_mirrorghost", "e_doll", "e_boss_fog"], child: "f_nanashi" },                          // 怪異 4 種
];
