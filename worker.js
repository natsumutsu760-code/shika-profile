// MONO LINK:// の門番（Cloudflare Worker）
// ・サイト（index.html）を GitHub から取って出す
// ・記録はオーバーレイから受け取って KV にしまう（外からは読めない）
// ・視聴者は Twitch でログインし、配信者をフォローしていて、BAN・ブロックされていない人だけ記録を受け取れる
// ・いまラウンジ（このサイト）を開いている人を Durable Object（Lounge）で覚える。ページは 1 分ごとに知らせ、3 分来なければいないことにする
const HTML_URL = "https://raw.githubusercontent.com/natsumutsu760-code/shika-profile/main/index.html";
const MAX_UPLOAD = 20 * 1024 * 1024;
const HERE_MS = 3 * 60 * 1000; // 最後の知らせからこの時間はラウンジにいることにする

const SEC = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEC, ...extra } });
}
// オーバーレイ（OBS の http://absolute など）から上げるので、上げる口だけ CORS を開ける。鍵がないと何もできない
const UP_CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400" };

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
    followErr: String(g.followErr || "").replace(/[^a-z]/g, "").slice(0, 12),
    banErr: String(g.banErr || "").replace(/[^a-z]/g, "").slice(0, 12),
    blockErr: String(g.blockErr || "").replace(/[^a-z]/g, "").slice(0, 12),
    at: Date.now(),
  };
  gate.followN = gate.follow ? Object.keys(gate.follow).length : -1;
  // BAN・ブロックの一覧が今回読めなかったら、前に届いた一覧を使い続ける（読めない間に BAN した人が入らないように）
  if (!gate.ban || !gate.block) {
    const prev = await env.DB.get("gate", "json");
    if (prev) {
      if (!gate.ban && prev.ban) { gate.ban = prev.ban; gate.banAt = prev.banAt || prev.at; }
      if (!gate.block && prev.block) { gate.block = prev.block; gate.blockAt = prev.blockAt || prev.at; }
    }
  }
  await env.DB.put("data", JSON.stringify(body.data));
  await env.DB.put("gate", JSON.stringify(gate));
  // 最近ラウンジに入れなかった人の記録も返す（配信者のパネルに出す）
  const denied = (await env.DB.get("denied", "json")) || [];
  return json({ ok: true, at: gate.at, follow: gate.followN, denied: denied.slice(-20) }, 200, UP_CORS);
}

// 入れなかったときのコードと理由（ページにそのまま出す。配信者はパネルの「入れなかった人」でも見られる）
//   A：ログイン　G：準備（配信オーバーレイからの記録）　F：フォロー　D：配信者の設定　E：門番のエラー
const WHY = {
  A01: "ログインしていません",
  A02: "Twitch のログインの期限が切れています",
  A03: "ほかのアプリでログインしています（このラウンジのログインではありません）",
  A04: "フォローを確かめる許可がありません（もう一度ログインしてください）",
  G01: "配信オーバーレイからまだ記録が届いていません",
  G02: "配信オーバーレイがフォロワーの一覧を読めていません",
  G03: "配信オーバーレイが BAN の一覧を読めていません",
  G04: "配信オーバーレイがブロックの一覧を読めていません",
  G05: "配信オーバーレイからまだ記録が届いていません",
  F01: "フォロワーの一覧に見つかりません",
  D01: "配信者の設定で入れません",
  D02: "配信者の設定で入れません",
  E01: "門番でエラーが起きました",
};
// G02 のくわしい理由（配信オーバーレイが送ってくる）
const FOLLOW_ERR = { noscope: "配信者のログインに、フォロワーを読む許可がありません", error: "Twitch からフォロワーを読めませんでした", old: "最後に読めたのが 24 時間以上前です", loading: "オーバーレイが起動したばかりで、読んでいる途中です", notyet: "オーバーレイがまだフォロワーを読んでいません" };
// G03・G04 のくわしい理由
const LIST_ERR = {
  ban: { noscope: "配信者の Twitch のログインに「BAN の一覧を読む」許可がありません。配信者がオーバーレイのパネルでログインし直すと直ります", error: "Twitch から BAN の一覧を読めませんでした" },
  block: { noscope: "配信者の Twitch のログインに「ブロックの一覧を読む」許可がありません。配信者がオーバーレイのパネルでログインし直すと直ります", error: "Twitch からブロックの一覧を読めませんでした" },
};
const ERR = { A: "login", G: "notready", F: "follow", D: "denied", E: "server" };
const STATUS = { A: 401, G: 503, F: 403, D: 403, E: 500 };
function deny(code, info) {
  return json({ error: ERR[code[0]], code, why: WHY[code], info: info || {} }, STATUS[code[0]]);
}
// 入れなかった人を KV に残す（最新 50 件。同じ人・同じコードは 10 分に 1 回まで。ログインの期限切れは残さない）
async function logDeny(env, code, who, extra) {
  if (code === "A01" || code === "A02") return;
  try {
    const list = (await env.DB.get("denied", "json")) || [], now = Date.now(), id = (who && who.user_id) ? String(who.user_id) : "";
    if (list.some((x) => x.code === code && x.id === id && now - x.t < 600000)) return;
    list.push({ t: now, code, why: WHY[code], id, login: who && who.login ? String(who.login).slice(0, 40) : "", ...(extra || {}) });
    await env.DB.put("denied", JSON.stringify(list.slice(-50)));
  } catch (e) {}
}

