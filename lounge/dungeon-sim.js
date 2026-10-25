// ダンジョン（VR ゲーム）の計算（試作）。runDungeon(パーティ, 行き先, 時間, 種, { purpose, target, progress }) が、探索の流れ・戦い・宝箱・日記のもとを返す。同じ種なら同じ結果
// 門番は tripInit・tripStep・tripResult で 少しずつ 計算する（下の「1 回の 派遣」）
// 探索（鹿さんの参考ゲーム「魔界派遣ヴェルヴェット」と同じ。鹿さんの決め、2026-10-22）：1 つの行き先は 5 階。1 歩ずつ地図を歩き、まわり 1 マスが見えて探索率が上がる（progress に残る）
// 歩くと、ときどき敵と出会う（1〜3 体）。HP が減ったら休憩して回復する（鹿さんの決め、2026-10-22）。倒れた子は帰るまで戦えない。全員倒れたら、力つきて帰ってくる（失敗ではない）
// 目的：探索（見ていないマスをうめて下へ）・ボス優先（一番深い階からボスの部屋へ）・採取優先・指定の敵だけ。時間（1・3・10 分）が来たら帰る
// パーティはペット＋懐柔した子 2 体まで（ペットだけでもいい）。状態（バフ・デバフ）は帰るまで持ちこす。ボスには凍結・眠り・気絶が効かない
// 勝った敵は 1 体ずつ、一定の確率で捕まえる（研究するとサブツリー、懐柔するとパーティに入れられる）。戦いに勝つと、ときどき懐柔のおやつを拾う
import { simulateTeams, rngIn, vitalsOf } from "./battle-sim.js";
import { petAt } from "./builds.js";
import { OPS } from "./equip.js";
import { DUNGEONS, RUNS, RARE_RATE, CAPTURE, GROUP, SNACK_DROP, TICK, ENCOUNTER, REST, TRAP, FLOOR_LV, BATTLE_TICKS, PURPOSES, CHEST_STAR, BOSS_STAR, MYTHIC, BOSS_RESOURCE, EXP_PER_LV, CREDIT, TOOLS, LURE_SHARE, NET_MULT } from "./dungeons.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { floorMap, reachOf, exploredRatio, keyOf, DIRS, GW, GH, FLOORS, T, isPass } from "./floors.js";
import { GATHER, ENEMY_MAT, GATHER_N, floorMats, ENEMY_DROP, QUALITY } from "./materials.js";

// Lv のステータス（職業の重みで伸びる分 ＋ 職業ツリーの能力ノード）。trees.js と builds.js
export const statsAt = (type, lv) => petAt(type, lv).stats;
// 敵：自分のツリーを自動で振った同じ Lv のペット。弱めない（鹿さんの決め）。ツリーのパッシブも効く。pow は試しの計算で強さを変えるときだけ使う
// SP の上乗せ：Lv が低い敵も 50 SP までは持つ（テーマの技を 2 つ覚えるように）。ボスはいつも +40
export const rankOf = (f) => ENEMY_TREES[f.tree].rank;
export const enemySp = (f) => (rankOf(f) === "ボス" ? 40 : Math.max(0, 50 - 10 * (f.lv - 1)));
// 同じ 敵は 1 回だけ 作って おぼえる（派遣の 計算が 軽く なる。返した 物は だれも かえない）
const FOES = new Map();
export const foeOf = (f, pow = 1) => {
  const key = pow === 1 ? `${f.tree}|${f.type}|${f.lv}|${f.name}` : "", hit = key && FOES.get(key);
  if (hit) return hit;
  const p = petAt(f.type, f.lv, { main: f.tree, bonusSp: enemySp(f) }), st = { ...p.stats }; for (const k in st) st[k] = Math.round(st[k] * pow);
  const out = { ...p, name: f.name, owner: "VR", lv: f.lv, stats: st, species: null };
  if (key) { if (FOES.size >= 2000) FOES.clear(); FOES.set(key, out); }
  return out;
};
// 懐柔した子：捕まえた敵のタイプの伸び方 ＋ 自分のツリー（敵のときの SP の上乗せはない）。アクセサリーも付けられる
export const tamedOf = (f, lv = f.lv, equip = [], pow = 1) => { const p = petAt(f.type, lv, { main: f.tree }), st = { ...p.stats }; for (const k in st) st[k] = Math.round(st[k] * pow); return { ...p, name: f.name, owner: "VR", lv, stats: st, species: null, equip, tree: f.tree }; };

