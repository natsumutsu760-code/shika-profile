// 闘技場（鹿さんの頼み、2026-10-25）。決まりの 中身は 見本の lounge-proto/arena.js
// Viewer：arena.view・arena.foes・arena.duel・arena.entry（viewer.js の act から）。相手の いまの 強さは、相手の Viewer の /fighter（記録を 読むだけ。順番待ちを 通らないので、おたがいに 待って 止まらない）
// Market（みんなの 箱）：名簿 "a:c:" + id・守りの 記録 "a:d:" + id・大会 "a:t:" + 日・大会の ペット "a:f:" + 日 + ":" + id
//   受付中の 大会の 日 "a:open"・進めて いる 大会の 日 "a:runq"・さいごに 終わった 大会の 日 "a:last"。22:00 の アラームで 大会を 少しずつ 進める（CPU の 上限が あるので 1 回に 数試合）
// ごほうび：デュエルは その場で（クレジットは 記録・アメジストは 帳簿）。大会は Market の 送る 箱（"o:"）から Viewer の /inbox へ
// LINKERS の 格付け（2026-11-11）：名簿の 札に 点（pt）・点の 週（pw）・格付けで 戦った 数（f）。段の 線は "a:rk"（1 日 1 回）。決まりは lounge-proto/arena.js の RATE
import { DUEL, duelPay, pickFoes, TOUR, TOUR_PAY, tourDay, tourAt, tourAtH, bracketOf, bandMatches, matchSeed, simulate, fighterPower, ENC, RATE, RATE_RANKS, rateWeek, rateRank, MON, MTOUR, MTOUR_PAY, mtourDay, SELF_SIZES, tourDayH, TEAM, TTOUR, TTOUR_PAY, SELF_TEAMS, kachinuki } from "./game.js";
import { fighterOf } from "./lounge-game.js";
import { mateOf } from "./lounge-pet.js";   // モンスターの 戦う 形（なかまと 同じ。装備・栄養の 詳細）
import { hidden } from "./lounge-gate.js";   // 入れない 人は 相手に えらばない・大会から はずす・名前を 出さない

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
export function duelDone(rec, A, me, theirs, R, now, bonus = 0) {   // bonus：ファイトマネーの 上乗せ（契約した 会社の グループの 好感度・家具。lounge-link.js の fightBonus）
  const seed = Math.floor(R() * 2 ** 31), end = simulate(me.f, theirs.f, seed, { quiet: true }).at(-1), win = end.winner === 0;
  A.n++; if (win) A.w++; else A.l++;
  let pay = null;
  if (win && A.paid < DUEL.paidPerDay && !A.beat.includes(theirs.card.id)) {
    const p = duelPay(me.card.power, theirs.card.power);
    pay = { credits: Math.round(p.credits * (1 + bonus)), res: p.res, label: p.label };
    A.paid++; A.beat.push(theirs.card.id); rec.credits += pay.credits;
  }
  A.log = [{ at: now, name: theirs.card.name, pet: theirs.card.pet.name, win, pay }, ...A.log].slice(0, 10);
  return { ok: true, A: me.f, B: theirs.f, seed, win, upset: !!end.upset, pay, me: me.card, foe: theirs.card, left: { duels: DUEL.perDay - A.n, paid: DUEL.paidPerDay - A.paid },
    ...(pay && pay.res ? { earn: [{ kind: "res", d: pay.res }] } : {}) };
}
// ---------- モンスターの 闘技場（Viewer。2026-11-23 鹿さんの カード「Lv50 にそろえる」「代表 1 体で 1 対 1」「ペットと同じ表」）----------
// 戦う 形：なかまと 同じ（tamedOf ＋ 装備 ＋ 栄養の 詳細）で Lv だけ 50 に そろえる（戦いの 中だけ。育てた Lv は そのまま）
export const monOf = (c, rec) => ({ ...mateOf({ ...c, lv: MON.lv }, rec), owner: rec.name, mon: true });   // mon：3D は ドット絵の 板（battle-view.js。帯も 同じ）
const monPub = (c) => ({ uid: c.uid, name: c.name, tree: c.tree, type: c.type, lv: c.lv, plus: c.plus || 0, ...(c.tdMix ? { tdMix: c.tdMix } : {}) });
const tdDead = (rec, uid) => !!(rec.td && Array.isArray(rec.td.dead) && rec.td.dead.includes(uid));   // 集合住宅で 殺されて 復活待ちの 子
// 代表の 子の 戦う 形と 名簿の 札（代表が いない・手放した ときは null）
export function arenaMon(rec) {
  const A = rec.arenaM, c = A && A.rep && (rec.tamed || []).find((x) => x && x.uid === A.rep);
  if (!c || !c.tree || tdDead(rec, c.uid)) return null;
  const f = monOf(c, rec);
  return { card: { id: rec.id, name: rec.name, pet: monPub(c), power: fighterPower(f) }, f };
}
// モンスターの 1 日の 数（ペットの 闘技場と 同じ 形。rep：代表の 子の uid は 日を またいで のこす）
export function ensureArenaM(rec, day) {
  const A = (rec.arenaM ||= { day: -1, n: 0, paid: 0, beat: [], w: 0, l: 0, foes: [], log: [], rep: null });
  if (A.day !== day) Object.assign(A, { day, n: 0, paid: 0, beat: [], foes: [] });
  return A;
}
// 代表を えらぶ
export function monRep(rec, A, b) {
  const c = (rec.tamed || []).find((x) => x && x.uid === String(b.uid || ""));
  if (!c) return { ok: false, why: "その 子は なかまに いない" };
  if (tdDead(rec, c.uid)) return { ok: false, why: "その 子は 復活待ち" };
  A.rep = c.uid; A.foes = [];
  return { ok: true };
}
// 代表を えらぶ 一覧（Lv50 での 強さつき）
export const monList = (rec) => (rec.tamed || []).filter((c) => c && c.tree && !tdDead(rec, c.uid)).map((c) => ({ ...monPub(c), power: fighterPower(monOf(c, rec)) }));
// デュエルの 前の たしかめ
export function mDuelCheck(rec, A, b) {
  const me = arenaMon(rec);
  if (!me) return { why: "さきに 代表の 子を えらんで" };
  if (onTrip(rec, me.card.pet.uid)) return { why: `${me.card.pet.name}は 出かけて いる（帰ってから 戦える）` };
  if (A.n >= DUEL.perDay) return { why: `きょうは もう ${DUEL.perDay} 回 戦った（あした また）` };
  const foe = A.foes.find((c) => c.id === String(b.foe));
  if (!foe) return { why: "相手を えらんで" };
  return { me, foe };
}
// 自分の なかまの トーナメント（〔決〕ごほうび なし・何回でも）：えらんだ 4・8・16 体を Lv50 で 組み合わせて 全試合を 計算する。画面は 種で 同じ 戦いを 3D で 見られる
export function selfTour(rec, b, R) {
  const uids = [...new Set((Array.isArray(b.uids) ? b.uids : []).map(String))];
  if (!SELF_SIZES.includes(uids.length)) return { ok: false, why: `${SELF_SIZES.join("・")} 体 えらんで` };
  const cs = uids.map((u) => (rec.tamed || []).find((x) => x && x.uid === u));
  if (cs.some((c) => !c || !c.tree)) return { ok: false, why: "なかまに いない 子が いる" };
  if (cs.some((c) => tdDead(rec, c.uid))) return { ok: false, why: "復活待ちの 子が いる" };
  const fs = Object.fromEntries(cs.map((c) => [c.uid, monOf(c, rec)])), cards = Object.fromEntries(cs.map((c) => [c.uid, { ...monPub(c), power: fighterPower(fs[c.uid]) }]));
  const base = Math.floor(R() * 2 ** 31) >>> 0, rounds = [bracketOf(uids, base).map((m) => ({ a: m.a, b: m.b }))];
  for (let r = 0; ; r++) {
    const Rd = rounds[r];
    Rd.forEach((m, i) => { m.seed = (base + r * 97 + i * 7919) >>> 0; m.w = m.b == null ? 0 : m.a == null ? 1 : simulate(fs[m.a], fs[m.b], m.seed, { quiet: true }).at(-1).winner; });
    const win = Rd.map((m) => (m.w === 0 ? m.a : m.b));
    if (win.length === 1) break;
    const nx = []; for (let i = 0; i < win.length; i += 2) nx.push({ a: win[i], b: win[i + 1] }); rounds.push(nx);
  }
  const fin = rounds.at(-1)[0];
  return { ok: true, fs, cards, rounds, champ: fin.w === 0 ? fin.a : fin.b };
}
// ---------- 3 体の 勝ち抜き（Viewer。2026-11-24 鹿さんの カード「デュエルと大会の両方」「減った HP のまま次へ」「毎日 21:30」「1 体と同じ表」「1 体と別々に数える」）----------
// rec.arenaT：3 体の 部の 1 日の 数（1 体の 部とは 別）と チーム（出る 順の uid 3 つ）
export function ensureArenaT(rec, day) {
  const A = (rec.arenaT ||= { day: -1, n: 0, paid: 0, beat: [], w: 0, l: 0, foes: [], log: [], team: [] });
  if (A.day !== day) Object.assign(A, { day, n: 0, paid: 0, beat: [], foes: [] });
  return A;
}
// チームの 戦う 形（3 つ）と 名簿の 札（強さは 3 体の 合計・pet.team に 3 体の 絵）
export function arenaTeam(rec) {
  const T = rec.arenaT, cs = T && Array.isArray(T.team) && T.team.length === TEAM ? T.team.map((u) => (rec.tamed || []).find((x) => x && x.uid === u)) : null;
  if (!cs || cs.some((c) => !c || !c.tree || tdDead(rec, c.uid))) return null;
  const f = cs.map((c) => monOf(c, rec)), team = cs.map(monPub);
  return { card: { id: rec.id, name: rec.name, pet: { name: team.map((c) => c.name).join("・"), team, tree: team[0].tree, type: team[0].type }, power: f.reduce((a, x) => a + fighterPower(x), 0) }, f };
}
export function monTeam(rec, A, b) {
  const uids = [...new Set((Array.isArray(b.uids) ? b.uids : []).map(String))];
  if (uids.length !== TEAM) return { ok: false, why: `${TEAM} 体 えらんで` };
  for (const u of uids) { const c = (rec.tamed || []).find((x) => x && x.uid === u); if (!c) return { ok: false, why: "その 子は なかまに いない" }; if (tdDead(rec, u)) return { ok: false, why: "その 子は 復活待ち" }; }
  A.team = uids; A.foes = [];
  return { ok: true };
}
export function tDuelCheck(rec, A, b) {
  const me = arenaTeam(rec);
  if (!me) return { why: `さきに ${TEAM} 体を えらんで` };
  const away = me.card.pet.team.find((c) => onTrip(rec, c.uid)); if (away) return { why: `${away.name}は 出かけて いる（帰ってから 戦える）` };
  if (A.n >= DUEL.perDay) return { why: `きょうは もう ${DUEL.perDay} 回 戦った（あした また）` };
  const foe = A.foes.find((c) => c.id === String(b.foe));
  if (!foe) return { why: "相手を えらんで" };
  return { me, foe };
}
// 勝ち抜きの デュエル（ごほうびは 1 体と 同じ 表・回数は 別。〔C〕ファイトマネーの 上乗せ・LINKERS は ペットだけ）
export function tDuelDone(rec, A, me, theirs, R, now) {
  const seed = Math.floor(R() * 2 ** 31), k = kachinuki(me.f, theirs.f, seed), win = k.w === 0;
  A.n++; if (win) A.w++; else A.l++;
  let pay = null;
  if (win && A.paid < DUEL.paidPerDay && !A.beat.includes(theirs.card.id)) {
    const p = duelPay(me.card.power, theirs.card.power);
    pay = { credits: p.credits, res: p.res, label: p.label };
    A.paid++; A.beat.push(theirs.card.id); rec.credits += pay.credits;
  }
  A.log = [{ at: now, name: theirs.card.name, pet: theirs.card.pet.name, win, pay }, ...A.log].slice(0, 10);
  return { ok: true, A: me.f, B: theirs.f, seed, win, bouts: k.bouts, pay, me: me.card, foe: theirs.card, left: { duels: DUEL.perDay - A.n, paid: DUEL.paidPerDay - A.paid },
    ...(pay && pay.res ? { earn: [{ kind: "res", d: pay.res }] } : {}) };
}
// 試す（3 体）：えらんだ 順に 3 体ずつで 4・8 チーム。組み合わせと 勝ち抜きを 門番で 計算（ごほうび なし・何回でも）
export function selfTeamTour(rec, b, R) {
  const uids = [...new Set((Array.isArray(b.uids) ? b.uids : []).map(String))], nT = uids.length / TEAM;
  if (!SELF_TEAMS.includes(nT)) return { ok: false, why: `${SELF_TEAMS.map((n) => n * TEAM).join("・")} 体 えらんで` };
  const cs = uids.map((u) => (rec.tamed || []).find((x) => x && x.uid === u));
  if (cs.some((c) => !c || !c.tree)) return { ok: false, why: "なかまに いない 子が いる" };
  if (cs.some((c) => tdDead(rec, c.uid))) return { ok: false, why: "復活待ちの 子が いる" };
  const fs = Object.fromEntries(cs.map((c) => [c.uid, monOf(c, rec)])), cards = Object.fromEntries(cs.map((c) => [c.uid, { ...monPub(c), power: fighterPower(fs[c.uid]) }]));
  const teams = Object.fromEntries(Array.from({ length: nT }, (_, i) => ["T" + (i + 1), uids.slice(i * TEAM, i * TEAM + TEAM)])), tf = (t) => teams[t].map((u) => fs[u]);
  const base = Math.floor(R() * 2 ** 31) >>> 0, rounds = [bracketOf(Object.keys(teams), base).map((m) => ({ a: m.a, b: m.b }))];
  for (let r = 0; ; r++) {
    const Rd = rounds[r];
    Rd.forEach((m, i) => { m.seed = (base + r * 97 + i * 7919) >>> 0; m.w = m.b == null ? 0 : m.a == null ? 1 : kachinuki(tf(m.a), tf(m.b), m.seed).w; });
    const win = Rd.map((m) => (m.w === 0 ? m.a : m.b));
    if (win.length === 1) break;
    const nx = []; for (let i = 0; i < win.length; i += 2) nx.push({ a: win[i], b: win[i + 1] }); rounds.push(nx);
  }
  const fin = rounds.at(-1)[0];
  return { ok: true, fs, cards, teams, rounds, champ: fin.w === 0 ? fin.a : fin.b };
}
// 画面に 出す 自分の 分
export const arenaMine = (A) => ({ left: { duels: DUEL.perDay - A.n, paid: DUEL.paidPerDay - A.paid }, beat: A.beat, foes: A.foes, w: A.w, l: A.l, log: A.log });

