// 行き先の階の地図（試作）。floorMap(行き先, 階) が 15×15 のマスを返す。同じ行き先・同じ階なら、いつも同じ地図（鹿さんの参考ゲーム「魔界派遣ヴェルヴェット」と同じ探索）
// 部屋を 5〜6 こ置いて道でつなぐ。入口から一番遠い部屋に階段（5 階はボスの部屋）。罠・採取ポイント・宝箱を置く
// かくし通路：部屋のかべの向こうの小さな通路。その階の探索率が 100% になると開く（中に宝箱と採取ポイント）
import { rng } from "./battle-sim.js";

export const GW = 15, GH = 15, FLOORS = 5;
// マス：0 かべ 1 道 2 広場（部屋） 3 入口 4 罠 5 採取 6 宝箱 7 ボス 8 階段
export const T = { WALL: 0, PATH: 1, ROOM: 2, START: 3, TRAP: 4, GATHER: 5, CHEST: 6, BOSS: 7, STAIRS: 8 };
export const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const keyOf = (x, y) => y * GW + x;

const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const cache = {};

export function floorMap(did, n) {
  const id = `${did}:${n}`;
  if (cache[id]) return cache[id];
  for (let t = 0; t < 40; t++) { const m = gen(did, n, t); if (m) return (cache[id] = m); }
  throw new Error(`地図が作れない ${id}`);
}

function gen(did, n, attempt) {
  const R = rng((hash(did) + n * 7919 + attempt * 104729) >>> 0), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const g = Array.from({ length: GH }, () => Array(GW).fill(T.WALL)), rooms = [];
  const want = ri(5, 6);
  for (let k = 0; rooms.length < want && k < 300; k++) {
    const w = ri(2, 4), h = ri(2, 3), x = ri(1, GW - w - 1), y = ri(1, GH - h - 1);
    if (rooms.some((r) => !(x + w + 1 <= r.x || r.x + r.w + 1 <= x || y + h + 1 <= r.y || r.y + r.h + 1 <= y))) continue;
    rooms.push({ x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) });
  }
  if (rooms.length < 5) return null;
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) g[y][x] = T.ROOM;
  // 部屋どうしを道でつなぐ（近い順に木の形でつないで、輪を 1 つ足す）
  const dig = (a, b) => {
    let { cx: x, cy: y } = a; const hFirst = R() < 0.5;
    const step = (tx, ty) => { while (x !== tx || y !== ty) { if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); if (g[y][x] === T.WALL) g[y][x] = T.PATH; } };
    if (hFirst) { step(b.cx, y); step(b.cx, b.cy); } else { step(x, b.cy); step(b.cx, b.cy); }
  };
  const inTree = [0], d2 = (a, b) => (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2;
  while (inTree.length < rooms.length) {
    let best = null;
    for (const i of inTree) for (let j = 0; j < rooms.length; j++) if (!inTree.includes(j) && (!best || d2(rooms[i], rooms[j]) < best[2])) best = [i, j, d2(rooms[i], rooms[j])];
    dig(rooms[best[0]], rooms[best[1]]); inTree.push(best[1]);
  }
  const a = ri(0, rooms.length - 1); let b = ri(0, rooms.length - 1); if (a === b) b = (b + 1) % rooms.length; dig(rooms[a], rooms[b]);
  // 入口と、入口から一番遠い部屋（階段・ボス）
  const pass = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && g[y][x] !== T.WALL;
  const dist = (sx, sy) => { const D = Array.from({ length: GH }, () => Array(GW).fill(-1)), q = [[sx, sy]]; D[sy][sx] = 0;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of DIRS) if (pass(x + dx, y + dy) && D[y + dy][x + dx] < 0) { D[y + dy][x + dx] = D[y][x] + 1; q.push([x + dx, y + dy]); } } return D; };
  const s = rooms[ri(0, rooms.length - 1)], D = dist(s.cx, s.cy);
  const far = rooms.reduce((m, r) => (D[r.cy][r.cx] > D[m.cy][m.cx] ? r : m), s);
  if (far === s || D[far.cy][far.cx] < 8) return null;
  g[s.cy][s.cx] = T.START; g[far.cy][far.cx] = n === FLOORS ? T.BOSS : T.STAIRS;
  // 罠・採取・宝箱
  const nb = (x, y) => DIRS.filter(([dx, dy]) => pass(x + dx, y + dy)).length;
  const cells = (f) => { const out = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (f(x, y)) out.push([x, y]); return out; };
  const take = (list, k, tile) => { for (let i = 0; i < k && list.length; i++) { const [x, y] = list.splice(Math.floor(R() * list.length), 1)[0]; g[y][x] = tile; } };
  const nearStart = (x, y) => Math.abs(x - s.cx) + Math.abs(y - s.cy) < 3;
  const dead = cells((x, y) => g[y][x] === T.PATH && nb(x, y) === 1 && !nearStart(x, y));
  take(dead, ri(1, 2), T.CHEST);
  take(cells((x, y) => g[y][x] === T.ROOM && !nearStart(x, y) && (x !== far.cx || y !== far.cy)), ri(2, 3), T.GATHER);
  take(cells((x, y) => g[y][x] === T.PATH && nb(x, y) === 2 && !nearStart(x, y)), 1 + (n >= 3 ? 1 : 0) + (n >= 5 ? 1 : 0), T.TRAP);
  if (!g.flat().includes(T.CHEST)) take(cells((x, y) => g[y][x] === T.ROOM && !nearStart(x, y)), 1, T.CHEST);
  // かくし通路：部屋のかべから外へ、まわりがぜんぶかべの所を 3〜4 マス
  let hidden = [];
  const cands = [];
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) for (const [dx, dy] of DIRS) {
    const len = 3 + (R() < 0.5 ? 1 : 0), line = [];
    for (let k = 1; k <= len; k++) line.push([x + dx * k, y + dy * k]);
    const ok = line.every(([lx, ly], k) => lx >= 1 && ly >= 1 && lx < GW - 1 && ly < GH - 1 && g[ly][lx] === T.WALL &&
      DIRS.every(([ex, ey]) => { const px = lx + ex, py = ly + ey; return (k === 0 && px === x && py === y) || line.some(([qx, qy]) => qx === px && qy === py) || g[py][px] === T.WALL; }));
    if (ok) cands.push(line);
  }
  if (cands.length) {
    const line = cands[Math.floor(R() * cands.length)];
    hidden = line.map(([x, y], k) => [x, y, k === line.length - 1 ? T.CHEST : k === line.length - 2 ? T.GATHER : T.PATH]);
  }
  return { grid: g, start: { x: s.cx, y: s.cy }, goal: { x: far.cx, y: far.cy }, hidden };
}

export const isPass = (t) => t !== T.WALL;
// 入口から歩いて行けるマス（かくし通路は開いたときだけ）
export function reachOf(grid, start) {
  const seen = new Set([keyOf(start.x, start.y)]), q = [start];
  while (q.length) { const { x, y } = q.pop(); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = keyOf(nx, ny); if (nx >= 0 && ny >= 0 && nx < GW && ny < GH && isPass(grid[ny][nx]) && !seen.has(k)) { seen.add(k); q.push({ x: nx, y: ny }); } } }
  return seen;
}
// 探索率：入口から行けるマスのうち、見たマスの割合（かくし通路は数えない）
export function exploredRatio(did, n, seenList) {
  const m = floorMap(did, n), reach = reachOf(m.grid, m.start), seen = new Set(seenList || []);
  let tot = 0, got = 0; for (const k of reach) { tot++; if (seen.has(k)) got++; }
  return tot ? got / tot : 0;
}
