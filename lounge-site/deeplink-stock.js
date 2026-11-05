// DEEP LINK/: の 株（トークン）の 画面。deeplink.html の 右の 窓に 出す（左の 一覧の「ほか」→「株」）
// 鹿さんの 決め：トークン＝株・クレジットで 売り買い・配当・DEEP LINK の ニュース欄に 株の 動きと 小さな 見出し（docs/mono-link-deeplink-story.md）
// 並べ方は 鹿さんの カード「A 一覧＋右で 決める」（2026-11-05）：タブ（銘柄・持ち株・ニュース）・グループの チップ・ならべる。スマホは 決める 所が 上
// データは 門番の stock.view（lounge-server/lounge-stock.js）。値の 式は stocks.js
import { STOCKS, CO, GROUPS, ST, minShares } from "./stocks.js";

const fmt = (n) => Math.round(n).toLocaleString("ja-JP");
const p1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const pct = (a, b) => (b ? (a / b - 1) * 100 : 0);
const sign = (n) => (n > 0 ? "＋" : n < 0 ? "−" : "±") + fmt(Math.abs(n));
const chg = (x) => { const d = pct(x.p, x.p24), a = Math.abs(d) < 0.05 ? 0 : d; return `<span class="chg ${a > 0 ? "up" : a < 0 ? "dn" : ""}">${a > 0 ? "▲" : a < 0 ? "▼" : "─"}${Math.abs(a).toFixed(1)}%</span>`; };
// ニュースの 見出し（会社ごとの 一言。代理戦争を にじませる。Claude の 案）
const WHY = {
  VLC: ["国境の 緊張で 受注が ふえた", "停戦の うわさで 売られた"], ODH: ["討伐の 依頼が 相次ぐ", "狩り場の 封鎖で 足踏み"], DRN: ["坑道の 採掘量が ふえた", "落盤の 報告で 売られた"], HLX: ["施設の 電力が 足りない", "送電網の 故障が 響いた"],
  MLV: ["救護の 需要が ふえた", "新薬の 治験が 遅れた"], AMB: ["保険の 契約が ふえた", "支払いが かさんだ"], SRN: ["預金が 集まって いる", "取りつけの うわさ"], CLR: ["収穫期の 需要", "作物の 病気の うわさ"],
  RSL: ["防具の 注文が ふえた", "布の 値上がりが 響いた"], GRN: ["施設の 工事が 相次ぐ", "工期の 遅れが 響いた"], LDN: ["家具の 新作が 話題", "注文の 取り消しが 続く"], CRV: ["島への 便が 満席", "嵐で 便が 止まった"],
  GLK: ["鑑定の 行列が できた", "掘り出し物が 減った"], NOX: ["換金の 窓口が 混雑", "情報の 出どころに 疑い"],
};
export function newsText(n) {
  const c = CO[n.co]; if (!c) return "";
  if (n.k === "up" || n.k === "down") return `${c.name}、24 時間で ${Math.abs(n.d)}% ${n.k === "up" ? "上昇" : "下落"}（${WHY[n.co][n.k === "up" ? 0 : 1]}）`;
  if (n.k === "high") return `${c.name}、値が 上限の ${ST.max} に`;
  if (n.k === "low") return `${c.name}、値が 下限の ${ST.min} に`;
  if (n.k === "div") return `きょうの 配当 1 位：${c.name}（1 トークン ${n.d}）`;
  return "";
}
const when = (at) => { const d = new Date(at + 9 * 3600e3); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:00`; };
export const newsNew = (K) => (K && K.news ? K.news.filter((n) => K.now - n.at < 864e5).length : 0);
export const heldN = (K) => (K && K.mine ? Object.values(K.mine.h).filter((n) => n > 0).length : 0);

// 小さな 線（一覧の 24 時間）と 大きな 線（右の 7 日）
function spark(hs, w, h, big) {
  const a = hs.length > 1 ? hs : [hs[0] || 100, hs[0] || 100], lo = Math.min(...a), hi = Math.max(...a), r = hi - lo || 1;
  const pts = a.map((v, i) => `${((i / (a.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - lo) / r) * (h - 4)).toFixed(1)}`).join(" ");
  const up = a[a.length - 1] >= a[0];
  return `<svg class="${big ? "chart" : "spk"} ${up ? "up" : "dn"}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}
const sorted = (K, S) => {
  const L = K.list.filter((x) => S.sg === "all" || CO[x.co].g === S.sg);
  if (S.ssort === "move") return [...L].sort((a, b) => Math.abs(pct(b.p, b.p24)) - Math.abs(pct(a.p, a.p24)));
  if (S.ssort === "div") return [...L].sort((a, b) => b.div - a.div);
  return L;   // グループ順（表の 順）
};
const row = (x, K, S) => { const c = CO[x.co], n = K.mine.h[x.co] || 0;
  return `<li><button class="srow" data-sco="${x.co}" aria-pressed="${S.sco === x.co}"><span class="kd">${x.co}</span><span class="nm">${c.name}${n ? `<small>保有 ${fmt(n)}</small>` : ""}</span>${spark(x.hist.slice(-24), 56, 18)}<span class="px">${p1(x.p)}</span>${chg(x)}</button></li>`; };

function listTab(K, S) {
  const cnt = (g) => K.list.filter((x) => g === "all" || CO[x.co].g === g).length;
  const chips = `<div class="filt"><span class="lb">グループ</span>${["all", "sva", "harmonia", "tcu", "neutral"].map((g) => `<button class="chip" data-sg="${g}" aria-pressed="${S.sg === g}">${g === "all" ? "ぜんぶ" : g === "harmonia" ? "ハルモニア" : GROUPS[g].name} ${cnt(g)}</button>`).join("")}
    <span class="lb">ならべる</span>${[["group", "グループ順"], ["move", "動いた順"], ["div", "配当"]].map(([k, l]) => `<button class="chip" data-ssort="${k}" aria-pressed="${S.ssort === k}">${l}</button>`).join("")}</div>`;
  const L = sorted(K, S);
  let rows = "";
  if (S.ssort === "group") { for (const g of Object.keys(GROUPS)) { const xs = L.filter((x) => CO[x.co].g === g); if (xs.length) rows += `<li class="gh">${GROUPS[g].name}</li>` + xs.map((x) => row(x, K, S)).join(""); } }
  else rows = L.map((x) => row(x, K, S)).join("");
  return `<div class="sgrid"><div class="slist">${chips}<ul class="srows">${rows}</ul></div>${detail(K, S)}</div>`;
}
// 右：えらんだ 銘柄を 見て 決める
function detail(K, S, credits = S.credits || 0) {
  const x = K.list.find((y) => y.co === S.sco) || K.list[0], c = CO[x.co], n = K.mine.h[x.co] || 0, cost = K.mine.c[x.co] || 0;
  const mn = minShares(x.p), k = Math.max(1, Math.min(ST.cap, Math.floor(S.sn) || mn)), gain = n ? Math.floor(n * x.p * (1 - ST.fee)) - cost : 0;
  return `<aside class="sdet" id="sdet"><div class="hd"><span class="kd">${x.co}</span><h3>${c.name}</h3><small>${GROUPS[c.g].name}</small></div>
    <p class="big"><b>${p1(x.p)}</b>${chg(x)}<small>24 時間</small></p>
    <div class="cw">${spark(x.hist, 300, 90, true)}<span class="lo">7 日の 値　${p1(Math.min(...(x.hist.length ? x.hist : [x.p])))}〜${p1(Math.max(...(x.hist.length ? x.hist : [x.p])))}</span></div>
    <ul class="kv">${n ? `<li><span>保有</span><b>${fmt(n)}</b></li><li><span>売ると</span><b>${fmt(n * x.p * (1 - ST.fee))}<em class="${gain > 0 ? "up" : gain < 0 ? "dn" : ""}">${sign(gain)}</em></b></li>` : ""}
      <li><span>1 トークンの 配当</span><b>${x.div ? x.div : "─"}${n && x.div ? `<em>保有分で ${fmt(Math.floor(n * x.div))}</em>` : ""}</b></li></ul>
    <div class="trade"><label>数 <input id="sk-n" type="number" min="1" max="${ST.cap}" step="1" value="${k}" inputmode="numeric"></label><button class="chip" data-sset="${mn}">最小 ${fmt(mn)}</button>${[100, 500].filter((v) => v > mn).map((v) => `<button class="chip" data-sset="${v}">${v}</button>`).join("")}${n ? `<button class="chip" data-sset="${n}">ぜんぶ</button>` : ""}</div>
    <p class="est" id="sk-est">${est(x, n, k, credits)}</p>
    <div class="go"><button class="btn" data-sbuy="${x.co}" ${buyWhy(x, n, k, credits) ? "disabled" : ""}>買う</button><button class="btn ghost" data-ssell="${x.co}" ${n >= k ? "" : "disabled"}>売る</button></div>
    ${buyWhy(x, n, k, credits) ? `<p class="why">${buyWhy(x, n, k, credits)}</p>` : ""}</aside>`;
}
const buyCost = (x, k) => Math.ceil(k * x.p * (1 + ST.fee));
function buyWhy(x, n, k, credits) {
  if (n + k > ST.cap) return `1 社 ${fmt(ST.cap)} トークンまで（いま ${fmt(n)}）`;
  if (x.held + k > ST.shares) return `売りに 出て いる トークンが 足りない（あと ${fmt(ST.shares - x.held)}）`;
  if (k * x.p < ST.minBuy) return `${fmt(ST.minBuy)} クレジットから（いまの 値で ${fmt(minShares(x.p))} トークン〜）`;
  if (buyCost(x, k) > credits) return `足りない：クレジット あと ${fmt(buyCost(x, k) - credits)}`;
  return "";
}
export const est = (x, n, k, credits) => `買う：およそ <span class="c">${fmt(buyCost(x, k))}</span>${n >= k ? `　売る：およそ <span class="c">${fmt(k * x.p * (1 - ST.fee))}</span>` : ""}<small>（手数料 ${ST.fee * 100}% こみ）</small>`;
// 数を かえた とき（描きなおさずに 下の 字と ボタンだけ）
export function stockInput(K, S, credits) {
  const x = K.list.find((y) => y.co === S.sco) || K.list[0], n = K.mine.h[x.co] || 0, k = Math.max(1, Math.min(ST.cap, Math.floor(S.sn) || minShares(x.p))), w = buyWhy(x, n, k, credits);
  document.getElementById("sk-est").innerHTML = est(x, n, k, credits);
  document.querySelector("[data-sbuy]").disabled = !!w; document.querySelector("[data-ssell]").disabled = n < k;
  const old = document.querySelector("#sdet .why"); if (old) old.remove(); if (w) document.getElementById("sdet").insertAdjacentHTML("beforeend", `<p class="why">${w}</p>`);
}

function mineTab(K, S) {
  const L = K.list.filter((x) => (K.mine.h[x.co] || 0) > 0);
  const last = K.mine.last ? `<p class="note">前の 配当 <span class="c">${fmt(K.mine.last.cr)}</span>（${K.mine.last.day.slice(5).replace("-", "/")} ${ST.divHour}:00）・これまで <span class="c">${fmt(K.mine.got)}</span></p>` : "";
  if (!L.length) return `<p class="say">まだ トークンを 持って いない。「一覧」で えらんで 買える</p>${last}`;
  let tot = 0, tc = 0;
  const rows = L.map((x) => { const n = K.mine.h[x.co], v = Math.floor(n * x.p * (1 - ST.fee)), g = v - (K.mine.c[x.co] || 0); tot += v; tc += K.mine.c[x.co] || 0;
    return `<li><button class="srow own" data-sco="${x.co}" data-stab="list"><span class="kd">${x.co}</span><span class="nm">${CO[x.co].name}<small>保有 ${fmt(n)}</small></span><span class="px">${p1(x.p)}</span>${chg(x)}<span class="gv">${fmt(v)}<em class="${g > 0 ? "up" : g < 0 ? "dn" : ""}">${sign(g)}</em></span></button></li>`; }).join("");
  return `<p class="sum">売ると <b>${fmt(tot)}</b><em class="${tot - tc > 0 ? "up" : tot - tc < 0 ? "dn" : ""}">${sign(tot - tc)}</em></p><ul class="srows">${rows}</ul>${last}`;
}
function newsTab(K) {
  if (!K.news.length) return `<p class="say">まだ ニュースは ない</p>`;
  return `<ul class="news">${K.news.map((n) => `<li class="${K.now - n.at < 864e5 ? "fresh" : ""}"><time>${when(n.at)}</time><span class="kd">${n.co}</span><span>${newsText(n)}</span></li>`).join("")}</ul>`;
}

// 右の 窓 ぜんぶ。K：stock.view の 答え（なければ 読みこみ中）・S：deeplink.html の 状態（stab・sg・ssort・sco・sn・credits）
export function stockPane(K, S) {
  const head = (right) => `<header class="who stk"><span class="cam" aria-hidden="true"><span class="emo">▲</span></span><div><h2>トークン</h2><p>${STOCKS.length} 社の 取引所</p></div><div class="rep">${right}</div></header>`;
  if (!K) return head("") + `<p class="say">取引所に つないで います …</p>`;
  if (K.lock || K.err) return head("") + `<p class="say">${K.why || "取引所に つながらない"}</p>`;
  const left = Math.max(0, K.nextDiv - Date.now()), hh = Math.floor(left / 3600e3), mm = Math.floor((left % 3600e3) / 60e3);
  const nn = newsNew(K), hn = heldN(K);
  return head(`つぎの 配当まで <b>${hh}:${String(mm).padStart(2, "0")}</b>`) +
    `<div class="tabs" role="tablist"><button role="tab" data-stab="list" aria-selected="${S.stab === "list"}">一覧 ${K.list.length}</button><button role="tab" data-stab="mine" aria-selected="${S.stab === "mine"}">保有 ${hn}</button><button role="tab" data-stab="news" aria-selected="${S.stab === "news"}">ニュース${nn ? ` <span class="new">●${nn}</span>` : ""}</button></div>` +
    (S.stab === "mine" ? mineTab(K, S) : S.stab === "news" ? newsTab(K) : listTab(K, S));
}
