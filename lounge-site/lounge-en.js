// 英語の 画面（鹿さんの頼み、2026-10-25：プライベートラウンジ・派遣まわりの 英語ローカライズ）
// 言葉は MONO LINK の サイトと 同じ 決まり：ml-lang が "en"（まだ えらんで いなければ、ブラウザの 言葉が 日本語 以外）なら 英語
// しくみも サイトと 同じ：画面に 出た 日本語の 字を 辞書で 置きかえる（あとから 出た 字も MutationObserver で）。ページの プログラムは 日本語の まま
// 使い方：ページの いちばん 上の import に「import "./lounge-en.js";」。辞書（lounge-en-dict.js）は 英語の ときだけ 読み込む
// 辞書の 引き方は lounge-en-core.js
// 配信ページの 枠の 中（サイトの EN／日本語 ボタン）で かえても、ほかの 窓の 中でも、同じ 言葉に そろう（storage の 知らせ）
// 訳せなかった 字は window.__enMiss に ためる（撮って 埋める ため）。人が つけた 名前・コメントは data-notr で 置きかえない
import { JA, tr, setDict, hasDict } from "./lounge-en-core.js";
export { tr };
const SKIP = "[data-notr], script, style, textarea, datalist, [contenteditable]";
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
const langOf = () => { const v = ls("ml-lang"); return v === "en" || (v == null && !/^ja/i.test(navigator.language || "ja")) ? "en" : "ja"; };

export let LANG = langOf();
let loading = null;
const miss = (window.__enMiss = window.__enMiss || new Set());
// ページの プログラムから 使う とき（キャンバスの 字・文字送り など）：訳せなければ 日本語の まま。enReady は 辞書を 読み終えたら（日本語なら すぐ）
export const t = (s) => (LANG === "en" ? tr(s) ?? s : s);
let readyOk; export const enReady = new Promise((r) => (readyOk = r));

