// プライベートラウンジの 高い ティアの 部屋（2026-11-27 モデリング 2 代目。modeling-log M-064）
// 鹿さんの 素材：参考の 絵 5 枚（水の 天井と プールの VIP ラウンジ・海の 見える 白い 寝室と キッチン・緑に のまれた 廃墟・新橋の 夜景の 高層の 部屋）
// 鹿さんの 言葉「部屋の高ティアのイメージはこのようなものをイメージしています。部屋の広さはそれぞれ別て高ティアな程広く豪華です。」
//   「広さの基準はランクで決めますが間取り(ロフト付き)や構造はその部屋毎に変わる」「スキンと同じ考え方というのはデザインについてです。」
//   「ロフトやテラスがついているかはその部屋毎に変わるものでランクでは決まらない。」「高ティアなのにあまりテクスチャに差がない。スキンの考え方と違う。」
// 間取り（家具を 置ける 所・ふさがる 所）は move.js の roomLayout（門番と 同じ）。ここは 見た目だけ
// 〔C〕ティアの 差の つけ方（スキンの ★の ように 上ほど 足す）：
//   ランク 3 廃墟＝質感（コンクリート・こけ・葉）＋光の すじと ほこり／4 夜景＝質感（大理石・木）＋あたたかい 光の 輪・光の つぶ
//   5 海＝質感（大理石・チーク）＋日の 光の 輪・うすい カーテン・ガラスの 玉・光の つぶ／6 VIP＝質感（大理石・モザイク・革・たて溝）＋光る 水・泡の 柱・のぼる 光の つぶ・青い 光
// 部屋を 足す：LUX に { name, pad, cx, cz, light, bg(w, h, night), build(c) } を 1 つ・move.js に ランクと 間取りを 1 つ
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { roomLayout } from "./move.js";
import { marble, wood, concrete, mossy, mosaic, tufted, fluted, rep, lightPool, leafCard, photo, whenPhoto, photoEnv, photoImg } from "./room-tex.js";

