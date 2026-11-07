// 競り（ガラク）と フリマ（アンビル・ピーコ）の 門番。決まりは ./auction.js（鹿さんの 決めと Claude の 案は そちらの 頭）
// ① 人の 記録（Viewer）：出す 品・入札の クレジットを 先に 取って（rec.au.out に もどす 物を のこして 記録を 保存してから）Market へ 送る
//    Market が ことわったら すぐ もどす。返事が なければ 次に /au/settle で たしかめる（したなら そのまま・して いなければ 取り消しの しるしを のこして もどす）
//    受けとる 物（落札した 品・売れた クレジット・入札で 負けた 分・売れ残りの 引き取り）は Market の 送る 箱から /inbox で とどく（giveAu）
// ② Market（みんなで 1 つの 箱）：出品は "au:l:<番号>"・1 人ごとの やりとりの 覚えは "au:u:<id>"（同じ 番号は 1 回目の 答え）・番号は "au:n"
//    Viewer から 頼まれた ときに その場で Viewer へ 送らない（送る 箱 tell → アラーム。おたがいに 待って 動かなく なるのを ふせぐ）
import { AU_MODES, isMode, AU_PRICE_MAX, AU_MAT_MAX, AU_LEFT_MS, AU_KEEP_MS, slotsOf, modeOpen, feeOf, cutOf, minBid, itemWhy, isGear, gearSlot, takePrice, halfScrap, endHows } from "./auction.js";
import { give, putMats, putEquip } from "./lounge-game.js";
import { bump } from "./lounge-trade.js";
import { sale } from "./lounge-stock.js";
import { jstDay } from "./lounge-rules.js";
import { equippedUids } from "./lounge-pet.js";
import { groupAff, ensureBz } from "./lounge-border.js";

const res = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const newUid = (rec, p) => p + (++rec.uidN).toString(36);
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const NOCONN = "いまは 競り場に つながらない";
const WAIT = "競り場が こたえませんでした。つぎに 開いた ときに 決まります（2 回 へる ことは ありません）";
const LOG_KEEP = 20, OPS_KEEP = 50;

// ---------- 人の 記録（Viewer） ----------
export const ensureAu = (rec) => (rec.au ||= { out: [], tn: 0, log: [] });
const affOf = (rec, mode) => groupAff(rec, AU_MODES[mode].group);
const ask = async (v, path, body) => (await v.market().fetch("https://market/au/" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined)).json();

// 出す 品を えらぶ（まだ 取らない）。b.item：{ k: "mat", id, q, n } ・{ k: "sphere"|"equip"|"sample", uid }
function pickItem(rec, b) {
  const x = b && typeof b === "object" ? b : {};
  if (x.k === "mat") {
    const n = int(x.n, 1, AU_MAT_MAX), q = int(x.q ?? 0, 0, 5);
    if (typeof x.id !== "string" || n == null || q == null) return { why: `素材と 数（1〜${AU_MAT_MAX}）を えらんで` };
    const have = rec.own.mats.filter((m) => m.id === x.id && (m.q || 0) === q).sort((a, c) => (c.b ? 1 : 0) - (a.b ? 1 : 0));   // 買った 物から 出す（拾った 物を タスクに のこす）
    if (have.reduce((a, m) => a + m.n, 0) < n) return { why: "その 素材が 足りない" };
    let left = n, b1 = false; const use = [];
    for (const m of have) { const k = Math.min(left, m.n); if (!k) continue; use.push([m, k]); if (m.b) b1 = true; left -= k; if (!left) break; }
    const it = { k: "mat", id: x.id, q, n, ...(b1 ? { b: 1 } : {}) };
    return { it, take: () => { for (const [m, k] of use) m.n -= k; rec.own.mats = rec.own.mats.filter((m) => m.n > 0); }, back: { mats: use.map(([m, k]) => ({ id: m.id, q: m.q || 0, n: k, ...(m.b ? { b: 1 } : {}) })) } };
  }
  if (x.k === "sphere") {
    const s = (rec.own.spheres || []).find((y) => y.uid === x.uid);
    if (!s) return { why: "その スフィアは ない" };
    if (!s.known) return { why: "鑑定して いない スフィアは 出せない（ガラクで 鑑定）" };
    const it = { k: "sphere", op: s.op, star: s.star, ...(s.did ? { did: s.did } : {}) };
    return { it, take: () => { rec.own.spheres = rec.own.spheres.filter((y) => y !== s); }, back: { auBack: [it] } };
  }
  if (x.k === "equip") {
    const e = rec.own.equip.find((y) => y.uid === x.uid);
    if (!e) return { why: "その 装備は ない" };
    if (equippedUids(rec).has(e.uid)) return { why: "付けて いる 装備は 出せない（はずして から）" };
    const it = { k: "equip", base: e.base, star: e.star, ops: [...(e.ops || [])], ...(e.opStar ? { opStar: { ...e.opStar } } : {}), ...(e.fx ? { fx: true } : {}), ...(e.mk ? { mk: 1 } : {}), ...(e.b ? { b: 1 } : {}) };
    return { it, take: () => { rec.own.equip = rec.own.equip.filter((y) => y !== e); for (const a of rec.own.att || []) if (a.on === e.uid) a.on = null; }, back: { auBack: [it] } };   // 付いて いた アタッチメントは のこす（工房の 決まり）
  }
  if (x.k === "sample") {
    const Z = ensureBz(rec), s = Z.samples.find((y) => y.uid === x.uid);
    if (!s) return { why: "その サンプルは ない" };
    const it = { k: "sample", id: s.id, star: s.star, known: !!s.known };
    return { it, take: () => { Z.samples = Z.samples.filter((y) => y !== s); }, back: { auBack: [it] } };
  }
  return { why: "品を えらんで" };
}

