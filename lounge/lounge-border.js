// ボーダーゾーン（docs/mono-link-border-zone.md）の 門番：出撃・帰還・うけとり・鑑定・納める
// 記録：rec.bz = { run：いま 出て いる 出撃（か null）, log：帰った 出撃（新しい 順に 5 つ。記録の タブ）, samples：持って いる 貴重サンプル [{ uid, id, star, known }] }
// 計算は viewer.js が アラームで 1 歩ずつ（storage の bzsim。帰還の ために うけとるまで 残す）。終わったら bzDone で got と 本当の 帰る 時間を 決める
// まだ ない 物：ほかの プレイヤーとの「ばったり」（2 段め）・運び屋（CRV）・グループの 好感度（いまは「ふつう」の あつかい）
import { BZ_AREAS, BZ_RUNS, BZ_STEP_S, PRIORITY, RETURN, KEY_MAX, SAMPLES, APPRAISE_FEE, GROUP_NAME, samplePrice, capLv, bzInit, bzRecall as bzRecallSim, bzResult, matValue, bzInsPrice } from "./border.js";
import { growthStats } from "./trees.js";
import { fighterOf, mateOf, putMats, insLose, levelUp } from "./lounge-game.js";
import { autoFill } from "./lounge-pet.js";

export const BZ_LOG = 5;          // 記録に 残す 出撃（Claude の 案）
export const SAMPLE_MAX = 60;     // 持てる 貴重サンプル（Claude の 案）
const STEP_MS = BZ_STEP_S * 1000;
const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);
const newUid = (rec, p) => p + (++rec.uidN).toString(36);
export const ensureBz = (rec) => (rec.bz ||= { run: null, log: [], samples: [] });
// グループの 好感度（−100〜100）。まだ 作って いない ので「ふつう」（0）。できたら rec の 値を 読む
export const groupAff = (rec, g) => (g && rec.gaff && Number.isFinite(rec.gaff[g]) ? rec.gaff[g] : 0);
export { bzInsPrice };   // 保険料は 画面と 同じ 計算（border.js）

// レベル帯を こえた 子は ステータスを 帯の 上限 Lv の 強さに そろえる（装備と スキルツリーは そのまま。鹿さんの 決め）
export function clampTo(f, cap) {
  if (!f || !(f.lv > cap)) return f;
  const hi = growthStats(f.type, f.lv), lo = growthStats(f.type, cap), stats = { ...f.stats };
  for (const k in stats) if (hi[k] > 0) stats[k] = Math.max(1, Math.round((stats[k] * lo[k]) / hi[k]));
  return { ...f, stats, lvCap: cap };
}