const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
function rollItem(R, d, star) {
  const base = d.drops[Math.floor(R() * d.drops.length)];
  const pool = Object.keys(OPS).filter((k) => (OPS[k].from || 1) <= star), ops = [];
  while (ops.length < star && pool.length) ops.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return { base, star, ops };
}

// ---------- 探索の進み（行き先ごと。サイトに残す） ----------
// floors[階] = { seen: [見たマス], hidden: かくし通路が開いたか }、maxFloor = 行ったことのある一番深い階、bossKills = ボスをたおした回数
export const newProgress = () => ({ floors: {}, maxFloor: 1, bossKills: 0 });
export const floorRatio = (did, prog, n) => (prog.floors[n] ? exploredRatio(did, n, prog.floors[n].seen) : 0);
// 行き先ぜんたいの探索率：5 階の平均（行っていない階は 0%）
export const dungeonRatio = (did, prog) => Array.from({ length: FLOORS }, (_, i) => floorRatio(did, prog, i + 1)).reduce((a, b) => a + b, 0) / FLOORS;
const hiddenLeft = (did, prog, n) => { const f = prog.floors[n], m = floorMap(did, n); return !!f?.hidden && m.hidden.some(([x, y]) => !f.seen.includes(keyOf(x, y))); };
// 出発する階：探索は まだ 100% でない（かくし通路が のこる）一番浅い階から。行った 階が ぜんぶ 100% なら、つぎの 階へ 直行（鹿さんの決め、2026-10-25）
// ほかの目的は、行ったことのある一番深い階から。準備の 画面の「N 階から」も これ
export function startFloor(did, prog, purpose) {
  if (purpose !== "explore") return prog.maxFloor;
  for (let n = 1; n <= prog.maxFloor; n++) if (floorRatio(did, prog, n) < 1 || hiddenLeft(did, prog, n)) return n;
  return Math.min(FLOORS, prog.maxFloor + 1);
}
// 出発に えらべる 階は 1 〜 これ（行った ことの ある 階。そこまで ぜんぶ 100% なら つぎの 階も。鹿さんの決め、2026-10-25）
export const floorsOpen = (did, prog) => Math.min(FLOORS, Math.max(prog.maxFloor, startFloor(did, prog, "explore")));

