// 精鋭の 解析ツリー（戦いで 使う 形）その b：精鋭 12〜22 の 11 本
// 名前・MP・文は 資料 docs/mono-link-crawler-elite-skills.md の「解析で 手に 入る ツリー」（crawler-analysis-data.js）の まま。fx は battle-sim.js の 言葉で 書く
// battle-sim.js に まだ ない 鍵は 下の NEEDS に 書いた（いまの 計算では 近い 形で はたらく：aoe は 1 匹だけ・team は HP の いちばん 減った 味方だけ など）
import { D, F, M, H, CURE, DIS, SH, S, P, G } from "./tree-kit.js";
import { ANALYSIS } from "./crawler-analysis-data.js";
const tx = (name, slot) => ANALYSIS[name].rows.find((r) => r.slot === slot).text; // 文は 資料の まま
const t = (name, slot) => ({ text: tx(name, slot) });
const ally = { who: "ally" }, all = { who: "ally", team: true };   // 味方 1 匹（ソロは 自分）・味方 全員（ソロは 自分）

const VO = "SHORT FUSE", CH = "PORCELAIN", EA = "FIRST LIGHT", UN = "BRUISER", WA = "RUST PILGRIM", GR = "BACKBONE";
const CA = "STALEMATE", AN = "NOBODY", TE = "HUSH", EG = "SPARKY", DV = "PAPER LANTERN";

