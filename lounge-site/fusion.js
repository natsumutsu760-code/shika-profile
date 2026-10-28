// モンスターの 配合（docs/mono-link-haigou.md。初代 DQMJ に 沿う。はっきり しない 所は ジョーカー2・イルルカ・ジョーカー3）
// 親：なかよしの なかま 2 体（Lv10 以上・♂ × ♀、両性は どちらとも）。配合すると 親は いなく なる
// 子の 候補：位階配合（系統 × 系統と 位階）＋ 特殊配合 ＋ 4 体配合。候補から 1 種 えらぶ
// 子：Lv1・なかよしで 生まれる。＋値・受けついだ 力（両親の 合計 ÷ 4）・スキル（自分の ツリー ＋ サブスキル 2 つ）・スキルポイント（両親の 合計の 半分）
import { DUNGEONS_ALL, SNACK_NEED } from "./dungeons.js";
import { ENEMY_TREES, evoOf } from "./enemy-trees.js";
import { tamedOf } from "./dungeon-sim.js";
import { SUB_MAX, TREE_FULL, FUSE_LV, treesOf, spTotal, spSplit, sexOf, sexOk } from "./monster.js";
import { ROSTER, SPECIAL, FOUR } from "./fusion-only.js";   // 配合限定 80 種・特殊配合・4 体配合

// ---------- ランク（初代 DQMJ と 同じ 8 段）。野生の 種族は 出て くる Lv で 決める ----------
export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS"];
const RANK_LV = [8, 16, 26, 36, 46, 56, 66];   // この Lv より 下なら その ランク（F は 8 未満 … SS は 66 以上）
export const rankByLv = (lv) => { const i = RANK_LV.findIndex((x) => lv < x); return i < 0 ? RANKS.length - 1 : i; };

// ---------- 系統：ヴェルヴェットの 16 大種族（鹿さんから もらった 仕様書の とおり、2026-10-25） ----------
// 系統は 配合の 候補を 決める ためだけ（戦いの 相性は ない。ヴェルヴェットと 同じ）
export const FAMILIES = {
  jelly: { name: "ゼリー系" }, dragon: { name: "ドラゴン系" }, beast: { name: "獣系" }, demon: { name: "悪魔系" }, undead: { name: "不死系" }, mineral: { name: "鉱物系" },
  plant: { name: "植物系" }, insect: { name: "虫系" }, divine: { name: "神聖系" }, spirit: { name: "霊系" }, avian: { name: "鳥系" }, aquatic: { name: "水棲系" },
  humanoid: { name: "人型系" }, yokai: { name: "妖魔系" }, specter: { name: "怪異系" }, aberration: { name: "異形系" },
};
// かけあわせの 輪（となりどうしが 近い 種族）。ちがう 系統どうしの 配合で、輪の 上で 2 つの 間（近い 回り方の まん中）の 系統から 位階の 低い 子が 出る
// となりどうしの ときは、その 1 つ 先の 系統
const RING = ["jelly", "aquatic", "avian", "beast", "insect", "plant", "mineral", "dragon", "humanoid", "divine", "spirit", "undead", "specter", "aberration", "demon", "yokai"];
export function mixFam(a, b) {
  let i = RING.indexOf(a), j = RING.indexOf(b);
  if (a === b || i < 0 || j < 0) return a;
  if (i > j) [i, j] = [j, i];
  const n = RING.length, fwd = j - i, [from, d] = fwd <= n - fwd ? [i, fwd] : [j, n - fwd];   // 近い 方の 回り方（i から 前へ、か j から 前へ 一周して i）
  return RING[(from + (d === 1 ? 2 : Math.floor(d / 2))) % n];
}
// 野生の 種族の 系統（名前と テーマから。鹿さんと 決めなおせる）
const RACE = {
  e_hare: "beast", e_thief: "humanoid", e_watch: "beast", e_bard: "humanoid", e_boss_thief: "humanoid",
  e_ghost: "spirit", e_sentinel: "mineral", e_trapper: "aberration", e_owl: "avian", e_boss_sleep: "divine",
  e_wolf: "beast", e_shade: "specter", e_lantern: "spirit", e_witch: "demon", e_boss_mayor: "specter",
  e_lizard: "dragon", e_bat: "avian", e_crystal: "jelly", e_turtle: "aquatic", e_boss_crystal: "dragon",
  e_coconutcrab: "insect", e_gull: "avian", e_clownfish: "aquatic", e_sahagin: "aquatic", e_boss_crab: "insect",
  e_pirate: "humanoid", e_parrot: "avian", e_barrel: "aberration", e_mapseller: "humanoid", e_boss_redbeard: "humanoid",
  e_keeper: "undead", e_harpy: "avian", e_glimmer: "spirit", e_shisa: "divine", e_boss_fog: "specter",
  e_skelsailor: "undead", e_barnacle: "mineral", e_goldcrab: "insect", e_jelly: "jelly", e_boss_octopus: "aquatic",
  e_siren: "yokai", e_eel: "aquatic", e_clam: "aquatic", e_pearl: "mineral", e_boss_mermaid: "aquatic",
  e_lavalizard: "dragon", e_hidama: "spirit", e_firechick: "avian", e_obsidian: "mineral", e_boss_salamander: "dragon",
  e_ghostsailor: "undead", e_majimun: "yokai", e_doll: "specter", e_shipcat: "yokai", e_boss_captain: "undead",
  e_thunderbird: "avian", e_whirl: "spirit", e_stormship: "aberration", e_vane: "avian", e_boss_irabu: "dragon",
  e_guard: "divine", e_trident: "humanoid", e_dolphin: "divine", e_priest: "demon", e_boss_seagod: "divine",
  e_angler: "aquatic", e_squid: "aberration", e_deepfish: "aquatic", e_deepgiant: "humanoid", e_boss_gatekeeper: "demon",
};
export const raceOf = (tree) => RACE[tree];

