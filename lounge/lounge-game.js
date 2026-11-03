// プライベートラウンジ 4 だんかい目：ペット（1 匹目・職業・Lv）・派遣・隠れ家（施設）・作業台・あずかり箱・なかま（懐柔・研究）
// 1 人分の 記録（rec）だけを 見て かえる。玉と リソースは ここでは 使わない（viewer.js の charge が 帳簿で 使う）
// お金が いる やることは「計画」を 返す：{ costs: [{ kind, d }], why, take, grant, refund }
//   take：いま 取る 物（素材・クレジット・装備）。払えた とき・返事を 待つ ときに 取る（待つ あいだに ほかで 使われない ように）
//   grant：払えたら 渡す 物。refund：返事を 待った すえに 払えなかったら もどす 物（どちらも しまえる 形の データ）
// 数は すべて 案（鹿さんと これから 決める）
import { PETS, QUIZ, score, unlockCost, PLANS, ENEMY_TREES, petAt, tripInit, tripStep, tripResult, floorsOpen, newProgress, diaryOf, dungeonRatio, tamedOf, rankOf, rng, DUNGEONS, canGo, tripCost, RUNS, TICK, TOOLS, TOOL_MAX, PURPOSES, SNACK_NEED, SNACK_PRICE, RESEARCH, researchLeaf, detailOpen, nutAway, mysteryRoll, bagOf, MAP_STAIRS,
  FACILITIES, STORAGE_CAP, EQUIP_CAP, SNACK_RECIPES, snackMats, snackMade, SNACK_CRAFT_MAX, facCap, toStash, stashHave, BOX_DAYS, MAT_NAME, MAT_FROM, CRAFT, SYNTH, craftOpen, synthOpen, synthBalls, rollCraft, rollSynth, sexOf, sexByUid, OPS, BOSS_CORE, baseOf, comboOf, opCount, SCRAP_BALLS, SCRAP_CREDITS, recycleOf, AUTO_SELL_STARS, AUTO_SELL_HOW, autoSellOf, GATHER, mapExtra, invaderFighter } from "./game.js";
import { jstDay } from "./lounge-rules.js";
import { ensureTrade, giveTrade, bump, tripEvents } from "./lounge-trade.js";
import { ensureReq, giveReq } from "./lounge-req.js";
import { ensurePet, autoFill, fighterOf, mateOf, givePet, equippedUids, moveOldSlots } from "./lounge-pet.js";

export const LV_MAX = Infinity;                            // ペットと なかまの Lv に 上限は ない（鹿さんの決め、2026-10-25。前は 40。ステータスも Lv と いっしょに 伸びつづける）
// つぎの Lv までの 経験値（案）：Lv×Lv÷2。Lv10 までは 半分（はじめは ひとりなので。鹿さんの決め、2026-10-24）
// 10 分の 派遣 1 回で ハルス街道 Lv3 ひとり 1・3 体 6、水晶洞窟 Lv30 3 体 105 くらい
export const expNeed = (lv) => Math.ceil((lv * lv) / (lv < 10 ? 4 : 2));
export const JOBS = Object.keys(PLANS);                    // アタッカー・キャスター・テクニシャン・ヒーラー・ディフェンダー
export const EQUIP_MAX = EQUIP_CAP[0];                     // 装備を 持てる 数（はじめ。武器庫で 増える＝equipCap）。こえた 分は あずかり箱へ
export const FURN_MAX = 99;                                // 同じ 家具を 持てる 数
export const TRIP_KEEP = 10;                               // 終わった 派遣を のこす 数（結果を 見る ため）
export const PARTY_MAX = 2;                                // パーティは ペット ＋ なかま 2 体
export const LAB_OFF = [0, 0.2, 0.35, 0.5, 0.65];          // 研究所の Lv で 研究の リソースが 安く なる（Lv4 は ニライ諸島が 開いてから）
const DAY = 864e5;

// 前の 記録に ない 入れ物を 足す
export function ensure(rec) {
  rec.pets ||= []; rec.tamed ||= []; rec.hideout ||= {}; rec.credits ||= 0; rec.snacks ||= 0; rec.tools ||= { lure: 0, net: 0, tea: 0 };
  rec.explore ||= {}; rec.trips ||= []; rec.seen ||= []; rec.uidN ||= 0; rec.party ||= []; rec.lab ||= [];
  rec.met ||= metOf(rec);
  for (const c of rec.tamed || []) c.sex ||= sexByUid(c.uid);   // 配合の 性別（前から いる 子は uid で 決まった くじ）
  rec.own.mats ||= []; rec.own.box ||= []; rec.own.equip ||= [];
  rec.pets.forEach(ensurePet); rec.tamed.forEach((c) => (c.equip ||= {}));
  for (const x of [...rec.pets, ...rec.tamed]) moveOldSlots(x, rec);   // 前の 枠（おまけ）→ 武器
  return ensureReq(ensureTrade(rec));
}
const newUid = (rec, p) => p + (++rec.uidN).toString(36);
// 会った ことの ある 敵（探索の 地図で 名前を 見せる。鹿さんの決め、2026-10-28）。前からの 記録は、拾った 敵の 素材・なかま・研究・たおした ボスから 決める
function metOf(rec) {
  const m = new Set([...rec.seen.map((id) => MAT_FROM[id]), ...rec.tamed.map((c) => c.tree), ...rec.lab]);
  for (const d of DUNGEONS) if (rec.explore[d.id] && rec.explore[d.id].bossKills) m.add(d.boss.tree);
  return [...m].filter(Boolean);
}
const see = (rec, ids) => { for (const id of ids) if (!rec.seen.includes(id)) rec.seen.push(id); };   // 手に 入れた ことの ある 素材・装備（レシピが 出る）
const matName = (id) => MAT_NAME[id] || id;
const facName = (id) => (FACILITIES.find((f) => f.id === id) || { name: id }).name;

