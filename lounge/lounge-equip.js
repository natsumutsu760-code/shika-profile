// 装備開発・スフィア（大工事。鹿さんと カードで 決めた 2026-10-28〜29。ゲームに つないだのは 2026-11-04、鹿さん「全部反映しろ」）
// ・装備開発（bench.dev）：敵の 結晶（えらんだ 段）× 数 ＋ 添える 素材 ＋ クレジット。★は 作業台の Lv で 上限・結晶の 段で 中身。OP なし（枠は 空いて 出る）
// ・スフィアの 鑑定（sphere.look。DEEP LINK/: の ガラク）：中身（OP と ★）が 見える。SPHERE_LOOK クレジット
// ・スフィアを はめる（sphere.set）：装備の 空いた OP の 枠だけ（入れかえは しない。抜くのは コア）。強さは スフィアの ★（コアと 同じ）
// ・素材の OP 抽選（ws.draw。工房）：同じ 敵の 素材 5 こ（同じ 品質）＋ クレジット で 空いた 枠に OP を 1 つ。★は 素材の 品質
import { OPS, baseOf, opCount, KINDS, ALL_OPS, facLv, ISLAND_OPEN, MAT_NAME, MAT_FROM, devNeed, devStarW, devWhere, CRYSTAL_GRADE, benchStarMax, benchTopUp, SPHERE_LOOK, opLive, DRAW, rollDraw } from "./game.js";
import { takeMats, applyTake, makeFee, payUpkeep, feeWhy } from "./lounge-game.js";
import { slotKind, bump } from "./lounge-trade.js";
import { sale, gearCo } from "./lounge-stock.js";   // 株：装備の 代金は 武器 ヴァルコ火器・防具 ローゼル繊工
import { jstDay } from "./lounge-rules.js";
import { uniqueOf, uniqueRecipe, UNIQUE_BENCH_LV } from "./unique-equip.js";
import { uniqueMats } from "./materials.js";
import { fxOf } from "./lounge-furn.js";   // 部屋の 家具の 効果（2026-11-11。./furn-fx.js）


const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
const haveQ = (rec, id, q) => rec.own.mats.filter((m) => m.id === id && (m.q || 0) === q).reduce((a, m) => a + m.n, 0);

// 装備開発。b：{ id："dev.<敵>.<番号>", q：使う 結晶の 段（1〜5） }
export function devPlan(rec, b, R) {
  const lv = facLv(rec, "bench"), fee = makeFee(rec, "bench"), id = String(b.id || ""), need = devNeed(id), base = need && baseOf(id), q = Math.floor(+b.q || 0);
  if (!rec.hideout.bench) return { ok: false, why: "作業台が まだ ない（隠れ家で 作る）" };
  if (lv < 1) return { ok: false, why: "作業台の つまみが 0（隠れ家で 上げる）" };
  if (!need || base.isle > ISLAND_OPEN) return { ok: false, why: "知らない 装備" };
  if (!rec.seen.includes(need.xtal)) return { ok: false, why: `${MAT_NAME[need.xtal]}を まだ 拾って いない（その 敵を たおすと 落とす）` };
  if (lv < need.benchLv) return { ok: false, why: `この 装備は 作業台 Lv${need.benchLv} から` };
  if (!(q >= 1 && q <= 5)) return { ok: false, why: "使う 結晶の 段を えらんで" };
  const have = haveQ(rec, need.xtal, q);
  if (have < need.n) return { ok: false, why: `素材が 足りない：${MAT_NAME[need.xtal]}（${CRYSTAL_GRADE[q]}）あと ${need.n - have}` };
  if (fee + need.credits > (rec.credits || 0)) return { ok: false, why: feeWhy(fee + need.credits, rec, fee) };
  const t = takeMats(rec, [[need.xtal, need.n, q], ...need.mats]);   // 結晶は えらんだ 段だけ（上で 数を たしかめた。品質の 低い 順に 取るので 上の 段は 使わない）
  if (t.why) return { ok: false, why: t.why };
  const star = pickW(R, devStarW(q, benchStarMax(lv), benchTopUp(lv) + fxOf(rec, "star"))), item = { base: base.id, star, ops: [] };   // 先に 引いて おく（id は 表の 正しい 形）
  return { costs: [], why: "dev:" + id, take: () => { rec.own.mats = t.mats; rec.credits -= need.credits; sale(rec, gearCo(id), need.credits); payUpkeep(rec, fee); },
    grant: { equip: [{ ...item, mk: 1 }], ev: { type: "craft", n: 1, star, slot: slotKind(id), cry: q, cryOf: base.tree } },   // タスクの「開発する」に 数える（結晶の 段・どの 敵の 結晶か も）
    refund: { mats: t.taken, credits: need.credits + fee }, item, info: { credits: need.credits, ...(fee ? { fee } : {}) } };
}