// ---- 画面の 字を 置きかえる ----
const ORIG = new WeakMap();
const skip = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; return !e || !!e.closest(SKIP); };
function node(n) {
  if (!n.isConnected || skip(n)) return;
  const v = n.nodeValue, o = ORIG.get(n); if (o && o.en === v) return;
  if (!JA.test(v)) return;
  const r = tr(v); if (r == null) { if (!mixed(n)) miss.add(v.trim()); return; }
  let en = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0];
  // 日本語は 太字などの 前後に 空白が いらないが、英語は いる（「<b>★1</b>が とどいた」→「★1 arrived」）
  const pv = n.previousSibling, nx = n.nextSibling;
  if (pv && pv.nodeType === 1 && /^[A-Za-z0-9(“'+−-]/.test(en)) en = " " + en;
  if (nx && nx.nodeType === 1 && /[A-Za-z0-9).,:!?”%]$/.test(en)) en += " ";
  ORIG.set(n, { ja: v, en }); n.nodeValue = en;
}
// <b> などで 分かれた 文（「振れる ポイントが <b>3</b> ある」）：字と 数字だけの 入れ物（<b>3</b>）が つづく 所を まとめて 引く。入れ物は # に して、英語の 中で そのまま 使う
const INLINE = /^(B|STRONG|EM|I|SPAN|SMALL|MARK|CODE)$/;
const numBox = (k) => k.nodeType === 1 && INLINE.test(k.tagName) && !k.children.length && !JA.test(k.textContent) && /\d/.test(k.textContent);
function mixed(n) {
  const el = n.parentElement; if (!el || skip(el)) return false;
  const ok = (k) => k.nodeType === 3 || numBox(k);
  let a = n, b = n;
  while (a.previousSibling && ok(a.previousSibling)) a = a.previousSibling;
  while (b.nextSibling && ok(b.nextSibling)) b = b.nextSibling;
  const run = []; for (let k = a; ; k = k.nextSibling) { run.push(k); if (k === b) break; }
  if (run.length < 2 || run.length > 15 || !run.some(numBox)) return false;
  let key = ""; const seq = [];
  for (const k of run) {
    if (k.nodeType === 3) { const o = ORIG.get(k); key += (o && o.en === k.nodeValue ? o.ja : k.nodeValue).replace(/\d[\d,]*(?:\.\d+)?/g, (m) => (seq.push(m), "#")); }
    else { key += "#"; seq.push(k); }
  }
  let en = tr(key); if (en == null) return false;
  en = (/^\s/.test(key) ? " " : "") + en.trim() + (/\s$/.test(key) ? " " : "");
  let i = 0; const out = [];
  for (const bit of en.split(/(#\d?)/)) {
    if (!bit) continue;
    const m = bit.match(/^#(\d)?$/); if (!m) { out.push(document.createTextNode(bit)); continue; }
    const x = seq[m[1] ? m[1] - 1 : i++]; out.push(x == null ? document.createTextNode("") : typeof x === "string" ? document.createTextNode(x) : x);
  }
  const mark = document.createTextNode(""); el.insertBefore(mark, a);   // 目じるしの 前に 順に 入れる（使いまわす 入れ物も 順どおりに うごく）
  for (const x of out) el.insertBefore(x, mark);
  for (const k of run) if (!out.includes(k) && k.parentNode === el) k.remove();
  mark.remove();
  const o = ORIG.get(el) || {}; (o.runs ||= []).push({ kids: run, en: out }); ORIG.set(el, o);
  return true;
}
function attrs(el) {
  if (skip(el)) return;
  const o = ORIG.get(el) || {};
  for (const a of ATTRS) {
    const v = el.getAttribute(a); if (v == null || (o[a] && o[a].en === v) || !JA.test(v)) continue;
    const r = tr(v); if (r == null) { miss.add(v.trim()); continue; }
    o[a] = { ja: v, en: r }; el.setAttribute(a, r);
  }
  ORIG.set(el, o);
}
function walk(root) {
  if (root.nodeType === 3) return node(root);
  if (root.nodeType !== 1 || skip(root)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; let n; while ((n = w.nextNode())) list.push(n);
  list.forEach(node);   // 先に あつめる（まとめて 引いた 文は 中の 字が 入れかわる）
  attrs(root); root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(attrs);
}
function back(root) {
  [root, ...root.querySelectorAll("*")].forEach((el) => { const o = ORIG.get(el); if (!o || !o.runs) return;
    for (const r of o.runs.splice(0).reverse()) { if (!r.en.every((x) => x.parentNode === el)) continue; const mark = document.createTextNode(""); el.insertBefore(mark, r.en[0]); for (const k of r.kids) el.insertBefore(k, mark); for (const x of r.en) if (!r.kids.includes(x)) x.remove(); mark.remove(); } });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, o;
  while ((n = w.nextNode())) { o = ORIG.get(n); if (o && o.en === n.nodeValue) n.nodeValue = o.ja; }
  root.querySelectorAll("*").forEach((el) => { const o = ORIG.get(el); if (o) for (const a of ATTRS) if (o[a] && el.getAttribute(a) === o[a].en) el.setAttribute(a, o[a].ja); });
}
const obs = new MutationObserver((ms) => {
  for (const m of ms) {
    if (m.type === "childList") m.addedNodes.forEach(walk);
    else if (m.type === "characterData") node(m.target);
    else if (m.type === "attributes") attrs(m.target);
  }
});
let docTitle = null;
async function apply() {
  document.documentElement.lang = LANG;
  drawBtn();
  if (LANG !== "en") { obs.disconnect(); back(document.body); if (docTitle != null) document.title = docTitle; readyOk(); dispatchEvent(new CustomEvent("ml-lang", { detail: LANG })); return; }
  if (!hasDict()) {
    loading ||= import("./lounge-en-dict.js").then((d) => setDict(d.WORDS, d.RULES), () => { loading = null; });
    await loading; readyOk(); if (!hasDict() || LANG !== "en") return;
  }
  walk(document.body);
  if (docTitle == null) docTitle = document.title;
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  dispatchEvent(new CustomEvent("ml-lang", { detail: LANG }));
}
export function setLang(v) { LANG = v === "en" ? "en" : "ja"; ls("ml-lang", LANG); apply(); }
// ほかの 窓（配信ページの EN／日本語 ボタン など）で かえた とき
addEventListener("storage", (e) => { if (e.key === "ml-lang" && langOf() !== LANG) { LANG = langOf(); apply(); } });

// ---- 上の 見出しの EN／日本語 ボタン（配信ページの 枠の 中では 見出しごと かくれる。サイトの ボタンが 同じ 役目） ----
const CSS = `.lgb { order:8; margin-left:auto; height:32px; padding:0 12px; border-radius:999px; border:1.5px solid #DCE3F0; background:#fff; color:#1B2340; font:700 13px/1 "Fredoka", "Zen Maru Gothic", sans-serif; white-space:nowrap; cursor:pointer; }
.lgb:hover { border-color:#2EA8FF; }
header:has(.wb) > .lgb { margin-left:0; }
header.bar > .lgb { background:rgba(255,255,255,.06); border-color:rgba(120,255,220,.25); color:#D8FFF4; }
@media (max-width:620px) { header:has(.wb) > .lgb { margin-left:auto; } }
html[lang="en"] body > header.top > small { flex:1 1 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
html[lang="en"] .test summary h2::after { content:"(open)"; } html[lang="en"] .test[open] summary h2::after { content:"(close)"; }`;   // CSS の 中の 字（ガンビットの「ためしに戦う」）   // 英語は 見出しの 道しるべが 長いので、ボタンを 1 行目に のこす
let btn = null;
function drawBtn() {
  if (!btn) return;
  btn.textContent = LANG === "en" ? "日本語" : "EN"; btn.lang = LANG === "en" ? "ja" : "en";
  btn.setAttribute("aria-label", LANG === "en" ? "日本語にする" : "Switch to English");
}
function mountBtn() {
  const host = document.querySelector("body > header.top, header.bar, header.top"); if (!host || btn) return;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  btn = document.createElement("button"); btn.type = "button"; btn.className = "lgb"; btn.setAttribute("data-notr", "");
  btn.addEventListener("click", () => setLang(LANG === "en" ? "ja" : "en"));
  host.appendChild(btn); drawBtn();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { mountBtn(); apply(); }, { once: true });
else { mountBtn(); apply(); }
