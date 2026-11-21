// 集合住宅（TD）の 建物の 形と 増築の 候補・部屋・値段（three を 使わない。画面 td.html・門番 lounge-server/lounge-td.js・試験が 読む）
// 形と 候補は 2 代目の 見本（td.html。鹿さんの OK の 完成形「九龍城塞」と 増築の 候補 20 こ。M-026・M-032）から そのまま 写した（2026-11-15 システム担当）
// 値段は 数の 表（td-numbers.js の partPrice。鹿さんの カード 4 回目）。部屋の 鍵は「箱-階-何番目」（td.html の composeRooms と 同じ）
// 2026-11-16 九龍城塞の 置き場所の 作り直し（鹿さんの カード「案 1 十字に重ねる」「いまと同じく別に買う」。2 代目）：
//   決まった 20 か所（SLOTS）は やめ、置ける 所を その つど 数える（availOf）。SLOTS・FULL_* は 九龍城塞の 見本（td.html の ?full・?def・?bt）の ために のこす
//   区画は 建物の 屋根の 両はしに 十字に 重なる（たてと よこを 交互に・前後へ 張り出す）か、地面の 建物の 両はしに 生える。屋根に 重ねられるのは 階が そろった 建物だけ
//   （1 つ目の 建物は 5 階・区画は 設計図の ★の 階）。外階段・渡り廊下は いまと 同じく 別に 買う。入口から 歩いて 行けない 区画は cut（住めない）
//   建てた 物の id：区画 "b:<ax>:<side>:<x0>:<z0>:<f0>"（建てた 順に K1・K2…）・区画の 階 "u:<K>:<階>"・外階段 "x:<階>:<x>:<z>"（その 階 → 1 つ 上）・渡り廊下 "w:<階>:<x1>:<z1>:<x2>:<z2>"
import { partPrice, BLUEPRINT, FIRST_FLOORS } from "./td-numbers.js";

