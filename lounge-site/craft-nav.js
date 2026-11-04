// クラフトの 施設を 1 回で 切りかえる 札（作業台・工房・おやつ工房）
// 鹿さんの 頼み（2026-11-05）：「派遣ペットスタッシュラウンジの切り替えタブにクラフトを加えてください。いちいち地下へ行き施設を選択するのは煩わしいです。」
// - 画面の 頭の 見出し（「作業台 Lv12」など）を この 札の 列に 置きかえる（行は ふやさない・名前を 2 回 出さない）。いまの 施設の 札に Lv（#lv）を 入れる
// - 最後に 使った 施設を 覚える（localStorage の ml-craft）。配信ページの「クラフト」タブは それを 開く
export const CRAFT_PAGES = [
  ["bench", "作業台", "bench.html", "#E59A00"],
  ["workshop", "工房", "workshop.html", "#E0662E"],
  ["snack", "おやつ工房", "hideout.html?f=snack&craft=1", "#C98A3A"],
];

const CSS = `
.cnav { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.cnav a { display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:6px 14px; border-radius:999px; border:2px solid var(--line, #DCE3F0); background:#fff; color:var(--ink, #1B2340); font:700 15px/1.2 var(--jp, inherit); text-decoration:none; }
.cnav a:hover { border-color:var(--c); }
.cnav a[aria-current="page"] { background:var(--c); border-color:var(--c); color:#fff; }
.cnav a small { font:700 12px/1 var(--num, inherit); opacity:.92; }
.cnav-sr { position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
`;

// cur：いまの 施設（bench・workshop・snack）。h1：置きかえる 見出し（なければ main の はじめの h1）
export function mountCraftNav(cur, h1 = document.querySelector("main h1")) {
  try { localStorage.setItem("ml-craft", cur); } catch (e) {}
  if (!h1) return null;
  if (!document.getElementById("cnav-css")) { const st = document.createElement("style"); st.id = "cnav-css"; st.textContent = CSS; document.head.appendChild(st); }
  const nav = document.createElement("nav");
  nav.className = "cnav"; nav.setAttribute("aria-label", "クラフト");
  nav.innerHTML = CRAFT_PAGES.map(([id, name, href, c]) => `<a href="${href}" style="--c:${c}"${id === cur ? ' aria-current="page"' : ""}>${name}</a>`).join("");
  const lv = h1.querySelector("#lv"), here = nav.querySelector('[aria-current="page"]');
  if (lv && here) here.appendChild(lv);   // ページは あとで document.getElementById("lv") に Lv を 書く（うつしても 同じ）
  h1.classList.add("cnav-sr");            // 見出しは 読み上げ用に のこす
  h1.after(nav);
  return nav;
}