// ---------- 共有の 道具 ----------
const T = { value: 0 };   // 水・泡・光の つぶの 時間（luxTick で すすむ）
export const luxTick = (t) => { T.value = t; };
let ENV = null;
const envOf = (renderer) => (ENV ||= new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture);
const gloss = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, ...o });
// 質感つきの 材質（t：room-tex の 絵・rx／ry：貼る 回数・ns：凹凸の 強さ）
const texM = (t, rx, ry, o = {}, ns = 0.6) => { const r = rep(t, rx, ry); return new THREE.MeshPhysicalMaterial({ map: r.map, normalMap: r.normalMap, normalScale: new THREE.Vector2(ns, ns), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, ...o }); };
const texS = (t, rx, ry, o = {}, ns = 1) => { const r = rep(t, rx, ry); return new THREE.MeshStandardMaterial({ map: r.map, normalMap: r.normalMap, normalScale: new THREE.Vector2(ns, ns), roughness: 0.9, ...o }); };
// 写真の 質感の 材質：読めるまでは 描いた 質感（fb）・読めたら 写真に 入れかえる。o.rough：写真の つやの 強さ（つやの 絵に かける）
const phM = (name, rx, ry, o = {}, ns = 1, fb = null) => {
  const { rough = 1, std = false, ...rest } = o, base = fb ? rep(fb, rx, ry) : {}, M = std ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
  const m = new M({ map: base.map || null, normalMap: base.normalMap || null, normalScale: new THREE.Vector2(ns, ns), roughness: rough, metalness: 0, ...rest });
  whenPhoto(name, () => { const p = photo(name, rx, ry); m.map = p.map; m.normalMap = p.normalMap; if (p.roughnessMap) m.roughnessMap = p.roughnessMap; m.needsUpdate = true; });
  return m;
};
const glass = (color = "#D8F6FF", opacity = 0.16) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.02, metalness: 0, transparent: true, opacity, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
const chrome = () => new THREE.MeshStandardMaterial({ color: "#E8EEF6", roughness: 0.1, metalness: 1 });
const neon = (c, k = 2.2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, toneMapped: false });
const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const TAIL = "#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}";
// 光る 水（コースティクス）。sx・sy：UV 1 あたりの 模様の 数。mod で くり返さない（つなぎ目を 出さない）
function water(deep, shallow, sx = 1, sy = sx, a = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { t: T, deep: { value: new THREE.Color(deep) }, shallow: { value: new THREE.Color(shallow) }, sc: { value: new THREE.Vector2(sx, sy) }, a: { value: a } },
    transparent: a < 1, depthWrite: a >= 1, side: THREE.DoubleSide, vertexShader: VS,
    fragmentShader: `uniform float t; uniform vec3 deep; uniform vec3 shallow; uniform vec2 sc; uniform float a; varying vec2 vUv;
      #define TAU 6.28318530718
      void main(){
        float tm = t * 0.45 + 23.0; vec2 p = vUv * sc * TAU - 250.0, i = p; float c = 1.0, k = 0.005;
        for (int n = 0; n < 4; n++) { float tt = tm * (1.0 - (3.5 / float(n + 1))); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / k), p.y / (cos(i.y + tt) / k))); }
        c /= 4.0; c = 1.17 - pow(c, 1.4); float w = pow(abs(c), 8.0);
        vec3 col = mix(deep, shallow, 0.45 + 0.35 * sin(vUv.x * 3.0 + vUv.y * 2.0)) + vec3(0.75, 0.95, 1.0) * w;
        gl_FragColor = vec4(min(col, vec3(1.0)), a + w * (1.0 - a));
      ${TAIL}`,
  });
}
// 泡の 柱（下から 上へ のぼる 光の つぶ）
function bubbles(c1, c2) {
  return new THREE.ShaderMaterial({
    uniforms: { t: T, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) } }, transparent: true, depthWrite: false, vertexShader: VS,
    fragmentShader: `uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 q = vec2(vUv.x * 18.0, vUv.y * 30.0 - t * 1.6); vec2 id = floor(q), f = fract(q) - 0.5;
        float r = h(id), on = step(0.55, r), s = 0.12 + 0.18 * h(id + 7.0);
        float d = length(f + vec2(0.25 * sin(t + r * 6.0), 0.0)), b = on * smoothstep(s, s - 0.06, d) * (0.5 + 0.5 * smoothstep(s - 0.1, s, d));
        vec3 col = mix(c1, c2, vUv.y) + vec3(0.85, 0.97, 1.0) * b;
        gl_FragColor = vec4(min(col, vec3(1.0)), 0.55 + 0.4 * b);
      ${TAIL}`,
  });
}
// ただよう 光の つぶ（のぼって 消える）。box：{ x, z, w, d, y, h }（3D の 位置）
function motes(g, n, box, color, size, speed, seed = 3) {
  const R = rnd(seed), pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let k = 0; k < n; k++) { pos[k * 3] = box.x + R() * box.w; pos[k * 3 + 1] = R() * box.h; pos[k * 3 + 2] = box.z + R() * box.d; ph[k] = R(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { t: T, c: { value: new THREE.Color(color) }, sz: { value: size * Math.min(2, devicePixelRatio) }, h: { value: box.h }, sp: { value: speed }, y0: { value: box.y || 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "uniform float t, sz, h, sp, y0; attribute float ph; varying float vA; void main(){ vec3 p = position; p.y = y0 + mod(p.y + t * sp * (0.6 + ph), h); p.x += sin(t * 0.7 + ph * 6.28) * 0.18; p.z += cos(t * 0.5 + ph * 6.28) * 0.12; vA = sin(3.14159 * (p.y - y0) / h); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); gl_PointSize = sz * (0.6 + ph); }",
    fragmentShader: "uniform vec3 c; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(c, (1.0 - d * 2.0) * vA); }" });
  const p = new THREE.Points(geo, m); p.frustumCulled = false; g.add(p); return p;
}
// 床に 落ちる 光の 輪（足し算）
function pool(g, x, z, r, color, k = 0.6, y = 0.012) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: lightPool(), color, transparent: true, opacity: k, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; }
// 角の まるい 四角（平らな 形。x・z の 面に ねかせて 使う）
function rrect(x, y, w, h, r) {
  const s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
const flat = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.rotation.x = Math.PI / 2; o.position.y = y; o.receiveShadow = true; return o; };   // 形の y を 3D の z に（押し出しは 下へ）
const rbox = (g, w, h, d, m, x, y, z, r = 0.12) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), m); b.position.set(x, y + h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
// マス → 3D（部屋の 床の 左奥が (0, 0)）
const W = (N, x, z) => [x - N / 2, z - N / 2];
const blocksOf = (L, k) => L.blocks.filter((b) => b.k === k);
// やしの 木（鉢つき）
function palm(K, g, x, z, s = 1, pot = chrome()) {
  const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
  K.cyl(p, 0.34, 0.28, 0.62, pot, 0, 0, 0, 24);
  const bark = K.mat("#7A5E3E", { flatShading: false }); for (let k = 0; k < 6; k++) K.cyl(p, 0.075 - k * 0.006, 0.085 - k * 0.006, 0.36, bark, 0.025 * k, 0.6 + k * 0.34, 0, 8);
  const leaf = new THREE.MeshStandardMaterial({ map: leafCard(), color: "#7FE0A0", alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.55 });
  for (let k = 0; k < 10; k++) { const f = new THREE.Group(); f.position.set(0.15, 2.6, 0); f.rotation.y = (k / 10) * Math.PI * 2; p.add(f);
    const h = new THREE.Group(); h.rotation.z = -0.45 - (k % 3) * 0.14; f.add(h); const l = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), leaf); l.rotation.x = -Math.PI / 2; l.position.set(0.72, 0, 0); h.add(l); }
}
// 葉の しげみ（すかしの 葉の 板を 重ねる）
function bush(K, g, x, z, s = 1, tint = "#8FD0A0", y = 0) {
  const m = new THREE.MeshStandardMaterial({ map: leafCard(), color: tint, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.7 }), b = new THREE.Group(); b.position.set(x, y, z); g.add(b);
  for (let k = 0; k < 7; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * s, 1.1 * s), m); p.position.y = 0.5 * s + (k % 2) * 0.1 * s; p.rotation.y = (k / 7) * Math.PI; p.rotation.x = (k % 3 - 1) * 0.25; p.castShadow = true; b.add(p); }
  K.cyl(b, 0.12 * s, 0.16 * s, 0.1, K.mat("#3E2E22"), 0, 0, 0, 8);
}
// 背景の 絵（画面の 大きさに 合わせる）
function canvasBg(w, h, draw) {
  const Wd = Math.max(64, Math.round(Math.min(2048, w))), Hh = Math.max(64, Math.round(Math.min(2048, h))), c = document.createElement("canvas"); c.width = Wd; c.height = Hh;
  const x = c.getContext("2d"); draw(x, Wd, Hh); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const grad = (x, Wd, H, stops) => { const g = x.createLinearGradient(0, 0, 0, H); for (const [p, c] of stops) g.addColorStop(p, c); x.fillStyle = g; x.fillRect(0, 0, Wd, H); };
// 床（N×N。家具を 置く 所）：質感 1 枚を くり返す
function floorTex(K, g, N, m) { const f = K.box(g, N, 0.2, N, m, 0, -0.2, 0); f.castShadow = false; return f; }
// 床の 外の 置ける 所（高さ 0 の 所）
function areaBox(K, g, N, a, mat, th = 0.2) { const [x, z] = W(N, a.x, a.z); const b = K.box(g, a.w, th, a.d, mat, x + a.w / 2, a.y - th, z + a.d / 2); b.castShadow = false; return b; }
// ガラスの かべ（奥と 左。細い わく）
function glassWalls(K, g, N, frame, h = 4.4, step = 2) {
  const H = -N / 2, gm = glass();
  K.box(g, N + 0.2, 0.22, 0.2, frame, -0.1, -0.2, H - 0.1); K.box(g, 0.2, 0.22, N, frame, H - 0.1, -0.2, 0);
  K.box(g, N + 0.2, 0.16, 0.2, frame, -0.1, h - 0.16, H - 0.1); K.box(g, 0.2, 0.16, N, frame, H - 0.1, h - 0.16, 0);
  K.box(g, N, h - 0.2, 0.04, gm, 0, 0.02, H - 0.1); K.box(g, 0.04, h - 0.2, N, gm, H - 0.1, 0.02, 0);
  for (let k = 0; k <= N; k += step) { K.box(g, 0.08, h, 0.12, frame, k + H, -0.2, H - 0.1); K.box(g, 0.12, h, 0.08, frame, H - 0.1, -0.2, k + H); }
}

// 背景の 写真が 読めたら 部屋の 画面に 描き直して もらう
let BG_CB = null;
export const luxOnBg = (f) => { BG_CB = f; };
// 写真の 帯を 地平線（H×hz）に 置く：上は 空の 色に なじませ、下は 水（映りこみ）
function photoHorizon(x, Wd, H, img, hz, { sky, water = ["#1A2A4A", "#060A18"], mirror = 0.3, minH = 0.3 } = {}) {
  const s = Math.max(Wd / img.width, (H * minH) / img.height), iw = img.width * s, ih = img.height * s, y = H * hz - ih, ox = (Wd - iw) / 2;
  if (sky) { const t = document.createElement("canvas"); t.width = 8; t.height = 1; const tc = t.getContext("2d"); tc.drawImage(img, 0, 0, img.width, 3, 0, 0, 8, 1); const d = tc.getImageData(0, 0, 8, 1).data; let r = 0, gg = 0, b = 0; for (let k = 0; k < 8; k++) { r += d[k * 4]; gg += d[k * 4 + 1]; b += d[k * 4 + 2]; } sky = [sky[0], `rgb(${r / 8 | 0},${gg / 8 | 0},${b / 8 | 0})`]; }   // 写真の 上の はしの 色に なじませる
  if (sky) { const g = x.createLinearGradient(0, 0, 0, Math.max(1, y + ih * 0.3)); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); x.fillStyle = g; x.fillRect(0, 0, Wd, Math.max(0, y + 2)); }
  x.drawImage(img, ox, y, iw, ih);
  if (sky && y > 0) { const g = x.createLinearGradient(0, y, 0, y + ih * 0.3); g.addColorStop(0, sky[1]); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, y - 1, Wd, ih * 0.3 + 1); }
  const wg = x.createLinearGradient(0, H * hz, 0, H); wg.addColorStop(0, water[0]); wg.addColorStop(1, water[1]); x.fillStyle = wg; x.fillRect(0, H * hz, Wd, H - H * hz);
  if (mirror > 0) { x.save(); x.globalAlpha = mirror; x.translate(0, H * hz * 2); x.scale(1, -1); x.drawImage(img, ox, y, iw, ih); x.restore();   // 水への 映りこみ
    const fg = x.createLinearGradient(0, H * hz, 0, H * hz + ih); fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, water[1]); x.fillStyle = fg; x.fillRect(0, H * hz, Wd, ih + 1); }
}

