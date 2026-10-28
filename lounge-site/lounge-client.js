// 画面から 門番（プライベートラウンジの 入口）へ 頼む
// - 本物（?real か window.MONO_LINK_REAL）：同じ 場所の /api/...。Twitch の 札は sessionStorage の ml-token（MONO LINK の サイトと 同じ）
// - 見本：門番の 部品（../lounge-server）を この ブラウザの 中で 動かす（lounge-demo.js。記録は この ブラウザに しまう）
// 頼みには 1 回ごとの 番号（op）を つける。つながらなかったら 同じ 番号で 1 回だけ やりなおす（門番は 同じ 番号を 2 回 しない）
const REAL = new URLSearchParams(location.search).has("real") || !!window.MONO_LINK_REAL;
let demo = null;

async function call(path, body) {
  if (!REAL) {
    try { demo ||= await import("./lounge-demo.js"); }
    catch (e) { return { ok: false, denied: true, why: "ためしの 門番を 読めません（stream-layouts/ を まるごと 出す サーバーで 開いて ください）" }; }
    return demo.call(path, body);
  }
  let tok = ""; try { tok = sessionStorage.getItem("ml-token") || ""; } catch (e) {}
  const r = await fetch(path, { method: body ? "POST" : "GET", cache: "no-store",
    headers: { Authorization: "Bearer " + tok, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (j.code) return { ok: false, denied: true, code: j.code, why: j.why || "入れません", login: /^A0[12]$/.test(j.code) };   // 門番の 入口の ことわり（ログイン・フォロー など）。login：MONO LINK の サイトで ログインしなおせば 入れる
  return j;
}
const newOp = () => "op-" + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 30);

export const demoMode = !REAL;
// いまの 玉・リソース・クレジット（上の 通貨の 札 wallet-bar.js が 読む）。門番の 答えが 来る たびに 知らせる（"ml-purse"）
let PURSE = null;
export const lastPurse = () => PURSE;
function notePurse(j) {
  if (!j || typeof j !== "object" || (!j.wallet && j.credits == null)) return;
  PURSE = { ...(PURSE || { known: false, balls: 0, res: 0, credits: 0 }), ...(j.wallet || {}), ...(j.credits != null ? { credits: j.credits } : {}) };
  try { dispatchEvent(new CustomEvent("ml-purse", { detail: PURSE })); } catch (e) {}
}
// 大工事の あいだの ロック（門番が lock を 返す。鹿さんの決め、2026-10-28）：部屋と ショップの ほかの 画面は「工事中」で ふさぐ
const OPEN_PAGE = /\/(lounge-room|lounge-shop)\.html$/.test(location.pathname);
function lockScreen(j) {
  if (!j || !j.lock || OPEN_PAGE || document.getElementById("ml-lock")) return;
  const d = document.createElement("div"); d.id = "ml-lock"; d.setAttribute("role", "alert");
  d.style.cssText = "position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(244,247,252,.97);color:#1B2340;text-align:center;font:700 15px/1.7 'Zen Maru Gothic',system-ui,sans-serif";
  d.innerHTML = '<div><b style="display:block;font-size:24px;margin-bottom:6px">工事中</b><p style="margin:0 0 14px">MONO LINK の 大工事の あいだは、ラウンジの 部屋と ショップだけ 使えます</p><p style="margin:0;display:flex;gap:10px;justify-content:center"><a href="lounge-room.html" style="padding:8px 16px;border-radius:99px;background:#2EA8FF;color:#fff;text-decoration:none">部屋へ</a><a href="lounge-shop.html" style="padding:8px 16px;border-radius:99px;border:1.5px solid #DCE3F0;color:#1B2340;text-decoration:none">ショップへ</a></p></div>';
  document.body.append(d);
}
export const me = async () => { const j = await call("/api/me"); notePurse(j); lockScreen(j); return j; };
export async function act(a, body = {}) {
  const op = newOp();
  for (let i = 0; i < 2; i++) {
    try { const j = await call("/api/act", { ...body, op, a }); notePurse(j); lockScreen(j); return j; }
    catch (e) { if (i) return { ok: false, net: true, why: "門番に つながりません。もう 1 回 押して ください" }; }
  }
}
export const board = () => call("/api/board");
// おたこまるさん 専用の 窓口（support.html）
export const supportGet = (since = 0) => call("/api/support?since=" + since);
export const supportSend = (text) => call("/api/support", { text });
export const supportToken = () => call("/api/support/token", {});
export const report = (rid) => call("/api/board/report", { rid });
export const notedel = (rid) => call("/api/board/notedel", { rid });

// 返事を 待つ あいだ ボタンを 押せなく して、文字を かえる（返事が 来たら もどす）
// 中に 絵や 字の 組み立てが ある ボタン（カードなど）は 中身を かえずに うすく する（字だけに すると 形が くずれる。2026-10-25 サブツリーの カードで 起きた）
export async function busy(btn, run, text = "たしかめて います…") {
  const was = btn ? [...btn.childNodes] : [], card = !!(btn && btn.children.length);
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); if (card) btn.style.opacity = "0.55"; else btn.textContent = text; }
  try { return await run(); }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); if (card) btn.style.opacity = ""; else btn.replaceChildren(...was); } }
}
// 返事の ことば：ok は 呼んだ 画面が 出す。wait は「配信の 画面の 返事を 待って いる」
export const waitText = "配信の 画面の 返事を 待って います。つぎに 開いた ときに 決まります";
