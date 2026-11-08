// おやつ工房で 作る ところ（隠れ家の おやつ工房と なかまの 画面で 同じ 物。鹿さんの決め、2026-10-25）
// snackCraftHtml(工房の Lv〈つまみの Lv〉, 持って いる 素材) を ページに 入れる。ボタンは data-snack="id" data-n="数"。ページが act("snack.craft", { id, n }) を 頼む
// 栄養の おやつ（詳細ステータス 27。鹿さん 2026-11-08「クラフトで作るはずですが」）：opts.nut に 持ち物（items）を わたすと、上に「懐柔／栄養」の タブ。
//   栄養は しゅるいの チップ・ならべる・カード → 押すと 作業台と 同じ 小窓（nutPopHtml）で 数を えらんで 作る。ページが act("nut.craft", { id, n }) を 頼む
//   ページの 押した ときの 処理で snackUi(ボタン) を 先に よぶ（"draw" は 描きなおす・"open" は 小窓を 開く）。作るは data-nutgo="id" data-n="数"
import { SNACK_RECIPES, snackMats, snackOpen, snackMore, snackSave, upkeep, BAND_AT, SNACK_CRAFT_MAX } from "./facilities.js";
import { MAT_NAME } from "./materials.js";
import { matPic } from "./mat-icons.js";
import { detailOpen, DETAIL, DETAIL_GROUPS, NUT_SNACKS, NUT_CROP_N, NUT_CRAFT_MAX, NUT, nutSnack } from "./nutrition.js";
import { CROP } from "./crops.js";
import { cropPic } from "./crop-art.js";
import "./mat-pop.js";   // 素材を 押すと 手に入る 所（隠れ家・なかまの 画面。2026-11-05）

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
.sk-p { margin:0; font:700 12px/1.4 var(--jp); color:#9A5B2C; }
.sk-tabs { display:flex; gap:6px; }
.sk-tabs button { flex:1; min-height:38px; border-radius:99px; border:1.5px solid #EADBC6; background:#fff; color:#9A5B2C; font:900 13px/1 var(--jp); display:inline-flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; }
.sk-tabs button[aria-selected="true"] { background:#C98A3A; border-color:#C98A3A; color:#fff; }
.sk-tabs em { font-style:normal; font:700 12px/1 var(--num); min-width:20px; height:20px; padding:0 6px; border-radius:99px; background:#FF5A64; color:#fff; display:inline-grid; place-items:center; }
.sk-filt { display:grid; gap:6px; padding:10px 12px; border-radius:16px; background:#FFF8EE; }
.sk-filt div { display:flex; flex-wrap:wrap; align-items:center; gap:6px; } .sk-filt .l { font:900 12px/1 var(--jp); color:#9A5B2C; min-width:4.5em; }
.sk-chip { border:1.5px solid #EADBC6; background:#fff; border-radius:99px; min-height:32px; padding:6px 12px; font:700 12px/1 var(--jp); color:#9A5B2C; display:inline-flex; align-items:center; gap:4px; cursor:pointer; }
.sk-chip[aria-pressed="true"] { background:#9A5B2C; border-color:#9A5B2C; color:#fff; } .sk-chip:disabled { opacity:.4; cursor:default; } .sk-chip em { font-style:normal; font:600 12px/1 var(--num); }
.sk-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:6px; }
.sk-c { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:14px; border:1.5px solid #F2DFC4; background:#FFF8EE; text-align:left; min-height:52px; color:#14164A; cursor:pointer; font:inherit; }
.sk-c img { width:28px; height:28px; image-rendering:pixelated; flex:none; }
.sk-c span { display:grid; gap:3px; min-width:0; flex:1; } .sk-c b { font:900 13px/1.2 var(--jp); }
.sk-c small { font:700 12px/1.25 var(--jp); color:#6B7392; }
.sk-c em { font-style:normal; font:800 12px/1.2 var(--jp); color:#0E8F5A; }
.sk-c.ng { background:#fff; border-style:dashed; } .sk-c.ng img { opacity:.45; } .sk-c.ng b { color:#8C94AE; }
.sk-c[aria-pressed="true"] { border-color:#C98A3A; box-shadow:inset 0 0 0 1.5px #C98A3A; }
@media (max-width:520px) { .sk-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } .sk-c { padding:8px; gap:6px; } .sk-c img { width:24px; height:24px; } }   /* スマホは 2 列（1 列だと 27 まいで 長すぎる） */
.sk-feed { margin:0; text-align:right; } .sk-feed a { display:inline-flex; align-items:center; min-height:32px; font:900 12px/1 var(--jp); color:#2D6CDF; text-decoration:none; }
.skp { display:grid; gap:12px; }
.skp-h { display:flex; align-items:center; gap:12px; } .skp-h img { width:48px; height:48px; image-rendering:pixelated; flex:none; }
.skp-h h3 { margin:0; font:900 18px/1.2 var(--jp); color:#14164A; } .skp-fx { margin:4px 0 0; font:700 13px/1.3 var(--jp); color:#6B7392; } .skp-fx b { color:#0E8F5A; margin-left:4px; } .skp-fx small { margin-left:6px; font:700 12px/1 var(--jp); }
.skp-q { display:flex; flex-wrap:wrap; align-items:center; gap:6px; } .skp-q > span { font:900 12px/1 var(--jp); color:#9A5B2C; min-width:2.5em; }
.skp-go { width:100%; border:0; border-radius:99px; min-height:48px; font:900 15px/1 var(--jp); background:#E9B26A; color:#fff; box-shadow:0 4px 0 #C98A44; cursor:pointer; }
.skp-go:disabled { background:#E3E8F2; color:#8C94AE; box-shadow:0 4px 0 #EDF1F8; cursor:default; }
.skp-own { margin:0; display:flex; justify-content:space-between; align-items:center; gap:8px; font:700 12px/1.4 var(--jp); color:#6B7392; } .skp-own a { color:#2D6CDF; font-weight:900; min-height:32px; display:inline-flex; align-items:center; text-decoration:none; }
`;
export function addSnackCss() { if (document.getElementById("sk-css")) return; const st = document.createElement("style"); st.id = "sk-css"; st.textContent = CSS; document.head.appendChild(st); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// lv：おやつ工房の Lv（つまみの Lv。0 は まだ ない・止めて いる）。inv：[{ id, n }]。まだ 作れない 物は うすく 1 行（「Lv50 から」）
// 施設の 作り直し（2026-11-03）：Lv ごとに 1 こで 2 こ できる・素材が 3 → 2 こ ですむ 確率が ふえる（ふつうの おやつ）。1 回 作るたびに 維持費
const pct = (x) => `${Math.round(x * 100)}%`;
function tameHtml(lv, inv) {
  const have = haveOf(inv), fee = upkeep("snack", lv);
  return `${SNACK_RECIPES.map((r) => {
    const head = `<div class="sk-h">${SNACK_ICON[r.id]}${esc(r.name)}<em>なかよし ＋${r.gauge}</em></div>`;
    if (!snackOpen(r, lv)) return `<div class="sk-r off"><div class="sk-h">${SNACK_ICON[r.id]}${esc(r.name)}<em>おやつ工房 Lv${BAND_AT[r.lv - 1]} から</em></div></div>`;
    const mats = snackMats(r, false), max = Math.min(SNACK_CRAFT_MAX, ...mats.map(([id, k]) => Math.floor(have(id) / k)));   // 素材は 多い 方で 数える（へったら もどる）
    const lack = mats.filter(([id, k]) => have(id) < k).map(([id, k]) => `${MAT_NAME[id]} あと ${k - have(id)}`);
    const luck = r.lv2 ? `<p class="sk-p">2 こ できる ${pct(snackMore(lv))}・素材 2 こで すむ ${pct(snackSave(lv))}${fee ? `・維持費 ${fee}` : ""}</p>` : fee ? `<p class="sk-p">維持費 ${fee} クレジット</p>` : "";
    return `<div class="sk-r">${head}<ul class="sk-m">${mats.map(([id, k]) => `<li class="${have(id) < k ? "ng" : ""}" data-mat="${id}" data-have="${have(id)}"><img src="${matPic(id)}" alt="">${esc(MAT_NAME[id])}<b>${have(id)} / ${k}</b></li>`).join("")}</ul>${luck}
      <div class="sk-b"><button class="lt" data-snack="${r.id}" data-n="1" ${max ? "" : "disabled"}>1 こ 作る</button><button data-snack="${r.id}" data-n="${max}" ${max > 1 ? "" : "disabled"}>作れるだけ（${max} 回）</button></div>
      ${max ? "" : `<p class="sk-why">足りない：${esc(lack.slice(0, 2).join("、"))}</p>`}</div>`;
  }).join("")}`;
}

// ---------- 栄養の おやつ（詳細ステータス）----------
const NUT_GROUPS = DETAIL_GROUPS;   // しゅるいは ステータスの 画面の 詳細と 同じ（攻め・守り・回復・参照）
const haveOf = (inv) => (id) => inv.filter((m) => m.id === id).reduce((a, m) => a + m.n, 0);
const tameMax = (r, lv, have) => (snackOpen(r, lv) ? Math.min(SNACK_CRAFT_MAX, ...snackMats(r, false).map(([id, k]) => Math.floor(have(id) / k))) : 0);
const nutMax = (s, have) => Math.min(NUT_CRAFT_MAX, Math.floor(have(s.crop) / NUT_CROP_N));
const nutPic = (s) => matPic(s.crop) || (CROP[s.crop] ? cropPic(CROP[s.crop], "ripe") : "");
const cropName = (id) => MAT_NAME[id] || (CROP[id] || {}).name || id;
const LS = "ml-snack-tab";
const K = { tab: (() => { try { return localStorage.getItem(LS) === "nut" ? "nut" : "tame"; } catch { return "tame"; } })(), g: "all", sort: "can", sel: null, n: 1 };
export const snackTab = (t) => { if (t === "nut" || t === "tame") K.tab = t; };   // ?sk=nut など、ページが 先に えらぶ とき

// 押した ボタンを 見て、えらぶ 物を かえる。"draw"：描きなおす・"open"：小窓を 開く・null：ここの ボタンでは ない
export function snackUi(b) {
  const d = b.dataset;
  if (d.skt) { K.tab = d.skt === "nut" ? "nut" : "tame"; try { localStorage.setItem(LS, K.tab); } catch {} return "draw"; }
  if (d.skg) { K.g = d.skg; return "draw"; }
  if (d.sks) { K.sort = d.sks; return "draw"; }
  if (d.skn) { K.n = +d.skn; return "draw"; }
  if (d.nut) { if (K.sel !== d.nut) K.n = 1; K.sel = d.nut; return "open"; }
  return null;
}

function nutHtml(inv, items) {
  const have = haveOf(inv), inG = (s) => K.g === "all" || NUT_GROUPS.find((g) => g[0] === K.g)[2].includes(s.stat);
  const chip = (k, name, n) => `<button class="sk-chip" data-skg="${k}" aria-pressed="${K.g === k}" ${n ? "" : "disabled"}>${esc(name)}<em>${n}</em></button>`;
  const chips = chip("all", "ぜんぶ", NUT_SNACKS.length) + NUT_GROUPS.map(([k, name, st]) => chip(k, name, NUT_SNACKS.filter((s) => st.includes(s.stat)).length)).join("");
  const sorts = [["can", "作れる順"], ["isle", "島の 順"]].map(([k, name]) => `<button class="sk-chip" data-sks="${k}" aria-pressed="${K.sort === k}">${name}</button>`).join("");
  const list = NUT_SNACKS.filter(inG);
  if (K.sort === "can") list.sort((a, b) => (nutMax(b, have) > 0) - (nutMax(a, have) > 0));   // 作れる 物を 上に（同じ なら 島の 順の まま）
  const card = (s) => { const mx = nutMax(s, have);   // 持ち数は 小窓だけ（ここは 作る 画面。2026-11-08）
    return `<button class="sk-c ${mx ? "" : "ng"}" data-nut="${s.id}" aria-pressed="${s.id === K.sel}"><img src="${nutPic(s)}" alt=""><span><b>${esc(s.name)}</b><small>${esc(DETAIL[s.stat].label)}</small>${mx ? `<em>作れる ${mx}</em>` : ""}</span></button>`; };
  const owned = NUT_SNACKS.some((s) => (items[s.id] || 0) > 0);
  return `<div class="sk-filt"><div><span class="l">しゅるい</span>${chips}</div><div><span class="l">ならべる</span>${sorts}</div></div>
    <div class="sk-grid">${list.map(card).join("")}</div>${owned ? `<p class="sk-feed"><a href="nutrition.html">作った おやつを あげる ›</a></p>` : ""}`;
}

export function snackCraftHtml(lv, inv, opts = {}) {
  const nut = !!opts.nut && detailOpen(), have = haveOf(inv);
  if (!nut) return `<div class="sk">${tameHtml(lv, inv)}</div>`;
  const tn = SNACK_RECIPES.filter((r) => tameMax(r, lv, have) > 0).length, nn = NUT_SNACKS.filter((s) => nutMax(s, have) > 0).length;
  const tab = (k, name, n) => `<button role="tab" data-skt="${k}" aria-selected="${K.tab === k}">${name}${n ? `<em>${n}</em>` : ""}</button>`;
  return `<div class="sk"><div class="sk-tabs" role="tablist" aria-label="おやつの しゅるい">${tab("tame", "懐柔の おやつ", tn)}${tab("nut", "栄養の おやつ", nn)}</div>
    ${K.tab === "nut" ? nutHtml(inv, opts.nut) : tameHtml(lv, inv)}</div>`;
}

// 小窓の 中身（えらんだ 栄養の おやつを 作る）。まだ えらんで いなければ 空
export function nutPopHtml(inv, items) {
  const s = nutSnack(K.sel); if (!s) return "";
  const have = haveOf(inv), h = have(s.crop), mx = nutMax(s, have), own = (items || {})[s.id] || 0;
  if (K.n > mx) K.n = Math.max(1, mx);
  const ns = mx ? [...new Set([1, 5, 10].filter((n) => n <= mx).concat(mx))] : [];
  const need = NUT_CROP_N * K.n;
  const qty = ns.length > 1 ? `<div class="skp-q"><span>数</span>${ns.map((n) => `<button class="sk-chip" data-skn="${n}" aria-pressed="${n === K.n}">${n === mx && n > 10 ? `作れるだけ（${n}）` : n}</button>`).join("")}</div>` : "";
  return `<div class="skp"><header class="skp-h"><img src="${nutPic(s)}" alt=""><div><h3>${esc(s.name)}</h3><p class="skp-fx">${esc(DETAIL[s.stat].label)}<b>＋${NUT.step}%</b><small>1 こ あげるごと</small></p></div></header>
    <ul class="sk-m"><li class="${h < need ? "ng" : ""}" data-mat="${s.crop}" data-have="${h}"><img src="${nutPic(s)}" alt="">${esc(cropName(s.crop))}<b>${h} / ${need}</b></li></ul>
    ${qty}<button class="skp-go" data-nutgo="${s.id}" data-n="${K.n}" ${mx ? "" : "disabled"}>${esc(s.name)}を ${K.n} こ 作る</button>
    ${mx ? "" : `<p class="sk-why">足りない：${esc(cropName(s.crop))} あと ${NUT_CROP_N - h}</p>`}
    ${own ? `<p class="skp-own"><span>持って いる ×${own}</span><a href="nutrition.html">あげる ›</a></p>` : ""}</div>`;
}
