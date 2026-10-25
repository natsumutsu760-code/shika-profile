// プライベートラウンジ 4 だんかい目：ペット（1 匹目・職業・Lv）・派遣・隠れ家（施設）・作業台・あずかり箱・なかま（懐柔・研究）
// 1 人分の 記録（rec）だけを 見て かえる。玉と リソースは ここでは 使わない（viewer.js の charge が 帳簿で 使う）
// お金が いる やることは「計画」を 返す：{ costs: [{ kind, d }], why, take, grant, refund }
//   take：いま 取る 物（素材・クレジット・装備）。払えた とき・返事を 待つ ときに 取る（待つ あいだに ほかで 使われない ように）
//   grant：払えたら 渡す 物。refund：返事を 待った すえに 払えなかったら もどす 物（どちらも しまえる 形の データ）
// 数は すべて 案（鹿さんと これから 決める）
import { PETS, QUIZ, score, PLANS, petAt, tripInit, tripStep, tripResult, floorsOpen, newProgress, diaryOf, dungeonRatio, tamedOf, rankOf, rng, DUNGEONS, RUNS, TICK, TOOLS, PURPOSES, SNACK_NEED, SNACK_PRICE, RESEARCH,
  FACILITIES, STORAGE_CAP, SNACK_RECIPES, snackMats, SNACK_CRAFT_MAX, toStash, BOX_DAYS, MAT_NAME, CRAFT, SYNTH, craftOpen, synthOpen, synthBalls, rollCraft, rollSynth, OPS, baseOf, comboOf, opCount } from "./game.js";
import { jstDay } from "./lounge-rules.js";
import { ensureTrade, giveTrade, bump, tripEvents } from "./lounge-trade.js";
import { ensureReq, giveReq } from "./lounge-req.js";
import { ensurePet, autoFill, fighterOf, mateOf, givePet, equippedUids, moveOldSlots } from "./lounge-pet.js";

export const LV_MAX = 40;                                  // ペットの Lv の 上限（案）
// つぎの Lv までの 経験値（案）：Lv×Lv÷2。Lv10 までは 半分（はじめは ひとりなので。鹿さんの決め、2026-10-24）
// 10 分の 派遣 1 回で ハルス街道 Lv3 ひとり 1・3 体 6、水晶洞窟 Lv30 3 体 105 くらい
export const expNeed = (lv) => Math.ceil((lv * lv) / (lv < 10 ? 4 : 2));
export const JOBS = Object.keys(PLANS);                    // アタッカー・キャスター・テクニシャン・ヒーラー・ディフェンダー
export const EQUIP_MAX = 200;                              // 装備を 持てる 数（案）。こえた 分は あずかり箱へ
export const FURN_MAX = 99;                                // 同じ 家具を 持てる 数
export const TRIP_KEEP = 10;                               // 終わった 派遣を のこす 数（結果を 見る ため）
export const PARTY_MAX = 2;                                // パーティは ペット ＋ なかま 2 体
export const LAB_OFF = [0, 0.2, 0.35, 0.5];                // 研究所の Lv で 研究の リソースが 安く なる
const DAY = 864e5;

// 前の 記録に ない 入れ物を 足す
export function ensure(rec) {
  rec.pets ||= []; rec.tamed ||= []; rec.hideout ||= {}; rec.credits ||= 0; rec.snacks ||= 0; rec.tools ||= { lure: 0, net: 0, tea: 0 };
  rec.explore ||= {}; rec.trips ||= []; rec.seen ||= []; rec.uidN ||= 0; rec.party ||= []; rec.lab ||= [];
  rec.own.mats ||= []; rec.own.box ||= []; rec.own.equip ||= [];
  rec.pets.forEach(ensurePet); rec.tamed.forEach((c) => (c.equip ||= {}));
  for (const x of [...rec.pets, ...rec.tamed]) moveOldSlots(x, rec);   // 前の 枠（おまけ）→ 武器
  return ensureReq(ensureTrade(rec));
}
const newUid = (rec, p) => p + (++rec.uidN).toString(36);
const see = (rec, ids) => { for (const id of ids) if (!rec.seen.includes(id)) rec.seen.push(id); };   // 手に 入れた ことの ある 素材・装備（レシピが 出る）
const matName = (id) => MAT_NAME[id] || id;
const facName = (id) => (FACILITIES.find((f) => f.id === id) || { name: id }).name;

