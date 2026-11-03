// メインの スキルツリー 12 本（鹿さんが カードで 決めた 中身。docs/mono-link-main-trees.md・mono-link-new-pets.md）。数字は ぜんぶ 仮
// 形は skills.js の TREES と 同じ（slot S1〜S8 が 技 ①〜⑧、P1〜P7 が パッシブ ①〜⑦。どの ノードに 入るかは trees.js の SHAPE）
// skills.js の fx に 足した 書き方（battle-sim.js が 読む）：
//   dmg：graze かすりヒット（外れても その 割合が 入る）・cutPierce 装甲・障壁・防御で 減る 分の その 割合を 無視・ifFirst この 番に 相手より 先に 動いたら 1 + その 倍
//        perSpent この 技で 使った カウント 1 に つき 威力 +・perCnt { c, k } いまの カウント 1 に つき 威力 +k（使わない）・gainOnHit { c, n } 当てると カウント +n
//        addPierce その 一撃に そのまま 足す・noCrit 会心に ならない・crit かならず 会心・critLuk 会心の 確率に LUK × その 値・critDmgLuk 会心の ダメージに LUK × その 値
//        shieldUse { pct 最大 HP の 割合を 使って add を 足す ／ per 1 回ごとに 最大 HP の 割合を 使う ／ half 半分 使って 2 に つき +1 ／ all ぜんぶ 使って その 量を 足す }
//        stat "atkint"（ATK と INT の 高い 方）・hitsByUps（かかって いる 上昇の 種類の 数だけ 当てる）
//   fx：who "ally"（味方の HP の いちばん 減った 子。ソロは 自分）・elseFx 付かなかった ときに かわりに 付ける 物・turnsBy / amtBy { per, add, c?, spent? }（カウントで ふえる）
//        once 1 戦に 1 回・ifTag その 技で 前に 付いた 状態が あるときだけ・atLeastAfter 付けた あとの 量が n 以上なら
//   gain { c, n } カウントを ためる・spend { c, n | all, need } 技の はじめに カウントを 使う（need より 少ないと 使えない）
//   steal 相手の バフを 取り上げて 味方へ・again もう 1 回 動く・swapUps 上昇を 攻め ↔ 守りで 入れかえる・flex 量の いちばん 多い 上昇で 中身が 変わる
//   mpCut 相手の MP を 最大 MP の 割合 へらす・brace この 番に 受けた 直接攻撃の 割合を 貫通に ためる・drip 手番の はじめに 少しずつ 回復・bloom 開花
//   sk.choose：技の 中で えらぶ（クローラーは コマンド、自動の 戦いは ガンビットの opt。なければ いちばん 上）
// カウント：1 戦ごとに 0 から。倒れて 輪廻で 起きても 残す。上限は なし（鹿さんの 決め、2026-10-30・10-31）
export const COUNTS = { static: "帯電", glow: "蓄光", water: "水分", nutrient: "栄養", growth: "成長", coin: "コイン", veg: "野菜", meat: "肉", fish: "魚介" };

// 主能力・副能力（このゲームの ステータス名）。フレキシブルは 育て方で 変わる（攻め：ATK・DEX・INT の いちばん 高い 物／守り：RES・DEF・AGI の いちばん 高い 物）
export const MAIN_TREES = {
  drowsy: { name: "ドロウジー", en: "Drowsy", main: "hp", sub: "int", pet: "shika", color: "#9C8CFF", role: "回復 ＋ 足止め" },
  punctual: { name: "パンクチュアル", en: "Punctual", main: "dex", sub: "hp", pet: "pelican", color: "#3FA9F5", role: "守り ＋ 味方への 支援" },
  swift: { name: "スウィフト", en: "Swift", main: "agi", sub: "dex", pet: "mouse", color: "#FFB020", role: "手数の 攻め ＋ 回避" },
  static: { name: "スタティック", en: "Static", main: "int", sub: "def", pet: "tv", color: "#E0565B", role: "妨害 ＋ イタズラの 攻め" },
  tough: { name: "タフ", en: "Tough", main: "atk", sub: "def", pet: "mogura", color: "#B07A4A", role: "重い 一撃 ＋ 守り" },
  translucent: { name: "トランスルーセント", en: "Translucent", main: "int", sub: "agi", pet: "kurage", color: "#C69CFF", role: "回避 ＋ 回復 ＋ 毒" },
  spiky: { name: "スパイキー", en: "Spiky", main: "def", sub: "res", pet: "saboten", color: "#3CB371", role: "守り ＋ 反撃" },
  greedy: { name: "グリーディ", en: "Greedy", main: "atk", sub: "luk", pet: "chokin", color: "#F2C230", role: "ためて 放つ 大技 ＋ 会心" },
  mariage: { name: "マリアージュ", en: "Mariage", main: "atk", sub: "int", pet: "tako", color: "#F0644A", role: "炎上・凍傷 ＋ 料理の カウント" },
  spooky: { name: "スプーキー", en: "Spooky", main: "dex", sub: "int", pet: "ittan", color: "#A9B4C2", role: "衰弱・朦朧 ＋ 会心" },
  sharp: { name: "シャープ", en: "Sharp", main: "int", sub: "def", pet: "ebi", color: "#8A5CF0", role: "シールドと レーザー ＋ 弱らせ" },
  flexible: { name: "フレキシブル", en: "Flexible", main: "bestOff", sub: "bestDef", pet: "beagle", color: "#C8875A", role: "上昇で 変わる オールラウンダー" },
};

const S = (slot, id, name, kind, mp, text, fx, more = {}) => ({ slot, id, name, kind, mp, text, fx, ...more });
const P = (slot, id, name, text, p) => ({ slot, id, name, kind: "passive", text, p });
const me = (id, o = {}) => ({ t: "fx", id, who: "me", ...o }), foe = (id, o = {}) => ({ t: "fx", id, who: "foe", ...o }), ally = (id, o = {}) => ({ t: "fx", id, who: "ally", ...o });

