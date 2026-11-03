// 隠れ家の 施設の 建設と つまみ（施設の 作り直し。鹿さんの 決め、2026-10-29 の 11〜14 回目の カード・2026-11-03「施設から」。数は docs/mono-link-numbers.md の 4 章）
// 決まりの 中身は lounge-proto/facilities.js。記録：
//   rec.hideout[id]：上げた Lv（0〜100。無線機は 0〜1）
//   rec.knob[id]：えらんだ Lv（つまみ。上げた Lv までの どこでも。ない ときは 上げた Lv）。効果と 維持費は この Lv
//   rec.build[id]：建てて いる 途中 { to, at, ms, skip, mats: [[id, n]], put: { id: n } }。クレジットは 始める ときに 払う
//   rec.labQ：研究の 途中 [{ tree, at }]（研究所。時間が 来たら rec.lab へ）
// 受付：fac.start {id}・fac.put {id, mat?, n?}・fac.rush {id}（グラナート建設）・fac.fuel {id, n}（ヘリクス電力）・fac.knob {id, lv}
// タスクに 数える できごと：built（建て終わった）・facput（素材を 入れた）・rush（グラナート建設に 頼んだ）・knob（つまみを かえた）。維持費は lounge-game.js の payUpkeep（upkeep）
import { FACILITIES, facOf, facCap, facMax, hasKnob, facLv, buildNeed, buildProg, buildMatRatio, buildTimeRatio, buildLeftMs, rushPrice, FUEL, MIGRATE_LV, upkeep, facFx, buildOff } from "./game.js";
import { bump } from "./lounge-trade.js";
import { jstDay } from "./lounge-rules.js";

const has = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
const fmt = (n) => Math.round(n).toLocaleString("ja-JP");
export function ensureFac(rec) { rec.hideout ||= {}; rec.knob ||= {}; rec.build ||= {}; return rec; }
const facIn = (id) => (has(Object.fromEntries(FACILITIES.map((f) => [f.id, 1])), id) ? facOf(id) : null);   // 「__proto__」などを 施設に しない

// 前の 記録（Lv1〜4・地下の 拡張）を うつす（1 回だけ。facV）。前の Lv4 は Lv100（段の はじめ：1 → 20・2 → 50・3 → 80）
export function facMigrate(rec) {
  ensureFac(rec);
  if ((rec.facV || 0) >= 2) return false;
  for (const [id, lv] of Object.entries({ ...rec.hideout })) {
    if (id === "dig") { delete rec.hideout.dig; continue; }   // 地下の 拡張は なくした
    if (id === "radio") continue;
    if (Number.isInteger(lv) && lv >= 1 && lv <= 4) rec.hideout[id] = MIGRATE_LV[lv];
  }
  rec.facV = 2;
  return true;
}

// 時間が 来た 建設と 研究を 終える（どの 操作の ときでも）。終わった 施設の id を 返す
export function facDue(rec, now) {
  ensureFac(rec);
  const done = [];
  for (const [id, b] of Object.entries(rec.build)) {
    if (!b || buildProg(b, now) < 1) continue;
    const was = rec.hideout[id] || 0, k = rec.knob[id];
    rec.hideout[id] = b.to; delete rec.build[id];
    if (Number.isInteger(k) && k < was) { /* つまみを 下げて いた 人は その まま */ } else delete rec.knob[id];   // いちばん 上に して いた 人は 新しい Lv
    done.push(id);
    bump(rec, { type: "built", n: 1, fac: id }, jstDay(now));
  }
  if (Array.isArray(rec.labQ) && rec.labQ.length) {
    const due = rec.labQ.filter((x) => x.at <= now);
    rec.labQ = rec.labQ.filter((x) => x.at > now);
    for (const x of due) if (!rec.lab.includes(x.tree)) { rec.lab.push(x.tree); bump(rec, { type: "research", n: 1 }, jstDay(now)); }
  }
  return done;
}