export const FULL_BLOCKS = [   // OK を もらった 完成形（九龍城塞の 形）。増築の 見本は ここへ 向かって 育つ
  { id: "A", x0: -9, z0: 1, w: 11, d: 4, f0: 0, h: 2, ax: "x", wall: "#E8D8C0", trim: "#C8B08A" },              // 土台（よこ）
  { id: "B", x0: 2, z0: -9, w: 4, d: 11, f0: 0, h: 2, ax: "z", wall: "#CFE3DA", trim: "#98BCAC" },              // 土台（たて）
  { id: "I", x0: -9, z0: 1, w: 3, d: 4, f0: 2, h: 1, ax: "x", wall: "#D9D2EA", trim: "#A89CC8" },               // 土台の 屋上の 小屋
  { id: "C", x0: -6, z0: -7, w: 4, d: 13, f0: 2, h: 2, ax: "z", side: "r", wall: "#E6C9C2", trim: "#C29A90" },   // 土台を またいで うしろへ 8 マス 張り出す（たて）
  { id: "D", x0: 2, z0: -6, w: 11, d: 4, f0: 2, h: 2, ax: "x", wall: "#E2DCC8", trim: "#B8AE90" },              // B を またいで 右へ 7 マス 張り出す（よこ）
  { id: "E", x0: -11, z0: -5, w: 11, d: 4, f0: 4, h: 2, ax: "x", wall: "#C8DCEC", trim: "#90AECB" },            // C を またいで 左右へ（よこ）
  { id: "F", x0: 8, z0: -10, w: 4, d: 13, f0: 4, h: 2, ax: "z", wall: "#E8CFE0", trim: "#C29AB4" },             // D の はしに のって 前後へ（たて）
  { id: "G", x0: -11, z0: -9, w: 4, d: 9, f0: 6, h: 2, ax: "z", side: "r", wall: "#D5D9E6", trim: "#9EA6C0", top: true },   // てっぺん：左うしろへ はみ出す（プライベートラウンジ・電波塔）
];
export const FULL_TOWER = { x: 1, z: -1, f0: 0, f1: 3 };
export const FULL_WALKS = [   // 接ぎ木の すき間を つなぐ 通路（f は 0 ＝ 1 階）
  { f: 2, cells: [[1, -2], [1, -3]] },                    // 塔 ⇄ D（3 階）
  { f: 3, cells: [[0, -1], [-1, -1], [-2, -1]] },         // 塔 ⇄ C（4 階）
];
export const FULL_EXST = [   // 外階段（箱どうしが 交わる 廊下の マスで、下の 階から 上の 階へ）
  { x: -3, z: -2, f: 3 },   // C の 4 階 → E の 5 階
  { x: 8, z: -3, f: 3 },    // D の 4 階 → F の 5 階
  { x: -8, z: -2, f: 5 },   // E の 6 階 → G の 7 階
];
export const SLOTS = [
  { id: "B1", part: "box", blk: "B", f: 0, req: [] },              // 土台の 右へ たての 箱（1 階）
  { id: "B2", part: "floor", blk: "B", f: 1, req: ["B1"] },
  { id: "T2", part: "tower", f1: 2, req: [] },                     // 階段の 塔（1〜3 階）
  { id: "W0", part: "walk", w: 0, req: ["T2"] },                   // 塔 ⇄ D（3 階）
  { id: "D1", part: "box", blk: "D", f: 2, req: ["B2", "W0"] },    // B を またいで 右へ 張り出す（3 階）
  { id: "D2", part: "floor", blk: "D", f: 3, req: ["D1"] },
  { id: "T3", part: "tower", f1: 3, req: ["T2"] },                 // 塔を 4 階へ
  { id: "C1", part: "box", blk: "C", f: 2, req: ["T3"] },          // 土台を またいで うしろへ（3 階）
  { id: "C2", part: "floor", blk: "C", f: 3, req: ["C1"] },
  { id: "W1", part: "walk", w: 1, req: ["T3", "C2"] },             // 塔 ⇄ C（4 階）
  { id: "I1", part: "box", blk: "I", f: 2, req: ["C1"] },          // 土台の 屋上の 小屋
  { id: "X0", part: "exst", e: 0, req: ["C2"] },                   // C の 4 階 → 5 階
  { id: "E1", part: "box", blk: "E", f: 4, req: ["X0"] },
  { id: "E2", part: "floor", blk: "E", f: 5, req: ["E1"] },
  { id: "X1", part: "exst", e: 1, req: ["D2"] },                   // D の 4 階 → 5 階
  { id: "F1", part: "box", blk: "F", f: 4, req: ["X1"] },
  { id: "F2", part: "floor", blk: "F", f: 5, req: ["F1"] },
  { id: "X2", part: "exst", e: 2, req: ["E2"] },                   // E の 6 階 → 7 階
  { id: "G1", part: "box", blk: "G", f: 6, req: ["X2"] },
  { id: "G2", part: "floor", blk: "G", f: 7, req: ["G1"] },
];
export const PARTS = [["box", "部屋の 箱", "room"], ["floor", "階を 足す", "floor"], ["exst", "外階段", "exst"], ["walk", "渡り廊下", "bridge"], ["tower", "階段の 塔", "stair"]];

