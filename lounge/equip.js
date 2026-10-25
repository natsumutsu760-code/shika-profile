// ペットの装備のデータ（試作）。設計メモの表・バトルの計算・画面の見本はここから読む
// 枠は 9 つ（鹿さんの決め、2026-10-25）：あたま・くび・うで・あし・武器・オフハンド・アクセサリー ×3。どの装備も ★1〜5 のどれかで出る
// 装備の しゅるいは「形 × 素材 × 色」の 組み合わせ（無尽蔵。鹿さんの決め）。id は "形.素材.色"（例 "glove.iron.5" ＝ 鉄の手袋・青）
// 前から ある 12 しゅるい（麦わら帽子 など）と 合成の 上の装備・ミシックは 名前の ある 装備として そのまま 使える
// 強さ：枠ごとの 重み（w）で もとの強さと OP の 数を へらし、ぜんぶ 付けた ときの 合計を 前の 3 枠と 同じくらいに する（鹿さんの決め）
import { DUNGEONS } from "./dungeons.js";

// 部位（しゅるい）。アクセサリーは 枠が 3 つ
export const KINDS = {
  head: { label: "あたま", role: "守り（DEF・RES）", w: 0.4 },
  neck: { label: "くび", role: "体力（HP・MP）", w: 0.35 },
  arm: { label: "うで", role: "器用さ（DEX・ATK）", w: 0.25 },
  leg: { label: "あし", role: "すばやさ（AGI・DEF）", w: 0.25 },
  weapon: { label: "武器", role: "攻め（ATK・INT）", w: 0.5 },
  off: { label: "オフハンド", role: "守りと 魔力（DEF・INT・MP）", w: 0.3 },
  acc: { label: "アクセサリー", role: "運と おまけ（LUK）", w: 0.15 },   // 重みの 合計 2.5（アクセサリーは 3 枠）：★3〜5 で 前の 3 枠と 同じくらい
};
// 枠（ペットと なかまが 付ける 場所）。kind の 装備が 入る
export const SLOTS = {
  head: { kind: "head", label: "あたま" }, neck: { kind: "neck", label: "くび" }, arm: { kind: "arm", label: "うで" }, leg: { kind: "leg", label: "あし" },
  weapon: { kind: "weapon", label: "武器" }, off: { kind: "off", label: "オフハンド" },
  acc1: { kind: "acc", label: "アクセサリー 1" }, acc2: { kind: "acc", label: "アクセサリー 2" }, acc3: { kind: "acc", label: "アクセサリー 3" },
};
export const OLD_SLOT = { hand: "weapon" };   // 前の 枠の 名前（おまけ → 武器。記録を 読む ときに うつす）

