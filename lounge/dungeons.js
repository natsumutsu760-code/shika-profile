// ダンジョン（VR ゲーム）のデータ（試作）
// 設定：「派遣」といいつつ、ペットに VR ゴーグルを付けて RPG ゲームをやらせている。ゲームの中では、ガンビットで自動で戦う
// 行き先ごとに、出てくる敵・届く装備・ミシック装備がちがう。数字はすべて仮

// 出かける時間（鹿さんの決め：1・3・10 分のまま）。長いほどたくさん歩けて、広く・深く探索できる
// 1 分あたりの得はそろえない（鹿さんの決め、2026-10-22）。何回もためして、いつか最後まで行けるようにする。力つきて帰ってきても失敗ではない
export const RUNS = {
  short: { label: "1 分", sec: 60 },
  mid: { label: "3 分", sec: 180 },
  long: { label: "10 分", sec: 600 },
};

// ---------- 探索（ヴェルヴェットと同じ。鹿さんの決め、2026-10-22）。数字はすべて仮 ----------
// 1 つの行き先は 5 階（地図は floors.js）。1 歩 2 秒（1 分で 30 歩・10 分で 300 歩。ヴェルヴェットの 1 回の派遣と同じ歩数）。歩いたまわり 1 マスが見えて、探索率が上がる（帰っても残る）
// その階の探索率が 100% になると、かくし通路が開く。5 階の一番奥にボスの部屋
export const TICK = 2;
export const ENCOUNTER = { path: 0.06, room: 0.09 };                 // 1 歩ごとに敵と出会う確率（道・広場）
export const REST = { hpAt: 0.7, mpAt: 0.3, until: 1, hp: 0.1, mp: 0.08 };   // HP が 7 割（MP が 3 割）を切ったら休憩。1 歩ぶんで HP 1 割・MP 8% もどる。満タンで歩きだす。倒れた子は帰るまでもどらない
// 救護室（隠れ家）の Lv：休憩で もどる 量の 倍率と、休憩の はじめに 倒れた子が 起きあがる HP の 割合（0 は 起きない。Lv3 から）。facilities.js の 文と 同じ（鹿さんの頼み、2026-10-25：字だけで 計算に 入って いなかった）
export const MEDIC = { rest: [1, 1.25, 1.5, 1.5, 2], up: [0, 0, 0, 0.1, 0.3] };
export const MAP_STAIRS = 1;   // 地図室 この Lv から：階に 着いた とき 階段の まわり（3×3）が 見えて いる（地図に 出て、探索率にも 入る）
export const TRAP = { avoid: 0.25, dmg: 0.08 };                      // 罠：25% で見抜く。かかると全員が最大 HP の 8%
export const FLOOR_LV = (n) => n - 2;                                // 階ごとの敵の Lv（1 階 −1・2 階 ±0・3 階 +1・4 階 +2・5 階 +3。ボスはそのまま）
export const BATTLE_TICKS = (turns) => 2 + Math.ceil(turns / 2);     // 戦いにかかる時間（歩数）
// 目的（どれも、目的が終わったら探索と同じ動きになる）
export const PURPOSES = {
  explore: { name: "探索", text: "まだ見ていないマスをうめる。その階が 100% になったら下の階へ。ぜんぶ見たら、歩きまわって敵と戦う", enc: 1 },
  boss: { name: "ボス優先", text: "行ったことのある一番深い階から出て、ボスの部屋へまっすぐ向かう", enc: 1 },
  gather: { name: "採取優先", text: "行ったことのある一番深い階で、採取ポイントを近い順に回る", enc: 1 },
  target: { name: "指定の敵だけ", text: "えらんだ敵とだけ戦う（出会いにくくなる）。ボスの部屋には入らない。行ったことのある一番深い階から出る", enc: 0.8, rareEnc: 0.25 },
};
// 宝箱の装備の★（階ごと）。かくし通路の宝箱は★が 1 つ上。ボスをたおすと 1 つ（★3〜5）とリソース、まれにミシック
export const CHEST_STAR = { 1: { 1: 85, 2: 15 }, 2: { 1: 60, 2: 35, 3: 5 }, 3: { 1: 30, 2: 50, 3: 20 }, 4: { 2: 55, 3: 38, 4: 7 }, 5: { 2: 40, 3: 45, 4: 15 } };
export const BOSS_STAR = { 3: 55, 4: 40, 5: 5 }, MYTHIC = 0.01, BOSS_RESOURCE = 2;
// 経験値：たおした敵の Lv × EXP_PER_LV。パーティの全員が同じだけもらう
export const EXP_PER_LV = 0.3;
// クレジット：派遣のゲームの中のお金（鹿さんの決め、2026-10-22）。施設の強化などに使う。たおした敵の Lv × 2、宝箱 1 こで 20〜60 × 階（かくし通路は 2 倍）、ボス 300
export const CREDIT = { perLv: 2, chest: [20, 60], boss: 300 };

