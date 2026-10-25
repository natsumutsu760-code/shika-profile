// プライベートラウンジ 5 だんかい目：DEEP LINK/:（商人の 友好度・品ぞろえ・タスク・とくべつな 品）
// 決まりは docs/mono-link-pet-battle.md の「DEEP LINK/:」「タスク」「品ぞろえ」。品と タスクの 中身は 見本の deeplink.js・tasks.js（id・get・goal）
// 1 人分の 記録（rec）だけを 見て かえる。玉と リソースは viewer.js が 帳簿で 払う・もらう（買うは 計画、売る・タスクの ごほうびは earn）
// 数は すべて 案
import { TRADERS, SPECIAL, repLv, chainTask, dailyTask, TASK_TIDS, sellPrice, GATHER, floorRatio, OPS, BASES, SNACK_NEED, rankOf, CRAFT, SYNTH, craftOpen, synthOpen } from "./game.js";
import { putMats, putEquip } from "./lounge-game.js";
import { equippedUids } from "./lounge-pet.js";   // lounge-game.js も ここを 読む（どちらも 呼ぶ ときに 使うだけ なので 大丈夫）

export const SHOPS = [...TRADERS, SPECIAL];
export const REP_TRADE = 1;                          // 取引（買う・売る）1 回で 友好度 ＋1（案）
export const SELL_PERK = { sell10: 0.1, sell20: 0.2 }; // 買い取りの 上乗せ（＋20% は ＋10% と あわせて 20%。案）
const CONDS_OK = [(t) => !t.wipe, (t) => t.rests === 0, (t) => !t.tool, () => true, (t) => t.run === "long"];   // tasks.js の CONDS と 同じ 順
const ONE_TRIP = 3;                                  // 「1 回の 派遣で」：1 回の 派遣で 足りれば よい（足し算しない）
const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);

export function ensureTrade(rec) { rec.traders ||= {}; rec.perks ||= {}; rec.items ||= {}; rec.recipes ||= []; rec.tally ||= seedTally(rec); return rec; }
// ---------- これまでの 記録（鹿さんの決め、2026-10-25）：つながった タスクには まだ 出て いない ときの 分も 数える ----------
// rec.tally：できごとの 合計。キーは goal と 同じ 形（型・行き先・敵・★ 以上）。じょうけんに 合った 派遣の 分は「キー#じょうけんの 番号」にも 足す
// 商人ごとに 使った 分（t.used）を 引いた のこりを 数え、終えると その 分を 使う（同じ 商人の つぎの タスクに 使いまわさない）
// 「1 回の 派遣で」は ためない（出てからの 派遣だけ）。毎日の タスクは その日の 分だけ（前と 同じ）。ためはじめは 入れた とき（ボスは 前の 分も わかる）
const goalKey = (g) => g.type + (g.did ? ":" + g.did : "") + (g.tree ? ":" + g.tree : "") + (g.star ? "@" + g.star : "") + (g.cond != null ? "#" + g.cond : "");
const banked = (g) => !["fac", "floor", "deliver", "deliverEq"].includes(g.type) && g.cond !== ONE_TRIP;
function evKeys(ev) {
  const base = [ev.type, ev.did && ev.type + ":" + ev.did, ev.tree && ev.type + ":" + ev.tree, ...Array.from({ length: Math.min(5, ev.star || 0) }, (_, i) => ev.type + "@" + (i + 1))].filter(Boolean);
  const conds = ev.trip ? CONDS_OK.map((ok, ci) => (ci !== ONE_TRIP && ok(ev.trip) ? ci : -1)).filter((ci) => ci >= 0) : [];
  return [...base, ...base.flatMap((k) => conds.map((ci) => k + "#" + ci))];
}
function seedTally(rec) { const t = {}; for (const [did, p] of Object.entries(rec.explore || {})) if (p && p.bossKills > 0) t["boss:" + did] = p.bossKills; return t; }
const avail = (rec, t, g) => Math.max(0, (rec.tally[goalKey(g)] || 0) - ((t.used || {})[goalKey(g)] || 0));
// 商人ごとの 記録。日が かわったら きょうの タスクと 品の のこりを もどす（日本時間 0 時。ボスの素材は 1 週ごと）
export function traderOf(rec, tid, day) {
  const t = (rec.traders[tid] ||= { rep: 0, n: 1, cp: 0, day: 0, dn: 1, dp: 0, ddone: 0, bday: 0, buy: {}, bweek: 0, wbuy: {} });
  if (t.day !== day) { t.day = day; t.dn = t.n; t.dp = 0; t.ddone = 0; }   // きょうの タスクは その日の はじめの 進みで 決まる
  if (t.bday !== day) { t.bday = day; t.buy = {}; }
  const wk = Math.floor(day / 7); if (t.bweek !== wk) { t.bweek = wk; t.wbuy = {}; }
  return t;
}
export const tasksOf = (tid, t, day) => ({ chain: chainTask(tid, t.n), daily: dailyTask(tid, day, t.dn) });

