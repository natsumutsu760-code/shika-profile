// 素材の 手に入る 所の ポップアップ（2026-11-05 鹿さん「要求素材をタップしたら入手先がわかるよう表示するポップアップを実装してください」）
// 使い方：素材の 行に data-mat="素材の id"（あれば data-have="持って いる 数"）を 付けて、この ファイルを import する だけ。押すと 開く（Enter でも）
// 手に入る 所は データから 作る：冒険の 採取・かくし通路・敵が 落とす・敵の 結晶・坑道・工房の 精錬と 加工・製材所・農園・クローラー・ボーダーゾーン
// <dialog> で 開く（作業台・工房の「作る」ポップアップ〈craft-pop.js〉の 上にも 重なる）。行き先へ 行く ボタン つき
import { GATHER, ENEMY_MAT, CRYSTAL, SCRAP, BORDER, MAT_NAME } from "./materials.js";
import { DUNGEONS_ALL } from "./dungeons.js";
import { CROPS } from "./crops.js";
import { WS_PROC, SMELT } from "./workshop.js";
import { mineFind, DRN_SHOP } from "./mine.js";
import { SAW } from "./sawmill.js";   // 製材所（2026-11-11）
import { matPic } from "./mat-icons.js";

const ISLE = { 2: "ビサイ諸島", 3: "ミカネル島" };
const SRC = {};
const add = (id, s) => { if (id) (SRC[id] ||= []).push(s); };
const nm = (id) => MAT_NAME[id] || id;
const recipe = (mats) => mats.map(([id, n]) => `${nm(id)} ${n}`).join("・");
const DNAME = Object.fromEntries(DUNGEONS_ALL.map((d) => [d.id, d.name]));
// 冒険：採取・かくし通路・敵（ふつう・希少・ボス）と その 結晶
for (const d of DUNGEONS_ALL) {
  const href = `dungeon.html?d=${d.id}`, isle = d.isle || 1, g = GATHER[d.id];
  if (g) { for (const [id] of g.mats) add(id, { where: d.name, how: "採取", href, isle }); add(g.hidden[0], { where: d.name, how: "かくし通路", href, isle }); }   // 採取は どの 階でも 同じ 4 しゅるい（鹿さんの 決め 2026-11-06。階は 書かない）
  for (const [f, rk] of [...d.foes.map((f) => [f, ""]), [d.rare, "（希少）"], [d.boss, "（ボス）"]]) {
    if (!f) continue;
    add(ENEMY_MAT[f.tree]?.[0], { where: d.name, how: "が 落とす", item: `${f.name}${rk}`, href, isle });
    add(CRYSTAL[f.tree]?.[0], { where: d.name, how: "が 落とす（結晶）", item: `${f.name}${rk}`, href, isle });
  }
}
// 坑道（地下の 隠れ家）
for (const id of Object.keys(mineFind(999))) add(id, { where: "坑道", how: "なかまに 掘らせる", href: "mine.html" });
// ドルン鉱業（DEEP LINK/: の 会社の 窓口。鉱石・石材・燃料を クレジットで。2026-11-11）
for (const [id] of DRN_SHOP) add(id, { where: "DEEP LINK/: の 窓口", how: "ドルン鉱業で 買う", href: "deeplink.html?go=desk" });
// 工房：精錬（鉱石 → 延べ棒）・加工（作物 → 布・建材）
for (const r of SMELT) add(r.id, { where: "工房の 精錬", how: recipe(r.mats), href: "workshop.html?t=smelt" });
for (const r of WS_PROC) add(r.id, { where: "工房の 加工", how: recipe(r.mats), href: "workshop.html?t=proc" });
for (const r of SAW) add(r.id, { where: "製材所", how: recipe([[r.log, 1]]), href: "sawmill.html" });   // 原木 1 本 → 板 2 枚
// 農園：育てる（種は 冒険の 採取で 拾う・かけ合わせ）・実った まま 置いて おくと かわる
for (const c of CROPS) {
  const how = c.kind === "cross" && c.from ? `${c.from.map(nm).join(" × ")} の かけ合わせ` : c.at?.length ? `種は ${c.at.map((x) => DNAME[x] || x).join("・")} の 採取で` : "育てる";
  add(c.mat || c.id, { where: "農園", how, href: "garden.html", isle: c.isle });
  if (c.after?.into) add(c.after.into, { where: "農園", how: "を 実った まま 置いて おく", item: c.name, href: "garden.html", isle: c.isle });
}
// クローラー（DEEP LINK/: の ほか）・ボーダーゾーン
const SCRAP_HOW = { wreck: "残骸を 漁る", cabinet: "キャビネットを 漁る", locker: "個人ロッカーを 漁る", sva: "SVA の 施設の 迷宮", harmonia: "ハルモニアの 施設の 迷宮", tcu: "TCU の 施設の 迷宮", rare: "どこでも まれに" };
for (const [k, l] of Object.entries(SCRAP)) for (const [id] of l) add(id, { where: "クローラー", how: SCRAP_HOW[k] || "", href: "crawler.html" });
const BORDER_HOW = { any: "どこでも", sva: "SVA の 領地", harmonia: "ハルモニアの 領地", tcu: "TCU の 領地", edge: "境界" };
for (const [k, l] of Object.entries(BORDER)) for (const [id] of l) add(id, { where: "ボーダーゾーン", how: BORDER_HOW[k] || "" });

