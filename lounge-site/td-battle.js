// 集合住宅（TD）の 防衛の 計算（M-028 の 決め・研究ノート `docs/mono-link-td-reference.md` 21 回目）。three を 使わない（node・門番・td.html で 動く）
// 決め：敵は みんな 1 ターン 1 歩・プライベートラウンジへ いちばん 近い 道（6 回目）／戦いは 敵の 次の 1 歩に 住人が いると はじまる／
//   敵の 上下左右に いる 住人は すぐ 加勢（片方 4 体まで・敵も 同じ 決まりで 加勢）／マス目の 1 ターンで 戦いも 1 手ずつ（AGI の 順・ガンビットで 自動）／
//   待ち伏せから 戦うと チャージ／退避は AGI の くらべっこ（成功すると 部屋へ・その 防衛は 休み）／HP 0 は 力つき、その 戦いの うちに 起こされなければ 殺される／
//   勝った 住人は 部屋へ もどる／MONO ペットは プライベートラウンジで 最後に 戦う（負けたら 防衛は 負け・ペットは 殺されない）
// 1 手ずつの 戦いは battle-sim の simulateTeams を 1 ターン（until 1）ずつ 回し、HP・MP・状態を 次の ターンへ 持ちこす（startHp・startMp・startFx）。
//   続きの 子は c.cont で「戦いのはじめに」を かけなおさない・keepPerm で はじめの 状態も 持ちこす（2026-11-14 に battle-sim へ 足した 入り口）
// 数は td-numbers.js（〔C〕は 鹿さんの カード待ち）
//
//   const S = tdInit({ map, residents, foes, pet, seed, mods });   // map = { cells: { id: { nb: [id…], room?, blk? } }, entrance, lounge }
//   mods（モジュール。2026-11-15 鹿さんの カードで 強さ 〔決〕）= { "cell:<マスの id>": { id, star }, "blk:<箱の id>": { id, star }, "room:<部屋の 鍵>": { id, star } }
//     区画の モジュールで 敵が 箱に 入った ことを 知るには、廊下の マスに blk（箱の id）が いる。部屋の 鍵は「箱-階-番目」なので 住人の 箱は 鍵から わかる
//   helpers（助けを よぶ 掲示板。2026-11-16 2 代目）= [{ uid, c, type }]：入口から ラウンジへの 通り道の 入口に 近い マスに 立ち、自動で 動く（指示は 受けない）。
//     HP 3 割で 引き上げ・力つきても 殺されない（自分の 建物へ 帰る）。S.dead には 入らない
//   tdOrder(S, uid, { do: "go" | "wait" | "move" | "ambush" | "skill" | "retreat", to?, tgt? });
//   const ev = tdTurn(S);                                    // その ターンの 出来事。S.over：win・lose・null
import { simulateTeams } from "./battle-sim.js";
import { FIGHT, FOE, retreatOdds, MODULES, modAmt, HELP, AUTO } from "./td-numbers.js";
import { EFFECTS, PAIR } from "./effects.js";

const rng = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ---- 道（マスの つながりの 歩数）----
function bfs(map, from, pass = () => true) {
  const d = { [from]: 0 }, q = [from];
  while (q.length) { const x = q.shift(); for (const y of map.cells[x].nb) if (d[y] == null && pass(y)) { d[y] = d[x] + 1; q.push(y); } }
  return d;
}
export const distOf = (map, a, b) => bfs(map, a)[b] ?? Infinity;

const unit = (u, side) => ({ uid: u.uid, side, c: u.c, type: u.type || null, cell: u.cell ?? null, home: u.home ?? u.cell ?? null, hp: null, mp: null, fx: {}, battle: null, order: { do: "wait" }, rest: false, ambush: false, block: false, slow: 0, fresh: true, charge: false, dead: false });

