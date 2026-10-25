// 装備の 画面：武器の アタッチメント（先っぽ・持ち手。鹿さんの頼み、2026-10-25）。equip.html から 使う
// - mergeAtt(ME)：門番の 記録の 武器に 付いて いる アタッチメントを 入れる（装備で ふえる 分・くらべるに 入る）
// - attHtml(ME, it, { away })：えらんだ 武器の 下に 出す 欄。attClick(button, ME, reload, toast)：押した とき（扱ったら true）
import { ATT_KINDS, attBase, withAtt } from "./workshop.js";
import { OPS } from "./equip.js";
import { wsIcon } from "./ws-icons.js";
import { act, busy, waitText } from "./lounge-client.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CSS = `
.att { display:grid; gap:8px; margin-top:12px; padding:12px; border-radius:16px; background:#FFF6F0; box-shadow:inset 0 0 0 1.5px #FFD9C4; }
.att h3 { margin:0; font:900 13px/1.2 var(--jp); color:#A8461A; }
.att .ar { display:grid; grid-template-columns:44px 34px minmax(0, 1fr) auto; gap:8px; align-items:center; }
.att .ar > small { font:900 11.5px/1.2 var(--jp); color:var(--soft); }
.att .ai { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:#fff; } .att .ai svg { width:28px; height:28px; }
.att .ai.no { background:repeating-linear-gradient(45deg, #FFF 0 5px, #FBEFE8 5px 10px); box-shadow:inset 0 0 0 1.5px #F3D2C0; }
.att .an b { display:block; font:800 13px/1.3 var(--jp); } .att .an span { display:block; font:700 11.5px/1.35 var(--jp); color:#1E6FB0; }
.att .an em { font-style:normal; font:700 11.5px/1.3 var(--jp); color:var(--soft); }
.att button.ab { border:1.5px solid #F3C2A6; background:#fff; border-radius:999px; padding:7px 12px; font:800 12px/1 var(--jp); color:#A8461A; white-space:nowrap; }
.att .pick { display:grid; gap:6px; padding:8px; border-radius:12px; background:#fff; }
.att .pick button { display:grid; grid-template-columns:30px minmax(0, 1fr) auto; gap:8px; align-items:center; width:100%; text-align:left; border:1.5px solid var(--line, #DCE3F0); background:#fff; border-radius:12px; padding:6px 8px; }
.att .pick button svg { width:26px; height:26px; } .att .pick b { display:block; font:800 12.5px/1.3 var(--jp); } .att .pick button > span > span { display:block; font:700 11px/1.3 var(--jp); color:#1E6FB0; } .att .pick i { font-style:normal; font:900 12px/1 var(--jp); color:#E0662E; }
.att a { font:900 12.5px/1 var(--jp); color:#1E6FB0; }
.att .note2 { margin:0; font:700 12px/1.4 var(--jp); color:var(--soft); }
`;
function addCss() { if (document.getElementById("att-css")) return; const st = document.createElement("style"); st.id = "att-css"; st.textContent = CSS; document.head.appendChild(st); }

export function mergeAtt(ME) {
  if (ME && ME.own && Array.isArray(ME.own.equip)) ME.own.equip = ME.own.equip.map((e) => { const { att, ...rest } = e; return withAtt(rest, ME.own.att); });
  return ME;
}
const opsText = (a) => a.ops.map((o) => OPS[o].fmt(OPS[o].v[a.star - 1])).join("・");
const loose = (ME) => { const eq = new Set((ME.own.equip || []).map((e) => e.uid)); return (ME.own.att || []).filter((a) => !a.on || !eq.has(a.on)); };
let open = null;   // 付けかえる 一覧を 開いて いる 場所（tip・grip）
export function attHtml(ME, it, { away = false } = {}) {
  addCss();
  const on = (ME.own.att || []).filter((a) => a.on === it.uid), free = loose(ME);
  const rows = Object.entries(ATT_KINDS).map(([kind, K]) => {
    const a = on.find((x) => (attBase(x.base) || {}).kind === kind), b = a && attBase(a.base), cand = free.filter((x) => (attBase(x.base) || {}).kind === kind).sort((x, y) => y.star - x.star);
    const btn = away ? "" : a ? `<button class="ab" data-att-open="${kind}">${cand.length ? "かえる" : "はずす"}</button>` : cand.length ? `<button class="ab" data-att-open="${kind}">付ける（${cand.length}）</button>` : `<a href="workshop.html?t=att">工房で 作る</a>`;
    const pick = !away && open === kind ? `<div class="pick" role="group" aria-label="${K.label}を えらぶ">${cand.map((x) => `<button data-att-set="${x.uid}" data-w="${it.uid}">${wsIcon(x.base)}<span><b>${esc(attBase(x.base).name)} ★${x.star}</b><span>${esc(opsText(x))}</span></span><i>付ける</i></button>`).join("")}${a ? `<button data-att-off="${a.uid}"><span class="ai no"></span><span><b>はずす</b></span><i></i></button>` : ""}</div>` : "";
    return `<div class="ar"><small>${K.label}</small><span class="ai ${a ? "" : "no"}">${a ? wsIcon(a.base) : ""}</span><span class="an">${a ? `<b>${esc(b.name)} ★${a.star}</b><span>${esc(opsText(a))}</span>` : `<em>なし</em>`}</span>${btn}</div>${pick}`;
  }).join("");
  return `<div class="att" aria-label="アタッチメント"><h3>アタッチメント</h3>${rows}${away ? `<p class="note2">出かけて いる あいだは かえられない</p>` : ""}</div>`;
}
// 押した とき。reload：門番の 記録を 読みなおして 描く
export async function attClick(b, ME, reload, toast) {
  const d = b.dataset;
  if (d.attOpen) { open = open === d.attOpen ? null : d.attOpen; await reload(false); return true; }
  if (!d.attSet && !d.attOff) return false;
  const r = await busy(b, () => (d.attSet ? act("att.set", { att: d.attSet, weapon: d.w }) : act("att.off", { att: d.attOff })));
  if (!r.ok) { toast(r.wait ? waitText : r.why || "できませんでした"); return true; }
  open = null; await reload(true); toast(d.attSet ? "アタッチメントを 付けた" : "アタッチメントを はずした");
  return true;
}