// 形：部位ごとに 4 つ。main は 能力の 重み（前の 装備と 同じ 形は 同じ 重み）。geo は 3D の 形（equip3d.js）
export const FORMS = {
  helmet: { kind: "head", name: "ヘルメット", main: { def: 1 } },
  cap: { kind: "head", name: "ぼうし", main: { res: 1 } },
  hat: { kind: "head", name: "帽子", main: { def: 0.5, res: 0.5 } },
  hood: { kind: "head", name: "ずきん", main: { res: 0.6, agi: 0.4 } },
  tie: { kind: "neck", name: "ネクタイ", main: { hp: 1 } },
  scarf: { kind: "neck", name: "マフラー", main: { mp: 1 } },
  bib: { kind: "neck", name: "よだれかけ", main: { hp: 0.5, mp: 0.5 } },
  necklace: { kind: "neck", name: "ネックレス", main: { hp: 0.7, luk: 0.5 } },
  glove: { kind: "arm", name: "手袋", main: { dex: 1 } },
  bangle: { kind: "arm", name: "うでわ", main: { res: 0.6, luk: 0.4 } },
  band: { kind: "arm", name: "リストバンド", main: { agi: 0.6, dex: 0.4 } },
  gauntlet: { kind: "arm", name: "こて", main: { def: 0.6, atk: 0.4 } },
  boots: { kind: "leg", name: "長ぐつ", main: { def: 0.6, res: 0.4 } },
  sneakers: { kind: "leg", name: "スニーカー", main: { agi: 1 } },
  geta: { kind: "leg", name: "げた", main: { atk: 0.5, luk: 0.5 } },
  socks: { kind: "leg", name: "くつした", main: { hp: 0.5, agi: 0.5 } },
  stick: { kind: "weapon", name: "棒", main: { atk: 1 } },
  hammer: { kind: "weapon", name: "ハンマー", main: { atk: 0.8, dex: 0.3 } },
  gun: { kind: "weapon", name: "水鉄砲", main: { int: 1 } },
  balloon: { kind: "weapon", name: "ふうせん", main: { int: 0.7, agi: 0.4 } },
  shield: { kind: "off", name: "たて", main: { def: 1.2, agi: -0.2 } },
  book: { kind: "off", name: "本", main: { int: 0.6, mp: 0.4 } },
  fan: { kind: "off", name: "うちわ", main: { agi: 0.5, res: 0.5 } },
  lantern: { kind: "off", name: "ランタン", main: { mp: 0.6, res: 0.4 } },
  amulet: { kind: "acc", name: "お守り", main: { mp: 1 } },
  brooch: { kind: "acc", name: "ブローチ", main: { luk: 1 } },
  ring: { kind: "acc", name: "ゆびわ", main: { dex: 0.5, luk: 0.5 } },
  keychain: { kind: "acc", name: "キーホルダー", main: { agi: 0.5, luk: 0.5 } },
};
// 素材：tier は 出る 行き先（0 ハルス街道・1 モーフィアス遺跡・2 暗い村・3 水晶洞窟）。bias は 少し 強く なる 能力（重み +0.15）
// 3D の 見た目：c 色・r あらさ・m 金属・e 光る・glass すきとおる
export const MATS = {
  cloth: { name: "布", tier: 0, c: "#EDE4CF", r: 0.8, bias: "res" },
  wood: { name: "木", tier: 0, c: "#B57B45", r: 0.75, bias: "atk" },
  paper: { name: "紙", tier: 0, c: "#F6F2E6", r: 0.85, bias: "int" },
  straw: { name: "麦わら", tier: 0, c: "#EBCB74", r: 0.8, bias: "agi" },
  leather: { name: "革", tier: 1, c: "#8C5A38", r: 0.6, bias: "agi" },
  stone: { name: "石", tier: 1, c: "#9DA3A8", r: 0.9, bias: "def" },
  wool: { name: "毛糸", tier: 1, c: "#E86A64", r: 0.85, bias: "hp" },
  copper: { name: "銅", tier: 1, c: "#C97C4C", r: 0.3, m: 0.7, bias: "dex" },
  iron: { name: "鉄", tier: 2, c: "#8F9AAA", r: 0.3, m: 0.75, bias: "def" },
  bone: { name: "骨", tier: 2, c: "#EEE7D7", r: 0.6, bias: "atk" },
  silver: { name: "銀", tier: 2, c: "#DCE1E8", r: 0.2, m: 0.85, bias: "res" },
  spirit: { name: "霊布", tier: 2, c: "#B8A6EC", r: 0.6, e: 0.35, bias: "int" },
  crystal: { name: "水晶", tier: 3, c: "#9FE6F7", r: 0.08, glass: true, bias: "int" },
  gold: { name: "金", tier: 3, c: "#F3C24F", r: 0.2, m: 0.85, bias: "luk" },
  dragon: { name: "竜のうろこ", tier: 3, c: "#3FB37F", r: 0.35, bias: "hp" },
  star: { name: "星", tier: 3, c: "#FFE57A", r: 0.3, e: 0.6, bias: "luk" },
};
// 色：見た目だけ（0 は 素材の 色の まま）
export const COLS = [null, { name: "赤", c: "#FF6B6B" }, { name: "オレンジ", c: "#FFA94D" }, { name: "黄", c: "#FFD43B" }, { name: "緑", c: "#69DB7C" }, { name: "青", c: "#4DABF7" }, { name: "紫", c: "#B197FC" }, { name: "ピンク", c: "#F783AC" }];
export const BIAS_W = 0.15;
const COMBO = /^([a-z]+)\.([a-z]+)\.([0-7])$/, combos = new Map();
// 組み合わせの 装備（id が "形.素材.色" の とき）。ちがう id は null
export function comboOf(id) {
  if (combos.has(id)) return combos.get(id);
  const m = COMBO.exec(String(id)), F = m && Object.prototype.hasOwnProperty.call(FORMS, m[1]) && FORMS[m[1]], M = m && Object.prototype.hasOwnProperty.call(MATS, m[2]) && MATS[m[2]];
  const out = F && M ? { id, slot: F.kind, name: `${M.name}の${F.name}`, main: { ...F.main, [M.bias]: (F.main[M.bias] || 0) + BIAS_W }, form: m[1], mat: m[2], col: +m[3], combo: true } : null;
  if (combos.size < 5000) combos.set(id, out);
  return out;
}
export const comboId = (form, mat, col) => `${form}.${mat}.${col}`;
// 行き先で 出る 素材：その 行き先の tier が 7 わり、ひとつ 前の tier が 3 わり
export const matsOf = (tier) => Object.keys(MATS).filter((k) => MATS[k].tier === tier);
export function pickMat(R, tier) { const t = tier > 0 && R() < 0.3 ? tier - 1 : tier, list = matsOf(Math.max(0, Math.min(3, t))); return list[Math.floor(R() * list.length)]; }
// 組み合わせの 装備を 1 つ えらぶ（形は 28 から・素材は 行き先の tier・色は 8 から）
export function rollCombo(R, tier, kind = null) {
  const forms = Object.keys(FORMS).filter((f) => !kind || FORMS[f].kind === kind), form = forms[Math.floor(R() * forms.length)];
  return comboId(form, pickMat(R, tier), Math.floor(R() * COLS.length));
}
// OP の 数：★ × 枠の 重み（四捨五入。前は ★の 数 だけ）
export const opCount = (kind, star) => Math.round(star * ((KINDS[kind] || KINDS.weapon).w));

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
  { id: "stick", slot: "weapon", name: "木の棒", main: { atk: 1 } },
  { id: "pikopiko", slot: "weapon", name: "ピコピコハンマー", main: { atk: 0.8, dex: 0.3 } },
  { id: "mizudeppo", slot: "weapon", name: "水鉄砲", main: { int: 1 } },
  { id: "kamifusen", slot: "weapon", name: "紙ふうせん", main: { int: 0.7, agi: 0.4 } },
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
  { id: "goblinclub", slot: "weapon", name: "ゴブリンこんぼう", look: "stick", main: { atk: 1.5 } },
  { id: "mimichammer", slot: "weapon", name: "ミミックハンマー", look: "pikopiko", main: { atk: 1.2, dex: 0.45 } },
  { id: "lampgun", slot: "weapon", name: "ともしび水鉄砲", look: "mizudeppo", main: { int: 1.5 } },
  { id: "dragonfusen", slot: "weapon", name: "竜水晶のふうせん", look: "kamifusen", main: { int: 1.05, agi: 0.6 }, fx: "竜の いぶき：最初の 攻撃の ダメージ +30%", fxp: { firstHit: 0.3 } },
];
// ミシック：行き先ごとに 1 つ（中身は dungeons.js）。もとの強さは ★5 と同じ・OP 5 つ・効果は いつも 付く
export const MYTHICS = DUNGEONS.map((d) => ({ ...d.mythic, mythic: true }));
export const baseOf = (id) => BASES.find((b) => b.id === id) || UPPER.find((b) => b.id === id) || MYTHICS.find((b) => b.id === id) || comboOf(id);
// 手放す（鹿さんの決め、2026-10-25）：売る 値段（★ごと。玉・クレジット）と リサイクル
// リサイクル：★の 数 だけ その 装備の 素材の tier の 行き先の 採取の 素材（くじ）。★4・★5 は かくし通路の 素材も 1 こ。前からの 12 しゅるいと 合成の 装備は ハルス街道、ミシックは その 行き先
export const SCRAP_BALLS = [0, 10, 25, 60, 150, 400], SCRAP_CREDITS = [0, 30, 80, 200, 500, 1200];
export function recycleOf(it) {
  const b = baseOf(it.base), tier = b && b.combo ? MATS[b.mat].tier : b && b.mythic ? Math.max(0, DUNGEONS.findIndex((d) => d.mythic.id === b.id)) : 0;
  return { did: DUNGEONS[Math.min(DUNGEONS.length - 1, tier)].id, n: it.star, hidden: it.star >= 4 ? 1 : 0 };
}
// まとめて 手放す ときに 入れない：ミシック・合成の 上の 装備・とくべつな 効果つき（付けて いる 物は 画面と 門番で 別に 見る）
export const keepInBulk = (it) => { const b = baseOf(it.base); return !b || !!b.mythic || UPPER.some((u) => u.id === b.id) || !!it.fx; };
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

