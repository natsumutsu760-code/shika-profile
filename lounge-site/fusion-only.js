// 配合限定の モンスター 240 種（鹿さんの決め：2026-10-25 に F〜EX の 8 段 × 10 種・系統ごとに 5。2026-10-28 に どの ランクも 30 種・系統ごとに 15 へ。いちばん 上は 前は SS）
// 追加の 160 種の 系統は ランクごとに 自由（合計だけ そろえる）。追加の EX 20 種は ぜんぶ 特殊配合か 4 体配合で 生まれる（鹿さんの決め、2026-10-28）
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
  // ---- EX（前は SS） ----
  ["f_ancientdragon", "ad", "エンシェントドラゴン", "Ancient Dragon", "dragon", "EX", "attacker", "pierce", "4体", "竜の はじまりと いわれる 古い 竜"],
  ["f_lichking", "lk", "リッチキング", "Lich King", "undead", "EX", "caster", "rot", "特殊", "死を こえた 魔法使いの 王"],
  ["f_starcore", "sc", "スターコア", "Star Core", "mineral", "EX", "caster", "immunity", "特殊", "空から 落ちた 星の 心臓"],
  ["f_sennenju", "sn", "千年樹の精", "Spirit of the Millennium Tree", "plant", "EX", "healer", "regen", "特殊", "千年 生きた 木に やどる 精"],
  ["f_gigapede", "gp", "ギガピード", "Gigapede", "insect", "EX", "attacker", "venom", "特殊", "山を ひと巻き する 大むかで"],
  ["f_haloguardian", "hg", "ヘイローガーディアン", "Halo Guardian", "divine", "EX", "healer", "overheal", "4体", "光の 輪を もつ 守護者"],
  ["f_elementallord", "el", "エレメンタルロード", "Elemental Lord", "spirit", "EX", "caster", "focus", "4体", "風・水・雷を したがえる 精霊の 王"],
  ["f_skylord", "sl", "スカイロード", "Sky Lord", "avian", "EX", "technician", "daze", "特殊", "空の すべてを 見おろす 王の 鳥"],
  ["f_nanashi", "ns", "ナナシ", "Nameless", "specter", "EX", "caster", "frenzy", "4体", "名前の ない 怪異。見た 者は 名前を 忘れる"],
  ["f_abysseye", "ae", "アビスアイ", "Abyss Eye", "aberration", "EX", "caster", "clarity", "特殊", "深淵から のぞく 目"],
  // ---- F（追加 20 種。2026-10-28） ----
  ["f_berryjelly", "be", "ベリーゼリー", "Berry Jelly", "jelly", "F", "healer", "regen", "位階", "木の実の 汁で できた ゼリー。あまい しずくで 傷を いやす"],
  ["f_uribo", "ur", "ボアレット", "Boarlet", "beast", "F", "attacker", "charge", "位階", "しま模様の 子いのしし。ちょこまか 突進する"],
  ["f_yamane", "ya", "ソムネル", "Somnel", "beast", "F", "technician", "sleep", "位階", "丸まって ねむる 小さな ねずみ。あくびが うつる"],
  ["f_hinekure", "hi", "ボギー", "Bogey", "demon", "F", "technician", "weakness", "位階", "へそまがりの 小悪魔。相手の やる気を くじく"],
  ["f_zombiegaeru", "zo", "ゾンビガエル", "Zombie Frog", "undead", "F", "attacker", "rot", "位階", "沼から はいでた くさった かえる"],
  ["f_koishi", "ko", "ペブリン", "Pebblin", "mineral", "F", "defender", "armor", "位階", "道ばたの 小石に 目が ついた。かたくて 動かない"],
  ["f_sabikugi", "sa", "フェルピン", "Ferpin", "mineral", "F", "technician", "pierce", "位階", "さびた 古くぎの むれ。ちくりと 刺さる"],
  ["f_tsutakko", "ts", "ヘデリン", "Hederin", "plant", "F", "technician", "daze", "位階", "くるくる のびる ツタの 子。まきついて ぼうっと させる"],
  ["f_nanahoshi", "na", "セプティナ", "Septina", "insect", "F", "healer", "blessing", "位階", "七つの 星の てんとう虫。とまった 人に 幸運を はこぶ"],
  ["f_tsumujikaze", "tj", "ヴェントル", "Ventor", "spirit", "F", "technician", "haste", "位階", "小さな つむじ風の 精。すばしこく かけまわる"],
  ["f_yukinko", "yu", "ユキンコ", "Snowling", "spirit", "F", "caster", "frostbite", "位階", "雪の 夜に 生まれる 精。ひやりと する 息を はく"],
  ["f_kogarasu", "kg", "盗っ人ガラス", "Thieving Crow", "avian", "F", "technician", "blind", "位階", "光る 物が すきな 子がらす。羽で 目を ふさぐ"],
  ["f_akubikawasemi", "ak", "あくびカワセミ", "Yawning Kingfisher", "avian", "F", "caster", "sleep", "位階", "水辺で うとうと する かわせみ。あくびで まわりを ねむらせる"],
  ["f_yadokari", "yd", "籠城ヤドカリ", "Holdout Hermit Crab", "aquatic", "F", "defender", "shield", "位階", "貝がらを せおった やどかり。中に こもって 身を 守る"],
  ["f_kakedashikariudo", "ke", "かけだし狩人", "Novice Hunter", "humanoid", "F", "attacker", "mastery", "位階", "弓を おぼえた ばかりの 狩人。一発ごとに うまく なる"],
  ["f_mahoudeshi", "ma", "まほうつかいの弟子", "Wizard's Apprentice", "humanoid", "F", "caster", "burn", "位階", "見習いの 魔法つかい。小さな 火の 呪文が とくい"],
  ["f_azukiarai", "az", "アズキアライ", "Bean Washer", "yokai", "F", "technician", "daze", "位階", "川で あずきを とぐ 音の 妖魔。音を 聞くと ぼうっと する"],
  ["f_madonokage", "mo", "フェネストラ", "Fenestra", "specter", "F", "technician", "blind", "位階", "夜の 窓に うつる 影。ふりむくと だれも いない"],
  ["f_ugomeki", "ug", "ブロビー", "Blobby", "aberration", "F", "defender", "regen", "位階", "ぐねぐね うごめく 肉の かたまり。ちぎれても もどる"],
  ["f_kuchidake", "ku", "マイコファング", "Mycofang", "aberration", "F", "attacker", "weakness", "位階", "かさの 下に 口が ある きのこ。かじって 力を すう"],
  // ---- E（追加 20 種。2026-10-28） ----
  ["f_acidjelly", "ac", "アシッドゼリー", "Acid Jelly", "jelly", "E", "technician", "poison", "位階", "酸の ゼリー。ふれた 所を じわじわ とかす"],
  ["f_lizardman", "li", "リザードマン", "Lizardman", "dragon", "E", "attacker", "pierce", "位階", "うろこの 戦士。槍で 突く"],
  ["f_kyoranokojo", "ky", "狂乱オコジョ", "Frenzied Stoat", "beast", "E", "attacker", "frenzy", "位階", "白い おこじょ。怒ると 手が つけられない"],
  ["f_okibicoyote", "ok", "熾火コヨーテ", "Ember Coyote", "beast", "E", "attacker", "burn", "位階", "毛の 先が 熾火の ように 光る コヨーテ"],
  ["f_lesserdemon", "le", "レッサーデーモン", "Lesser Demon", "demon", "E", "caster", "silence", "位階", "まだ 位の 低い 悪魔。口を ふさぐ 呪いを かける"],
  ["f_skeleton", "sk", "スケルトン", "Skeleton", "undead", "E", "defender", "armor", "位階", "ほねの 兵士。古い 盾を かまえる"],
  ["f_ghoul", "go", "グール", "Ghoul", "undead", "E", "attacker", "weakness", "位階", "墓場を うろつく 屍食い。かみつくと 力が ぬける"],
  ["f_hakaabakigoblin", "ha", "墓暴きゴブリン", "Grave-Robber Goblin", "humanoid", "E", "technician", "rot", "位階", "墓を あらす ゴブリン。くさった 宝を ふりまわす"],
  ["f_hobgoblin", "ho", "ホブゴブリン", "Hobgoblin", "humanoid", "E", "attacker", "charge", "位階", "体の 大きな ゴブリン。こん棒を ふりかぶる"],
  ["f_lesserbug", "ls", "レッサーバグ", "Lesser Bug", "insect", "E", "technician", "venom", "位階", "小さな 毒虫。むれで おそう"],
  ["f_magicalmushroom", "mi", "マジカルマッシュルーム", "Magical Mushroom", "plant", "E", "caster", "confusion", "位階", "ふしぎな 光の きのこ。胞子を すうと 頭が ぐるぐる"],
  ["f_holybell", "hy", "カンパネル", "Campanel", "divine", "E", "healer", "blessing", "位階", "教会の 小さな 鐘。音色が 祝福を はこぶ"],
  ["f_nymph", "ny", "ニンフ", "Nymph", "spirit", "E", "healer", "regen", "位階", "泉の 精。きれいな 水で 傷を いやす"],
  ["f_ketaguridachou", "kt", "けたぐりダチョウ", "Kicking Ostrich", "avian", "E", "attacker", "stun", "位階", "足で けとばす だちょう。けられると 目が 回る"],
  ["f_nokopiranha", "no", "鋸ピラニア", "Sawtooth Piranha", "aquatic", "E", "attacker", "pierce", "位階", "のこぎりの 歯の ピラニア。うろこも かみ切る"],
  ["f_onigaeru", "on", "鬼ガエル", "Ogre Frog", "aquatic", "E", "defender", "counter", "位階", "角の ある 大がえる。たたかれると はね返す"],
  ["f_tsuchinoko", "tc", "ツチノコ", "Tsuchinoko", "yokai", "E", "technician", "paralysis", "位階", "ずんぐりした まぼろしの 蛇。かまれると しびれる"],
  ["f_yonakiishi", "yo", "夜泣き石", "Night-Weeping Stone", "specter", "E", "caster", "daze", "位階", "夜に すすり泣く 石。声を 聞くと ぼうっと する"],
  ["f_medamagumo", "me", "オキュラ", "Ocula", "aberration", "E", "technician", "clarity", "位階", "目玉が いくつも ある くも。すきを 見のがさない"],
  ["f_dorodango", "do", "ゴロム", "Golom", "mineral", "E", "defender", "barrier", "位階", "ころころ ころがる どろだんご。かためて 身を 守る"],
  // ---- D（追加 20 種。2026-10-28） ----
  ["f_drake", "dr", "ドレイク", "Drake", "dragon", "D", "attacker", "burn", "位階", "翼の 小さな 竜。地を かけて 火を はく"],
  ["f_dororyuproton", "dy", "泥竜プロトン", "Mud Dragon Proton", "dragon", "D", "defender", "armor", "位階", "どろを まとった 古い 竜の 子。どろが かわくと 鎧に なる"],
  ["f_iceharpy", "ic", "アイスハーピー", "Ice Harpy", "avian", "D", "caster", "freeze", "位階", "氷の 羽の ハーピー。冷たい 風で こおらせる"],
  ["f_cactusfighter", "ca", "カクタスファイター", "Cactus Fighter", "plant", "D", "attacker", "stun", "位階", "とげの こぶしの サボテン。ワンツーで 気絶させる"],
  ["f_treant", "tr", "トレント", "Treant", "plant", "D", "healer", "regen", "位階", "森を 歩く 木。根から すった 力を わけあたえる"],
  ["f_stinger", "st", "スティンガー", "Stinger", "insect", "D", "attacker", "venom", "位階", "大きな 針の はち。一刺しが 重い"],
  ["f_battleelk", "ba", "バトルエルク", "Battle Elk", "beast", "D", "defender", "charge", "位階", "大角の へらじか。角を かまえて 突っこむ"],
  ["f_rocktiger", "ro", "ロックタイガー", "Rock Tiger", "beast", "D", "attacker", "armor", "位階", "岩の 毛皮の とら。かたい 体で 体当たり"],
  ["f_nimbus", "ni", "ニンバス", "Nimbus", "spirit", "D", "caster", "paralysis", "位階", "雨雲の 精。ぴりぴりする 雨を ふらせる"],
  ["f_tsuisekisurukage", "te", "追跡する影", "Pursuing Shadow", "specter", "D", "technician", "weakness", "位階", "どこまでも ついて くる 影。つかれた 所を ねらう"],
  ["f_animadoll", "an", "アニマドール", "Anima Doll", "specter", "D", "caster", "confusion", "位階", "心が やどった 人形。糸で 相手を あやつる"],
  ["f_demon", "de", "デーモン", "Demon", "demon", "D", "attacker", "confusion", "位階", "ふつうの 悪魔。ささやいて 心を みだす"],
  ["f_magmajelly", "ml", "マグマゼリー", "Magma Jelly", "jelly", "D", "attacker", "burn", "位階", "火山の ゼリー。にえたぎる 体で ぶつかる"],
  ["f_bonearcher", "bo", "ボーンアーチャー", "Bone Archer", "undead", "D", "technician", "pierce", "位階", "ほねの 弓兵。すき間を ぬって 射る"],
  ["f_geode", "ge", "ジオドーラ", "Geodora", "mineral", "D", "technician", "clarity", "位階", "中が 水晶の 石。われ目から 光で 弱点を さがす"],
  ["f_komainu", "km", "コマイヌ", "Guardian Dog", "divine", "D", "defender", "ward", "位階", "社を 守る 石の 犬。わるい 物を 寄せつけない"],
  ["f_sandshark", "sd", "サンドシャーク", "Sand Shark", "aquatic", "D", "attacker", "pierce", "位階", "砂の 中を およぐ さめ。足もとから かみつく"],
  ["f_tsujiuranaishi", "ta", "辻占い師", "Street Fortuneteller", "humanoid", "D", "caster", "confusion", "位階", "町かどの 占い師。運命を 告げて まよわせる"],
  ["f_yamabiko", "ym", "ヤマビコ", "Echo", "yokai", "D", "defender", "counter", "位階", "山の こだまの 妖魔。受けた 声も 力も はね返す"],
  ["f_sandworm", "sw", "サンドワーム", "Sandworm", "aberration", "D", "attacker", "charge", "位階", "砂の 下の 大みみず。ためて 一気に のみこむ"],
  // ---- C（追加 20 種。2026-10-28） ----
  ["f_ogre", "og", "オーガ", "Ogre", "humanoid", "C", "attacker", "stun", "位階", "大きな 人くい鬼。こん棒の 一撃"],
  ["f_succubus", "su", "サキュバス", "Succubus", "demon", "C", "caster", "daze", "位階", "夢に あらわれる 悪魔。ぼうっと させて 力を うばう"],
  ["f_incubus", "in", "インキュバス", "Incubus", "demon", "C", "technician", "weakness", "位階", "ささやく 悪魔。心を ゆるめて 力を ぬく"],
  ["f_banshee", "bn", "バンシー", "Banshee", "specter", "C", "caster", "silence", "位階", "泣きさけぶ 女の 霊。声で 呪文を かき消す"],
  ["f_gozuki", "gz", "牛頭鬼", "Ox-Head", "yokai", "C", "attacker", "charge", "位階", "牛の 頭の 鬼。金棒で 突進する"],
  ["f_mezuki", "mz", "馬頭鬼", "Horse-Head", "yokai", "C", "defender", "armor", "位階", "馬の 頭の 鬼。重い 鎧で 地獄の 門を 守る"],
  ["f_iaikamakiri", "ia", "居合カマキリ", "Iai Mantis", "insect", "C", "attacker", "mastery", "位階", "居合の かまきり。一太刀ごとに さえる"],
  ["f_ogreskeleton", "or", "オーガスケルトン", "Ogre Skeleton", "undead", "C", "defender", "reincarnation", "位階", "オーガの ほね。くずれても 組みなおる"],
  ["f_evilrose", "ev", "エビルローズ", "Evil Rose", "plant", "C", "technician", "thorns", "位階", "黒い ばら。とげの つるで しめつける"],
  ["f_alraune", "al", "アルラウネ", "Alraune", "plant", "C", "caster", "sleep", "位階", "花の 中の 少女。あまい 香りで ねむらせる"],
  ["f_hyoganobanken", "hn", "氷河の番犬", "Glacier Hound", "beast", "C", "defender", "frostbite", "位階", "氷河を 守る 大きな 犬。かみつくと 凍える"],
  ["f_beelzebufo", "bl", "ベルゼブフォ", "Beelzebufo", "aquatic", "C", "attacker", "weakness", "位階", "大昔の 大がえる。のみこんで 力を うばう"],
  ["f_nousuitako", "nu", "脳吸いタコ", "Brain-Sucker Octopus", "aberration", "C", "caster", "confusion", "位階", "頭に はりつく たこ。考えを すいとる"],
  ["f_hotarujelly", "ht", "ホタルゼリー", "Firefly Jelly", "jelly", "C", "technician", "blind", "位階", "おしりが 光る ゼリー。ぴかっと 目を くらます"],
  ["f_suishoyamaarashi", "si", "クリスタリクス", "Crystallix", "mineral", "C", "defender", "thorns", "位階", "背中が 水晶の やまあらし"],
  ["f_tennotsukai", "to", "ルミエル", "Lumiel", "divine", "C", "healer", "shield", "位階", "空から 来る つかい。光の 盾を 張る"],
  ["f_gnome", "gn", "ノーム", "Gnome", "spirit", "C", "defender", "armor", "位階", "土の 精。地面を かためて 身を 守る"],
  ["f_yotaka", "yt", "ストリクス", "Strix", "avian", "C", "caster", "sleep", "位階", "夜に 鳴く 伝説の 鳥。鳴き声で ねむりに さそう"],
  ["f_troll", "tl", "トロール", "Troll", "humanoid", "C", "defender", "regen", "位階", "大きな 体の トロール。傷が すぐ ふさがる"],
  ["f_tetsukuimukade", "tk", "鉄喰いムカデ", "Iron-Eater Centipede", "insect", "C", "technician", "weakness", "位階", "鉄を くう むかで。鎧を かじって もろく する"],
  // ---- B（追加 20 種。2026-10-28） ----
  ["f_bloodjelly", "bj", "ブラッドゼリー", "Blood Jelly", "jelly", "B", "attacker", "frenzy", "位階", "赤い ゼリー。血を すうほど あばれる"],
  ["f_elderlizardman", "ed", "エルダーリザードマン", "Elder Lizardman", "dragon", "B", "attacker", "mastery", "位階", "年を へた うろこの 戦士。槍の 技を きわめた"],
  ["f_greatdemon", "gr", "グレートデーモン", "Great Demon", "demon", "B", "attacker", "confusion", "位階", "大きな 角の 悪魔。力で ねじふせる"],
  ["f_skullknight", "sg", "スカルナイト", "Skull Knight", "undead", "B", "defender", "reincarnation", "位階", "どくろの 騎士。主の いない 城を 守る"],
  ["f_suishohebi", "so", "バジリスク", "Basilisk", "mineral", "B", "technician", "clarity", "位階", "水晶の 体の 大蛇。すきとおる 目で 弱点を 見ぬく"],
  ["f_haganearma", "he", "アルマドラス", "Armadras", "mineral", "B", "defender", "barrier", "位階", "はがねの こうらの アルマジロ。丸まると 何も 通さない"],
  ["f_youju", "yb", "妖樹", "Bewitched Tree", "plant", "B", "caster", "confusion", "位階", "人を まよわせる 古い 木。枝が ゆれると 道を 忘れる"],
  ["f_hakugekifungus", "hu", "迫撃ファンガス", "Mortar Fungus", "plant", "B", "attacker", "poison", "位階", "胞子の 玉を うちだす きのこ"],
  ["f_yoroimushi", "yr", "カラパクス", "Carapax", "insect", "B", "defender", "armor", "位階", "分厚い 殻の 甲虫。まるで 動く とりで"],
  ["f_tetsusasori", "tf", "鉄鋏サソリ", "Iron-Claw Scorpion", "insect", "B", "attacker", "venom", "位階", "鉄の はさみの さそり。尾の 毒が 重い"],
  ["f_unicorn", "ui", "ユニコーン", "Unicorn", "divine", "B", "healer", "clarity", "位階", "一本角の 白い 馬。角で けがれを はらう"],
  ["f_tenbinnomamorite", "th", "天秤の守り手", "Keeper of Scales", "divine", "B", "defender", "ward", "位階", "天秤を もつ 守り手。いたずらを つりあいで はね返す"],
  ["f_kagerou", "kc", "ファタモルガナ", "Fata Morgana", "spirit", "B", "technician", "mirage", "位階", "ゆらめく かげろうの 精。すがたが さだまらない"],
  ["f_thunderhawk", "tw", "サンダーホーク", "Thunder Hawk", "avian", "B", "attacker", "paralysis", "位階", "雷を まとう たか。急降下で しびれさせる"],
  ["f_tekkougame", "tp", "タラスク", "Tarasque", "aquatic", "B", "defender", "armor", "位階", "鉄の こうらを もつ 大がめの 魔物"],
  ["f_rokurokubi", "ru", "ロクロクビ", "Long-Neck", "yokai", "B", "technician", "daze", "位階", "首が のびる 妖魔。夜中に のぞきこむ"],
  ["f_wraith", "wr", "レイス", "Wraith", "specter", "B", "caster", "weakness", "位階", "黒い ころもの 亡霊。ふれた 者の 力を すいとる"],
  ["f_noroinoshozoga", "nr", "呪いの肖像画", "Cursed Portrait", "specter", "B", "technician", "blind", "位階", "目が 動く 肖像画。見つめられると 目の 前が 暗く なる"],
  ["f_kuwaru", "kw", "クワール", "Quarl", "aberration", "B", "technician", "mirage", "位階", "背中に 触手の ある 獣。すがたを ずらして 見せる"],
  ["f_doppelganger", "dp", "ドッペルゲンガー", "Doppelganger", "aberration", "B", "technician", "counter", "位階", "相手と 同じ すがたの 怪物。受けた 技を まねて 返す"],
  // ---- A（追加 20 種。2026-10-28） ----
  ["f_seaserpent", "se", "シーサーペント", "Sea Serpent", "aquatic", "A", "attacker", "freeze", "位階", "冷たい 海の 大海へび。巻きついて 凍らせる"],
  ["f_ikazuchijelly", "iz", "イカズチゼリー", "Thunder Jelly", "jelly", "A", "caster", "paralysis", "位階", "雷を ためた ゼリー。ふれると しびれる"],
  ["f_shadowjelly", "sb", "シャドウゼリー", "Shadow Jelly", "jelly", "A", "technician", "blind", "位階", "影に とける 黒い ゼリー"],
  ["f_hydra", "hr", "ヒドラ", "Hydra", "dragon", "A", "technician", "venom", "位階", "いくつもの 首の 毒竜。首ごとに 毒を はく"],
  ["f_haganeryu", "hc", "アダマス", "Adamas", "dragon", "A", "defender", "armor", "位階", "はがねの うろこの 竜"],
  ["f_minotaur", "mn", "ミノタウロス", "Minotaur", "beast", "A", "attacker", "charge", "位階", "牛の 頭の 巨人。大斧で 突進する"],
  ["f_cycloskeleton", "cy", "サイクロスケルトン", "Cyclops Skeleton", "undead", "A", "defender", "stun", "位階", "一つ目の 巨人の ほね。大きな こぶしで ゆさぶる"],
  ["f_watashimori", "wa", "冥河の渡し守", "Ferryman of the Dark River", "undead", "A", "caster", "rot", "位階", "死者の 川の 渡し守。さおで 魂を はこぶ"],
  ["f_magmacore", "mc", "イグニコア", "Ignicore", "mineral", "A", "caster", "burn", "位階", "地の 底で 燃える 岩の 心臓"],
  ["f_yadorigikishi", "yi", "宿り木の騎士", "Mistletoe Knight", "plant", "A", "defender", "regen", "位階", "宿り木に 守られた 騎士。根を はって 立ちつづける"],
  ["f_shadowmoth", "sm", "ノクトゥア", "Noctua", "insect", "A", "caster", "sleep", "位階", "夜の 大蛾。鱗粉で ねむらせる"],
  ["f_kanetsukitenshi", "ki", "鐘つき天使", "Bell-Ringer Angel", "divine", "A", "healer", "shield", "位階", "大きな 鐘を 鳴らす 天使。音が 盾に なる"],
  ["f_frostqueen", "fr", "フロストクイーン", "Frost Queen", "spirit", "A", "caster", "frostbite", "位階", "氷の 女王の 精。ふれる 物 すべてを 凍えさせる"],
  ["f_gekkounosei", "gk", "ルナリア", "Lunaria", "spirit", "A", "healer", "regen", "位階", "月の 光の 精。夜の あいだ 傷を いやす"],
  ["f_genwakukujaku", "gw", "幻惑孔雀", "Dazzling Peacock", "avian", "A", "technician", "daze", "位階", "羽の 目玉もようで 目を 回させる くじゃく"],
  ["f_haganedori", "hf", "ステュンファロス", "Stymphalos", "avian", "A", "defender", "thorns", "位階", "はがねの 羽を もつ 伝説の 怪鳥。さわると 切れる"],
  ["f_cyclops", "cc", "サイクロプス", "Cyclops", "humanoid", "A", "attacker", "stun", "位階", "一つ目の 巨人。大岩を なげる"],
  ["f_yukionna", "yk", "ユキオンナ", "Snow Woman", "yokai", "A", "caster", "frostbite", "位階", "ふぶきの 夜の 妖魔。息で 凍えさせる"],
  ["f_kageboushi", "kh", "影法師", "Shadow Double", "specter", "A", "technician", "mirage", "位階", "足もとから 立ちあがる 影。どれが 本物か わからない"],
  ["f_majuroach", "mr", "魔獣ローチェア", "Beast Roachair", "aberration", "A", "attacker", "frenzy", "位階", "甲羅と 牙の 魔獣。あばれだすと 止まらない"],
  // ---- S（追加 20 種。2026-10-28） ----
  ["f_mizuchi", "mu", "大河の主ミズチ", "Mizuchi, Lord of the River", "dragon", "S", "healer", "freeze", "位階", "大河の 主の 竜。清い 水で いやし、冷たい 水で こおらせる"],
  ["f_stardustjelly", "sr", "スターダストゼリー", "Stardust Jelly", "jelly", "S", "healer", "blessing", "位階", "星くずを とじこめた ゼリー。きらめきが 祝福に なる"],
  ["f_granjelly", "ga", "グランゼリー", "Grand Jelly", "jelly", "S", "defender", "reincarnation", "位階", "山ほど 大きな ゼリー。くだけても 寄りあつまる"],
  ["f_meiryu", "my", "冥竜モルヴァーン", "Morvane the Nether Dragon", "dragon", "S", "caster", "rot", "位階", "死の 国の 竜。息が 魂を くさらせる"],
  ["f_akatsukiryu", "aa", "暁竜アルバトス", "Albatos the Dawn Dragon", "dragon", "S", "healer", "regen", "位階", "夜明けの 光の 竜。朝日で 傷を いやす"],
  ["f_makainosaisho", "mk", "魔界の宰相", "Chancellor of the Abyss", "demon", "S", "technician", "silence", "位階", "魔界の 王を ささえる 知恵者。言葉を うばう"],
  ["f_vampire", "va", "ヴァンパイア", "Vampire", "undead", "S", "attacker", "weakness", "位階", "夜の 貴族。血を すって 力を うばう"],
  ["f_intetsunokishi", "it", "隕鉄の騎士", "Meteor Iron Knight", "mineral", "S", "attacker", "pierce", "位階", "星の 鉄で できた 騎士。どんな 鎧も 貫く"],
  ["f_voidbug", "vo", "ヴォイドバグ", "Void Bug", "insect", "S", "caster", "silence", "位階", "虚空から わいた 虫。まわりの 音が 消える"],
  ["f_archangel", "ar", "アークエンジェル", "Archangel", "divine", "S", "caster", "blessing", "位階", "天使の 長。祝福の 光を ふらせる"],
  ["f_seijishi", "sp", "聖獅子レグルス", "Regulus the Holy Lion", "divine", "S", "attacker", "blessing", "位階", "金の たてがみの 聖なる 獅子"],
  ["f_tokinosei", "tq", "テンポラ", "Tempora", "spirit", "S", "technician", "haste", "位階", "時を あやつる 精。ひとりだけ 速く 動く"],
  ["f_stormcondor", "sq", "ストームコンドル", "Storm Condor", "avian", "S", "attacker", "stun", "位階", "嵐を よぶ 大きな はげわし"],
  ["f_kraken", "kd", "クラーケン", "Kraken", "aquatic", "S", "technician", "weakness", "位階", "船を しずめる 大だこ。足で しめあげる"],
  ["f_ryuguunotsukai", "ry", "竜宮の使者", "Envoy of the Dragon Palace", "aquatic", "S", "healer", "regen", "位階", "深い 海から あらわれる 長い 魚。めでたい しらせを はこぶ"],
  ["f_archmage", "ah", "アークメイジ", "Archmage", "humanoid", "S", "caster", "burn", "位階", "魔法を きわめた 大魔導師"],
  ["f_nurarihyon", "nh", "ヌラリヒョン", "Nurarihyon", "yokai", "S", "caster", "confusion", "位階", "妖魔の 総大将。いつのまにか 上座に すわる"],
  ["f_tasogarenodouke", "tv", "黄昏の道化", "Twilight Jester", "specter", "S", "technician", "confusion", "位階", "夕暮れに あらわれる 道化。笑いながら 心を みだす"],
  ["f_hoshikurai", "hj", "ステラヴォア", "Stellavore", "aberration", "S", "caster", "clarity", "位階", "星を のみこむ 異形。見えない 物まで 見とおす"],
  ["f_hikarinoikusaotome", "hm", "ヴァルキリー", "Valkyrie", "divine", "S", "attacker", "blessing", "位階", "光の 槍の 乙女。祝福を うけて 戦う"],
  // ---- EX（追加 20 種。2026-10-28） ----
  ["f_meifunobanken", "mb", "冥狼", "Nether Wolf", "beast", "EX", "attacker", "burn", "特殊", "死者の 国の 門を 守る 三つ首の 狼"],
  ["f_baphomet", "bp", "バフォメット", "Baphomet", "demon", "EX", "caster", "sickness", "特殊", "山羊の 角の 大悪魔。黒い 儀式を つかさどる"],
  ["f_lilith", "ll", "リリス", "Lilith", "demon", "EX", "caster", "daze", "特殊", "夜の 魔性の 母。夢魔たちの 女王"],
  ["f_mephisto", "mp", "メフィスト", "Mephisto", "demon", "EX", "technician", "silence", "特殊", "契約を もちかける 悪魔。言葉で 魂を しばる"],
  ["f_protogaia", "pr", "原竜プロトゲア", "Primal Dragon Protogaia", "dragon", "EX", "defender", "armor", "特殊", "大地そのものに なった 泥竜。山が 歩いて いる よう"],
  ["f_baranojoou", "bu", "茨の獣ロザリス", "Rosalis the Thorn Beast", "plant", "EX", "technician", "thorns", "特殊", "森の ばらと 茨が 寄りあつまって 生まれた 獣"],
  ["f_voidqueen", "vi", "ヴォイドクイーン", "Void Queen", "insect", "EX", "caster", "silence", "特殊", "虚空の 虫たちの 女王。まわりの 世界が 静まる"],
  ["f_kaishounoou", "kf", "海嘯の王タイダロス", "Tidalos, King of the Tidal Bore", "aquatic", "EX", "attacker", "freeze", "4体", "大波を ひきつれる 海の 王"],
  ["f_genshojelly", "gs", "原初ゼリー", "Primordial Jelly", "jelly", "EX", "healer", "regen", "4体", "すべての ゼリーの はじまり。何度でも ぷるんと もどる"],
  ["f_eiyuuou", "ei", "英雄王", "Hero King", "humanoid", "EX", "attacker", "mastery", "特殊", "伝説に 語られる 英雄の 王"],
  ["f_daikishin", "da", "大鬼神", "Great Oni God", "yokai", "EX", "attacker", "charge", "特殊", "牛頭と 馬頭を したがえる 鬼の 神"],
  ["f_nue", "ne", "ヌエ", "Nue", "yokai", "EX", "technician", "paralysis", "特殊", "猿の 顔・とらの 手足・へびの 尾の 妖魔。夜に 不吉な 声で 鳴く"],
  ["f_nagekinojoou", "ng", "嘆きの女王ラメンタ", "Lamenta, Queen of Lament", "specter", "EX", "caster", "silence", "特殊", "すべての 嘆きを あつめた 女王の 霊"],
  ["f_konton", "kj", "混沌の落とし子", "Spawn of Chaos", "aberration", "EX", "attacker", "frenzy", "4体", "形の さだまらない 異形。見る たびに 姿が かわる"],
  ["f_gashadokuro", "gd", "ガシャドクロ", "Gashadokuro", "undead", "EX", "defender", "reincarnation", "特殊", "巨人の ほねが 組みあがった 大どくろ"],
  ["f_raiunnoou", "ra", "雷竜フルグラ", "Fulgura the Thunder Dragon", "spirit", "EX", "caster", "paralysis", "特殊", "雷雲が 竜の 形に なった 精。雲の 体に 稲妻が はしる"],
  ["f_byakuyanooowashi", "by", "ソルスティア", "Solstia", "avian", "EX", "technician", "frostbite", "特殊", "沈まない 太陽の 空を とぶ 大わし"],
  ["f_furuichinokemono", "fu", "古い血の獣", "Beast of Old Blood", "beast", "EX", "attacker", "frenzy", "特殊", "古い 血に 目ざめた 獣。月の 夜に 理性を 失う"],
  ["f_ougonnokyozou", "ou", "オーレリオ", "Aurelio", "mineral", "EX", "defender", "barrier", "特殊", "宝の 山から 立ちあがった 黄金の 像"],
  ["f_amakakeruseijuu", "am", "隠された聖獣", "Hidden Holy Beast", "divine", "EX", "healer", "blessing", "特殊", "人の 前に めったに すがたを 見せない 聖なる 獣。ペガサスと グリフォンの 血を ひく"],
];


