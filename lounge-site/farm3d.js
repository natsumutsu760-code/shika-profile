// 農業の 畑（3D。鹿さんの決め、2026-10-29：畑は 3D、作物は ドット絵の 板）。M-010（モデリング）
// makeFarm({ skin }) → { group, env, show(field, now), pop(i, item, color), tick(t), pick(raycaster) }
//   skin：農場の スキン（SKINS。鹿さんの決め 2026-10-29：両方 使う・スキンは これからも ふやす）。景色だけ ちがい、畑の マス・作物・演出は 同じ
//   スキンを 足す：sceneXxx(g) を 書いて SKINS に 1 行（plot・lockedPlot の 見た目も スキンごとに 足せる）
//   畑の 記録（field）と 決まりは farm-core.js。マス i は 6×6 の 並び（横 i % 6・縦 i / 6）。使えるのは fieldSize(lv) の 中だけ
//   作物の 絵は crop-art.js の cropCanvas を 板に 貼る（ぼかさない）。かわった 物は 素材の 絵と「あと N 回」
import * as THREE from "three";
import { CROP, CROP_MATS } from "./crops.js";
import { stageAt, fieldSize, inField, W, SOILS } from "./farm-core.js";
import { cropCanvas } from "./crop-art.js";
import { matIconURL } from "./mat-icons.js";

const M = {}, mat = (c, o = {}) => (M[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, flatShading: true, ...o }));
// 形・札の 絵・板は 1 回 作って 使い回す（前は 1 秒ごとに 畑 ぜんぶを 新しく 作って 捨てず、スマホの メモリが 数秒で いっぱいに なって 画面が 落ちた。2026-11-05）
const GEO = {}, geo = (k, make) => (GEO[k] ||= make());
const BASIC = {}, basic = (c) => (BASIC[c] ||= new THREE.MeshBasicMaterial({ color: c }));
function box(p, w, h, d, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), typeof c === "string" ? mat(c) : c); m.position.set(x, y + h / 2, z); p.add(m); return m; }
function cyl(p, rt, rb, h, c, x = 0, y = 0, z = 0, seg = 8) { const m = new THREE.Mesh(geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), typeof c === "string" ? mat(c) : c); m.position.set(x, y + h / 2, z); p.add(m); return m; }

// 土の 色（SOILS の 5 しゅるい。土を かえると 畑 ぜんぶの 色が かわる）
export const SOIL_LOOK = {
  normal: { top: "#7A5236", line: "#5E3E28" }, leaf: { top: "#3E2E22", line: "#2A1E16", bits: "#6A8A3A" },
  clay: { top: "#A0583A", line: "#7A4028" }, sand: { top: "#D8BE86", line: "#B89E66" }, ash: { top: "#4A4448", line: "#2E2A2E", bits: "#E85A2A" },
};
export const STEP = 1.06;                                 // マスの 間かく
export const cellPos = (i) => new THREE.Vector3(((i % W) - (W - 1) / 2) * STEP, 0, (Math.floor(i / W) - (W - 1) / 2) * STEP);