export const roomsPer = (b) => (b.ax === "x" ? Math.floor((b.w - 1) / 2) : Math.floor((b.d - 1) / 2));
const inBlk = (b, x, z, f) => x >= b.x0 && x < b.x0 + b.w && z >= b.z0 && z < b.z0 + b.d && f >= b.f0 && f < b.f0 + b.h;
// 廊下と 階段（td.html と 同じ）：よこの 箱は いちばん 前の 列が 廊下・右はしの 列が 階段。たての 箱は side の 列が 廊下・いちばん うしろの 行が 階段
// 廊下 2 マスの 区画（設計図 ★4・★5。2026-11-16 鹿さんの カード「案 1 廊下だけ太く」）：箱が 1 マス 太く（よこの 箱は 奥行き 5・たての 箱は 横 5）、廊下が 2 列。部屋の 数と 大きさは そのまま
export const hallOf = (b) => b.hall || 1;
export const corrX = (b) => (b.side === "r" ? b.x0 + b.w - hallOf(b) : b.x0 + hallOf(b) - 1);   // ドアの 前の 廊下の 列（部屋の となり）
export const roomX = (b) => (b.side === "r" ? b.x0 : b.x0 + hallOf(b));   // たての 箱の 部屋の 左はし
export const isCorr = (b, x, z) => (b.ax === "x" ? z >= b.z0 + b.d - hallOf(b) : b.side === "r" ? x >= b.x0 + b.w - hallOf(b) : x < b.x0 + hallOf(b));
export const isStair = (b, x, z) => !isCorr(b, x, z) && (b.ax === "x" ? x === b.x0 + b.w - 1 : z === b.z0 + b.d - 1);
const walkB = (b, x, z, f) => inBlk(b, x, z, f) && (isCorr(b, x, z) || isStair(b, x, z));
export const ENTRY = { f: 0, x: -9, z: 4 };   // 入口（1 つ目の 建物の 1 階の 廊下の 左はし）
export const A_FULL = FIRST_FLOORS.start + FIRST_FLOORS.at.length;   // 1 つ目の 建物の 階が そろう 数（いまは 5）
const PAL = FULL_BLOCKS.slice(1).map((b) => [b.wall, b.trim]);
const boxOf = (ax, side, x0, z0, f0, hall = 1) => ({ ax, ...(side && side !== "-" ? { side } : {}), ...(hall > 1 ? { hall } : {}), x0, z0, f0, h: 1, w: ax === "x" ? 11 : 3 + hall, d: ax === "x" ? 3 + hall : 11 });
const hallOfStar = (st) => (BLUEPRINT[st] && BLUEPRINT[st].hall) || 1;
const nextKOf = (order) => "K" + (order.filter((o) => String(o).startsWith("b:")).length + 1);   // 次に 建つ 区画の id（stars に その ★を 入れて わたすと 太さが きまる）
const lineCells = (x1, z1, x2, z2) => { const out = [], n = Math.max(Math.abs(x2 - x1), Math.abs(z2 - z1)); for (let k = 0; k <= n; k++) out.push([x1 + Math.sign(x2 - x1) * k, z1 + Math.sign(z2 - z1) * k]); return out; };
const cid = (f, x, z) => `${f}:${x}:${z}`;
// 歩ける マスと つながり（td.html の mapOf の 部屋を のぞいた ところと 同じ。門番も 読む）
export function walkCells(sh) {
  const cells = {}, add = (id) => (cells[id] ||= { nb: [] }), link = (a, b) => { if (!cells[a] || !cells[b] || a === b) return; if (!cells[a].nb.includes(b)) cells[a].nb.push(b); if (!cells[b].nb.includes(a)) cells[b].nb.push(a); };
  const stairs = new Set();
  for (const b of sh.blocks) for (let f = b.f0; f < b.f0 + b.h; f++) for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) {
    const x = b.x0 + i, z = b.z0 + j; if (isCorr(b, x, z)) add(cid(f, x, z)); else if (isStair(b, x, z)) { add(cid(f, x, z)); if (f < b.f0 + b.h - 1) stairs.add(cid(f, x, z)); }
  }
  const T = sh.tower; if (T) for (let f = T.f0; f <= T.f1; f++) for (const z of [T.z, T.z + 1]) add(cid(f, T.x, z));
  for (const w of sh.walks) for (const [x, z] of w.cells) add(cid(w.f, x, z));
  for (const id of Object.keys(cells)) { const [f, x, z] = id.split(":").map(Number); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) link(id, cid(f, x + dx, z + dz)); }
  for (const id of stairs) { const [f, x, z] = id.split(":").map(Number); link(id, cid(f + 1, x, z)); }
  if (T) for (let f = T.f0; f < T.f1; f++) for (const z of [T.z, T.z + 1]) link(cid(f, T.x, z), cid(f + 1, T.x, z));
  for (const e of sh.exst) link(cid(e.f, e.x, e.z), cid(e.f + 1, e.x, e.z));
  return cells;
}
// 建てた 物（順に）から いまの 形。stars：区画 → 設計図の ★（区画の 階の 上限。門番の T.bpAt）
export function shapeOf(order, aFloors, stars = {}) {
  const built = new Set(order), blocks = [], at = {};
  blocks.push({ ...FULL_BLOCKS[0], h: Math.max(FULL_BLOCKS[0].h, aFloors | 0) }); at.A = -1;   // 最初の アパート（2 階から 階を 足せる）
  for (const fb of FULL_BLOCKS.slice(1)) {   // 九龍城塞の 見本の 箱（決まった 置き場所）
    const sl = SLOTS.filter((x) => x.blk === fb.id && built.has(x.id)); if (!sl.length) continue;
    const fl = sl.map((x) => x.f), top = Math.max(...fl);
    blocks.push({ ...fb, f0: Math.min(...fl), h: top - Math.min(...fl) + 1, legacy: true, top: false }); at[fb.id] = order.indexOf(sl.find((x) => x.f === top).id);
  }
  const tw = SLOTS.filter((x) => x.part === "tower" && built.has(x.id)).map((x) => x.f1);
  const walks = SLOTS.filter((x) => x.part === "walk" && built.has(x.id)).map((x) => FULL_WALKS[x.w]);
  const exst = SLOTS.filter((x) => x.part === "exst" && built.has(x.id)).map((x) => FULL_EXST[x.e]);
  const K = {}; let n = 0;
  order.forEach((id, i) => {   // 動く 置き場所
    const p = String(id).split(":");
    if (p[0] === "b" && p.length === 6) { const k = "K" + ++n, b = { ...boxOf(p[1], p[2], +p[3], +p[4], +p[5], hallOfStar(stars[k])), id: k }; [b.wall, b.trim] = PAL[(n - 1) % PAL.length]; blocks.push(b); K[b.id] = b; at[b.id] = i; }
    else if (p[0] === "u" && p.length === 3 && K[p[1]] && +p[2] === K[p[1]].f0 + K[p[1]].h) { K[p[1]].h++; at[p[1]] = i; }
    else if (p[0] === "x" && p.length === 4) exst.push({ f: +p[1], x: +p[2], z: +p[3] });
    else if (p[0] === "w" && p.length === 6) walks.push({ f: +p[1], cells: lineCells(+p[2], +p[3], +p[4], +p[5]) });
  });
  const sh = { blocks, tower: tw.length ? { ...FULL_TOWER, f1: Math.max(...tw) } : null, walks, exst, stars };
  // 入口から 歩いて 行ける 区画（行けない 区画は cut。住めない・ラウンジにも ならない）
  const cells = walkCells(sh), seen = new Set([cid(ENTRY.f, ENTRY.x, ENTRY.z)]), q = [...seen];
  while (q.length) { const c = q.shift(); for (const y of (cells[c] || { nb: [] }).nb) if (!seen.has(y)) { seen.add(y); q.push(y); } }
  for (const b of blocks) { let ok = false; for (let f = b.f0; f < b.f0 + b.h && !ok; f++) for (let i = 0; i < b.w && !ok; i++) for (let j = 0; j < b.d && !ok; j++) if (walkB(b, b.x0 + i, b.z0 + j, f) && seen.has(cid(f, b.x0 + i, b.z0 + j))) ok = true; b.cut = !ok; }
  // ラウンジ（いちばん 上の 箱）：つながった 箱の 中で いちばん 高い。同じ 高さなら 先に そこまで 建った 方
  let tb = blocks[0];
  for (const b of blocks) { if (b.cut) continue; const d = b.f0 + b.h - (tb.f0 + tb.h); if (d > 0 || (d === 0 && at[b.id] < at[tb.id])) tb = b; }
  blocks.forEach((b) => (b.top = b === tb));
  sh.top = Math.max(...blocks.map((b) => b.f0 + b.h)) - 1;
  return sh;
}
export const solidAt = (sh, x, z, f) => sh.blocks.some((b) => inBlk(b, x, z, f)) || (!!sh.tower && x === sh.tower.x && (z === sh.tower.z || z === sh.tower.z + 1) && f >= sh.tower.f0 && f <= sh.tower.f1);
// 部屋の 一覧（鍵・箱・階）。てっぺんの 箱の いちばん 上の 階の 左 2 部屋ぶんは プライベートラウンジ（住めない）
export function roomsOf(sh) {
  const out = [];
  for (const b of sh.blocks) for (let f = b.f0; f < b.f0 + b.h; f++) for (let k = 0; k < roomsPer(b); k++) {
    if (b.top && f === b.f0 + b.h - 1 && k <= 1) continue;
    out.push({ key: `${b.id}-${f}-${k}`, blk: b.id, f, ...(b.cut ? { cut: true } : {}) });   // cut：入口から 歩いて 行けない 区画（住めない）
  }
  return out;
}
export const roomCount = (order, aFloors, stars) => roomsOf(shapeOf(order, aFloors, stars)).length;
// いま 建てられる 候補（動く 置き場所。2026-11-16 案 1）。part を わたすと その 種類だけ。stars は 区画 → ★（区画の 階の 上限）
const solidSet = (sh) => { const S = new Set();
  for (const b of sh.blocks) for (let f = b.f0; f < b.f0 + b.h; f++) for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) S.add(cid(f, b.x0 + i, b.z0 + j));
  if (sh.tower) for (let f = sh.tower.f0; f <= sh.tower.f1; f++) for (const z of [sh.tower.z, sh.tower.z + 1]) S.add(cid(f, sh.tower.x, z));
  for (const w of sh.walks) for (const [x, z] of w.cells) S.add(cid(w.f, x, z));
  for (const e of sh.exst) { S.add(cid(e.f, e.x, e.z)); }
  return S; };
