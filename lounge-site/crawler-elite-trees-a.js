// 精鋭の 解析ツリー（戦いで 使う 形）その 1：精鋭 01〜11（SILENT MERIDIAN〜GLASS EYE）
// 名前・MP・文は 資料の まま（crawler-analysis-data.js ＝ docs/mono-link-crawler-elite-skills.md の「解析で 手に 入る ツリー」）。fx は 文に 合わせた 戦いの 中身。数は 仮
// まだ 戦いの 計算に ない 項目・鍵は 下の NEEDS（aoe：相手 全員・team：味方 全員 など）。足すまでは 1 匹だけに 効く／何も しない
import { D, F, M, H, CURE, DIS, MPD, SH, S, P, G } from "./tree-kit.js";
import { ANALYSIS } from "./crawler-analysis-data.js";
import { EFFECTS, STATS9, isBuff } from "./effects.js";
const tx = (name, slot) => ANALYSIS[name].rows.find((r) => r.slot === slot).text; // 文は 資料の まま
const A = (x, o = {}) => ({ ...x, who: "ally", ...o });                            // 味方に（味方の HP の いちばん 減った 子。ソロは 自分）
const ANY_BUFF = (v) => Object.fromEntries(Object.keys(EFFECTS).filter(isBuff).map((id) => [id, v]));   // バフの ある 相手に（どの バフでも）
const DOWN_ALL = (n) => Object.fromEntries(STATS9.map((k) => [`down_${k}`, n]));                         // 能力の 減少 ぜんぶ

let R, t;
const use = (name) => { R = name; t = (s) => ({ text: tx(R, s) }); return R; };

export const TREES = {};

// ---------- 01 SILENT MERIDIAN → ストイック（主 DEX・副 AGI）：朦朧 ＋ 会心の 一撃 ----------
use("SILENT MERIDIAN");
TREES.x_stoic = { name: "ストイック", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: "daze",
  list: [
    S(1, "x_stoic_s1", "正午の線", "itazura", 3, [D(8, { stat: "dex", ignore: 0.2 })], t("S1")),   // RES で 受ける ので イタズラ（DEX の 強さ）
    S(2, "x_stoic_s2", "影縫い", "waza", 3, [D(5, { stat: "agi" }), F("paralysis", 20)], t("S2")),
    S(3, "x_stoic_s3", "迷いを見る", "itazura", 4, [F("daze", 1)], t("S3")),
    S(4, "x_stoic_s4", "沈黙の間", "waza", 5, [D(4, { stat: "dex" }), F("silence", 1, { chance: 0.3 })], t("S4")),
    S(5, "x_stoic_s5", "長い影", "waza", 5, [M("clarity", 2)], t("S5")),
    S(6, "x_stoic_s6", "黙して待つ", "waza", 5, [M("guard", 1), M("mastery", 12)], t("S6")),
    S(7, "x_stoic_s7", "……そこまでだ", "waza", 6, [D(12, { stat: "dex" }), DIS(1)], t("S7")),
    S(8, "x_stoic_s8", "真昼", "waza", 11, [D(20, { stat: "dex", vsFx: { daze: 0.5 }, aoe: true })], t("S8")),
    P(1, "x_stoic_p1", "一閃", tx(R, "P1"), { startFx: [["charge"]] }),
    P(2, "x_stoic_p2", "見切り", tx(R, "P2"), { evade: 0.05 }),
    P(3, "x_stoic_p3", "迷いを断つ", tx(R, "P3"), { vsFx: { daze: 0.1 } }),
    P(4, "x_stoic_p4", "寡黙", tx(R, "P4"), { dexMul: 1.05 }),
    P(5, "x_stoic_p5", "動じない", tx(R, "P5"), { dmgCut: 4 }),
    P(6, "x_stoic_p6", "無駄がない", tx(R, "P6"), { mpRegen: 1 }),
    P(7, "x_stoic_p7", "境界より前から", tx(R, "P7"), { startFx: [["mastery", 10]] }),
  ],
  plan: [G("first", undefined, "x_stoic_s5"), G("every", 5, "x_stoic_s8"), G("foeBuffed", undefined, "x_stoic_s7"), G("every", 4, "x_stoic_s6"), G("foeNotHas", "paralysis", "x_stoic_s2"), G("always", undefined, "x_stoic_s1")] };