// ---------- 部屋 ----------
export const LUX = {
  // ランク 6（〔C〕）VIP ラウンジ（参考の 絵 1）：大理石の 床・たて溝の かべと 水の 帯・泡の 柱・前の デッキに モザイクの プール・革の まるい ソファ・右に 通路
  vip: {
    door: (N) => [N / 2 + 2.62, -N / 2 + 0.04],   // 庭への扉：右の 通路の 外
    name: "VIP ラウンジ", pad: 3.0, cx: 1.4, cz: 1.6, light: { hemi: 0.4, sun: 0.85, env: 0.9, exp: 1.2 },
    bg: (w, h, night) => canvasBg(w, h, (x, Wd, H) => { grad(x, Wd, H, night ? [[0, "#020A26"], [0.6, "#06205A"], [1, "#0A3A88"]] : [[0, "#0A2E6E"], [0.55, "#1554B0"], [1, "#2E86E0"]]);
      const ph = photoImg("room-vip-bg.webp", () => BG_CB && BG_CB());   // 写真の 屋内プール（Poly Haven「indoor_pool」CC0）を 青く ぼかして
      if (ph) { const s = Math.max(Wd / ph.width, H / ph.height); x.globalAlpha = night ? 0.45 : 0.7; x.drawImage(ph, (Wd - ph.width * s) / 2, (H - ph.height * s) / 2, ph.width * s, ph.height * s); x.globalAlpha = 1; x.fillStyle = night ? "rgba(2,10,38,0.5)" : "rgba(10,46,110,0.25)"; x.fillRect(0, 0, Wd, H); }
      const r = x.createRadialGradient(Wd * 0.5, H * 0.55, 10, Wd * 0.5, H * 0.55, Math.max(Wd, H) * 0.6); r.addColorStop(0, "rgba(120,220,255,0.35)"); r.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = r; x.fillRect(0, 0, Wd, H); }),
    build({ g, K, N, night }) {
      const H = -N / 2, E = N / 2, L = roomLayout("vip", N), cr = chrome(), tint = night ? "#6C86C8" : "#FFFFFF";
      const mb = marble("vip", "#E4EEFC", "#2F5FA8", { k: 2, grout: "#7FA2D8", seed: 4, veinK: 0.75 });
      floorTex(K, g, N, phM("vipfloor", N / 2, N / 2, { color: night ? "#7488C4" : "#E6EEFF", rough: 0.55, clearcoat: 1, clearcoatRoughness: 0.04 }, 0.6, mb));
      // かべ（たて溝）と 上の 水の 帯
      const WH = 5.2, fl = fluted("vip", "#EEF4FF", { n: 14 }), wallB = phM("vipwall", N / 2, 2.6, { color: night ? "#8EA6E0" : "#E4EEFF", emissive: "#2E6CD0", emissiveIntensity: night ? 0.2 : 0.08, rough: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.08 }, 0.8, fl);
      K.box(g, N + 0.4, WH, 0.4, wallB, -0.2, -0.2, H - 0.2); K.box(g, 0.4, WH, N, wallB, H - 0.2, -0.2, 0);
      const wb = water(night ? "#06307A" : "#0A5CC0", night ? "#1488E0" : "#36B4FF", (N - 0.6) / 3.2, 1.1 / 3.2);
      const bandB = new THREE.Mesh(new THREE.PlaneGeometry(N - 0.6, 1.1), wb); bandB.position.set(0, 4.15, H + 0.01); g.add(bandB);
      const bandL = new THREE.Mesh(new THREE.PlaneGeometry(N - 0.6, 1.1), wb); bandL.position.set(H + 0.01, 4.15, 0); bandL.rotation.y = Math.PI / 2; g.add(bandL);
      for (const y of [3.55, 4.72]) { K.box(g, N - 0.4, 0.08, 0.1, cr, 0, y, H + 0.03); K.box(g, 0.1, 0.08, N - 0.4, cr, H + 0.03, y, 0); }
      const nb = neon("#3FD2FF"); K.box(g, N, 0.05, 0.06, nb, 0, 0.0, H + 0.03); K.box(g, 0.06, 0.05, N, nb, H + 0.03, 0.0, 0);
      // 前の デッキ（プールの 穴）と 右の 通路（どちらも 家具を 置ける：move.js）
      const [deck, walk] = L.areas, pb = blocksOf(L, "pool")[0], [px, pz] = W(N, pb.x, pb.z), [dx, dz] = W(N, deck.x, deck.z);
      const dm = phM("vipfloor", 0.5, 0.5, { color: night ? "#6A84C4" : "#D8E4FA", rough: 0.55, clearcoat: 1, clearcoatRoughness: 0.05 }, 0.6, mb);
      const ds = rrect(dx, dz, deck.w, deck.d, 0.9), hole = rrect(px, pz, pb.w, pb.d, 1.0); ds.holes.push(hole);
      g.add(flat(new THREE.ExtrudeGeometry(ds, { depth: 0.2, bevelEnabled: false, curveSegments: 16 }), dm, 0));
      areaBox(K, g, N, walk, phM("vipfloor", walk.w / 2, walk.d / 2, { color: night ? "#6A84C4" : "#D8E4FA", rough: 0.55, clearcoat: 1, clearcoatRoughness: 0.05 }, 0.6, mb));
      const ms = mosaic("vip", "#1E7FD8", "#5CC8FF", { n: 20 }), basin = phM("pool", 0.66, 0.66, { rough: 0.4, side: THREE.BackSide, std: true }, 1, ms);
      g.add(flat(new THREE.ExtrudeGeometry(hole, { depth: 0.8, bevelEnabled: false, curveSegments: 16 }), basin, 0.0));   // うらがわだけ 描く（穴の 中の かべと 底）
      const wt = new THREE.Mesh(new THREE.ShapeGeometry(hole, 16), water(night ? "#04307E" : "#0A7AD8", night ? "#1BA0F0" : "#5CD8FF", 0.32, 0.32, 0.62)); wt.rotation.x = Math.PI / 2; wt.position.y = -0.3; g.add(wt);
      const lip = rrect(px - 0.07, pz - 0.07, pb.w + 0.14, pb.d + 0.14, 1.07); lip.holes.push(rrect(px, pz, pb.w, pb.d, 1.0));
      g.add(flat(new THREE.ExtrudeGeometry(lip, { depth: 0.03, bevelEnabled: false, curveSegments: 16 }), neon("#5FE6FF", 2.6), 0.03));
      for (let k = 0; k < 3; k++) { const p = new THREE.PointLight("#3FC8FF", night ? 5 : 2.4, 6); p.position.set(px + pb.w * (0.2 + k * 0.3), -0.1, pz + pb.d / 2); g.add(p); }   // 水の 中の 灯り
      motes(g, 45, { x: px, z: pz, w: pb.w, d: pb.d, h: 4.2 }, night ? "#9FE8FF" : "#BFF2FF", 3.5, 0.35, 5);   // のぼる 光の つぶ
      // 革の まるい ソファ（作りつけ）と ガラスの 机
      const sb = blocksOf(L, "sofa")[0], [sx0, sz0] = W(N, sb.x, sb.z), sx = sx0 + sb.w / 2, sz = sz0 + sb.d / 2;
      const lt = tufted("vip", night ? "#C8D6F4" : "#F2F6FF", { n: 7 }), sm = phM("leather", 0.8, 0.8, { color: night ? "#C8D4F0" : "#FFFFFF", rough: 0.9, clearcoat: 0.35, clearcoatRoughness: 0.3 }, 1.0, lt);
      const arc = (r0, r1, a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); return s; };
      const so = new THREE.Group(); so.position.set(sx, 0, sz); g.add(so); const a0 = Math.PI * 0.15, a1 = Math.PI * 1.35;
      so.add(flat(new THREE.ExtrudeGeometry(arc(1.1, 1.85, a0, a1), { depth: 0.38, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 40 }), sm, 0.46));
      so.add(flat(new THREE.ExtrudeGeometry(arc(1.75, 2.0, a0, a1), { depth: 0.85, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3, curveSegments: 40 }), sm, 0.95));
      so.add(flat(new THREE.ExtrudeGeometry(arc(1.78, 1.86, a0, a1), { depth: 0.04, bevelEnabled: false, curveSegments: 40 }), neon("#3FD2FF", 2.0), 0.04));
      so.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      K.cyl(so, 0.6, 0.6, 0.05, glass("#BFF0FF", 0.5), 0, 0.48, 0, 32); K.cyl(so, 0.08, 0.12, 0.48, cr, 0, 0, 0, 12);
      // 泡の 柱（奥の 角＋間取りの 柱 2 つ）
      const bm = bubbles(night ? "#0B4FB8" : "#1C8CF0", night ? "#5FE0FF" : "#9CF0FF");
      for (const [x, z] of [[H + 0.05, H + 0.05], ...blocksOf(L, "pillar").map((b) => { const [x, z] = W(N, b.x, b.z); return [x + 0.5, z + 0.5]; })]) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 5.0, 28, 1, true), bm); c.position.set(x, 2.5, z); g.add(c);
        K.cyl(g, 0.52, 0.52, 0.22, cr, x, -0.2, z, 28); K.cyl(g, 0.52, 0.52, 0.18, cr, x, 4.95, z, 28); pool(g, x, z, 1.4, "#3FC8FF", 0.5);
      }
      for (const b of blocksOf(L, "palm")) { const [x, z] = W(N, b.x, b.z); palm(K, g, x + 0.5, z + 0.5, 0.95, cr); }
      for (const [x, z] of [[H + 1.2, H + 1.2], [E + 0.8, H + 0.6]]) { const p = new THREE.PointLight("#3FC8FF", night ? 6 : 3, 7); p.position.set(x, 1.2, z); g.add(p); }   // 青い 光（昼も）
    },
  },
  // ランク 5（〔C〕）海の 見える 部屋（参考の 絵 2・3）：白い 大理石の 床・ガラスの かべ（向こうに 海と 空）・うすい カーテン・ガラスの 玉の 灯り・前に チークの テラス
  ocean: {
    name: "海の 見える 部屋", pad: 2.0, cx: 0, cz: 1.4, light: { hemi: 0.5, sun: 0.85, env: 0.85, exp: 1.0 },
    bg: (w, h, night) => canvasBg(w, h, (x, Wd, H) => { const hz = H * 0.56, R = rnd(7);
      const sky = !night && photoImg("room-ocean-sky.webp", () => BG_CB && BG_CB());   // 写真の 空と 水平線（Poly Haven「umhlanga_sunrise」CC0）。夜は 描いた 月夜
      if (sky) { photoHorizon(x, Wd, H, sky, 0.58, { water: ["#3E86B8", "#0B4A80"], mirror: 0.18, minH: 0.58 });
        x.fillStyle = "rgba(255,255,255,0.45)"; for (let k = 0; k < 160; k++) { const y = H * 0.58 + (H * 0.42) * Math.pow(R(), 1.5), ww = Wd * (0.008 + R() * 0.03) * (1 + (y - H * 0.58) / H); x.fillRect(R() * Wd, y, ww, Math.max(1, H * 0.0018)); }
        return; }
      grad(x, Wd, hz, night ? [[0, "#0B1440"], [1, "#3A4C8E"]] : [[0, "#3FA6EC"], [0.7, "#9ED8FA"], [1, "#DDF3FF"]]);
      x.fillStyle = night ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)";
      for (let k = 0; k < 9; k++) { const cx = R() * Wd, cy = hz * (0.25 + R() * 0.6), s = Wd * (0.04 + R() * 0.05); for (let j = 0; j < 5; j++) { x.beginPath(); x.ellipse(cx + (j - 2) * s * 0.7, cy + Math.sin(j) * s * 0.15, s * (0.7 + R() * 0.4), s * 0.42, 0, 0, Math.PI * 2); x.fill(); } }
      const sg = x.createLinearGradient(0, hz, 0, H); sg.addColorStop(0, night ? "#1A2A66" : "#2EA6E0"); sg.addColorStop(1, night ? "#060C2E" : "#0B6CB8"); x.fillStyle = sg; x.fillRect(0, hz, Wd, H - hz);
      x.fillStyle = night ? "rgba(255,240,200,0.5)" : "rgba(255,255,255,0.55)"; for (let k = 0; k < 140; k++) { const y = hz + (H - hz) * Math.pow(R(), 1.6), ww = Wd * (0.01 + R() * 0.04) * (1 + (y - hz) / H); x.fillRect(R() * Wd, y, ww, Math.max(1, H * 0.002)); }
      if (night) { x.fillStyle = "#FFF6D8"; x.beginPath(); x.arc(Wd * 0.72, hz * 0.35, Wd * 0.025, 0, Math.PI * 2); x.fill(); } }),
    build({ g, K, N, night }) {
      const H = -N / 2, E = N / 2, L = roomLayout("ocean", N), cr = chrome(), wm = gloss(night ? "#C8D4F0" : "#FFFFFF", { roughness: 0.2 });
      const mb = marble("ocean", "#FBF8F2", "#B8A68C", { k: 1, grout: "#D8CDBE", warm: "#EEDFC4", seed: 8, veinK: 0.55 });
      floorTex(K, g, N, phM("oceanfloor", N / 3, N / 3, { color: night ? "#9CA8C8" : "#FFFFFF", rough: 0.7, clearcoat: 0.9, clearcoatRoughness: 0.06 }, 0.7, mb));
      glassWalls(K, g, N, wm, 4.4, 2);
      K.box(g, N, 0.05, 0.05, neon("#7FF0E8", 1.2), 0, 0.03, H + 0.04); K.box(g, 0.05, 0.05, N, neon("#7FF0E8", 1.2), H + 0.04, 0.03, 0);
      // うすい カーテン（かべの はし）
      const cm = new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.55, roughness: 0.9, side: THREE.DoubleSide, emissive: night ? "#33406A" : "#FFFFFF", emissiveIntensity: night ? 0.3 : 0.15, depthWrite: false });
      const drape = (x, z, ry) => { const geo = new THREE.PlaneGeometry(0.9, 4.0, 24, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.06); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, cm); m.position.set(x, 2.15, z); m.rotation.y = ry; g.add(m); };
      drape(H + 0.65, H + 0.12, 0); drape(E - 0.55, H + 0.12, 0); drape(H + 0.12, E - 0.55, Math.PI / 2);
      // ガラスの 玉の 灯り（つり下げ）
      const om = new THREE.MeshPhysicalMaterial({ color: "#5FD8FF", roughness: 0, metalness: 0, transparent: true, opacity: 0.6, envMapIntensity: 2.2, clearcoat: 1 }), core = neon(night ? "#FFF2C8" : "#E8FFFF", night ? 2.4 : 0.8);
      for (const [x, z, y] of [[H + 2.4, H + 1.8, 3.0], [H + 5.2, H + 1.4, 3.5], [H + 1.4, H + 5.0, 3.3], [H + 1.6, E + 1.6, 2.4]]) {
        const o = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20), om); o.position.set(x, y, z); g.add(o); const c = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), core); c.position.copy(o.position); g.add(c);
        K.cyl(g, 0.012, 0.012, 5.6 - y, cr, x, y + 0.6, z, 4); if (night) { const p = new THREE.PointLight("#FFE8C0", 2.2, 5); p.position.set(x, y - 0.2, z); g.add(p); } }
      // 日の 光（窓ぎわの 光の 輪）・光の つぶ
      for (let k = 0; k < 4; k++) pool(g, H + 2 + k * (N - 3) / 3, H + 1.8, 2.0, night ? "#8EA8FF" : "#FFE6B0", night ? 0.22 : 0.18);
      motes(g, 40, { x: H + 0.5, z: H + 0.5, w: N - 1, d: 3, h: 3.6 }, "#FFFFFF", 4, 0.12, 9);
      // テラス（チークの 床・ガラスの 手すり。家具を 置ける）
      const te = L.areas[0], tw = wood("teak", "#7E5434", "#B8865C", { rows: 8 });
      areaBox(K, g, N, te, phM("teak", te.w / 2, te.d / 2, { color: night ? "#8C8CB0" : "#FFFFFF", rough: 0.9, clearcoat: 0.4, clearcoatRoughness: 0.2 }, 1, tw));
      const [tx, tz] = W(N, te.x, te.z), rg = glass("#E0FBFF", 0.22);
      K.box(g, te.w, 1.0, 0.05, rg, tx + te.w / 2, 0.0, tz + te.d + 0.02); K.box(g, 0.05, 1.0, te.d, rg, tx + te.w - 0.02, 0.0, tz + te.d / 2);
      K.box(g, te.w, 0.05, 0.08, cr, tx + te.w / 2, 1.0, tz + te.d + 0.02); K.box(g, 0.08, 0.05, te.d, cr, tx + te.w - 0.02, 1.0, tz + te.d / 2);
      const chair = gloss(night ? "#9BE6D6" : "#B8F2E0", { roughness: 0.2 });
      for (const b of blocksOf(L, "lounger")) { const [x, z] = W(N, b.x, b.z), c = new THREE.Group(); c.position.set(x + 0.5, 0, z + 1); g.add(c); rbox(c, 0.7, 0.18, 1.6, chair, 0, 0.18, 0, 0.08); const bk = rbox(c, 0.7, 0.16, 0.8, chair, 0, 0.42, -0.62, 0.07); bk.rotation.x = 0.7; K.cyl(c, 0.04, 0.04, 0.18, cr, 0, 0, 0.6, 6); K.cyl(c, 0.04, 0.04, 0.18, cr, 0, 0, -0.6, 6); }
      for (const b of blocksOf(L, "table")) { const [x, z] = W(N, b.x, b.z); K.cyl(g, 0.32, 0.32, 0.04, glass("#C8F6FF", 0.5), x + 0.5, 0.42, z + 0.5, 24); K.cyl(g, 0.04, 0.04, 0.42, cr, x + 0.5, 0, z + 0.5, 8); }
      for (const b of blocksOf(L, "palm")) { const [x, z] = W(N, b.x, b.z); palm(K, g, x + 0.5, z + 0.5, 0.85, gloss("#FFFFFF")); }
      const vm = new THREE.MeshStandardMaterial({ map: leafCard(), alphaTest: 0.35, side: THREE.DoubleSide });
      for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), vm); l.position.set(H - 0.02, 3.9 - (k % 3) * 0.3, H + 0.8 + k * 0.55); l.rotation.y = Math.PI / 2; g.add(l); }   // かべぎわの つる草
    },
  },
  // ランク 4（〔C〕）夜景の 高層の 部屋（参考の 絵 5「Shimbashi」）：大理石の 床・ガラスの かべ（向こうに 夜の 街）・タイルの 柱・右に 木の 床の ロフト
  night: {
    door: (N) => [N / 2 + 4.62, -N / 2 + Math.min(N, 8) + 1.5],   // 庭への扉：ロフトの 下を さけて 階段の 横の 床の 外
    name: "夜景の 高層の 部屋", pad: 2.8, cx: 1.6, cz: 0.4, light: { hemi: 0.32, sun: 0.6, env: 0.65, exp: 1.0 },
    bg: (w, h, night) => canvasBg(w, h, (x, Wd, H) => { const R = rnd(11);
      grad(x, Wd, H, night ? [[0, "#0A0B2A"], [0.5, "#2A2370"], [0.75, "#5B4BA8"], [1, "#2A2260"]] : [[0, "#2B2F7A"], [0.45, "#6A5BC0"], [0.7, "#C79AD8"], [1, "#4A3E8E"]]);
      const city = photoImg("room-night-city.webp", () => BG_CB && BG_CB());   // 写真の 夜の 街（Poly Haven「shanghai_bund」CC0）
      if (city) { photoHorizon(x, Wd, H, city, 0.68, { sky: night ? ["#0A0B2A", "#3A3478"] : ["#2B2F7A", "#5C5498"], water: ["#1C1A44", "#07061A"], mirror: 0.35, minH: 0.34 }); if (!night) { x.fillStyle = "rgba(140,120,220,0.14)"; x.fillRect(0, 0, Wd, H); } return; }
      for (const [base, hmax, dark, lit] of [[0.62, 0.22, "#2C2B66", 0.25], [0.72, 0.3, "#1F1D50", 0.35], [0.84, 0.36, "#14123A", 0.45]]) {
        let px = -Wd * 0.02; while (px < Wd) { const bw = Wd * (0.025 + R() * 0.05), bh = H * hmax * (0.35 + R() * 0.65), top = H * base - bh + H * 0.12; x.fillStyle = dark; x.fillRect(px, top, bw, H - top);
          const cw = Math.max(2, bw / 7), ch = Math.max(2, H * 0.008); for (let yy = top + ch; yy < H; yy += ch * 2.2) for (let xx = px + cw * 0.6; xx < px + bw - cw; xx += cw * 1.6) if (R() < lit) { x.fillStyle = R() < 0.7 ? "rgba(255,226,160,0.9)" : "rgba(190,220,255,0.85)"; x.fillRect(xx, yy, cw, ch); }
          if (R() < 0.25) { x.fillStyle = "#FF4A4A"; x.fillRect(px + bw / 2 - 2, top - 4, 4, 4); } px += bw + Wd * 0.004; } } }),
    build({ g, K, N, night }) {
      const H = -N / 2, E = N / 2, L = roomLayout("night", N), fm = new THREE.MeshStandardMaterial({ color: night ? "#2A2846" : "#3A3856", roughness: 0.4, metalness: 0.6 });
      const mb = marble("night", "#EEE8F4", "#7E6E9C", { k: 2, grout: "#B8ACCB", seed: 12, veinK: 0.6 }), wd = wood("oak", "#6E4A32", "#A87C58", { rows: 8, seed: 7 });
      floorTex(K, g, N, phM("nightfloor", N / 2, N / 2, { color: night ? "#B8B0D0" : "#FFFFFF", rough: 0.45, clearcoat: 1, clearcoatRoughness: 0.03 }, 0.6, mb));
      glassWalls(K, g, N, fm, 4.6, 3);
      // タイルの 柱（奥の 角）と 下からの あたたかい 光
      const tc = document.createElement("canvas"); tc.width = tc.height = 128; const tx = tc.getContext("2d"); tx.fillStyle = "#F4E6E4"; tx.fillRect(0, 0, 128, 128); tx.strokeStyle = "#D6C2C4"; tx.lineWidth = 3; for (let k = 0; k <= 128; k += 16) { tx.beginPath(); tx.moveTo(k, 0); tx.lineTo(k, 128); tx.moveTo(0, k); tx.lineTo(128, k); tx.stroke(); }
      const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(1.2, 4.8);
      K.box(g, 1.2, 4.8, 1.2, new THREE.MeshPhysicalMaterial({ map: tt, roughness: 0.2, clearcoat: 0.8, emissive: "#FF9A6A", emissiveIntensity: night ? 0.18 : 0.05 }), H + 0.4, -0.2, H + 0.4);
      const wl = new THREE.PointLight("#FFB07A", night ? 9 : 3, 6); wl.position.set(H + 1.3, 1.0, H + 1.3); g.add(wl);
      // ロフト（右。床より 2.4 高い 木の 床・ガラスの 手すり・階段。家具を 置ける：move.js）
      const lo = L.areas[0], gr = L.areas[1], LD = lo.d, ly = lo.y, [lx0, lz0] = W(N, lo.x, lo.z), lx = lx0 + lo.w / 2, lz = lz0 + LD / 2;
      K.box(g, lo.w, 0.2, LD + gr.d, phM("nightfloor", lo.w / 2, (LD + gr.d) / 2, { color: night ? "#B8B0D0" : "#FFFFFF", rough: 0.45, clearcoat: 1, clearcoatRoughness: 0.03 }, 0.6, mb), lx, -0.2, lz0 + (LD + gr.d) / 2);   // ロフトの 下と 階段の 横の 床
      K.box(g, lo.w, 0.26, LD, phM("parquet", lo.w / 2, LD / 2, { color: night ? "#B0A4C8" : "#FFFFFF", rough: 0.8, clearcoat: 0.7, clearcoatRoughness: 0.1 }, 1, wd), lx, ly - 0.26, lz);
      K.box(g, lo.w - 0.4, 0.04, 0.06, neon("#FFC890", 1.8), lx, ly - 0.3, lz0 + LD - 0.1);
      for (const [x, z] of [[lx0 + lo.w - 0.1, lz0 + LD - 0.1], [lx0 + lo.w - 0.1, lz0 + 0.3], [lx0 + 1.05, lz0 + LD - 0.1]]) K.box(g, 0.14, ly - 0.26, 0.14, fm, x, 0, z);
      const rg = glass("#E8E0FF", 0.2); K.box(g, lo.w - 1.0, 0.9, 0.04, rg, lx + 0.5, ly, lz0 + LD); K.box(g, 0.04, 0.9, LD, rg, lx0 + 0.02, ly, lz);
      K.box(g, lo.w - 1.0, 0.04, 0.06, fm, lx + 0.5, ly + 0.9, lz0 + LD); K.box(g, 0.06, 0.04, LD, fm, lx0 + 0.02, ly + 0.9, lz);
      const stepM = phM("parquet", 0.5, 0.17, { rough: 0.8, clearcoat: 0.7, clearcoatRoughness: 0.1 }, 1, wd);
      for (let k = 0; k < 8; k++) K.box(g, 0.96, 0.12, 0.34, stepM, lx0 + 0.5, (k + 1) * (ly / 8) - 0.12, lz0 + LD + 0.17 + (7 - k) * 0.34);   // 階段（ロフトの 前の はしから 手前へ 下りる）
      K.box(g, lo.w, 2.2, 0.08, gloss(night ? "#3A3460" : "#D9D0E4"), lx, ly, lz0 - 0.1);   // ロフトの 奥の 低い かべ
      for (const b of blocksOf(L, "plant")) { const [x, z] = W(N, b.x, b.z); bush(K, g, x + 0.5, z + 0.5, 0.9, "#6FAE80", ly); }
      pool(g, lx, lz, 2.4, "#FFB070", night ? 0.5 : 0.18, 0.012);   // ロフトの 下の 光
      // あたたかい 光の 輪（下向きの 灯り）・大きな 葉の 植物と 光の つぶ
      for (const [x, z] of [[H + 3, H + 3], [E - 3, H + 3], [H + 3, E - 3], [E - 3, E - 3], [0, 0]]) pool(g, x, z, 1.8, "#FFC27A", night ? 0.5 : 0.14);
      const fl = neon("#D8FF9A", 2.0); for (const [x, z, s] of [[H + 0.6, E - 0.6, 1.4], [E - 0.6, E - 0.5, 1.1]]) { bush(K, g, x, z, s, "#5E9E70"); for (let k = 0; k < 12; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), fl); d.position.set(x + Math.cos(k * 1.7) * 0.45 * s, 0.3 + (k % 6) * 0.2 * s, z + Math.sin(k * 1.7) * 0.45 * s); g.add(d); } }
      motes(g, 30, { x: H + 1, z: H + 1, w: N - 2, d: N - 2, h: 3.4 }, "#FFE2B0", 3.5, 0.08, 13);
      const pv = new THREE.PointLight("#B79CFF", night ? 4 : 2.5, 10); pv.position.set(0, 3, 0); g.add(pv); const pw = new THREE.PointLight("#FFC890", night ? 4 : 2, 6); pw.position.set(lx, ly - 0.4, lz); g.add(pw);
    },
  },
  // ランク 3（〔C〕）緑の 廃墟（参考の 絵 4「Overgrown」）：こけの コンクリートの 床と 水たまり・型枠の コンクリートの かべと 垂れる つる・上を とおる 橋・奥の 輪・手前と 右の 草地
  ruin: {
    door: (N) => [N / 2 + 3.62, -N / 2 + 2.6],   // 庭への扉：右の 草地の 外（橋の 足を さけて）
    name: "緑の 廃墟", pad: 2.4, cx: 0.8, cz: 1.0, light: { hemi: 0.75, sun: 0.9, env: 0.5, exp: 1.0 },
    bg: (w, h, night) => canvasBg(w, h, (x, Wd, H) => { grad(x, Wd, H, night ? [[0, "#0C1418"], [0.6, "#1A2A26"], [1, "#22362E"]] : [[0, "#C9D8C4"], [0.5, "#9FB89A"], [1, "#6E8A6A"]]);
      const gh = photoImg("room-ruin-bg.webp", () => BG_CB && BG_CB());   // 写真の 打ち捨てられた 温室（Poly Haven「abandoned_greenhouse」CC0）を うすく
      if (gh) { const s = Math.max(Wd / gh.width, H / gh.height); x.globalAlpha = night ? 0.35 : 0.6; x.drawImage(gh, (Wd - gh.width * s) / 2, (H - gh.height * s) / 2, gh.width * s, gh.height * s); x.globalAlpha = 1; x.fillStyle = night ? "rgba(10,20,22,0.55)" : "rgba(200,214,196,0.35)"; x.fillRect(0, 0, Wd, H); }
      const r = x.createRadialGradient(Wd * 0.2, H * 0.1, 10, Wd * 0.2, H * 0.1, Wd * 0.7); r.addColorStop(0, night ? "rgba(120,160,200,0.25)" : "rgba(255,250,220,0.75)"); r.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = r; x.fillRect(0, 0, Wd, H); }),
    build({ g, K, N, night }) {
      const H = -N / 2, E = N / 2, L = roomLayout("ruin", N), R = rnd(5), tint = night ? "#A8B4C8" : "#FFFFFF";
      const fl = mossy("ruinfloor", "#9A9F96", "#5E8E46", { seed: 21 }), gd = mossy("ruinground", "#6E7456", "#4E8236", { seed: 22 }), wc = concrete("ruinwall", "#868C84", { walls: true, k: 2 }), bc = concrete("ruinbeam", "#80867E", { seed: 4 });
      floorTex(K, g, N, phM("ruinfloor", N / 3, N / 3, { color: tint, std: true }, 1.2, fl));
      const pm = new THREE.MeshPhysicalMaterial({ color: night ? "#1C2A30" : "#5E6E70", roughness: 0.02, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.4 });
      for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.6 + R() * 0.8, 24), pm); p.rotation.x = -Math.PI / 2; p.scale.set(1, 0.6 + R() * 0.5, 1); p.position.set(H + 1 + R() * (N - 2), 0.012, H + 1 + R() * (N - 2)); g.add(p); }   // 水たまり
      // 型枠の コンクリートの かべ・垂れる つる（葉の 板）
      const WH = 6.0, wm = phM("ruinwall", N / 3, 2, { color: tint, std: true }, 1.4, wc);
      K.box(g, N + 0.5, WH, 0.5, wm, -0.25, -0.2, H - 0.25); K.box(g, 0.5, WH, N, wm, H - 0.25, -0.2, 0);
      const vm = new THREE.MeshStandardMaterial({ map: leafCard(), color: night ? "#6E9E78" : "#B8E0A0", alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8 });
      for (let k = 0; k < N * 1.6; k++) { const len = 1.0 + R() * 3.0, x = H + 0.3 + R() * (N - 0.6), v = new THREE.Mesh(new THREE.PlaneGeometry(0.55 + R() * 0.4, len), vm); v.position.set(x, WH - 0.2 - len / 2, H + 0.03 + R() * 0.03); g.add(v); }
      for (let k = 0; k < N * 1.6; k++) { const len = 1.0 + R() * 3.0, z = H + 0.3 + R() * (N - 0.6), v = new THREE.Mesh(new THREE.PlaneGeometry(0.55 + R() * 0.4, len), vm); v.position.set(H + 0.03 + R() * 0.03, WH - 0.2 - len / 2, z); v.rotation.y = Math.PI / 2; g.add(v); }
      for (let k = 0; k < N * 0.8; k++) bush(K, g, H + R() * N, H - 0.3, 0.7, night ? "#4E7A58" : "#9CD08A", WH - 0.3);   // かべの 上の しげみ
      for (let k = 0; k < N * 0.6; k++) bush(K, g, H - 0.3, H + R() * N, 0.7, night ? "#4E7A58" : "#9CD08A", WH - 0.3);
      // 上を とおる コンクリートの 橋（右の 外へ）と 下の 光の 線
      const br = new THREE.Group(); br.position.set(E - 3.5, 4.7, H + 1.1); g.add(br); const bm = phM("ruinwall", 3, 0.4, { color: tint, std: true }, 1.2, bc);
      K.box(br, 9.0, 0.7, 1.8, bm, 3.0, 0, 0); K.box(br, 9.0, 0.9, 0.12, bm, 3.0, 0.7, 0.85); K.box(br, 8.4, 0.05, 0.08, neon("#FFF2D0", night ? 2.6 : 1.4), 3.0, -0.04, 0.5);
      for (let k = 0; k < 7; k++) { const v = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6 + R() * 1.4), vm); v.position.set(0.5 + k * 1.2, -0.6, 0.92); br.add(v); }
      K.box(g, 0.9, 4.7, 0.9, bm, E + 3.6, 0, H + 1.1);
      // 奥の 大きな 輪
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.32, 10, 36, Math.PI * 1.15), phM("ruinwall", 4, 1, { color: tint, std: true }, 1, bc)); ring.position.set(E + 1.8, 0.0, H - 0.6); ring.rotation.z = -0.08; g.add(ring);
      // 手前と 右の 草地（家具を 置ける：move.js）・しげみ・草
      for (const a of L.areas) areaBox(K, g, N, a, phM("grass", a.w / 3, a.d / 3, { color: tint, std: true }, 1.2, gd));
      const gm = K.mat(night ? "#2A4A2C" : "#6EA050");
      for (const b of blocksOf(L, "bush")) { const [x, z] = W(N, b.x, b.z); bush(K, g, x + b.w / 2, z + b.d / 2, 1.1 + b.d * 0.2, night ? "#4E7A58" : "#9CD08A"); for (let j = 0; j < 8; j++) { const t = K.box(g, 0.04, 0.35 + R() * 0.45, 0.04, gm, x + R() * b.w, 0, z + R() * b.d); t.rotation.z = (R() - 0.5) * 0.6; } }
      // 光の すじと ほこり（左上から）
      const sh = new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(night ? "#9EC8FF" : "#FFF3C8") }, k: { value: night ? 0.07 : 0.16 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: VS,
        fragmentShader: "uniform vec3 c; uniform float k; varying vec2 vUv; void main(){ float a = k * pow(vUv.y, 1.6) * pow(sin(3.14159 * vUv.x), 2.0); gl_FragColor = vec4(c, a); }" });   // 上ほど 明るく 下で 消える
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.9, 8, 14, 1, true), sh); b.position.set(H + 2.0 + k * 2.4, 3.6, H + 1.6 + k * 1.2); b.rotation.set(0.3, 0, -0.42); g.add(b); }
      motes(g, 45, { x: H + 1, z: H + 1, w: N * 0.6, d: N * 0.5, h: 4.5 }, night ? "#BFD8FF" : "#FFF6D8", 3.5, 0.06, 17);
      if (night) { const mo = new THREE.PointLight("#9EC8FF", 16, 26, 1.2); mo.position.set(H + 3, 7, H + 3); g.add(mo); const m2 = new THREE.PointLight("#8EB0E8", 8, 20, 1.2); m2.position.set(E, 5, E); g.add(m2); const lb = new THREE.PointLight("#FFF2D0", 3, 6); lb.position.set(E - 1, 4.0, H + 1.6); g.add(lb); }   // 夜：月の 光と 橋の 灯り
    },
  },
};
// 部屋の 外まわり（背景・つや・光）を 入れる。build の あとで よぶ
export function luxScene(type, scene, renderer, night) {
  const L = LUX[type]; if (!L) { scene.environment = null; return; }
  const lt = L.light || {}; scene.environment = envOf(renderer); scene.environmentIntensity = (lt.env ?? 0.8) * (night ? 0.6 : 1);
  photoEnv(type, renderer, (e) => { if (scene.environment === ENV) scene.environment = e; });   // 写真の 空が 読めたら 反射を 写真に
  for (const o of scene.children) { if (o.isHemisphereLight) o.intensity *= lt.hemi ?? 0.5; if (o.isDirectionalLight) o.intensity *= lt.sun ?? 0.8; }   // 部屋の 画面の ふつうの 光を 弱める（つやの ある 床が 白く とばない ように）
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = lt.exp ?? 1;
}
