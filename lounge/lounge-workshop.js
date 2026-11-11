// 工房（鹿さんの頼み、2026-10-25）：道具・品を 作る（ws.make）・武器の アタッチメントを 作る（ws.att）・付ける（att.set）・はずす（att.off）・すてる（att.drop）
// 決まりの 中身は 見本の lounge-proto/workshop.js。支払いは 素材 ＋ クレジット（帳簿を 使わない ので その場で 決まる）
// アタッチメントは 記録の own.att に { uid, base, star, ops, on }（on：付けて いる 武器の uid か null）。武器が 合成・売る・届けるで なくなっても、アタッチメントは のこる（付いて いない 扱い）
import { WS_ITEMS, wsOpen, wsLvOk, WS_MAX, ATT_MAX, attBase, rollAtt, baseOf, SMELT_MAX, SMELT_COAL, SMELT_FUEL, FUEL_MAX, fuelOf, furnaces, smeltOf, smeltDone, PROC_MAX, procOpen, procOf } from "./game.js";
import { takeMats, applyTake, give, putMats, makeFee, payUpkeep } from "./lounge-game.js";
import { sale, wsCo } from "./lounge-stock.js";   // 株：道具の 代金は 物ごとの 子会社・アタッチメントは ヴァルコ火器
import { facLv, wsMore, wsSave } from "./game.js";
import { fxOf } from "./lounge-furn.js";   // 部屋の 家具の 効果（2026-11-11。./furn-fx.js）


const newUid = (rec, p) => p + (++rec.uidN).toString(36);
export const ensureWs = (rec) => { rec.own.att ||= []; return rec; };
// 付いて いない アタッチメント（武器が もう ない 物も）
const loose = (rec) => rec.own.att.filter((a) => !a.on || !rec.own.equip.some((e) => e.uid === a.on));

// 道具・品を n こ 作る。b：{ id, n }
// 工房 Lv1〜100（施設の 作り直し、2026-11-03）：道具が 1 こ 多く できる 確率 ＋1% / Lv・素材 −0.3% / Lv（切り上げ）。維持費は 作る たびに
const BANDS = [1, 20, 50, 80];
export function wsMake(rec, b, now = Date.now(), R = Math.random) {
  ensureWs(rec);
  const lv = facLv(rec, "workshop"), r = WS_ITEMS.find((x) => x.id === b.id);
  if (!rec.hideout.workshop) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  if (!r || !wsOpen(r)) return { ok: false, why: "作る 物を えらんで" };   // 作物の いる 物は 大工事の 畑が つながってから
  if (!wsLvOk(r, lv)) return { ok: false, why: `工房 Lv${BANDS[r.lv - 1]} から 作れる` };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= WS_MAX ? b.n : 0;
  if (!n) return { ok: false, why: `作る 数は 1〜${WS_MAX}` };
  const fee = makeFee(rec, "workshop"), cr = r.credits * n + fee;
  if (cr > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (cr - rec.credits).toLocaleString("ja-JP") + (fee ? `（維持費 ${fee} こみ）` : "") };
  const t = takeMats(rec, r.mats.map(([id, k, q]) => [id, Math.max(1, Math.ceil(k * n * (1 - wsSave(lv)))), q || 0]), { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks); rec.credits -= cr - fee; sale(rec, wsCo(r.id), cr - fee); payUpkeep(rec, fee, now);
  let more = 0; for (let i = 0; i < n; i++) if (R() < wsMore(lv)) more++;   // 1 こ 多く できた 回数
  const g = {}; for (const [kind, o] of Object.entries(r.to)) g[kind] = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * n + (more ? Math.min(more, n) : 0)]));
  give(rec, g, now);
  return { ok: true, id: r.id, n, ...(more ? { more } : {}), ...(fee ? { fee } : {}) };
}

