// ペットの装備アクセサリーのデータ（試作）。設計メモの表・バトルの計算・画面の見本はここから読む
// 枠は 3 つ。どの装備も ★1〜5 のどれかで出る。★で「もとの強さ」と OP（おまけ能力）の数が決まる。数字はすべて仮
import { DUNGEONS } from "./dungeons.js";

export const SLOTS = {
  head: { label: "あたま", role: "守り（DEF・RES）" },
  neck: { label: "くび", role: "体力（HP・MP）" },
  hand: { label: "おまけ", role: "攻め（ATK・INT）" },
};

// もとの強さ：★ごとの数字（HP は 4 倍・MP は 2 倍）。split は 2 つに分ける装備
export const MAIN = [0, 2, 4, 6, 8, 10];
export const BASES = [
  { id: "helmet", slot: "head", name: "工事のヘルメット", main: { def: 1 } },
  { id: "knit", slot: "head", name: "毛糸のぼうし", main: { res: 1 } },
  { id: "straw", slot: "head", name: "麦わら帽子", main: { def: 0.5, res: 0.5 } },
  { id: "nabe", slot: "head", name: "鍋のふた", main: { def: 1.4, agi: -0.3 }, note: "かたいけど重い" },
  { id: "bowtie", slot: "neck", name: "蝶ネクタイ", main: { hp: 1 } },
  { id: "omamori", slot: "neck", name: "お守り", main: { mp: 1 } },
  { id: "bib", slot: "neck", name: "よだれかけ", main: { hp: 0.5, mp: 0.5 } },
  { id: "gold", slot: "neck", name: "金のネックレス", main: { hp: 0.7, luk: 0.5 }, note: "ちょっと運がよくなる" },
  { id: "stick", slot: "hand", name: "木の棒", main: { atk: 1 } },
  { id: "pikopiko", slot: "hand", name: "ピコピコハンマー", main: { atk: 0.8, dex: 0.3 } },
  { id: "mizudeppo", slot: "hand", name: "水鉄砲", main: { int: 1 } },
  { id: "kamifusen", slot: "hand", name: "紙ふうせん", main: { int: 0.7, agi: 0.4 } },
];

// 上の装備：作業台の「合成」でだけ作れる（ヴェルヴェットの形。鹿さんの決め、2026-10-22）。もとの強さは 1.5 倍。look は 見た目に使う もとの装備
// fx はボスの素材のレシピだけ：25% で付く とくべつな効果（案。まだ計算に入れていない）
// fx は ボスの素材の 合成で 25% だけ 付く とくべつな効果（文）、fxp は 戦いの 計算に 入れる 中身（battle-sim.js の パッシブと 同じ 入れ物）
export const UPPER = [
  { id: "stonehelm", slot: "head", name: "石のかぶと", look: "helmet", main: { def: 1.5 } },
  { id: "ghosthood", slot: "head", name: "霊布のフード", look: "knit", main: { res: 1.5 } },
  { id: "kingstraw", slot: "head", name: "王さまの麦わら帽子", look: "straw", main: { def: 0.75, res: 0.75 }, fx: "王の いげん：戦いの はじめ、相手の ATK と INT −15%（3 ターン）", fxp: { startFoeFx: [["down_atk", 15, 3], ["down_int", 15, 3]] } },
  { id: "crystalnabe", slot: "head", name: "水晶の鍋ぶた", look: "nabe", main: { def: 2.1, agi: -0.3 } },
  { id: "fangchoker", slot: "neck", name: "牙のチョーカー", look: "bowtie", main: { hp: 1.5 } },
  { id: "dreamcharm", slot: "neck", name: "夢見のお守り", look: "omamori", main: { mp: 1.5 } },
  { id: "sleepbib", slot: "neck", name: "眠りのよだれかけ", look: "bib", main: { hp: 0.75, mp: 0.75 }, fx: "ねむりがお：相手に ねむらされない", fxp: { noFx: { sleep: true } } },
  { id: "nightgold", slot: "neck", name: "夜ふけのネックレス", look: "gold", main: { hp: 1.05, luk: 0.75 }, fx: "夜ふけの鐘：3 ターンごとに MP +1", fxp: { bellMp: 1, bellEvery: 3 } },
  { id: "goblinclub", slot: "hand", name: "ゴブリンこんぼう", look: "stick", main: { atk: 1.5 } },
  { id: "mimichammer", slot: "hand", name: "ミミックハンマー", look: "pikopiko", main: { atk: 1.2, dex: 0.45 } },
  { id: "lampgun", slot: "hand", name: "ともしび水鉄砲", look: "mizudeppo", main: { int: 1.5 } },
  { id: "dragonfusen", slot: "hand", name: "竜水晶のふうせん", look: "kamifusen", main: { int: 1.05, agi: 0.6 }, fx: "竜の いぶき：最初の 攻撃の ダメージ +30%", fxp: { firstHit: 0.3 } },
];
// ミシック：行き先ごとに 1 つ（中身は dungeons.js）。もとの強さは ★5 と同じ・OP 5 つ・効果は いつも 付く
export const MYTHICS = DUNGEONS.map((d) => ({ ...d.mythic, mythic: true }));
export const baseOf = (id) => BASES.find((b) => b.id === id) || UPPER.find((b) => b.id === id) || MYTHICS.find((b) => b.id === id);
export const hasFx = (it) => { const b = baseOf(it.base); return !!b?.fxp && (b.mythic || !!it.fx); };