// 出撃する（b：{ area, run, pri, ret: { k, n }, keys, crate, meet, ins }）
export function bzStart(rec, b, now, seed) {
  const pet = rec.pets[0];
  if (!pet) return { ok: false, why: "まだ ペットが いない" };
  if (!pet.type) return { ok: false, why: "さきに 職業を えらんで" };
  const Z = ensureBz(rec);
  if (Z.run) return { ok: false, why: "もう ボーダーゾーンに 出て いる" };
  if (rec.trips.some((t) => !t.done)) return { ok: false, why: "派遣から 帰って から" };
  const area = has(BZ_AREAS, b.area) ? b.area : null, run = BZ_RUNS[b.run] ? +b.run : 0;
  if (!area || !run) return { ok: false, why: "エリアか 時間が ちがう" };
  const pri = PRIORITY.includes(b.pri) ? b.pri : "none";
  const rk = b.ret && RETURN.includes(b.ret.k) ? b.ret.k : "none", rn = rk === "samples" ? Math.max(1, Math.min(9, Math.floor(+b.ret.n) || 1)) : 0;
  const keys = Number.isInteger(b.keys) ? b.keys : 0;
  if (keys < 0 || keys > KEY_MAX) return { ok: false, why: `封鎖された 所の キーカードは ${KEY_MAX} 枚まで` };
  rec.items ||= {};
  if (keys > (rec.items.key_bz || 0)) return { ok: false, why: "封鎖された 所の キーカードが 足りない" };
  const crate = b.crate ? Math.min(3, rec.items.key_crate || 0) : 0;   // クレートの カードキー：持って いれば 3 枚まで 持って いく
  const meet = b.meet === "fight" ? "fight" : "avoid";   // ほかの プレイヤーと 出会ったら（ばったりは 2 段めで つなぐ）
  const ins = b.ins === 2 ? 2 : b.ins === 1 ? 1 : 0, prem = ins ? bzInsPrice(run, ins, rec.perks || {}) : 0;
  if (ins === 2 && !(rec.perks && rec.perks.ins2)) return { ok: false, why: "手厚い 保険は ミネルバの 店で 開く" };
  if (prem > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${(prem - (rec.credits || 0)).toLocaleString("ja-JP")}（保険料）` };
  const cap = capLv(area), mates = rec.party.map((u) => rec.tamed.find((c) => c.uid === u)).filter(Boolean);
  const team = [clampTo({ ...fighterOf(pet, rec), owner: rec.name || "" }, cap), ...mates.map((c) => clampTo(mateOf(c, rec), cap))];
  const cfg = { area, run, pri, ret: { k: rk, n: rn }, keys, crate, meet, aff: groupAff(rec, BZ_AREAS[area].group) };
  const S = bzInit(cfg, team, seed);
  rec.items.key_bz = (rec.items.key_bz || 0) - keys;   // 鍵は 持って いく ときに あずかる（使わなかった 分は 帰りに もどす）
  if (crate) rec.items.key_crate -= crate;
  if (ins) rec.credits -= prem;
  const r = { uid: newUid(rec, "z"), area, run, cfg, party: [pet.uid, ...mates.map((c) => c.uid)], start: now, end: now + BZ_RUNS[run].steps * STEP_MS, calc: true, ...(ins ? { ins: { plan: ins, prem } } : {}) };
  Z.run = r;
  return { ok: true, bz: bzView(r, now), sim: { uid: r.uid, S }, ...(prem ? { prem } : {}) };
}
// 計算が 終わった：中身（got）と 本当の 帰る 時間を 決める
export function bzDone(rec, sim) {
  const r = rec.bz && rec.bz.run;
  if (!r || r.uid !== sim.uid || !sim.S.fin) return false;
  const res = bzResult(sim.S);
  r.got = res; r.end = r.start + Math.max(1, res.steps) * STEP_MS;
  delete r.calc;
  return true;
}
// 帰還（いつでも。鹿さんの 決め）：いまの 歩から 出口へ。sim は viewer.js が しまって いる 物（その場で かえる）
export function bzRecall(rec, sim, now) {
  const r = rec.bz && rec.bz.run;
  if (!r) return { ok: false, why: "出て いない" };
  if (now >= r.end && !r.calc) return { ok: false, why: "もう 帰って きた" };
  if (!sim || sim.uid !== r.uid) return { ok: false, why: "まだ 計算中（もう 少し）" };
  const el = Math.floor((now - r.start) / STEP_MS) + 1, turn = r.got && r.got.ev.find((e) => e.k === "turn");
  if (turn && turn.i <= el) return { ok: false, why: "もう 脱出口へ 向かって いる" };
  if (r.got && r.got.reason === "wipe") { const w = r.got.ev.find((e) => e.k === "end"); if (w && w.i <= el) return { ok: false, why: "もう 力つきて いる" }; }
  if (!bzRecallSim(sim.S, el)) return { ok: false, why: "もう 脱出口へ 向かって いる" };
  sim.done = false; r.calc = true; r.recall = el; delete r.got;
  r.end = r.start + (el + 8) * STEP_MS;   // 計算が 終わるまでの 目安（すぐ 本当の 時間に なる）
  return { ok: true };
}

// うけとる（帰って きた あと）
export function bzCollect(rec, now) {
  const Z = ensureBz(rec), r = Z.run;
  if (!r) return { ok: false, why: "出て いない" };
  if (r.calc || now < r.end) return { ok: false, why: "まだ 帰って いない（あと " + Math.max(1, Math.ceil((shownEnd(r, now) - now) / 1000)) + " 秒）" };   // 見せて いる 時間から（本当の 時間を もらさない）
  const g = r.got, wipe = g.wipe;
  const party = r.party.map((u) => rec.pets.find((p) => p.uid === u) || rec.tamed.find((c) => c.uid === u)).filter(Boolean);
  const ups = party.map((x) => ({ uid: x.uid, up: levelUp(x, g.exp), lv: x.lv }));
  for (const p of rec.pets) if (p.type && p.grow && p.grow.auto) autoFill(p);
  rec.items ||= {};
  rec.items.key_bz = (rec.items.key_bz || 0) + Math.max(0, r.cfg.keys - g.keys);   // 使わなかった 鍵を もどす
  if (r.cfg.crate) rec.items.key_crate = (rec.items.key_crate || 0) + Math.max(0, r.cfg.crate - g.crate);
  let lost = null, got = { mats: 0, samples: 0 };
  if (wipe) {   // 力つきたら 集めた 物を ぜんぶ 失う（鹿さんの 決め）。保険が あれば 素材の 一部が あとで 届く（派遣と 同じ）
    const n = g.mats.reduce((a, m) => a + m.n, 0), back = n ? insLose(rec, { ins: r.ins, did: "bz:" + r.area }, g.mats, now) : null;
    lost = { mats: n, samples: g.samples.length, ...(back ? { back } : {}) };
  } else {
    putMats(rec, g.mats, now);
    const room = Math.max(0, SAMPLE_MAX - Z.samples.length), add = g.samples.slice(0, room).map((s) => ({ uid: newUid(rec, "x"), id: s.id, star: s.star, known: false }));
    Z.samples.push(...add);
    got = { mats: g.mats.reduce((a, m) => a + m.n, 0), samples: add.length, ...(g.samples.length > room ? { over: g.samples.length - room } : {}) };
  }
  const sum = { uid: r.uid, area: r.area, run: r.run, start: r.start, end: r.end, reason: g.reason, wipe, exp: g.exp, mats: g.mats, samples: g.samples.map((s) => s.id), value: matValue(g.mats), ...(lost ? { lost } : {}), sealed: g.sealed, ev: g.ev, pos: g.pos, ...(r.recall != null ? { recall: r.recall } : {}) };
  Z.log = [sum, ...Z.log].slice(0, BZ_LOG);
  Z.run = null;
  return { ok: true, wipe, ups, got, ...(lost ? { lost } : {}), exp: g.exp };
}
// 鑑定（ガラク。1 こ 20）：★が わかる
export function bzAppraise(rec, b) {
  const Z = ensureBz(rec), uids = Array.isArray(b.uids) ? [...new Set(b.uids)] : [];
  const list = uids.map((u) => Z.samples.find((s) => s.uid === u)).filter((s) => s && !s.known);
  if (!list.length) return { ok: false, why: "鑑定する サンプルを えらんで" };
  const fee = APPRAISE_FEE * list.length;
  if (fee > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${fee - (rec.credits || 0)}` };
  rec.credits -= fee; for (const s of list) s.known = true;
  return { ok: true, fee, stars: list.map((s) => ({ uid: s.uid, star: s.star })) };
}
// 会社に 納める（好みの 系統は 高く 買う・鑑定して いない 物は ★1 の 値段）
export function bzSell(rec, b) {
  const Z = ensureBz(rec), group = has(GROUP_NAME, b.group) ? b.group : null;
  if (!group) return { ok: false, why: "納める 会社を えらんで" };
  const uids = Array.isArray(b.uids) ? [...new Set(b.uids)] : [], list = uids.map((u) => Z.samples.find((s) => s.uid === u)).filter(Boolean);
  if (!list.length) return { ok: false, why: "納める サンプルを えらんで" };
  const aff = groupAff(rec, group), credits = list.reduce((a, s) => a + samplePrice(s, group, aff), 0);
  Z.samples = Z.samples.filter((s) => !list.includes(s));
  rec.credits = (rec.credits || 0) + credits;
  return { ok: true, paid: credits, n: list.length };   // credits は 門番の 返事で 残高に なる ので paid
}