// ---------- 02 PLUMB LINE → アップライト（主 DEF・副 HP）：カウンター ＋ バフを 正す ----------
use("PLUMB LINE");
TREES.x_upright = { name: "アップライト", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: "counter",
  list: [
    S(1, "x_upright_s1", "規定の打撃", "waza", 3, [D(8, { stat: "def" })], t("S1")),
    S(2, "x_upright_s2", "是正", "waza", 4, [D(5, { stat: "def" }), DIS(1)], t("S2")),
    S(3, "x_upright_s3", "抵抗の記録", "waza", 4, [M("counter", 1)], t("S3")),
    S(4, "x_upright_s4", "垂直の構え", "waza", 5, [M("armor", 15), M("ward", 15)], t("S4")),
    S(5, "x_upright_s5", "秩序の盾", "waza", 5, [M("substitute", 1, { solo: [M("guard", 1), M("armor", 12)] })], t("S5")),   // 身代わりは 自分が 味方への 直接攻撃を 受ける 構え
    S(6, "x_upright_s6", "背すじを正す", "waza", 5, [CURE, M("up_def", 15, { turns: 3 })], t("S6")),   // 浄化は デバフを ぜんぶ 消す（1 つだけ 消す しくみは ない）
    S(7, "x_upright_s7", "ここから先は通せない", "waza", 6, [D(10, { stat: "def" }), F("down_atk", 10, { turns: 2 }), F("down_int", 10, { turns: 2 })], t("S7")),
    S(8, "x_upright_s8", "執行", "waza", 10, [D(20, { stat: "def", aoe: true }), F("fatigue", 1, { aoe: true })], t("S8")),
    P(1, "x_upright_p1", "背すじ", tx(R, "P1"), { startFx: [["immunity", 15]] }),
    P(2, "x_upright_p2", "記録係", tx(R, "P2"), { counterDef: 0.15 }),
    P(3, "x_upright_p3", "秩序の要", tx(R, "P3"), { teamMul: { def: 1.05, solo: { def: 1.08, res: 1.08 } } }),
    P(4, "x_upright_p4", "下げ振り", tx(R, "P4"), { defMul: 1.05 }),
    P(5, "x_upright_p5", "曲がらない", tx(R, "P5"), { dmgCut: 4 }),
    P(6, "x_upright_p6", "抵抗は記録される", tx(R, "P6"), { vsFx: ANY_BUFF(0.1) }),
    P(7, "x_upright_p7", "直立不動", tx(R, "P7"), { guardBonus: 0.1 }),
  ],
  plan: [G("first", undefined, "x_upright_s4"), G("every", 3, "x_upright_s3"), G("foeBuffed", undefined, "x_upright_s2"), G("every", 5, "x_upright_s8"), G("foeNotHas", "down_atk", "x_upright_s7"), G("always", undefined, "x_upright_s1")] };

// ---------- 03 BOXCAR → ハーティ（主 ATK・副 HP）：撃ちまくる ＋ 炎上 ----------
use("BOXCAR");
TREES.x_hearty = { name: "ハーティ", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "hp", theme: "burn",
  list: [
    S(1, "x_hearty_s1", "試し撃ち", "waza", 3, [D(4, { hits: 2 })], t("S1")),
    S(2, "x_hearty_s2", "新型弾", "waza", 4, [D(7), F("burn", 2)], t("S2")),
    S(3, "x_hearty_s3", "叩き割り", "waza", 5, [D(10, { cutPierce: 0.3 })], t("S3")),   // 装甲・障壁を 減らす しくみは ない ので、その 一撃で 3 割 抜ける 形
    S(4, "x_hearty_s4", "掘り進む", "waza", 5, [M("conceal", 1, { solo: [M("mirage", 15)] }), M("charge")], t("S4")),
    S(5, "x_hearty_s5", "腹ごしらえ", "waza", 5, [H(0.1), M("up_atk", 15, { turns: 3 })], t("S5")),
    S(6, "x_hearty_s6", "前に出ろ", "waza", 6, [A(M("charge"), { team: true, solo: [M("charge"), M("haste", 1)] })], t("S6")),
    S(7, "x_hearty_s7", "貨物列車", "waza", 7, [D(14), M("down_def", 10, { turns: 1 })], t("S7")),
    S(8, "x_hearty_s8", "グッド・モーニング", "waza", 11, [D(22, { aoe: true }), F("scald", 2, { aoe: true })], t("S8")),
    P(1, "x_hearty_p1", "試験場の長", tx(R, "P1"), { vsFx: { burn: 0.1 } }),
    P(2, "x_hearty_p2", "叩けば割れる", tx(R, "P2"), { shellPierce: 0.15 }),
    P(3, "x_hearty_p3", "負けを覚えている", tx(R, "P3"), { lowHpAtk: 0.12 }),   // いまの 計算は HP 30% 以下で はたらく
    P(4, "x_hearty_p4", "豪快", tx(R, "P4"), { atkMul: 1.05 }),
    P(5, "x_hearty_p5", "大食らい", tx(R, "P5"), { hpMul: 1.05 }),
    P(6, "x_hearty_p6", "朝の号令", tx(R, "P6"), { startFx: [["up_atk", 10, 3]] }),
    P(7, "x_hearty_p7", "火薬のにおい", tx(R, "P7"), { onHitFx: [["burn", 0.15, 2]] }),
  ],
  plan: [G("first", undefined, "x_hearty_s6"), G("selfHas", "charge", "x_hearty_s8"), G("foeNotHas", "burn", "x_hearty_s2"), G("hpBelow", 40, "x_hearty_s5"), G("every", 4, "x_hearty_s4"), G("always", undefined, "x_hearty_s1")] };

