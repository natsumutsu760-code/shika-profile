// ラウンジのペット v3（PostPet の「らしさ」から考え直し）。makePet3(species) が THREE.Group を返す
// ・種類ごとに体のつくりから変える（ひょろ長い・ずんぐり・箱・浮く・鉢植え・四つ足）
// ・動物だけでなく道具も住人にする（MONO LINK らしく、パソコン・配信・手紙・リソースの道具）
// ・はっきりしたおもちゃの色と、つるっとしたソフビ・プラスチックの質感
// ・顔も種類ごとに作りを変える（半目とまつげ・ぎょろ目・画面の顔・糸目 など）
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ball = (r, sx = 1, sy = 1, sz = 1, seg = 32) => { const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)); g.scale(sx, sy, sz); return g; };
const tube = (pts, r, seg = 10, n = 32) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, seg, false);
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 18);
const cyl = (rt, rb, h, seg = 32) => new THREE.CylinderGeometry(rt, rb, h, seg);
const rbox = (w, h, d, rad) => new RoundedBoxGeometry(w, h, d, 4, rad);
const toy = (c, r = 0.36, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...o }); // ソフビ・プラスチック
function put(p, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; }
// だ円体（中心 c・半径 a,b,d）の表面の点と外向き
function ell(c, a, b, d, dir) { const u = dir.clone().normalize(), t = 1 / Math.hypot(u.x / a, u.y / b, u.z / d), p = u.multiplyScalar(t); return { p: p.clone().add(c), n: V(p.x / a / a, p.y / b / b, p.z / d / d).normalize() }; }
// 表面に貼るグループ（+z が外向き）
function stick(parent, { p, n }, inset = 0) {
  const G = new THREE.Group(); G.position.copy(p).addScaledVector(n, -inset);
  const x = V(0, 1, 0).cross(n).normalize(), y = n.clone().cross(x); G.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n));
  parent.add(G); return G;
}
const DARK = toy("#1E1A22", 0.18), WHITE = toy("#FFFFFF", 0.22);
function dotEye(parent, at, r) { const E = stick(parent, at, 0.003); put(E, ball(r, 1, 1.2, 0.5), DARK); put(E, ball(r * 0.32), WHITE, -r * 0.3, r * 0.45, r * 0.42); return E; }
// 動き：g.userData.tick(t) を毎フレーム呼ぶ（t は秒）
const wave = (t, f, ph = 0) => Math.sin(t * f + ph);
const pulse = (t, period, dur, off = 0) => { const p = (((t + off) % period) + period) % period; return p < dur ? Math.sin((p / dur) * Math.PI) : 0; }; // ときどき 0→1→0
function blink(eyes, t, off = 0, period = 3.4) { const p = (t + off) % period, s = p < 0.14 ? Math.max(0.1, Math.abs(p - 0.07) / 0.07) : 1; eyes.forEach((E) => (E.scale.y = s)); }

export const SPECIES3 = {
  shika: { label: "しか", note: "ひょろ長い・半目" },
  pelican: { label: "ペリカン", note: "手紙をくちばしで運ぶ" },
  mouse: { label: "マウス", note: "パソコンのマウスのねずみ" },
  tv: { label: "ブラウン管", note: "顔は画面に出る" },
  mogura: { label: "もぐら", note: "穴をほって部屋をめぐる" },
  kurage: { label: "くらげ", note: "浮かぶ・夜に光る" },
  saboten: { label: "サボテン", note: "鉢ごと歩く" },
  chokin: { label: "ちょきんばこ", note: "リソースをためる" },
};

