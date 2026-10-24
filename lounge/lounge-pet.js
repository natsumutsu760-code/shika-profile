// プライベートラウンジ：ペットの 育て方（スキルツリー・サブツリー・手で 振る ステータス・ガンビット・オートの 作戦・装備）となかまの 装備
// 決まりは docs/mono-link-pet-battle.md の「タイプ（役割）とスキルツリー」「ガンビット」「装備アクセサリー」
// - ペット 1 匹は 職業ツリー 1 本 ＋ サブツリー 3 本（研究した 敵の ツリー）。SP は Lv ごとに 10 で、4 本で 同じ 入れ物から 使う
// - ノードは 自分で 取る か、自動（ふつうは 左の 道。分岐は えらべる）。自動に して おくと Lv が 上がる たびに 取る
// - 職業を かえると 前の 職業の 技から 1 つだけ 持ちこせる。振り直しと 職業を かえるのは 1 日 1 回 無料、2 回目から 玉（鹿さんの決め、2026-10-24。値段は 案）
// - 装備は あたま・くび・おまけ の 3 枠。なかまも 付けられる。付けて いる 装備は 合成・納める・依頼の お礼に 使えない
import { PETS, PLANS, gambitSlots, SHAPE, SP_PER_LV, SET_SLOTS, TREE_SLOTS, FREE_PER_LV, BASE_STATS, canTake, autoTake, learned, growthStats, ENEMY_TREES, SKILL, EFFECTS, COND_TEXT, baseOf, tamedOf } from "./game.js";

export const RESET_PRICE = (lv) => lv * 100;   // 2 回目からの 振り直し・職業を かえる 玉（案）
export const STYLES = ["attack", "defense", "balance", "mp"];   // オートの 作戦：こうげき重視・防御重視・バランス・MP を大事に
const SP_OF = Object.fromEntries(SHAPE.map((n) => [n.id, n.sp]));
const SLOTS3 = ["head", "neck", "hand"];
const NUM_COND = new Set(["hpBelow", "hpAbove", "mpAtLeast", "mpBelow", "foeHpBelow", "foeHpAbove", "foeMpBelow", "foeDebuffs", "every", "after"]);
const FX_COND = new Set(["foeHas", "foeNotHas", "selfHas", "selfNotHas"]);
const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);

export const spTotal = (lv) => SP_PER_LV * (lv - 1);
export const spUsed = (pet) => Object.values(pet.taken || {}).reduce((a, ids) => a + ids.reduce((b, id) => b + SP_OF[id], 0), 0);
export const freeTotal = (lv) => FREE_PER_LV * (lv - 1);
export const onTrip = (rec, uid) => rec.trips.some((t) => !t.done && t.party.includes(uid));

// 前の 記録に ない 物を 足す（前は いつも お手本どおりの 自動だった ので、職業ツリーに 自動で 取った ことに する）
export function ensurePet(pet) {
  if (PETS[pet.species]) { pet.qid = pet.species; pet.species = PETS[pet.species].sp; }   // 前は 診断の 子の 名前（nemu など）を 種類に して いた
  pet.subs ||= []; pet.grow ||= { auto: true, branch: {} }; pet.equip ||= {}; pet.reset ||= { day: 0, n: 0 };
  if (pet.free === undefined) pet.free = null;
  if (pet.gambits === undefined) pet.gambits = null;
  if (pet.style === undefined) pet.style = null;
  if (pet.carry === undefined) pet.carry = null;
  if (!pet.taken) { pet.taken = {}; if (pet.type) pet.taken[pet.type] = [...autoTake(spTotal(pet.lv), pet.grow.branch).taken]; }
  return pet;
}
// 自動：職業ツリーを お手本の 順（分岐は grow.branch）に、のこりの SP で 取れるだけ 取る（取れない 所は とばす・SP が 足りなく なったら やめる）
export function autoFill(pet) {
  if (!pet.type) return;
  const t = new Set(pet.taken[pet.type] || []); let left = spTotal(pet.lv) - spUsed(pet);
  for (const id of autoTake(1e9, pet.grow.branch).taken) {
    if (t.has(id) || !canTake(t, id)) continue;
    if (SP_OF[id] > left) break;
    t.add(id); left -= SP_OF[id];
  }
  pet.taken[pet.type] = [...t];
}
const equippedOf = (x, rec) => SLOTS3.map((s) => x.equip && x.equip[s]).filter(Boolean).map((u) => rec.own.equip.find((e) => e.uid === u)).filter(Boolean);
// 付けて いる 装備（ペットと なかま ぜんぶ）
export const equippedUids = (rec) => new Set([...rec.pets, ...rec.tamed].flatMap((x) => SLOTS3.map((s) => x.equip && x.equip[s]).filter(Boolean)));

