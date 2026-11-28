// 部屋の 質感（テクスチャ）を その場で 描く（画像ファイルを ふやさない）。高い ティアの 部屋（room-lux.js）が 使う
// 2026-11-27 鹿さん「高ティアなのにあまりテクスチャに差がない。スキンの考え方と違う。」→ 高い ティアほど 質感と 動きを はっきり 足す
// どれも くり返して 貼れる（つなぎ目なし）。色の 絵（map）と 凹凸（normalMap）を かえす。同じ 物は 1 回だけ 描く
import * as THREE from "three";

const CACHE = new Map();
// くり返せる 値の ノイズ（per：くり返しの 長さ）
function vnoise(seed) {
  const h = (x, y, per) => { x = ((x % per) + per) % per; y = ((y % per) + per) % per; let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const n = (x, y, per) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = h(xi, yi, per), b = h(xi + 1, yi, per), c = h(xi, yi + 1, per), d = h(xi + 1, yi + 1, per); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  return (u, v, base = 4, oct = 4) => { let s = 0, amp = 0.5, f = base; for (let k = 0; k < oct; k++) { s += amp * n(u * f, v * f, f); amp *= 0.5; f *= 2; } return s / (1 - Math.pow(0.5, oct)); };   // u・v は 0〜1
}
const srgb = (c) => { const x = new THREE.Color(c).convertLinearToSRGB(); return [x.r * 255, x.g * 255, x.b * 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// 描く 台：S×S の 色と 高さ。paint(u, v, x, y) → [r, g, b, h]（h は 0〜1）
function build(key, S, paint, { normal = 2, repeat = 1, rough = null } = {}) {
  if (CACHE.has(key)) return CACHE.get(key);
  const col = new Uint8ClampedArray(S * S * 4), hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const [r, g, b, h] = paint(x / S, y / S, x, y), i = y * S + x; col[i * 4] = r; col[i * 4 + 1] = g; col[i * 4 + 2] = b; col[i * 4 + 3] = 255; hgt[i] = h; }
  const cv = (data) => { const c = document.createElement("canvas"); c.width = c.height = S; c.getContext("2d").putImageData(new ImageData(data, S, S), 0, 0); return c; };
  const nrm = new Uint8ClampedArray(S * S * 4), at = (x, y) => hgt[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = (at(x - 1, y) - at(x + 1, y)) * normal, dy = (at(x, y - 1) - at(x, y + 1)) * normal, l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4; nrm[i] = (dx / l * 0.5 + 0.5) * 255; nrm[i + 1] = (-dy / l * 0.5 + 0.5) * 255; nrm[i + 2] = (1 / l * 0.5 + 0.5) * 255; nrm[i + 3] = 255; }
  const map = new THREE.CanvasTexture(cv(col)), nmap = new THREE.CanvasTexture(cv(nrm));
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, nmap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; }
  const out = { map, normalMap: nmap };
  if (rough) { const rg = new Uint8ClampedArray(S * S * 4); for (let i = 0; i < S * S; i++) { const v = rough(hgt[i]) * 255; rg[i * 4] = rg[i * 4 + 1] = rg[i * 4 + 2] = v; rg[i * 4 + 3] = 255; } const rt = new THREE.CanvasTexture(cv(rg)); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; out.roughnessMap = rt; }
  CACHE.set(key, out); return out;
}
// 貼る 回数を かえた 写し（同じ 絵を 共有）
export function rep(t, rx, ry = rx) { const o = {}; for (const [k, v] of Object.entries(t)) { const c = v.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; o[k] = c; } return o; }

// 大理石の タイル（k×k 枚。目地つき）
export function marble(key, base, vein, { k = 2, grout = "#C9D2DE", S = 512, seed = 3, veinK = 0.85, warm = null } = {}) {
  const N = vnoise(seed), B = srgb(base), V = srgb(vein), G = srgb(grout), W = warm ? srgb(warm) : null, gw = 3 / S;
  return build("marble:" + key, S, (u, v) => {
    const tu = (u * k) % 1, tv = (v * k) % 1, ti = Math.floor(u * k) + Math.floor(v * k) * 7, edge = Math.min(tu, tv, 1 - tu, 1 - tv) * (1 / k);
    if (edge < gw) return [...G, 0.15];
    const n = N(u, v, 3, 5), n2 = N(u + 0.37, v + 0.11, 6, 3), wq = N(u + 0.71, v + 0.29, 2, 4), ph = (u * 0.9 + v * 0.6 + ti * 0.37 + n * 3.2 + wq * 2.4) * Math.PI * 2;   // ノイズで 大きく ゆがめる（くり返しに 見せない）
    const vv = Math.pow(1 - Math.abs(Math.sin(ph)), 7) * veinK + Math.pow(1 - Math.abs(Math.sin(ph * 2.3 + n2 * 3)), 18) * 0.45;
    let c = mix(B, V, clamp01(vv)); c = mix(c, V, clamp01((n - 0.5) * 0.6)); if (W) c = mix(c, W, clamp01((n2 - 0.45) * 1.2) * 0.35);   // 筋と くもり
    const s = (N(u, v, 32, 2) - 0.5) * 10; return [c[0] + s, c[1] + s, c[2] + s, 0.95 - vv * 0.05];
  }, { normal: 3 });
}
// 木の 板（rows 列。つなぎ目を ずらす）
export function wood(key, c1, c2, { rows = 6, S = 512, seed = 5 } = {}) {
  const N = vnoise(seed), A = srgb(c1), Bc = srgb(c2);
  return build("wood:" + key, S, (u, v) => {
    const r = Math.floor(v * rows), off = ((r * 0.37) % 1), pu = (u + off) % 1, seg = Math.floor(pu * 2), lv = (v * rows) % 1, lu = (pu * 2) % 1;
    if (lv < 0.025 || lv > 0.975 || lu < 0.006) return [A[0] * 0.45, A[1] * 0.45, A[2] * 0.45, 0];
    const g = N(u * 0.25 + r * 0.31 + seg * 0.17, v * 3, 2, 3), ring = Math.abs(Math.sin((v * rows * 9 + g * 6 + r) * Math.PI)), tone = (N(r * 0.13 + seg * 0.29, 0.5, 1, 1) - 0.5) * 0.5;
    const c = mix(A, Bc, clamp01(Math.pow(ring, 3) * 0.7 + tone + 0.15)); const s = (N(u, v, 64, 1) - 0.5) * 8; return [c[0] + s, c[1] + s, c[2] + s, 0.9 + ring * 0.05];
  }, { normal: 2 });
}
// コンクリート（walls：型枠の すじと 穴・たれた しみ）
export function concrete(key, base, { S = 512, seed = 9, walls = false, k = 2 } = {}) {
  const N = vnoise(seed), B = srgb(base);
  return build("concrete:" + key, S, (u, v) => {
    let n = N(u, v, 4, 5), d = (n - 0.5) * 50, h = 0.6 + n * 0.3;
    const pit = N(u, v, 48, 1); if (pit > 0.82) { d -= 30; h -= 0.3; }
    if (walls) { const su = (u * k) % 1, sv = (v * k) % 1; if (su < 0.01 || sv < 0.01) { d -= 35; h = 0.1; } for (const [a, b] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) if (Math.hypot(su - a, sv - b) < 0.018) { d -= 45; h = 0.05; }
      d -= Math.pow(N(u * 3, v * 0.25, 4, 3), 3) * 60; }   // たれた しみ
    else { const st = N(u + 0.5, v + 0.2, 2, 3); d -= clamp01((st - 0.55) * 4) * 30; }
    return [B[0] + d, B[1] + d, B[2] + d * 0.95, h];
  }, { normal: 4 });
}
// こけ（色の 斑）
export function mossy(key, base, moss, { S = 512, seed = 11 } = {}) {
  const N = vnoise(seed), B = srgb(base), M = srgb(moss);
  return build("mossy:" + key, S, (u, v) => { const n = N(u, v, 3, 5), m = clamp01((N(u + 0.3, v + 0.7, 2, 4) - 0.52) * 5); const c = mix(B, M, m * 0.85), s = (n - 0.5) * 40, gap = ((u * 2) % 1 < 0.008 || (v * 2) % 1 < 0.008) ? -40 : 0; return [c[0] + s + gap, c[1] + s + gap, c[2] + s * 0.9 + gap, 0.5 + n * 0.4 + m * 0.2 + (gap ? -0.4 : 0)]; }, { normal: 3 });
}
// モザイク タイル（プールの 底）
export function mosaic(key, c1, c2, { n = 24, S = 512, seed = 13 } = {}) {
  const N = vnoise(seed), A = srgb(c1), Bc = srgb(c2);
  return build("mosaic:" + key, S, (u, v) => { const tu = (u * n) % 1, tv = (v * n) % 1; if (tu < 0.08 || tv < 0.08) return [235, 245, 255, 0]; const r = N(Math.floor(u * n) / n + 0.01, Math.floor(v * n) / n + 0.01, n, 1); const c = mix(A, Bc, r); return [c[0], c[1], c[2], 1]; }, { normal: 1.5 });
}
// ふかふかの 革（ひし形の ぬい目と ボタン）
export function tufted(key, base, { n = 6, S = 256 } = {}) {
  const B = srgb(base);
  return build("tufted:" + key, S, (u, v) => { const a = (u + v) * n, b = (u - v + 1) * n, fa = a % 1, fb = b % 1, d = Math.min(fa, 1 - fa, fb, 1 - fb), btn = Math.hypot(Math.min(fa, 1 - fa), Math.min(fb, 1 - fb)) < 0.07; const h = btn ? 0.2 : Math.pow(clamp01(d * 2.4), 0.6); const s = (h - 0.7) * 50; return [B[0] + s, B[1] + s, B[2] + s, h]; }, { normal: 5 });
}
// たて溝の かべ板
export function fluted(key, base, { n = 16, S = 256 } = {}) {
  const B = srgb(base);
  return build("fluted:" + key, S, (u) => { const h = Math.abs(Math.sin(u * n * Math.PI)), s = (h - 0.7) * 26; return [B[0] + s, B[1] + s, B[2] + s, h]; }, { normal: 3 });
}
// 床に 落ちる 光の 輪（下向きの 灯り。足し算で 重ねる）
let POOL = null;
export function lightPool() {
  if (POOL) return POOL; const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.45, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  POOL = new THREE.CanvasTexture(c); return POOL;
}
// 葉の かたまり（つる・しげみの 板。すかし）
let LEAF = null;
export function leafCard() {
  if (LEAF) return LEAF; const S = 256, c = document.createElement("canvas"); c.width = c.height = S; const x = c.getContext("2d"), R = ((s) => () => ((s = (s * 16807) % 2147483647) / 2147483647))(17);
  for (let k = 0; k < 90; k++) { const px = S * (0.15 + R() * 0.7), py = S * (R() * 0.98), r = S * (0.025 + R() * 0.03), a = R() * Math.PI; x.save(); x.translate(px, py); x.rotate(a); const g = 90 + R() * 70; x.fillStyle = `rgb(${40 + R() * 30},${g},${40 + R() * 25})`; x.beginPath(); x.ellipse(0, 0, r * 1.7, r, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = "rgba(20,50,20,0.5)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-r * 1.6, 0); x.lineTo(r * 1.6, 0); x.stroke(); x.restore(); }
  x.strokeStyle = "rgba(60,80,40,0.9)"; x.lineWidth = 2; x.beginPath(); x.moveTo(S / 2, 0); for (let y = 0; y < S; y += 16) x.lineTo(S / 2 + Math.sin(y / 30) * 10, y); x.stroke();
  LEAF = new THREE.CanvasTexture(c); LEAF.colorSpace = THREE.SRGBColorSpace; return LEAF;
}

// ---------- 写真の 質感（2026-11-27 鹿さん「やはりもっとテクスチャを写真に近づけて違う世界観を演出する必要がある。」）----------
// Poly Haven（CC0）の 写真の テクスチャを 加工して img/room-<名前>-d（色）・-n（凹凸）・-r（つや）.webp に 置いた。読みこむ 前は 下の 色で 描く
// 同じ 絵は 1 回だけ 読む（Source を 共有。貼る 回数だけ ちがう 写しを 作る）
const PHOTO = new Map();
function photoSrc(url, srgb) {
  let p = PHOTO.get(url); if (p) return p;
  const img = new Image(), src = new THREE.Source(img); p = { src, ok: false, list: [], cbs: [], srgb }; PHOTO.set(url, p);
  img.onload = () => { p.ok = true; src.needsUpdate = true; for (const t of p.list) t.needsUpdate = true; for (const f of p.cbs) f(); p.cbs = []; }; img.onerror = () => { p.bad = true; p.cbs = []; }; img.src = url;
  return p;
}
function photoOne(url, rx, ry, srgb) { const p = photoSrc(url, srgb), t = new THREE.Texture(); t.source = p.src; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (p.ok) t.needsUpdate = true; p.list.push(t); return t; }
const ROUGH = new Set(["vipfloor", "nightfloor", "pool", "vipwall", "leather", "oceanfloor", "teak", "parquet", "ruinfloor", "ruinwall", "grass"]);
// 写真が ぜんぶ 読めたら cb（読めない ときは よばない＝描いた 質感の まま）
export function whenPhoto(name, cb) { const urls = ["d", "n", ...(ROUGH.has(name) ? ["r"] : [])].map((k) => `img/room-${name}-${k}.webp`); let left = urls.length; for (const u of urls) { const p = photoSrc(u, u.endsWith("-d.webp")); if (p.ok) { if (--left === 0) cb(); } else p.cbs.push(() => { if (--left === 0) cb(); }); } }
export function photo(name, rx, ry = rx) { const b = `img/room-${name}`; return { map: photoOne(`${b}-d.webp`, rx, ry, true), normalMap: photoOne(`${b}-n.webp`, rx, ry, false), ...(ROUGH.has(name) ? { roughnessMap: photoOne(`${b}-r.webp`, rx, ry, false) } : {}) }; }
// 写真の 空（反射用）。読めたら cb(texture)
export function photoEnv(name, renderer, cb) {
  const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; const pm = new THREE.PMREMGenerator(renderer), e = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); cb(e); }; img.src = `img/room-${name}-env.webp`;
}
// 背景の 写真（読めたら cb(img)）
const BGIMG = new Map();
export function photoImg(file, cb) { let p = BGIMG.get(file); if (!p) { const img = new Image(); p = { img, ok: false, cbs: [] }; BGIMG.set(file, p); img.onload = () => { p.ok = true; for (const f of p.cbs) f(img); p.cbs = []; }; img.src = `img/${file}`; } if (p.ok) return p.img; if (cb) p.cbs.push(cb); return null; }
