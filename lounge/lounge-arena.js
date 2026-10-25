// 闘技場（鹿さんの頼み、2026-10-25）。決まりの 中身は 見本の lounge-proto/arena.js
// Viewer：arena.view・arena.foes・arena.duel・arena.entry（viewer.js の act から）。相手の いまの 強さは、相手の Viewer の /fighter（記録を 読むだけ。順番待ちを 通らないので、おたがいに 待って 止まらない）
// Market（みんなの 箱）：名簿 "a:c:" + id・守りの 記録 "a:d:" + id・大会 "a:t:" + 日・大会の ペット "a:f:" + 日 + ":" + id
//   受付中の 大会の 日 "a:open"・進めて いる 大会の 日 "a:runq"・さいごに 終わった 大会の 日 "a:last"。22:00 の アラームで 大会を 少しずつ 進める（CPU の 上限が あるので 1 回に 数試合）
// ごほうび：デュエルは その場で（クレジットは 記録・リソースは 帳簿）。大会は Market の 送る 箱（"o:"）から Viewer の /inbox へ
import { DUEL, duelPay, pickFoes, TOUR, TOUR_PAY, tourDay, tourAt, bracketOf, matchSeed, simulate, fighterPower } from "./game.js";
import { fighterOf } from "./lounge-game.js";

const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const OLD_MS = 30 * 864e5;   // 30 日 来て いない 人は 相手に えらばない

// ---------- Viewer ----------
// いまの ペット（1 匹目）の 戦う 形と、名簿の 札。職業が まだ なら null
export function arenaFighter(rec) {
  const p = rec.pets && rec.pets[0]; if (!p || !p.type) return null;
  const f = { ...fighterOf(p, rec), owner: rec.name };
  return { card: { id: rec.id, name: rec.name, pet: { name: p.name, qid: p.qid, species: p.species, type: p.type, lv: p.lv }, power: fighterPower(f) }, f };
}
// 1 日の 数（日本時間の 日が かわったら 0 に）。foes：きょうの 相手（3 人）・log：自分の デュエル（新しい 順 10 こ）
export function ensureArena(rec, day) {
  const A = (rec.arena ||= { day: -1, n: 0, paid: 0, beat: [], w: 0, l: 0, foes: [], log: [] });
  if (A.day !== day) Object.assign(A, { day, n: 0, paid: 0, beat: [], foes: [] });
  return A;
}
const onTrip = (rec, uid) => rec.trips.some((t) => !t.done && t.party.includes(uid));
// デュエルの 前の たしかめ（相手に つなぐ 前）
export function duelCheck(rec, A, b) {
  const me = arenaFighter(rec);
  if (!me) return { why: "さきに ペットの 職業を えらんで" };
  if (onTrip(rec, rec.pets[0].uid)) return { why: `${rec.pets[0].name}は 出かけて いる（帰ってから 戦える）` };
  if (A.n >= DUEL.perDay) return { why: `きょうは もう ${DUEL.perDay} 回 戦った（あした また）` };
  const foe = A.foes.find((c) => c.id === String(b.foe));
  if (!foe) return { why: "相手を えらんで" };
  return { me, foe };
}
// デュエルの 結果を 記録に 入れる。theirs：相手の /fighter の 答え。R：くじ。返す 物は 画面へ（3D で 見せる 材料つき）
export function duelDone(rec, A, me, theirs, R, now) {
  const seed = Math.floor(R() * 2 ** 31), end = simulate(me.f, theirs.f, seed, { quiet: true }).at(-1), win = end.winner === 0;
  A.n++; if (win) A.w++; else A.l++;
  let pay = null;
  if (win && A.paid < DUEL.paidPerDay && !A.beat.includes(theirs.card.id)) {
    const p = duelPay(me.card.power, theirs.card.power);
    pay = { credits: p.credits, res: p.res, label: p.label };
    A.paid++; A.beat.push(theirs.card.id); rec.credits += p.credits;
  }
  A.log = [{ at: now, name: theirs.card.name, pet: theirs.card.pet.name, win, pay }, ...A.log].slice(0, 10);
  return { ok: true, A: me.f, B: theirs.f, seed, win, upset: !!end.upset, pay, me: me.card, foe: theirs.card, left: { duels: DUEL.perDay - A.n, paid: DUEL.paidPerDay - A.paid },
    ...(pay && pay.res ? { earn: [{ kind: "res", d: pay.res }] } : {}) };
}
// 画面に 出す 自分の 分
export const arenaMine = (A) => ({ left: { duels: DUEL.perDay - A.n, paid: DUEL.paidPerDay - A.paid }, beat: A.beat, foes: A.foes, w: A.w, l: A.l, log: A.log });

