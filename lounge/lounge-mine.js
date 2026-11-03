// 坑道（鹿さんの頼み、2026-10-25）。決まりの 中身は 見本の lounge-proto/mine.js
// 受付：mine.set {uid, on}・mine.collect・mine.use {item}。記録：rec.mine = { on: [{ uid, at }], pickaxe?, lamp? }
// 前は 隠れ家の 畑（farm.*）も ここに あったが、2026-11-03 に 消して 新しい 農園（lounge-farmv.js）に まとめた（鹿さんの 決め）
import { mineSlots, mineHours, mineRate, mineDig, MINE_BOOST, boostH, mineCount } from "./game.js";
import { give } from "./lounge-game.js";

const H = 3600 * 1000;
export function ensureMine(rec) { rec.mine ||= { on: [] }; return rec; }
// ---------- 坑道 ----------
// その 子の 掘った 分を 渡す（時間 ぶん。12 時間で いっぱい）
// つるはし・ランプが 効いて いた 時間（掘った 時間 [a, b] と 効いて いた 時間の 重なり。時間）
// 記録：rec.mine.pickaxe・lamp = [{ from, to }]（切れて から 使い直すと 新しい 行。どの 子も もう 使わない 古い 行は 使う ときに 消す）
const boostNow = (list) => (Array.isArray(list) && list.length ? list[list.length - 1] : null);
function digOut(rec, w, R, now) {
  const c = rec.tamed.find((x) => x.uid === w.uid), h = mineHours(w.at, now);
  if (!c || !h) return [];
  const a = w.at, b = w.at + h * H, rate = mineRate(c.lv), M = rec.mine;
  w.at = now - w.at >= 12 * H ? now : w.at + h * H;   // いっぱいに なって いたら いまから、ちがえば 端数の 時間は のこす
  const n = mineCount(h, rate, a, M.pickaxe), lampN = Math.round((n * boostH(M.lamp, a, b)) / h);
  return [...mineDig(R, rec.hideout.mine || 0, n - lampN), ...(lampN ? mineDig(R, rec.hideout.mine || 0, lampN, true) : [])];
}
// つるはし・ランプを 使う（坑道 ぜんたいに 12 時間。続けて 使うと のびる）。b：{ item }
export function mineUse(rec, b, now = Date.now()) {
  ensureMine(rec);
  if (!(rec.hideout.mine > 0)) return { ok: false, why: "坑道が まだ ない（隠れ家で 作る）" };
  const k = Object.prototype.hasOwnProperty.call(MINE_BOOST, b.item) ? b.item : "";
  if (!k) return { ok: false, why: "使う 物を えらんで" };
  if (rec.hideout.mine < MINE_BOOST[k].lv) return { ok: false, why: `坑道 Lv${MINE_BOOST[k].lv} から` };
  if (!((rec.items || {})[k] > 0)) return { ok: false, why: "持って いない（工房で 作る）" };
  rec.items[k]--;
  const L = Array.isArray(rec.mine[k]) ? rec.mine[k] : [], x = boostNow(L), add = MINE_BOOST[k].h * H;
  if (x && x.to > now) x.to += add; else L.push({ from: now, to: now + add });
  const oldest = Math.min(now, ...rec.mine.on.map((w) => w.at));
  rec.mine[k] = L.filter((y) => y.to > oldest);
  return { ok: true, item: k, to: boostNow(rec.mine[k]).to };
}
const merge = (list) => { const out = []; for (const m of list) { const x = out.find((y) => y.id === m.id); if (x) x.n += m.n; else out.push({ ...m }); } return out; };
// 掘らせる（on）・やめる（off。掘った 分は 渡す）。b：{ uid, on }
export function mineSet(rec, b, R, now = Date.now()) {
  ensureMine(rec);
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
  ensureMine(rec);
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
// 画面に 出す 形（掘った 数を 門番の 時計で）。/api/me の mine
export function mineView(rec, now = Date.now()) {
  ensureMine(rec);
  const mlv = rec.hideout.mine || 0;
  return { slots: mineSlots(mlv, rec.hideout.dig || 0), pickaxe: rec.mine.pickaxe || [], lamp: rec.mine.lamp || [], now,
    on: rec.mine.on.map((w) => { const c = rec.tamed.find((x) => x.uid === w.uid); return { uid: w.uid, at: w.at, h: mineHours(w.at, now), rate: mineRate(c && c.lv) }; }) };
}
