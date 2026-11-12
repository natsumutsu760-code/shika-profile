// PEREGRINE（ペレグリン）：レグルス自治区の 切り札。脱獄された 専用の ペット＝メカの ハヤブサ（鹿さんの 決め、2026-10-30。docs/mono-link-crawler-elites.md）
// 2 回目（鹿さんの 声、2026-10-31「もう少しデフォルメしたハヤブサ。武装は無しで、顔にホワイトグリントの顔のような仮面を付けているような感じ」）：
//   大きな 頭・丸い 胴・短い 翼と 脚の デフォルメ。色は 本物の ハヤブサの 分け方（頭と 背は 濃い 青灰・胸と ほおは 白・胸に 横じま）を メカの 板で
//   顔に ホワイト・グリントの 顔の ような 白い 仮面（前へ つき出た くさび・まん中の 稜線・細い 横長の 青白い 目・ほおの 黒い スリット・アンテナ 2 本）。仮面の 下から かぎの くちばし
//   翼の 付け根の 白い 板に 6 角形の タイル（ホワイト・グリントの 背中の 箱から）。武器は 持たない
// makePeregrine() が THREE.Group を 返す（+z が 前・+y が 上・足もとが y 0）。g.userData.tick(t) を 毎フレーム 呼ぶと 体の ゆれ・首かしげ・はばたき・目の 光
import * as THREE from "three";

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.18, flatShading: true, side: THREE.DoubleSide, ...o });
const WHITE = mat("#ECEFEE"), PALE = mat("#C6CCD2"), SLATE = mat("#46505E", { roughness: 0.5, metalness: 0.28 }), DARK = mat("#1C1E23", { roughness: 0.55, metalness: 0.35 }), GUN = mat("#5E646C", { roughness: 0.38, metalness: 0.55 });
const GLOW = new THREE.MeshStandardMaterial({ color: "#8AF7FF", emissive: "#38E6FF", emissiveIntensity: 2.4, roughness: 0.3 });
function put(p, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
const ball = (r, sx = 1, sy = 1, sz = 1, ws = 16, hs = 12) => { const g = new THREE.SphereGeometry(r, ws, hs); g.scale(sx, sy, sz); return g; };
// 前半分だけの 球（胸と ほおの 白い 板）。φ は 横、θ は 縦の 範囲
const cap = (r, sx, sy, sz, phi0, phiL, th0, thL) => { const g = new THREE.SphereGeometry(r, 16, 12, phi0, phiL, th0, thL); g.scale(sx, sy, sz); return g; };

// 断面を つないで 作る（z の 向き）。sec：{ z, w, h, x?, y? }
const KITE = [[1, 0.1], [0.5, 0.92], [-0.5, 0.92], [-1, 0.1], [-0.38, -0.78], [0.38, -0.78]];   // 上が 平らで 下が とがる（仮面）
function loft(secs, shape = KITE) {
  const pos = [], ring = (s) => shape.map(([u, v]) => new THREE.Vector3((s.x || 0) + u * s.w, (s.y || 0) + v * s.h, s.z));
  const R = secs.map(ring), n = shape.length, tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < n; j++) { const a = R[i][j], b = R[i][(j + 1) % n], c = R[i + 1][(j + 1) % n], d = R[i + 1][j]; tri(a, b, c); tri(a, c, d); }
  for (const [k, s] of [[0, secs[0]], [R.length - 1, secs.at(-1)]]) { const c = new THREE.Vector3(s.x || 0, s.y || 0, s.z); for (let j = 0; j < n; j++) tri(c, R[k][j], R[k][(j + 1) % n]); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
// 平らな 板（x-z の 面の 形に y の 厚み）
function plate(pts, t = 0.014) {
  const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -t / 2, 0); return g;
}

// ---------- 胴（丸い たまご。背は 濃い 青灰、胸は 白い 板に 横じま） ----------
function body(G) {
  const B = new THREE.Group(); B.position.set(0, 0.36, 0); B.rotation.x = 0.2; G.add(B); G = B; const y0 = 0.36;   // 胸を 少し 前へ（ハヤブサの とまり方）
  put(G, ball(0.27, 1, 1.05, 0.95, 14, 10), SLATE, 0, 0.36 - y0, -0.02);
  put(G, ball(0.2, 1, 0.9, 0.95, 14, 10), SLATE, 0, 0.6 - y0, -0.02);   // 首（頭と 胴を つなぐ）
  put(G, cap(0.205, 1, 0.9, 0.95, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.3, Math.PI * 0.55), WHITE, 0, 0.6 - y0, 0);   // のどの 白
  put(G, cap(0.275, 0.98, 1.0, 0.95, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.22, Math.PI * 0.62), WHITE, 0, 0.35 - y0, 0);   // 胸の 白い 板
  for (const [y, w] of [[0.32, 0.06], [0.25, 0.07], [0.18, 0.06]]) for (const s of [1, -1]) { const b = put(G, box(w, 0.012, 0.02), DARK, s * 0.07, y - y0, 0.235 - (0.32 - y) * 0.25); b.rotation.z = s * 0.35; b.rotation.y = -s * 0.25; }   // 胸の 横じま（ハヤブサの もよう）
  put(G, box(0.012, 0.16, 0.012), PALE, 0, 0.27 - y0, 0.262);   // 胸の まん中の すじ
}

// ---------- 頭（大きい。濃い 青灰の 頭巾に 白い ほお）と 仮面 ----------
function head(G) {
  const H = new THREE.Group(); H.position.set(0, 0.74, 0.1); G.add(H);
  put(H, ball(0.235, 1, 0.95, 0.98, 16, 12), SLATE);
  put(H, cap(0.24, 1, 0.95, 0.98, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.52, Math.PI * 0.38), WHITE);   // 下の ほおと のど（白）
  for (const s of [1, -1]) put(H, box(0.03, 0.12, 0.05), DARK, s * 0.17, -0.07, 0.12).rotation.z = s * 0.15;   // ハヤブサの 黒い ひげもよう
  // 仮面：前へ つき出た くさび（上が 平ら・下が とがる）。少し 下を 向く
  const M = new THREE.Group(); M.position.set(0, 0.03, 0.15); M.rotation.x = 0.16; H.add(M);
  put(M, loft([{ z: 0, w: 0.2, h: 0.13, y: 0.02 }, { z: 0.08, w: 0.185, h: 0.115, y: 0.015 }, { z: 0.16, w: 0.12, h: 0.08, y: -0.005 }, { z: 0.23, w: 0.055, h: 0.045, y: -0.03 }, { z: 0.27, w: 0.012, h: 0.014, y: -0.055 }]), WHITE);
  put(M, loft([{ z: 0.02, w: 0.02, h: 0.012, y: 0.135 }, { z: 0.2, w: 0.012, h: 0.01, y: 0.055 }]), PALE);   // まん中の 稜線
  // 細い 横長の 青白い 目：仮面の 前の 面に 沿う くの字の 帯（黒い 枠の 上に 光る すじ）
  const visor = new THREE.Group(); M.add(visor);
  const seg = (ax, az, bx, bz, h, t, m, out) => { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L, o = put(visor, box(L + 0.01, h, t), m, (ax + bx) / 2 + nx * out, 0.058, (az + bz) / 2 + nz * out); o.rotation.y = Math.atan2(-dz, dx); return o; };
  for (const s of [1, -1]) for (const [a, b] of [[[0.168, 0.07], [0.078, 0.158]], [[0.078, 0.158], [0, 0.186]]]) {
    seg(s * a[0], a[1], s * b[0], b[1], 0.036, 0.012, DARK, s * 0.004);
    seg(s * a[0], a[1], s * b[0], b[1], 0.013, 0.012, GLOW, s * 0.011);
  }
  for (const s of [1, -1]) {
    for (let i = 0; i < 3; i++) put(M, box(0.008, 0.045, 0.012), DARK, s * (0.1 + i * 0.022), -0.03, 0.105 - i * 0.012);   // ほおの スリット
    const a = put(H, cyl(0.006, 0.006, 0.26, 6), DARK, s * 0.05, 0.27, 0.02); a.rotation.x = -0.35; a.rotation.z = -s * 0.08;   // アンテナ 2 本
    put(H, ball(0.016, 1, 1, 1, 8, 6), GUN, s * 0.05, 0.155, 0.065);   // アンテナの 根もと
  }
  // 仮面の 下から 出る かぎの くちばし
  put(H, loft([{ z: 0, w: 0.05, h: 0.035, y: -0.06 }, { z: 0.07, w: 0.035, h: 0.03, y: -0.075 }, { z: 0.12, w: 0.012, h: 0.012, y: -0.11 }]), GUN, 0, 0, 0.2);
  H.userData = { visor }; return H;
}

// ---------- 翼（短く 丸い。付け根の 白い 板に 6 角形の タイル、風切りは 濃い 色） ----------
function wing(G, side) {
  const W = new THREE.Group(); W.position.set(side * 0.235, 0.5, 0.0); W.scale.x = side; G.add(W);
  const F = new THREE.Group(); F.rotation.z = -1.35; F.rotation.y = 0.32; F.rotation.x = 0.1; W.add(F);   // 体の 横に たたむ（先が 下と うしろ）
  put(F, plate([[0, 0.09], [0.2, 0.08], [0.28, -0.02], [0.24, -0.15], [0.02, -0.14]], 0.032), WHITE, 0, 0, 0);   // 付け根の 白い 板
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const t = put(F, cyl(0.03, 0.03, 0.012, 6), PALE, 0.06 + i * 0.058 + j * 0.029, 0.021, 0.035 - j * 0.052); t.rotation.y = Math.PI / 6; }   // 6 角形の タイル
  for (let i = 0; i < 5; i++) {   // 風切り羽（濃い 青灰・先は 黒）。外ほど 長く、尾の 近くまで のびる
    const L = 0.2 + i * 0.045, P = new THREE.Group(); P.position.set(0.04 + i * 0.052, -0.006 - i * 0.004, -0.12); P.rotation.y = -0.1 - i * 0.08; F.add(P);
    put(P, plate([[-0.04, 0.03], [0.04, 0.03], [0.034, -L * 0.78], [0, -L], [-0.034, -L * 0.82]], 0.016), SLATE);
    put(P, plate([[-0.026, -L * 0.72], [0.026, -L * 0.72], [0, -L * 0.98]], 0.018), DARK);
  }
  put(W, ball(0.052, 1, 1, 1, 10, 8), DARK);   // 肩の 関節
  return F;
}