// ---------- 04 LULLABY → メロウ（主 INT・副 RES）：回復 ＋ 眠り・麻痺で 止める ----------
use("LULLABY");
TREES.x_mellow = { name: "メロウ", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "healer", main: "int", sub: "res", theme: "sleep",
  list: [
    S(1, "x_mellow_s1", "一刺し", "itazura", 3, [D(7), F("paralysis", 15)], t("S1")),
    S(2, "x_mellow_s2", "毒の注意書き", "itazura", 4, [D(4), F("venom", 1)], t("S2")),
    S(3, "x_mellow_s3", "処方", "waza", 5, [A(H(0.15))], t("S3")),
    S(4, "x_mellow_s4", "子守歌", "itazura", 5, [F("sleep", 1, { chance: 0.3 })], t("S4")),
    S(5, "x_mellow_s5", "安静に", "itazura", 5, [F("down_atk", 10, { turns: 2 }), F("down_int", 10, { turns: 2 })], t("S5")),
    S(6, "x_mellow_s6", "静かな診察", "itazura", 6, [D(10, { vsFx: { sleep: 0.3, paralysis: 0.3 } })], t("S6")),
    S(7, "x_mellow_s7", "投薬", "waza", 7, [A(M("reincarnation"), { once: true })], t("S7")),
    S(8, "x_mellow_s8", "おやすみなさい", "itazura", 11, [D(20, { aoe: true }), F("sleep", 1, { chance: 0.15, aoe: true })], t("S8")),
    P(1, "x_mellow_p1", "主治医", tx(R, "P1"), { healMul: 1.1 }),
    P(2, "x_mellow_p2", "カルテ", tx(R, "P2"), { vsFx: { sleep: 0.12 } }),
    P(3, "x_mellow_p3", "つめたい手当て", tx(R, "P3"), { healShield: 0.1 }),
    P(4, "x_mellow_p4", "やわらかい声", tx(R, "P4"), { intMul: 1.05 }),
    P(5, "x_mellow_p5", "落ち着いた手つき", tx(R, "P5"), { statusRes: 8 }),
    P(6, "x_mellow_p6", "ご安心を", tx(R, "P6"), { startFx: [["regen", 10]] }),
    P(7, "x_mellow_p7", "夜勤", tx(R, "P7"), { mpRegen: 1 }),
  ],
  plan: [G("first", undefined, "x_mellow_s4"), G("hpBelow", 30, "x_mellow_s7"), G("hpBelow", 55, "x_mellow_s3"), G("foeHas", "sleep", "x_mellow_s6"), G("every", 3, "x_mellow_s5"), G("always", undefined, "x_mellow_s1")] };

