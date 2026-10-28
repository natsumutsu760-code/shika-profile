// プライベートラウンジ：1 人 1 つの 記録の 箱（Durable Object「Viewer」。idFromName("v:" + Twitch の id)）
// 作りは docs/mono-link-lounge-server.md。2 だんかい目：記録を 作る・見る・部屋の 置き方を しまう。3 だんかい目：玉と リソースの 帳簿・家具の お店
// 4 だんかい目：ペット（1 匹目・職業・Lv）・派遣・隠れ家の 施設・作業台・あずかり箱（計算は lounge-game.js）
// 記録を かえる 仕事（/init・/act・/acked）は 1 つずつ 順番に 動かす（this.run）。配信の 画面へ きく あいだ（さいごは 5 秒）に
// ほかの 頼みが 入ると、同じ 人が すばやく 2 回 押した とき 2 重に 使えて しまうので
// 派遣の 計算は 出かけた あと アラームで 戦い 1 回ずつ（Cloudflare の 無料の プランは 1 回 10 ミリ秒まで）。とちゅうは「sim」に しまう
import { cleanRoom, STARTER_OWN, STARTER_ROOM, N, SALE_IDS, priceOn, jstDay, pullId, GACHA_COST } from "./lounge-rules.js";
import { locked, lockedAct, LOCK_WHY } from "./lounge-lock.js";   // 大工事の あいだの ロック
import { emptyLedger, balanceOf, trimSent, toObs, settle } from "./ledger.js";
import { buyPlan, sellAct, tradeAct, taskDone, useItem, deeplinkView } from "./lounge-trade.js";
import { reqPostPlan, takeFor, items } from "./lounge-req.js";
import { petTake, petGrow, petSub, petStat, petGambits, petStyle, equipSet, equipBest, respecPlan, fighterOf, spTotal, spUsed, freeTotal, RESET_PRICE } from "./lounge-pet.js";
import "./warm.js";   // 派遣の 計算を 温めて おく（はじめの 1 回が おそく ならない ように）
import { relayEntry } from "./lounge-relay.js";   // 配信の 中継（鹿物語の ランキングの 窓）に あずける 派遣の 材料
import { swapPlan } from "./lounge-money.js";   // 両替（玉・クレジット・リソース）
import { coreTake, coreSet } from "./lounge-core.js";   // ブランクコア（OP を 抜く・付ける）
import { tameFuse, tameSp } from "./lounge-fuse.js";   // モンスターの 配合・なかまの スキルポイント
import { wsMake, wsAtt, attSet, attOff, attDrop } from "./lounge-workshop.js";   // 工房（道具・アタッチメント）
import { farmPlant, farmHarvest, farmSpr, mineSet, mineCollect, mineLeave, farmView } from "./lounge-farm.js";   // 畑と 坑道
import { statPut } from "./lounge-stats.js";   // 記録の まとめ（OBS の コスメの 条件。かわった ときだけ Lounge へ）
import { ensure, give, FURN_MAX, petFirst, petJob, tripStart, tripCalc, tripDone, tripCollect, payWaiting, tripView, hideoutPlan, craftPlan, synthPlan, boxTake, dropOld, stashCap, tameFeedPlan, tameJoin, tameBack, researchPlan, snackCraft, autoSellSet, equipCap, loopNew, loopSet, loopSeen, loopAfter, loopStep, equipScrap } from "./lounge-game.js";
import { arenaFighter, ensureArena, duelCheck, duelDone, arenaMine, encReady, encPick, encDone } from "./lounge-arena.js";   // 闘技場・派遣先の 戦い
import { hidden } from "./lounge-gate.js";

const OPS_KEEP = 200;            // おぼえて おく op（2 回 来たら 1 回目の 答えを 返す）
const RATE = { n: 5, ms: 1000 }; // 1 人 1 秒に 5 回まで
const LABEL = { balls: "玉", res: "リソース" };
export const MONEY = /^(shop\.|hideout\.up$|bench\.|trip\.collect$|trip\.start$|tame\.feed$|tame\.research$|trader\.|task\.|req\.|pet\.respec$|pet\.rejob$|money\.|arena\.duel$)/;   // 玉か リソースが うごく やること（答えに いまの 数を つける）
const PLANS = {
  "hideout.up": (rec, b) => hideoutPlan(rec, b, rec.ledger.unknown),
  "bench.craft": (rec, b) => craftPlan(rec, b, rand),
  "bench.synth": (rec, b) => synthPlan(rec, b, rand),
  "tame.feed": (rec, b) => tameFeedPlan(rec, b, rec.ledger.unknown),
  "tame.research": (rec, b) => researchPlan(rec, b, rec.ledger.unknown),
  "trader.buy": (rec, b) => buyPlan(rec, b, jstDay(), rand),
  "money.swap": (rec, b) => swapPlan(rec, b),
  "pet.respec": (rec, b) => respecPlan(rec, b, jstDay()),
  "pet.rejob": (rec, b) => respecPlan(rec, b, jstDay()),
  "req.post": (rec, b, env) => reqPostPlan(rec, b, String((env && env.NG_WORDS) || "").split(",").map((w) => w.trim()).filter(Boolean)),   // 門番だけが 持つ NG ことば
};
const res = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;   // くじは 門番の 乱数