// ---------- 尾（短い 刃 3 枚） ----------
function tail(G) {
  const T = new THREE.Group(); T.position.set(0, 0.22, -0.25); T.rotation.x = -0.55; G.add(T);
  for (let i = -1; i <= 1; i++) { const F = new THREE.Group(); F.rotation.y = i * 0.3; T.add(F); put(F, plate([[-0.05, 0.02], [0.05, 0.02], [0.045, -0.22], [0, -0.27], [-0.045, -0.22]], 0.018), i ? SLATE : PALE); put(F, box(0.08, 0.022, 0.03), DARK, 0, 0, 0); }
  return T;
}

// ---------- 脚（短い。黒い 輪・前 3 本と うしろ 1 本の つめ） ----------
function leg(G, side) {
  const L = new THREE.Group(); L.position.set(side * 0.1, 0.12, 0.04); G.add(L);
  put(L, cyl(0.03, 0.026, 0.12, 10), GUN, 0, 0, 0);
  put(L, new THREE.TorusGeometry(0.034, 0.008, 6, 14), DARK, 0, 0.02, 0).rotation.x = Math.PI / 2;
  const foot = new THREE.Group(); foot.position.set(0, -0.07, 0.01); L.add(foot);
  for (const a of [-0.45, 0, 0.45]) {
    const t = new THREE.Group(); t.rotation.y = a; foot.add(t);
    put(t, box(0.026, 0.022, 0.08), GUN, 0, -0.035, 0.04); put(t, new THREE.ConeGeometry(0.012, 0.04, 6), DARK, 0, -0.04, 0.095).rotation.x = Math.PI / 2;
  }
  put(foot, box(0.022, 0.02, 0.05), GUN, 0, -0.035, -0.03); put(foot, new THREE.ConeGeometry(0.01, 0.035, 6), DARK, 0, -0.04, -0.065).rotation.x = -Math.PI / 2;
  return L;
}

export function makePeregrine() {
  const g = new THREE.Group(), G = new THREE.Group(); g.add(G);
  body(G); const H = head(G), T = tail(G), WR = wing(G, 1), WL = wing(G, -1); leg(G, 1); leg(G, -1);
  g.userData.tick = (t) => {
    G.position.y = Math.abs(Math.sin(t * 2.2)) * 0.012;   // 小さく はずむ
    H.rotation.z = Math.sin(t * 0.8) * 0.12; H.rotation.y = Math.sin(t * 0.45) * 0.25;   // 首かしげ・見まわす
    const f = Math.max(0, Math.sin(t * 1.7)) ** 6 * 0.5; WR.rotation.z = -1.35 + f; WL.rotation.z = -1.35 + f;   // ときどき 羽を 少し 広げる
    T.rotation.y = Math.sin(t * 1.1) * 0.08;
    const b = (t % 4.2) < 0.12 ? 0.25 : 1; H.userData.visor.scale.y = b; GLOW.emissiveIntensity = 2 + 0.8 * Math.sin(t * 2.6);   // 目の 光と まばたき
  };
  g.userData.tick(0);
  return g;
}