// ---------- 派遣先の 戦い（⑤） ----------
// 出発の ときに：中継（Lounge の /relay）の 派遣中の 人から、同じ 行き先の ほかの 人を さがす。いれば 3 割で 出会う
export function encReady(rec, day) { const E = (rec.enc ||= { day: -1, n: 0 }); if (E.day !== day) Object.assign(E, { day, n: 0 }); return E.n < ENC.perDay; }
export function encPick(list, myId, did, R, gate) {
  const c = (list || []).filter((e) => e && e.id !== myId && e.did === did && Array.isArray(e.party) && e.party[0] && e.party[0].stats && !hidden(gate, e.id));
  if (!c.length || R() >= ENC.chance) return null;
  return c[Math.floor(R() * c.length)];
}
// 戦って 自分の 分を 記録に 入れる（相手の 分は Market が 送る 箱から）。探索（派遣）には さわらない
export function encDone(rec, me, foe, R) {
  const B = { ...foe.party[0], owner: foe.name }, seed = Math.floor(R() * 2 ** 31), end = simulate(me.f, B, seed, { quiet: true }).at(-1), win = end.winner === 0;
  rec.enc.n++;
  if (win) rec.credits += ENC.winCredits;
  return { A: me.f, B, seed, win, upset: !!end.upset, did: foe.did, foe: { id: foe.id, name: foe.name, pet: B.name }, credits: win ? ENC.winCredits : 0, res: ENC.res, pay: { credits: ENC.winCredits, res: ENC.res } };
}