// ---------- Market ----------
async function cardsOf(mk) {
  if (!mk.cards) mk.cards = Object.fromEntries([...(await mk.state.storage.list({ prefix: "a:c:" })).values()].map((c) => [c.id, c]));
  return mk.cards;
}
// 札を 新しく する（勝ち負けは 名簿の 方が 持つ）
async function putCard(mk, card, now, d = {}) {
  const C = await cardsOf(mk), old = C[card.id] || { w: 0, l: 0, hw: 0, hl: 0 };
  const c = { id: String(card.id), name: String(card.name || "").slice(0, 40), pet: card.pet, power: Math.round(+card.power || 0), at: now,
    w: old.w + (d.w || 0), l: old.l + (d.l || 0), hw: old.hw + (d.hw || 0), hl: old.hl + (d.hl || 0) };   // hw・hl：留守の あいだに 守った・やられた
  C[c.id] = c; await mk.state.storage.put("a:c:" + c.id, c);
  return c;
}
const pub = (c) => ({ id: c.id, name: c.name, pet: c.pet, power: c.power });
// 大会を 画面の 形に（名前は 参加した ときの 札から）
function tourView(t, id) {
  if (!t) return null;
  const who = (x) => (x == null ? null : { id: x, name: (t.cards[x] || {}).name || "？", pet: ((t.cards[x] || {}).pet || {}).name || "", qid: ((t.cards[x] || {}).pet || {}).qid || "" });
  return { day: t.day, at: tourAt(t.day), state: t.state, n: t.ents.length, entered: t.ents.includes(id),
    rounds: (t.rounds || []).map((R) => R.map((m) => ({ a: who(m.a), b: who(m.b), w: m.w, bye: m.a == null || m.b == null }))), place: t.place ? t.place[id] ?? null : null };
}
const newTour = (day) => ({ day, ents: [], cards: {}, state: "open", got: [], drop: [], rounds: null, place: null });

// Market の fetch で：const ar = await arenaFetch(this, url, b, now); if (ar) return ar;
export async function arenaFetch(mk, url, b, now) {
  if (!url.pathname.startsWith("/arena/")) return null;
  const st = mk.state.storage, id = String((b && b.id) || url.searchParams.get("id") || "");
  // 見る（自分の 札を 名簿に のせる。pick：相手を 3 人 えらびなおす）
  if (url.pathname === "/arena/view") {
    if (!b.card || String(b.card.id) !== id) return J({ ok: false, why: "札が ない" });
    const me = await putCard(mk, b.card, now), C = await cardsOf(mk);
    const day = tourDay(now), last = await st.get("a:last");
    const out = { ok: true, card: me, def: ((await st.get("a:d:" + id)) || []).slice(0, 10), tour: tourView((await st.get("a:t:" + day)) || newTour(day), id), last: last ? tourView(await st.get("a:t:" + last), id) : null };
    if (b.pick) out.foes = pickFoes(Object.values(C).filter((c) => now - c.at < OLD_MS), id, me.power, Math.random).map(pub);
    return J(out);
  }
  // デュエルの 記録（挑んだ 人の Viewer から）：a は 挑んだ 人の 札、b は 相手の id、win は 挑んだ 人が 勝ったか
  if (url.pathname === "/arena/log") {
    if (!b.a || !b.b) return J({ ok: false });
    await putCard(mk, b.a, now, b.win ? { w: 1 } : { l: 1 });
    const C = await cardsOf(mk), d = C[String(b.b)];
    if (d) {
      await putCard(mk, d, d.at, b.win ? { hl: 1 } : { hw: 1 });
      const list = (await st.get("a:d:" + d.id)) || [];
      await st.put("a:d:" + d.id, [{ at: now, name: b.a.name, pet: (b.a.pet || {}).name || "", held: !b.win }, ...list].slice(0, 20));
    }
    return J({ ok: true });
  }
  // 大会に 出る・やめる（その 日の 22:00 まで）
  if (url.pathname === "/arena/entry") {
    if (!b.card || String(b.card.id) !== id) return J({ ok: false, why: "札が ない" });
    const day = tourDay(now), t = (await st.get("a:t:" + day)) || newTour(day);
    if (t.state !== "open") return J({ ok: false, why: "もう しめきった" });
    if (b.on) {
      if (!t.ents.includes(id)) { if (t.ents.length >= TOUR.max) return J({ ok: false, why: `いっぱい（${TOUR.max} 人まで）` }); t.ents.push(id); }
      t.cards[id] = pub(await putCard(mk, b.card, now));
      const open = (await st.get("a:open")) || []; if (!open.includes(day)) await st.put("a:open", [...open, day]);
      await mk.wake(tourAt(day));
    } else t.ents = t.ents.filter((x) => x !== id);
    await st.put("a:t:" + day, t);
    return J({ ok: true, tour: tourView(t, id) });
  }
  // 試合を あとから 見る 材料（2 匹の 戦う 形と 種。同じ 種で 同じ 戦いに なる）
  if (url.pathname === "/arena/match") {
    const t = await st.get("a:t:" + url.searchParams.get("day")), r = +url.searchParams.get("r"), m = +url.searchParams.get("m");
    const mt = t && t.rounds && t.rounds[r] && t.rounds[r][m];
    if (!mt || mt.w == null || mt.a == null || mt.b == null) return J({ ok: false, why: "その 試合は ない" });
    const [fa, fb] = await Promise.all([st.get(`a:f:${t.day}:${mt.a}`), st.get(`a:f:${t.day}:${mt.b}`)]);
    return fa && fb ? J({ ok: true, A: fa.f, B: fb.f, seed: mt.seed, w: mt.w }) : J({ ok: false, why: "その 試合は ない" });
  }
  return J({ error: "notfound" }, 404);
}