// ---------- 05 LONG WINTER → ウェザード（主 DEF・副 HP）：凍傷・鈍らせる ＋ 粘る ----------
use("LONG WINTER");
TREES.x_weathered = { name: "ウェザード", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: "frostbite",
  list: [
    S(1, "x_weathered_s1", "霜の手", "waza", 3, [D(7, { stat: "def" }), F("frostbite", 2)], t("S1")),
    S(2, "x_weathered_s2", "とげの壁", "waza", 4, [M("thorns", 30)], t("S2")),
    S(3, "x_weathered_s3", "根を張る", "waza", 5, [M("armor", 12), M("ward", 12), M("regen", 6)], t("S3")),
    S(4, "x_weathered_s4", "かくまう", "waza", 5, [A(M("conceal", 1), { notSelf: true, solo: [M("guard", 1), M("regen", 6)] })], t("S4")),
    S(5, "x_weathered_s5", "吹雪", "itazura", 5, [F("down_agi", 12, { turns: 3 }), F("frostbite", 2)], t("S5")),
    S(6, "x_weathered_s6", "積もる雪", "waza", 6, [D(9, { stat: "def" }), F("freeze", 1, { chance: 0.2, atLeast: { id: "frostbite", n: 4 } })], t("S6")),
    S(7, "x_weathered_s7", "壁は逃げん", "waza", 6, [M("up_def", 15, { turns: 3 }), M("immunity", 12)], t("S7")),
    S(8, "x_weathered_s8", "長い冬", "waza", 11, [D(16, { stat: "def", aoe: true }), F("frostbite", 3, { aoe: true }), F("down_agi", 15, { turns: 3, aoe: true })], t("S8")),
    P(1, "x_weathered_p1", "動かぬ木", tx(R, "P1"), { guardBonus: 0.1 }),
    P(2, "x_weathered_p2", "雪の下のとげ", tx(R, "P2"), { thornsMul: 1.15 }),
    P(3, "x_weathered_p3", "守りきった町", tx(R, "P3"), { lowHpOnce: [[0.3, "armor", 20], [0.3, "ward", 20]] }),
    P(4, "x_weathered_p4", "年輪", tx(R, "P4"), { defMul: 1.05 }),
    P(5, "x_weathered_p5", "風雪", tx(R, "P5"), { dmgCut: 4 }),
    P(6, "x_weathered_p6", "老兵の意地", tx(R, "P6"), { lowHpCut: 0.08 }),
    P(7, "x_weathered_p7", "暖炉の火", tx(R, "P7"), { startFx: [["regen", 10]] }),
  ],
  plan: [G("first", undefined, "x_weathered_s3"), G("hpBelow", 40, "x_weathered_s4"), G("every", 4, "x_weathered_s2"), G("foeNotHas", "down_agi", "x_weathered_s5"), G("every", 3, "x_weathered_s6"), G("always", undefined, "x_weathered_s1")] };

// ---------- 06 CHERRY SMOKE → チャーミング（主 INT・副 MP）：混乱・体調不良 ＋ バフを 消す ----------
use("CHERRY SMOKE");
TREES.x_charming = { name: "チャーミング", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "caster", main: "int", sub: "mp", theme: "confusion",
  list: [
    S(1, "x_charming_s1", "囁き", "itazura", 3, [D(7), F("confusion", 1, { chance: 0.2 })], t("S1")),
    S(2, "x_charming_s2", "紫煙", "itazura", 3, [F("sickness", 3)], t("S2")),
    S(3, "x_charming_s3", "割りこみ", "itazura", 5, [DIS(1)], t("S3")),
    S(4, "x_charming_s4", "砂嵐", "itazura", 5, [D(4, { aoe: true }), F("blind", 1, { aoe: true })], t("S4")),
    S(5, "x_charming_s5", "代金はあとで", "itazura", 5, [D(6), MPD(3)], t("S5")),
    S(6, "x_charming_s6", "甘い取引", "waza", 6, [M("focus", 2), M("up_int", 12, { turns: 3 })], t("S6")),
    S(7, "x_charming_s7", "投げキス", "itazura", 6, [D(8), F("down_atk", 12, { turns: 2 })], t("S7")),
    S(8, "x_charming_s8", "電波ジャック", "itazura", 11, [D(20, { aoe: true }), F("confusion", 1, { chance: 0.2, aoe: true })], t("S8")),
    P(1, "x_charming_p1", "煙が残る", tx(R, "P1"), { extendIds: { sickness: 1 } }),
    P(2, "x_charming_p2", "情報の側", tx(R, "P2"), { startDispel: 1 }),
    P(3, "x_charming_p3", "からかい", tx(R, "P3"), { vsFx: { confusion: 0.1 } }),
    P(4, "x_charming_p4", "甘い声", tx(R, "P4"), { intMul: 1.05 }),
    P(5, "x_charming_p5", "煙の向こう", tx(R, "P5"), { evade: 0.03 }),
    P(6, "x_charming_p6", "仲介料", tx(R, "P6"), { dispelMp: 2 }),
    P(7, "x_charming_p7", "さくらんぼの煙", tx(R, "P7"), { onHitFx: [["sickness", 0.15, 2]] }),
  ],
  plan: [G("first", undefined, "x_charming_s6"), G("foeBuffed", undefined, "x_charming_s3"), G("foeNotHas", "sickness", "x_charming_s2"), G("foeNotHas", "down_atk", "x_charming_s7"), G("every", 3, "x_charming_s5"), G("always", undefined, "x_charming_s1")] };

