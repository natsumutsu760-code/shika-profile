// 株（トークン）の 門番。銘柄と 値の 式は ./stocks.js、決まりの もとは docs/mono-link-deeplink-story.md（鹿さんの 決め）・数は docs/mono-link-numbers.md 3 章（Claude の 案）
// ① 売り上げ：サービスに 払った クレジットを sale() で その 子会社に つける（人の 記録の stock.q）。act の あとで Market へ 送る（stockFlush）
//    送る 束には 番号（sid）を つけ、Market は 同じ 番号を 1 回だけ 数える（返事が とどかなくても 2 重に ならない。のこして つぎに また 送る）
// ② 値・売り買い・配当：Market（みんなで 1 つの 箱）が 持つ。鍵は "st:m"（値・買い越し・ゆらぎ・値の 記録・ニュース）・"st:s"（売り上げ 1 時間ごと・1 日ごと）・"st:h:<id>"（1 人の 持ち株）
//    値は 1 時間ごとに 決まる（stockAlarm。止まって いても 次に 読んだ ときに 追いつく）。配当は 毎晩 22:00、送る 箱（"o:"）で 人の 記録へ
//    売り買いの クレジットは 人の 記録（Viewer）で 動かす。Market は 持ち株・値・上限を たしかめて、払う 数を 返す
//    取引の 返事が とどかなかった ときは rec.stock.out に のこし、つぎに /stock/settle で たしかめる（したなら その 答え、して いなければ 取り消しの しるしを のこす）
import { STOCKS, isCo, ST, salesPart, priceOf, tradePrice, tradeCost, noiseAt, minShares } from "./stocks.js";
import { baseOf } from "./equip.js";

const HOUR = 3600e3, JST = 9 * HOUR;
const ymd = (ms) => new Date(ms + JST).toISOString().slice(0, 10);
const jstHour = (ms) => new Date(ms + JST).getUTCHours();
const DECAY = Math.pow(0.5, 1 / ST.flowHalf);
const r1 = (v) => Math.round(v * 10) / 10;
const res = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

// ---------- ① 売り上げを つける（人の 記録の 中。どの 支払いが どの 会社かは docs/mono-link-numbers.md 3 章の 表） ----------
export const coOf = (s) => (typeof s === "string" && isCo(s.slice(0, 3)) ? s.slice(0, 3) : null);   // 商人の co（"GLK ガラク・サルベージ"）から 記号
export function sale(rec, co, n) {
  if (!isCo(co) || !Number.isFinite(n) || !n) return;
  const S = (rec.stock ||= {}), q = (S.q ||= {});
  q[co] = Math.round((q[co] || 0) + n);
  if (!q[co]) delete q[co];
}
// 施設の 維持費：4 割は ヘリクス電力（電気代）・6 割は グラナート建設（鹿さんの 構想「既存の 設備も…維持コスト」→ 割り方は Claude の 案）
export const upkeepSale = (rec, fee) => { if (!(fee > 0)) return; const h = Math.round(fee * 0.4); sale(rec, "HLX", h); sale(rec, "GRN", fee - h); };
// 装備（開発・ユニーク・作る・合成・OP の 抽選）：武器は ヴァルコ火器（アンビル）・防具は ローゼル繊工（ピーコ）
export const gearCo = (base) => ((baseOf(base) || {}).slot === "weapon" ? "VLC" : "RSL");
// 工房で 作る 道具：畑の 物は クロロシス・薬と お茶は メルヴィル製薬・つるはしと ランプは ドルン鉱業・狩りの 道具は オルド・ハウンド・エンチャントは ヴァルコ火器・お守りは ローゼル繊工・ほかは グラナート建設
export const wsCo = (id) => (/^(sprinkler|fert)/.test(id) ? "CLR" : /^(tea|detox|cure|revive|incense)/.test(id) ? "MLV" : /^(pickaxe|lamp)/.test(id) ? "DRN" : /^(lure|net)$/.test(id) ? "ODH"
  : /^ench_/.test(id) ? "VLC" : /^charm_/.test(id) ? "RSL" : id === "blankcore" ? "GLK" : "GRN");

