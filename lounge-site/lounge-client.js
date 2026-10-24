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
export const me = () => call("/api/me");
export async function act(a, body = {}) {
  const op = newOp();
  for (let i = 0; i < 2; i++) {
    try { return await call("/api/act", { ...body, op, a }); }
    catch (e) { if (i) return { ok: false, net: true, why: "門番に つながりません。もう 1 回 押して ください" }; }
  }
}
export const board = () => call("/api/board");
export const report = (rid) => call("/api/board/report", { rid });
export const notedel = (rid) => call("/api/board/notedel", { rid });

// 返事を 待つ あいだ ボタンを 押せなく して、文字を かえる（返事が 来たら もどす）
export async function busy(btn, run, text = "たしかめて います…") {
  const was = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = text; }
  try { return await run(); }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = was; } }
}
// 返事の ことば：ok は 呼んだ 画面が 出す。wait は「配信の 画面の 返事を 待って いる」
export const waitText = "配信の 画面の 返事を 待って います。つぎに 開いた ときに 決まります";