// アタッチメントを 1 つ 作る（★と OP は くじ）。b：{ base }
export function wsAtt(rec, b, R, now = Date.now()) {
  ensureWs(rec);
  const lv = facLv(rec, "workshop"), base = attBase(b.base);
  if (!rec.hideout.workshop) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  if (!base) return { ok: false, why: "作る アタッチメントを えらんで" };
  if (loose(rec).length >= ATT_MAX) return { ok: false, why: `付けて いない アタッチメントが いっぱい（${ATT_MAX} こ）。いらない 物を すてて から` };
  const fee = makeFee(rec, "workshop"), cr = base.credits + fee;
  if (cr > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (cr - rec.credits).toLocaleString("ja-JP") + (fee ? `（維持費 ${fee} こみ）` : "") };
  const t = takeMats(rec, base.mats, { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks); rec.credits -= cr - fee; sale(rec, "VLC", cr - fee); payUpkeep(rec, fee, now);
  const att = { uid: newUid(rec, "a"), ...rollAtt(R, base, lv), on: null };
  rec.own.att.push(att);
  return { ok: true, att };
}

// ---------- 加工（鹿さんの 決め、2026-10-31）：作物 → 布・建材（すぐ できる）。b：{ key, n } ----------
// 買った 作物（b）から 作った 物にも b（精錬と 同じ）
export function wsProc(rec, b, now = Date.now()) {
  if (!rec.hideout.workshop) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  const r = procOf(b.key);
  if (!r || !procOpen(r)) return { ok: false, why: "作る 物を えらんで" };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= PROC_MAX ? b.n : 0;
  if (!n) return { ok: false, why: `作る 数は 1〜${PROC_MAX}` };
  const t = takeMats(rec, r.mats.map(([id, k]) => [id, k * n, 0]), { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  const out = r.out || 1, fl = useUnits(t.picks.map((p) => ({ ...p })), r.mats, n), put = putMats(rec, barsOf(r.id, n * out, fl * out), now);   // out：1 回で できる 数（原木 1 → 薪 3）
  return { ok: true, id: r.id, n: n * out, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}

// ---------- 精錬（鹿さんの 決め、2026-10-31）：炉に 鉱石を 入れる（smelt.put）・できた 延べ棒を 受けとる（smelt.take）・やめる（smelt.stop）----------
// rec.smelt[炉の 番号] ＝ { id：延べ棒, n：のこりの 本数, at：いま 作って いる 1 本目を 入れた 時刻, in：まだ 使って いない 素材〈id・q・b〉 } か null。延べ棒は 倉庫へ（いっぱいなら あずかり箱）
// 買った 素材の 印（b：商人の タスクで「派遣で 拾った 物」に 数えない）を 消さない：1 本ずつ 前から 使い、買った 素材を 使った 延べ棒にも b。やめて もどす 素材も 元の 印・品質の まま
const slotOf = (rec, b) => (Number.isInteger(b.slot) && b.slot >= 0 && b.slot < furnaces(rec.hideout.workshop) ? b.slot : -1);   // 炉の 数は 上げた Lv（つまみで 減らさない）
export function smeltPut(rec, b, now = Date.now()) {
  rec.smelt ||= [];
  if (!rec.hideout.workshop) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  const i = slotOf(rec, b), r = smeltOf(b.id);
  if (i < 0) return { ok: false, why: "炉を えらんで" };
  if (rec.smelt[i]) return { ok: false, why: "その 炉は 使って いる" };
  if (!r) return { ok: false, why: "作る 延べ棒を えらんで" };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= SMELT_MAX ? b.n : 0;
  if (!n) return { ok: false, why: `入れる 数は 1〜${SMELT_MAX} 本` };
  const t = takeMats(rec, r.mats.map(([id, k]) => [id, k * n, 0]), { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  const ms = Math.round(r.min * 60000 * (1 - fxOf(rec, "smelt")));   // 家具（暖炉・フロアランプ など）で 早く
  rec.smelt[i] = { id: r.id, n, at: now, ...(ms !== r.min * 60000 ? { ms } : {}), in: t.picks.map((p) => ({ id: p.id, q: p.q, n: p.n, ...(p.b ? { b: 1 } : {}) })) };   // takeMats は 同じ 品質なら 買った 物から 取る
  return { ok: true, slot: i, end: smeltDone(rec.smelt[i], now).end, ...(ms !== r.min * 60000 ? { fast: 1 } : {}) };
}
// 素材の 並び（list：id・q・n・b）から、1 つ ぶん（mats）ずつ k 回 前から 使う。買った 素材（b）を 使った 回数を かえす（list は 減る）
function useUnits(list, mats, k) {
  let flagged = 0;
  for (let j = 0; j < k; j++) {
    let fl = false;
    for (const [id, c] of mats) { let left = c; for (const p of list) { if (p.id !== id || !p.n || !left) continue; const x = Math.min(left, p.n); p.n -= x; left -= x; if (p.b) fl = true; } }
    if (fl) flagged++;
  }
  return flagged;
}
// k 本 ぶんの 素材を f.in の 前から 使う（前の 記録で in が ない 炉は 拾った 物 あつかい）
function useIn(f, k) {
  if (!f.in) return 0;
  const n = useUnits(f.in, smeltOf(f.id).mats, k);
  f.in = f.in.filter((p) => p.n > 0);
  return n;
}
const barsOf = (id, n, flagged) => [...(n - flagged ? [{ id, q: 0, n: n - flagged }] : []), ...(flagged ? [{ id, q: 0, n: flagged, b: 1 }] : [])];
// できた 分を 受けとる（のこりは その まま 続く）
export function smeltTake(rec, b, now = Date.now()) {
  rec.smelt ||= [];
  const i = slotOf(rec, b), f = i >= 0 && rec.smelt[i];
  if (!f) return { ok: false, why: "その 炉は 空いて いる" };
  const d = smeltDone(f, now);
  if (!d.done) return { ok: false, why: `まだ できて いない（あと ${Math.ceil((d.next - now) / 60000)} 分）` };
  const g = { ...f, in: f.in && f.in.map((p) => ({ ...p })) }, put = putMats(rec, barsOf(f.id, d.done, useIn(g, d.done)), now);
  if (d.left) rec.smelt[i] = { ...g, n: d.left, at: f.at + d.done * (f.ms || smeltOf(f.id).min * 60000) }; else rec.smelt[i] = null;
  return { ok: true, id: f.id, got: d.done, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}
// 石炭を くべる（smelt.coal）：のこりの 時間を 1 こ 15 分 ずつ 縮める（f.at を 前に ずらす。のこりより 多くは 使わない）
// 燃料を くべる（b：{ slot, n, id }。id は 薪・石炭・石油。ない ときは 石炭。2026-11-11 鹿さん「石炭の時間短縮を1時間に変更。薪、石油、原油を実装してください。」）
//   1 こで その 燃料の 分 早く 終わる。のこりの 時間に いる 分だけ 使う（多く くべても むだに ならない）。原油は くべられない
export function smeltCoal(rec, b, now = Date.now()) {
  rec.smelt ||= [];
  const i = slotOf(rec, b), f = i >= 0 && rec.smelt[i];
  if (!f) return { ok: false, why: "その 炉は 空いて いる" };
  const fu = fuelOf(b.id == null ? SMELT_COAL.id : b.id);
  if (!fu) return { ok: false, why: b.id === "crude_oil" ? "原油は くべられない（工房の 加工で 石油に する）" : "くべる 物を えらんで" };
  const d = smeltDone(f, now), left = d.end - now, step = fu.min * 60000;
  if (left <= 0) return { ok: false, why: "もう ぜんぶ できて いる" };
  const want = Number.isInteger(b.n) && b.n >= 1 && b.n <= FUEL_MAX ? b.n : 0;
  if (!want) return { ok: false, why: `くべる 数は 1〜${FUEL_MAX} こ` };
  const n = Math.min(want, Math.ceil(left / step));
  const t = takeMats(rec, [[fu.id, n, 0]], { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  f.at -= n * step;
  return { ok: true, slot: i, id: fu.id, used: n, end: smeltDone(f, now).end };
}
// やめる：できた 分は 受けとり、まだの 分の 鉱石と 石炭は もどす（とちゅうの 1 本も もどす）
export function smeltStop(rec, b, now = Date.now()) {
  rec.smelt ||= [];
  const i = slotOf(rec, b), f = i >= 0 && rec.smelt[i];
  if (!f) return { ok: false, why: "その 炉は 空いて いる" };
  const d = smeltDone(f, now), g = { ...f, in: f.in && f.in.map((p) => ({ ...p })) }, bars = barsOf(f.id, d.done, useIn(g, d.done));
  const back = g.in || smeltOf(f.id).mats.map(([id, k]) => ({ id, q: 0, n: k * d.left }));   // のこりの 素材は 入れた ときの 印・品質の まま
  const put = putMats(rec, [...bars, ...back], now);
  rec.smelt[i] = null;
  return { ok: true, id: f.id, got: d.done, back: d.left, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}

// 武器に 付ける（同じ 場所に 付いて いた 物は はずれる）。b：{ att, weapon }
export function attSet(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att), w = rec.own.equip.find((e) => e.uid === b.weapon), base = a && attBase(a.base);
  if (!a || !base) return { ok: false, why: "その アタッチメントは ない" };
  if (!w || (baseOf(w.base) || {}).slot !== "weapon") return { ok: false, why: "付けられるのは 武器だけ" };
  for (const x of rec.own.att) if (x !== a && x.on === w.uid && (attBase(x.base) || {}).kind === base.kind) x.on = null;
  a.on = w.uid;
  return { ok: true };
}
export function attOff(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att);
  if (!a) return { ok: false, why: "その アタッチメントは ない" };
  a.on = null;
  return { ok: true };
}
export function attDrop(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att);
  if (!a) return { ok: false, why: "その アタッチメントは ない" };
  if (a.on && rec.own.equip.some((e) => e.uid === a.on)) return { ok: false, why: "武器に 付いて いる（はずして から）" };
  rec.own.att = rec.own.att.filter((x) => x !== a);
  return { ok: true };
}