// ---------- 人の 記録（Viewer）から ----------
// 売り上げを Market へ（act・init の あと）。返事が なければ そのまま のこす
export async function stockFlush(v, rec) {
  const S = rec.stock; if (!S || !v.env.MARKET) return;
  if (!S.send && S.q && Object.keys(S.q).length) { S.n = Math.max(Date.now(), (S.n || 0) + 1); S.send = { sid: S.n, s: S.q }; S.q = {}; }   // 番号は 時刻（記録が リセットされても 前の 番号より 大きい）
  if (!S.send) return;
  try {
    const j = await (await v.market().fetch("https://market/stock/sales", { method: "POST", body: JSON.stringify({ id: rec.id, sid: S.send.sid, s: S.send.s }) })).json();
    if (j.ok) S.send = null;
  } catch (e) {}
}
const ask = async (v, path, body) => (await v.market().fetch("https://market/stock/" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined)).json();
const applyTrade = (rec, j) => { if (!j || !j.ok) return; rec.credits = (rec.credits || 0) + j.credits; const S = (rec.stock ||= {}); S.h = j.h; if (j.n > 0) S.buyN = (S.buyN || 0) + 1; else S.sellN = (S.sellN || 0) + 1; };
// 前の 取引の 返事が とどいて いなければ たしかめる。まだ つながらなければ 答え（待つ）を 返す
async function settle(v, rec) {
  const S = rec.stock; if (!S || !S.out) return null;
  let j; try { j = await ask(v, "settle", { id: rec.id, opid: S.out }); } catch (e) { return { ok: false, wait: true, why: "前の 取引の 返事を 待って いる（取引所が こたえません）" }; }
  S.out = null;
  if (j.done) { applyTrade(rec, j.r); return null; }
  return null;
}
// やること：stock.view（値・持ち株・ニュース）・stock.buy・stock.sell（{ co, n }）
export async function stockAct(v, rec, b, op) {
  if (!v.env.MARKET) return { ok: false, why: "取引所に つながらない" };
  await stockFlush(v, rec);   // 自分の 売り上げも 先に 入れる
  const w = await settle(v, rec); if (w) return w;
  const view = async () => { try { const j = await ask(v, "view?id=" + encodeURIComponent(rec.id)); if (j.ok) (rec.stock ||= {}).h = j.mine.h; return j; } catch (e) { return null; } };
  if (b.a === "stock.view") { const j = await view(); return j ? { ok: true, stock: j } : { ok: false, why: "取引所に つながらない" }; }
  const co = isCo(b.co) ? b.co : null, n = Number.isInteger(b.n) && b.n >= 1 && b.n <= ST.cap ? b.n : 0;
  if (!co) return { ok: false, why: "会社を えらんで" };
  if (!n) return { ok: false, why: `トークンの 数は 1〜${ST.cap}` };
  // 取引の 番号は 門番が 数える 番号（tn）＋ 画面の op。op だけだと、門番が op を 忘れた あと（200 件）に 同じ op を 送ると、取引所（30 件 おぼえる）の 前の 答えで
  // クレジットが もう一度 ふえて しまう（2026-11-06 の 安全確認の 指摘）。tn は 記録を 保存する ときに 進むので、保存の 前に 止まって やり直した ときだけ 同じ 番号に なる
  const S = (rec.stock ||= {}); S.tn = S.tn ? S.tn + 1 : Date.now();   // はじめは 時刻（記録が リセットされても 前の 番号と 重ならない）
  const sell = b.a === "stock.sell", opid = rec.id + ":" + S.tn + ":" + op;
  let j;
  try { j = await ask(v, "trade", { id: rec.id, name: rec.name, opid, co, n: sell ? -n : n, max: Math.max(0, rec.credits || 0) }); }
  catch (e) { (rec.stock ||= {}).out = opid; return { ok: false, wait: true, why: "取引所が こたえませんでした。つぎに 開いた ときに 決まります" }; }
  if (!j.ok) return { ok: false, why: j.why };
  applyTrade(rec, j);
  const s = await view();
  return { ok: true, co, n: j.n, price: j.price, paid: -j.credits, ...(j.gain != null ? { gain: j.gain } : {}), ...(s ? { stock: s } : {}) };
}