export const MAIN_TREE_LIST = {
  // ---------- ドロウジー（ネム。主能力 HP・副能力 INT）：回復 ＋ 足止め ----------
  drowsy: [
    S("S1", "dr_negaeri", "寝がえり", "waza", 3, "ごろんと 転がる。威力 10。強さは 最大 HP で 決まる（重いほど 痛い）", [{ t: "dmg", pow: 10, stat: "hp", statMul: 0.25 }]),
    S("S2", "dr_moufu", "毛布を かける", "waza", 7, "HP を 29% 回復。3 匹の ときは HP の いちばん 減った 味方に（ソロは 自分に）", [{ t: "heal", pct: 0.29, who: "ally" }]),
    S("S3", "dr_akubi", "大あくび", "itazura", 4, "あくびが うつって、相手は 45% で 眠り（2 ターン）。気が ぬけて、相手の バフを 1 つ 消す", [foe("sleep", { turns: 2, chance: 0.45 }), { t: "dispel", n: 1 }]),
    S("S4", "dr_nidone", "二度寝", "waza", 9, "自分は 眠り（1 ターン）。かわりに 浄化と 再生 +25", [{ t: "cure" }, me("regen", { amt: 25 }), me("sleep", { turns: 1 })]),
    S("S5", "dr_bed", "よその子の ベッド", "waza", 9, "よその 子の ベッドに もぐりこむ。HP を 44% 回復し、あふれた 分は オーバーヒール（5 ターン）", [me("overheal", { amt: 0 }), { t: "heal", pct: 0.44 }]),
    S("S6", "dr_hitsuji", "ひつじを 数える", "itazura", 6, "いっしょに ひつじを 数えさせる。相手は 60% で 眠り（2 ターン）。眠らなければ 疲労（2 ターン）", [foe("sleep", { turns: 2, chance: 0.6, elseFx: { id: "fatigue", turns: 2 } })]),
    S("S7", "dr_yumemakura", "夢枕に 立つ", "itazura", 6, "眠って いる 相手の 夢に 出る。威力 14（INT）。相手が 眠って いたら 2.5 倍（たたくので 50% で 起きる）", [{ t: "dmg", pow: 14, vsFx: { sleep: 1.5 } }]),
    S("S8", "dr_neta", "ねた。おきた。", "waza", 14, "味方 1 匹に 輪廻（撃破されると、状態が ぜんぶ 消えてから HP 1 で 復活）。ソロの ときは 自分に。1 戦に 1 回まで", [ally("reincarnation", { once: true })]),
    P("P1", "dr_makura", "まくら持参", "回復する 量 +10%", { healMul: 1.1 }),
    P("P2", "dr_pittari", "ぴったり 起きる", "眠りから 起きた とき、HP を 8% 回復し 集中（2 ターン）", { wakeHeal: 0.08, wakeFocus: 2 }),
    P("P3", "dr_nukunuku", "ぬくぬく", "自分の 再生は、効いても 量が 3/4 に しか 減らない（長く 続く）", { regenKeep: 0.75 }),
    P("P4", "dr_umou", "羽毛ぶとん", "オーバーヒールが ある あいだ、受ける ダメージ −15%", { overhealCut: 0.15 }),
    P("P5", "dr_nemuke", "ねむけが うつる", "自分が 付ける 眠りの 確率 +15%・+1 ターン", { fxChanceAdd: { sleep: 0.15 }, extendIds: { sleep: 1 } }),
    P("P6", "dr_yofukashi", "夜ふかし", "眠って いる 相手に 与える ダメージ +20%・会心 +15%", { vsFx: { sleep: 0.2 }, critVsFx: { sleep: 0.15 } }),
    P("P7", "dr_sodatsu", "寝る子は 育つ", "自分が 眠って いる あいだ、手番の はじめに INT 上昇 +10・RES 上昇 +10（重なる。戦いの あいだ 残る）", { sleepGrow: { int: 10, res: 10 } }),
  ],
  // ---------- パンクチュアル（ポスケ。主能力 DEX・副能力 HP）：守り ＋ 味方への 支援 ----------
  punctual: [
    S("S1", "pu_sokutatsu", "速達", "waza", 2, "威力 8（DEX）。外れても かすって ダメージの 35% が 入る（かすりヒット）。相手の 装甲・障壁・防御で 減る 分の 2 割を 無視する", [{ t: "dmg", pow: 8, stat: "dex", graze: 0.35, cutPierce: 0.2 }]),
    S("S2", "pu_yubisashi", "指差し確認", "waza", 4, "「宛名 よし！」。自分は 明瞭（3 ターン。攻撃が かならず 会心）。気持ちが 引きしまって 集中（1 ターン）", [me("clarity", { turns: 3 }), me("focus", { turns: 1 })]),
    S("S3", "pu_raincoat", "レインコート", "waza", 8, "シールド（最大 HP の 10%）。3 匹の ときは 味方 1 匹に（ソロは 自分に）", [{ t: "shield", pct: 0.1, who: "ally" }]),
    S("S4", "pu_mamoru", "荷物を 守る", "waza", 4, "身代わり（1 ターン。味方への 直接攻撃を 代わりに 受ける。ソロは 防御）＋ 自分に 装甲 +9・障壁 +10", [me("substitute", { turns: 1 }), me("armor", { amt: 9 }), me("ward", { amt: 10 })]),
    S("S5", "pu_fuutou", "防水封筒", "waza", 9, "バリア +2。3 匹の ときは 味方 1 匹に（ソロは 自分に）", [ally("barrier", { amt: 2 })]),
    S("S6", "pu_otodoke", "お届けもの", "waza", 8, "味方 1 匹に ATK 上昇 17・INT 上昇 17（3 ターン）と チャージ（ソロは 自分に）", [ally("up_atk", { amt: 17, turns: 3 }), ally("up_int", { amt: 17, turns: 3 }), ally("charge")]),
    S("S7", "pu_shuka", "集荷", "itazura", 6, "威力 5（DEX）。相手の バフを 1 つ 取り上げて、味方 1 匹に 付ける（ソロは 自分に）", [{ t: "dmg", pow: 5, stat: "dex" }, { t: "steal", n: 1 }]),
    S("S8", "pu_kakitome", "書留", "waza", 10, "威力 13（DEX）。かならず 当たる。相手の 装甲・障壁・防御で 減る 分の 半分を 無視する（量が 多いほど 抜ける 分も 多い）", [{ t: "dmg", pow: 13, stat: "dex", sure: true, cutPierce: 0.5 }]),
    P("P1", "pu_jikan", "時間厳守", "DEX +18%・命中 +10%", { dexMul: 1.18, accUp: 0.1 }),
    P("P2", "pu_omake", "貝がらの おまけ", "自分が 味方に かける 強化に、シールド（最大 HP の 4.6%）が おまけで つく（ソロは 自分に）", { allyBuffShield: 0.046 }),
    P("P3", "pu_sekinin", "責任感", "身代わり・防御で 受けた ダメージの 30% を 貫通に ためる（次の 直接攻撃に 足す）", { guardPierce: 0.3 }),
    P("P4", "pu_amayoke", "雨に ぬれない", "バリアが ある あいだ、受ける 継続ダメージ −40%（バリアは 継続ダメージを 防がない ので）", { barrierDotCut: 0.4 }),
    P("P5", "pu_jiman", "配達じまん", "自分が かける 上昇の 量 +30%", { upMul: 1.3 }),
    P("P6", "pu_atesaki", "あて先ちがい", "相手が 自分に バフを かけた つぎの 番、集荷の 威力 2 倍・MP 半分", { foeBuffBoost: "pu_shuka" }),
    P("P7", "pu_kanryo", "配達完了", "書留が 当たると、相手の バフを 1 つ 消して、味方 全員（ソロは 自分）に 明瞭（1 ターン）", { deliverDone: "pu_kakitome" }),
  ],
  // ---------- スウィフト（カチ。主能力 AGI・副能力 DEX）：手数の 攻め ＋ 回避 ----------
  swift: [
    S("S1", "sw_kachikachi", "カチカチ", "waza", 1, "なんでも 2 回。威力 5 × 2（AGI）と、当たる たびに 相手の DEF 減少 +5（2 ターン）", [{ t: "dmg", pow: 5, hits: 2, stat: "agi" }, foe("down_def", { amt: 5, turns: 2, perHit: true })]),
    S("S2", "sw_sukima", "すきまに もぐる", "waza", 3, "幻影 +17（直接攻撃を 量% で かわす）", [me("mirage", { amt: 17 })]),
    S("S3", "sw_hashiru", "3 周 走る", "waza", 5, "加速（2 ターン。何回も 当てる 技と 攻撃の 回数 +1〜3）と AGI 上昇 +14", [me("haste", { turns: 2 }), me("up_agi", { amt: 14, turns: 3 })]),
    S("S4", "sw_renda", "連打", "waza", 4, "威力 2 × 4（AGI）。1 発ごとに 相手の 最大 HP の 1.3% を 足す", [{ t: "dmg", pow: 2, hits: 4, stat: "agi", hpPct: 0.013 }]),
    S("S5", "sw_hayaoshi", "早押し", "waza", 4, "威力 11（AGI）。この 番に 相手より 先に 動いたら 1.46 倍", [{ t: "dmg", pow: 11, stat: "agi", ifFirst: 0.46 }]),
    S("S6", "sw_kakureta", "かくれた かくれた", "waza", 6, "幻影 +25", [me("mirage", { amt: 25 })]),
    S("S7", "sw_choro", "ちょろちょろ", "waza", 7, "威力 6 × 2（AGI）と 幻影 +11", [{ t: "dmg", pow: 6, hits: 2, stat: "agi" }, me("mirage", { amt: 11 })]),
    S("S8", "sw_double", "ダブルクリック", "waza", 12, "この ターン、2 回 動く（2 回とも ほかの 技か 攻撃。それぞれの MP は 別に 使う）", [{ t: "again" }]),
    P("P1", "sw_sekkachi", "せっかち", "AGI +9%", { agiMul: 1.09 }),
    P("P2", "sw_niikai", "2 回 言う", "何回も 当てる 技は、14% で もう 1 回 当てる", { extraHit: 0.14 }),
    P("P3", "sw_yubi", "指が とまらない", "加速の あいだ、与える ダメージ +17%", { hasteDmg: 0.17 }),
    P("P4", "sw_flying", "フライング", "1 ターン目は かならず 先に 動く。先に 動いた 番は 与える ダメージ +16%", { firstStrike: true, firstDmg: 0.16 }),
    P("P5", "sw_sukimazuki", "すきま好き", "戦いの はじめに 幻影 +20", { startFx: [["mirage", 20]] }),
    P("P6", "sw_kachi", "かわして カチッ", "直接攻撃を かわす たびに、すかさず 威力 10（AGI）で かみつく（1 番に 1 回）", { dodgeBite: 10 }),
    P("P7", "sw_hashitta", "はしった はしった", "直接攻撃を かわす たびに 貫通 +14（次の 直接攻撃に 足す。重なる）", { dodgePierce: 14 }),
  ],
  // ---------- スタティック（ザザ。主能力 INT・副能力 DEF）：妨害 ＋ イタズラの 攻め ----------
  static: [
    S("S1", "st_sunaarashi", "砂あらし", "itazura", 3, "ザーッ。威力 18（INT）と 衰弱 +7。20% で 盲目（3 ターン）", [{ t: "dmg", pow: 18 }, foe("weakness", { amt: 7 }), foe("blind", { turns: 3, chance: 0.2 })]),
    S("S2", "st_seidenki", "静電気", "itazura", 4, "威力 11（INT）と 麻痺 +37", [{ t: "dmg", pow: 11 }, foe("paralysis", { amt: 37 })]),
    S("S3", "st_mukashi", "昔話", "itazura", 5, "長い 昔話で うんざりさせる。相手は 疲労（1 ターン）。話して 自分は 集中（3 ターン）", [foe("fatigue", { turns: 1 }), me("focus", { turns: 3 })]),
    S("S4", "st_biribiri", "ビリビリ", "itazura", 5, "威力 11（INT）と 麻痺 +66", [{ t: "dmg", pow: 11 }, foe("paralysis", { amt: 66 })]),
    S("S5", "st_channel", "チャンネルを 変える", "itazura", 6, "リモコンで 勝手に 変える。相手は 55% で 混乱（2 ターン）", [foe("confusion", { turns: 2, chance: 0.55 })]),
    S("S6", "st_houden", "放電", "itazura", 7, "威力 17（INT）。相手の デバフ 1 つに つき 威力 +7（デバフは 消さない）", [{ t: "dmg", pow: 17, perDebuff: 7 }]),
    S("S7", "st_short", "ショート", "itazura", 6, "帯電を ぜんぶ 使う。威力 8（INT）、帯電 1 に つき 威力 +4。帯電 5 以上なら 50% で 気絶（1 ターン）", [{ t: "spend", c: "static", all: true }, { t: "dmg", pow: 8, perSpent: 4 }, foe("stun", { turns: 1, chance: 0.5, ifSpent: 5 })]),
    S("S8", "st_housou", "放送終了", "itazura", 18, "プツッ。威力 26（INT）。相手は 沈黙（1 ターン。こうげき しか 使えない）と 盲目（3 ターン）", [{ t: "dmg", pow: 26 }, foe("silence", { turns: 1 }), foe("blind", { turns: 3 })]),
    P("P1", "st_monoshiri", "物知り", "INT +10%", { intMul: 1.1 }),
    P("P2", "st_glass", "分厚い ガラス", "DEF +10%", { defMul: 1.1 }),
    P("P3", "st_shibireru", "しびれる 話", "自分が 付ける 麻痺の 量 +39%", { fxAmtMul: { paralysis: 1.39 } }),
    P("P4", "st_denchi", "リモコンの 電池", "自分が 付ける 混乱の 確率 +9%・+1 ターン", { fxChanceAdd: { confusion: 0.09 }, extendIds: { confusion: 1 } }),
    P("P5", "st_noise", "ノイズまじり", "相手の デバフ 1 つに つき、与える ダメージ +3.4%", { perDebuff: 0.034 }),
    P("P6", "st_tameru", "静電気を ためる", "イタズラを 当てる たび・直接攻撃を 受ける たびに 帯電 +1", { cntOnItazuraHit: { static: 1 }, cntOnHurt: { static: 1 } }),
    P("P7", "st_mukashiwa", "むかしは よかった", "自分が 付けた デバフが 入る たびに MP +2", { debuffMp: 2 }),
  ],
  // ---------- タフ（ホリ。主能力 ATK・副能力 DEF）：重い 一撃 ＋ 守り ----------
  tough: [
    S("S1", "to_hitohori", "ひと掘り", "waza", 3, "威力 16（ATK）", [{ t: "dmg", pow: 16 }]),
    S("S2", "to_ana", "穴に もぐる", "waza", 4, "装甲 +24・障壁 +24", [me("armor", { amt: 24 }), me("ward", { amt: 24 })]),
    S("S3", "to_otoshiana", "落とし穴", "waza", 5, "60% で おさえこみ（2 ターン。おたがい 動けず、相手は 毎ターン HP 7.5% 減る）。落ちたら 相手の バフを 1 つ 消す", [{ t: "pin", turns: 2, pct: 0.075, chance: 0.6 }, { t: "dispel", n: 1, ifTag: "pin" }]),
    S("S4", "to_furikaburu", "ふりかぶる", "waza", 5, "チャージ（次に 与える ダメージ 2 倍）と 装甲 +17", [me("charge"), me("armor", { amt: 17 })]),
    S("S5", "to_horinuku", "掘り抜く", "waza", 6, "威力 17（ATK）。相手の DEF を 34% 無視し、貫通 +10 を 足して 打つ", [{ t: "dmg", pow: 17, ignore: 0.34, addPierce: 10 }]),
    S("S6", "to_chichu", "地中で 待つ", "waza", 6, "防御（1 ターン）と 装甲 +24・障壁 +24", [me("guard", { turns: 1 }), me("armor", { amt: 24 }), me("ward", { amt: 24 })]),
    S("S7", "to_koraeru", "ぐっと こらえる", "waza", 5, "防御（1 ターン）。この 番に 直接攻撃を 受けたら、受けた ダメージの 50% を 貫通に ためる", [me("guard", { turns: 1 }), { t: "brace", pct: 0.5 }]),
    S("S8", "to_bikutomo", "びくとも しない", "waza", 14, "装甲 +100・障壁 +100（次の 技・イタズラは 0。受ける たびに 量が 半分）。継続ダメージ・炎上・体調不良の 相殺・書留で 崩せる（対策の ある 無効）", [me("armor", { amt: 100 }), me("ward", { amt: 100 })]),
    P("P1", "to_hatarakimono", "働き者", "ATK +8%", { atkMul: 1.08 }),
    P("P2", "to_tsuchi", "土まみれ", "受けた ダメージの 1 割分の シールドを 得る", { hurtShield: 0.1 }),
    P("P3", "to_koshi", "腰を 入れる", "チャージで 打つ 攻撃 +25%", { chargeDmg: 0.25 }),
    P("P4", "to_chikamichi", "近道", "攻撃が 当たる たびに 貫通 +4", { hitPierce: 4 }),
    P("P5", "to_ganko", "がんこ", "HP が 半分 以下の とき、受ける ダメージ −15%", { lowHpCut: 0.15 }),
    P("P6", "to_hatarakisugi", "働きすぎ", "受けた ダメージ（継続ダメージも）の 17% を いつも 貫通に ためる", { hurtPierce: 0.17 }),
    P("P7", "to_helmet", "ヘルメット", "シールドが ある 間、受ける ダメージ −10%", { shieldCut: 0.1 }),
  ],
  // ---------- トランスルーセント（ユラ。主能力 INT・副能力 AGI）：回避 ＋ 回復 ＋ 毒 ----------
  translucent: [
    S("S1", "tr_yurayura", "ゆらゆらタッチ", "itazura", 4, "威力 15（INT）と 毒 +4・衰弱 +4", [{ t: "dmg", pow: 15 }, foe("poison", { amt: 4 }), foe("weakness", { amt: 4 })]),
    S("S2", "tr_fuwa", "ふわっと 浮く", "waza", 3, "幻影 +30", [me("mirage", { amt: 30 })]),
    S("S3", "tr_neon", "ネオンを あびる", "waza", 2, "蓄光 +2。光を あびて 集中（1 ターン）", [{ t: "gain", c: "glow", n: 2 }, me("focus", { turns: 1 })]),
    S("S4", "tr_yasashii", "やさしい 光", "waza", 7, "蓄光を ぜんぶ 使う。祝福（行動の あとに 最大 HP の 20% を 回復）を 1 ターン、蓄光 2 に つき +1 ターン。3 匹の ときは 味方 1 匹に（ソロは 自分に）", [{ t: "spend", c: "glow", all: true }, ally("blessing", { turns: 1, turnsBy: { spent: true, per: 2, add: 1 } })]),
    S("S5", "tr_mabushii", "まぶしく 光る", "itazura", 8, "蓄光を ぜんぶ 使う。威力 7（INT）、蓄光 1 に つき +5。相手は 盲目（3 ターン、蓄光 2 に つき +1 ターン）", [{ t: "spend", c: "glow", all: true }, { t: "dmg", pow: 7, perSpent: 5 }, foe("blind", { turns: 3, turnsBy: { spent: true, per: 2, add: 1 } })]),
    S("S6", "tr_sasu", "ゆらゆら 刺す", "itazura", 6, "毒 +13（重ねると ターンが のびる）", [foe("poison", { amt: 13 })]),
    S("S7", "tr_moudoku", "猛毒の 刺", "itazura", 10, "猛毒（1 ターン。行動の あとに 最大 HP の 20% の ダメージ）", [foe("venom", { turns: 1 })]),
    S("S8", "tr_sukitooru", "すきとおる 刺", "itazura", 12, "相手の 毒を、残り ターンの ぶん 一度に 回す（毒は 消える。重いほど・長いほど 強い）。あわせて 蓄光を 解放し、蓄光 1 に つき 相手に 麻痺 +10", [{ t: "spend", c: "glow", all: true }, { t: "dmg", pow: 0, consume: "poison", burst: true }, foe("paralysis", { amt: 0, amtBy: { spent: true, per: 1, add: 10 } })]),
    P("P1", "tr_neonzuki", "ネオン好き", "INT +14%。さわった 相手を 刺す（直接攻撃を 受けるたびに、50% で 攻めた 相手に 毒 +1）", { intMul: 1.14, whenHitFx: [["poison", 0.5, 1]] }),
    P("P2", "tr_yoruhikaru", "夜に 光る", "手番の おわりに 蓄光 +1", { cntTurnEnd: { glow: 1 } }),
    P("P3", "tr_honnori", "ほんのり", "蓄光が 1 以上 ある あいだ、手番の はじめに 最大 HP の 2.9% を 回復", { glowRegen: { at: 1, pct: 0.029 } }),
    P("P4", "tr_hashagi", "はしゃぎすぎ", "盲目の 相手に 与える ダメージ +20%。当てると 蓄光 +1", { vsFx: { blind: 0.2 }, cntOnHitVs: { blind: ["glow", 1] } }),
    P("P5", "tr_shitsukoi", "しつこい 毒", "自分が 付ける 毒は +4 ターン・量 +20%", { extendIds: { poison: 4 }, fxAmtMul: { poison: 1.2 } }),
    P("P6", "tr_tansan", "炭酸が はじける", "猛毒の 相手に 与える ダメージ +15%", { vsFx: { venom: 0.15 } }),
    P("P7", "tr_mienai", "見えない 刺", "自分が 付ける 毒は、相手の 状態異常の 抵抗率を 半分 無視する", { pierceResIds: { poison: 0.5 } }),
  ],
  // ---------- スパイキー（チク。主能力 DEF・副能力 RES）：守り ＋ 反撃（水分・栄養・成長の カウント） ----------
  spiky: [
    S("S1", "sp_chiku", "チクッ", "waza", 3, "威力 19。強さは DEF で 決まる。刺さって 相手の ATK 減少 +7（5 ターン）", [{ t: "dmg", pow: 19, stat: "def" }, foe("down_atk", { amt: 7, turns: 5 })]),
    S("S2", "sp_mizu", "水を のむ", "waza", 4, "水分 +3。HP を 10% 回復し、状態異常を ぜんぶ 消して 再生 +13", [{ t: "gain", c: "water", n: 3 }, { t: "heal", pct: 0.1 }, { t: "cure" }, me("regen", { amt: 13 })]),
    S("S3", "sp_hinata", "ひなたぼっこ", "waza", 4, "栄養 +3。棘 +16。日を あびて 集中（2 ターン）", [{ t: "gain", c: "nutrient", n: 3 }, me("thorns", { amt: 16 }), me("focus", { turns: 2 })]),
    S("S4", "sp_toge", "トゲを 立てる", "waza", 5, "棘 +77", [me("thorns", { amt: 77 })]),
    S("S5", "sp_gaman", "がまんの 限界", "waza", 6, "カウンター（1 ターン。受けた 直接ダメージの 80% を 返す）と 障壁 +24", [me("counter", { amt: 80, turns: 1 }), me("ward", { amt: 24 })]),
    S("S6", "sp_hiryo", "肥料を もらう", "waza", 6, "障壁 +48。栄養を ぜんぶ 使って、「オーバーヒール」か「棘を ふやす」を えらぶ（クローラーは コマンド、自動の 戦いは ガンビット）", [me("ward", { amt: 48 }), { t: "spend", c: "nutrient", all: true }], {
      choose: [{ key: "overheal", name: "オーバーヒール", text: "栄養 1 に つき 最大 HP の 4% の オーバーヒール", fx: [me("overheal", { amt: 0, amtBy: { spent: true, per: 1, add: 0.04, ofHp: true } })] },
               { key: "thorns", name: "棘を ふやす", text: "栄養 1 に つき 棘 +8", fx: [me("thorns", { amt: 0, amtBy: { spent: true, per: 1, add: 8 } })] }] }),
    S("S7", "sp_hakidasu", "水を はきだす", "waza", 3, "再生 +11。水分を ぜんぶ 使って、「回復量を 上げる」か「続けて 回復」を えらぶ", [me("regen", { amt: 11 }), { t: "spend", c: "water", all: true }], {
      choose: [{ key: "more", name: "回復量を 上げる", text: "水分 1 に つき 再生 +4", fx: [me("regen", { amt: 0, amtBy: { spent: true, per: 1, add: 4 } })] },
               { key: "drip", name: "続けて 回復", text: "水分 1 に つき 1 ターン、手番の はじめに 最大 HP の 4% を 回復", fx: [{ t: "drip", pct: 0.04 }] }] }),
    S("S8", "sp_kaika", "開花", "waza", 12, "棘と 成長を ぜんぶ 使う。威力 14（DEF）、棘 10 に つき +3。さらに 成長 1 に つき 15 の 貫通ダメージ（DEF も 装甲も 防御も 通り抜ける）", [{ t: "bloom", pow: 14, stat: "def", perThorns: 0.3, perGrowth: 15 }]),
    P("P1", "sp_cool", "クールな ふり", "DEF +10%", { defMul: 1.1 }),
    P("P2", "sp_ne", "根を はる", "水分と 栄養が どちらも 3 以上に なると、3 ずつ 合わせて 成長 +1。成長 1 に つき、棘で 返す ダメージ +10%（ためると 棘の もとの ダメージが 伸びる）", { rootMerge: 3, thornsPerGrowth: 0.1 }),
    P("P3", "sp_shiranpuri", "知らんぷり", "棘で 返す ダメージに DEF の 15% を 足す", { thornsDef: 0.15 }),
    P("P4", "sp_nenimotsu", "根に 持つ", "カウンターで 返す ダメージに DEF の 17% を 足す", { counterDef: 0.17 }),
    P("P5", "sp_futoi", "根っこが 太い", "障壁が ある あいだ、手番の おわりに 栄養 +1", { wardNutrient: 1 }),
    P("P6", "sp_mizuhake", "水はけが いい", "再生が 効く たびに 水分 +3", { regenWater: 3 }),
    P("P7", "sp_saku", "花が 咲く", "開花の あと、再生 +9、放った 成長 1 に つき +5", { bloomRegen: { base: 9, per: 5 } }),
  ],
  // ---------- グリーディ（チャリン。主能力 ATK・副能力 LUK）：ためて 放つ 大技 ＋ 会心（コインの カウント） ----------
  greedy: [
    S("S1", "gr_taiatari", "ずっしり 体当たり", "waza", 3, "威力 19（ATK）。当てると コイン +1", [{ t: "dmg", pow: 19, gainOnHit: { c: "coin", n: 1 } }]),
    S("S2", "gr_taberu", "コインを 食べる", "waza", 3, "コイン +3。HP を 13% 回復", [{ t: "gain", c: "coin", n: 3 }, { t: "heal", pct: 0.13 }]),
    S("S3", "gr_naraasu", "チャリチャリ 鳴らす", "waza", 1, "自分の 音が 好き。LUK 上昇 +27（3 ターン）。音に つられて 相手の バフが 1 つ 消える（消えたら コイン +1）", [me("up_luk", { amt: 27, turns: 3 }), { t: "dispel", n: 1, gainIf: { c: "coin", n: 1 } }]),
    S("S4", "gr_daiburumai", "大だんぶるまい", "waza", 6, "コインを ぜんぶ 使う。威力 7（ATK）、コイン 1 に つき +6", [{ t: "spend", c: "coin", all: true }, { t: "dmg", pow: 7, perSpent: 6, release: true }]),
    S("S5", "gr_hesokuri", "へそくり", "waza", 4, "コインを 3 使って、ATK 上昇 +20・LUK 上昇 +20（重なる。戦いの あいだ 残る）", [{ t: "spend", c: "coin", n: 3, need: 3 }, me("up_atk", { amt: 20, perm: true }), me("up_luk", { amt: 20, perm: true })]),
    S("S6", "gr_fukubiki", "福引き", "waza", 6, "威力 17（ATK）。会心の 確率に LUK × 0.9%、会心の ダメージに LUK × 1% を 足す", [{ t: "dmg", pow: 17, critLuk: 0.009, critDmgLuk: 0.01 }]),
    S("S7", "gr_manki", "満期", "waza", 7, "威力 13（ATK）。会心に ならない かわりに、コイン 1 に つき 威力 +3（コインは 使わない）", [{ t: "dmg", pow: 13, noCrit: true, perCnt: { c: "coin", k: 3 } }]),
    S("S8", "gr_ooatari", "大当たり", "waza", 13, "威力 26（ATK）。会心の 確率 +56%。会心の ダメージに LUK × 0.9 を 足す", [{ t: "dmg", pow: 26, critUp: 0.56, critDmgLuk: 0.009 }]),
    P("P1", "gr_zusshiri", "ずっしり", "ATK +6%。会心の ときは 相手の DEF・RES を 30% 無視", { atkMul: 1.06, critIgnore: 0.3 }),
    P("P2", "gr_pikapika", "ピカピカに 目がない", "直接攻撃を 受ける たびに コイン +1（1 回の 攻撃で 何回 当たっても 1 枚。ふられて チャリチャリ）。相手が バフを 付ける たびにも コイン +1（ピカピカを コインと まちがえる）", { cntOnHurt: { coin: 1 }, cntOnHurtOnce: true, cntOnFoeBuff: { coin: 1 } }),
    P("P3", "gr_harai", "腹いっぱい", "コイン 12 以上で 放つと、威力 1.3 倍", { bigRelease: { at: 12, mul: 1.3 } }),
    P("P4", "gr_kotsukotsu", "こつこつ", "手番の はじめに、コインが あれば 1 使って ATK 上昇 +3", { coinTick: 3 }),
    P("P5", "gr_kinun", "金運", "会心 + LUK × 0.3%", { critLuk: 0.003 }),
    P("P6", "gr_risoku", "利息", "会心で ない 攻撃の ダメージ、コイン 1 に つき +0.9%（最大 +20%）。会心で ない 攻撃は 相手の DEF・RES を 30% 無視", { coinInterest: { per: 0.009, max: 0.2 }, nonCritIgnore: 0.3 }),
    P("P7", "gr_charin", "チャリンチャリン", "ダメージの 計算で LUK を 使う ときの 効率が、コイン 1 に つき +8.3%（福引き・大当たり などの LUK が 強く なる）", { lukEff: 0.083 }),
  ],
  // ---------- マリアージュ（たこちー。主能力 ATK・副能力 INT）：炎上・凍傷 ＋ 野菜・肉・魚介の カウント ----------
  mariage: [
    S("S1", "ma_kizamu", "刻む", "waza", 1, "威力 14（ATK）。野菜 +1", [{ t: "dmg", pow: 14 }, { t: "gain", c: "veg", n: 1 }]),
    S("S2", "ma_yaku", "焼く", "waza", 1, "フライパンで。威力 7（ATK）と 炎上 +2。肉 +1", [{ t: "dmg", pow: 7 }, foe("burn", { amt: 2 }), { t: "gain", c: "meat", n: 1 }]),
    S("S3", "ma_hiyasu", "冷やす", "itazura", 4, "威力 7（INT）と 凍傷 +2。冷えて AGI 減少 +10（3 ターン）。魚介 +1。頭も 冷えて 集中（1 ターン）", [{ t: "dmg", pow: 7 }, foe("frostbite", { amt: 2 }), foe("down_agi", { amt: 10, turns: 3 }), { t: "gain", c: "fish", n: 1 }, me("focus", { turns: 1 })]),
    S("S4", "ma_tsuyobi", "強火で 炒める", "waza", 4, "威力 16（ATK）と 炎上 +5。火傷（3 ターン。炎上の ダメージ 1.5 倍）", [{ t: "dmg", pow: 16 }, foe("burn", { amt: 5 }), foe("scald", { turns: 3 })]),
    S("S5", "ma_kyusoku", "急速冷凍", "itazura", 5, "凍傷 +5。凍傷が 6 以上なら 26% で 凍結（1 ターン）", [foe("frostbite", { amt: 5 }), foe("freeze", { turns: 1, chance: 0.26, atLeast: { id: "frostbite", n: 6 } })]),
    S("S6", "ma_osusume", "本日の おすすめ", "waza", 2, "料理を 1 つ えらぶ（クローラーは コマンド、自動の 戦いは ガンビット）。野菜炒め：野菜 3 を 使い、肉を 参照、魚介が 貯まる（+1）。活性化 2 ターン、肉 2 ごとに +1 ターン。ステーキ：肉 3 を 使い、魚介を 参照、野菜が 貯まる。チャージ、魚介 1 ごとに 次の 一撃 +5%。海鮮焼き：魚介 3 を 使い、野菜を 参照、肉が 貯まる。狂乱 1 ターン、野菜 2 ごとに +1 ターン", [], {
      choose: [{ key: "yasai", name: "野菜炒め", need: { veg: 3 }, fx: [{ t: "spend", c: "veg", n: 3 }, me("activation", { turns: 2, turnsBy: { c: "meat", per: 2, add: 1, ref: true } }), { t: "gain", c: "fish", n: 1 }] },
               { key: "steak", name: "ステーキ", need: { meat: 3 }, fx: [{ t: "spend", c: "meat", n: 3 }, me("charge"), { t: "chargeBonus", c: "fish", per: 0.05, ref: true }, { t: "gain", c: "veg", n: 1 }] },
               { key: "kaisen", name: "海鮮焼き", need: { fish: 3 }, fx: [{ t: "spend", c: "fish", n: 3 }, me("frenzy", { turns: 1, turnsBy: { c: "veg", per: 2, add: 1, ref: true } }), { t: "gain", c: "meat", n: 1 }] }] }),
    S("S7", "ma_mariage", "マリアージュ", "waza", 3, "2 種を 2 ずつ 使い、2 つの 効果を 同時に（野菜＋肉＝活性化＋チャージ など）。使わなかった 1 種を 参照（3 ごとに +1 ターン）、使わなかった 1 種が 貯まる（+1）", [], {
      choose: [{ key: "vm", name: "野菜＋肉", need: { veg: 2, meat: 2 }, fx: [{ t: "spend", c: "veg", n: 2 }, { t: "spend", c: "meat", n: 2 }, me("activation", { turns: 2, turnsBy: { c: "fish", per: 3, add: 1, ref: true } }), me("charge"), { t: "gain", c: "fish", n: 1 }, { t: "pairDone", ref: "fish" }] },
               { key: "mf", name: "肉＋魚介", need: { meat: 2, fish: 2 }, fx: [{ t: "spend", c: "meat", n: 2 }, { t: "spend", c: "fish", n: 2 }, me("charge"), me("frenzy", { turns: 1, turnsBy: { c: "veg", per: 3, add: 1, ref: true } }), { t: "gain", c: "veg", n: 1 }, { t: "pairDone", ref: "veg" }] },
               { key: "fv", name: "魚介＋野菜", need: { fish: 2, veg: 2 }, fx: [{ t: "spend", c: "fish", n: 2 }, { t: "spend", c: "veg", n: 2 }, me("frenzy", { turns: 1, turnsBy: { c: "meat", per: 3, add: 1, ref: true } }), me("activation", { turns: 2, turnsBy: { c: "meat", per: 3, add: 1, ref: true } }), { t: "gain", c: "meat", n: 1 }, { t: "pairDone", ref: "meat" }] }] }),
    S("S8", "ma_fullcourse", "フルコース", "waza", 6, "野菜・肉・魚介を 3 ずつ 使って、活性化・チャージ・狂乱を 一度に。その まま 威力 20 の 一撃（ATK と INT の 高い 方で）", [{ t: "spend", c: "veg", n: 3, need: 3 }, { t: "spend", c: "meat", n: 3, need: 3 }, { t: "spend", c: "fish", n: 3, need: 3 }, me("activation", { turns: 2 }), me("charge"), me("frenzy", { turns: 1 }), { t: "dmg", pow: 20, stat: "atkint" }, { t: "refill" }]),
    P("P1", "ma_nekketsu", "熱血", "ATK +10%", { atkMul: 1.1 }),
    P("P2", "ma_ajimi", "味見", "材料を 使う たびに、使った 数 1 に つき HP を 2% 回復", { tasteHeal: 0.02 }),
    P("P3", "ma_kogete", "こげても 胸を はる", "炎上を 付ける たびに 肉 +1", { burnMeat: 1 }),
    P("P4", "ma_kaitou", "解凍上手", "凍結した 相手への 最初の 攻撃 +30%（とける ときの 貫通ダメージに 足す）", { thawBonus: 0.3 }),
    P("P5", "ma_tabeawase", "食べ合わせ", "参照する 材料が 5 以上なら、効果 1.5 倍", { refBoost: { at: 5, mul: 1.5 } }),
    P("P6", "ma_aishou", "相性 ばつぐん", "合わせた あと 2 ターン、与える ダメージ +10%（参照した 材料が 5 以上なら +20%）", { pairDmg: { v: 0.1, high: 0.2, at: 5, turns: 2 } }),
    P("P7", "ma_okawari", "おかわり 自由", "フルコースの あと、野菜・肉・魚介が 1 ずつ もどる", { refill: 1 }),
  ],
  // ---------- スプーキー（ペラ。主能力 DEX・副能力 INT）：衰弱で 抵抗を 下げて 朦朧、会心で 再生 ----------
  spooky: [
    S("S1", "so_katakata", "カタカタ", "itazura", 2, "アルミの 板を 鳴らす。威力 16（DEX）と 衰弱 +7", [{ t: "dmg", pow: 16, stat: "dex" }, foe("weakness", { amt: 7 })]),
    S("S2", "so_urameshiya", "うらめしや", "itazura", 2, "34% で 朦朧（2 ターン。受ける 攻撃が かならず 会心）。こわがって 相手の バフを 1 つ 消す", [foe("daze", { turns: 2, chance: 0.34 }), { t: "dispel", n: 1 }]),
    S("S3", "so_kami", "顔の 紙を なおす", "waza", 4, "再生 +24", [me("regen", { amt: 24 })]),
    S("S4", "so_shouji", "しょうじの 影", "itazura", 5, "衰弱 +27。衰弱が 30 以上なら 朦朧（2 ターン）", [foe("weakness", { amt: 27 }), foe("daze", { turns: 2, atLeast: { id: "weakness", n: 30 } })]),
    S("S5", "so_burari", "天井から ぶらり", "itazura", 6, "60% で 朦朧（2 ターン）。当たれば 衰弱 +16", [foe("daze", { turns: 2, chance: 0.6 }), foe("weakness", { amt: 16, ifTag: "daze" })]),
    S("S6", "so_me", "紙の 目が 動く", "waza", 5, "明瞭（2 ターン）と 研鑽 +16（会心の とき DEX を 足す）", [me("clarity", { turns: 2 }), me("mastery", { amt: 16 })]),
    S("S7", "so_migaku", "アルミを 磨く", "waza", 3, "再生 +35。3 匹の ときは 味方 1 匹にも（ソロは 自分に）", [me("regen", { amt: 35 }), ally("regen", { amt: 35, notSelf: true })]),
    S("S8", "so_mekureru", "紙が めくれる", "itazura", 13, "顔の 紙の 下を 見せる。威力 18（DEX）。相手は 衰弱 +35 と 朦朧（2 ターン）、自分は 明瞭（2 ターン）", [{ t: "dmg", pow: 18, stat: "dex" }, foe("weakness", { amt: 35 }), foe("daze", { turns: 2 }), me("clarity", { turns: 2 })]),
    P("P1", "so_perapera", "ペラペラ", "DEX +10%", { dexMul: 1.1 }),
    P("P2", "so_shikitari", "古い しきたり", "衰弱の 相手に 付ける 朦朧は +1 ターン", { dazeVsWeak: 1 }),
    P("P3", "so_yofuke", "夜ふけ", "自分が 付けた 衰弱は +1 ターン", { extendIds: { weakness: 1 } }),
    P("P4", "so_bikkuri", "びっくり", "朦朧を 付けた 番、その 相手への 攻撃 +20%", { dazeTurnDmg: 0.2 }),
    P("P5", "so_renda", "カタカタ 連打", "明瞭の あいだ、会心の ダメージ +20%", { clarityCritDmg: 20 }),
    P("P6", "so_kazetooshi", "風通し", "会心が 出る たびに 再生 +6", { critRegen: 6 }),
    P("P7", "so_mitena", "見て しまったな", "朦朧の 相手に 会心が 出る たびに 再生 +6", { critVsDazeRegen: 6 }),
  ],
  // ---------- シャープ（クロトラ。主能力 INT・副能力 DEF）：シールドを 使って レーザー ＋ 弱らせ ----------
  sharp: [
    S("S1", "sh_shousha", "照射", "itazura", 4, "威力 5（INT）。シールドが あれば 最大 HP の 5% 分を 使って 威力 +8 と、相手の バフを 1 つ 消す。照準が 定まって 集中（2 ターン）", [{ t: "dmg", pow: 5, shieldUse: { pct: 0.05, add: 8 } }, { t: "dispel", n: 1, ifShield: true }, me("focus", { turns: 2 })]),
    S("S2", "sh_soukou", "装甲展開", "waza", 6, "自分に シールド（最大 HP の 8.7%）", [{ t: "shield", pct: 0.087 }]),
    S("S3", "sh_bouheki", "防壁", "waza", 6, "バリア +1。3 匹の ときは 味方 1 匹にも（ソロは 自分だけ）", [me("barrier", { amt: 1 }), ally("barrier", { amt: 1, notSelf: true })]),
    S("S4", "sh_hainetsu", "排熱", "itazura", 5, "体調不良 +3", [foe("sickness", { amt: 3 })]),
    S("S5", "sh_jamming", "ジャミング", "itazura", 5, "疲労（2 ターン）と、相手の MP −10%", [foe("fatigue", { turns: 2 }), { t: "mpCut", pct: 0.1 }]),
    S("S6", "sh_rensha", "連射", "itazura", 5, "シールドを 3% ずつ 使って、威力 3 × 3（INT）", [{ t: "dmg", pow: 3, hits: 3, shieldUse: { per: 0.03 } }]),
    S("S7", "sh_shusoku", "収束", "itazura", 7, "シールドを 半分 使って、威力 7（INT）、使った シールド 2 に つき 威力 +1", [{ t: "dmg", pow: 7, shieldUse: { half: true } }]),
    S("S8", "sh_laser", "凝縮レーザー", "itazura", 12, "シールドを ぜんぶ 使う。威力 8（INT）＋ 使った シールドの 量（RES で 減る）", [{ t: "dmg", pow: 8, shieldUse: { all: true } }]),
    P("P1", "sh_reisei", "冷静", "INT +6%", { intMul: 1.06 }),
    P("P2", "sh_kaishu", "エネルギー回収", "自分の バフが 切れる とき・消される とき、むだに せず シールドに する（バフ 1 つに つき 最大 HP の 6%）", { buffEndShield: 0.06 }),
    P("P3", "sh_osen", "汚染", "自分が 付ける 体調不良の 量 +50%", { fxAmtMul: { sickness: 1.5 } }),
    P("P4", "sh_choki", "長期運用", "自分が 付ける 疲労は +2 ターン", { extendIds: { fatigue: 2 } }),
    P("P5", "sh_reikyaku", "冷却", "連射の あと、シールド（最大 HP の 3%）", { afterSkillShield: { sh_rensha: 0.03 } }),
    P("P6", "sh_kouritsu", "エネルギー効率", "収束の あと、使った シールドの 20% が もどる", { convergeRefund: 0.2 }),
    P("P7", "sh_ijounashi", "異常なし。……以上。", "凝縮レーザーの あと、バリア +1 と シールド（最大 HP の 10%）", { afterLaser: { barrier: 1, shield: 0.1 } }),
  ],
  // ---------- フレキシブル（テク。主能力・副能力は 育て方で 変わる）：上昇で 中身が 変わる オールラウンダー ----------
  // 上昇ごとに 付く 物：ATK → 相手に 炎上・DEX → 相手に 凍傷・INT → 相手に 体調不良・RES → 自分に 再生・DEF → 自分に 装甲・AGI → 自分に 幻影
  flexible: [
    S("S2", "fl_kunkun", "くんくん", "waza", 3, "威力 7（攻めの 能力の いちばん 高い 物で）。量の いちばん 多い 上昇で 付く 物が 変わる（炎上 +3・凍傷 +3・体調不良 +3・再生 +8・装甲 +15・幻影 +15）。嗅ぎつけて 相手の 上昇を 1 つ 消す", [{ t: "dmg", pow: 7, stat: "best" }, { t: "flex" }, { t: "dispel", n: 1, only: "up_" }]),
    S("S1", "fl_hashiri", "走りまわる", "waza", 4, "使う たびに ATK → DEX → INT の 順で 上昇 +20（3 ターン）。合わせて 相手に 押しつける（ATK→炎上 +3・DEX→凍傷 +3・INT→体調不良 +3）。走って 活性化（3 ターン。技の MP が 半分）", [me("activation", { turns: 3 }), { t: "cycle", key: "hashiri", up: { amt: 20, turns: 3 }, list: [["atk", "foe", "burn", 3], ["dex", "foe", "frostbite", 3], ["int", "foe", "sickness", 3]] }]),
    S("S3", "fl_shippo", "しっぽを ふる", "waza", 5, "使う たびに RES → DEF → AGI の 順で 上昇 +20（3 ターン）。合わせて 味方 1 匹に（ソロは 自分に）付ける（RES→再生 +8・DEF→装甲 +15・AGI→幻影 +15）", [{ t: "cycle", key: "shippo", up: { amt: 20, turns: 3 }, list: [["res", "ally", "regen", 8], ["def", "ally", "armor", 15], ["agi", "ally", "mirage", 15]] }]),
    S("S4", "fl_dash", "ダッシュ", "waza", 5, "威力 18。くんくんと 同じ ように、上昇で 付く 物が 変わる", [{ t: "dmg", pow: 18, stat: "best" }, { t: "flex" }]),
    S("S5", "fl_kibun", "気分 しだい", "waza", 2, "気分屋（3 ターン）。その あいだ、いちばん 多い 上昇の 種類が 変わる たびに、その 上昇の 効果が はじける（くんくんの 3 倍：炎上 +9・凍傷 +9・体調不良 +9・再生 +24・装甲 +45・幻影 +45）", [me("moody", { turns: 3, amt: 3 })]),
    S("S6", "fl_osusowake", "おすそわけ", "waza", 6, "自分の 上昇を ぜんぶ 使う。威力 16（攻めの 能力の いちばん 高い 物で）、使った 上昇 1 種類に つき +8。当たると、使った 上昇を 同じ 種類・同じ 量の 減少に して 相手に 押しつける（3 ターン）", [{ t: "convertUps" }, { t: "dmg", pow: 16, stat: "best", perSpent: 8 }, { t: "pushDowns", turns: 3 }]),
    S("S7", "fl_tobikakaru", "とびかかる", "waza", 7, "自分の バフ（上昇・装甲・幻影・再生 など）を ぜんぶ 使う。威力 20（攻めの 能力の いちばん 高い 物で）、使った バフ 1 つに つき +6。当たると、いちばん 多かった 上昇で 相手を 止める（ATK・DEF→気絶 1 ターン／DEX・AGI→凍結 3 ターン／INT・RES→混乱 3 ターン）", [{ t: "consumeBuffs" }, { t: "dmg", pow: 20, stat: "best", perSpent: 6 }, { t: "impede", map: { atk: ["stun", 1], def: ["stun", 1], dex: ["freeze", 3], agi: ["freeze", 3], int: ["confusion", 3], res: ["confusion", 3] } }]),
    S("S8", "fl_yorimichi", "寄り道", "waza", 10, "かかって いる 上昇を、攻め ↔ 守りで ぜんぶ 入れかえる（ATK ↔ DEF・DEX ↔ AGI・INT ↔ RES。量と ターンは その まま）。その あと、くんくんの 効果を 一度に", [{ t: "swapUps" }, { t: "flex" }]),
    P("P1", "fl_genki", "元気いっぱい", "自分に かける 上昇 +2", { upAdd: 2 }),
    P("P2", "fl_madaikeru", "まだ いける", "上昇が 3 種類 以上 ある あいだ、与える ダメージ +10%", { upTypesDmg: { at: 3, v: 0.1 } }),
    P("P3", "fl_icchokusen", "一直線", "変わる 技の 効果 2 倍（いちばん 多い 上昇 1 つで 変わる）", { flexMul: 2 }),
    P("P4", "fl_yorimichisanpo", "よりみち散歩", "上昇が 3 種類 以上の とき、変わる 技は かかって いる 種類 ぜんぶの 効果が 出る（1 つずつ 6 割）", { flexAll: { at: 3, mul: 0.6 } }),
    P("P5", "fl_nikka", "日課", "自分に かける 上昇は +1 ターン", { upTurns: 1 }),
    P("P6", "fl_lastspurt", "ラストスパート", "自分に かける 上昇の 量 +37%、ターン −2（最低 1）", { upMul: 1.37, upTurnsCut: 2 }),
    P("P7", "fl_yorimichijouzu", "寄り道上手", "入れかえた 上昇は、量 +10・+2 ターン", { swapBonus: { amt: 10, turns: 2 } }),
  ],
};