const sickC = (c) => (c && c.stats ? { ...c, stats: Object.fromEntries(Object.entries(c.stats).map(([k, v]) => [k, typeof v === "number" ? Math.max(1, Math.floor(v / 2)) : v])) } : c);
// 手伝いの 子の 立つ マス：入口から ラウンジへの いちばん 近い 道の 上（入口の マスと 部屋は のぞく）。足りなければ 入口に 近い 廊下
function helpSpots(S, n) {
  const map = S.map, out = []; let x = map.entrance;
  for (let k = 0; k < 64 && out.length < n; k++) {
    const nx = map.cells[x].nb.filter((y) => !map.cells[y].room && (S.toLounge[y] ?? Infinity) < (S.toLounge[x] ?? Infinity)).sort((a, b) => S.toLounge[a] - S.toLounge[b])[0];
    if (!nx || nx === map.lounge) break; x = nx; if (!at(S, x)) out.push(x);
  }
  if (out.length < n) { const d = bfs(map, map.entrance); for (const y of Object.keys(d).sort((a, b) => d[a] - d[b])) if (out.length < n && y !== map.entrance && y !== map.lounge && !map.cells[y].room && !out.includes(y) && !at(S, y)) out.push(y); }
  return out;
}
export function tdInit({ map, residents = [], foes = [], pet = null, seed = 1, mods = {}, helpers = [] }) {
  const S = { map, seed, turn: 0, units: {}, queue: [], battles: [], nextB: 1, over: null, dead: [], beaten: [], R: rng(seed), toLounge: bfs(map, map.lounge), mods: mods || {} };
  for (const r of residents) S.units[r.uid] = unit(r.sick ? { ...r, c: sickC(r.c) } : r, "res");   // 〔決〕病気の 住人は 全ステータス 半分（8 回目の カード）
  if (pet) S.units[pet.uid] = { ...unit({ ...pet, cell: map.lounge }, "pet") };
  const spots = helpSpots(S, helpers.length);
  helpers.forEach((h, i) => { S.units[h.uid] = { ...unit({ ...h, cell: spots[i] ?? null, home: null }, "res"), helper: true }; });
  S.queue = foes.map((f) => unit({ ...f, cell: null }, "foe"));
  modInit(S);
  return S;
}

