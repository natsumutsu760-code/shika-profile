// スキルツリーのしくみ（試作）。「スキルツリー要件」（別のゲーム用に組んだもの）の形をそのまま使う
// どのツリーも同じ 30 ノード・分岐 2 か所。ペット 1 匹は「職業ツリー 1 本 ＋ サブツリー 3 本」を持つ（サブは派遣で捕まえた敵を研究すると付けられる。敵ツリーは enemy-trees.js）
// SP はレベルが 1 上がるごとに 10。ノードの中身（技・パッシブ）は skills.js の slot、能力上昇の数字はこのゲームの大きさに合わせて小さくする
import { TREES } from "./skills.js";
import { ENEMY_TREES } from "./enemy-trees.js";

export const SP_PER_LV = 10, TREE_SLOTS = 4, SET_SLOTS = 6;
// 能力上昇ノードの数字：もとの表の値 × 倍率（このゲームのステータスは小さいので）。個体差で +0〜50%
export const STAT_SCALE = { hp: 0.4, mp: 0.4, other: 0.12 };

// 30 ノード：id・区域・前提（どれか 1 つ）・中身・必要 SP。side は分岐（L1・R1・L2・R2）
export const SHAPE = [
  { id: "B1", zone: "基礎", req: [], kind: "stat", stat: "main", v: 5, sp: 5 },
  { id: "B2", zone: "基礎", req: ["B1"], kind: "skill", n: 1, sp: 10 },
  { id: "B3", zone: "基礎", req: ["B2"], kind: "stat", stat: "sub", v: 5, sp: 8 },
  { id: "B4", zone: "基礎", req: ["B3"], kind: "skill", n: 2, sp: 10 },
  { id: "B5", zone: "基礎", req: ["B4"], kind: "passive", n: 1, sp: 10 },
  { id: "B6", zone: "基礎", req: ["B5"], kind: "stat", stat: "main", v: 8, sp: 8 },
  { id: "B7", zone: "基礎", req: ["B6"], kind: "stat", stat: "hp", v: 10, sp: 8 },
  { id: "B8", zone: "基礎", req: ["B7"], kind: "skill", n: 3, sp: 10 },
  { id: "A1", zone: "応用", req: ["B8"], kind: "passive", n: 2, sp: 15 },
  { id: "A2", zone: "分岐①左", side: "L1", req: ["A1"], kind: "stat", stat: "main", v: 15, sp: 15 },
  { id: "A3", zone: "分岐①左", side: "L1", req: ["A2"], kind: "skill", n: 4, sp: 20 },
  { id: "A4", zone: "分岐①左", side: "L1", req: ["A3"], kind: "passive", n: 3, sp: 15 },
  { id: "A5", zone: "分岐①右", side: "R1", req: ["A1"], kind: "stat", stat: "sub", v: 15, sp: 15 },
  { id: "A6", zone: "分岐①右", side: "R1", req: ["A5"], kind: "skill", n: 5, sp: 20 },
  { id: "A7", zone: "分岐①右", side: "R1", req: ["A6"], kind: "passive", n: 4, sp: 15 },
  { id: "A8", zone: "応用", req: ["A4", "A7"], kind: "stat", stat: "sub", v: 15, sp: 15 },
  { id: "A9", zone: "分岐②左", side: "L2", req: ["A8"], kind: "stat", stat: "main", v: 20, sp: 15 },
  { id: "A10", zone: "分岐②左", side: "L2", req: ["A9"], kind: "skill", n: 6, sp: 20 },
  { id: "A11", zone: "分岐②左", side: "L2", req: ["A10"], kind: "passive", n: 5, sp: 15 },
  { id: "A12", zone: "分岐②右", side: "R2", req: ["A8"], kind: "stat", stat: "hp", v: 25, sp: 15 },
  { id: "A13", zone: "分岐②右", side: "R2", req: ["A12"], kind: "skill", n: 7, sp: 20 },
  { id: "A14", zone: "分岐②右", side: "R2", req: ["A13"], kind: "passive", n: 6, sp: 15 },
  { id: "A15", zone: "応用", req: ["A11", "A14"], kind: "stat", stat: "main", v: 20, sp: 15 },
  { id: "Ab1", zone: "奥義", req: ["A15"], kind: "keyword", sp: 30 },                                  // もとの表のアビスキーワード ＝ このゲームではガンビットの枠 +1
  { id: "Ab2", zone: "奥義", req: ["Ab1"], kind: "stat", stat: "main", v: 30, sp: 20 },
  { id: "Ab3", zone: "奥義", req: ["Ab2"], kind: "stat", stat: "sub", v: 20, sp: 20 },
  { id: "Ab4", zone: "奥義", req: ["Ab3"], kind: "skill", n: 8, sp: 20 },
  { id: "Ab5", zone: "奥義", req: ["Ab4"], kind: "stat", stat: "hp", v: 50, sp: 20 },
  { id: "Ab6", zone: "奥義", req: ["Ab5"], kind: "passive", n: 7, sp: 20 },
  { id: "Ab7", zone: "奥義", req: ["Ab6"], kind: "stat", stat: "main", v: 40, sp: 30, master: true },  // ここまで取ると「マスター」
];
const NODE = Object.fromEntries(SHAPE.map((n) => [n.id, n]));
const OPPOSITE = { L1: "R1", R1: "L1", L2: "R2", R2: "L2" };

