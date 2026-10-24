// ペットの技とタイプのデータ（試作 3）。設計メモの表・バトルの計算・画面の見本は、みんなここから読む
// kind：waza（技・ATK で強さが決まり、相手の DEF で受ける）、itazura（イタズラ・INT で強さが決まり、相手の RES で受ける）、passive（パッシブ・いつも効く）
// slot：職業ツリーでの場所（S1〜S8 は技 ①〜⑧、P1〜P7 はパッシブ ①〜⑦）。どのノードに入るかは trees.js
// fx（技の効果）と p（パッシブの効果）は battle-sim.js が読む。バフ・デバフ（状態）の中身は effects.js。数字はすべて仮
//   dmg：ダメージ（pow 威力・hits 回数・stat 強さを決めるステータス・ignore 相手の守りを無視する割合・sure かならず当たる・recoil 反動・execute 相手の HP がこれ以下なら 2 倍
//        perDebuff 相手のデバフ 1 つにつき威力が増える・clear 当たったら相手のデバフを全部消す・consume その状態をはじけさせる（perAmt 量 1 につき・perTurn 残りターン 1 につき威力が増える））
//   fx：状態を付ける（id・amt 量・turns ターン・who me か foe・chance 確率・atLeast {id, n} 相手のその状態の量が n 以上のときだけ・ifConsumed はじけさせた量が n 以上のときだけ）
//   shield：最大 HP の pct のシールド
//   heal（最大 HP の pct を回復）・cure（自分のデバフを全部消す＝浄化）・dispel（相手のバフを n こ消す）・mp（MP を n 回復）・slow（次の番は後から動く）・pin（おさえこみ）
import { ENEMY_TREES } from "./enemy-trees.js";

export const TYPES = {
  attacker: { label: "アタッカー", role: "技で大きなダメージ", color: "#FF5A64", grow: ["atk", "dex"] },
  caster: { label: "キャスター", role: "イタズラで攻める", color: "#8E6CFF", grow: ["int", "mp"] },
  technician: { label: "テクニシャン", role: "状態異常を重ねて、はじけさせる", color: "#FFC21A", grow: ["agi", "dex", "luk"] },
  healer: { label: "ヒーラー", role: "回復と強化", color: "#22CC88", grow: ["int", "res", "mp"] },
  defender: { label: "ディフェンダー", role: "守る・耐える・反撃", color: "#2EA8FF", grow: ["hp", "def", "res"] },
};

// どのタイプでもいつでも使える
export const COMMON = {
  kogeki: { name: "こうげき", kind: "waza", mp: 0, text: "威力 8。強さは ATK・INT・DEX のいちばん高いもので決まる", fx: [{ t: "dmg", pow: 8, stat: "best" }] },
  bougyo: { name: "ぼうぎょ", kind: "waza", mp: 0, text: "防御（次の番まで、受ける直接ダメージ半分）、MP +2", fx: [{ t: "fx", id: "guard", who: "me" }, { t: "mp", n: 2 }] },
};