// 受けとる 品を 記録へ。won：ほかの 人から（買った 物の しるし b を つけ・作った しるし mk を はずす）
function putItems(rec, items, won, now) {
  const fl = (it) => (won ? { b: 1 } : it.b ? { b: 1 } : {});
  for (const it of items || []) {
    if (!it || typeof it !== "object") continue;
    if (it.k === "mat") putMats(rec, [{ id: it.id, q: it.q || 0, n: it.n, ...fl(it) }], now);
    else if (it.k === "equip") putEquip(rec, [{ base: it.base, star: it.star, ops: it.ops || [], ...(it.opStar ? { opStar: it.opStar } : {}), ...(it.fx ? { fx: true } : {}), ...(!won && it.mk ? { mk: 1 } : {}), ...fl(it) }], now);
    else if (it.k === "sphere") (rec.own.spheres ||= []).push({ uid: newUid(rec, "s"), op: it.op, star: it.star, ...(it.did ? { did: it.did } : {}), known: true });   // 持てる 数（100）を こえても 入れる（買った 物を 消さない）
    else if (it.k === "sample") ensureBz(rec).samples.push({ uid: newUid(rec, "x"), id: it.id, star: it.star, known: !!it.known });
  }
}
// Market の 送る 箱から（lounge-game.js の give から 呼ぶ）。g.auGet：落札・買った 品・g.auBack：もどる 品・g.au：知らせ
export function giveAu(rec, g, now = Date.now()) {
  if (g.auGet) putItems(rec, g.auGet, true, now);
  if (g.auBack) putItems(rec, g.auBack, false, now);
  const n = g.au; if (!n || typeof n !== "object" || !isMode(n.mode)) return;
  const A = ensureAu(rec), M = AU_MODES[n.mode];
  if (n.k === "sold") {   // 自分の 出品が 売れた（タスク「競りで 自分の 出品が 落札される」「フリマで 武器が 売れる」など）
    bump(rec, { type: M.bid ? "auSold" : "fmSold", n: 1, ...(n.slot ? { slot: n.slot } : {}), star: n.star || 0 }, jstDay(now));
    if (n.cut > 0) sale(rec, M.co, n.cut);   // 売れた ときの 手数料は その 会社の 売り上げ（トークン）
  }
  A.log = [{ k: n.k, mode: n.mode, lid: n.lid, at: now, ...(n.amt != null ? { amt: n.amt } : {}), ...(n.got != null ? { got: n.got } : {}), ...(n.item ? { item: n.item } : {}) }, ...(A.log || [])].slice(0, LOG_KEEP);
}