// ---------- 07 PATIENCE → ウォッチフル（主 ATK・副 AGI）：読む・待つ・追う ＋ 貫通 ----------
use("PATIENCE");
TREES.x_watchful = { name: "ウォッチフル", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "attacker", main: "atk", sub: "agi", theme: "pierce",
  list: [
    S(1, "x_watchful_s1", "追いすがる", "waza", 3, [D(8, { ifHitLast: 0.2 })], t("S1")),
    S(2, "x_watchful_s2", "足あとを読む", "itazura", 3, [{ ...DIS(1), only: "mirage" }, M("pierce", 4)], t("S2")),   // 幻影を 減らす しくみは ない ので、幻影を 消す 形
    S(3, "x_watchful_s3", "初雪", "waza", 4, [D(7), F("frostbite", 2)], t("S3")),
    S(4, "x_watchful_s4", "罠", "itazura", 5, [F("paralysis", 20), F("down_agi", 12, { turns: 2 })], t("S4")),
    S(5, "x_watchful_s5", "待ち伏せ", "waza", 5, [M("charge"), M("conceal", 1, { solo: [M("mirage", 15)] })], t("S5")),
    S(6, "x_watchful_s6", "九日待つ", "waza", 5, [M("guard", 1), M("up_atk", 15, { turns: 3 })], t("S6")),
    S(7, "x_watchful_s7", "足あとが新しい", "waza", 6, [D(12, { sure: true })], t("S7")),
    S(8, "x_watchful_s8", "砂が落ちきる", "waza", 11, [D(24, { addPierce: 8 })], t("S8")),
    P(1, "x_watchful_p1", "執念", tx(R, "P1"), { momentum: 0.05 }),   // いまの 計算は「前の 番に 当てて いたら」だけ（3 回まで 重ならない）
    P(2, "x_watchful_p2", "狩りの名人", tx(R, "P2"), { vsFx: { paralysis: 0.1 } }),
    P(3, "x_watchful_p3", "長い狩り", tx(R, "P3"), { lateAtk: { after: 5, v: 0.1 } }),
    P(4, "x_watchful_p4", "鋭い目", tx(R, "P4"), { resistFx: { blind: 30 } }),
    P(5, "x_watchful_p5", "狩人の腕", tx(R, "P5"), { atkMul: 1.05 }),
    P(6, "x_watchful_p6", "気配を読む", tx(R, "P6"), { evade: 0.03 }),
    P(7, "x_watchful_p7", "雪の中の九日", tx(R, "P7"), { startFx: [["pierce", 8]] }),
  ],
  plan: [G("first", undefined, "x_watchful_s6"), G("foeHas", "mirage", "x_watchful_s2"), G("selfHas", "charge", "x_watchful_s8"), G("foeNotHas", "paralysis", "x_watchful_s4"), G("every", 4, "x_watchful_s5"), G("always", undefined, "x_watchful_s1")] };

// ---------- 08 WINDOWSILL → ウィムジカル（主 INT・副 MP）：毒を 植えて 育て、はじけさせる ----------
use("WINDOWSILL");
TREES.x_whimsical = { name: "ウィムジカル", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "caster", main: "int", sub: "mp", theme: "poison",
  list: [
    S(1, "x_whimsical_s1", "お茶をこぼす", "itazura", 3, [D(7), F("poison", 2)], t("S1")),
    S(2, "x_whimsical_s2", "種まき", "itazura", 3, [F("poison", 2, { atLeast: { id: "poison", n: 1 } }), F("poison", 4)], t("S2")),   // 「もう 毒が ある」を 先に 見る
    S(3, "x_whimsical_s3", "花粉", "itazura", 4, [F("sickness", 2, { aoe: true })], t("S3")),
    S(4, "x_whimsical_s4", "水やり", "waza", 5, [M("regen", 8), M("immunity", 8)], t("S4")),
    S(5, "x_whimsical_s5", "剪定", "itazura", 5, [D(6), DIS(1)], t("S5")),
    S(6, "x_whimsical_s6", "接ぎ木", "waza", 5, [M("regen", undefined, { amtFoeFx: { id: "poison", div: 3 } })], t("S6")),
    S(7, "x_whimsical_s7", "花占い", "itazura", 6, [M("up_int", 15, { turns: 3, chance: 0.5 }), F("poison", 6, { chance: 0.5 })], t("S7")),   // 2 つを べつべつに 50%
    S(8, "x_whimsical_s8", "満開", "itazura", 11, [D(0, { consume: "poison", perAmt: 1.2, aoe: true }), M("regen", 10)], t("S8")),   // 毒の 量 × 1.2 を 威力に して はじけさせる
    P(1, "x_whimsical_p1", "お茶会", tx(R, "P1"), { startFx: [["focus", undefined, 2]] }),
    P(2, "x_whimsical_p2", "品種改良", tx(R, "P2"), { fxAmtMul: { poison: 1.15 } }),
    P(3, "x_whimsical_p3", "根腐れ", tx(R, "P3"), { auraFxAt: [["rot", 0.1, 1, "poison", 10]] }),
    P(4, "x_whimsical_p4", "窓辺の空想", tx(R, "P4"), { intMul: 1.05 }),
    P(5, "x_whimsical_p5", "片方の羽", tx(R, "P5"), { evade: 0.03 }),
    P(6, "x_whimsical_p6", "気まぐれ", tx(R, "P6"), { onHitFx: [["poison", 0.2, 3]] }),
    P(7, "x_whimsical_p7", "温室育ち", tx(R, "P7"), { startFx: [["immunity", 10]] }),
  ],
  plan: [G("foeNotHas", "poison", "x_whimsical_s2"), G("foeBuffed", undefined, "x_whimsical_s5"), G("hpBelow", 50, "x_whimsical_s6"), G("every", 4, "x_whimsical_s8"), G("every", 3, "x_whimsical_s7"), G("always", undefined, "x_whimsical_s1")] };