// OP：★の数だけ付く（★1 は 1 つ … ★5 は 5 つ）。数字はその装備の★で決まる（左から ★1〜★5）。from は付きはじめる★
export const OPS = {
  atk: { label: "ATK", v: [1, 1, 2, 2, 3], fmt: (x) => `ATK +${x}` },
  def: { label: "DEF", v: [1, 1, 2, 2, 3], fmt: (x) => `DEF +${x}` },
  int: { label: "INT", v: [1, 1, 2, 2, 3], fmt: (x) => `INT +${x}` },
  res: { label: "RES", v: [1, 1, 2, 2, 3], fmt: (x) => `RES +${x}` },
  agi: { label: "AGI", v: [1, 1, 2, 2, 3], fmt: (x) => `AGI +${x}` },
  dex: { label: "DEX", v: [1, 1, 2, 2, 3], fmt: (x) => `DEX +${x}` },
  luk: { label: "LUK", v: [1, 1, 2, 2, 3], fmt: (x) => `LUK +${x}` },
  hp: { label: "HP", v: [4, 4, 8, 8, 12], fmt: (x) => `HP +${x}` },
  mp: { label: "MP", v: [2, 2, 3, 3, 4], fmt: (x) => `MP +${x}` },
  wazaDmg: { label: "技のダメージ", v: [2, 3, 5, 6, 8], fmt: (x) => `技のダメージ +${x}%` },
  itazuraDmg: { label: "イタズラのダメージ", v: [2, 3, 5, 6, 8], fmt: (x) => `イタズラのダメージ +${x}%` },
  crit: { label: "会心", v: [1, 1, 2, 3, 4], fmt: (x) => `会心 +${x}%` },
  critDmg: { label: "会心のダメージ", v: [4, 6, 8, 10, 14], fmt: (x) => `会心のダメージ +${x}%` },
  dmgCut: { label: "受けるダメージ", v: [1, 2, 3, 4, 6], fmt: (x) => `受けるダメージ −${x}%` },
  evade: { label: "回避", v: [1, 1, 2, 3, 4], fmt: (x) => `回避 +${x}%` },
  drain: { label: "吸収", v: [1, 2, 3, 4, 5], fmt: (x) => `与えたダメージの ${x}% を回復` },
  statusRes: { label: "状態異常に強い", v: [5, 10, 15, 20, 25], fmt: (x) => `状態異常に強い +${x}%` },
  healUp: { label: "回復量", v: [3, 5, 7, 9, 12], fmt: (x) => `回復する量 +${x}%` },
  mpRegen: { label: "MP 回復", v: [0, 0, 1 / 5, 1 / 4, 1 / 3], from: 3, fmt: (x) => (x >= 1 ? "毎ターン MP +1" : `${Math.round(1 / x)} ターンごとに MP +1`) },   // ★3 は 5 ターンごと・★4 は 4・★5 は 3（2026-10-23。毎ターンだと ヒーラーが これなしでは 勝てなく なった）
  firstStrike: { label: "先手", v: [0, 0, 1, 1, 1], from: 3, fmt: () => "最初のターンはかならず先に動く" },
  endure: { label: "根性", v: [0, 0, 0, 0, 1], from: 5, fmt: () => "1 試合 1 回、HP 1 で耐える" },
  focusStart: { label: "集中", v: [0, 0, 1, 1, 1], from: 3, fmt: (x) => `戦いのはじめに集中（${x} ターン。動いたあとに MP 20% 回復）` },   // v は ターン数（前は 3〜5 ターンで、テクニシャンと ヒーラーに 強すぎた）
};

// 装備 1 つの数字をまとめる：もとの強さ ＋ OP
export function itemStats(it) {
  const base = baseOf(it.base), out = {};
  for (const [k, w] of Object.entries(base.main)) out[k] = (out[k] || 0) + Math.round(MAIN[it.star] * w * (k === "hp" ? 4 : k === "mp" ? 2 : 1));
  for (const op of it.ops) out[op] = (out[op] || 0) + OPS[op].v[it.star - 1];
  return out;
}
// 強さの目安（下克上の判定）に足す点：ステータスはそのまま、% の OP は 1% ＝ 0.5 点、特別な OP は 4 点
export function itemPower(it) {
  const s = itemStats(it); let p = 0;
  for (const [k, v] of Object.entries(s)) p += k === "hp" ? v / 4 : k === "mp" ? v / 2 : ["atk", "def", "int", "res", "agi", "dex", "luk"].includes(k) ? v : ["mpRegen", "firstStrike", "endure", "focusStart"].includes(k) ? 4 * v : v * 0.5;
  if (hasFx(it)) p += baseOf(it.base).mythic ? 8 : 4;   // とくべつな効果は OP の 先手・根性と 同じくらいの ねうち（ミシックは その 倍）
  return p;
}
