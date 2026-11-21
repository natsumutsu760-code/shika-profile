// 集合住宅の 防衛の 準備と、門番で もう 一度 回す 道具（2026-11-21 2 代目。鹿さんの カード「門番でもう一度回す」・modeling-log M-054）
// 門番（lounge-server/lounge-td.js の td.def.start／td.def.end）と 画面（td.html）が 同じ 式で 地図・住人・敵・手伝い・ペット・種を 作る。
// 画面は ターンごとの 指示の 記録（turns）を 送り、門番は defReplay で 同じ 戦いを 回して 勝ち負け・倒した 数・殺された 住人・戦った 子を 決める
// （前は 画面が 送る「勝った」を そのまま 信じて いた。自動の 安全確認の 指摘）。three を 使わない（node・門番・ブラウザで 動く）
import { shapeOf, walkCells, corrX, roomX } from "./td-core.js";
import { tdInit, tdOrder, tdTurn, tdAuto } from "./td-battle.js";
import { foeOf, tamedOf } from "./dungeon-sim.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { treeOfRes, TYPE_EN } from "./td-life.js";

const cid = (f, x, z) => `${f}:${x}:${z}`;
// 部屋と ドアの マス（td.html の 部屋の 並べ方と 同じ 順。てっぺんの 階の 左 2 部屋ぶんは プライベートラウンジ）
export function roomDoors(sh) {
  const out = [];
  for (const b of sh.blocks) for (let f = b.f0; f < b.f0 + b.h; f++) {
    const n = b.ax === "x" ? Math.floor((b.w - 1) / 2) : Math.floor((b.d - 1) / 2);
    for (let k = 0; k < n; k++) {
      const r = b.ax === "x" ? { rx: b.x0 + k * 2, rz: b.z0, door: [b.x0 + k * 2 + 1, b.z0 + 3] } : { rx: roomX(b), rz: b.z0 + k * 2, door: [corrX(b), b.z0 + k * 2 + 1] };
      const cut = b.cut ? { cut: true } : {};
      if (b.top && f === b.f0 + b.h - 1 && k <= 1) {
        if (k === 0) out.push({ lounge: true, blk: b.id, f, door: b.ax === "x" ? [r.rx + 3, r.door[1]] : [r.door[0], r.rz + 3], ...cut });
        continue;
      }
      out.push({ key: `${b.id}-${f}-${k}`, blk: b.id, f, door: r.door, ...cut });
    }
  }
  return out;
}
// 戦いの 地図：歩ける マス（td-core.js の walkCells）＋ 入口（土台の 廊下の 左）＋ 部屋（ドアの マスに だけ つながる）
export function defMap(sh) {
  const cells = walkCells(sh), link = (a, b) => { if (!cells[a] || !cells[b] || a === b) return; if (!cells[a].nb.includes(b)) cells[a].nb.push(b); if (!cells[b].nb.includes(a)) cells[b].nb.push(a); };
  cells.in = { nb: [] }; link("in", cid(0, -9, 4));
  for (const [id, c] of Object.entries(cells)) { if (id === "in") continue; const [f, x, z] = id.split(":").map(Number), b = sh.blocks.find((q) => x >= q.x0 && x < q.x0 + q.w && z >= q.z0 && z < q.z0 + q.d && f >= q.f0 && f < q.f0 + q.h); if (b) c.blk = b.id; }   // 区画の モジュールが 敵の いる 区画を 見る
  for (const r of roomDoors(sh)) { if (r.cut) continue; const id = r.lounge ? "room:lounge" : "room:" + r.key, d = cid(r.f, r.door[0], r.door[1]); cells[id] = { nb: [], room: true }; link(id, d); }
  return { cells, entrance: "in", lounge: "room:lounge" };
}
// 種：防衛の id から（画面と 門番で 同じ）
export function defSeed(id) { let seed = 7; for (const ch of String(id)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; return seed; }
// 住人の 写し（防衛を 始めた ときの 形。門番が T.def.res に 持つ）
export const resSnap = (key, r) => ({ key, id: r.id, name: r.name, lv: r.lv, type: r.type, ...(r.kin ? { kin: r.kin } : {}), ...(r.par ? { par: r.par } : {}) });
const foeName = (id) => ENEMY_TREES[id]?.enemy || "敵";
const TY = ["attacker", "defender", "technician", "caster", "healer"];
// 戦いの 準備（tdInit に わたす 物）。D は 門番の T.def（shape・res・foes・help・pet・mods・id）
export function defSetup(D) {
  const sh = shapeOf(D.shape.order, D.shape.fl, D.shape.stars || {}), map = defMap(sh);
  const residents = (D.res || []).map((R) => { const type = TYPE_EN[R.type] || (TY.includes(R.type) ? R.type : "attacker"), tree = treeOfRes(R);   // 受けついだ 物が ある 子は 配合と 同じ 強さ
    return { uid: R.key, home: "room:" + R.key, cell: "room:" + R.key, type, c: { ...(R.kin ? tamedOf({ ...R.kin, tree, type, lv: R.lv, name: R.name }) : foeOf({ tree, type, lv: R.lv, name: R.name })), owner: "あなた" } }; });
  const foes = (D.foes || []).map((f, k) => { const type = TYPE_EN[ENEMY_TREES[f.id]?.type] || "attacker"; return { uid: "f" + k, type, c: foeOf({ tree: f.id, type, lv: f.lv, name: foeName(f.id) }) }; });
  const helpers = (D.help || []).map((h, k) => { const type = TYPE_EN[h.c.type] || (TY.includes(h.c.type) ? h.c.type : TYPE_EN[ENEMY_TREES[h.c.tree]?.type] || "attacker");   // 手伝いの 子（送られた 写しから。自動で 動く）
    return { uid: "h" + k, type, c: { ...foeOf({ tree: h.c.tree, type, lv: h.c.lv, name: h.c.name || foeName(h.c.tree) }), owner: h.name } }; });
  const pet = { uid: "pet", type: "defender", c: D.pet ? { ...D.pet, name: "MONO ペット", owner: "あなた" } : { ...foeOf({ tree: "e_watch", type: "defender", lv: 40, name: "MONO ペット" }), owner: "あなた" } };
  return { sh, map, residents, foes, helpers, pet, seed: defSeed(D.id), mods: D.mods || {} };
}
export const defInit = (setup) => tdInit({ map: setup.map, residents: setup.residents, foes: setup.foes, pet: setup.pet, seed: setup.seed, helpers: setup.helpers, mods: setup.mods });
// 指示の 記録（1 ターン ぶん）：「a」＝ 自動（tdAuto）・配列 ＝ マニュアルの 指示 [住人の uid, { do, to?, tgt? }]
const DOS = new Set(["go", "wait", "move", "ambush", "skill", "retreat"]);
export function cleanOrder(o) {
  if (!o || typeof o !== "object" || !DOS.has(o.do)) return null;
  return { do: o.do, ...(typeof o.to === "string" && o.to.length <= 40 ? { to: o.to } : {}), ...(typeof o.tgt === "string" && o.tgt.length <= 40 ? { tgt: o.tgt } : {}) };
}
// 1 ターン 回す（画面と 門番で 同じ）。出来事から 戦った 住人を 数える
export function defStep(st, turn, fought) {
  if (turn === "a") tdAuto(st);
  else if (Array.isArray(turn)) for (const x of turn.slice(0, 80)) { if (!Array.isArray(x) || typeof x[0] !== "string") continue; const o = cleanOrder(x[1]); if (o && st.units[x[0]]) tdOrder(st, x[0], o); }
  const ev = tdTurn(st);
  if (fought) for (const e of ev) { if (e.t === "start" && e.res !== "pet") fought.add(e.res); if (e.t === "join" && e.uid !== "pet" && !String(e.uid).startsWith("f")) fought.add(e.uid); }
  return ev;
}
export const DEF_TURNS_MAX = 3000;   // 記録の ターンの 上限（九龍城塞の 強さ 5 で 約 300 ターン。それより ずっと 長い 物は 受けない）
// 門番で もう 一度 回す：結果（over：win／lose／null〈途中で ぬけた〉・倒した 数・殺された 住人・戦った 住人〈手伝いと ペットを のぞく〉）
export function defReplay(D, turns) {
  const setup = defSetup(D), st = defInit(setup), fought = new Set();
  const list = Array.isArray(turns) ? turns.slice(0, DEF_TURNS_MAX) : [];
  let n = 0;
  for (const t of list) { if (st.over) break; defStep(st, t, fought); n++; }
  const helpers = new Set(setup.helpers.map((h) => h.uid));
  return { over: st.over || null, turns: n, kills: st.beaten.length, dead: st.dead.filter((k) => k !== "pet" && !helpers.has(k)), fought: [...fought].filter((k) => k !== "pet" && !helpers.has(k)) };
}