// その人がフォローしているかを、その人のログインで Twitch に直接きく（user:read:follows の許可がいる）。"yes" / "no" / "noscope" / "error"
async function followsLive(who, tok, owner) {
  const sc = Array.isArray(who.scopes) ? who.scopes : [];
  if (!owner || sc.indexOf("user:read:follows") < 0) return "noscope";
  try {
    const r = await fetch("https://api.twitch.tv/helix/channels/followed?user_id=" + encodeURIComponent(String(who.user_id || "")) + "&broadcaster_id=" + encodeURIComponent(owner), { headers: { "Client-Id": String(who.client_id || ""), Authorization: "Bearer " + tok } });
    if (r.status === 401 || r.status === 403) return "noscope";
    if (!r.ok) return "error";
    const j = await r.json();
    return Array.isArray(j.data) && j.data.length ? "yes" : "no";
  } catch (e) { return "error"; }
}

// ログインした人を確かめて、入れるかどうかを決める。入れるなら { who }、だめなら { res }（そのまま返す応答）
// フォローは、配信オーバーレイが送った一覧になければ、その人のログインで Twitch に直接きく（一覧が古い・まだ届いていないときも入れる）
async function enter(req, env) {
  const tok = bearer(req);
  if (!tok) return { res: deny("A01") };
  const gate = await env.DB.get("gate", "json");
  const v = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: "OAuth " + tok } });
  if (!v.ok) return { res: deny("A02") };
  const who = await v.json();
  const me = { login: String(who.login || ""), id: String(who.user_id || "") };
  if (!gate) { await logDeny(env, "G01", who); return { res: deny("G01", me) }; }
  if (gate.clientId && who.client_id !== gate.clientId) { await logDeny(env, "A03", who); return { res: deny("A03", me) }; }
  const id = me.id;
  const owner = id && id === gate.owner, mod = !!(gate.mods && gate.mods[id]);
  if (!owner) {
    // BAN・ブロックの一覧がまだ一度も届いていないときは、その確認を飛ばす（配信者が「一時的に入れる」を選んだ。
    // 配信者がオーバーレイでログインし直して一覧が届けば、自動でまた確かめる）
    if (gate.ban && gate.ban[id]) { await logDeny(env, "D01", who); return { res: deny("D01", me) }; }
    if (gate.block && gate.block[id]) { await logDeny(env, "D02", who); return { res: deny("D02", me) }; }
    if (!mod && !(gate.follow && gate.follow[id])) {
      const live = await followsLive(who, tok, gate.owner);
      if (live !== "yes") {
        const listN = gate.follow ? (gate.followN != null ? gate.followN : Object.keys(gate.follow).length) : null;
        if (live === "no") { await logDeny(env, "F01", who, { listN, listAt: gate.at, live: 1 }); return { res: deny("F01", { ...me, listAt: gate.at, listN, detail: "Twitch に直接きいても、フォローしていませんでした" }) }; }
        if (!gate.follow) {
          // 一覧が届いていなくて、直接もきけない：許可がなければログインし直してもらう
          if (live === "noscope") { await logDeny(env, "A04", who); return { res: deny("A04", me) }; }
          await logDeny(env, "G02", who, { why2: FOLLOW_ERR[gate.followErr] || "" });
          return { res: deny("G02", { ...me, listAt: gate.at, detail: FOLLOW_ERR[gate.followErr] || "" }) };
        }
        await logDeny(env, "F01", who, { listN, listAt: gate.at });
        return { res: deny("F01", { ...me, listAt: gate.at, listN }) };
      }
    }
  }
  return { who: { id, login: me.login, client: String(who.client_id || ""), tok } };
}

