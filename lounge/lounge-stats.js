// プライベートラウンジの 記録の まとめ（OBS の オーバーレイの コスメの 条件 u.lo に 使う）。形と 生の id は docs/mono-link-lounge-stats.md
// - Viewer：記録を しまった あと statPut(this, rec)。前に 送った 物と 同じなら 送らない（前の 物は Viewer の「stat」）。とどかなければ つぎに しまう とき また 送る
// - Lounge：statFetch（Viewer からの /stat-put。前の 分と 合わせて「stat:<Twitch の id>」に しまい、つながって いる OBS に その 人の 分を 1 通）・
//           statHello（OBS の 鍵が 合ったら 全員分を 1 通）。OBS へは { t: "lstat", all?: 1, list: [{ id, l: login, n: 表示名, lo: まとめ }] }
// - アチーブメント用なので、Lounge は 下がらない 形で しまう（数は 前より 大きい 方・id は 足して いく。クレジットを 使っても・職業を かえても 二つ名が 消えない）
// 入れるのは 数と 生の id と 名前（login・表示名）だけ。鍵・トークン・玉は 入れない。名前に 直すのは オーバーレイ
import { PLANS, SHAPE, FACILITIES, DUNGEONS, FLOORS, TRADERS, repLv, CRAFT, SYNTH, craftOpen, synthOpen, SNACK_NEED, rankOf } from "./game.js";
import { FURN } from "./lounge-rules.js";

const MAX_BYTES = 8 * 1024, CHUNK = 200;
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const idOk = (v) => (/^\d{1,20}$/.test(String(v || "")) ? String(v) : "");
const KEY = /^[A-Za-z0-9_-]{1,40}$/, keyOk = (k) => typeof k === "string" && KEY.test(k) && k !== "__proto__";
const num = (v) => (Number.isFinite(+v) && +v > 0 ? Math.min(1e12, Math.floor(+v)) : 0);
const nm = (s) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 40);

const JOB_IDS = Object.keys(PLANS);                                              // attacker・caster・technician・healer・defender
const MASTER = (SHAPE.find((n) => n.master) || { id: "Ab7" }).id;                // 奥義の さいごの ノード（ここまで 取ると マスター）
const HIDE_MAX = Object.fromEntries(FACILITIES.map((f) => [f.id, f.lv.length])); // 施設の 最大 Lv（どれも 3）
const HIDE7 = ["bench", "lab", "snack", "maproom", "medic", "gym", "storage"];    // hide3 で 数える 7 つ（あとから 足した 地下の 拡張・工房は 入れない）
const DUNGEON_IDS = DUNGEONS.map((d) => d.id);                                   // hals・morph・kurai・crystal
const MYTHIC_IDS = DUNGEONS.map((d) => d.mythic && d.mythic.id).filter(Boolean); // halsCloak・morphMask・kuraiLantern・crystalCrown
const TRADER_IDS = TRADERS.map((t) => t.id), REP_TOP = repLv(Infinity);         // 友好度の いちばん 上の Lv（4）。ヨル（special）は Lv が ないので repMax に 入れない
const FURN_IDS = FURN.filter((f) => f.star > 0).map((f) => f.id), FURN5 = FURN.filter((f) => f.star === 5).map((f) => f.id);   // 設備（rack）と PC は 家具に 数えない
const rankSafe = (c) => { try { return rankOf(c); } catch (e) { return ""; } };

// もとに なる 物（オブジェクトと id の 配列と 数）から、数の 物を 作って 表の 順に ならべる
function derive(b) {
  const v = (o) => Object.values(o);
  return {
    pets: b.pets, petMax: Math.max(0, ...v(b.pets)), petKinds: Object.keys(b.pets).length, master: b.master,
    boss: b.boss, bossKinds: v(b.boss).filter((n) => n > 0).length, bossTotal: v(b.boss).reduce((a, n) => a + n, 0),
    floor: b.floor, floor5: v(b.floor).filter((n) => n >= FLOORS).length, tamed: b.tamed, lab: b.lab,
    hide: b.hide, hide3: HIDE7.filter((id) => (b.hide[id] || 0) >= HIDE_MAX[id]).length, furnKinds: b.furnKinds, furn5: b.furn5,
    rep: b.rep, repMax: TRADER_IDS.filter((id) => repLv(b.rep[id] || 0) >= REP_TOP).length,
    mythic: b.mythic, mythicN: b.mythic.length, recipes: b.recipes, credits: b.credits,
  };
}

// 記録（rec）を そのまま 数える。名前には 直さない
export function statOf(rec) {
  const pets = {}, master = [], boss = {}, floor = {}, hide = {}, rep = {};
  for (const p of rec.pets || []) {
    if (!p || !keyOk(p.species)) continue;
    pets[p.species] = Math.max(pets[p.species] || 0, num(p.lv));
    for (const j of JOB_IDS) if (((p.taken || {})[j] || []).includes(MASTER) && !master.includes(j)) master.push(j);
  }
  for (const [did, e] of Object.entries(rec.explore || {})) {
    if (!e || !DUNGEON_IDS.includes(did)) continue;
    if (num(e.bossKills)) boss[did] = num(e.bossKills);
    if (num(e.maxFloor)) floor[did] = Math.min(FLOORS, num(e.maxFloor));
  }
  for (const [fid, lv] of Object.entries(rec.hideout || {})) if (HIDE_MAX[fid] && num(lv)) hide[fid] = Math.min(HIDE_MAX[fid], num(lv));
  for (const [tid, t] of Object.entries(rec.traders || {})) if (keyOk(tid) && t && num(t.rep)) rep[tid] = num(t.rep);
  const own = rec.own || {}, fu = own.furniture || {}, seen = new Set(rec.seen || []), learnt = new Set(rec.recipes || []);
  const held = new Set([...(own.equip || []).map((e) => e && e.base), ...(own.box || []).map((x) => x && x.equip && x.equip.base)]);
  return derive({
    pets, master, boss, floor, hide, rep,
    mythic: MYTHIC_IDS.filter((id) => seen.has(id) || held.has(id)),   // 手に 入れた ことの ある（seen）か 持って いる
    tamed: (rec.tamed || []).filter((c) => c && c.gauge >= SNACK_NEED[rankSafe(c)]).length,   // なかよしゲージが いっぱい（懐柔ずみ）の 子
    lab: new Set((rec.lab || []).filter((t) => typeof t === "string")).size,
    furnKinds: FURN_IDS.filter((id) => num(fu[id])).length, furn5: FURN5.filter((id) => num(fu[id])).length,
    recipes: CRAFT.filter((r) => learnt.has(r.base) || craftOpen(r, seen)).length + SYNTH.filter((r) => learnt.has(r.out) || synthOpen(r, seen)).length,
    credits: num(rec.credits),
  });
}