export class Viewer {
  constructor(state, env) { this.state = state; this.env = env; this.hits = []; this.q = Promise.resolve(); }

  run(fn) { const p = this.q.then(fn); this.q = p.catch(() => {}); return p; }
  async load() { const rec = (await this.state.storage.get("rec")) || null; if (rec) { rec.ledger ||= emptyLedger(); ensure(rec); } return rec; }
  async save(rec) { await this.state.storage.put("rec", rec); await statPut(this, rec); }
  lounge() { return this.env.LOUNGE.get(this.env.LOUNGE.idFromName("lounge")); }
  // 配信の 中継：出かけた 派遣を Lounge に あずける（put）・本当の 帰る 時間（end）・うけとった（del）。つながらなくても 派遣は そのまま
  async relay(kind, body) { try { await this.lounge().fetch("https://lounge/relay-" + kind, { method: "POST", body: JSON.stringify(body) }); } catch (e) {} }
  // 帳簿の op（OBS が 2 回 足さない ための 番号）は 門番が 作る。ブラウザの op は 使わない
  //   ブラウザの op を 使うと、ほかの 人の op を まねたり、古い op を 送りなおしたり して、払わずに 品を もらえて しまう
  nextLop(rec) { rec.lgN = (rec.lgN || 0) + 1; return rec.id + ":" + rec.at.toString(36) + ":" + rec.lgN; }

  // はじめての 人は ここで 記録を 作る。名前は 来る たびに 新しく する（前の 名前は names に 残す）
  async init(who) {
    const had = await this.load(), now = Date.now();
    const rec = had || { v: 1, id: who.id, login: who.login, name: who.login, nameAt: 0, names: [], at: now,
      room: { size: N, light: "day", items: STARTER_ROOM.map((x) => ({ ...x })) }, own: { furniture: { ...STARTER_OWN } }, ops: [], ledger: emptyLedger() };
    let changed = !had;
    if (who.login && who.login !== rec.login) { rec.login = who.login; changed = true; }
    if (who.name) { if (who.name !== rec.name && rec.name && !rec.names.includes(rec.name)) rec.names = [...rec.names, rec.name].slice(-10); rec.name = who.name; rec.nameAt = now; changed = true; }
    if (who.wallet) { const n = rec.ledger.sent.length; trimSent(rec.ledger, who.wallet); if (n !== rec.ledger.sent.length) changed = true; }
    ensure(rec);
    if (changed) await this.save(rec);
    if (rec.ledger.pending.length + rec.ledger.unknown.length) await this.mark(rec);   // 知らせそこねて いても ここで もう 1 回
    if (rec.req.out.length && this.env.MARKET) { await this.flushReq(rec); await this.save(rec); }   // 依頼の 板に 送りそこねた 分
    if (rec.trips.some((t) => t.calc) && (await this.state.storage.getAlarm()) == null) await this.state.storage.setAlarm(Date.now());   // 派遣の 計算が 止まって いたら もう 1 回
    else if (rec.loop && rec.loop.on && (await this.state.storage.getAlarm()) == null) { const t = rec.trips.find((x) => !x.done); if (t) await this.state.storage.setAlarm(Math.max(Date.now(), t.end)); }   // 周回の アラームが 止まって いたら
    return rec;
  }

  // アラーム：派遣の 計算を 戦い 1 回 ぶん 進める。終わって いなければ すぐ つぎの アラーム
  //   とちゅうで 止められても（上限を こえた など）、しまって ある sim から やりなおす（同じ 種なので 同じ 結果。Cloudflare が アラームを くり返す）
  alarm() { return this.run(() => this.calc()); }
  async calc() {
    const sim = await this.state.storage.get("sim"); if (!sim) return this.loopTick();
    if (!tripCalc(sim, 1)) { await this.state.storage.put("sim", sim); await this.state.storage.setAlarm(Date.now()); return; }
    const rec = await this.load();   // 記録を 読むのは 終わった ときだけ
    if (rec && tripDone(rec, sim)) {
      await this.save(rec); const t = rec.trips.find((x) => x.uid === sim.uid); if (t) await this.relay("end", { id: rec.id, uid: t.uid, end: t.end });
      await this.state.storage.delete("sim");
      if (t && rec.loop && rec.loop.on) await this.state.storage.setAlarm(Math.max(Date.now(), t.end));   // 周回：帰る 時間に うけとって つぎへ
      return;
    }
    await this.state.storage.delete("sim");
  }
  // 周回の アラーム：帰って きた 派遣を うけとって、同じ ように また 出発（画面を とじて いても）
  async loopTick() {
    const rec = await this.load(), now = Date.now(); if (!rec || !rec.loop || !rec.loop.on) return;
    const t = rec.trips.find((x) => !x.done); if (!t || t.calc) return;
    if (now < t.end) { await this.state.storage.setAlarm(t.end); return; }   // 早く 鳴った
    const s = loopStep(rec, now, Math.floor(rand() * 2 ** 31));
    if (!s) { if (payWaiting(rec, t)) await this.state.storage.setAlarm(Date.now() + 5 * 60 * 1000); return; }   // 玉の 支払いの 返事待ち：あとで もう 1 回（返事が 来たら /acked からも 起こす）
    await this.relay("del", { id: rec.id, uid: s.uid });
    for (const e of s.r.earn || []) await this.earn(rec, e.kind, e.d, "trip.loop");   // ボスの リソースは 帳簿へ
    let next = s.next;
    if (next && next.pay) {   // 費用の ある 行き先：1 回ごとに 玉を 払う（財布は いまの 配信の 記録から。払えなければ 周回を 止める）
      let st = null; const pl = { costs: [{ kind: "balls", d: -next.pay }], why: "trip:" + next.body.did, grant: {}, refund: {}, take: () => { st = tripStart(rec, next.body, now, next.seed); if (st.ok) pl.refund.voidTrip = st.trip.uid; } };
      const c = await this.charge(rec, pl, await this.freshWallet(rec));
      if (st && st.ok) rec.loop.n++; else if (rec.loop) { rec.loop.on = false; rec.loop.stop = (st && st.why) || c.why || "玉が 足りない"; }
      next = st;
    }
    await this.loopGo(rec, next);
    await this.save(rec);
  }
  // いまの 財布（配信の 記録 KV から。門番の 入口〈lounge-api.js の wallet〉と 同じ 作り方）。周回の 支払いに 使う（前に 開いた ときの 写しは 使わない）
  async freshWallet(rec) {
    try { const d = await this.env.DB.get("data", "json"), v = ((d && d.viewers) || []).find((x) => x.uid != null && String(x.uid) === String(rec.id)); return v ? { balls: +v.balls || 0, res: +v.res || 0, lg: +d.lg || 0, known: true } : { balls: 0, res: 0, lg: 0, known: false }; }
    catch (e) { return null; }
  }
  // 周回の つぎの 出発：計算を アラームに あずけて、中継に 出す
  async loopGo(rec, s) {
    if (!s || !s.ok) return;
    await this.state.storage.put("sim", s.sim); await this.state.storage.setAlarm(Date.now());
    await this.relay("put", relayEntry(rec, rec.trips[rec.trips.length - 1]));
    const en = await this.encounter(rec, rec.trips[rec.trips.length - 1], Date.now());   // 周回でも 派遣先で ばったり
    if (en) for (const e of en.earn) await this.earn(rec, e.kind, e.d, "enc");
  }

