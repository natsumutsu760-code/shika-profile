// 迷宮の 中の 精鋭が 使う 技（技 5 ＋ 目玉 1・パッシブ 3）。鹿さんの 決め（2026-11-03 カード。もらった 文の まま）：
//   「敵POMはクローラー内では決められたスキルとパッシブを使う。精鋭POMのスキルは強力な為、解析して入手できるものは通常…」
// 中身は docs/mono-link-crawler-elite-skills.md の 表の まま（名前・威力・量・ターン）。解析で 手に 入る ツリー（crawler-elite-trees-*.js）は これを 弱めた 物
// 2026-11-05 に 入れた（前は 精鋭も ペットの 種類の ふつうの ツリー〈linkerPet〉で 戦って いた。洗い出し し直しで 見つけた 漏れ）
// いま 入れて いるのは 第 1 章に 出る C の 7 人（敵：ONE SHOE・SPLINT・GHOST NOTE ／ 味方：RABBIT HOLE・BOOKMARK・STOPWATCH・NEW MOON）。
// のこり 25 人（S・A・B と NINE LIVES）は 第 2 章から 出る ので、その 章を 作る ときに 同じ 形で 足す（S・A の 目玉は 予告つき）
// Claude が 決めた 所（資料に 書いて いない）：MP は 解析ツリーの 同じ 名前の 技と 同じ・作戦（ガンビット）は 解析ツリーに ならった・
//   ソロの ときの 隠蔽は 幻影 15（解析ツリーと 同じ 読みかえ。戦いの 決まりの ままだと 量の ない バリアに なる）
import { SKILL } from "./skills.js";
import { D, F, M, H, CURE, SH, S, P, G } from "./tree-kit.js";

const ally = (x, o = {}) => ({ ...x, who: "ally", ...o });             // 味方 1 匹（HP の いちばん 減った 子。ソロは 自分）
const hide = () => M("conceal", 1, { solo: [M("mirage", 15)] });        // 隠蔽 1 ターン（ソロは 幻影 15）