// ---------- しか：鹿さんの分身。ひょろ長い手足、小さな頭に大きな角、ねむそうな半目 ----------
function shika() {
  const g = new THREE.Group(), fur = toy("#F3943A"), cream = toy("#FFEBC9"), ant = toy("#7B4A2B", 0.45), hoof = toy("#3A2A26", 0.3);
  [-1, 1].forEach((k) => { put(g, cap(0.03, 0.28), fur, 0.055 * k, 0.2, 0); put(g, cap(0.034, 0.02), hoof, 0.055 * k, 0.045, 0.004); });
  put(g, ball(0.12, 1, 1.3, 0.9), fur, 0, 0.48, 0);
  put(g, ball(0.085, 1, 1.25, 0.5), cream, 0, 0.47, 0.072);
  put(g, cap(0.045, 0.06), fur, 0, 0.66, 0.01);
  const arms = [-1, 1].map((k) => { const A = new THREE.Group(); A.position.set(0.1 * k, 0.6, 0); A.rotation.z = 0.22 * k; g.add(A); put(A, cap(0.026, 0.2), fur, 0, -0.12, 0); put(A, ball(0.03, 1, 1.1, 1), hoof, 0, -0.245, 0); return A; });
  [[0.5, 0.55], [-0.45, 0.45], [0.1, 0.75], [-0.2, 0.25], [0.65, 0.15]].forEach(([x, y]) => put(stick(g, ell(V(0, 0.48, 0), 0.12, 0.156, 0.108, V(x, y, -1)), 0.004), ball(0.02, 1, 1, 0.3), cream));
  const tail = put(g, ball(0.03, 1, 1.3, 0.8), cream, 0, 0.52, -0.105);
  const H = new THREE.Group(); H.position.set(0, 0.79, 0.02); g.add(H);
  put(H, ball(0.13, 1, 0.95, 1.02), fur);
  put(H, ball(0.07, 0.95, 0.72, 1.1), cream, 0, -0.04, 0.1);
  put(H, ball(0.02, 1.35, 0.85, 0.9), DARK, 0, -0.02, 0.177);
  const eyes = [], ears = [];
  [-1, 1].forEach((k) => {
    const E = stick(H, ell(V(0, 0, 0), 0.13, 0.1235, 0.1326, V(0.5 * k, 0.2, 0.84)), 0.004); eyes.push(E);
    put(E, ball(0.022, 1, 1.3, 0.5), DARK); put(E, ball(0.006), WHITE, -0.008, -0.008, 0.01);
    put(E, new THREE.SphereGeometry(0.0235, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.47), fur).scale.set(1, 1.3, 0.55);  // 上まぶた（目の上半分にぴったりかぶる＝半目）
    put(E, tube(Array.from({ length: 9 }, (_, i) => { const t = -1 + i / 4; return V(0.0235 * t, 0.003, 0.0129 * Math.sqrt(1 - t * t) + 0.0012); }), 0.0034), DARK);
    put(E, tube([V(0.0225 * k, 0.003, 0.003), V(0.035 * k, -0.001, 0.005)], 0.003), DARK); // まつげ（外へ少し下がる）
    const R = new THREE.Group(); R.position.set(0.12 * k, 0.03, -0.01); R.rotation.z = 0.3 * k; H.add(R); ears.push(R);
    put(R, ball(0.048, 1.9, 0.62, 0.38), fur, 0.075 * k, 0, 0); put(R, ball(0.032, 1.7, 0.45, 0.2), cream, 0.08 * k, 0, 0.012);
    const A = new THREE.Group(); A.position.set(0.045 * k, 0.1, -0.02); H.add(A);
    put(A, tube([V(0, 0, 0), V(0.02 * k, 0.08, 0), V(0.07 * k, 0.17, -0.01), V(0.08 * k, 0.25, -0.02)], 0.013), ant); put(A, ball(0.013), ant, 0.08 * k, 0.25, -0.02);
    put(A, tube([V(0.03 * k, 0.1, 0), V(0.0, 0.17, 0.01), V(-0.005 * k, 0.21, 0.01)], 0.011), ant); put(A, ball(0.011), ant, -0.005 * k, 0.21, 0.01);
    put(A, tube([V(0.06 * k, 0.15, -0.01), V(0.1 * k, 0.18, -0.01), V(0.125 * k, 0.19, -0.01)], 0.011), ant); put(A, ball(0.011), ant, 0.125 * k, 0.19, -0.01);
  });
  g.userData.tick = (t) => {
    H.rotation.z = 0.07 * wave(t, 0.8); H.rotation.x = 0.04 * wave(t, 0.6, 1);
    ears.forEach((R, i) => (R.rotation.z = (0.3 + 0.35 * pulse(t, 2.9, 0.22, i * 0.11)) * (i ? 1 : -1)));
    arms.forEach((A, i) => (A.rotation.x = 0.1 * wave(t, 1.3, i * Math.PI)));
    tail.rotation.z = 0.6 * pulse(t, 3.7, 0.6) * wave(t, 30);
    blink(eyes, t, 0.3, 3.3);
  };
  g.userData.anchors = { face: { parent: H, pos: V(0, 0.025, 0.115), s: 0.085 }, head: { parent: H, pos: V(0, 0.105, -0.01), s: 0.1 }, neck: { parent: g, pos: V(0, 0.645, 0.055), s: 0.09 }, hand: { parent: arms[1], pos: V(0, -0.245, 0.02), s: 0.2 } };
  return g;
}