// 同じ 場所・同じ 手に入れ方は 1 行に（「街道麦・宿場麦 を 実った まま 置いて おく」。同じ 字を くり返さない）
export const whereOf = (id) => {
  const g = new Map();
  for (const x of SRC[id] || []) { const k = [x.where, x.how, x.isle || 1, x.href || ""].join("|"); if (!g.has(k)) g.set(k, { ...x, items: [] }); if (x.item) g.get(k).items.push(x.item); }
  return [...g.values()].map((x) => ({ ...x, how: x.items.length ? `${[...new Set(x.items)].join("・")} ${x.how}` : x.how }));
};

// ---- ポップアップ ----
const CSS = `
dialog.mpop { border:0; padding:0; border-radius:22px; width:min(380px, calc(100vw - 32px)); max-height:min(70vh, 560px); background:#fff; color:#1B2340; box-shadow:0 24px 60px -20px rgba(27,35,64,.55); font-family:inherit; }
dialog.mpop::backdrop { background:rgba(20,24,40,.35); }
.mpop .mp-in { display:grid; gap:10px; padding:16px 16px 14px; max-height:inherit; overflow:auto; }
.mpop header { display:grid; grid-template-columns:44px minmax(0, 1fr) auto; gap:10px; align-items:center; }
.mpop header img { width:44px; height:44px; object-fit:contain; image-rendering:pixelated; background:#F4F6FB; border-radius:12px; padding:4px; }
.mpop header b { display:block; font-size:17px; line-height:1.3; }
.mpop header small { font-size:12.5px; color:#6B7390; }
.mpop .mp-x { width:38px; height:38px; border-radius:50%; border:0; background:#EEF2F9; color:#1B2340; font-size:18px; cursor:pointer; }
.mpop h3 { margin:2px 0 0; font-size:12.5px; color:#6B7390; }
.mpop ul { list-style:none; margin:0; padding:0; display:grid; gap:6px; }
.mpop li { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:8px; align-items:center; padding:8px 10px; border-radius:12px; background:#F4F6FB; }
.mpop li b { display:block; font-size:14px; line-height:1.35; } .mpop li small { display:block; font-size:12.5px; color:#6B7390; line-height:1.4; }
.mpop li em { font-style:normal; font-size:12px; margin-left:6px; padding:1px 7px; border-radius:99px; background:#E4E9F5; color:#4A5578; }
.mpop li a { min-height:34px; display:inline-flex; align-items:center; padding:0 12px; border-radius:99px; background:#2EA8FF; color:#fff; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap; }
.mpop .mp-none { font-size:13px; color:#6B7390; margin:0; }
[data-mat] { cursor:pointer; }
[data-mat]:hover { filter:brightness(.97); }
[data-mat]:focus-visible { outline:2px solid #2EA8FF; outline-offset:2px; }
@media (max-width:640px) { dialog.mpop { margin:auto 0 0; width:100vw; max-width:100vw; border-radius:22px 22px 0 0; max-height:75vh; } }`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let dlg = null;
function open(id, have) {
  if (!dlg) {
    const st = document.createElement("style"); st.id = "mpop-css"; st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement("dialog"); dlg.className = "mpop"; document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest(".mp-x")) dlg.close(); });   // まわりを 押しても とじる
  }
  const list = whereOf(id), max = 8, rows = list.slice(0, max);
  dlg.setAttribute("aria-label", `${nm(id)} の 手に入る 所`);
  dlg.innerHTML = `<div class="mp-in"><header><img src="${matPic(id)}" alt=""><div><b>${esc(nm(id))}</b>${have != null && have !== "" ? `<small>持って いる ${esc(have)}</small>` : ""}</div><button type="button" class="mp-x" aria-label="とじる">×</button></header>
    <h3>手に入る 所</h3>${rows.length ? `<ul>${rows.map((s) => `<li><span><b>${esc(s.where)}${s.isle > 1 ? `<em>${ISLE[s.isle] || `島 ${s.isle}`}</em>` : ""}</b><small>${esc(s.how)}</small></span>${s.href ? `<a href="${s.href}">行く ›</a>` : ""}</li>`).join("")}</ul>${list.length > max ? `<p class="mp-none">ほか ${list.length - max} か所</p>` : ""}` : `<p class="mp-none">まだ 手に入る 所の 記録が ない</p>`}</div>`;
  if (!dlg.open) dlg.showModal();
  dlg.querySelector(".mp-x").focus();
}
const hit = (e) => e.target.closest?.("[data-mat]");
document.addEventListener("click", (e) => { const el = hit(e); if (!el || e.target.closest("button:not([data-mat]), a")) return; e.preventDefault(); open(el.dataset.mat, el.dataset.have); });
document.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = hit(e); if (el && el === e.target) { e.preventDefault(); open(el.dataset.mat, el.dataset.have); } });
// 行に 押せる 印を 付ける（読み上げ・Tab で えらべる）。あとから 描かれた 行にも
const mark = (root) => root.querySelectorAll?.("[data-mat]:not([tabindex])").forEach((el) => { el.tabIndex = 0; el.setAttribute("role", "button"); el.title = "手に入る 所を 見る"; });
mark(document); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.("[data-mat]") ? mark(n.parentNode || n) : mark(n))))).observe(document.documentElement, { childList: true, subtree: true });