export const TREES = {
  // 12 SHORT FUSE（ブラウン管・キャスター）：しびれさせ、火を つけ、かんしゃくで 自分ごと 燃え上がる
  x_volatile: { name: "ボラタイル", enemy: VO, analysis: true, dungeon: null, rank: "精鋭", type: "caster", main: "int", sub: "mp", theme: "paralysis",
    list: [
      S(1, "x_volatile_s1", "逆流", "itazura", 3, [D(7), { t: "mpDrain", n: 2 }], t(VO, "S1")),
      S(2, "x_volatile_s2", "放電", "itazura", 4, [D(4, { aoe: true }), F("paralysis", 12, { aoe: true })], t(VO, "S2")),
      S(3, "x_volatile_s3", "導火線", "itazura", 4, [F("burn", 2), F("scald", 2)], t(VO, "S3")),
      S(4, "x_volatile_s4", "ショート", "itazura", 5, [D(9), F("stun", 1, { chance: 0.2, atLeast: { id: "paralysis", n: 20 } })], t(VO, "S4")),
      S(5, "x_volatile_s5", "かんしゃく", "waza", 4, [M("frenzy", 2)], t(VO, "S5")),
      S(6, "x_volatile_s6", "焼くぞ", "itazura", 6, [D(10, { vsFx: { scald: 0.3 } })], t(VO, "S6")),
      S(7, "x_volatile_s7", "出力上げるぞ", "itazura", 6, [M("up_int", 15, { turns: 3 }), F("paralysis", 12)], t(VO, "S7")),
      S(8, "x_volatile_s8", "大停電", "itazura", 11, [D(20, { aoe: true }), F("blind", 1, { aoe: true })], t(VO, "S8")),
      P(1, "x_volatile_p1", "熱い頭", tx(VO, "P1"), { intMul: 1.05 }),
      P(2, "x_volatile_p2", "短気", tx(VO, "P2"), { hurtUp: [{ id: "up_int", n: 3, max: 15 }] }),
      P(3, "x_volatile_p3", "番人", tx(VO, "P3"), { vsFx: { paralysis: 0.1 } }),
      P(4, "x_volatile_p4", "ヒューズが飛ぶ", tx(VO, "P4"), { lowHpOnce: [[0.3, "up_int", 12]] }),
      P(5, "x_volatile_p5", "火の手", tx(VO, "P5"), { fxAmtAdd: { burn: 1 }, extendIds: { scald: 1 } }),
      P(6, "x_volatile_p6", "過電流", tx(VO, "P6"), { fxAmtAdd: { paralysis: 5 } }),
      P(7, "x_volatile_p7", "ブレーカー", tx(VO, "P7"), { vsFx: { blind: 0.12 }, startFx: [["focus", undefined, 2]] }),
    ],
    plan: [G("first", undefined, "x_volatile_s7"), G("mpAtLeast", 11, "x_volatile_s8"), G("foeNotHas", "paralysis", "x_volatile_s2"), G("foeHas", "scald", "x_volatile_s6"), G("foeNotHas", "burn", "x_volatile_s3"), G("always", undefined, "x_volatile_s1")] },

  // 13 PORCELAIN（マウス・テクニシャン）：にこやかな まま バフを 差し押さえ、回復を 対象外に し、笑顔で 崩れない
  x_cheerful: { name: "チアフル", enemy: CH, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: "rot",
    list: [
      S(1, "x_cheerful_s1", "現場検証", "waza", 3, [D(7, { stat: "dex", perDebuff: 2 })], t(CH, "S1")),
      S(2, "x_cheerful_s2", "作り笑い", "waza", 3, [M("mirage", 12)], t(CH, "S2")),
      S(3, "x_cheerful_s3", "差し押さえ", "waza", 5, [D(6, { stat: "dex" }), DIS(1)], t(CH, "S3")),
      S(4, "x_cheerful_s4", "対象外", "itazura", 5, [F("rot", 1)], t(CH, "S4")),
      S(5, "x_cheerful_s5", "保留", "itazura", 4, [F("paralysis", 15)], t(CH, "S5")),
      S(6, "x_cheerful_s6", "営業スマイル", "waza", 6, [M("mirage", 10), M("ward", 12)], t(CH, "S6")),
      S(7, "x_cheerful_s7", "あなたが事故", "waza", 6, [D(11, { stat: "dex", bonusIf: { foeNoBuff: 0.3 } })], t(CH, "S7")),
      // 消した 数を カウント（seized）に して、すぐ 全部 使い、1 に つき 威力 +3
      S(8, "x_cheerful_s8", "免責", "waza", 11, [{ t: "dispel", n: 2, gainIf: { c: "seized", n: 1 } }, { t: "spend", c: "seized", all: true }, D(18, { stat: "dex", perSpent: 3 })], t(CH, "S8")),
      P(1, "x_cheerful_p1", "慇懃", tx(CH, "P1"), { startFx: [["ward", 10]] }),
      P(2, "x_cheerful_p2", "ひび", tx(CH, "P2"), { lowHpOnce: [[0.5, "up_agi", 10]] }),
      P(3, "x_cheerful_p3", "書類仕事", tx(CH, "P3"), { extendIds: { rot: 1 } }),
      P(4, "x_cheerful_p4", "押印", tx(CH, "P4"), { vsFx: { paralysis: 0.1 } }),
      P(5, "x_cheerful_p5", "陶器の肌", tx(CH, "P5"), { dmgCut: 4 }),
      P(6, "x_cheerful_p6", "査定済み", tx(CH, "P6"), { perDebuff: 0.04 }),
      P(7, "x_cheerful_p7", "万一のときは", tx(CH, "P7"), { lowHpOnce: [[0.3, "mirage", 15], [0.3, "ward", 15]] }),
    ],
    plan: [G("first", undefined, "x_cheerful_s6"), G("foeBuffed", undefined, "x_cheerful_s8"), G("foeBuffed", undefined, "x_cheerful_s3"), G("foeNotHas", "paralysis", "x_cheerful_s5"), G("mpAtLeast", 6, "x_cheerful_s7"), G("always", undefined, "x_cheerful_s1")] },

  // 14 FIRST LIGHT（しか・アタッカー）：正しさで 自分を 高め、攻めて きた 相手に 罰を 下し、迷いも 力に する
  x_earnest: { name: "アーネスト", enemy: EA, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "agi", theme: null,
    list: [
      S(1, "x_earnest_s1", "夜明けの一撃", "waza", 3, [D(9)], t(EA, "S1")),
      S(2, "x_earnest_s2", "正しさ", "waza", 4, [M("up_atk", 15, { turns: 3 }), M("immunity", 8)], t(EA, "S2")),
      S(3, "x_earnest_s3", "鐘の音", "waza", 4, [D(6), F("daze", 1, { chance: 0.25 })], t(EA, "S3")),
      S(4, "x_earnest_s4", "罰", "waza", 5, [D(9, { bonusIf: { foeHit: 0.3 } })], t(EA, "S4")),
      S(5, "x_earnest_s5", "迷い", "waza", 4, [M("charge", undefined, { hpCost: 0.1 })], t(EA, "S5")),
      S(6, "x_earnest_s6", "判決", "waza", 6, [D(12), F("down_def", 10, { turns: 2 })], t(EA, "S6")),
      S(7, "x_earnest_s7", "朝焼け", "waza", 6, [D(6, { hits: 2 }), M("up_agi", 12, { turns: 2 })], t(EA, "S7")),
      S(8, "x_earnest_s8", "黎明", "waza", 11, [D(24), M("clarity", 1)], t(EA, "S8")),
      P(1, "x_earnest_p1", "まっすぐ", tx(EA, "P1"), { crit: 0.05 }),
      P(2, "x_earnest_p2", "若さ", tx(EA, "P2"), { startFx: [["haste", undefined, 2]] }),
      P(3, "x_earnest_p3", "正しい怒り", tx(EA, "P3"), { hurtUp: [{ id: "up_atk", n: 10, max: 10, turns: 1, direct: true }] }),
      P(4, "x_earnest_p4", "迷いを越えて", tx(EA, "P4"), { chargeDmg: 0.1 }),
      P(5, "x_earnest_p5", "判決文", tx(EA, "P5"), { vsLowHp: 0.1 }),
      P(6, "x_earnest_p6", "夜明けの空", tx(EA, "P6"), { agiMul: 1.05 }),
      P(7, "x_earnest_p7", "決まりの外", tx(EA, "P7"), { atkMul: 1.05, lowHpOnce: [[0.3, "frenzy", undefined, 1]] }),
    ],
    plan: [G("first", undefined, "x_earnest_s2"), G("mpAtLeast", 11, "x_earnest_s8"), G("every", 3, "x_earnest_s5"), G("foeNotHas", "down_def", "x_earnest_s6"), G("foeNotHas", "daze", "x_earnest_s3"), G("always", undefined, "x_earnest_s1")] },

  // 15 BRUISER（もぐら・ディフェンダー）：受けて 固く なり、受けた 分を 返し、破れても 笑って 直す
  x_unflinching: { name: "アンフリンチング", enemy: UN, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: null,
    list: [
      S(1, "x_unflinching_s1", "体当たり", "waza", 3, [D(8, { stat: "def" })], t(UN, "S1")),
      S(2, "x_unflinching_s2", "試験開始", "waza", 3, [M("armor", 15)], t(UN, "S2")),
      S(3, "x_unflinching_s3", "絆創膏", "waza", 5, [H(0.12), M("regen", 6)], t(UN, "S3")),
      S(4, "x_unflinching_s4", "打たれ自慢", "waza", 5, [M("counter", 1)], t(UN, "S4")),
      // 身代わりを 持つ 子が 味方への 直接攻撃を 受ける（main-trees の 荷物を 守る と 同じ 書き方）
      S(5, "x_unflinching_s5", "前は任せて", "waza", 5, [M("substitute", 1, { solo: [M("guard", 1), M("thorns", 15)] })], t(UN, "S5")),
      S(6, "x_unflinching_s6", "遠慮なく来て", "waza", 6, [M("thorns", 20), M("up_def", 12, { turns: 3 })], t(UN, "S6")),
      S(7, "x_unflinching_s7", "データは取れた", "waza", 6, [D(9, { stat: "def", drain: 0.3 })], t(UN, "S7")),
      S(8, "x_unflinching_s8", "まだ破れてない", "waza", 10, [H(0.2), SH(0.1), M("armor", 15)], t(UN, "S8")),
      P(1, "x_unflinching_p1", "新しい繊維", tx(UN, "P1"), { startFx: [["armor", 15]] }),
      P(2, "x_unflinching_p2", "あざ自慢", tx(UN, "P2"), { hurtUp: [{ id: "up_def", n: 2, max: 12, direct: true }] }),
      P(3, "x_unflinching_p3", "打たれ返し", tx(UN, "P3"), { counterDef: 0.1 }),
      P(4, "x_unflinching_p4", "体育会", tx(UN, "P4"), { guardNext: 0.12 }),
      P(5, "x_unflinching_p5", "打たれ強い", tx(UN, "P5"), { thornsDef: 0.1 }),
      P(6, "x_unflinching_p6", "傷の数だけ", tx(UN, "P6"), { healMul: 1.1 }),
      P(7, "x_unflinching_p7", "あざは勲章", tx(UN, "P7"), { dmgCut: 4, lowHpCut: 0.04 }),
    ],
    plan: [G("first", undefined, "x_unflinching_s2"), G("hpBelow", 40, "x_unflinching_s8"), G("hpBelow", 60, "x_unflinching_s3"), G("selfNotHas", "thorns", "x_unflinching_s6"), G("every", 3, "x_unflinching_s4"), G("always", undefined, "x_unflinching_s1")] },

  // 16 RUST PILGRIM（もぐら・ヒーラー）：拾って 直し、道しるべで 長く 歩かせ、昔話で 足を 止める
  x_wandering: { name: "ワンダリング", enemy: WA, analysis: true, dungeon: null, rank: "精鋭", type: "healer", main: "int", sub: "res", theme: "sleep",
    list: [
      S(1, "x_wandering_s1", "杖で叩く", "itazura", 3, [D(8, { stat: "res" })], t(WA, "S1")),
      S(2, "x_wandering_s2", "拾い物", "waza", 4, [{ ...H(0.15), ...ally }], t(WA, "S2")),
      S(3, "x_wandering_s3", "錆の鈴", "itazura", 4, [F("down_agi", 12, { turns: 2, aoe: true })], t(WA, "S3")),
      S(4, "x_wandering_s4", "道しるべ", "waza", 5, [M("regen", 8, ally), M("immunity", 8, ally)], t(WA, "S4")),
      S(5, "x_wandering_s5", "昔話", "itazura", 5, [F("sleep", 1, { chance: 0.2, elseFx: { id: "fatigue", turns: 1 } })], t(WA, "S5")),
      S(6, "x_wandering_s6", "ひと休み", "waza", 6, [M("blessing", 1)], t(WA, "S6")),
      S(7, "x_wandering_s7", "熱が動いとる", "waza", 6, [M("mirage", 8, { ...all, solo: [M("mirage", 15)] })], t(WA, "S7")),
      S(8, "x_wandering_s8", "長い道のり", "waza", 11, [{ ...CURE, ...all }, M("regen", 6, { ...all, solo: [M("regen", 10)] }), M("blessing", 1, all)], t(WA, "S8")),
      P(1, "x_wandering_p1", "錆びた体", tx(WA, "P1"), { dmgCut: 3 }),   // 2026-11-12 鹿さん「こういうスキルを作るなと言いませんでしたっけ？」：毒・炎上 などに 強い（受けた ときだけ はたらく）を いつも はたらく 効果に
      P(2, "x_wandering_p2", "ひとり歩き", tx(WA, "P2"), { healMul: 1.1 }),
      P(3, "x_wandering_p3", "道を知っとる", tx(WA, "P3"), { fxAmtMul: { regen: 1.4 } }),
      P(4, "x_wandering_p4", "長話", tx(WA, "P4"), { fxChanceAdd: { sleep: 0.1 } }),
      P(5, "x_wandering_p5", "歩き慣れ", tx(WA, "P5"), { hpRegen: 0.01 }),
      P(6, "x_wandering_p6", "前ぶれ", tx(WA, "P6"), { startFx: [["mirage", 8]] }),
      P(7, "x_wandering_p7", "錆びても歩ける", tx(WA, "P7"), { onceFx: [{ on: "lowHp", at: 0.3, cure: true, fx: [["regen", 10]] }] }),
    ],
    plan: [G("hpBelow", 40, "x_wandering_s8"), G("hpBelow", 60, "x_wandering_s2"), G("first", undefined, "x_wandering_s3"), G("selfNotHas", "regen", "x_wandering_s4"), G("foeNotHas", "fatigue", "x_wandering_s5"), G("always", undefined, "x_wandering_s1")] },

  // 17 BACKBONE（もぐら・ディフェンダー）：支柱を 立てて 動かず、仲間を 掘り出し、地面ごと 崩して 足を 止める
  x_grounded: { name: "グラウンデッド", enemy: GR, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: null,
    list: [
      S(1, "x_grounded_s1", "つるはし", "waza", 3, [D(8, { stat: "def" }), M("pierce", 3)], t(GR, "S1")),
      S(2, "x_grounded_s2", "支柱", "waza", 4, [M("armor", 12), M("ward", 12)], t(GR, "S2")),
      S(3, "x_grounded_s3", "掘り出す", "waza", 5, [{ ...CURE, ...ally }, { ...H(0.1), ...ally }], t(GR, "S3")),
      S(4, "x_grounded_s4", "踏んばる", "waza", 5, [M("guard", 1), M("regen", 6)], t(GR, "S4")),
      S(5, "x_grounded_s5", "落石", "waza", 6, [D(5, { stat: "def", aoe: true }), F("stun", 1, { chance: 0.1, aoe: true })], t(GR, "S5")),
      S(6, "x_grounded_s6", "ついてこい", "waza", 6, [M("up_def", 12, { turns: 3, ...all, solo: [M("up_def", 15, { turns: 3 }), M("regen", 6)] })], t(GR, "S6")),
      S(7, "x_grounded_s7", "掘り直し", "waza", 6, [D(10, { stat: "def", ignore: 0.3 })], t(GR, "S7")),
      S(8, "x_grounded_s8", "崩落", "waza", 11, [D(20, { stat: "def", aoe: true }), F("down_agi", 10, { turns: 2, aoe: true })], t(GR, "S8")),
      P(1, "x_grounded_p1", "頑固", tx(GR, "P1"), { startFx: [["immunity", 15]] }),
      P(2, "x_grounded_p2", "坑道の主", tx(GR, "P2"), { turnFx: [{ fx: ["armor", 2] }] }),
      P(3, "x_grounded_p3", "動かない", tx(GR, "P3"), { guardBonus: 0.1 }),
      P(4, "x_grounded_p4", "地鳴り", tx(GR, "P4"), { onHitFx: [["down_agi", 0.15, 10, 2]] }),
      P(5, "x_grounded_p5", "あいつがいれば", tx(GR, "P5"), { onceFx: [{ on: "allyLow", at: 0.3, team: true, shield: 0.08, solo: { on: "lowHp", at: 0.3, shield: 0.15 } }] }),
      P(6, "x_grounded_p6", "掘りぐせ", tx(GR, "P6"), { hitPierce: 2 }),
      P(7, "x_grounded_p7", "おれの坑道", tx(GR, "P7"), { dmgCut: 5, startFx: [["armor", 10]] }),
    ],
    plan: [G("first", undefined, "x_grounded_s2"), G("hpBelow", 40, "x_grounded_s4"), G("mpAtLeast", 11, "x_grounded_s8"), G("debuffed", undefined, "x_grounded_s3"), G("selfNotHas", "up_def", "x_grounded_s6"), G("always", undefined, "x_grounded_s1")] },

  // 18 STALEMATE（ちょきんばこ・ディフェンダー）：元本（HP）を シールドで 守り、受けた 分を 相殺し、引き分けに 持ちこむ
  x_cautious: { name: "コーシャス", enemy: CA, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: null,
    list: [
      S(1, "x_cautious_s1", "利息", "waza", 3, [D(7, { stat: "def", drain: 0.15, toShield: true })], t(CA, "S1")),
      S(2, "x_cautious_s2", "元本保証", "waza", 4, [SH(0.12)], t(CA, "S2")),
      S(3, "x_cautious_s3", "損切り", "waza", 5, [CURE], t(CA, "S3")),
      S(4, "x_cautious_s4", "相殺", "waza", 5, [M("counter", 1)], t(CA, "S4")),
      S(5, "x_cautious_s5", "担保", "waza", 5, [{ ...SH(0.12), ...ally, solo: [M("guard", 1), SH(0.05)] }], t(CA, "S5")),
      S(6, "x_cautious_s6", "千日手", "itazura", 6, [F("down_atk", 10, { turns: 2 }), F("down_int", 10, { turns: 2 }), M("up_def", 10, { turns: 2 }), M("up_res", 10, { turns: 2 })], t(CA, "S6")),
      S(7, "x_cautious_s7", "配当", "waza", 6, [D(10, { stat: "def", bonusIf: { selfShield: 0.3 } })], t(CA, "S7")),
      S(8, "x_cautious_s8", "利確", "waza", 11, [D(20, { stat: "def", bonusIf: { hpLead: 0.3 } })], t(CA, "S8")),
      P(1, "x_cautious_p1", "帳尻", tx(CA, "P1"), { onceFx: [{ on: "start", shield: 0.08 }] }),
      P(2, "x_cautious_p2", "計算", tx(CA, "P2"), { dmgCut: 3 }),
      P(3, "x_cautious_p3", "差し引き", tx(CA, "P3"), { whenHitFx: [["down_atk", 0.2, 8, 2]] }),
      P(4, "x_cautious_p4", "元本", tx(CA, "P4"), { shieldMul: 1.15 }),
      P(5, "x_cautious_p5", "分が悪い", tx(CA, "P5"), { lowHpCut: 0.06 }),
      P(6, "x_cautious_p6", "複利", tx(CA, "P6"), { turnFx: [{ has: "shield", shield: 0.02 }] }),
      P(7, "x_cautious_p7", "引き際", tx(CA, "P7"), { onceFx: [{ on: "lowHp", at: 0.3, fx: [["guard", undefined, 1]], shield: 0.15 }] }),
    ],
    plan: [G("first", undefined, "x_cautious_s6"), G("selfNotHas", "shield", "x_cautious_s2"), G("debuffed", undefined, "x_cautious_s3"), G("mpAtLeast", 11, "x_cautious_s8"), G("selfHas", "shield", "x_cautious_s7"), G("always", undefined, "x_cautious_s1")] },

  // 19 NOBODY（マウス・テクニシャン）：足跡を 消し（浄化・幻影・隠蔽）、置き土産（毒・麻痺）を 残して はぐらかす
  x_anonymous: { name: "アノニマス", enemy: AN, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "agi", sub: "dex", theme: "poison",
    list: [
      S(1, "x_anonymous_s1", "すれ違い", "waza", 3, [D(7, { stat: "agi" }), M("mirage", 5)], t(AN, "S1")),
      S(2, "x_anonymous_s2", "置き土産", "itazura", 4, [F("poison", 3), F("paralysis", 12)], t(AN, "S2")),
      S(3, "x_anonymous_s3", "素早い手", "waza", 4, [D(3, { stat: "agi", hits: 3 })], t(AN, "S3")),
      S(4, "x_anonymous_s4", "はぐらかす", "itazura", 5, [F("down_dex", 12, { turns: 2 }), F("confusion", 1, { chance: 0.25 })], t(AN, "S4")),
      S(5, "x_anonymous_s5", "すり抜け", "waza", 5, [M("conceal", 1, { solo: [M("mirage", 12)] }), M("mirage", 8)], t(AN, "S5")),
      S(6, "x_anonymous_s6", "足跡なし", "waza", 5, [{ ...CURE, n: 1 }, M("mirage", 6)], t(AN, "S6")),
      S(7, "x_anonymous_s7", "何も見てない", "waza", 6, [D(11, { stat: "agi" }), F("blind", 1)], t(AN, "S7")),
      S(8, "x_anonymous_s8", "中身は知らない", "waza", 11, [D(20, { stat: "agi" }), F("poison", 4, { oneOf: [F("paralysis", 15), F("blind", 1), F("fatigue", 1), F("confusion", 1)] })], t(AN, "S8")),
      P(1, "x_anonymous_p1", "だれでもない", tx(AN, "P1"), { evade: 0.05 }),
      P(2, "x_anonymous_p2", "軽い足", tx(AN, "P2"), { startFx: [["haste", undefined, 1]] }),
      P(3, "x_anonymous_p3", "身軽", tx(AN, "P3"), { turnFx: [{ has: "conceal", heal: 0.02, solo: { has: "mirage", n: 10, heal: 0.02 } }] }),
      P(4, "x_anonymous_p4", "白い四角", tx(AN, "P4"), { agiMul: 1.05 }),
      P(5, "x_anonymous_p5", "置いていく", tx(AN, "P5"), { onHitFx: [["paralysis", 0.1, 8]] }),
      P(6, "x_anonymous_p6", "中身は見ない", tx(AN, "P6"), { vsFx: { poison: 0.1, paralysis: 0.1 } }),
      P(7, "x_anonymous_p7", "名のない荷", tx(AN, "P7"), { startFoeFx: [["poison", 3]] }),
    ],
    plan: [G("first", undefined, "x_anonymous_s2"), G("mpAtLeast", 11, "x_anonymous_s8"), G("debuffed", undefined, "x_anonymous_s6"), G("selfNotHas", "mirage", "x_anonymous_s5"), G("foeNotHas", "blind", "x_anonymous_s7"), G("always", undefined, "x_anonymous_s1")] },

  // 20 HUSH（サボテン・テクニシャン）：継ぎ目を 突き（守りを 一部 無視）、ずらし（麻痺）、黙らせる（沈黙）
  x_terse: { name: "タース", enemy: TE, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: "paralysis",
    list: [
      S(1, "x_terse_s1", "継ぎ目", "waza", 3, [D(7, { stat: "dex", ignore: 0.2 })], t(TE, "S1")),
      S(2, "x_terse_s2", "ずらす", "itazura", 4, [F("paralysis", 18)], t(TE, "S2")),
      S(3, "x_terse_s3", "とげ", "waza", 4, [M("thorns", 20)], t(TE, "S3")),
      S(4, "x_terse_s4", "削る", "waza", 5, [D(5, { stat: "dex", hits: 2 }), F("down_def", 10, { turns: 2 })], t(TE, "S4")),
      S(5, "x_terse_s5", "しっ", "itazura", 5, [F("down_int", 10, { turns: 2 }), F("silence", 1, { chance: 0.3 })], t(TE, "S5")),
      S(6, "x_terse_s6", "組み直す", "waza", 5, [{ ...CURE, n: 1 }, M("armor", 10)], t(TE, "S6")),
      S(7, "x_terse_s7", "ほぞ", "waza", 7, [D(13, { stat: "dex", bonusIf: { ignoreVs: { paralysis: 0.3 } } })], t(TE, "S7")),
      S(8, "x_terse_s8", "静物", "waza", 11, [D(22, { stat: "dex" }), F("stun", 1, { chance: 0.2 })], t(TE, "S8")),
      P(1, "x_terse_p1", "無口", tx(TE, "P1"), { vsFx: { silence: 0.1, paralysis: 0.1 } }),
      P(2, "x_terse_p2", "職人の手", tx(TE, "P2"), { crit: 0.04 }),
      P(3, "x_terse_p3", "針のとげ", tx(TE, "P3"), { fxAmtMul: { thorns: 1.15 } }),
      P(4, "x_terse_p4", "釘いらず", tx(TE, "P4"), { dexMul: 1.05 }),
      P(5, "x_terse_p5", "用心棒", tx(TE, "P5"), { dmgCut: 3 }),
      P(6, "x_terse_p6", "運び道", tx(TE, "P6"), { startFx: [["thorns", 10]] }),
      P(7, "x_terse_p7", "ずれ", tx(TE, "P7"), { onHitFx: [["paralysis", 0.1, 8]] }),
    ],
    plan: [G("first", undefined, "x_terse_s3"), G("foeNotHas", "paralysis", "x_terse_s2"), G("mpAtLeast", 11, "x_terse_s8"), G("foeHas", "paralysis", "x_terse_s7"), G("foeNotHas", "down_def", "x_terse_s4"), G("always", undefined, "x_terse_s1")] },

  // 21 SPARKY（ちょきんばこ・アタッカー）：撃った 弾を 数え、ためずに すぐ 撃つ。自分の 守りを 下げて 攻める
  x_eager: { name: "イーガー", enemy: EG, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "luk", theme: null,
    list: [
      S(1, "x_eager_s1", "連射", "waza", 3, [D(2, { hits: 4 })], t(EG, "S1")),
      S(2, "x_eager_s2", "数えて撃つ", "waza", 4, [D(8, { ifHitLast: 0.2 })], t(EG, "S2")),
      S(3, "x_eager_s3", "火花", "waza", 4, [D(6), F("burn", 2)], t(EG, "S3")),
      S(4, "x_eager_s4", "前に出る", "waza", 4, [M("up_atk", 15, { turns: 3 }), M("down_def", 10, { turns: 3 })], t(EG, "S4")),
      S(5, "x_eager_s5", "強がり", "waza", 5, [M("charge")], t(EG, "S5")),
      S(6, "x_eager_s6", "腕試し", "waza", 5, [D(11, { critUp: 0.1 })], t(EG, "S6")),
      S(7, "x_eager_s7", "まだ残ってる", "waza", 6, [D(4, { hits: 3, bonusIf: { lowHpHits: 1 } })], t(EG, "S7")),
      S(8, "x_eager_s8", "ビッグ・ドリーム", "waza", 11, [D(5, { hits: 5 })], t(EG, "S8")),
      P(1, "x_eager_p1", "一生懸命", tx(EG, "P1"), { lowHpOnce: [[0.5, "up_atk", 10]] }),
      P(2, "x_eager_p2", "負けん気", tx(EG, "P2"), { hurtUp: [{ id: "up_atk", n: 15, max: 15, turns: 1, crit: true }] }),
      P(3, "x_eager_p3", "星のステッカー", tx(EG, "P3"), { startFx: [["up_luk", 5]] }),
      P(4, "x_eager_p4", "しごかれた", tx(EG, "P4"), { dmgCut: 3 }),
      P(5, "x_eager_p5", "弾を数える", tx(EG, "P5"), { crit: 0.05 }),
      P(6, "x_eager_p6", "一番乗り", tx(EG, "P6"), { startFx: [["charge"]] }),
      P(7, "x_eager_p7", "焦げた前髪", tx(EG, "P7"), { onHitFx: [["burn", 0.1, 2]] }),
    ],
    plan: [G("first", undefined, "x_eager_s4"), G("mpAtLeast", 11, "x_eager_s8"), G("every", 3, "x_eager_s5"), G("hpBelow", 50, "x_eager_s7"), G("foeNotHas", "burn", "x_eager_s3"), G("always", undefined, "x_eager_s1")] },

  // 22 PAPER LANTERN（くらげ・ヒーラー）：灯りで 癒やし、隠し、身を 挺して かばい、受けた 分だけ 返す
  x_devoted: { name: "ディボーテッド", enemy: DV, analysis: true, dungeon: null, rank: "精鋭", type: "healer", main: "int", sub: "res", theme: null,
    list: [
      S(1, "x_devoted_s1", "かざす", "itazura", 3, [D(7, { bonusIf: { foeHit: 0.2 } })], t(DV, "S1")),
      S(2, "x_devoted_s2", "諭す", "itazura", 4, [F("down_atk", 12, { turns: 3 }), F("down_int", 12, { turns: 3 })], t(DV, "S2")),
      S(3, "x_devoted_s3", "灯り", "waza", 5, [{ ...H(0.15), ...ally }], t(DV, "S3")),
      S(4, "x_devoted_s4", "紙の盾", "waza", 5, [{ ...SH(0.12), ...ally }], t(DV, "S4")),
      S(5, "x_devoted_s5", "見守る", "waza", 5, [M("conceal", 1, { who: "ally", notSelf: true, solo: [M("mirage", 12)] })], t(DV, "S5")),
      S(6, "x_devoted_s6", "灯は消させない", "waza", 6, [M("substitute", 1, { solo: [M("guard", 1)] }), M("ward", 8)], t(DV, "S6")),
      S(7, "x_devoted_s7", "夜道", "waza", 6, [M("regen", 5, { ...all, solo: [M("regen", 10)] }), M("immunity", 5, { ...all, solo: [M("immunity", 10)] })], t(DV, "S7")),
      S(8, "x_devoted_s8", "撤退の灯", "waza", 10, [{ ...H(0.18), ...all, solo: [H(0.28)] }, { ...CURE, ...all, n: 1 }], t(DV, "S8")),
      P(1, "x_devoted_p1", "返す手", tx(DV, "P1"), { hurtUp: [{ id: "up_int", n: 15, max: 15, turns: 1, direct: true }] }),
      P(2, "x_devoted_p2", "寝ずの番", tx(DV, "P2"), { hpRegen: 0.01 }),
      P(3, "x_devoted_p3", "守れなかった誰か", tx(DV, "P3"), { onceFx: [{ on: "allyDown", fx: [["up_int", 15]], solo: { on: "lowHp", at: 0.3, fx: [["up_int", 15]] } }] }),
      P(4, "x_devoted_p4", "紙の提灯", tx(DV, "P4"), { resMul: 1.05 }),
      P(5, "x_devoted_p5", "護衛の心得", tx(DV, "P5"), { healMul: 1.1, shieldMul: 1.1 }),
      P(6, "x_devoted_p6", "帰り道", tx(DV, "P6"), { onceFx: [{ on: "start", team: true, fx: [["immunity", 6]], solo: { on: "start", fx: [["immunity", 10]] } }] }),
      P(7, "x_devoted_p7", "撃たない", tx(DV, "P7"), { dmgCut: 4 }),
    ],
    plan: [G("hpBelow", 40, "x_devoted_s8"), G("hpBelow", 60, "x_devoted_s3"), G("first", undefined, "x_devoted_s7"), G("foeNotHas", "down_atk", "x_devoted_s2"), G("every", 3, "x_devoted_s6"), G("always", undefined, "x_devoted_s1")] },
};