// インフェルノの 悪魔 34 体（鹿物語の インフェルノ「炎の 悪魔祓い」。鹿さんの 決め、2026-11-07）
// ゴエティアの 30 体と 大罪の 4 体。上の 240 種とは 別枠（ランクごとの 30・系統ごとの 15 の 数に 入れない）。系統は みな 悪魔系
// ランクは ゴエティアの 位：王 S・君主と 公爵 A・侯爵と 伯爵 B・総裁 C・大罪 EX。ぜんぶ 特殊な レシピ（下の SPECIAL・FOUR）だけで 生まれる
const INFERNO = [
  ["f_bael", "bb", "バアル", "Bael", "demon", "S", "technician", "mirage", "特殊", "ゴエティアの 第一の 王。ひきがえる・人・猫の 三つの 頭。すがたを 消す 術を さずける（赤い 炎）"],
  ["f_paimon", "pa", "パイモン", "Paimon", "demon", "S", "caster", "confusion", "特殊", "楽隊を ひきつれ ひとこぶらくだに のる 王。あらゆる 学問と 芸を 教える（金に 近い 白い 炎）"],
  ["f_beleth", "bt", "ベレト", "Beleth", "demon", "S", "attacker", "daze", "特殊", "青白い 馬に のる おそろしい 王。前を ゆく ラッパの 音で 相手を ふるえさせる（紫の 炎）"],
  ["f_purson", "pu", "プルソン", "Purson", "demon", "S", "technician", "clarity", "特殊", "獅子の 顔で まむしを 持つ 王。かくされた 物と 過去・未来を 知る（緑の 炎）"],
  ["f_vassago", "vg", "ウァサゴ", "Vassago", "demon", "A", "healer", "blessing", "特殊", "やさしい 性質の 君主。なくし物を 見つけ、過去と 未来を 告げる（白い 炎）"],
  ["f_sitri", "sv", "シトリー", "Sitri", "demon", "A", "caster", "daze", "特殊", "豹の 頭と グリフォンの 翼の 君主。見た 者の 心を まどわせる（赤い 炎）"],
  ["f_agares", "as", "アガレス", "Agares", "demon", "A", "attacker", "stun", "特殊", "大鷹を 手に わにに のる 老いた 公爵。地震を おこす（緑の 炎）"],
  ["f_barbatos", "bs", "バルバトス", "Barbatos", "demon", "A", "technician", "pierce", "特殊", "狩人と 四人の 王を つれた 公爵。けものの 声を 聞き、弓で ねらう（緑の 炎）"],
  ["f_gusion", "gu", "グシオン", "Gusion", "demon", "A", "healer", "ward", "特殊", "犬の 頭の 公爵。あらそいを しずめ、仲なおりを とりもつ（青い 炎）"],
  ["f_eligos", "eg", "エリゴス", "Eligos", "demon", "A", "attacker", "mastery", "特殊", "槍と 旗を もつ 騎士の 公爵。戦の ゆくえを 知る（赤い 炎）"],
  ["f_zepar", "ze", "ゼパル", "Zepar", "demon", "A", "technician", "weakness", "特殊", "赤い よろいの 兵の 公爵。相手の 力を くじく（赤い 炎）"],
  ["f_bathin", "bh", "バティン", "Bathin", "demon", "A", "technician", "haste", "特殊", "へびの 尾で 青白い 馬に のる 公爵。人を 一瞬で 遠くへ はこぶ（白い 炎）"],
  ["f_sallos", "sx", "サレオス", "Sallos", "demon", "A", "defender", "barrier", "特殊", "公爵の 冠で わにに のる 兵。おだやかで、争いを このまない（青い 炎）"],
  ["f_aim", "ai", "アイム", "Aim", "demon", "A", "caster", "burn", "特殊", "へび・人・子牛の 三つの 頭で まむしに のる 公爵。たいまつで 町を 燃やす（赤い 炎）"],
  ["f_bune", "bc", "ブネ", "Bune", "demon", "A", "defender", "reincarnation", "特殊", "犬・グリフォン・人の 三つの 頭の 竜の 公爵。死者の 眠る 場所を うつす（紫の 炎）"],
  ["f_berith", "bi", "ベリト", "Berith", "demon", "A", "technician", "confusion", "特殊", "赤い 馬に のる 赤い 兵の 公爵。金属を 金に かえるが、うそつき（金に 近い 赤い 炎）"],
  ["f_astaroth", "at", "アスタロト", "Astaroth", "demon", "A", "caster", "sickness", "特殊", "竜に のり まむしを 持つ 堕ちた 天使の 公爵。息に 毒気が ある（紫の 炎）"],
  ["f_gamigin", "gm", "ガミジン", "Gamigin", "demon", "B", "caster", "freeze", "特殊", "小さな 馬の すがたの 侯爵。おぼれた 者の たましいを よびだす（青い 炎）"],
  ["f_amon", "ao", "アモン", "Amon", "demon", "B", "attacker", "burn", "特殊", "へびの 尾の 狼に からすの 頭。口から 炎を はく 侯爵（赤い 炎）"],
  ["f_leraje", "lr", "レラジェ", "Leraje", "demon", "B", "technician", "rot", "特殊", "緑の 服の 弓の 侯爵。矢の 傷を くさらせる（緑の 炎）"],
  ["f_naberius", "nb", "ナベリウス", "Naberius", "demon", "B", "technician", "silence", "特殊", "三つ首の 犬とも 黒い 鶴とも いわれる 侯爵。しゃがれ声で 口を ふさぐ（紫の 炎）"],
  ["f_ronove", "rn", "ロノウェ", "Ronove", "demon", "B", "caster", "focus", "特殊", "杖を もつ 怪物の 侯爵。ことばを 教え、しもべを あたえる（白い 炎）"],
  ["f_forneus", "fo", "フォルネウス", "Forneus", "demon", "B", "caster", "frostbite", "特殊", "大きな 海の 怪物の 侯爵。弁舌で 敵まで 味方に する（青い 炎）"],
  ["f_marchosias", "mh", "マルコシアス", "Marchosias", "demon", "B", "attacker", "charge", "特殊", "グリフォンの 翼と へびの 尾の 狼の 侯爵。炎を はく 強い 戦士（赤い 炎）"],
  ["f_furfur", "ff", "フルフル", "Furfur", "demon", "B", "caster", "paralysis", "特殊", "燃える 尾と 翼の 鹿の 伯爵。雷と 稲妻を おこす（白い 炎）"],
  ["f_ipos", "io", "イポス", "Ipos", "demon", "B", "attacker", "frenzy", "特殊", "獅子の 頭・がちょうの 足・うさぎの 尾の 伯爵。勇気を さずける（金に 近い 白い 炎）"],
  ["f_marbas", "mq", "マルバス", "Marbas", "demon", "C", "technician", "sickness", "特殊", "大きな 獅子の すがたの 総裁。病を おこし、病を なおす（緑の 炎）"],
  ["f_buer", "bf", "ブエル", "Buer", "demon", "C", "healer", "regen", "特殊", "車輪の ように 足が 並ぶ 獅子の 総裁。薬草を 教え、傷を いやす（緑の 炎）"],
  ["f_botis", "bg", "ボティス", "Botis", "demon", "C", "technician", "venom", "特殊", "醜い まむしの すがたで あらわれる 総裁。剣と 角を もつ（紫の 炎）"],
  ["f_morax", "mx", "モラクス", "Morax", "demon", "C", "defender", "armor", "特殊", "人の 顔の 牡牛の 総裁。星と 石の ふしぎを 知る（青い 炎）"],
  ["f_mammon", "mv", "マモン", "Mammon", "demon", "EX", "technician", "weakness", "特殊", "強欲の 大罪の 悪魔。金貨の 雨を ふらせ、すべてを 自分の 物に する（金の 炎）"],
  ["f_beelzebub", "bz", "ベルゼブブ", "Beelzebub", "demon", "EX", "attacker", "poison", "特殊", "暴食の 大罪の 悪魔。はえの 王。何でも のみこむ（緑の 炎）"],
  ["f_leviathan", "lv", "レヴィアタン", "Leviathan", "demon", "EX", "defender", "freeze", "特殊", "嫉妬の 大罪の 悪魔。海の 大蛇。人の いちばん 良い 物を まねて うばう（青い 炎）"],
  ["f_lucifer", "lu", "ルシファー", "Lucifer", "demon", "EX", "attacker", "burn", "特殊", "傲慢の 大罪の 悪魔。堕ちた 明けの 明星。運命を 書き換える（白い 炎）"],
];

