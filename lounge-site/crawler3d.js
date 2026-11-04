// クローラーの 迷宮（一人称の 3D）の 部品。M-012（モデリング）。
// 文字の 地図（1 区画 16×16 マス）から 3D の 迷宮を 組む。見た目は ミッションの 場所ごとに 8 つ（THEMES。資料 mono-link-crawler-battle.md）。
// ここは 絵だけ。歩ける かどうか・しかけの 決まり・数字は 持たない（システム側が 決めて、状態だけ set で 渡す）。
//
// 使い方：
//   const mz = makeMaze(rows, { theme: "mine", meta: { "5,3": { co: "sva", tier: 2 } } });
//   scene.add(mz.group); scene.background = mz.env.bg; scene.fog = mz.env.fog;
//   const p = mz.pose(x, y, dir); camera.position.copy(p.pos); camera.lookAt(p.look);   // dir 0 北・1 東・2 南・3 西
//   毎フレーム mz.tick(t, camera)（灯りが ついて くる・板が こちらを 向く・ランプが 光る・扉が 動く）
//   しかけの 状態：mz.set(x, y, "open") など（STATES）。ユニットの ドット絵の 板：mz.addBoard(url, x, y)
import * as THREE from "three";

export const CELL = 2;                                     // 1 マスの 幅（m）
export const EYE = 1.05;                                   // 目の 高さ
export const DIRV = [[0, -1], [1, 0], [0, 1], [-1, 0]];    // 0 北（上の 行）・1 東・2 南・3 西

// 地図の 文字・状態・会社と 鍵の 色は crawler-map.js（three なし）に ある
import { LEGEND, STATES, COMPANY, KEYS, OWNER } from "./crawler-map.js";
export { LEGEND, STATES, COMPANY, KEYS };