  // 物を 渡す（{ furniture, mats, equip, credits, snacks, hideout }。lounge-game.js の give）
  give(rec, g) { give(rec, g, Date.now()); }
  // 「この 人には まだ 配信の 画面に 送って いない 分が ある」と Lounge に 知らせる（配信が はじまったら まとめて 送る）
  async mark(rec) { try { await this.lounge().fetch("https://lounge/lg-mark", { method: "POST", body: JSON.stringify({ id: rec.id }) }); } catch (e) {} }
  async ask(rec, items) {
    try { return await (await this.lounge().fetch("https://lounge/lg", { method: "POST", body: JSON.stringify({ id: rec.id, items: [...toObs(rec.ledger), ...items] }) })).json(); }
    catch (e) { return {}; }   // 送れたか わからない ときは「返事が ない」と 同じ（2 重に ならない 方へ）
  }

  // 玉か リソースを へらして 物を 渡す。配信中は OBS が 数を 持って いるので OBS に きく。配信して いない ときは 帳簿で 数える
  // plan：{ costs: [{ kind, d }], why, take, grant, refund }（lounge-game.js の 計画。お店は costs と grant だけ）
  // 玉と リソースを いっしょに 払う ときは grp で まとめ、OBS は ぜんぶ 足すか なにも 足さないか
  async charge(rec, plan, wallet) {
    const L = rec.ledger, now = Date.now(), costs = plan.costs.filter((c) => c.d), take = plan.take || (() => {});
    if (!costs.length) { take(); this.give(rec, plan.grant); return { ok: true }; }
    const ops = costs.map((c) => ({ op: this.nextLop(rec), kind: c.kind, d: c.d, need: 1 })), grp = ops.length > 1 ? ops[0].op : null;
    if (grp) ops.forEach((o) => (o.grp = grp));
    const a = await this.ask(rec, ops), need = (k) => ops.reduce((x, o) => x + (o.kind === k ? o.d : 0), 0);
    if (a.offline) {
      for (const k of new Set(ops.map((o) => o.kind))) {
        const bal = balanceOf(L, wallet, k);
        if (bal == null) return { ok: false, why: "玉と リソースが まだ わかりません（配信で 1 回 チャットすると わかります）" };
        if (bal + need(k) < 0) return { ok: false, why: `足りない：${LABEL[k]} あと ${-(bal + need(k))}` };
      }
      ops.forEach((o) => L.pending.push({ op: o.op, kind: o.kind, d: o.d, why: plan.why, at: now }));
      take(); this.give(rec, plan.grant);
      await this.mark(rec);
      return { ok: true };
    }
    if (Array.isArray(a.res)) {
      settle(L, a.res, (g) => this.give(rec, g));   // いっしょに 送った 前の 分
      const rs = ops.map((o) => a.res.find((x) => x && x.op === o.op));
      if (rs.every((r) => r && r.ok)) { take(); this.give(rec, plan.grant); ops.forEach((o, i) => L.sent.push({ op: o.op, kind: o.kind, d: o.d, seq: +rs[i].seq || 0 })); return { ok: true }; }
      const ng = rs.find((r) => r && !r.ok);
      if (ng && ng.why === "short") {   // まとめて ことわられた ときは、ほんとうに 足りない 方を 出す
        const i = rs.findIndex((r) => r && r.bal >= 0 && r.bal + need(ops[rs.indexOf(r)].kind) < 0), o = ops[i];
        return { ok: false, why: o ? `足りない：${LABEL[o.kind]} あと ${-(rs[i].bal + need(o.kind))}` : "足りない" };
      }
      if (ng) return { ok: false, why: "配信の 画面が まだ あなたを 知りません（配信で 1 回 チャットすると なおります）" };
    }
    take();   // 5 秒 返事が ない：素材などは 先に 取って おき、物は まだ 渡さない（払えなかったら refund で もどす）
    ops.forEach((o, i) => L.unknown.push({ op: o.op, kind: o.kind, d: o.d, why: plan.why, at: now, ...(grp ? { grp } : {}), ...(i === 0 ? { grant: plan.grant, refund: plan.refund } : {}) }));
    await this.mark(rec);
    return { ok: false, wait: true, why: "配信の 画面が こたえませんでした。つぎに つながった ときに 決まります（2 回 へる ことは ありません）" };
  }
  // ---------- みんなの依頼（Market への 送る 箱。返事が なければ のこして、つぎに また 送る） ----------
  market() { return this.env.MARKET.get(this.env.MARKET.idFromName("market")); }
  async flushReq(rec) {
    const R = rec.req, got = {};
    for (const e of [...R.out]) {
      const body = e.k === "post" ? { data: e.data } : e.k === "claim" ? { rid: e.rid, cid: e.cid, by: rec.id, name: rec.name, items: e.items } : { rid: e.rid, by: rec.id };
      let j;
      try { j = await (await this.market().fetch("https://market/" + e.k, { method: "POST", body: JSON.stringify(body) })).json(); } catch (x) { got[e.k + e.rid] = { ok: false, wait: true }; continue; }
      R.out = R.out.filter((x) => x !== e);
      got[e.k + e.rid] = j;
      const back = async (rw, fee = 0) => { this.give(rec, { reqBack: rw }); for (const [kind, d] of [["balls", (rw.balls || 0) + fee], ["res", rw.res || 0]]) if (d > 0) await this.earn(rec, kind, d, "req:" + e.rid); };
      if (e.k === "post" && !j.ok) { await back(e.data.reward, e.data.fee); if (R.mine === e.rid) R.mine = null; }   // 板に 出せなかった：手数料も もどす
      if (e.k === "claim") {
        if (j.ok) { this.give(rec, { reqGet: j.reward }); for (const [kind, d] of [["balls", j.reward.balls], ["res", j.reward.res]]) if (d > 0) await this.earn(rec, kind, d, "req:" + e.rid); }
        else this.give(rec, { reqBack: e.items });   // 届けられなかった 物は もどす
      }
      if (e.k === "cancel" && j.ok) { await back(j.never ? e.data.reward : j.reward, j.never ? e.data.fee : 0); if (R.mine === e.rid) R.mine = null; }   // 取り下げ：手数料は もどらない（板に 出て いなかった ときだけ もどす）
    }
    return got;
  }
  async reqDeliver(rec, b) {
    if (typeof b.rid !== "string") return { ok: false, why: "依頼を えらんで" };
    let g; try { g = await (await this.market().fetch("https://market/get?rid=" + encodeURIComponent(b.rid))).json(); } catch (e) { return { ok: false, why: "いまは 依頼の 板に つながらない" }; }
    if (!g.ok) return g;
    if (!g.req.open) return { ok: false, why: "その 依頼は もう 終わった" };
    if (g.req.by === rec.id) return { ok: false, why: "自分の 依頼には 届けられない" };
    if (rec.req.out.some((x) => x.k === "claim" && x.rid === b.rid)) return { ok: false, wait: true, why: "前に 届けた 分の 返事を 待って いる" };
    const t = takeFor(rec, g.req.want, b.uid);
    if (t.why) return { ok: false, why: t.why };
    const cid = `${rec.id}:${rec.at.toString(36)}:c${++rec.req.n}`;   // 届けの 番号（やりなおしと 新しい 届けを 見分ける）
    t.take(); rec.req.out.push({ k: "claim", rid: b.rid, cid, items: items(t.items) });   // 先に 取って おく（返事が なければ のこして つぎに また 届ける）
    const j = (await this.flushReq(rec))["claim" + b.rid] || { ok: false, wait: true };
    return j.ok ? { ok: true, reward: j.reward } : j.wait ? { ok: false, wait: true, why: "依頼の 板が こたえませんでした。つぎに 開いた ときに 決まります" } : { ok: false, why: j.why };
  }
  async reqCancel(rec) {
    const R = rec.req, rid = R.mine;
    if (!rid) return { ok: false, why: "出して いる 依頼は ない" };
    if (R.wait[rid]) return { ok: false, why: "まだ 払いが 決まって いない（配信の 画面の 返事を 待って いる）" };
    // 出す 頼みが 送る 箱に のこって いても、板に 出て いる かも しれない（返事だけ とどかなかった）。かならず 板に きく
    const p = R.out.find((x) => x.k === "post" && x.rid === rid), data = p ? p.data : null;
    if (p) R.out = R.out.filter((x) => x !== p);
    if (!R.out.some((x) => x.k === "cancel" && x.rid === rid)) R.out.push({ k: "cancel", rid, data: data || { reward: { balls: 0, res: 0, mats: [], equip: [] }, fee: 0 } });
    const j = (await this.flushReq(rec))["cancel" + rid] || { ok: false, wait: true };
    return j.ok ? { ok: true } : j.wait ? { ok: false, wait: true, why: "依頼の 板が こたえませんでした。つぎに 開いた ときに 決まります" } : { ok: false, why: j.why };
  }