// type：役（アタッカー attacker・ヒーラー healer・テクニシャン technician）。skills は 6 こ（いちばん 後ろが 目玉）・passives は 3 こ
export const ELITE_UNITS = {
  "ONE SHOE": { key: "oneshoe", type: "attacker",
    skills: [
      S(1, "xe_oneshoe_s1", "飛びつく", "waza", 3, [D(12)], { first: true, text: "威力 12。かならず 先に 動く" }),
      S(2, "xe_oneshoe_s2", "噛みつく", "waza", 4, [D(8, { hits: 2 })], { text: "威力 8 × 2" }),
      S(3, "xe_oneshoe_s3", "吠える", "itazura", 3, [F("down_def", 15, { turns: 2 })], { text: "DEF 減少 15（2 ターン）" }),
      S(4, "xe_oneshoe_s4", "追いかける", "waza", 4, [M("up_agi", 25, { turns: 3 })], { text: "自分に AGI 上昇 25（3 ターン）" }),
      S(5, "xe_oneshoe_s5", "待てない", "waza", 5, [M("charge"), M("down_def", 20, { turns: 1 })], { text: "自分に チャージ。次の 番まで 自分の DEF 減少 20" }),
      S(6, "xe_oneshoe_s6", "片方の靴", "waza", 11, [D(26, { recoil: 0.2 })], { text: "威力 26。与えた ダメージの 1/5 を 自分も 受ける" }),
    ],
    passives: [
      P(1, "xe_oneshoe_p1", "せっかち", "AGI +10%", { agiMul: 1.1 }),
      P(2, "xe_oneshoe_p2", "すぐ吠える", "戦いの はじめに 相手 1 匹の DEF 減少 10（3 ターン）", { startFoeFx: [["down_def", 10, 3]] }),
      P(3, "xe_oneshoe_p3", "師匠の言いつけ", "防御した 次の 技 +25%（待てた ときは 強い）", { guardNext: 0.25 }),
    ],
    plan: [G("first", undefined, "xe_oneshoe_s4"), G("mpAtLeast", 11, "xe_oneshoe_s6"), G("foeNotHas", "down_def", "xe_oneshoe_s3"), G("every", 3, "xe_oneshoe_s5"), G("selfHas", "charge", "xe_oneshoe_s2"), G("always", undefined, "xe_oneshoe_s1")] },

  SPLINT: { key: "splint", type: "healer",
    skills: [
      S(1, "xe_splint_s1", "添え木", "waza", 5, [ally(M("armor", 10)), ally(H(0.25))], { text: "味方 1 匹の HP を 25% 回復 ＋ 装甲 +10。ソロの ときは 自分" }),
      S(2, "xe_splint_s2", "つぎはぎ", "waza", 3, [SH(0.2)], { text: "自分に シールド 20%" }),
      S(3, "xe_splint_s3", "結び目", "itazura", 3, [D(8, { stat: "res" }), F("down_agi", 15, { turns: 3 })], { text: "威力 8（RES）。AGI 減少 15（3 ターン）" }),
      S(4, "xe_splint_s4", "師匠の言葉", "waza", 5, [M("immunity", 20), M("up_def", 15, { turns: 3 })], { text: "自分に 免疫 +20 ＋ DEF 上昇 15（3 ターン）" }),
      S(5, "xe_splint_s5", "門を支える", "waza", 5, [M("substitute", 1, { solo: [M("guard", 1), M("regen", 10)] })], { text: "味方 1 匹に 身代わり（1 ターン）。ソロの ときは 自分に 防御 ＋ 再生 +10" }),
      S(6, "xe_splint_s6", "最後まで支える", "waza", 10, [ally(M("armor", 20), { team: true, solo: [M("armor", 40)] }), ally(M("ward", 20), { team: true, solo: [M("ward", 40)] }), ally(M("regen", 10), { team: true, solo: [M("regen", 20)] })], { text: "味方 全員に 装甲 +20・障壁 +20 ＋ 再生 +10。ソロの ときは 自分に 2 倍" }),
    ],
    passives: [
      P(1, "xe_splint_p1", "修業中", "防御した あとの 回復の 量 +20%", { pIf: [["selfHas", "guard", { healMul: 1.2 }]] }),
      P(2, "xe_splint_p2", "まじめ", "戦いの はじめに 免疫 +15", { startFx: [["immunity", 15]] }),
      P(3, "xe_splint_p3", "折れても立つ", "HP が 30% 以下に なると 一度だけ HP を 20% 回復", { lowHpHeal: [[0.3, 0.2]] }),
    ],
    plan: [G("first", undefined, "xe_splint_s4"), G("hpBelow", 40, "xe_splint_s1"), G("mpAtLeast", 10, "xe_splint_s6"), G("selfNotHas", "shield", "xe_splint_s2"), G("every", 3, "xe_splint_s5"), G("always", undefined, "xe_splint_s3")] },

  "GHOST NOTE": { key: "ghostnote", type: "technician",
    skills: [
      S(1, "xe_ghostnote_s1", "裏面", "waza", 5, [hide(), M("charge")], { text: "自分に 隠蔽 1 ターン ＋ チャージ" }),
      S(2, "xe_ghostnote_s2", "消えかけた音", "waza", 3, [D(10, { stat: "dex" }), F("blind", 2)], { text: "威力 10（DEX）。盲目 2 ターン" }),
      S(3, "xe_ghostnote_s3", "不協和音", "itazura", 6, [F("confusion", 1, { chance: 0.3, aoe: true })], { text: "相手 全員、それぞれ 30% で 混乱 1 ターン" }),
      S(4, "xe_ghostnote_s4", "ノイズ", "itazura", 4, [F("fatigue", 2)], { text: "疲労 2 ターン" }),
      S(5, "xe_ghostnote_s5", "休符", "waza", 4, [H(0.15), M("mirage", 15)], { text: "自分の HP を 15% 回復 ＋ 幻影 +15" }),
      S(6, "xe_ghostnote_s6", "記録にない", "waza", 11, [D(22, { stat: "dex", powIf: [["selfHas", "conceal", 1], ["selfHas", "mirage", 1]] })], { text: "威力 22（DEX）。隠蔽の あいだに 使うと 2 倍" }),
    ],
    passives: [
      P(1, "xe_ghostnote_p1", "死んだことになっている", "戦いの はじめに 隠蔽 1 ターン", { rollFx: [{ at: "start", fx: [hide()] }] }),
      P(2, "xe_ghostnote_p2", "わざと低い", "HP が 半分 以下に なると 一度だけ DEX・AGI +30%", { lowHpOnce: [[0.5, "up_dex", 30], [0.5, "up_agi", 30]] }),
      P(3, "xe_ghostnote_p3", "皮肉", "盲目の 相手に 会心 +15%", { critVsFx: { blind: 0.15 } }),
    ],
    plan: [G("first", undefined, "xe_ghostnote_s1"), G("selfHas", "charge", "xe_ghostnote_s6"), G("foeNotHas", "blind", "xe_ghostnote_s2"), G("every", 4, "xe_ghostnote_s3"), G("hpBelow", 50, "xe_ghostnote_s5"), G("every", 3, "xe_ghostnote_s4"), G("always", undefined, "xe_ghostnote_s2")] },

  STOPWATCH: { key: "stopwatch", type: "technician",
    skills: [
      S(1, "xe_stopwatch_s1", "計時", "itazura", 4, [F("down_agi", 20, { turns: 3 })], { text: "AGI 減少 20（3 ターン）" }),
      S(2, "xe_stopwatch_s2", "採点", "waza", 3, [D(10, { stat: "dex" })], { text: "威力 10（DEX）" }),
      S(3, "xe_stopwatch_s3", "減点", "itazura", 5, [F("down_atk", 15, { turns: 2 }), F("down_int", 15, { turns: 2 })], { text: "ATK・INT 減少 15（2 ターン）" }),
      S(4, "xe_stopwatch_s4", "秒針", "waza", 4, [D(4, { stat: "agi", hits: 3 })], { text: "威力 4 × 3（AGI）" }),
      S(5, "xe_stopwatch_s5", "やり直し", "waza", 5, [{ ...CURE, n: 1 }], { text: "自分の デバフを 1 つ 消す" }),
      S(6, "xe_stopwatch_s6", "タイムアップ", "waza", 10, [D(20, { stat: "dex", powByTurn: { add: 2, max: 16 } })], { text: "威力 20（DEX）。戦いの ターン 1 つに つき 威力 +2（+16 まで）" }),
    ],
    passives: [
      P(1, "xe_stopwatch_p1", "時間厳守", "戦いの はじめに 加速 1 ターン", { startFx: [["haste", undefined, 1]] }),
      P(2, "xe_stopwatch_p2", "公平", "受ける 会心の ダメージ −20%", { critTakenCut: 0.2 }),
      P(3, "xe_stopwatch_p3", "試験官", "相手の HP が 満タンの とき、技 +15%", { pIf: [["foeHpAbove", 99.99, { wazaDmg: 15 }]] }),
    ],
    plan: [G("first", undefined, "xe_stopwatch_s1"), G("debuffed", undefined, "xe_stopwatch_s5"), G("after", 4, "xe_stopwatch_s6"), G("foeNotHas", "down_atk", "xe_stopwatch_s3"), G("every", 2, "xe_stopwatch_s4"), G("always", undefined, "xe_stopwatch_s2")] },

  BOOKMARK: { key: "bookmark", type: "healer",
    skills: [
      S(1, "xe_bookmark_s1", "手当て", "waza", 5, [ally(H(0.25))], { text: "味方 1 匹の HP を 25% 回復。ソロの ときは 自分" }),
      S(2, "xe_bookmark_s2", "記録", "waza", 4, [M("focus", 3)], { text: "自分に 集中 3 ターン" }),
      S(3, "xe_bookmark_s3", "サンプル採取", "itazura", 3, [D(6, { stat: "int" }), F("poison", 4)], { text: "威力 6（INT）。毒 +4" }),
      S(4, "xe_bookmark_s4", "しおり", "waza", 5, [ally(M("regen", 12))], { text: "味方 1 匹に 再生 +12。ソロの ときは 自分" }),
      S(5, "xe_bookmark_s5", "とげの表紙", "waza", 4, [M("thorns", 30)], { text: "自分に 棘 +30" }),
      S(6, "xe_bookmark_s6", "ドッグイヤー", "waza", 10, [{ ...CURE, who: "ally", team: true }, ally(H(0.15), { team: true })], { text: "味方 全員に 浄化 ＋ HP 15% 回復。ソロの ときは 自分" }),
    ],
    passives: [
      P(1, "xe_bookmark_p1", "几帳面", "回復の 量 +10%", { healMul: 1.1 }),
      P(2, "xe_bookmark_p2", "気弱", "HP が 半分 以下で 回避 +15%", { pIf: [["hpBelow", 50, { evade: 0.15 }]] }),
      P(3, "xe_bookmark_p3", "控えました", "戦いの はじめに 免疫 +15", { startFx: [["immunity", 15]] }),
    ],
    plan: [G("first", undefined, "xe_bookmark_s2"), G("hpBelow", 40, "xe_bookmark_s1"), G("debuffed", undefined, "xe_bookmark_s6"), G("selfNotHas", "regen", "xe_bookmark_s4"), G("every", 4, "xe_bookmark_s5"), G("always", undefined, "xe_bookmark_s3")] },

  "RABBIT HOLE": { key: "rabbithole", type: "technician",
    skills: [
      S(1, "xe_rabbithole_s1", "近道", "waza", 4, [M("haste", 2)], { text: "自分に 加速 2 ターン" }),
      S(2, "xe_rabbithole_s2", "紙飛行機", "waza", 3, [D(8, { stat: "dex" }), F("blind", 1)], { text: "威力 8（DEX）。盲目 1 ターン" }),
      S(3, "xe_rabbithole_s3", "抜け穴", "waza", 4, [hide()], { text: "自分に 隠蔽 1 ターン" }),
      S(4, "xe_rabbithole_s4", "道案内", "waza", 5, [ally(M("up_agi", 15, { turns: 3 }), { team: true, solo: [M("up_agi", 30, { turns: 3 })] })], { text: "味方 全員に AGI 上昇 15（3 ターン）。ソロの ときは 自分に AGI 上昇 30" }),
      S(5, "xe_rabbithole_s5", "足もと", "itazura", 4, [F("paralysis", 25)], { text: "麻痺 +25" }),
      S(6, "xe_rabbithole_s6", "まだだれも行っていない道", "waza", 11, [D(6, { stat: "agi", hits: 3 }), M("mirage", 20)], { text: "威力 6 × 3（AGI）＋ 自分に 幻影 +20" }),
    ],
    passives: [
      P(1, "xe_rabbithole_p1", "快活", "戦いの はじめに 集中 2 ターン", { startFx: [["focus", undefined, 2]] }),
      P(2, "xe_rabbithole_p2", "身軽", "回避 +8%", { evade: 0.08 }),
      P(3, "xe_rabbithole_p3", "連れ帰る", "味方の HP が 20% 以下に なると、一度だけ その 味方に 隠蔽 1 ターン。ソロの ときは 自分", { allyLowOnce: [{ at: 0.2, fx: [ally(M("conceal", 1))], solo: [M("mirage", 15)] }] }),
    ],
    plan: [G("first", undefined, "xe_rabbithole_s1"), G("mpAtLeast", 11, "xe_rabbithole_s6"), G("every", 4, "xe_rabbithole_s4"), G("foeNotHas", "paralysis", "xe_rabbithole_s5"), G("hpBelow", 40, "xe_rabbithole_s3"), G("always", undefined, "xe_rabbithole_s2")] },

  // 番付の 段で 強く なる（満月 ＋6・のびしろ ＋5% が 段ごと）。第 1 章は C なので いちばん 下の 数。ライバル（プレイヤーと 戦う とき）は 敵の ときだけ
  "NEW MOON": { key: "newmoon", type: "attacker",
    skills: [
      S(1, "xe_newmoon_s1", "はじめての一撃", "waza", 3, [D(12)], { text: "威力 12" }),
      S(2, "xe_newmoon_s2", "負けず嫌い", "waza", 6, [M("up_atk", 15, { turns: 3 }), M("charge")], { text: "自分に ATK 上昇 15（3 ターン）＋ チャージ" }),
      S(3, "xe_newmoon_s3", "触手", "waza", 4, [D(6, { hits: 2 }), F("paralysis", 15)], { text: "威力 6 × 2。麻痺 +15" }),
      S(4, "xe_newmoon_s4", "描く", "waza", 4, [M("mastery", 15)], { text: "自分に 研鑽 +15" }),
      S(5, "xe_newmoon_s5", "満ちる", "waza", 5, [H(0.15), M("immunity", 10)], { text: "自分の HP を 15% 回復 ＋ 免疫 +10" }),
      S(6, "xe_newmoon_s6", "満月", "waza", 11, [D(24)], { text: "威力 24。番付の 段が 1 つ 上がる ごとに 威力 +6（C → B → A → S）" }),
    ],
    passives: [
      P(1, "xe_newmoon_p1", "白紙", "受けた デバフの ターン −1", { debuffTurnCut: 1 }),
      P(2, "xe_newmoon_p2", "のびしろ", "番付の 段が 1 つ 上がる ごとに ATK・HP +5%", {}),
      P(3, "xe_newmoon_p3", "ライバル", "プレイヤーと 戦う とき、会心 +10%", {}),
    ],
    foePassives: { xe_newmoon_p3: "xe_newmoon_p3f" },
    plan: [G("first", undefined, "xe_newmoon_s4"), G("mpAtLeast", 11, "xe_newmoon_s6"), G("hpBelow", 40, "xe_newmoon_s5"), G("every", 3, "xe_newmoon_s2"), G("selfHas", "charge", "xe_newmoon_s3"), G("always", undefined, "xe_newmoon_s1")] },
};
const FOE_ONLY = [P(3, "xe_newmoon_p3f", "ライバル", "プレイヤーと 戦う とき、会心 +10%", { crit: 0.1 })];

// 技と パッシブを 戦いの 入れ物（SKILL）に 入れる（敵の ツリー・解析ツリーと 同じ 形）
for (const u of Object.values(ELITE_UNITS)) for (const s of [...u.skills, ...u.passives]) SKILL[s.id] ??= { ...s, type: u.type, tree: "xe_" + u.key };
for (const s of FOE_ONLY) SKILL[s.id] ??= { ...s, type: "attacker", tree: "xe_newmoon" };

// 精鋭の 戦う 形：機体（ペットの 種類・Lv の 能力）は そのまま、技 6 つ・パッシブ 3 つ・作戦を 専用の 物に。foe：プレイヤーの 敵として 出る とき
export function eliteUnit(name, base, { foe = false } = {}) {
  const u = ELITE_UNITS[name]; if (!u) return base;
  const passives = u.passives.map((p) => (foe && u.foePassives?.[p.id]) || p.id);
  return { ...base, set: u.skills.map((s) => s.id), passives, gambits: u.plan, elite: name };
}
export const hasEliteUnit = (name) => !!ELITE_UNITS[name];
