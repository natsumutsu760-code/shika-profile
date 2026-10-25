// 装備の 絵。名前の ある 物は img/icon-<look>.png、組み合わせの 物（形.素材.色）は その場で 3D から 撮って 画像に する
// 使い方：gearImg(id) で <img> を 文字で 作って ページに 入れる。watchIcons() を 1 回 よんで おくと、入った 物から 撮って 入れかわる
// three.js は 撮る ときに はじめて 読む（ページに importmap が いる）。WebGL が ない ときは 素材の 色の 丸に 形の 1 文字
import { comboOf, baseOf, FORMS, MATS, COLS } from "./equip.js";

const SIZE = 160, BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const done = new Map();
let kit, busy = false, again = false;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const gearSrc = (id, dir = "img/") => (comboOf(id) ? done.get(id) || BLANK : `${dir}icon-${baseOf(id)?.look || id}.png`);
export function gearImg(id, { dir = "img/", alt = "", cls = "" } = {}) {
  const wait = comboOf(id) && !done.has(id);
  return `<img${cls ? ` class="${esc(cls)}"` : ""} src="${gearSrc(id, dir)}" alt="${esc(alt)}"${wait ? ` data-gear="${esc(id)}"` : ""}>`;
}

async function load() {
  if (kit !== undefined) return kit;
  try {
    const [THREE, E] = await Promise.all([import("three"), import("./equip3d.js")]);
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(SIZE, SIZE); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(), sun = new THREE.DirectionalLight("#FFF4E0", 1.3);
    sc.add(new THREE.HemisphereLight("#FFFFFF", "#C9D3EA", 1.6)); sun.position.set(3, 6, 5); sc.add(sun);
    kit = { THREE, E, r, sc };
  } catch { kit = null; }
  return kit;
}

// ななめ上・少し 右から（もとの 絵と 同じ 向き）。箱の 8 すみを カメラから 見て、ちょうど 収まる 大きさに
function shot({ THREE, E, r, sc }, id) {
  const g = E.makeGear(id), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  g.rotation.y = -0.45; sc.add(g); g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3());
  cam.position.copy(c).addScaledVector(new THREE.Vector3(0, 0.5, 1).normalize(), 20); cam.lookAt(c); cam.updateMatrixWorld(true);
  const lo = new THREE.Vector2(Infinity, Infinity), hi = new THREE.Vector2(-Infinity, -Infinity), p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) { p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(cam.matrixWorldInverse); lo.min(p); hi.max(p); }
  const h = Math.max(hi.x - lo.x, hi.y - lo.y) * 0.62, mx = (lo.x + hi.x) / 2, my = (lo.y + hi.y) / 2;
  Object.assign(cam, { left: mx - h, right: mx + h, top: my + h, bottom: my - h }); cam.updateProjectionMatrix();
  r.render(sc, cam); const url = r.domElement.toDataURL("image/png");
  sc.remove(g); g.traverse((m) => { m.geometry?.dispose(); [].concat(m.material || []).forEach((x) => x.dispose()); });
  return url;
}

function flat(id) {
  const c = comboOf(id), cv = document.createElement("canvas"), x = cv.getContext("2d"); cv.width = cv.height = SIZE;
  x.fillStyle = MATS[c.mat].c; x.beginPath(); x.arc(80, 80, 56, 0, Math.PI * 2); x.fill();
  if (COLS[c.col]) { x.lineWidth = 10; x.strokeStyle = COLS[c.col].c; x.stroke(); }
  x.fillStyle = "#fff"; x.font = "bold 56px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(FORMS[c.form].name[0], 80, 84);
  return cv.toDataURL("image/png");
}

const nextTurn = () => new Promise((ok) => setTimeout(ok, 0));
// ページの 中の 待って いる 絵を 撮る。たくさん あっても 1 回 12ms ごとに 手を はなす（画面が かたまらない）
export async function fillIcons() {
  if (busy) { again = true; return; }
  busy = true;
  try {
    do {
      again = false;
      const ids = [...new Set([...document.querySelectorAll("img[data-gear]")].map((i) => i.dataset.gear))].filter((id) => comboOf(id));
      if (!ids.length) break;
      const k = await load(); let t = performance.now();
      for (const id of ids) {
        if (!done.has(id)) { try { done.set(id, k ? shot(k, id) : flat(id)); } catch { done.set(id, flat(id)); } }
        for (const i of document.querySelectorAll(`img[data-gear="${CSS.escape(id)}"]`)) { i.src = done.get(id); i.removeAttribute("data-gear"); }
        if (performance.now() - t > 12) { await nextTurn(); t = performance.now(); }
      }
    } while (again);
  } finally { busy = false; }
}

let watching = false;
export function watchIcons() {
  if (watching) return; watching = true;
  new MutationObserver(() => { if (document.querySelector("img[data-gear]")) fillIcons(); }).observe(document.body, { childList: true, subtree: true });
  fillIcons();
}