  // 玉か リソースを もらう（ボスの リソースなど）。かならず 足す（配信して いない ときと、OBS が まだ その 人を 知らない ときは pending）
  async earn(rec, kind, d, why) {
    const L = rec.ledger, op = this.nextLop(rec), a = await this.ask(rec, [{ op, kind, d }]);
    if (Array.isArray(a.res)) {
      settle(L, a.res, (g) => this.give(rec, g));
      const r = a.res.find((x) => x && x.op === op);
      if (r && r.ok) { L.sent.push({ op, kind, d, seq: +r.seq || 0 }); return; }
    }
    if (a.offline || Array.isArray(a.res)) L.pending.push({ op, kind, d, why, at: Date.now() });
    else L.unknown.push({ op, kind, d, why, at: Date.now() });   // 返事が ない：わかるまで 数に 入れない（2 回 数えない）
    await this.mark(rec);
  }

  // ---------- 派遣先の 戦い（⑤）：出発の あとに 同じ 行き先の ほかの 人と たまに 出会う。答え：{ view（画面へ）, earn（帳簿へ） } か null ----------
  async encounter(rec, t, now) {
    if (!t || !this.env.MARKET || !encReady(rec, jstDay(now))) return null;
    const me = arenaFighter(rec); if (!me || t.party[0] !== rec.pets[0].uid) return null;
    const gate = await this.env.DB.get("gate", "json"); if (hidden(gate, rec.id)) return null;   // 入れない 人は 出会わない（BAN の 前から つづく 周回でも 帯に 出さない）
    let list = null; try { list = (await (await this.lounge().fetch("https://lounge/relay")).json()).list; } catch (e) { return null; }
    const foe = encPick(list, rec.id, t.did, rand, gate); if (!foe) return null;
    const r = encDone(rec, me, foe, rand);
    await this.arenaAsk("enc", { id: rec.id, a: me.card, foe: foe.id, A: r.A, B: r.B, seed: r.seed, win: r.win, did: r.did });   // ふたりの 記録・相手の ごほうび
    await this.relay("pvp", { kind: "enc", A: r.A, B: r.B, seed: r.seed, did: r.did, pay: r.pay });   // 配信中なら 帯で
    return { view: { foe: r.foe, win: r.win, upset: r.upset, credits: r.credits, res: r.res, did: r.did, A: r.A, B: r.B, seed: r.seed }, earn: [{ kind: "res", d: r.res }] };
  }

