// 敵の POM（企業が 操る ペット）の バイザー。M-013（モデリング）。
// 鹿さんの 声（2026-11-01）「敵のPOMはPEREGRINEのようなバイザーを付けさせた方が雰囲気が出ますね。」
//   → 「Aでバイザーのデザインも会社ごとに変更してください。」（A＝目の 光は 会社の 色の まま）
// 形は 会社ごと（ブリーフィングの 会社の 型 mono-link-briefing-styles.md から）。色は crawler-map.js の COMPANY
//   harmonia 白い 研究所：真珠の 白の なめらかな くさび（PEREGRINE に いちばん 近い）・金の 縁・額に 青緑の 細胞の 輪・うしろへ 流れる ひれ
//   sva 重機の 現場：オリーブの 装甲の 溶接面・横一文字の 橙の のぞき穴・額に 警告の 縞・鋲・あごの 格子・片側に 潜望鏡
//   tcu 城塞の 設計局：コンクリートの 板を 重ねた 城壁・矢狭間の 細い 窓（水色の 光）・上に 胸壁・琥珀の ランプ
//   nox 暗号の 通信：黒い 鏡面の とがった 仮面・斜めの 紫の 目と 途切れた 暗号の ような 光・ひれ
//   foundation 公式の 通達：深い 青の 丸い 面に 白の 縁取り・横に 広い 光の 帯・額に 地球の 紋章・白い 小さな 翼
//   linkers 事務の 書類：灰色の 四角い ゴーグル・黒い 枠に 白い 一文字・横に バーコードと 番号札
//
// 使い方：makePOM("mogura", { co: "sva" }) が ペットに バイザーを 付けた THREE.Group を 返す（g.userData.tick(t) で ペットの 動きと 目の 光）
//   いまの ペットに 付ける だけなら wearVisor(pet, { co })。形だけ ほしい ときは makeVisor({ co })（横幅 約 2.2・前が +z・目の 高さ y 0.34。VR ゴーグルと 同じ 単位）
// ペットの 顔の 取りつけ位置（pets.js の userData.anchors.face）に 付ける ので、12 種類 どれにも 付き、頭の 動きに ついて いく
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makePet3 } from "./pets.js";
import { COMPANY, SUBSIDIARY } from "./crawler-map.js";

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.18, flatShading: true, side: THREE.DoubleSide, ...o });
const glowMat = (c, k = 1.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.3 });
// 目の 光の 色（会社の 色。光らせても 白く 飛ばない ように 濃い めの 色に した）
export const EYE = { harmonia: "#2EC4B6", sva: "#FF5A1F", tcu: "#4FB0E0", nox: "#9B5CFF", foundation: "#4C8CFF", linkers: "#F3F6FA" };
// 光らせる 色：くすんだ 差し色（灰ばら・木 など）も 光って 見える ように 色みを 足す（白・灰は そのまま）
function vivid(hex) {
  const c = new THREE.Color(hex), h = {}; c.getHSL(h, THREE.SRGBColorSpace);
  if (h.s < 0.08) return hex;
  c.setHSL(h.h, Math.max(h.s, 0.6), Math.min(0.62, Math.max(0.5, h.l)), THREE.SRGBColorSpace); return "#" + c.getHexString(THREE.SRGBColorSpace);
}
// 会社か 傘下の 会社か を 見て、形の グループと 差し色を 返す（独立は indie）
export function resolveCo(co) {
  const sub = SUBSIDIARY[co];
  if (sub) return { group: sub.group, accent: sub.color, glow: vivid(sub.color), name: sub.name };
  if (co === "indie") return { group: "indie", accent: "#8A8F94", glow: "#E8D8B0", name: "独立" };
  const g = COMPANY[co] ? co : "sva";
  return { group: g, accent: EYE[g], glow: EYE[g], name: COMPANY[g].name };
}
function put(p, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); p.add(o); return o; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
const EYE_Y = 0.34;   // 目の 高さ（どの 会社も 同じ。種類ごとの 合わせ FIT が そのまま 使える）

