// 倉庫・持っている装備の「マス目」（タルコフの スタッシュの ように：暗い 箱に 同じ 大きさの マス・絵を 大きく・名前は 左上・数は 右下。鹿さんの決め、2026-10-25）
// 使い方：addTkCss() を 1 回。中身は <div class="tk"><p class="tk-h">見出し</p><ul class="tk-g"><li><button class="tc t3">…</button></li></ul></div>
//   描いた あとに padGrids(箱) で 行の あまりを 空きマスで うめる（最後の 行の あとに 空きの 1 行）
//   色：t1〜t5 は ★や 品質（灰・青・むらさき・金・赤）、tg は 採取の 素材、tr は かくし通路の レア
export const TK_CSS = `
.tk { --tk-c:72px; background:#16191F; border-radius:14px; padding:8px; box-shadow:inset 0 0 0 1px #2C313A; }
.tk-h { display:flex; align-items:baseline; gap:8px; margin:10px 2px 6px; font:900 12px/1.2 var(--jp); color:#C9D1DE; letter-spacing:.04em; }
.tk-h:first-child { margin-top:2px; }
.tk-h small { font:600 11px/1 var(--num); color:#7D8799; }
.tk-g { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fill, minmax(var(--tk-c), 1fr)); gap:1px; background:#323844; border:1px solid #323844; }
.tk-g > li { aspect-ratio:1; background:#1E2229; min-width:0; }
.tk-g > li.tk-e { background:repeating-linear-gradient(135deg, #1E2229 0 6px, #20242C 6px 12px); }
.tc { position:relative; width:100%; height:100%; display:grid; place-items:center; padding:0; border:0; border-radius:0; color:#fff; overflow:hidden;
  background:radial-gradient(circle at 50% 45%, rgba(255,255,255,.10), transparent 70%), var(--tb, #2A2F38); }
.tc:hover { filter:brightness(1.18); }
.tc:focus-visible { outline:2px solid #FFD54A; outline-offset:-2px; border-radius:0; }
.tc[aria-pressed="true"] { box-shadow:inset 0 0 0 2px #FFD54A; }
.tc img { width:68%; height:68%; object-fit:contain; image-rendering:pixelated; filter:drop-shadow(0 2px 2px rgba(0,0,0,.45)); }
.tc img.hd { image-rendering:auto; width:80%; height:80%; }   /* 装備の 絵（3D から 撮った 物） */
.tc .tn { position:absolute; left:4px; right:4px; top:3px; font:700 10px/1.2 var(--jp); color:rgba(255,255,255,.88); text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 1px 2px #000; }
.tc .tq { position:absolute; right:4px; bottom:3px; font:600 13px/1 var(--num); color:#fff; text-shadow:0 1px 2px #000; }
.tc .ts { position:absolute; left:4px; bottom:4px; font-size:9px; line-height:1; letter-spacing:-1px; color:var(--tsc, #C9D1DE); text-shadow:0 1px 1px #000; }
.tc .tp { position:absolute; left:4px; bottom:5px; display:flex; gap:2px; } .tc .tp i { width:5px; height:5px; border-radius:1px; background:var(--tsc, #C9D1DE); box-shadow:0 1px 1px #000; }
.tc .tw { position:absolute; right:3px; top:3px; padding:2px 4px; border-radius:4px; background:#22CC88; color:#062; font:900 9px/1 var(--jp); }
.tc .tw.mate { background:#2EA8FF; color:#03243F; }
.tc.tw-on .tn { right:22px; }
.t1 { --tb:#2C3038; --tsc:#B4BBC9; } .t2 { --tb:#1B2D4A; --tsc:#6FA4FF; } .t3 { --tb:#30224A; --tsc:#C08CFF; } .t4 { --tb:#403212; --tsc:#FFC940; } .t5 { --tb:#4A1A24; --tsc:#FF6B80; }
.tg { --tb:#26301F; --tsc:#9BD27A; } .tr { --tb:#3A2852; --tsc:#E3B8FF; box-shadow:inset 0 0 0 1px rgba(227,184,255,.35); }
.tr[aria-pressed="true"] { box-shadow:inset 0 0 0 2px #FFD54A; }
@media (max-width:520px) { .tk { --tk-c:58px; padding:6px; } .tc .tn { font-size:9px; left:3px; right:3px; } .tc .tq { font-size:12px; } }
`;
export function addTkCss() { if (document.getElementById("tk-css")) return; const st = document.createElement("style"); st.id = "tk-css"; st.textContent = TK_CSS; document.head.appendChild(st); }

// 行の あまりを 空きマスで うめる。extra：最後の マス目の あとに 足す 空きの 行の 数
export function padGrids(root, extra = 1) {
  const gs = [...root.querySelectorAll(".tk-g")];
  gs.forEach((g, i) => {
    g.querySelectorAll(".tk-e").forEach((e) => e.remove());
    const cols = getComputedStyle(g).gridTemplateColumns.split(" ").filter(Boolean).length || 1, n = g.children.length;
    const add = ((cols - (n % cols)) % cols) + (i === gs.length - 1 ? cols * extra : 0);
    for (let k = 0; k < add; k++) { const li = document.createElement("li"); li.className = "tk-e"; li.setAttribute("aria-hidden", "true"); g.appendChild(li); }
  });
}
// 幅が かわったら うめなおす（1 回 よぶ）
export function watchPad(get, extra = 1) { let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { const r = get(); if (r) padGrids(r, extra); }, 120); }); }
