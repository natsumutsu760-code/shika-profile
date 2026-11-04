// 作業台・工房の「えらんだ 物を 作る」ポップアップ（鹿さん 2026-11-05「クラフトの最下部に製作ボタンがあり自動スクロールするもののプレイフィールを損ないます。選択したもののクラフト実施をポップアップで出してください。」）
// 一覧で えらぶ → この ポップアップで 作る。前は 一覧の 下の 欄へ 自動で 動いて いた（やめた）
//   const pop = craftPop(document.getElementById("pop"));   // <dialog id="pop" class="cpop"> の 中に <section id="detail">
//   pop.open() … 開く（もう 開いて いれば そのまま）・pop.close()
// スマホ（はば 860px まで）は 下から 出る、PC は まんなか。うしろを 押す・× ・Esc で 閉じる
const CSS = `
dialog.cpop { border:0; padding:0; background:transparent; color:inherit; width:min(var(--cpop-w, 620px), calc(100vw - 32px)); max-height:min(86vh, 860px); overflow:visible; }
dialog.cpop::backdrop { background:rgba(20,22,74,.38); }
dialog.cpop .cpop-in { position:relative; background:#fff; border-radius:26px; box-shadow:0 18px 50px rgba(20,22,74,.28); max-height:inherit; overflow:auto; overscroll-behavior:contain; padding:clamp(16px, 3vw, 22px); padding-top:48px; }
dialog.cpop .cpop-x { position:absolute; right:10px; top:10px; z-index:2; width:38px; height:38px; border-radius:50%; border:0; background:#EEF2F9; color:#14164A; font:700 20px/1 sans-serif; display:grid; place-items:center; cursor:pointer; }
dialog.cpop .cpop-x:hover { background:#E1E8F4; }
dialog.cpop .detail { box-shadow:none; background:none; padding:0; border-radius:0; }
dialog.cpop[open] { animation:cpop-in .2s ease-out; }
@keyframes cpop-in { from { opacity:0; transform:translateY(14px) scale(.98); } }
@media (max-width:860px) {
  dialog.cpop { width:100%; max-width:100%; margin:auto 0 0; max-height:88vh; }
  dialog.cpop .cpop-in { border-radius:26px 26px 0 0; padding-bottom:calc(18px + env(safe-area-inset-bottom)); }
  @keyframes cpop-in { from { transform:translateY(40px); opacity:.4; } }
}
@media (prefers-reduced-motion:reduce) { dialog.cpop[open] { animation:none; } }
`;
let cssOn = false;
export function craftPop(dlg, { label = "作る", width } = {}) {
  if (!cssOn) { cssOn = true; const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); }
  dlg.classList.add("cpop"); dlg.setAttribute("aria-label", label); if (width) dlg.style.setProperty("--cpop-w", width);
  const x = dlg.querySelector(".cpop-x");
  if (x) x.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });   // うしろ（中の 白い 板の 外）を 押すと 閉じる
  return {
    open() { if (!dlg.open) { dlg.showModal(); const inn = dlg.querySelector(".cpop-in"); if (inn) inn.scrollTop = 0; } },
    close() { if (dlg.open) dlg.close(); },
    get isOpen() { return dlg.open; },
  };
}