// ---- 断面を つないで 作る 形（z の 向き）。shape は 左回りの 点 [u, v] ----
const KITE = [[1, 0.1], [0.5, 0.92], [-0.5, 0.92], [-1, 0.1], [-0.38, -0.78], [0.38, -0.78]];   // 上が 平らで 下が とがる（PEREGRINE）
const chaikin = (s) => s.flatMap((p, i) => { const q = s[(i + 1) % s.length]; return [[p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]]; });
const KITE_SOFT = chaikin(KITE);                                                                       // ハルモニア：角を 落とした くさび
const ARMOR = [[1, 0.55], [0.75, 0.95], [-0.75, 0.95], [-1, 0.55], [-1, -0.45], [-0.7, -0.85], [0.7, -0.85], [1, -0.45]];   // SVA：角ばった 装甲
const BLADE = [[1.15, 0.25], [0.3, 0.9], [-0.3, 0.9], [-1.15, 0.25], [-0.45, -0.75], [0.45, -0.75]];   // NOX：横に とがる 刃
const ROUND = Array.from({ length: 16 }, (_, i) => { const a = ((i + 0.5) / 16) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.abs(c) ** 0.55, Math.sign(s) * Math.abs(s) ** 0.75]; });   // ファウンデーション：まるい 面
function loft(secs, shape) {
  const pos = [], ring = (s) => shape.map(([u, v]) => new THREE.Vector3(u * s.w, (s.y || 0) + v * s.h, s.z));
  const R = secs.map(ring), n = shape.length, tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < n; j++) { const a = R[i][j], b = R[i][(j + 1) % n], c = R[i + 1][(j + 1) % n], d = R[i + 1][j]; tri(a, b, c); tri(a, c, d); }
  for (const [k, s] of [[0, secs[0]], [R.length - 1, secs.at(-1)]]) { const c = new THREE.Vector3(0, s.y || 0, s.z); for (let j = 0; j < n; j++) tri(c, R[k][j], R[k][(j + 1) % n]); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
// 形の 横の 面の x（前後 z・高さ y の 所）。目や 札を 面に そわせる ため
function edgeX(secs, shape, z, y) {
  let i = 0; while (i < secs.length - 2 && secs[i + 1].z < z) i++;
  const a = secs[i], b = secs[i + 1], t = Math.min(1, Math.max(0, (z - a.z) / (b.z - a.z)));
  const w = a.w + (b.w - a.w) * t, h = a.h + (b.h - a.h) * t, yo = (a.y || 0) + ((b.y || 0) - (a.y || 0)) * t;
  let best = 0;
  for (let j = 0; j < shape.length; j++) {
    const [u1, v1] = shape[j], [u2, v2] = shape[(j + 1) % shape.length], y1 = yo + v1 * h, y2 = yo + v2 * h;
    if (y1 === y2 || (y - y1) * (y - y2) > 0) continue;
    best = Math.max(best, (u1 + ((u2 - u1) * (y - y1)) / (y2 - y1)) * w);
  }
  return best;
}
// 面に そう くの字の 目（黒い 枠の 上に 光る すじ）。front：まん中の 前の z（なければ 形から 探す）
function vEye(parent, secs, shape, glow, { y = EYE_Y, h = 0.075, frame = 0.2, dark, zs = [0.02, 0.4], front } = {}) {
  let zf = front; if (zf === undefined) { zf = secs.at(-1).z; for (let z = 0; z < secs.at(-1).z; z += 0.01) if (edgeX(secs, shape, z, y) < 0.08) { zf = z; break; } }
  const pts = [...zs.map((z) => [edgeX(secs, shape, z, y), z]), [0, zf]];
  const seg = (ax, az, bx, bz, hh, m, out) => { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L; return put(parent, box(L + 0.05, hh, 0.07), m, (ax + bx) / 2 + nx * out, y, (az + bz) / 2 + nz * out, 0, Math.atan2(-dz, dx), 0); };
  for (const s of [1, -1]) for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (frame) seg(s * a[0], a[1], s * b[0], b[1], frame, dark, s * 0.02);
    seg(s * a[0], a[1], s * b[0], b[1], h, glow, s * 0.055);
  }
  return pts;
}