const RANKS = ["F", "E", "D", "C", "B", "A", "S", "EX"];
const LO = [1, 8, 16, 26, 36, 46, 56, 66], WIDTH = [7, 8, 10, 10, 10, 10, 10, 14];   // ランクの Lv の はば（ランクの 中で ならべる ための 仮の Lv）
const nth = {}, CNT = RANKS.map((r) => ROWS.filter((x) => x[5] === r).length);   // ランクごとの 数（いまは 30）
// 位階の 中の 順は「その ランクの 何番目か」で 決めた 仮の Lv（野生の 子と まざって ならぶ）
export const ROSTER = ROWS.map(([tree, code, name, en, fam, rank, type, theme, how, note]) => {
  const r = RANKS.indexOf(rank), i = (nth[r] = (nth[r] ?? -1) + 1);
  return { tree, code, name, en, fam, rank: r, type, theme, how, note, lv: LO[r] + Math.floor(((i + 0.5) * WIDTH[r]) / CNT[r]) };
});
// インフェルノの 悪魔（別枠。grp: "inferno"）。仮の Lv は 同じ ランクの 中で ならべる だけ
const nthI = {}, CNTI = RANKS.map((r) => INFERNO.filter((x) => x[5] === r).length);
ROSTER.push(...INFERNO.map(([tree, code, name, en, fam, rank, type, theme, how, note]) => {
  const r = RANKS.indexOf(rank), i = (nthI[r] = (nthI[r] ?? -1) + 1);
  return { tree, code, name, en, fam, rank: r, type, theme, how, note, grp: "inferno", lv: LO[r] + Math.floor(((i + 0.5) * WIDTH[r]) / CNTI[r]) };
}));

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
  // 追加の EX（2026-10-28。鹿さんの決め：EX は 特殊な レシピで。親の テーマから 自然に つながる 組み合わせ）
  { a: "f_hyoganobanken", b: "f_watashimori", child: "f_meifunobanken" },   // 氷河の番犬 × 冥河の渡し守（死者の 川の 番犬）
  { a: "f_greatdemon", b: "f_battleelk", child: "f_baphomet" },             // グレートデーモン × バトルエルク（大きな 角の 悪魔）
  { a: "f_succubus", b: "f_incubus", child: "f_lilith" },                   // サキュバス × インキュバス（夢魔たちの 母）
  { a: "f_makainosaisho", b: "e_witch", child: "f_mephisto" },              // 魔界の宰相 × 古井戸の魔女（契約の 悪魔）
  { a: "f_dororyuproton", b: "fam:mineral", child: "f_protogaia" },         // 泥竜プロトン × 鉱物系（大地に なった 竜）
  { a: "f_evilrose", b: "f_alraune", child: "f_baranojoou" },               // エビルローズ × アルラウネ（ばらと 花の 少女）
  { a: "f_voidbug", b: "f_queenhornet", child: "f_voidqueen" },             // ヴォイドバグ × クイーンホーネット（虚空の 虫の 女王）
  { a: "f_swordsaint", b: "f_archmage", child: "f_eiyuuou" },               // ソードセイント × アークメイジ（剣と 魔法の 英雄）
  { a: "f_gozuki", b: "f_mezuki", child: "f_daikishin" },                   // 牛頭鬼 × 馬頭鬼（二人を したがえる 鬼の 神）
  { a: "f_chimera", b: "fam:yokai", child: "f_nue" },                       // キメラ × 妖魔系（いくつもの 獣が まざった 妖魔）
  { a: "f_banshee", b: "f_wraith", child: "f_nagekinojoou" },               // バンシー × レイス（泣きさけぶ 霊と 亡霊）
  { a: "f_cycloskeleton", b: "f_ogreskeleton", child: "f_gashadokuro" },    // サイクロスケルトン × オーガスケルトン（巨人の ほねが 組みあがる）
  { a: "f_nimbus", b: "f_voltspirit", child: "f_raiunnoou" },               // ニンバス × ヴォルトスピリット（雨雲と 雷）
  { a: "f_rocbird", b: "f_iceharpy", child: "f_byakuyanooowashi" },         // ロック鳥 × アイスハーピー（極北の 空の 大わし）
  { a: "f_moonfang", b: "f_vampire", child: "f_furuichinokemono" },         // ムーンファング × ヴァンパイア（月の 夜の 獣と 古い 血）
  { a: "f_livingmail", b: "e_goldcrab", child: "f_ougonnokyozou" },         // リビングメイル × 金貨ガニ（動く よろいと 黄金）
  { a: "f_pegasus", b: "f_griffon", child: "f_amakakeruseijuu" },           // ペガサス × グリフォン（天を かける 二つの 血）
  // インフェルノの 悪魔（2026-11-07。鹿さんの 決め：ぜんぶ 特殊な レシピ。伝承の 姿や 力に ちなんだ 組み合わせ）
  { a: "f_beelzebufo", b: "f_kuwaru", child: "f_bael" },                    // バアル＝ベルゼブフォ × クワール（ひきがえるの 頭と、すがたを くらます 猫の 獣）
  { a: "e_bard", b: "f_demonlord", child: "f_paimon" },                     // パイモン＝迷子の吟遊詩人 × デーモンロード（楽隊を つれた 王）
  { a: "f_nightmare", b: "f_holybell", child: "f_beleth" },                 // ベレト＝ナイトメア × カンパネル（馬に のり、前で 鳴る 音）
  { a: "f_manticore", b: "f_suishohebi", child: "f_purson" },               // プルソン＝マンティコア × バジリスク（獅子の 顔と まむし）
  { a: "f_tsujiuranaishi", b: "fam:demon", child: "f_vassago" },            // ウァサゴ＝辻占い師 × 悪魔系（なくし物と 未来を 告げる）
  { a: "f_griffon", b: "f_succubus", child: "f_sitri" },                    // シトリー＝グリフォン × サキュバス（グリフォンの 翼・心を まどわす）
  { a: "f_elderlizardman", b: "f_sonicfalcon", child: "f_agares" },         // アガレス＝エルダーリザードマン × ソニックファルコン（わにと 大鷹）
  { a: "f_kakedashikariudo", b: "fam:demon", child: "f_barbatos" },         // バルバトス＝かけだし狩人 × 悪魔系（狩人を つれた 公爵）
  { a: "f_tabinoshudoshi", b: "fam:demon", child: "f_gusion" },             // グシオン＝旅の修道士 × 悪魔系（仲なおりを とりもつ）
  { a: "f_ironknight", b: "fam:demon", child: "f_eligos" },                 // エリゴス＝アイアンナイト × 悪魔系（騎士の 公爵）
  { a: "f_minaraisenshi", b: "f_incubus", child: "f_zepar" },               // ゼパル＝みならい戦士 × インキュバス（兵の すがた・力を くじく）
  { a: "f_pegasus", b: "fam:demon", child: "f_bathin" },                    // バティン＝ペガサス × 悪魔系（青白い 馬・一瞬で はこぶ）
  { a: "f_lizardman", b: "fam:demon", child: "f_sallos" },                  // サレオス＝リザードマン × 悪魔系（わにに のる 兵）
  { a: "f_okibicoyote", b: "f_hydra", child: "f_aim" },                     // アイム＝熾火コヨーテ × ヒドラ（三つの 頭と たいまつの 火）
  { a: "f_wyvern", b: "f_watashimori", child: "f_bune" },                   // ブネ＝ワイバーン × 冥河の渡し守（竜の すがた・死者の 場所を うつす）
  { a: "e_goldcrab", b: "fam:demon", child: "f_berith" },                   // ベリト＝金貨ガニ × 悪魔系（金属を 金に かえる）
  { a: "f_tennotsukai", b: "f_drake", child: "f_astaroth" },                // アスタロト＝ルミエル × ドレイク（竜に のる 堕ちた 天使）
  { a: "f_nightmare", b: "e_ghostsailor", child: "f_gamigin" },             // ガミジン＝ナイトメア × 幽霊水夫（小さな 馬・おぼれた 者の たましい）
  { a: "f_okibicoyote", b: "f_kogarasu", child: "f_amon" },                 // アモン＝熾火コヨーテ × 盗っ人ガラス（炎を はく 狼と からすの 頭）
  { a: "f_bonearcher", b: "fam:demon", child: "f_leraje" },                 // レラジェ＝ボーンアーチャー × 悪魔系（傷を くさらせる 弓）
  { a: "f_ghoulhound", b: "f_yotaka", child: "f_naberius" },                // ナベリウス＝グールハウンド × ストリクス（犬と 黒い 鳥）
  { a: "f_majuroach", b: "f_lesserdemon", child: "f_ronove" },              // ロノウェ＝魔獣ローチェア × レッサーデーモン（怪物の すがた・しもべを あたえる）
  { a: "f_seaserpent", b: "e_siren", child: "f_forneus" },                  // フォルネウス＝シーサーペント × セイレーン（海の 怪物と 声の 力）
  { a: "f_griffon", b: "f_moonfang", child: "f_marchosias" },               // マルコシアス＝グリフォン × ムーンファング（グリフォンの 翼の 狼）
  { a: "f_battleelk", b: "f_thunderhawk", child: "f_furfur" },              // フルフル＝バトルエルク × サンダーホーク（翼の 鹿・雷）
  { a: "e_hare", b: "fam:divine", child: "f_ipos" },                        // イポス＝ホーンラビット × 神聖系（うさぎの 尾の 天使の すがた）
  { a: "f_kibaneko", b: "fam:demon", child: "f_marbas" },                   // マルバス＝キバネコ × 悪魔系（大きな 獅子）
  { a: "f_mandragora", b: "fam:demon", child: "f_buer" },                   // ブエル＝マンドラゴラ × 悪魔系（薬草を 教える）
  { a: "f_tsuchinoko", b: "fam:demon", child: "f_botis" },                  // ボティス＝ツチノコ × 悪魔系（まむしの すがた）
  { a: "f_tsunoinoshishi", b: "f_geode", child: "f_morax" },                // モラクス＝ツノイノシシ × ジオドーラ（牡牛と 石の 知恵）
  { a: "f_berith", b: "f_ougonnokyozou", child: "f_mammon" },               // マモン＝ベリト × オーレリオ（金を 生む 悪魔と 黄金の 像。強欲）
  { a: "f_voidqueen", b: "f_bael", child: "f_beelzebub" },                  // ベルゼブブ＝ヴォイドクイーン × バアル（虫の 女王と 王バアル。はえの 王）
  { a: "f_kaishounoou", b: "f_forneus", child: "f_leviathan" },             // レヴィアタン＝海嘯の王タイダロス × フォルネウス（海の 王と 海の 怪物）
];
// 4 体配合：{ gp: [祖父母 4 種], child }（両親の それぞれの 親の 組み合わせ。順は どちらでも）
export const FOUR = [
  { gp: ["e_boss_crystal", "e_boss_salamander", "e_boss_irabu", "f_tempestdragon"], child: "f_ancientdragon" },   // 竜 4 種
  { gp: ["e_boss_seagod", "e_boss_sleep", "f_pegasus", "f_paladin"], child: "f_haloguardian" },                    // 神聖 4 種
  { gp: ["f_sylph", "f_undine", "f_voltspirit", "e_whirl"], child: "f_elementallord" },                            // 風・水・雷・渦の 精
  { gp: ["f_haunthouse", "f_mirrorghost", "e_doll", "e_boss_fog"], child: "f_nanashi" },                          // 怪異 4 種
  // 追加の EX（2026-10-28）
  { gp: ["f_whitewhale", "f_orca", "f_seaserpent", "f_kraken"], child: "f_kaishounoou" },                          // 海の 大物 4 種
  { gp: ["f_magmajelly", "f_aurorajelly", "f_ikazuchijelly", "f_granjelly"], child: "f_genshojelly" },             // 火・氷・雷・大きな ゼリー（すべての ゼリーの はじまりへ）
  { gp: ["f_ugomeki", "f_doppelganger", "f_tentacles", "f_hoshikurai"], child: "f_konton" },                       // 異形 4 種が まざる
  // インフェルノの 悪魔（2026-11-07）
  { gp: ["f_mammon", "f_beelzebub", "f_leviathan", "f_archangel"], child: "f_lucifer" },                          // ルシファー＝大罪の 3 体 と アークエンジェル（堕ちた 天使の 長）
];
