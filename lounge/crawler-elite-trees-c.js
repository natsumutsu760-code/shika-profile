// 精鋭の 解析ツリー 23〜32（戦いで 使う 形）。crawler-elite-trees.js が 読む
// 名前・MP・文は 資料 docs/mono-link-crawler-elite-skills.md の「解析で 手に 入る ツリー」（crawler-analysis-data.js）の まま。fx は battle-sim.js の 言葉で 写した
// 戦いの 計算に まだ ない 物は 下の NEEDS に 書いた（いまは はたらかない か、近い 形で はたらく）
import { D, F, M, H, CURE, DIS, MPD, SH, S, P, G } from "./tree-kit.js";
import { ANALYSIS } from "./crawler-analysis-data.js";
import { STATS9 } from "./effects.js";
const tx = (name, slot) => ANALYSIS[name].rows.find((r) => r.slot === slot).text; // 文は 資料の まま
const mk = (R) => (s) => ({ text: tx(R, s) });
const ally = (x, o = {}) => ({ ...x, who: "ally", ...o });                        // 味方 1 匹（HP の いちばん 減った 子。ソロは 自分）
const CURE1 = (n = 1, o = {}) => ({ ...CURE, n, ...o });                          // デバフを n つ 浄化（n は NEEDS）
const VS_DOWN = (v) => Object.fromEntries(STATS9.map((k) => [`down_${k}`, v]));  // 相手に 減少が どれか かかって いれば
const VS_UP = (v) => Object.fromEntries(STATS9.map((k) => [`up_${k}`, v]));      // 相手に 上昇が どれか かかって いれば

// ---- 23 DEJA VU（ファミリア）----
const R23 = "DEJA VU", t23 = mk(R23);
// ---- 24 AFTERTHOUGHT（タイディ）----
const R24 = "AFTERTHOUGHT", t24 = mk(R24);
// ---- 25 SPLINT（ステッドファスト）----
const R25 = "SPLINT", t25 = mk(R25);
// ---- 26 STOPWATCH（ストリクト）----
const R26 = "STOPWATCH", t26 = mk(R26);
// ---- 27 NINE LIVES（デアリング）----
const R27 = "NINE LIVES", t27 = mk(R27);
// ---- 28 GHOST NOTE（ミューテッド）----
const R28 = "GHOST NOTE", t28 = mk(R28);
// ---- 29 ONE SHOE（レストレス）見本の まま ----
const R = "ONE SHOE", t = mk(R);
// ---- 30 BOOKMARK（ステューディアス）----
const R30 = "BOOKMARK", t30 = mk(R30);
// ---- 31 RABBIT HOLE（キュリアス）----
const R31 = "RABBIT HOLE", t31 = mk(R31);
// ---- 32 NEW MOON（コンペティティブ）----
const R32 = "NEW MOON", t32 = mk(R32);