// ---------- 09 LAST ORDERS → マーセナリー（主 DEX・副 LUK）：疲労 ＋ 弱った 相手を 仕留める ----------
use("LAST ORDERS");
TREES.x_mercenary = { name: "マーセナリー", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "luk", theme: "fatigue",
  list: [
    S(1, "x_mercenary_s1", "取り立て", "waza", 3, [D(7, { stat: "dex" }), F("fatigue", 1)], t("S1")),
    S(2, "x_mercenary_s2", "値切り", "itazura", 4, [F("down_atk", 10, { turns: 2 }), F("down_int", 10, { turns: 2 })], t("S2")),
    S(3, "x_mercenary_s3", "前金", "waza", 5, [M("charge"), M("up_luk", 15, { turns: 3 })], t("S3")),
    S(4, "x_mercenary_s4", "小銭投げ", "waza", 4, [D(4, { hits: 3, stat: "luk" })], t("S4")),
    S(5, "x_mercenary_s5", "一杯おごる", "itazura", 5, [F("daze", 1)], t("S5")),
    S(6, "x_mercenary_s6", "首の値段", "waza", 6, [D(10, { stat: "dex", execute: 0.5, executeMul: 1.4 })], t("S6")),
    S(7, "x_mercenary_s7", "高くつくわよ", "waza", 6, [D(8, { stat: "dex" }), MPD(3)], t("S7")),
    S(8, "x_mercenary_s8", "店じまい", "waza", 11, [D(20, { stat: "dex", execute: 0.3, aoe: true })], t("S8")),
    P(1, "x_mercenary_p1", "計算高い", tx(R, "P1"), { vsFx: { fatigue: 0.1 } }),
    P(2, "x_mercenary_p2", "賞金首の目", tx(R, "P2"), { critVsLowHp: 0.08 }),
    P(3, "x_mercenary_p3", "釣り銭", tx(R, "P3"), { crit: 0.05 }),
    P(4, "x_mercenary_p4", "おごりの代償", tx(R, "P4"), { vsFx: { daze: 0.1 } }),
    P(5, "x_mercenary_p5", "狙いを絞る", tx(R, "P5"), { momentum: 0.1 }),
    P(6, "x_mercenary_p6", "ツケ", tx(R, "P6"), { extendIds: { fatigue: 1 } }),
    P(7, "x_mercenary_p7", "報酬", tx(R, "P7"), { bountyMp: { at: 0.3, pct: 0.15 } }),
  ],
  plan: [G("first", undefined, "x_mercenary_s3"), G("foeHpBelow", 30, "x_mercenary_s8"), G("foeHpBelow", 50, "x_mercenary_s6"), G("every", 3, "x_mercenary_s5"), G("foeNotHas", "fatigue", "x_mercenary_s1"), G("always", undefined, "x_mercenary_s7")] };