// ---------- ペリカン：手紙をくちばしの袋に入れて運ぶ。ぎょろ目、郵便屋さんの帽子 ----------
function pelican() {
  const g = new THREE.Group(), blue = toy("#2E7BE6"), white = toy("#FBFBFF"), bill = toy("#FFC52E", 0.3), pouch = toy("#FF8B3D"), red = toy("#E8393C"), navy = toy("#1F2A55"), gold = toy("#FFD24A", 0.25, { metalness: 0.4 });
  put(g, ball(0.2, 1, 1.05, 0.95), blue, 0, 0.25, 0);
  put(g, ball(0.15, 1, 1.1, 0.55), white, 0, 0.22, 0.1);
  put(g, ball(0.06, 1, 0.4, 1.2), white, 0, 0.2, -0.19).rotation.x = 0.4;
  const wings = [], eyes = [];
  [-1, 1].forEach((k) => {
    const W = new THREE.Group(); W.position.set(0.19 * k, 0.3, 0); W.rotation.z = 0.15 * k; g.add(W); wings.push(W); put(W, ball(0.09, 0.35, 1.15, 0.9), blue, 0.01 * k, -0.05, 0);
    put(g, cap(0.02, 0.04), pouch, 0.08 * k, 0.05, 0.03); put(g, ball(0.05, 1.1, 0.35, 1.5), pouch, 0.08 * k, 0.015, 0.07);
  });
  const H = new THREE.Group(); H.position.set(0, 0.53, 0.02); g.add(H);
  put(H, ball(0.12), blue);
  [-1, 1].forEach((k) => { const E = stick(H, ell(V(0, 0, 0), 0.12, 0.12, 0.12, V(0.42 * k, 0.32, 0.85)), 0.012); eyes.push(E); put(E, ball(0.04, 1, 1.12, 0.55), WHITE); put(E, ball(0.017, 1, 1.1, 0.5), DARK, -0.006 * k, -0.006, 0.02); });
  put(H, ball(0.05, 1.0, 0.3, 3.6), bill, 0, -0.02, 0.24);
  put(H, ball(0.022, 1, 0.7, 1), pouch, 0, -0.032, 0.415);
  const bag = put(H, ball(0.07, 0.95, 0.95, 2.5), pouch, 0, -0.085, 0.22);
  const L = new THREE.Group(); L.position.set(0.02, -0.035, 0.33); L.rotation.set(-0.25, 0.35, 0.3); H.add(L);   // くちばしにはさんだ手紙
  put(L, new THREE.BoxGeometry(0.11, 0.075, 0.006), toy("#FFFDF6", 0.6)); put(L, cyl(0.011, 0.011, 0.004, 20), red, 0, 0, 0.004).rotation.x = Math.PI / 2;
  const C = new THREE.Group(); C.position.set(0, 0.1, -0.005); C.rotation.x = -0.18; H.add(C);                    // 郵便屋さんの帽子
  put(C, cyl(0.085, 0.092, 0.065, 32), red, 0, 0.02, 0); put(C, cyl(0.088, 0.088, 0.012, 32), navy, 0, -0.008, 0);
  put(C, ball(0.07, 1, 0.12, 0.85), navy, 0, -0.012, 0.06); put(C, cyl(0.014, 0.014, 0.006, 20), gold, 0, 0.022, 0.09).rotation.x = Math.PI / 2;
  g.userData.tick = (t) => {
    H.rotation.x = 0.06 * wave(t, 2.2); H.position.y = 0.53 + 0.008 * Math.abs(wave(t, 2.2));
    const flap = pulse(t, 4.2, 0.9, 1.5);
    wings.forEach((W, i) => (W.rotation.z = (0.15 + 0.8 * flap * Math.abs(wave(t, 18))) * (i ? 1 : -1)));
    bag.scale.y = 1 + 0.07 * wave(t, 3.1);
    blink(eyes, t, 1.1, 3.0);
  };
  g.userData.anchors = { face: { parent: H, pos: V(0, 0.04, 0.1), s: 0.07 }, head: { parent: H, pos: V(0, 0.1, -0.01), s: 0.1, hide: [C] }, neck: { parent: g, pos: V(0, 0.37, 0.18), s: 0.11 }, hand: { parent: wings[1], pos: V(0.04, -0.13, 0.05), s: 0.2 } };
  return g;
}

