// モンスターの エッセンス（docs/mono-link-essence.md。鹿さんの 原案と カード 2026-11-11）
// あまった 仲間から その 種の エッセンスを 抽出 → ためて サブツリー（アメジストなし）・上位スキル「＋」・特殊スキル（特別な 種の ツリー）を 作る。いらない 分は クレジットで 売る
// 画面（lab.html）と 門番（lounge-server/lounge-essence.js）で 同じ 決まりを 使う。three を 使わない（node でも 動く）
import { ENEMY_TREES } from "./enemy-trees.js";
import { SPECIES, speciesOf, famOf, SPECIAL, FOUR, FAMILIES, RANKS } from "./fusion.js";
import { comboId, comboParts } from "./combo-trees.js";   // 特殊複合スキル（2 種族の 全通り。組み立ては combo-trees.js）

// 数（Claude の 案を 鹿さんが OK。2026-11-11 の 2 回目の カード）
export const ESS_YIELD = [1, 1, 2, 2, 3, 3, 4, 5];                // 1 体から（F・E・D・C・B・A・S・EX）
export const ESS_PRICE = [15, 25, 40, 60, 100, 160, 300, 600];    // 売値（1 こ・クレジット）
export const ESS_SUB = { 通常: 5, 希少: 8, 配合: 10, ボス: 12 };   // サブツリー（その 種の エッセンス。アメジスト・葉 なし・すぐ）
export const ESS_EVO_MUL = 3;                                     // 上位スキル「＋」：サブツリーの 3 倍（もとの サブツリーを 持って いる とき）
export const ESS_SPECIAL = 10, ESS_FOUR = 6;                      // 特殊スキル：レシピの 親 各 10（4 体配合は 各 6）
export const ESS_COMBO = 10;                                      // 特殊複合スキル：2 種族の エッセンス 各 10（どちらの サブツリーも 持って いる とき）
export const ESS_MAX = 9999;                                      // 1 種あたり 持てる 数

export const essRank = (tree) => { const s = speciesOf(tree); return s ? Math.max(0, Math.min(7, s.rank | 0)) : 0; };
export const essRankName = (tree) => RANKS[essRank(tree)];
export const essYield = (tree) => ESS_YIELD[essRank(tree)];
export const essPrice = (tree) => ESS_PRICE[essRank(tree)];
export const essName = (tree) => `${(speciesOf(tree) || ENEMY_TREES[tree] || { name: tree }).name}の エッセンス`;
export const famName = (fam) => (FAMILIES[fam] || { name: fam }).name || fam;
const evoOf = (tree) => (ENEMY_TREES[tree + "_ev"] && ENEMY_TREES[tree + "_ev"].evo ? tree + "_ev" : null);