// 頼みの 答え（r）を 記録に：ことわられたら もどす・入札が 低く すんだら 差を もどす・うまく いったら タスクと 売り上げ
function apply(rec, e, r, now) {
  if (!r || !r.ok) { give(rec, e.back, now); return; }
  if (e.amt && Number.isInteger(r.paid) && r.paid < e.amt) rec.credits = (rec.credits || 0) + (e.amt - r.paid);
  if (e.sale) sale(rec, e.sale[0], e.sale[1]);
  for (const ev of e.ev || []) bump(rec, ev, jstDay(now));
}
// 返事が とどかなかった 頼みを たしかめる。まだ つながらなければ 答え（待つ）を 返す
export async function auSettle(v, rec, now = Date.now()) {
  const A = rec.au; if (!A || !A.out || !A.out.length) return null;
  for (const e of [...A.out]) {
    let j; try { j = await ask(v, "settle", { id: rec.id, opid: e.opid }); } catch (x) { return { ok: false, wait: true, why: WAIT }; }
    if (!j || !j.ok) return { ok: false, wait: true, why: WAIT };
    A.out = A.out.filter((x) => x !== e);
    apply(rec, e, j.done ? j.r : null, now);
  }
  return null;
}
// 頼む（先に 取った 物は e.back に。記録を 保存して から 送る）
async function call(v, rec, path, body, e, now) {
  const A = ensureAu(rec); A.tn = Math.max((A.tn || 0) + 1, now);   // 番号は 時刻から（記録が リセットされても 前の 番号と 重ならない）
  const opid = rec.id + ":" + A.tn.toString(36);
  if (e) { A.out.push({ ...e, opid }); await v.save(rec); }
  let j; try { j = await ask(v, path, { ...body, id: rec.id, name: rec.name, opid }); } catch (x) { return { ok: false, wait: true, why: WAIT }; }
  if (e) { A.out = A.out.filter((x) => x.opid !== opid); apply(rec, e, j, now); }
  return j;
}

// やること：au.view（{ mode }）・au.list（{ mode, item, price, buyout }）・au.bid（{ lid, amt }）・au.buy（{ lid, amt }）・au.end（{ lid, how }）
export async function auAct(v, rec, b, now = Date.now()) {
  if (!v.env.MARKET) return { ok: false, why: NOCONN };
  const A = ensureAu(rec), perks = rec.perks || {};
  const w = await auSettle(v, rec, now); if (w) return w;
  if (b.a === "au.view") {
    const mode = isMode(b.mode) ? b.mode : null; if (!mode) return { ok: false, why: "場を えらんで" };
    let j; try { j = await ask(v, `view?mode=${mode}&id=${encodeURIComponent(rec.id)}`); } catch (x) { return { ok: false, why: NOCONN }; }
    if (!j || !j.ok) return { ok: false, why: NOCONN };
    return { ok: true, mode, open: modeOpen(mode, perks), slots: slotsOf(mode, affOf(rec, mode), perks), list: j.list, mine: j.mine, bids: j.bids, log: (A.log || []).filter((x) => x.mode === mode) };
  }
  if (b.a === "au.list") {
    const mode = isMode(b.mode) ? b.mode : null, M = mode && AU_MODES[mode]; if (!M) return { ok: false, why: "場を えらんで" };
    if (!modeOpen(mode, perks)) return { ok: false, why: "ピーコの 店で「防具の 委託」を うけとると 出せる" };
    const p = pickItem(rec, b.item); if (p.why) return { ok: false, why: p.why };
    const why = itemWhy(mode, p.it); if (why) return { ok: false, why };
    const price = int(b.price, 1, AU_PRICE_MAX); if (price == null) return { ok: false, why: M.bid ? `開始値は 1〜${AU_PRICE_MAX.toLocaleString("ja-JP")}` : `値段は 1〜${AU_PRICE_MAX.toLocaleString("ja-JP")}` };
    const buyout = M.bid && b.buyout != null && b.buyout !== 0 ? int(b.buyout, price + 1, AU_PRICE_MAX) : null;
    if (M.bid && b.buyout != null && b.buyout !== 0 && buyout == null) return { ok: false, why: "即決の 値は 開始値より 高く" };
    const fee = feeOf(mode, price);
    if ((rec.credits || 0) < fee) return { ok: false, why: `出品料が 足りない：あと ${(fee - (rec.credits || 0)).toLocaleString("ja-JP")}` };
    p.take(); rec.credits -= fee;
    const slot = isGear(p.it) ? gearSlot(p.it.base) : null;
    const ev = M.bid ? [{ type: "auAct", n: 1 }, { type: "auPost", n: 1, ...(slot ? { slot } : {}) }] : [{ type: "fmPost", n: 1, slot, star: p.it.star }];   // タスク「競りに 出品するか 入札する」「武器を フリマに 委託する」
    const j = await call(v, rec, "list", { mode, item: p.it, price, ...(buyout ? { buyout } : {}), slots: slotsOf(mode, affOf(rec, mode), perks) }, { back: { ...p.back, credits: fee }, sale: [M.co, fee], ev }, now);
    return j.ok ? { ok: true, lid: j.lid, fee } : j;
  }
  if (b.a === "au.bid" || b.a === "au.buy") {
    if (typeof b.lid !== "string" || !b.lid) return { ok: false, why: "品を えらんで" };
    const amt = int(b.amt, 1, AU_PRICE_MAX); if (amt == null) return { ok: false, why: "値を 入れて" };
    if ((rec.credits || 0) < amt) return { ok: false, why: `クレジットが 足りない：あと ${(amt - (rec.credits || 0)).toLocaleString("ja-JP")}` };
    rec.credits -= amt;   // 入札の あいだ あずける（負けたら もどる）
    const bid = b.a === "au.bid", ev = bid ? [{ type: "auAct", n: 1 }, { type: "auBid", n: 1 }] : [];   // タスク「競りで 入札する」
    const j = await call(v, rec, bid ? "bid" : "buy", { lid: b.lid, amt }, { back: { credits: amt }, amt, ev }, now);
    return j.ok ? { ok: true, paid: j.paid, ...(j.sold ? { sold: true } : {}) } : j;
  }
  if (b.a === "au.end") {
    if (typeof b.lid !== "string" || !b.lid) return { ok: false, why: "品を えらんで" };
    const how = ["take", "scrap", "back"].includes(b.how) ? b.how : null; if (!how) return { ok: false, why: "引き取り か リサイクルを えらんで" };
    const j = await call(v, rec, "end", { lid: b.lid, how }, null, now);
    return j.ok ? { ok: true, how } : j;
  }
  return { ok: false, why: "知らない やること" };
}