// 文字の 札（canvas → 板）。同じ 文字と 色の 札は 絵を 使い回す。own：材質を 自分だけの 物に する（うすく する・前後を かえる 物）
const LBL = new Map();
function label(text, { bg = "rgba(20,16,34,.85)", fg = "#FFF", size = 36, pad = 14, border = null, own = false } = {}) {
  const key = JSON.stringify([text, bg, fg, size, pad, border]);
  let L = LBL.get(key);
  if (!L) {
    const c = document.createElement("canvas"), x = c.getContext("2d"); x.font = `900 ${size}px "Zen Maru Gothic", system-ui, sans-serif`;
    const w = Math.ceil(x.measureText(text).width) + pad * 2, h = size + pad * 1.4; c.width = w; c.height = h;
    x.font = `900 ${size}px "Zen Maru Gothic", system-ui, sans-serif`; x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, w, h, h / 2); x.fill();
    if (border) { x.strokeStyle = border; x.lineWidth = 4; x.stroke(); }
    x.fillStyle = fg; x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    L = { a: w / h, m: new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }) }; LBL.set(key, L);
  }
  const s = new THREE.Sprite(own ? L.m.clone() : L.m); s.scale.set(L.a * 0.32, 0.32, 1); s.renderOrder = 10; return s;
}
// 作物の 絵の 板（16×16 → ぼかさない）
const TEX = new Map();
function pixTex(key, make) {
  if (TEX.has(key)) return TEX.get(key);
  const t = new THREE.CanvasTexture(make()); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  TEX.set(key, t); return t;
}
const cropTex = (crop, stage, variant) => pixTex(`${crop.id}:${stage}:${variant || ""}`, () => cropCanvas(crop, stage, { variant, scale: 1 }));
const matTex = (id) => { const m = CROP_MATS.find((x) => x.id === id); if (m) return cropTex(m, "item"); return pixTex(`mat:${id}`, () => { const c = document.createElement("canvas"); c.width = c.height = 16; const im = new Image(); im.src = matIconURL(id); im.onload = () => { c.getContext("2d").drawImage(im, 0, 0); TEX.get(`mat:${id}`).needsUpdate = true; }; return c; }); };
const BMAT = new Map();
function board(tex, size = 0.98) {
  if (!BMAT.has(tex)) BMAT.set(tex, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  return new THREE.Mesh(geo(`p${size}`, () => new THREE.PlaneGeometry(size, size).translate(0, size / 2, 0)), BMAT.get(tex));
}
const shadow = () => new THREE.Mesh(geo("shadow", () => new THREE.CircleGeometry(0.28, 16)), (M.shadow ||= new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.22, depthWrite: false })));