// 受けとった まとめを 決まった 形に（知らない 物は すてる）
const cleanMap = (o) => { const out = {}; if (o && typeof o === "object" && !Array.isArray(o)) for (const k of Object.keys(o).slice(0, 60)) { const n = num(o[k]); if (keyOk(k) && n) out[k] = n; } return out; };
const cleanIds = (a) => (Array.isArray(a) ? [...new Set(a.filter(keyOk))].slice(0, 40) : []);
export function cleanStat(lo) {
  lo = lo && typeof lo === "object" ? lo : {};
  return derive({ pets: cleanMap(lo.pets), master: cleanIds(lo.master), boss: cleanMap(lo.boss), floor: cleanMap(lo.floor), hide: cleanMap(lo.hide), rep: cleanMap(lo.rep), mythic: cleanIds(lo.mythic),
    tamed: num(lo.tamed), lab: num(lo.lab), furnKinds: num(lo.furnKinds), furn5: num(lo.furn5), recipes: num(lo.recipes), credits: num(lo.credits) });
}
// 前の まとめ（a）と 新しい まとめ（b）を 下がらない 形で 合わせる
export function statMerge(a, b) {
  if (!a) return b;
  const mx = (x = {}, y = {}) => { const o = { ...x }; for (const k of Object.keys(y)) o[k] = Math.max(o[k] || 0, y[k]); return o; };
  const un = (x = [], y = []) => [...x, ...y.filter((k) => !x.includes(k))];
  const big = (k) => Math.max(num(a[k]), num(b[k]));
  return derive({ pets: mx(a.pets, b.pets), master: un(a.master, b.master), boss: mx(a.boss, b.boss), floor: mx(a.floor, b.floor), hide: mx(a.hide, b.hide), rep: mx(a.rep, b.rep), mythic: un(a.mythic, b.mythic),
    tamed: big("tamed"), lab: big("lab"), furnKinds: big("furnKinds"), furn5: big("furn5"), recipes: big("recipes"), credits: big("credits") });
}

// Viewer の save の あとに：await statPut(this, rec)。しくじっても 記録の 仕事は 止めない
export async function statPut(viewer, rec) {
  try {
    if (!rec || !idOk(rec.id) || !viewer.env.LOUNGE) return false;
    const lo = statOf(rec), s = JSON.stringify([rec.login || "", rec.name || "", lo]);   // 名前が かわった ときも 送る
    if (viewer.statS === undefined) viewer.statS = (await viewer.state.storage.get("stat")) || "";
    if (s === viewer.statS) return false;
    const r = await viewer.lounge().fetch("https://lounge/stat-put", { method: "POST", body: JSON.stringify({ id: rec.id, l: rec.login, n: rec.name, lo }) });
    if (!r.ok) return false;
    viewer.statS = s; await viewer.state.storage.put("stat", s);
    return true;
  } catch (e) { return false; }
}

const send = (ws, o) => { try { ws.send(JSON.stringify(o)); } catch (e) {} };
// Lounge の fetch() で：const sr = await statFetch(this, url, req); if (sr) return sr;（/stat-put は 門番の 中の Viewer からだけ。worker.js は 外から 運ばない）
export async function statFetch(lounge, url, req) {
  if (url.pathname !== "/stat-put" || req.method !== "POST") return null;
  const text = await req.text(); if (text.length > MAX_BYTES) return J({ error: "big" }, 413);
  let b; try { b = JSON.parse(text); } catch (e) { return J({ error: "json" }, 400); }
  const id = idOk(b && b.id); if (!id || !b.lo || typeof b.lo !== "object") return J({ error: "entry" }, 400);
  const key = "stat:" + id, old = await lounge.state.storage.get(key);
  const e = { id, l: nm(b.l).toLowerCase(), n: nm(b.n), lo: statMerge(old && old.lo, cleanStat(b.lo)) };
  if (old && JSON.stringify(old) === JSON.stringify(e)) return J({ ok: true, same: 1 });
  await lounge.state.storage.put(key, e);
  lounge.obsSockets().forEach((ws) => send(ws, { t: "lstat", list: [e] }));
  return J({ ok: true });
}
// OBS の 鍵が 合った とき：全員分（多い ときは 200 人ずつ）。だれも いなくても 空の 1 通（新しい 門番だと わかる）
export async function statHello(lounge, ws) {
  try {
    const list = [...(await lounge.state.storage.list({ prefix: "stat:" })).values()];
    for (let i = 0; i === 0 || i < list.length; i += CHUNK) send(ws, { t: "lstat", all: 1, list: list.slice(i, i + CHUNK) });
  } catch (e) {}
}