// ---------- 1 回の 派遣 ----------
// runDungeon は 1 回で 終わりまで 計算する。門番は tripInit → tripStep（戦い 数回ずつ）→ tripResult で 少しずつ 計算する（Cloudflare の 無料の プランは 1 回 10 ミリ秒まで）
// とちゅうの S は JSON に できる（しまって、つぎの 呼び出しで 続きから）。同じ 種なら、分けても 分けなくても 同じ 結果
// opts.lite：門番の 計算。足あと・できごとの 文・戦いの ようすを 作らない（ほかは 同じ。歩いた 時間は ticks）
export function runDungeon(party, dungeonId, runKey, seed, opts = {}) {
  const S = tripInit(party, dungeonId, runKey, seed, opts);
  tripStep(S);
  return tripResult(S);
}
// opts.floor：出発する 階（えらべない 階なら ふつうの 決め方。0・なしも ふつう）
export function tripInit(party, dungeonId, runKey, seed, opts = {}) {
  const d = DUNGEONS.find((x) => x.id === dungeonId), purpose = PURPOSES[opts.purpose] ? opts.purpose : "explore", tool = TOOLS[opts.tool] ? opts.tool : null;
  const pick = () => Math.max(0, [...d.foes, d.rare].findIndex((f) => f.tree === opts.target));   // えらんだ 敵（いなければ 1 体目）。S には 番号で しまう
  const prog = JSON.parse(JSON.stringify(opts.progress || newProgress()));
  const S = {
    lite: !!opts.lite, did: dungeonId, runKey, purpose, tool, fl: Number.isInteger(opts.floor) && opts.floor >= 1 && opts.floor <= floorsOpen(dungeonId, prog) ? opts.floor : 0, ti: purpose === "target" ? pick() : -1, li: tool === "lure" ? pick() : -1,
    r: { R: seed * 2654435761 >>> 0, C: seed * 40503 + 7 >>> 0, M: seed * 69069 + 13 >>> 0 },   // C は希少な敵・捕獲・おやつ、M は素材（ほかの結果が変わらないように）
    prog, before: Array.from({ length: FLOORS }, (_, i) => floorRatio(dungeonId, prog, i + 1)), budget: Math.round(RUNS[runKey].sec / TICK),
    team: (Array.isArray(party) ? party : [party]).map((c) => { const v = vitalsOf(c); return { c, maxHp: v.maxHp, maxMp: v.maxMp, hp: v.maxHp, mp: v.maxMp, down: false }; }),
    nt: 0, track: [], log: [], battles: [], captured: [], chests: [], gathered: [], drops: [], mats: [],
    tick: 0, floor: 0, pos: null, prev: null, seen: [], done: [], hiddenOpen: false, resting: false, status: "run", reason: null, fin: false,
    snacks: 0, exp: 0, credits: 0, kills: 0, wins: 0, rests: 0, traps: 0, steps: 0, bossDone: false, mythic: false, resource: 0, toolUsed: false, start: 1,
  };
  machine(S).begin();
  return S;
}
// 戦いを max 回 したら 止める。終わったら true
export function tripStep(S, max = Infinity) { if (!S.fin) machine(S).run(max); return S.fin; }
export function tripResult(S) {
  const d = DUNGEONS.find((x) => x.id === S.did), after = Array.from({ length: FLOORS }, (_, i) => floorRatio(S.did, S.prog, i + 1));
  const materials = S.mats.map(([, m]) => m).sort((a, b) => (a.q ? 1 : 0) - (b.q ? 1 : 0) || b.q - a.q || b.n - a.n);
  return { dungeon: d, run: RUNS[S.runKey], purpose: S.purpose, target: S.ti >= 0 ? [...d.foes, d.rare][S.ti] : null, tool: S.tool, toolUsed: S.toolUsed, battles: S.battles, wins: S.wins, kills: S.kills,
    cleared: S.reason !== "wipe", reason: S.reason, bossDefeated: S.bossDone, drops: S.drops, chests: S.chests, mythic: S.mythic ? d.mythic : null, resource: S.resource, exp: Math.max(1, Math.round(S.exp)), credits: S.credits,
    captured: S.captured, snacks: S.snacks, materials, gathered: S.gathered, traps: S.traps, rests: S.rests, steps: S.steps, startFloor: S.start, endFloor: S.floor, before: S.before, after, progress: S.prog,
    track: S.track, log: S.log, budget: S.budget, ticks: Math.min(S.budget, S.nt), down: S.team.filter((m) => m.down).map((m) => m.c.name) };
}

