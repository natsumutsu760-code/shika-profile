// 新しい OP（大工事。鹿さんと カードで 決めた、2026-10-29。数は すべて 案）
// 今の OP（equip.js の OPS）には まだ 入れない（今の 装備の くじに 混ざると、戦いの 計算が ない OP が 付く）。スフィアの 表（sphere.js）だけが 使う
// ・どれも「少し 上がる・下がる」だけ。無効や、特定の ビルドを 完封する 効果は 作らない（CLAUDE.md の 戦いの つりあい）
// ・v は ★1〜5 の 強さ。from は 付きはじめる ★。unique（ユニーク OP）は ★に よらず 同じ 効果で、★4 から 出る（％の 振れ幅を 付けられない 物。鹿さんの決め）
// ・ISLAND_OPS：島の 名物。その 島の スフィアと 素材の 抽選で しか 出ない（島が ふえる たびに 2〜3 つ 足す。鹿さんの決め）
import { OPS } from "./equip.js";

const pct = (t) => (x) => t.replace("N", x);
export const NEW_OPS = {
  // 状態異常の 追撃（通常攻撃の N% で、今 ある 状態異常を かける。かならず 止める 物は 作らない。麻痺は しびれて 動けない ことが あるが 最大 5 割）
  hitPoison: { cat: "追撃", label: "毒の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 毒") },
  hitBurn: { cat: "追撃", label: "炎上の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 炎上") },
  hitSickness: { cat: "追撃", label: "体調不良の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 体調不良") },
  hitFrostbite: { cat: "追撃", label: "凍傷の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 凍傷") },
  hitScald: { cat: "追撃", label: "火傷の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 火傷") },
  hitFatigue: { cat: "追撃", label: "疲労の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 疲労") },
  hitWeakness: { cat: "追撃", label: "衰弱の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 衰弱") },
  hitParalysis: { cat: "追撃", label: "麻痺の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 麻痺") },
  hitBlind: { cat: "追撃", label: "盲目の追撃", v: [2, 3, 4, 5, 6], fmt: pct("通常攻撃の N% で 盲目") },
  // 戦い方
  thornsOp: { cat: "戦い方", label: "反撃", v: [5, 8, 12, 16, 20], fmt: pct("攻撃を 受けたら、相手に ATK の N% を 返す") },
  pierceOp: { cat: "戦い方", label: "貫通", v: [3, 5, 7, 9, 12], fmt: pct("相手の DEF・RES を N% 少なく 見る") },
  accuracy: { cat: "戦い方", label: "命中", v: [2, 3, 4, 6, 8], fmt: pct("相手の 回避 −N%") },
  firstHitOp: { cat: "戦い方", label: "最初の一撃", v: [5, 8, 12, 16, 20], fmt: pct("最初に 当てた 攻撃 ＋N%") },
  regenOp: { cat: "戦い方", label: "自然回復", v: [0.5, 0.8, 1, 1.5, 2], fmt: pct("毎ターン 最大 HP の N% 回復") },
  barrierOp: { cat: "戦い方", label: "開幕バリア", v: [0, 0, 1, 1, 2], from: 3, fmt: pct("戦いの はじめに、攻撃を N 回 防ぐ") },
  execute: { cat: "戦い方", label: "とどめ", v: [5, 8, 12, 16, 20], fmt: pct("HP 3 割 以下の 相手へ ＋N%") },
  desperate: { cat: "戦い方", label: "背水", v: [6, 10, 14, 18, 24], fmt: pct("自分の HP が 減るほど ＋（HP 1 で ＋N%）") },
  // 守りの 工夫
  cureFast: { cat: "守り", label: "早い治り", v: [10, 15, 20, 25, 30], fmt: pct("状態異常が N% で 1 ターン 早く 治る") },
  critGuard: { cat: "守り", label: "会心よけ", v: [4, 6, 8, 10, 14], fmt: pct("受ける 会心の ダメージ −N%") },
  healRecv: { cat: "守り", label: "受ける回復", v: [3, 5, 7, 9, 12], fmt: pct("受ける 回復 ＋N%") },
  mpSave: { cat: "守り", label: "MP 節約", v: [3, 5, 7, 9, 12], fmt: pct("技の MP −N%") },
  // 歪で 変な 効果（★で のびる）
  agiGuard: { cat: "変な効果", label: "受け流し", v: [6, 9, 12, 16, 20], fmt: pct("受ける 直接ダメージを、N% で AGI でも もう 一度 減らす") },
  dexGuard: { cat: "変な効果", label: "手さばき", v: [5, 8, 12, 16, 20], fmt: pct("DEX の N% を 守り（DEF・RES）に 足す") },
  resShield: { cat: "変な効果", label: "知恵の盾", v: [10, 15, 20, 25, 30], fmt: pct("受ける 物理ダメージの N% を RES で 受ける") },
  badLuck: { cat: "変な効果", label: "不運の力", v: [0.2, 0.3, 0.4, 0.5, 0.6], fmt: pct("LUK が 低いほど 強い（LUK が 自分の Lv より 1 低い ごとに ダメージ ＋N%、最大 ＋20%）") },
  whim: { cat: "変な効果", label: "気まぐれ", v: [6, 9, 12, 16, 20], fmt: pct("毎ターン ATK・INT・AGI の どれか 1 つが ＋N%") },
  gamble: { cat: "変な効果", label: "守りの賭け", v: [8, 12, 16, 20, 26], fmt: pct("受ける ダメージが、半分の 確率で −N%・半分の 確率で ＋（N の 半分）%") },
  // ユニーク OP（★に よらず 同じ。★4 から 出る）
  crackOp: { cat: "ユニーク", label: "ひび", unique: true, fmt: () => "会心で ふえた 分は ひびに なり、3 ターンに 分けて 受ける" },
  avgGuard: { cat: "ユニーク", label: "平均の守り", unique: true, fmt: () => "物理も 魔法も、DEF と RES の 平均で 受ける" },
  ironThorns: { cat: "ユニーク", label: "鉄の棘", unique: true, fmt: () => "反撃の ダメージを ATK では なく DEF で 決める" },
  delayPain: { cat: "ユニーク", label: "遅れの痛み", unique: true, fmt: () => "受ける ダメージの 2 割を、次の 2 ターンに 分けて 受ける" },
  hpCast: { cat: "ユニーク", label: "命の詠唱", unique: true, fmt: () => "MP が 足りない ときは、足りない 分の 2 倍の HP で 技を 出す" },
  swapPower: { cat: "ユニーク", label: "あべこべ", unique: true, fmt: () => "通常攻撃は INT、技は ATK で 計算する" },
  // ミカネル島の 名物（Claude の 案、2026-11-04。砂漠と オアシス）
  mirageOp: { cat: "戦い方", label: "蜃気楼", v: [4, 6, 8, 10, 13], fmt: pct("戦いの はじめに 幻影 +N") },
  oasisOp: { cat: "戦い方", label: "オアシス", v: [1, 1.5, 2, 2.5, 3], fmt: pct("HP が 半分より 少ない あいだ、毎ターン 最大 HP の N% 回復") },
  sandClock: { cat: "ユニーク", label: "砂時計", unique: true, fmt: () => "9 ターン目から、技の ダメージ +15%" },
};
export const ALL_OPS = { ...OPS, ...NEW_OPS };
// 島の 名物（その 島で しか 出ない）
export const ISLAND_OPS = { 1: ["firstHitOp", "regenOp", "crackOp"], 2: ["thornsOp", "ironThorns", "hpCast"], 3: ["mirageOp", "oasisOp", "sandClock"] };
export const islandOf = (op) => Number(Object.keys(ISLAND_OPS).find((i) => ISLAND_OPS[i].includes(op)) || 0);
// その ★で 出せるか（とくべつな OP は from から、ユニーク OP は ★4 から）
export const opAt = (op, star) => star >= (ALL_OPS[op].unique ? 4 : ALL_OPS[op].from || 1);
