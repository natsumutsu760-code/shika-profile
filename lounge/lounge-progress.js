// 開発の 進み具合（鹿物語の 持ち玉ランキングの 窓と、ラウンジの「工事中」に 出す。鹿さんの決め、2026-11-01）
// 書くのは こちらの Claude だけ（門番の 鍵 UPLOAD_KEY。鹿さんが チャットで 言った 項目と % を 書く）。読むのは だれでも（配信画面からも 読める ように CORS）
// KV の "progress"：{ at, items: [{ name, pct }] }。全体の % は 項目の 平均。items が 空なら どこにも 出さない
const KEY = "progress", MAX_ITEMS = 6, NAME_LEN = 16;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type" };
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS } });
const bearer = (req) => { const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || ""); return m ? m[1].trim() : ""; };
async function same(a, b) {   // 鍵の くらべ（かかる 時間で 中身が わからない ように、ハッシュを 全部 くらべる）
  if (!a || !b) return false;
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
// 全体の %（項目の 平均。小数は 切りすて）
export const progressTotal = (items) => (items.length ? Math.floor(items.reduce((a, it) => a + it.pct, 0) / items.length) : 0);
// 書く 中身を たしかめる（だめなら 理由の 文）
export function progressCheck(b) {
  const items = b && Array.isArray(b.items) ? b.items : null;
  if (!items || items.length > MAX_ITEMS) return `項目は 0〜${MAX_ITEMS} こ`;
  for (const it of items) {
    if (!it || typeof it.name !== "string" || !it.name.trim() || [...it.name.trim()].length > NAME_LEN) return `項目の 名前は 1〜${NAME_LEN} 文字`;
    if (!Number.isInteger(it.pct) || it.pct < 0 || it.pct > 100) return "% は 0〜100 の 整数";
  }
  return "";
}

export async function progressApi(req, env, url) {
  if (url.pathname !== "/api/progress") return null;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } });
  if (req.method === "GET") {
    const s = (await env.DB.get(KEY, "json")) || { at: 0, items: [] };
    return J({ at: s.at, items: s.items, total: progressTotal(s.items) });
  }
  if (req.method !== "POST") return J({ error: "method" }, 405);
  if (!env.UPLOAD_KEY || !(await same(bearer(req), env.UPLOAD_KEY))) return J({ error: "key" }, 401);
  const b = await req.json().catch(() => null), why = progressCheck(b);
  if (why) return J({ ok: false, why }, 400);
  const s = { at: Date.now(), items: b.items.map((it) => ({ name: it.name.trim(), pct: it.pct })) };
  await env.DB.put(KEY, JSON.stringify(s));
  return J({ ok: true, ...s, total: progressTotal(s.items) });
}