// battle-sim.js に まだ ない 鍵（Claude が あとで 戦いの 計算に 足す）。足すまでは かっこの 中の 形で はたらく
export const NEEDS = [
  { key: "aoe", meaning: "fx の 項目（dmg・相手への fx）：相手 全員に（ダメージも 状態も 1 匹ずつ 当たるか 決める。隠蔽して いても 当たる）。いまは ねらった 1 匹だけ" },
  { key: "team", meaning: "who:'ally' の fx・heal・shield・cure に 付ける：味方 全員に（ソロは 自分）。いまは HP の いちばん 減った 味方 1 匹" },
  { key: "who", meaning: "浄化（t:'cure'）の who:'ally'：味方 1 匹（team なら 全員）の デバフを 消す（ソロは 自分）。いまは 自分だけ" },
  { key: "n", meaning: "浄化（t:'cure'）の n：デバフを n こだけ 消す（「デバフを 1 つ 浄化」）。いまは 全部 消える" },
  { key: "oneOf", meaning: "fx の 項目：この 効果と oneOf の 効果の 中から ばらばらに 1 つだけ 付ける。いまは この 効果だけ" },
  { key: "hpCost", meaning: "fx の 項目：使う ときに 自分の 最大 HP × 割合を 払う（HP 1 より 下には ならない）。いまは 払わない" },
  { key: "toShield", meaning: "dmg の drain に 付ける：回復の かわりに 自分の シールドに する。いまは ふつうの drain（回復）" },
  { key: "bonusIf", meaning: "dmg の 条件つきの おまけ { foeHit：相手が 前の 番に 攻撃を 当てて いれば（相手の hitLast）+割合・foeNoBuff：相手に バフ（構え 以外）が なければ +割合・selfShield：自分に シールドが あれば +割合・hpLead：自分の HP の 割合が 相手より 高ければ +割合・lowHpHits：自分の HP が 半分 以下なら 回数 +n・ignoreVs { 状態: 割合 }：その 状態の 相手には 守りを その 割合 無視 }。いまは おまけ なし" },
  { key: "lowHpOnce", meaning: "パッシブ：[at, id, 量, ターン] の 一覧。HP が 最大の at 以下に なった とき 一度だけ 自分に その 状態（a の ファイルと 同じ 鍵）" },
  { key: "ifHitLast", meaning: "dmg：前の 番に 同じ 相手に 当てて いれば 威力 × (1 + この 値)（a の ファイルと 同じ 鍵）" },
  { key: "onceFx", meaning: "パッシブ：1 戦に 一度だけ（lowHpOnce で 書けない 浄化・シールド・味方が からむ 物）[{ on, at, fx:[[id, 量, ターン]], cure, shield:最大 HP の 割合, team, solo }]。on は start（戦いの はじめ）・lowHp（自分の HP が 最大の at 以下に なった）・allyLow（味方の だれかが at 以下）・allyDown（自分 以外の 味方が 倒れた）。team は 味方 全員に。solo は ソロの ときに かわりに 使う 中身。startFx と 同じく 持ちこさない" },
  { key: "turnFx", meaning: "パッシブ：手番の はじめに 毎回 [{ has, n, fx:[id, 量, ターン], heal:最大 HP の 割合, shield:最大 HP の 割合, solo }]。has が あれば 自分に その 状態が（n が あれば 量 n 以上）ある ときだけ。solo は ソロの ときに かわりに 使う 中身" },
  { key: "hurtUp", meaning: "パッシブ：ダメージを 受ける たびに 自分に 状態 [{ id, n, max, turns, direct, crit }]（量 +n、max まで。turns は 持続。direct なら 直接攻撃だけ、crit なら 会心を 受けた ときだけ。どちらも ない ときは 継続ダメージでも）" },
  { key: "guardNext", meaning: "パッシブ：防御した 次の 技の ダメージ +割合（見本の レストレスと 同じ 鍵）" },
  { key: "thornsDef", meaning: "パッシブ：棘で 返す ダメージに 自分の DEF × 割合を 足す（counterDef の 棘 版）" },
];