// ---- モジュール（td-numbers.js の MODULES）----
const keyOfRoom = (cell) => (typeof cell === "string" && cell.startsWith("room:") ? cell.slice(5) : null);
const blkOfKey = (key) => (key ? key.split("-")[0] : null);
const modAt = (S, k) => { const m = S.mods[k]; return m && MODULES[m.id] ? { ...MODULES[m.id], id: m.id, star: m.star | 0 } : null; };
const srcOf = (S, stat) => Math.max(10, ...Object.values(S.units).filter((U) => U.side === "res" && !U.dead).map((U) => U.c?.stats?.[stat] || 0));   // 〔C〕住人の いちばん 高い 値
// 状態を 足す（battle-sim の addFx を 小さく 写した 物：抵抗・相殺・重ね・上限）。〔C〕抵抗は 免疫 − 衰弱 ＋ ボスの 抵抗（パッシブの 抵抗は 戦いの 中で 効く）
function modFx(S, U, id, a, turns, src) {
  const D = EFFECTS[id]; if (!D || a <= 0) return false;
  if (!D.buff) { const res = Math.max(0, Math.min(100, (U.fx.immunity?.amt || 0) - (U.fx.weakness?.amt || 0) + (U.c?.boss ? D.bossRes || 0 : 0))); if (res && S.R() < res / 100) return false; }
  const fx = U.fx, p = PAIR[id];
  if (p && fx[p]) { if (D.dur === "stack") { const cut = Math.min(a, fx[p].amt); fx[p].amt -= cut; a -= cut; if (fx[p].amt <= 0) delete fx[p]; if (a <= 0) return true; } else delete fx[p]; }
  const cap = D.cap === "hp" ? (U.maxHp ?? U.c?.stats?.hp ?? Infinity) : D.cap ?? Infinity, cur = fx[id];
  if (D.dur === "stack" || D.dur === "value") {
    if (cur) { cur.amt = Math.min(cap, cur.amt + a); cur.turns = cur.turns == null || turns == null ? null : Math.max(cur.turns, turns); if (src) cur.src = Math.max(cur.src || 0, src); }
    else fx[id] = { amt: Math.min(cap, a), turns, ...(src ? { src } : {}), fresh: false };
  } else if (D.dur === "once") fx[id] = { amt: 1, turns: null };
  else if (cur) cur.turns = Math.max(cur.turns ?? 0, turns ?? 0); else fx[id] = { turns, fresh: false, amt: 1 };
  return true;
}
const turnsOf = (id, kind, star) => (kind === "turn" ? modAmt("turn", star) : Array.isArray(EFFECTS[id]?.base) ? EFFECTS[id].base[1] : EFFECTS[id]?.base ?? null);
function modGive(S, U, M, ev, why) {
  for (const [id, kind] of M.fx) {
    let a = modAmt(kind, M.star);
    if (kind === "shield") a = Math.round(((U.maxHp ?? U.c?.stats?.hp ?? 0) * a) / 100);
    const src = EFFECTS[id]?.src ? srcOf(S, EFFECTS[id].src) : undefined;
    if (modFx(S, U, id, a, turnsOf(id, kind, M.star), src)) ev.push({ t: "mod", uid: U.uid, mod: M.id, fx: id, amt: kind === "turn" || kind === "once" ? undefined : a, why });
  }
}
// 防衛の はじめ：区画の 住人の バフ・非常用カプセル（★5・防衛 1 回に 1 度 輪廻）
function modInit(S) {
  const ev = (S.modEv = []);
  for (const U of Object.values(S.units).filter((x) => x.side === "res")) {
    const key = keyOfRoom(U.home), B = modAt(S, `blk:${blkOfKey(key)}`), Rm = modAt(S, `room:${key}`);
    if (B && B.to === "res") modGive(S, U, B, ev, "block");
    if (Rm && Rm.when === "init" && (!Rm.star5 || Rm.star >= 5)) modGive(S, U, Rm, ev, "room");
  }
}
// 戦いの はじめ（住人）：部屋の バフ・そばの 廊下の バフ
function modFight(S, U, ev) {
  if (U.side !== "res") return;
  const Rm = modAt(S, `room:${keyOfRoom(U.home)}`);
  if (Rm && !Rm.when) modGive(S, U, Rm, ev, "room");
  if (U.cell && S.map.cells[U.cell]) for (const c of [U.cell, ...S.map.cells[U.cell].nb]) { const M = modAt(S, `cell:${c}`); if (M && M.to === "res") modGive(S, U, M, ev, "cell"); }
}
// 敵が マスに 入った：廊下の デバフ（マスごと 1 回）・区画の デバフ（箱ごと 1 回）
function modStep(S, F, ev) {
  const cell = F.cell; if (!cell) return;
  F.modSeen ||= {};
  const M = modAt(S, `cell:${cell}`);
  if (M && M.to === "foe" && !F.modSeen[`c:${cell}`]) { F.modSeen[`c:${cell}`] = 1; modGive(S, F, M, ev, "cell"); }
  const blk = S.map.cells[cell]?.blk, B = blk && modAt(S, `blk:${blk}`);
  if (B && B.to === "foe" && !F.modSeen[`b:${blk}`]) { F.modSeen[`b:${blk}`] = 1; modGive(S, F, B, ev, "block"); }
}
const alive = (U) => !U.dead && (U.hp == null || U.hp > 0);
const at = (S, cell) => Object.values(S.units).find((U) => U.cell === cell && !U.dead && !(U.side === "foe" && U.gone)) || null;
const maxHpOf = (U) => U.maxHp ?? null;
const agiOf = (U) => U.c.stats?.agi ?? 0;

export function tdOrder(S, uid, order) {
  const U = S.units[uid]; if (!U || U.side !== "res" || U.dead || U.rest || U.helper) return false;   // 手伝いの 子は 自動
  U.order = { ...order };
  U.ambush = order.do === "ambush" ? !!S.map.cells[U.cell]?.room : order.do === "wait" ? U.ambush : false;   // 待ち伏せは 部屋の 中で
  U.block = order.do === "skill" && U.type === "defender";
  return true;
}

// 住人を to へ 向けて n 歩（ふさがって いる マスは 通らない。敵の となりで 止まる）
function walk(S, U, to, n) {
  for (let k = 0; k < n; k++) {
    if (U.cell === to) return;
    const d = bfs(S.map, to, (y) => y === U.cell || !at(S, y));
    const next = S.map.cells[U.cell].nb.filter((y) => d[y] != null && d[y] < (d[U.cell] ?? Infinity) && !at(S, y)).sort((a, b) => d[a] - d[b])[0];
    if (!next) return;
    U.cell = next;
    if (S.map.cells[next].nb.some((y) => at(S, y)?.side === "foe")) return;   // 敵の となりに 来たら 止まる（戦いは 敵の 番で）
  }
}
const nearestFoe = (S, U) => { const d = bfs(S.map, U.cell); return Object.values(S.units).filter((F) => F.side === "foe" && F.cell && alive(F)).sort((a, b) => (d[a.cell] ?? 1e9) - (d[b.cell] ?? 1e9))[0] || null; };