// ---------- 種族（野生 ＋ 配合限定）と 位階 ----------
// 配合限定（fusion-only.js）。ツリーが できて いる 子だけ。生まれ方が「特殊」「4体」の 子は はしごに 入らない（only）
export const FUSION_ONLY = ROSTER.filter((s) => ENEMY_TREES[s.tree]).map(({ tree, name, type, fam, rank, lv, how }) => ({ tree, name, type, fam, rank, lv, ...(how === "位階" ? {} : { only: how }) }));
const wild = DUNGEONS_ALL.flatMap((d) => [...d.foes, d.rare, d.boss].map((f) => ({ tree: f.tree, name: f.name, type: f.type, lv: f.lv, fam: RACE[f.tree] || "humanoid", rank: rankByLv(f.lv), wild: true })));
export const SPECIES = [...wild, ...FUSION_ONLY.map((s) => ({ ...s, wild: false }))]
  .sort((a, b) => a.rank - b.rank || a.lv - b.lv || (a.tree < b.tree ? -1 : 1))
  .map((s, i) => ({ ...s, pos: i + 1 }));   // 位階（通し番号。大きいほど 上）
const BY_TREE = new Map(SPECIES.map((s) => [s.tree, s]));
export const speciesOf = (tree) => BY_TREE.get(tree) || null;
export const famOf = (tree) => (speciesOf(tree) || {}).fam;
const ladder = (fam) => SPECIES.filter((s) => s.fam === fam && !s.only);

// ---------- 特殊配合・4 体配合 ----------
// 特殊配合・4 体配合の 組み合わせは fusion-only.js
export { SPECIAL, FOUR };
const hit = (want, c) => (want.startsWith("fam:") ? famOf(c.tree) === want.slice(4) : want === c.tree);
const sameBag = (x, y) => x.length === y.length && [...x].sort().join() === [...y].sort().join();

// ---------- 配合できるか ----------
export function canFuse(A, B, full = (c) => true) {
  if (!A || !B || A === B || A.uid === B.uid) return { ok: false, why: "2 体 えらんで" };
  for (const c of [A, B]) {
    if (!full(c)) return { ok: false, why: `${c.name}は まだ なかよしで ない` };
    if ((c.lv || 1) < FUSE_LV) return { ok: false, why: `${c.name}は Lv${FUSE_LV} から 配合できる` };
  }
  if (!sexOk(A.sex, B.sex)) return { ok: false, why: "♂ と ♀ で 配合する（両性は どちらとも）" };
  return { ok: true };
}

// ---------- 生まれる 子の 候補（1〜5 種）----------
export function candidates(A, B) {
  const a = speciesOf(A.tree), b = speciesOf(B.tree); if (!a || !b) return [];
  const avg = (a.pos + b.pos) / 2, cap = Math.max(a.rank, b.rank) + 1, out = [];   // 子の ランクは 親の 高い 方 ＋1 まで（はしごが すいて いても 飛びすぎない）
  const add = (s, how) => { if (s && !out.some((x) => x.tree === s.tree)) out.push({ tree: s.tree, how }); };
  const above = (fam) => { const L = ladder(fam).filter((s) => s.rank <= cap); return L.find((s) => s.pos > avg) || L[L.length - 1]; };
  const below = (fam) => { const L = ladder(fam).filter((s) => s.pos < avg); return L[L.length - 1] || ladder(fam).find((s) => s.rank <= cap); };   // 下が なければ いちばん 下（これも ＋1 ランクまで）
  for (const f of FOUR) if (A.par && B.par && sameBag(f.gp, [...A.par, ...B.par])) add(speciesOf(f.child), "4体配合");
  for (const s of SPECIAL) if ((hit(s.a, A) && hit(s.b, B)) || (hit(s.a, B) && hit(s.b, A))) add(speciesOf(s.child), "特殊配合");
  if (a.fam === b.fam) add(above(a.fam), "位階配合");
  else { add(above(a.fam), "位階配合"); add(above(b.fam), "位階配合"); add(below(mixFam(a.fam, b.fam)), "位階配合"); }
  return out.slice(0, 5);
}