// ---------- Market（みんなで 1 つの 箱） ----------
async function load(mk) {
  if (mk.au) return mk.au;
  const st = mk.state.storage;
  mk.au = { L: Object.fromEntries([...(await st.list({ prefix: "au:l:" })).values()].map((x) => [x.lid, x])), n: (await st.get("au:n")) || Date.now() };   // 番号は 時刻から（リセットで 消えても 前の 番号と 重ならない。知らせの 番号〈au:番号:…〉を Viewer が 1 回だけ 受ける ため）
  return mk.au;
}
const putL = (mk, x) => mk.state.storage.put("au:l:" + x.lid, x);
const user = async (st, id) => (await st.get("au:u:" + id)) || { id, ops: [] };
const brief = (it) => (it.k === "sample" && !it.known ? { k: it.k, id: it.id, known: false } : (({ b, ...o }) => o)(it));   // 見せる 形（鑑定して いない サンプルの ★は 見せない・買った しるしは 出さない）
function pub(L, id) {
  const mine = L.by === id, o = { lid: L.lid, mode: L.mode, name: L.name, item: brief(L.item), at: L.at, until: L.until, status: L.status, mine };
  if (AU_MODES[L.mode].bid) Object.assign(o, { start: L.start, ...(L.buyout ? { buyout: L.buyout } : {}), bids: L.bids, min: minBid(L), bid: L.bid ? { amt: L.bid.amt, name: L.bid.name, me: L.bid.by === id } : null });
  else o.price = L.price;
  if (mine) Object.assign(o, { fee: L.fee, ...(L.amt != null ? { amt: L.amt, cut: L.cut } : {}), ...(L.got != null ? { got: L.got } : {}), ...(L.end ? { end: L.end } : {}) });
  if (mine && (L.status === "open" || L.status === "left")) Object.assign(o, { hows: endHows(L.item), take: isGear(L.item) ? takePrice(L.item) : 0 });   // 取り下げ・売れ残りで えらべる こと
  return o;
}
// 売れた：買った 人へ 品・出した 人へ 代金（手数料を 引く）
async function sold(mk, L, by, name, amt, now) {
  const cut = cutOf(L.mode, amt), it = L.item;
  Object.assign(L, { status: "sold", end: now, buyer: by, buyerName: String(name || "").slice(0, 40), amt, cut });
  await putL(mk, L);
  const info = { mode: L.mode, lid: L.lid, amt, item: brief(it) };
  await mk.tell(by, `au:${L.lid}:get`, { give: { auGet: [it], au: { k: "won", ...info } } });
  await mk.tell(L.by, `au:${L.lid}:pay`, { give: { credits: amt - cut, au: { k: "sold", ...info, cut, star: it.star || 0, ...(isGear(it) ? { slot: gearSlot(it.base) } : {}) } } });
}
const refundBid = (mk, L) => mk.tell(L.bid.by, `au:${L.lid}:r${L.bids}`, { give: { credits: L.bid.amt, au: { k: "outbid", mode: L.mode, lid: L.lid, amt: L.bid.amt, item: brief(L.item) } } });
// 売れ残り・取り下げの 終わり方：引き取り（クレジット）・リサイクル（素材の 5 割）・もどす（装備で ない 物）
async function finish(mk, L, how, now) {
  const info = { mode: L.mode, lid: L.lid, item: brief(L.item) };
  if (how === "take") { const got = takePrice(L.item); Object.assign(L, { status: "taken", got }); await mk.tell(L.by, `au:${L.lid}:end`, { give: { credits: got, au: { k: "take", ...info, got } } }); }
  else if (how === "scrap") { const mats = halfScrap(L.item, Math.random); Object.assign(L, { status: "scrapped", got: mats.reduce((a, m) => a + m.n, 0) }); await mk.tell(L.by, `au:${L.lid}:end`, { give: { mats, au: { k: "scrap", ...info, got: L.got } } }); }
  else { L.status = "back"; await mk.tell(L.by, `au:${L.lid}:end`, { give: { auBack: [L.item], au: { k: "back", ...info } } }); }
  L.end = now; await putL(mk, L);
}
// 期限の 来た 出品を 終える。つぎに 起きる 時刻を 返す
async function sweep(mk, now) {
  const K = await load(mk); let next = Infinity;
  for (const L of Object.values(K.L)) {
    if (L.status === "open" && L.until <= now) {
      if (L.bid) await sold(mk, L, L.bid.by, L.bid.name, L.bid.amt, now);
      else if (!isGear(L.item)) await finish(mk, L, "back", now);
      else { Object.assign(L, { status: "left", leftAt: now }); await putL(mk, L); }
    }
    if (L.status === "left" && now - L.leftAt >= AU_LEFT_MS) await finish(mk, L, "take", now);   // 7 日 えらばなければ 引き取り
    if (!["open", "left"].includes(L.status) && now - (L.end || L.at) >= AU_KEEP_MS) { delete K.L[L.lid]; await mk.state.storage.delete("au:l:" + L.lid); continue; }
    next = Math.min(next, L.status === "open" ? L.until : L.status === "left" ? L.leftAt + AU_LEFT_MS : (L.end || L.at) + AU_KEEP_MS);
  }
  return next;
}
export const auAlarm = (mk, now) => sweep(mk, now);