// ---------- 倉庫と あずかり箱 ----------
// 倉庫は どの しゅるいも 置ける。上限は 1 しゅるい（素材の id）ごと（鹿さんの決め、2026-10-25）
export const stashCap = (rec) => STORAGE_CAP[rec.hideout.storage || 0] + (rec.perks && rec.perks.shelf ? 25 : 0);   // ボルトの 倉庫の棚で 1 しゅるい ＋25
export const stashUsed = (rec) => rec.own.mats.reduce((a, m) => a + m.n, 0);
// b：店や 商人から 買った・もらった 物（タスクで 納められるのは 派遣で 拾った 物だけ）。山は b ごとに 分ける
const addMat = (rec, m) => { const b = m.b ? 1 : 0, x = rec.own.mats.find((y) => y.id === m.id && y.q === (m.q || 0) && (y.b ? 1 : 0) === b); if (x) x.n += m.n; else rec.own.mats.push({ id: m.id, q: m.q || 0, n: m.n, ...(b ? { b } : {}) }); };
// 素材を 倉庫へ。入らない 分は あずかり箱へ（7 日。いい物から 倉庫に 入れる）
export function putMats(rec, mats, now) {
  const { stash, box } = toStash(mats.filter((m) => m.n > 0).map((m) => ({ id: m.id, q: m.q || 0, n: m.n, ...(m.b ? { b: 1 } : {}) })), stashCap(rec), stashHave(rec.own.mats));
  stash.forEach((m) => addMat(rec, m));
  box.forEach((m) => rec.own.box.push({ id: m.id, q: m.q, n: m.n, ...(m.b ? { b: 1 } : {}), until: now + BOX_DAYS * DAY }));
  see(rec, mats.map((m) => m.id));
  return { stash, box };
}
// 装備を 持てる 数：武器庫の Lv（鹿さんの頼み、2026-10-25）
export const equipCap = (rec) => EQUIP_CAP[Math.max(0, Math.min(EQUIP_CAP.length - 1, rec.hideout.armory || 0))];
// 装備を 持ち物へ。持てる 数を こえた 分は あずかり箱へ
export function putEquip(rec, items, now) {
  const cap = equipCap(rec);
  for (const it of items) {
    const x = { uid: it.uid || newUid(rec, "e"), base: it.base, star: it.star, ops: [...(it.ops || [])], ...(it.opStar ? { opStar: { ...it.opStar } } : {}), ...(it.fx ? { fx: true } : {}), ...(it.b ? { b: 1 } : {}) };
    if (rec.own.equip.length < cap) rec.own.equip.push(x); else rec.own.box.push({ equip: x, until: now + BOX_DAYS * DAY });
  }
  see(rec, items.map((it) => { const c = comboOf(it.base); return c ? "f:" + c.form : it.base; }));   // 組み合わせの 装備は 形だけ おぼえる（しゅるいが 何千も あるので）
}
export const dropOld = (rec, now) => { rec.own.box = rec.own.box.filter((x) => x.until > now); };
// あずかり箱から うけとる（入るだけ。いい物から）
export function boxTake(rec, now) {
  dropOld(rec, now);
  if (!rec.own.box.length) return { ok: false, why: "あずかり箱は からっぽ" };
  const { stash, box } = toStash(rec.own.box.filter((x) => !x.equip), stashCap(rec), stashHave(rec.own.mats)), eq = rec.own.box.filter((x) => x.equip);
  const eqIn = eq.slice(0, Math.max(0, equipCap(rec) - rec.own.equip.length));
  const took = stash.reduce((a, m) => a + m.n, 0) + eqIn.length;
  if (!took) return { ok: false, why: eq.length && !rec.own.box.some((x) => !x.equip) ? "装備が いっぱい（武器庫を 強化するか、装備を 手放して から）" : "倉庫の その しゅるいが いっぱい（倉庫を 強化するか、素材を 使って から）" };
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
  if (g.box) for (const m of g.box) if (m.until > now) rec.own.box.push({ id: m.id, q: m.q || 0, n: m.n, ...(m.b ? { b: 1 } : {}), until: m.until });   // あずかり箱から 取った 物は 元の 期限で 箱へ もどす（期限を のばさない）
  if (g.equip) putEquip(rec, g.equip, now);
  if (g.credits) rec.credits += g.credits;
  if (g.snacks) rec.snacks += g.snacks;
  if (g.hideout) { const f = FACILITIES.find((x) => x.id === g.hideout); rec.hideout[g.hideout] = Math.min(f ? f.lv.length : 3, (rec.hideout[g.hideout] || 0) + 1); }   // 上限は その 施設の Lv の 数（前は 3 で 止まり、Lv4 は 払うだけで 上がらなかった。2026-10-26）
  if (g.tame) { const c = rec.tamed.find((x) => x.uid === g.tame[0]); if (c) c.gauge = Math.min(SNACK_NEED[rankOf(c)], c.gauge + g.tame[1]); }
  if (g.lab && !rec.lab.includes(g.lab)) rec.lab.push(g.lab);
  if (g.bye) { const u = g.bye; rec.tamed = rec.tamed.filter((x) => x.uid !== u); rec.party = rec.party.filter((x) => x !== u); if (rec.mine) rec.mine.on = rec.mine.on.filter((w) => w.uid !== u); }   // 進化した スキルを 取り出した なかまと おわかれ
  if (g.voidTrip) { const t = rec.trips.find((x) => x.uid === g.voidTrip); if (t && !t.done) t.void = 1; }   // 派遣の 玉が あとで 払えなかったと わかった（返事が おくれた とき）：その 派遣の 収穫は なし
  giveTrade(rec, g, now);                        // 友好度・とくべつな 品・道具・レシピ・買い取りの 上乗せ・売りきれの もどし
  giveReq(rec, g, now);                          // みんなの依頼（送る・やめる・もらった 物・もどった 物）
  givePet(rec, g);                               // 振り直し・職業を かえる
  if (g.pet) addPet(rec, g.pet);                 // アメジストで むかえた 子（払えたと わかった とき）
  if (g.ev) bump(rec, g.ev, jstDay(now));        // タスクに 数える（作る・合成・おやつ。物を 渡せた ときだけ）
}