// 建設を 始める：クレジットを 払う。素材は あとから 分けて 入れる
export function facStart(rec, b, now) {
  ensureFac(rec);
  const f = facIn(b.id); if (!f) return { ok: false, why: "知らない 施設" };
  if (rec.build[f.id]) return { ok: false, why: "いま 建てて いる" };
  const lv = rec.hideout[f.id] || 0, cap = facCap(f, rec.hideout);
  if (lv >= facMax(f)) return { ok: false, why: "もう いちばん 上" };
  if (lv >= cap) return { ok: false, why: f.isle > 1 ? "まだ ない" : `Lv${lv + 1} は 無線機を 作って から（ニライ諸島の 素材が いる）` };
  const L = lv + 1, need = buildNeed(f.id, L), ms = Math.round(need.ms * (1 - buildOff(rec.perks)));   // ボルトの 店の 割引
  if (need.credits > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${fmt(need.credits - (rec.credits || 0))}` };
  rec.credits -= need.credits;
  rec.build[f.id] = { to: L, at: now, ms, skip: 0, mats: need.mats, put: {} };
  return { ok: true, id: f.id, to: L, paid: need.credits };
}

// 素材を 入れる（mat を えらべば その 素材だけ・n は 数。えらばなければ 入れられる 物を ぜんぶ）。店で 買った 物も 使える
export function facPut(rec, b, now) {
  ensureFac(rec);
  const f = facIn(b.id), B = f && rec.build[f.id];
  if (!B) return { ok: false, why: "建てて いない" };
  const list = b.mat != null ? B.mats.filter(([id]) => id === b.mat) : B.mats;
  if (!list.length) return { ok: false, why: "その 素材は いらない" };
  let put = 0;
  for (const [id, need] of list) {
    const left = need - (B.put[id] || 0); if (left <= 0) continue;
    const want = Number.isInteger(b.n) && b.n > 0 ? Math.min(b.n, left) : left;
    let take = want;
    for (const m of rec.own.mats.filter((x) => x.id === id).sort((a, c) => (c.b ? 1 : 0) - (a.b ? 1 : 0) || a.q - c.q)) { const k = Math.min(take, m.n); m.n -= k; take -= k; if (!take) break; }   // 買った 物・品質の 低い 物から
    const got = want - take; if (got) { B.put[id] = (B.put[id] || 0) + got; put += got; }
  }
  rec.own.mats = rec.own.mats.filter((m) => m.n > 0);
  if (!put) return { ok: false, why: "入れる 素材を 持って いない" };
  bump(rec, { type: "facput", n: 1, fac: f.id }, jstDay(now));
  const done = facDue(rec, now);
  return { ok: true, put, mats: Math.round(buildMatRatio(B) * 100), ...(done.includes(f.id) ? { done: rec.hideout[f.id] } : {}) };
}

// グラナート建設に 頼む：残りの 時間が 半分。料金 ＝ 残りの 分 × 1 クレジット（最低 50）
export function facRush(rec, b, now) {
  ensureFac(rec);
  const f = facIn(b.id), B = f && rec.build[f.id];
  if (!B) return { ok: false, why: "建てて いない" };
  const left = buildLeftMs(B, now); if (!left) return { ok: false, why: "時間は もう 足りて いる（素材を 入れると できる）" };
  const fee = rushPrice(B, now);
  if (fee > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${fmt(fee - (rec.credits || 0))}` };
  rec.credits -= fee; B.skip = (B.skip || 0) + Math.floor(left / 2);
  bump(rec, { type: "rush", n: 1, fac: f.id }, jstDay(now));
  const done = facDue(rec, now);
  return { ok: true, fee, left: buildLeftMs(B, now), ...(done.includes(f.id) ? { done: rec.hideout[f.id] } : {}) };
}
// ヘリクス電力の 燃料：1 本 60 クレジットで 30 分 進む
export function facFuel(rec, b, now) {
  ensureFac(rec);
  const f = facIn(b.id), B = f && rec.build[f.id];
  if (!B) return { ok: false, why: "建てて いない" };
  const left = buildLeftMs(B, now); if (!left) return { ok: false, why: "時間は もう 足りて いる（素材を 入れると できる）" };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= 100 ? Math.min(b.n, Math.ceil(left / FUEL.ms)) : 0;
  if (!n) return { ok: false, why: "燃料の 数を えらんで" };
  const fee = FUEL.price * n;
  if (fee > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${fmt(fee - (rec.credits || 0))}` };
  rec.credits -= fee; B.skip = (B.skip || 0) + FUEL.ms * n;
  const done = facDue(rec, now);
  return { ok: true, fee, n, left: buildLeftMs(B, now), ...(done.includes(f.id) ? { done: rec.hideout[f.id] } : {}) };
}
// つまみ：上げた Lv までの どこでも（0 は 止める。維持費も かからない）
export function facKnob(rec, b, now = Date.now()) {
  ensureFac(rec);
  const f = facIn(b.id); if (!f || !hasKnob(f)) return { ok: false, why: "つまみの ない 施設" };
  const lv = rec.hideout[f.id] || 0;
  if (!Number.isInteger(b.lv) || b.lv < 0 || b.lv > lv) return { ok: false, why: `0〜${lv} で えらんで` };
  const was = facLv(rec, f.id);
  if (b.lv === lv) delete rec.knob[f.id]; else rec.knob[f.id] = b.lv;
  if (was !== b.lv) bump(rec, { type: "knob", n: 1, fac: f.id }, jstDay(now));
  return { ok: true, id: f.id, lv: b.lv, fee: upkeep(f.id, b.lv) };
}

// 画面に 出す 形（/api/me の fac）
export function facView(rec, now) {
  ensureFac(rec);
  return FACILITIES.map((f) => {
    const lv = rec.hideout[f.id] || 0, k = facLv(rec, f.id), B = rec.build[f.id], cap = facCap(f, rec.hideout);
    const nx = !B && lv < Math.min(cap, facMax(f)) ? buildNeed(f.id, lv + 1) : null, off = buildOff(rec.perks);
    return { id: f.id, lv, knob: k, cap, max: facMax(f), fee: upkeep(f.id, k), fx: facFx(f.id, k),
      ...(B ? { build: { to: B.to, ms: B.ms, mats: B.mats, put: B.put, prog: buildProg(B, now), mr: buildMatRatio(B), tr: buildTimeRatio(B, now), left: buildLeftMs(B, now), rush: buildLeftMs(B, now) ? rushPrice(B, now) : 0 } } : {}),
      ...(nx ? { next: { to: lv + 1, credits: nx.credits, ms: Math.round(nx.ms * (1 - off)), mats: nx.mats, fx: facFx(f.id, lv + 1) } } : {}) };
  });
}