// 職業ツリー：主能力・副能力（このゲームのステータス名）。技とパッシブは skills.js の slot から
export const JOB_TREES = {
  attacker: { name: "アタッカー", main: "atk", sub: "dex" },
  caster: { name: "キャスター", main: "int", sub: "mp" },
  technician: { name: "テクニシャン", main: "dex", sub: "agi" },
  healer: { name: "ヒーラー", main: "int", sub: "res" },
  defender: { name: "ディフェンダー", main: "def", sub: "res" },
};
// ツリーの情報（名前・主能力・副能力・技とパッシブの一覧）。職業ツリーでも敵ツリーでも同じ形で返す
export const treeOf = (id) => JOB_TREES[id] ? { ...JOB_TREES[id], id, job: true, list: TREES[id] } : { ...ENEMY_TREES[id], id, job: false };
// ツリー 1 本の 30 ノードに中身を入れる
export function nodesOf(treeId) {
  const T = treeOf(treeId), list = T.list;
  return SHAPE.map((n) => {
    const x = { ...n };
    if (n.kind === "skill") x.skill = list.find((s) => s.slot === `S${n.n}`)?.id;
    if (n.kind === "passive") x.passive = list.find((s) => s.slot === `P${n.n}`)?.id;
    if (n.kind === "stat") x.key = n.stat === "main" ? T.main : n.stat === "sub" ? T.sub : "hp";
    return x;
  });
}

// 取れるか：前提のどれかを取っていて、分岐の反対側を 1 つも取っていない
export function canTake(taken, id) {
  const n = NODE[id];
  if (taken.has(id)) return false;
  if (n.req.length && !n.req.some((r) => taken.has(r))) return false;
  if (n.side && [...taken].some((t) => NODE[t].side === OPPOSITE[n.side])) return false;
  return true;
}
export function stateOf(taken, id, sp) {
  if (taken.has(id)) return "取得済み";
  const n = NODE[id];
  if (n.side && [...taken].some((t) => NODE[t].side === OPPOSITE[n.side])) return "封鎖";
  if (n.req.length && !n.req.some((r) => taken.has(r))) return "ロック";
  return sp >= n.sp ? "取れる" : "SP が足りない";
}
// 自動振り：B1 → Ab7 の順に、取れるものを取る。分岐はふつう左（branch で { 1: "R", 2: "L" } のように選べる）
const AUTO_ORDER = (b = {}) => ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "A1", ...(b[1] === "R" ? ["A5", "A6", "A7"] : ["A2", "A3", "A4"]), "A8", ...(b[2] === "R" ? ["A12", "A13", "A14"] : ["A9", "A10", "A11"]), "A15", "Ab1", "Ab2", "Ab3", "Ab4", "Ab5", "Ab6", "Ab7"];
export function autoTake(sp, branch = {}) {
  const taken = new Set();
  for (const id of AUTO_ORDER(branch)) { if (sp < NODE[id].sp) break; taken.add(id); sp -= NODE[id].sp; }
  return { taken, rest: sp };
}
export const pathSp = (branch = {}) => AUTO_ORDER(branch).reduce((a, id) => a + NODE[id].sp, 0);