// ---------- マウス：パソコンのマウスがそのままねずみ。しっぽはケーブル ----------
function mouse() {
  const g = new THREE.Group(), M = new THREE.Group(); M.scale.setScalar(1.5); g.add(M);
  const body = toy("#8E6CF0", 0.28), seam = toy("#5B3FBF", 0.4), pink = toy("#FF8FB1", 0.35), wheel = toy("#2A2533", 0.5), metal = toy("#D5D9E2", 0.25, { metalness: 0.7 });
  const A = 0.15, Bh = 0.12, D = 0.21, CY = 0.1, taper = (z) => 1 - 0.18 * (z / D);   // 前ほど細い
  const bg = ball(1, A, Bh, D, 48), pos = bg.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * taper(pos.getZ(i)));
  bg.computeVertexNormals(); put(M, bg, body, 0, CY, 0);
  const topY = (x, z) => CY + Bh * Math.sqrt(Math.max(0, 1 - (x / (A * taper(z))) ** 2 - (z / D) ** 2));
  put(M, tube(Array.from({ length: 9 }, (_, i) => { const z = 0.02 + i * 0.022; return V(0, topY(0, z) + 0.001, z); }), 0.0035), seam);                 // ボタンの境目
  put(M, tube(Array.from({ length: 11 }, (_, i) => { const x = -0.12 + i * 0.024; return V(x, topY(x, 0.02) + 0.001, 0.02); }), 0.0035), seam);
  const wh = put(M, cyl(0.03, 0.03, 0.018, 24), wheel, 0, topY(0, 0.09) - 0.006, 0.09); wh.rotation.z = Math.PI / 2;                                                  // ホイール
  const ears = [], eyes = [];
  [-1, 1].forEach((k) => {
    const E = new THREE.Group(); E.position.set(0.085 * k, 0.19, -0.075); E.rotation.y = 0.3 * k; M.add(E); ears.push(E); put(E, ball(0.055, 1, 1, 0.32), body); put(E, ball(0.035, 1, 1, 0.2), pink, 0, 0, 0.01);
    eyes.push(dotEye(M, (() => { const z = 0.165, x = 0.05 * k, y = topY(x, z); const n = V(x / (A * taper(z)) ** 2, (y - CY) / Bh ** 2, z / D ** 2).normalize(); return { p: V(x, y, z), n }; })(), 0.016));
    [0.012, -0.012].forEach((dy) => put(M, tube([V(0.03 * k, 0.1, 0.19), V(0.11 * k, 0.1 + dy * 2, 0.16)], 0.0022, 6, 4), DARK));
    [0.1, -0.1].forEach((z) => put(M, ball(0.028, 1, 0.45, 1.3), pink, 0.08 * k, 0.004, z));
  });
  const nose = put(M, ball(0.019), pink, 0, 0.1, 0.206);
  const cord = new THREE.CatmullRomCurve3([V(0, 0.06, -0.2), V(0, 0.08, -0.3), V(0.08, 0.14, -0.34), V(0.14, 0.2, -0.26), V(0.12, 0.26, -0.18)]);
  const cordMesh = put(M, new THREE.TubeGeometry(cord, 40, 0.011, 10, false), wheel);
  const P = new THREE.Group(); P.position.copy(cord.getPoint(1)); P.quaternion.setFromUnitVectors(V(0, 0, 1), cord.getTangent(1)); M.add(P);              // USB の先
  put(P, rbox(0.036, 0.026, 0.05, 0.008), wheel, 0, 0, 0.025); put(P, new THREE.BoxGeometry(0.028, 0.014, 0.034), metal, 0, 0, 0.066);
  const T = new THREE.Group(); T.position.set(0, 0.06, -0.2); M.add(T);                                     // しっぽの付け根で回す
  [cordMesh, P].forEach((o) => { M.remove(o); o.position.sub(T.position); T.add(o); });
  g.userData.tick = (t) => {
    wh.rotation.x = t * 4;
    T.rotation.y = 0.3 * wave(t, 1.3); T.rotation.x = 0.06 * wave(t, 1.9);
    ears.forEach((E, i) => (E.rotation.y = (0.3 + 0.35 * pulse(t, 2.6, 0.25, i * 0.13)) * (i ? 1 : -1)));
    nose.scale.setScalar(1 + 0.18 * pulse(t, 0.9, 0.3)); M.rotation.x = 0.04 * pulse(t, 1.8, 0.4);
    blink(eyes, t, 0.4, 2.8);
  };
  g.userData.anchors = { face: { parent: M, pos: V(0, 0.15, 0.15), s: 0.062 }, head: { parent: M, pos: V(0, 0.205, -0.03), s: 0.085 }, neck: { parent: M, pos: V(0, 0.1, 0.2), s: 0.08 }, hand: { parent: M, pos: V(0.08, 0.17, -0.1), s: 0.15, lie: true } };
  return g;
}