// ---------- タスクの 進み ----------
const found = (rec, id, q) => rec.own.mats.filter((m) => m.id === id && m.q >= q && !m.b).reduce((a, m) => a + m.n, 0);   // 派遣で 拾った 物だけ
const foundEq = (rec, star) => { const on = equippedUids(rec); return rec.own.equip.filter((e) => e.star >= star && !e.b && !on.has(e.uid)); };   // 付けて いる 物は のぞく
// いまの 進み。施設・階・納める は いまの ようすから、ほかは 数えた 数（t を わたすと つながった タスク：ためた 分の のこりも 数える）
export function progressOf(rec, k, counted, t) {
  const g = k.goal;
  if (g.type === "fac") return (rec.hideout[g.fac] || 0) >= g.lv ? 1 : 0;
  if (g.type === "floor") { const p = rec.explore[g.did]; return p ? Math.floor(floorRatio(g.did, p, g.floor) * 100) : 0; }
  if (g.type === "deliver") return Math.min(k.need, found(rec, g.mat, g.q || 0));
  if (g.type === "deliverEq") return Math.min(k.need, foundEq(rec, g.star).length);
  return Math.min(k.need, t && banked(g) ? Math.max(counted, avail(rec, t, g)) : counted);
}
const hit = (g, ev) => g.type === ev.type && (!g.did || g.did === ev.did) && (!g.tree || g.tree === ev.tree) && (!g.star || (ev.star || 0) >= g.star);
// できごと（派遣の 結果・売る・作る・合成・おやつ）を タスクに 数える。ev：{ type, n, did, tree, star, trip }
export function bump(rec, ev, day) {
  ensureTrade(rec);
  if (Number.isInteger(ev.n) && ev.n > 0) for (const key of evKeys(ev)) rec.tally[key] = (rec.tally[key] || 0) + ev.n;   // これまでの 記録（商人の 数に よらず 1 回）
  for (const tid of TASK_TIDS) {
    const t = traderOf(rec, tid, day), ks = tasksOf(tid, t, day);
    for (const [k, key] of [[ks.chain, "cp"], [ks.daily, "dp"]]) {
      if (key === "dp" && t.ddone) continue;
      const g = k.goal;
      if (!hit(g, ev)) continue;
      if (g.cond != null && !(ev.trip && CONDS_OK[g.cond](ev.trip))) continue;
      t[key] = Math.min(k.need, g.cond === ONE_TRIP ? Math.max(t[key], ev.n) : t[key] + ev.n);
    }
  }
}
// 帰って きた 派遣の できごと
export function tripEvents(rec, did, st, day) {
  const trip = { wipe: st.wipe, rests: st.rests, tool: st.tool, run: st.run };
  const evs = [{ type: "gather", n: st.gather, did }, { type: "chest", n: st.chests, did }, { type: "hchest", n: st.hchests, did }, { type: "rest", n: st.rests },
    { type: "safe", n: st.wipe ? 0 : 1, did }, { type: "boss", n: st.boss, did },
    ...Object.entries(st.kills).map(([tree, n]) => ({ type: "kill", n, did, tree })), ...Object.entries(st.caught).map(([tree, n]) => ({ type: "capture", n, did, tree }))];
  for (const ev of evs) if (ev.n > 0) bump(rec, { ...ev, trip }, day);
}

