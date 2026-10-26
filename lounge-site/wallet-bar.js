// 上の 通貨の 札（玉・リソース・クレジット）と 両替。ソーシャルゲームの ように MONO LINK の どの 画面にも 出す（鹿さんの決め、2026-10-25）
// 使い方：mountWallet()。header.top の 右に 札を ならべる。数は lounge-client.js の me()・act() の 答えから（"ml-purse"）。画面が 読まなければ 自分で me()
//   サイト（index.html）からも import して 使う（{ host, before, theme: "site" }。before の 前に 入れる）。DEEP LINK/: は { host, theme: "dark" }
// 札を 押すと 両替（玉 ⇄ クレジットは 1 対 1・手数料 1 割、リソースは 5,000 で 買う・2,000 で 売る。計算は 門番の lounge-money.js と 同じ）
import { me, act, busy, lastPurse, waitText } from "./lounge-client.js";

const RES_BUY = 5000, FEE = 0.1;   // リソースは 買うだけ（売れない。門番の lounge-money.js と 同じ）
const CUR = { balls: { label: "玉", c: "#2EA8FF" }, res: { label: "リソース", c: "#8E6CFF" }, credits: { label: "クレジット", c: "#13A36A" } };
const ICON = {
  balls: `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#2EA8FF"/><circle cx="7.4" cy="7" r="2.6" fill="#fff" opacity=".75"/></svg>`,
  res: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 17 8 10 18.5 3 8Z" fill="#8E6CFF"/><path d="M10 1.5 13 8H7Z" fill="#fff" opacity=".45"/></svg>`,
  credits: `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#13A36A"/><circle cx="10" cy="10" r="5.6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/><path d="M12.2 7.4a3.1 3.1 0 1 0 0 5.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};
const SWAP_ICON = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7h11l-3-3M16 13H5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const fmt = (n) => Number(n).toLocaleString("ja-JP");
const short = (n) => (n >= 1e8 ? `${Math.floor(n / 1e7) / 10}億` : n >= 1e6 ? `${Math.floor(n / 1e4)}万` : fmt(n));

const CSS = `
.wb { display:flex; align-items:center; gap:6px; margin-left:auto; min-width:0; }
.wb .wb-c { display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 10px 0 6px; border-radius:999px; background:#fff; border:1.5px solid #DCE3F0; color:#1B2340; font:600 14px/1 var(--num, "Fredoka", sans-serif); white-space:nowrap; text-decoration:none; }
.wb .wb-c svg { width:20px; height:20px; flex:none; }
.wb .wb-c .wb-l { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
.wb .wb-x { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:50%; border:0; background:#1B2340; color:#fff; padding:0; }
.wb .wb-x svg { width:18px; height:18px; }
.wb .wb-x:hover { filter:brightness(1.25); }
.wb.dark .wb-c { background:rgba(255,255,255,.06); border-color:rgba(120,255,220,.25); color:#D8FFF4; font-family:inherit; }
.wb.dark .wb-x { background:#0FD9B0; color:#04201A; }
.wb.site .wb-c { height:30px; }
.has-wb { flex-wrap:wrap; }
@media (max-width:620px) { .has-wb .wb { order:9; flex:1 0 100%; margin-left:0; gap:6px; } .wb .wb-c { flex:1 1 0; justify-content:center; height:32px; padding:0 8px 0 5px; font-size:13.5px; } .wb .wb-x { width:32px; height:32px; flex:none; } }
.wbd { border:0; padding:0; border-radius:24px; width:min(440px, calc(100vw - 24px)); background:#fff; color:#1B2340; box-shadow:0 30px 80px -20px rgba(27,35,64,.55); font:500 15px/1.5 var(--jp, "Zen Maru Gothic", sans-serif); }
.wbd::backdrop { background:rgba(20,26,48,.45); }
.wbd form { display:grid; gap:14px; padding:20px 20px 22px; }
.wbd header { display:flex; align-items:center; justify-content:space-between; }
.wbd h2 { margin:0; font:900 20px/1.2 var(--jp, sans-serif); }
.wbd .wbd-close { width:36px; height:36px; border-radius:50%; border:0; background:#EEF2F9; font:700 18px/1 sans-serif; color:#6A7394; }
.wbd .wbd-row { display:grid; grid-template-columns:52px minmax(0, 1fr); gap:8px; align-items:center; }
.wbd .wbd-row > span { font:700 12.5px/1.2 var(--jp, sans-serif); color:#6A7394; }
.wbd .wbd-seg { display:flex; flex-wrap:wrap; gap:6px; }
.wbd .wbd-seg button { display:inline-flex; align-items:center; gap:5px; padding:8px 12px 8px 8px; border-radius:999px; border:2px solid #DCE3F0; background:#fff; font:800 13.5px/1 var(--jp, sans-serif); color:#1B2340; }
.wbd .wbd-seg button svg { width:18px; height:18px; }
.wbd .wbd-seg button small { font:600 12px/1 var(--num, sans-serif); color:#6A7394; }
.wbd .wbd-seg button[aria-pressed="true"] { border-color:#1B2340; background:#1B2340; color:#fff; } .wbd .wbd-seg button[aria-pressed="true"] small { color:#C9D1E6; }
.wbd .wbd-n { display:flex; align-items:center; gap:6px; }
.wbd .wbd-n input { width:100%; min-width:0; height:44px; padding:0 12px; border-radius:12px; border:2px solid #DCE3F0; font:600 20px/1 var(--num, sans-serif); color:#1B2340; text-align:right; }
.wbd .wbd-n .u { font:700 13px/1 var(--jp, sans-serif); color:#6A7394; white-space:nowrap; }
.wbd .wbd-q { display:flex; gap:6px; flex-wrap:wrap; }
.wbd .wbd-q button { padding:7px 11px; border-radius:999px; border:1.5px solid #DCE3F0; background:#F6F8FC; font:700 12.5px/1 var(--jp, sans-serif); color:#1B2340; }
.wbd .wbd-sum { display:flex; align-items:center; justify-content:center; gap:10px; padding:14px 10px; border-radius:16px; background:#F3F6FC; font:600 20px/1.2 var(--num, sans-serif); flex-wrap:wrap; }
.wbd .wbd-sum svg { width:22px; height:22px; vertical-align:-4px; margin-right:3px; } .wbd .wbd-sum .ar { color:#9AA3BE; }
.wbd .wbd-note { margin:-6px 0 0; text-align:center; font:700 12px/1.4 var(--jp, sans-serif); color:#6A7394; }
.wbd .wbd-go { height:52px; border-radius:999px; border:0; background:#2EA8FF; color:#fff; font:900 17px/1 var(--jp, sans-serif); box-shadow:0 5px 0 rgba(46,168,255,.3); }
.wbd .wbd-go:disabled { background:#C9D1E6; box-shadow:none; }
.wbd .wbd-why { margin:-6px 0 0; text-align:center; font:700 13px/1.4 var(--jp, sans-serif); color:#E5484D; min-height:1em; }
.wbd .wbd-why.okk { color:#13A36A; }
`;
function addCss() { if (document.getElementById("wb-css")) return; const st = document.createElement("style"); st.id = "wb-css"; st.textContent = CSS; document.head.appendChild(st); }

// わたす・もらう・数 → { give, get }（n：玉 ⇄ クレジットは わたす 数、リソースが からむ ときは リソースの 数）
export function quote(from, to, n) {
  if (!CUR[from] || !CUR[to] || from === to || !Number.isInteger(n) || n < 1) return null;
  if (from !== "res" && to !== "res") return n % 10 || n > 1e6 ? null : { give: n, get: Math.floor(n * (1 - FEE)) };
  if (from === "res" || n > 100) return null;   // リソースは 売れない
  return { give: n * RES_BUY, get: n };
}

let P = null, bars = [];
const have = (k) => (!P ? null : k === "credits" ? P.credits || 0 : P.known ? P[k] : null);
function paint() {
  for (const el of bars) for (const k of Object.keys(CUR)) {
    const v = have(k), n = el.querySelector(`[data-k="${k}"] .wb-n`); if (!n) continue;
    n.textContent = v == null ? "？" : short(v);
    n.parentElement.title = `${CUR[k].label} ${v == null ? "（配信で 1 回 チャットすると わかります）" : fmt(v)}`;
  }
}
addEventListener("ml-purse", (e) => { P = e.detail; paint(); if (dlg && dlg.open) draw(); });

export function mountWallet(opts = {}) {
  addCss();
  const host = opts.host || document.querySelector("header.top"); if (!host) return null;
  const el = document.createElement("div");
  el.className = "wb" + (opts.theme ? " " + opts.theme : ""); el.setAttribute("role", "group"); el.setAttribute("aria-label", "持って いる お金");
  el.innerHTML = Object.keys(CUR).map((k) => `<span class="wb-c" data-k="${k}">${ICON[k]}<span class="wb-l">${CUR[k].label}</span><span class="wb-n">…</span></span>`).join("")
    + `<button type="button" class="wb-x" aria-label="両替" title="両替">${SWAP_ICON}</button>`;
  el.querySelector(".wb-x").addEventListener("click", () => openSwap());
  if (opts.before && opts.before.parentNode === host) host.insertBefore(el, opts.before); else host.appendChild(el);
  host.classList.add("has-wb"); bars.push(el);   // せまい 画面では 2 段目に 横いっぱい
  P = lastPurse() || P; paint();
  if (!P) setTimeout(() => { if (!P) me().catch(() => {}); }, 1200);   // 画面が 自分で 読まなかった ときだけ
  if (new URLSearchParams(location.search).get("swap") === "1") openSwap();
  return el;
}

// ---------- 両替 ----------
let dlg = null;
const S = { from: "balls", to: "credits", n: 1000 };
const isCoin = () => S.from !== "res" && S.to !== "res";
function maxN() {
  const h = have(S.from); if (h == null) return 0;
  if (isCoin()) return Math.min(1e6, Math.floor(h / 10) * 10);
  return Math.min(100, Math.floor(h / RES_BUY));
}
function draw() {
  const f = dlg.querySelector("form"), q = quote(S.from, S.to, S.n), h = have(S.from);
  const seg = (role, list) => list.map((k) => `<button type="button" data-${role}="${k}" aria-pressed="${S[role] === k}">${ICON[k]}${CUR[k].label}${role === "from" ? `<small>${have(k) == null ? "？" : short(have(k))}</small>` : ""}</button>`).join("");
  const short_ = !q ? "" : h == null ? "玉と リソースが まだ わかりません（配信で 1 回 チャットすると わかります）" : q.give > h ? `足りない：${CUR[S.from].label} あと ${fmt(q.give - h)}` : "";
  f.innerHTML = `<header><h2>両替</h2><button type="button" class="wbd-close" data-close aria-label="とじる">×</button></header>
    <div class="wbd-row"><span>わたす</span><div class="wbd-seg" role="group" aria-label="わたす">${seg("from", Object.keys(CUR).filter((k) => k !== "res"))}</div></div>
    <div class="wbd-row"><span>もらう</span><div class="wbd-seg" role="group" aria-label="もらう">${seg("to", Object.keys(CUR).filter((k) => k !== S.from))}</div></div>
    <div class="wbd-row"><span>数</span><div class="wbd-n"><input id="wbd-n" inputmode="numeric" autocomplete="off" aria-label="${isCoin() ? `わたす ${CUR[S.from].label}` : "リソースの 数"}" value="${S.n}"><span class="u">${isCoin() ? CUR[S.from].label : "リソース"}</span></div></div>
    <div class="wbd-q">${(isCoin() ? [[100, "100"], [1000, "1,000"], [10000, "1万"]] : [[1, "1"], [5, "5"], [10, "10"]]).map(([v, t]) => `<button type="button" data-q="${v}">${t}</button>`).join("")}<button type="button" data-q="max">ぜんぶ</button></div>
    <div class="wbd-sum" aria-live="polite">${q ? `<span>${ICON[S.from]}${fmt(q.give)}</span><span class="ar" aria-label="から">→</span><span>${ICON[S.to]}${fmt(q.get)}</span>` : `<span style="font:700 14px/1.4 var(--jp, sans-serif);color:#6A7394">${isCoin() ? "10 の 倍数で（100 万まで）" : "リソースは 1〜100 こ"}</span>`}</div>
    <p class="wbd-note">${isCoin() ? "手数料 1 割" : `リソース 1 ＝ ${CUR[S.from].label} ${fmt(RES_BUY)}（リソースは 売れない）`}</p>
    <button type="submit" class="wbd-go" ${q && !short_ ? "" : "disabled"}>両替する</button>
    <p class="wbd-why" id="wbd-why" role="status">${short_}</p>`;
}
function openSwap() {
  addCss();
  if (!dlg) {
    dlg = document.createElement("dialog"); dlg.className = "wbd"; dlg.setAttribute("aria-label", "両替"); dlg.innerHTML = `<form method="dialog"></form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) return dlg.close();   // 外を 押すと とじる
      const b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-close")) return dlg.close();
      if (b.dataset.from) { S.from = b.dataset.from; if (S.to === S.from) S.to = Object.keys(CUR).find((k) => k !== S.from); S.n = isCoin() ? 1000 : 1; draw(); }
      else if (b.dataset.to) { S.to = b.dataset.to; S.n = isCoin() ? 1000 : 1; draw(); }
      else if (b.dataset.q) { S.n = b.dataset.q === "max" ? Math.max(isCoin() ? 10 : 1, maxN()) : +b.dataset.q; draw(); }
    });
    dlg.addEventListener("input", (e) => { if (e.target.id !== "wbd-n") return; const v = parseInt(String(e.target.value).replace(/[^\d]/g, ""), 10); S.n = Number.isFinite(v) ? v : 0;
      const pos = e.target.selectionStart; draw(); const i = dlg.querySelector("#wbd-n"); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} });
    dlg.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = dlg.querySelector(".wbd-go"), q = quote(S.from, S.to, S.n); if (!q) return;
      const r = await busy(btn, () => act("money.swap", { from: S.from, to: S.to, n: S.n }));
      draw(); const why = dlg.querySelector("#wbd-why");
      if (r.ok) { why.className = "wbd-why okk"; why.textContent = `${CUR[S.from].label} ${fmt(q.give)} → ${CUR[S.to].label} ${fmt(q.get)}`; }
      else why.textContent = r.wait ? waitText : r.why || "できませんでした";
    });
  }
  draw();
  if (!dlg.open) dlg.showModal();
}
export { openSwap };