  // ---------- 闘技場（Market の 名簿・大会。相手の 強さは 相手の Viewer の /fighter） ----------
  async arenaAsk(path, body) { try { return await (await this.market().fetch("https://market/arena/" + path, { method: "POST", body: JSON.stringify(body) })).json(); } catch (e) { return null; } }
  async arena(rec, b, now) {
    const A = ensureArena(rec, jstDay(now)), me = arenaFighter(rec);
    if (!me) return { ok: false, why: "さきに ペットの 職業を えらんで" };
    if (b.a === "arena.view" || b.a === "arena.foes") {
      const pick = b.a === "arena.foes" || !A.foes.length, m = await this.arenaAsk("view", { id: rec.id, card: me.card, pick });
      if (!m || !m.ok) return { ok: false, why: "いまは 闘技場に つながらない" };
      if (m.foes) A.foes = m.foes;
      return { ok: true, me: { ...me.card, w: A.w, l: A.l }, ...arenaMine(A), def: m.def, hold: { w: m.card.hw, l: m.card.hl }, tour: m.tour, last: m.last, enc: m.enc || [] };
    }
    if (b.a === "arena.match") {   // 大会の 試合を あとから 見る 材料
      try { return await (await this.market().fetch(`https://market/arena/match?day=${encodeURIComponent(String(b.day || ""))}&r=${+b.r || 0}&m=${+b.m || 0}`)).json(); } catch (e) { return { ok: false, why: "いまは 闘技場に つながらない" }; }
    }
    if (b.a === "arena.enc") {   // 派遣先の 戦いを あとから 見る 材料
      try { return await (await this.market().fetch(`https://market/arena/encget?id=${rec.id}&at=${+b.at || 0}`)).json(); } catch (e) { return { ok: false, why: "いまは 闘技場に つながらない" }; }
    }
    if (b.a === "arena.entry") return (await this.arenaAsk("entry", { id: rec.id, on: !!b.on, card: me.card })) || { ok: false, why: "いまは 闘技場に つながらない" };
    const c = duelCheck(rec, A, b); if (c.why) return { ok: false, why: c.why };
    if (hidden(await this.env.DB.get("gate", "json"), c.foe.id)) return { ok: false, why: "その 相手とは 戦えない（入れかえて べつの 相手に）" };   // あとから 入れなく なった 人
    let theirs = null;
    try { theirs = await (await this.env.VIEWER.get(this.env.VIEWER.idFromName("v:" + c.foe.id)).fetch("https://viewer/fighter")).json(); } catch (e) {}
    if (!theirs || !theirs.f) return { ok: false, why: "相手に つながらない（入れかえて べつの 相手に）" };
    const r = duelDone(rec, A, c.me, theirs, rand, now);
    await this.arenaAsk("log", { id: rec.id, a: c.me.card, b: c.foe.id, win: r.win });   // 相手の 守りの 記録（つながらなくても 勝負は そのまま）
    return r;
  }

