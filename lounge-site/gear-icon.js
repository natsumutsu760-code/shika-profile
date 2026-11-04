// 装備の 印（鹿さんの 決め：2026-10-28「装備の 絵は やめる」・2026-11-04「部位の 印＋開発は 敵の 絵」）
// 前は 3D から 撮った 絵（equip3d.js）と 名前の ある 装備の img/icon-*.png。いまは 部位の 文字の 丸（小さな SVG）。装備開発の 装備は その 敵の ドット絵
// 使い方は 前と 同じ：gearImg(id) で <img> を 文字で 作る（画面の 大きさの 決まりを かえない ため <img> の まま）。watchIcons() は 何も しない（前の 画面の ため のこす）
import { baseOf } from "./equip.js";
import { spriteURL } from "./sprites.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// 部位ごとの 文字と 色（あたま・くび・うで・あし・武器・オフハンド・アクセサリー）
export const SLOT_MARK = { head: ["頭", "#5B8DEF"], neck: ["首", "#E86FA8"], arm: ["腕", "#F2A33A"], leg: ["足", "#3DB88A"], weapon: ["武", "#E5534B"], off: ["副", "#8E6CFF"], acc: ["飾", "#C9A227"] };
const cache = new Map();
function markSrc(slot, mythic) {
  const k = slot + (mythic ? ":m" : "");
  if (cache.has(k)) return cache.get(k);
  const [ch, c] = SLOT_MARK[slot] || ["?", "#8C94AE"], ring = mythic ? `<circle cx="32" cy="32" r="29" fill="none" stroke="#E0A21C" stroke-width="4"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="${c}"/>${ring}<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="700" font-size="28" fill="#fff">${ch}</text></svg>`;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  cache.set(k, url); return url;
}
// dir は 前の 呼び方の ため のこして いる（使わない）
export const gearSrc = (id) => { const b = baseOf(id); return b && b.dev ? spriteURL(b.tree) : markSrc(b ? b.slot : "", !!(b && (b.mythic || b.unique))); };
export function gearImg(id, { alt = "", cls = "" } = {}) {
  const px = baseOf(id)?.dev ? ` style="image-rendering:pixelated"` : "";
  return `<img${cls ? ` class="${esc(cls)}"` : ""} src="${gearSrc(id)}" alt="${esc(alt)}"${px}>`;
}
export async function fillIcons() {}
export function watchIcons() {}