// 装備 1 つの数字をまとめる：もとの強さ（× 枠の 重み。いちばん 重い 能力は 0 に ならない ように 1 は のこす）＋ OP
// もとの強さ（OP を 入れない 分）。画面の「もとの強さ」も ここから
export function mainStats(it) {
  const base = baseOf(it.base), out = {}, sw = (KINDS[base.slot] || KINDS.weapon).w, top = Object.entries(base.main).sort((a, b) => b[1] - a[1])[0][0];
  for (const [k, w] of Object.entries(base.main)) { const v = MAIN[it.star] * w * sw * (k === "hp" ? 4 : k === "mp" ? 2 : 1), r = Math.round(v); if (r || k === top) out[k] = r || Math.sign(v); }
  return out;
}
export function itemStats(it) {
  const out = mainStats(it);
  for (const op of it.ops) out[op] = (out[op] || 0) + OPS[op].v[it.star - 1];
  for (const a of Array.isArray(it.att) ? it.att : []) for (const op of a.ops || []) if (OPS[op]) out[op] = (out[op] || 0) + OPS[op].v[a.star - 1];   // 武器の アタッチメント（workshop.js の withAtt で 入れた 写し）
  return out;
}
// 強さの目安（下克上の判定）に足す点：ステータスはそのまま、% の OP は 1% ＝ 0.5 点、特別な OP は 4 点
export function itemPower(it) {
  const s = itemStats(it); let p = 0;
  for (const [k, v] of Object.entries(s)) p += k === "hp" ? v / 4 : k === "mp" ? v / 2 : ["atk", "def", "int", "res", "agi", "dex", "luk"].includes(k) ? v : ["mpRegen", "firstStrike", "endure", "focusStart"].includes(k) ? 4 * v : v * 0.5;
  if (hasFx(it)) p += baseOf(it.base).mythic ? 8 : 4;   // とくべつな効果は OP の 先手・根性と 同じくらいの ねうち（ミシックは その 倍）
  return p;
}