// ---------- 倉庫と あずかり箱 ----------
export const stashCap = (rec) => STORAGE_CAP[rec.hideout.storage || 0] + (rec.perks && rec.perks.shelf ? 50 : 0);   // ボルトの 倉庫の棚で ＋50
export const stashUsed = (rec) => rec.own.mats.reduce((a, m) => a + m.n, 0);
// b：店や 商人から 買った・もらった 物（タスクで 納められるのは 派遣で 拾った 物だけ）。山は b ごとに 分ける
const addMat = (rec, m) => { const b = m.b ? 1 : 0, x = rec.own.mats.find((y) => y.id === m.id && y.q === (m.q || 0) && (y.b ? 1 : 0) === b); if (x) x.n += m.n; else rec.own.mats.push({ id: m.id, q: m.q || 0, n: m.n, ...(b ? { b } : {}) }); };
// 素材を 倉庫へ。入らない 分は あずかり箱へ（7 日。いい物から 倉庫に 入れる）
export function putMats(rec, mats, now) {
  const { stash, box } = toStash(mats.filter((m) => m.n > 0).map((m) => ({ id: m.id, q: m.q || 0, n: m.n, ...(m.b ? { b: 1 } : {}) })), stashCap(rec) - stashUsed(rec));
  stash.forEach((m) => addMat(rec, m));
  box.forEach((m) => rec.own.box.push({ id: m.id, q: m.q, n: m.n, ...(m.b ? { b: 1 } : {}), until: now + BOX_DAYS * DAY }));
  see(rec, mats.map((m) => m.id));
  return { stash, box };
}
// 装備を 持ち物へ。EQUIP_MAX を こえた 分は あずかり箱へ
export function putEquip(rec, items, now) {
  for (const it of items) {
    const x = { uid: it.uid || newUid(rec, "e"), base: it.base, star: it.star, ops: [...(it.ops || [])], ...(it.fx ? { fx: true } : {}), ...(it.b ? { b: 1 } : {}) };
    if (rec.own.equip.length < EQUIP_MAX) rec.own.equip.push(x); else rec.own.box.push({ equip: x, until: now + BOX_DAYS * DAY });
  }
  see(rec, items.map((it) => { const c = comboOf(it.base); return c ? "f:" + c.form : it.base; }));   // 組み合わせの 装備は 形だけ おぼえる（しゅるいが 何千も あるので）
}
export const dropOld = (rec, now) => { rec.own.box = rec.own.box.filter((x) => x.until > now); };
// あずかり箱から うけとる（入るだけ。いい物から）
export function boxTake(rec, now) {
  dropOld(rec, now);
  if (!rec.own.box.length) return { ok: false, why: "あずかり箱は からっぽ" };
  const { stash, box } = toStash(rec.own.box.filter((x) => !x.equip), stashCap(rec) - stashUsed(rec)), eq = rec.own.box.filter((x) => x.equip);
  const eqIn = eq.slice(0, Math.max(0, EQUIP_MAX - rec.own.equip.length));
  const took = stash.reduce((a, m) => a + m.n, 0) + eqIn.length;
  if (!took) return { ok: false, why: "倉庫が いっぱい（倉庫を 強化するか、素材を 使って から）" };
  stash.forEach((m) => addMat(rec, m)); eqIn.forEach((x) => rec.own.equip.push(x.equip));
  rec.own.box = [...box, ...eq.slice(eqIn.length)];
  return { ok: true, took, left: rec.own.box.length };
}
// 素材を 取る 計算（品質の 低い 物から。同じ 品質なら 買った 物から＝拾った 物を タスクに のこす）。need：[[id, 数, 品質の 下限]]。足りなければ why
// box：あずかり箱の 素材も 使う（施設の 強化。鹿さんの決め、2026-10-25）。同じ 品質なら 箱の 物から（7 日で なくなる ので）。期限の すぎた 物は 使わない。かえす 物に box が つく
export function takeMats(rec, need, { box = false, now = Date.now() } = {}) {
  const mats = rec.own.mats.map((m) => ({ ...m })), bx = box ? rec.own.box.map((x) => ({ ...x })) : [], taken = [], picks = [], short = [];
  const pool = [...mats.map((m) => ({ m, inBox: 0 })), ...bx.filter((x) => !x.equip && x.until > now).map((m) => ({ m, inBox: 1 }))];
  for (const [id, n, qMin = 0] of need) {
    let left = n;
    for (const { m } of pool.filter(({ m }) => m.id === id && (m.q || 0) >= qMin).sort((a, b) => (a.m.q || 0) - (b.m.q || 0) || b.inBox - a.inBox || (b.m.b ? 1 : 0) - (a.m.b ? 1 : 0))) {
      const k = Math.min(left, m.n); if (!k) continue; m.n -= k; left -= k; taken.push({ id, q: m.q || 0, n: k, ...(m.b ? { b: 1 } : {}) });
      picks.push({ id, q: m.q || 0, n: k, b: m.b ? 1 : 0, ...(m.until ? { box: 1, until: m.until } : {}) }); if (!left) break;
    }
    if (left) short.push(`${matName(id)}${qMin > 1 ? `（品質 ${qMin} 以上）` : ""} あと ${left}`);
  }
  return short.length ? { why: "素材が 足りない：" + short.join("・") } : { mats: mats.filter((m) => m.n > 0), ...(box ? { box: bx.filter((x) => x.equip || x.n > 0) } : {}), taken, picks };
}
// 取ると 決めた 物（takeMats の picks）を、その ときの 記録から 引く。写しを 書き戻さない
//   払う 処理は OBS の 返事を 待つ あいだに 前の 分の もどし（素材が 倉庫や 箱に もどる）が 入る ことが ある。写しを 書き戻すと それが 消える
export function applyTake(rec, picks) {
  for (const p of picks) {
    const list = p.box ? rec.own.box : rec.own.mats;
    const x = list.find((m) => !m.equip && m.id === p.id && (m.q || 0) === p.q && (m.b ? 1 : 0) === p.b && (!p.box || m.until === p.until) && m.n > 0);
    if (x) x.n -= Math.min(x.n, p.n);
  }
  rec.own.mats = rec.own.mats.filter((m) => m.n > 0); rec.own.box = rec.own.box.filter((x) => x.equip || x.n > 0);
}

