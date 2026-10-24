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
const TAB_URL = { ステータス: "status.html", スキルツリー: "skilltree.html", ガンビット: "gambit.html", 装備: "equip.html", 冒険: "dungeon.html", なかま: "tame.html" };
export function linkTabs(root = document) {
  root.querySelectorAll('.tabs [role="tab"]').forEach((b) => {
    const u = TAB_URL[b.textContent.trim()];
    if (u && b.getAttribute("aria-selected") !== "true") b.addEventListener("click", () => { location.href = u; });
  });
}
// まだ ペットが いない・職業が まだ の ときの 案内（どの ペットの 画面でも 同じ）
export function gateHtml(ME, esc) {
  const mp = ME.pets && ME.pets[0];
  if (ME.denied || ME.ok === false) return `<section class="panel gate"><h2>入れません</h2><p>${esc(ME.why || "もう 1 回 開いて ください")}</p>${ME.login ? `<a class="jelly sky go" href="/">MONO LINK で ログイン</a>` : ""}</section>`;
  if (!mp) return `<section class="panel gate"><h2>まず 1 匹目を むかえる</h2><p>6 つの 質問で、いっしょに 冒険する 子が 決まります</p><a class="jelly sky go" href="quiz.html">性格診断へ</a></section>`;
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
