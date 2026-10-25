// 畑と 坑道（鹿さんの頼み、2026-10-25）。決まりの 中身は 見本の lounge-proto/farm.js
// 畑：farm.plant {id, plots}・farm.harvest・farm.spr {row, kind}。坑道：mine.set {uid, on}・mine.collect
// 記録：rec.farm = { plots: [{ id, at } | null], spr: [null | スプリンクラーの id] }・rec.mine = { on: [{ uid, at }] }
import { CROPS, cropOf, ROW, plotCount, growMs, SPRINKLERS, harvestPlot, mineSlots, mineHours, mineRate, mineDig } from "./game.js";
import { takeMats, applyTake, give } from "./lounge-game.js";

const H = 3600 * 1000;
export function ensureFarm(rec) {
  rec.farm ||= { plots: [], spr: [] }; rec.mine ||= { on: [] };
  const n = plotCount(rec.hideout.farm || 0, rec.hideout.dig || 0);
  while (rec.farm.plots.length < n) rec.farm.plots.push(null);
  while (rec.farm.spr.length < Math.ceil(n / ROW)) rec.farm.spr.push(null);
  return rec;
}
const ready = (p, lv, now) => p && now >= p.at + growMs(cropOf(p.id), lv);

// 植える。b：{ id, plots: [マスの 番号] }（あいて いる マスだけ。1 マスに 素材 1 こ）
export function farmPlant(rec, b, now = Date.now()) {
  ensureFarm(rec);
  const lv = rec.hideout.farm || 0, crop = cropOf(b.id), F = rec.farm;
  if (!lv) return { ok: false, why: "畑が まだ ない（隠れ家で 作る）" };
  if (!crop) return { ok: false, why: "植える 物を えらんで" };
  const want = Array.isArray(b.plots) ? [...new Set(b.plots)] : [];
  if (!want.length || want.some((i) => !Number.isInteger(i) || i < 0 || i >= F.plots.length)) return { ok: false, why: "マスを えらんで" };
  if (want.some((i) => F.plots[i])) return { ok: false, why: "もう 植えて ある マスが ある" };
  const t = takeMats(rec, [[crop.id, want.length]], { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  for (const i of want) F.plots[i] = { id: crop.id, at: now };
  return { ok: true, n: want.length };
}
// とる（育った マス ぜんぶ）。スプリンクラーの ある 列は 品質が 上がる
export function farmHarvest(rec, R, now = Date.now()) {
  ensureFarm(rec);
  const lv = rec.hideout.farm || 0, F = rec.farm, got = [];
  if (!lv) return { ok: false, why: "畑が まだ ない（隠れ家で 作る）" };
  F.plots.forEach((p, i) => { if (!ready(p, lv, now)) return; got.push(...harvestPlot(R, cropOf(p.id), F.spr[Math.floor(i / ROW)])); F.plots[i] = null; });
  if (!got.length) return { ok: false, why: "まだ とれる マスが ない" };
  const mats = []; for (const m of got) { const x = mats.find((y) => y.id === m.id && y.q === m.q); if (x) x.n += m.n; else mats.push({ ...m }); }
  give(rec, { mats }, now);
  return { ok: true, got: mats };
}
// スプリンクラーを 置く・はずす（kind が null）。前の 物は 持ち物へ もどる
export function farmSpr(rec, b) {
  ensureFarm(rec);
  const F = rec.farm, row = b.row, kind = b.kind == null ? null : String(b.kind);
  if (!(rec.hideout.farm > 0)) return { ok: false, why: "畑が まだ ない（隠れ家で 作る）" };
  if (!Number.isInteger(row) || row < 0 || row >= F.spr.length) return { ok: false, why: "列を えらんで" };
  if (kind !== null && !SPRINKLERS.includes(kind)) return { ok: false, why: "スプリンクラーを えらんで" };
  if (kind && !(rec.items[kind] > 0)) return { ok: false, why: "その スプリンクラーを 持って いない（工房で 作る）" };
  if (F.spr[row] === kind) return { ok: true };
  if (F.spr[row]) rec.items[F.spr[row]] = (rec.items[F.spr[row]] || 0) + 1;
  if (kind) rec.items[kind]--;
  F.spr[row] = kind;
  return { ok: true };
}

// ---------- 坑道 ----------
// その 子の 掘った 分を 渡す（時間 ぶん。12 時間で いっぱい）
function digOut(rec, w, R, now) {
  const c = rec.tamed.find((x) => x.uid === w.uid), h = mineHours(w.at, now);
  if (!c || !h) return [];
  w.at = now - w.at >= 12 * H ? now : w.at + h * H;   // いっぱいに なって いたら いまから、ちがえば 端数の 時間は のこす
  return mineDig(R, rec.hideout.mine || 0, h * mineRate(c.lv));
}
const merge = (list) => { const out = []; for (const m of list) { const x = out.find((y) => y.id === m.id); if (x) x.n += m.n; else out.push({ ...m }); } return out; };
// 掘らせる（on）・やめる（off。掘った 分は 渡す）。b：{ uid, on }
export function mineSet(rec, b, R, now = Date.now()) {
  ensureFarm(rec);
  const M = rec.mine, lv = rec.hideout.mine || 0, w = M.on.find((x) => x.uid === b.uid);
  if (!lv) return { ok: false, why: "坑道が まだ ない（隠れ家で 作る）" };
  if (!b.on) {
    if (!w) return { ok: false, why: "その 子は 掘って いない" };
    const mats = merge(digOut(rec, w, R, now)); M.on = M.on.filter((x) => x !== w);
    if (mats.length) give(rec, { mats }, now);
    return { ok: true, got: mats };
  }
  const c = rec.tamed.find((x) => x.uid === b.uid);
  if (!c) return { ok: false, why: "その 子は いない" };
  if (w) return { ok: false, why: "もう 掘って いる" };
  if (rec.party.includes(c.uid)) return { ok: false, why: "パーティの 子は 掘れない（部屋に もどすと 掘れる）" };
  if (rec.trips.some((t) => !t.done && t.party.includes(c.uid))) return { ok: false, why: "いまは 出かけて いる" };
  if (M.on.length >= mineSlots(lv, rec.hideout.dig || 0)) return { ok: false, why: "掘る 場所が いっぱい（坑道の Lv で ふえる）" };
  M.on.push({ uid: c.uid, at: now });
  return { ok: true };
}
// うけとる（掘って いる 子 ぜんぶの 分）
export function mineCollect(rec, R, now = Date.now()) {
  ensureFarm(rec);
  if (!(rec.hideout.mine > 0)) return { ok: false, why: "坑道が まだ ない（隠れ家で 作る）" };
  const mats = merge(rec.mine.on.flatMap((w) => digOut(rec, w, R, now)));
  if (!mats.length) return { ok: false, why: "まだ 掘れて いない（1 時間ごとに たまる）" };
  give(rec, { mats }, now);
  return { ok: true, got: mats };
}
// パーティに 入る 子は 坑道を やめる（掘った 分は 渡す）。tame.join の 前に 呼ぶ
export function mineLeave(rec, uid, R, now = Date.now()) {
  if (!rec.mine || !rec.mine.on.some((x) => x.uid === uid)) return null;
  return mineSet(rec, { uid, on: false }, R, now);
}
// 画面に 出す 形（育つ 時間・掘った 数を 門番の 時計で）
export function farmView(rec, now = Date.now()) {
  ensureFarm(rec);
  const lv = rec.hideout.farm || 0, mlv = rec.hideout.mine || 0;
  return {
    plots: rec.farm.plots.map((p) => (p ? { id: p.id, at: p.at, end: p.at + growMs(cropOf(p.id), lv) } : null)), spr: rec.farm.spr,
    mine: { slots: mineSlots(mlv, rec.hideout.dig || 0), on: rec.mine.on.map((w) => { const c = rec.tamed.find((x) => x.uid === w.uid); return { uid: w.uid, at: w.at, h: mineHours(w.at, now), rate: mineRate(c && c.lv) }; }) },
    now,
  };
}
export { CROPS };
