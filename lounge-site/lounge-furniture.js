// プライベートラウンジの 家具の 3D の 形（ブラウザ用）。決まり（大きさ・値段・お店・置けるか）は lounge-rules.js（門番と 同じ ファイル）。部屋は lounge-room.html
// 家具の 決まりは 設計メモ（docs/mono-link-lounge.md の「家具と設備」）。値段は リソース（★1 5・★2 15・★3 40・★4 120・★5 300）
// place：floor（床。マスを ふさぐ）・rug（しく 物。ほかの 家具を 上に 置ける）・wall（奥と 左の かべに かける）
// size：床は [よこ, おく]（マス）、かべは はば（マス）。形は 0 度で 手前（+z）を 向く。かべの 物は かべの 面に 立てる
import * as THREE from "three";

import { FURN as RULE_FURN, SAMPLE_OWN, dailyIds, pullId } from "./lounge-rules.js";
export * from "./lounge-rules.js";

// 夜の 光り方を かえた 材料と、箱・つつを 置く 道具
export function kit(night) {
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8, ...o });
  const glow = (c, k = 2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: night ? k * 1.6 : k * 0.6, flatShading: true });
  const box = (g, w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const cyl = (g, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 6) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y + h / 2, z); c.castShadow = c.receiveShadow = true; g.add(c); return c; };
  const light = (g, c, k, r, x, y, z) => { if (!night) return; const p = new THREE.PointLight(c, k, r); p.position.set(x, y, z); g.add(p); };
  return { night, mat, glow, box, cyl, light };
}

const INK = "#1B2340";
function plant(K, g, s = 1) {
  K.cyl(g, 0.22 * s, 0.17 * s, 0.38 * s, K.mat("#FFFFFF"));
  K.cyl(g, 0.24 * s, 0.24 * s, 0.05 * s, K.mat("#DCE3F0"), 0, 0.36 * s);
  [[0, 0.75, 0, 0.32], [0.12, 1.0, 0.08, 0.24], [-0.1, 0.95, -0.06, 0.22], [0.02, 1.2, -0.02, 0.18]].forEach(([x, y, z, r]) => {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), K.mat(y > 1 ? "#4ADDA0" : "#22CC88")); l.position.set(x * s, y * s, z * s); l.castShadow = true; g.add(l);
  });
}

