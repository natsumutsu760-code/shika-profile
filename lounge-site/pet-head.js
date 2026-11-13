// ペットの 画面（冒険・なかま など）の 上の 札：絵・名前・種類・職業・Lv。門番の me() の 1 匹目から 出す
// 札の 中の id：petImg・petName・petSub・petMeta（ない 物は とばす）
import { PETS } from "./quiz.js";
import { TYPES } from "./skills.js";

export const petInfo = (mp) => (mp ? PETS[mp.qid] || PETS.nemu : null);
export function fillPet(ME) {
  const mp = ME.pets && ME.pets[0], el = (id) => document.getElementById(id);
  if (!mp) return null;
  const P = petInfo(mp), T = mp.type && TYPES[mp.type];
  if (el("petImg")) { el("petImg").src = P.img; el("petImg").alt = `${P.label}の${mp.name}`; }
  if (el("petName")) el("petName").textContent = mp.name;
  if (el("petSub")) el("petSub").textContent = `${P.label} ／ ${ME.name} の相棒`;
  if (el("petMeta")) el("petMeta").innerHTML = `${T ? `<span class="badge" style="--c:${T.color}">${T.label}</span>` : ""}<span class="lv"><small>Lv</small>${Number(mp.lv) || 1}</span>`;
  return mp;
}