// ---------- Market（みんなで 1 つの 箱）----------
const zeros = (v) => Object.fromEntries(STOCKS.map((s) => [s.co, v]));
const fresh = (now) => ({ start: now, hour: Math.floor(now / HOUR), sp: zeros(1), z: zeros(0), f: zeros(0), held: zeros(0), hist: Object.fromEntries(STOCKS.map((s) => [s.co, []])), news: [], div: null });
async function load(mk) {
  if (mk.stk) return mk.stk;
  const st = mk.state.storage;
  mk.stk = { m: (await st.get("st:m")) || null, s: (await st.get("st:s")) || { hr: {}, day: {} } };
  return mk.stk;
}
const saveM = (mk) => mk.state.storage.put("st:m", mk.stk.m);
const saveS = (mk) => mk.state.storage.put("st:s", mk.stk.s);
const sumHr = (hr, a, b) => { const o = {}; for (const [k, x] of Object.entries(hr)) if (+k >= a && +k < b) for (const [co, n] of Object.entries(x)) o[co] = (o[co] || 0) + n; return o; };
const sumDays = (day, T) => { const from = ymd(T - (ST.far / 24 - 1) * 864e5), o = {}; for (const [d, x] of Object.entries(day)) if (d >= from) for (const [co, n] of Object.entries(x)) o[co] = (o[co] || 0) + n; return o; };
export const priceNow = (m, co) => priceOf(m.sp[co], m.z[co], m.f[co]);

// 1 時間 進める（h：その 時刻 h×1 時間 ちょうどの 区切り）
async function step(mk, K, h) {
  const m = K.m, T = h * HOUR, e = h - Math.floor(m.start / HOUR);
  const near = sumHr(K.s.hr, h - ST.near, h), far = sumDays(K.s.day, T), nh = Math.min(ST.near, e), fh = Math.min(ST.far, e);
  for (const { co, src } of STOCKS) {
    m.f[co] *= DECAY; if (Math.abs(m.f[co]) < 0.5) m.f[co] = 0;
    m.z[co] = m.z[co] * (1 - ST.noiseBack) + noiseAt(co, h) * ST.noise;
    m.sp[co] = src === false || e <= 0 ? 1 : salesPart((near[co] || 0) / nh, (far[co] || 0) / fh);
    const hs = (m.hist[co] ||= []); hs.push(priceNow(m, co)); if (hs.length > ST.hist) hs.shift();
  }
  newsAt(m, T);
  if (jstHour(T) === ST.divHour) await payDiv(mk, K, h);
}
// ニュース：24 時間で 10% 以上 動いた（同じ 銘柄は 1 日 1 回）・上限と 下限に とどいた
function newsAt(m, T) {
  for (const { co } of STOCKS) {
    const hs = m.hist[co], p = hs[hs.length - 1], prev = hs[hs.length - 2], q = hs.length > 24 ? hs[hs.length - 25] : null;
    if (q && Math.abs(p / q - 1) >= 0.1 && !m.news.some((x) => x.co === co && (x.k === "up" || x.k === "down") && T - x.at < 864e5)) m.news.push({ at: T, co, k: p > q ? "up" : "down", d: Math.round((p / q - 1) * 100) });
    if (prev != null && p >= ST.max && prev < ST.max) m.news.push({ at: T, co, k: "high" });
    if (prev != null && p <= ST.min && prev > ST.min) m.news.push({ at: T, co, k: "low" });
  }
  if (m.news.length > ST.news) m.news = m.news.slice(-ST.news);
}
// 配当（毎晩 22:00）：1 株 ＝ 22:00 までの 24 時間の 売り上げ × 5% ÷ 10,000。1 クレジット に 足りない 分は 次の 日へ もちこす
async function payDiv(mk, K, h) {
  const m = K.m, T = h * HOUR, day = ymd(T);
  if (m.div && m.div.day === day) return;
  const s24 = sumHr(K.s.hr, h - 24, h), per = Object.fromEntries(STOCKS.map(({ co }) => [co, (Math.max(0, s24[co] || 0) * ST.div) / ST.shares]));
  m.div = { day, at: T, per };
  const st = mk.state.storage;
  let sent = 0;
  for (const [k, r] of await st.list({ prefix: "st:h:" })) {
    if (!Object.values(r.h || {}).some((x) => x > 0)) continue;
    const tot = Object.entries(r.h).reduce((a, [co, n]) => a + n * (per[co] || 0), 0) + (r.frac || 0), pay = Math.floor(tot + 1e-9);
    r.frac = Math.max(0, tot - pay); r.last = { day, cr: pay };
    if (pay > 0) { r.got = (r.got || 0) + pay; r.divN = (r.divN || 0) + 1; await st.put("o:st:" + day + ":" + r.id, { to: r.id, mid: "st:" + day + ":" + r.id, give: { credits: pay, stockDiv: { day, cr: pay } } }); sent++; }
    await st.put(k, r);
  }
  const top = STOCKS.map((s) => s.co).sort((a, b) => per[b] - per[a])[0];
  if (per[top] > 0) m.news.push({ at: T, co: top, k: "div", d: Math.round(per[top] * 1000) / 1000 });
  if (sent) await mk.wake(Date.now());
}
// いまの 時間まで 進める（アラームでも 読んだ ときでも）。はじめて 動いた ときは 値を 100 から
async function tick(mk, now) {
  const K = await load(mk), H = Math.floor(now / HOUR);
  if (!K.m) { K.m = fresh(now); await saveM(mk); return K; }
  const m = K.m; if (H <= m.hour) return K;
  const from = Math.max(m.hour + 1, H - 47);   // 長く 止まって いたら さいごの 48 時間だけ 計算する（その 前の 分は 買い越しの もどりだけ）
  if (from > m.hour + 1) { const k = Math.pow(DECAY, from - m.hour - 1); for (const { co } of STOCKS) m.f[co] *= k; }
  for (let h = from; h <= H; h++) await step(mk, K, h);
  m.hour = H;
  for (const k of Object.keys(K.s.hr)) if (+k < H - ST.near - 24) delete K.s.hr[k];
  const old = ymd(now - (ST.far / 24 + 2) * 864e5); for (const d of Object.keys(K.s.day)) if (d < old) delete K.s.day[d];
  await saveM(mk); await saveS(mk);
  return K;
}
export const nextHour = (now) => (Math.floor(now / HOUR) + 1) * HOUR;
const nextDiv = (now) => { const d = Date.parse(ymd(now) + "T00:00:00Z") - JST + ST.divHour * HOUR; return d > now ? d : d + 864e5; };
const holder = async (st, id) => (await st.get("st:h:" + id)) || { id, h: {}, c: {}, ops: [], sid: 0 };