// ---------- 受けつぐ スキルの 候補 ----------
// 親の ツリー（自分の ツリーと サブスキル）。最大まで 振った ツリーは「＋」（進化）も 候補に。子の 自分の ツリーは いつも ある ので のぞく
export function skillOptions(A, B, childTree) {
  const out = [];
  for (const c of [A, B]) {
    const { sp } = spSplit(c);
    for (const id of treesOf(c)) {
      if (id !== childTree && ENEMY_TREES[id] && !out.some((o) => o.id === id)) out.push({ id, evo: false });
      const ev = evoOf(id);
      if (ev && ev !== childTree && (sp[id] || 0) >= TREE_FULL && !out.some((o) => o.id === ev)) out.push({ id: ev, evo: true });
    }
  }
  return out;
}

// ---------- 双子・近親配合（ヴェルヴェットの 仕様書。鹿さんの決め、2026-10-28） ----------
// 双子：配合の 10% で、まったく 同じ 子が 2 体 生まれる（lounge-fuse.js）。双子は 同じ bid（生まれの 番号）を 持つ
// 近親配合：双子どうし、または 親が 同じ 子どうし（pu：親の uid が かさなる）。いちばん 高い 力の 受けつぎが 50%（ふつうは 25%）、ほかの 力は ぜんぶ 8 割（inb）
export const TWIN_RATE = 0.1;
export const inbred = (A, B) => !!((A.bid && A.bid === B.bid) || (A.pu && B.pu && A.pu.some((u) => B.pu.includes(u))));
const BATTLE_STATS = ["atk", "def", "int", "res", "agi", "dex", "luk"];

// ---------- 子を 作る ----------
// R：0〜1 の くじ（性別）。uid：新しい 子の uid
export function makeChild(A, B, childTree, subs, R, uid) {
  const sp = speciesOf(childTree); if (!sp) return null;
  const lvSum = (A.lv || 1) + (B.lv || 1);
  const plus = Math.max(A.plus || 0, B.plus || 0) + 1 + (lvSum >= 50 ? 1 : 0) + (lvSum >= 100 ? 1 : 0);
  // スキルポイント：両親の 合計の 半分を 受けつぐ。受けついだ ツリーには 両親が 振って いた 分の 合計の 半分（ジョーカー2）
  const carry = Math.floor((spTotal(A) + spTotal(B)) / 2), sa = spSplit(A).sp, sb = spSplit(B).sp, lock = {};
  for (const id of [childTree, ...subs]) { const v = Math.min(TREE_FULL, Math.floor(((sa[id] || 0) + (sb[id] || 0)) / 2)); if (v) lock[id] = v; }
  // 受けついだ 力：両親の ステータス（装備なし）の 合計 ÷ 4 から、子の Lv1 の ステータスを 引いた 分
  const pa = tamedOf(A, A.lv).stats, pb = tamedOf(B, B.lv).stats, base = tamedOf({ tree: childTree, type: sp.type, name: sp.name }, 1).stats, inh = {};
  const ib = inbred(A, B), top = ib ? BATTLE_STATS.reduce((a, k) => ((pa[k] || 0) + (pb[k] || 0) > (pa[a] || 0) + (pb[a] || 0) ? k : a)) : null;
  for (const k of Object.keys(base)) { if (ib && k !== top) continue; const v = Math.floor(((pa[k] || 0) + (pb[k] || 0)) / (k === top ? 2 : 4)) - base[k]; if (v > 0) inh[k] = v; }
  const rank = (ENEMY_TREES[childTree] || {}).rank || "通常";
  return { uid, tree: childTree, type: sp.type, lv: 1, name: sp.name, exp: 0, gauge: SNACK_NEED[rank] || 0, sex: sexOf(R()), plus, inh, subs: subs.slice(0, SUB_MAX), sp: lock, carry, par: [A.tree, B.tree], gen: Math.max(A.gen || 0, B.gen || 0) + 1, bid: uid, pu: [A.uid, B.uid], ...(ib ? { inb: top } : {}) };
}
