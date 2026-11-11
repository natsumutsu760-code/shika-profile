// 製材所（2026-11-11 鹿さん「施設に製材所と畑で植林できるようにしてからこれらを実装したいです。」→ カード「時間で 板」「製材所は無し〈薪は 作らない〉」）
// 受付：のこぎり台に 原木を 入れる（saw.put）・できた 板を 受けとる（saw.take）・やめる（saw.stop）。決まりの 中身は 見本の lounge-proto/sawmill.js
// rec.saw[台の 番号] ＝ { id：板, n：のこりの 本数, at：いま 切って いる 1 本目を 入れた 時刻, ms：1 本の 時間, more：1 本で 板が 1 枚 多く できる 確率, in：まだ 使って いない 原木〈id・q・n・b〉 } か null
// 工房の 精錬（lounge-workshop.js の smelt*）と 同じ 形：板は 倉庫へ（いっぱいなら あずかり箱）。買った 原木（b）から 切った 板にも b を 付ける
import { SAW_MAX, sawOf, saws, sawMs, sawMore, sawDone } from "./game.js";
import { takeMats, applyTake, putMats } from "./lounge-game.js";

const slotOf = (rec, b) => (Number.isInteger(b.slot) && b.slot >= 0 && b.slot < saws((rec.hideout || {}).sawmill) ? b.slot : -1);   // 台の 数は 上げた Lv（製材所に つまみは ない）
// 原木の 並び（in）から k 本 前から 使う。買った 原木（b）だった 本数を かえす（in は 減る）
function useLogs(f, k) {
  if (!f.in) return 0;
  let flagged = 0, left = k;
  for (const p of f.in) { if (!left) break; const x = Math.min(left, p.n); p.n -= x; left -= x; if (p.b) flagged += x; }
  f.in = f.in.filter((p) => p.n > 0);
  return flagged;
}
// k 本 切った 板（1 本 out 枚 ＋ くじで 1 枚）。b つきの 原木から 切った 分は b つきの 板
function boardsOf(f, k, flagged, R) {
  const r = sawOf(f.id); let more = 0;
  for (let i = 0; i < k; i++) if (R() < (f.more || 0)) more++;
  const all = k * r.out + more, fb = Math.min(all, flagged * r.out);
  return { list: [...(all - fb ? [{ id: f.id, q: 0, n: all - fb }] : []), ...(fb ? [{ id: f.id, q: 0, n: fb, b: 1 }] : [])], n: all, more };
}

// 入れる。b：{ slot, id：板, n：原木の 本数 }
export function sawPut(rec, b, now = Date.now()) {
  rec.saw ||= [];
  const lv = (rec.hideout || {}).sawmill || 0;
  if (!lv) return { ok: false, why: "製材所が まだ ない（隠れ家で 作る）" };
  const i = slotOf(rec, b), r = sawOf(b.id);
  if (i < 0) return { ok: false, why: "のこぎり台を えらんで" };
  if (rec.saw[i]) return { ok: false, why: "その 台は 使って いる" };
  if (!r) return { ok: false, why: "作る 板を えらんで" };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= SAW_MAX ? b.n : 0;
  if (!n) return { ok: false, why: `入れる 数は 1〜${SAW_MAX} 本` };
  const t = takeMats(rec, [[r.log, n, 0]], { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  rec.saw[i] = { id: r.id, n, at: now, ms: sawMs(r, lv), more: sawMore(lv), in: t.picks.map((p) => ({ id: p.id, q: p.q, n: p.n, ...(p.b ? { b: 1 } : {}) })) };   // 時間と 確率は 入れた ときの Lv で きまる
  return { ok: true, slot: i, end: sawDone(rec.saw[i], now).end };
}
// できた 分を 受けとる（のこりは その まま 続く）
export function sawTake(rec, b, now = Date.now(), R = Math.random) {
  rec.saw ||= [];
  const i = slotOf(rec, b), f = i >= 0 && rec.saw[i];
  if (!f) return { ok: false, why: "その 台は 空いて いる" };
  const d = sawDone(f, now);
  if (!d.done) return { ok: false, why: `まだ できて いない（あと ${Math.ceil((d.next - now) / 60000)} 分）` };
  const g = { ...f, in: f.in && f.in.map((p) => ({ ...p })) }, bo = boardsOf(f, d.done, useLogs(g, d.done), R), put = putMats(rec, bo.list, now);
  rec.saw[i] = d.left ? { ...g, n: d.left, at: f.at + d.done * f.ms } : null;
  return { ok: true, id: f.id, logs: d.done, got: bo.n, ...(bo.more ? { more: bo.more } : {}), boxed: put.box.reduce((a, m) => a + m.n, 0) };
}
// やめる：できた 分は 受けとり、まだの 原木は もどす（とちゅうの 1 本も もどす）
export function sawStop(rec, b, now = Date.now(), R = Math.random) {
  rec.saw ||= [];
  const i = slotOf(rec, b), f = i >= 0 && rec.saw[i];
  if (!f) return { ok: false, why: "その 台は 空いて いる" };
  const d = sawDone(f, now), g = { ...f, in: f.in && f.in.map((p) => ({ ...p })) }, bo = boardsOf(f, d.done, useLogs(g, d.done), R);
  const back = g.in || [{ id: sawOf(f.id).log, q: 0, n: d.left }];   // のこりの 原木は 入れた ときの 印・品質の まま
  const put = putMats(rec, [...bo.list, ...back], now);
  rec.saw[i] = null;
  return { ok: true, id: f.id, got: bo.n, back: d.left, boxed: put.box.reduce((a, m) => a + m.n, 0) };
}