// 見せる 帰る 時間：結果は 出発の ときに 先まで 計算して いるので、本当の 帰る 時間は「脱出口へ 向かう」か「力つきた」が いままでに 見えて から 見せる
// それまでは 予定の 時間（先に 力つきる かどうかが わかって しまわない ように。2026-11-05 の 安全の 見直し）
export function shownEnd(r, now) {
  const nominal = r.start + BZ_RUNS[r.run].steps * STEP_MS, el = Math.floor((now - r.start) / STEP_MS);
  if (!r.got) return Math.max(r.end, nominal);
  const seen = r.got.ev.some((e) => (e.k === "turn" || e.k === "end") && e.i < el);
  return seen || now >= r.end ? r.end : Math.max(r.end, nominal);
}
// 画面に 出す 形：出て いる あいだは「いま」までの 出来事と 点（先の 出来事は 見せない）
export function bzView(r, now) {
  if (!r) return null;
  const el = Math.max(0, Math.floor((now - r.start) / STEP_MS)), base = { uid: r.uid, area: r.area, run: r.run, cfg: r.cfg, start: r.start, end: shownEnd(r, now), el, ...(r.ins ? { ins: r.ins } : {}), ...(r.recall != null ? { recall: r.recall } : {}) };
  if (!r.got) return { ...base, calc: true };
  const done = now >= r.end, ev = done ? r.got.ev : r.got.ev.filter((e) => e.i < el), pos = done ? r.got.pos : r.got.pos.slice(0, el + 1);
  const turn = r.got.ev.find((e) => e.k === "turn"), dead = r.got.ev.find((e) => e.k === "end" && e.why === "wipe");
  const going = !done && !(turn && turn.i < el) && !(dead && dead.i < el);
  return { ...base, done, ev, pos, canRecall: going, ...(done ? { reason: r.got.reason, wipe: r.got.wipe } : {}) };
}
export function bzMe(rec, now) {
  const Z = rec.bz || { run: null, log: [], samples: [] };
  return { run: bzView(Z.run, now), log: Z.log, samples: Z.samples, keys: (rec.items && rec.items.key_bz) || 0, crateKeys: (rec.items && rec.items.key_crate) || 0, aff: Object.fromEntries(Object.keys(GROUP_NAME).map((g) => [g, groupAff(rec, g)])) };
}