export const TREES = {
  x_familiar: { name: "ファミリア", enemy: R23, analysis: true, dungeon: null, rank: "精鋭", type: "caster", main: "int", sub: "mp", theme: "confusion",
    list: [
      S(1, "x_familiar_s1", "触れる", "itazura", 3, [D(7), F("paralysis", 10)], t23("S1")),
      S(2, "x_familiar_s2", "既視感", "itazura", 4, [D(5), F("confusion", 1, { chance: 0.25 })], t23("S2")),
      S(3, "x_familiar_s3", "ガラスの体", "waza", 4, [M("ward", 15)], t23("S3")),
      S(4, "x_familiar_s4", "あつい", "itazura", 4, [F("sickness", 2)], t23("S4")),
      S(5, "x_familiar_s5", "波紋", "itazura", 5, [D(6, { aoe: true })], t23("S5")),
      S(6, "x_familiar_s6", "途切れる記憶", "itazura", 6, [DIS(1), F("fatigue", 1, { chance: 0.4 })], t23("S6")),
      S(7, "x_familiar_s7", "七回目", "itazura", 6, [D(11, { powIf: [["sameLast", null, 0.2]] })], t23("S7")),
      S(8, "x_familiar_s8", "TEST-07", "itazura", 12, [D(24), M("frenzy", 1)], t23("S8")),
      P(1, "x_familiar_p1", "前に会った", tx(R23, "P1"), { rollFx: [{ at: "start", chance: 0.2, fx: [F("confusion", 1)] }] }),
      P(2, "x_familiar_p2", "不安定", tx(R23, "P2"), { rollFx: [{ at: "turn", chance: 0.15, fx: [M("focus", 2)] }, { at: "turn", chance: 0.15, fx: [M("fatigue", 1)] }] }),
      P(3, "x_familiar_p3", "ガラスの家", tx(R23, "P3"), { itazuraCut: 0.06 }),
      P(4, "x_familiar_p4", "重なる波紋", tx(R23, "P4"), { intMul: 1.05 }),
      P(5, "x_familiar_p5", "見たことがある", tx(R23, "P5"), { pIf: [["foeRepeat", null, { dmgCut: 10 }]] }),
      P(6, "x_familiar_p6", "途切れ途切れ", tx(R23, "P6"), { onHitFx: [["fatigue", 0.1, null, 1]] }),
      P(7, "x_familiar_p7", "何番目の試験", tx(R23, "P7"), { startFx: [["ward", 10]] }),
    ],
    plan: [G("first", undefined, "x_familiar_s3"), G("foeBuffed", undefined, "x_familiar_s6"), G("mpAtLeast", 12, "x_familiar_s8"), G("foeNotHas", "sickness", "x_familiar_s4"), G("mpAtLeast", 6, "x_familiar_s7"), G("always", undefined, "x_familiar_s1")] },

  x_tidy: { name: "タイディ", enemy: R24, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "mp", theme: null,
    list: [
      S(1, "x_tidy_s1", "後始末", "waza", 3, [D(8, { powIf: [["foeHpBelow", 50, 0.2]] })], t24("S1")),
      S(2, "x_tidy_s2", "消去", "itazura", 4, [DIS(1)], t24("S2")),
      S(3, "x_tidy_s3", "消灯", "itazura", 4, [F("blind", 1), F("down_dex", 10, { turns: 2 })], t24("S3")),
      S(4, "x_tidy_s4", "口封じ", "waza", 5, [D(6), F("daze", 1, { chance: 0.3 })], t24("S4")),
      S(5, "x_tidy_s5", "残業", "waza", 5, [M("charge"), M("focus", 1)], t24("S5")),
      S(6, "x_tidy_s6", "事後処理", "itazura", 6, [DIS(1), F("rot", 1)], t24("S6")),
      S(7, "x_tidy_s7", "清掃", "waza", 6, [D(12, { powIf: [["foeNotBuffed", null, 0.2]] })], t24("S7")),
      S(8, "x_tidy_s8", "なかったこと", "waza", 11, [DIS(2), D(20)], t24("S8")),
      P(1, "x_tidy_p1", "遅れて来る", tx(R24, "P1"), { lateAtk: { after: 2, v: 0.1 } }),
      P(2, "x_tidy_p2", "薄情", tx(R24, "P2"), { pIf: [["foeHpBelow", 30, { crit: 0.1 }]] }),
      P(3, "x_tidy_p3", "業務", tx(R24, "P3"), { mpRegen: 0.5 }),
      P(4, "x_tidy_p4", "片付け屋", tx(R24, "P4"), { atkMul: 1.05 }),
      P(5, "x_tidy_p5", "証拠を残さない", tx(R24, "P5"), { pIf: [["lastTag", "dispel", { wazaDmg: 10 }]] }),
      P(6, "x_tidy_p6", "残業代", tx(R24, "P6"), { pIf: [["mpPctBelow", 50, { wazaDmg: 10 }]] }),
      P(7, "x_tidy_p7", "淡々と", tx(R24, "P7"), { dmgCut: 3 }),
    ],
    plan: [G("first", undefined, "x_tidy_s5"), G("foeBuffed", undefined, "x_tidy_s8"), G("foeBuffed", undefined, "x_tidy_s2"), G("every", 3, "x_tidy_s3"), G("mpAtLeast", 6, "x_tidy_s7"), G("always", undefined, "x_tidy_s1")] },

  x_steadfast: { name: "ステッドファスト", enemy: R25, analysis: true, dungeon: null, rank: "精鋭", type: "healer", main: "int", sub: "res", theme: "armor",
    list: [
      S(1, "x_steadfast_s1", "結び目", "itazura", 3, [D(7, { stat: "res" }), F("down_agi", 10, { turns: 2 })], t25("S1")),
      S(2, "x_steadfast_s2", "つぎはぎ", "waza", 3, [SH(0.12)], t25("S2")),
      // 装甲を 先に（回復で HP の いちばん 減った 子が 変わる 前に、同じ 子へ）
      S(3, "x_steadfast_s3", "添え木", "waza", 5, [ally(M("armor", 8)), ally(H(0.15))], t25("S3")),
      S(4, "x_steadfast_s4", "師匠の言葉", "waza", 5, [M("immunity", 15), M("up_def", 12, { turns: 3 })], t25("S4")),
      // 身代わりは「持って いる 子が 味方への 直接攻撃を 代わりに 受ける」状態なので、自分に かけて 味方を 守る（main-trees の 荷物を 守る と 同じ）
      S(5, "x_steadfast_s5", "門を支える", "waza", 5, [M("substitute", 1, { solo: [M("guard", 1), M("regen", 6)] })], t25("S5")),
      S(6, "x_steadfast_s6", "補強", "waza", 6, [M("armor", 20), M("ward", 15)], t25("S6")),
      S(7, "x_steadfast_s7", "巻き直す", "waza", 6, [CURE1(1), M("regen", 8)], t25("S7")),
      S(8, "x_steadfast_s8", "最後まで支える", "waza", 10, [ally(M("armor", 12), { team: true, solo: [M("armor", 24)] }), ally(M("ward", 12), { team: true, solo: [M("ward", 24)] }), ally(M("regen", 6), { team: true, solo: [M("regen", 12)] })], t25("S8")),
      P(1, "x_steadfast_p1", "修業中", tx(R25, "P1"), { pIf: [["selfHas", "guard", { healMul: 1.1 }]] }),
      P(2, "x_steadfast_p2", "まじめ", tx(R25, "P2"), { startFx: [["immunity", 10]] }),
      P(3, "x_steadfast_p3", "折れても立つ", tx(R25, "P3"), { lowHpHeal: [[0.3, 0.1]] }),
      P(4, "x_steadfast_p4", "硬い 羽", tx(R25, "P4"), { defMul: 1.05 }),
      P(5, "x_steadfast_p5", "支え手", tx(R25, "P5"), { healMul: 1.1 }),
      P(6, "x_steadfast_p6", "弟子の 意地", tx(R25, "P6"), { dmgCut: 3 }),
      P(7, "x_steadfast_p7", "師の 背中", tx(R25, "P7"), { startFx: [["armor", 15]] }),
    ],
    plan: [G("first", undefined, "x_steadfast_s6"), G("hpBelow", 40, "x_steadfast_s3"), G("debuffed", undefined, "x_steadfast_s7"), G("every", 4, "x_steadfast_s8"), G("every", 3, "x_steadfast_s5"), G("always", undefined, "x_steadfast_s1")] },

  x_strict: { name: "ストリクト", enemy: R26, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: null,
    list: [
      S(1, "x_strict_s1", "採点", "waza", 3, [D(8, { stat: "dex" })], t26("S1")),
      S(2, "x_strict_s2", "計時", "itazura", 4, [F("down_agi", 12, { turns: 3 })], t26("S2")),
      S(3, "x_strict_s3", "秒針", "waza", 4, [D(3, { stat: "agi", hits: 3 })], t26("S3")),
      S(4, "x_strict_s4", "やり直し", "waza", 5, [CURE1(1), M("immunity", 8)], t26("S4")),
      S(5, "x_strict_s5", "減点", "itazura", 5, [F("down_atk", 10, { turns: 2 }), F("down_int", 10, { turns: 2 })], t26("S5")),
      S(6, "x_strict_s6", "持ち時間", "waza", 5, [M("up_dex", 15, { turns: 3 })], t26("S6")),
      S(7, "x_strict_s7", "判定", "waza", 6, [D(12, { stat: "dex", vsFx: VS_DOWN(0.2) })], t26("S7")),
      S(8, "x_strict_s8", "タイムアップ", "waza", 10, [D(16, { stat: "dex", powByTurn: { add: 1, max: 8 } })], t26("S8")),
      P(1, "x_strict_p1", "時間厳守", tx(R26, "P1"), { startFx: [["haste", undefined, 1]] }),
      P(2, "x_strict_p2", "公平", tx(R26, "P2"), { critTakenCut: 0.1 }),
      P(3, "x_strict_p3", "試験官", tx(R26, "P3"), { pIf: [["foeHpAbove", 99.99, { wazaDmg: 10 }]] }),
      P(4, "x_strict_p4", "止まった針", tx(R26, "P4"), { dexMul: 1.05 }),
      P(5, "x_strict_p5", "減点方式", tx(R26, "P5"), { onHitFx: [["down_atk", 0.1, 6, 2]] }),
      P(6, "x_strict_p6", "規定どおり", tx(R26, "P6"), { dmgCut: 3 }),
      P(7, "x_strict_p7", "位置について", tx(R26, "P7"), { startFoeFx: [["down_agi", 8, 2]] }),
    ],
    plan: [G("first", undefined, "x_strict_s2"), G("debuffed", undefined, "x_strict_s4"), G("after", 4, "x_strict_s8"), G("foeNotHas", "down_atk", "x_strict_s5"), G("foeDebuffs", 1, "x_strict_s7"), G("always", undefined, "x_strict_s1")] },

  x_daring: { name: "デアリング", enemy: R27, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "luk", theme: "mirage",
    list: [
      S(1, "x_daring_s1", "サイコロ", "waza", 3, [D(8, { powOf: Array.from({ length: 13 }, (_, i) => 2 + i) })], t27("S1")),
      S(2, "x_daring_s2", "ツキ", "waza", 4, [M("mirage", 8)], t27("S2")),
      S(3, "x_daring_s3", "倍賭け", "waza", 4, [D(8, { powOf: [16, 4] })], t27("S3")),
      S(4, "x_daring_s4", "賭け金", "waza", 5, [M("charge", undefined, { payHp: 0.1 }), M("up_luk", 12, { turns: 3 })], t27("S4")),
      S(5, "x_daring_s5", "総取り", "itazura", 5, [DIS(1), M("charge", undefined, { ifTag: "dispel", chance: 0.5 })], t27("S5")),
      S(6, "x_daring_s6", "いい目", "waza", 6, [M("clarity", 1, { chance: 0.5, elseFx: { id: "mirage", amt: 10 } })], t27("S6")),
      S(7, "x_daring_s7", "全部乗せ", "waza", 7, [D(14), M("down_def", 12, { turns: 1 })], t27("S7")),
      S(8, "x_daring_s8", "ジャックポット", "waza", 11, [D(7, { stat: "luk", hits: 3, critUp: 0.15 })], t27("S8")),
      // 九つの命：根性（装備の endure）と 同じく 輪廻で 写した。戦いの はじめに 20% で 付く
      P(1, "x_daring_p1", "九つの命", tx(R27, "P1"), { rollFx: [{ at: "start", chance: 0.2, fx: [M("reincarnation")] }] }),
      P(2, "x_daring_p2", "陽気", tx(R27, "P2"), { startFx: [["up_luk", 5]] }),
      P(3, "x_daring_p3", "投げやり", tx(R27, "P3"), { pIf: [["hpBelow", 50, { crit: 0.08 }]] }),
      P(4, "x_daring_p4", "九つの目", tx(R27, "P4"), { rollFx: [{ at: "start", chance: 0.5, fx: [M("charge")], miss: [M("mirage", 10)] }] }),
      P(5, "x_daring_p5", "全部賭け", tx(R27, "P5"), { pIf: [["lastTag", "payHp", { wazaDmg: 10 }]] }),
      P(6, "x_daring_p6", "また来るよ", tx(R27, "P6"), { lowHpOnce: [[0.3, "mirage", 15]] }),
      P(7, "x_daring_p7", "勝負師", tx(R27, "P7"), { crit: 0.04 }),
    ],
    plan: [G("first", undefined, "x_daring_s4"), G("selfHas", "charge", "x_daring_s8"), G("selfHas", "charge", "x_daring_s7"), G("foeBuffed", undefined, "x_daring_s5"), G("every", 3, "x_daring_s6"), G("always", undefined, "x_daring_s1")] },

  x_muted: { name: "ミューテッド", enemy: R28, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: "blind",
    list: [
      S(1, "x_muted_s1", "消えかけた音", "waza", 3, [D(7, { stat: "dex" }), F("blind", 1)], t28("S1")),
      S(2, "x_muted_s2", "ノイズ", "itazura", 4, [F("fatigue", 2)], t28("S2")),
      S(3, "x_muted_s3", "休符", "waza", 4, [H(0.08), M("mirage", 10)], t28("S3")),
      S(4, "x_muted_s4", "裏面", "waza", 5, [M("conceal", 1, { solo: [M("mirage", 15)] }), M("charge")], t28("S4")),
      S(5, "x_muted_s5", "不協和音", "itazura", 6, [F("confusion", 1, { chance: 0.2, aoe: true })], t28("S5")),
      S(6, "x_muted_s6", "消音", "waza", 6, [D(6, { stat: "dex" }), F("silence", 1, { chance: 0.3 })], t28("S6")),
      S(7, "x_muted_s7", "砂嵐", "waza", 7, [D(6, { stat: "dex", hits: 2 }), F("blind", 1)], t28("S7")),
      S(8, "x_muted_s8", "記録にない", "waza", 11, [D(20, { stat: "dex", powIf: [["selfHas", "conceal", 0.5], ["selfHas", "mirage", 0.5]] })], t28("S8")),
      P(1, "x_muted_p1", "死んだことになっている", tx(R28, "P1"), { rollFx: [{ at: "start", fx: [M("conceal", 1, { solo: [M("mirage", 10)] })] }] }),
      P(2, "x_muted_p2", "わざと低い", tx(R28, "P2"), { lowHpOnce: [[0.5, "up_dex", 15], [0.5, "up_agi", 15]] }),
      P(3, "x_muted_p3", "皮肉", tx(R28, "P3"), { critVsFx: { blind: 0.08 } }),
      P(4, "x_muted_p4", "消えた 拍", tx(R28, "P4"), { dexMul: 1.05 }),
      P(5, "x_muted_p5", "雑音", tx(R28, "P5"), { onHitFx: [["blind", 0.1, null, 1]] }),
      P(6, "x_muted_p6", "足音を消す", tx(R28, "P6"), { evade: 0.03 }),
      P(7, "x_muted_p7", "記録の すき間", tx(R28, "P7"), { startFx: [["haste", undefined, 2]] }),
    ],
    plan: [G("first", undefined, "x_muted_s4"), G("selfHas", "charge", "x_muted_s8"), G("selfHas", "mirage", "x_muted_s8"), G("foeNotHas", "blind", "x_muted_s7"), G("every", 3, "x_muted_s3"), G("always", undefined, "x_muted_s1")] },

  x_restless: { name: "レストレス", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "agi", theme: null,
    list: [
      S(1, "x_restless_s1", "飛びつく", "waza", 3, [D(7)], { first: true, ...t("S1") }),
      S(2, "x_restless_s2", "吠える", "itazura", 3, [F("down_def", 12, { turns: 2 })], t("S2")),
      S(3, "x_restless_s3", "追いかける", "waza", 4, [M("up_agi", 20, { turns: 3 })], t("S3")),
      S(4, "x_restless_s4", "噛みつく", "waza", 4, [D(5, { hits: 2 })], t("S4")),
      S(5, "x_restless_s5", "待てない", "waza", 5, [M("charge"), M("down_def", 15, { turns: 1 })], t("S5")),
      S(6, "x_restless_s6", "逃がさない", "waza", 5, [D(8), F("down_agi", 15, { turns: 2 })], t("S6")),
      S(7, "x_restless_s7", "先回り", "waza", 6, [D(12), M("haste", 2)], t("S7")),
      S(8, "x_restless_s8", "片方の靴", "waza", 11, [D(24, { recoil: 0.2 })], t("S8")),
      P(1, "x_restless_p1", "せっかち", tx(R, "P1"), { agiMul: 1.05 }),
      P(2, "x_restless_p2", "すぐ吠える", tx(R, "P2"), { startFoeFx: [["down_def", 8, 2]] }),
      P(3, "x_restless_p3", "師匠の言いつけ", tx(R, "P3"), { guardNext: 0.15 }),
      P(4, "x_restless_p4", "小さな 体", tx(R, "P4"), { evade: 0.03 }),
      P(5, "x_restless_p5", "獲物の におい", tx(R, "P5"), { vsLowHp: 0.1 }),
      P(6, "x_restless_p6", "食らいつく", tx(R, "P6"), { momentum: 0.1 }),
      P(7, "x_restless_p7", "新米の 狩人", tx(R, "P7"), { startFx: [["haste", undefined, 2]] }),
    ],
    plan: [G("first", undefined, "x_restless_s3"), G("mpAtLeast", 11, "x_restless_s8"), G("foeNotHas", "down_def", "x_restless_s2"), G("every", 3, "x_restless_s7"), G("always", undefined, "x_restless_s1")] },

  x_studious: { name: "ステューディアス", enemy: R30, analysis: true, dungeon: null, rank: "精鋭", type: "healer", main: "int", sub: "res", theme: "regen",
    list: [
      S(1, "x_studious_s1", "サンプル採取", "itazura", 3, [D(7), F("poison", 2)], t30("S1")),
      S(2, "x_studious_s2", "記録", "waza", 4, [M("focus", 2)], t30("S2")),
      S(3, "x_studious_s3", "とげの表紙", "waza", 4, [M("thorns", 15)], t30("S3")),
      S(4, "x_studious_s4", "手当て", "waza", 5, [ally(H(0.12))], t30("S4")),
      S(5, "x_studious_s5", "しおり", "waza", 5, [ally(M("regen", 8))], t30("S5")),
      S(6, "x_studious_s6", "観察記録", "itazura", 5, [F("down_def", 10, { turns: 2 }), F("down_res", 10, { turns: 2 })], t30("S6")),
      S(7, "x_studious_s7", "背表紙", "itazura", 6, [D(11, { vsFx: { poison: 0.2 } })], t30("S7")),
      S(8, "x_studious_s8", "ドッグイヤー", "waza", 10, [CURE1(1, { who: "ally", team: true, solo: [CURE1(2)] }), ally(H(0.1), { team: true, solo: [H(0.2)] }), ally(M("regen", 6), { team: true, solo: [M("regen", 12)] })], t30("S8")),
      P(1, "x_studious_p1", "几帳面", tx(R30, "P1"), { healMul: 1.05 }),
      P(2, "x_studious_p2", "気弱", tx(R30, "P2"), { pIf: [["hpBelow", 50, { evade: 0.1 }]] }),
      P(3, "x_studious_p3", "控えました", tx(R30, "P3"), { startFx: [["immunity", 8]] }),
      P(4, "x_studious_p4", "読みかけの本", tx(R30, "P4"), { intMul: 1.05 }),
      P(5, "x_studious_p5", "記録を重ねる", tx(R30, "P5"), { pIf: [["after", 2, { dmgCut: 5 }]] }),
      P(6, "x_studious_p6", "サンプル番号", tx(R30, "P6"), { onHitFx: [["poison", 0.1, 2]] }),
      P(7, "x_studious_p7", "記録、ここまで", tx(R30, "P7"), { lowHpOnce: [[0.3, "regen", 10]] }),
    ],
    plan: [G("first", undefined, "x_studious_s2"), G("hpBelow", 40, "x_studious_s4"), G("debuffed", undefined, "x_studious_s8"), G("selfNotHas", "regen", "x_studious_s5"), G("foeHas", "poison", "x_studious_s7"), G("always", undefined, "x_studious_s1")] },

  x_curious: { name: "キュリアス", enemy: R31, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "agi", sub: "dex", theme: "haste",
    list: [
      S(1, "x_curious_s1", "紙飛行機", "waza", 3, [D(7, { stat: "dex" }), F("blind", 1, { chance: 0.5 })], t31("S1")),
      S(2, "x_curious_s2", "近道", "waza", 4, [M("haste", 2)], t31("S2")),
      S(3, "x_curious_s3", "足もと", "waza", 4, [D(5, { stat: "agi" }), F("paralysis", 12)], t31("S3")),
      S(4, "x_curious_s4", "抜け穴", "waza", 4, [M("conceal", 1, { solo: [M("mirage", 15)] })], t31("S4")),
      S(5, "x_curious_s5", "のぞきこむ", "waza", 5, [D(6, { stat: "dex" }), F("down_def", 10, { turns: 2 })], t31("S5")),
      S(6, "x_curious_s6", "道案内", "waza", 5, [ally(M("up_agi", 10, { turns: 3 }), { team: true, solo: [M("up_agi", 18, { turns: 3 })] })], t31("S6")),
      S(7, "x_curious_s7", "あと3マス", "waza", 6, [D(12, { stat: "agi", powIf: [["selfHas", "haste", 0.2]] })], t31("S7")),
      S(8, "x_curious_s8", "まだだれも行っていない道", "waza", 11, [D(7, { stat: "agi", hits: 3 }), M("mirage", 10)], t31("S8")),
      P(1, "x_curious_p1", "快活", tx(R31, "P1"), { startFx: [["focus", undefined, 1]] }),
      P(2, "x_curious_p2", "身軽", tx(R31, "P2"), { evade: 0.04 }),
      P(3, "x_curious_p3", "連れ帰る", tx(R31, "P3"), { allyLowOnce: [{ at: 0.2, fx: [ally(M("conceal", 1))], solo: [M("mirage", 15)] }] }),
      P(4, "x_curious_p4", "好奇心", tx(R31, "P4"), { agiMul: 1.05 }),
      P(5, "x_curious_p5", "知らない道", tx(R31, "P5"), { pIf: [["freshSkill", null, { wazaDmg: 10 }]] }),
      P(6, "x_curious_p6", "うさぎ穴", tx(R31, "P6"), { lowHpOnce: [[0.5, "haste", undefined, 2]] }),
      P(7, "x_curious_p7", "隊商育ち", tx(R31, "P7"), { dmgCut: 3 }),
    ],
    plan: [G("first", undefined, "x_curious_s2"), G("mpAtLeast", 11, "x_curious_s8"), G("selfHas", "haste", "x_curious_s7"), G("foeNotHas", "down_def", "x_curious_s5"), G("every", 3, "x_curious_s3"), G("always", undefined, "x_curious_s1")] },

  x_competitive: { name: "コンペティティブ", enemy: R32, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "hp", theme: null,
    list: [
      S(1, "x_competitive_s1", "はじめての一撃", "waza", 3, [D(8)], t32("S1")),
      S(2, "x_competitive_s2", "描く", "waza", 4, [M("mastery", 10)], t32("S2")),
      S(3, "x_competitive_s3", "触手", "waza", 4, [D(4, { hits: 2 }), F("paralysis", 8)], t32("S3")),
      S(4, "x_competitive_s4", "満ちる", "waza", 5, [H(0.08), M("immunity", 6)], t32("S4")),
      S(5, "x_competitive_s5", "次は勝つ", "waza", 5, [CURE1(1), M("up_def", 10, { turns: 3 })], t32("S5")),
      S(6, "x_competitive_s6", "負けず嫌い", "waza", 6, [M("up_atk", 12, { turns: 3 }), M("charge", undefined, { onlyIf: ["behind", null] })], t32("S6")),
      S(7, "x_competitive_s7", "張り合う", "waza", 6, [D(12, { powIf: [["hurtLast", null, 0.2]] })], t32("S7")),
      S(8, "x_competitive_s8", "満月", "waza", 11, [D(22, { vsFx: VS_UP(0.2) })], t32("S8")),
      P(1, "x_competitive_p1", "白紙", tx(R32, "P1"), { debuffTurnCut: 1 }),
      P(2, "x_competitive_p2", "のびしろ", tx(R32, "P2"), { atkMul: 1.03, hpMul: 1.03 }),
      P(3, "x_competitive_p3", "ライバル", tx(R32, "P3"), { pIf: [["behind", null, { crit: 0.06 }]] }),
      P(4, "x_competitive_p4", "負けてられない", tx(R32, "P4"), { foeUpFx: [["up_atk", 6, 2]] }),
      P(5, "x_competitive_p5", "まだ何もない円", tx(R32, "P5"), { startFx: [["mastery", 8]] }),
      P(6, "x_competitive_p6", "負けない", tx(R32, "P6"), { lowHpOnce: [[0.3, "up_atk", 15, 3]] }),
      // 味方 1 匹：戦いの はじめは みんな HP 満タンなので、ally の 決まり（HP の いちばん 減った 子）でも 自分に なる。startFx で 自分に
      P(7, "x_competitive_p7", "同期のよしみ", tx(R32, "P7"), { startFx: [["up_atk", 8, 2]] }),
    ],
    plan: [G("first", undefined, "x_competitive_s2"), G("selfNotHas", "up_atk", "x_competitive_s6"), G("foeBuffed", undefined, "x_competitive_s8"), G("debuffed", undefined, "x_competitive_s5"), G("mpAtLeast", 6, "x_competitive_s7"), G("always", undefined, "x_competitive_s1")] },
};

