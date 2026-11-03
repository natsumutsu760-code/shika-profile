// 上の 通貨の 札（玉・アメジスト・クレジット）と 両替。ソーシャルゲームの ように MONO LINK の どの 画面にも 出す（鹿さんの決め、2026-10-25）
// 使い方：mountWallet()。header.top の 右に 札を ならべる。数は lounge-client.js の me()・act() の 答えから（"ml-purse"）。画面が 読まなければ 自分で me()
//   サイト（index.html）からも import して 使う（{ host, before, theme: "site" }。before の 前に 入れる）。DEEP LINK/: は { host, theme: "dark" }
// 札を 押すと 両替（玉 ⇄ クレジットは 1 対 1・手数料 1 割。計算は 門番の lounge-money.js と 同じ）。アメジストは 両替では 買えない・売れない
//   （鹿さんの決め、2026-10-28。買うのは 鹿物語の !アメジスト交換 だけ）
import { me, lastPurse } from "./lounge-client.js";

// 玉と クレジット・アメジストの 交換は 鹿物語の チャットだけ（2026-10-28 の 決め。MONO LINK の 両替の 画面では 玉を 扱わない）。ここは 案内の 字だけ（門番の lounge-money.js の CASH・AME_PRICE と 同じ 数）
const AME_PRICE = 500, CASH = { perBalls: 28, credits: 100, lend: 4 };
const CUR = { balls: { label: "玉", c: "#2EA8FF" }, res: { label: "アメジスト", c: "#8E6CFF" }, credits: { label: "クレジット", c: "#13A36A" } };
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
.wbd .wbd-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px 12px; padding:12px 14px; border-radius:16px; background:#F3F6FC; }
.wbd .wbd-row code { font:800 15px/1.3 var(--jp, sans-serif); color:#1B2340; white-space:nowrap; user-select:all; }
.wbd .wbd-sum { display:flex; align-items:center; gap:8px; margin-left:auto; font:600 19px/1.2 var(--num, sans-serif); white-space:nowrap; }
.wbd .wbd-sum svg { width:20px; height:20px; vertical-align:-4px; margin-right:3px; } .wbd .wbd-sum .ar { color:#9AA3BE; }
.wbd .wbd-why { margin:-6px 0 0; text-align:center; font:700 13px/1.4 var(--jp, sans-serif); color:#E5484D; min-height:1em; }
.wbd .wbd-why.okk { color:#13A36A; }
`;
function addCss() { if (document.getElementById("wb-css")) return; const st = document.createElement("style"); st.id = "wb-css"; st.textContent = CSS; document.head.appendChild(st); }

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
    + `<button type="button" class="wb-x" aria-label="玉と クレジットの 交換の 案内" title="交換の 案内">${SWAP_ICON}</button>`;
  el.querySelector(".wb-x").addEventListener("click", () => openSwap());
  if (opts.before && opts.before.parentNode === host) host.insertBefore(el, opts.before); else host.appendChild(el);
  host.classList.add("has-wb"); bars.push(el);   // せまい 画面では 2 段目に 横いっぱい
  P = lastPurse() || P; paint();
  if (!P) setTimeout(() => { if (!P) me().catch(() => {}); }, 1200);   // 画面が 自分で 読まなかった ときだけ
  if (new URLSearchParams(location.search).get("swap") === "1") openSwap();
  return el;
}

// ---------- 交換の 案内（前は 両替の 画面。2026-10-28 の 決めで 玉と クレジットの やりとりは 鹿物語の チャットだけに）----------
let dlg = null;
function draw() {
  const f = dlg.querySelector("form"), row = (cmd, a, b) => `<div class="wbd-row"><code>${cmd}</code><div class="wbd-sum"><span>${a}</span><span class="ar" aria-label="から">→</span><span>${b}</span></div></div>`;
  f.innerHTML = `<header><h2>交換は 配信の チャットで</h2><button type="button" class="wbd-close" data-close aria-label="とじる">×</button></header>
    ${row("!貸し玉 数", `${ICON.credits}${CASH.lend}`, `${ICON.balls}1`)}
    ${row("!換金 数", `${ICON.balls}${CASH.perBalls}`, `${ICON.credits}${CASH.credits}`)}
    ${row("!アメジスト交換 数", `${ICON.balls}${fmt(AME_PRICE)}`, `${ICON.res}1`)}`;
}
function openSwap() {
  addCss();
  if (!dlg) {
    dlg = document.createElement("dialog"); dlg.className = "wbd"; dlg.setAttribute("aria-label", "交換の 案内"); dlg.innerHTML = `<form method="dialog"></form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => { if (e.target === dlg || (e.target.closest("button") && e.target.closest("button").hasAttribute("data-close"))) dlg.close(); });
  }
  draw();
  if (!dlg.open) dlg.showModal();
}
export { openSwap };