// ---------- ブラウン管：古いテレビの頭。顔は画面のドット絵、しっぽは電源コード ----------
function faceTex(mode = "smile") {
  const cv = document.createElement("canvas"); cv.width = 48; cv.height = 36; const x = cv.getContext("2d");
  x.fillStyle = "#103C3A"; x.fillRect(0, 0, 48, 36);
  x.fillStyle = "#0C3230"; for (let y = 0; y < 36; y += 2) x.fillRect(0, y, 48, 1);
  x.fillStyle = "#8CFFC0"; if (mode === "blink") { x.fillRect(12, 15, 7, 2); x.fillRect(29, 15, 7, 2); } else { x.fillRect(13, 10, 5, 7); x.fillRect(30, 10, 5, 7); }
  [[16, 23], [18, 25], [20, 26], [22, 26], [24, 26], [26, 26], [28, 25], [30, 23]].forEach(([a, b]) => x.fillRect(a, b, 2, 2));
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tv() {
  const g = new THREE.Group(), red = toy("#E8473F", 0.32), frame = toy("#2B2B33", 0.3), knob = toy("#F2C14E", 0.3), navy = toy("#283A6E", 0.42), glove = toy("#FAFAFA", 0.35), metal = toy("#D5D9E2", 0.25, { metalness: 0.7 });
  const T = new THREE.Group(); T.position.set(0, 0.62, 0); T.rotation.z = -0.06; g.add(T);
  put(T, rbox(0.36, 0.28, 0.26, 0.06), red); put(T, rbox(0.24, 0.2, 0.14, 0.05), red, 0, 0, -0.15);
  put(T, rbox(0.25, 0.2, 0.03, 0.03), frame, -0.035, 0, 0.125);
  const scr = put(T, new THREE.PlaneGeometry(0.22, 0.165), new THREE.MeshBasicMaterial({ map: faceTex("smile") }), -0.035, 0, 0.1415), faces = { smile: scr.material.map, blink: faceTex("blink") };
  [0.05, -0.02].forEach((y) => put(T, cyl(0.02, 0.022, 0.02, 24), knob, 0.135, y, 0.135).rotation.x = Math.PI / 2);
  [-0.07, -0.085, -0.1].forEach((y) => put(T, new THREE.BoxGeometry(0.04, 0.005, 0.004), frame, 0.135, y, 0.131));
  const ants = [-1, 1].map((k) => { const An = new THREE.Group(); An.position.set(0.02 * k, 0.13, -0.02); T.add(An); put(An, tube([V(0, 0, 0), V(0.08 * k, 0.19, -0.01)], 0.006, 6, 4), metal); put(An, ball(0.016), knob, 0.08 * k, 0.19, -0.01); return An; });
  put(g, cyl(0.04, 0.05, 0.04), frame, 0, 0.48, 0);
  put(g, ball(0.1, 1.05, 1.1, 0.9), navy, 0, 0.36, 0);
  [-1, 1].forEach((k) => {
    put(g, tube([V(0.09 * k, 0.42, 0), V(0.17 * k, 0.37, 0.02), V(0.2 * k, 0.28, 0.05), V(0.2 * k, 0.22, 0.07)], 0.018), navy); put(g, ball(0.04, 1, 1, 0.9), glove, 0.2 * k, 0.21, 0.075);
    put(g, tube([V(0.05 * k, 0.29, 0), V(0.055 * k, 0.17, 0.005), V(0.06 * k, 0.06, 0.01)], 0.022), navy); put(g, ball(0.05, 1.0, 0.6, 1.6), DARK, 0.065 * k, 0.03, 0.04);
  });
  const cord = new THREE.CatmullRomCurve3([V(0, 0.56, -0.23), V(0, 0.42, -0.29), V(0.06, 0.15, -0.31), V(0.12, 0.03, -0.22), V(0.21, 0.02, -0.1)]);
  put(g, new THREE.TubeGeometry(cord, 40, 0.008, 8, false), frame);
  const P = new THREE.Group(); P.position.copy(cord.getPoint(1)); P.quaternion.setFromUnitVectors(V(0, 0, 1), cord.getTangent(1)); g.add(P);
  put(P, rbox(0.04, 0.03, 0.04, 0.008), frame, 0, 0, 0.02); [-1, 1].forEach((k) => put(P, new THREE.BoxGeometry(0.005, 0.012, 0.025), metal, 0.01 * k, 0, 0.05));
  g.userData.tick = (t) => {
    T.rotation.z = -0.06 + 0.05 * wave(t, 1.1); T.position.y = 0.62 + 0.006 * wave(t, 2.2);
    ants.forEach((A, i) => (A.rotation.z = 0.12 * wave(t, 3.3, i * 1.7)));
    scr.material.map = (t + 0.7) % 3.6 < 0.16 ? faces.blink : faces.smile;
    scr.material.color.setScalar(0.9 + 0.1 * Math.abs(wave(t, 37)));
  };
  g.userData.anchors = { face: { parent: T, pos: V(-0.035, 0.01, 0.15), s: 0.09 }, head: { parent: T, pos: V(0, 0.14, 0), s: 0.13 }, neck: { parent: g, pos: V(0, 0.45, 0.07), s: 0.09 }, hand: { parent: g, pos: V(0.2, 0.2, 0.08), s: 0.2 } };
  return g;
}

// ---------- もぐら：頭と体がひとつのかたまり。黄色いヘルメットとライト、糸目、大きな鼻と手 ----------
function mogura() {
  const g = new THREE.Group(), fur = toy("#7B57C8", 0.38), pink = toy("#FF9DB8", 0.32), claw = toy("#FFF4EC", 0.3), hat = toy("#FFC928", 0.28), gray = toy("#55505E", 0.4);
  const bodyG = new THREE.LatheGeometry([[0, 0], [0.15, 0.01], [0.21, 0.08], [0.22, 0.18], [0.2, 0.3], [0.16, 0.4], [0.09, 0.46], [0, 0.48]].map(([r, y]) => new THREE.Vector2(r, y)), 48); bodyG.scale(1, 1, 0.95);
  put(g, bodyG, fur);
  const Ht = new THREE.Group(); Ht.position.set(0, 0.425, -0.005); Ht.rotation.x = -0.12; g.add(Ht);
  put(Ht, new THREE.SphereGeometry(0.135, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2), hat).scale.set(1, 0.78, 1);
  put(Ht, cyl(0.155, 0.155, 0.012, 40), hat).scale.set(1, 1, 1.12);
  put(Ht, new THREE.BoxGeometry(0.03, 0.02, 0.2), hat, 0, 0.1, 0);
  const lamp = put(Ht, cyl(0.03, 0.034, 0.035, 24), gray, 0, 0.06, 0.12); lamp.rotation.x = Math.PI / 2 - 0.35;
  const lens = put(Ht, cyl(0.024, 0.024, 0.006, 24), toy("#FFF7C2", 0.2, { emissive: "#FFE07A", emissiveIntensity: 0.9 }), 0, 0.066, 0.139); lens.rotation.x = Math.PI / 2 - 0.35;
  put(g, ball(0.05, 1.25, 0.95, 1.05), pink, 0, 0.29, 0.205);
  const hands = [];
  [-1, 1].forEach((k) => {
    put(g, tube([V(0.045 * k, 0.355, 0.158), V(0.07 * k, 0.348, 0.153), V(0.095 * k, 0.355, 0.142)], 0.0055), DARK);             // 糸目
    const Hd = new THREE.Group(); Hd.position.set(0.2 * k, 0.18, 0.07); Hd.rotation.set(0, 0.6 * k, 0.35 * k); g.add(Hd); hands.push(Hd);
    put(Hd, ball(0.07, 1.05, 1.0, 0.4), pink); [-1, 0, 1].forEach((j) => put(Hd, ball(0.016, 0.8, 1.6, 0.8), claw, j * 0.033, 0.075, 0.004));
    put(g, ball(0.05, 1, 0.45, 1.4), pink, 0.08 * k, 0.012, 0.13);
  });
  put(g, tube([V(0, 0.08, -0.19), V(0, 0.07, -0.25), V(0.02, 0.1, -0.28)], 0.012), pink);
  g.userData.tick = (t) => {
    g.rotation.z = 0.05 * wave(t, 1.6); Ht.rotation.z = 0.03 * wave(t, 1.6, 0.6);
    hands.forEach((Hd, i) => (Hd.rotation.x = -0.6 * pulse(t, 2.4, 0.7, i * 0.25) * Math.abs(wave(t, 14))));
    lens.material.emissiveIntensity = 0.7 + 0.3 * wave(t, 5);
  };
  g.userData.anchors = { face: { parent: g, pos: V(0, 0.355, 0.15), s: 0.075 }, head: { parent: g, pos: V(0, 0.43, 0), s: 0.13, hide: [Ht] }, neck: { parent: g, pos: V(0, 0.21, 0.215), s: 0.1 }, hand: { parent: hands[1], pos: V(0, 0.03, 0.03), s: 0.2 } };
  return g;
}

// ---------- くらげ：浮かんでゆらゆら。すけたかさの中に光る芯、夜の部屋で光る ----------
function kurage() {
  const g = new THREE.Group(), F = new THREE.Group(); F.position.y = 0.46; g.add(F);
  const dome = new THREE.MeshPhysicalMaterial({ color: "#41D3F2", roughness: 0.15, transparent: true, opacity: 0.72, emissive: "#1AA7D8", emissiveIntensity: 0.25, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const core = toy("#C9A5FF", 0.3, { emissive: "#9C6BFF", emissiveIntensity: 0.4 });
  const tent = new THREE.MeshPhysicalMaterial({ color: "#8DE8FF", roughness: 0.2, transparent: true, opacity: 0.85, emissive: "#38C6EE", emissiveIntensity: 0.2 });
  put(F, ball(0.085, 1, 0.75, 1), core, 0, 0.03, 0);
  const d = put(F, new THREE.SphereGeometry(0.2, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), dome); d.scale.set(1, 0.85, 1); d.renderOrder = 2;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; put(F, ball(0.03, 1, 0.7, 1), tent, Math.sin(a) * 0.192, -0.03, Math.cos(a) * 0.192); }
  const eyes = [-1, 1].map((k) => dotEye(F, ell(V(0, 0, 0), 0.2, 0.17, 0.2, V(0.33 * k, 0.2, 1)), 0.02));
  const TT = new THREE.Group(); F.add(TT);
  put(stick(F, ell(V(0, 0, 0), 0.2, 0.17, 0.2, V(0, -0.02, 1)), 0.002), ball(0.012, 1, 1.25, 0.5), DARK);
  [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI * 2 + 0.4, x = Math.sin(a) * 0.05, z = Math.cos(a) * 0.05;
    put(TT, tube(Array.from({ length: 7 }, (_, j) => V(x + Math.sin(j * 1.3 + i) * 0.025, -0.03 - j * 0.055, z + Math.cos(j * 1.1 + i) * 0.02)), 0.017), tent); });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2, x = Math.sin(a) * 0.17, z = Math.cos(a) * 0.17;
    put(TT, tube(Array.from({ length: 6 }, (_, j) => V(x * (1 - j * 0.05) + Math.sin(j + i) * 0.012, -0.04 - j * 0.055, z * (1 - j * 0.05))), 0.006, 6, 24), tent); }
  g.userData.tick = (t) => {
    const s = wave(t, 1.8); F.position.y = 0.46 + 0.035 * s;
    d.scale.set(1 + 0.04 * s, 0.85 * (1 - 0.06 * s), 1 + 0.04 * s);
    TT.rotation.y = 0.25 * wave(t, 0.7); TT.rotation.x = 0.08 * wave(t, 1.8, 1.2); TT.scale.y = 1 - 0.06 * s;
    blink(eyes, t, 2.0, 4.0);
  };
  g.userData.anchors = { face: { parent: F, pos: V(0, 0.06, 0.18), s: 0.075 }, head: { parent: F, pos: V(0, 0.15, 0), s: 0.13 }, neck: { parent: F, pos: V(0, -0.04, 0.205), s: 0.09 }, hand: { parent: F, pos: V(0.12, -0.2, 0.05), s: 0.18 } };
  return g;
}

