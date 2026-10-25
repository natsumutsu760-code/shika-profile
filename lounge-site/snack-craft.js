// おやつ工房で 作る ところ（隠れ家の おやつ工房と なかまの 画面で 同じ 物。鹿さんの決め、2026-10-25）
// snackCraftHtml(工房の Lv, 持って いる 素材) を ページに 入れる。ボタンは data-snack="id" data-n="数"。ページが act("snack.craft", { id, n }) を 頼む
import { SNACK_RECIPES, snackMats, snackMade, SNACK_CRAFT_MAX } from "./facilities.js";
import { MAT_NAME } from "./materials.js";
import { matPic } from "./mat-icons.js";

const COOKIE = `<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9.5" fill="#E9B26A" stroke="#fff" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="#9A5B2C"/><circle cx="14" cy="9.5" r="1.4" fill="#9A5B2C"/><circle cx="10" cy="14.5" r="1.4" fill="#9A5B2C"/></svg>`;
const STAR = `<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9.5" fill="#FF9EC4" stroke="#fff" stroke-width="1.5"/><path d="M11 5.2l1.7 3.6 3.9.5-2.9 2.7.8 3.9L11 14l-3.5 1.9.8-3.9-2.9-2.7 3.9-.5z" fill="#fff"/></svg>`;
export const SNACK_ICON = { snack: COOKIE, snack3: STAR };

const CSS = `
.sk { display:grid; gap:8px; }
.sk-r { padding:10px 12px; border-radius:16px; background:#FFF8EE; border:1.5px solid #F2DFC4; display:grid; gap:7px; }
.sk-r.off { background:none; border-style:dashed; color:#8C94AE; }
.sk-h { display:flex; align-items:center; gap:8px; font:900 14px/1.2 var(--jp); }
.sk-h svg { width:22px; height:22px; flex:none; } .sk-h em { margin-left:auto; font:700 12px/1 var(--jp); font-style:normal; color:#9A5B2C; }
.sk-r.off .sk-h em { color:#8C94AE; }
.sk-m { display:flex; flex-wrap:wrap; gap:6px; margin:0; padding:0; list-style:none; }
.sk-m li { display:inline-flex; align-items:center; gap:5px; padding:3px 9px 3px 4px; border-radius:99px; background:#fff; border:1.5px solid #EADBC6; font:700 12px/1.2 var(--jp); }
.sk-m img { width:20px; height:20px; image-rendering:pixelated; } .sk-m b { font:600 12px/1 var(--num); color:#0E8F5A; } .sk-m .ng b { color:var(--coral, #FF5A64); }
.sk-b { display:flex; gap:6px; } .sk-b button { flex:1; border:0; border-radius:99px; padding:9px 12px; font:900 13px/1 var(--jp); background:#E9B26A; color:#fff; box-shadow:0 4px 0 #C98A44; }
.sk-b button.lt { background:#fff; color:#9A5B2C; box-shadow:0 4px 0 #EADBC6; border:1.5px solid #EADBC6; }
.sk-b button:disabled { background:#E3E8F2; color:#8C94AE; box-shadow:0 4px 0 #EDF1F8; border-color:transparent; }
.sk-why { margin:0; font:700 12px/1.4 var(--jp); color:var(--coral, #FF5A64); }
`;
export function addSnackCss() { if (document.getElementById("sk-css")) return; const st = document.createElement("style"); st.id = "sk-css"; st.textContent = CSS; document.head.appendChild(st); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// lv：おやつ工房の Lv（0 は まだ ない）。inv：[{ id, n }]。まだ 作れない 物は うすく 1 行（「Lv3 から」）
export function snackCraftHtml(lv, inv) {
  const have = (id) => inv.filter((m) => m.id === id).reduce((a, m) => a + m.n, 0);
  return `<div class="sk">${SNACK_RECIPES.map((r) => {
    const head = `<div class="sk-h">${SNACK_ICON[r.id]}${esc(r.name)}<em>なかよし ＋${r.gauge}</em></div>`;
    if (lv < r.lv) return `<div class="sk-r off"><div class="sk-h">${SNACK_ICON[r.id]}${esc(r.name)}<em>おやつ工房 Lv${r.lv} から</em></div></div>`;
    const mats = snackMats(r, lv), max = Math.min(SNACK_CRAFT_MAX, ...mats.map(([id, k]) => Math.floor(have(id) / k)));
    const lack = mats.filter(([id, k]) => have(id) < k).map(([id, k]) => `${MAT_NAME[id]} あと ${k - have(id)}`);
    return `<div class="sk-r">${head}<ul class="sk-m">${mats.map(([id, k]) => `<li class="${have(id) < k ? "ng" : ""}"><img src="${matPic(id)}" alt="">${esc(MAT_NAME[id])}<b>${have(id)} / ${k}</b></li>`).join("")}</ul>
      <div class="sk-b"><button class="lt" data-snack="${r.id}" data-n="1" ${max ? "" : "disabled"}>${snackMade(r, lv, 1)} こ 作る</button><button data-snack="${r.id}" data-n="${max}" ${max > 1 ? "" : "disabled"}>作れるだけ（${snackMade(r, lv, max)} こ）</button></div>
      ${max ? "" : `<p class="sk-why">足りない：${esc(lack.slice(0, 2).join("、"))}</p>`}</div>`;
  }).join("")}</div>`;
}