// 渡す 物（grant・refund の データ）を 記録に 入れる
export function give(rec, g, now) {
  if (!g) return;
  for (const [id, n] of Object.entries(g.furniture || {})) rec.own.furniture[id] = Math.min(FURN_MAX, (rec.own.furniture[id] || 0) + n);
  if (g.mats) putMats(rec, g.mats, now);
  if (g.equip) putEquip(rec, g.equip, now);
  if (g.credits) rec.credits += g.credits;
  if (g.snacks) rec.snacks += g.snacks;
  if (g.hideout) rec.hideout[g.hideout] = Math.min(3, (rec.hideout[g.hideout] || 0) + 1);
  if (g.tame) { const c = rec.tamed.find((x) => x.uid === g.tame[0]); if (c) c.gauge = Math.min(SNACK_NEED[rankOf(c)], c.gauge + g.tame[1]); }
  if (g.lab && !rec.lab.includes(g.lab)) rec.lab.push(g.lab);
  giveTrade(rec, g, now);                        // 友好度・とくべつな 品・道具・レシピ・買い取りの 上乗せ・売りきれの もどし
  giveReq(rec, g, now);                          // みんなの依頼（送る・やめる・もらった 物・もどった 物）
  givePet(rec, g);                               // 振り直し・職業を かえる
  if (g.ev) bump(rec, g.ev, jstDay(now));        // タスクに 数える（作る・合成・おやつ。物を 渡せた ときだけ）
}

