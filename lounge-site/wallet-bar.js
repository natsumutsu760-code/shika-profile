// 上の 通貨の 札（玉・アメジスト・クレジット）と 両替。ソーシャルゲームの ように MONO LINK の どの 画面にも 出す（鹿さんの決め、2026-10-25）
// 使い方：mountWallet()。header.top の 右に 札を ならべる。数は lounge-client.js の me()・act() の 答えから（"ml-purse"）。画面が 読まなければ 自分で me()
//   サイト（index.html）からも import して 使う（{ host, before, theme: "site" }。before の 前に 入れる）。DEEP LINK/: は { host, theme: "dark" }
// ⇄ を 押すと 交換の 窓（2026-11-07 鹿さん「このポップアップから交換できるようにしてください。」）：数を 入れて 2 回 押すと、
//   鹿物語に !貸し玉・!換金・!アメジスト交換 を 送る（配信ページの「ほか」の 両替の ボタンと 同じ /api/cmd）。玉の 出し入れは 前と 同じく 鹿物語が する
//   （2026-10-28 の 決め「玉と クレジットは 鹿物語の チャットで」の しくみは そのまま。配信の OBS が つながって いない ときは 門番が ことわる）
import { me, lastPurse, sendCmd } from "./lounge-client.js";

// 交換の 数（門番の lounge-money.js の CASH・AME_PRICE と 鹿物語と 同じ 数）
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
.wbd .wbd-row { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px 10px; padding:12px 14px; border-radius:16px; background:#F3F6FC; }
.wbd .wbd-h { grid-column:1 / -1; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:4px 8px; min-width:0; }
.wbd .wbd-h b { font:800 15px/1.3 var(--jp, sans-serif); white-space:nowrap; }
.wbd .wbd-sum { display:flex; align-items:center; gap:6px; margin-left:auto; font:600 16px/1.2 var(--num, sans-serif); white-space:nowrap; }
.wbd .wbd-sum svg { width:18px; height:18px; vertical-align:-3px; margin-right:3px; } .wbd .wbd-sum .ar { color:#9AA3BE; }
.wbd .wbd-in { display:flex; align-items:center; gap:6px; min-width:0; }
.wbd .wbd-in input { flex:1 1 auto; width:100%; min-width:0; height:40px; padding:0 10px; border-radius:12px; border:1.5px solid #DCE3F0; background:#fff; color:#1B2340; font:700 18px/1 var(--num, sans-serif); }
.wbd .wbd-in span { font:700 14px/1 var(--jp, sans-serif); color:#6A7394; white-space:nowrap; }
.wbd .wbd-go { width:120px; height:40px; padding:0 8px; border-radius:999px; border:0; background:#13A36A; color:#fff; font:800 15px/1 var(--jp, sans-serif); white-space:nowrap; }
.wbd .wbd-go.sure { background:#1B2340; font-size:13px; } .wbd .wbd-go:disabled { background:#C9D1E3; }
.wbd .wbd-no { grid-column:1 / -1; margin:0; font:700 13px/1.4 var(--jp, sans-serif); color:#E5484D; } .wbd .wbd-no:empty { display:none; }
.wbd .wbd-why { margin:-4px 0 0; text-align:center; font:700 13px/1.4 var(--jp, sans-serif); color:#6A7394; min-height:1em; }
.wbd .wbd-why.ng { color:#E5484D; } .wbd .wbd-why.okk { color:#13A36A; }
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
addEventListener("ml-purse", (e) => { P = e.detail; paint(); if (dlg && dlg.open) sync(); });   // 窓の 数は 入れて いる 途中でも 消さない（足りるかだけ 見直す）

export function mountWallet(opts = {}) {
  addCss();
  const host = opts.host || document.querySelector("header.top"); if (!host) return null;
  const el = document.createElement("div");
  el.className = "wb" + (opts.theme ? " " + opts.theme : ""); el.setAttribute("role", "group"); el.setAttribute("aria-label", "持って いる お金");
  el.innerHTML = Object.keys(CUR).map((k) => `<span class="wb-c" data-k="${k}">${ICON[k]}<span class="wb-l">${CUR[k].label}</span><span class="wb-n">…</span></span>`).join("")
    + `<button type="button" class="wb-x" aria-label="玉と クレジットの 交換" title="交換">${SWAP_ICON}</button>`;
  el.querySelector(".wb-x").addEventListener("click", () => openSwap());
  if (opts.before && opts.before.parentNode === host) host.insertBefore(el, opts.before); else host.appendChild(el);
  host.classList.add("has-wb"); bars.push(el);   // せまい 画面では 2 段目に 横いっぱい
  P = lastPurse() || P; paint();
  if (!P) setTimeout(() => { if (!P) me().catch(() => {}); }, 1200);   // 画面が 自分で 読まなかった ときだけ
  if (new URLSearchParams(location.search).get("swap") === "1") openSwap();
  return el;
}

// ---------- 交換の 窓（2026-11-07 鹿さん。前は 案内の 字だけ）----------
// 行：借りる（玉の 数）・換金（払う 玉の 数。28 玉ずつ）・アメジスト（もらう 数）。数は 鹿物語の コマンドと 同じ 意味
const ROWS = [
  { k: "lend", cmd: "!貸し玉", title: "玉を 借りる", unit: "玉", def: 100, max: 999999, go: "借りる", deal: (n) => ({ n, pay: ["credits", n * CASH.lend], get: ["balls", n] }) },
  { k: "cash", cmd: "!換金", title: "玉を 換金", unit: "玉", def: 280, step: CASH.perBalls, max: 9999999, go: "換金する",
    deal: (n) => { const u = Math.floor(n / CASH.perBalls); return { n: u * CASH.perBalls, pay: ["balls", u * CASH.perBalls], get: ["credits", u * CASH.credits], min: u < 1 ? `${CASH.perBalls} 玉から 換金できます` : "" }; } },
  { k: "ame", cmd: "!アメジスト交換", title: "アメジストに 交換", unit: "こ", def: 1, max: 999999, go: "交換する", deal: (n) => ({ n, pay: ["balls", n * AME_PRICE], get: ["res", n] }) },
];
const V = {};
let dlg = null, sending = false;
const num = (k) => { const R = ROWS.find((r) => r.k === k), v = Math.floor(Number(V[k])); return Number.isFinite(v) ? Math.max(0, Math.min(R.max, v)) : 0; };
function draw() {
  const f = dlg.querySelector("form");
  f.innerHTML = `<header><h2>交換</h2><button type="button" class="wbd-close" data-close aria-label="とじる">×</button></header>
    ${ROWS.map((R) => `<div class="wbd-row" data-row="${R.k}"><div class="wbd-h"><b>${R.title}</b><span class="wbd-sum"></span></div>
      <label class="wbd-in"><input type="number" inputmode="numeric" min="1" max="${R.max}" step="${R.step || 1}" value="${V[R.k] ?? R.def}" aria-label="${R.title}の 数"><span>${R.unit}</span></label>
      <button type="button" class="wbd-go" data-go="${R.k}">${R.go}</button><p class="wbd-no"></p></div>`).join("")}
    <p class="wbd-why" role="status">配信中に 使えます</p>`;
  for (const R of ROWS) V[R.k] ??= R.def;
  sync();
}
// 入れた 数に 合わせて 出す 物・もらう 物と、足りるかを 書き直す（持って いる 数が わからない ときは 鹿物語に まかせる）
function sync() {
  if (!dlg) return;
  for (const R of ROWS) {
    const row = dlg.querySelector(`[data-row="${R.k}"]`); if (!row) continue;
    const d = R.deal(num(R.k)), h = have(d.pay[0]), lack = h != null && d.pay[1] > h ? (d.pay[0] === "balls" ? `玉が あと ${fmt(d.pay[1] - h)} 足りません` : `クレジットが あと ${fmt(d.pay[1] - h)} 足りません`) : "";
    row.querySelector(".wbd-sum").innerHTML = `<span>${ICON[d.pay[0]]}${fmt(d.pay[1])}</span><span class="ar" aria-label="から">→</span><span>${ICON[d.get[0]]}${fmt(d.get[1])}</span>`;
    const no = d.min || (d.n < 1 ? "数を 入れて ください" : lack), b = row.querySelector(".wbd-go");
    row.querySelector(".wbd-no").textContent = no;
    b.disabled = sending || !!no;
    if (b.disabled && b.classList.contains("sure")) unsure(b);
  }
}
function unsure(b) { b.classList.remove("sure"); clearTimeout(b._t); b.textContent = ROWS.find((r) => r.k === b.dataset.go).go; }
function say(t, cls) { const w = dlg.querySelector(".wbd-why"); w.textContent = t; w.className = "wbd-why" + (cls ? " " + cls : ""); }
async function go(b) {
  const R = ROWS.find((r) => r.k === b.dataset.go), d = R.deal(num(R.k));
  if (!b.classList.contains("sure")) {   // 2 回 押して 決める（配信ページの「ほか」の 両替と 同じ）
    dlg.querySelectorAll(".wbd-go.sure").forEach(unsure);
    b.classList.add("sure"); b.textContent = "もう一度 押す"; b._t = setTimeout(() => unsure(b), 3500); return;
  }
  unsure(b); sending = true; sync(); say("送って います…");
  const text = `${R.cmd} ${d.n}`, r = await sendCmd(text).catch(() => ({ ok: false, why: "いまは つながりません。少し 待って から もう一度" }));
  sending = false; sync();
  if (r && r.ok) { say(`送りました：${text}（数秒で 反映されます）`, "okk"); [4000, 12000].forEach((ms) => setTimeout(() => me().catch(() => {}), ms)); }
  else say((r && r.why) || "送れませんでした", "ng");
}
function openSwap() {
  addCss();
  if (!dlg) {
    dlg = document.createElement("dialog"); dlg.className = "wbd"; dlg.setAttribute("aria-label", "交換"); dlg.innerHTML = `<form method="dialog"></form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (e.target === dlg || (b && b.hasAttribute("data-close"))) { dlg.close(); return; }
      if (b && b.dataset.go && !b.disabled) go(b);
    });
    dlg.addEventListener("input", (e) => { const row = e.target.closest("[data-row]"); if (row && e.target.matches("input")) { V[row.dataset.row] = e.target.value; sync(); } });
    dlg.addEventListener("submit", (e) => e.preventDefault());   // 数の 欄で Enter を 押しても 窓を 閉じない
  }
  draw();
  if (!dlg.open) dlg.showModal();
}
export { openSwap };
