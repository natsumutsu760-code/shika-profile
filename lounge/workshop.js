// 工房（鹿さんの頼み、2026-10-25）：素材から 道具・スプリンクラーと、武器の アタッチメントを 作る。数は すべて 案
// スタック数（1 しゅるい 50〜400）を 増やした ぶん、素材を たくさん 使う（1 回 20〜30 こ）
// 支払いは 素材 ＋ クレジット（玉・リソースは 使わない）。工房の Lv で 作れる 物と アタッチメントの ★が かわる
import { OPS } from "./equip.js";

// ---------- 道具・品（数を えらんで まとめて 作れる） ----------
// to：もらう 物（tools は 派遣に 持っていく 道具、items は 品）。lv：工房の Lv
export const WS_ITEMS = [
  { id: "lure", name: "おとりの笛", note: "派遣の 道具：えらんだ 敵と 出会いやすい", lv: 1, to: { tools: { lure: 1 } }, mats: [["straw", 8], ["oldnail", 4], ["hare_horn", 1]], credits: 80 },
  { id: "net", name: "捕獲ネット", note: "派遣の 道具：捕まえる 確率 2 倍", lv: 1, to: { tools: { net: 1 } }, mats: [["oldcloth", 8], ["straw", 12], ["kobold_fur", 2]], credits: 200 },
  { id: "sprinkler", name: "スプリンクラー", note: "畑に 置くと まわりの 作物の 品質が 上がる", lv: 1, to: { items: { sprinkler: 1 } }, mats: [["oldnail", 12], ["pebble", 15], ["wellwater", 8]], credits: 300 },
  { id: "tea", name: "元気のお茶", note: "派遣の 道具：力つきても 1 回だけ 全回復", lv: 2, to: { tools: { tea: 1 } }, mats: [["herb", 20], ["nightbloom", 10], ["deepwater", 10], ["dream_feather", 1, 2]], credits: 600 },
  { id: "sprinkler2", name: "上の スプリンクラー", note: "品質が もっと 上がる・とどく 広さも 広い", lv: 2, to: { items: { sprinkler2: 1 } }, mats: [["ironore", 15], ["oldnail", 20], ["deepwater", 10]], credits: 900 },
  { id: "sprinkler3", name: "星の スプリンクラー", note: "いちばん 品質が 上がる", lv: 3, to: { items: { sprinkler3: 1 } }, mats: [["crystalbit", 20], ["glowstone", 15], ["rainbow_shell", 1, 3]], credits: 3000 },
];
export const WS_MAX = 20;   // 道具・品を 1 回に 作れる 数

// ---------- 武器の アタッチメント ----------
// 武器 1 つに 先っぽ・持ち手 の 2 つ。作る たびに ★と OP が くじ（同じ レシピでも 毎回 ちがう）
export const ATT_KINDS = { tip: { label: "先っぽ" }, grip: { label: "持ち手" } };
// pool：付く OP（この 中から くじ）。mats の さいごは 敵の 素材
export const ATT_BASES = [
  { id: "spike", kind: "tip", name: "とげキャップ", pool: ["atk", "crit", "critDmg"], mats: [["oldnail", 12], ["pebble", 12], ["wolf_fang", 1]], credits: 300 },
  { id: "lens", kind: "tip", name: "ルーペ", pool: ["dex", "crit", "int"], mats: [["crystalbit", 10], ["candle", 10], ["bat_wing", 1]], credits: 400 },
  { id: "bulb", kind: "tip", name: "ちいさな 電球", pool: ["int", "itazuraDmg", "wazaDmg", "mp"], mats: [["glowstone", 10], ["oldnail", 10], ["light_drop", 1]], credits: 400 },
  { id: "rubber", kind: "tip", name: "ゴムキャップ", pool: ["def", "dmgCut", "hp"], mats: [["oldcloth", 12], ["sleepmoss", 12], ["slime_core", 1]], credits: 300 },
  { id: "tape", kind: "grip", name: "グリップテープ", pool: ["dex", "agi", "firstStrike"], mats: [["oldcloth", 12], ["straw", 15], ["goblin_knife", 1]], credits: 250 },
  { id: "strap", kind: "grip", name: "ストラップ", pool: ["agi", "evade", "luk"], mats: [["straw", 15], ["berry", 10], ["kobold_fur", 1]], credits: 250 },
  { id: "weight", kind: "grip", name: "おもり", pool: ["atk", "def", "critDmg", "drain"], mats: [["ironore", 12], ["brick", 12], ["golem_stone", 1]], credits: 400 },
  { id: "bell", kind: "grip", name: "鈴", pool: ["mp", "mpRegen", "focusStart", "healUp"], mats: [["stardust", 12], ["candle", 8], ["old_score", 1]], credits: 400 },
];
export const attBase = (id) => ATT_BASES.find((b) => b.id === id) || null;
// ★の くじ（工房の Lv ごと）。★4 だけ OP が 2 つ
export const ATT_STAR = { 1: { 1: 70, 2: 30 }, 2: { 1: 35, 2: 45, 3: 20 }, 3: { 2: 40, 3: 40, 4: 20 } };
export const attOpN = (star) => (star >= 4 ? 2 : 1);
export const ATT_MAX = 60;   // 武器に 付けて いない アタッチメントを 持てる 数

const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// アタッチメントを 1 つ 引く（uid は 呼ぶ 側が つける）
export function rollAtt(R, base, wsLv) {
  const star = pickW(R, ATT_STAR[Math.max(1, Math.min(3, wsLv))]), ops = [];
  const pool = base.pool.filter((k) => (OPS[k].from || 1) <= star && OPS[k].v[star - 1] > 0);
  for (let i = 0; i < attOpN(star) && pool.length; i++) { const k = pool.splice(Math.floor(R() * pool.length), 1)[0]; ops.push(k); }
  return { base: base.id, star, ops };
}
// アタッチメントの 数字（OP だけ。もとの 強さは ない）
export function attStats(a) { const out = {}; for (const op of a.ops || []) if (OPS[op]) out[op] = (out[op] || 0) + OPS[op].v[a.star - 1]; return out; }
export const attName = (a) => { const b = attBase(a.base); return b ? `${b.name} ★${a.star}` : "？"; };
// 武器に 付いて いる アタッチメントを 武器の 中に 入れた 写し（戦いの 計算・画面の 数字は これを 使う）。atts：記録の own.att
export function withAtt(it, atts) {
  const on = (atts || []).filter((a) => a.on === it.uid);
  return on.length ? { ...it, att: on.map((a) => ({ base: a.base, star: a.star, ops: a.ops, kind: (attBase(a.base) || {}).kind })) } : it;
}