// ---------- ペット（1 匹目・職業） ----------
// 性格診断の 答え（6 問・0〜3）から 来る子を 決める。同点なら pick（はこを えらぶ）
export function petFirst(rec, b, R) {
  if (rec.pets.length) return { ok: false, why: "もう ペットが いる" };
  const a = Array.isArray(b.answers) && b.answers.length === QUIZ.length && b.answers.every((n, i) => Number.isInteger(n) && n >= 0 && n < QUIZ[i].a.length) ? b.answers : null;
  if (!a) return { ok: false, why: "答えが そろって いない" };
  const { top } = score(a), sp = top.length === 1 ? top[0] : top.includes(b.pick) ? b.pick : "";
  if (!sp) return { ok: false, tie: top, why: "はこを えらんで" };
  // qid：診断の 子（nemu など。絵の 名前）・species：種類（shika など。ステータス適正・日記・3D）
  const pet = { uid: newUid(rec, "p"), qid: sp, species: PETS[sp].sp, name: PETS[sp].name, type: null, lv: 1, exp: 0, seed: Math.floor(R() * 2 ** 31) };
  rec.pets.push(pet);
  return { ok: true, pet };
}
// 職業は 派遣を はじめて 開いた ときに えらぶ（鹿さんの決め、2026-10-23）。かえるのは 振り直しと 同じ（pet.rejob。lounge-pet.js）
export function petJob(rec, b) {
  const pet = rec.pets[0];
  if (!pet) return { ok: false, why: "まだ ペットが いない" };
  if (pet.type) return { ok: false, why: "職業は もう 決まって いる（かえるのは 振り直しから）" };
  if (!JOBS.includes(b.type)) return { ok: false, why: "知らない 職業" };
  pet.type = b.type; pet.taken = { [b.type]: [] }; ensurePet(pet);
  if (pet.grow.auto) autoFill(pet);
  return { ok: true };
}
export { fighterOf, mateOf };   // 戦う ときの ペット・なかま（lounge-pet.js）