// ---------- ペット（1 匹目・職業） ----------
// 性格診断の 答え（9 問・0〜3）から 来る子を 決める。同点なら pick（はこを えらぶ）
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
// ---------- 2 匹目からの 解放と いまの 子（鹿さんの 決め、2026-10-31）----------
// 12 匹から えらぶ。2 匹目は 無料（すぐ）、3 匹目から アメジスト（UNLOCK）。Lv・職業・ツリーは 1 匹ずつ べつ（Lv1 から）
// いまの 子は 1 匹：部屋・配信の 戦い・派遣は rec.pets[0]。かえると その 子を 先頭に うつす（ほかの 計算は 1 匹目を 見た まま）
export function petUnlockPlan(rec, b, unknown = [], R = Math.random) {
  if (!rec.pets.length) return { ok: false, why: "まず 1 匹目を むかえて（性格診断）" };
  const qid = typeof b.qid === "string" && Object.prototype.hasOwnProperty.call(PETS, b.qid) ? b.qid : "";
  if (!qid) return { ok: false, why: "知らない 子" };
  if (rec.pets.some((p) => p.qid === qid)) return { ok: false, why: "もう いっしょに いる" };
  if (unknown.some((x) => x.grant && x.grant.pet)) return { ok: false, wait: true, why: "前の 子の 支払いを たしかめて います（配信の 画面が こたえたら むかえられます）" };   // 返事待ちの あいだに 同じ 値段で 2 匹 払わない
  const cost = unlockCost(rec.pets.length), pet = { qid, seed: Math.floor(R() * 2 ** 31) };
  if (cost == null) return { ok: false, why: "もう みんな いる" };
  if (!cost) { const p = addPet(rec, pet); return { ok: true, pet: p, cost: 0 }; }
  return { costs: [{ kind: "res", d: -cost }], why: "pet:" + qid, grant: { pet }, info: { qid, cost } };
}
// むかえた 子を 記録に 入れる（いまの 子は かえない）。もう いる 子なら 何も しない
function addPet(rec, g) {
  if (!PETS[g.qid] || rec.pets.some((p) => p.qid === g.qid)) return null;
  const pet = { uid: newUid(rec, "p"), qid: g.qid, species: PETS[g.qid].sp, name: PETS[g.qid].name, type: null, lv: 1, exp: 0, seed: g.seed };
  ensurePet(pet); rec.pets.push(pet);
  return pet;
}
// いまの 子を かえる。いつでも かえられる。出かけて いる 子は その まま 派遣を つづける（周回も その 子で つづく）
export function petSwitch(rec, b) {
  const i = rec.pets.findIndex((p) => p.uid === b.uid);
  if (i < 0) return { ok: false, why: "その 子は いない" };
  if (i) rec.pets.unshift(...rec.pets.splice(i, 1));
  return { ok: true, pet: rec.pets[0].uid };
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
  const made = snackMade(r, lv, n);   // Lv4 から ふつうの おやつは 2 倍
  if (r.id === "snack") rec.snacks += made; else { rec.items ||= {}; rec.items[r.id] = (rec.items[r.id] || 0) + made; }
  return { ok: true, id: r.id, n: made };
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
  const leaf = researchLeaf(c.tree), t = leaf && takeMats(rec, [leaf], { box: true });   // 希少・ボス・配合は 葉も（大工事の 畑が つながってから）
  if (t && t.why) return { ok: false, why: t.why };
  return { costs: [{ kind: "res", d: -cost }], why: "lab:" + c.tree, grant: { lab: c.tree }, info: { cost, ...(leaf ? { leaf } : {}) },
    ...(t ? { take: () => applyTake(rec, t.picks), refund: { mats: t.picks.filter((p) => !p.box).map(({ id, q, n, b }) => ({ id, q, n, ...(b ? { b: 1 } : {}) })), box: t.picks.filter((p) => p.box).map(({ id, q, n, b, until }) => ({ id, q, n, ...(b ? { b: 1 } : {}), until })) } } : {}) };
}
// 進化した スキル（配合で 受けついだ「＋」の ツリー）を 取り出す（鹿さんの決め、2026-10-25）：なかまとは おわかれ・リソース 200（研究所の Lv で 安く なる）
//   取り出した ツリーは 研究ずみ（rec.lab）に なり、どの ペットでも サブツリーに 付けられる。なかまが いなく なるのは 払えた とき（grant.bye）
//   付けて いた 装備は 持ち物に のこる（配合と 同じ）。出かけて いる 子・坑道で 掘って いる 子は 先に もどす
export const EXTRACT_RES = 200;
export function extractPlan(rec, b, unknown = []) {
  const c = rec.tamed.find((x) => x.uid === b.uid), id = String(b.tree || "");
  if (!c) return { ok: false, why: "その 子は いない" };
  if (!(c.subs || []).includes(id) || !ENEMY_TREES[id] || !ENEMY_TREES[id].evo) return { ok: false, why: "取り出せるのは 進化した スキル（＋）だけ" };
  if (rec.lab.includes(id)) return { ok: false, why: "もう 取り出して ある（ペットの サブツリーに 付けられる）" };
  if (rec.trips.some((t) => !t.done && t.party.includes(c.uid))) return { ok: false, why: "出かけて いる 子は 取り出せない（帰って から）" };
  if (rec.mine && rec.mine.on.some((w) => w.uid === c.uid)) return { ok: false, why: "坑道で 掘って いる 子は 取り出せない（坑道から もどして から）" };
  if (unknown.some((u) => u.grant && (u.grant.lab === id || u.grant.bye === c.uid))) return { ok: false, why: "前の 取り出しが まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const cost = Math.ceil(EXTRACT_RES * (1 - LAB_OFF[rec.hideout.lab || 0]));
  return { costs: [{ kind: "res", d: -cost }], why: "ext:" + id, grant: { lab: id, bye: c.uid }, info: { cost, tree: id } };
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
// check：たしかめるだけ（玉を 払う 前に。記録は かえない）
// who：出かける 子の uid（周回だけ。出かけた 子の まま つづける）。ないときは いまの 子（ブラウザからは えらばせない）
export function tripStart(rec, b, now, seed, check = false, who = null) {
  const pet = (who && rec.pets.find((p) => p.uid === who)) || rec.pets[0];
  if (!pet) return { ok: false, why: "まだ ペットが いない" };
  if (!pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  if (rec.trips.some((t) => !t.done)) return { ok: false, why: "もう 出かけて いる" };
  const own = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);   // 「__proto__」などを 行き先に しない
  const d = DUNGEONS.find((x) => x.id === b.did), run = own(RUNS, b.run) ? b.run : "";
  if (!d || !run) return { ok: false, why: "行き先か 時間が ちがう" };
  const go = canGo(d, rec.hideout, (tid) => (rec.traders && rec.traders[tid] ? rec.traders[tid].n : 1));   // 島 2 は 無線機・かくしは 商人の タスクの 先
  if (!go.ok) return { ok: false, why: go.why };
  const purpose = own(PURPOSES, b.purpose) ? b.purpose : "explore";
  // 道具は ちがう 物を 3 つまで（鹿さんの 決め、2026-10-31。b.tools。前の 形の b.tool も 受ける）
  const raw = Array.isArray(b.tools) ? b.tools : b.tool == null || b.tool === "" ? [] : [b.tool];
  if (raw.some((id) => !own(TOOLS, id))) return { ok: false, why: "知らない 道具" };
  const tools = [...new Set(raw)], tool = tools[0] || null;
  if (tools.length > TOOL_MAX) return { ok: false, why: `道具は ${TOOL_MAX} つまで` };
  if (tools.some((id) => !(rec.tools[id] > 0))) return { ok: false, why: "その 道具を 持って いない" };
  const trees = [...d.foes, d.rare].map((f) => f.tree), wantFoe = purpose === "target" || tools.includes("lure");
  const target = wantFoe && trees.includes(b.target) ? b.target : null;
  if (wantFoe && !target) return { ok: false, why: "敵を えらんで" };
  const prog = rec.explore[d.id] || newProgress(), mates = rec.party.map((u) => rec.tamed.find((c) => c.uid === u)).filter(Boolean);
  const floor = b.floor == null || b.floor === "" || b.floor === 0 ? 0 : b.floor;   // 出発する 階（なしは ふつうの 決め方）
  if (floor && !(Number.isInteger(floor) && floor >= 1 && floor <= floorsOpen(d.id, prog))) return { ok: false, why: "その 階には まだ 行けない" };
  if (check) return { ok: true, cost: tripCost(d) };
  const team = [fighterOf(pet, rec), ...mates.map((c) => mateOf(c, rec))];
  const bag = bagOf(rec.items);   // 戦いの アイテム：持って いる 物を ぜんぶ 持って いく（ガンビットで 使う。使わなかった 物は 帰りに もどる）
  const S = tripInit(team, d.id, run, seed, { purpose, target, tools, floor, progress: prog, lite: true, medic: rec.hideout.medic || 0, stairs: (rec.hideout.maproom || 0) >= MAP_STAIRS, ...(bag ? { items: bag } : {}) });   // 出かけた ときの ようすで 計算する（救護室・地図室も 出かけた ときの Lv）
  for (const id of tools) rec.tools[id]--;   // 道具は 持って いく ときに あずかる（お茶・薬は 使わなかったら 帰りに もどす）
  if (bag) for (const [k, n] of Object.entries(bag)) rec.items[k] -= n;   // 袋も あずかる
  const t = { uid: newUid(rec, "r"), did: d.id, run, purpose, target, tool, ...(tools.length > 1 ? { tools } : {}), ...(floor ? { floor } : {}), party: [pet.uid, ...mates.map((c) => c.uid)], team, seed, ...(bag ? { bag } : {}), ...(rec.hideout.maproom ? { map: rec.hideout.maproom } : {}), ...(rec.hideout.medic ? { med: rec.hideout.medic } : {}), ...((rec.hideout.maproom || 0) >= MAP_STAIRS ? { st: 1 } : {}), start: now, end: now + S.budget * TICK * 1000, done: false, calc: true };   // floor は えらんだ ときだけ（画面も 同じ 階で 計算しなおす）
  // team：出かけた ときの 戦う 形。出かけて いる あいだも スキルツリー・振り分け・ガンビットは かえられるので、画面と 中継は これで 計算しなおす（いまの 形だと 門番と ずれる）
  rec.trips.push(t);
  return { ok: true, trip: tripView(t, now), sim: { uid: t.uid, r0: dungeonRatio(d.id, prog), S } };
}
// 派遣の 計算を 少し 進める（戦い max 回まで）。終わったら true。sim は その場で かわる（しまうのは viewer.js。記録 rec は 読まない）
export const tripCalc = (sim, max = 1) => tripStep(sim.S, max);
// 計算が 終わった 派遣の 中身（got）と 本当の 帰る 時間を 決める（その 派遣が なければ false）
// 侵入の 戦いを オーバーレイの 帯で 見せる 材料（派遣の 計算が 終わった ときに 門番が 送る。帯は simulate(A, B, seed) で 同じ 戦いを 見せる）
export function invadeRelay(rec, sim) {
  const v = sim.S && sim.S.inv, t = rec.trips.find((x) => x.uid === sim.uid), lead = v && sim.S.team[v.who];
  if (!v || !v.done || !t || !lead) return null;
  return { kind: "inv", A: { ...lead.c, owner: rec.name || "" }, B: invaderFighter(v), seed: v.seed, did: t.did, caught: !!v.caught };
}
export function tripDone(rec, sim) {
  const t = rec.trips.find((x) => x.uid === sim.uid && x.calc);
  if (!t || !tripStep(sim.S, 0)) return false;
  const res = tripResult(sim.S), d = res.dungeon, seed = t.seed, tool = t.tool, run = t.run, pet = rec.pets.find((p) => p.uid === t.party[0]) || rec.pets[0];
  const tools = t.tools || (tool ? [tool] : []);
  for (const id of tools) if (TOOLS[id] && TOOLS[id].keep && !(res.toolsUsed ? res.toolsUsed[id] : res.toolUsed)) rec.tools[id] = (rec.tools[id] || 0) + 1;   // 使わなかった お茶・気つけ薬・起こし薬は もどす（笛と ネットは 持って いくと なくなる）
  t.got = {
    exp: res.exp, credits: res.credits, snacks: res.snacks, resource: res.resource,
    materials: res.materials.map(({ id, q, n }) => ({ id, q: q || 0, n })),
    seeds: { ...(res.seeds || {}) },   // 採取で 拾った 種（農園。鹿さんの 決め 2026-11-03）
    equip: [...res.drops.map(({ base, star, ops }) => ({ base, star, ops })), ...(res.mythic ? [mythicItem(res.mythic, rng((seed ^ 0x5bd1e995) >>> 0))] : []), ...(res.unique ? [mythicItem(res.unique, rng((seed ^ 0x2f6e2b1) >>> 0))] : [])],
    captured: res.captured.map((f) => ({ tree: f.tree, type: f.type, lv: f.lv, name: f.name })),
    met: [...new Set(res.battles.flatMap((b) => b.foes.map((f) => f.tree)))],   // 会った 敵（勝ち負けに よらず）
    inv: res.invader ? { tree: res.invader.tree, name: res.invader.name, lv: res.invader.lv, win: !!res.invader.win, caught: !!res.invader.caught } : null,   // 侵入（結晶核は 結晶が できたら 渡す）
    ...(Object.keys(res.itemsUsed || {}).length ? { itemsUsed: res.itemsUsed } : {}),   // 戦いの アイテムを 使った 数
    mythic: res.mythic ? res.mythic.id : null, unique: res.unique ? res.unique.id : null, toolUsed: !!res.toolUsed, reason: res.reason, boss: res.bossDefeated, kills: res.kills, wins: res.wins,
    ratio: [sim.r0, dungeonRatio(d.id, res.progress)], diary: diaryOf(pet ? pet.species : "shika", res), progress: res.progress,
    stats: tripStats(res, run, tools),   // タスクに 数える できごと
  };
  // 地図室（出かけた ときの Lv）：Lv2 から 採取の 素材、Lv3 から ふつうの 敵の 素材が ふえる。派遣の くじとは べつの 種（画面の 計算しなおしが ずれない）
  const mx = t.map >= 2 ? mapExtra(t.map, t.got.materials, d.id, rng((seed ^ 0x2545f491) >>> 0)) : null;
  if (mx && mx.gather + mx.drop) { t.got.materials = mx.mats; t.got.map = { gather: mx.gather, drop: mx.drop }; }
  t.end = t.start + res.ticks * TICK * 1000;
  delete t.calc;
  return true;
}
function tripStats(res, run, tools) {
  const kills = {}, caught = {};
  for (const b of res.battles) for (const f of b.win ? b.foes : (b.kill || []).map((k) => b.foes[k])) kills[f.tree] = (kills[f.tree] || 0) + 1;   // 負けた 戦いで たおせた 敵も 数える
  for (const f of res.captured) caught[f.tree] = (caught[f.tree] || 0) + 1;
  const ch = res.chests.filter((c) => !c.boss);
  return { kills, caught, gather: res.gathered.length, chests: ch.length, hchests: ch.filter((c) => c.hidden).length, rests: res.rests, wipe: res.reason === "wipe", boss: res.bossDefeated ? 1 : 0, run, tool: tools[0] || null, tools };   // tool：前からの「道具なし」の じょうけん
}
// 帰って きた 派遣の ごほうびを うけとる。リソース（ボス）は earn で 帳簿へ
// 玉の 支払いの 返事を まだ 待って いる 派遣か（返事が おくれて 出発した とき。帳簿の unknown に その 派遣の voidTrip が ある）
export const payWaiting = (rec, t) => ((rec.ledger && rec.ledger.unknown) || []).some((x) => x.refund && x.refund.voidTrip === t.uid);
export function tripCollect(rec, b, now) {
  const t = rec.trips.find((x) => !x.done && (!b.uid || x.uid === b.uid));
  if (!t) return { ok: false, why: "出かけて いない" };
  if (now < t.end) return { ok: false, why: "まだ 帰って いない（あと " + Math.ceil((t.end - now) / 1000) + " 秒）" };
  if (t.calc) return { ok: false, why: "まだ 帰って いない（もう 少し）" };
  if (payWaiting(rec, t)) return { ok: false, wait: true, why: "派遣の 玉の 支払いを たしかめて います（配信の 画面が こたえたら 受けとれます）" };   // 払えなかったと あとで わかったら 収穫は なし（voidTrip）。受けとった あとでは 取り消せないので 待つ
  const g = t.got, pet = rec.pets.find((p) => p.uid === t.party[0]);
  if (t.void) Object.assign(g, { exp: 0, credits: 0, snacks: 0, resource: 0, materials: [], seeds: {}, equip: [], captured: [], mythic: null, unique: null, stats: null });   // 玉が 払えなかった 派遣：収穫は なし（探索の 進みは のこす）
  const exp = Math.round(g.exp * (1 + 0.1 * (rec.hideout.gym || 0)));   // トレーニング室：＋10%・20%・30%（Lv4 は 40%）。なかまも ペットと 同じだけ もらう
  const ups = t.party.map((u) => rec.pets.find((p) => p.uid === u) || rec.tamed.find((c) => c.uid === u)).filter(Boolean).map((x) => ({ uid: x.uid, up: levelUp(x, exp), lv: x.lv }));
  for (const p of rec.pets) if (p.type && p.grow && p.grow.auto) autoFill(p);   // 自動なら ふえた SP で ノードを 取る
  const up = ups.length && pet && ups[0].uid === pet.uid ? ups[0].up : 0;
  rec.credits += g.credits; rec.snacks += g.snacks;
  if (g.seeds) { rec.seeds ||= {}; for (const [id, n] of Object.entries(g.seeds)) if (n > 0) rec.seeds[id] = (rec.seeds[id] || 0) + n; }   // 種は 農園の 袋へ
  dropOld(rec, now);
  const put = putMats(rec, g.materials, now);
  // 自動で 売る（設定した ★以下・派遣で 拾った 物だけ）。売った 物は 持ち物に 入れない。結果に のこす（t.sold）
  const A = rec.autoSell, sell = A ? g.equip.filter((it) => autoSellOf(it, A)) : [];
  let sold = null, earnS = [], boxS = 0;
  if (sell.length) {
    const sg = scrapGain(rec, sell, A.how, now, rng((t.seed || 1) + 77));
    sold = { n: sell.length, how: A.how, star: A.star, value: sg.value || 0, mats: (sg.mats || []).reduce((a, m) => a + m.n, 0) };
    earnS = sg.earn || []; boxS = sg.boxed || 0;   // リサイクルの 素材が 倉庫に 入りきらない ときも「いっぱい」（周回を 止める）
    g.equip = g.equip.filter((it) => !sell.includes(it)); t.sold = sold;
  }
  putEquip(rec, g.equip, now);
  if (t.bag) { rec.items ||= {}; for (const [k, n] of Object.entries(t.bag)) { const left = n - ((g.itemsUsed || {})[k] || 0); if (left > 0) rec.items[k] = (rec.items[k] || 0) + left; } }   // 使わなかった 戦いの アイテムを もどす
  // 詳細ステータス（鹿さんの 決め、2026-10-31。開いてから）：派遣中は 満腹度が 早く へる・勝つ たびに ごく まれに 謎のお菓子（べつの 種）
  const mystery = detailOpen() && !t.void ? mysteryRoll(rng(((t.seed || 1) ^ 0x6a09e667) >>> 0), g.wins) : 0;
  if (detailOpen()) for (const u of t.party) { const x = rec.pets.find((p) => p.uid === u) || rec.tamed.find((c) => c.uid === u); if (x) nutAway(x, t.end - t.start, now); }
  if (mystery) { rec.items ||= {}; rec.items.mystery = (rec.items.mystery || 0) + mystery; t.mystery = mystery; }
  const cores = g.stats && g.stats.boss && rng((t.seed || 1) + 91)() < BOSS_CORE ? 1 : 0;   // ボスから まれに ブランクコア（派遣の くじとは べつの 種。画面の 計算しなおしが ずれない）
  if (cores) { rec.items ||= {}; rec.items.blankcore = (rec.items.blankcore || 0) + cores; t.cores = cores; }
  g.captured.forEach((f, i) => rec.tamed.push({ uid: newUid(rec, "t"), ...f, exp: 0, gauge: 0, sex: sexOf(rng((t.seed || 1) + 131 + i)()) }));   // となりの 部屋で 待つ（おやつで 懐柔する）。性別は くじ（♂ 48%・♀ 48%・両性 4%。配合で 使う）
  for (const tr of g.met || []) if (!rec.met.includes(tr)) rec.met.push(tr);
  rec.explore[t.did] = g.progress;
  delete g.progress;   // 進みは explore に うつした（記録を 小さく）
  if (g.stats) tripEvents(rec, t.did, g.stats, jstDay(now));   // DEEP LINK/: の タスクに 数える
  t.done = true; t.at = now; delete t.team;
  rec.trips = [...rec.trips.filter((x) => !x.done), ...rec.trips.filter((x) => x.done).slice(-TRIP_KEEP)];
  return { ok: true, exp, up, lv: pet ? pet.lv : 0, ups, boxed: put.box.reduce((a, m) => a + m.n, 0) + boxS, sold, cores, ...(mystery ? { mystery } : {}), ...(g.itemsUsed ? { used: Object.values(g.itemsUsed).reduce((a, n) => a + n, 0) } : {}), earn: [...(g.resource ? [{ kind: "res", d: g.resource }] : []), ...earnS] };
}
// ---------- 周回（鹿さんの決め、2026-10-25）：帰って きたら 門番が うけとって、同じ 行き先・時間・目的・階で また 出発。画面を とじても 回る ----------
// 回数は 3・5・10・ずっと（0）。倉庫が いっぱいに なったら（入りきらない 素材が あずかり箱に 入ったら）止める。道具は 持って いる 間は 毎回、なければ なしで
// rec.loop = { on, max, n：出発した 回数, cfg, sum：開いた ときに 見せる まとめ, stop：止まった わけ }
export const LOOP_COUNTS = [3, 5, 10, 0];
const emptySum = () => ({ n: 0, exp: 0, up: 0, credits: 0, snacks: 0, resource: 0, mats: 0, equip: 0, sold: 0, caught: 0, wipes: 0, boxed: 0 });
// 出発した ときに：周回を えらんで いれば はじめる（えらんで いなければ 前の 周回は おわり）
export function loopNew(rec, b, now) {
  const t = rec.trips.find((x) => !x.done);
  rec.loop = t && LOOP_COUNTS.includes(b.loop) ? { on: true, max: b.loop, n: 1, cfg: { did: t.did, run: t.run, purpose: t.purpose, target: t.target, tool: t.tool, ...(t.tools ? { tools: t.tools } : {}), floor: t.floor || 0, pet: t.party[0] }, sum: emptySum(), stop: null, at: now } : null;
}
// 周回の ボタン：on で はじめる（出かけて いる 派遣を 1 回めに）・off で 止める（いまの 派遣が 帰ったら おわり）
export function loopSet(rec, b, now) {
  if (!b.on) { if (rec.loop) { rec.loop.on = false; rec.loop.stop = "off"; } return { ok: true }; }
  if (!LOOP_COUNTS.includes(b.count)) return { ok: false, why: "回数を えらんで" };
  const t = rec.trips.find((x) => !x.done);
  if (!t) return { ok: false, why: "出発する ときに えらんで" };
  const sum = rec.loop && rec.loop.sum && rec.loop.sum.n ? rec.loop.sum : emptySum();   // まだ 見て いない まとめは のこす。回して いる 途中に 回数だけ かえる ときは 何回めかも のこす
  rec.loop = { on: true, max: b.count, n: rec.loop && rec.loop.on ? rec.loop.n : 1, cfg: { did: t.did, run: t.run, purpose: t.purpose, target: t.target, tool: t.tool, ...(t.tools ? { tools: t.tools } : {}), floor: t.floor || 0, pet: t.party[0] }, sum, stop: null, at: now };
  return { ok: true };
}
// まとめを 見た（止まって いれば 周回の 記録も 消す）
export function loopSeen(rec) { if (rec.loop) { if (rec.loop.on) rec.loop.sum = emptySum(); else rec.loop = null; } return { ok: true }; }
// うけとった あと：まとめに 足して、つづけるか 決める。つづけるなら つぎの 出発（tripStart の 答え）を 返す
export function loopAfter(rec, g, r, now, seed) {
  const L = rec.loop; if (!L || !L.on) return null;
  const S = L.sum; S.n++; S.exp += r.exp; S.up += r.up || 0; S.credits += g.credits; S.snacks += g.snacks; S.resource += g.resource || 0;
  S.mats += g.materials.reduce((a, m) => a + m.n, 0); S.equip += g.equip.length; S.sold = (S.sold || 0) + (r.sold ? r.sold.n : 0); S.caught += g.captured.length; S.wipes += g.reason === "wipe" ? 1 : 0; S.boxed += r.boxed || 0;
  if (r.boxed) { L.on = false; L.stop = "full"; return null; }   // 倉庫が いっぱい（日が たつと 消える あずかり箱に 入れつづけない）
  if (L.max && L.n >= L.max) { L.on = false; L.stop = "count"; return null; }
  const tools = (L.cfg.tools || (L.cfg.tool ? [L.cfg.tool] : [])).filter((id) => rec.tools[id] > 0), body = { ...L.cfg, tool: undefined, tools }, who = L.cfg.pet || null;   // 切れた 道具は 持たずに つづける   // いまの 子を かえても、周回は 出かけた 子で つづける
  const chk = tripStart(rec, body, now, seed, true, who);
  if (!chk.ok) { L.on = false; L.stop = chk.why; return null; }
  if (chk.cost) return { ok: true, pay: chk.cost, body, seed, who };   // 費用の ある 行き先（ニライ諸島）：玉を 払ってから 出発（viewer.js の loopTick）
  const s = tripStart(rec, body, now, seed, false, who);
  if (!s.ok) { L.on = false; L.stop = s.why; return null; }
  L.n++;
  return s;
}
// アラーム：帰って きた 派遣を うけとって、つぎへ。帰って いない・計算中・周回 なしは 何も しない
export function loopStep(rec, now, seed) {
  const L = rec.loop, t = rec.trips.find((x) => !x.done);
  if (!L || !L.on || !t || t.calc || now < t.end) return null;
  const g = t.got, r = tripCollect(rec, { uid: t.uid }, now);
  if (!r.ok) return null;
  return { uid: t.uid, r, next: loopAfter(rec, g, r, now, seed) };
}
// ---------- 装備を 手放す（鹿さんの決め、2026-10-25）：玉か クレジットで 売る・リサイクルで 素材に。1 こでも まとめてでも ----------
// how：balls（玉は 帳簿へ）・credits・recycle（素材は 倉庫へ。入りきらない 分は あずかり箱）。付けて いる 物は ことわる
export function equipScrap(rec, b, now, R) {
  const how = ["balls", "credits", "recycle"].includes(b.how) ? b.how : null;
  if (!how) return { ok: false, why: "手放し方を えらんで" };
  const uids = Array.isArray(b.uids) ? [...new Set(b.uids.filter((u) => typeof u === "string"))] : [];
  if (!uids.length || uids.length > EQUIP_CAP[EQUIP_CAP.length - 1]) return { ok: false, why: "手放す 装備を えらんで" };   // まとめては 武器庫 Lv3 の 数まで
  const byUid = new Map(rec.own.equip.map((e) => [e.uid, e])), worn = equippedUids(rec), items = uids.map((u) => byUid.get(u));
  if (items.some((e) => !e)) return { ok: false, why: "その 装備は ない" };
  if (items.some((e) => worn.has(e.uid))) return { ok: false, why: "付けて いる 装備は 手放せない（はずして から）" };
  const gone = new Set(uids); rec.own.equip = rec.own.equip.filter((e) => !gone.has(e.uid));
  for (const a of rec.own.att || []) if (gone.has(a.on)) a.on = null;   // 付いて いた アタッチメントは のこす（工房の 決まり）
  return { ok: true, how, n: items.length, ...scrapGain(rec, items, how, now, R) };
}
// 手放した 分を もらう（手放す・自動で 売る で 同じ 値段）。value：もらった 数（credits・balls は 答えの 財布と ぶつかる）
// balls は 帳簿へ（earn）。recycle の 素材は 倉庫へ（入りきらない 分は あずかり箱）
export function scrapGain(rec, items, how, now, R) {
  if (how === "credits") { const value = items.reduce((a, e) => a + SCRAP_CREDITS[e.star], 0); rec.credits += value; return { value }; }
  if (how === "balls") { const value = items.reduce((a, e) => a + SCRAP_BALLS[e.star], 0); return { value, earn: [{ kind: "balls", d: value }] }; }
  // 買った・もらった 装備（b）から 出た 素材にも b を つける（商人の タスクは 派遣で 拾った 物だけ。リサイクルで 印を 消させない）
  const got = new Map(), add = (id, b) => { const k = id + (b ? ":b" : ""), x = got.get(k) || { id, q: 0, n: 0, ...(b ? { b: 1 } : {}) }; x.n++; got.set(k, x); };
  for (const e of items) { const r = recycleOf(e), g = GATHER[r.did]; for (let i = 0; i < r.n; i++) add(g.mats[Math.floor(R() * g.mats.length)][0], e.b); if (r.hidden) add(g.hidden[0], e.b); }
  const mats = [...got.values()], put = putMats(rec, mats, now);
  return { mats, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}
// 自動で 売る 設定（鹿さんの頼み、2026-10-25）：star 0 で やめる。how：credits・balls・recycle
export function autoSellSet(rec, b) {
  const star = Math.floor(+b.star || 0);
  if (!star) { rec.autoSell = null; return { ok: true, autoSell: null }; }
  if (!AUTO_SELL_STARS.includes(star) || !AUTO_SELL_HOW.includes(b.how)) return { ok: false, why: "売る ★と もらう 物を えらんで" };
  rec.autoSell = { star, how: b.how };
  return { ok: true, autoSell: rec.autoSell };
}
export function levelUp(x, exp) {   // 試験からも よぶ
  let up = 0; x.exp = (x.exp || 0) + exp;
  while (x.lv < LV_MAX && x.exp >= expNeed(x.lv)) { x.exp -= expNeed(x.lv); x.lv++; up++; }   // いる 経験値は Lv の 2 乗で ふえるので、1 回で 上がる 数は かぎられる
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
  if (lv >= facCap(f, rec.hideout)) return { ok: false, why: lv < f.lv.length ? `Lv${lv + 1} は 無線機を 作って から（ニライ諸島が 開くと 上げられる）` : "もう いちばん 上の Lv" };
  if (unknown.some((u) => u.grant && u.grant.hideout === f.id)) return { ok: false, why: "前の 強化が まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const need = f.lv[lv].need;
  for (const [fid, flv] of need.fac || []) if ((rec.hideout[fid] || 0) < flv) return { ok: false, why: `${facName(fid)} Lv${flv} が いる` };
  const cr = need.credits || 0;
  if (cr > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (cr - rec.credits) };
  const t = takeMats(rec, need.mats || [], { box: true });   // あずかり箱の 素材も 使える
  if (t.why) return { ok: false, why: t.why };
  return { costs: [["balls", need.balls], ["res", need.res]].filter(([, v]) => v > 0).map(([kind, v]) => ({ kind, d: -v })), why: `hideout:${f.id}:${lv + 1}`,
    take: () => { applyTake(rec, t.picks); rec.credits -= cr; }, grant: { hideout: f.id },
    refund: { mats: t.picks.filter((p) => !p.box).map(({ id, q, n, b }) => ({ id, q, n, ...(b ? { b: 1 } : {}) })), box: t.picks.filter((p) => p.box).map(({ id, q, n, b, until }) => ({ id, q, n, ...(b ? { b: 1 } : {}), until })), credits: cr } };
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