// 形（決まりは lounge-rules.js の FURN と 同じ id）
const SHAPES = [
  // ★1
  { id: "plant", build: (K, g) => plant(K, g) },
  { id: "cushion", build: (K, g) => {
    K.box(g, 0.62, 0.16, 0.62, K.mat("#FF8FB1"), -0.05, 0, 0.05); K.box(g, 0.5, 0.14, 0.5, K.mat("#FFC21A"), 0.1, 0.16, -0.06); } },
  { id: "rug", build: (K, g) => { K.box(g, 2.6, 0.03, 1.8, K.mat("#FFE3A3")); K.box(g, 2.2, 0.035, 1.4, K.mat("#FFD066")); } },
  { id: "mat", build: (K, g) => {
    K.box(g, 0.9, 0.03, 0.62, K.mat("#8E6CFF")); [-0.22, 0, 0.22].forEach((z) => K.box(g, 0.8, 0.035, 0.06, K.mat("#B9A6FF"), 0, 0, z)); } },
  { id: "window", build: (K, g) => {
    K.box(g, 2.2, 1.6, 0.1, K.mat("#DCE3F0"), 0, 1.4, 0);
    K.box(g, 2.0, 1.4, 0.12, new THREE.MeshStandardMaterial({ color: K.night ? "#3B4FB8" : "#BFE6FF", emissive: K.night ? "#2A3A9A" : "#7FD0FF", emissiveIntensity: K.night ? 0.8 : 0.3 }), 0, 1.5, 0.01);
    K.box(g, 0.06, 1.4, 0.14, K.mat("#DCE3F0"), 0, 1.5, 0.02); } },
  // ★2
  { id: "sofa", build: (K, g) => {
    const c = K.mat("#2EA8FF");
    K.box(g, 1.9, 0.35, 0.85, c, 0, 0.1, 0); K.box(g, 1.9, 0.6, 0.25, c, 0, 0.35, -0.32);
    K.box(g, 0.2, 0.45, 0.85, c, -0.85, 0.3, 0); K.box(g, 0.2, 0.45, 0.85, c, 0.85, 0.3, 0);
    K.box(g, 0.75, 0.12, 0.6, K.mat("#5BBEFF"), -0.4, 0.45, 0.05); K.box(g, 0.75, 0.12, 0.6, K.mat("#5BBEFF"), 0.4, 0.45, 0.05);
    K.box(g, 0.35, 0.35, 0.12, K.mat("#FFC21A"), -0.55, 0.6, -0.12);
    [[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]].forEach(([x, z]) => K.box(g, 0.08, 0.1, 0.08, K.mat(INK), x, 0, z)); } },
  { id: "lowtable", build: (K, g) => {
    K.box(g, 1.1, 0.08, 0.6, K.mat(INK), 0, 0.32, 0);
    [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]].forEach(([x, z]) => K.box(g, 0.06, 0.32, 0.06, K.mat(INK), x, 0, z));
    K.box(g, 0.18, 0.12, 0.18, K.mat("#FF5A64"), -0.2, 0.4, 0); K.box(g, 0.3, 0.03, 0.2, K.glow("#22CC88", 1.5), 0.25, 0.4, 0); } },
  { id: "shelf", build: (K, g) => {
    K.box(g, 1.0, 1.8, 0.4, K.mat("#FFFFFF"), 0, 0, -0.28);
    [0.45, 0.9, 1.35].forEach((y) => K.box(g, 0.96, 0.04, 0.38, K.mat("#DCE3F0"), 0, y, -0.26));
    const cs = ["#FF5A64", "#FFC21A", "#22CC88", "#2EA8FF", "#8E6CFF"];
    [0.05, 0.5, 0.95, 1.4].forEach((y, k) => { for (let n = 0; n < 5; n++) if ((n + k) % 4) K.box(g, 0.12, 0.32, 0.26, K.mat(cs[(n + k) % 5]), -0.34 + n * 0.17, y, -0.24); }); } },
  { id: "lamp", build: (K, g) => {
    K.cyl(g, 0.2, 0.2, 0.04, K.mat(INK), 0, 0, 0, 8); K.cyl(g, 0.025, 0.025, 1.5, K.mat(INK)); K.cyl(g, 0.18, 0.28, 0.32, K.glow("#FFC21A", 1.4), 0, 1.45, 0, 8);
    K.light(g, "#FFC21A", 6, 4, 0, 1.5, 0); } },
  // ★3
  { id: "desk", build: (K, g) => {
    K.box(g, 1.8, 0.08, 0.75, K.mat("#2A3157"), 0, 0.72, 0);
    K.box(g, 0.08, 0.72, 0.7, K.mat(INK), -0.85, 0, 0); K.box(g, 0.08, 0.72, 0.7, K.mat(INK), 0.85, 0, 0);
    K.box(g, 1.7, 0.03, 0.05, K.glow("#FF5A64"), 0, 0.72, 0.36);
    [[-0.38, -0.12], [0.38, 0.12]].forEach(([x, r]) => {
      const m = new THREE.Group(); K.box(m, 0.7, 0.42, 0.05, K.mat(INK)); K.box(m, 0.64, 0.36, 0.02, K.glow(x < 0 ? "#2EA8FF" : "#8E6CFF", 1.4), 0, 0.03, 0.03); K.box(m, 0.06, 0.2, 0.06, K.mat(INK), 0, -0.2, -0.05);
      m.position.set(x, 1.0, -0.15); m.rotation.y = r; g.add(m); });
    K.box(g, 0.7, 0.03, 0.22, K.mat(INK), 0, 0.8, 0.15); K.box(g, 0.66, 0.01, 0.18, K.glow("#22CC88", 0.8), 0, 0.83, 0.15);
    K.light(g, "#8E6CFF", 5, 4, 0, 1.4, 0.4); } },
  { id: "chair", build: (K, g) => {
    K.cyl(g, 0.05, 0.05, 0.4, K.mat(INK), 0, 0.05); K.cyl(g, 0.35, 0.35, 0.05, K.mat(INK), 0, 0, 0, 5);
    K.box(g, 0.6, 0.12, 0.55, K.mat("#FF5A64"), 0, 0.45, 0); K.box(g, 0.55, 0.85, 0.12, K.mat("#FF5A64"), 0, 0.55, 0.25); K.box(g, 0.2, 0.7, 0.13, K.mat(INK), 0, 0.62, 0.26); } },
  { id: "bed", build: (K, g) => {
    K.box(g, 0.95, 0.3, 1.9, K.mat("#FFFFFF"), 0, 0, 0); K.box(g, 0.9, 0.16, 1.5, K.mat("#8FC8FF"), 0, 0.3, 0.18);
    K.box(g, 0.7, 0.14, 0.32, K.mat("#FFFFFF"), 0, 0.32, -0.72); K.box(g, 0.95, 0.75, 0.08, K.mat(INK), 0, 0, -0.95); } },
  { id: "tank", build: (K, g) => {
    K.box(g, 1.7, 0.55, 0.6, K.mat(INK)); K.box(g, 1.6, 0.7, 0.5, new THREE.MeshStandardMaterial({ color: "#7FD0FF", emissive: "#2EA8FF", emissiveIntensity: K.night ? 0.9 : 0.25, transparent: true, opacity: 0.55 }), 0, 0.55, 0);
    [[-0.4, 0.8, "#FF8A3D"], [0.2, 0.95, "#FFC21A"], [0.5, 0.75, "#FF5A64"]].forEach(([x, y, c]) => K.box(g, 0.16, 0.08, 0.05, K.glow(c, 1), x, y, 0.05));
    plant(K, g, 0.35); g.children.slice(-6).forEach((m) => m.position.add(new THREE.Vector3(-0.6, 0.55, 0)));
    K.light(g, "#2EA8FF", 4, 3, 0, 1.0, 0.4); } },
  // ★4
  { id: "neon", build: (K, g) => {
    const s = new THREE.Group(); s.userData.pulse = true;
    [[-0.9, "#FF5A64"], [-0.3, "#FFC21A"], [0.3, "#22CC88"], [0.9, "#2EA8FF"]].forEach(([x, c]) => K.box(s, 0.4, 0.08, 0.06, K.glow(c, 3), x, 0, 0));
    K.box(s, 2.3, 0.06, 0.06, K.glow("#8E6CFF", 3), 0, 0.5, 0); K.box(s, 2.3, 0.06, 0.06, K.glow("#8E6CFF", 3), 0, -0.3, 0);
    s.position.y = 2.6; g.add(s); K.light(g, "#8E6CFF", 6, 5, 0, 2.6, 0.8); } },
  { id: "arcade", build: (K, g) => {
    K.box(g, 0.75, 1.75, 0.7, K.mat("#8E6CFF"), 0, 0, -0.05); K.box(g, 0.6, 0.45, 0.06, K.glow("#22CC88", 1.4), 0, 1.0, 0.3);
    K.box(g, 0.7, 0.08, 0.3, K.mat(INK), 0, 0.82, 0.38); K.box(g, 0.07, 0.07, 0.07, K.glow("#FF5A64", 2), -0.12, 0.9, 0.42); K.box(g, 0.07, 0.07, 0.07, K.glow("#FFC21A", 2), 0.1, 0.9, 0.42);
    K.box(g, 0.75, 0.2, 0.1, K.glow("#FF5A64", 1.5), 0, 1.55, 0.27); K.light(g, "#22CC88", 4, 3, 0, 1.1, 0.6); } },
  { id: "bigmon", build: (K, g) => {
    K.box(g, 1.9, 1.1, 0.08, K.mat(INK), 0, 1.0, 0);
    K.box(g, 1.78, 0.98, 0.02, K.glow("#2EA8FF", 1.2), 0, 1.06, 0.05);
    [[-0.5, 1.35, 0.5, "#FFC21A"], [0.2, 1.2, 0.9, "#22CC88"], [-0.2, 0.95, 1.1, "#FF5A64"]].forEach(([x, y, w, c]) => K.box(g, w, 0.1, 0.02, K.glow(c, 1.6), x, y, 0.07));
    K.light(g, "#2EA8FF", 6, 4, 0, 1.5, 0.8); } },
  // ★5
  { id: "holo", build: (K, g) => {
    K.cyl(g, 0.38, 0.42, 0.1, K.mat(INK), 0, 0, 0, 8); K.cyl(g, 0.3, 0.3, 0.02, K.glow("#2EA8FF", 2), 0, 0.1, 0, 8);
    const h = new THREE.Group(); h.userData.spin = true; const m = new THREE.MeshStandardMaterial({ color: "#7FE3FF", emissive: "#2EA8FF", emissiveIntensity: K.night ? 2 : 0.8, transparent: true, opacity: 0.7, flatShading: true });
    K.box(h, 0.42, 0.22, 0.18, m, 0, 0.55, 0); [[-0.15, -0.06], [0.15, -0.06], [-0.15, 0.06], [0.15, 0.06]].forEach(([x, z]) => K.box(h, 0.05, 0.32, 0.05, m, x, 0.22, z));
    K.box(h, 0.09, 0.3, 0.09, m, 0.2, 0.68, 0); K.box(h, 0.22, 0.12, 0.12, m, 0.28, 0.95, 0);
    [[-1, 0.06], [1, -0.06]].forEach(([s, z]) => { K.box(h, 0.03, 0.22, 0.03, m, 0.22, 1.05, z); K.box(h, 0.14, 0.03, 0.03, m, 0.22 + 0.06 * s, 1.22, z); });
    g.add(h); K.light(g, "#2EA8FF", 5, 3, 0, 0.9, 0); } },
  { id: "spacewin", build: (K, g) => {
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 8), K.mat("#DCE3F0")); frame.rotation.x = Math.PI / 2; frame.position.set(0, 1.6, 0); g.add(frame);
    const sky = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.12, 8), new THREE.MeshStandardMaterial({ color: "#141022", emissive: "#2A1B5E", emissiveIntensity: K.night ? 1 : 0.6 })); sky.rotation.x = Math.PI / 2; sky.position.set(0, 1.6, 0.01); g.add(sky);
    [[-0.4, 1.9], [0.3, 2.05], [0.5, 1.45], [-0.15, 1.25], [0.05, 1.75], [-0.55, 1.5]].forEach(([x, y]) => K.box(g, 0.05, 0.05, 0.02, K.glow("#FFFFFF", 2), x, y, 0.08));
    const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), K.glow("#FF8FC4", 0.9)); pl.position.set(0.25, 1.55, 0.1); g.add(pl);
    K.light(g, "#8E6CFF", 5, 4, 0, 1.6, 0.8); } },
  // 設備（家具では ないが、ここで 動かせる）と、しまえない 物
  { id: "rack", build: (K, g) => {
    K.box(g, 0.8, 2.0, 0.8, K.mat(INK));
    for (let k = 0; k < 6; k++) { K.box(g, 0.7, 0.04, 0.02, K.glow(k % 2 ? "#22CC88" : "#2EA8FF", 2), 0, 0.25 + k * 0.28, 0.41); K.box(g, 0.06, 0.06, 0.02, K.glow("#FF5A64", 2.5), 0.28, 0.32 + k * 0.28, 0.41); } } },
  { id: "pc", build: (K, g) => {
    K.box(g, 0.9, 0.06, 0.6, K.mat("#2A3157"), 0, 0.7, -0.1); K.box(g, 0.06, 0.7, 0.55, K.mat(INK), -0.4, 0, -0.1); K.box(g, 0.06, 0.7, 0.55, K.mat(INK), 0.4, 0, -0.1);
    K.box(g, 0.55, 0.36, 0.05, K.mat(INK), -0.08, 0.95, -0.3); K.box(g, 0.5, 0.3, 0.02, K.glow("#FFB547", 1.2), -0.08, 0.98, -0.27); K.box(g, 0.05, 0.2, 0.05, K.mat(INK), -0.08, 0.76, -0.33);
    K.box(g, 0.22, 0.5, 0.45, K.mat(INK), 0.28, 0.76, -0.12); K.box(g, 0.02, 0.4, 0.36, new THREE.MeshStandardMaterial({ color: "#8E6CFF", emissive: "#8E6CFF", emissiveIntensity: K.night ? 1.5 : 0.5, transparent: true, opacity: 0.85 }), 0.4, 0.8, -0.12);
    K.light(g, "#FFB547", 3, 3, 0, 1.2, 0.3); } },
];
export const FURN = RULE_FURN.map((f) => ({ ...f, build: SHAPES.find((x) => x.id === f.id).build }));
export const F = (id) => FURN.find((f) => f.id === id);

