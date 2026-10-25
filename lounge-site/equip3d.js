// 装備の 3D の小物と、ペットに着せる処理（試作）
// makeItem(base)：小物 1 つ。帽子は半径 1・底が y=0、首の物は高さ 1 くらいで前（+z）向き、手の物は持つところが原点で上へのびる
// wear(pet, items)：pet.userData.anchors の場所にくっつける（帽子をかぶると、もとの帽子や花は隠す）
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MATS, COLS, comboOf, baseOf } from "./equip.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const toy = (c, r = 0.38, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...o });
const metal = (c, r = 0.25) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.75 });
function put(p, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; }
const cyl = (rt, rb, h, seg = 32) => new THREE.CylinderGeometry(rt, rb, h, seg);
const ball = (r, sx = 1, sy = 1, sz = 1, seg = 32) => { const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)); g.scale(sx, sy, sz); return g; };
const dome = (r, h = 1, seg = 36) => { const g = new THREE.SphereGeometry(r, seg, 14, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, h, 1); return g; };

const MAKE = {
  // ---- あたま ----
  helmet() { const g = new THREE.Group(), y = toy("#FFC928", 0.28); put(g, dome(1, 0.82), y); put(g, cyl(1.18, 1.18, 0.08, 40), y).scale.set(1, 1, 1.12); put(g, new THREE.BoxGeometry(0.22, 0.16, 1.7), y, 0, 0.72, 0); put(g, cyl(1.005, 1.005, 0.16, 40), toy("#FFFFFF", 0.3), 0, 0.3, 0); return g; },
  knit() { const g = new THREE.Group(), red = toy("#E8473F", 0.7), wh = toy("#FFF8F0", 0.7); put(g, dome(1, 1.15), red); put(g, new THREE.TorusGeometry(0.98, 0.16, 12, 40), wh, 0, 0.06, 0).rotation.x = Math.PI / 2; put(g, ball(0.32), wh, 0, 1.2, 0); return g; },
  straw() { const g = new THREE.Group(), st = toy("#F2D27A", 0.75); put(g, cyl(1.65, 1.7, 0.07, 48), st, 0, 0.02, 0); put(g, cyl(0.86, 0.95, 0.7, 40), st, 0, 0.38, 0); put(g, dome(0.86, 0.3), st, 0, 0.73, 0); put(g, cyl(0.96, 0.97, 0.18, 40), toy("#E8393C", 0.5), 0, 0.15, 0); return g; },
  nabe() { const g = new THREE.Group(), sil = metal("#C9CED8", 0.3); put(g, dome(1.12, 0.32, 48), sil); put(g, cyl(1.14, 1.14, 0.05, 48), sil); put(g, cyl(0.16, 0.2, 0.18, 24), toy("#2B2B33", 0.4), 0, 0.42, 0); put(g, ball(0.2, 1, 0.6, 1), toy("#2B2B33", 0.4), 0, 0.54, 0); return g; },
  // ---- くび ----
  bowtie() { const g = new THREE.Group(), r = toy("#E8393C", 0.35); [-1, 1].forEach((k) => { const c = put(g, new THREE.ConeGeometry(0.42, 0.75, 4), r, 0.38 * k, 0, 0); c.rotation.z = (Math.PI / 2) * k; c.scale.set(1, 1, 0.45); }); put(g, ball(0.2, 1, 1, 0.8), toy("#C42A2E", 0.35)); return g; },
  omamori() { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.22, 0.04, 8, 24), toy("#FFD24A", 0.3), 0, 0.42, 0); put(g, new THREE.BoxGeometry(0.5, 0.72, 0.12), toy("#FF7FA8", 0.45)); put(g, new THREE.BoxGeometry(0.34, 0.34, 0.02), toy("#FFF4E0", 0.5), 0, 0.02, 0.07); return g; },
  bib() { const g = new THREE.Group(); put(g, new THREE.CircleGeometry(0.8, 40, Math.PI, Math.PI), toy("#FFFFFF", 0.6, { side: THREE.DoubleSide }), 0, 0.12, 0);
    const t = put(g, new THREE.TorusGeometry(0.8, 0.07, 8, 40, Math.PI), toy("#6FA0FF", 0.5), 0, 0.12, 0.01); t.rotation.z = Math.PI; put(g, new THREE.BoxGeometry(1.7, 0.12, 0.08), toy("#6FA0FF", 0.5), 0, 0.12, 0.01);
    put(g, ball(0.16, 1, 1, 0.3), toy("#FFC93C", 0.4), 0, -0.3, 0.03); return g; },
  gold() { const g = new THREE.Group(), au = metal("#FFC93C", 0.2); const ch = put(g, new THREE.TorusGeometry(0.8, 0.045, 8, 48, Math.PI), au, 0, 0.55, 0); ch.rotation.z = Math.PI; put(g, cyl(0.3, 0.3, 0.08, 32), au, 0, -0.3, 0.04).rotation.x = Math.PI / 2; put(g, new THREE.TorusGeometry(0.22, 0.03, 6, 24), metal("#FFE38A", 0.15), 0, -0.3, 0.09); return g; },
  // ---- おまけ ----
  stick() { const g = new THREE.Group(), w = toy("#9A6A3E", 0.8); put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, -0.15, 0), V(0.04, 0.4, 0), V(-0.03, 0.85, 0), V(0.02, 1.2, 0)]), 20, 0.07, 8), w);
    put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.01, 0.75, 0), V(0.18, 0.92, 0), V(0.26, 1.02, 0)]), 10, 0.04, 6), w); put(g, ball(0.09, 1, 0.6, 0.4), toy("#47B85A", 0.6), 0.28, 1.06, 0); return g; },
  pikopiko() { const g = new THREE.Group(); put(g, cyl(0.06, 0.06, 1.0, 16), toy("#FFC93C", 0.35), 0, 0.35, 0); const h = new THREE.Group(); h.position.set(0, 0.95, 0); h.rotation.z = Math.PI / 2; g.add(h);
    put(h, cyl(0.24, 0.24, 0.55, 28), toy("#E8393C", 0.35)); [-1, 1].forEach((k) => put(h, cyl(0.26, 0.26, 0.1, 28), toy("#FFC93C", 0.35), 0, 0.3 * k, 0)); return g; },
  mizudeppo() { const g = new THREE.Group(), gr = toy("#2FC27A", 0.35), og = toy("#FF8B3D", 0.35); put(g, new THREE.BoxGeometry(0.2, 0.45, 0.2), og, 0, 0.1, 0); const b = put(g, new THREE.CapsuleGeometry(0.17, 0.5, 6, 16), gr, 0, 0.42, 0.22); b.rotation.x = Math.PI / 2;
    put(g, cyl(0.06, 0.06, 0.3, 16), og, 0, 0.42, 0.68).rotation.x = Math.PI / 2; put(g, ball(0.16), toy("#7FD3FF", 0.15, { transparent: true, opacity: 0.85 }), 0, 0.64, 0.1); return g; },
  kamifusen() { const g = new THREE.Group(); const geo = new THREE.IcosahedronGeometry(0.42, 1).toNonIndexed(); geo.computeVertexNormals(); const cols = ["#FF5A64", "#FFC21A", "#2EA8FF", "#22CC88", "#FFFFFF"], c = [];
    for (let i = 0; i < geo.attributes.position.count; i += 3) { const col = new THREE.Color(cols[(i / 3) % cols.length]); for (let j = 0; j < 3; j++) c.push(col.r, col.g, col.b); }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); put(g, geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true }), 0, 0.85, 0); put(g, cyl(0.01, 0.01, 0.45, 6), toy("#FFFFFF", 0.5), 0, 0.22, 0); return g; },
  // ---- ミシック（行き先ごとに 1 つ）----
  halsCloak() { const g = new THREE.Group(), gr = toy("#3F9A55", 0.75, { side: THREE.DoubleSide }), dg = toy("#2E7A40", 0.7, { side: THREE.DoubleSide }), au = toy("#FFC93C", 0.3);
    put(g, new THREE.CylinderGeometry(0.42, 0.9, 1.05, 40, 1, true, Math.PI * 0.16, Math.PI * 1.68), gr, 0, -0.1, -0.1);
    const hood = put(g, new THREE.SphereGeometry(0.42, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), dg, 0, 0.42, -0.42); hood.rotation.x = -1.2; hood.scale.set(1, 1, 0.75);
    put(g, new THREE.TorusGeometry(0.43, 0.08, 8, 40, Math.PI * 1.7), dg, 0, 0.43, -0.1).rotation.set(Math.PI / 2, 0, Math.PI / 2 + Math.PI * 0.15);
    [-1, 1].forEach((k) => put(g, cyl(0.11, 0.11, 0.06, 24), au, 0.14 * k, 0.4, 0.33).rotation.x = Math.PI / 2);
    put(g, new THREE.BoxGeometry(0.2, 0.035, 0.03), au, 0, 0.4, 0.36); put(g, ball(0.06, 1, 1.4, 0.5), toy("#9BF0A8", 0.35), -0.14, 0.4, 0.37); return g; },
  morphMask() { const g = new THREE.Group(), lv = toy("#C9B6FF", 0.35), dk = toy("#3B2E6B", 0.4), au = toy("#FFD24A", 0.3);
    const m = new THREE.Group(); m.position.set(0, 0.95, 0.2); m.rotation.x = -0.3; g.add(m);
    const fg = new THREE.SphereGeometry(0.85, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2); fg.rotateX(Math.PI / 2); fg.scale(1, 1.12, 0.5); put(m, fg, lv);
    [-1, 1].forEach((k) => { const e = put(m, new THREE.TorusGeometry(0.17, 0.05, 8, 20, Math.PI), dk, 0.32 * k, 0.08, 0.37); e.rotation.z = Math.PI; });
    const moon = put(m, new THREE.TorusGeometry(0.15, 0.06, 8, 24, Math.PI * 1.3), au, 0, 0.6, 0.27); moon.rotation.z = 0.9;
    [-1, 1].forEach((k) => put(m, ball(0.1, 1, 0.7, 0.5), toy("#FF9FD0", 0.4), 0.46 * k, -0.2, 0.33)); put(m, new THREE.TorusGeometry(0.08, 0.03, 6, 16, Math.PI), dk, 0, -0.42, 0.33); return g; },
  kuraiLantern() { const g = new THREE.Group(), ir = toy("#2B3047", 0.45), glow = toy("#FFB547", 0.3, { emissive: "#FF9A2E", emissiveIntensity: 1.6 });
    put(g, cyl(0.05, 0.05, 0.75, 12), toy("#7A5A3A", 0.8), 0, 0.2, 0); put(g, new THREE.TorusGeometry(0.12, 0.03, 6, 20), ir, 0, 0.66, 0);
    const L = new THREE.Group(); L.position.set(0, 1.02, 0); g.add(L);
    put(L, cyl(0.24, 0.24, 0.4, 24), toy("#FFE1A8", 0.15, { transparent: true, opacity: 0.55, emissive: "#FF9A2E", emissiveIntensity: 0.5 })); put(L, ball(0.13), glow);
    put(L, new THREE.ConeGeometry(0.32, 0.2, 24), ir, 0, 0.3, 0); put(L, cyl(0.3, 0.3, 0.06, 24), ir, 0, -0.23, 0);
    [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI * 2 + 0.4; put(L, cyl(0.025, 0.025, 0.42, 6), ir, Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25); }); return g; },
  crystalCrown() { const g = new THREE.Group(), au = metal("#FFC93C", 0.2), cr = toy("#8FE6FF", 0.08, { transparent: true, opacity: 0.88, emissive: "#3CC8FF", emissiveIntensity: 0.35, flatShading: true });
    put(g, new THREE.CylinderGeometry(0.88, 0.92, 0.32, 40, 1, true), toy("#FFC93C", 0.3, { side: THREE.DoubleSide }), 0, 0.16, 0);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, h = i % 2 ? 0.55 : 0.85, o = put(g, new THREE.OctahedronGeometry(0.2, 0), cr, Math.sin(a) * 0.88, 0.32 + h * 0.45, Math.cos(a) * 0.88); o.scale.set(0.8, h * 2.4, 0.8); }
    put(g, ball(0.12), toy("#FF5A8A", 0.15, { emissive: "#FF3A6A", emissiveIntensity: 0.4 }), 0, 0.18, 0.93); return g; },
};
export const makeItem = (base) => (MAKE[base] || MAKE.stick)();