// ---------- 10 HOMEBOUND → ディペンダブル（主 DEF・副 HP）：味方 全員を 守って 連れ帰る ----------
use("HOMEBOUND");
TREES.x_dependable = { name: "ディペンダブル", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "defender", main: "def", sub: "hp", theme: "shield",
  list: [
    S(1, "x_dependable_s1", "積み荷落とし", "waza", 3, [D(8, { stat: "def" }), F("down_agi", 10, { turns: 2 })], t("S1")),
    S(2, "x_dependable_s2", "荷を守る", "waza", 4, [A(SH(0.08), { team: true, solo: [SH(0.15)] })], t("S2")),
    S(3, "x_dependable_s3", "灯りをともす", "waza", 5, [A(M("regen", 5), { team: true, solo: [M("regen", 10)] })], t("S3")),
    S(4, "x_dependable_s4", "しんがり", "waza", 5, [M("guard"), M("thorns", 20)], t("S4")),
    S(5, "x_dependable_s5", "肩を貸す", "waza", 5, [A(CURE), A(M("immunity", 8))], t("S5")),
    S(6, "x_dependable_s6", "歩けば着く", "waza", 6, [A(H(0.08), { team: true, solo: [H(0.15), M("up_agi", 15, { turns: 2 })] }), A(M("up_agi", 12, { turns: 2 }), { team: true, solo: [] })], t("S6")),
    S(7, "x_dependable_s7", "警告は一度だ", "waza", 6, [D(10, { stat: "def" }), F("down_atk", 12, { turns: 2 })], t("S7")),
    S(8, "x_dependable_s8", "荷崩れ", "waza", 11, [D(20, { stat: "def", aoe: true }), A(SH(0.06), { team: true, solo: [SH(0.12)] })], t("S8")),
    P(1, "x_dependable_p1", "隊商の長", tx(R, "P1"), { defMul: 1.05 }),
    P(2, "x_dependable_p2", "面倒見", tx(R, "P2"), { shieldMul: 1.12, fxAmtMul: { regen: 1.12 } }),
    P(3, "x_dependable_p3", "殿は俺が持つ", tx(R, "P3"), { guardBonus: 0.1 }),
    P(4, "x_dependable_p4", "旅の備え", tx(R, "P4"), { statusRes: 8 }),
    P(5, "x_dependable_p5", "粘り強い", tx(R, "P5"), { lowHpDef: 0.12 }),
    P(6, "x_dependable_p6", "追いつかせない", tx(R, "P6"), { vsFx: { down_agi: 0.1 } }),
    P(7, "x_dependable_p7", "荷は落とさない", tx(R, "P7"), { lowHpOnce: [[0.3, "reincarnation"]] }),
  ],
  plan: [G("first", undefined, "x_dependable_s2"), G("hpBelow", 40, "x_dependable_s6"), G("debuffed", undefined, "x_dependable_s5"), G("every", 3, "x_dependable_s4"), G("foeNotHas", "down_atk", "x_dependable_s7"), G("always", undefined, "x_dependable_s1")] };

// ---------- 11 GLASS EYE → メティキュラス（主 DEX・副 AGI）：衰弱で 測り、減少で 弱らせる ----------
use("GLASS EYE");
TREES.x_meticulous = { name: "メティキュラス", enemy: R, analysis: true, dungeon: null, rank: "精鋭", type: "technician", main: "dex", sub: "agi", theme: "weakness",
  list: [
    S(1, "x_meticulous_s1", "振り子", "waza", 3, [D(4, { hits: 2, stat: "dex" }), F("blind", 1, { chance: 0.15 })], t("S1")),   // 確率は 1 回だけ ひく
    S(2, "x_meticulous_s2", "計測", "itazura", 3, [F("weakness", 12)], t("S2")),
    S(3, "x_meticulous_s3", "証人", "waza", 5, [M("conceal", 1, { solo: [M("mirage", 12)] }), M("focus", 2)], t("S3")),
    S(4, "x_meticulous_s4", "査定", "waza", 5, [D(8, { stat: "dex", perBuff: 2 })], t("S4")),
    S(5, "x_meticulous_s5", "規定違反", "itazura", 5, [F("weakness", 10), F("silence", 1, { chance: 0.3, atLeast: { id: "weakness", n: 20 } })], t("S5")),
    S(6, "x_meticulous_s6", "照合", "itazura", 6, [F("down_def", 12, { turns: 2 }), F("down_res", 12, { turns: 2 })], t("S6")),
    S(7, "x_meticulous_s7", "記録中", "waza", 6, [D(11, { stat: "dex", sure: true })], t("S7")),
    S(8, "x_meticulous_s8", "格下げ", "waza", 11, [D(18, { stat: "dex", aoe: true }), ...["atk", "int", "def", "res"].map((k) => F(`down_${k}`, 10, { turns: 2, aoe: true }))], t("S8")),
    P(1, "x_meticulous_p1", "義眼", tx(R, "P1"), { dexMul: 1.05 }),
    P(2, "x_meticulous_p2", "中立", tx(R, "P2"), { startFx: [["immunity", 15]] }),
    P(3, "x_meticulous_p3", "見落としなし", tx(R, "P3"), { crit: 0.05 }),
    P(4, "x_meticulous_p4", "監察", tx(R, "P4"), { vsFx: { weakness: 0.1 } }),
    P(5, "x_meticulous_p5", "数字で話す", tx(R, "P5"), { fxAmtAdd: DOWN_ALL(3) }),
    P(6, "x_meticulous_p6", "記録継続", tx(R, "P6"), { momentum: 0.1 }),
    P(7, "x_meticulous_p7", "格付けの表", tx(R, "P7"), { startFoeFx: ["atk", "int", "def", "res"].map((k) => [`down_${k}`, 5, 2]) }),
  ],
  plan: [G("first", undefined, "x_meticulous_s2"), G("foeNotHas", "down_def", "x_meticulous_s6"), G("foeBuffed", undefined, "x_meticulous_s4"), G("every", 3, "x_meticulous_s5"), G("every", 5, "x_meticulous_s8"), G("always", undefined, "x_meticulous_s1")] };