// 地下の 隠れ家への はしご（床の ふた）。動かせない
export function buildHatch(K, g) {
  K.box(g, 0.94, 0.04, 0.94, K.mat("#2A3157"), 0, -0.02, 0);
  K.box(g, 0.78, 0.05, 0.78, new THREE.MeshStandardMaterial({ color: "#FFE3B8", emissive: "#FFB547", emissiveIntensity: K.night ? 1.4 : 0.5 }), 0, -0.01, 0);
  [-0.22, 0.22].forEach((x) => K.box(g, 0.05, 0.55, 0.05, K.mat("#C9D3EA"), x, 0, -0.32));
  K.box(g, 0.5, 0.04, 0.05, K.mat("#C9D3EA"), 0, 0.5, -0.32);
  K.light(g, "#FFB547", 3, 2.5, 0, 0.3, 0);
}

// ---------- お店：決まりは lounge-rules.js。ここでは 3D の 形つきの 家具を 返す ----------
export const SALE = FURN.filter((f) => f.star > 0);
export const dailyOf = (day) => dailyIds(day).map(F);
export const pull = (R = Math.random) => F(pullId(R));

// 見本の 持ち物と リソース（お店と 部屋で 同じ 物を 見る。ほんものは 門番の 記録 /api/me）。ブラウザに しまう（使えない ときは 見本の 数）
const KEY = "mono-link-lounge-proto";
export function loadWallet() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.own) return { res: v.res ?? 128, own: { ...SAMPLE_OWN, ...v.own } }; } catch (e) {} return { res: 128, own: { ...SAMPLE_OWN } }; }
export function saveWallet(w) { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {} }