// S を 動かす（地図・見た マスの 集まりは S から 作りなおし、止める ときに S へ もどす）
const PRV = new Int16Array(GW * GH), QUE = new Int16Array(GW * GH);   // 道さがしの 入れ物（使いまわす）
function machine(S) {
  const d = DUNGEONS.find((x) => x.id === S.did), dungeonId = S.did, purpose = S.purpose, P = PURPOSES[purpose], tool = S.tool, team = S.team, prog = S.prog;
  const target = S.ti >= 0 ? [...d.foes, d.rare][S.ti] : null, lureFoe = S.li >= 0 ? [...d.foes, d.rare][S.li] : null;   // 持っていく 道具（1 つ）：笛は えらんだ敵を よぶ、ネットは 捕まえやすい、お茶は 1 回 全回復
  const R = rngIn(S.r, "R"), C = rngIn(S.r, "C"), M = rngIn(S.r, "M");
  let seen = new Set(S.seen), done = new Set(S.done), map = null, grid = null, reach = null, fought = 0;
  if (S.floor) { map = floorMap(dungeonId, S.floor); grid = map.grid.map((r) => r.slice()); if (S.hiddenOpen) for (const [x, y, t] of map.hidden) grid[y][x] = t; reach = reachOf(grid, map.start); }
  const say = (s, k = "ev") => { if (!S.lite) S.log.push({ t: S.tick, s, k }); };
  // 拾った素材（id と品質ごとにまとめる。採取の素材は品質なし）
  const mats = new Map(S.mats), addMat = ([id, name], q = 0) => { const k = `${id}:${q}`; const m = mats.get(k) || { id, name, q, n: 0 }; m.n++; mats.set(k, m); return m; };
  const pack = () => { S.seen = [...seen]; S.done = [...done]; S.mats = [...mats.entries()]; };
  const alive = () => team.filter((m) => !m.down);
  const hpRate = () => { const a = alive(); return a.reduce((s, m) => s + m.hp, 0) / Math.max(1, a.reduce((s, m) => s + m.maxHp, 0)); };
  const mpRate = () => { const a = alive().filter((m) => m.maxMp > 0); return a.length ? a.reduce((s, m) => s + m.mp, 0) / a.reduce((s, m) => s + m.maxMp, 0) : 1; };
  const snap = (a, b) => { S.nt++; if (!S.lite) S.track.push({ f: S.floor, x: S.pos.x, y: S.pos.y, a, b, hp: team.map((m) => (m.down ? 0 : Math.round((m.hp / m.maxHp) * 100))) }); };
  const persist = () => { if (S.floor) prog.floors[S.floor] = { seen: [...seen], hidden: S.hiddenOpen }; };
  const reveal = () => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = S.pos.x + dx, y = S.pos.y + dy; if (x >= 0 && y >= 0 && x < GW && y < GH) seen.add(keyOf(x, y)); } };
  const ratio = () => { let tot = 0, got = 0; const hid = new Set(map.hidden.map(([x, y]) => keyOf(x, y))); for (const k of reach) if (!hid.has(k)) { tot++; if (seen.has(k)) got++; } return tot ? got / tot : 1; };
  const openHidden = (loud) => { S.hiddenOpen = true; for (const [x, y, t] of map.hidden) grid[y][x] = t; reach = reachOf(grid, map.start); if (loud) say("かべの むこうに かくし通路を 見つけた！"); };
  const checkHidden = () => { if (!S.hiddenOpen && map.hidden.length && ratio() >= 1) { openHidden(true); persist(); } };
  function load(n) {
    persist(); S.floor = n; map = floorMap(dungeonId, n); grid = map.grid.map((r) => r.slice());
    seen = new Set(prog.floors[n]?.seen || []); S.hiddenOpen = false; reach = reachOf(grid, map.start);
    if (prog.floors[n]?.hidden) openHidden(false);
    S.pos = { ...map.start }; S.prev = null; done = new Set();
    prog.maxFloor = Math.max(prog.maxFloor, n); reveal(); persist(); say(`${n} 階に 着いた`, "sys"); checkHidden();
  }
  // 歩けるか（指定の敵だけのときは、ボスの部屋に入らない）
  const canStep = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && isPass(grid[y][x]) && !(purpose === "target" && grid[y][x] === T.BOSS);
  // いちばん 近い goal の マスへ 向かう 1 歩め（近い じゅんに さがす。同じ 近さなら DIRS の じゅん）
  function bfs(goal) {
    const from = keyOf(S.pos.x, S.pos.y); let h = 0, n = 1;
    PRV.fill(-1); PRV[from] = from; QUE[0] = from;
    while (h < n) {
      const ck = QUE[h++], cx = ck % GW, cy = (ck - cx) / GW;
      if (ck !== from && goal(grid[cy][cx], ck)) { let cur = ck; while (PRV[cur] !== from) cur = PRV[cur]; return { x: cur % GW, y: (cur - (cur % GW)) / GW }; }
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (!canStep(nx, ny)) continue; const k = keyOf(nx, ny); if (PRV[k] === -1) { PRV[k] = ck; QUE[n++] = k; } }
    }
    return null;
  }
  function randomStep() {
    let c = DIRS.map(([dx, dy]) => ({ x: S.pos.x + dx, y: S.pos.y + dy })).filter((p) => canStep(p.x, p.y));
    if (S.prev && c.length > 1 && R() < 0.7) c = c.filter((p) => p.x !== S.prev.x || p.y !== S.prev.y);
    return c.length ? c[Math.floor(R() * c.length)] : null;
  }
  // 次の 1 歩。目的を果たしたら null（帰る）。指定の敵だけのときは、時間まで歩きまわって探す
  function next() {
    const here = grid[S.pos.y][S.pos.x];
    if (purpose === "boss") {
      if (S.bossDone) return null;
      if (S.floor < FLOORS) return here === T.STAIRS ? "down" : bfs((t) => t === T.STAIRS);
      return bfs((t) => t === T.BOSS);
    }
    if (purpose === "gather") { const p = bfs((t, k) => t === T.GATHER && !done.has(k)); if (p) return p; say("採取ポイントを 回りおえた", "sys"); return null; }
    // 見ていないマスと、見つけたのにまだ開けていない宝箱・採取ポイントへ
    const p = bfs((t, k) => (reach.has(k) && !seen.has(k)) || ((t === T.CHEST || t === T.GATHER) && !done.has(k)));
    if (p) return p;
    if (purpose === "explore") return S.floor < FLOORS ? (here === T.STAIRS ? "down" : bfs((t) => t === T.STAIRS)) : null;
    return randomStep();
  }
  const lvUp = (f) => ({ ...f, lv: Math.max(1, f.lv + FLOOR_LV(S.floor)) });
  function group() {
    if (target) return Array.from({ length: target === d.rare ? 1 : pickW(R, GROUP) }, () => lvUp(target));
    if (lureFoe && C() < LURE_SHARE[rankOf(lureFoe)]) { S.toolUsed = true; return Array.from({ length: lureFoe === d.rare ? 1 : pickW(R, GROUP) }, () => lvUp(lureFoe)); }
    return Array.from({ length: pickW(R, GROUP) }, () => lvUp(d.rare && C() < RARE_RATE ? d.rare : d.foes[Math.floor(R() * d.foes.length)]));
  }
  function fight(g, boss) {
    fought++;
    const up = alive(), me = up.map((m) => ({ ...m.c, startHp: m.hp, startMp: m.mp, startFx: m.fx })), foes = g.map((f, k) => ({ ...foeOf(f), boss: boss && k === 0 }));
    const ev = simulateTeams(me, foes, Math.floor(R() * 1e9), { pve: true, quiet: S.lite }), end = ev.at(-1), win = end.winner === 0, cost = BATTLE_TICKS(end.turns || 1);
    up.forEach((m, k) => { m.hp = Math.max(0, end.final[k].hp); m.mp = end.final[k].mp; m.fx = end.carry[k]; if (m.hp <= 0 || !win) m.down = true; });
    const b = S.battles.length, kill = win ? null : g.map((f, k) => k).filter((k) => end.final[up.length + k].hp <= 0);   // 負けた 戦いで たおせた 敵（何番め）
    S.battles.push({ foe: g[0], foes: g, boss, win, ...(kill ? { kill } : {}), ...(S.lite ? {} : { ev }), party: up.map((m) => m.c.name), floor: S.floor, tick: S.tick, cost });
    say(`${boss ? "ボスの " : ""}${g[0].name}${g.length > 1 ? ` たち（${g.length} たい）` : ""}と 戦った。${win ? "勝った！" : kill.length ? `${kill.length} たい たおしたが、力つきた……` : "力つきた……"}`, "btl");
    for (let i = 0; i < cost; i++) { snap("b", b); S.tick++; }
    const lvOf = (list) => list.reduce((s, f) => s + f.lv, 0);
    // 敵の素材：深い階ほど品質が高い（希少な敵 ＋1、ボスはいつも 5 を 2 こ）
    const dropMats = (ks) => { for (const k of ks) { const f = g[k], rk = boss && k === 0 ? "ボス" : rankOf(f); if (M() >= ENEMY_DROP[rk]) continue;
      const q = rk === "ボス" ? 5 : Math.min(5, pickW(M, QUALITY[S.floor]) + (rk === "希少" ? 1 : 0)); for (let i = 0; i < (rk === "ボス" ? 2 : 1); i++) addMat(ENEMY_MAT[f.tree], q); } };
    // 負けても、たおせた 敵は 勝った ときと 同じ（経験値・クレジット・素材）、たおせなかった 敵は 経験値の 半分（鹿さんの決め、2026-10-25）
    // 捕まえる・おやつ・ボスの ごほうびは 勝った ときだけ
    if (!win) { const beat = kill.map((k) => g[k]), left = g.filter((f, k) => !kill.includes(k)); S.kills += beat.length; S.exp += (lvOf(beat) + lvOf(left) / 2) * EXP_PER_LV; S.credits += lvOf(beat) * CREDIT.perLv; dropMats(kill); }
    if (!win && tool === "tea" && !S.toolUsed) { S.toolUsed = true; for (const m of team) { m.hp = m.maxHp; m.mp = m.maxMp; m.fx = undefined; m.down = false; } say("力つきそうに なった。元気のお茶を のんで 立ちあがった", "sys"); return; }
    if (!win) { S.status = "end"; S.reason = "wipe"; return; }
    S.wins++; S.kills += g.length; S.exp += lvOf(g) * EXP_PER_LV; S.credits += lvOf(g) * CREDIT.perLv;
    for (const f of g) if (C() < CAPTURE[rankOf(f)] * (tool === "net" ? NET_MULT : 1)) { S.captured.push(f); if (tool === "net") S.toolUsed = true; say(`${f.name}を 捕まえた！`); }
    dropMats(g.map((f, k) => k));
    if (C() < SNACK_DROP) { S.snacks++; say("おやつを 拾った", "sys"); }
    if (boss) {
      S.bossDone = true; prog.bossKills++; S.resource += BOSS_RESOURCE; S.credits += CREDIT.boss; const it = rollItem(R, d, pickW(R, BOSS_STAR)); S.drops.push(it); S.chests.push({ ...it, boss: true });
      if (R() < MYTHIC) S.mythic = true;
      say("ボスを たおした！");
    }
  }
  function step(p) {
    S.prev = S.pos; S.pos = p; S.steps++; reveal(); checkHidden();
    const t = grid[p.y][p.x], k = keyOf(p.x, p.y), hid = map.hidden.some(([x, y]) => x === p.x && y === p.y);
    if (t === T.BOSS && !S.bossDone) { fight([d.boss, ...Array.from({ length: pickW(R, GROUP) - 1 }, () => lvUp(d.foes[Math.floor(R() * d.foes.length)]))], true); return; }
    if (t === T.TRAP && !done.has(k)) {
      done.add(k);
      if (R() < TRAP.avoid) say("罠を 見ぬいた", "sys");
      else { S.traps++; for (const m of alive()) { m.hp = Math.max(0, m.hp - Math.max(1, Math.round(m.maxHp * TRAP.dmg))); if (m.hp <= 0) m.down = true; } say("罠に かかった！", "ev"); if (!alive().length) { S.status = "end"; S.reason = "wipe"; return; } }
    } else if (t === T.GATHER && !done.has(k)) {
      done.add(k); const two = floorMats(dungeonId, S.floor), got = hid ? [GATHER[dungeonId].hidden, two[M() < 0.5 ? 0 : 1]] : Array.from({ length: pickW(M, GATHER_N) }, () => two[M() < 0.5 ? 0 : 1]);
      got.forEach((x) => addMat(x)); S.gathered.push({ floor: S.floor, hidden: hid, items: got.map(([, name]) => name) }); say(`${hid ? "かくし通路で " : ""}${got.map(([, name]) => name).join("と ")}を 採取した`, "sys");
    }
    else if (t === T.CHEST && !done.has(k)) { done.add(k); const it = rollItem(R, d, Math.min(5, pickW(R, CHEST_STAR[S.floor]) + (hid ? 1 : 0))); S.drops.push(it); const cr = Math.round((CREDIT.chest[0] + M() * (CREDIT.chest[1] - CREDIT.chest[0])) * S.floor * (hid ? 2 : 1)); S.credits += cr; S.chests.push({ ...it, floor: S.floor, hidden: hid, credits: cr }); say(`${hid ? "かくし通路の " : ""}宝箱を あけた`); }
    if (t !== T.START && t !== T.BOSS) {
      const rate = (t === T.ROOM ? ENCOUNTER.room : ENCOUNTER.path) * (target === d.rare ? P.rareEnc : P.enc);
      if (R() < rate) fight(group(), false);
    }
  }
  function begin() {
    const start = S.fl || startFloor(dungeonId, prog, purpose);
    S.start = start; load(start);
    say(`${team[0].c.name}${team.length > 1 ? `たち ${team.length} 体` : ""}で 出発した。目的：${P.name}${target ? `（${target.name}）` : ""}${tool ? `。${TOOLS[tool].name}を 持っていく` : ""}`);
    pack();
  }
  const going = () => S.tick < S.budget && S.status === "run";
  function run(max) {
    while (going() && fought < max) {
      if (S.resting) {
        for (const m of alive()) { m.hp = Math.min(m.maxHp, m.hp + Math.max(1, Math.round(m.maxHp * REST.hp))); m.mp = Math.min(m.maxMp, m.mp + Math.max(1, Math.round(m.maxMp * REST.mp))); }
        snap("r"); S.tick++;
        if (hpRate() >= REST.until && mpRate() >= REST.until) { S.resting = false; say("休憩を おえた", "sys"); }
        continue;
      }
      if (hpRate() < REST.hpAt || mpRate() < REST.mpAt) { S.resting = true; S.rests++; say("つかれたので 休憩する", "sys"); snap("r"); S.tick++; continue; }
      const nx = next();
      if (nx === "down") { say("階段を おりた", "sys"); load(S.floor + 1); snap("w"); S.tick++; continue; }
      if (!nx) { S.status = "end"; S.reason = "done"; say(purpose === "boss" ? "ボスを たおしたので 帰る" : purpose === "gather" ? "採取を おえて 帰る" : "探索を おえて 帰る"); break; }
      snap("w"); S.tick++; step(nx);
    }
    if (!going()) { if (S.status === "run") S.reason = "time"; persist(); S.fin = true; }
    pack();
  }
  return { begin, run };
}