// 個体差：個体（seed）とノードで決まる +0〜50%。seed がなければ平均の +25%
function variance(seed, treeId, nodeId) {
  if (seed == null) return 0.25;
  let h = 2166136261 >>> 0; for (const c of `${seed}:${treeId}:${nodeId}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return ((h % 1000) / 1000) * 0.5;
}
// 能力上昇ノードの数字：このゲームの大きさに直した値（最低 1）に、個体差をかけて整数にする
export const baseValue = (n) => Math.max(1, Math.round(n.v * (STAT_SCALE[n.key] ?? STAT_SCALE.other)));
export const statValue = (n, seed, treeId) => Math.round(baseValue(n) * (1 + variance(seed, treeId, n.id)));
// 取ったノードから、覚えた技・パッシブ・能力の足し分・ガンビットの枠を集める
export function learned(treeId, taken, seed) {
  const out = { skills: [], passives: [], stats: {}, keywords: 0, master: false };
  for (const n of nodesOf(treeId)) {
    if (!taken.has(n.id)) continue;
    if (n.kind === "skill" && n.skill) out.skills.push(n.skill);
    if (n.kind === "passive" && n.passive) out.passives.push(n.passive);
    if (n.kind === "keyword") out.keywords++;
    if (n.kind === "stat") out.stats[n.key] = (out.stats[n.key] || 0) + statValue(n, seed, treeId);
    if (n.master) out.master = true;
  }
  return out;
}

// ---------- ステータスの伸び方：職業の重み ＋ 少し手で振る ＋ 種類ごとの適正 ----------
// レベルが 1 上がるごとに 3 ポイント：2 ポイントは職業の重みで自動、1 ポイントは飼い主が好きに振る（1 ポイントで HP +4・MP +2・ほかは +1）
// 種類ごとのステータス適正（2026-10-20 に決めた）：伸びる分に S ×1.15・A ×1.075・B ×1・C ×0.925・D ×0.85 をかける
// どの子も S 1・A 2・B 3・C 2・D 1 で、倍率の合計は同じ（9.0）。得意なステータスに合う職業を選ぶと少し強い
export const BASE_STATS = { hp: 50, mp: 16, atk: 7, def: 7, int: 7, res: 7, agi: 7, dex: 7, luk: 7 };
export const UNIT = { hp: 4, mp: 2 };
export const JOB_GROWTH = {
  attacker: { atk: 16, dex: 8, hp: 5, agi: 5, def: 4, luk: 4, mp: 3 },
  caster: { int: 14, mp: 4, hp: 6, res: 6, dex: 6, agi: 6 },
  technician: { dex: 14, agi: 8, res: 4, atk: 4, hp: 6, def: 4, luk: 2, mp: 4 },
  healer: { int: 10, res: 8, mp: 6, hp: 8, def: 6, agi: 4 },
  defender: { hp: 8, def: 10, res: 8, atk: 6, agi: 6, dex: 4, mp: 3 },
};
export const AUTO_PER_LV = 2, FREE_PER_LV = 1;
export const APT_MUL = { S: 1.15, A: 1.075, B: 1, C: 0.925, D: 0.85 };
const apt = (s) => Object.fromEntries(s.split(" ").map((x) => x.split(":")));
export const APTITUDE = {
  shika: apt("hp:S int:A res:A mp:B def:B luk:B agi:C dex:C atk:D"),      // ネム：よく寝て HP、物知りではないけど落ちついている
  pelican: apt("dex:S hp:A def:A atk:B res:B mp:B int:C agi:C luk:D"),    // ポスケ：手紙をまちがえず届ける。雨に降られる
  mouse: apt("agi:S dex:A luk:A atk:B int:B mp:B hp:C res:C def:D"),      // カチ：せっかちで速い。小さくてこわれやすい
  tv: apt("int:S mp:A def:A hp:B res:B dex:B atk:C agi:C luk:D"),         // ザザ：昔話の物知り。箱でかたい
  mogura: apt("atk:S hp:A def:A agi:B dex:B mp:B res:C luk:C int:D"),     // ホリ：働き者の爪。自分の穴に落ちる
  kurage: apt("mp:S int:A agi:A hp:B res:B dex:B atk:C luk:C def:D"),     // ユラ：夜に光る。光でびっくりさせる。ふわふわよける。風に流される。体がやわらかい
  saboten: apt("def:S hp:A res:A atk:B dex:B int:B luk:C mp:C agi:D"),    // チク：トゲと水ため。鉢ごとなので遅い
  chokin: apt("atk:S hp:A luk:A mp:B int:B dex:B res:C agi:C def:D"),     // チャリン：コインでずっしり重い体当たり。コインの運。食べすぎて動けない。ハンマーで割れる
};
export const aptMul = (species, k) => APT_MUL[APTITUDE[species]?.[k] || "B"];
// 合う職業：職業の重みで自動に伸びる分に、適正の倍率をかけた平均（1 より大きいほど合う）
export const jobFit = (species, type) => { const w = JOB_GROWTH[type], t = Object.values(w).reduce((a, b) => a + b, 0); return Object.entries(w).reduce((a, [k, v]) => a + (v / t) * aptMul(species, k), 0); };
// 重みどおりに n ポイントを配る（端数は大きい順）
function spread(weights, n) {
  const tot = Object.values(weights).reduce((a, b) => a + b, 0), raw = Object.entries(weights).map(([k, w]) => [k, (w / tot) * n]);
  const out = Object.fromEntries(raw.map(([k, v]) => [k, Math.floor(v)])); let left = n - Object.values(out).reduce((a, b) => a + b, 0);
  for (const [k] of raw.sort((a, b) => (b[1] % 1) - (a[1] % 1))) { if (left-- <= 0) break; out[k]++; }
  return out;
}
// Lv のステータスの内わけ：もとの値・職業の重みで自動に伸びた分・手で振った分（free は { atk: 3 } のように。なければ職業の重みと同じ配り方）。species で適正をかける
export function growthParts(type, lv, free, species) {
  const auto = spread(JOB_GROWTH[type], AUTO_PER_LV * (lv - 1)), hand = free || spread(JOB_GROWTH[type], FREE_PER_LV * (lv - 1));
  const val = (src) => Object.fromEntries(Object.keys(BASE_STATS).map((k) => [k, (src[k] || 0) * (UNIT[k] || 1) * aptMul(species, k)]));
  return { base: { ...BASE_STATS }, auto: val(auto), hand: val(hand), freeUsed: Object.values(hand).reduce((a, b) => a + b, 0), freeAll: FREE_PER_LV * (lv - 1) };
}
export function growthStats(type, lv, free, species) {
  const { base, auto, hand } = growthParts(type, lv, free, species);
  return Object.fromEntries(Object.keys(base).map((k) => [k, Math.round(base[k] + auto[k] + hand[k])]));
}

// ---------- ペット 1 匹を組み立てる（試作の計算用）----------
// Lv までの SP を自動で振り、ステータス・覚えた技・パッシブを返す
// o.subs：サブツリーと、そこに振る SP（[["e_witch", 60], ...]、3 本まで）。残りの SP は職業ツリーへ
// o.main：職業ツリーのかわりに使うツリー（敵は自分のツリー 1 本で戦う）。o.bonusSp：足す SP（敵用）。o.species：種類（ステータス適正）
export function buildPet(type, lv, o = {}) {
  const total = SP_PER_LV * (lv - 1) + (o.bonusSp || 0), subs = (o.subs || []).slice(0, TREE_SLOTS - 1);
  const subSp = Math.min(total, subs.reduce((a, [, sp]) => a + sp, 0));
  const trees = [[o.main || type, total - subSp, o.branch], ...subs];
  const stats = growthStats(type, lv, o.free, o.species), out = { learnedSkills: [], passives: [], keywords: 0, taken: {} };
  for (const [id, sp, branch] of trees) {
    const { taken } = autoTake(sp, branch), L = learned(id, taken, o.seed);
    for (const [k, v] of Object.entries(L.stats)) stats[k] += v;
    out.learnedSkills.push(...L.skills); out.passives.push(...L.passives); out.keywords += L.keywords; out.taken[id] = taken;
  }
  for (const k in stats) stats[k] = Math.round(stats[k]);
  return { type, lv, stats, ...out, trees: trees.map(([id]) => id) };
}