// 戦いの 計算に まだ ない 項目・鍵（Claude が あとで battle-sim.js に 足す）
export const NEEDS = [
  { key: "aoe", meaning: "dmg・fx に 付ける：相手 全員に 当てる（当たり・確率・はじけさせるは 1 匹ずつ）。真昼・執行・グッド・モーニング・おやすみなさい・長い冬・砂嵐・電波ジャック・花粉・満開・店じまい・荷崩れ・格下げ" },
  { key: "team", meaning: "who:\"ally\" の fx・heal・shield に 付ける：味方 全員（自分も）に。ソロの ときは solo（前に出ろ・荷を守る・灯りをともす・歩けば着く・荷崩れ）" },
  { key: "cure.who", meaning: "cure に who:\"ally\"：味方 1 匹（HP の いちばん 減った 子。ソロは 自分）の デバフを 消す（肩を貸す）。いまは 自分だけ" },
  { key: "teamMul", meaning: "パッシブ：味方 全員（自分も）の 能力 × 倍（{ def: 1.05 }）。solo の 表は 味方が いない ときだけ 自分に（秩序の要）" },
  { key: "shellPierce", meaning: "パッシブ：自分の 直接攻撃で、相手の 装甲・障壁で 減る 分の この 割合を 無視（叩けば割れる）" },
  { key: "healShield", meaning: "パッシブ：自分が 回復した 量（味方への 回復も）の この 割合を、回復した 子に シールドで 付ける（つめたい手当て）" },
  { key: "thornsMul", meaning: "パッシブ：棘で 返す ダメージ × 倍（雪の下のとげ）" },
  { key: "lowHpOnce", meaning: "パッシブ：[at, id, 量, ターン] の 一覧。HP が 最大の at 以下に なった とき 一度だけ 自分に その 状態（守りきった町・荷は落とさない）" },
  { key: "startDispel", meaning: "パッシブ：戦いの はじめに 相手 1 匹の バフを この 数 消す（情報の側。startFx の あとで）" },
  { key: "dispelMp", meaning: "パッシブ：相手の バフを 1 つ 消す たびに MP + この 数（仲介料）" },
  { key: "ifHitLast", meaning: "dmg：前の 番に 同じ 相手に 当てて いれば 威力 × (1 + この 値)（追いすがる）" },
  { key: "lateAtk", meaning: "パッシブ：{ after, v }。ターンが after を 越えたら ATK × (1 + v)（長い狩り）" },
  { key: "amtFoeFx", meaning: "fx：{ id, div }。量 ＝ 相手の その 状態の 量 ÷ div（切り捨て・0 なら 付けない）（接ぎ木）" },
  { key: "auraFxAt", meaning: "パッシブ：[id, 確率, ターン, 条件の id, n] の 一覧。auraFx と 同じ（手番の はじめに 相手に）だが、相手の 条件の 状態の 量が n 以上の ときだけ（根腐れ）" },
  { key: "executeMul", meaning: "dmg：execute の 倍率（無い ときは 2）。首の値段は HP 半分 以下で × 1.4" },
  { key: "critVsLowHp", meaning: "パッシブ：HP が 半分 以下の 相手に 会心 + この 値（賞金首の目）" },
  { key: "bountyMp", meaning: "パッシブ：{ at, pct }。相手の HP を はじめて 最大の at 以下に した とき（倒した ときも）、自分の MP を 最大 MP × pct 回復（相手 1 匹に つき 1 回）（報酬）" },
  { key: "perBuff", meaning: "dmg：相手の バフ 1 つに つき 威力 + この 数（構えも 数える）（査定）" },
];
