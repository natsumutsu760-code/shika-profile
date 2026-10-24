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
export const SNACK_NEED = { 通常: 10, 希少: 30, ボス: 100 };
export const CAPTURE = { 通常: 0.012, 希少: 0.012, ボス: 0.004 };   // たおした敵 1 体ごと（探索にして、1 分あたりは前とだいたい同じ 2% くらい）
export const RESEARCH = { 通常: 10, 希少: 30, ボス: 100 };
export const DUNGEONS = [
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
    mythic: { id: "kuraiLantern", slot: "hand", name: "暗い村のランタン", text: "影の明かり：イタズラのダメージ +10%、相手の命中 −5%", main: { int: 1 }, fxp: { itazuraDmg: 10, foeAcc: 0.05 } },
  },
  {
    id: "crystal", name: "水晶洞窟", lv: 30, color: "#5CC9E8", text: "光る水晶でできた洞窟。奥に大きな何かがいる",
    foes: [{ name: "クリスタルリザード", type: "defender", lv: 29, tree: "e_lizard" }, { name: "ケイブバット", type: "technician", lv: 30, tree: "e_bat" }, { name: "ジェムスライム", type: "caster", lv: 31, tree: "e_crystal" }],
    rare: { name: "レインボータートル", type: "defender", lv: 31, tree: "e_turtle" },
    boss: { name: "クリスタルドラゴン", type: "defender", lv: 35, tree: "e_boss_crystal" },
    drops: ["helmet", "knit", "straw", "nabe", "bowtie", "omamori", "bib", "gold", "stick", "pikopiko", "mizudeppo", "kamifusen"],
    mythic: { id: "crystalCrown", slot: "head", name: "水晶の王冠", text: "水晶のからだ：受けるダメージ −8%、会心で ふえた 分は ひびに なり、3 ターンに 分けて 受ける", main: { def: 0.5, res: 0.5 }, fxp: { dmgCut: 8, critSplit: 3 } },
  },
];