// ペットの 画面の タブ：押すと その 画面へ（えらんで いる タブは そのまま）
const TAB_URL = { ステータス: "status.html", スキルツリー: "skilltree.html", ガンビット: "gambit.html", 装備: "equip.html", 冒険: "dungeon.html", なかま: "tame.html", "Orbit Arena": "arena.html", ボーダーゾーン: "border.html", クローラー: "crawler.html" };
// 2 段の タブ（2026-11-05：7 こは 多い → 鹿さんの カード「おすすめで」で 案A）。上の 段は 3 つの 組、下の 段は えらんだ 組の 中身
const TAB_GROUPS = [["育てる", ["ステータス", "スキルツリー", "装備", "ガンビット"]], ["出かける", ["冒険", "Orbit Arena", "ボーダーゾーン", "クローラー"]], ["なかま", ["なかま"]]];
const GROUP_CSS = `.tabs.grp { margin-bottom:6px; } .tabs.sub { margin-top:0; gap:6px; }
.tabs.sub button { padding:7px 14px; font-size:13px; min-height:32px; }
.tabs.sub button[aria-selected="true"] { background:#fff; color:var(--ink, #1B2340); border-color:var(--ink, #1B2340); box-shadow:none; }
@media (max-width:420px) { .tabs.sub button { padding:7px 10px; } }
@media (max-width:380px) { .tabs.sub { gap:4px; } .tabs.sub button { padding:7px 8px; font-size:12px; } }`;   // 出かける が 4 つ（クローラー）でも 本番の 小さな 枠（358）に 入る
function groupTabs(nav) {
  if (nav.dataset.grp) return;
  const btns = [...nav.querySelectorAll('[role="tab"]')], by = Object.fromEntries(btns.map((b) => [b.textContent.trim(), b]));
  if (!by["ステータス"]) return;
  const on = btns.find((b) => b.getAttribute("aria-selected") === "true"), cur = on ? on.textContent.trim() : "";
  const gi = Math.max(0, TAB_GROUPS.findIndex(([, ms]) => ms.includes(cur)));
  if (!document.getElementById("grp-css")) { const st = document.createElement("style"); st.id = "grp-css"; st.textContent = GROUP_CSS; document.head.appendChild(st); }
  const tops = TAB_GROUPS.map(([g, ms], i) => {
    const b = document.createElement("button"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(i === gi)); b.textContent = g; b.dataset.go = TAB_URL[ms[0]];
    if (i !== gi) for (const m of ms) if (by[m]) by[m].querySelectorAll(":scope > *").forEach((el) => b.appendChild(el.cloneNode(true)));   // 印（出かけて いる 点 など）は 組の 札に
    return b;
  });
  nav.dataset.grp = "1"; nav.classList.add("grp"); nav.setAttribute("aria-label", "ペットの 画面"); nav.replaceChildren(...tops);
  const ms = TAB_GROUPS[gi][1].map((m) => by[m]).filter(Boolean);
  if (ms.length > 1) { const sub = document.createElement("nav"); sub.className = "tabs sub"; sub.dataset.grp = "1"; sub.setAttribute("role", "tablist"); sub.setAttribute("aria-label", TAB_GROUPS[gi][0]); sub.append(...ms); nav.after(sub); }
}
export function linkTabs(root = document) {
  // 闘技場（2026-10-25。名前は Orbit Arena。2026-11-03 鹿さんの 決め）：ペットの タブの さいごに 足す（どの ページの 並びも ここで そろう）
  root.querySelectorAll('.tabs[role="tablist"]').forEach((nav) => {
    const names = [...nav.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim());
    if (names.includes("ステータス") && !names.includes("Orbit Arena")) { const b = document.createElement("button"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false"); b.textContent = "Orbit Arena"; nav.appendChild(b); }
    if (names.includes("ステータス") && !names.includes("ボーダーゾーン")) { const b = document.createElement("button"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false"); b.textContent = "ボーダーゾーン"; nav.appendChild(b); }   // ボーダーゾーン（2026-11-05）：出かける の 組に
    if (names.includes("ステータス") && !names.includes("クローラー")) { const b = document.createElement("button"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false"); b.textContent = "クローラー"; nav.appendChild(b); }   // 2026-11-14 鹿さん「トップからクローラーにアクセスできるようにし」→ 出かける の 4 つ目
  });
  root.querySelectorAll('.tabs[role="tablist"]').forEach(groupTabs);
  root.querySelectorAll('.tabs [role="tab"]').forEach((b) => {
    if (b.dataset.linked) return; b.dataset.linked = "1";
    const u = b.dataset.go || TAB_URL[b.textContent.trim()];
    if (u && b.getAttribute("aria-selected") !== "true") b.addEventListener("click", () => { location.href = u; });
  });
  // スマホで タブの 行が 横に 流れる ときは、えらんで いる タブを まん中に（2026-11-05：装備・Orbit Arena で 画面の 外に あった）。ページは 動かさない
  root.querySelectorAll('.tabs[role="tablist"]').forEach((nav) => {
    const on = nav.querySelector('[role="tab"][aria-selected="true"]');
    if (on && nav.scrollWidth > nav.clientWidth) { const r = on.getBoundingClientRect(), n = nav.getBoundingClientRect(); nav.scrollLeft += r.left - n.left - (nav.clientWidth - r.width) / 2; }
  });
  // いまの 子を かえる・2 匹目から むかえる（鹿さんの 決め、2026-10-31）：上の 札の Lv の 横に（どの ペットの 画面でも 同じ）
  if (!document.getElementById("swap-css")) { const st = document.createElement("style"); st.id = "swap-css"; st.textContent = SWAP_CSS; document.head.appendChild(st); }
  root.querySelectorAll(".panel.pet .meta").forEach((m) => { if (!m.querySelector(".swap")) m.insertAdjacentHTML("beforeend", `<a class="swap" href="pet-pick.html">${SWAP_ICON}かえる</a>`); });
}
const SWAP_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7h11l-3-3M16 13H5l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;   // wallet-bar.js の 両替と 同じ 形
const SWAP_CSS = `.panel.pet .meta .swap { display:inline-flex; align-items:center; gap:3px; margin-left:2px; padding:4px 9px 4px 7px; border-radius:999px; border:1.5px solid #DCE3F0; background:#fff; color:#1B2340; font:700 12px/1 "Zen Maru Gothic", sans-serif; text-decoration:none; white-space:nowrap; }
  .panel.pet .meta .swap svg { width:13px; height:13px; } .panel.pet .meta .swap:hover { border-color:#2EA8FF; color:#1E6FB0; }`;
// まだ ペットが いない・職業が まだ の ときの 案内（どの ペットの 画面でも 同じ）
export function gateHtml(ME, esc) {
  const mp = ME.pets && ME.pets[0];
  if (ME.denied || ME.ok === false) return `<section class="panel gate"><h2>入れません</h2><p>${esc(ME.why || "もう 1 回 開いて ください")}</p>${ME.login ? `<a class="jelly sky go" href="/">MONO LINK で ログイン</a>` : ""}</section>`;
  if (!mp) return `<section class="panel gate"><h2>まず 1 匹目を むかえる</h2><p>9 つの 質問で、いっしょに 冒険する 子が 決まります</p><a class="jelly sky go" href="quiz.html">性格診断へ</a></section>`;
  if (!mp.type) return `<section class="panel gate"><h2>${esc(mp.name)}の 職業を えらぶ</h2><p>冒険の 画面で えらべます</p><a class="jelly sky go" href="dungeon.html">職業を えらぶ</a></section>`;
  return "";
}
// 案内と トーストの 見た目（ページに なければ 足す）
export const GATE_CSS = `[hidden] { display:none !important; }
  .gate { max-width:520px; margin:24px auto 0; text-align:center; display:grid; justify-items:center; gap:10px; padding:28px 24px; }
  .gate h2 { margin:0; font:900 22px/1.3 var(--jp); } .gate p { margin:0; font:700 13px/1.6 var(--jp); color:var(--soft); }
  .gate .go { display:block; width:100%; max-width:320px; padding:15px 16px; border-radius:999px; background:var(--sky); color:#fff; font:900 16px/1 var(--jp); text-decoration:none; text-align:center; box-shadow:0 5px 0 rgba(46,168,255,.3); }
  .toast { position:fixed; left:50%; bottom:24px; z-index:20; transform:translate(-50%, 16px); opacity:0; pointer-events:none; max-width:calc(100vw - 32px); padding:12px 18px; border-radius:16px; background:var(--ink); color:#fff; font:700 14px/1.4 var(--jp); box-shadow:0 18px 40px -18px rgba(27,35,64,.35); transition:opacity .2s, transform .2s; }
  .toast.on { opacity:1; transform:translate(-50%, 0); }
  body.sheet-on .toast { bottom:auto; top:16px; }   /* 下から 出る シートの ボタンに かぶらない */
  @media (prefers-reduced-motion:reduce) { .toast { transition:none; } }`;
export function addGateCss() { const st = document.createElement("style"); st.textContent = GATE_CSS; document.head.appendChild(st); }
let toastT = 0;
export function toast(text) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  el.textContent = text; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 4200);
}