// ---------- タスクを 終える（納める・報告する） ----------
export function taskDone(rec, b, day, R) {
  ensureTrade(rec);
  if (!TASK_TIDS.includes(b.tid)) return { ok: false, why: "知らない 商人" };
  const t = traderOf(rec, b.tid, day), which = b.which === "daily" ? "daily" : "chain", k = tasksOf(b.tid, t, day)[which], g = k.goal;
  if (which === "daily" && t.ddone) return { ok: false, why: "きょうの タスクは もう 終わった" };
  const now = which === "daily" ? progressOf(rec, k, t.dp) : progressOf(rec, k, t.cp, t);
  if (now < k.need) return { ok: false, why: `まだ たりない（${now}/${k.need}${k.unit}）` };
  if (g.type === "deliver") {   // 品質の 低い 物から。拾った 物だけ
    let left = k.need;
    for (const m of rec.own.mats.filter((x) => x.id === g.mat && x.q >= (g.q || 0) && !x.b).sort((a, c) => a.q - c.q)) { const n = Math.min(left, m.n); m.n -= n; left -= n; if (!left) break; }
    rec.own.mats = rec.own.mats.filter((m) => m.n > 0);
  }
  if (g.type === "deliverEq") {
    const list = foundEq(rec, g.star), e = list.find((x) => x.uid === b.uid) || list.sort((a, c) => a.star - c.star)[0];
    rec.own.equip = rec.own.equip.filter((x) => x !== e);
  }
  const rw = k.reward;
  t.rep += rw.rep || 0;
  if (rw.get) grantGet(rec, rw.get, R, Date.now());
  if (which === "chain" && banked(g)) { const key = goalKey(g); (t.used ||= {})[key] = Math.min(rec.tally[key] || 0, (t.used[key] || 0) + k.need); }   // ためた 分を 使う
  if (which === "daily") t.ddone = 1; else { t.n++; t.cp = 0; }
  return { ok: true, rep: rw.rep || 0, earn: [...(rw.balls ? [{ kind: "balls", d: rw.balls }] : []), ...(rw.res ? [{ kind: "res", d: rw.res }] : [])] };
}

// ---------- 品を 渡す ----------
// アクセサリー（★と OP。op は えらんだ OP。のこりは くじ）
export function rollAcc(R, base, star, op) {
  const pool = Object.keys(OPS).filter((k) => (OPS[k].from || 1) <= star && k !== op), ops = op ? [op] : [];
  while (ops.length < star && pool.length) ops.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return { base, star, ops };
}
const BASE_IDS = BASES.map((x) => x.id);   // アクセサリーの もと 12 しゅるい
// タスクの ごほうびの 物（店や 商人から もらった 物は「拾った 物」では ない：b）
function grantGet(rec, get, R, now) {
  if (get.mats) putMats(rec, get.mats.map(([id, n]) => ({ id, q: 0, n, b: 1 })), now);
  if (get.snacks) rec.snacks += get.snacks;
  for (const [k, n] of Object.entries(get.items || {})) rec.items[k] = (rec.items[k] || 0) + n;
  for (const [k, n] of Object.entries(get.tools || {})) rec.tools[k] = (rec.tools[k] || 0) + n;
  if (get.acc) putEquip(rec, [{ ...rollAcc(R, BASE_IDS[Math.floor(R() * BASE_IDS.length)], get.acc), b: 1 }], now);
}