  // やること（POST /act { body: { op, a, … }, wallet }）。op は ブラウザが 作る 1 回ごとの 番号。wallet は 門番が KV から 作った 物
  async act(body, wallet) {
    const rec = await this.load(); if (!rec) return { ok: false, why: "記録が ない" };
    const op = typeof body.op === "string" && /^[\w-]{8,64}$/.test(body.op) ? body.op : "";
    if (!op) return { ok: false, why: "op が ない" };
    if (lockedAct(rec, body.a, this.env)) return { ok: false, lock: true, why: LOCK_WHY };   // 工事中（部屋・ショップ・両替の ほかは 止める）
    const money = MONEY.test(String(body.a)), out = (r) => ({ ...(money && wallet ? { ...r, wallet: this.purse(rec, wallet) } : r), credits: rec.credits }), now = Date.now();   // クレジットは いつも つける（上の 通貨の 札）
    if (wallet) trimSent(rec.ledger, wallet);
    const done = rec.ops.find((x) => x.op === op); if (done) return out(done.r);   // 2 回目は 1 回目の 答え
    let r;
    if (body.a === "room.save") {
      const clean = cleanRoom(body.items, rec.own.furniture, rec.room.size);   // しまうのは たしかめた 形だけ（送られた 物を そのまま しまわない）
      r = typeof clean === "string" ? { ok: false, why: clean } : { ok: true };
      if (r.ok) rec.room.items = clean;
    } else if (body.a === "room.light") {
      r = ["day", "night"].includes(body.light) ? { ok: true } : { ok: false, why: "昼か 夜" };
      if (r.ok) rec.room.light = body.light;
    } else if (body.a === "shop.buy") {
      const id = typeof body.id === "string" && SALE_IDS.includes(body.id) ? body.id : "";
      if (!id) r = { ok: false, why: "売って いない 品" };
      else if ((rec.own.furniture[id] || 0) >= FURN_MAX) r = { ok: false, why: "もう 持てない（" + FURN_MAX + " こまで）" };
      else { r = await this.charge(rec, { costs: [{ kind: "res", d: -priceOn(id, jstDay()) }], why: "shop:" + id, grant: { furniture: { [id]: 1 } } }, wallet); if (r.ok) r.got = [id]; }
    } else if (body.a === "shop.gacha") {
      const n = body.n === 10 ? 10 : body.n === 1 ? 1 : 0;
      if (!n) r = { ok: false, why: "1 回か 10 回" };
      else {
        const got = Array.from({ length: n }, () => pullId(rand)), g = { furniture: {} };   // 先に 引いて おく（返事が なくても 中身は かわらない）
        got.forEach((id) => (g.furniture[id] = (g.furniture[id] || 0) + 1));
        r = await this.charge(rec, { costs: [{ kind: "res", d: -GACHA_COST * n }], why: "gacha:" + n, grant: g }, wallet);
        if (r.ok) r.got = got;
      }
    } else if (body.a === "pet.first") r = petFirst(rec, body, rand);
    else if (body.a === "pet.job") r = petJob(rec, body);
    else if (body.a === "pet.take") r = petTake(rec, body);
    else if (body.a === "pet.grow") r = petGrow(rec, body);
    else if (body.a === "pet.sub") r = petSub(rec, body);
    else if (body.a === "pet.stat") r = petStat(rec, body);
    else if (body.a === "pet.gambits") r = petGambits(rec, body);
    else if (body.a === "pet.style") r = petStyle(rec, body);
    else if (body.a === "pet.equip") r = equipSet(rec, { ...body, who: null });
    else if (body.a === "equip.best") r = equipBest(rec, body);   // おすすめ装備（えらび方・だれ）
    else if (body.a === "tame.equip") r = equipSet(rec, body.who ? body : { ...body, who: "-" });
    else if (body.a === "trip.start") {
      const seed = Math.floor(rand() * 2 ** 31), chk = tripStart(rec, body, now, seed, true);
      if (chk.ok && chk.cost) {   // 費用の ある 行き先（ニライ諸島）：たしかめてから 玉を 払い、払えたら 出発（返事が おくれた ときも 出発。2 回 へる ことは ない）
        let st = null; const pl = { costs: [{ kind: "balls", d: -chk.cost }], why: "trip:" + body.did, grant: {}, refund: {}, take: () => { st = tripStart(rec, body, now, seed); if (st.ok) pl.refund.voidTrip = st.trip.uid; } };
        const c = await this.charge(rec, pl, wallet);   // 返事が おくれて あとで 払えなかったと わかったら、その 派遣の 収穫は なし（refund の voidTrip）
        r = st && st.ok ? { ...st, paid: chk.cost } : c;
      } else r = chk.ok ? tripStart(rec, body, now, seed) : chk;
      if (r.ok) loopNew(rec, body, now);   // 周回（3・5・10・ずっと）を えらんで いれば はじめる
      if (r.sim) { await this.state.storage.put("sim", r.sim); await this.state.storage.setAlarm(Date.now()); delete r.sim; }   // 計算は アラームで 少しずつ
      if (r.ok) await this.relay("put", relayEntry(rec, rec.trips[rec.trips.length - 1]));
      if (r.ok) { const en = await this.encounter(rec, rec.trips[rec.trips.length - 1], now); if (en) { r.enc = en.view; r.earn = [...(r.earn || []), ...en.earn]; } }   // 派遣先で ばったり（探索は そのまま）
    }
    else if (body.a === "trip.collect") {
      const t = rec.trips.find((x) => !x.done && (!body.uid || x.uid === body.uid)), g = t && t.got;   // tripCollect と 同じ さがし方
      r = tripCollect(rec, body, now); if (r.ok && t) await this.relay("del", { id: rec.id, uid: t.uid });
      if (r.ok && g) { const nx = loopAfter(rec, g, r, now, Math.floor(rand() * 2 ** 31)); if (nx && nx.ok) { await this.loopGo(rec, nx); r.next = true; } }   // 周回中なら 自分で うけとっても つぎへ
    }
    else if (body.a === "loop.set") r = loopSet(rec, body, now);
    else if (body.a === "loop.seen") r = loopSeen(rec); else if (body.a === "box.take") r = boxTake(rec, now);
    else if (body.a === "trader.sell") r = sellAct(rec, body, jstDay());
    else if (body.a === "trader.trade") r = tradeAct(rec, body, jstDay());
    else if (body.a === "task.done") r = taskDone(rec, body, jstDay(), rand);
    else if (/^item\.(map|collar|snack3|recipe)$/.test(String(body.a))) r = useItem(rec, body);
    else if (body.a === "req.deliver") r = await this.reqDeliver(rec, body);
    else if (body.a === "req.cancel") r = await this.reqCancel(rec);
    else if (body.a === "tame.join") { r = tameJoin(rec, body); if (r.ok) { const m = mineLeave(rec, body.uid, rand, now); if (m && m.got && m.got.length) r.mined = m.got; } }   // 坑道で 掘って いた 子は やめる（掘った 分は 渡す）
    else if (body.a === "tame.back") r = tameBack(rec, body);
    else if (body.a === "snack.craft") r = snackCraft(rec, body);
    else if (body.a === "ws.make") r = wsMake(rec, body, now);
    else if (body.a === "ws.att") r = wsAtt(rec, body, rand, now);
    else if (body.a === "att.set") r = attSet(rec, body);
    else if (body.a === "att.off") r = attOff(rec, body);
    else if (body.a === "att.drop") r = attDrop(rec, body);
    else if (body.a === "farm.plant") r = farmPlant(rec, body, now);
    else if (body.a === "farm.harvest") r = farmHarvest(rec, rand, now);
    else if (body.a === "farm.spr") r = farmSpr(rec, body);
    else if (body.a === "mine.set") r = mineSet(rec, body, rand, now);
    else if (body.a === "mine.collect") r = mineCollect(rec, rand, now);
    else if (body.a === "equip.scrap") r = equipScrap(rec, body, now, rand);   // 装備を 手放す（玉は 下の earn で 帳簿へ）
    else if (body.a === "tame.fuse") r = tameFuse(rec, body, rand, (uid) => mineLeave(rec, uid, rand, now));   // モンスターの 配合（親 2 体 → 子 1 体。坑道で 掘って いた 親は 掘った 分を 渡す）
    else if (body.a === "tame.sp") r = tameSp(rec, body);   // なかまの スキルポイント（手で 振る・自動の 入り切り）
    else if (body.a === "core.take") r = coreTake(rec, body);   // ブランクコア：装備から OP を 抜く（装備は なくなる）
    else if (body.a === "core.set") r = coreSet(rec, body);     // コアを 別の 装備に 付ける
    else if (body.a === "equip.auto") r = autoSellSet(rec, body);   // 派遣で 拾った ★N 以下の 装備を 自動で 売る 設定
    else if (/^arena\.(view|foes|duel|entry|match|enc)$/.test(String(body.a))) r = await this.arena(rec, body, now);
    else if (typeof body.a === "string" && Object.prototype.hasOwnProperty.call(PLANS, body.a)) {   // お金が いる やること：計画を 作って 帳簿で 払う（「constructor」などは 通さない）
      const plan = PLANS[body.a](rec, body, this.env);
      r = plan.costs ? await this.charge(rec, plan, wallet) : plan;
      if (r.ok && plan.item) r.item = plan.item;
      if (r.ok && plan.info) Object.assign(r, plan.info);
    } else r = { ok: false, why: "知らない やること" };
    if (r.ok && r.earn) { for (const e of r.earn) await this.earn(rec, e.kind, e.d, String(body.a)); delete r.earn; }   // もらう 玉・リソース（ボス・売る・タスク）
    if (body.a === "req.post" && rec.req.out.length) {   // 払えたら すぐ 依頼の 板へ（返事が なければ「送って いる」。つぎに 開いた ときに また 送る）
      const f = await this.flushReq(rec), x = r.rid && f["post" + r.rid];
      if (x && x.wait) r = { ...r, sending: true }; else if (x && !x.ok) r = { ok: false, why: x.why };
    }
    const keep = JSON.stringify(r).length > 600 ? { ok: r.ok, why: r.why, wait: r.wait } : r;   // 大きな 答えは 短くして おぼえる（記録を 小さく）
    rec.ops = [...rec.ops, { op, r: keep }].slice(-OPS_KEEP);
    await this.save(rec);
    return out(r);
  }