// Market の アラームで：大会を 少しずつ 進める。つぎに 起きる 時刻を 返す（なければ Infinity）
//   22:00 を すぎた 大会：6 人 いなければ 中止。いれば ペットを 8 人ずつ よぶ → 組み合わせ → 1 回に 6 試合ずつ → ごほうびを 送る 箱へ
export async function arenaAlarm(mk, now) {
  const st = mk.state.storage;
  let open = (await st.get("a:open")) || [], runq = (await st.get("a:runq")) || [];
  for (const day of open.filter((d) => tourAt(d) <= now)) {
    const t = await st.get("a:t:" + day);
    if (t && t.state === "open") {
      t.state = t.ents.length >= TOUR.min ? "fetch" : "none";
      await st.put("a:t:" + day, t);
      if (t.state === "fetch") runq.push(day); else await st.put("a:last", day);
    }
    open = open.filter((d) => d !== day);
  }
  await st.put("a:open", open);
  if (runq.length) {
    const done = await tourStep(mk, runq[0], now);
    if (done) runq = runq.slice(1);
  }
  await st.put("a:runq", runq);
  if (runq.length) return now;
  return open.reduce((a, d) => Math.min(a, tourAt(d)), Infinity);
}
// 大会を 1 だんかい 進める。終わったら true
async function tourStep(mk, day, now) {
  const st = mk.state.storage, t = await st.get("a:t:" + day);
  if (!t || (t.state !== "fetch" && t.state !== "run")) return true;
  if (t.state === "fetch") {
    for (const id of t.ents.filter((x) => !t.got.includes(x) && !t.drop.includes(x)).slice(0, 8)) {
      let j = null;
      try { j = await (await mk.env.VIEWER.get(mk.env.VIEWER.idFromName("v:" + id)).fetch("https://viewer/fighter")).json(); } catch (e) {}
      if (j && j.f && j.card) { await st.put(`a:f:${day}:${id}`, j); t.cards[id] = pub(j.card); t.got.push(id); } else t.drop.push(id);
    }
    if (t.got.length + t.drop.length >= t.ents.length) {
      if (t.got.length < 2) { t.state = "none"; await st.put("a:t:" + day, t); await st.put("a:last", day); return true; }
      t.rounds = [bracketOf(t.got, matchSeed(day, -1, 0)).map((m, i) => ({ ...m, seed: matchSeed(day, 0, i), w: m.b == null ? 0 : m.a == null ? 1 : null }))];
      t.state = "run";
    }
    await st.put("a:t:" + day, t);
    return false;
  }
  const R = t.rounds[t.rounds.length - 1];
  let budget = 6;
  for (const m of R) {
    if (m.w != null || budget <= 0) continue;
    const [fa, fb] = await Promise.all([st.get(`a:f:${day}:${m.a}`), st.get(`a:f:${day}:${m.b}`)]);
    const end = simulate(fa.f, fb.f, m.seed, { quiet: true }).at(-1);
    m.w = end.winner; m.upset = !!end.upset; budget--;
  }
  if (R.every((m) => m.w != null)) {
    const win = R.map((m) => (m.w === 0 ? m.a : m.b));
    if (win.length > 1) {
      const r = t.rounds.length, next = [];
      for (let i = 0; i < win.length; i += 2) next.push({ a: win[i], b: win[i + 1], seed: matchSeed(day, r, i / 2), w: null });
      t.rounds.push(next);
    } else {
      // 終わり：1 位・2 位・ベスト 4・ほかは 参加。ごほうびは 送る 箱へ（Viewer が 同じ 番号を 2 回 受けない）
      const fin = R[0], place = Object.fromEntries(t.got.map((id) => [id, 0]));
      place[win[0]] = 1; place[fin.w === 0 ? fin.b : fin.a] = 2;
      if (t.rounds.length >= 2) for (const m of t.rounds[t.rounds.length - 2]) { const lose = m.w === 0 ? m.b : m.a; if (lose != null) place[lose] = 4; }
      t.place = place; t.state = "done";
      for (const [id, pl] of Object.entries(place)) {
        const P = TOUR_PAY[pl] || TOUR_PAY.all, mid = `arena:${day}:${id}`;
        await st.put("o:" + mid, { to: id, mid, why: "arena:" + day, give: { credits: P.credits }, earn: P.res ? [{ kind: "res", d: P.res }] : [] });
      }
      await st.put("a:t:" + day, t); await st.put("a:last", day);
      return true;
    }
  }
  await st.put("a:t:" + day, t);
  return false;
}