// ユニーク装備を 作る（作業台の「ユニーク」。鹿さんの 決め、2026-10-26：島ごとに 10 こ・ボスから まれに ＋ 作って 手に 入れる）。b：{ id：ユニークの id }
// 材料：その 行き先の ボスの 素材 3 ＋ かくし通路の 素材 2 ＋ 3,000 クレジット（unique-equip.js）。レシピは 素材を ぜんぶ 1 回 拾うと 出る（ほかの レシピと 同じ）
// できる 物は ボスから 出る ユニークと 同じ（★5・OP は ★5 の 数 ＋1）。作業台 Lv20（段 2）から。2026-11-05 に 入れた（前は 門番に なかった）
export function uniquePlan(rec, b, R) {
  const u = uniqueOf(String(b.id || "")), lv = facLv(rec, "bench"), fee = makeFee(rec, "bench");
  if (!rec.hideout.bench) return { ok: false, why: "作業台が まだ ない（隠れ家で 作る）" };
  if (lv < 1) return { ok: false, why: "作業台の つまみが 0（隠れ家で 上げる）" };
  const mats = u && u.isle <= ISLAND_OPEN ? uniqueMats(u.dungeon) : null;
  if (!mats) return { ok: false, why: "知らない 装備" };
  const r = uniqueRecipe(u, mats[0], mats[1]), unseen = r.mats.find(([id]) => !rec.seen.includes(id));
  if (unseen) return { ok: false, why: `${MAT_NAME[unseen[0]]}を まだ 拾って いない（レシピは 素材を ぜんぶ 1 回 拾うと 出る）` };
  if (lv < UNIQUE_BENCH_LV) return { ok: false, why: `ユニークは 作業台 Lv${UNIQUE_BENCH_LV} から` };
  if (fee + r.credits > (rec.credits || 0)) return { ok: false, why: feeWhy(fee + r.credits, rec, fee) };
  const t = takeMats(rec, r.mats);
  if (t.why) return { ok: false, why: t.why };
  const pool = Object.keys(OPS), ops = [], n = opCount(u.slot, 5) + 1;
  while (ops.length < n && pool.length) ops.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  const item = { base: u.id, star: 5, ops };
  return { costs: [], why: "uq:" + u.id, take: () => { rec.own.mats = t.mats; rec.credits -= r.credits; sale(rec, gearCo(u.id), r.credits); payUpkeep(rec, fee); },
    grant: { equip: [{ ...item, mk: 1 }], ev: { type: "craft", n: 1, star: 5, slot: slotKind(u.id) } },
    refund: { mats: t.taken, credits: r.credits + fee }, item, info: { credits: r.credits, ...(fee ? { fee } : {}) } };
}

// 鑑定。b：{ uid：スフィア }
export function sphereLook(rec, b, now = Date.now()) {
  const x = (rec.own.spheres || []).find((s) => s.uid === b.uid);
  if (!x) return { ok: false, why: "その スフィアは ない" };
  if (x.known) return { ok: false, why: "もう 鑑定して ある" };
  if ((rec.credits || 0) < SPHERE_LOOK) return { ok: false, why: feeWhy(SPHERE_LOOK, rec, 0) };
  rec.credits -= SPHERE_LOOK; sale(rec, "GLK", SPHERE_LOOK); x.known = true;   // 鑑定料は ガラク・サルベージの 売り上げ（株）
  bump(rec, { type: "appraise", n: 1, star: x.star }, jstDay(now));   // タスク「スフィアを 鑑定する」「鑑定で ★3 以上を 見つける」
  return { ok: true, sphere: { ...x }, credits: SPHERE_LOOK };
}

// まとめて 鑑定（鹿さんの 頼み 2026-11-06「一括か単体か選べるように」）。まだの スフィアを 古い 順に、払える 分だけ。1 こずつの 鑑定と 同じ 値・タスク
export function sphereLookAll(rec, now = Date.now()) {
  const unk = (rec.own.spheres || []).filter((s) => !s.known);
  if (!unk.length) return { ok: false, why: "鑑定する スフィアが ない" };
  const n = Math.min(unk.length, Math.floor(Math.max(0, rec.credits || 0) / SPHERE_LOOK));
  if (n < 1) return { ok: false, why: feeWhy(SPHERE_LOOK, rec, 0) };
  const day = jstDay(now), got = [];
  for (const x of unk.slice(0, n)) { rec.credits -= SPHERE_LOOK; x.known = true; got.push({ op: x.op, star: x.star }); bump(rec, { type: "appraise", n: 1, star: x.star }, day); }
  sale(rec, "GLK", n * SPHERE_LOOK);   // 鑑定料は ガラク・サルベージの 売り上げ（トークン）
  return { ok: true, n, left: unk.length - n, spheres: got, credits: n * SPHERE_LOOK };
}