// ---------- Market ----------
// 2 つの 闘技場（2026-11-23）：ペット（前からの 形）と モンスター。箱の 名前の 頭・大会の 時刻・格付け・配信の 帯・ごほうびの 名前・相手の 戦う 形の 道が ちがう
//   モンスターの 箱は「a:m:」で 始める（全体の リセットが「a:」を まとめて 消す ので いっしょに 消える）
export const KP = { pre: "a:", path: "/arena/", T: TOUR, pay: TOUR_PAY, rate: true, band: true, why: "arena:", fighter: "/fighter" };
export const KT = { pre: "a:t3:", path: "/tarena/", T: TTOUR, pay: TTOUR_PAY, rate: false, band: "final", cat: "t3", why: "tarena:", fighter: "/tfighter", team: true };   // 3 体の 勝ち抜き（21:30）。帯は 決勝だけ（2026-11-24 鹿さんの カード「3体も決勝だけ流す」。1 試合が 最大 5 戦で 長い）
export const KM = { pre: "a:m:", path: "/marena/", T: MTOUR, pay: MTOUR_PAY, rate: false, band: true, cat: "mon", why: "marena:", fighter: "/mfighter" };   // 帯：2026-11-24 カード「オーバーレイも直す」「ベスト 8 から」
const dayOf = (K, now) => tourDayH(now, K.T.hour);
const atOf = (K, day) => tourAtH(day, K.T.hour);
async function cardsOf(mk, K = KP) {
  const C = (mk.cardsK ||= {});
  if (!C[K.pre]) C[K.pre] = Object.fromEntries([...(await mk.state.storage.list({ prefix: K.pre + "c:" })).values()].map((c) => [c.id, c]));
  return C[K.pre];
}
// 札を 新しく する（勝ち負けは 名簿の 方が 持つ）
// 点は 週ごとに 1 割 0 に 近づく（読む ときに 追いつく）
export const ptNow = (c, now) => { const k = Math.min(52, Math.max(0, rateWeek(now) - (c.pw ?? rateWeek(now)))); return Math.round((c.pt || 0) * Math.pow(RATE.decay, k)); };
async function putCard(mk, card, now, d = {}, seen = now, K = KP) {   // seen：最後に 来た 時刻（守った 人・大会の 点は 前の まま）
  const C = await cardsOf(mk, K), old = C[card.id] || { w: 0, l: 0, hw: 0, hl: 0 };
  const pt = ptNow(old, now);
  const c = { id: String(card.id), name: String(card.name || "").slice(0, 40), pet: card.pet, power: Math.round(+card.power || 0), at: seen,
    w: old.w + (d.w || 0), l: old.l + (d.l || 0), hw: old.hw + (d.hw || 0), hl: old.hl + (d.hl || 0),   // hw・hl：留守の あいだに 守った・やられた
    pt: d.pt != null ? Math.max(0, pt + d.pt) : pt, pw: rateWeek(now), f: (old.f || 0) + (d.pt != null ? 1 : 0) };   // 格付けの 点・その 週・格付けで 戦った 数
  C[c.id] = c; await mk.state.storage.put(K.pre + "c:" + c.id, c);
  return c;
}
const pub = (c) => ({ id: c.id, name: c.name, pet: c.pet, power: c.power });
// 段の 線（1 回でも 戦った 人の 点を 高い 順に 並べ、上 1%・5%・20%・30%・50% の 人の 点）。1 日 1 回 決める
//   〔C〕戦った 人が 50 人 より 少ない あいだは 毎回 引きなおす（はじめの 日に「だれも 戦って いない」線の まま 1 日 D に 止まらない ため。少ないので 軽い）
export function cutsOf(cards, now) {
  const pts = Object.values(cards).filter((c) => (c.f || 0) > 0).map((c) => ptNow(c, now)).sort((a, b) => b - a), n = pts.length;
  if (!n) return { n: 0, cuts: null };
  const at = (p) => pts[Math.max(0, Math.ceil(n * p) - 1)];
  return { n, cuts: { ...Object.fromEntries(RATE_RANKS.map(([k, p]) => [k, at(p)])), t30: at(0.3) } };
}
async function rankCuts(mk, now) {
  const st = mk.state.storage, day = Math.floor((now + 9 * 3600e3) / 864e5), old = await st.get("a:rk");
  if (old && old.day === day && old.n >= 50) return old;
  const r = { day, ...cutsOf(await cardsOf(mk), now) };
  await st.put("a:rk", r);
  return r;
}
// 自分の 格付け（点は いま・段の 線は きょうの 分）。t30：上の 3 割・t50：上の 半分（C 以上）
export const rateView = (c, rk, now) => { const pt = ptNow(c, now), rank = rateRank(pt, rk.cuts); return { pt, rank, f: c.f || 0, n: rk.n, t30: pt > 0 && !!rk.cuts && pt >= rk.cuts.t30, t50: rank !== "D" }; };
const winPt = (rk) => Math.round(RATE.win * (1 + (Number.isFinite(+rk) ? Math.min(1, Math.max(0, +rk)) : 0)));   // rk：家具（壁の大型モニター など）の 格付けの 点 ＋%
async function pushEnc(st, id, e) { const list = (await st.get("a:e:" + id)) || []; await st.put("a:e:" + id, [e, ...list].slice(0, 6)); }
// 大会を 画面の 形に（名前は 参加した ときの 札から）
function tourView(t, id, K = KP) {
  if (!t) return null;
  const who = (x) => (x == null ? null : { id: x, name: (t.cards[x] || {}).name || "？", pet: ((t.cards[x] || {}).pet || {}).name || "", qid: ((t.cards[x] || {}).pet || {}).qid || "" });
  return { day: t.day, at: atOf(K, t.day), state: t.state, n: t.ents.length, entered: t.ents.includes(id),
    rounds: (t.rounds || []).map((R) => R.map((m) => ({ a: who(m.a), b: who(m.b), w: m.w, bye: m.a == null || m.b == null }))), place: t.place ? t.place[id] ?? null : null };
}
const newTour = (day) => ({ day, ents: [], cards: {}, state: "open", got: [], drop: [], rounds: null, place: null });