// ---------- 組み合わせの 装備（形.素材.色）：形ごとの 作り方に、素材（色・あらさ・金属・光る・すきとおる）と 色（かざり）を わたす ----------
// 大きさと 向きは 上の 物と 同じ（あたまは 半径 1・底が y=0、くびは 高さ 1 で 前向き、手の 物は 持つ ところが 原点で 上へ）
const shade = (hex, k) => { const c = new THREE.Color(hex); return k < 0 ? c.multiplyScalar(1 + k) : c.lerp(new THREE.Color("#ffffff"), k); };
function palette(matId, col) {
  const M = MATS[matId] || MATS.cloth, o = { color: M.c, roughness: M.r ?? 0.5, metalness: (M.m || 0) * 0.5 };   // 映り込みの ない 部屋では 金属が 黒く なるので 半分に
  if (M.e) Object.assign(o, { emissive: M.c, emissiveIntensity: M.e });
  if (M.glass) Object.assign(o, { transparent: true, opacity: 0.82, flatShading: true });
  const tint = COLS[col] ? COLS[col].c : shade(M.c, -0.32);
  return { main: new THREE.MeshStandardMaterial(o), mainDS: new THREE.MeshStandardMaterial({ ...o, side: THREE.DoubleSide }), accent: toy(tint, 0.45), accentDS: toy(tint, 0.45, { side: THREE.DoubleSide }),
    light: toy(shade(M.c, 0.55), 0.6), dark: toy("#2B2B33", 0.5), gem: toy(COLS[col] ? COLS[col].c : "#7FD3FF", 0.12, { emissive: COLS[col] ? COLS[col].c : "#7FD3FF", emissiveIntensity: 0.25 }), metal: metal("#D9DEE6", 0.25) };
}
const tube = (pts, r, seg = 20, rad = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => V(x, y, z))), seg, r, rad);
const FORM3D = {
  // あたま
  helmet(p) { const g = new THREE.Group(); put(g, dome(1, 0.82), p.main); put(g, cyl(1.18, 1.18, 0.08, 40), p.main).scale.set(1, 1, 1.12); put(g, new THREE.BoxGeometry(0.22, 0.16, 1.7), p.accent, 0, 0.72, 0); put(g, cyl(0.2, 0.2, 0.12, 24), p.gem, 0, 0.5, 0.86).rotation.x = Math.PI / 2; return g; },
  cap(p) { const g = new THREE.Group(); put(g, dome(1, 1.15), p.main); put(g, new THREE.TorusGeometry(0.98, 0.16, 12, 40), p.accent, 0, 0.06, 0).rotation.x = Math.PI / 2; put(g, ball(0.3), p.accent, 0, 1.2, 0); return g; },
  hat(p) { const g = new THREE.Group(); put(g, cyl(1.65, 1.7, 0.07, 48), p.main, 0, 0.02, 0); put(g, cyl(0.86, 0.95, 0.7, 40), p.main, 0, 0.38, 0); put(g, dome(0.86, 0.3), p.main, 0, 0.73, 0); put(g, cyl(0.96, 0.97, 0.2, 40), p.accent, 0, 0.16, 0); return g; },
  hood(p) { const g = new THREE.Group(), s = new THREE.SphereGeometry(1, 36, 18, Math.PI * 0.62, Math.PI * 1.76, 0, Math.PI * 0.62); put(g, s, p.mainDS, 0, 0.2, 0).scale.set(1, 1.1, 1);
    put(g, new THREE.TorusGeometry(0.62, 0.08, 8, 30, Math.PI * 1.4), p.accent, 0, 0.55, 0.28).rotation.set(0.35, 0, Math.PI * -0.2); put(g, new THREE.ConeGeometry(0.22, 0.6, 16), p.main, 0, 1.35, -0.25).rotation.x = -0.6; put(g, ball(0.13), p.accent, 0, 1.62, -0.42); return g; },
  // くび
  tie(p) { const g = new THREE.Group(); [-1, 1].forEach((k) => { const c = put(g, new THREE.ConeGeometry(0.42, 0.75, 4), p.main, 0.38 * k, 0, 0); c.rotation.z = (Math.PI / 2) * k; c.scale.set(1, 1, 0.45); }); put(g, ball(0.17, 1, 1, 0.7), p.accent); return g; },
  scarf(p) { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.62, 0.2, 14, 40), p.main, 0, 0.42, 0).rotation.x = Math.PI / 2; [0.12, -0.18].forEach((x, i) => { const t = put(g, new THREE.BoxGeometry(0.34, 0.8, 0.12), p.main, x, 0.0, 0.62); t.rotation.z = i ? 0.15 : -0.1; put(t, new THREE.BoxGeometry(0.35, 0.09, 0.13), p.accent, 0, -0.22, 0); put(t, new THREE.BoxGeometry(0.35, 0.09, 0.13), p.accent, 0, -0.34, 0); }); return g; },
  bib(p) { const g = new THREE.Group(); put(g, new THREE.CircleGeometry(0.8, 40, Math.PI, Math.PI), p.mainDS, 0, 0.12, 0); const t = put(g, new THREE.TorusGeometry(0.8, 0.07, 8, 40, Math.PI), p.accent, 0, 0.12, 0.01); t.rotation.z = Math.PI; put(g, new THREE.BoxGeometry(1.7, 0.12, 0.08), p.accent, 0, 0.12, 0.01); put(g, ball(0.16, 1, 1, 0.3), p.gem, 0, -0.3, 0.03); return g; },
  necklace(p) { const g = new THREE.Group(), ch = put(g, new THREE.TorusGeometry(0.8, 0.045, 8, 48, Math.PI), p.main, 0, 0.55, 0); ch.rotation.z = Math.PI; put(g, cyl(0.3, 0.3, 0.08, 32), p.main, 0, -0.3, 0.04).rotation.x = Math.PI / 2; put(g, ball(0.14, 1, 1, 0.5), p.gem, 0, -0.3, 0.1); return g; },
  // うで
  glove(p) { const g = new THREE.Group(); put(g, new RoundedBoxGeometry(0.7, 0.62, 0.3, 4, 0.12), p.main, 0, 0.45, 0); [-0.24, -0.08, 0.08, 0.24].forEach((x, i) => put(g, new THREE.CapsuleGeometry(0.075, 0.28 + (i === 1 || i === 2 ? 0.06 : 0), 4, 10), p.main, x, 0.92, 0));
    put(g, new THREE.CapsuleGeometry(0.08, 0.22, 4, 10), p.main, 0.42, 0.5, 0.05).rotation.z = -0.9; put(g, cyl(0.4, 0.38, 0.26, 28), p.accent, 0, 0.06, 0).scale.set(1, 1, 0.55); return g; },
  bangle(p) { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.55, 0.13, 14, 40), p.main, 0, 0.6, 0); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; put(g, ball(0.09), p.gem, Math.cos(a) * 0.55, 0.6 + Math.sin(a) * 0.55, 0.12); } return g; },
  band(p) { const g = new THREE.Group(); put(g, new THREE.CylinderGeometry(0.5, 0.5, 0.5, 36, 1, true), p.mainDS, 0, 0.5, 0); put(g, new THREE.TorusGeometry(0.5, 0.05, 8, 36), p.accent, 0, 0.5, 0).rotation.x = Math.PI / 2; [-0.25, 0.25].forEach((y) => put(g, new THREE.TorusGeometry(0.5, 0.035, 6, 36), p.light, 0, 0.5 + y, 0).rotation.x = Math.PI / 2); return g; },
  gauntlet(p) { const g = new THREE.Group(); put(g, cyl(0.42, 0.5, 0.8, 28), p.main, 0, 0.4, 0); put(g, new RoundedBoxGeometry(0.75, 0.32, 0.5, 3, 0.1), p.main, 0, 0.95, 0.05); [-0.24, 0, 0.24].forEach((x) => put(g, ball(0.07), p.accent, x, 0.98, 0.3)); put(g, new THREE.TorusGeometry(0.5, 0.06, 8, 30), p.accent, 0, 0.02, 0).rotation.x = Math.PI / 2; return g; },
  // あし
  boots(p) { const g = new THREE.Group(); put(g, cyl(0.32, 0.34, 0.9, 28), p.main, 0, 0.75, 0); put(g, new RoundedBoxGeometry(0.62, 0.4, 1.0, 4, 0.18), p.main, 0, 0.22, 0.22); put(g, new RoundedBoxGeometry(0.66, 0.1, 1.06, 2, 0.04), p.dark, 0, 0.02, 0.22); put(g, new THREE.TorusGeometry(0.33, 0.06, 8, 28), p.accent, 0, 1.18, 0).rotation.x = Math.PI / 2; return g; },
  sneakers(p) { const g = new THREE.Group(); put(g, new RoundedBoxGeometry(0.6, 0.42, 1.1, 4, 0.2), p.main, 0, 0.3, 0); put(g, new RoundedBoxGeometry(0.64, 0.14, 1.16, 2, 0.06), p.light, 0, 0.07, 0); [0.05, 0.2, 0.35].forEach((z) => put(g, new THREE.BoxGeometry(0.4, 0.04, 0.05), p.accent, 0, 0.52, z));
    put(g, new THREE.TorusGeometry(0.16, 0.05, 6, 16, Math.PI), p.accent, -0.31, 0.32, -0.15).rotation.y = Math.PI / 2; return g; },
  geta(p) { const g = new THREE.Group(); put(g, new RoundedBoxGeometry(0.55, 0.12, 1.15, 2, 0.04), p.main, 0, 0.36, 0); [-0.3, 0.3].forEach((z) => put(g, new THREE.BoxGeometry(0.5, 0.28, 0.1), p.main, 0, 0.16, z)); const v = put(g, new THREE.TorusGeometry(0.22, 0.04, 6, 20, Math.PI), p.accent, 0, 0.42, -0.08); v.rotation.x = -Math.PI / 2; v.scale.set(1, 1.6, 1); put(g, ball(0.05), p.accent, 0, 0.45, 0.28); return g; },
  socks(p) { const g = new THREE.Group(); put(g, cyl(0.26, 0.26, 0.9, 24), p.main, 0, 0.75, 0); put(g, new THREE.CapsuleGeometry(0.26, 0.5, 6, 16), p.main, 0, 0.26, 0.24).rotation.x = Math.PI / 2; [1.05, 0.9].forEach((y) => put(g, cyl(0.27, 0.27, 0.08, 24), p.accent, 0, y, 0)); put(g, ball(0.27, 1, 1, 0.9), p.accent, 0, 0.26, 0.62); return g; },
  // 武器
  stick(p) { const g = new THREE.Group(); put(g, tube([[0, -0.15, 0], [0.04, 0.4, 0], [-0.03, 0.85, 0], [0.02, 1.2, 0]], 0.07), p.main); put(g, tube([[-0.01, 0.75, 0], [0.18, 0.92, 0], [0.26, 1.02, 0]], 0.04, 10, 6), p.main); put(g, ball(0.09, 1, 0.6, 0.4), p.accent, 0.28, 1.06, 0); return g; },
  hammer(p) { const g = new THREE.Group(); put(g, cyl(0.06, 0.06, 1.0, 16), p.main, 0, 0.35, 0); const h = new THREE.Group(); h.position.set(0, 0.95, 0); h.rotation.z = Math.PI / 2; g.add(h); put(h, cyl(0.24, 0.24, 0.55, 28), p.accent); [-1, 1].forEach((k) => put(h, cyl(0.26, 0.26, 0.1, 28), p.main, 0, 0.3 * k, 0)); return g; },
  gun(p) { const g = new THREE.Group(); put(g, new RoundedBoxGeometry(0.22, 0.5, 0.2, 2, 0.06), p.accent, 0, 0.12, 0).rotation.z = -0.25; put(g, new THREE.CapsuleGeometry(0.17, 0.55, 6, 16), p.main, 0.3, 0.46, 0).rotation.z = Math.PI / 2;
    put(g, cyl(0.06, 0.06, 0.3, 16), p.accent, 0.8, 0.46, 0).rotation.z = Math.PI / 2; put(g, ball(0.17), toy("#7FD3FF", 0.15, { transparent: true, opacity: 0.85 }), 0.18, 0.7, 0); put(g, new THREE.TorusGeometry(0.1, 0.03, 6, 16, Math.PI), p.accent, 0.16, 0.2, 0).rotation.z = Math.PI; return g; },
  balloon(p) { const g = new THREE.Group(), geo = new THREE.IcosahedronGeometry(0.42, 1).toNonIndexed(); geo.computeVertexNormals(); const a = new THREE.Color(p.main.color), b = new THREE.Color(p.accent.color), c = [];
    for (let i = 0; i < geo.attributes.position.count; i += 3) { const col = (i / 3) % 2 ? a : b; for (let j = 0; j < 3; j++) c.push(col.r, col.g, col.b); }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); put(g, geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true }), 0, 0.85, 0); put(g, cyl(0.01, 0.01, 0.45, 6), toy("#FFFFFF", 0.6), 0, 0.22, 0); return g; },
  // オフハンド
  shield(p) { const g = new THREE.Group(), m = new THREE.Group(); m.rotation.x = Math.PI / 2; m.position.set(0, 0.7, 0); g.add(m); put(m, dome(0.85, 0.3, 48), p.main); put(m, new THREE.TorusGeometry(0.85, 0.07, 8, 48), p.accent).rotation.x = Math.PI / 2; put(m, ball(0.16), p.accent, 0, 0.28, 0); return g; },
  book(p) { const g = new THREE.Group(); put(g, new RoundedBoxGeometry(0.9, 1.15, 0.28, 3, 0.05), p.main, 0, 0.6, 0); put(g, new THREE.BoxGeometry(0.82, 1.07, 0.22), p.light, 0.04, 0.6, 0); put(g, new THREE.BoxGeometry(0.1, 1.17, 0.3), p.accent, -0.42, 0.6, 0); put(g, cyl(0.17, 0.17, 0.04, 24), p.gem, 0.05, 0.62, 0.15).rotation.x = Math.PI / 2; return g; },
  fan(p) { const g = new THREE.Group(); put(g, new THREE.CircleGeometry(0.55, 40), p.mainDS, 0, 0.95, 0); put(g, new THREE.TorusGeometry(0.55, 0.035, 6, 40), p.accent, 0, 0.95, 0); for (let i = -2; i <= 2; i++) put(g, new THREE.BoxGeometry(0.02, 1.0, 0.02), p.accent, 0, 0.95, 0.01).rotation.z = i * 0.35; put(g, cyl(0.05, 0.05, 0.6, 12), p.accent, 0, 0.2, 0); return g; },
  lantern(p) { const g = new THREE.Group(); put(g, cyl(0.04, 0.04, 0.6, 10), p.main, 0, 0.15, 0); const L = new THREE.Group(); L.position.set(0, 0.85, 0); g.add(L);
    put(L, cyl(0.26, 0.26, 0.42, 24), toy("#FFE1A8", 0.15, { transparent: true, opacity: 0.55, emissive: "#FF9A2E", emissiveIntensity: 0.5 })); put(L, ball(0.13), p.gem); put(L, new THREE.ConeGeometry(0.34, 0.22, 24), p.main, 0, 0.32, 0); put(L, cyl(0.32, 0.32, 0.06, 24), p.main, 0, -0.24, 0);
    [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI * 2 + 0.4; put(L, cyl(0.025, 0.025, 0.44, 6), p.accent, Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27); }); return g; },
  // アクセサリー
  amulet(p) { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.22, 0.04, 8, 24), p.accent, 0, 0.42, 0); put(g, new THREE.BoxGeometry(0.5, 0.72, 0.12), p.main); put(g, new THREE.BoxGeometry(0.3, 0.36, 0.13), p.light, 0, -0.05, 0.01); return g; },
  brooch(p) { const g = new THREE.Group(), m = new THREE.Group(); m.rotation.x = Math.PI / 2; m.position.y = 0.5; g.add(m); put(m, cyl(0.45, 0.45, 0.1, 32), p.main); put(m, new THREE.TorusGeometry(0.45, 0.05, 8, 32), p.accent).rotation.x = Math.PI / 2; put(m, ball(0.2, 1, 0.6, 1), p.gem, 0, 0.1, 0); return g; },
  ring(p) { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.45, 0.08, 12, 40), p.main, 0, 0.45, 0); put(g, new THREE.OctahedronGeometry(0.2, 0), p.gem, 0, 0.98, 0).scale.set(1, 1.2, 1); put(g, cyl(0.12, 0.16, 0.12, 6), p.main, 0, 0.86, 0); return g; },
  keychain(p) { const g = new THREE.Group(); put(g, new THREE.TorusGeometry(0.22, 0.035, 8, 24), p.metal, 0, 1.0, 0); put(g, cyl(0.02, 0.02, 0.25, 6), p.metal, 0, 0.72, 0);
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.17 : 0.4, a = (i / 10) * Math.PI * 2 + Math.PI / 2; (i ? s.lineTo : s.moveTo).call(s, Math.cos(a) * r, Math.sin(a) * r); }
    const st = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); st.center(); put(g, st, p.main, 0, 0.3, 0); put(g, ball(0.06), p.accent, 0, 0.3, 0.1); return g; },
};
// 組み合わせの id（"glove.iron.5"）から 3D を 作る。ちがう id は 上の 名前の ある 物
export function makeGear(id) { const c = comboOf(id); if (!c) return makeItem(baseOf(id)?.look || id); return (FORM3D[c.form] || FORM3D.stick)(palette(c.mat, c.col)); }