// はめる。b：{ sphere：スフィアの uid, uid：装備 }
export function sphereSet(rec, b, now = Date.now()) {
  const x = (rec.own.spheres || []).find((s) => s.uid === b.sphere), it = rec.own.equip.find((e) => e.uid === b.uid);
  if (!x) return { ok: false, why: "その スフィアは ない" };
  if (!x.known) return { ok: false, why: "鑑定して いない スフィアは はめられない（DEEP LINK/: の ガラクで 鑑定）" };
  if (!it) return { ok: false, why: "その 装備は ない" };
  if (!ALL_OPS[x.op] || !opLive(x.op)) return { ok: false, why: "この OP は まだ 使えない" };
  const kind = (baseOf(it.base) || {}).slot, n = opCount(KINDS[kind] ? kind : "weapon", it.star);
  if (it.ops.length >= n) return { ok: false, why: n ? "空いた OP の 枠が ない（スフィアは 空いた 枠に だけ はめる）" : "この 装備には OP の 枠が ない" };
  if (it.ops.includes(x.op)) return { ok: false, why: `${ALL_OPS[x.op].label}は もう 付いて いる` };
  it.ops = [...it.ops, x.op];
  if (x.star !== it.star) it.opStar = { ...(it.opStar || {}), [it.ops.length - 1]: x.star };   // 強さは スフィアの ★（コアと 同じ しるし）
  rec.own.spheres = rec.own.spheres.filter((s) => s !== x);
  bump(rec, { type: "sphere", n: 1, star: x.star, slot: slotKind(it.base) }, jstDay(now));   // タスク「スフィアを 防具／武器に はめる」
  return { ok: true, uid: it.uid, op: x.op, star: x.star };
}

// 素材の OP 抽選（工房。鹿さんの 決め 2026-10-29）。b：{ uid：装備, mat：敵の 素材の id, q：品質 1〜5 }
// 出る OP：その 素材の 付きやすい OP 5 割・その 敵の 行き先の 得意な OP 3 割・ほか 2 割（sphere.js の rollDraw）。もう 付いて いる OP は 出ない
export function drawOp(rec, b, R, now = Date.now()) {
  const it = rec.own.equip.find((e) => e.uid === b.uid), id = String(b.mat || ""), q = Math.floor(+b.q || 0);
  const tree = Object.prototype.hasOwnProperty.call(MAT_FROM, id) && !id.startsWith("xtal_") ? MAT_FROM[id] : null, w = tree && devWhere(tree);
  if (!rec.hideout.workshop) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  if (!it) return { ok: false, why: "その 装備は ない" };
  if (!w || (w.d.isle || 1) > ISLAND_OPEN) return { ok: false, why: "使う 敵の 素材を えらんで" };
  if (!(q >= 1 && q <= 5)) return { ok: false, why: "素材の 品質を えらんで" };
  const kind = (baseOf(it.base) || {}).slot, n = opCount(KINDS[kind] ? kind : "weapon", it.star);
  if (it.ops.length >= n) return { ok: false, why: n ? "空いた OP の 枠が ない（素材の OP 抽選は 空いた 枠に だけ）" : "この 装備には OP の 枠が ない" };
  const have = haveQ(rec, id, q);
  if (have < DRAW.mats) return { ok: false, why: `素材が 足りない：${MAT_NAME[id]}（品質 ${q}）あと ${DRAW.mats - have}` };
  const fee = makeFee(rec, "workshop"), price = DRAW.credits[q - 1];
  if (fee + price > (rec.credits || 0)) return { ok: false, why: feeWhy(fee + price, rec, fee) };
  const t = takeMats(rec, [[id, DRAW.mats, q]], { now });   // えらんだ 品質だけ（上で 数を たしかめた）
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks); rec.credits -= price; sale(rec, gearCo(it.base), price); payUpkeep(rec, fee, now);
  const op = rollDraw(id, q, w.d.id, R, it.ops, fxOf(rec, "opGood"));   // 家具（作業灯＋工具かべ）：素材の 得意な OP が 少し 出やすい
  it.ops = [...it.ops, op];
  if (q !== it.star) it.opStar = { ...(it.opStar || {}), [it.ops.length - 1]: q };   // 強さは 素材の 品質の ★
  return { ok: true, uid: it.uid, op, star: q, slot: slotKind(it.base), credits: price, ...(fee ? { fee } : {}) };
}