// 戦う ときの ペット（battle-sim.js の 形。お手本の ままなら builds.js の petAt と 同じに なる）
export function fighterOf(pet, rec) {
  ensurePet(pet);
  const trees = [pet.type, ...pet.subs], stats = growthStats(pet.type, pet.lv, pet.free || undefined, pet.species), skills = [], passives = [];
  let keywords = 0;
  for (const id of trees) {
    const L = learned(id, new Set(pet.taken[id] || []), pet.seed);
    for (const [k, v] of Object.entries(L.stats)) stats[k] += v;
    skills.push(...L.skills); passives.push(...L.passives); keywords += L.keywords;
  }
  for (const k in stats) stats[k] = Math.round(stats[k]);
  if (pet.carry && !skills.includes(pet.carry)) skills.push(pet.carry);   // 前の 職業から 持ちこした 技
  const can = (g) => skills.includes(g.do) || (SKILL[g.do] && SKILL[g.do].type === null);
  const fromSubs = pet.subs.flatMap((id) => ENEMY_TREES[id].plan.filter((g) => g.if[0] !== "always" && skills.includes(g.do)));
  const gambits = (pet.gambits || [...fromSubs, ...PLANS[pet.type].gambits]).filter(can).slice(0, gambitSlots(pet.lv, keywords));
  const used = [...new Set(gambits.map((g) => g.do).filter((id) => skills.includes(id)))], set = [...used, ...skills.filter((s) => !used.includes(s))].slice(0, SET_SLOTS);
  return { type: pet.type, lv: pet.lv, stats, set, passives, gambits, auto: pet.style || PLANS[pet.type].auto || "balance", trees, name: pet.name, species: pet.species, equip: rec ? equippedOf(pet, rec) : [] };
}
// 戦う ときの なかま（捕まえた 敵の タイプの 伸び方 ＋ 自分の ツリー。装備も 付く）
export const mateOf = (c, rec) => ({ ...tamedOf(c, c.lv, rec ? equippedOf(c, rec) : []), owner: "" });

// ---------- やること ----------
const petOf = (rec) => { const p = rec.pets[0]; if (p) ensurePet(p); return p; };
export function petTake(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (!(b.tree === pet.type || pet.subs.includes(b.tree))) return { ok: false, why: "その ツリーは 付けて いない" };
  if (!has(SP_OF, b.node)) return { ok: false, why: "知らない ノード" };
  const t = new Set(pet.taken[b.tree] || []);
  if (!canTake(t, b.node)) return { ok: false, why: t.has(b.node) ? "もう 取った" : "まだ 取れない（前の ノードか、分岐の 反対側）" };
  if (spUsed(pet) + SP_OF[b.node] > spTotal(pet.lv)) return { ok: false, why: "SP が 足りない" };
  t.add(b.node); pet.taken[b.tree] = [...t];
  return { ok: true, sp: spTotal(pet.lv) - spUsed(pet) };
}
// 自動に する／しない・分岐を えらぶ（自動なら すぐ 取る）
export function petGrow(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  const side = (v) => (v === "R" ? "R" : "L");
  pet.grow = { auto: !!b.auto, branch: { 1: side(b.branch && b.branch[1]), 2: side(b.branch && b.branch[2]) } };
  if (pet.grow.auto) autoFill(pet);
  return { ok: true };
}
// サブツリー（研究した 敵の ツリー）を 付ける・はずす。はずした ツリーの SP は もどる
export function petSub(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (onTrip(rec, pet.uid)) return { ok: false, why: "いまは 出かけて いる" };
  const i = Number.isInteger(b.slot) && b.slot >= 0 && b.slot < TREE_SLOTS - 1 ? b.slot : -1;
  if (i < 0) return { ok: false, why: "枠を えらんで" };
  if (b.tree != null && !(rec.lab.includes(b.tree) && has(ENEMY_TREES, b.tree))) return { ok: false, why: "研究した ツリーだけ 付けられる" };
  if (b.tree != null && pet.subs.includes(b.tree)) return { ok: false, why: "もう 付けて いる" };
  const subs = [...pet.subs], old = subs[i];
  if (old) delete pet.taken[old];
  if (b.tree == null) subs.splice(i, 1); else subs[i] = b.tree;
  pet.subs = subs.filter(Boolean);
  return { ok: true };
}
// 手で 振る ステータス（ふやすだけ。へらすのは 振り直しで）
export function petStat(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  const f = b.free && typeof b.free === "object" ? b.free : null, old = pet.free || {};
  if (!f || !Object.keys(f).every((k) => has(BASE_STATS, k) && Number.isInteger(f[k]) && f[k] >= (old[k] || 0))) return { ok: false, why: "ふやす ことだけ できる（へらすのは 振り直し）" };
  if (Object.values(f).reduce((a, v) => a + v, 0) > freeTotal(pet.lv)) return { ok: false, why: "ポイントが 足りない" };
  pet.free = Object.fromEntries(Object.entries({ ...old, ...f }).filter(([, v]) => v > 0));
  return { ok: true };
}
// ガンビット（null で お手本に もどす）。条件は battle-sim.js の COND、行動は 覚えた 技・こうげき・ぼうぎょ
export function petGambits(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (b.list === null) { pet.gambits = null; return { ok: true }; }
  const f = fighterOf(pet, rec), skills = new Set([...f.set, ...learnedAll(pet)]), max = gambitSlots(pet.lv, keywordsOf(pet));
  if (!Array.isArray(b.list) || b.list.length > max) return { ok: false, why: `ガンビットは ${max} こまで` };
  const out = [];
  for (const g of b.list) {
    const c = g && Array.isArray(g.if) ? g.if[0] : "", v = g && Array.isArray(g.if) ? g.if[1] : undefined;
    if (!has(COND_TEXT, c)) return { ok: false, why: "知らない 条件" };
    if (NUM_COND.has(c) ? !(Number.isInteger(v) && v >= 1 && v <= 100) : FX_COND.has(c) ? !has(EFFECTS, v) : v !== undefined) return { ok: false, why: "条件の 数が ちがう" };
    if (!(skills.has(g.do) || g.do === "kogeki" || g.do === "bougyo")) return { ok: false, why: "覚えて いない 技" };
    out.push({ if: v === undefined ? [c] : [c, v], do: g.do, ...(g.on === false ? { on: false } : {}) });
  }
  pet.gambits = out;
  return { ok: true };
}
export function petStyle(rec, b) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (b.style !== null && !STYLES.includes(b.style)) return { ok: false, why: "作戦を えらんで" };
  pet.style = b.style;
  return { ok: true };
}
function learnedAll(pet) { return [pet.type, ...pet.subs].flatMap((id) => learned(id, new Set(pet.taken[id] || []), pet.seed).skills).concat(pet.carry ? [pet.carry] : []); }
function keywordsOf(pet) { return [pet.type, ...pet.subs].reduce((a, id) => a + learned(id, new Set(pet.taken[id] || []), pet.seed).keywords, 0); }