// ======================================================================
// 会社ごとの 形（g：入れ物、eyes：まばたきで つぶす 光、C：会社の 色）
// ======================================================================
const STYLE = {
  // 白い 研究所：PEREGRINE に 近い なめらかな くさび
  harmonia(g, eyes, C, glow, acc) {
    const pearl = mat("#F3F4F1", { roughness: 0.3, metalness: 0.1, flatShading: false }), gold = mat("#C9A44C", { roughness: 0.3, metalness: 0.6 }), DARK = mat("#1C1E23");
    const M = new THREE.Group(); M.rotation.x = 0.1; g.add(M); M.add(eyes);
    const S = [{ z: -0.45, w: 1.12, h: 0.74, y: 0.1 }, { z: 0, w: 1.1, h: 0.72, y: 0.1 }, { z: 0.32, w: 0.98, h: 0.6, y: 0.07 }, { z: 0.62, w: 0.6, h: 0.4, y: -0.03 }, { z: 0.86, w: 0.24, h: 0.2, y: -0.16 }, { z: 0.98, w: 0.05, h: 0.06, y: -0.27 }];
    put(M, loft(S, KITE_SOFT), pearl);
    vEye(eyes, S, KITE_SOFT, glow, { dark: DARK, h: 0.06, frame: 0.15 });
    vEye(M, S, KITE_SOFT, gold, { y: 0.6, h: 0.035, frame: 0, zs: [0.0, 0.3] });   // 金の 細い 縁（目の 上に 平行に）
    put(M, new THREE.TorusGeometry(0.11, 0.022, 6, 20), glow, 0, 0.71, 0.24, -1.05);   // 額の 細胞の 輪
    put(M, new THREE.SphereGeometry(0.035, 8, 6), glow, 0, 0.72, 0.25);
    put(g, box(0.04, 0.3, 0.8), pearl, 0, 0.88, -0.22, 0.55);   // うしろへ 流れる ひれ
    for (const s of [1, -1]) put(M, box(0.035, 0.07, 0.42), acc, s * (edgeX(S, KITE_SOFT, 0.2, -0.12) + 0.01), -0.12, 0.2, 0, s * 0.25, 0);   // 横の 差し色（傘下の 会社の 色）
  },
  // 重機の 現場：角ばった 装甲の 溶接面
  sva(g, eyes, C, glow, acc) {
    const olive = mat("#4A5034", { roughness: 0.6, metalness: 0.3 }), iron = mat("#1B1D1B", { roughness: 0.5, metalness: 0.5 }), yel = mat("#F2C200", { roughness: 0.5 }), steel = mat("#6A6E66", { roughness: 0.4, metalness: 0.6 });
    const S = [{ z: -0.45, w: 1.15, h: 0.72, y: 0.15 }, { z: 0, w: 1.15, h: 0.72, y: 0.15 }, { z: 0.36, w: 1.08, h: 0.66, y: 0.13 }, { z: 0.5, w: 0.96, h: 0.58, y: 0.12 }];
    put(g, loft(S, ARMOR), olive); g.add(eyes);
    put(g, box(1.72, 0.22, 0.08), iron, 0, EYE_Y, 0.5);                 // のぞき穴（横一文字）
    put(eyes, box(1.52, 0.075, 0.08), glow, 0, EYE_Y, 0.53);
    for (let i = 0; i < 8; i++) put(g, box(0.2, 0.11, 0.06), i % 2 ? iron : yel, -0.7 + i * 0.2, 0.6, 0.5);   // 額の 警告の 縞
    for (const [x, y] of [[-0.86, 0.6], [0.86, 0.6], [-0.86, 0.02], [0.86, 0.02]]) put(g, cyl(0.055, 0.055, 0.06, 8), steel, x, y, 0.52, Math.PI / 2);   // 鋲
    for (let i = 0; i < 3; i++) put(g, box(0.95 - i * 0.12, 0.05, 0.06), iron, 0, 0.12 - i * 0.11, 0.5);   // あごの 格子
    for (const s of [1, -1]) put(g, cyl(0.15, 0.15, 0.16, 8), acc, s * 1.18, 0.3, 0.02, 0, 0, Math.PI / 2);   // 横の 留め金（差し色）
    put(g, box(1.72, 0.04, 0.07), acc, 0, 0.2, 0.505);   // のぞき穴の 下の 帯（差し色）
    put(g, cyl(0.05, 0.05, 0.5, 6), iron, 0.62, 1.0, -0.12); put(g, box(0.18, 0.13, 0.24), steel, 0.62, 1.27, -0.06);   // 潜望鏡（片側）
    put(eyes, box(0.12, 0.04, 0.02), glow, 0.62, 1.27, 0.07);
  },
  // 城塞の 設計局：コンクリートの 板を 重ねた 城壁
  tcu(g, eyes, C, glow, acc) {
    const conc = mat("#8C949A", { roughness: 0.85, metalness: 0.05 }), conc2 = mat("#767E84", { roughness: 0.85, metalness: 0.05 }), navy = mat("#0E1318", { roughness: 0.5, metalness: 0.3 });
    g.add(eyes);
    put(g, box(2.1, 1.05, 0.5), navy, 0, 0.27, -0.12);                                 // うしろの 紺の 枠
    put(g, box(2.24, 0.3, 0.72), conc, 0, 0.62, 0.12);                                 // 上の 板
    put(g, box(2.12, 0.2, 0.6), navy, 0, EYE_Y, 0.1);                                  // 矢狭間の 段
    for (let i = 0; i < 5; i++) put(eyes, box(0.09, 0.13, 0.06), glow, -0.8 + i * 0.4, EYE_Y, 0.4);   // 細い 窓（水色の 光）
    put(g, box(1.96, 0.3, 0.62), conc2, 0, 0.08, 0.08);                                // 下の 板
    put(g, box(1.44, 0.24, 0.52), conc, 0, -0.19, 0.02);                               // あごの 板
    for (let i = 0; i < 4; i++) put(g, box(0.3, 0.16, 0.34), conc2, -0.78 + i * 0.52, 0.85, 0.12);   // 胸壁
    for (const s of [1, -1]) put(g, box(0.2, 0.86, 0.56), conc2, s * 1.12, 0.32, 0.0, 0, s * -0.12, 0);   // 横の 控え壁
    put(g, box(0.2, 0.1, 0.12), navy, 0, 0.82, 0.42); put(g, box(0.14, 0.06, 0.04), glow, 0, 0.82, 0.49);   // ランプ（差し色）
    for (let i = 0; i < 2; i++) put(g, box(2.25, 0.02, 0.02), acc, 0, 0.48 - i * 0.29, 0.475 - i * 0.04);   // 細い 線（TCU は 水色、傘下は 差し色）
  },
  // 暗号の 通信：黒い 鏡面の とがった 仮面
  nox(g, eyes, C, glow, acc) {
    const black = mat("#17151B", { roughness: 0.16, metalness: 0.7 }), edge = mat("#2E2838", { roughness: 0.3, metalness: 0.5 });
    const M = new THREE.Group(); M.rotation.x = 0.08; g.add(M); M.add(eyes);
    const S = [{ z: -0.45, w: 1.2, h: 0.7, y: 0.2 }, { z: 0, w: 1.2, h: 0.7, y: 0.2 }, { z: 0.32, w: 1.0, h: 0.55, y: 0.18 }, { z: 0.62, w: 0.52, h: 0.3, y: 0.1 }, { z: 0.78, w: 0.08, h: 0.06, y: 0.05 }];
    put(M, loft(S, BLADE), black);
    // 斜めの 目：左は 長い すじ、右は 途切れた 暗号の ような 光
    const line = (x0, z0, x1, z1, y0, y1, m, hh = 0.06) => { const L = Math.hypot(x1 - x0, z1 - z0, y1 - y0); const o = put(eyes, box(L, hh, 0.06), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.rotation.set(0, Math.atan2(-(z1 - z0), x1 - x0), Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0))); return o; };
    const P = (s, z, y) => [s * (edgeX(S, BLADE, z, y) + 0.04), z, y];
    { const a = P(-1, 0.05, 0.42), b = P(-1, 0.45, 0.36), c = [0, 0.66, 0.31]; line(a[0], a[1], b[0], b[1], a[2], b[2], glow); line(b[0], b[1], c[0], c[1], b[2], c[2], glow); }
    for (const [z0, z1, y] of [[0.02, 0.1, 0.27], [0.16, 0.3, 0.29], [0.36, 0.42, 0.3], [0.5, 0.58, 0.31]]) { const a = P(1, z0, y), b = P(1, z1, y + 0.01); line(a[0], a[1], b[0], b[1], a[2], b[2], glow); }
    for (const [x, y, z, w] of [[-0.3, 0.72, 0.36, 0.14], [-0.08, 0.76, 0.3, 0.08], [0.16, 0.7, 0.38, 0.18], [0.36, 0.66, 0.4, 0.06]]) put(M, box(w, 0.03, 0.06), glow, x, y, z, -0.7);   // 額の 暗号
    put(g, box(0.05, 0.42, 0.95), edge, 0, 0.92, -0.25, 0.6);                             // ひれ
    for (const s of [1, -1]) put(g, box(0.04, 0.2, 0.6), edge, s * 0.95, 0.62, -0.2, 0.5, 0, s * 0.5);
  },
  // 公式の 通達：深い 青の 丸い 面に 白の 縁取り
  foundation(g, eyes, C, glow, acc) {
    const blue = mat("#1D3A6E", { roughness: 0.32, metalness: 0.35, flatShading: false }), white = mat("#F3F6FA", { roughness: 0.3, flatShading: false }), DARK = mat("#0C1630");
    const M = new THREE.Group(); M.rotation.x = 0.08; g.add(M); M.add(eyes);
    const S = [{ z: -0.45, w: 1.12, h: 0.76, y: 0.14 }, { z: 0, w: 1.12, h: 0.76, y: 0.14 }, { z: 0.3, w: 1.02, h: 0.68, y: 0.13 }, { z: 0.5, w: 0.8, h: 0.52, y: 0.1 }, { z: 0.62, w: 0.38, h: 0.28, y: 0.08 }];
    put(M, loft(S, ROUND), blue);
    put(M, loft([{ z: -0.06, w: 1.18, h: 0.82, y: 0.14 }, { z: 0.06, w: 1.17, h: 0.81, y: 0.14 }], ROUND), white);   // 白の 縁取り
    vEye(eyes, S, ROUND, glow, { dark: DARK, h: 0.12, frame: 0.24, zs: [0.0, 0.3] });   // 横に 広い 光の 帯
    const em = new THREE.Group(); em.position.set(0, 0.6, 0.5); em.rotation.x = -0.55; em.scale.setScalar(0.95); M.add(em);   // 額の 地球の 紋章（正面から 見える 所）
    put(em, new THREE.TorusGeometry(0.13, 0.024, 6, 22), white);
    put(em, new THREE.TorusGeometry(0.13, 0.016, 6, 22), white, 0, 0, 0, 0, Math.PI / 2, 0).scale.set(0.45, 1, 1);
    put(em, box(0.26, 0.02, 0.02), white);
    for (const s of [1, -1]) for (let i = 0; i < 3; i++) put(g, box(0.06, 0.32 - i * 0.07, 0.07), white, s * (0.62 + i * 0.12), 0.95 - i * 0.03, -0.1 - i * 0.05, 0.3, 0, -s * (0.5 + i * 0.12));   // 白い 小さな 翼
  },
  // 独立：寄せ集めの 板の 仮面（会社の 印が ない。左は 丸い 1 つ目、右は 細い すき間。つぎはぎと 鋲と 帯）
  indie(g, eyes, C, glow, acc) {
    const gun = mat("#4A4E52", { roughness: 0.5, metalness: 0.55 }), patch = mat("#6E6A60", { roughness: 0.8, metalness: 0.2 }), rust = mat("#7A4A2E", { roughness: 0.9 }), strap = mat("#2A2622", { roughness: 0.9 }), DARK = mat("#16181A");
    const S = [{ z: -0.45, w: 1.12, h: 0.7, y: 0.16 }, { z: 0, w: 1.12, h: 0.7, y: 0.16 }, { z: 0.34, w: 1.02, h: 0.6, y: 0.14 }, { z: 0.48, w: 0.9, h: 0.5, y: 0.12 }];
    put(g, loft(S, ARMOR), gun); g.add(eyes);
    put(g, cyl(0.27, 0.27, 0.12, 16), DARK, -0.45, EYE_Y, 0.5, Math.PI / 2);   // 丸い 1 つ目
    put(g, new THREE.TorusGeometry(0.27, 0.05, 6, 18), patch, -0.45, EYE_Y, 0.56);
    put(eyes, cyl(0.15, 0.15, 0.05, 14), glow, -0.45, EYE_Y, 0.57, Math.PI / 2);
    put(g, box(0.62, 0.16, 0.07), DARK, 0.42, EYE_Y, 0.49); put(eyes, box(0.5, 0.05, 0.07), glow, 0.42, EYE_Y, 0.51);   // 細い すき間
    put(g, box(0.5, 0.36, 0.05), patch, 0.42, 0.66, 0.45, 0, 0, 0.12); put(g, box(0.36, 0.26, 0.05), rust, 0.5, 0.0, 0.46, 0, 0, -0.2);   // つぎはぎの 板
    for (const [x, y] of [[0.22, 0.78], [0.62, 0.74], [0.36, 0.1], [0.64, -0.08]]) put(g, cyl(0.04, 0.04, 0.05, 6), gun, x, y, 0.49, Math.PI / 2);   // 鋲
    put(g, box(2.3, 0.14, 0.9), strap, 0, 0.62, -0.25);   // うしろへ まわる 帯
    put(g, box(0.4, 0.12, 0.06), acc, -0.45, 0.72, 0.46);   // 差し色の 布（精鋭の 色）
    put(g, cyl(0.03, 0.03, 0.7, 5), DARK, -0.7, 0.95, -0.1, -0.3, 0, 0.25);   // 曲がった アンテナ 1 本
  },
  // 事務の 書類：灰色の 四角い ゴーグル
  linkers(g, eyes, C, glow, acc) {
    const gray = mat("#B9BDBF", { roughness: 0.55, metalness: 0.1, flatShading: false }), black = mat("#2A2C2E", { roughness: 0.4 }), paper = mat("#F3F6FA", { roughness: 0.8 });
    g.add(eyes);
    put(g, new RoundedBoxGeometry(2.24, 1.0, 0.86, 3, 0.2), gray, 0, 0.3, 0.05);
    put(g, new RoundedBoxGeometry(1.92, 0.5, 0.12, 2, 0.08), black, 0, EYE_Y, 0.46);
    put(eyes, box(1.5, 0.06, 0.05), glow, 0, EYE_Y, 0.53);
    for (let i = 0; i < 11; i++) put(g, box(0.02, 0.32, [0.03, 0.05, 0.02, 0.06][i % 4]), black, 1.125, 0.32, -0.25 + i * 0.05);   // バーコード（右の 横）
    put(g, box(0.02, 0.28, 0.5), paper, -1.125, 0.34, 0.0);                                   // 番号札（左の 横）
    for (let i = 0; i < 3; i++) put(g, box(0.025, 0.03, 0.36 - i * 0.08), black, -1.14, 0.42 - i * 0.07, -0.03);
    put(g, box(0.3, 0.12, 0.2), black, 0.55, 0.86, -0.05);                                    // 上の 小さな 感知器
    put(eyes, box(0.06, 0.04, 0.02), glow, 0.55, 0.86, 0.06);
    put(g, box(1.6, 0.03, 0.02), black, 0, 0.66, 0.48);                                       // 書類の 欄の ような 線
  },
};