function newBattle(S, res, foe, ev) {
  const B = { id: S.nextB++, res: [res.uid], foe: [foe.uid] };
  res.battle = foe.battle = B.id; S.battles.push(B);
  ev.push({ t: "start", b: B.id, res: res.uid, foe: foe.uid, ...(res.charge ? { charge: true } : {}) });
  modFight(S, res, ev);
  return B;
}
const joinB = (S, B, U, ev) => { const k = U.side === "foe" ? "foe" : "res"; if (B[k].length >= FIGHT.side) return false; B[k].push(U.uid); U.battle = B.id; ev.push({ t: "join", b: B.id, uid: U.uid, ...(U.charge ? { charge: true } : {}) }); modFight(S, U, ev); return true; };

// 1 手：battle-sim を 1 ターンだけ 回して 持ちこす
function round(S, B, ev) {
  const R = B.res.map((u) => S.units[u]), F = B.foe.map((u) => S.units[u]);
  const cfg = (U) => {
    const fx = { ...U.fx };
    if (U.charge) fx.charge = { amt: 1, turns: null };
    if (U.side === "foe" && U.slow > 0) fx.fatigue = { turns: U.slow, fresh: false };
    const stats = U.block ? { ...U.c.stats, def: Math.round((U.c.stats.def || 0) * FIGHT.blockDef) } : U.c.stats;
    return { ...U.c, stats, startHp: U.hp ?? undefined, startMp: U.mp ?? undefined, startFx: fx, cont: !U.fresh };
  };
  const evs = simulateTeams(R.map(cfg), F.map(cfg), (S.seed * 7919 + S.turn * 131 + B.id) >>> 0, { until: 1, pve: true, keepPerm: true });
  const st = evs[0], end = evs[evs.length - 1], all = [...R, ...F];
  all.forEach((U, i) => { U.hp = end.final[i].hp; U.mp = end.final[i].mp; U.fx = end.carry[i] || {}; U.maxHp = st.fighters[i].maxHp; U.fresh = false; U.charge = false; });
  ev.push({ t: "round", b: B.id, acts: evs.filter((e) => e.type === "act"), fighters: st.fighters, now: end.final, res: [...B.res], foe: [...B.foe] });
}

// 戦いの 終わり：どちらかが みんな 力つきた（か 住人が いなく なった）
function settle(S, B, ev) {
  const R = B.res.map((u) => S.units[u]), F = B.foe.map((u) => S.units[u]);
  const resUp = R.some(alive), foeUp = F.some(alive);
  if (resUp && foeUp) return false;
  for (const U of R) {
    U.battle = null;
    if (U.side === "pet") { if (!alive(U)) { S.over = "lose"; ev.push({ t: "lose", b: B.id }); } continue; }
    if (!alive(U) && U.helper) { U.rest = true; U.cell = null; ev.push({ t: "helpOut", uid: U.uid }); }   // 手伝いの 子は 殺されない（自分の 建物へ 帰る）
    else if (!alive(U)) { U.dead = true; U.cell = null; S.dead.push(U.uid); ev.push({ t: "dead", uid: U.uid }); }   // 起こされない まま 終わった
    else if (!foeUp) { U.cell = U.home ?? U.cell; ev.push({ t: "home", uid: U.uid }); }                       // 勝った 住人は 部屋へ もどる（手伝いの 子は その 場で 待つ）
  }
  for (const U of F) {
    U.battle = null;
    if (!alive(U)) { U.gone = true; U.cell = null; S.beaten.push(U.uid); ev.push({ t: "beaten", uid: U.uid }); }
  }
  S.battles = S.battles.filter((x) => x !== B);
  ev.push({ t: "end", b: B.id, win: foeUp ? "foe" : "res" });
  return true;
}