// 戦いの 計算に まだ ない 物（Claude が battle-sim.js に 足す）。足すまでは 鍵は むしされ、近い 形で はたらく（aoe は 1 匹だけ・team は HP の いちばん 減った 味方 1 匹・n の ない 浄化は 全部 など）
export const NEEDS = [
  { key: "guardNext", meaning: "防御した 次の 技 +割合（見本の レストレス P3）" },
  { key: "aoe", meaning: "dmg・fx に true で 相手 全員に（当たりと 確率は 1 匹ずつ）。いまは 1 匹だけ（ファミリア S5・ミューテッド S5）" },
  { key: "team", meaning: "who:'ally' の fx・heal・shield・cure に true で 味方 全員（自分も）に。ソロは solo。いまは HP の いちばん 減った 味方 1 匹（ステッドファスト S8・ステューディアス S8・キュリアス S6）" },
  { key: "cure.who", meaning: "cure に who:'ally'：味方 1 匹の 浄化（team なら 全員）。いまは 自分だけ（ステューディアス S8）" },
  { key: "cure.n", meaning: "{ t:'cure', n } の n：デバフを n つだけ 浄化。いまは 全部 消える（ステッドファスト S7・ストリクト S4・コンペティティブ S5・ステューディアス S8）" },
  { key: "powIf", meaning: "dmg に [[条件, 値, 倍]]：条件が 合えば 威力 ×(1＋倍)。合う 物が いくつか あれば いちばん 大きい 倍。条件は COND（ガンビット）と 同じ 名前で、下の 新しい 条件も（タイディ S1・S7、ファミリア S7、ミューテッド S8、キュリアス S7、コンペティティブ S7）" },
  { key: "onlyIf", meaning: "fx に [条件, 値]：条件が 合う ときだけ その 効果（コンペティティブ S6 の チャージ）" },
  { key: "pIf", meaning: "パッシブ [[条件, 値, p]]：条件（自分＝me・相手＝foe・turn で COND と 同じ。守りの 鍵は 受ける 側で 見る）が 合う あいだだけ p（crit・wazaDmg・dmgCut・evade・healMul）を 足す（Mul は かける）（タイディ P2・P5・P6、ファミリア P5、ステッドファスト P1、ストリクト P3、デアリング P3・P5、ステューディアス P2・P5、キュリアス P5、コンペティティブ P3）" },
  { key: "sameLast", meaning: "条件：この 技を 前の 自分の 番にも 使った（ファミリア S7）" },
  { key: "foeRepeat", meaning: "条件：相手が 前の 自分の 番と 同じ 技を 使った（受ける 側で 見る。ファミリア P5）" },
  { key: "freshSkill", meaning: "条件：この 技を この 戦いで まだ 使って いない（キュリアス P5）" },
  { key: "hurtLast", meaning: "条件：前の 自分の 番の あと、ダメージを 受けた（コンペティティブ S7）" },
  { key: "behind", meaning: "条件：自分の HP の 割合が 相手より 低い（コンペティティブ S6・P3）" },
  { key: "foeNotBuffed", meaning: "条件：相手に バフが ない（foeBuffed の 反対。タイディ S7）" },
  { key: "mpPctBelow", meaning: "条件：自分の MP が 最大の 値% 以下（タイディ P6）" },
  { key: "lastTag", meaning: "条件：前の 自分の 技の tags に 値が ある（'dispel'＝相手の バフを 消した・'payHp'＝HP を 払った。タイディ P5・デアリング P5）" },
  { key: "lowHpOnce", meaning: "パッシブ [at, id, 量, ターン] の 一覧：HP が 最大の at 以下に なった とき 一度だけ 自分に その 状態（デアリング P6・ミューテッド P2・ステューディアス P7・キュリアス P6・コンペティティブ P6）" },
  { key: "lowHpHeal", meaning: "パッシブ [at, 割合] の 一覧：HP が 最大の at 以下に なった とき 一度だけ HP を 最大の 割合 回復（ステッドファスト P3）" },
  { key: "allyLowOnce", meaning: "パッシブ [{ at, fx, solo }]：自分 以外の 味方の だれかの HP が 最大の at 以下に なった とき 一度だけ fx（who:'ally' は その 味方に）。ソロは 自分が at 以下に なった とき solo を 自分に（キュリアス P3）" },
  { key: "rollFx", meaning: "パッシブ [{ at:'start'|'turn', chance?, fx, miss? }]：戦いの はじめ（start）／自分の 番の はじめ（turn）に chance（ない ときは 必ず）で fx（M は 自分・F は 相手 1 匹。solo も 技と 同じ）、外れたら miss（ファミリア P1・P2、デアリング P1・P4、ミューテッド P1）" },
  { key: "lateAtk", meaning: "パッシブ { after, v }：ターンが after を 越えたら ATK × (1 + v)（タイディ P1）" },
  { key: "powOf", meaning: "dmg：威力を この 一覧から 等しく 1 つ（pow は 目安。デアリング S1＝2〜14・S3＝16 か 4）" },
  { key: "payHp", meaning: "fx：その 効果の 前に 自分の 最大 HP × 割合を 払う（tags に 'payHp'。デアリング S4）" },
  { key: "powByTurn", meaning: "dmg { add, max }：いまの 戦いの ターン 1 つに つき 威力 +add（+max まで）（ストリクト S8）" },
  { key: "critTakenCut", meaning: "パッシブ：受ける 会心の ダメージ −割合（ストリクト P2）" },
  { key: "debuffTurnCut", meaning: "パッシブ：受けた デバフの ターン −n（2 ターン 以上の 物だけ）（コンペティティブ P1）" },
  { key: "foeUpFx", meaning: "パッシブ [[id, 量, ターン]]：相手に 上昇が かかると 自分に（1 ターンに 1 回）（コンペティティブ P4）" },
];