// いまいる人の部屋（Durable Object）に「来ています」を知らせ、いまいる人の一覧をもらう。表示名は最初の 1 回だけ Twitch から取る
function lounge(env) { return env.LOUNGE.get(env.LOUNGE.idFromName("lounge")); }
async function here(env, who) {
  const room = lounge(env);
  let r = await (await room.fetch("https://lounge/beat", { method: "POST", body: JSON.stringify({ id: who.id, l: who.login }) })).json();
  if (r.needName) {
    let n = who.login;
    try {
      const u = await fetch("https://api.twitch.tv/helix/users?id=" + encodeURIComponent(who.id), { headers: { "Client-Id": who.client, Authorization: "Bearer " + who.tok } });
      if (u.ok) { const j = await u.json(); if (j.data && j.data[0] && j.data[0].display_name) n = String(j.data[0].display_name).slice(0, 40); }
    } catch (e) {}
    r = await (await room.fetch("https://lounge/beat", { method: "POST", body: JSON.stringify({ id: who.id, l: who.login, n }) })).json();
  }
  return r.list;
}

async function readData(req, env) {
  const e = await enter(req, env);
  if (e.res) return e.res;
  const data = await env.DB.get("data");
  if (!data) return deny("G05", { login: e.who.login, id: e.who.id });
  const list = await here(env, e.who);
  return new Response('{"me":' + JSON.stringify({ id: e.who.id, login: e.who.login }) + ',"here":' + JSON.stringify(list) + ',"d":' + data + "}", { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEC } });
}
async function ping(req, env) {
  const e = await enter(req, env);
  if (e.res) return e.res;
  return json({ here: await here(env, e.who) });
}
// ページを閉じたとき（sendBeacon なので、トークンは本文で受け取る）
async function bye(req, env) {
  const tok = (await req.text()).trim().slice(0, 200);
  if (!tok) return new Response(null, { status: 204 });
  const v = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: "OAuth " + tok } });
  if (v.ok) { const who = await v.json(); await lounge(env).fetch("https://lounge/bye", { method: "POST", body: JSON.stringify({ id: String(who.user_id || "") }) }); }
  return new Response(null, { status: 204 });
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
    try { return await route(req, env); }
    catch (e) { return deny("E01", { detail: String((e && e.message) || e).slice(0, 120) }); }
  },
};
async function route(req, env) {
  {
    const url = new URL(req.url);
    if (url.pathname === "/api/upload") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: UP_CORS });
      if (req.method === "POST") return upload(req, env);
      return json({ error: "method" }, 405, UP_CORS);
    }
    // 最近ラウンジに入れなかった人（配信オーバーレイのパネル用。上げる口と同じ鍵がいる）
    if (url.pathname === "/api/denied") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: UP_CORS });
      if (!env.UPLOAD_KEY || !(await sameKey(bearer(req), env.UPLOAD_KEY))) return json({ error: "key" }, 401, UP_CORS);
      return json({ denied: ((await env.DB.get("denied", "json")) || []).slice(-20) }, 200, UP_CORS);
    }
    if (url.pathname === "/api/data" && req.method === "GET") return readData(req, env);
    if (url.pathname === "/api/ping" && req.method === "GET") return ping(req, env);
    if (url.pathname === "/api/bye" && req.method === "POST") return bye(req, env);
    if (url.pathname === "/api/config" && req.method === "GET") return config(env);
    if (url.pathname.startsWith("/api/")) return json({ error: "notfound" }, 404);
    if (req.method !== "GET" && req.method !== "HEAD") return json({ error: "method" }, 405);
    return page();
  }
}

// ---------- いまラウンジにいる人（1 つだけの部屋）----------
export class Lounge {
  constructor(state) {
    this.state = state;
    this.map = {};
    state.blockConcurrencyWhile(async () => { this.map = (await state.storage.get("here")) || {}; });
  }
  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    for (const k of Object.keys(this.map)) if (now - this.map[k].at > HERE_MS) delete this.map[k];
    let needName = false;
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = /^\d{1,20}$/.test(String(b.id || "")) ? String(b.id) : "";
      if (id && url.pathname === "/beat") {
        const old = this.map[id] || {};
        const n = typeof b.n === "string" && b.n ? b.n.slice(0, 40) : old.n || "";
        this.map[id] = { n, l: String(b.l || old.l || "").slice(0, 40), at: now };
        needName = !n;
      }
      if (id && url.pathname === "/bye") delete this.map[id];
      await this.state.storage.put("here", this.map);
    }
    const list = Object.values(this.map).filter((x) => x.n || x.l).map((x) => ({ n: x.n || x.l, l: x.l }));
    return new Response(JSON.stringify({ needName, list }), { headers: { "Content-Type": "application/json" } });
  }
}
