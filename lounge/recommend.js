// おすすめ装備（鹿さんの頼み、2026-10-25）：持って いる 装備から 枠ごとに いちばん 点の 高い 物を えらぶ
// えらび方は 3 つ（鹿さんの決め）：職業に 合う（職業の 伸び方の 重み）・強さ（闘技場の 強さの 数字）・弱点を 補う（その 子の 低い 能力ほど 重く）
// だれ：いま 見て いる 子だけ／パーティ 全員（ペット → パーティの なかまの 順に いい 物から）。ほかの 子が 付けて いる 物も 外して 使う
// 出かけて いる 子の 装備は 使わない。画面（くらべる）と 門番（付ける）で 同じ 計算
import { SLOTS, baseOf, itemStats, itemPower } from "./equip.js";
import { JOB_GROWTH } from "./trees.js";

export const REC_MODES = [["job", "職業に 合う"], ["power", "強さ"], ["weak", "弱点を 補う"]];
export const REC_SCOPES = [["one", "この 子"], ["party", "パーティ 全員"]];
const ST = ["hp", "mp", "atk", "def", "int", "res", "agi", "dex", "luk"];
const pt = (k, v) => (k === "hp" ? v / 4 : k === "mp" ? v / 2 : v);   // 能力の 点（itemPower・強さと 同じ 物差し。HP は 4、MP は 2 で 1 点）

// 能力の 重み（強さは 重みなし＝itemPower）。ch：{ type, stats }（装備なしの 能力）
export function recWeights(mode, ch) {
  if (mode === "power") return null;
  if (mode === "job") { const g = JOB_GROWTH[ch.type] || {}, mx = Math.max(1, ...Object.values(g)); return Object.fromEntries(ST.map((k) => [k, 0.5 + (0.5 * (g[k] || 0)) / mx])); }   // 職業の 能力は 1 倍、ほかも 0.5 倍は 数える
  const s = ch.stats || {}, v = ST.map((k) => Math.max(1, pt(k, s[k] || 0))), m = v.reduce((a, b) => a + b, 0) / v.length;
  return Object.fromEntries(ST.map((k, i) => [k, Math.max(0.5, Math.min(2.5, m / v[i]))]));   // 弱点：その 子の 能力の 平均と くらべて 低い ほど 重く（0.5〜2.5 倍）
}
// 装備 1 この 点：能力は 重みを かけ、% や とくべつな OP・効果は 強さと 同じ 点
export function recScore(it, w) {
  const all = itemPower(it); if (!w) return all;
  const s = itemStats(it); let stat = 0, ws = 0;
  for (const k of ST) if (s[k]) { stat += pt(k, s[k]); ws += pt(k, s[k]) * w[k]; }
  return all - stat + ws;
}
const kindOf = (it) => (baseOf(it.base) || {}).slot;
const SLOT_KEYS = Object.keys(SLOTS), KIND_KEYS = [...new Set(SLOT_KEYS.map((s) => SLOTS[s].kind))];

// chars：えらぶ 順に [{ who, type, stats, equip: { 枠: uid } }]。items：持って いる 装備（武器は アタッチメントこみ）。locked：使えない 装備の uid
// 答え：[{ who, set: { 枠: uid|null } }]。点が 0 以下の 物は 付けない。同じ 点なら いま その 子が 付けて いる 物（むだに 入れかえない）
export function recommend(chars, items, mode, locked = new Set()) {
  const used = new Set(), out = [];
  for (const ch of chars) {
    const w = recWeights(mode, ch), sc = new Map(items.map((it) => [it.uid, recScore(it, w)])), mine = new Set(Object.values(ch.equip || {}).filter(Boolean)), set = {};
    for (const kind of KIND_KEYS) {
      const slots = SLOT_KEYS.filter((s) => SLOTS[s].kind === kind);
      const pick = items.filter((it) => !used.has(it.uid) && !locked.has(it.uid) && kindOf(it) === kind && sc.get(it.uid) > 0)
        .sort((a, b) => sc.get(b.uid) - sc.get(a.uid) || mine.has(b.uid) - mine.has(a.uid) || b.star - a.star || (a.uid < b.uid ? -1 : 1)).slice(0, slots.length);
      pick.forEach((it) => used.add(it.uid));
      // アクセサリー：いま 付けて いる 枠に ある 物は その 枠の まま。のこりを あいた 枠へ
      const left = [...pick];
      for (const s of slots) { const u = (ch.equip || {})[s], k = left.findIndex((it) => it.uid === u); if (k >= 0) { set[s] = u; left.splice(k, 1); } }
      for (const s of slots) if (!(s in set)) set[s] = left.length ? left.shift().uid : null;
    }
    out.push({ who: ch.who, set });
  }
  return out;
}
// かわる 枠だけ（画面の くらべる 一覧）：[{ who, slot, from: uid|null, to: uid|null, took: 付けて いた 子（ほかの 子から 外す とき） }]
export function recDiff(plan, chars, wornBy) {
  const rows = [];
  for (const p of plan) {
    const ch = chars.find((c) => c.who === p.who);
    for (const s of SLOT_KEYS) { const from = (ch.equip || {})[s] || null, to = p.set[s] || null; if (from === to) continue;
      const w = to && wornBy[to], took = w && w.who !== p.who && !plan.some((q) => q.who === w.who) ? w.who : null;   // パーティの 中で うつす 物は 入れない
      rows.push({ who: p.who, slot: s, from, to, took }); }
  }
  return rows;
}