// つくれる 物（レシピ）。need：{ tree, n }（その 種）か { fam, n }（その 系統の どの 種でも）。req：先に 持って いる ツリー（研究ずみ）
// kind：sub サブツリー・evo 上位スキル「＋」・special 特殊スキル（特殊配合・4 体配合・悪魔の 種の ツリー）・combo 特殊複合スキル（下の comboRecipe。9 万 本 なので 一覧に しない）
function build() {
  const out = [], seen = new Set();
  for (const s of SPECIES) {
    const T = ENEMY_TREES[s.tree]; if (!T || T.evo) continue;
    const n = ESS_SUB[T.rank] || ESS_SUB.通常;
    out.push({ kind: "sub", id: s.tree, need: [{ tree: s.tree, n }], req: [] });
    const ev = evoOf(s.tree);
    if (ev) out.push({ kind: "evo", id: ev, need: [{ tree: s.tree, n: n * ESS_EVO_MUL }], req: [s.tree] });
  }
  const part = (p, n) => (String(p).startsWith("fam:") ? { fam: String(p).slice(4), n } : { tree: p, n });
  for (const r of SPECIAL) {
    if (!ENEMY_TREES[r.child] || seen.has(r.child)) continue; seen.add(r.child);
    out.push({ kind: "special", id: r.child, need: [part(r.a, ESS_SPECIAL), part(r.b, ESS_SPECIAL)], req: [] });
  }
  for (const r of FOUR) {
    if (!ENEMY_TREES[r.child] || seen.has(r.child)) continue; seen.add(r.child);
    out.push({ kind: "special", id: r.child, need: r.gp.map((p) => part(p, ESS_FOUR)), req: [] });
  }
  return out;
}
export const ESS_RECIPES = build();
const BY_KEY = new Map(ESS_RECIPES.map((r) => [r.kind + ":" + r.id, r]));
const SP = new Set(SPECIES.map((s) => s.tree).filter((t) => ENEMY_TREES[t] && !ENEMY_TREES[t].evo));
// 特殊複合：id（cx:種+種）の レシピ。2 種族の エッセンス 各 10・どちらの サブツリーも 持って いる こと
export function comboRecipe(id) {
  const xs = comboParts(id); if (!xs || !SP.has(xs[0]) || !SP.has(xs[1])) return null;
  return { kind: "combo", id, need: xs.map((t) => ({ tree: t, n: ESS_COMBO })), req: xs };
}
export const essRecipe = (kind, id) => (kind === "combo" ? comboRecipe(id) : BY_KEY.get(kind + ":" + id) || null);
// 画面の 一覧に 出す 複合：両方の サブツリーを 持って いて、2 種の エッセンスが 合わせて 半分 より 多い 組（近い 順・max まで）
export function comboRecipes(rec, max = 60) {
  const lab = new Set(rec.lab || []), ess = rec.ess || {}, q = new Set((rec.labQ || []).map((x) => x.tree));
  const own = [...lab].filter((t) => SP.has(t) && (ess[t] || 0) > 0);
  const out = [];
  for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) {
    const id = comboId(own[i], own[j]); if (lab.has(id) || q.has(id)) continue;
    const have = Math.min(ESS_COMBO, ess[own[i]]) + Math.min(ESS_COMBO, ess[own[j]]);
    if (have * 2 > ESS_COMBO * 2) out.push([have, id]);
  }
  return out.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1)).slice(0, max).map(([, id]) => comboRecipe(id));
}

// 持って いる 数で 足りるか。系統の 枠は その 系統の 種から、ランクの 低い（安い）順に あてる。同じ 種を 2 つの 枠で 重ねて 数えない
// 返す：{ ok, take：{ 種：数 }, short：[{ label, have, n }] }
export function essPlan(ess, r) {
  const left = { ...(ess || {}) }, take = {}, short = [];
  const use = (tree, k) => { left[tree] -= k; take[tree] = (take[tree] || 0) + k; };
  for (const p of r.need.filter((x) => x.tree)) {   // 種の 枠を 先に
    const have = left[p.tree] || 0;
    if (have >= p.n) use(p.tree, p.n); else { short.push({ label: essName(p.tree), have, n: p.n }); if (have) use(p.tree, have); }
  }
  for (const p of r.need.filter((x) => x.fam)) {
    let need = p.n;
    const pool = Object.keys(left).filter((t) => left[t] > 0 && famOf(t) === p.fam).sort((a, b) => essRank(a) - essRank(b) || (a < b ? -1 : 1));
    for (const t of pool) { if (!need) break; const k = Math.min(need, left[t]); use(t, k); need -= k; }
    if (need) short.push({ label: `${famName(p.fam)}の エッセンス`, have: p.n - need, n: p.n });
  }
  return { ok: !short.length, take, short };
}
// 画面と 門番の ことわる わけ
export function essWhy(rec, r) {
  if (!r) return "その レシピは ない";
  const lab = rec.lab || [];
  if (lab.includes(r.id)) return "もう 持って いる（ペットの サブツリーに 付けられる）";
  if ((rec.labQ || []).some((x) => x.tree === r.id)) return "いま 研究して いる";
  const miss = r.req.filter((t) => !lab.includes(t));
  if (miss.length) return `先に「${(ENEMY_TREES[miss[0]] || { name: miss[0] }).name}」を 持って いる こと（研究か エッセンスで）`;
  const p = essPlan(rec.ess, r);
  if (!p.ok) return "足りない：" + p.short.slice(0, 2).map((s) => `${s.label} あと ${s.n - s.have}`).join("・") + (p.short.length > 2 ? ` ほか ${p.short.length - 2}` : "");
  return "";
}