export const TREES = {
  attacker: [
    { slot: "S2", id: "yamakan", name: "ヤマカンパンチ", kind: "waza", mp: 3, text: "当てずっぽうで打つ。威力 13。強さは ATK ではなく LUK（運）で決まる。会心 +20%", fx: [{ t: "dmg", pow: 13, stat: "luk", critUp: 0.2 }] },
    { slot: "S3", id: "udemakuri", name: "腕まくり", kind: "waza", mp: 3, text: "チャージ（次の直接攻撃が 2 倍）と集中（3 ターン。動いたあとに最大 MP の 20% を回復）", fx: [{ t: "fx", id: "charge", who: "me" }, { t: "fx", id: "focus", turns: 3, who: "me" }] },
    { slot: "S1", id: "chop", name: "水平チョップ", kind: "waza", mp: 4, text: "威力 22。次の番は後から動く", fx: [{ t: "dmg", pow: 22 }, { t: "slow" }] },
    { slot: "S4", id: "tossin", name: "飛んで頭から突っ込む", kind: "waza", mp: 5, text: "威力 25。与えたダメージの 1/4 を自分も受ける", fx: [{ t: "dmg", pow: 25, recoil: 0.25 }] },
    { slot: "S5", id: "elbow", name: "エルボー", kind: "waza", mp: 4, text: "威力 15。相手の HP が 35% 以下なら 2 倍", fx: [{ t: "dmg", pow: 15, execute: 0.35 }] },
    { slot: "S6", id: "brazil", name: "ブラジリアンキック", kind: "waza", mp: 6, text: "威力 15。上から落ちてくるので、相手の DEF を半分無視。60% で頭に当たって朦朧（2 ターン）", fx: [{ t: "dmg", pow: 15, ignore: 0.5 }, { t: "fx", id: "daze", turns: 2, who: "foe", chance: 0.6 }] },
    { slot: "S7", id: "swing", name: "ジャイアントスイング", kind: "waza", mp: 6, text: "ぶんぶん振り回す。威力 17。60% で相手は目が回って混乱（2 ターン）", fx: [{ t: "dmg", pow: 17 }, { t: "fx", id: "confusion", turns: 2, who: "foe", chance: 0.6 }] },
    { slot: "S8", id: "chabudai", name: "ちゃぶ台返し", kind: "waza", mp: 10, text: "威力 40。かならず当たる", fx: [{ t: "dmg", pow: 40, sure: true }] },
    { slot: "P1", id: "yaruki", name: "やる気まんまん", kind: "passive", text: "ATK +20%。勢いで元気が出て、与えたダメージの 9% を回復", p: { atkMul: 1.2, drain: 9 } },
    { slot: "P2", id: "kyusho", name: "急所が見える", kind: "passive", text: "会心 +5%", p: { crit: 0.05 } },
    { slot: "P3", id: "ukemi", name: "受け身がうまい", kind: "passive", text: "反動のダメージが半分", p: { recoilMul: 0.5 } },
    { slot: "P4", id: "oiuchi", name: "追いうち", kind: "passive", text: "相手の HP が半分以下なら、技 +15%", p: { vsLowHp: 0.15 } },
    { slot: "P5", id: "kokozo", name: "ここぞの一発", kind: "passive", text: "会心のダメージ +30%", p: { critDmg: 30 } },
    { slot: "P6", id: "nori", name: "ノリノリ", kind: "passive", text: "前の番に当てていたら、技 +10%", p: { momentum: 0.1 } },
    { slot: "P7", id: "kajiba", name: "火事場のバカ力", kind: "passive", text: "自分の HP が 30% 以下で ATK +30%", p: { lowHpAtk: 0.3 } },
  ],
  caster: [
    { slot: "S1", id: "bakuchiku", name: "爆竹", kind: "itazura", mp: 4, text: "威力 6 × 3（1 回ごとに当たるか決める）", fx: [{ t: "dmg", pow: 6, hits: 3 }] },
    { slot: "S3", id: "note", name: "作戦ノートを見る", kind: "itazura", mp: 4, text: "チャージ（次の直接攻撃が 2 倍）と集中（1 ターン。動いたあとに最大 MP の 20% を回復）", fx: [{ t: "fx", id: "charge", who: "me" }, { t: "fx", id: "focus", turns: 1, who: "me" }] },
    { slot: "S2", id: "kamifubuki", name: "ありったけ紙ふぶき", kind: "itazura", mp: 3, text: "ためた紙をぜんぶまく。威力 14。強さは INT ではなく、いまの MP で決まる（MP が多いほど強い）", fx: [{ t: "dmg", pow: 14, stat: "mpNow", statMul: 1 }] },
    { slot: "S4", id: "lighter", name: "ライタースプレー", kind: "itazura", mp: 7, text: "威力 20。相手を火傷（3 ターン。受ける直接ダメージ × 1.1）", fx: [{ t: "dmg", pow: 20 }, { t: "fx", id: "scald", turns: 3, who: "foe" }] },
    { slot: "S5", id: "kutsushita", name: "くさい靴下を投げる", kind: "itazura", mp: 5, text: "においで体調不良 +5（INT で決まる継続ダメージ。30% で疲労）", fx: [{ t: "fx", id: "sickness", amt: 5, who: "foe" }] },
    { slot: "S6", id: "mushimegane", name: "虫めがねで日光", kind: "itazura", mp: 7, text: "威力 12。相手の RES を半分無視", fx: [{ t: "dmg", pow: 12, ignore: 0.5 }] },
    { slot: "S7", id: "tamago", name: "腐ったたまごを投げる", kind: "itazura", mp: 7, text: "毒 +7、腐敗（3 ターン。回復がダメージに変わる）", fx: [{ t: "fx", id: "poison", amt: 7, who: "foe" }, { t: "fx", id: "rot", turns: 3, who: "foe" }] },
    { slot: "S8", id: "hanabi", name: "打ち上げ花火", kind: "itazura", mp: 14, text: "威力 44", fx: [{ t: "dmg", pow: 44 }] },
    { slot: "P1", id: "monoshiri", name: "物知り", kind: "passive", text: "INT +3%", p: { intMul: 1.03 } },
    { slot: "P2", id: "hirameki", name: "ひらめき", kind: "passive", text: "イタズラの会心 +12%", p: { magicCrit: 0.12 } },
    { slot: "P3", id: "hiasobi", name: "火遊び名人", kind: "passive", text: "相手が火傷か炎上なら、イタズラ +30%", p: { vsFx: { scald: 0.3, burn: 0.3 } } },
    { slot: "P4", id: "nioi", name: "においが残る", kind: "passive", text: "自分が付けた体調不良と毒の持続 +1 ターン", p: { extendIds: { sickness: 1, poison: 1 } } },
    { slot: "P5", id: "fullpower", name: "フルパワー", kind: "passive", text: "MP が半分以上あるとき、イタズラ +10%", p: { highMpMagic: 0.1 } },
    { slot: "P6", id: "oyatsu", name: "おやつ休憩", kind: "passive", text: "毎ターン MP +1", p: { mpRegen: 1 } },
    { slot: "P7", id: "kaigi", name: "ひとり作戦会議", kind: "passive", text: "戦いのはじめに集中（3〜5 ターン。行動のあとに MP 20% 回復）", p: { startFx: [["focus"]] } },
  ],
  technician: [
    { slot: "S1", id: "chokomaka", name: "ちょこまかタッチ", kind: "itazura", mp: 2, text: "すばやく 2 回つつく（威力 8 × 2）。強さは AGI（すばやさ）で決まる。かならず先に動く", fx: [{ t: "dmg", pow: 8, hits: 2, stat: "agi" }], first: true },
    { slot: "S2", id: "kancho", name: "カンチョー", kind: "itazura", mp: 4, text: "威力 9（DEX）。相手の RES を 3 割無視。麻痺 +30（量 1 につき 0.5% で動けない）", fx: [{ t: "dmg", pow: 9, stat: "dex", ignore: 0.3 }, { t: "fx", id: "paralysis", amt: 30, who: "foe" }] },
    { slot: "S3", id: "hanakuso", name: "鼻くそを投げる", kind: "itazura", mp: 2, text: "威力 4（DEX）。相手を盲目にする（3 ターン。技の命中が半分）。鼻をほじって落ちついて、自分は集中（2 ターン）", fx: [{ t: "dmg", pow: 4, stat: "dex" }, { t: "fx", id: "blind", turns: 3, who: "foe" }, { t: "fx", id: "focus", turns: 2, who: "me" }] },
    { slot: "S4", id: "banana", name: "バナナの皮トラップ", kind: "itazura", mp: 3, text: "麻痺をはじけさせる。威力 4（DEX）、相手の麻痺の量 5 につき威力 +1。当たったら麻痺を消して、量が 30 以上なら 65% で転んで気絶（1 ターン）", fx: [{ t: "dmg", pow: 4, stat: "dex", consume: "paralysis", perAmt: 0.2 }, { t: "fx", id: "stun", turns: 1, who: "foe", ifConsumed: 30, chance: 0.65 }] },
    { slot: "S5", id: "patchin", name: "目の前でパチン", kind: "itazura", mp: 4, text: "盲目をはじけさせる。威力 4（DEX）、相手の盲目の残りターン 1 につき威力 +6。当たったら盲目を消して、70% で朦朧（2 ターン）", fx: [{ t: "dmg", pow: 4, stat: "dex", consume: "blind", perTurn: 6 }, { t: "fx", id: "daze", turns: 2, who: "foe", ifConsumed: 1, chance: 0.7 }] },
    { slot: "S6", id: "kinoko", name: "あやしいキノコを食べさせる", kind: "itazura", mp: 4, text: "毒 +8（手番のはじめに 最大 HP × 量% のダメージ）。お腹をこわして腐敗（2 ターン。回復がダメージに変わる）", fx: [{ t: "fx", id: "poison", amt: 8, who: "foe" }, { t: "fx", id: "rot", turns: 2, who: "foe" }] },
    { slot: "S7", id: "kori", name: "背中に氷を入れる", kind: "itazura", mp: 4, text: "威力 6（DEX）。凍傷 +2。凍傷が 4 以上なら 60% で凍結（1 ターン）", fx: [{ t: "dmg", pow: 6, stat: "dex" }, { t: "fx", id: "frostbite", amt: 2, who: "foe" }, { t: "fx", id: "freeze", turns: 1, who: "foe", chance: 0.6, atLeast: { id: "frostbite", n: 4 } }] },
    { slot: "S8", id: "decopin", name: "とどめのデコピン", kind: "itazura", mp: 6, text: "威力 6（DEX）。相手のデバフ 1 つにつき威力 +4。当たったら相手のデバフを全部はじけさせて消す", fx: [{ t: "dmg", pow: 6, stat: "dex", perDebuff: 4, clear: true }] },
    { slot: "P1", id: "sekkachi", name: "せっかち", kind: "passive", text: "AGI +10%", p: { agiMul: 1.1 } },
    { slot: "P2", id: "ijiwaru", name: "いじわる", kind: "passive", text: "相手のデバフ 1 つにつき、与えるダメージ +6%（最大 +30%）", p: { perDebuff: 0.06 } },
    { slot: "P3", id: "shibire", name: "しびれ上手", kind: "passive", text: "付ける麻痺の量 +50%。しびれている相手は力が入らないので、カウンターと棘で返すダメージが半分", p: { fxAmtMul: { paralysis: 1.5 }, paraCounterCut: 0.5 } },
    { slot: "P4", id: "metsubushi", name: "目つぶし上手", kind: "passive", text: "付ける盲目 +1 ターン。盲目の相手への会心 +10%", p: { extendIds: { blind: 1 }, critVsFx: { blind: 0.1 } } },
    { slot: "P5", id: "mawaru", name: "毒が回る", kind: "passive", text: "自分が付けた毒のダメージ 1.2 倍", p: { dotMul: { poison: 1.2 } } },
    { slot: "P6", id: "shitsukoi", name: "しつこい", kind: "passive", text: "自分が付けたデバフの持続 +1 ターン", p: { extendDebuff: 1 } },
    { slot: "P7", id: "tensai", name: "いたずらの天才", kind: "passive", text: "自分が付けるデバフは、相手の耐性と免疫を半分だけ無視する", p: { pierceRes: 0.5 } },
  ],
  healer: [
    { slot: "S1", id: "okashi", name: "お菓子を食べる", kind: "waza", mp: 8, text: "HP を 35% 回復。あふれた分はオーバーヒール（5 ターン）", fx: [{ t: "fx", id: "overheal", amt: 0, who: "me" }, { t: "heal", pct: 0.35 }] },
    { slot: "S3", id: "sekkyo", name: "くどくどお説教", kind: "itazura", mp: 4, text: "くどくど言いきかせる。威力 15。強さは INT ではなく RES（がまん強さ）で決まる", fx: [{ t: "dmg", pow: 15, stat: "res" }] },
    { slot: "S2", id: "mizu", name: "水をかける", kind: "itazura", mp: 2, text: "威力 12。相手のバフを 1 つ消す（回復と MP のバフから先に）。びしょぬれで疲労（1 ターン。集中が消え、手番のはじめに MP が 10% 減る）", fx: [{ t: "dmg", pow: 12 }, { t: "dispel", n: 1 }, { t: "fx", id: "fatigue", turns: 1, who: "foe" }] },
    { slot: "S4", id: "genetsu", name: "解熱剤を飲む", kind: "waza", mp: 6, text: "浄化（自分のデバフを全部消す）、HP を 20% 回復、免疫 +22", fx: [{ t: "cure" }, { t: "heal", pct: 0.2 }, { t: "fx", id: "immunity", amt: 22, who: "me" }] },
    { slot: "S5", id: "drink", name: "栄養ドリンクを飲む", kind: "waza", mp: 13, text: "元気が出て、ATK 上昇 20・INT 上昇 30（3 ターン）と浄化（自分のデバフを全部消す）、集中（1 ターン）", fx: [{ t: "fx", id: "up_atk", amt: 20, turns: 3, who: "me" }, { t: "fx", id: "up_int", amt: 30, turns: 3, who: "me" }, { t: "cure" }, { t: "fx", id: "focus", turns: 1, who: "me" }] },
    { slot: "S6", id: "negi", name: "首にネギを巻く", kind: "waza", mp: 9, text: "浄化（自分のデバフを全部消す）、再生 +13（手番のはじめに 最大 HP × 量% を回復して、量が半分）", fx: [{ t: "cure" }, { t: "fx", id: "regen", amt: 13, who: "me" }] },
    { slot: "S7", id: "bansoko", name: "ばんそうこうを貼る", kind: "waza", mp: 6, text: "シールド（最大 HP の 28% のダメージを吸収）", fx: [{ t: "shield", pct: 0.28 }] },
    { slot: "S8", id: "hirune", name: "ぐっすり昼寝", kind: "waza", mp: 16, text: "浄化、HP を全回復。そのあと自分は眠り（1 ターン。たたかれると 50% で起きる）", fx: [{ t: "cure" }, { t: "heal", pct: 1 }, { t: "fx", id: "sleep", turns: 1, who: "me" }] },
    { slot: "P1", id: "kuishinbo", name: "食いしんぼう", kind: "passive", text: "回復する量 +5%。おいしそうに食べるので、自分の技で回復すると、相手はくやしがって回復した量の 18% のダメージ", p: { healMul: 1.05, healHit: 0.18 } },
    { slot: "P2", id: "hayane", name: "早寝早起き", kind: "passive", text: "毎ターン HP 0.6% 回復", p: { hpRegen: 0.006 } },
    { slot: "P3", id: "ugai", name: "うがい手洗い", kind: "passive", text: "戦いのはじめに免疫 +15", p: { startFx: [["immunity", 15]] } },
    { slot: "P4", id: "radio", name: "ラジオ体操", kind: "passive", text: "自分にかける能力上昇 +2 ターン", p: { extendSelfUp: 2 } },
    { slot: "P5", id: "atsugi", name: "厚着", kind: "passive", text: "RES +10%。着こんでいるので、受けるイタズラのダメージ −15%（RES を無視されても効く）", p: { resMul: 1.1, itazuraCut: 0.15 } },
    { slot: "P6", id: "bansokoP", name: "ばんそうこう上手", kind: "passive", text: "自分のシールドの量 +55%", p: { shieldMul: 1.55 } },
    { slot: "P7", id: "akiramenai", name: "あきらめない", kind: "passive", text: "1 試合 1 回、HP が 0 になるとき 30% の HP で立ち上がる", p: { revive: 0.3 } },
  ],
  defender: [
    { slot: "S2", id: "peekaboo", name: "ピーカブースタンス", kind: "waza", mp: 2, text: "顔を守る。防御（次の番まで、受ける直接ダメージ半分）と 装甲 +13・障壁 +13（受けるたびに半分）。息を整えて集中（2 ターン）", fx: [{ t: "fx", id: "guard", who: "me" }, { t: "fx", id: "armor", amt: 13, who: "me" }, { t: "fx", id: "ward", amt: 13, who: "me" }, { t: "fx", id: "focus", turns: 2, who: "me" }] },
    { slot: "S1", id: "manju", name: "おしくらまんじゅう", kind: "waza", mp: 3, text: "威力 16。強さは ATK ではなく DEF で決まる。押すたびに力がこもって、貫通 +5（次の直接攻撃に 5 をそのまま足す）", fx: [{ t: "dmg", pow: 16, stat: "def" }, { t: "fx", id: "pierce", amt: 5, who: "me" }] },
    { slot: "S3", id: "clinch", name: "クリンチ", kind: "waza", mp: 4, text: "だきついて、相手の ATK 減少 45・INT 減少 30（2 ターン）。しめつけて疲労（2 ターン。集中が消え、手番のはじめに MP が 10% 減る）", fx: [{ t: "fx", id: "down_atk", amt: 45, turns: 2, who: "foe" }, { t: "fx", id: "down_int", amt: 30, turns: 2, who: "foe" }, { t: "fx", id: "fatigue", turns: 2, who: "foe" }] },
    { slot: "S4", id: "tomoe", name: "巴投げ", kind: "waza", mp: 4, text: "先に構えて、カウンター（次の番まで、受けた直接ダメージの 90% を投げ返す）。かならず先に動く", fx: [{ t: "fx", id: "counter", amt: 90, who: "me" }], first: true },
    { slot: "S5", id: "ground", name: "グラウンドポジション", kind: "waza", mp: 4, text: "おさえこむ。60% で 2 ターンの間 おたがい動けず、相手は毎ターン HP 7.5% 減る（40% でふりほどかれる）", fx: [{ t: "pin", turns: 2, pct: 0.075, chance: 0.6 }] },
    { slot: "S6", id: "noshikakari", name: "のしかかり", kind: "waza", mp: 5, text: "上からのしかかる。威力 10。強さは ATK ではなく、自分の最大 HP で決まる（重いほど痛い。HP 4 で ATK 1 分）", fx: [{ t: "dmg", pow: 10, stat: "hp", statMul: 0.25 }] },
    { slot: "S7", id: "danboru", name: "ダンボールをかぶる", kind: "waza", mp: 10, text: "バリア +1（直接攻撃を 1 回むこうにする）", fx: [{ t: "fx", id: "barrier", amt: 1, who: "me" }] },
    { slot: "S8", id: "kotatsu", name: "こたつに入る", kind: "waza", mp: 10, text: "装甲 +50・障壁 +50・再生 +20", fx: [{ t: "fx", id: "armor", amt: 50, who: "me" }, { t: "fx", id: "ward", amt: 50, who: "me" }, { t: "fx", id: "regen", amt: 20, who: "me" }] },
    { slot: "P1", id: "ishiatama", name: "石頭", kind: "passive", text: "戦いのはじめに免疫 +60（デバフを 60% で防ぐ。2〜3 ターン）", p: { startFx: [["immunity", 60]] } },
    { slot: "P2", id: "funbari", name: "ふんばり", kind: "passive", text: "戦いのはじめに輪廻（1 回、HP 1 で踏みとどまる）", p: { startFx: [["reincarnation"]] } },
    { slot: "P3", id: "togefuku", name: "トゲトゲの服", kind: "passive", text: "戦いのはじめに棘 +80（直接攻撃を受けると ATK × 量% を返し、量が半分）。カウンターで投げ返すダメージに DEF の 17% を足す", p: { startFx: [["thorns",  80]], counterDef: 0.17 } },
    { slot: "P4", id: "newaza", name: "寝技の達人", kind: "passive", text: "おさえこみのダメージ 1.1 倍", p: { pinMul: 1.1 } },
    { slot: "P5", id: "minokonashi", name: "身のこなし", kind: "passive", text: "回避 +12%", p: { evade: 0.12 } },
    { slot: "P6", id: "danboruP", name: "段ボール職人", kind: "passive", text: "自分に付けるバリア +1", p: { barrierPlus: 1 } },
    { slot: "P7", id: "makezu", name: "負けずぎらい", kind: "passive", text: "HP が半分以下で DEF・RES +30%", p: { lowHpDef: 0.3 } },
  ],
};

// id → 技（タイプも付ける）。敵ツリーの技は、その敵のタイプ（色に使う）と tree（どのツリーか）を付ける
export const SKILL = Object.fromEntries([
  ...Object.entries(COMMON).map(([id, s]) => [id, { id, ...s, type: null }]),
  ...Object.entries(TREES).flatMap(([type, list]) => list.map((s) => [s.id, { ...s, type, tree: type }])),
  ...Object.entries(ENEMY_TREES).flatMap(([tree, t]) => t.list.map((s) => [s.id, { ...s, type: t.type, tree }])),
]);