  // 帳簿を 入れた いまの 玉と リソース（わからない 人は known: false）
  purse(rec, w) {
    if (!w || !w.known) return { known: false, balls: 0, res: 0 };
    return { known: true, balls: balanceOf(rec.ledger, w, "balls"), res: balanceOf(rec.ledger, w, "res") };
  }

  // ほかの 人に 見せる 分だけ（部屋と 名前。持ち物の 数や 玉は 出さない）
  view(rec) { return { name: rec.name, login: rec.login, room: rec.room }; }
  mine(rec, w) {
    const now = Date.now(); dropOld(rec, now);
    return { id: rec.id, lock: locked(rec, this.env), login: rec.login, name: rec.name, nameAt: rec.nameAt, names: rec.names, room: rec.room, own: rec.own, wallet: this.purse(rec, w), waiting: rec.ledger.unknown.length,
      pets: rec.pets.map((p) => ({ ...p, ...(p.type ? { sp: { all: spTotal(p.lv), left: spTotal(p.lv) - spUsed(p) }, freeLeft: freeTotal(p.lv) - Object.values(p.free || {}).reduce((a, v) => a + v, 0), build: fighterOf(p, rec), resetPrice: RESET_PRICE(p.lv) } : {}) })),
      tamed: rec.tamed, party: rec.party, farm: farmView(rec, now), loop: rec.loop || null, lab: rec.lab, hideout: rec.hideout, credits: rec.credits, snacks: rec.snacks, tools: rec.tools, explore: rec.explore, seen: rec.seen,
      stash: { cap: stashCap(rec) }, equipCap: equipCap(rec), autoSell: rec.autoSell || null, trips: rec.trips.map((t) => tripView(t, now)), deeplink: deeplinkView(rec, jstDay(now)), req: { mine: rec.req.mine, sending: rec.req.out.length } };
  }

  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    try {
      if (url.pathname === "/init" && req.method === "POST") { const who = await req.json(); return res(this.mine(await this.run(() => this.init(who)), who.wallet)); }
      if (url.pathname === "/public") { const rec = await this.load(); return rec ? res(this.view(rec)) : res({ error: "none" }, 404); }
      // 闘技場から：いまの ペットの 戦う 形（読むだけ。順番待ちを 通らない ので、デュエルの 相手どうしで 待ちあわない）
      if (url.pathname === "/fighter") { const rec = await this.load(), f = rec && !locked(rec, this.env) && arenaFighter(rec); return f ? res(f) : res({ error: "none" }, 404); }
      if (url.pathname === "/act" && req.method === "POST") {
        this.hits = this.hits.filter((t) => now - t < RATE.ms);
        if (this.hits.length >= RATE.n) return res({ ok: false, why: "1 秒に 5 回まで" }, 429);
        this.hits.push(now);
        const b = await req.json();
        return res(await this.run(() => this.act(b.body || {}, b.wallet || null)));
      }
      // Market から：依頼の 知らせ（届いた 物・期限で もどる お礼）・闘技場の 大会の ごほうび。同じ mid は 1 回だけ
      if (url.pathname === "/inbox" && req.method === "POST") {
        const m = await req.json();
        return res(await this.run(async () => {
          const rec = await this.load();
          if (!rec || typeof m.mid !== "string" || rec.req.done.includes(m.mid)) return { ok: true };
          this.give(rec, m.give);
          for (const e of Array.isArray(m.earn) ? m.earn : []) if ((e.kind === "balls" || e.kind === "res") && Number.isInteger(e.d) && e.d > 0) await this.earn(rec, e.kind, e.d, typeof m.why === "string" ? m.why : "req:" + m.mid);   // why：闘技場の 大会は "arena:日"
          if (m.clear && rec.req.mine === m.clear) rec.req.mine = null;
          if (m.clear) rec.req.out = rec.req.out.filter((x) => !(x.k === "post" && x.rid === m.clear));   // 板に 出て 終わった 依頼を もう 1 回 出さない
          rec.req.done = [...rec.req.done, m.mid].slice(-200);
          await this.save(rec);
          return { ok: true };
        }));
      }
      // Lounge から：配信が はじまった ときに まとめて 送る 分
      if (url.pathname === "/pending") { const rec = await this.load(); return res({ items: rec ? toObs(rec.ledger) : [] }); }
      // Lounge から：OBS の 返事（まとめ送りの 分・おそく 来た 分）
      if (url.pathname === "/acked" && req.method === "POST") {
        const b = await req.json();
        return res(await this.run(async () => {
          const rec = await this.load(); if (!rec) return { left: 0 };
          const left = settle(rec.ledger, b.res, (g) => this.give(rec, g));
          await this.save(rec);
          if (rec.loop && rec.loop.on) await this.state.storage.setAlarm(Date.now());   // 周回：支払いが 決まったら つづきへ（返事待ちで 止まって いた ぶん）
          return { left };
        }));
      }
    } catch (e) { return res({ ok: false, why: "こわれた 頼み" }, 400); }
    return res({ error: "notfound" }, 404);
  }
}