// ---------- 日記：ペットの口ぐせで、何があったかを書く ----------
const BASE_NAME = { helmet: "工事のヘルメット", knit: "毛糸のぼうし", straw: "麦わら帽子", nabe: "鍋のふた", bowtie: "蝶ネクタイ", omamori: "お守り", bib: "よだれかけ", gold: "金のネックレス", stick: "木の棒", pikopiko: "ピコピコハンマー", mizudeppo: "水鉄砲", kamifusen: "紙ふうせん" };
const DIARY = {
  shika: { win: "ゴーグルを つけた。{d}で ねた。おきたら {n}たい たおしてた。{item}", lose: "ゴーグルを つけた。{d}で ねた。{foe}に まけてた。ねた。" },
  pelican: { win: "{d}へ 配達に 行った。{n}たい たおした。{item}", lose: "{d}で {foe}に つかまった。手紙は ぶじ。" },
  mouse: { win: "ゴーグル ゴーグル。{d} {d}。かった かった。{item}", lose: "{foe} {foe}。まけた まけた。" },
  tv: { win: "むかしの ゲームの方が よかった。{d}は まあまあ。{n}たい たおした。{item}", lose: "{d}は むずかしい。むかしは もっと かんたんだった。" },
  mogura: { win: "{d}の かべを ほった。{foe}が でた。かった。{item}", lose: "{d}で ほったら {foe}の 上に でた。まけた。" },
  kurage: { win: "ゴーグルの中で ゆらゆら。たしか {d}に いた。{item}", lose: "なにかに まけた きがする。ゆらゆら。" },
  saboten: { win: "……。（{d}で {n}かい かった）{item}", lose: "……。（{foe}に まけた）" },
  chokin: { win: "{d}で コインを さがした。{item}", lose: "{d}で {foe}に ふられた。チャリチャリ いった。" },
};
export function diaryOf(species, res) {
  const t = DIARY[species] || DIARY.shika, it = res.drops[0], last = res.battles.at(-1);
  const item = it ? (species === "chokin" ? `${BASE_NAME[it.base]}（★${it.star}）は たべられなかった。` : `${BASE_NAME[it.base]}（★${it.star}）が とどいた。`) : "";
  let s = (res.cleared ? t.win : t.lose).replaceAll("{d}", res.dungeon.name).replaceAll("{n}", res.kills).replaceAll("{foe}", last ? last.foe.name : "なにか").replaceAll("{item}", item);
  if (!res.cleared && it) s += ` ${item}`;
  const gain = Math.round((res.after.reduce((a, b) => a + b, 0) - res.before.reduce((a, b) => a + b, 0)) / res.after.length * 100);
  if (gain > 0) s += ` ちずが ${gain}% うまった。`;
  const nm = (res.materials || []).reduce((a, m) => a + m.n, 0);
  if (nm) s += ` 素材を ${nm}こ 拾った。`;
  if (res.mythic) s += ` ★ミシック★ ${res.mythic.name}を 手に入れた！`;
  for (const f of res.captured || []) s += ` ${f.name}を 捕まえた！`;
  return s.trim();
}
