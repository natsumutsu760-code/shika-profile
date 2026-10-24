// ダンジョン（VR ゲーム）の敵のスキルツリー（試作）。敵ごとに 1 本、職業ツリーと同じ 30 ノードの形（trees.js）
// 派遣で敵を捕まえて、リソースで研究すると、ペットのサブツリーとして付けられる
// どの敵もテーマの状態異常を 1 つ持ち、「付ける技」と「はじけさせる技」が入っている。技の名前は RPG 風（ゲームの中のモンスターなので）
// 技の説明は fx から自動で作る（describe）。数字はすべて仮
import { EFFECTS } from "./effects.js";

const SL = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", int: "INT", res: "RES", agi: "AGI", dex: "DEX", luk: "LUK" };
const NUM = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
// ---------- 効果の書き方（短く）----------
const D = (pow, o = {}) => ({ t: "dmg", pow, ...o });                                       // ダメージ
const F = (id, a, o = {}) => ({ t: "fx", id, who: "foe", ...(typeof a === "number" && EFFECTS[id].dur === "stack" ? { amt: a } : a != null ? { turns: a } : {}), ...o });   // 相手に
const M = (id, a, o = {}) => ({ t: "fx", id, who: "me", ...(typeof a === "number" && EFFECTS[id].dur !== "turn" && EFFECTS[id].dur !== "once" ? { amt: a } : a != null ? { turns: a } : {}), ...o });   // 自分に
const H = (pct) => ({ t: "heal", pct }), CURE = { t: "cure" }, DIS = (n) => ({ t: "dispel", n }), MPD = (n) => ({ t: "mpDrain", n }), SH = (pct) => ({ t: "shield", pct });

// fx から説明文を作る
export function describe(fx) {
  const out = [];
  for (const x of fx) {
    if (x.t === "dmg") {
      let s = x.consume ? `${EFFECTS[x.consume].label}をはじけさせる。威力 ${x.pow}` : `威力 ${x.pow}`;
      if (x.hits) s += ` × ${x.hits}`;
      if (x.stat) s += `（${SL[x.stat]}）`;
      if (x.perAmt) s += `、${EFFECTS[x.consume].label}の量 ${Math.round(1 / x.perAmt)} につき威力 +1`;
      if (x.perTurn) s += `、残りターン 1 につき威力 +${x.perTurn}`;
      if (x.burst) s += `、残りの${EFFECTS[x.consume].label}のダメージを一度に与える`;
      if (x.ignore) s += x.ignore >= 1 ? "。相手の守りを無視" : `。相手の守りを ${Math.round(x.ignore * 10)} 割無視`;
      if (x.sure) s += "。かならず当たる";
      if (x.vsFx) s += "。" + Object.entries(x.vsFx).map(([id, v]) => `${EFFECTS[id].label}の相手には ${v >= 1 ? `${v + 1} 倍` : `+${Math.round(v * 100)}%`}`).join("・");
      if (x.drain) s += `。与えたダメージの ${Math.round(x.drain * 100)}% を回復`;
      if (x.recoil) s += `。与えたダメージの ${Math.round(x.recoil * 100)}% を自分も受ける`;
      out.push(s);
    } else if (x.t === "fx") {
      const E = EFFECTS[x.id], who = x.who === "me" ? "自分に" : "";
      let s = `${who}${E.label}${x.amt != null ? ` +${x.amt}` : ""}${x.turns != null ? `（${x.turns} ターン）` : ""}`;
      if (x.id === "counter" && x.amt) s = `カウンター（受けた直接ダメージの ${x.amt}% を返す）`;
      if (x.chance) s = `${Math.round(x.chance * 100)}% で${s}`;
      if (x.atLeast) s = `${EFFECTS[x.atLeast.id].label}が ${x.atLeast.n} 以上なら${s}`;
      if (x.ifConsumed != null) s = `はじけさせたら${s}`;
      if (x.ifCrit) s = `会心のとき${s}`;
      out.push(s);
    } else if (x.t === "heal") out.push(x.pct >= 1 ? "HP を全回復" : `HP を ${Math.round(x.pct * 100)}% 回復`);
    else if (x.t === "cure") out.push("浄化（自分のデバフを全部消す）");
    else if (x.t === "dispel") out.push(x.n >= 99 ? "相手のバフを全部消す" : `相手のバフを ${NUM[x.n]} つ消す`);
    else if (x.t === "mpDrain") out.push(`相手の MP −${x.n}`);
    else if (x.t === "shield") out.push(`シールド（最大 HP の ${Math.round(x.pct * 100)}%）`);
  }
  return out.join("。");
}

// 技とパッシブ（slot は S1〜S8・P1〜P7。S4・S5 と S6・S7 は分岐の左右）
const S = (n, id, name, kind, mp, fx, o = {}) => ({ slot: `S${n}`, id, name, kind, mp, fx, text: describe(fx), ...o });
const P = (n, id, name, text, p) => ({ slot: `P${n}`, id, name, kind: "passive", text, p });
const G = (cond, v, skill) => ({ if: v === undefined ? [cond] : [cond, v], do: skill });