// ---------- 買う ----------
// 品の 計画（玉か リソースで 払う）。pick：えらぶ 品（素材・アクセサリーの もと・レシピ）、pickOp：えらぶ OP（op は 頼みの 番号なので 名前を かえた）、n：数
export function buyPlan(rec, b, day, R) {
  ensureTrade(rec);
  const shop = SHOPS.find((x) => x.id === b.tid), item = shop && shop.shop.find((x) => x.id === b.item);
  if (!item || !item.get) return { ok: false, why: "その 品は ない" };
  const t = traderOf(rec, shop.id, day), g = item.get;
  if (shop !== SPECIAL && repLv(t.rep) < item.lv) return { ok: false, why: `友好度 Lv${item.lv} から 買える` };
  if (g.perk && rec.perks[g.perk]) return { ok: false, why: "もう 買った" };
  const n = item.once || g.acc || g.recipe ? 1 : Number.isInteger(b.n) && b.n > 0 ? b.n : 1;
  const used = item.week ? t.wbuy[item.id] || 0 : t.buy[item.id] || 0, left = item.stock ? item.stock - used : Infinity;
  if (n > left) return { ok: false, why: left > 0 ? `${item.week ? "この 週" : "きょう"}は あと ${left} こ` : `${item.week ? "この 週" : "きょう"}は もう 売りきれ` };
  if (item.pick && !item.pick.includes(b.pick)) return { ok: false, why: "えらんで" };
  const now = Date.now(), grant = { rep: [shop.id, REP_TRADE] };
  if (g.mat) { const id = g.mat === "pick" ? b.pick : g.mat; grant.mats = Array.from({ length: n }, () => ({ id, q: g.q ? g.q[Math.floor(R() * g.q.length)] : 0, n: 1, b: 1 })); }
  if (g.snacks) grant.snacks = g.snacks * n;
  if (g.items) grant.items = Object.fromEntries(Object.entries(g.items).map(([k, v]) => [k, v * n]));
  if (g.tools) grant.tools = Object.fromEntries(Object.entries(g.tools).map(([k, v]) => [k, v * n]));
  if (g.acc) {
    if (g.op && !(has(OPS, b.pickOp) && (OPS[b.pickOp].from || 1) <= g.acc)) return { ok: false, why: "OP を えらんで" };
    grant.equip = [{ ...rollAcc(R, b.pick, g.acc, g.op ? b.pickOp : null), b: 1 }];   // 先に 引いて おく
  }
  if (g.recipe) {
    const seen = new Set(rec.seen), r = g.recipe === "craft" ? CRAFT.find((x) => x.base === b.pick) : SYNTH.find((x) => x.out === b.pick);
    if (rec.recipes.includes(b.pick) || (g.recipe === "craft" ? craftOpen(r, seen) : synthOpen(r, seen))) return { ok: false, why: "その レシピは もう 出て いる" };
    grant.recipes = [b.pick];
  }
  if (g.perk) grant.perks = [g.perk];
  const key = item.week ? "wbuy" : "buy";
  return { costs: [{ kind: item.cur, d: -item.price * n }], why: `buy:${shop.id}:${item.id}`, grant, refund: { unbuy: [shop.id, key, item.id, n] },
    take: () => { t[key][item.id] = (t[key][item.id] || 0) + n; }, info: { n } };
}
// 渡す（lounge-game.js の give から 呼ぶ）
export function giveTrade(rec, g, now) {
  ensureTrade(rec);
  if (g.rep) { const t = rec.traders[g.rep[0]]; if (t) t.rep += g.rep[1]; }
  for (const [k, n] of Object.entries(g.items || {})) rec.items[k] = (rec.items[k] || 0) + n;
  for (const [k, n] of Object.entries(g.tools || {})) rec.tools[k] = (rec.tools[k] || 0) + n;
  for (const r of g.recipes || []) if (!rec.recipes.includes(r)) rec.recipes.push(r);
  for (const p of g.perks || []) rec.perks[p] = 1;
  if (g.unbuy) { const [tid, key, id, n] = g.unbuy, t = rec.traders[tid]; if (t && t[key]) t[key][id] = Math.max(0, (t[key][id] || 0) - n); }
}

// ---------- 売る・交換する（ガラク） ----------
// mats：[{ id, q, n }]。店で 買った 物から 先に 売る（拾った 物を のこす）
export function sellAct(rec, b, day) {
  ensureTrade(rec);
  const list = Array.isArray(b.mats) ? b.mats.slice(0, 50) : [];
  if (!list.length) return { ok: false, why: "売る 素材を えらんで" };
  const mats = rec.own.mats.map((m) => ({ ...m }));
  let balls = 0;
  for (const x of list) {
    let left = Number.isInteger(x.n) && x.n > 0 ? x.n : 0;
    if (!left) return { ok: false, why: "数が ちがう" };
    for (const m of mats.filter((y) => y.id === x.id && y.q === (x.q || 0)).sort((a, c) => (c.b ? 1 : 0) - (a.b ? 1 : 0))) { const k = Math.min(left, m.n); m.n -= k; left -= k; if (!left) break; }
    if (left) return { ok: false, why: "その 素材が 足りない" };
    balls += sellPrice({ id: x.id, q: x.q || 0 }) * x.n;
  }
  balls = Math.round(balls * (1 + (rec.perks.sell20 ? SELL_PERK.sell20 : rec.perks.sell10 ? SELL_PERK.sell10 : 0)));
  rec.own.mats = mats.filter((m) => m.n > 0);
  traderOf(rec, "junk", day).rep += REP_TRADE;
  bump(rec, { type: "sell", n: 1 }, day);
  return { ok: true, balls, earn: [{ kind: "balls", d: balls }] };
}
// 同じ 行き先の 採取の素材 3 こ → ほしい 1 こ（友好度 Lv2 から）
export function tradeAct(rec, b, day) {
  ensureTrade(rec);
  if (repLv(traderOf(rec, "junk", day).rep) < 2) return { ok: false, why: "友好度 Lv2 から" };
  const did = Object.keys(GATHER).find((k) => GATHER[k].mats.some(([id]) => id === b.want));
  const give = Array.isArray(b.give) ? b.give : [], ids = new Set(did ? GATHER[did].mats.map(([id]) => id) : []);
  if (!did || give.reduce((a, x) => a + (Number.isInteger(x.n) && x.n > 0 ? x.n : 99), 0) !== 3 || !give.every((x) => ids.has(x.id))) return { ok: false, why: "同じ 行き先の 素材を 3 こ えらんで" };
  const mats = rec.own.mats.map((m) => ({ ...m }));
  for (const x of give) {
    let left = x.n;
    for (const m of mats.filter((y) => y.id === x.id && y.q === 0).sort((a, c) => (c.b ? 1 : 0) - (a.b ? 1 : 0))) { const k = Math.min(left, m.n); m.n -= k; left -= k; if (!left) break; }
    if (left) return { ok: false, why: "その 素材が 足りない" };
  }
  rec.own.mats = mats.filter((m) => m.n > 0);
  putMats(rec, [{ id: b.want, q: 0, n: 1, b: 1 }], Date.now());
  return { ok: true };
}

