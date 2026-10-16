// MONO LINK:// の門番（Cloudflare Worker）
// ・サイト（index.html）を GitHub から取って出す
// ・記録はオーバーレイから受け取って KV にしまう（外からは読めない）
// ・視聴者は Twitch でログインし、配信者をフォローしていて、BAN・ブロックされていない人だけ記録を受け取れる
const HTML_URL = "https://raw.githubusercontent.com/natsumutsu760-code/shika-profile/main/index.html";
const MAX_UPLOAD = 20 * 1024 * 1024;

const SEC = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEC, ...extra } });
}
// オーバーレイ（OBS の http://absolute など）から上げるので、上げる口だけ CORS を開ける。鍵がないと何もできない
const UP_CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400" };

async function sha(s) { return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
async function sameKey(a, b) {
  if (!a || !b) return false;
  const x = await sha(a), y = await sha(b);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}
function bearer(req) { const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || ""); return m ? m[1].trim() : ""; }

async function upload(req, env) {
  if (!env.UPLOAD_KEY) return json({ error: "nokey" }, 500, UP_CORS);
  if (!(await sameKey(bearer(req), env.UPLOAD_KEY))) return json({ error: "key" }, 401, UP_CORS);
  const len = +(req.headers.get("Content-Length") || 0);
  if (len > MAX_UPLOAD) return json({ error: "big" }, 413, UP_CORS);
  let body;
  try { body = await req.json(); } catch (e) { return json({ error: "json" }, 400, UP_CORS); }
  if (!body || typeof body !== "object" || !body.data || !body.gate) return json({ error: "shape" }, 400, UP_CORS);
  const g = body.gate, toMap = (a) => { const m = {}; (Array.isArray(a) ? a : []).slice(0, 200000).forEach((id) => { if (/^\d{1,20}$/.test(String(id))) m[String(id)] = 1; }); return m; };
  const gate = {
    owner: /^\d{1,20}$/.test(String(g.owner || "")) ? String(g.owner) : "",
    clientId: String(g.clientId || "").replace(/[^a-z0-9]/gi, "").slice(0, 64),
    follow: Array.isArray(g.follow) ? toMap(g.follow) : null,  // null は「読めていない」= オーナー以外は入れない
    ban: Array.isArray(g.ban) ? toMap(g.ban) : null,
    block: Array.isArray(g.block) ? toMap(g.block) : null,
    mods: toMap(g.mods),
    at: Date.now(),
  };
  await env.DB.put("data", JSON.stringify(body.data));
  await env.DB.put("gate", JSON.stringify(gate));
  return json({ ok: true, at: gate.at, follow: gate.follow ? Object.keys(gate.follow).length : -1 }, 200, UP_CORS);
}

async function readData(req, env) {
  const tok = bearer(req);
  if (!tok) return json({ error: "login" }, 401);
  const gate = await env.DB.get("gate", "json");
  if (!gate) return json({ error: "notready" }, 503);
  const v = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: "OAuth " + tok } });
  if (!v.ok) return json({ error: "login" }, 401);
  const who = await v.json();
  if (gate.clientId && who.client_id !== gate.clientId) return json({ error: "login" }, 401);
  const id = String(who.user_id || "");
  const owner = id && id === gate.owner, mod = !!(gate.mods && gate.mods[id]);
  if (!owner) {
    if (!gate.ban || !gate.block || !gate.follow) return json({ error: "notready" }, 503);
    if (gate.ban[id] || gate.block[id]) return json({ error: "denied" }, 403);
    if (!mod && !gate.follow[id]) return json({ error: "follow" }, 403);
  }
  const data = await env.DB.get("data");
  if (!data) return json({ error: "notready" }, 503);
  return new Response('{"me":' + JSON.stringify({ id, login: who.login || "" }) + ',"d":' + data + "}", { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEC } });
}

async function config(env) {
  const gate = await env.DB.get("gate", "json");
  return json({ clientId: gate ? gate.clientId : "", ready: !!gate });
}

async function page() {
  const r = await fetch(HTML_URL, { cf: { cacheTtl: 120, cacheEverything: true } });
  if (!r.ok) return new Response("いまは開けません。少し待ってからもう一度開いてください。", { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(await r.text(), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", ...SEC } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/upload") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: UP_CORS });
      if (req.method === "POST") return upload(req, env);
      return json({ error: "method" }, 405, UP_CORS);
    }
    if (url.pathname === "/api/data" && req.method === "GET") return readData(req, env);
    if (url.pathname === "/api/config" && req.method === "GET") return config(env);
    if (url.pathname.startsWith("/api/")) return json({ error: "notfound" }, 404);
    if (req.method !== "GET" && req.method !== "HEAD") return json({ error: "method" }, 405);
    return page();
  },
};