export const ENEMY_TREES = {
  // ===== ハルス街道 =====
  e_hare: { name: "草原の跳ね足", enemy: "ホーンラビット", dungeon: "hals", rank: "通常", type: "technician", main: "agi", sub: "dex", theme: "paralysis",
    list: [
      S(1, "e_hopkick", "ホップキック", "waza", 3, [D(8, { stat: "agi" })]),
      S(2, "e_ashibarai", "足払い", "waza", 4, [D(5, { stat: "agi" }), F("paralysis", 30)]),
      S(3, "e_stepin", "ステップイン", "waza", 3, [M("mirage", 20)]),
      S(4, "e_parakick", "パラライズキック", "waza", 5, [D(4, { stat: "agi", consume: "paralysis", perAmt: 0.25 }), F("stun", 1, { ifConsumed: 30 })]),
      S(5, "e_nidan", "二段跳び蹴り", "waza", 5, [D(6, { stat: "agi", hits: 2 })]),
      S(6, "e_shippu", "疾風脚", "waza", 6, [D(14, { stat: "agi" }), M("haste", 3)]),
      S(7, "e_shibirekona", "しびれ粉の跳躍", "itazura", 6, [F("paralysis", 40), F("down_agi", 20, { turns: 3 })]),
      S(8, "e_moonsault", "ムーンサルトキック", "waza", 10, [D(30, { stat: "agi" }), F("stun", 1, { ifCrit: true })]),
      P(1, "e_migaru", "身軽", "回避 +3%", { evade: 0.03 }),
      P(2, "e_shibirekokoro", "しびれの心得", "付ける麻痺 +10", { fxAmtAdd: { paralysis: 10 } }),
      P(3, "e_raikyaku", "雷脚", "麻痺の相手に +15%", { vsFx: { paralysis: 0.15 } }),
      P(4, "e_rentobi", "連続跳び", "前の番に当てていたら、技 +15%", { momentum: 0.15 }),
      P(5, "e_sakigake", "先駆け", "戦いのはじめにチャージ", { startFx: [["charge"]] }),
      P(6, "e_datto", "脱兎", "自分の HP が 30% 以下で回避 +15%", { lowHpEvade: 0.15 }),
      P(7, "e_shippukago", "疾風の加護", "戦いのはじめに加速（ずっと）", { startFx: [["haste"]] }),
    ],
    plan: [G("foeHas", "paralysis", "e_parakick"), G("foeNotHas", "paralysis", "e_ashibarai"), G("first", undefined, "e_stepin"), G("mpAtLeast", 10, "e_moonsault"), G("every", 3, "e_shippu"), G("always", undefined, "e_hopkick")] },

  e_thief: { name: "盗賊の手口", enemy: "ゴブリン", dungeon: "hals", rank: "通常", type: "attacker", main: "atk", sub: "agi", theme: "burn",
    list: [
      S(1, "e_knife", "ナイフスラッシュ", "waza", 3, [D(9)]),
      S(2, "e_suri", "スリ", "waza", 4, [D(4), DIS(1), M("charge")]),
      S(3, "e_kayakudama", "火薬玉", "waza", 4, [D(5), F("burn", 3)]),
      S(4, "e_dokasen", "導火線", "waza", 5, [D(6, { consume: "burn", burst: true }), F("scald", 3, { ifConsumed: 1 })]),
      S(5, "e_haigo", "背後から一突き", "waza", 5, [D(14, { ignore: 0.3 })]),
      S(6, "e_kaenbin", "火炎瓶", "waza", 6, [F("burn", 6), F("scald", 3)]),
      S(7, "e_kemuridama", "煙玉", "itazura", 6, [M("mirage", 40), F("blind", 2)]),
      S(8, "e_daitozoku", "大盗賊の一撃", "waza", 10, [D(30), DIS(99)]),
      P(1, "e_nukiashi", "抜き足", "AGI +10%", { agiMul: 1.1 }),
      P(2, "e_kayaku", "火薬の扱い", "付ける炎上 +1", { fxAmtAdd: { burn: 1 } }),
      P(3, "e_kajidoro", "火事場泥棒", "炎上か火傷の相手に +15%", { vsFx: { burn: 0.15, scald: 0.15 } }),
      P(4, "e_kyushonerai", "急所狙い", "会心 +5%", { crit: 0.05 }),
      P(5, "e_hinoko", "火の粉", "攻撃のとき 15% で炎上 +2", { onHitFx: [["burn", 0.15, 2]] }),
      P(6, "e_nigeashi", "逃げ足", "回避 +5%", { evade: 0.05 }),
      P(7, "e_tozokukan", "盗賊の勘", "戦いのはじめにチャージ", { startFx: [["charge"]] }),
    ],
    plan: [G("foeHas", "burn", "e_dokasen"), G("foeBuffed", undefined, "e_suri"), G("foeNotHas", "burn", "e_kayakudama"), G("mpAtLeast", 10, "e_daitozoku"), G("every", 3, "e_haigo"), G("always", undefined, "e_knife")] },

  e_watch: { name: "見張りの盾", enemy: "コボルト", dungeon: "hals", rank: "通常", type: "defender", main: "def", sub: "res", theme: "guard",
    list: [
      S(1, "e_tatenaguri", "盾で殴る", "waza", 3, [D(9, { stat: "def" })]),
      S(2, "e_shieldup", "シールドアップ", "waza", 3, [M("armor", 20)]),
      S(3, "e_mihari", "見張りの構え", "waza", 4, [M("guard"), M("counter", 50)]),
      S(4, "e_bash", "シールドバッシュ", "waza", 5, [D(14, { stat: "def" }), F("stun", 1, { chance: 0.2 })]),
      S(5, "e_keiteki", "警笛", "itazura", 5, [F("down_atk", 20, { turns: 3 }), F("down_int", 20, { turns: 3 })]),
      S(6, "e_teppeki", "鉄壁の守り", "waza", 6, [M("armor", 30), M("ward", 30)]),
      S(7, "e_nakama", "仲間を呼ぶ", "waza", 6, [M("regen", 12), M("immunity", 30)]),
      S(8, "e_jouheki", "城壁の盾", "waza", 10, [M("guard"), M("counter", 100), M("armor", 40)]),
      P(1, "e_katai", "硬い体", "DEF +5%", { defMul: 1.05 }),
      P(2, "e_miharime", "見張りの目", "状態異常に強い +10%", { statusRes: 10 }),
      P(3, "e_tatekokoro", "盾の心得", "気絶した相手に +20%", { vsFx: { stun: 0.2 } }),
      P(4, "e_menekikokoro", "免疫の心得", "戦いのはじめに免疫 +20", { startFx: [["immunity", 20]] }),
      P(5, "e_bougyokokoro", "防御の心得", "防御中に受けるダメージがさらに −10%", { guardBonus: 0.1 }),
      P(6, "e_fukutsu", "不屈", "戦いのはじめに輪廻", { startFx: [["reincarnation"]] }),
      P(7, "e_teppekimuso", "鉄壁無双", "受けるダメージ −8%", { dmgCut: 8 }),
    ],
    plan: [G("first", undefined, "e_shieldup"), G("hpBelow", 50, "e_teppeki"), G("hpBelow", 50, "e_nakama"), G("every", 3, "e_mihari"), G("every", 2, "e_bash"), G("always", undefined, "e_tatenaguri")] },

  e_bard: { name: "旅の歌", enemy: "迷子の吟遊詩人", dungeon: "hals", rank: "希少", type: "healer", main: "int", sub: "mp", theme: "sleep",
    list: [
      S(1, "e_lute", "リュートで叩く", "waza", 2, [D(7)]),
      S(2, "e_komoriuta", "ララバイ", "itazura", 4, [F("sleep", 2, { chance: 0.4 })]),
      S(3, "e_iyashi", "癒しの歌", "waza", 5, [H(0.2)]),
      S(4, "e_akumu", "悪夢の調べ", "itazura", 5, [D(6, { consume: "sleep", perTurn: 6 }), F("daze", 2, { ifConsumed: 1 })]),
      S(5, "e_yuuki", "勇気の歌", "waza", 5, [M("up_atk", 20, { turns: 3 }), M("up_int", 20, { turns: 3 })]),
      S(6, "e_nemuri", "眠りの旋律", "itazura", 7, [F("sleep", 2, { chance: 0.6 }), F("fatigue", 3)]),
      S(7, "e_shukufuku", "祝福の歌", "waza", 8, [M("blessing", 3)]),
      S(8, "e_owari", "旅の終わりの歌", "itazura", 12, [F("sleep", 3), H(0.3)]),
      P(1, "e_koe", "よく通る声", "付ける眠り +1 ターン", { extendIds: { sleep: 1 } }),
      P(2, "e_tabinare", "旅慣れ", "毎ターン MP +1", { mpRegen: 1 }),
      P(3, "e_yumemi", "夢見の心得", "眠りの相手への会心 +15%", { critVsFx: { sleep: 0.15 } }),
      P(4, "e_ouen", "応援上手", "自分にかける能力上昇 +1 ターン", { extendSelfUp: 1 }),
      P(5, "e_komori", "子守の名人", "眠りの相手に +20%", { vsFx: { sleep: 0.2 } }),
      P(6, "e_iyashikoe", "癒しの声", "回復する量 +15%", { healMul: 1.15 }),
      P(7, "e_ginyu", "吟遊詩人の加護", "戦いのはじめに集中", { startFx: [["focus"]] }),
    ],
    plan: [G("foeHas", "sleep", "e_akumu"), G("hpBelow", 50, "e_iyashi"), G("mpAtLeast", 12, "e_owari"), G("foeNotHas", "sleep", "e_komoriuta"), G("first", undefined, "e_yuuki"), G("always", undefined, "e_lute")] },

  e_boss_thief: { name: "かしらの号令", enemy: "ゴブリンキング", dungeon: "hals", rank: "ボス", type: "attacker", main: "atk", sub: "hp", theme: "charge",
    list: [
      S(1, "e_kyokuto", "曲刀の一閃", "waza", 3, [D(10)]),
      S(2, "e_gorei", "かしらの号令", "waza", 4, [M("up_atk", 25, { turns: 3 })]),
      S(3, "e_tame", "力をためる", "waza", 3, [M("charge")]),
      S(4, "e_nitoryu", "二刀流", "waza", 5, [D(8, { hits: 2 })]),
      S(5, "e_iatsu", "威圧", "itazura", 5, [F("down_atk", 25, { turns: 3 }), F("fatigue", 3)]),
      S(6, "e_arashi", "嵐の連撃", "waza", 8, [D(6, { hits: 4 })]),
      S(7, "e_takara", "宝の山に座る", "waza", 7, [M("regen", 15), M("armor", 20)]),
      S(8, "e_ogiri", "かしらの大斬り", "waza", 12, [D(40), F("stun", 1, { chance: 0.3 })]),
      P(1, "e_chikara", "力自慢", "ATK +5%", { atkMul: 1.05 }),
      P(2, "e_shuraba", "修羅場慣れ", "自分の HP が 30% 以下で ATK +15%", { lowHpAtk: 0.15 }),
      P(3, "e_kyusho2", "急所狙い", "会心 +5%", { crit: 0.05 }),
      P(4, "e_kowai", "怖い顔", "戦いのはじめに相手に ATK 減少 10", { startFoeFx: [["down_atk", 10]] }),
      P(5, "e_rengeki", "連撃の名手", "戦いのはじめに加速（3 ターン）", { startFx: [["haste", null, 3]] }),
      P(6, "e_ganjo", "頑丈", "HP +10%", { hpMul: 1.1 }),
      P(7, "e_kanroku", "かしらの貫禄", "ATK +10%・受けるダメージ −5%", { atkMul: 1.1, dmgCut: 5 }),
    ],
    plan: [G("first", undefined, "e_gorei"), G("mpAtLeast", 12, "e_ogiri"), G("every", 3, "e_tame"), G("every", 2, "e_arashi"), G("every", 2, "e_nitoryu"), G("always", undefined, "e_kyokuto")] },

  // ===== モーフィアス遺跡 =====
  e_sentinel: { name: "石の守護", enemy: "ストーンゴーレム", dungeon: "morph", rank: "通常", type: "defender", main: "def", sub: "res", theme: "barrier",
    list: [
      S(1, "e_ishikobushi", "石の拳", "waza", 3, [D(9, { stat: "def" })]),
      S(2, "e_sekka", "石化の構え", "waza", 3, [M("armor", 25)]),
      S(3, "e_stonewall", "ストーンウォール", "waza", 4, [M("barrier", 1)]),
      S(4, "e_iwakudaki", "岩砕き", "waza", 5, [D(14, { stat: "def" }), DIS(1)]),
      S(5, "e_mayoke", "魔除けの石", "waza", 5, [M("ward", 30), M("immunity", 30)]),
      S(6, "e_press", "ゴーレムプレス", "waza", 7, [D(18, { stat: "def" }), F("stun", 1, { chance: 0.2 })]),
      S(7, "e_ishinemuri", "石の眠り", "waza", 7, [M("regen", 20), M("armor", 20)]),
      S(8, "e_shugojo", "守護者の城壁", "waza", 10, [M("barrier", 3), M("guard")]),
      P(1, "e_ishikarada", "石の体", "受けるダメージ −3%", { dmgCut: 3 }),
      P(2, "e_omoi", "重い体", "HP +5%", { hpMul: 1.05 }),
      P(3, "e_kudaku", "砕く力", "技のダメージ +10%", { wazaDmg: 10 }),
      P(4, "e_mahajiki", "魔を弾く", "状態異常に強い +15%", { statusRes: 15 }),
      P(5, "e_fudo", "不動", "防御中に受けるダメージがさらに −10%", { guardBonus: 0.1 }),
      P(6, "e_ishiuroko", "石のうろこ", "戦いのはじめに装甲 +20", { startFx: [["armor", 20]] }),
      P(7, "e_shugosha", "石の守護者", "戦いのはじめにバリア +2", { startFx: [["barrier", 2]] }),
    ],
    plan: [G("first", undefined, "e_sekka"), G("notBuffed", undefined, "e_stonewall"), G("foeBuffed", undefined, "e_iwakudaki"), G("hpBelow", 50, "e_ishinemuri"), G("every", 3, "e_press"), G("always", undefined, "e_ishikobushi")] },

  e_ghost: { name: "亡霊のささやき", enemy: "ファントム", dungeon: "morph", rank: "通常", type: "caster", main: "int", sub: "mp", theme: "confusion",
    list: [
      S(1, "e_ghosttouch", "ゴーストタッチ", "itazura", 3, [D(8)]),
      S(2, "e_sasayaki", "ささやき", "itazura", 4, [F("confusion", 2, { chance: 0.5 })]),
      S(3, "e_jubaku", "呪縛", "itazura", 5, [F("silence", 2)]),
      S(4, "e_mindcrash", "マインドクラッシュ", "itazura", 5, [D(5, { consume: "confusion", perTurn: 6 }), F("daze", 2, { ifConsumed: 1 })]),
      S(5, "e_tamanuki", "魂抜き", "itazura", 5, [D(10), MPD(4)]),
      S(6, "e_kyoki", "狂気の囁き", "itazura", 7, [F("confusion", 3), F("fatigue", 3)]),
      S(7, "e_reiki", "霊気の壁", "itazura", 7, [M("ward", 30), M("mirage", 30)]),
      S(8, "e_meikai", "冥界の叫び", "itazura", 12, [D(30, { ignore: 1 }), F("silence", 2)]),
      P(1, "e_reitai", "霊体", "回避 +5%", { evade: 0.05 }),
      P(2, "e_kodai", "古代の知識", "INT +5%", { intMul: 1.05 }),
      P(3, "e_kyokikokoro", "狂気の心得", "混乱の相手に +20%", { vsFx: { confusion: 0.2 } }),
      P(4, "e_tamagui", "魂喰い", "与えたダメージの 5% を回復", { drain: 5 }),
      P(5, "e_madowashi", "惑わしの声", "付ける混乱 +1 ターン", { extendIds: { confusion: 1 } }),
      P(6, "e_surinuke", "すり抜け", "戦いのはじめに幻影 +20", { startFx: [["mirage", 20]] }),
      P(7, "e_onnen", "怨念", "攻撃のとき 15% で疲労（3 ターン）", { onHitFx: [["fatigue", 0.15, null, 3]] }),
    ],
    plan: [G("foeHas", "confusion", "e_mindcrash"), G("foeNotHas", "confusion", "e_sasayaki"), G("foeNotHas", "silence", "e_jubaku"), G("mpAtLeast", 12, "e_meikai"), G("always", undefined, "e_ghosttouch")] },

  e_trapper: { name: "罠師の仕掛け", enemy: "ミミック", dungeon: "morph", rank: "通常", type: "technician", main: "dex", sub: "agi", theme: "blind",
    list: [
      S(1, "e_nagenaif", "投げナイフ", "itazura", 2, [D(8, { stat: "dex" })]),
      S(2, "e_torabasami", "トラバサミ", "itazura", 4, [D(4, { stat: "dex" }), F("stun", 1, { chance: 0.4 })]),
      S(3, "e_metsubushiko", "目つぶし粉", "itazura", 3, [F("blind", 3)]),
      S(4, "e_bakudan", "仕掛け爆弾", "itazura", 5, [D(4, { stat: "dex", consume: "blind", perTurn: 6 })]),
      S(5, "e_kusari", "鎖分銅", "itazura", 5, [D(10, { stat: "dex" }), F("down_agi", 30, { turns: 3 })]),
      S(6, "e_otoshiana", "落とし穴", "itazura", 7, [D(10, { stat: "dex" }), F("stun", 1, { chance: 0.6 })]),
      S(7, "e_dokuya", "毒矢", "itazura", 6, [D(6, { stat: "dex" }), F("poison", 8)]),
      S(8, "e_oshikake", "罠師の大仕掛け", "itazura", 12, [D(24, { stat: "dex" }), F("blind", 3), F("stun", 1, { chance: 0.5 })]),
      P(1, "e_kiyo", "器用な手", "DEX +5%", { dexMul: 1.05 }),
      P(2, "e_wanakokoro", "罠の心得", "気絶の相手への会心 +15%", { critVsFx: { stun: 0.15 } }),
      P(3, "e_bakuyaku", "爆薬の知識", "盲目の相手に +15%", { vsFx: { blind: 0.15 } }),
      P(4, "e_hayate", "素早い手", "AGI +10%", { agiMul: 1.1 }),
      P(5, "e_torabasamimeijin", "トラバサミ名人", "気絶の相手に +20%", { vsFx: { stun: 0.2 } }),
      P(6, "e_dokuatsukai", "毒の扱い", "付ける毒 +3", { fxAmtAdd: { poison: 3 } }),
      P(7, "e_junbi", "準備万端", "戦いのはじめにチャージと集中", { startFx: [["charge"], ["focus"]] }),
    ],
    plan: [G("foeHas", "blind", "e_bakudan"), G("foeNotHas", "blind", "e_metsubushiko"), G("every", 3, "e_otoshiana"), G("every", 3, "e_torabasami"), G("mpAtLeast", 12, "e_oshikake"), G("always", undefined, "e_nagenaif")] },

  e_owl: { name: "夢見の羽", enemy: "ドリームオウル", dungeon: "morph", rank: "希少", type: "healer", main: "int", sub: "res", theme: "sleep",
    list: [
      S(1, "e_tsutsuku", "つつく", "waza", 2, [D(7)]),
      S(2, "e_habataki", "スリープフェザー", "itazura", 4, [F("sleep", 2, { chance: 0.4 })]),
      S(3, "e_hazukuroi", "羽づくろい", "waza", 4, [M("regen", 10)]),
      S(4, "e_yumegui", "夢喰い", "itazura", 5, [D(5, { consume: "sleep", perTurn: 6, drain: 0.3 })]),
      S(5, "e_tsukinohikari", "月の光", "waza", 5, [CURE, H(0.15)]),
      S(6, "e_fukainemuri", "深い眠り", "itazura", 7, [F("sleep", 3, { chance: 0.7 })]),
      S(7, "e_chienome", "知恵の目", "waza", 8, [M("clarity", 3)]),
      S(8, "e_yumenokuni", "夢の国", "itazura", 12, [F("sleep", 3), M("blessing", 3)]),
      P(1, "e_yorume", "夜目", "状態異常に強い +10%", { statusRes: 10 }),
      P(2, "e_shizukahane", "静かな羽", "回避 +5%", { evade: 0.05 }),
      P(3, "e_akumukokoro", "悪夢の心得", "眠りの相手に +20%", { vsFx: { sleep: 0.2 } }),
      P(4, "e_tsukikago", "月の加護", "回復する量 +15%", { healMul: 1.15 }),
      P(5, "e_nemurikona", "眠りの粉", "付ける眠り +1 ターン", { extendIds: { sleep: 1 } }),
      P(6, "e_kenja", "賢者の目", "会心 +5%", { crit: 0.05 }),
      P(7, "e_yumemikago", "夢見の加護", "戦いのはじめに再生 +10 と集中", { startFx: [["regen", 10], ["focus"]] }),
    ],
    plan: [G("foeHas", "sleep", "e_yumegui"), G("debuffed", undefined, "e_tsukinohikari"), G("mpAtLeast", 12, "e_yumenokuni"), G("foeNotHas", "sleep", "e_habataki"), G("first", undefined, "e_hazukuroi"), G("always", undefined, "e_tsutsuku")] },

  e_boss_sleep: { name: "眠りの神殿", enemy: "ヒュプノス", dungeon: "morph", rank: "ボス", type: "caster", main: "int", sub: "hp", theme: "sleep",
    list: [
      S(1, "e_nemuritsue", "眠りの杖", "itazura", 3, [D(10)]),
      S(2, "e_sleepmist", "スリープミスト", "itazura", 4, [F("sleep", 2, { chance: 0.5 })]),
      S(3, "e_shindenkago", "神殿の加護", "itazura", 5, [M("ward", 30), M("regen", 10)]),
      S(4, "e_nightmare", "ナイトメア", "itazura", 6, [D(6, { consume: "sleep", perTurn: 10 }), F("daze", 2, { ifConsumed: 1 })]),
      S(5, "e_madoromi", "まどろみの霧", "itazura", 5, [F("fatigue", 3), F("down_agi", 30, { turns: 3 })]),
      S(6, "e_eien", "永遠の眠り", "itazura", 8, [F("sleep", 3, { chance: 0.8 })]),
      S(7, "e_yumenomon", "夢の門", "itazura", 7, [D(12), F("confusion", 2)]),
      S(8, "e_sabaki", "モーフィアスの裁き", "itazura", 14, [D(40, { vsFx: { sleep: 1 } })]),
      P(1, "e_shindenmamori", "神殿の守り", "受けるダメージ −5%", { dmgCut: 5 }),
      P(2, "e_nemuritsukai", "眠りの使い手", "付ける眠り +1 ターン", { extendIds: { sleep: 1 } }),
      P(3, "e_akumunushi", "悪夢の主", "眠りの相手に +25%", { vsFx: { sleep: 0.25 } }),
      P(4, "e_madoromika", "まどろみの香", "戦いのはじめに相手を疲労", { startFoeFx: [["fatigue"]] }),
      P(5, "e_yumefukami", "夢の深み", "眠りの相手への会心 +20%", { critVsFx: { sleep: 0.2 } }),
      P(6, "e_yumebannin", "夢の番人", "戦いのはじめに障壁 +20", { startFx: [["ward", 20]] }),
      P(7, "e_nemurigami", "眠りの神", "自分の番のはじめに 15% で相手を眠り（1 ターン）", { auraFx: [["sleep", 0.15, 1]] }),
    ],
    plan: [G("foeHas", "sleep", "e_nightmare"), G("mpAtLeast", 14, "e_sabaki"), G("first", undefined, "e_shindenkago"), G("foeNotHas", "sleep", "e_sleepmist"), G("every", 3, "e_madoromi"), G("always", undefined, "e_nemuritsue")] },

  // ===== 暗い村 =====
  e_wolf: { name: "夜狼の牙", enemy: "ワーウルフ", dungeon: "kurai", rank: "通常", type: "attacker", main: "atk", sub: "agi", theme: "weakness",
    list: [
      S(1, "e_kamitsuki", "噛みつき", "waza", 3, [D(9)]),
      S(2, "e_tooboe", "遠吠え", "itazura", 4, [F("weakness", 30), F("down_atk", 15, { turns: 3 })]),
      S(3, "e_tsumetogi", "爪とぎ", "waza", 3, [M("up_atk", 20, { turns: 3 })]),
      S(4, "e_nodobue", "喉笛狙い", "waza", 5, [D(6, { consume: "weakness", perAmt: 0.2 }), F("daze", 1, { ifConsumed: 30 })]),
      S(5, "e_renzokugami", "連続噛み", "waza", 5, [D(6, { hits: 3 })]),
      S(6, "e_mureboe", "群れの遠吠え", "itazura", 6, [F("weakness", 40), F("fatigue", 3)]),
      S(7, "e_chinokawaki", "血の渇き", "waza", 6, [D(14, { drain: 0.3 })]),
      S(8, "e_tsukiyo", "月夜の狩り", "waza", 11, [D(34), F("stun", 1, { ifCrit: true })]),
      P(1, "e_ookaminoashi", "狼の脚", "AGI +5%", { agiMul: 1.05 }),
      P(2, "e_yakosei", "夜行性", "会心 +5%", { crit: 0.05 }),
      P(3, "e_karihonno", "狩りの本能", "衰弱の相手に +20%", { vsFx: { weakness: 0.2 } }),
      P(4, "e_murerenkei", "群れの連携", "前の番に当てていたら、技 +15%", { momentum: 0.15 }),
      P(5, "e_kyofu", "恐怖の声", "付ける衰弱 +10", { fxAmtAdd: { weakness: 10 } }),
      P(6, "e_chinonioi", "血の匂い", "相手の HP が半分以下なら、技 +15%", { vsLowHp: 0.15 }),
      P(7, "e_tsukiookami", "月の狼", "戦いのはじめに加速（3 ターン）", { startFx: [["haste", null, 3]] }),
    ],
    plan: [G("foeHas", "weakness", "e_nodobue"), G("foeNotHas", "weakness", "e_tooboe"), G("first", undefined, "e_tsumetogi"), G("mpAtLeast", 11, "e_tsukiyo"), G("every", 2, "e_renzokugami"), G("always", undefined, "e_kamitsuki")] },

  e_shade: { name: "影ぬい", enemy: "シャドウ", dungeon: "kurai", rank: "通常", type: "technician", main: "dex", sub: "agi", theme: "blind",
    list: [
      S(1, "e_kagenote", "影の手", "itazura", 2, [D(8, { stat: "dex" })]),
      S(2, "e_kagekakushi", "影かくし", "itazura", 3, [F("blind", 3)]),
      S(3, "e_bunshin", "影分身", "itazura", 4, [M("mirage", 30)]),
      S(4, "e_stitch", "シャドウスティッチ", "itazura", 5, [D(4, { stat: "dex", consume: "blind", perTurn: 5 }), F("silence", 1, { ifConsumed: 1 })]),
      S(5, "e_ashimoto", "足元の影", "itazura", 5, [F("down_agi", 30, { turns: 3 }), F("paralysis", 20)]),
      S(6, "e_tobari", "闇夜の帳", "itazura", 6, [F("blind", 4), F("fatigue", 3)]),
      S(7, "e_kagewatari", "影渡り", "itazura", 6, [M("mirage", 40), M("charge")]),
      S(8, "e_kagegui", "影喰い", "itazura", 11, [D(26, { stat: "dex" }), DIS(99)]),
      P(1, "e_yami", "闇に溶ける", "回避 +5%", { evade: 0.05 }),
      P(2, "e_kagenome", "影の目", "盲目の相手への会心 +10%", { critVsFx: { blind: 0.1 } }),
      P(3, "e_kagenui", "影縫いの技", "盲目の相手に +20%", { vsFx: { blind: 0.2 } }),
      P(4, "e_kagenoashi", "影の足", "AGI +10%", { agiMul: 1.1 }),
      P(5, "e_fukaiyami", "深い闇", "付ける盲目 +1 ターン", { extendIds: { blind: 1 } }),
      P(6, "e_kagemusha", "影武者", "戦いのはじめに幻影 +20", { startFx: [["mirage", 20]] }),
      P(7, "e_kagenoo", "影の王", "攻撃のとき 15% で盲目（2 ターン）", { onHitFx: [["blind", 0.15, null, 2]] }),
    ],
    plan: [G("foeHas", "blind", "e_stitch"), G("foeNotHas", "blind", "e_kagekakushi"), G("first", undefined, "e_bunshin"), G("mpAtLeast", 11, "e_kagegui"), G("every", 3, "e_ashimoto"), G("always", undefined, "e_kagenote")] },

  e_witch: { name: "井戸の底の毒", enemy: "古井戸の魔女", dungeon: "kurai", rank: "通常", type: "caster", main: "int", sub: "mp", theme: "poison",
    list: [
      S(1, "e_hishaku", "ひしゃく打ち", "itazura", 2, [D(8)]),
      S(2, "e_poisonsplash", "ポイズンスプラッシュ", "itazura", 3, [F("poison", 5)]),
      S(3, "e_ayashiikusuri", "あやしい薬", "itazura", 4, [F("rot", 3)]),
      S(4, "e_venomburst", "ヴェノムバースト", "itazura", 6, [D(4, { consume: "poison", burst: true })]),
      S(5, "e_idonosasoi", "井戸への誘い", "itazura", 5, [D(6), F("silence", 2)]),
      S(6, "e_poisonmist", "ポイズンミスト", "itazura", 7, [F("poison", 10), F("venom", 2)]),
      S(7, "e_noroiningyo", "のろいの人形", "itazura", 6, [F("down_atk", 20, { turns: 3 }), F("down_int", 20, { turns: 3 }), F("weakness", 20)]),
      S(8, "e_ogama", "魔女の大釜", "itazura", 12, [D(16), F("poison", 20), F("weakness", 20)]),
      P(1, "e_dokusen", "毒腺", "付ける毒 +2", { fxAmtAdd: { poison: 2 } }),
      P(2, "e_dokuatsukai2", "毒の扱い", "毒の相手に +20%", { vsFx: { poison: 0.2 } }),
      P(3, "e_koidoku", "濃い毒", "自分が付けた毒のダメージ 1.3 倍", { dotMul: { poison: 1.3 } }),
      P(4, "e_majosasayaki", "魔女の囁き", "付ける沈黙 +1 ターン", { extendIds: { silence: 1 } }),
      P(5, "e_dokunokiri", "毒の霧", "攻撃のとき 15% で毒 +5", { onHitFx: [["poison", 0.15, 5]] }),
      P(6, "e_majokakei", "魔女の家系", "付ける衰弱 +10", { fxAmtAdd: { weakness: 10 } }),
      P(7, "e_modokukarada", "猛毒の体", "攻撃のとき 15% で猛毒（2 ターン）", { onHitFx: [["venom", 0.15, null, 2]] }),
    ],
    plan: [G("foeDebuffs", 2, "e_venomburst"), G("foeNotHas", "poison", "e_poisonsplash"), G("foeNotHas", "rot", "e_ayashiikusuri"), G("mpAtLeast", 12, "e_ogama"), G("foeNotHas", "venom", "e_poisonmist"), G("always", undefined, "e_hishaku")] },

  e_lantern: { name: "灯りの祈り", enemy: "ウィスプ", dungeon: "kurai", rank: "希少", type: "healer", main: "int", sub: "res", theme: "blessing",
    list: [
      S(1, "e_lanterntataku", "ランタンで叩く", "waza", 2, [D(7)]),
      S(2, "e_chiisanaakari", "小さな灯り", "waza", 3, [M("regen", 10)]),
      S(3, "e_kiyomenohi", "清めの火", "waza", 4, [CURE, M("immunity", 30)]),
      S(4, "e_tomoshibi", "灯火の盾", "waza", 5, [SH(0.2)]),
      S(5, "e_mabushii", "まぶしい光", "itazura", 4, [D(6), F("blind", 2)]),
      S(6, "e_inorinohi", "祈りの灯", "waza", 8, [M("blessing", 3)]),
      S(7, "e_onibi", "鬼火", "itazura", 6, [D(8), F("burn", 4)]),
      S(8, "e_michibiki", "導きの光", "waza", 14, [CURE, H(1), M("immunity", 50)]),
      P(1, "e_akarimamori", "灯りの守り", "状態異常に強い +10%", { statusRes: 10 }),
      P(2, "e_atatakai", "温かい手", "回復する量 +10%", { healMul: 1.1 }),
      P(3, "e_hinomamori", "火の守り", "自分のシールドの量 +30%", { shieldMul: 1.3 }),
      P(4, "e_hikarinome", "光の目", "盲目の相手に +15%", { vsFx: { blind: 0.15 } }),
      P(5, "e_inorinokokoro", "祈りの心", "毎ターン HP 2% 回復", { hpRegen: 0.02 }),
      P(6, "e_moeruakari", "燃える灯", "付ける炎上 +2", { fxAmtAdd: { burn: 2 } }),
      P(7, "e_mayoibikago", "迷い灯の加護", "戦いのはじめに再生 +15 と免疫 +20", { startFx: [["regen", 15], ["immunity", 20]] }),
    ],
    plan: [G("debuffed", undefined, "e_kiyomenohi"), G("hpBelow", 30, "e_michibiki"), G("hpBelow", 60, "e_inorinohi"), G("first", undefined, "e_tomoshibi"), G("notBuffed", undefined, "e_chiisanaakari"), G("always", undefined, "e_lanterntataku")] },

  e_boss_mayor: { name: "影の村長", enemy: "村長の影", dungeon: "kurai", rank: "ボス", type: "healer", main: "int", sub: "hp", theme: "fatigue",
    list: [
      S(1, "e_kagetsue", "影の杖", "itazura", 3, [D(10)]),
      S(2, "e_okite", "村のおきて", "itazura", 4, [F("fatigue", 3)]),
      S(3, "e_kageiyashi", "影の癒し", "waza", 5, [H(0.2)]),
      S(4, "e_kagesui", "影吸い", "itazura", 6, [D(12, { drain: 0.5 })]),
      S(5, "e_yaminokeiyaku", "闇の契約", "waza", 6, [M("up_atk", 25, { turns: 3 }), M("up_int", 25, { turns: 3 }), M("regen", 10)]),
      S(6, "e_yorunokane", "夜ふけの鐘", "itazura", 8, [F("down_int", 20, { turns: 3 }), F("weakness", 30), F("fatigue", 3)]),
      S(7, "e_kagekekkai", "影の結界", "waza", 8, [M("ward", 40), M("armor", 40)]),
      S(8, "e_shinpan", "闇夜の審判", "itazura", 14, [D(38), F("fatigue", 3)]),
      P(1, "e_chorochie", "長老の知恵", "INT +5%", { intMul: 1.05 }),
      P(2, "e_kagekago", "影の加護", "毎ターン HP 2% 回復", { hpRegen: 0.02 }),
      P(3, "e_seikikyushu", "生気吸収", "与えたダメージの 10% を回復", { drain: 10 }),
      P(4, "e_igen", "村長の威厳", "戦いのはじめに相手を疲労（2 ターン）", { startFoeFx: [["fatigue", null, 2]] }),
      P(5, "e_shikitari", "村のしきたり", "付ける疲労 +1 ターン", { extendIds: { fatigue: 1 } }),
      P(6, "e_kagenokabe", "影の壁", "受けるダメージ −8%", { dmgCut: 8 }),
      P(7, "e_fushi", "不死の影", "戦いのはじめに輪廻", { startFx: [["reincarnation"]] }),
    ],
    plan: [G("hpBelow", 40, "e_kageiyashi"), G("mpAtLeast", 14, "e_shinpan"), G("foeNotHas", "fatigue", "e_okite"), G("first", undefined, "e_yaminokeiyaku"), G("every", 2, "e_kagesui"), G("always", undefined, "e_kagetsue")] },

  // ===== 水晶洞窟 =====
  e_lizard: { name: "水晶のうろこ", enemy: "クリスタルリザード", dungeon: "crystal", rank: "通常", type: "defender", main: "def", sub: "hp", theme: "thorns",
    list: [
      S(1, "e_shippouchi", "しっぽ打ち", "waza", 3, [D(9)]),
      S(2, "e_sakadateru", "うろこを逆立てる", "waza", 3, [M("thorns", 60)]),
      S(3, "e_kesshoyoroi", "結晶の鎧", "waza", 4, [M("armor", 25), M("ward", 15)]),
      S(4, "e_hansha", "反射うろこ", "waza", 5, [M("counter", 100)], { first: true }),
      S(5, "e_suishokiba", "水晶の牙", "waza", 5, [D(14), F("frostbite", 2)]),
      S(6, "e_crystalshell", "クリスタルシェル", "waza", 7, [M("armor", 40), M("ward", 40)]),
      S(7, "e_onorengeki", "尾の連撃", "waza", 6, [D(7, { hits: 3 })]),
      S(8, "e_shoheki", "晶壁", "waza", 10, [M("barrier", 2), M("thorns", 100)]),
      P(1, "e_kataiuroko", "硬いうろこ", "受けるダメージ −3%", { dmgCut: 3 }),
      P(2, "e_togetoge", "とげとげ", "戦いのはじめに棘 +40", { startFx: [["thorns", 40]] }),
      P(3, "e_tsumetaiuroko", "冷たいうろこ", "直接攻撃を受けると 20% で相手に凍傷 +1", { whenHitFx: [["frostbite", 0.2, 1]] }),
      P(4, "e_karinokiba", "狩りの牙", "技のダメージ +10%", { wazaDmg: 10 }),
      P(5, "e_ganjokara", "頑丈な殻", "HP +10%", { hpMul: 1.1 }),
      P(6, "e_rengekishippo", "連撃のしっぽ", "前の番に当てていたら、技 +15%", { momentum: 0.15 }),
      P(7, "e_suishokarada", "水晶の体", "受けるダメージ −10%・会心で ふえた 分は ひびに なり、3 ターンに 分けて 受ける", { dmgCut: 10, critSplit: 3 }),
    ],
    plan: [G("first", undefined, "e_sakadateru"), G("notBuffed", undefined, "e_kesshoyoroi"), G("every", 3, "e_hansha"), G("hpBelow", 50, "e_crystalshell"), G("every", 2, "e_suishokiba"), G("always", undefined, "e_shippouchi")] },

  e_bat: { name: "超音波", enemy: "ケイブバット", dungeon: "crystal", rank: "通常", type: "technician", main: "dex", sub: "agi", theme: "confusion",
    list: [
      S(1, "e_batkami", "噛みつき", "waza", 2, [D(8)]),
      S(2, "e_choonpa", "超音波", "itazura", 4, [F("confusion", 2, { chance: 0.5 })]),
      S(3, "e_kyuketsu", "吸血", "waza", 4, [D(8, { drain: 0.4 })]),
      S(4, "e_onpaho", "音波砲", "itazura", 5, [D(5, { stat: "dex", consume: "confusion", perTurn: 6 }), F("daze", 2, { ifConsumed: 1 })]),
      S(5, "e_haoto", "暗闇の羽音", "itazura", 4, [F("blind", 3)]),
      S(6, "e_kyoranhabataki", "狂乱の羽ばたき", "itazura", 7, [F("confusion", 3), F("fatigue", 3)]),
      S(7, "e_kyuketsuutage", "吸血の宴", "waza", 7, [D(6, { hits: 3, drain: 0.3 })]),
      S(8, "e_taigun", "コウモリの大群", "waza", 12, [D(5, { hits: 6 })]),
      P(1, "e_batbata", "羽ばたき", "回避 +5%", { evade: 0.05 }),
      P(2, "e_echo", "エコーロケーション", "盲目に強い（50% で防ぐ）", { resistFx: { blind: 50 } }),
      P(3, "e_otonotatsujin", "音の達人", "混乱の相手に +20%", { vsFx: { confusion: 0.2 } }),
      P(4, "e_yaminohane", "闇の羽", "盲目の相手に +15%", { vsFx: { blind: 0.15 } }),
      P(5, "e_choonpakokoro", "超音波の心得", "付ける混乱 +1 ターン", { extendIds: { confusion: 1 } }),
      P(6, "e_chinomeguri", "血の巡り", "与えたダメージの 5% を回復", { drain: 5 }),
      P(7, "e_yorushihai", "夜の支配者", "戦いのはじめに加速（3 ターン）", { startFx: [["haste", null, 3]] }),
    ],
    plan: [G("foeHas", "confusion", "e_onpaho"), G("foeNotHas", "confusion", "e_choonpa"), G("hpBelow", 60, "e_kyuketsu"), G("mpAtLeast", 12, "e_taigun"), G("foeNotHas", "blind", "e_haoto"), G("always", undefined, "e_batkami")] },

  e_crystal: { name: "水晶の冷気", enemy: "ジェムスライム", dungeon: "crystal", rank: "通常", type: "caster", main: "int", sub: "mp", theme: "frostbite",
    list: [
      S(1, "e_iceshot", "アイスショット", "itazura", 3, [D(8)]),
      S(2, "e_frosttouch", "フロストタッチ", "itazura", 3, [F("frostbite", 3)]),
      S(3, "e_korinokagami", "氷の鏡", "itazura", 4, [M("ward", 30)]),
      S(4, "e_crystalbreak", "クリスタルブレイク", "itazura", 6, [D(5, { consume: "frostbite", burst: true })]),
      S(5, "e_freeze", "フリーズ", "itazura", 5, [F("frostbite", 2), F("freeze", 1, { atLeast: { id: "frostbite", n: 4 } })]),
      S(6, "e_blizzard", "ブリザード", "itazura", 8, [D(10), F("frostbite", 6)]),
      S(7, "e_korinoro", "氷の牢獄", "itazura", 7, [F("freeze", 1, { chance: 0.5 }), F("down_agi", 30, { turns: 3 })]),
      S(8, "e_zettaireido", "絶対零度", "itazura", 14, [D(30), F("frostbite", 8), F("freeze", 1, { atLeast: { id: "frostbite", n: 6 } })]),
      P(1, "e_tsumetaikarada", "冷たい体", "受けるダメージ −3%", { dmgCut: 3 }),
      P(2, "e_reiki2", "冷気", "付ける凍傷 +1", { fxAmtAdd: { frostbite: 1 } }),
      P(3, "e_kudakureiki", "砕く冷気", "凍傷の相手に +20%", { vsFx: { frostbite: 0.2 } }),
      P(4, "e_kogoeru", "凍える指", "凍結した相手に +25%", { vsFx: { freeze: 0.25 } }),
      P(5, "e_fubuki", "吹雪の心得", "自分が付けた凍傷のダメージ 1.3 倍", { dotMul: { frostbite: 1.3 } }),
      P(6, "e_korimamori", "氷の守り", "戦いのはじめに障壁 +20", { startFx: [["ward", 20]] }),
      P(7, "e_suishokokoro", "水晶の心", "攻撃のとき 15% で凍傷 +3", { onHitFx: [["frostbite", 0.15, 3]] }),
    ],
    plan: [G("foeDebuffs", 2, "e_crystalbreak"), G("foeNotHas", "frostbite", "e_frosttouch"), G("every", 2, "e_freeze"), G("mpAtLeast", 14, "e_zettaireido"), G("first", undefined, "e_korinokagami"), G("always", undefined, "e_iceshot")] },

  e_turtle: { name: "七色の甲羅", enemy: "レインボータートル", dungeon: "crystal", rank: "希少", type: "defender", main: "def", sub: "res", theme: "shield",
    list: [
      S(1, "e_koraattack", "甲羅アタック", "waza", 3, [D(9, { stat: "def" })]),
      S(2, "e_komoru", "甲羅にこもる", "waza", 4, [SH(0.2)]),
      S(3, "e_nanairo", "七色の光", "waza", 4, [M("ward", 30)]),
      S(4, "e_prism", "プリズムガード", "waza", 5, [M("barrier", 2)]),
      S(5, "e_nijihansha", "虹の反射", "waza", 5, [M("guard"), M("counter", 80)]),
      S(6, "e_yosai", "甲羅の要塞", "waza", 8, [SH(0.3), M("armor", 30)]),
      S(7, "e_senko", "七色の閃光", "itazura", 6, [D(12), F("blind", 3)]),
      S(8, "e_mannen", "万年の甲羅", "waza", 14, [SH(0.4), M("barrier", 3), M("regen", 15)]),
      P(1, "e_jobukora", "丈夫な甲羅", "HP +5%", { hpMul: 1.05 }),
      P(2, "e_yukkuri", "ゆっくり屋", "受けるダメージ −5%", { dmgCut: 5 }),
      P(3, "e_hikarikabe", "光の壁", "自分に付けるバリア +1", { barrierPlus: 1 }),
      P(4, "e_hanshakora", "反射の甲羅", "戦いのはじめに棘 +40", { startFx: [["thorns", 40]] }),
      P(5, "e_koramamori", "甲羅の守り", "自分のシールドの量 +30%", { shieldMul: 1.3 }),
      P(6, "e_mabushikora", "まぶしい甲羅", "盲目の相手に +15%", { vsFx: { blind: 0.15 } }),
      P(7, "e_choju", "長寿", "毎ターン HP 3% 回復・受けるダメージ −5%", { hpRegen: 0.03, dmgCut: 5 }),
    ],
    plan: [G("first", undefined, "e_komoru"), G("notBuffed", undefined, "e_prism"), G("hpBelow", 50, "e_yosai"), G("every", 3, "e_nijihansha"), G("foeNotHas", "blind", "e_senko"), G("always", undefined, "e_koraattack")] },

  e_boss_crystal: { name: "守り手の結晶", enemy: "クリスタルドラゴン", dungeon: "crystal", rank: "ボス", type: "defender", main: "def", sub: "hp", theme: "counter",
    list: [
      S(1, "e_kesshokobushi", "結晶の拳", "waza", 3, [D(11, { stat: "def" })]),
      S(2, "e_kesshoka", "結晶化", "waza", 4, [M("armor", 20), M("ward", 20)]),
      S(3, "e_mamoritekamae", "守り手の構え", "waza", 4, [M("guard"), M("counter", 80)]),
      S(4, "e_lance", "クリスタルランス", "waza", 6, [D(18, { stat: "def" }), F("frostbite", 3)]),
      S(5, "e_shoko", "晶光", "itazura", 6, [F("blind", 2), F("daze", 2)]),
      S(6, "e_kesshoarashi", "結晶の嵐", "waza", 9, [D(6, { stat: "def", hits: 4 })]),
      S(7, "e_suishosaisei", "水晶の再生", "waza", 7, [M("regen", 20), CURE]),
      S(8, "e_daikessho", "守護の大結晶", "waza", 14, [M("barrier", 2), M("armor", 30), M("counter", 80)]),
      P(1, "e_kesshokarada", "結晶の体", "受けるダメージ −5%", { dmgCut: 5 }),
      P(2, "e_hokori", "守り手の誇り", "戦いのはじめに装甲 +20", { startFx: [["armor", 20]] }),
      P(3, "e_suishoyaiba", "水晶の刃", "技のダメージ +10%", { wazaDmg: 10 }),
      P(4, "e_hikaruhitomi", "光る瞳", "朦朧の相手に +20%", { vsFx: { daze: 0.2 } }),
      P(5, "e_arashikessho", "嵐の結晶", "戦いのはじめに加速（ずっと）", { startFx: [["haste"]] }),
      P(6, "e_saiseikessho", "再生する結晶", "毎ターン HP 3% 回復", { hpRegen: 0.03 }),
      P(7, "e_suishoou", "水晶の王", "受けるダメージ −6%・会心で ふえた 分は ひびに なり、3 ターンに 分けて 受ける", { dmgCut: 6, critSplit: 3 }),
    ],
    plan: [G("first", undefined, "e_kesshoka"), G("hpBelow", 40, "e_suishosaisei"), G("mpAtLeast", 14, "e_daikessho"), G("every", 3, "e_mamoritekamae"), G("every", 2, "e_kesshoarashi"), G("always", undefined, "e_kesshokobushi")] },
};