export function makeVisor({ co = "sva", eye, style, accent } = {}) {
  const R = resolveCo(co), C = COMPANY[R.group] || COMPANY.sva, glow = glowMat(eye || R.glow), acc = mat(accent || R.accent, { roughness: 0.4, metalness: 0.25 });
  const g = new THREE.Group(), eyes = new THREE.Group();
  (STYLE[style || R.group] || STYLE.sva)(g, eyes, C, glow, acc);
  g.userData.tick = (t) => {   // 目の 光と ときどきの まばたき（目の 高さで つぶす）
    const b = (t % 4.6) < 0.12 ? 0.25 : 1; eyes.scale.y = b; eyes.position.y = EYE_Y * (1 - b);
    glow.emissiveIntensity = 1.15 + 0.35 * Math.sin(t * 2.4);
  };
  return g;
}

// 種類ごとの 合わせ（目が はみ出さない ように）。sx 横・sy 縦の 倍率、y 上下（顔の 取りつけ位置の 大きさが 単位）
// 目の 位置は バイザー なしの 正面の 顔から 読んだ（目が 離れて いる マウス・ちょきんばこ、目が 大きい タコ・黒いエビは 大きめ）
export const FIT = {
  shika: { sx: 1.2, sy: 1.05, y: -0.36 }, pelican: { sx: 1.3, sy: 1.36, y: -0.26 }, mouse: { sx: 1.6, sy: 1.05, y: -0.02 }, tv: { sx: 1.1, sy: 1, y: -0.11 },
  mogura: { sx: 1.3, sy: 1, y: -0.15 }, kurage: { sx: 1.15, sy: 1.05, y: -0.45 }, saboten: { sx: 1, sy: 1, y: -0.24 }, chokin: { sx: 1.8, sy: 1.05, y: 0.04 },
  tako: { sx: 1.45, sy: 1.3, y: 0.03 }, ittan: { sx: 1, sy: 1, y: 0.19 }, ebi: { sx: 1.9, sy: 1.7, y: -0.04 }, beagle: { sx: 1.1, sy: 1.05, y: 0.11 },
};
export function wearVisor(pet, opts = {}) {
  const a = pet.userData.anchors?.face; if (!a) return null;
  const f = FIT[pet.userData.species] || { sx: 1, sy: 1, y: 0 };
  const v = makeVisor(opts); v.position.copy(a.pos); v.position.y += f.y * a.s; v.scale.set(a.s * f.sx, a.s * f.sy, a.s * Math.max(1, (f.sx + f.sy) / 2)); a.parent.add(v);
  const base = pet.userData.tick; pet.userData.tick = (t) => { base?.(t); v.userData.tick(t); };
  pet.userData.visor = v; return v;
}