// ---------- なかま（懐柔・研究） ----------
// おやつを あげる。あげた 数だけ なかよしゲージが 増える（いっぱいより 多くは あげない）。持って いる おやつが 足りない 分は 玉で 買う（1 こ 50 玉）
export function tameFeedPlan(rec, b, unknown = []) {
  const c = rec.tamed.find((x) => x.uid === b.uid);
  if (!c) return { ok: false, why: "その 子は いない" };
  const room = SNACK_NEED[rankOf(c)] - c.gauge;
  if (room <= 0) return { ok: false, why: "もう なかよし（パーティに 入れられる）" };
  if (unknown.some((u) => u.grant && u.grant.tame && u.grant.tame[0] === c.uid)) return { ok: false, why: "前の おやつが まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const n = Number.isInteger(b.n) && b.n > 0 ? Math.min(b.n, room) : 0;
  if (!n) return { ok: false, why: "あげる 数を えらんで" };
  const use = Math.min(n, rec.snacks), buy = n - use;
  return { costs: buy ? [{ kind: "balls", d: -buy * SNACK_PRICE }] : [], why: "tame:" + c.uid, take: () => { rec.snacks -= use; }, grant: { tame: [c.uid, n], ev: { type: "feed", n } }, refund: use ? { snacks: use } : null, info: { n, buy } };
}
// おやつ工房：素材から おやつを 作る（鹿さんの決め、2026-10-25）。ふつうの おやつは rec.snacks、とくべつおやつは 品（rec.items.snack3）に
export function snackCraft(rec, b) {
  const r = SNACK_RECIPES.find((x) => x.id === b.id), lv = rec.hideout.snack || 0;
  if (!r) return { ok: false, why: "作る 物を えらんで" };
  if (lv < r.lv) return { ok: false, why: lv ? `おやつ工房 Lv${r.lv} から 作れる` : "おやつ工房が まだ ない（隠れ家で 作る）" };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= SNACK_CRAFT_MAX ? b.n : 0;
  if (!n) return { ok: false, why: "作る 数を えらんで" };
  const t = takeMats(rec, snackMats(r, lv).map(([id, k]) => [id, k * n]));
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  if (r.id === "snack") rec.snacks += n; else { rec.items ||= {}; rec.items[r.id] = (rec.items[r.id] || 0) + n; }
  return { ok: true, id: r.id, n };
}
export function tameJoin(rec, b) {
  const c = rec.tamed.find((x) => x.uid === b.uid);
  if (!c) return { ok: false, why: "その 子は いない" };
  if (rec.party.includes(c.uid)) return { ok: false, why: "もう パーティに いる" };
  if (c.gauge < SNACK_NEED[rankOf(c)]) return { ok: false, why: "まだ なかよしゲージが いっぱいで ない" };
  if (rec.party.length >= PARTY_MAX) return { ok: false, why: "パーティが いっぱい（だれかを 部屋に もどすと 入れられる）" };
  rec.party.push(c.uid);
  return { ok: true };
}
export function tameBack(rec, b) {
  if (!rec.party.includes(b.uid)) return { ok: false, why: "パーティに いない" };
  if (rec.trips.some((t) => !t.done && t.party.includes(b.uid))) return { ok: false, why: "いまは 出かけて いる" };
  rec.party = rec.party.filter((u) => u !== b.uid);
  return { ok: true };
}
// 研究：その 子の ツリーを ペットの サブツリーに 付けられる ように する（ツリーごと 1 回。研究しても その 子は いなく ならない）
export function researchPlan(rec, b, unknown = []) {
  const c = rec.tamed.find((x) => x.uid === b.uid);
  if (!c) return { ok: false, why: "その 子は いない" };
  if (rec.lab.includes(c.tree)) return { ok: false, why: "もう 研究ずみ" };
  if (unknown.some((u) => u.grant && u.grant.lab === c.tree)) return { ok: false, why: "前の 研究が まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const cost = Math.ceil(RESEARCH[rankOf(c)] * (1 - LAB_OFF[rec.hideout.lab || 0]));
  return { costs: [{ kind: "res", d: -cost }], why: "lab:" + c.tree, grant: { lab: c.tree }, info: { cost } };
}

// ---------- 派遣 ----------
// ミシック：★5 と 同じ もとの 強さ ＋ OP 5 つ（案）
// ミシック：★5・OP は ★5 の 数 ＋1（ふつうより 1 つ 多い）
function mythicItem(m, R) {
  const pool = Object.keys(OPS), ops = [], n = opCount(m.slot, 5) + 1;
  while (ops.length < n && pool.length) ops.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return { base: m.id, star: 5, ops };
}
// 出かける。同じ 種なら 同じ 結果。早く 終わったら（目的を はたした・力つきた）その ぶん 早く 帰る
// 計算は 出かけた あとに 少しずつ（tripCalc。Cloudflare の 無料の プランは 1 回 10 ミリ秒までなので、戦い 1 回ずつ 呼び出しを 分ける）
//   ここでは 出かける ときの ようす（パーティ・探索の 進み）だけ 決めて、sim（とちゅうの 計算）を 返す。viewer.js が しまって 続きを 計算する
//   計算が 終わるまでは calc: true。帰る 時間（end）は 時間 いっぱいの つもりに して おき、終わったら 本当の 時間に する
export function tripStart(rec, b, now, seed) {
  const pet = rec.pets[0];
  if (!pet) return { ok: false, why: "まだ ペットが いない" };
  if (!pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (rec.trips.some((t) => !t.done)) return { ok: false, why: "もう 出かけて いる" };
  const own = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);   // 「__proto__」などを 行き先に しない
  const d = DUNGEONS.find((x) => x.id === b.did), run = own(RUNS, b.run) ? b.run : "";
  if (!d || !run) return { ok: false, why: "行き先か 時間が ちがう" };
  const purpose = own(PURPOSES, b.purpose) ? b.purpose : "explore";
  const tool = b.tool == null || b.tool === "" ? null : own(TOOLS, b.tool) ? b.tool : undefined;
  if (tool === undefined) return { ok: false, why: "知らない 道具" };
  if (tool && !(rec.tools[tool] > 0)) return { ok: false, why: "その 道具を 持って いない" };
  const trees = [...d.foes, d.rare].map((f) => f.tree), wantFoe = purpose === "target" || tool === "lure";
  const target = wantFoe && trees.includes(b.target) ? b.target : null;
  if (wantFoe && !target) return { ok: false, why: "敵を えらんで" };
  const prog = rec.explore[d.id] || newProgress(), mates = rec.party.map((u) => rec.tamed.find((c) => c.uid === u)).filter(Boolean);
  const floor = b.floor == null || b.floor === "" || b.floor === 0 ? 0 : b.floor;   // 出発する 階（なしは ふつうの 決め方）
  if (floor && !(Number.isInteger(floor) && floor >= 1 && floor <= floorsOpen(d.id, prog))) return { ok: false, why: "その 階には まだ 行けない" };
  const team = [fighterOf(pet, rec), ...mates.map((c) => mateOf(c, rec))];
  const S = tripInit(team, d.id, run, seed, { purpose, target, tool, floor, progress: prog, lite: true });   // 出かけた ときの ようすで 計算する
  if (tool) rec.tools[tool]--;   // 道具は 持って いく ときに あずかる（お茶は 使わなかったら 帰りに もどす）
  const t = { uid: newUid(rec, "r"), did: d.id, run, purpose, target, tool, ...(floor ? { floor } : {}), party: [pet.uid, ...mates.map((c) => c.uid)], team, seed, start: now, end: now + S.budget * TICK * 1000, done: false, calc: true };   // floor は えらんだ ときだけ（画面も 同じ 階で 計算しなおす）
  // team：出かけた ときの 戦う 形。出かけて いる あいだも スキルツリー・振り分け・ガンビットは かえられるので、画面と 中継は これで 計算しなおす（いまの 形だと 門番と ずれる）
  rec.trips.push(t);
  return { ok: true, trip: tripView(t, now), sim: { uid: t.uid, r0: dungeonRatio(d.id, prog), S } };
}
// 派遣の 計算を 少し 進める（戦い max 回まで）。終わったら true。sim は その場で かわる（しまうのは viewer.js。記録 rec は 読まない）
export const tripCalc = (sim, max = 1) => tripStep(sim.S, max);
// 計算が 終わった 派遣の 中身（got）と 本当の 帰る 時間を 決める（その 派遣が なければ false）
export function tripDone(rec, sim) {
  const t = rec.trips.find((x) => x.uid === sim.uid && x.calc);
  if (!t || !tripStep(sim.S, 0)) return false;
  const res = tripResult(sim.S), d = res.dungeon, seed = t.seed, tool = t.tool, run = t.run, pet = rec.pets.find((p) => p.uid === t.party[0]) || rec.pets[0];
  if (tool === "tea" && !res.toolUsed) rec.tools.tea++;   // 使わなかった お茶は もどす（笛と ネットは 持って いくと なくなる）
  t.got = {
    exp: res.exp, credits: res.credits, snacks: res.snacks, resource: res.resource,
    materials: res.materials.map(({ id, q, n }) => ({ id, q: q || 0, n })),
    equip: [...res.drops.map(({ base, star, ops }) => ({ base, star, ops })), ...(res.mythic ? [mythicItem(res.mythic, rng((seed ^ 0x5bd1e995) >>> 0))] : [])],
    captured: res.captured.map((f) => ({ tree: f.tree, type: f.type, lv: f.lv, name: f.name })),
    mythic: res.mythic ? res.mythic.id : null, toolUsed: !!res.toolUsed, reason: res.reason, boss: res.bossDefeated, kills: res.kills, wins: res.wins,
    ratio: [sim.r0, dungeonRatio(d.id, res.progress)], diary: diaryOf(pet ? pet.species : "shika", res), progress: res.progress,
    stats: tripStats(res, run, tool),   // タスクに 数える できごと
  };
  t.end = t.start + res.ticks * TICK * 1000;
  delete t.calc;
  return true;
}
function tripStats(res, run, tool) {
  const kills = {}, caught = {};
  for (const b of res.battles) for (const f of b.win ? b.foes : (b.kill || []).map((k) => b.foes[k])) kills[f.tree] = (kills[f.tree] || 0) + 1;   // 負けた 戦いで たおせた 敵も 数える
  for (const f of res.captured) caught[f.tree] = (caught[f.tree] || 0) + 1;
  const ch = res.chests.filter((c) => !c.boss);
  return { kills, caught, gather: res.gathered.length, chests: ch.length, hchests: ch.filter((c) => c.hidden).length, rests: res.rests, wipe: res.reason === "wipe", boss: res.bossDefeated ? 1 : 0, run, tool };
}
// 帰って きた 派遣の ごほうびを うけとる。リソース（ボス）は earn で 帳簿へ
export function tripCollect(rec, b, now) {
  const t = rec.trips.find((x) => !x.done && (!b.uid || x.uid === b.uid));
  if (!t) return { ok: false, why: "出かけて いない" };
  if (now < t.end) return { ok: false, why: "まだ 帰って いない（あと " + Math.ceil((t.end - now) / 1000) + " 秒）" };
  if (t.calc) return { ok: false, why: "まだ 帰って いない（もう 少し）" };
  const g = t.got, pet = rec.pets.find((p) => p.uid === t.party[0]);
  const exp = Math.round(g.exp * (1 + 0.1 * (rec.hideout.gym || 0)));   // トレーニング室：＋10%・20%・30%。なかまも ペットと 同じだけ もらう
  const ups = t.party.map((u) => rec.pets.find((p) => p.uid === u) || rec.tamed.find((c) => c.uid === u)).filter(Boolean).map((x) => ({ uid: x.uid, up: levelUp(x, exp), lv: x.lv }));
  for (const p of rec.pets) if (p.type && p.grow && p.grow.auto) autoFill(p);   // 自動なら ふえた SP で ノードを 取る
  const up = ups.length && pet && ups[0].uid === pet.uid ? ups[0].up : 0;
  rec.credits += g.credits; rec.snacks += g.snacks;
  dropOld(rec, now);
  const put = putMats(rec, g.materials, now);
  putEquip(rec, g.equip, now);
  for (const f of g.captured) rec.tamed.push({ uid: newUid(rec, "t"), ...f, exp: 0, gauge: 0 });   // となりの 部屋で 待つ（おやつで 懐柔する）
  rec.explore[t.did] = g.progress;
  delete g.progress;   // 進みは explore に うつした（記録を 小さく）
  if (g.stats) tripEvents(rec, t.did, g.stats, jstDay(now));   // DEEP LINK/: の タスクに 数える
  t.done = true; t.at = now; delete t.team;
  rec.trips = [...rec.trips.filter((x) => !x.done), ...rec.trips.filter((x) => x.done).slice(-TRIP_KEEP)];
  return { ok: true, exp, up, lv: pet ? pet.lv : 0, ups, boxed: put.box.reduce((a, m) => a + m.n, 0), earn: g.resource ? [{ kind: "res", d: g.resource }] : [] };
}
function levelUp(x, exp) {
  let up = 0; x.exp = (x.exp || 0) + exp;
  while (x.lv < LV_MAX && x.exp >= expNeed(x.lv)) { x.exp -= expNeed(x.lv); x.lv++; up++; }
  if (x.lv >= LV_MAX) x.exp = 0;
  return up;
}
// 見せる 形（帰る 前は ごほうびを 出さない）
export function tripView(t, now) {
  const { got, ...v } = t;
  if (!t.done && (t.calc || now < t.end)) return v;
  const { progress, ...g } = got;
  return { ...v, got: g };
}

// ---------- 隠れ家の 施設 ----------
export function hideoutPlan(rec, b, unknown = []) {
  const f = FACILITIES.find((x) => x.id === b.id);
  if (!f) return { ok: false, why: "知らない 施設" };
  const lv = rec.hideout[f.id] || 0;
  if (lv >= f.lv.length) return { ok: false, why: "もう いちばん 上の Lv" };
  if (unknown.some((u) => u.grant && u.grant.hideout === f.id)) return { ok: false, why: "前の 強化が まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const need = f.lv[lv].need;
  for (const [fid, flv] of need.fac || []) if ((rec.hideout[fid] || 0) < flv) return { ok: false, why: `${facName(fid)} Lv${flv} が いる` };
  const cr = need.credits || 0;
  if (cr > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (cr - rec.credits) };
  const t = takeMats(rec, need.mats || [], { box: true });   // あずかり箱の 素材も 使える
  if (t.why) return { ok: false, why: t.why };
  return { costs: [["balls", need.balls], ["res", need.res]].filter(([, v]) => v > 0).map(([kind, v]) => ({ kind, d: -v })), why: `hideout:${f.id}:${lv + 1}`,
    take: () => { applyTake(rec, t.picks); rec.credits -= cr; }, grant: { hideout: f.id }, refund: { mats: t.taken, credits: cr } };
}

// ---------- 作業台 ----------
export function craftPlan(rec, b, R) {
  const lv = rec.hideout.bench || 0;
  if (lv < 1) return { ok: false, why: "作業台が まだ ない（隠れ家で 作る）" };
  const r = CRAFT.find((x) => x.base === b.base);
  if (!r) return { ok: false, why: "知らない レシピ" };
  if (!craftOpen(r, new Set(rec.seen)) && !rec.recipes.includes(r.base)) return { ok: false, why: "レシピが まだ 出て いない（素材を ぜんぶ 1 回 拾うと 出る）" };
  const t = takeMats(rec, r.mats);
  if (t.why) return { ok: false, why: t.why };
  const c = charm(rec, rollCraft(R, r, lv), R);   // 先に 引いて おく（返事が なくても 中身は かわらない）
  return { costs: [{ kind: "balls", d: -r.balls }], why: "craft:" + r.base, take: () => { rec.own.mats = t.mats; c.take(); }, grant: { equip: [c.item], ev: { type: "craft", n: 1, star: c.item.star } }, refund: { mats: t.taken, ...c.refund }, item: c.item };
}
export function synthPlan(rec, b, R) {
  const lv = rec.hideout.bench || 0;
  if (lv < 2) return { ok: false, why: "合成は 作業台 Lv2 から" };
  const r = SYNTH.find((x) => x.out === b.out);
  if (!r) return { ok: false, why: "知らない レシピ" };
  if (!synthOpen(r, new Set(rec.seen)) && !rec.recipes.includes(r.out)) return { ok: false, why: "レシピが まだ 出て いない" };
  const main = rec.own.equip.find((e) => e.uid === b.main && e.base === r.main), sub = rec.own.equip.find((e) => e.uid === b.sub && e.base === r.sub);
  if (!main || !sub) return { ok: false, why: "合成する 装備を えらんで" };
  if (equippedUids(rec).has(main.uid) || equippedUids(rec).has(sub.uid)) return { ok: false, why: "付けて いる 装備は 合成できない（はずして から）" };
  const t = takeMats(rec, r.mats);
  if (t.why) return { ok: false, why: t.why };
  const c = charm(rec, rollSynth(R, r, lv), R);
  return { costs: [{ kind: "balls", d: -synthBalls(r, lv) }], why: "synth:" + r.out,
    take: () => { rec.own.mats = t.mats; rec.own.equip = rec.own.equip.filter((e) => e !== main && e !== sub); c.take(); }, grant: { equip: [c.item], ev: { type: "synth", n: 1 } }, refund: { mats: t.taken, equip: [main, sub], ...c.refund }, item: c.item };
}
// くじの お守り（ヨルの 店）を 持って いれば、作る・合成の ★が ＋1（OP も 1 つ ふえる）
function charm(rec, item, R) {
  if (!(rec.items.charm > 0) || item.star >= 5) return { item, take: () => {}, refund: {} };
  const star = item.star + 1, pool = Object.keys(OPS).filter((k) => (OPS[k].from || 1) <= star && !item.ops.includes(k)), more = opCount(baseOf(item.base).slot, star) > item.ops.length;   // ★が 上がって OP の 数が ふえる ときだけ 1 つ 足す
  return { item: { ...item, star, ops: more && pool.length ? [...item.ops, pool[Math.floor(R() * pool.length)]] : item.ops }, take: () => { rec.items.charm--; }, refund: { items: { charm: 1 } } };
}