// ---------- 景色（2 案） ----------
function sceneBox(g) {   // お菓子の 箱の 箱庭：木の 箱の 中に 畑・まわりは 芝と 柵・箱の ふたが ひらいて いる
  const half = (W * STEP) / 2 + 0.55, wall = "#C89A5E", kraft = "#B8834E";
  box(g, half * 2 + 0.6, 0.25, half * 2 + 0.6, "#8E6A44", 0, -0.25, 0);                                     // 箱の 底
  box(g, half * 2, 0.06, half * 2, "#7CC064", 0, 0, 0);                                                    // 芝
  for (const [w, d, x, z] of [[half * 2 + 0.6, 0.3, 0, -half - 0.15], [half * 2 + 0.6, 0.3, 0, half + 0.15], [0.3, half * 2, -half - 0.15, 0], [0.3, half * 2, half + 0.15, 0]]) box(g, w, 0.75, d, wall, x, -0.25, z);
  // ひらいた ふた（奥と 左）
  const f1 = box(g, half * 2 + 0.6, 0.06, 1.3, kraft, 0, 0.5, -half - 0.9); f1.rotation.x = -0.55;
  const f2 = box(g, 1.3, 0.06, half * 2, kraft, -half - 0.9, 0.5, 0); f2.rotation.z = 0.55;
  // 箱の 印刷（お菓子の 箱らしい 色の 帯）
  box(g, half * 2 + 0.62, 0.12, 0.02, "#E8393C", 0, 0.12, half + 0.31); box(g, 0.02, 0.12, half * 2, "#FFC21A", half + 0.31, 0.12, 0);
  // 柵（手前と 右）と 小さな 木・道しるべ
  for (let k = -half + 0.3; k <= half - 0.3; k += 0.55) { box(g, 0.06, 0.32, 0.06, "#F2E6CC", k, 0.05, half - 0.2); box(g, 0.06, 0.32, 0.06, "#F2E6CC", half - 0.2, 0.05, k); }
  box(g, half * 2 - 0.4, 0.04, 0.03, "#F2E6CC", 0, 0.28, half - 0.2); box(g, 0.03, 0.04, half * 2 - 0.4, "#F2E6CC", half - 0.2, 0.28, 0);
  for (const [x, z, s] of [[-half + 0.3, -half + 0.3, 1], [half - 0.35, -half + 0.35, 0.8]]) { cyl(g, 0.06, 0.08, 0.4 * s, "#8A6440", x, 0.05, z); const b = new THREE.Mesh(geo(`ico${s}`, () => new THREE.IcosahedronGeometry(0.32 * s, 0)), mat("#4E9A48")); b.position.set(x, 0.55 * s + 0.05, z); g.add(b); }
  return { bg: "#BFE6FF", hemi: ["#FFFFFF", "#8AA070", 1.5], sun: ["#FFF4E0", 1.6] };
}
function sceneGreenhouse(g) {   // CLR の 温室：ガラスと 金ぞくの わく・コンクリートの 床・紫の 育成ライト
  const half = (W * STEP) / 2 + 0.7, metal = "#B8C0CC", glass = new THREE.MeshStandardMaterial({ color: "#CFF4FF", transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0.1, depthWrite: false });
  box(g, half * 2 + 0.4, 0.2, half * 2 + 0.4, "#9AA0A8", 0, -0.2, 0);                                      // 床
  for (let x = -half; x <= half + 0.01; x += 1.2) box(g, 0.02, 0.01, half * 2, "#868C94", x, 0, 0);
  for (const [x, z] of [[-half, -half], [half, -half], [-half, half], [half, half], [0, -half], [-half, 0]]) box(g, 0.1, 2.6, 0.1, metal, x, 0, z);
  box(g, half * 2, 0.1, 0.1, metal, 0, 2.6, -half); box(g, 0.1, 0.1, half * 2, metal, -half, 2.6, 0);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 2.6), glass); back.position.set(0, 1.3, -half); g.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 2.6), glass); left.rotation.y = Math.PI / 2; left.position.set(-half, 1.3, 0); g.add(left);
  for (let k = -half + 1; k < half; k += 1.2) { box(g, 0.04, 2.6, 0.04, metal, k, 0, -half); box(g, 0.04, 2.6, 0.04, metal, -half, 0, k); }
  // 育成ライト（奥と 左の かべに 付けた 光の 帯。畑の 上は あける）
  const lampMat = new THREE.MeshStandardMaterial({ color: "#FF8AE8", emissive: "#E060FF", emissiveIntensity: 1.6 });
  for (const y of [1.2, 2.0]) { const a1 = box(g, half * 2 - 0.4, 0.08, 0.08, lampMat, 0, y, -half + 0.08); const a2 = box(g, 0.08, 0.08, half * 2 - 0.4, lampMat, -half + 0.08, y, 0); a1.userData.glow = a2.userData.glow = true; }
  for (const [x, z] of [[0, -half + 0.6], [-half + 0.6, 0]]) { const pl = new THREE.PointLight("#E080FF", 2.2, 7, 1.4); pl.position.set(x, 1.6, z); g.add(pl); }
  // CLR の 看板と 計測の 機械
  const sign = label("CLR  CHLOROSIS BIOTECH", { bg: "#1E2A3A", fg: "#7CFFB0", size: 30, border: "#7CFFB0", own: true }); sign.position.set(0, 2.35, -half + 0.05); sign.scale.multiplyScalar(1.5); sign.material.depthTest = true; g.add(sign);
  box(g, 0.5, 0.9, 0.4, "#3A4458", -half + 0.45, 0, half - 0.6); box(g, 0.36, 0.22, 0.02, new THREE.MeshStandardMaterial({ color: "#7CFFB0", emissive: "#3AE890", emissiveIntensity: 1.2 }), -half + 0.45, 0.55, half - 0.39);
  return { bg: "#1C2230", hemi: ["#C8D8FF", "#2A2E38", 1.2], sun: ["#FFF4E0", 0.9] };
}