// 敵の POM：ペット ＋ 会社の バイザー（co は グループ・傘下の 会社・indie）
export function makePOM(species, { co = "sva", visor = true, eye, accent, paint } = {}) {
  const g = makePet3(species);
  if (paint) paintPet(g, paint);
  if (visor) wearVisor(g, { co, eye, accent });
  g.userData.pom = { co }; return g;
}

// ======================================================================
// 精鋭の ペットの 塗り分け（鹿さんの 声 2026-11-01「精鋭によってペット自体のカラーも変えてしまうのもいいかもしれませんね」）
// paint：[主の 色, 副の 色]。ペットの いちばん 広い 色を 主に、次に 広い 色を 副に ぬりかえる。白・黒・灰（目・口・おなか）と 小さな 飾りは そのまま
// ======================================================================
export function paintPet(pet, paint) {
  const area = new Map(), hsl = {}, meshes = [];
  pet.updateMatrixWorld(true);
  pet.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.material?.color || o.material.map) return;
    const m = o.material; if (m.emissive && m.emissive.getHex() !== 0 && m.emissiveIntensity > 0.5) return;   // はっきり 光る 所（ランプ・線）は そのまま。うっすら 光る 体（くらげ）は ぬる
    m.color.getHSL(hsl, THREE.SRGBColorSpace); if (hsl.s < 0.2 || hsl.l < 0.12 || hsl.l > 0.92) return;    // 白・黒・灰は そのまま
    o.geometry.computeBoundingSphere(); const sc = new THREE.Vector3(); o.getWorldScale(sc); const r = o.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z);
    const k = m.color.getHexString(); area.set(k, (area.get(k) || 0) + r * r); meshes.push([o, k]);
  });
  const rank = [...area.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  const to = { [rank[0]]: paint[0], [rank[1]]: paint[1] ?? paint[0] };
  for (const [o, k] of meshes) if (to[k]) {
    const m = (o.material = o.material.clone()), was = Math.max(m.color.r, m.color.g, m.color.b, 0.01);
    m.color.set(to[k]);
    if (m.emissive && m.emissive.getHex() !== 0) m.emissive.copy(m.color).multiplyScalar(Math.max(m.emissive.r, m.emissive.g, m.emissive.b) / was);   // 光の 色も 主・副に
  }
  pet.userData.paint = paint; return pet;
}
// 精鋭 32 人（mono-link-crawler-elites.md の 番付の 順）。species：機体の ペット、co：所属（傘下の 会社・独立は indie）、paint：[主, 副]、eye：独立の 人の 目の 色
// 色は Claude の 案（二つ名・エンブレム・性格から）。所属は 仮面の 形と 差し色、だれかは ペットの 色で わかる
export const ELITES = {
  silent_meridian: { name: "SILENT MERIDIAN", species: "shika", co: "indie", paint: ["#E6E2D6", "#2A2A30"], eye: "#F2E3B0" },   // 真昼の 線を 断つ 細い 線：骨の 白と 墨
  plumb_line: { name: "PLUMB LINE", species: "pelican", co: "foundation", paint: ["#1D3A6E", "#F3F6FA"] },                    // 下げ振り：深い 青と 白
  boxcar: { name: "BOXCAR", species: "mogura", co: "vlc", paint: ["#7A4A2E", "#2A2D2A"] },                                     // 錆びた 貨車の 車輪：さびと 鉄
  lullaby: { name: "LULLABY", species: "kurage", co: "mlv", paint: ["#F0E6C0", "#34407A"] },                                    // 揺りかごの 三日月：夜の 紺の かさと 月の 白の 足（くらげは 足が 主・かさが 副）
  long_winter: { name: "LONG WINTER", species: "saboten", co: "grn", paint: ["#E2EAEE", "#2F4A3A"] },                           // 雪の 積もった 木：雪と 松
  cherry_smoke: { name: "CHERRY SMOKE", species: "tv", co: "nox", paint: ["#B0263C", "#4A4650"] },                              // さくらんぼと 煙
  patience: { name: "PATIENCE", species: "shika", co: "odh", paint: ["#5A5A3A", "#8A2A26"] },                                  // 待つ 狩人：くすんだ オリーブと 血の 赤
  windowsill: { name: "WINDOWSILL", species: "saboten", co: "clr", paint: ["#9FD8B8", "#F2B8C8"] },                             // 夢見る 傭兵：ミントと 桃
  last_orders: { name: "LAST ORDERS", species: "chokin", co: "indie", paint: ["#5E3418", "#1A1A1A"], eye: "#E0A040" },          // 賞金稼ぎ：ウイスキーの 琥珀と 黒
  homebound: { name: "HOMEBOUND", species: "pelican", co: "crv", paint: ["#D08A2E", "#1F2A44"] },                               // 玄関の 灯り：琥珀と 夜の 紺
  glass_eye: { name: "GLASS EYE", species: "mouse", co: "linkers", paint: ["#E2E4E8", "#2A2C2E"] },                             // 監察官：白と 黒
  short_fuse: { name: "SHORT FUSE", species: "tv", co: "hlx", paint: ["#1E2228", "#F2C200"] },                                  // すぐ 怒る：黒と 雷の 黄
  porcelain: { name: "PORCELAIN", species: "mouse", co: "amb", paint: ["#F2EEE6", "#2C4C8C"] },                                 // 磁器：白と 染付の 青
  first_light: { name: "FIRST LIGHT", species: "shika", co: "foundation", paint: ["#8FB4E8", "#F3F6FA"] },                      // 夜明け：空色と 白
  bruiser: { name: "BRUISER", species: "mogura", co: "rsl", paint: ["#5A3A5A", "#B48C8C"] },                                    // 打たれて 笑う：あざの 紫と 灰ばら
  rust_pilgrim: { name: "RUST PILGRIM", species: "mogura", co: "indie", paint: ["#8A4A2A", "#B8A888"], eye: "#F0C080" },        // 拾い屋：さびと 色あせた 砂
  backbone: { name: "BACKBONE", species: "mogura", co: "drn", paint: ["#B07A3A", "#2A2622"] },                                  // 坑道の 守り手：黄土と 石炭
  stalemate: { name: "STALEMATE", species: "chokin", co: "srn", paint: ["#E8E8E4", "#1A1A1E"] },                                // 引き際：盤の 白と 黒
  nobody: { name: "NOBODY", species: "mouse", co: "nox", paint: ["#5A5A60", "#3A3A40"] },                                      // 記録を 残さない：ただの 灰
  hush: { name: "HUSH", species: "saboten", co: "ldn", paint: ["#6E5E48", "#B39A6B"] },                                        // 単語しか 話さない：こい 木と うすい 木
  sparky: { name: "SPARKY", species: "chokin", co: "vlc", paint: ["#FF7A2A", "#F2C200"] },                                     // 若い 試し手：安全の 橙と 黄
  paper_lantern: { name: "PAPER LANTERN", species: "kurage", co: "indie", paint: ["#F2E2C0", "#C8402A"], eye: "#FFB060" },      // 提灯：和紙と 朱
  deja_vu: { name: "DEJA VU", species: "kurage", co: "mlv", paint: ["#7FE0D8", "#8A6ACF"] },                                    // 試験の 中から：青緑と 紫
  afterthought: { name: "AFTERTHOUGHT", species: "tv", co: "foundation", paint: ["#4A5A70", "#C9D4E6"] },                       // 片付け屋：青灰と うすい 青
  splint: { name: "SPLINT", species: "pelican", co: "grn", paint: ["#9A3A44", "#F2F0EC"] },                                    // 添え木：柘榴と 包帯の 白
  stopwatch: { name: "STOPWATCH", species: "pelican", co: "linkers", paint: ["#C8CCD0", "#1E1E22"] },                           // 試験官：銀と 黒
  nine_lives: { name: "NINE LIVES", species: "chokin", co: "indie", paint: ["#1E6A3A", "#D4AF37"], eye: "#FFD86A" },            // 賭け：緑の ラシャと 金
  ghost_note: { name: "GHOST NOTE", species: "tv", co: "nox", paint: ["#D8D0E8", "#5A4A7A"] },                                  // 死んだ ことに なって いる：白い 影と 紫
  one_shoe: { name: "ONE SHOE", species: "mouse", co: "odh", paint: ["#B3262B", "#EDEDED"] },                                  // 新米：赤と 白
  bookmark: { name: "BOOKMARK", species: "saboten", co: "clr", paint: ["#E8DCC0", "#5E9E3A"] },                                // しおり：紙と 葉の 緑
  rabbit_hole: { name: "RABBIT HOLE", species: "shika", co: "crv", paint: ["#EDE8E0", "#D08A2E"] },                            // 白い うさぎと 琥珀
  new_moon: { name: "NEW MOON", species: "kurage", co: "indie", paint: ["#C8CCD8", "#1A1E2E"], eye: "#C8D8FF" },                // 新月：黒い かさと 銀の 足
};
export function makeElitePOM(id) {
  const e = ELITES[id]; if (!e) return null;
  const g = makePOM(e.species, { co: e.co, eye: e.eye, paint: e.paint, accent: e.co === "indie" ? e.paint[1] : undefined });
  g.userData.elite = id; return g;
}