// Market の fetch で：const ar = await arenaFetch(this, url, b, now); if (ar) return ar;
export async function arenaFetch(mk, url, b, now) {
  const K = url.pathname.startsWith("/arena/") ? KP : url.pathname.startsWith("/marena/") ? KM : url.pathname.startsWith("/tarena/") ? KT : null;
  if (!K) return null;
  const P = K.pre, sub = url.pathname.slice(K.path.length - 1);   // sub：「/view」など
  const st = mk.state.storage, id = String((b && b.id) || url.searchParams.get("id") || "");
  // 見る（自分の 札を 名簿に のせる。pick：相手を 3 人 えらびなおす）
  if (sub === "/view") {
    if (!b.card || String(b.card.id) !== id) return J({ ok: false, why: "札が ない" });
    const me = await putCard(mk, b.card, now, {}, now, K), C = await cardsOf(mk, K), gate = await mk.env.DB.get("gate", "json");
    const day = dayOf(K, now), last = await st.get(P + "last");
    const out = { ok: true, card: me, def: ((await st.get(P + "d:" + id)) || []).filter((x) => !x.by || !hidden(gate, x.by)).slice(0, 10), tour: tourView((await st.get(P + "t:" + day)) || newTour(day), id, K), last: last ? tourView(await st.get(P + "t:" + last), id, K) : null };
    if (K === KP) {
      out.enc = ((await st.get("a:e:" + id)) || []).filter((x) => !hidden(gate, x.by)).map(({ A, B, seed, ...x }) => x);   // 派遣先の 戦い（見る 材料は 出さない）
      out.rate = rateView(me, await rankCuts(mk, now), now);   // LINKERS の 格付け
    }
    if (b.pick) out.foes = pickFoes(Object.values(C).filter((c) => now - c.at < OLD_MS && !hidden(gate, c.id)), id, me.power, Math.random).map(pub);
    return J(out);
  }
  // デュエルの 記録（挑んだ 人の Viewer から）：a は 挑んだ 人の 札、b は 相手の id、win は 挑んだ 人が 勝ったか
  if (sub === "/log") {
    if (!b.a || !b.b) return J({ ok: false });
    const me = await putCard(mk, b.a, now, K.rate ? (b.win ? { w: 1, pt: winPt(b.rk) } : { l: 1, pt: -RATE.lose }) : b.win ? { w: 1 } : { l: 1 }, now, K);   // 格付けの 点は 挑んだ 人だけ（〔C〕守る 側は 留守なので 動かさない）・モンスターは 格付けに 数えない〔C〕
    const C = await cardsOf(mk, K), d = C[String(b.b)];
    if (d) {
      await putCard(mk, d, now, b.win ? { hl: 1 } : { hw: 1 }, d.at, K);
      const list = (await st.get(P + "d:" + d.id)) || [];
      await st.put(P + "d:" + d.id, [{ at: now, by: String(b.a.id), name: b.a.name, pet: (b.a.pet || {}).name || "", held: !b.win }, ...list].slice(0, 20));
    }
    return J(K.rate ? { ok: true, rate: rateView(me, await rankCuts(mk, now), now) } : { ok: true });
  }
  // 大会に 出る・やめる（その 日の 22:00 まで）
  if (sub === "/entry") {
    if (!b.card || String(b.card.id) !== id) return J({ ok: false, why: "札が ない" });
    const day = dayOf(K, now), t = (await st.get(P + "t:" + day)) || newTour(day);
    if (t.state !== "open") return J({ ok: false, why: "もう しめきった" });
    if (b.on) {
      if (!t.ents.includes(id)) { if (t.ents.length >= K.T.max) return J({ ok: false, why: `いっぱい（${K.T.max} 人まで）` }); t.ents.push(id); }
      t.cards[id] = pub(await putCard(mk, b.card, now, {}, now, K));
      const open = (await st.get(P + "open")) || []; if (!open.includes(day)) await st.put(P + "open", [...open, day]);
      await mk.wake(atOf(K, day));
    } else t.ents = t.ents.filter((x) => x !== id);
    await st.put(P + "t:" + day, t);
    return J({ ok: true, tour: tourView(t, id, K) });
  }
  // 派遣先の 戦い（出会った 人の Viewer から）：ふたりの 記録（"a:e:" + id。見る 材料つき 6 こ）・相手の ごほうび（1 日 3 回まで。送る 箱へ）
  if (K === KP && sub === "/enc") {
    if (!b.a || !b.foe || !b.A || !b.B || !Number.isFinite(+b.seed)) return J({ ok: false });
    const gate = await mk.env.DB.get("gate", "json"); if (hidden(gate, id) || hidden(gate, String(b.foe))) return J({ ok: false });   // どちらかが 入れない 人なら 記録も ごほうびも なし
    const foeId = String(b.foe), base = { at: now, did: String(b.did || ""), seed: +b.seed, A: b.A, B: b.B };
    await pushEnc(st, id, { ...base, me: 0, by: foeId, name: String(b.B.owner || ""), pet: String(b.B.name || ""), win: !!b.win });
    await pushEnc(st, foeId, { ...base, me: 1, by: id, name: String(b.A.owner || ""), pet: String(b.A.name || ""), win: !b.win });
    const day = Math.floor((now + 9 * 3600e3) / 864e5), ec = await st.get("a:ec"), cnt = ec && ec.day === day ? ec.n : {};   // その 日の 回数だけ（日が かわったら 入れかわる。鍵は 1 つ）
    if ((cnt[foeId] || 0) < ENC.perDay) {
      const mid = `enc:${now}:${id}:${foeId}`;
      cnt[foeId] = (cnt[foeId] || 0) + 1; await st.put("a:ec", { day, n: cnt });
      await st.put("o:" + mid, { to: foeId, mid, why: "enc", give: { credits: b.win ? 0 : ENC.winCredits }, earn: ENC.res ? [{ kind: "res", d: ENC.res }] : [] });
      await mk.wake(now);
    }
    return J({ ok: true });
  }
  if (K === KP && sub === "/encget") {
    const e = ((await st.get("a:e:" + id)) || []).find((x) => x.at === +url.searchParams.get("at"));
    return e ? J({ ok: true, A: e.A, B: e.B, seed: e.seed, me: e.me, win: e.win }) : J({ ok: false, why: "その 戦いは もう ない" });
  }
  // 試合を あとから 見る 材料（2 匹の 戦う 形と 種。同じ 種で 同じ 戦いに なる）
  if (sub === "/match") {
    const t = await st.get(P + "t:" + url.searchParams.get("day")), r = +url.searchParams.get("r"), m = +url.searchParams.get("m");
    const mt = t && t.rounds && t.rounds[r] && t.rounds[r][m];
    if (!mt || mt.w == null || mt.a == null || mt.b == null) return J({ ok: false, why: "その 試合は ない" });
    const [fa, fb] = await Promise.all([st.get(`${P}f:${t.day}:${mt.a}`), st.get(`${P}f:${t.day}:${mt.b}`)]);
    return fa && fb ? J({ ok: true, A: fa.f, B: fb.f, seed: mt.seed, w: mt.w }) : J({ ok: false, why: "その 試合は ない" });
  }
  return J({ error: "notfound" }, 404);
}