export function tdTurn(S) {
  if (S.over) return [];
  S.turn += 1;
  const ev = S.modEv && S.modEv.length ? S.modEv.splice(0) : [], U0 = Object.values(S.units), cells = S.map.cells;
  // 1. 住人の 指示
  for (const U of U0.filter((x) => x.side === "res" && !x.dead && !x.rest)) {
    if (U.helper) { autoHelp(S, U, ev); continue; }
    const o = U.order || { do: "wait" };
    if (U.battle) {
      if (o.do !== "retreat" || !alive(U)) continue;   // 〔決〕倒れた 子は 退避できない（2026-11-16 鹿さんの カード。起こされるのを 待つ）
      const B = S.battles.find((x) => x.id === U.battle), foeAgi = Math.max(0, ...B.foe.map((u) => S.units[u]).filter(alive).map(agiOf));
      const p = retreatOdds(agiOf(U), foeAgi), ok = S.R() < p;
      ev.push({ t: "retreat", uid: U.uid, ok, p: Math.round(p * 100) });
      if (ok) { B.res = B.res.filter((u) => u !== U.uid); U.battle = null; U.cell = U.home; U.rest = true; U.order = { do: "wait" }; if (!B.res.length) settleEmpty(S, B, ev); }
      continue;
    }
    if (o.do === "go" || (o.do === "skill" && U.type === "attacker")) { const F = nearestFoe(S, U); if (F) walk(S, U, F.cell, o.do === "skill" ? FIGHT.rush : 1); }
    else if (o.do === "move" && o.to && cells[o.to]) walk(S, U, o.to, 1);
    else if (o.do === "skill" && U.type === "defender" && o.to && cells[o.to]) walk(S, U, o.to, 1);
    else if (o.do === "skill" && U.type === "technician") {
      const F = S.units[o.tgt]; if (F && F.side === "foe" && alive(F) && F.cell && cells[U.cell].nb.includes(F.cell)) { F.slow = FIGHT.slowTurns; ev.push({ t: "slow", uid: U.uid, tgt: F.uid }); }
    } else if (o.do === "skill" && U.type === "healer") {
      const T = S.units[o.tgt];
      if (T && T.side !== "foe" && !alive(T) && !T.dead && T.battle && T.cell && distOf(S.map, U.cell, T.cell) <= 2 && T.uid !== U.uid) {   // 〔決〕起こす：戦いの 中で 倒れた 子を HP 3 割で（研究ノート 21 回目「戦いの中なら起こせる」。2026-11-16 に 入れた）
        const mx = maxHpOf(T) ?? T.c.stats?.hp ?? 0; T.hp = Math.max(1, Math.round(mx * FIGHT.revivePct)); ev.push({ t: "revive", uid: U.uid, tgt: T.uid, amt: T.hp });
      } else if (T && T.side !== "foe" && alive(T) && T.cell && distOf(S.map, U.cell, T.cell) <= 2 && T.uid !== U.uid) {
        const mx = maxHpOf(T) ?? T.c.stats?.hp ?? 0, before = T.hp ?? mx;
        T.hp = Math.min(mx, before + Math.round(mx * FIGHT.healPct)); ev.push({ t: "heal", uid: U.uid, tgt: T.uid, amt: T.hp - before });
      }
    }
  }
  // 2. 敵が 入口から 入る（every ターンに 1 体）
  if ((S.turn - 1) % FOE.every === 0 && S.queue.length && !at(S, S.map.entrance)) { const F = S.queue.shift(); F.cell = S.map.entrance; F.born = S.turn; S.units[F.uid] = F; ev.push({ t: "spawn", uid: F.uid }); modStep(S, F, ev); }
  // 3. 敵が 1 歩（足止めの あいだは 2 ターンに 1 歩）。次の マスに 住人・ペットが いれば 戦い
  for (const F of Object.values(S.units).filter((x) => x.side === "foe" && x.cell && alive(x) && !x.battle && x.born !== S.turn)) {   // 入った ターンは 歩かない
    const slowNow = F.slow > 0; if (F.slow > 0) F.slow -= 1;
    if (slowNow && S.turn % 2 === 0) continue;
    const here = S.toLounge[F.cell] ?? Infinity;
    const steps = cells[F.cell].nb.filter((y) => (S.toLounge[y] ?? Infinity) < here);
    const block = steps.map((y) => at(S, y)).find((x) => x && x.side !== "foe" && alive(x) && !x.battle && !x.rest);
    if (block) { newBattle(S, block, F, ev); continue; }
    const free = steps.find((y) => !at(S, y));
    if (free) { F.cell = free; ev.push({ t: "move", uid: F.uid, to: free }); modStep(S, F, ev); }
  }
  // 4. 待ち伏せ：部屋の となりの マスに 来た 敵に 奇襲（チャージ）
  for (const U of Object.values(S.units).filter((x) => x.side === "res" && x.ambush && alive(x) && !x.battle && !x.rest && x.cell)) {
    const F = cells[U.cell].nb.map((y) => at(S, y)).find((x) => x && x.side === "foe" && alive(x) && !x.battle);
    if (F) { U.charge = true; U.ambush = false; const Lk = modAt(S, `room:${keyOfRoom(U.home)}`); if (Lk && Lk.when === "ambush") modGive(S, U, Lk, ev, "ambush"); newBattle(S, U, F, ev); }
  }
  // 5. 加勢：戦って いる 敵の 上下左右の 住人（待ち伏せは チャージ・キャスターは 2 マス 先から も）／戦って いる 住人の 上下左右の 敵
  for (const B of S.battles) {
    for (const fu of [...B.foe]) {
      const F = S.units[fu];
      for (const y of cells[F.cell].nb) { const U = at(S, y); if (U && U.side === "res" && alive(U) && !U.battle && !U.rest) { if (U.ambush) { U.charge = true; U.ambush = false; } joinB(S, B, U, ev); } }
      for (const U of Object.values(S.units).filter((x) => x.side === "res" && x.type === "caster" && x.order?.do === "skill" && alive(x) && !x.battle && !x.rest && x.cell))
        if (distOf(S.map, U.cell, F.cell) <= FIGHT.reach) joinB(S, B, U, ev);
    }
    for (const ru of [...B.res]) {
      const U = S.units[ru]; if (!U.cell) continue;
      for (const y of cells[U.cell].nb) { const F = at(S, y); if (F && F.side === "foe" && alive(F) && !F.battle) joinB(S, B, F, ev); }
    }
  }
  // 6. どの 戦いも 1 手
  for (const B of [...S.battles]) { round(S, B, ev); settle(S, B, ev); if (S.over) return ev; }
  // 7. 勝ち：来る 敵が もう いない
  if (!S.queue.length && !Object.values(S.units).some((x) => x.side === "foe" && !x.gone && alive(x))) { S.over = "win"; ev.push({ t: "win" }); }
  return ev;
}
// 手伝いの 子の 自動行動（〔決〕2026-11-16）：戦いの 中で HP 3 割を 切ると 引き上げる。戦って いない ときは 型の 得意な 動き、ほかは 立つ マスで 待つ
function autoHelp(S, U, ev) {
  const cells = S.map.cells;
  if (U.battle) {
    const mx = maxHpOf(U); if (!(mx && U.hp != null && U.hp / mx < HELP.backAt)) return;
    const B = S.battles.find((x) => x.id === U.battle); B.res = B.res.filter((u) => u !== U.uid);
    U.battle = null; U.cell = null; U.rest = true; ev.push({ t: "helpBack", uid: U.uid });
    if (!B.res.length) settleEmpty(S, B, ev);
    return;
  }
  if (!U.cell) return;
  if (U.type === "defender") { U.block = true; return; }   // ふさぐ
  if (U.type === "technician") { const F = cells[U.cell].nb.map((y) => at(S, y)).find((x) => x && x.side === "foe" && alive(x) && !(x.slow > 0)); if (F) { F.slow = FIGHT.slowTurns; ev.push({ t: "slow", uid: U.uid, tgt: F.uid }); } return; }
  if (U.type === "healer") {   // いちばん 減って いる 味方（2 マス 以内）
    const T = Object.values(S.units).filter((x) => x.side !== "foe" && x.uid !== U.uid && alive(x) && x.cell && x.hp != null && maxHpOf(x) && x.hp < maxHpOf(x) && distOf(S.map, U.cell, x.cell) <= 2).sort((a, b) => a.hp / maxHpOf(a) - b.hp / maxHpOf(b))[0];
    if (T) { const mx = maxHpOf(T), before = T.hp; T.hp = Math.min(mx, before + Math.round(mx * FIGHT.healPct)); ev.push({ t: "heal", uid: U.uid, tgt: T.uid, amt: T.hp - before }); }
    return;
  }
  if (U.type === "attacker") { const F = nearestFoe(S, U); if (F && distOf(S.map, U.cell, F.cell) <= HELP.rushNear) walk(S, U, F.cell, FIGHT.rush); return; }   // 突撃
  if (U.type === "caster") U.order = { do: "skill" };   // 遠くから（2 マス 先の 戦いに 加わる）
}
// 〔決〕自動（2026-11-16 カード「この形でよい」）：その ターンの 住人の 指示を 型ごとの 得意な 動きで 入れる（tdTurn の 前に 呼ぶ。マニュアルに 戻せば 呼ばない）
//   アタッカー＝近い 敵へ 出撃・ディフェンダー＝ドアの 前で ふさぐ・キャスター＝2 マス 先から 加勢・ヒーラー＝倒れた 子を 起こし 弱った 子を 回復・テクニシャン＝足止め・HP 3 割を 切ると 退避
export function tdAuto(S) {
  const cells = S.map.cells, hpOf = (x) => { const mx = maxHpOf(x); return mx && x.hp != null ? x.hp / mx : 1; };
  for (const U of Object.values(S.units).filter((x) => x.side === "res" && !x.helper && !x.dead && !x.rest)) {
    const low = alive(U) && hpOf(U) < AUTO.retreatAt;   // 倒れた 子は 退避の 指示を 出さない（待つ）
    if (U.battle) { tdOrder(S, U.uid, low ? { do: "retreat" } : { do: "wait" }); continue; }
    if (low || !U.cell) { tdOrder(S, U.uid, { do: "wait" }); continue; }
    const F = nearestFoe(S, U);
    if (U.type === "healer") {
      const near = (x) => x.cell && distOf(S.map, U.cell, x.cell) <= 2;
      const down = Object.values(S.units).find((x) => x.side !== "foe" && x.uid !== U.uid && !alive(x) && !x.dead && x.battle && near(x));
      const weak = Object.values(S.units).filter((x) => x.side !== "foe" && x.uid !== U.uid && alive(x) && near(x) && hpOf(x) < AUTO.healBelow).sort((a, b) => hpOf(a) - hpOf(b))[0];
      const T = down || weak;
      if (T) tdOrder(S, U.uid, { do: "skill", tgt: T.uid });
      else { const fight = Object.values(S.units).filter((x) => x.side !== "foe" && x.uid !== U.uid && x.battle && x.cell).sort((a, b) => distOf(S.map, U.cell, a.cell) - distOf(S.map, U.cell, b.cell))[0];
        tdOrder(S, U.uid, fight ? { do: "move", to: fight.cell } : { do: "wait" }); }
      continue;
    }
    if (U.type === "defender") { const door = cells[U.home]?.nb?.find((y) => !cells[y]?.room) ?? U.cell; tdOrder(S, U.uid, { do: "skill", to: door }); continue; }
    if (U.type === "technician") { const A = cells[U.cell].nb.map((y) => at(S, y)).find((x) => x && x.side === "foe" && alive(x) && !(x.slow > 0)); tdOrder(S, U.uid, A ? { do: "skill", tgt: A.uid } : F ? { do: "go" } : { do: "wait" }); continue; }
    if (U.type === "caster") { const inReach = S.battles.some((B) => B.foe.some((u) => { const x = S.units[u]; return x.cell && distOf(S.map, U.cell, x.cell) <= FIGHT.reach; })); tdOrder(S, U.uid, inReach ? { do: "skill" } : F ? { do: "go" } : { do: "wait" }); continue; }
    tdOrder(S, U.uid, F ? { do: "go" } : { do: "wait" });   // アタッカー（と 型の ない 子）
  }
}
// 住人が みんな 退避して いなく なった 戦い：敵は また 歩きだす
function settleEmpty(S, B, ev) { for (const u of B.foe) S.units[u].battle = null; S.battles = S.battles.filter((x) => x !== B); ev.push({ t: "end", b: B.id, win: "foe", empty: true }); }

export { rewardOf } from "./td-numbers.js";   // 防衛の 報酬
