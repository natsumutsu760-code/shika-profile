// ダンジョン（VR ゲーム）の計算（試作）。runDungeon(パーティ, 行き先, 時間, 種, { purpose, target, progress }) が、探索の流れ・戦い・宝箱・日記のもとを返す。同じ種なら同じ結果
// 門番は tripInit・tripStep・tripResult で 少しずつ 計算する（下の「1 回の 派遣」）
// 探索（鹿さんの参考ゲーム「魔界派遣ヴェルヴェット」と同じ。鹿さんの決め、2026-10-22）：1 つの行き先は 5 階。1 歩ずつ地図を歩き、まわり 1 マスが見えて探索率が上がる（progress に残る）
// 歩くと、ときどき敵と出会う（1〜3 体）。HP が減ったら休憩して回復する（鹿さんの決め、2026-10-22）。倒れた子は帰るまで戦えない（救護室 Lv3 から 休憩で 起きあがる）。全員倒れたら、力つきて帰ってくる（失敗ではない）
// 目的：探索（見ていないマスをうめて下へ）・ボス優先（一番深い階からボスの部屋へ）・採取優先・指定の敵だけ。時間（1・3・10 分）が来たら帰る
// パーティはペット＋懐柔した子 2 体まで（ペットだけでもいい）。状態（バフ・デバフ）は帰るまで持ちこす。ボスには凍結・眠り・気絶が効かない
// 勝った敵は 1 体ずつ、一定の確率で捕まえる（研究するとサブツリー、懐柔するとパーティに入れられる）。戦いに勝つと、ときどき懐柔のおやつを拾う
import { simulateTeams, rngIn, vitalsOf } from "./battle-sim.js";
import { petAt } from "./builds.js";
import { growOf, PLUS_RATE, INBRED_LOW } from "./monster.js";
import { OPS, rollCombo, comboOf, opCount, baseOf } from "./equip.js";
import { UNIQUE_RATE, uniquesOf, uniqueOf } from "./unique-equip.js";
import { DUNGEONS, RUNS, RARE_RATE, CAPTURE, GROUP, SNACK_DROP, TICK, ENCOUNTER, REST, TRAP, FLOOR_LV, BATTLE_TICKS, PURPOSES, CHEST_STAR, BOSS_STAR, MYTHIC, BOSS_RESOURCE, EXP_PER_LV, CREDIT, TOOLS, toolList, ENCH_RATE, ENCH_AMT, CHARM_RES, LURE_SHARE, NET_MULT, INVADE, MEDIC } from "./dungeons.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { ROSTER } from "./fusion-only.js";
import { BAG_USE_MAX } from "./battle-items.js";
import { floorMap, reachOf, exploredRatio, keyOf, DIRS, GW, GH, FLOORS, T, isPass } from "./floors.js";
import { GATHER, ENEMY_MAT, GATHER_N, floorMats, QUALITY, gatherPick, dropRate, CRYSTAL, CRYSTAL_DROP } from "./materials.js";
import { SPHERE_RATE, rollSphere } from "./sphere.js";   // 宝箱の スフィア
import { CROPS, farmOpen } from "./crops.js";   // 種（採取で たまに 拾う。鹿さんの 決め 2026-11-03）
// 種：採取ポイント 1 つで この 割合で、その 行き先の 種（作物の 表の at）を SEED_N こ 拾う（Claude の 仮。1 回の 派遣で 回る 採取ポイントは 1 つ ほど）。農園が 開いて いる ときだけ
export const SEED_RATE = 0.6, SEED_N = [1, 3];
export const seedsAt = (did) => CROPS.filter((c) => c.kind === "seed" && Array.isArray(c.at) && c.at.includes(did));

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
// 侵入して きた 高レベル体の 戦う 形（探索の 計算と オーバーレイの 帯で 同じ 物を 使う）
export const invaderFighter = (v) => ({ ...foeOf({ tree: v.tree, name: v.name, type: v.type, lv: v.lv }), owner: "侵入者" });
// 懐柔した子：捕まえた敵のタイプの伸び方 ＋ 自分のツリー（敵のときの SP の上乗せはない）。アクセサリーも付けられる
// 配合した 子（monster.js）：サブスキル 2 つ・受けついだ スキルポイント・＋値（＋1 ごとに ＋2%）・受けついだ 力（両親の 合計 ÷ 4 から 足した 分 inh）も 入れる
export const tamedOf = (f, lv = f.lv, equip = [], pow = 1) => {
  const g = growOf(f, lv), p = petAt(f.type, lv, g ? { main: f.tree, subs: g.subs, bonusSp: g.bonusSp } : { main: f.tree }), st = { ...p.stats }, mul = pow * (1 + PLUS_RATE * (f.plus || 0));
  for (const k in st) st[k] = Math.round((st[k] + ((f.inh && f.inh[k]) || 0)) * mul * (f.inb && k !== f.inb ? INBRED_LOW : 1));   // 近親配合の 子：いちばん 高い 力の ほかは 8 割
  return { ...p, name: f.name, owner: "VR", lv, stats: st, species: null, equip, tree: f.tree };
};