// ---------- 畑の マス ----------
function plot(style, soil) {
  const g = new THREE.Group(), S = SOIL_LOOK[soil] || SOIL_LOOK.normal;
  if (style === "greenhouse") { box(g, 0.98, 0.34, 0.98, "#B4B8BE", 0, 0, 0); box(g, 0.82, 0.04, 0.82, S.top, 0, 0.32, 0); }
  else { box(g, 0.94, 0.16, 0.94, "#6E4A30", 0, 0, 0); box(g, 0.9, 0.04, 0.9, S.top, 0, 0.14, 0); }
  const y = style === "greenhouse" ? 0.37 : 0.185;
  for (const dz of [-0.24, 0, 0.24]) box(g, 0.74, 0.012, 0.05, S.line, 0, y - 0.006, dz);   // うね の すじ
  if (S.bits) for (const [x, z] of [[-0.3, -0.12], [0.22, 0.3], [0.3, -0.3]]) box(g, 0.06, 0.012, 0.06, S.bits, x, y - 0.006, z);
  g.userData.top = y; return g;
}
function lockedPlot(style, needLv) {   // まだ 使えない マス：箱庭は 芝の ふた、温室は 金ぞくの ふた。まん中に 必要な 農業の Lv
  const g = new THREE.Group();
  if (style === "greenhouse") { box(g, 0.98, 0.34, 0.98, "#6E747C", 0, 0, 0); for (const k of [-0.3, 0, 0.3]) { const st = box(g, 0.1, 0.012, 0.9, "#E8C23A", k, 0.34, 0); st.rotation.y = 0.6; } }
  else { box(g, 0.94, 0.1, 0.94, "#6FAE5A", 0, 0, 0); for (const [x, z] of [[-0.25, -0.2], [0.2, 0.25]]) box(g, 0.05, 0.08, 0.05, "#5A9A48", x, 0.1, z); }
  const t = label(`Lv${needLv}`, { bg: "rgba(20,16,34,.6)", fg: "#E8ECF4", size: 30 }); t.position.set(0, style === "greenhouse" ? 0.5 : 0.28, 0); t.scale.multiplyScalar(0.8); g.add(t);
  return g;
}
const needLvOf = (i) => { for (const [lv, w, h] of [[1, 3, 3], [5, 3, 4], [10, 4, 4], [15, 4, 5], [20, 5, 5], [25, 5, 6], [30, 6, 6]]) if (i % W < w && Math.floor(i / W) < h) return lv; return 30; };

