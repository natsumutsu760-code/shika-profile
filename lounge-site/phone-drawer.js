// スマホの 下の 引き出し（2026-11-05 鹿さんの カード「スマホの一覧を引き出しに」。mono-link-ui の 決まり：見る物と えらぶ 一覧が ある 画面は、一覧を 下の 引き出しに）
// ふだんは 下に 帯 1 本（いま えらんで いる 物）。帯を 押すと 一覧が 開き、もう 一度 押すか、一覧の 中で えらぶと しまう。PC では 何も しない
// 使い方：const d = phoneDrawer(一覧の 入れ物, { max: 760 }); d.label(帯に 出す HTML)
// 色は 入れ物の 親の CSS 変数 --pd-bg・--pd-fg・--pd-line で かえられる（DEEP LINK は 暗い 色）
const CSS = (max) => `
.pd-bar { display:none; }
@media (max-width:${max}px) {
  body.pd-on { padding-bottom:calc(64px + env(safe-area-inset-bottom)); }
  .pd-bar { display:flex; align-items:center; gap:10px; position:fixed; left:0; right:0; bottom:0; z-index:31; min-height:56px; padding:8px 16px calc(8px + env(safe-area-inset-bottom)); border:0; border-top:1.5px solid var(--pd-line, #DCE3F0); background:var(--pd-bg, #fff); color:var(--pd-fg, #1B2340); font-family:inherit; font-weight:700; font-size:15px; line-height:1.2; text-align:left; box-shadow:0 -10px 24px -16px rgba(27,35,64,.45); cursor:pointer; }
  .pd-bar .pd-lab { flex:1; min-width:0; display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; }
  .pd-bar .pd-go { flex:none; font-size:13px; opacity:.8; }
  .pd-list { position:fixed !important; left:0; right:0; bottom:calc(56px + env(safe-area-inset-bottom)); z-index:30; max-height:62vh; overflow:auto !important; margin:0 !important; border-radius:20px 20px 0 0; border-top:1.5px solid var(--pd-line, #DCE3F0); background:var(--pd-bg, #fff); box-shadow:0 -14px 30px -18px rgba(27,35,64,.5); transform:translateY(calc(100% + 70px)); visibility:hidden; transition:transform .2s ease, visibility 0s .2s; }
  body.pd-open .pd-list { transform:none; visibility:visible; transition:transform .2s ease; }
}
@media (prefers-reduced-motion:reduce) { .pd-list, body.pd-open .pd-list { transition:none; } }`;

export function phoneDrawer(list, { max = 760 } = {}) {
  if (!list) return { label() {}, close() {} };
  if (!document.getElementById("pd-css")) { const st = document.createElement("style"); st.id = "pd-css"; st.textContent = CSS(max); document.head.appendChild(st); }
  list.classList.add("pd-list"); document.body.classList.add("pd-on");
  const bar = document.createElement("button"); bar.type = "button"; bar.className = "pd-bar"; bar.setAttribute("aria-expanded", "false");
  bar.innerHTML = `<span class="pd-lab"></span><span class="pd-go">ひらく ▲</span>`;
  list.parentNode.insertBefore(bar, list.nextSibling);   // 色の 変数が 届く ように 同じ 親の 中へ
  const set = (open) => { document.body.classList.toggle("pd-open", open); bar.setAttribute("aria-expanded", String(open)); bar.lastChild.textContent = open ? "しまう ▼" : "ひらく ▲"; };
  bar.addEventListener("click", () => set(!document.body.classList.contains("pd-open")));
  list.addEventListener("click", (e) => { if (e.target.closest("button, a")) setTimeout(() => set(false), 0); });   // えらんだら しまう（ページの 処理の あとで）
  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  return { label(html) { bar.firstChild.innerHTML = html; }, close() { set(false); } };
}