// 着せる：あたまは頭の上、くびは首の前、武器は手（武器が ないときは オフハンドを 手に）。うで・あし・アクセサリーは 付け所が ないので 絵に 出さない
export function wear(pet, items) {
  const A = pet.userData.anchors; if (!A) return [];
  const at = { head: "head", neck: "neck", weapon: "hand", off: "hand" }, used = new Set(), made = [];
  const list = [...items].sort((a, b) => (baseOf(a.base)?.slot === "off") - (baseOf(b.base)?.slot === "off"));
  for (const it of list) {
    const slot = at[baseOf(it.base)?.slot], a = A[slot]; if (!a || used.has(slot)) continue;
    used.add(slot); const m = makeGear(it.base); m.position.copy(a.pos); m.scale.setScalar(a.s);
    if (slot === "hand") { if (a.lie) m.rotation.set(0, 0, -Math.PI / 2 + 0.2); else m.rotation.set(a.rx ?? 1.15, 0, a.rz ?? -0.2); }
    a.parent.add(m); (a.hide || []).forEach((h) => (h.visible = slot === "head" ? false : h.visible)); made.push(m);
  }
  return made;
}

// VR ゴーグル：ダンジョンに出かけているあいだ、顔に付ける（横幅 2・前が +z）
export function makeGoggles() {
  const g = new THREE.Group(), wh = toy("#F4F6FA", 0.3), dk = toy("#141826", 0.12), glow = (c) => toy(c, 0.2, { emissive: c, emissiveIntensity: 1.1 });
  put(g, new RoundedBoxGeometry(2.1, 1.05, 0.8, 4, 0.3), wh, 0, 0, 0.1);
  put(g, new RoundedBoxGeometry(1.8, 0.78, 0.1, 3, 0.16), dk, 0, -0.02, 0.5);
  put(g, new THREE.BoxGeometry(1.2, 0.05, 0.02), glow("#46D4FF"), 0, -0.22, 0.56);
  put(g, new THREE.SphereGeometry(0.075, 12, 8), glow("#52F2A0"), 0.7, 0.24, 0.56);
  put(g, new RoundedBoxGeometry(2.24, 0.34, 0.5, 2, 0.12), toy("#D9DEE8", 0.4), 0, 0.42, 0.05);
  const band = put(g, new THREE.TorusGeometry(1.12, 0.13, 8, 40, Math.PI), toy("#3A3F55", 0.6), 0, 0, -0.25); band.rotation.set(Math.PI / 2, 0, Math.PI); band.scale.set(1, 1.15, 1);
  return g;
}
export function wearGoggles(pet) { const a = pet.userData.anchors?.face; if (!a) return null; const m = makeGoggles(); m.position.copy(a.pos); m.scale.setScalar(a.s); a.parent.add(m); return m; }