// ---------- サボテン：鉢ごと歩く。すじのある体、頭に花、無表情の一文字の口 ----------
function saboten() {
  const g = new THREE.Group(), green = toy("#37B85A", 0.42), pot = toy("#D9733A", 0.5), band = toy("#F3E3CB", 0.5), soil = toy("#5A3A28", 0.8), spine = toy("#FFF8E8", 0.4), petal = toy("#FF4F7B", 0.32), center = toy("#FFD23F", 0.4);
  [-1, 1].forEach((k) => put(g, ball(0.045, 1, 0.6, 1.5), DARK, 0.06 * k, 0.025, 0.05));
  put(g, cyl(0.15, 0.115, 0.2), pot, 0, 0.14, 0); put(g, cyl(0.137, 0.135, 0.03), band, 0, 0.15, 0);
  put(g, cyl(0.165, 0.165, 0.05), pot, 0, 0.255, 0); put(g, cyl(0.15, 0.15, 0.01), soil, 0, 0.278, 0);
  const prof = [[0, 0], [0.1, 0], [0.105, 0.15], [0.1, 0.3], [0.08, 0.38], [0.045, 0.43], [0, 0.445]];
  const col = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64), pos = col.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), a = Math.atan2(z, x), s = 1 + 0.08 * Math.cos(8 * a); pos.setX(i, x * s); pos.setZ(i, z * s); } // すじ
  col.computeVertexNormals(); put(g, col, green, 0, 0.26, 0);
  [[1, 0.45, 0.13], [-1, 0.39, 0.1]].forEach(([k, y, h]) => { const pts = [V(0.09 * k, y, 0), V(0.16 * k, y, 0), V(0.19 * k, y + 0.05, 0), V(0.19 * k, y + h, 0)]; put(g, tube(pts, 0.038), green); put(g, ball(0.038), green, ...pts[3].toArray()); });
  for (let r = 0; r < 8; r++) { const a = (r / 8) * Math.PI * 2; if (Math.abs(Math.atan2(Math.cos(a), Math.sin(a))) < 0.6) continue;  // 顔のまわりは空ける
    [0.34, 0.44, 0.54, 0.62].forEach((y, j) => { const rr = 0.108 - (y > 0.6 ? 0.02 : 0); put(g, ball(0.006), spine, Math.cos(a + j * 0.05) * rr, y, Math.sin(a + j * 0.05) * rr); }); }
  const eyes = [-1, 1].map((k) => dotEye(g, { p: V(0.042 * k, 0.53, 0.098), n: V(0.4 * k, 0.05, 1).normalize() }, 0.016));
  put(g, tube([V(-0.018, 0.49, 0.104), V(0.018, 0.49, 0.104)], 0.004, 6, 4), DARK);
  const Fl = new THREE.Group(); Fl.position.set(0.02, 0.7, 0); Fl.rotation.z = -0.2; g.add(Fl);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; put(Fl, ball(0.05, 1, 0.35, 0.62), petal, Math.sin(a) * 0.05, 0.012, Math.cos(a) * 0.05).rotation.y = a; }
  put(Fl, ball(0.03, 1, 0.7, 1), center, 0, 0.022, 0);
  g.userData.tick = (t) => {
    g.rotation.z = 0.06 * wave(t, 3); g.position.y = 0.012 * Math.abs(wave(t, 3));
    Fl.rotation.y = t * 0.9;
    blink(eyes, t, 0.9, 3.8);
  };
  g.userData.anchors = { face: { parent: g, pos: V(0, 0.535, 0.1), s: 0.07 }, head: { parent: g, pos: V(0, 0.695, 0), s: 0.075, hide: [Fl] }, neck: { parent: g, pos: V(0, 0.31, 0.118), s: 0.085 }, hand: { parent: g, pos: V(0.2, 0.5, 0.04), s: 0.17 } };
  return g;
}