// Market の fetch から（/au/…）。ほかの 道は null
export async function auFetch(mk, url, b, now) {
  if (!url.pathname.startsWith("/au/")) return null;
  const K = await load(mk), st = mk.state.storage, path = url.pathname.slice(4);
  await sweep(mk, now);
  const id = String(b.id || url.searchParams.get("id") || "");
  if (path === "view") {
    const mode = url.searchParams.get("mode"); if (!isMode(mode)) return res({ ok: false, why: "場を えらんで" });
    const all = Object.values(K.L).filter((L) => L.mode === mode);
    return res({ ok: true, now,
      list: all.filter((L) => L.status === "open" && L.until > now).sort((a, c) => a.until - c.until).slice(0, 300).map((L) => pub(L, id)),
      mine: all.filter((L) => L.by === id).sort((a, c) => c.at - a.at).map((L) => pub(L, id)),
      bids: all.filter((L) => L.status === "open" && L.bid && L.bid.by === id).map((L) => pub(L, id)) });
  }
  if (!id || typeof b.opid !== "string" || !b.opid.startsWith(id + ":")) return res({ ok: false, why: "こわれた 頼み" });
  const u = await user(st, id), old = u.ops.find((x) => x[0] === b.opid);
  if (path === "settle") {
    if (old) return res({ ok: true, done: true, r: old[1] });
    u.ops = [...u.ops, [b.opid, { ok: false, why: "返事が とどかなかったので 取り消した" }]].slice(-OPS_KEEP); await st.put("au:u:" + id, u);
    return res({ ok: true, done: false });
  }
  if (old) return res(old[1]);
  const L = typeof b.lid === "string" ? K.L[b.lid] : null;
  let out;
  if (path === "list") {
    const mode = isMode(b.mode) ? b.mode : null, M = mode && AU_MODES[mode], price = int(b.price, 1, AU_PRICE_MAX), slots = int(b.slots, 1, 20);
    const used = mode ? Object.values(K.L).filter((x) => x.by === id && x.mode === mode && (x.status === "open" || x.status === "left")).length : 0;
    if (!M || price == null || slots == null || itemWhy(mode, b.item)) out = { ok: false, why: "こわれた 頼み" };
    else if (used >= slots) out = { ok: false, why: `出品の 枠が いっぱい（${slots} こ）。売れるか 終わるのを 待って` };
    else {
      const lid = (++K.n).toString(36), buyout = M.bid && Number.isInteger(b.buyout) && b.buyout > price ? b.buyout : null;
      const x = { lid, mode, by: id, name: String(b.name || "").slice(0, 40), item: b.item, fee: feeOf(mode, price), at: now, until: now + M.ms, status: "open",
        ...(M.bid ? { start: price, ...(buyout ? { buyout } : {}), bid: null, bids: 0 } : { price }) };
      K.L[lid] = x; await putL(mk, x); await st.put("au:n", K.n); await mk.wake(x.until);
      out = { ok: true, lid };
    }
  } else if (path === "bid" || path === "buy") {
    const amt = int(b.amt, 1, AU_PRICE_MAX), bid = path === "bid";
    if (!L || L.status !== "open" || L.until <= now) out = { ok: false, why: "その 出品は もう 終わった" };
    else if (L.by === id) out = { ok: false, why: "自分の 出品には 入れられない" };
    else if (!!AU_MODES[L.mode].bid !== bid) out = { ok: false, why: "こわれた 頼み" };
    else if (amt == null) out = { ok: false, why: "値を 入れて" };
    else if (!bid) {
      if (amt < L.price) out = { ok: false, why: "値段が かわった（もう 一度 見て）" };
      else { await sold(mk, L, id, b.name, L.price, now); out = { ok: true, paid: L.price, sold: true }; }
    } else if (L.buyout && amt >= L.buyout) {
      if (L.bid) await refundBid(mk, L);   // 前の 最高値の 人へ もどす（自分の 入札でも）
      await sold(mk, L, id, b.name, L.buyout, now); out = { ok: true, paid: L.buyout, sold: true };   // 即決
    } else if (amt < minBid(L)) out = { ok: false, why: `${minBid(L).toLocaleString("ja-JP")} から 入れられる（5% 刻み）` };
    else {
      if (L.bid) await refundBid(mk, L);   // 前の 最高値の 人へ もどす（自分で 上げ直した ときも）
      L.bids++; L.bid = { by: id, name: String(b.name || "").slice(0, 40), amt }; await putL(mk, L);
      out = { ok: true, paid: amt };
    }
  } else if (path === "end") {
    if (!L || L.by !== id) out = { ok: false, why: "その 出品は ない" };
    else if (L.status !== "open" && L.status !== "left") out = { ok: false, why: "その 出品は もう 終わった" };
    else if (L.status === "open" && L.bid) out = { ok: false, why: "入札が ある 出品は 取り下げられない" };
    else if (!endHows(L.item).includes(b.how)) out = { ok: false, why: isGear(L.item) ? "引き取り か リサイクルを えらんで" : "こわれた 頼み" };
    else { await finish(mk, L, b.how, now); out = { ok: true }; }
  } else return res({ error: "notfound" }, 404);
  u.ops = [...u.ops, [b.opid, out]].slice(-OPS_KEEP); await st.put("au:u:" + id, u);
  return res(out);
}