const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// 宝箱の 装備：形 × 素材（行き先で 出る 素材）× 色 の 組み合わせ（鹿さんの決め、2026-10-25）。OP の 数は ★ × 枠の 重み
function rollItem(R, d, star) {
  const base = rollCombo(R, Math.max(0, DUNGEONS.indexOf(d))), n = opCount(comboOf(base).slot, star);
  const pool = Object.keys(OPS).filter((k) => (OPS[k].from || 1) <= star), ops = [];
  while (ops.length < n && pool.length) ops.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
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
// opts.medic：出かけた ときの 救護室の Lv（休憩の 回復・倒れた子）。opts.stairs：地図室 Lv1 から（着いた 階の 階段の まわりが 見えて いる）。なしは 前と 同じ 結果。門番・派遣の 画面・配信の 中継で 同じ 物を わたす
export function tripInit(party, dungeonId, runKey, seed, opts = {}) {
  const d = DUNGEONS.find((x) => x.id === dungeonId), purpose = PURPOSES[opts.purpose] ? opts.purpose : "explore", tools = toolList(opts), tool = tools[0] || null;
  const pick = () => Math.max(0, [...d.foes, d.rare].findIndex((f) => f.tree === opts.target));   // えらんだ 敵（いなければ 1 体目）。S には 番号で しまう
  const prog = JSON.parse(JSON.stringify(opts.progress || newProgress()));
  const S = {
    lite: !!opts.lite, did: dungeonId, runKey, purpose, tool, tools, used: {}, fl: Number.isInteger(opts.floor) && opts.floor >= 1 && opts.floor <= floorsOpen(dungeonId, prog) ? opts.floor : 0, ti: purpose === "target" ? pick() : -1, li: tools.includes("lure") ? pick() : -1,
    r: { R: seed * 2654435761 >>> 0, C: seed * 40503 + 7 >>> 0, M: seed * 69069 + 13 >>> 0, Q: seed * 2246822519 + 3 >>> 0, X: seed * 3266489917 + 11 >>> 0, SD: seed * 668265263 + 17 >>> 0, K: seed * 1597334677 + 19 >>> 0, SP: seed * 3812015801 + 23 >>> 0 },   // C は希少な敵・捕獲・おやつ、M は素材、Q は ユニーク装備、X は 侵入、K は 結晶、SP は スフィア（ほかの結果が変わらないように）
    prog, before: Array.from({ length: FLOORS }, (_, i) => floorRatio(dungeonId, prog, i + 1)), budget: Math.round(RUNS[runKey].sec / TICK),
    team: (Array.isArray(party) ? party : [party]).map((c) => { const v = vitalsOf(c); return { c, maxHp: v.maxHp, maxMp: v.maxMp, hp: v.maxHp, mp: v.maxMp, down: false }; }),
    nt: 0, track: [], log: [], battles: [], captured: [], chests: [], gathered: [], drops: [], mats: [], seeds: {},
    tick: 0, floor: 0, pos: null, prev: null, seen: [], done: [], hiddenOpen: false, resting: false, status: "run", reason: null, fin: false,
    snacks: 0, exp: 0, credits: 0, kills: 0, wins: 0, rests: 0, traps: 0, steps: 0, bossDone: false, mythic: false, unique: null, resource: 0, toolUsed: false, start: 1,
    med: Math.max(0, Math.min(100, opts.medic | 0)), st: opts.stairs ? 1 : 0,
    bag: opts.items ? { ...opts.items } : null, bagUsed: {},   // 戦いの アイテムの 袋（ガンビットで 使う。使った 数は bagUsed）
  };
  S.inv = invader(S, d);
  machine(S).begin();
  return S;
}
// 侵入する かを 出発の ときに 決める（X の 乱数だけ 使う。侵入しない 派遣の 結果は 前と 同じ）
const INVADERS = () => ROSTER.filter((s) => INVADE.ranks.includes(s.rank) && ENEMY_TREES[s.tree]);
function invader(S, d) {
  const X = rngIn(S.r, "X"); if (X() >= INVADE.rate) return null;
  const list = INVADERS(); if (!list.length) return null;
  const s = list[Math.floor(X() * list.length)], lv = (d.isle || 1) * INVADE.lvStep + Math.floor(X() * INVADE.lvStep);
  return { tree: s.tree, name: s.name, type: s.type, lv, at: Math.floor(S.budget * (0.2 + 0.6 * X())), done: false };
}
// 戦いを max 回 したら 止める。終わったら true
export function tripStep(S, max = Infinity) { if (!S.fin) machine(S).run(max); return S.fin; }
export function tripResult(S) {
  const d = DUNGEONS.find((x) => x.id === S.did), after = Array.from({ length: FLOORS }, (_, i) => floorRatio(S.did, S.prog, i + 1));
  const materials = S.mats.map(([, m]) => m).sort((a, b) => (a.q ? 1 : 0) - (b.q ? 1 : 0) || b.q - a.q || b.n - a.n);
  return { dungeon: d, run: RUNS[S.runKey], purpose: S.purpose, target: S.ti >= 0 ? [...d.foes, d.rare][S.ti] : null, tool: S.tool, tools: S.tools || (S.tool ? [S.tool] : []), toolUsed: S.toolUsed, toolsUsed: { ...(S.used || {}) }, battles: S.battles, wins: S.wins, kills: S.kills,
    cleared: S.reason !== "wipe", reason: S.reason, bossDefeated: S.bossDone, drops: S.drops, chests: S.chests, mythic: S.mythic ? d.mythic : null, unique: S.unique ? uniqueOf(S.unique) : null, resource: S.resource, exp: Math.max(1, Math.round(S.exp)), credits: S.credits,
    captured: S.captured, snacks: S.snacks, materials, spheres: (S.spheres || []).map((x) => ({ ...x })), seeds: { ...(S.seeds || {}) }, gathered: S.gathered, traps: S.traps, rests: S.rests, steps: S.steps, startFloor: S.start, endFloor: S.floor, before: S.before, after, progress: S.prog,
    track: S.track, log: S.log, budget: S.budget, ticks: Math.min(S.budget, S.nt), down: S.team.filter((m) => m.down).map((m) => m.c.name), risen: S.risen || 0, invader: S.inv && S.inv.done ? S.inv : null, itemsUsed: S.bagUsed || {} };
}

// S を 動かす（地図・見た マスの 集まりは S から 作りなおし、止める ときに S へ もどす）
const PRV = new Int16Array(GW * GH), QUE = new Int16Array(GW * GH);   // 道さがしの 入れ物（使いまわす）
function machine(S) {
  const d = DUNGEONS.find((x) => x.id === S.did), dungeonId = S.did, purpose = S.purpose, P = PURPOSES[purpose], tools = S.tools || (S.tool ? [S.tool] : []), team = S.team, prog = S.prog;
  const has = (id) => tools.includes(id), usedOf = (id) => !!(S.used && S.used[id]), use = (id) => { (S.used ||= {})[id] = true; S.toolUsed = true; };   // 道具は 3 つまで。使った かは 1 つずつ
  const target = S.ti >= 0 ? [...d.foes, d.rare][S.ti] : null, lureFoe = S.li >= 0 ? [...d.foes, d.rare][S.li] : null;   // 持っていく 道具：笛は えらんだ敵を よぶ、ネットは 捕まえやすい、お茶は 1 回 全回復
  const R = rngIn(S.r, "R"), C = rngIn(S.r, "C"), M = rngIn(S.r, "M"), Q = rngIn(S.r, "Q"), SD = rngIn(S.r, "SD"), K = rngIn(S.r, "K");   // SD：種の くじ（べつの 乱数）   // Q：ユニーク装備の くじ（べつの 乱数なので、ほかの 結果は かわらない）
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
  const revealAt = (cx, cy) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH) seen.add(keyOf(x, y)); } };
  const reveal = () => revealAt(S.pos.x, S.pos.y);
  const rest = MEDIC.rest(S.med || 0), rise = MEDIC.up(S.med || 0);   // 救護室（とちゅうで しまった 前の S は 0）
  const ratio = () => { let tot = 0, got = 0; const hid = new Set(map.hidden.map(([x, y]) => keyOf(x, y))); for (const k of reach) if (!hid.has(k)) { tot++; if (seen.has(k)) got++; } return tot ? got / tot : 1; };
  const openHidden = (loud) => { S.hiddenOpen = true; for (const [x, y, t] of map.hidden) grid[y][x] = t; reach = reachOf(grid, map.start); if (loud) say("かべの むこうに かくし通路を 見つけた！"); };
  const checkHidden = () => { if (!S.hiddenOpen && map.hidden.length && ratio() >= 1) { openHidden(true); persist(); } };
  function load(n) {
    persist(); S.floor = n; map = floorMap(dungeonId, n); grid = map.grid.map((r) => r.slice());
    seen = new Set(prog.floors[n]?.seen || []); S.hiddenOpen = false; reach = reachOf(grid, map.start);
    if (prog.floors[n]?.hidden) openHidden(false);
    S.pos = { ...map.start }; S.prev = null; done = new Set();
    prog.maxFloor = Math.max(prog.maxFloor, n); reveal(); if (S.st && n < FLOORS) revealAt(map.goal.x, map.goal.y);   // 地図室 Lv1：階段の まわり
    persist(); say(`${n} 階に 着いた`, "sys"); checkHidden();
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
    if (lureFoe && C() < LURE_SHARE[rankOf(lureFoe)]) { use("lure"); return Array.from({ length: lureFoe === d.rare ? 1 : pickW(R, GROUP) }, () => lvUp(lureFoe)); }
    return Array.from({ length: pickW(R, GROUP) }, () => lvUp(d.rare && C() < RARE_RATE ? d.rare : d.foes[Math.floor(R() * d.foes.length)]));
  }
  // 薬・エンチャント・お守り（鹿さんの 決め、2026-10-31）：戦いの 能力に 足す 分（extraP）と、1 回だけ 効く 物（once）
  // 持って いる 道具 ぜんぶの 分を 足す。src：戦いの 能力に 足した 道具（香・エンチャント・お守りは これで なくなる）。onceBy：どの 薬が 1 回だけの 物を 出したか
  function toolFight() {
    const x = {}, src = [], onceBy = {}; let once = null;
    for (const id of tools) {
      const T = TOOLS[id] || {}; let add = false;
      if (T.onHit) { (x.onHitFx ||= []).push([T.onHit, ENCH_RATE, ENCH_AMT, undefined]); add = true; }
      if (T.resist) { x.resistFx = { ...(x.resistFx || {}), [T.resist]: ((x.resistFx || {})[T.resist] || 0) + CHARM_RES }; add = true; }
      if (T.statusRes) { x.statusRes = (x.statusRes || 0) + T.statusRes; add = true; }
      if (T.regen && fought === 1) { (x.startFx ||= []).push(["regen", T.regen]); add = true; }
      if (add) src.push(id);
      if ((T.cure || T.revive) && !usedOf(id)) { once ||= { cure: false, revive: 0 }; if (T.cure && !once.cure) { once.cure = true; onceBy.cure = id; } if ((T.revive || 0) > once.revive) { once.revive = T.revive; onceBy.revive = id; } }
    }
    return { extraP: Object.keys(x).length ? x : null, src, once, onceBy };
  }
  function fight(g, boss) {
    fought++;
    const tf = toolFight(), up = alive(), me = up.map((m) => ({ ...m.c, startHp: m.hp, startMp: m.mp, startFx: m.fx, ...(tf.extraP ? { extraP: tf.extraP } : {}) })), foes = g.map((f, k) => ({ ...foeOf(f), boss: boss && k === 0 }));
    const ev = simulateTeams(me, foes, Math.floor(R() * 1e9), { pve: true, quiet: S.lite, ...(tf.once ? { once: tf.once } : {}), ...(S.bag ? { items: S.bag, itemCap: Math.max(0, BAG_USE_MAX - Object.values(S.bagUsed).reduce((a, n) => a + n, 0)) } : {}) }), end = ev.at(-1), win = end.winner === 0, cost = BATTLE_TICKS(end.turns || 1);
    if (end.items) for (const [k, n] of Object.entries(end.items)) S.bagUsed[k] = (S.bagUsed[k] || 0) + n;   // S.bag は 戦いの 中で へった
    for (const id of tf.src) if (!TOOLS[id].keep) use(id);   // 香・エンチャント・お守りは 持って いけば なくなる。薬（keep）は 使った ときだけ（使わなければ 帰りに もどる）
    if (end.used && end.used.cure && tf.onceBy.cure) { use(tf.onceBy.cure); say(`${TOOLS[tf.onceBy.cure].name}で 状態異常を 防いだ`, "sys"); }
    if (end.used && end.used.revive && tf.onceBy.revive) { use(tf.onceBy.revive); say(`${TOOLS[tf.onceBy.revive].name}で 立ちあがった`, "sys"); }
    up.forEach((m, k) => { m.hp = Math.max(0, end.final[k].hp); m.mp = end.final[k].mp; m.fx = end.carry[k]; if (m.hp <= 0 || !win) m.down = true; });
    const b = S.battles.length, kill = win ? null : g.map((f, k) => k).filter((k) => end.final[up.length + k].hp <= 0);   // 負けた 戦いで たおせた 敵（何番め）
    S.battles.push({ foe: g[0], foes: g, boss, win, ...(kill ? { kill } : {}), ...(S.lite ? {} : { ev }), party: up.map((m) => m.c.name), floor: S.floor, tick: S.tick, cost });
    say(`${boss ? "ボスの " : ""}${g[0].name}${g.length > 1 ? ` たち（${g.length} たい）` : ""}と 戦った。${win ? "勝った！" : kill.length ? `${kill.length} たい たおしたが、力つきた……` : "力つきた……"}`, "btl");
    for (let i = 0; i < cost; i++) { snap("b", b); S.tick++; }
    const lvOf = (list) => list.reduce((s, f) => s + f.lv, 0);
    // 敵の素材：深い階ほど品質が高い（希少な敵 ＋1、ボスはいつも 5 を 2 こ）
    // 敵の 結晶（装備開発の 中心）：素材とは べつの くじ K（素材の くじの 順番は かわらない）
    const dropCrystal = (f, rk) => { const c = CRYSTAL[f.tree]; if (!c || K() >= CRYSTAL_DROP[rk]) return;
      const q = rk === "ボス" ? 5 : Math.min(5, pickW(K, QUALITY[S.floor]) + (rk === "希少" ? 1 : 0)); for (let i = 0; i < (rk === "ボス" ? 2 : 1); i++) addMat(c, q); };
    const dropMats = (ks) => { for (const k of ks) { const f = g[k], rk = boss && k === 0 ? "ボス" : rankOf(f); dropCrystal(f, rk); if (M() >= dropRate(rk, ENEMY_MAT[f.tree][0])) continue;   // 高い 素材ほど 落ちにくい（鹿さんの 頼み、2026-10-29）
      const q = rk === "ボス" ? 5 : Math.min(5, pickW(M, QUALITY[S.floor]) + (rk === "希少" ? 1 : 0)); for (let i = 0; i < (rk === "ボス" ? 2 : 1); i++) addMat(ENEMY_MAT[f.tree], q); } };
    // 負けても、たおせた 敵は 勝った ときと 同じ（経験値・クレジット・素材）、たおせなかった 敵は 経験値の 半分（鹿さんの決め、2026-10-25）
    // 捕まえる・おやつ・ボスの ごほうびは 勝った ときだけ
    if (!win) { const beat = kill.map((k) => g[k]), left = g.filter((f, k) => !kill.includes(k)); S.kills += beat.length; S.exp += (lvOf(beat) + lvOf(left) / 2) * EXP_PER_LV; S.credits += lvOf(beat) * CREDIT.perLv; dropMats(kill); }
    if (!win && has("tea") && !usedOf("tea")) { use("tea"); for (const m of team) { m.hp = m.maxHp; m.mp = m.maxMp; m.fx = undefined; m.down = false; } say("力つきそうに なった。元気のお茶を のんで 立ちあがった", "sys"); return; }
    if (!win) { S.status = "end"; S.reason = "wipe"; return; }
    S.wins++; S.kills += g.length; S.exp += lvOf(g) * EXP_PER_LV; S.credits += lvOf(g) * CREDIT.perLv;
    for (const f of g) if (C() < CAPTURE[rankOf(f)] * (has("net") ? NET_MULT : 1)) { S.captured.push(f); if (has("net")) use("net"); say(`${f.name}を 捕まえた！`); }
    dropMats(g.map((f, k) => k));
    if (C() < SNACK_DROP) { S.snacks++; say("おやつを 拾った", "sys"); }
    if (boss) {
      S.bossDone = true; prog.bossKills++; S.resource += BOSS_RESOURCE; S.credits += CREDIT.boss; const it = rollItem(R, d, pickW(R, BOSS_STAR)); S.drops.push(it); S.chests.push({ ...it, boss: true });
      if (R() < MYTHIC) S.mythic = true;
      { const us = uniquesOf(d.id); if (us.length && Q() < UNIQUE_RATE) S.unique = us[Math.floor(Q() * us.length)].id; }
      say("ボスを たおした！");
    }
  }
  // 侵入：先頭の 生きて いる 子に 1 対 1 で 挑む（オーバーレイの 帯の simulate と 同じ 計算。同じ 種で 同じ 戦い）
  function invade() {
    const v = S.inv, X = rngIn(S.r, "X"), lead = alive()[0]; v.done = true; if (!lead) return;
    const f = { tree: v.tree, name: v.name, type: v.type, lv: v.lv }, B = invaderFighter(v);
    v.who = team.indexOf(lead); v.seed = Math.floor(X() * 2 ** 31);
    const ev = simulateTeams([lead.c], [B], v.seed, { quiet: S.lite }), end = ev.at(-1), win = end.winner === 0, cost = BATTLE_TICKS(end.turns || 1);
    v.win = win; fought++;
    say(`高レベルの ${v.name}（Lv${v.lv}）が 侵入して きた！`, "btl");
    const b = S.battles.length;
    S.battles.push({ foe: f, foes: [f], boss: false, inv: true, win, ...(win ? {} : { kill: [] }), ...(S.lite ? {} : { ev }), party: [lead.c.name], floor: S.floor, tick: S.tick, cost });
    for (let i = 0; i < cost; i++) { snap("b", b); S.tick++; }
    if (!win) { for (const m of team) m.down = true; say(`${lead.c.name}が ${v.name}に 負けた。力つきた……`, "btl"); S.status = "end"; S.reason = "wipe"; return; }
    lead.hp = Math.max(1, end.final[0].hp); lead.mp = end.final[0].mp;
    S.wins++; S.kills++; S.exp += v.lv * EXP_PER_LV;
    say(`${lead.c.name}が 侵入して きた ${v.name}を たおした！`, "btl");
    if (X() < INVADE.capture) { v.caught = true; S.captured.push({ ...f, lv: 1 }); say(`${v.name}を 捕まえた！`); }
  }
  function step(p) {
    S.prev = S.pos; S.pos = p; S.steps++; reveal(); checkHidden();
    if (S.inv && !S.inv.done && S.tick >= S.inv.at) { invade(); return; }
    const t = grid[p.y][p.x], k = keyOf(p.x, p.y), hid = map.hidden.some(([x, y]) => x === p.x && y === p.y);
    if (t === T.BOSS && !S.bossDone) { fight([d.boss, ...Array.from({ length: pickW(R, GROUP) - 1 }, () => lvUp(d.foes[Math.floor(R() * d.foes.length)]))], true); return; }
    if (t === T.TRAP && !done.has(k)) {
      done.add(k);
      if (R() < TRAP.avoid) say("罠を 見ぬいた", "sys");
      else { S.traps++; for (const m of alive()) { m.hp = Math.max(0, m.hp - Math.max(1, Math.round(m.maxHp * TRAP.dmg))); if (m.hp <= 0) m.down = true; } say("罠に かかった！", "ev"); if (!alive().length) { S.status = "end"; S.reason = "wipe"; return; } }
    } else if (t === T.GATHER && !done.has(k)) {
      done.add(k); const two = floorMats(dungeonId, S.floor), got = hid ? [GATHER[dungeonId].hidden, gatherPick(two, M())] : Array.from({ length: pickW(M, GATHER_N) }, () => gatherPick(two, M()));   // 高い 素材ほど 採れにくい
      got.forEach((x) => addMat(x)); S.gathered.push({ floor: S.floor, hidden: hid, items: got.map(([, name]) => name) }); say(`${hid ? "かくし通路で " : ""}${got.map(([, name]) => name).join("と ")}を 採取した`, "sys");
      const sd = farmOpen() ? seedsAt(dungeonId) : [];
      if (sd.length && SD() < SEED_RATE) { const c = sd[Math.floor(SD() * sd.length)], n = SEED_N[0] + Math.floor(SD() * (SEED_N[1] - SEED_N[0] + 1)); S.seeds ||= {}; S.seeds[c.id] = (S.seeds[c.id] || 0) + n; say(`${c.name}の 種を ${n} こ 拾った`, "sys"); }
    }
    else if (t === T.CHEST && !done.has(k)) { done.add(k); rollItem(R, d, Math.min(5, pickW(R, CHEST_STAR[S.floor]) + (hid ? 1 : 0)));   // 宝箱から 装備は 出さない（鹿さんの 決め 2026-10-29「宝箱からは装備のかわりにスフィア」。くじの 順番を かえない ため 引くだけ 引く）
      const cr = Math.round((CREDIT.chest[0] + M() * (CREDIT.chest[1] - CREDIT.chest[0])) * S.floor * (hid ? 2 : 1)); S.credits += cr;
      // スフィア：宝箱 1 つに 3%（べつの くじ SP。中身〈OP と ★〉は ここで 決まり、ガラクの 鑑定で 見える。2026-11-04 に つないだ）
      const SP = rngIn(S.r, "SP"), sp = SP() < SPHERE_RATE ? { ...rollSphere(d.id, SP), floor: S.floor } : null; if (sp) (S.spheres ||= []).push(sp);
      S.chests.push({ floor: S.floor, hidden: hid, credits: cr, ...(sp ? { sphere: 1 } : {}) }); say(`${hid ? "かくし通路の " : ""}宝箱を あけた${sp ? "。スフィアが 入って いた！" : ""}`); }
    if (t !== T.START && t !== T.BOSS) {
      const rate = (t === T.ROOM ? ENCOUNTER.room : ENCOUNTER.path) * (target === d.rare ? P.rareEnc : P.enc);
      if (R() < rate) fight(group(), false);
    }
  }
  function begin() {
    const start = S.fl || startFloor(dungeonId, prog, purpose);
    S.start = start; load(start);
    say(`${team[0].c.name}${team.length > 1 ? `たち ${team.length} 体` : ""}で 出発した。目的：${P.name}${target ? `（${target.name}）` : ""}${tools.length ? `。${tools.map((id) => TOOLS[id].name).join("・")}を 持っていく` : ""}`);
    pack();
  }
  const going = () => S.tick < S.budget && S.status === "run";
  function run(max) {
    while (going() && fought < max) {
      if (S.resting) {
        for (const m of alive()) { m.hp = Math.min(m.maxHp, m.hp + Math.max(1, Math.round(m.maxHp * REST.hp * rest))); m.mp = Math.min(m.maxMp, m.mp + Math.max(1, Math.round(m.maxMp * REST.mp * rest))); }
        snap("r"); S.tick++;
        if (hpRate() >= REST.until && mpRate() >= REST.until) { S.resting = false; say("休憩を おえた", "sys"); }
        continue;
      }
      const fallen = rise ? team.filter((m) => m.down) : [];   // 救護室 Lv1 から：倒れた子が いれば 休憩して 起こす（HP は Lv × 0.3%）
      if (hpRate() < REST.hpAt || mpRate() < REST.mpAt || fallen.length) {
        S.resting = true; S.rests++; say("つかれたので 休憩する", "sys");
        for (const m of fallen) { m.down = false; m.hp = Math.max(1, Math.round(m.maxHp * rise)); say(`${m.c.name}が 起きあがった`, "sys"); }
        if (fallen.length) S.risen = (S.risen || 0) + fallen.length;   // 休憩で 起きあがった 数（DEEP LINK/: の タスク）
        snap("r"); S.tick++; continue;
      }
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
const DIARY = {
  shika: { win: "ゴーグルを つけた。{d}で ねた。おきたら {n}たい たおしてた。{item}", lose: "ゴーグルを つけた。{d}で ねた。{foe}に まけてた。ねた。" },
  pelican: { win: "{d}へ 配達に 行った。{n}たい たおした。{item}", lose: "{d}で {foe}に つかまった。手紙は ぶじ。" },
  mouse: { win: "ゴーグル ゴーグル。{d} {d}。かった かった。{item}", lose: "{foe} {foe}。まけた まけた。" },
  tv: { win: "むかしの ゲームの方が よかった。{d}は まあまあ。{n}たい たおした。{item}", lose: "{d}は むずかしい。むかしは もっと かんたんだった。" },
  mogura: { win: "{d}の かべを ほった。{foe}が でた。かった。{item}", lose: "{d}で ほったら {foe}の 上に でた。まけた。" },
  kurage: { win: "ゴーグルの中で ゆらゆら。たしか {d}に いた。{item}", lose: "なにかに まけた きがする。ゆらゆら。" },
  saboten: { win: "……。（{d}で {n}かい かった）{item}", lose: "……。（{foe}に まけた）" },
  chokin: { win: "{d}で コインを さがした。{item}", lose: "{d}で {foe}に ふられた。チャリチャリ いった。" },
  // 2026-10-31 に ふやした 4 匹（口ぐせは docs/mono-link-new-pets.md）
  tako: { win: "ボクが {d}を 料理して やった。{n}たい たおした。{item}", lose: "{d}で {foe}に まけた。こげても ボクは さいこうだった。" },
  ittan: { win: "わしは {d}を カタカタ とおった。{n}たい たおした。{item}", lose: "{d}で {foe}に 折り目を つけられた。わしは まだ カタカタ しとる。" },
  ebi: { win: "{d}を 巡回。{n}たい 撃破。異常なし。……以上。{item}", lose: "{d}にて {foe}と 交戦。撤退。……以上。" },
  beagle: { win: "{d}を さんぽ した。{n}たい たおした。まだ いける。{item}", lose: "{d}で {foe}に おいかけられた。もういっかい いく。" },
};
export function diaryOf(species, res) {
  const t = DIARY[species] || DIARY.shika, it = res.drops[0], last = res.battles.at(-1);
  const iname = it ? baseOf(it.base)?.name || it.base : "";   // 組み合わせの 装備（鉄の手袋 など）も 名前で
  const item = it ? (species === "chokin" ? `${iname}（★${it.star}）は たべられなかった。` : `${iname}（★${it.star}）が とどいた。`) : "";
  let s = (res.cleared ? t.win : t.lose).replaceAll("{d}", res.dungeon.name).replaceAll("{n}", res.kills).replaceAll("{foe}", last ? last.foe.name : "なにか").replaceAll("{item}", item);
  if (!res.cleared && it) s += ` ${item}`;
  const gain = Math.round((res.after.reduce((a, b) => a + b, 0) - res.before.reduce((a, b) => a + b, 0)) / res.after.length * 100);
  if (gain > 0) s += ` ちずが ${gain}% うまった。`;
  const nm = (res.materials || []).reduce((a, m) => a + m.n, 0);
  if (nm) s += ` 素材を ${nm}こ 拾った。`;
  if (res.mythic) s += ` ★ミシック★ ${res.mythic.name}を 手に入れた！`;
  if (res.unique) s += ` ★ユニーク★ ${res.unique.name}を 手に入れた！`;
  for (const f of res.captured || []) s += ` ${f.name}を 捕まえた！`;
  return s.trim();
}