// 敵：タイプ・Lv・自分のスキルツリー（enemy-trees.js）。ステータスはタイプの伸び方 ＋ 自分のツリーを自動で振った分（dungeon-sim.js）。弱めずに本来の強さで出る（最初はむずかしくても、レベルが上がるほど奥まで行ける。鹿さんの決め、2026-10-21）
// rare は希少な敵：敵 1 体ごとに RARE_RATE の確率で、ふつうの敵と入れかわって出てくる

// 捕まえる・研究する（数字は仮）
// 戦いに勝つと、たおした敵 1 体ずつ CAPTURE の確率で捕まえる。ボスもごくまれに捕まる
// 捕まえた敵は、リソースを RESEARCH だけ使って研究すると、その敵のツリーをペットのサブツリーに付けられる
export const RARE_RATE = 0.08;
// 1 回の戦いに出る敵の数（こちらが何体でも 1〜3 体。鹿さんの決め）。数字は仮
export const GROUP = { 1: 50, 2: 35, 3: 15 };
// 懐柔のおやつ：戦いに勝つと SNACK_DROP の確率で 1 こ拾う（探索にして、1 分あたりは前とだいたい同じ）。買うと 1 こ SNACK_PRICE 玉。なかよしゲージは SNACK_NEED こでいっぱい（鹿さんの OK、2026-10-21）
// 派遣に 持っていく 道具（じゅんびで 1 つ えらぶ。使うと なくなる。商人の店で 買う。鹿さんの決め、2026-10-22）
export const TOOLS = {
  lure: { name: "おとりの笛", text: "えらんだ 敵と 出会いやすい", shop: "ホーク" },
  net: { name: "捕獲ネット", text: "捕まえる 確率が 2 倍", shop: "ホーク" },
  tea: { name: "元気のお茶", text: "力つきても 1 回だけ、全回復して つづける", shop: "ウール先生" },
};
export const LURE_SHARE = { 通常: 0.5, 希少: 0.12 }, NET_MULT = 2;   // 笛：出会う敵の 半分が えらんだ敵（希少な敵は 12%）。ネット：捕まえる 確率 ×2
export const SNACK_DROP = 0.08, SNACK_PRICE = 50;
export const SNACK_NEED = { 通常: 10, 希少: 30, ボス: 100, 配合: 30 };   // 配合：配合限定の 子（なかよしで 生まれる）
export const CAPTURE = { 通常: 0.012, 希少: 0.012, ボス: 0.004 };   // たおした敵 1 体ごと（探索にして、1 分あたりは前とだいたい同じ 2% くらい）
export const RESEARCH = { 通常: 10, 希少: 30, ボス: 100, 配合: 50 };
// ゲームに 出て いる 島の 数。2 つめの 島（ニライ諸島。docs/mono-link-island2.md）の 行き先・敵の ツリー・絵が そろったので 2（2026-10-25）
// 2 に すると：隠れ家に 無線機（作ると その人は ニライ諸島へ 行ける）・無線機の ある 人は 各施設の Lv4（島の 素材を 使う）が 出る（facilities.js）
export const ISLAND_OPEN = 2;
// isle：何番目の 島か（書いて いない 物は 1）。hidden：かくし（DEEP LINK/: の 商人の つながった タスクを n 番まで 終えると 開く）
export const DUNGEONS_ALL = [
  {
    id: "hals", name: "ハルス街道", lv: 3, color: "#7BC96F", text: "草原をぬける古い街道。はじめての冒険に",
    foes: [{ name: "ホーンラビット", type: "technician", lv: 2, tree: "e_hare" }, { name: "ゴブリン", type: "attacker", lv: 3, tree: "e_thief" }, { name: "コボルト", type: "defender", lv: 3, tree: "e_watch" }],
    rare: { name: "迷子の吟遊詩人", type: "healer", lv: 4, tree: "e_bard" },
    boss: { name: "ゴブリンキング", type: "attacker", lv: 5, tree: "e_boss_thief" },
    drops: ["straw", "helmet", "bowtie", "bib", "stick", "pikopiko"],
    mythic: { id: "halsCloak", slot: "neck", name: "ハルスの旅マント", text: "旅なれた足：最初の 2 ターン AGI +30%、回避 +10%", main: { hp: 0.75, agi: 0.5 }, fxp: { startFx: [["up_agi", 30, 2]], evade: 0.1 } },
  },
  {
    id: "morph", name: "モーフィアス遺跡", lv: 12, color: "#B49BEA", text: "夢を見る神をまつった石の遺跡。歩くと眠くなる",
    foes: [{ name: "ストーンゴーレム", type: "defender", lv: 12, tree: "e_sentinel" }, { name: "ファントム", type: "caster", lv: 11, tree: "e_ghost" }, { name: "ミミック", type: "technician", lv: 12, tree: "e_trapper" }],
    rare: { name: "ドリームオウル", type: "healer", lv: 13, tree: "e_owl" },
    boss: { name: "ヒュプノス", type: "caster", lv: 16, tree: "e_boss_sleep" },
    drops: ["knit", "straw", "omamori", "bib", "mizudeppo", "kamifusen"],
    mythic: { id: "morphMask", slot: "head", name: "モーフィアスの仮面", text: "夢の神：自分の番のはじめに 15% で相手をねむりにする", main: { res: 1 }, fxp: { auraFx: [["sleep", 0.15, 1]] } },
  },
  {
    id: "kurai", name: "暗い村", lv: 20, color: "#6B7AA8", text: "夜が明けない村。だれもいないはずなのに、明かりがつく",
    foes: [{ name: "ワーウルフ", type: "attacker", lv: 19, tree: "e_wolf" }, { name: "シャドウ", type: "technician", lv: 20, tree: "e_shade" }, { name: "古井戸の魔女", type: "caster", lv: 21, tree: "e_witch" }],
    rare: { name: "ウィスプ", type: "healer", lv: 21, tree: "e_lantern" },
    boss: { name: "村長の影", type: "healer", lv: 24, tree: "e_boss_mayor" },
    drops: ["nabe", "knit", "gold", "omamori", "kamifusen", "mizudeppo"],
    mythic: { id: "kuraiLantern", slot: "off", name: "暗い村のランタン", text: "影の明かり：イタズラのダメージ +10%、相手の命中 −5%", main: { int: 1 }, fxp: { itazuraDmg: 10, foeAcc: 0.05 } },
  },
  {
    id: "crystal", name: "水晶洞窟", lv: 30, color: "#5CC9E8", text: "光る水晶でできた洞窟。奥に大きな何かがいる",
    foes: [{ name: "クリスタルリザード", type: "defender", lv: 29, tree: "e_lizard" }, { name: "ケイブバット", type: "technician", lv: 30, tree: "e_bat" }, { name: "ジェムスライム", type: "caster", lv: 31, tree: "e_crystal" }],
    rare: { name: "レインボータートル", type: "defender", lv: 31, tree: "e_turtle" },
    boss: { name: "クリスタルドラゴン", type: "defender", lv: 35, tree: "e_boss_crystal" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "crystalCrown", slot: "head", name: "水晶の王冠", text: "水晶のからだ：受けるダメージ −8%、会心で ふえた 分は ひびに なり、3 ターンに 分けて 受ける", main: { def: 0.5, res: 0.5 }, fxp: { dmgCut: 8, critSplit: 3 } },
  },
  // ===== 2 つめの 島「ニライ諸島」（設定資料：docs/mono-link-island2.md。無線機を 作った 人が 行ける。敵の Lv は 行き先の Lv −1〜+1・希少 +1・ボス +5） =====
  {
    id: "inoh", isle: 2, name: "イノーの浜", lv: 35, color: "#3FC1B0", text: "白い 砂と サンゴ礁の 浅い 海。島の 冒険は ここから",
    foes: [{ name: "ヤシガニ", type: "defender", lv: 34, tree: "e_coconutcrab" }, { name: "ウミネコ", type: "technician", lv: 35, tree: "e_gull" }, { name: "サハギン", type: "attacker", lv: 36, tree: "e_sahagin" }],
    rare: { name: "虹色クマノミ", type: "healer", lv: 36, tree: "e_clownfish" },
    boss: { name: "キングクラブ", type: "defender", lv: 40, tree: "e_boss_crab" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "inohBangle", slot: "arm", name: "イノーの珊瑚腕輪", text: "潮だまり：自分の 番の はじめに HP 1.5% 回復", main: { dex: 0.6, hp: 0.5 }, fxp: { hpRegen: 0.015 } },
  },
  {
    id: "gama", isle: 2, name: "ガマの隠れ港", lv: 38, color: "#C98A4B", text: "洞くつの 奥に 海賊の 船が かくれている",
    foes: [{ name: "海賊の下っぱ", type: "attacker", lv: 37, tree: "e_pirate" }, { name: "おしゃべりオウム", type: "technician", lv: 38, tree: "e_parrot" }, { name: "樽ミミック", type: "defender", lv: 39, tree: "e_barrel" }],
    rare: { name: "宝の地図売り", type: "healer", lv: 39, tree: "e_mapseller" },
    boss: { name: "赤ひげ船長", type: "attacker", lv: 43, tree: "e_boss_redbeard" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "redbeardHat", slot: "head", name: "赤ひげの三角帽", text: "船長の 勘：会心 +12%・会心の ダメージ +30%", main: { def: 0.5, luk: 0.6 }, fxp: { crit: 0.12, critDmg: 30 } },
  },
  {
    id: "tida", isle: 2, name: "ティダ岬の灯台", lv: 42, color: "#E9B949", text: "消えない 霧の 中で、太陽の 灯台が まわる",
    foes: [{ name: "灯台守のゴースト", type: "caster", lv: 41, tree: "e_keeper" }, { name: "岬のハーピー", type: "technician", lv: 42, tree: "e_harpy" }, { name: "シーサー像", type: "defender", lv: 43, tree: "e_shisa" }],
    rare: { name: "迷い光", type: "healer", lv: 43, tree: "e_glimmer" },
    boss: { name: "霧の巨人", type: "caster", lv: 47, tree: "e_boss_fog" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "tidaLens", slot: "off", name: "ティダのレンズ", text: "照らす：相手の 回避 −15%・DEX +20%・会心 +5%・盲目に ならない", main: { int: 0.7, dex: 0.5 }, fxp: { foeEvadeCut: 0.15, dexMul: 1.2, crit: 0.05, noFx: { blind: true } } },
  },
  {
    id: "atui", isle: 2, name: "アトゥイ号の沈没船", lv: 45, color: "#3D86B8", text: "浅い 海に 大きな 船が 沈んでいる",
    foes: [{ name: "ドクロ水夫", type: "attacker", lv: 44, tree: "e_skelsailor" }, { name: "フジツボゴーレム", type: "defender", lv: 45, tree: "e_barnacle" }, { name: "電気クラゲ", type: "caster", lv: 46, tree: "e_jelly" }],
    rare: { name: "金貨ガニ", type: "technician", lv: 46, tree: "e_goldcrab" },
    boss: { name: "大ダコ", type: "attacker", lv: 50, tree: "e_boss_octopus" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "atuiAnchor", slot: "weapon", name: "アトゥイ号の錨", text: "重い 一撃：こうげきの とき 20% で 相手を 気絶（1 ターン）", main: { atk: 1.2 }, fxp: { onHitFx: [["stun", 0.2, undefined, 1]] } },
  },
  {
    id: "zan", isle: 2, name: "ザンの洞窟", lv: 49, color: "#6F8FE8", text: "滝の うらから 歌が 聞こえる",
    foes: [{ name: "セイレーン", type: "caster", lv: 48, tree: "e_siren" }, { name: "洞窟ウナギ", type: "technician", lv: 49, tree: "e_eel" }, { name: "貝の守り手", type: "defender", lv: 50, tree: "e_clam" }],
    rare: { name: "歌う真珠貝", type: "healer", lv: 50, tree: "e_pearl" },
    boss: { name: "ザンの女王", type: "healer", lv: 54, tree: "e_boss_mermaid" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "zanHarp", slot: "off", name: "ザンの竪琴", text: "癒やしの 歌：自分の 番の はじめに 味方 全員の HP 2% 回復", main: { int: 0.6, mp: 0.6 }, fxp: { teamRegen: 0.02 } },
  },
  {
    id: "ufu", isle: 2, name: "ウフ火山", lv: 52, color: "#E2603F", text: "島の 熱い 心。煙が やまない",
    foes: [{ name: "溶岩トカゲ", type: "attacker", lv: 51, tree: "e_lavalizard" }, { name: "ヒーダマ", type: "caster", lv: 52, tree: "e_hidama" }, { name: "黒曜石ゴーレム", type: "defender", lv: 53, tree: "e_obsidian" }],
    rare: { name: "火の鳥のひな", type: "healer", lv: 53, tree: "e_firechick" },
    boss: { name: "サラマンダー", type: "attacker", lv: 57, tree: "e_boss_salamander" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "ufuGauntlet", slot: "arm", name: "ウフ火山のこて", text: "熱い 手：こうげきの とき 35% で 相手に 炎上 +6", main: { atk: 0.7, dex: 0.5 }, fxp: { onHitFx: [["burn", 0.35, 6]] } },
  },
  {
    id: "kaji", isle: 2, name: "カジの海峡", lv: 56, color: "#7F8FB0", text: "風の 通り道。いつも 嵐が いる",
    foes: [{ name: "雷鳥", type: "technician", lv: 55, tree: "e_thunderbird" }, { name: "大渦の精", type: "caster", lv: 56, tree: "e_whirl" }, { name: "嵐の海賊船", type: "attacker", lv: 57, tree: "e_stormship" }],
    rare: { name: "風見カモメ", type: "healer", lv: 57, tree: "e_vane" },
    boss: { name: "大イラブー", type: "caster", lv: 61, tree: "e_boss_irabu" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "kajiPlume", slot: "acc", name: "カジの羽根飾り", text: "追い風：AGI +30%・回避 +10%・最初の ターンは 先に 動く", main: { agi: 0.7, luk: 0.5 }, fxp: { agiMul: 1.3, evade: 0.1, firstStrike: true } },
  },
  {
    id: "nirai", isle: 2, name: "ニライ寺院", lv: 60, color: "#2FA7A0", text: "割れた 石の 門の 先、海を 見守る 白い 寺院",
    foes: [{ name: "寺院の衛兵", type: "defender", lv: 59, tree: "e_guard" }, { name: "トライデントナイト", type: "attacker", lv: 60, tree: "e_trident" }, { name: "半魚人の神官", type: "caster", lv: 61, tree: "e_priest" }],
    rare: { name: "白いイルカ", type: "healer", lv: 61, tree: "e_dolphin" },
    boss: { name: "ニライの海神", type: "caster", lv: 65, tree: "e_boss_seagod" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "niraiTrident", slot: "weapon", name: "ニライの三叉槍", text: "大波：3 ターンごとに 相手 全員に 水の こうげき（威力 6。ATK か INT の 高い 方）", main: { atk: 0.7, int: 0.6 }, fxp: { waveEvery: 3, wavePow: 6 } },
  },
  {
    id: "mabui", isle: 2, name: "マブイの幽霊船", lv: 50, color: "#8A9FC4", text: "霧の 夜に だけ くる 船。迷った 魂が 乗っている", hidden: { trader: "hunter", who: "ホーク", n: 20, key: "幽霊船の海図" },
    foes: [{ name: "幽霊水夫", type: "attacker", lv: 49, tree: "e_ghostsailor" }, { name: "マジムン", type: "caster", lv: 50, tree: "e_majimun" }, { name: "呪いの人形", type: "technician", lv: 51, tree: "e_doll" }],
    rare: { name: "迷子の船猫", type: "healer", lv: 51, tree: "e_shipcat" },
    boss: { name: "幽霊船長", type: "caster", lv: 55, tree: "e_boss_captain" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "mabuiCompass", slot: "acc", name: "幽霊船長のコンパス", text: "死にぞこない：戦いの はじめに 輪廻（1 回だけ 力つきても HP 1 で のこる）", main: { luk: 0.8, res: 0.4 }, fxp: { startFx: [["reincarnation"]] } },
  },
  {
    id: "kanai", isle: 2, name: "カナイの門", lv: 70, color: "#33479E", text: "海の かなたの 国への 門", hidden: { trader: "junk", who: "ガラク", n: 30, key: "カナイの門の鍵" },
    foes: [{ name: "チョウチンアンコウ", type: "caster", lv: 69, tree: "e_angler" }, { name: "ダイオウイカ", type: "attacker", lv: 70, tree: "e_squid" }, { name: "深海の巨人", type: "defender", lv: 71, tree: "e_deepgiant" }],
    rare: { name: "光る深海魚", type: "healer", lv: 71, tree: "e_deepfish" },
    boss: { name: "深淵の門番", type: "defender", lv: 75, tree: "e_boss_gatekeeper" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "kanaiNecklace", slot: "neck", name: "カナイの首飾り", text: "水圧：受ける ダメージ −10%・戦いの はじめに 相手 全員の ATK −10%", main: { hp: 0.8, def: 0.5 }, fxp: { dmgCut: 10, startFoeFx: [["down_atk", 10]] } },
  },
];
// 派遣の 費用（玉。鹿さんの決め、2026-10-25）：ニライ諸島は 1,000 から、Lv の 低い 順に 1 か所ごと +250（かくしも 入れて 10 か所。1,000〜3,250）。はじめの 島は ただ
// 1 回の 派遣ごと（1・3・10 分 同じ。周回は 1 回ごとに 払う）
DUNGEONS_ALL.filter((d) => d.isle === 2).sort((a, b) => a.lv - b.lv).forEach((d, i) => (d.cost = 1000 + 250 * i));
export const tripCost = (d) => (d && d.cost) || 0;
// ゲームに 出て いる 島の 行き先（ISLAND_OPEN まで）。その人が 行けるかは 別（島 2 は 無線機・かくしは タスク。門番の canGo）
export const DUNGEONS = DUNGEONS_ALL.filter((d) => (d.isle || 1) <= ISLAND_OPEN);
// その人が その 行き先へ 行けるか（門番と 画面で 同じ 決まり）。hideout：施設の Lv、chainN(商人の id)：つながった タスクの いま 何こ目か
// 島 2 は 無線機 Lv1 から。かくしは さらに 商人の つながった タスクを n 番まで 終えて いる こと（もう 過ぎて いる 人は 無線機を 作れば すぐ 開く。鹿さんの決め、2026-10-25）
export function canGo(d, hideout, chainN) {
  if ((d.isle || 1) >= 2 && !((hideout || {}).radio >= 1)) return { ok: false, why: "隠れ家に 無線機を 作ると 行ける" };
  if (d.hidden && !(chainN(d.hidden.trader) > d.hidden.n)) return { ok: false, why: `${d.hidden.who}の つながった タスク #${d.hidden.n} の ごほうびで 行ける` };
  return { ok: true };
}