// Market の アラームで：大会を 少しずつ 進める。つぎに 起きる 時刻を 返す（なければ Infinity）
//   22:00 を すぎた 大会：6 人 いなければ 中止。いれば ペットを 8 人ずつ よぶ → 組み合わせ → 1 回に 6 試合ずつ → ごほうびを 送る 箱へ
export async function arenaAlarm(mk, now) {
  const a = await kAlarm(mk, now, KP), b = await kAlarm(mk, now, KM), c = await kAlarm(mk, now, KT);   // ペットの 22:00・モンスターの 21:00・3 体の 21:30
  return Math.min(a, b, c);
}
async function kAlarm(mk, now, K) {
  const st = mk.state.storage, P = K.pre;
  let open = (await st.get(P + "open")) || [], runq = (await st.get(P + "runq")) || [];
  for (const day of open.filter((d) => atOf(K, d) <= now)) {
    const t = await st.get(P + "t:" + day);
    if (t && t.state === "open") {
      t.state = t.ents.length >= K.T.min ? "fetch" : "none";
      await st.put(P + "t:" + day, t);
      if (t.state === "fetch") runq.push(day); else await st.put(P + "last", day);
    }
    open = open.filter((d) => d !== day);
  }
  await st.put(P + "open", open);
  if (runq.length) {
    const done = await tourStep(mk, runq[0], now, K);
    if (done) runq = runq.slice(1);
  }
  await st.put(P + "runq", runq);
  if (runq.length) return now;
  return open.reduce((x, d) => Math.min(x, atOf(K, d)), Infinity);
}
// 大会を 1 だんかい 進める。終わったら true
async function tourStep(mk, day, now, K = KP) {
  const st = mk.state.storage, P = K.pre, t = await st.get(P + "t:" + day);
  if (!t || (t.state !== "fetch" && t.state !== "run")) return true;
  if (t.state === "fetch") {
    const gate = await mk.env.DB.get("gate", "json");
    for (const id of t.ents.filter((x) => !t.got.includes(x) && !t.drop.includes(x)).slice(0, 8)) {
      if (hidden(gate, id)) { t.drop.push(id); continue; }   // 22:00 の 時点で 入れない 人は 出ない
      let j = null;
      try { j = await (await mk.env.VIEWER.get(mk.env.VIEWER.idFromName("v:" + id)).fetch("https://viewer" + K.fighter)).json(); } catch (e) {}
      if (j && j.f && j.card) { await st.put(`${P}f:${day}:${id}`, j); t.cards[id] = pub(j.card); t.got.push(id); } else t.drop.push(id);
    }
    if (t.got.length + t.drop.length >= t.ents.length) {
      if (t.got.length < 2) { t.state = "none"; await st.put(P + "t:" + day, t); await st.put(P + "last", day); return true; }
      t.rounds = [bracketOf(t.got, matchSeed(day, -1, 0)).map((m, i) => ({ ...m, seed: matchSeed(day, 0, i), w: m.b == null ? 0 : m.a == null ? 1 : null }))];
      t.state = "run";
    }
    await st.put(P + "t:" + day, t);
    return false;
  }
  const R = t.rounds[t.rounds.length - 1];
  let budget = 6;
  for (const m of R) {
    if (m.w != null || budget <= 0) continue;
    const [fa, fb] = await Promise.all([st.get(`${P}f:${day}:${m.a}`), st.get(`${P}f:${day}:${m.b}`)]);
    if (K.team) { m.w = kachinuki(fa.f, fb.f, m.seed).w; budget -= 2; }   // 3 体の 勝ち抜き（1 試合が 最大 5 戦なので 重さを 2 試合ぶんに）
    else { const end = simulate(fa.f, fb.f, m.seed, { quiet: true }).at(-1); m.w = end.winner; m.upset = !!end.upset; budget--; }
    if (K.rate) {   // 格付けの 点（大会の 1 試合ごと。ペットだけ）
      const C = await cardsOf(mk, K), [wi, li] = m.w === 0 ? [m.a, m.b] : [m.b, m.a], wf = m.w === 0 ? fa : fb;
      if (C[wi]) await putCard(mk, C[wi], now, { pt: winPt(wf.rk) }, C[wi].at, K);
      if (C[li]) await putCard(mk, C[li], now, { pt: -RATE.lose }, C[li].at, K);
    }
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
      const wins = {}; for (const Rd of t.rounds) for (const m of Rd) if (m.a != null && m.b != null) { const w = m.w === 0 ? m.a : m.b; wins[w] = (wins[w] || 0) + 1; }   // 勝った 試合の 数（LINKERS の 契約の 払い）
      for (const [id, pl] of Object.entries(place)) {
        const Y = K.pay[pl] || K.pay.all, mid = `${K.why}${day}:${id}`;
        await st.put("o:" + mid, { to: id, mid, why: K.why + day, give: { credits: Y.credits }, earn: Y.res ? [{ kind: "res", d: Y.res }] : [], ...(K.rate ? { wins: wins[id] || 0 } : {}) });   // モンスターの 大会は LINKERS の 契約の 払いに 数えない〔C〕
      }
      await st.put(P + "t:" + day, t); await st.put(P + "last", day);
      // 配信中なら ベスト 8 からの 試合を オーバーレイの 帯へ（1 回で 送る。ペットは Twitch の id で なく 番号で）
      if (K.band) try {
        const L = bandMatches(t.rounds).filter((x) => K.band !== "final" || x.final), ids = [...new Set(L.flatMap((x) => [x.a, x.b]))], got = await Promise.all(ids.map((id) => st.get(`${P}f:${day}:${id}`))), fs = {}, k = {};
        ids.forEach((id, i) => { if (got[i]) { k[id] = String(i); fs[i] = got[i].f; } });
        const list = L.filter((x) => k[x.a] && k[x.b]).map((x) => ({ ...x, a: k[x.a], b: k[x.b] }));
        if (list.length && mk.env.LOUNGE) await mk.env.LOUNGE.get(mk.env.LOUNGE.idFromName("lounge")).fetch("https://lounge/relay-pvp", { method: "POST", body: JSON.stringify({ kind: "tour", day, fs, list, ...(K.cat ? { cat: K.cat } : {}) }) });
      } catch (e) {}
      return true;
    }
  }
  await st.put(P + "t:" + day, t);
  return false;
}