// ---------- とくべつな 品を 使う ----------
export function useItem(rec, b) {
  ensureTrade(rec);
  const k = typeof b.a === "string" ? b.a.slice(5) : "";
  if (!(rec.items[k] > 0)) return { ok: false, why: "その 品を 持って いない" };
  if (k === "map") {   // かくし通路の地図：行った ことの ある 階の かくし通路を 開く
    const p = rec.explore[b.did], f = p && Number.isInteger(b.floor) && p.floors[b.floor];
    if (!f) return { ok: false, why: "行った ことの ある 階を えらんで" };
    if (f.hidden) return { ok: false, why: "もう 開いて いる" };
    f.hidden = true;
  } else if (k === "collar" || k === "snack3") {   // なかよしの首輪 ＋5・とくべつおやつ ＋3
    const c = rec.tamed.find((x) => x.uid === b.uid);
    if (!c) return { ok: false, why: "その 子は いない" };
    const need = SNACK_NEED[rankOf(c)];
    if (c.gauge >= need) return { ok: false, why: "もう なかよし" };
    c.gauge = Math.min(need, c.gauge + (k === "collar" ? 5 : 3));
  } else if (k === "recipe") {   // 作るの レシピ（タスクの ごほうび）：えらんだ レシピを 出す
    const r = CRAFT.find((x) => x.base === b.base);
    if (!r) return { ok: false, why: "レシピを えらんで" };
    if (rec.recipes.includes(r.base) || craftOpen(r, new Set(rec.seen))) return { ok: false, why: "その レシピは もう 出て いる" };
    rec.recipes.push(r.base);
  } else return { ok: false, why: "使えない 品" };
  rec.items[k]--;
  return { ok: true };
}

// ---------- 見せる 形 ----------
export function deeplinkView(rec, day) {
  ensureTrade(rec);
  const traders = SHOPS.map((s) => {
    const t = traderOf(rec, s.id, day), lv = s === SPECIAL ? 1 : repLv(t.rep);
    const shop = s.shop.map((it) => ({ id: it.id, lv: it.lv, price: it.price, cur: it.cur, open: lv >= it.lv, left: it.stock ? it.stock - ((it.week ? t.wbuy : t.buy)[it.id] || 0) : null, done: !!(it.get && it.get.perk && rec.perks[it.get.perk]) }));
    if (s === SPECIAL) return { id: s.id, shop };
    const ks = tasksOf(s.id, t, day), task = (k, c, done, tr) => ({ n: k.n, kind: k.kind, found: !!k.found, text: k.text, need: k.need, unit: k.unit, cond: k.condText || null, have: progressOf(rec, k, c, tr), reward: k.reward, done });
    return { id: s.id, rep: t.rep, lv, chain: task(ks.chain, t.cp, false, t), daily: task(ks.daily, t.dp, !!t.ddone), shop };
  });
  return { traders, perks: rec.perks, items: rec.items, recipes: rec.recipes };
}