// ---------- ちょきんばこ：四つ足のぶたの貯金箱。背中の口にコイン（リソース）が入る ----------
function chokin() {
  const g = new THREE.Group(), blue = toy("#3F7BFF", 0.22), snout = toy("#7EA6FF", 0.25), slot = toy("#15223F", 0.6), gold = toy("#FFC93C", 0.25, { metalness: 0.5 }), wf = toy("#FFFFFF", 0.3), yc = toy("#FFD23F", 0.3);
  put(g, ball(0.2, 1, 0.92, 1.3), blue, 0, 0.25, 0);
  const eyes = [];
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([k, j]) => put(g, cyl(0.042, 0.046, 0.11), blue, 0.1 * k, 0.055, 0.13 * j));
  put(g, cyl(0.075, 0.08, 0.07), snout, 0, 0.24, 0.268).rotation.x = Math.PI / 2;
  [-1, 1].forEach((k) => {
    put(g, ball(0.013, 1, 1.5, 0.4), slot, 0.026 * k, 0.24, 0.304);
    eyes.push(dotEye(g, ell(V(0, 0.25, 0), 0.2, 0.184, 0.26, V(0.45 * k, 0.42, 0.75)), 0.02));
    const e = put(g, new THREE.ConeGeometry(0.055, 0.09, 4), blue, 0.12 * k, 0.42, 0.11); e.scale.set(1, 1, 0.45); e.rotation.set(0.55, 0, -0.3 * k);
    const Fw = stick(g, ell(V(0, 0.25, 0), 0.2, 0.184, 0.26, V(k, 0.15, -0.25)), 0.002);                    // 横の花の絵
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; put(Fw, ball(0.018, 1, 1, 0.25), wf, Math.sin(a) * 0.022, Math.cos(a) * 0.022, 0); }
    put(Fw, ball(0.013, 1, 1, 0.3), yc, 0, 0, 0.003);
  });
  put(g, rbox(0.14, 0.012, 0.045, 0.005), gold, 0, 0.43, -0.02); put(g, new THREE.BoxGeometry(0.11, 0.014, 0.016), slot, 0, 0.432, -0.02);
  const coin = put(g, cyl(0.045, 0.045, 0.012, 32), gold, 0, 0.53, -0.02); coin.rotation.x = Math.PI / 2;
  put(g, tube(Array.from({ length: 16 }, (_, i) => { const a = i * 0.7; return V(Math.cos(a) * 0.025, 0.3 + Math.sin(a) * 0.025, -0.255 - i * 0.004); }), 0.009), blue);
  g.userData.tick = (t) => {
    const p = t % 2.6, fall = Math.min(1, p / 0.6);
    coin.visible = p < 0.6; coin.position.y = 0.62 - 0.21 * fall * fall; coin.scale.setScalar(Math.min(1, p / 0.08));
    const q = p >= 0.6 && p < 1.0 ? Math.sin(((p - 0.6) / 0.4) * Math.PI) : 0;               // 入った！
    g.scale.set(1 + 0.05 * q, 1 - 0.08 * q, 1 + 0.05 * q);
    if (q > 0) eyes.forEach((E) => (E.scale.y = 1 - 0.65 * q)); else blink(eyes, t, 1.3, 2.6 * 2);
  };
  g.userData.anchors = { face: { parent: g, pos: V(0, 0.33, 0.21), s: 0.07 }, head: { parent: g, pos: V(0, 0.415, 0.1), s: 0.1 }, neck: { parent: g, pos: V(0, 0.12, 0.245), s: 0.1 }, hand: { parent: g, pos: V(0.06, 0.44, -0.14), s: 0.16, lie: true } };
  return g;
}

const BUILD = { shika, pelican, mouse, tv, mogura, kurage, saboten, chokin };
export function makePet3(species) { const g = (BUILD[species] || shika)(); g.userData.species = species; return g; }
// 部品は 商人（traders3d.js）でも 使う
export { V, ball, tube, cap, cyl, rbox, toy, put, ell, stick, DARK, WHITE, dotEye, wave, pulse, blink };