// 装備を 付ける・はずす（ペットは who を 省く、なかまは who に その 子の uid）
export function equipSet(rec, b) {
  const x = b.who ? rec.tamed.find((c) => c.uid === b.who) : petOf(rec);
  if (!x) return { ok: false, why: "その 子は いない" };
  x.equip ||= {};
  if (onTrip(rec, x.uid)) return { ok: false, why: "いまは 出かけて いる" };
  if (!SLOTS3.includes(b.slot)) return { ok: false, why: "枠を えらんで" };
  if (b.uid == null) { delete x.equip[b.slot]; return { ok: true }; }
  const e = rec.own.equip.find((y) => y.uid === b.uid), base = e && baseOf(e.base);
  if (!e || !base) return { ok: false, why: "その 装備は ない" };
  if (base.slot !== b.slot) return { ok: false, why: "その 枠には 付けられない" };
  if (equippedUids(rec).has(e.uid) && x.equip[b.slot] !== e.uid) return { ok: false, why: "ほかの 子が 付けて いる" };
  x.equip[b.slot] = e.uid;
  return { ok: true };
}

// ---------- 振り直し・職業を かえる（1 日 1 回 無料。2 回目から 玉。お金の 計画） ----------
// 振り直し：ツリーの ノードと 手で 振った ステータスを ぜんぶ もどす（自動なら すぐ 取りなおす）
// 職業を かえる：前の 職業ツリーを はずし、前の 職業の 覚えた 技から 1 つ（carry）だけ 持ちこす
export function respecPlan(rec, b, day) {
  const pet = petOf(rec);
  if (!pet || !pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (onTrip(rec, pet.uid)) return { ok: false, why: "いまは 出かけて いる" };
  let job = null;
  if (b.a === "pet.rejob") {
    if (!has(PLANS, b.type) || b.type === pet.type) return { ok: false, why: "かえる 職業を えらんで" };
    const mine = learned(pet.type, new Set(pet.taken[pet.type] || []), pet.seed).skills;
    if (b.carry != null && !mine.includes(b.carry)) return { ok: false, why: "持ちこせるのは 覚えた 技だけ" };
    job = [b.type, b.carry == null ? null : b.carry];
  }
  const free = pet.reset.day !== day || pet.reset.n < 1;
  return { costs: free ? [] : [{ kind: "balls", d: -RESET_PRICE(pet.lv) }], why: (job ? "rejob:" : "respec:") + pet.uid,
    take: () => { if (pet.reset.day !== day) pet.reset = { day, n: 0 }; pet.reset.n++; },
    grant: { petRespec: [pet.uid, job] }, refund: { petUnreset: [pet.uid, day] }, info: { free } };
}
// 渡す（lounge-game.js の give から 呼ぶ）
export function givePet(rec, g) {
  if (g.petRespec) {
    const pet = rec.pets.find((p) => p.uid === g.petRespec[0]); if (!pet) return;
    ensurePet(pet);
    const job = g.petRespec[1];
    if (job) { delete pet.taken[pet.type]; pet.type = job[0]; pet.carry = job[1]; pet.gambits = null; }
    pet.taken = { [pet.type]: [] }; pet.subs.forEach((s) => (pet.taken[s] = [])); pet.free = null;
    if (pet.grow.auto) autoFill(pet);
  }
  if (g.petUnreset) { const pet = rec.pets.find((p) => p.uid === g.petUnreset[0]); if (pet && pet.reset.day === g.petUnreset[1]) pet.reset.n = Math.max(0, pet.reset.n - 1); }
}