// ---- 乱数と ドット絵の 板 ----
function rng(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = (c) => (typeof c === "string" ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c);
const css = (c) => (typeof c === "string" ? c : `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
const mul = (c, f) => rgb(c).map((v) => Math.max(0, Math.min(255, v * f)));
const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return A.map((v, i) => v + (B[i] - v) * t); };

function Paint(w, h, seed) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"), R = rng(seed);
  const P = {
    w, h, R, cv,
    rect(x, y, ww, hh, c) { g.fillStyle = css(c); g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); return P; },
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (y < 0 || y >= h) return P; g.fillStyle = css(c); g.fillRect(((x % w) + w) % w, y, 1, 1); return P; },
    over(x, y, c, a) { g.globalAlpha = a; P.px(x, y, c); g.globalAlpha = 1; return P; },
    fill(c) { return P.rect(0, 0, w, h, c); },
    jit(c, a = 8) { const d = (R() - 0.5) * 2 * a; return rgb(c).map((v) => v + d); },
    noise(x0, y0, ww, hh, base, a = 8) { for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + ww; x++) P.px(x, y, P.jit(base, a)); return P; },
    pick(a) { return a[Math.floor(R() * a.length)]; },
    speck(n, c, x0 = 0, y0 = 0, ww = w, hh = h) { for (let i = 0; i < n; i++) P.px(x0 + Math.floor(R() * ww), y0 + Math.floor(R() * hh), typeof c === "function" ? c() : c); return P; },
    hl(y, c, x0 = 0, x1 = w) { return P.rect(x0, y, x1 - x0, 1, c); },
    vl(x, c, y0 = 0, y1 = h) { return P.rect(x, y0, 1, y1 - y0, c); },
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) P.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c); return P; },
    walk(x, y, n, c) { for (let i = 0; i < n; i++) { P.px(x, y, c); x += Math.round((R() - 0.5) * 2.4); y += R() < 0.75 ? 1 : 0; } return P; },   // ひび
    // かたまり（左上を 明るく・右下を 暗く）
    lump(cx, cy, rx, ry, base, hi, lo, a = 5) {
      const inn = (x, y) => (x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1;
      for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if (inn(x, y)) P.px(cx + x, cy + y, !inn(x - 1, y - 1) ? hi : !inn(x + 1, y + 1) ? lo : P.jit(base, a));
      return P;
    },
    // 下ほど よごれる
    grime(y0, y1, c, p0, p1, a = 0.35) { for (let y = y0; y < y1; y++) { const p = p0 + ((p1 - p0) * (y - y0)) / Math.max(1, y1 - y0); for (let x = 0; x < w; x++) if (R() < p) P.over(x, y, c, a); } return P; },
    // ななめの 縞（警告の 黄と 黒）
    stripes(x0, y0, ww, hh, a, b, per = 4) { for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + ww; x++) P.px(x, y, Math.floor((x + y) / per) % 2 ? a : b); return P; },
    // 四角い 板の ふち（上と 左が 明るい）
    panel(x, y, ww, hh, base, hi, lo, a = 3) { P.noise(x, y, ww, hh, base, a); P.rect(x, y, ww, 1, hi).rect(x, y, 1, hh, hi).rect(x, y + hh - 1, ww, 1, lo).rect(x + ww - 1, y, 1, hh, lo); return P; },
    text(s, x, y, c, size = 7) { g.fillStyle = css(c); g.font = `bold ${size}px monospace`; g.textBaseline = "top"; g.fillText(s, x, y); return P; },
  };
  return P;
}
function texOf(P) {
  const t = new THREE.CanvasTexture(P.cv); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; return t;
}

// ---- 形の まとめ役（頂点の 色で 色を つけ、材質ごとに 1 つに まとめる＝軽い）----
const LIT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.06, flatShading: true });
const GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });
const GLASS = new THREE.MeshStandardMaterial({ color: "#A8D8C8", roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
function Parts() {
  const L = [], G = [], stack = [new THREE.Matrix4()];
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
  const top = () => stack[stack.length - 1];
  const P = {
    push(x = 0, y = 0, z = 0, ry = 0) { stack.push(top().clone().multiply(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))); return P; },
    pop() { stack.pop(); return P; },
    add(geo, color, { at = [0, 0, 0], rot = [0, 0, 0], sc = [1, 1, 1], glow = false } = {}) {
      tmp.compose(pv.set(...at), q.setFromEuler(e.set(rot[0], rot[1], rot[2])), sv.set(...sc));
      const gg = geo.index ? geo.toNonIndexed() : geo; gg.applyMatrix4(top().clone().multiply(tmp));
      const n = gg.attributes.position.count, c = new THREE.Color(color), a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      gg.setAttribute("color", new THREE.BufferAttribute(a, 3)); (glow ? G : L).push(gg); return P;
    },
    box(w, h, d, color, at, o = {}) { return P.add(new THREE.BoxGeometry(w, h, d), color, { at, ...o }); },
    cyl(r1, r2, h, color, at, o = {}) { return P.add(new THREE.CylinderGeometry(r1, r2, h, o.seg || 8), color, { at, ...o }); },
    ball(r, color, at, o = {}) { return P.add(new THREE.IcosahedronGeometry(r, o.det ?? 0), color, { at, ...o }); },
    cone(r, h, color, at, o = {}) { return P.add(new THREE.ConeGeometry(r, h, o.seg || 6), color, { at, ...o }); },
    get empty() { return !L.length && !G.length; },
    mesh() {
      const g = new THREE.Group(), a = merge(L), b = merge(G);
      if (a) g.add(new THREE.Mesh(a, LIT)); if (b) g.add(new THREE.Mesh(b, GLOW)); return g;
    },
  };
  return P;
}
function merge(list) {
  if (!list.length) return null;
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [k, sz] of [["position", 3], ["normal", 3], ["uv", 2], ["color", 3]]) {
    const a = new Float32Array(n * sz); let o = 0;
    for (const g of list) { const s = g.attributes[k]; if (s) a.set(s.array, o); o += g.attributes.position.count * sz; }
    out.setAttribute(k, new THREE.BufferAttribute(a, sz));
  }
  out.computeBoundingSphere(); return out;
}
// 色を あとで かえる 光る 部品（ランプ・画面）
function lamp(geo, color) { return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color })); }

// ======================================================================
// 8 か所の 見た目（壁・床・天井の ドット絵、霧、灯り、飾り）
// 壁の 絵は 横 32 ドット × 高さ（H に 合わせる）。w は 出る 割合
// ======================================================================
const W32 = 32;
const P_ = {
  // 坑道の 岩
  rock(P, base = "#5B4231", hi = "#7A5C45", lo = "#3B2A1E") {
    P.noise(0, 0, P.w, P.h, base, 7);
    for (let i = 0; i < 16; i++) P.lump(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h), 2 + Math.floor(P.R() * 4), 2 + Math.floor(P.R() * 3), P.pick([mul(base, 1.08), mul(base, 0.92), base]), hi, lo);
    for (let i = 0; i < 4; i++) P.walk(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h * 0.6), 5 + Math.floor(P.R() * 10), mul(lo, 0.7));
    P.speck(14, mul(hi, 1.1)); return P;
  },
  planks(P, y0, y1, base = "#7A5232") {
    for (let y = y0; y < y1; y += 5) { P.noise(0, y, P.w, 4, P.jit(base, 10), 6); P.hl(y + 4, "#2A1A10"); for (let x = 0; x < P.w; x += 8) P.px(x + ((y / 5) % 2) * 4 + 2, y + 2, "#B89A70"); }
    return P;
  },
};
export const THEMES = {
  mine: {
    name: "坑道", en: "MINE SHAFT", H: 2.4, fog: "#1A120C", near: 2.0, far: 8.6, hemi: ["#8A6A4A", "#160E08", 0.9], light: ["#FFD2A0", 26],
    look: { frame: "#4A2E1A", door: "wood", metal: "#6A5A48", panel: "#4E4034", accent: "#FFB347", locker: "#5D6A5A" },
    walls: [
      [6, (P) => P_.rock(P)],
      [2, (P) => { P_.rock(P); P_.planks(P, 3, Math.floor(P.h * 0.62)); P.rect(0, 0, 3, P.h, "#5A3A22").rect(P.w - 3, 0, 3, P.h, "#5A3A22"); }],
      [1, (P) => { P_.rock(P); for (let i = 0; i < 3; i++) { const y = 6 + i * 4 + Math.floor(P.R() * 6); P.line(0, y, P.w, y + 6, "#B07A3A"); P.line(0, y + 1, P.w, y + 7, "#8A5A2A"); } }],
    ],
    floors: [[1, (P) => { P.noise(0, 0, P.w, P.h, "#4A3A2B", 7); for (let i = 0; i < 22; i++) P.lump(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h), 1, 1, "#6C5A47", "#86735E", "#3B2D21"); P.speck(10, "#2E2219"); }]],
    ceil: (P) => P_.rock(P, "#3E2C20", "#55402F", "#261A12"),
    dress: dressMine,
  },
  plant: {
    name: "発電所", en: "POWER PLANT", H: 3.0, fog: "#0C1317", near: 2.0, far: 8.8, hemi: ["#5A7A8A", "#0A0E10", 0.8], light: ["#D8F0FF", 30],
    look: { frame: "#2C3338", door: "steel", metal: "#4A555C", panel: "#5C6870", accent: "#36C8F0", locker: "#46606E" },
    walls: [
      [6, (P) => wallPlant(P)],
      [1, (P) => { wallPlant(P); const cx = 16, cy = Math.floor(P.h * 0.36); for (let y = 0; y < 9; y++) for (let x = -y; x <= y; x++) P.px(cx + x * 0.6, cy - 4 + y, y === 8 || Math.abs(x) === y ? "#1B1D1B" : "#F2C200"); P.line(cx + 1, cy - 2, cx - 1, cy + 1, "#1B1D1B").line(cx - 1, cy + 1, cx + 1, cy + 1, "#1B1D1B").line(cx + 1, cy + 1, cx - 1, cy + 4, "#1B1D1B"); }],
      [1, (P) => { wallPlant(P); for (const vx of [4, 19]) { P.rect(vx, Math.floor(P.h * 0.2), 9, 9, "#15191C"); for (let y = 1; y < 9; y += 2) P.rect(vx + 1, Math.floor(P.h * 0.2) + y, 7, 1, "#56626A"); } }],
    ],
    floors: [[1, (P) => { P.fill("#14181B"); for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) if (x % 4 === 0 || y % 4 === 0) P.px(x, y, P.jit(x % 4 === 0 && y % 4 === 0 ? "#5A666E" : "#3E484F", 5)); P.speck(8, "#6A4A2A"); }]],
    ceil: (P) => { P.noise(0, 0, P.w, P.h, "#1C2226", 4); for (const x of [6, 7, 24, 25]) P.vl(x, "#2E363C"); for (let y = 0; y < P.h; y += 6) P.hl(y, "#262E33", 5, 9).hl(y, "#262E33", 23, 27); },
    dress: dressPlant,
  },
  lab: {
    name: "研究所", en: "LABORATORY", H: 2.6, fog: "#9EABB0", near: 2.4, far: 9.0, hemi: ["#EEF6F6", "#B4C0C2", 1.5], light: ["#F2FBFF", 16],
    look: { frame: "#C9D1CE", door: "lab", metal: "#AEBDBB", panel: "#EEF1EF", accent: "#2EC4B6", locker: "#C3CCCB" },
    walls: [
      [6, (P) => wallLab(P)],
      [2, (P) => { wallLab(P); const y0 = Math.floor(P.h * 0.24), y1 = Math.floor(P.h * 0.6); P.rect(2, y0 - 1, 28, y1 - y0 + 2, "#B9C2BF"); for (let y = y0; y < y1; y++) P.rect(3, y, 26, 1, mixc("#36606C", "#1B3540", (y - y0) / (y1 - y0))); for (let i = 0; i < 2; i++) P.line(6 + i * 9, y1 - 2, 12 + i * 9, y0 + 1, "#6E9CA8"); P.rect(3, y1 - 5, 26, 1, "#20363E"); for (let x = 5; x < 28; x += 4) P.rect(x, y1 - 8, 2, 3, P.pick(["#5FB8B0", "#C9A44C", "#8FA0A8"])); }],
      [1, (P) => { wallLab(P); const cy = Math.floor(P.h * 0.38); for (let a = 0; a < 40; a++) P.px(16 + Math.cos(a / 6.37) * 5, cy + Math.sin(a / 6.37) * 5, "#2EC4B6"); P.lump(17, cy + 1, 2, 2, "#2EC4B6", "#7FF2E6", "#1E8C82"); P.speck(5, "#2EC4B6", 12, cy - 3, 8, 7); for (let i = 0; i < 3; i++) P.rect(10, cy + 8 + i * 2, 12 - i * 3, 1, "#9AA6A4"); }],
    ],
    floors: [[1, (P) => { P.fill("#BCC4C1"); for (let ty = 0; ty < P.h; ty += 8) for (let tx = 0; tx < P.w; tx += 8) P.noise(tx, ty, 7, 7, P.R() < 0.15 ? "#CCD3D0" : "#D9DEDC", 2); P.speck(6, "#AEB7B4"); }]],
    ceil: (P) => { P.noise(0, 0, P.w, P.h, "#E3E8E6", 2); for (let i = 0; i < P.w; i += 16) P.vl(i, "#C3CBC8"); for (let i = 0; i < P.h; i += 16) P.hl(i, "#C3CBC8"); },
    dress: dressLab,
  },
  greenhouse: {
    name: "試験場（温室）", en: "TEST GREENHOUSE", H: 3.2, fog: "#8FA58C", near: 2.4, far: 9.0, hemi: ["#E8F6D8", "#3A4A34", 1.4], light: ["#FFFBE8", 14],
    look: { frame: "#2F5A3A", door: "glass", metal: "#5E7A64", panel: "#7D9A82", accent: "#5E9E3A", locker: "#5C7A62" },
    walls: [
      [5, (P) => wallGlass(P)],
      [2, (P) => { wallGlass(P); const y0 = Math.floor(P.h * 0.56); P.noise(0, y0, P.w, P.h - y0, "#858780", 5); P.hl(y0, "#9A9C94"); P.grime(y0, P.h, "#4A5A40", 0.05, 0.4); }],
      [1, (P) => { wallGlass(P); const y = Math.floor(P.h * 0.4); P.rect(7, y, 18, 10, "#5E9E3A").rect(7, y, 18, 1, "#86C25E"); P.line(9, y + 8, 22, y + 2, "#E4F2D8"); for (const k of [11, 15, 19]) P.line(k, y + 6 - (k - 11) / 3, k + 2, y + 8 - (k - 11) / 3, "#E4F2D8"); }],
    ],
    floors: [
      [4, (P) => wetFloor(P)],
      [1, (P) => { wetFloor(P); P.rect(12, 12, 8, 8, "#2A2E2A"); for (let y = 13; y < 20; y += 2) P.rect(13, y, 6, 1, "#4A504A"); }],   // 排水口（ときどき）
    ],
    ceil: (P) => { P.fill("#D6E8D2"); for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) if (x % 16 === 0 || y % 16 === 0) P.px(x, y, "#3F6A4A"); else if (x % 8 === 0 || y % 8 === 0) P.px(x, y, "#9CB89C"); P.line(2, 30, 14, 2, "#EEF8EC"); },
    ceilUnlit: true,
    dress: dressGreenhouse,
  },
  warehouse: {
    name: "倉庫", en: "WAREHOUSE", H: 3.6, fog: "#26221E", near: 2.2, far: 8.8, hemi: ["#C8B28A", "#14110E", 0.9], light: ["#FFE6BE", 30],
    look: { frame: "#3A3F44", door: "steel", metal: "#6F767C", panel: "#8A9096", accent: "#D08A2E", locker: "#4E6A86" },
    walls: [
      [6, (P) => wallWare(P)],
      [1, (P) => { P.fill("#3A3F44"); const y0 = 6; for (let y = y0; y < P.h - 3; y++) P.rect(1, y, P.w - 2, 1, (y - y0) % 3 === 0 ? "#6F767C" : P.jit("#8B9196", 3)); P.stripes(1, P.h - 4, P.w - 2, 3, "#F2C200", "#1B1D1B"); P.rect(10, Math.floor(P.h * 0.35), 12, 7, "#D9B23A"); P.text("07", 11, Math.floor(P.h * 0.35), "#1B1D1B", 8); P.grime(Math.floor(P.h * 0.6), P.h, "#2A2622", 0.05, 0.3); }],
      [1, (P) => { wallWare(P); const y = Math.floor(P.h * 0.62); P.rect(9, y, 14, 9, "#E0B530"); P.rect(15, y + 2, 2, 5, "#1B1D1B"); P.line(12, y + 4, 16, y + 1, "#1B1D1B").line(20, y + 4, 16, y + 1, "#1B1D1B"); }],
    ],
    floors: [[1, (P) => { P.noise(0, 0, P.w, P.h, "#8A877F", 3); for (let i = 0; i < 2; i++) P.lump(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h), 3 + Math.floor(P.R() * 3), 2, "#76736C", "#7E7B74", "#6E6B64", 2); P.walk(Math.floor(P.R() * 32), 0, 12, "#6E6B64"); }]],
    ceil: (P) => { P.noise(0, 0, P.w, P.h, "#24272B", 3); P.line(0, 0, 31, 31, "#3A3E43").line(0, 31, 31, 0, "#3A3E43"); P.hl(0, "#3A3E43").hl(31, "#3A3E43"); },
    dress: dressWarehouse,
  },
  building: {
    name: "建てかけの ビル", en: "UNFINISHED TOWER", H: 2.9, fog: "#2C2E33", near: 2.2, far: 8.8, hemi: ["#B8BCC4", "#1A1A1C", 1.0], light: ["#FFF0D8", 24],
    look: { frame: "#6E6C68", door: "steel", metal: "#7A7C80", panel: "#9A9890", accent: "#9A3A44", locker: "#6A7280" },
    walls: [
      [5, (P) => wallConcrete(P)],
      [2, (P) => { wallConcrete(P); const cx = 8 + Math.floor(P.R() * 16), cy = Math.floor(P.h * 0.45); P.lump(cx, cy, 7, 6, "#3A3936", "#A8A7A2", "#2A2927", 2); for (let i = -6; i <= 6; i += 3) { P.line(cx + i, cy - 6, cx + i, cy + 6, "#8A5A3A"); P.line(cx - 7, cy + i, cx + 7, cy + i, "#7A4E32"); } P.lump(cx, cy, 7, 6, "#3A3936", "#A8A7A2", "#2A2927", 2); for (let i = -6; i <= 6; i += 3) { P.line(cx + i, cy - 5, cx + i, cy + 5, "#9A6A44"); P.line(cx - 6, cy + i, cx + 6, cy + i, "#7A4E32"); } }],
      [2, (P) => { P.fill("#2F5F9E"); for (let i = 0; i < 6; i++) { const x = Math.floor(P.R() * 32); P.line(x, 0, x + 6 - Math.floor(P.R() * 12), P.h, P.R() < 0.5 ? "#4878B8" : "#24497A"); } for (let x = 3; x < 32; x += 9) P.px(x, 2, "#C8C8C8").px(x, P.h - 3, "#C8C8C8"); P.grime(Math.floor(P.h * 0.7), P.h, "#1E2A3A", 0.05, 0.4); }],
    ],
    floors: [[1, (P) => { P.noise(0, 0, P.w, P.h, "#7B7973", 5); P.speck(30, "#8E8C86"); if (P.R() < 0.5) P.line(3, 20, 28, 22, "#C9C6BD"); if (P.R() < 0.4) P.lump(Math.floor(P.R() * 32), Math.floor(P.R() * 32), 5, 3, "#4F5258", "#6A6E74", "#45484E", 2); }]],
    ceil: (P) => { for (let y = 0; y < P.h; y++) P.rect(0, y, P.w, 1, y % 6 < 3 ? P.jit("#6F6D68", 3) : P.jit("#5A5854", 3)); P.speck(10, "#4A4844"); },
    dress: dressBuilding,
  },
  rail: {
    name: "地下の 線路", en: "UNDERGROUND RAIL", H: 2.8, fog: "#0A0F0D", near: 1.8, far: 8.4, hemi: ["#7A9A8A", "#080A09", 0.8], light: ["#F0FFE8", 28],
    look: { frame: "#3A403C", door: "steel", metal: "#55605A", panel: "#6A766E", accent: "#45E08A", locker: "#3E5A4E" },
    walls: [
      [5, (P) => wallTiles(P)],
      [1, (P) => { wallTiles(P); const y = Math.floor(P.h * 0.26); P.rect(3, y, 26, 8, "#1D2B44").rect(3, y, 26, 1, "#3A4E70"); P.lump(8, y + 4, 2, 2, "#E8E8E8", "#FFFFFF", "#B8B8B8"); P.rect(12, y + 3, 14, 1, "#E8E8E8").rect(12, y + 5, 9, 1, "#9AA8C0"); }],
      [2, (P) => { P.noise(0, 0, P.w, P.h, "#5F615E", 5); for (let i = 0; i < 4; i++) P.rect(0, 5 + i * 2, P.w, 1, P.pick(["#252826", "#3A2E24", "#1E2A24"])); for (let x = 4; x < 32; x += 12) P.rect(x, 4, 2, 9, "#3A3C3A"); P.grime(Math.floor(P.h * 0.5), P.h, "#1A1C1A", 0.05, 0.45); P.walk(Math.floor(P.R() * 32), 14, 14, "#3E403D"); }],
    ],
    floors: [
      [1, (P) => { P.noise(0, 0, P.w, P.h, "#4A4641", 6); for (let i = 0; i < 70; i++) P.lump(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h), 1, 1, P.pick(["#6A655E", "#57524C", "#7A756D"]), "#8A857D", "#3A3631", 3); }, "hall"],
      [1, (P) => { P.noise(0, 0, P.w, P.h, "#7E7B74", 4); P.rect(0, 0, P.w, 1, "#5A5852"); P.walk(Math.floor(P.R() * 32), 0, 18, "#66635D"); P.speck(10, "#5E5B55"); }, "room"],
    ],
    ceil: (P) => { P.noise(0, 0, P.w, P.h, "#2B2D2B", 4); P.walk(Math.floor(P.R() * 32), 0, 20, "#202220"); P.grime(0, P.h, "#121412", 0.1, 0.1); },
    dress: dressRail,
  },
  harbor: {
    name: "港の 台場", en: "HARBOR BATTERY", H: 3.0, fog: "#2E3E4C", near: 2.4, far: 9.2, hemi: ["#9AB4CC", "#1A2128", 1.2], light: ["#FFE8C8", 18],
    look: { frame: "#4A4E52", door: "gate", metal: "#4C5458", panel: "#5E666C", accent: "#FFC46B", locker: "#7A3A30" },
    walls: [
      [5, (P) => wallStone(P)],
      [2, (P) => { P.fill("#72302A"); for (let x = 0; x < P.w; x++) P.vl(x, x % 4 === 0 ? "#A04535" : x % 4 === 2 ? "#5E2822" : P.jit("#8D3B2F", 4), 2, P.h - 2); P.rect(0, 0, P.w, 2, "#3A2420").rect(0, P.h - 2, P.w, 2, "#3A2420"); P.speck(40, "#6B4A2A"); P.rect(4, Math.floor(P.h * 0.3), 24, 2, "#D8D4CC"); P.grime(Math.floor(P.h * 0.6), P.h, "#3A2A20", 0.05, 0.4); }],
      [1, (P) => { wallStone(P); const cy = Math.floor(P.h * 0.5); for (let a = 0; a < 30; a++) P.px(16 + Math.cos(a / 4.8) * 4, cy + 4 + Math.sin(a / 4.8) * 4, a % 5 ? "#3A3A38" : "#7A4A2A"); P.rect(14, cy - 2, 4, 3, "#2A2A28"); P.walk(17, cy + 8, 9, "#6A4A2A"); }],
    ],
    floors: [[1, (P) => { for (let ty = 0; ty < P.h; ty += 16) for (let tx = 0; tx < P.w; tx += 16) P.panel(tx, ty, 16, 16, P.pick(["#5D6268", "#575C62", "#62676C"]), "#6E747A", "#3E4246", 4); P.speck(14, "#7D8792"); if (P.R() < 0.4) P.lump(8 + Math.floor(P.R() * 16), 8 + Math.floor(P.R() * 16), 5, 3, "#3F4A55", "#56636E", "#3A444E", 2); }]],
    ceil: null,
    dress: dressHarbor,
  },
};

function wetFloor(P) { P.noise(0, 0, P.w, P.h, "#6C706A", 5); for (let i = 0; i < 4; i++) P.lump(Math.floor(P.R() * P.w), Math.floor(P.R() * P.h), 4, 3, "#5C615B", "#5C615B", "#555A54", 2); P.speck(16, "#4D7A3C"); P.walk(Math.floor(P.R() * 32), 0, 14, "#4D7A3C"); }
function wallPlant(P) {
  const yS = Math.floor(P.h * 0.45);
  for (const [x0, ww] of [[0, 16], [16, 16]]) { P.panel(x0, 0, ww, yS, "#3B444B", "#4F5A62", "#262D32"); P.panel(x0, yS, ww, P.h - yS - 5, "#363F45", "#4A545C", "#232A2E"); }
  for (const x of [2, 13, 18, 29]) for (const y of [2, yS - 3, yS + 2]) P.px(x, y, "#6B7780");
  P.hl(P.h - 6, "#15191C"); P.stripes(0, P.h - 5, P.w, 5, "#E8B800", "#1B1D1B");
  P.grime(Math.floor(P.h * 0.6), P.h - 5, "#101315", 0.03, 0.25);
}
function wallLab(P) {
  P.noise(0, 0, P.w, P.h, "#E6E9E6", 2);
  P.vl(0, "#C3CAC7").vl(16, "#C3CAC7"); P.hl(Math.floor(P.h * 0.56), "#CDD3D0");
  P.rect(0, P.h - 3, P.w, 3, "#8FA3A2"); P.hl(P.h - 4, "#B5C2C1"); P.rect(0, 0, P.w, 2, "#D0D6D3");
}
function wallGlass(P) {
  for (let y = 0; y < P.h; y++) P.rect(0, y, P.w, 1, mixc("#B4CFB0", "#78A07C", y / P.h));
  for (let i = 0; i < 14; i++) { const y = Math.floor(P.h * 0.35 + P.R() * P.h * 0.65); P.lump(Math.floor(P.R() * P.w), y, 2 + Math.floor(P.R() * 3), 2 + Math.floor(P.R() * 2), P.pick(["#5D8A5C", "#4C7A4E", "#6A9A62"]), "#8AB884", "#3E6640", 6); }
  P.line(3, P.h - 4, 12, 3, "#E2F0E0").line(5, P.h - 4, 14, 3, "#CFE4CC").line(20, P.h - 6, 27, 6, "#DCEDD9");
  P.rect(0, 0, 2, P.h, "#2F5A3A").rect(15, 0, 2, P.h, "#2F5A3A").rect(0, 0, P.w, 2, "#2F5A3A");
  P.rect(0, Math.floor(P.h * 0.33), P.w, 1, "#2F5A3A").rect(0, Math.floor(P.h * 0.66), P.w, 1, "#2F5A3A");
  P.rect(0, P.h - 4, P.w, 4, "#6E7069").hl(P.h - 4, "#3E5A44");
}
function wallWare(P) {
  const yB = Math.floor(P.h * 0.6);
  for (let x = 0; x < P.w; x++) P.vl(x, x % 3 === 0 ? "#77858F" : x % 3 === 2 ? "#46515B" : P.jit("#5E6B77", 3), 0, yB);
  P.rect(0, yB, P.w, 2, "#3A3F44");
  for (let y = yB + 2, r = 0; y < P.h; y += 4, r++) for (let x = -(r % 2) * 4; x < P.w; x += 8) { P.panel(x, y, 8, 4, P.pick(["#7B786F", "#75726A", "#807D74"]), "#8E8B82", "#5D5A53", 3); }
  P.grime(Math.floor(P.h * 0.75), P.h, "#2A2622", 0.05, 0.3);
}
function wallConcrete(P) {
  P.noise(0, 0, P.w, P.h, "#8E8D88", 5);
  const ph = Math.floor(P.h / 3);
  for (let y = 0; y < P.h; y += ph) P.hl(y, "#777671"); P.vl(0, "#777671"); P.vl(16, "#777671");
  for (let y = 4; y < P.h; y += ph) for (const x of [4, 12, 20, 28]) P.rect(x, y, 2, 2, "#4D4C49");
  for (let i = 0; i < 5; i++) { const x = Math.floor(P.R() * 32); P.rect(x, Math.floor(P.R() * 8), 1, 6 + Math.floor(P.R() * 14), "#7A7974"); }
  P.grime(Math.floor(P.h * 0.7), P.h, "#4A4844", 0.05, 0.35);
}
function wallTiles(P) {
  P.fill("#9B9682");
  for (let y = 3; y < P.h; y += 3) for (let x = ((y / 3) % 2) * 2; x < P.w + 4; x += 4) {
    const band = Math.abs(y - Math.floor(P.h * 0.48)) < 3;
    P.noise(x, y, 3, 2, band ? "#2F6B4F" : P.R() < 0.04 ? "#5A5648" : "#D6D0B9", 4);
  }
  P.noise(0, 0, P.w, 3, "#5F615E", 4);
  P.grime(Math.floor(P.h * 0.55), P.h, "#2A2820", 0.08, 0.6, 0.45);
}
function wallStone(P) {
  for (let y = 0, r = 0; y < P.h; y += 8, r++) {
    let x = -(r % 2) * 7;
    while (x < P.w) { const bw = 10 + Math.floor(P.R() * 7); P.panel(x, y, bw, 8, P.pick(["#6E7378", "#666B70", "#74797D", "#5F6468"]), "#868B90", "#45494D", 5); P.vl(x, "#3B3F43", y, y + 8); x += bw; }
    P.hl(y, "#3B3F43");
  }
  P.grime(Math.floor(P.h * 0.65), P.h, "#3C5A44", 0.05, 0.55, 0.45);
  P.grime(P.h - 4, P.h, "#22302A", 0.5, 0.8, 0.5);
}

// ======================================================================
// 迷宮を 組む
// ======================================================================
export function makeMaze(rows, { theme = "mine", meta = {}, seed = 7 } = {}) {
  const th = THEMES[theme] || THEMES.mine, H = th.H;
  const GH = rows.length, GW = rows[0].length;
  const at = (x, y) => (y < 0 || y >= GH || x < 0 || x >= GW ? "#" : rows[y][x]);
  const open = (x, y) => at(x, y) !== "#";
  const hash = (x, y, k = 0) => { let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(k, 83492791) ^ Math.imul(seed, 2654435761); h = Math.imul(h ^ (h >>> 16), 0x7feb352d); h = Math.imul(h ^ (h >>> 15), 0x846ca68b); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };   // よく 混ざる 形（左右の 壁が そろわない）
  const cx = (x) => (x + 0.5) * CELL, cz = (y) => (y + 0.5) * CELL;
  const group = new THREE.Group(); group.name = "maze";

  // ---- マスの 形（まっすぐの 通路・部屋）----
  const kind = (x, y) => {
    const n = open(x, y - 1), s = open(x, y + 1), e = open(x + 1, y), w = open(x - 1, y), c = n + s + e + w;
    if (n && s && !e && !w) return "ns"; if (e && w && !n && !s) return "ew";
    return c >= 3 ? "room" : c <= 1 ? "end" : "turn";
  };
  const isRoom = (x, y) => kind(x, y) === "room" || [[0, 0], [1, 0], [0, 1], [1, 1]].some(([a, b]) => open(x - a, y - b) && open(x + 1 - a, y - b) && open(x - a, y + 1 - b) && open(x + 1 - a, y + 1 - b));

  // ---- 壁・床・天井（絵の 種類ごとに 1 つに まとめる）----
  const th32 = Math.round((W32 * H) / CELL);
  const pickW = (list, r) => { const tot = list.reduce((s, a) => s + a[0], 0); let v = r * tot; for (let i = 0; i < list.length; i++) { v -= list[i][0]; if (v <= 0) return i; } return list.length - 1; };
  const wallMats = th.walls.map((w, i) => { const P = Paint(W32, th32, seed * 100 + i); w[1](P); return new THREE.MeshStandardMaterial({ map: texOf(P), roughness: 0.92 }); });
  const floorMats = th.floors.map((f, i) => { const P = Paint(W32, W32, seed * 200 + i); f[1](P); return new THREE.MeshStandardMaterial({ map: texOf(P), roughness: theme === "lab" ? 0.45 : 0.95 }); });
  let ceilMat = null;
  if (th.ceil) { const P = Paint(W32, W32, seed * 300); th.ceil(P); ceilMat = th.ceilUnlit ? new THREE.MeshBasicMaterial({ map: texOf(P), color: "#E8EEE6" }) : new THREE.MeshStandardMaterial({ map: texOf(P), roughness: 0.95 }); }
  const wallG = wallMats.map(() => []), floorG = floorMats.map(() => []), ceilG = [];
  const faces = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (!open(x, y)) continue;
    DIRV.forEach(([dx, dy], d) => {
      if (open(x + dx, y + dy)) return;
      const g = new THREE.PlaneGeometry(CELL, H); g.rotateY(Math.atan2(-dx, -dy)); g.translate(cx(x) + (dx * CELL) / 2, H / 2, cz(y) + (dy * CELL) / 2);
      wallG[pickW(th.walls, hash(x, y, 10 + d))].push(g); faces.push({ x, y, d });
    });
    const room = isRoom(x, y);
    const fl = th.floors.map((f, i) => [f[2] ? (f[2] === (room ? "room" : "hall") ? f[0] : 0) : f[0], i]);
    const fi = pickW(fl.map((a) => [a[0], null]), hash(x, y, 3));
    const g = new THREE.PlaneGeometry(CELL, CELL); g.rotateX(-Math.PI / 2); g.rotateY((Math.floor(hash(x, y, 4) * 4) * Math.PI) / 2); g.translate(cx(x), 0, cz(y)); floorG[fi].push(g);
    if (ceilMat) { const c = new THREE.PlaneGeometry(CELL, CELL); c.rotateX(Math.PI / 2); c.translate(cx(x), H, cz(y)); ceilG.push(c); }
  }
  const addMerged = (list, m, name) => { const a = merge(list.map((g) => g.index ? g.toNonIndexed() : g)); if (!a) return null; const me = new THREE.Mesh(a, m); me.name = name || ""; group.add(me); return me; };
  wallG.forEach((l, i) => addMerged(l, wallMats[i], "wall")); floorG.forEach((l, i) => addMerged(l, floorMats[i], "floor")); const ceil = ceilMat ? addMerged(ceilG, ceilMat, "ceil") : null;

  // ---- 飾り（動かない 物は ぜんぶ 1 つに）----
  const S = Parts();
  const plainFaces = faces.filter((f) => ".SE".includes(at(f.x, f.y))), wallFaces = faces.filter((f) => !"DBK".includes(at(f.x, f.y)));
  const ctx = {
    th, H, S, at, open, kind, isRoom, hash, faces: wallFaces, plain: plainFaces, GW, GH, cx, cz,
    // 壁の 面に 立つ（x は 壁に そって 右へ・z は 壁から 部屋の 方へ）
    onFace(f, fn) { const [dx, dy] = DIRV[f.d]; S.push(cx(f.x) + (dx * CELL) / 2, 0, cz(f.y) + (dy * CELL) / 2, Math.atan2(-dx, -dy)); fn(); S.pop(); },
    // マスの まん中に 立つ（ry：0 なら z の 向き＝南北の 通路）
    onCell(x, y, ry, fn) { S.push(cx(x), 0, cz(y), ry); fn(); S.pop(); },
  };
  th.dress(ctx);
  // 屋根が ない 所（港）は 壁の 上を ふさぐ
  if (!th.ceil) for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (open(x, y)) continue;
    let near = false; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (open(x + a, y + b)) near = true;
    if (!near) continue;
    S.box(CELL, 0.3, CELL, "#4E5358", [cx(x), H + 0.15, cz(y)]);
    if ((x + y) % 2 === 0) S.box(0.8, 0.45, 0.8, "#5A5F64", [cx(x), H + 0.52, cz(y)]);
  }
  group.add(S.mesh());
  // 上から 見る ときだけ 出す 壁の 天面（見本の 確かめ用）
  const T = Parts();
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (!open(x, y)) T.box(CELL, 0.02, CELL, th.walls.length ? mixHex(th.look.frame, "#000000", 0.35) : "#222", [cx(x), H + 0.6, cz(y)]);
  const tops = T.mesh(); tops.visible = false; group.add(tops);

  // ---- しかけ（状態が かわる 物は 1 つずつ）----
  const objs = new Map();
  const wallDir = (x, y) => {   // 物を 寄せる 壁（左右の 壁を 先に）
    const ws = [0, 1, 2, 3].filter((d) => !open(x + DIRV[d][0], y + DIRV[d][1]));
    if (!ws.length) return -1;
    const k = kind(x, y), side = ws.filter((d) => (k === "ns" ? d % 2 === 1 : k === "ew" ? d % 2 === 0 : true));
    const list = side.length ? side : ws; return list[Math.floor(hash(x, y, 5) * list.length)];
  };
  const axis = (x, y) => (!open(x - 1, y) && !open(x + 1, y) ? 0 : !open(x, y - 1) && !open(x, y + 1) ? Math.PI / 2 : open(x, y - 1) || open(x, y + 1) ? 0 : Math.PI / 2);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const ch = at(x, y), make = PROPS[ch]; if (!make) continue;
    const m = meta[`${x},${y}`] || {};
    const o = make({ th, H, m, theme, x, y, hash: (k) => hash(x, y, 40 + k) });
    const mount = MOUNT[ch] || "center";
    if (mount === "wall") {
      const d = m.wall ?? wallDir(x, y);
      if (d < 0) { o.group.position.set(cx(x), 0, cz(y)); }
      else { const [dx, dy] = DIRV[d]; o.group.position.set(cx(x) + (dx * CELL) / 2, 0, cz(y) + (dy * CELL) / 2); o.group.rotation.y = Math.atan2(-dx, -dy); }
    } else if (mount === "axis") { o.group.position.set(cx(x), 0, cz(y)); o.group.rotation.y = axis(x, y); }
    else { o.group.position.set(cx(x), 0, cz(y)); o.group.rotation.y = m.ry ?? (axis(x, y) + (ch === "C" || ch === "w" ? (hash(x, y, 9) - 0.5) * 0.5 : 0)); }
    o.ch = ch; o.state = STATES[ch] ? STATES[ch][0] : null;
    if (m.state !== undefined) { o.state = m.state; o.set?.(m.state); }
    if (o.k !== undefined) o.v = o.k;   // はじめは 動かさずに その 形
    o.tick?.(0, o.v);
    group.add(o.group); objs.set(`${x},${y}`, o);
  }

  // ---- 灯り・霧 ----
  const hemi = new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.hemi[2]); group.add(hemi);
  const light = new THREE.PointLight(th.light[0], th.light[1] * 0.22, CELL * 6, 1.1); group.add(light);   // 近くを 白く 飛ばさない ように 弱まり方を ゆるく
  const env = { bg: new THREE.Color(th.fog), fog: new THREE.Fog(th.fog, th.near, th.far) };

  // ---- ユニットの 板（ドット絵）----
  const boards = [];
  function addBoard(url, x, y, { h = 1.3, off = 0 } = {}) {
    const tex = new THREE.TextureLoader().load(url); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Group();
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(h, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, roughness: 1, side: THREE.DoubleSide }));
    pl.position.y = h / 2; b.add(pl);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(h * 0.32, 16), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.35, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; b.add(sh);
    b.position.set(cx(x) + off, 0, cz(y)); group.add(b); boards.push(b); return b;
  }

  let last = 0;
  return {
    group, env, theme: th, rows, objs, light, ceil, tops, hemi,
    at, open, kind,
    pose(x, y, d, back = 0.2) {   // マスの 少し 後ろ（背中の 壁から 0.6m。壁ぎわの 飾りは 奥行き 0.5m まで に する）
      const [dx, dy] = DIRV[d];
      return { pos: new THREE.Vector3(cx(x) - dx * CELL * back, EYE, cz(y) - dy * CELL * back), look: new THREE.Vector3(cx(x) + dx * CELL * 2, EYE * 0.9, cz(y) + dy * CELL * 2) };
    },
    center(x, y) { return new THREE.Vector3(cx(x), 0, cz(y)); },
    set(x, y, s) { const o = objs.get(`${x},${y}`); if (!o) return false; o.state = s; o.set?.(s); return true; },
    get(x, y) { return objs.get(`${x},${y}`)?.state; },
    addBoard,
    tick(t, cam) {
      const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
      if (cam) { light.position.copy(cam.position); light.position.y += 0.25; for (const b of boards) b.rotation.y = Math.atan2(cam.position.x - b.position.x, cam.position.z - b.position.z); }
      for (const o of objs.values()) { if (o.k !== undefined && o.v !== o.k) o.v += (o.k - o.v) * Math.min(1, dt * 5); o.tick?.(t, o.v); }
    },
  };
}

// ======================================================================
// 飾り（場所ごと）
// ======================================================================
function eachHall(ctx, fn) { for (let y = 0; y < ctx.GH; y++) for (let x = 0; x < ctx.GW; x++) if (ctx.at(x, y) === "." || ctx.at(x, y) === "S" || ctx.at(x, y) === "E") { const k = ctx.kind(x, y); fn(x, y, k); } }
const along = (k) => (k === "ew" ? Math.PI / 2 : 0);

function rails(ctx, gauge, railC, sleeperC, step, sw) {
  eachHall(ctx, (x, y, k) => {
    if (k !== "ns" && k !== "ew") return;
    ctx.onCell(x, y, along(k), () => {
      for (const s of [-1, 1]) ctx.S.box(0.07, 0.07, CELL, railC, [s * gauge / 2, 0.08, 0]);
      for (let z = -CELL / 2 + step / 2; z < CELL / 2; z += step) ctx.S.box(sw, 0.05, 0.16, sleeperC, [0, 0.025, z]);
    });
  });
}
function dressMine(ctx) {
  const { S, H } = ctx;
  rails(ctx, 0.62, "#6A6058", "#4A3424", 0.5, 0.95);
  eachHall(ctx, (x, y, k) => {
    if ((k !== "ns" && k !== "ew") || (x + y) % 2) return;
    ctx.onCell(x, y, along(k), () => {
      for (const s of [-1, 1]) { S.box(0.2, H, 0.2, "#563620", [s * (CELL / 2 - 0.1), H / 2, 0]); S.box(0.24, 0.12, 0.24, "#4A2E1A", [s * (CELL / 2 - 0.1), 0.06, 0]); }
      S.box(CELL, 0.2, 0.22, "#4C301C", [0, H - 0.1, 0]);
      if (ctx.hash(x, y, 1) < 0.55) { S.box(0.02, 0.25, 0.02, "#222", [0.3, H - 0.32, 0]); S.box(0.16, 0.2, 0.16, "#3A2A1A", [0.3, H - 0.52, 0]); S.box(0.1, 0.13, 0.1, "#FFB347", [0.3, H - 0.52, 0], { glow: true }); S.cyl(0.1, 0.1, 0.03, "#2A1E14", [0.3, H - 0.4, 0]); }
    });
  });
  for (const f of ctx.plain) if (ctx.hash(f.x, f.y, 20 + f.d) < 0.35) ctx.onFace(f, () => { const r = ctx.hash(f.x, f.y, 21 + f.d); S.ball(0.12 + r * 0.14, "#4A3628", [(r - 0.5) * 1.4, 0.06, 0.18], { sc: [1.3, 0.7, 1] }); });
}
function dressPlant(ctx) {
  const { S, H } = ctx;
  for (const f of ctx.faces) ctx.onFace(f, () => {
    S.cyl(0.09, 0.09, CELL, "#5D6A72", [0, H - 0.42, 0.16], { rot: [0, 0, Math.PI / 2] });
    S.cyl(0.06, 0.06, CELL, "#2F6F8F", [0, H - 0.72, 0.12], { rot: [0, 0, Math.PI / 2] });
    S.cyl(0.12, 0.12, 0.06, "#47525A", [CELL / 2 - 0.05, H - 0.42, 0.16], { rot: [0, 0, Math.PI / 2] });
    for (const bx of [-0.6, 0.6]) S.box(0.05, 0.38, 0.22, "#2A3136", [bx, H - 0.55, 0.11]);
    if (ctx.plain.includes(f) && ctx.hash(f.x, f.y, 30 + f.d) < 0.28) {
      S.box(0.42, 0.55, 0.16, "#4F5C64", [0.2, 1.45, 0.08]); S.box(0.36, 0.08, 0.02, "#2A3136", [0.2, 1.62, 0.17]);
      S.box(0.06, 0.06, 0.02, "#36C8F0", [0.08, 1.3, 0.17], { glow: true }); S.box(0.06, 0.06, 0.02, "#57D17A", [0.2, 1.3, 0.17], { glow: true });
      S.box(0.04, 0.9, 0.04, "#2F6F8F", [0.2, 0.7, 0.05]);
    }
  });
  eachHall(ctx, (x, y, k) => { if (k !== "ns" && k !== "ew") return; ctx.onCell(x, y, along(k), () => { S.box(0.5, 0.05, CELL, "#3A444A", [0, H - 0.08, 0]); for (const s of [-1, 1]) S.box(0.03, 0.12, CELL, "#3A444A", [s * 0.25, H - 0.13, 0]); if ((x + y) % 2 === 0) S.box(0.12, 0.04, 0.9, "#E8F8FF", [0, H - 0.12, 0], { glow: true }); }); });
}
function dressLab(ctx) {
  const { S, H } = ctx;
  for (const f of ctx.faces) ctx.onFace(f, () => {
    S.box(CELL, 0.04, 0.025, "#2EC4B6", [0, 2.05, 0.013], { glow: true });
    S.box(CELL, 0.14, 0.035, "#9FB1B0", [0, 0.07, 0.018]);
    if (ctx.plain.includes(f) && ctx.hash(f.x, f.y, 30 + f.d) < 0.14) {
      S.box(1.2, 0.04, 0.32, "#D5DBD9", [0, 1.15, 0.17]); S.box(1.2, 0.04, 0.32, "#D5DBD9", [0, 1.55, 0.17]);
      for (let i = 0; i < 3; i++) { S.cyl(0.08, 0.08, 0.26, "#B8E0DA", [-0.4 + i * 0.4, 1.3, 0.17], { seg: 10 }); S.ball(0.05, i === 1 ? "#6A3A5A" : "#3A5A4A", [-0.4 + i * 0.4, 1.28, 0.17]); S.cyl(0.085, 0.085, 0.03, "#7A8A88", [-0.4 + i * 0.4, 1.445, 0.17]); }
    }
  });
  for (let y = 0; y < ctx.GH; y++) for (let x = 0; x < ctx.GW; x++) if (ctx.open(x, y) && (x + y) % 2 === 0) ctx.onCell(x, y, 0, () => { S.box(1.0, 0.025, 0.7, "#F4FCFC", [0, H - 0.013, 0], { glow: true }); S.box(1.06, 0.02, 0.76, "#B8C2C0", [0, H - 0.005, 0]); });
}
function dressGreenhouse(ctx) {
  const { S, H } = ctx;
  const leaf = ["#4F8A46", "#3E7A3A", "#6AA45A", "#5E9E3A"];
  for (const f of ctx.faces) ctx.onFace(f, () => {
    const r = ctx.hash(f.x, f.y, 30 + f.d);
    S.cyl(0.03, 0.03, CELL, "#9AA4A0", [0, 0.62, 0.06], { rot: [0, 0, Math.PI / 2] });
    if (r < 0.6 && ctx.plain.includes(f)) {
      S.box(CELL - 0.1, 0.45, 0.42, "#77786F", [0, 0.225, 0.22]); S.box(CELL - 0.2, 0.04, 0.34, "#3A2A1E", [0, 0.44, 0.22]);
      for (let i = 0; i < 6; i++) { const q = ctx.hash(f.x * 7 + i, f.y, f.d); const px = -0.8 + i * 0.32; S.ball(0.14 + q * 0.12, leaf[i % 4], [px, 0.58 + q * 0.15, 0.22], { sc: [1, 0.8 + q * 0.6, 1] }); if (q > 0.6) { S.box(0.02, 0.5, 0.02, "#3E6A36", [px, 0.8, 0.22]); S.ball(0.08, q > 0.8 ? "#E8A0C8" : "#F2E07A", [px, 1.08, 0.22]); } }
    }
    if (r > 0.45) for (let i = 0; i < 3; i++) { const q = ctx.hash(f.x + i * 3, f.y, 60 + f.d); const len = 0.3 + q * 0.9; S.box(0.025, len, 0.025, "#3E7A3A", [-0.6 + i * 0.6, H - len / 2, 0.28]); S.ball(0.06, "#5E9E3A", [-0.6 + i * 0.6, H - len, 0.28]); }
  });
  eachHall(ctx, (x, y, k) => { if ((x * 2 + y) % 3) return; ctx.onCell(x, y, along(k), () => { S.box(0.1, 0.04, 1.3, "#E06CFF", [0, H - 0.42, 0], { glow: true }); S.box(0.16, 0.05, 1.36, "#3A3A44", [0, H - 0.38, 0]); for (const z of [-0.6, 0.6]) S.box(0.01, 0.36, 0.01, "#222", [0, H - 0.18, z]); }); });
}
function dressWarehouse(ctx) {
  const { S, H } = ctx, box = ["#B48A55", "#A37A48", "#C29A62", "#D8DAD8"];
  const used = new Set();
  for (const f of ctx.faces) {
    const opp = `${f.x},${f.y},${(f.d + 2) % 4}`;
    ctx.onFace(f, () => {
      S.box(CELL, 0.006, 0.08, "#D8B030", [0, 0.003, 0.4]);
      if (ctx.plain.includes(f) && ctx.hash(f.x, f.y, 30 + f.d) < 0.5 && !used.has(opp)) {
        used.add(`${f.x},${f.y},${f.d}`);
        const D = 0.45;   // 奥行き（背中の 壁の 棚に カメラが 入らない ように）
        for (const sx of [-1, 1]) for (const z of [0.05, D]) S.box(0.07, H - 0.5, 0.07, "#D9772B", [sx * (CELL / 2 - 0.06), (H - 0.5) / 2, z]);
        for (const yy of [0.12, 1.15, 2.2]) {
          for (const z of [0.05, D]) S.box(CELL - 0.1, 0.09, 0.06, "#2D6FB3", [0, yy, z]);
          S.box(CELL - 0.14, 0.03, D, "#9A7448", [0, yy + 0.06, D / 2 + 0.03]);
          let x0 = -0.85;
          while (x0 < 0.7) { const q = ctx.hash(f.x * 13 + Math.round(x0 * 10), f.y * 7 + Math.round(yy * 10), f.d); const bw = 0.3 + q * 0.4, bh = 0.25 + q * 0.5; if (q > 0.15) S.box(bw - 0.03, bh, D - 0.1, box[Math.floor(q * 4)], [x0 + bw / 2, yy + 0.075 + bh / 2, D / 2 + 0.03]); x0 += bw; }
        }
      }
    });
  }
  eachHall(ctx, (x, y) => { if ((x * 7 + y * 3) % 4) return; ctx.onCell(x, y, 0, () => { S.box(0.015, 0.5, 0.015, "#111", [0, H - 0.25, 0]); S.cone(0.28, 0.18, "#2A2E32", [0, H - 0.55, 0], { seg: 8 }); S.ball(0.09, "#FFC46B", [0, H - 0.66, 0], { glow: true }); }); });
}
function dressBuilding(ctx) {
  const { S, H } = ctx;
  for (const f of ctx.plain) ctx.onFace(f, () => {
    const r = ctx.hash(f.x, f.y, 30 + f.d);
    if (r < 0.3) {
      for (const sx of [-0.8, 0.8]) S.cyl(0.03, 0.03, H, "#8A9096", [sx, H / 2, 0.3], { seg: 6 });
      for (const yy of [0.95, 1.95]) S.cyl(0.03, 0.03, CELL, "#8A9096", [0, yy, 0.3], { rot: [0, 0, Math.PI / 2], seg: 6 });
      S.box(1.7, 0.04, 0.3, "#A88A5A", [0, 1.99, 0.3]);
      for (const sx of [-0.8, 0.8]) S.box(0.07, 0.07, 0.07, "#5A5E62", [sx, 1.95, 0.3]);
    } else if (r < 0.55) {
      for (let i = 0; i < 3; i++) { const q = ctx.hash(f.x + i, f.y + i * 5, f.d); S.cyl(0.012, 0.012, 0.2 + q * 0.3, "#8A5A3A", [-0.7 + q * 1.4, 0.4 + i * 0.7, 0.12], { rot: [Math.PI / 2, 0, 0], seg: 4 }); }
    } else if (r < 0.7) {
      for (const sx of [-0.7, 0.7]) S.box(0.06, 1.0, 0.06, "#E8E4DA", [sx, 0.5, 0.35]);
      for (let i = 0; i < 6; i++) S.box(0.24, 0.12, 0.03, i % 2 ? "#E8E4DA" : "#9A3A44", [-0.6 + i * 0.24, 0.85, 0.35]);
    }
  });
  eachHall(ctx, (x, y, k) => { if (ctx.hash(x, y, 70) > 0.32) return; ctx.onCell(x, y, along(k), () => { const L = 0.5 + ctx.hash(x, y, 71) * 0.4; S.box(0.012, L, 0.012, "#151515", [0.25, H - L / 2, 0.2]); S.ball(0.07, "#FFE0A0", [0.25, H - L - 0.05, 0.2], { glow: true }); for (const a of [0, 1, 2, 3]) S.box(0.01, 0.18, 0.01, "#333", [0.25 + Math.cos(a * 1.57) * 0.085, H - L - 0.05, 0.2 + Math.sin(a * 1.57) * 0.085]); }); });
  // 部屋の 中の 柱（4 マスが 開いて いる 角に）
  for (let y = 1; y < ctx.GH; y++) for (let x = 1; x < ctx.GW; x++) if (ctx.open(x, y) && ctx.open(x - 1, y) && ctx.open(x, y - 1) && ctx.open(x - 1, y - 1) && (x + y) % 2 === 0) S.box(0.45, H, 0.45, "#8A8984", [x * CELL, H / 2, y * CELL]);
}
function dressRail(ctx) {
  const { S, H } = ctx;
  rails(ctx, 1.1, "#7A7068", "#4E4A44", 0.6, 1.7);
  for (const f of ctx.faces) ctx.onFace(f, () => {
    ["#1F2321", "#3A2E24", "#2B3A33"].forEach((c, i) => S.cyl(0.035 + i * 0.006, 0.035 + i * 0.006, CELL, c, [0, H - 0.62 - i * 0.09, 0.07 + i * 0.02], { rot: [0, 0, Math.PI / 2], seg: 5 }));
    S.box(0.05, 0.32, 0.16, "#2A2C2A", [0, H - 0.72, 0.08]);
    const r = ctx.hash(f.x, f.y, 30 + f.d);
    if (r < 0.16 && ctx.plain.includes(f)) { S.box(0.24, 0.52, 0.16, "#1A1C1A", [0.5, 1.75, 0.08]); const on = r < 0.08; S.ball(0.06, on ? "#FF4040" : "#3A1414", [0.5, 1.88, 0.17], { glow: true }); S.ball(0.06, on ? "#1A3A26" : "#45E08A", [0.5, 1.64, 0.17], { glow: true }); }
  });
  eachHall(ctx, (x, y, k) => { if ((x + y) % 2 || ctx.hash(x, y, 72) < 0.25) return; ctx.onCell(x, y, along(k), () => { S.box(0.16, 0.05, 1.3, "#3A3E3A", [0, H - 0.03, 0]); S.box(0.07, 0.04, 1.2, "#E8FFF4", [0, H - 0.07, 0], { glow: true }); }); });
}
function dressHarbor(ctx) {
  const { S, H } = ctx;
  for (const f of ctx.plain) ctx.onFace(f, () => {
    const r = ctx.hash(f.x, f.y, 30 + f.d);
    if (r < 0.16) { S.cyl(0.15, 0.19, 0.55, "#2F3336", [0.5, 0.275, 0.4], { seg: 10 }); S.ball(0.17, "#2F3336", [0.5, 0.58, 0.4], { sc: [1, 0.5, 1] }); S.cyl(0.32, 0.32, 0.1, "#8A6A42", [-0.2, 0.05, 0.45], { seg: 12 }); S.cyl(0.2, 0.2, 0.11, "#5A4430", [-0.2, 0.055, 0.45], { seg: 12 }); }
    else if (r < 0.28) { S.cyl(0.05, 0.06, H - 0.3, "#2A2E30", [0, (H - 0.3) / 2, 0.15], { seg: 6 }); S.box(0.04, 0.04, 0.4, "#2A2E30", [0, H - 0.35, 0.33]); S.box(0.2, 0.26, 0.2, "#2A2E30", [0, H - 0.52, 0.5]); S.box(0.14, 0.18, 0.14, "#FFC46B", [0, H - 0.52, 0.5], { glow: true }); }
    else if (r < 0.34 && ctx.isRoom(f.x, f.y)) { S.box(0.8, 0.35, 0.9, "#3A2E24", [0, 0.25, 0.55]); for (const sx of [-0.4, 0.4]) S.cyl(0.22, 0.22, 0.08, "#2A2420", [sx, 0.22, 0.55], { rot: [0, 0, Math.PI / 2], seg: 10 }); S.cyl(0.13, 0.17, 1.3, "#25282A", [0, 0.6, 0.35], { rot: [Math.PI / 2 - 0.12, 0, 0], seg: 10 }); }
  });
  for (let y = 0; y < ctx.GH; y++) for (let x = 0; x < ctx.GW; x++) if (ctx.open(x, y) && ctx.hash(x, y, 80) < 0.2) ctx.onCell(x, y, 0, () => { const q = ctx.hash(x, y, 81); S.add(new THREE.CircleGeometry(0.3 + q * 0.3, 10), "#2E3C48", { at: [(q - 0.5) * 0.8, 0.004, (ctx.hash(x, y, 82) - 0.5) * 0.8], rot: [-Math.PI / 2, 0, 0], sc: [1.4, 1, 1] }); });
}

// ======================================================================
// しかけの 部品（前は +z。壁に 寄せる 物は z=0 が 壁）
// ======================================================================
const MOUNT = { D: "axis", B: "axis", K: "axis", F: "axis", c: "wall", l: "wall", T: "wall", v: "wall", V: "wall", g: "wall" };
const HAZ = ["#F2C200", "#1B1D1B"];

function frameAndLintel(P, th, H, oh, post = 0.28, col) {
  const fr = col || th.look.frame;
  P.box(post, H, 0.36, fr, [-CELL / 2 + post / 2, H / 2, 0]).box(post, H, 0.36, fr, [CELL / 2 - post / 2, H / 2, 0]);
  P.box(CELL, H - oh, 0.32, fr, [0, oh + (H - oh) / 2, 0]);
}
function mkDoor({ th, H }) {
  const oh = Math.min(2.15, H - 0.28), ow = CELL - 0.56, st = th.look.door;
  const F = Parts(); frameAndLintel(F, th, H, oh);
  F.box(ow, 0.03, 0.42, "#2A2A2A", [0, 0.015, 0]);
  const pan = Parts(), pg = new THREE.Group();
  if (st === "wood") {
    for (let i = 0; i < 4; i++) pan.box(ow / 4 - 0.02, oh - 0.02, 0.08, ["#5A3C24", "#523720", "#61412A", "#4E3420"][i], [-ow / 2 + (i + 0.5) * (ow / 4), oh / 2, 0]);
    for (const yy of [0.4, oh - 0.4]) pan.box(ow, 0.08, 0.1, "#3A3A3A", [0, yy, 0]);
    pan.box(0.06, 0.06, 0.06, "#C9A44C", [ow / 2 - 0.15, oh / 2, 0.07]);
  } else if (st === "gate") {
    for (let i = 0; i < 7; i++) pan.cyl(0.025, 0.025, oh, "#2A2E30", [-ow / 2 + 0.1 + i * ((ow - 0.2) / 6), oh / 2, 0], { seg: 5 });
    for (const yy of [0.2, oh / 2, oh - 0.15]) pan.box(ow, 0.06, 0.05, "#3A3E40", [0, yy, 0]);
  } else {
    const body = st === "lab" ? "#EEF1EF" : st === "glass" ? th.look.frame : th.look.panel;
    pan.box(ow, oh, 0.1, body, [0, oh / 2, 0]);
    if (st === "glass") { pan.box(ow - 0.16, oh - 0.3, 0.11, "#3E6A4A", [0, oh / 2 + 0.05, 0]); }
    if (st === "lab") { pan.box(0.05, oh - 0.3, 0.02, th.look.accent, [ow / 2 - 0.12, oh / 2, 0.06], { glow: true }); pan.cyl(0.18, 0.18, 0.12, "#22404A", [0, oh * 0.68, 0], { rot: [Math.PI / 2, 0, 0], seg: 14 }); }
    if (st === "steel") { pan.box(0.5, 0.1, 0.11, "#14181A", [0, oh * 0.72, 0]); pan.box(0.06, oh, 0.105, HAZ[0], [ow / 2 - 0.03, oh / 2, 0]); for (let i = 0; i < 6; i++) pan.box(0.061, oh / 12, 0.106, HAZ[1], [ow / 2 - 0.03, (i * 2 + 1) * (oh / 12), 0]); pan.box(0.1, 0.25, 0.04, "#2A2E30", [-ow / 2 + 0.2, oh * 0.48, 0.07]); }
  }
  const pm = pan.mesh(); pg.add(pm);
  if (st === "glass") { const gl = new THREE.Mesh(new THREE.PlaneGeometry(ow - 0.2, oh - 0.34), GLASS); gl.position.set(0, oh / 2 + 0.05, 0.06); pg.add(gl); }
  const group = new THREE.Group(); group.add(F.mesh(), pg);
  const swing = st === "wood";
  if (swing) { pm.position.x = ow / 2; pg.position.x = -ow / 2; }
  const o = { group, k: 0, set(s) { o.k = s === "open" ? 1 : 0; }, tick(t, v) { if (swing) pg.rotation.y = -v * 1.75; else pg.position.x = v * (ow - 0.08); } };
  return o;
}
function mkBulkhead({ th, H }) {
  const oh = Math.min(2.2, H - 0.25), ow = CELL - 0.68;
  const F = Parts(); frameAndLintel(F, th, H, oh, 0.34, "#3A3E40");
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) F.box(0.05, oh / 8, 0.37, HAZ[i % 2], [s * (CELL / 2 - 0.34 - 0.02), (i + 0.5) * (oh / 8), 0]);
  F.box(0.16, 0.1, 0.1, "#FFB020", [-0.55, oh + 0.12, 0.17], { glow: true }); F.box(0.16, 0.1, 0.1, "#FFB020", [0.55, oh + 0.12, 0.17], { glow: true });
  const sh = Parts();
  sh.box(ow, oh, 0.2, "#5A6268", [0, oh / 2, 0]);
  for (let yy = 0.35; yy < oh - 0.1; yy += 0.36) sh.box(ow, 0.06, 0.24, "#454C51", [0, yy, 0]);
  for (let i = 0; i < 8; i++) sh.box(ow / 8, 0.22, 0.25, HAZ[i % 2], [-ow / 2 + (i + 0.5) * (ow / 8), 0.11, 0]);
  const sm = sh.mesh(), group = new THREE.Group(); group.add(F.mesh(), sm);
  // 開くと 上へ 巻き上がる（屋根の ない 港でも 壁の 上に 出ない）
  const o = { group, k: 1, set(s) { o.k = s === "closed" ? 0 : 1; }, tick(t, v) { const k = 1 - v * 0.86; sm.scale.y = k; sm.position.y = oh * (1 - k); } };
  return o;
}
function mkKeyDoor({ th, H, m }) {
  const kc = KEYS[m.key] || KEYS.vault, oh = Math.min(2.1, H - 0.3), ow = CELL - 0.56;
  const F = Parts(); frameAndLintel(F, th, H, oh, 0.28, "#2E3236");
  F.box(ow + 0.2, 0.07, 0.04, kc, [0, oh + 0.1, 0.17], { glow: true });
  F.box(0.12, 0.2, 0.05, "#1A1C1E", [CELL / 2 - 0.14, 1.2, 0.2]);
  const rd = lamp(new THREE.BoxGeometry(0.07, 0.04, 0.02), "#FF4B4B"); rd.position.set(CELL / 2 - 0.14, 1.26, 0.23);
  const pan = Parts();
  pan.box(ow, oh, 0.12, "#3A4046", [0, oh / 2, 0]);
  for (const yy of [0.5, 1.0, 1.5]) pan.box(ow - 0.1, 0.04, 0.13, "#2A2E32", [0, yy, 0]);
  pan.add(new THREE.OctahedronGeometry(0.16), kc, { at: [0, oh * 0.6, 0.07], sc: [1, 1.2, 0.3], glow: true });
  const pm = pan.mesh(), group = new THREE.Group(); group.add(F.mesh(), rd, pm);
  const o = { group, k: 0, set(s) { o.k = s === "open" ? 1 : 0; rd.material.color.set(s === "open" ? "#57D17A" : "#FF4B4B"); }, tick(t, v) { pm.position.x = v * (ow - 0.08); } };
  return o;
}
function mkElevator({ th, H }) {
  const P = Parts();
  P.box(1.76, 0.1, 1.76, "#3A3E42", [0, 0.05, 0]);
  for (let i = 0; i < 8; i++) for (const [ax, sgn] of [[0, 1], [0, -1], [1, 1], [1, -1]]) { const p = -0.88 + (i + 0.5) * 0.22; P.box(ax ? 0.08 : 0.22, 0.012, ax ? 0.22 : 0.08, HAZ[i % 2], ax ? [sgn * 0.84, 0.106, p] : [p, 0.106, sgn * 0.84]); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(0.08, H, 0.08, "#5A6066", [sx * 0.9, H / 2, sz * 0.9]);
  for (const yy of [1.1, H - 0.1]) for (const s of [-1, 1]) { P.box(1.8, 0.05, 0.05, "#5A6066", [0, yy, s * 0.9]); P.box(0.05, 0.05, 1.8, "#5A6066", [s * 0.9, yy, 0]); }
  P.box(0.18, 1.1, 0.12, "#2A2E32", [0.7, 0.55, -0.7]);
  const up = lamp(new THREE.ConeGeometry(0.05, 0.08, 3), "#3A5A40"), dn = lamp(new THREE.ConeGeometry(0.05, 0.08, 3), "#3A5A40");
  up.position.set(0.7, 1.0, -0.63); dn.position.set(0.7, 0.86, -0.63); dn.rotation.z = Math.PI;
  const group = new THREE.Group(); group.add(P.mesh(), up, dn);
  const o = { group, set(s) { up.material.color.set(s === "up" ? "#57FF8A" : "#3A5A40"); dn.material.color.set(s === "down" ? "#57FF8A" : "#3A5A40"); }, tick(t) { if (o.state === "idle") { const k = 0.5 + 0.5 * Math.sin(t * 3); up.material.color.setRGB(0.15, 0.3 + k * 0.5, 0.2); } } };
  return o;
}
function mkCrate({ m }) {
  const co = COMPANY[m.co] || COMPANY.linkers, tier = Math.max(1, Math.min(3, m.tier || 1));
  const P = Parts(), w = 1.0, h = 0.56, d = 0.66;
  P.box(w, h, d, co.body, [0, h / 2 + 0.04, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(0.08, h + 0.02, 0.08, co.trim, [sx * (w / 2 - 0.02), h / 2 + 0.04, sz * (d / 2 - 0.02)]);
  P.box(w + 0.02, 0.09, d + 0.02, co.band, [0, h * 0.62, 0]);
  for (const sx of [-1, 1]) P.box(0.04, 0.06, 0.24, co.trim, [sx * (w / 2 + 0.03), h * 0.75, 0]);
  for (const sx of [-1, 1]) P.box(0.16, 0.04, d, "#1A1A1A", [sx * 0.35, 0.02, 0]);
  P.box(0.18, 0.13, 0.03, "#121416", [0.28, h * 0.4, d / 2 + 0.015]);
  for (let i = 0; i < tier; i++) P.box(0.06, 0.06, 0.02, co.glow, [-0.3 + i * 0.1, h * 0.4, d / 2 + 0.012], { glow: true });
  const rd = lamp(new THREE.BoxGeometry(0.1, 0.03, 0.02), "#FF4B4B"); rd.position.set(0.28, h * 0.44, d / 2 + 0.035);
  const lid = Parts(); lid.box(w + 0.02, 0.12, d + 0.02, co.body, [0, 0.06, d / 2]); lid.box(w * 0.6, 0.02, d * 0.5, co.trim, [0, 0.125, d / 2]);
  const lm = lid.mesh(), lg = new THREE.Group(); lg.add(lm); lg.position.set(0, h + 0.04, -d / 2);
  const group = new THREE.Group(); group.add(P.mesh(), rd, lg);
  const o = { group, k: 0, set(s) { o.k = s === "open" ? 1 : 0; rd.material.color.set(s === "open" ? "#57D17A" : "#FF4B4B"); }, tick(t, v) { lg.rotation.x = -v * 1.9; } };
  return o;
}
function mkCabinet({ th }) {
  const P = Parts(), c = th.look.metal, w = 0.9, h = 1.28, d = 0.5;
  P.box(w, h, d, c, [0, h / 2, d / 2 + 0.02]);
  for (let i = 1; i < 3; i++) { P.box(w - 0.08, 0.36, 0.03, mixHex(c, "#FFFFFF", 0.12), [0, 0.24 + i * 0.4, d + 0.035]); P.box(0.22, 0.04, 0.04, "#2A2A2A", [0, 0.3 + i * 0.4, d + 0.06]); }
  const dr = Parts(); dr.box(w - 0.1, 0.34, d - 0.06, mixHex(c, "#000000", 0.2), [0, 0.24, d / 2 + 0.03]); dr.box(w - 0.08, 0.36, 0.03, mixHex(c, "#FFFFFF", 0.12), [0, 0.24, d + 0.035]); dr.box(0.22, 0.04, 0.04, "#2A2A2A", [0, 0.3, d + 0.06]); dr.box(w - 0.16, 0.02, d - 0.14, "#1E1E1E", [0, 0.41, d / 2 + 0.03]);
  const dm = dr.mesh(), group = new THREE.Group(); group.add(P.mesh(), dm);
  const o = { group, k: 0, set(s) { o.k = s === "looted" ? 1 : 0; }, tick(t, v) { dm.position.z = v * 0.32; } };
  return o;
}
function mkLocker({ th }) {
  const P = Parts(), c = th.look.locker, w = 0.46, h = 1.86, d = 0.48;
  for (const s of [-1, 1]) { P.box(w, h, d, c, [s * (w / 2 + 0.01), h / 2, d / 2 + 0.02]); }
  P.box(w - 0.06, h - 0.1, 0.02, "#151515", [-(w / 2 + 0.01), h / 2, d + 0.005]);
  const deco = (Q, x0) => { for (let i = 0; i < 4; i++) Q.box(w * 0.5, 0.025, 0.02, "#222", [x0, h - 0.25 - i * 0.06, 0.035]); for (let i = 0; i < 4; i++) Q.box(w * 0.5, 0.025, 0.02, "#222", [x0, 0.35 + i * 0.06, 0.035]); Q.box(0.04, 0.16, 0.04, "#B0B0B0", [x0 + w * 0.32, h * 0.52, 0.04]); };
  P.push(w / 2 + 0.01, 0, d + 0.02); P.box(w - 0.02, h - 0.04, 0.03, mixHex(c, "#FFFFFF", 0.1), [0, h / 2, 0.015]); deco(P, 0); P.pop();
  const dr = Parts(); dr.box(w - 0.02, h - 0.04, 0.03, mixHex(c, "#FFFFFF", 0.1), [w / 2 - 0.01, h / 2, 0.015]); deco(dr, w / 2 - 0.01);
  const dm = dr.mesh(), dg = new THREE.Group(); dg.add(dm); dg.position.set(-w - 0.01 + 0.01, 0, d + 0.02);
  const group = new THREE.Group(); group.add(P.mesh(), dg);
  const o = { group, k: 0, set(s) { o.k = s === "looted" ? 1 : 0; }, tick(t, v) { dg.rotation.y = -v * 1.6; } };
  return o;
}
function mkWreck({ th, hash }) {
  const P = Parts(), c = "#3A3E42";
  P.ball(0.34, c, [0, 0.22, 0], { sc: [1.2, 0.6, 1], rot: [0.2, 0.4, 0.15], det: 1 });
  P.box(0.5, 0.12, 0.3, "#2A2D30", [0.05, 0.42, 0], { rot: [0.1, 0.3, 0.2] });
  P.ball(0.08, "#1A1A1A", [0.32, 0.3, 0.2]);
  for (const [a, l] of [[0.6, 0.75], [2.4, 0.6], [4.1, 0.5]]) { const ex = Math.cos(a) * l * 0.5, ez = Math.sin(a) * l * 0.5; P.box(l, 0.05, 0.07, "#4A4E52", [ex, 0.2, ez], { rot: [0, -a, 0.2] }); P.cyl(0.2, 0.2, 0.02, "#26292C", [ex * 2, 0.16 + hash(a) * 0.1, ez * 2], { rot: [0.5 * hash(a + 1), 0, 0.6], seg: 10 }); }
  for (let i = 0; i < 4; i++) P.box(0.25 + hash(i) * 0.2, 0.03, 0.2, ["#55595C", "#4A5034", th.look.metal, "#3A3E42"][i], [(hash(i + 5) - 0.5) * 1.3, 0.02, (hash(i + 9) - 0.5) * 1.3], { rot: [0, hash(i + 2) * 3, 0.08] });
  const sp = lamp(new THREE.IcosahedronGeometry(0.05), "#FFB040"); sp.position.set(0.3, 0.42, 0.12);
  const group = new THREE.Group(); group.add(P.mesh(), sp);
  const o = { group, set(s) { sp.visible = s !== "looted"; }, tick(t) { if (sp.visible) sp.scale.setScalar(Math.sin(t * 23) > 0.6 ? 1.4 : 0.2 + 0.3 * Math.sin(t * 7) ** 2); } };
  return o;
}
function mkGather({ th, theme, hash }) {
  const P = Parts(), take = Parts();
  if (theme === "mine") {
    P.ball(0.45, "#3E2C20", [0, 0.2, 0.12], { sc: [1.6, 0.6, 0.6] });
    for (let i = 0; i < 7; i++) { const a = hash(i), col = i % 3 === 0 ? "#6FD6E8" : "#F0A640"; take.add(new THREE.OctahedronGeometry(0.1 + a * 0.08), col, { at: [-0.5 + i * 0.16, 0.25 + a * 0.4, 0.15 + hash(i + 3) * 0.12], sc: [0.7, 1.8, 0.7], rot: [hash(i + 1) - 0.5, 0, hash(i + 2) - 0.5] }); if (i % 2 === 0) take.ball(0.04, col, [-0.5 + i * 0.16, 0.25 + a * 0.4, 0.24], { glow: true }); }
  } else if (theme === "greenhouse") {
    P.box(0.9, 0.22, 0.4, "#6E5A44", [0, 0.11, 0.24]); P.box(0.84, 0.03, 0.34, "#2A1E14", [0, 0.22, 0.24]);
    for (let i = 0; i < 5; i++) { const a = hash(i); take.box(0.02, 0.3 + a * 0.3, 0.02, "#3E7A3A", [-0.32 + i * 0.16, 0.4 + a * 0.15, 0.24]); take.ball(0.1 + a * 0.05, ["#4F8A46", "#6AA45A"][i % 2], [-0.32 + i * 0.16, 0.55 + a * 0.3, 0.24], { sc: [1.2, 0.8, 1] }); take.ball(0.05, "#F28AC8", [-0.32 + i * 0.16, 0.66 + a * 0.32, 0.27], { glow: i % 2 === 0 }); }
  } else if (theme === "harbor") {
    P.add(new THREE.CircleGeometry(0.55, 12), "#2A3A48", { at: [0, 0.005, 0.5], rot: [-Math.PI / 2, 0, 0], sc: [1.4, 1, 1] });
    for (let i = 0; i < 6; i++) { const a = hash(i); take.box(0.05, 0.3 + a * 0.4, 0.02, i % 2 ? "#4A6A3A" : "#6A5A2A", [-0.4 + i * 0.16, 0.18 + a * 0.2, 0.15 + a * 0.2], { rot: [0.3, 0, (a - 0.5) * 0.6] }); }
    for (let i = 0; i < 3; i++) take.cone(0.07, 0.09, ["#F2E6DA", "#E8B8B0", "#D8D0C0"][i], [-0.2 + i * 0.22, 0.03, 0.55 + hash(i + 7) * 0.2], { rot: [Math.PI / 2, 0, hash(i) * 3], seg: 7 });
  } else {
    P.ball(0.25, "#2E3436", [0, 0.06, 0.18], { sc: [2, 0.4, 1] });
    for (let i = 0; i < 7; i++) { const a = hash(i), col = i % 2 ? "#5FE3D0" : "#B58CFF", xx = -0.45 + i * 0.15, hh = 0.1 + a * 0.35; take.cyl(0.02, 0.03, hh, "#C8D0C8", [xx, hh / 2, 0.14 + hash(i + 4) * 0.15], { seg: 5 }); take.cone(0.07 + a * 0.06, 0.06, col, [xx, hh + 0.02, 0.14 + hash(i + 4) * 0.15], { seg: 7, glow: true }); }
  }
  const tm = take.mesh(), group = new THREE.Group(); group.add(P.mesh(), tm);
  return { group, set(s) { tm.visible = s !== "taken"; } };
}
function mkTrace({ hash }) {
  const P = Parts();
  P.box(0.3, 0.025, 0.22, "#1E2226", [0.1, 0.012, 0.1], { rot: [0, 0.4, 0] });
  for (let i = 0; i < 5; i++) P.box(0.09, 0.004, 0.14, "#1A1A1A", [-0.5 + i * 0.22 + (i % 2) * 0.05, 0.003, -0.3 + (i % 2) * 0.16 - i * 0.08], { rot: [0, -0.5, 0] });
  const sc = lamp(new THREE.PlaneGeometry(0.24, 0.16), "#7FE8FF"); sc.rotation.set(-Math.PI / 2, 0, 0.4); sc.position.set(0.1, 0.027, 0.1);
  const bc = lamp(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 12, 1, true), "#7FE8FF"); bc.material.transparent = true; bc.material.opacity = 0.12; bc.material.side = THREE.DoubleSide; bc.material.depthWrite = false; bc.position.set(0.1, 0.3, 0.1);
  const group = new THREE.Group(); group.add(P.mesh(), sc, bc);
  const o = { group, set(s) { sc.material.color.set(s === "read" ? "#3A4A50" : "#7FE8FF"); bc.visible = s !== "read"; }, tick(t) { if (bc.visible) bc.material.opacity = 0.08 + 0.08 * (0.5 + 0.5 * Math.sin(t * 2.4 + hash(1) * 6)); } };
  return o;
}
function mkTerminal({ th }) {
  const P = Parts(), c = th.look.metal;
  P.box(0.72, 0.88, 0.42, c, [0, 0.44, 0.23]);
  P.box(0.76, 0.12, 0.5, mixHex(c, "#000000", 0.25), [0, 0.92, 0.27], { rot: [0.35, 0, 0] });
  P.box(0.6, 0.02, 0.18, "#1A1C1E", [0, 0.97, 0.33], { rot: [0.35, 0, 0] });
  P.box(0.74, 0.62, 0.08, mixHex(c, "#000000", 0.35), [0, 1.42, 0.06]);
  P.box(0.05, 0.5, 0.05, "#2A2C2E", [0, 1.1, 0.04]);
  const scr = lamp(new THREE.PlaneGeometry(0.64, 0.5), th.look.accent); scr.position.set(0, 1.42, 0.105);
  const ln = Parts(); for (let i = 0; i < 5; i++) ln.box(0.2 + (i % 3) * 0.12, 0.02, 0.005, "#0E1A1E", [-0.2 + ((i % 3) * 0.12) / 2, 1.58 - i * 0.07, 0.11]);
  const group = new THREE.Group(); group.add(P.mesh(), scr, ln.mesh());
  const col = { idle: th.look.accent, seized: "#57D17A", alarm: "#FF4B4B" };
  const o = { group, set(s) { scr.material.color.set(col[s] || th.look.accent); }, tick(t) { if (o.state === "alarm") scr.material.color.set(Math.sin(t * 8) > 0 ? "#FF4B4B" : "#5A1010"); } };
  return o;
}
function mkPoint({ m }) {
  const P = Parts();
  P.cyl(0.8, 0.85, 0.06, "#2A2E32", [0, 0.03, 0], { seg: 16 });
  P.box(0.24, 1.1, 0.24, "#3A4046", [0, 0.55, 0]); P.box(0.3, 0.08, 0.3, "#2A2E32", [0, 1.12, 0]);
  const segs = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, s = lamp(new THREE.BoxGeometry(0.34, 0.03, 0.12), "#2A3034"); s.position.set(Math.sin(a) * 0.62, 0.075, Math.cos(a) * 0.62); s.rotation.y = a; segs.push(s); }
  const cap = lamp(new THREE.BoxGeometry(0.16, 0.12, 0.16), OWNER.none); cap.position.y = 1.22;
  const group = new THREE.Group(); group.add(P.mesh(), cap, ...segs);
  const o = { group, set(s) { const g = Math.max(0, Math.min(1, +s || 0)), c = OWNER[m.owner || (g > 0 ? "me" : "none")] || OWNER.none; segs.forEach((sg, i) => sg.material.color.set(i < Math.round(g * 8) ? c : "#2A3034")); cap.material.color.set(g >= 1 ? c : OWNER.none); }, tick(t) { cap.scale.y = 1 + 0.15 * Math.sin(t * 3); } };
  o.set(0); return o;
}
function mkCamera({ H }) {
  const P = Parts(), y0 = H - 0.3;
  P.box(0.2, 0.2, 0.04, "#2A2C2E", [0, y0, 0.02]); P.box(0.07, 0.07, 0.24, "#2A2C2E", [0, y0, 0.14]);
  const head = Parts(); head.box(0.2, 0.15, 0.34, "#D8DCDC", [0, 0, 0.14]); head.box(0.24, 0.03, 0.38, "#A8AEAE", [0, 0.09, 0.14]); head.cyl(0.055, 0.055, 0.06, "#101214", [0, 0, 0.33], { rot: [Math.PI / 2, 0, 0], seg: 10 });
  const hm = head.mesh(), hg = new THREE.Group(); hg.add(hm); hg.position.set(0, y0, 0.22); hg.rotation.x = 0.42;
  const led = lamp(new THREE.BoxGeometry(0.03, 0.03, 0.02), "#FF3030"); led.position.set(0.06, 0.05, 0.31); hg.add(led);
  hg.scale.setScalar(1.4);   // 頭だけ 大きく（取りつけの 高さは そのまま）
  const group = new THREE.Group(); group.add(P.mesh(), hg);
  const o = { group, set(s) { led.material.color.set(s === "hacked" ? "#57D17A" : "#FF3030"); }, tick(t) { hg.rotation.y = Math.sin(t * 0.5) * 0.55; const f = o.state === "alarm" ? 8 : 2; led.visible = o.state === "hacked" || Math.sin(t * f) > -0.3; } };
  return o;
}
function mkGenerator({ th }) {
  const P = Parts(), c = th.look.metal;
  P.box(1.5, 0.24, 1.5, "#2A2E32", [0, 0.12, 0]);
  P.cyl(0.55, 0.6, 1.5, c, [0, 0.99, 0], { seg: 12 });
  for (const yy of [0.45, 1.0, 1.55]) P.cyl(0.64, 0.64, 0.08, "#2E3438", [0, yy, 0], { seg: 12 });
  for (const s of [-1, 1]) { P.box(0.24, 0.5, 0.24, "#3A4046", [s * 0.62, 0.5, 0.62]); P.cyl(0.04, 0.04, 0.9, "#1E2226", [s * 0.62, 1.1, 0.62], { seg: 5 }); }
  const top = Parts(); top.cyl(0.4, 0.5, 0.22, "#3A4046", [0, 0, 0], { seg: 12 }); for (let i = 0; i < 3; i++) { const ix = Math.cos(i * 2.1) * 0.24, iz = Math.sin(i * 2.1) * 0.24; top.cyl(0.03, 0.03, 0.34, "#2A2E32", [ix, 0.24, iz], { seg: 5 }); for (let k = 0; k < 3; k++) top.cyl(0.075, 0.075, 0.04, "#B8A888", [ix, 0.16 + k * 0.08, iz], { seg: 8 }); top.ball(0.035, "#7A8288", [ix, 0.42, iz]); }   // 碍子（円盤を 重ねた 形）
  const tm = top.mesh(); tm.position.y = 1.86;
  const wins = []; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, wl = lamp(new THREE.BoxGeometry(0.12, 0.38, 0.04), "#36C8F0"); wl.position.set(Math.sin(a) * 0.58, 1.27, Math.cos(a) * 0.58); wl.rotation.y = a; wins.push(wl); }
  const group = new THREE.Group(); group.add(P.mesh(), tm, ...wins);
  const o = { group, set(s) { const b = s === "broken"; tm.rotation.set(b ? 0.5 : 0, 0, b ? 0.3 : 0); tm.position.set(b ? 0.2 : 0, b ? 1.7 : 1.86, 0); wins.forEach((w) => w.material.color.set(b ? "#1A2226" : "#36C8F0")); }, tick(t) { if (o.state !== "broken") { const k = 0.65 + 0.35 * Math.sin(t * 4); wins.forEach((w) => w.material.color.setRGB(0.2 * k, 0.78 * k, 0.94 * k)); } } };
  return o;
}
function mkTurret({ th }) {
  const P = Parts();
  P.cyl(0.5, 0.62, 0.32, "#2A2E32", [0, 0.16, 0], { seg: 8 }); P.cyl(0.18, 0.22, 0.4, "#3A4046", [0, 0.5, 0], { seg: 8 });
  const hd = Parts(); hd.box(0.62, 0.36, 0.56, th.look.metal, [0, 0, 0]); hd.box(0.66, 0.06, 0.6, "#2E3438", [0, 0.2, 0]);
  for (const s of [-1, 1]) hd.cyl(0.05, 0.05, 0.7, "#1E2226", [s * 0.14, -0.02, 0.6], { rot: [Math.PI / 2, 0, 0], seg: 6 });
  const hm = hd.mesh(), hg = new THREE.Group(); hg.add(hm); hg.position.y = 0.86;
  const eye = lamp(new THREE.BoxGeometry(0.16, 0.06, 0.02), "#FF3030"); eye.position.set(0, 0.06, 0.29); hg.add(eye);
  const group = new THREE.Group(); group.add(P.mesh(), hg);
  const o = { group, set(s) { const b = s === "broken"; eye.material.color.set(b ? "#2A1010" : "#FF3030"); hg.rotation.x = b ? 0.45 : 0; }, tick(t) { if (o.state !== "broken") hg.rotation.y = Math.sin(t * 0.6) * 0.8; } };
  return o;
}
function mkVault({ th, H }) {
  const P = Parts(), fh = Math.min(2.0, H - 0.3);
  P.box(1.9, fh, 0.24, "#2E3236", [0, fh / 2, 0.12]);
  P.box(1.7, fh - 0.2, 0.05, "#14171A", [0, fh / 2, 0.245]);
  const rs = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = lamp(new THREE.BoxGeometry(0.1, 0.04, 0.02), "#FF4B4B"); r.position.set(Math.cos(a) * 0.86, fh / 2 + Math.sin(a) * 0.86 * (fh / 2 / 0.95), 0.25); r.rotation.z = a + Math.PI / 2; rs.push(r); }
  const dp = Parts(), R = Math.min(0.78, fh / 2 - 0.12);
  dp.cyl(R, R, 0.26, "#5A6268", [R, 0, 0.13], { rot: [Math.PI / 2, 0, 0], seg: 18 });
  dp.cyl(R * 0.8, R * 0.8, 0.28, "#4A5258", [R, 0, 0.14], { rot: [Math.PI / 2, 0, 0], seg: 18 });
  for (let i = 0; i < 4; i++) dp.box(R * 1.1, 0.05, 0.05, "#C9A44C", [R, 0, 0.3], { rot: [0, 0, (i * Math.PI) / 4] });
  dp.cyl(0.1, 0.1, 0.1, "#C9A44C", [R, 0, 0.3], { rot: [Math.PI / 2, 0, 0], seg: 10 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; dp.box(0.06, 0.06, 0.05, "#8A9298", [R + Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, 0.27]); }
  const dm = dp.mesh(), dg = new THREE.Group(); dg.add(dm); dg.position.set(-R, fh / 2, 0.06);
  const group = new THREE.Group(); group.add(P.mesh(), dg, ...rs);
  const o = { group, k: 0, set(s) { o.k = s === "open" ? 1 : 0; rs.forEach((r) => r.material.color.set(s === "open" ? "#57D17A" : "#FF4B4B")); }, tick(t, v) { dg.rotation.y = -v * 1.75; } };
  return o;
}
function mkBarricade({ th }) {
  const P = Parts(), top = Parts(), bag = ["#8A7A5A", "#7E6E50", "#948462"];
  for (let r = 0; r < 3; r++) { const Q = r === 2 ? top : P; for (let i = 0; i < 5; i++) Q.box(0.36, 0.17, 0.3, bag[(i + r) % 3], [-0.76 + i * 0.38 + (r % 2) * 0.19 - 0.09, 0.09 + r * 0.17, 0], { rot: [0, (i % 2 ? 0.05 : -0.05), 0] }); }
  P.box(1.5, 0.75, 0.04, th.look.metal, [0, 0.55, -0.2], { rot: [-0.08, 0, 0] });
  const tm = top.mesh(), fall = Parts();
  for (let i = 0; i < 3; i++) fall.box(0.36, 0.17, 0.3, bag[i], [-0.5 + i * 0.5, 0.09, 0.5 + (i % 2) * 0.2], { rot: [0, i * 0.7, 0.1] });
  const fm = fall.mesh(); fm.visible = false;
  const group = new THREE.Group(); group.add(P.mesh(), tm, fm);
  return { group, set(s) { const b = s === "broken"; tm.visible = !b; fm.visible = b; } };
}
function mkNest({ hash }) {
  const P = Parts();
  P.ball(0.75, "#3A2140", [0, 0.1, 0], { sc: [1.1, 0.45, 1], det: 1 });
  for (let i = 0; i < 5; i++) P.ball(0.25 + hash(i) * 0.15, "#4A2A50", [Math.cos(i * 1.3) * 0.5, 0.2, Math.sin(i * 1.3) * 0.5], { sc: [1, 0.6, 1] });
  for (let i = 0; i < 6; i++) { const a = i * 1.05, l = 0.7 + hash(i + 3) * 0.4; P.cyl(0.03, 0.06, l, "#2E1A34", [Math.cos(a) * 0.75, 0.08, Math.sin(a) * 0.75], { rot: [Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4], seg: 5 }); }
  const pods = [];
  for (let i = 0; i < 6; i++) { const p = lamp(new THREE.IcosahedronGeometry(0.1 + hash(i + 8) * 0.07), "#E04CFF"); p.position.set(Math.cos(i * 1.1 + 0.4) * 0.38, 0.32 + hash(i) * 0.12, Math.sin(i * 1.1 + 0.4) * 0.38); pods.push(p); }
  const group = new THREE.Group(); group.add(P.mesh(), ...pods);
  const o = { group, set(s) { pods.forEach((p) => p.material.color.set(s === "dead" ? "#3A3036" : "#E04CFF")); }, tick(t) { if (o.state !== "dead") pods.forEach((p, i) => p.scale.setScalar(1 + 0.18 * Math.sin(t * 2 + i))); } };
  return o;
}
function mkStart() {
  const P = Parts();
  P.box(1.5, 0.03, 1.5, "#22282E", [0, 0.015, 0]);
  for (const s of [-1, 1]) { P.box(1.5, 0.012, 0.06, "#7FC8FF", [0, 0.034, s * 0.72], { glow: true }); P.box(0.06, 0.012, 1.5, "#7FC8FF", [s * 0.72, 0.034, 0], { glow: true }); }
  for (const s of [-1, 1]) P.box(0.4, 0.012, 0.07, "#7FC8FF", [s * 0.14, 0.034, -0.1], { rot: [0, s * 0.8, 0], glow: true });
  return { group: (() => { const g = new THREE.Group(); g.add(P.mesh()); return g; })() };
}
function mkExit({ H }) {
  const P = Parts();
  for (const s of [-1, 1]) { P.box(1.6, 0.012, 0.07, "#45E08A", [0, 0.01, s * 0.76], { glow: true }); P.box(0.07, 0.012, 1.6, "#45E08A", [s * 0.76, 0.01, 0], { glow: true }); }
  P.box(0.012, 0.3, 0.012, "#222", [0, H - 0.15, 0]);
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 24; const g = cv.getContext("2d");
  g.fillStyle = "#123A22"; g.fillRect(0, 0, 64, 24); g.fillStyle = "#6CFFA0"; g.font = "bold 16px monospace"; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText("EXIT", 32, 13);
  const tx = new THREE.CanvasTexture(cv); tx.magFilter = THREE.NearestFilter; tx.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.27, 0.06), [0, 0, 0, 0, 0, 0].map((_, i) => (i === 4 || i === 5 ? new THREE.MeshBasicMaterial({ map: tx }) : new THREE.MeshBasicMaterial({ color: "#1A2A20" }))));
  sign.position.y = H - 0.45;
  const group = new THREE.Group(); group.add(P.mesh(), sign);
  return { group };
}
function mixHex(a, b, t) { const c = mixc(a, b, t); return `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`; }

const PROPS = { D: mkDoor, B: mkBulkhead, K: mkKeyDoor, L: mkElevator, C: mkCrate, c: mkCabinet, l: mkLocker, w: mkWreck, g: mkGather, h: mkTrace, T: mkTerminal, P: mkPoint, v: mkCamera, G: mkGenerator, R: mkTurret, V: mkVault, F: mkBarricade, N: mkNest, S: mkStart, E: mkExit };