const freeAt = (S, b, f) => { for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) if (S.has(cid(f, b.x0 + i, b.z0 + j))) return false; return true; };
const floorsOf = (b, stars) => (b.id === "A" ? A_FULL : b.legacy ? b.h : (BLUEPRINT[stars[b.id]] || BLUEPRINT[1]).floors);
// 接ぎ木の 点（案 1）：屋根の 両はしに 十字（階が そろった 箱だけ）・地面の 箱の 両はし（廊下が となりの 箱の 歩ける マスに 着く 向き）
function socketsOf(P, stars, hall = 1) {   // hall：建てる 区画の 廊下の 幅（太い 箱は はしを そろえる 側で 1 マス ずらす）
  const out = [], top = P.f0 + P.h, t = 3 + hall;
  if (P.h >= floorsOf(P, stars)) {
    if (P.ax === "x") { out.push(boxOf("z", "l", P.x0, P.z0 - 4, top, hall), boxOf("z", "r", P.x0 + P.w - t, P.z0 - 4, top, hall)); }
    else { out.push(boxOf("x", "-", P.x0 - 4, P.z0, top, hall), boxOf("x", "-", P.x0 - 4, P.z0 + P.d - t, top, hall)); }
  }
  if (P.f0 === 0) {
    if (P.ax === "x") out.push(boxOf("z", "l", P.x0 + P.w, P.z0 + P.d - 11, 0, hall), boxOf("z", "r", P.x0 - t, P.z0 + P.d - 11, 0, hall));
    else out.push(boxOf("x", "-", P.x0 - 7, P.z0 - t, 0, hall), boxOf("x", "-", P.x0 + P.w, P.z0 + P.d - t, 0, hall));
  }
  return out;
}
export function availOf(order, part, aFloors, stars = {}) {
  const sh = shapeOf(order, aFloors, stars), S = solidSet(sh), out = [], seen = new Set();
  const nextK = nextKOf(order), hall = hallOfStar(stars[nextK]);   // 建てる 区画の 太さは stars[次の 区画] の ★（なければ 廊下 1 マス）
  const put = (x) => { if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } };
  if (!part || part === "box") for (const P of sh.blocks) for (const c of socketsOf(P, stars, hall)) if (freeAt(S, c, c.f0)) put({ id: `b:${c.ax}:${c.side || "-"}:${c.x0}:${c.z0}:${c.f0}`, part: "box", blk: nextK, f: c.f0, geo: c });
  if (!part || part === "floor") for (const b of sh.blocks) if (b.id[0] === "K" && b.h < floorsOf(b, stars) && freeAt(S, b, b.f0 + b.h)) put({ id: `u:${b.id}:${b.f0 + b.h}`, part: "floor", blk: b.id, f: b.f0 + b.h });
  if (!part || part === "exst") for (const U of sh.blocks) for (const L of sh.blocks) {   // 外階段：上の 箱の 1 階と 下の 箱の いちばん 上の 階で、どちらも 歩ける マスが 重なる 所
    if (U === L || L.f0 + L.h !== U.f0) continue;
    for (let i = 0; i < U.w; i++) for (let j = 0; j < U.d; j++) { const x = U.x0 + i, z = U.z0 + j, f = U.f0 - 1;
      if (walkB(U, x, z, U.f0) && walkB(L, x, z, f) && !sh.exst.some((e) => e.f === f && e.x === x && e.z === z)) put({ id: `x:${f}:${x}:${z}`, part: "exst", f, x, z, blk: U.id }); }
  }
  if (!part || part === "walk") {   // 渡り廊下：つながって いない 区画の 歩ける マスから、まっすぐ 1〜4 マスの すき間で つながった 箱の 歩ける マスへ
    const cells = walkCells(sh);
    for (const U of sh.blocks.filter((b) => b.cut)) for (let f = U.f0; f < U.f0 + U.h; f++) for (let i = 0; i < U.w; i++) for (let j = 0; j < U.d; j++) {
      const x = U.x0 + i, z = U.z0 + j; if (!walkB(U, x, z, f)) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let k = 1; k <= 5; k++) { const id = cid(f, x + dx * k, z + dz * k);
          if (cells[id]) { const B = sh.blocks.find((b) => walkB(b, x + dx * k, z + dz * k, f)); if (k >= 2 && (!B || !B.cut)) put({ id: `w:${f}:${x + dx}:${z + dz}:${x + dx * (k - 1)}:${z + dz * (k - 1)}`, part: "walk", f, cells: lineCells(x + dx, z + dz, x + dx * (k - 1), z + dz * (k - 1)), blk: U.id }); break; }
          if (S.has(id)) break; }
      }
    }
  }
  return out;
}
// 候補の 中身（id から。九龍城塞の 見本の id も）
export function slotOf(order, id, aFloors, stars = {}) {
  const L = SLOTS.find((s) => s.id === id); if (L) return L;
  const p = String(id).split(":");
  if (p[0] === "b" && p.length === 6) { const geo = boxOf(p[1], p[2], +p[3], +p[4], +p[5], hallOfStar(stars[nextKOf(order)])); return { id, part: "box", f: geo.f0, geo }; }
  if (p[0] === "u" && p.length === 3) return { id, part: "floor", blk: p[1], f: +p[2] };
  if (p[0] === "x" && p.length === 4) return { id, part: "exst", f: +p[1], x: +p[2], z: +p[3] };
  if (p[0] === "w" && p.length === 6) return { id, part: "walk", f: +p[1], cells: lineCells(+p[2], +p[3], +p[4], +p[5]) };
  return null;
}
// 候補の 形と 値段（td.html の slotBox・slotCost と 同じ）
export function slotBox(order, x, aFloors, stars = {}) {
  if (x && !x.part) x = slotOf(order, x.id ?? x, aFloors, stars);
  const sh = shapeOf(order, aFloors, stars);
  if (x.geo) { const g = x.geo; return { x: g.x0, z: g.z0, w: g.w, d: g.d, f: g.f0, h: 1, rooms: roomsPer(g), ax: g.ax }; }
  if (x.part === "box" || x.part === "floor") { const b = sh.blocks.find((y) => y.id === x.blk) || FULL_BLOCKS.find((y) => y.id === x.blk); return { x: b.x0, z: b.z0, w: b.w, d: b.d, f: x.f, h: 1, rooms: roomsPer(b), ax: b.ax }; }
  if (x.part === "tower") { const f0 = sh.tower ? sh.tower.f1 + 1 : 0; return { x: FULL_TOWER.x, z: FULL_TOWER.z, w: 1, d: 2, f: f0, h: x.f1 - f0 + 1 }; }
  if (x.part === "walk") { const cells = x.cells || FULL_WALKS[x.w].cells, f = x.cells ? x.f : FULL_WALKS[x.w].f, xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]); return { x: Math.min(...xs), z: Math.min(...zs), w: Math.max(...xs) - Math.min(...xs) + 1, d: Math.max(...zs) - Math.min(...zs) + 1, f, h: 0, cells: cells.length }; }
  const e = x.e != null ? FULL_EXST[x.e] : x; return { x: e.x, z: e.z, w: 1, d: 1, f: e.f, h: 1 };
}
export function slotCost(order, id, aFloors, stars = {}) {
  const x = slotOf(order, id, aFloors, stars); if (!x) return null;
  const b = slotBox(order, x, aFloors, stars), sh = shapeOf(order, aFloors, stars);
  if (x.part === "box") {   // 部屋の 箱：部屋の 数 × 5,000 × 高さの 倍率。下に 何も ない マスが あれば 張り出し（箱の 1.5 倍・支えは 無料）
    const p0 = partPrice("box", b.rooms, b.f + 1);
    let over = false; if (b.f > 0) for (let i = 0; i < b.w && !over; i++) for (let j = 0; j < b.d; j++) if (!solidAt(sh, b.x + i, b.z + j, b.f - 1)) { over = true; break; }
    return over ? partPrice("overhang", 1, b.f + 1, p0) : p0;
  }
  if (x.part === "floor") return partPrice("addFloor", b.rooms, b.f + 1);
  if (x.part === "tower") return partPrice("tower", b.h);
  if (x.part === "walk") return partPrice("bridge", b.cells);
  return partPrice("stair", 1);
}
// モジュールを 置ける 廊下・階段の マス（td.html の マスの id「階:x:z」）：建物・塔の 中か 渡り廊下・外階段の マス（2026-11-15。門番の td.mod.set が 読む）
export function hallOk(sh, id) {
  const m = /^(-?\d{1,3}):(-?\d{1,3}):(-?\d{1,3})$/.exec(String(id)); if (!m) return false;
  const [f, x, z] = [+m[1], +m[2], +m[3]];
  return solidAt(sh, x, z, f) || sh.walks.some((w) => w.f === f && w.cells.some(([cx, cz]) => cx === x && cz === z)) || sh.exst.some((e) => e.x === x && e.z === z && (e.f === f || e.f + 1 === f));
}