// Market の アラームで：1 時間ごとの 値と 22:00 の 配当。つぎに 起きる 時刻を 返す（はじまって いなければ Infinity）
export async function stockAlarm(mk, now) {
  const K = await load(mk); if (!K.m) return Infinity;
  await tick(mk, now);
  return nextHour(now);
}

// Market の fetch から（/stock/…）。ほかの 道は null
export async function stockFetch(mk, url, b, now) {
  if (!url.pathname.startsWith("/stock/")) return null;
  const K = await tick(mk, now), m = K.m, st = mk.state.storage, path = url.pathname.slice(7);
  await mk.wake(nextHour(now));
  const id = String(b.id || url.searchParams.get("id") || "");
  // 売り上げ（Viewer の stockFlush）：同じ 番号は 1 回だけ
  if (path === "sales") {
    if (!id || !Number.isFinite(b.sid) || !b.s || typeof b.s !== "object") return res({ ok: false, why: "こわれた 頼み" });
    const r = await holder(st, id);
    if (b.sid <= (r.sid || 0)) return res({ ok: true, again: true });
    const H = Math.floor(now / HOUR), d = ymd(now), hr = (K.s.hr[H] ||= {}), dy = (K.s.day[d] ||= {});
    for (const [co, n] of Object.entries(b.s)) if (isCo(co) && Number.isFinite(n) && Math.abs(n) <= 1e8) { hr[co] = (hr[co] || 0) + n; dy[co] = (dy[co] || 0) + n; }
    r.sid = b.sid; await st.put("st:h:" + id, r); await saveS(mk);
    return res({ ok: true });
  }
  // 売り買い（Viewer の stockAct）。n > 0 は 買う・n < 0 は 売る。max：いま 持って いる クレジット。同じ opid は 1 回目の 答え
  if (path === "trade") {
    const co = isCo(b.co) ? b.co : null, n = Number.isInteger(b.n) && b.n !== 0 && Math.abs(b.n) <= ST.cap ? b.n : 0;
    if (!id || typeof b.opid !== "string" || !b.opid.startsWith(id + ":") || !co || !n) return res({ ok: false, why: "こわれた 頼み" });
    const r = await holder(st, id), old = r.ops.find((x) => x[0] === b.opid);
    if (old) return res(old[1]);
    const cur = r.h[co] || 0, avg = tradePrice(m.sp[co], m.z[co], m.f[co], n), cost = tradeCost(avg, n);
    let out;
    if (n > 0 && cur + n > ST.cap) out = { ok: false, why: `1 社 ${ST.cap.toLocaleString("ja-JP")} トークンまで（いま ${cur}）` };
    else if (n > 0 && m.held[co] + n > ST.shares) out = { ok: false, why: `売りに 出て いる トークンが 足りない（あと ${ST.shares - m.held[co]}）` };
    else if (n > 0 && n * avg < ST.minBuy) out = { ok: false, why: `${ST.minBuy.toLocaleString("ja-JP")} クレジットから（いまの 値で ${minShares(priceNow(m, co))} トークン〜）` };   // 鹿さんの 決め（2026-11-06）
    else if (n > 0 && cost > (+b.max || 0)) out = { ok: false, why: `クレジットが 足りない：あと ${(cost - (+b.max || 0)).toLocaleString("ja-JP")}` };
    else if (n < 0 && cur < -n) out = { ok: false, why: `持って いる トークンが 足りない（${cur}）` };
    else {
      let gain = null;
      if (n > 0) r.c[co] = (r.c[co] || 0) + cost;
      else { const basis = Math.round(((r.c[co] || 0) * -n) / cur); gain = -cost - basis; r.c[co] = (r.c[co] || 0) - basis; }   // 売った 株の 買った 値（平均）との 差
      r.h[co] = cur + n; if (!r.h[co]) { delete r.h[co]; delete r.c[co]; }
      m.f[co] += n; m.held[co] += n;
      out = { ok: true, co, n, price: r1(avg), credits: -cost, h: { ...r.h }, ...(gain != null ? { gain } : {}) };
    }
    if (typeof b.name === "string" && b.name) r.name = b.name.slice(0, 40);
    r.ops = [...r.ops, [b.opid, out]].slice(-30);
    await st.put("st:h:" + id, r); if (out.ok) await saveM(mk);
    return res(out);
  }
  // 返事が とどかなかった 取引：したなら その 答え。して いなければ 取り消しの しるし（おくれて とどいても しない）
  if (path === "settle") {
    if (!id || typeof b.opid !== "string" || !b.opid.startsWith(id + ":")) return res({ ok: false, why: "こわれた 頼み" });
    const r = await holder(st, id), old = r.ops.find((x) => x[0] === b.opid);
    if (old) return res({ ok: true, done: true, r: old[1] });
    r.ops = [...r.ops, [b.opid, { ok: false, why: "返事が とどかなかったので 取り消した" }]].slice(-30);
    await st.put("st:h:" + id, r);
    return res({ ok: true, done: false });
  }
  // 見る：値（いま・24 時間 前・7 日の 記録）・持ち株・ニュース・つぎの 配当
  if (path === "view") {
    const r = id ? await st.get("st:h:" + id) : null;
    const list = STOCKS.map(({ co }) => { const hs = m.hist[co] || [], p = priceNow(m, co); return { co, p, p24: hs.length >= 24 ? hs[hs.length - 24] : hs[0] || p, hist: hs, held: m.held[co], div: m.div ? Math.round((m.div.per[co] || 0) * 1000) / 1000 : 0 }; });
    return res({ ok: true, now, list, mine: r ? { h: r.h, c: r.c, last: r.last || null, got: r.got || 0, divN: r.divN || 0 } : { h: {}, c: {}, last: null, got: 0, divN: 0 }, news: m.news.slice(-12).reverse(), div: m.div ? { day: m.div.day, at: m.div.at } : null, nextDiv: nextDiv(now) });
  }
  return res({ error: "notfound" }, 404);
}