export const SKINS = {
  box: { name: "お菓子の箱の箱庭", en: "Candy Box Diorama", build: (g) => sceneBox(g) },
  greenhouse: { name: "CLR の温室", en: "CLR Greenhouse", build: (g) => sceneGreenhouse(g) },
};
// スプリンクラー（工房で 作る。マスに 置く。色は 工房の 絵と 同じ：ふつう 灰・上 金・星 紫）
const SPR_LOOK = { sprinkler: ["#8F9AAA", "#4A5468"], sprinkler2: ["#E0A21C", "#8A5F00"], sprinkler3: ["#8E6CFF", "#4B2FA8"] };
function sprinkler(kind, p, top, i) {
  const [c1, c2] = SPR_LOOK[kind] || SPR_LOOK.sprinkler, g = new THREE.Group(); g.position.set(p.x, top - 0.02, p.z); g.userData.i = i;
  cyl(g, 0.2, 0.24, 0.12, c2); cyl(g, 0.05, 0.05, 0.42, "#C9D3EA", 0, 0.12); cyl(g, 0.15, 0.1, 0.12, c1, 0, 0.52);
  [0, Math.PI / 2].forEach((r) => { const a = box(g, 0.46, 0.04, 0.05, c2, 0, 0.6); a.rotation.y = r; });
  if (kind === "sprinkler3") { const st = new THREE.Mesh(geo("oct0.09", () => new THREE.OctahedronGeometry(0.09, 0)), mat("#FFE07A", { emissive: "#FFC21A", emissiveIntensity: 0.8 })); st.position.y = 0.78; g.add(st); }
  return g;
}
export function makeFarm({ skin, style } = {}) {
  style = SKINS[skin || style] ? skin || style : "box";
  const group = new THREE.Group(), scene = new THREE.Group(), cells = new THREE.Group(), fx = new THREE.Group();
  group.add(scene, cells, fx);
  const env = SKINS[style].build(scene);
  scene.add(new THREE.HemisphereLight(...env.hemi)); const sun = new THREE.DirectionalLight(env.sun[0], env.sun[1]); sun.position.set(5, 9, 6); scene.add(sun);
  const face = { y: Math.PI / 4 };   // 作物の 板の 向き（カメラの 方。set で かえる）
  const live = [];                   // うごく 物（演出）
  const glows = []; scene.traverse((o) => { if (o.userData.glow) glows.push(o); });   // 温室の 光の 帯（毎こま 全部を さがさない）
  // マス 1 つ分の 物（土台・作物の 板・札・かげ）を 1 つの まとまりに。どこを 押しても そのマス（userData.i）
  function cellGroup(i, ok, c, soil, st) {
    const p = cellPos(i), g = new THREE.Group(); g.userData.i = i;
    const base = ok ? plot(style, soil) : lockedPlot(style, needLvOf(i)); base.position.copy(p); g.add(base);
    if (!c) return g;
    const top = base.userData.top;
    if (c.spr) { g.add(sprinkler(c.spr, p, top, i)); return g; }
    let tex, scale = 0.9;
    if (c.obj) { tex = matTex(c.obj); scale = 0.8;
      const tag = label(`あと ${c.taps} 回`, { bg: "rgba(255,193,26,.95)", fg: "#2B2238", size: 28 }); tag.position.set(p.x, top + 1.05, p.z); tag.scale.multiplyScalar(0.85); g.add(tag); }
    else { const crop = CROP[c.id]; if (!crop) return g; tex = cropTex(crop, st); if (st === "sprout") scale = 0.8; }
    const b = board(tex, scale); b.position.set(p.x, top - 0.02, p.z); b.rotation.y = face.y; g.add(b);
    const sh = shadow(); sh.rotation.x = -Math.PI / 2; sh.position.set(p.x, top + 0.005, p.z); g.add(sh);
    return g;
  }
  // 畑を 見せる（1 秒ごとに 呼ばれる）。かわった マスだけ 作りなおす。かわった マスが あれば true
  const slots = [];
  function show(field, now) {
    const soil = field.soil || "normal"; let changed = false;
    for (let i = 0; i < W * W; i++) {
      const ok = inField(field.lv, i), c = ok ? field.cells[i] : null;
      const st = c && !c.spr && !c.obj && CROP[c.id] ? stageAt(c, now, soil).stage : "";
      const key = ok ? `${soil}|${c ? [c.spr || "", c.obj || "", c.taps ?? "", c.id || "", st].join("/") : ""}` : `L${needLvOf(i)}`;
      if (slots[i] && slots[i].key === key) continue;
      if (slots[i]) cells.remove(slots[i].g);
      slots[i] = { key, g: cellGroup(i, ok, c, soil, st) }; cells.add(slots[i].g); changed = true;
    }
    return changed;
  }
  // 収穫の 演出：とれた 物が とび上がる。金色は 金の 輪と きらきら、虹色は 虹の 輪と「LEGENDARY!」
  function pop(i, item, color, at = 0) {
    const p = cellPos(i), g = new THREE.Group(); g.position.copy(p); fx.add(g);
    const b = board(cropTex(item, "item", color), 0.8); b.rotation.y = face.y; g.add(b);
    const ring = new THREE.Mesh(geo("torus", () => new THREE.TorusGeometry(0.42, 0.05, 8, 32)), new THREE.MeshBasicMaterial({ color: color === "gold" ? "#FFD24A" : "#FFFFFF", transparent: true })); ring.rotation.x = -Math.PI / 2; g.add(ring);
    const sp = [];
    for (let k = 0; k < (color ? 10 : 4); k++) { const s = new THREE.Mesh(geo("oct0.06", () => new THREE.OctahedronGeometry(0.06, 0)), basic(color === "gold" ? "#FFE27A" : color === "rainbow" ? `hsl(${k * 36},90%,65%)` : "#FFFFFF")); g.add(s); sp.push([s, (k / 10) * Math.PI * 2]); }
    let tag = null;
    if (color === "rainbow") tag = label("LEGENDARY!", { bg: "rgba(20,16,34,.9)", fg: "#FFFFFF", size: 40, border: "#FF6AD5", own: true });
    else if (color === "gold") tag = label("GOLD!", { bg: "rgba(20,16,34,.85)", fg: "#FFD24A", size: 36, own: true });
    if (tag) g.add(tag);
    live.push({ g, b, ring, sp, tag, color, t0: at });
  }
  const POP_S = 2.4;   // 演出が 消えるまで（秒）。前は 消えずに 畑の 上に 残りつづけて いた
  const drop = (L) => { fx.remove(L.g); L.ring.material.dispose(); if (L.tag) L.tag.material.dispose(); };
  function tick(t) {
    sel.material.opacity = 0.7 + 0.3 * Math.sin(t * 4);
    for (let n = live.length - 1; n >= 0; n--) if (t - live[n].t0 > POP_S) { drop(live[n]); live.splice(n, 1); }
    for (const L of live) {
      const k = Math.min(1, (t - L.t0) / 1.2), up = Math.sin(k * Math.PI * 0.5);
      L.b.position.y = 0.25 + up * 0.6; L.ring.position.y = 0.3; L.ring.scale.setScalar(0.6 + up * 0.8); L.ring.material.opacity = 1 - k * 0.5;
      if (L.color === "rainbow") L.ring.material.color.setHSL((t * 0.6) % 1, 0.9, 0.65);
      L.sp.forEach(([s, a], n) => { const r = 0.3 + up * 0.55; s.position.set(Math.cos(a + t * 2) * r, 0.4 + up * 0.9 + Math.sin(t * 3 + n) * 0.08, Math.sin(a + t * 2) * r); s.rotation.y = t * 4; });
      if (L.tag) { L.tag.position.set(0, 1.6 + up * 0.1, 0); L.tag.material.opacity = Math.min(1, k * 2); }
    }
    for (const o of glows) o.material.emissiveIntensity = 1.4 + 0.25 * Math.sin(t * 1.3);
  }
  // 押した マス（raycaster を 渡す）→ i か -1
  function pick(ray) { const hit = ray.intersectObjects(cells.children, true)[0]; let o = hit && hit.object; while (o && o.userData.i === undefined) o = o.parent; return o ? o.userData.i : -1; }
  // えらんだ マスの 印（光る わく）
  const sel = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 4, 1, Math.PI / 4), new THREE.MeshBasicMaterial({ color: "#FFE066", transparent: true, depthTest: false })); sel.rotation.x = -Math.PI / 2; sel.scale.set(1.36, 1.36, 1); sel.renderOrder = 9; sel.visible = false; fx.add(sel);
  function select(i) { if (i < 0) { sel.visible = false; return; } const p = cellPos(i); sel.position.set(p.x, style === "greenhouse" ? 0.4 : 0.22, p.z); sel.visible = true; }
  return { group, env, show, pop, tick, pick, select, setFace: (y) => { face.y = y; }, busy: () => live.length > 0,   // busy：演出の 最中（毎こま 描く）
    clearFx: () => { live.forEach(drop); live.length = 0; fx.children.filter((c) => c !== sel).forEach((c) => fx.remove(c)); } };
}
