// MONO LINK:// の門番（Cloudflare Worker）
// ・サイト（index.html）を GitHub から取って出す
// ・記録はオーバーレイから受け取って KV にしまう（外からは読めない）
// ・視聴者は Twitch でログインし、配信者をフォローしていて、BAN・ブロックされていない人だけ記録を受け取れる
// ・いまラウンジ（このサイト）を開いている人を Durable Object（Lounge）で覚える。ページは 1 分ごとに知らせ、3 分来なければいないことにする
// ・配信ページのボタン（!発射 など）は、同じ Lounge から、OBS の配信オーバーレイ（WebSocket でつながっている）に届ける。
//   チャットに書かないので、連投でタイムアウトされない。1 人 1 秒に 1 回まで
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
  B01: "BAN・ブロックの一覧がない間に入りました（一時的に入れる）",
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
  // BAN・ブロックの一覧がないまま入れた人は記録に残す（あとで配信者がパネルで確かめられるように）
  if (!owner && !mod && (!gate.ban || !gate.block)) await logDeny(env, "B01", who);
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
  return { list: r.list, obs: r.obs || 0 };
}

async function readData(req, env) {
  const e = await enter(req, env);
  if (e.res) return e.res;
  const data = await env.DB.get("data");
  if (!data) return deny("G05", { login: e.who.login, id: e.who.id });
  const h = await here(env, e.who);
  return new Response('{"me":' + JSON.stringify({ id: e.who.id, login: e.who.login }) + ',"here":' + JSON.stringify(h.list) + ',"obs":' + (h.obs ? 1 : 0) + ',"d":' + data + "}", { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEC } });
}
async function ping(req, env) {
  const e = await enter(req, env);
  if (e.res) return e.res;
  const h = await here(env, e.who);
  return json({ here: h.list, obs: h.obs ? 1 : 0 });
}
// ページを閉じたとき（sendBeacon なので、トークンは本文で受け取る）
async function bye(req, env) {
  const tok = (await req.text()).trim().slice(0, 200);
  if (!tok) return new Response(null, { status: 204 });
  const v = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: "OAuth " + tok } });
  if (v.ok) { const who = await v.json(); await lounge(env).fetch("https://lounge/bye", { method: "POST", body: JSON.stringify({ id: String(who.user_id || "") }) }); }
  return new Response(null, { status: 204 });
}

// 配信ページのボタン：コマンドを OBS の配信オーバーレイへ（フォロワーの確認は enter と同じ）
// ボタンは 1 秒に 1 回来るので、確かめた結果を 1 分だけ覚えて、そのたびに Twitch と KV にきかない
const PASS = new Map();
async function enterSoon(req, env) {
  const tok = bearer(req), c = tok && PASS.get(tok), now = Date.now();
  if (c && c.until > now) return { who: c.who };
  const e = await enter(req, env);
  if (e.who) { if (PASS.size > 500) PASS.clear(); PASS.set(tok, { who: e.who, until: now + 60000 }); }
  return e;
}
async function remoteCmd(req, env) {
  const e = await enterSoon(req, env);
  if (e.res) return e.res;
  let body;
  try { body = await req.json(); } catch (x) { return json({ error: "json" }, 400); }
  const text = String((body && body.text) || "").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 320);
  if (!/^!\S/.test(text)) return json({ error: "cmd", code: "C03", why: "コマンドではありません" }, 400);
  const room = lounge(env), send = async (n) => (await room.fetch("https://lounge/cmd", { method: "POST", body: JSON.stringify({ id: e.who.id, l: e.who.login, n, text }) })).json();
  let r = await send("");
  if (r.needName) r = await send(await displayName(e.who));
  return json(r, r.ok ? 200 : r.code === "C01" ? 429 : 503);
}
// 表示名（チャットと同じ名前。持ち玉はこの名前で数える）を Twitch から取る
async function displayName(who) {
  let n = who.login;
  try {
    const u = await fetch("https://api.twitch.tv/helix/users?id=" + encodeURIComponent(who.id), { headers: { "Client-Id": who.client, Authorization: "Bearer " + who.tok } });
    if (u.ok) { const j = await u.json(); if (j.data && j.data[0] && j.data[0].display_name) n = String(j.data[0].display_name).slice(0, 40); }
  } catch (x) {}
  return n;
}
// 配信ページの WebSocket（いいね・システムログ・配信につながっているか）：ブラウザの WebSocket はヘッダーを付けられないので、
// まずログインで 1 分だけ使える札をもらい、その札でつなぐ
async function ticket(req, env) {
  const e = await enterSoon(req, env);
  if (e.res) return e.res;
  // 配信者とモデレーター（staff）だけが、配信者用ページで OBS の画面（ミラー）を受け取れる
  const gate = (await env.DB.get("gate", "json")) || {}, staff = !!e.who.id && (e.who.id === gate.owner || !!(gate.mods && gate.mods[e.who.id]));
  const room = lounge(env), ask = async (n) => (await room.fetch("https://lounge/ticket", { method: "POST", body: JSON.stringify({ id: e.who.id, l: e.who.login, n, staff }) })).json();
  let r = await ask("");
  if (r.needName) r = await ask(await displayName(e.who));
  return json(r);
}

async function config(env) {
  const gate = await env.DB.get("gate", "json");
  return json({ clientId: gate ? gate.clientId : "", owner: gate ? gate.owner : "", ready: !!gate });
}

// 配信者用ページで使う rrweb の再生部分（MIT。このリポジトリに置いたもの）。JavaScript として返す
async function replayJs() {
  const r = await fetch(HTML_URL.replace(/index\.html$/, "mx-replay.js"), { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!r.ok) return new Response("", { status: 502 });
  return new Response(await r.text(), { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", ...SEC } });
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
    // 視聴者のバグ報告（配信オーバーレイが送ってためたもの）。Claude が定期的に読みに来て、配信者に知らせる。上げる口と同じ鍵がいる
    if (url.pathname === "/api/bugs" || url.pathname === "/api/bugs/seen") {
      // 鍵が届いていないのか、届いたが違うのかだけ返す（鍵そのものは返さない）
      if (!env.UPLOAD_KEY || !(await sameKey(bearer(req), env.UPLOAD_KEY))) {
        const meta = await (await lounge(env).fetch("https://lounge/bugs/meta")).json().catch(() => ({}));
        return json({ error: "key", got: bearer(req) ? "wrong" : "none", lastOk: meta.lastOk || 0 }, 401); // lastOk：最後に鍵つきで読めた時刻（設定の確認用）
      }
      if (url.pathname === "/api/bugs" && req.method === "GET") return lounge(env).fetch("https://lounge/bugs");
      if (url.pathname === "/api/bugs/seen" && req.method === "POST") return lounge(env).fetch("https://lounge/bugs/seen", { method: "POST", body: await req.text() });
      return json({ error: "method" }, 405);
    }
    // 最近ラウンジに入れなかった人（配信オーバーレイのパネル用。上げる口と同じ鍵がいる）
    if (url.pathname === "/api/denied") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: UP_CORS });
      if (!env.UPLOAD_KEY || !(await sameKey(bearer(req), env.UPLOAD_KEY))) return json({ error: "key" }, 401, UP_CORS);
      return json({ denied: ((await env.DB.get("denied", "json")) || []).slice(-20) }, 200, UP_CORS);
    }
    if (url.pathname === "/api/data" && req.method === "GET") return readData(req, env);
    if (url.pathname === "/api/cmd" && req.method === "POST") return remoteCmd(req, env);
    if (url.pathname === "/api/ticket" && req.method === "POST") return ticket(req, env);
    if (url.pathname === "/api/live") {
      if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json({ error: "upgrade" }, 426);
      return lounge(env).fetch(new Request("https://lounge/live" + url.search, req));
    }
    // OBS の配信オーバーレイがつなぐ口（つないだあと、最初に上げる鍵を送る）
    if (url.pathname === "/api/obs") {
      if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json({ error: "upgrade" }, 426, UP_CORS);
      return lounge(env).fetch(new Request("https://lounge/obs", req));
    }
    // OBS の 2 画面（オーバーレイ・鹿物語）が、配信者用ページへ画面をそのまま映す（ミラー）ためにつなぐ口
    if (url.pathname === "/api/mirror") {
      if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return json({ error: "upgrade" }, 426, UP_CORS);
      return lounge(env).fetch(new Request("https://lounge/mirror", req));
    }
    if (url.pathname === "/api/ping" && req.method === "GET") return ping(req, env);
    if (url.pathname === "/api/bye" && req.method === "POST") return bye(req, env);
    if (url.pathname === "/api/config" && req.method === "GET") return config(env);
    if (url.pathname.startsWith("/api/")) return json({ error: "notfound" }, 404);
    if (url.pathname === "/mx-replay.js" && req.method === "GET") return replayJs();
    if (req.method !== "GET" && req.method !== "HEAD") return json({ error: "method" }, 405);
    return page();
  }
}

// ミラー（配信者用ページに OBS の画面を映す）を止めておく：OBS には「見ている人は 0 人」と伝え、記録させない。
// 配信中にオーバーレイが止まったため（2026-10-17）。OBS 側を軽くして確かめるまで止める
const MX_PAUSED = true;
// 記録させる OBS の版（鍵といっしょに送ってくる v）。build 39 の OBS（v なし）は、キャンバスの絵を GPU から待って読み出すので、
// 見ている人がいても記録させない（自動で新しい版になるまで「0 人」と伝える）
const MX_V = 2;

// ---------- いまラウンジにいる人（1 つだけの部屋）----------
export class Lounge {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.map = {};
    this.last = {};  // 1 人 1 秒に 1 回の見張り（id → 最後に受けた時刻）
    this.names = {}; // id → 表示名（ラウンジから出たあとも覚えておく）
    this.tickets = {};  // 配信ページの WebSocket の札（1 分だけ）
    this.lastLike = {}; // いいねの見張り（id → 最後に受けた時刻）
    this.likes = {};    // コメントのいいねの数（コメントの id → 数。新しい 300 件）
    this.bugs = [];     // 視聴者のバグ報告（新しい 200 件。seen は Claude が配信者に知らせた時刻）
    this.mxAsk = {};    // ミラーの素材の頼みの見張り（id → [10 秒の間の数, 始まり]）
    state.blockConcurrencyWhile(async () => { this.map = (await state.storage.get("here")) || {}; this.likes = (await state.storage.get("likes")) || {}; this.bugs = (await state.storage.get("bugs")) || []; this.bugsReadAt = (await state.storage.get("bugsReadAt")) || 0; });
    // OBS からの "ping" には部屋を起こさずに "pong" と返す
    try { state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong")); } catch (e) {}
  }
  att(ws) { try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; } }
  // OBS の配信オーバーレイ（鍵が合ったもの）と、配信ページを開いている人
  obsSockets(but) { return this.state.getWebSockets("obs").filter((ws) => ws !== but && this.att(ws).ok); }
  viewers() { return this.state.getWebSockets("v"); }
  toViewers(o) { const s = JSON.stringify(o); this.viewers().forEach((ws) => { try { ws.send(s); } catch (e) {} }); }
  // ---- ミラー：OBS の 2 画面（ov：オーバーレイ・pa：鹿物語）の変化を、配信者・モデの配信者用ページ（見ている人）へ中継する ----
  // 映像より早く届くので、配信者とモデレーターにだけ渡す（ほかの人に渡すと早押しのミニゲームで有利になってしまう）
  mxAll(src, but) { return this.state.getWebSockets("mx").filter((w) => { const x = this.att(w); return w !== but && x.ok && (!src || x.src === src); }); }
  mxLeaders(src, but) { return this.mxAll(src, but).filter((w) => (this.att(w).ver || 0) >= MX_V); } // 記録させてよい版のものだけ
  mxFollowers(but) { return this.viewers().filter((w) => { const x = this.att(w); return w !== but && x.mx && x.staff; }); }
  // 見ている人の数（n）と、音を聞いている人の数（a）を OBS に知らせる（0 なら記録・音をやめる）。snap：いまの画面をまるごと送り直してもらう
  mxTell(snap, but) {
    const f = MX_PAUSED ? [] : this.mxFollowers(but), s = JSON.stringify({ t: "mx", n: f.length, a: f.filter((w) => this.att(w).au).length, snap: snap ? 1 : 0 });
    this.mxLeaders().forEach((w) => { try { w.send(s); } catch (e) {} });
  }
  mxToFollowers(s, to, but) { this.mxFollowers(but).forEach((w) => { if (!to || this.att(w).v === to) try { w.send(s); } catch (e) {} }); }
  async mxFromLeader(ws, a, msg) {
    if (typeof msg !== "string") return;
    if (!a.ok) { // 最初に鍵と、どちらの画面か
      let m; try { m = JSON.parse(msg); } catch (e) { return; }
      const src = m && (m.src === "ov" || m.src === "pa") ? m.src : "";
      const ok = !!src && m.auth != null && !!this.env.UPLOAD_KEY && (await sameKey(String(m.auth), this.env.UPLOAD_KEY));
      const ver = Math.max(0, Math.min(99, Math.floor(+m.v) || 0));
      ws.serializeAttachment({ mxl: 1, ok, src, ver, at: Date.now() });
      ws.send(JSON.stringify({ t: "auth", ok }));
      if (!ok) { ws.close(4001, "key"); return; }
      this.mxAll(src, ws).forEach((w) => { try { w.close(1000, "replaced"); } catch (e) {} }); // OBS で開き直したら古いほうを閉じる
      const f = MX_PAUSED || ver < MX_V ? [] : this.mxFollowers();
      ws.send(JSON.stringify({ t: "mx", n: f.length, a: f.filter((w) => this.att(w).au).length, snap: 1 }));
      if (ver >= MX_V) this.mxToFollowers(JSON.stringify({ t: "mx-src", src, on: 1 }));
      return;
    }
    if ((a.ver || 0) < MX_V) return; // 古い版の OBS からは受け取らない
    if (msg.length > 1100000) return;
    const k = msg.slice(0, 2);
    // mx：画面の変化・mc：大きいものの小分け（"mx" / "mc" ＋ 画面 ＋ "|" ＋ 中身）→ 見ている全員へ。自分の画面のものだけ
    if (k === "mx" || k === "mc") { if (msg.slice(2, 5) === a.src + "|") this.mxToFollowers(msg); return; }
    // ma：音（"ma" ＋ 画面 ＋ "|" ＋ …）→ 音を聞いている人だけへ
    if (k === "ma") { if (msg.slice(2, 5) === a.src + "|") this.mxFollowers().forEach((w) => { if (this.att(w).au) try { w.send(msg); } catch (e) {} }); return; }
    // mm：素材の情報・mb：素材の中身（"mm" / "mb" ＋ 頼んだ人の id ＋ "|" ＋ 中身）→ 頼んだ人だけへ
    if (k === "mm" || k === "mb") { const bar = msg.indexOf("|"), to = msg.slice(2, bar); if (bar > 2 && /^\d{1,20}$/.test(to)) this.mxToFollowers(msg, to); }
  }
  async webSocketMessage(ws, msg) {
    const a0 = this.att(ws);
    if (a0.mxl) return this.mxFromLeader(ws, a0, msg);
    let m; try { m = JSON.parse(typeof msg === "string" ? msg : new TextDecoder().decode(msg)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;
    const a = this.att(ws), now = Date.now();
    if (a.v) { // 配信ページから
      if (m.t === "hi") ws.send(JSON.stringify({ t: "hello", obs: this.obsSockets().length ? 1 : 0, likes: this.likes }));
      // 配信者用ページ：OBS の画面（ミラー）を見はじめる。配信者とモデレーターだけ。両方の画面に「いまの画面をまるごと」送ってもらう
      if (m.t === "mx-join") {
        if (!a.staff) { ws.send(JSON.stringify({ t: "mx-no" })); return; }
        if (!a.mx) ws.serializeAttachment({ ...a, mx: 1 });
        ws.send(JSON.stringify({ t: "mx-ok", ov: this.mxLeaders("ov").length ? 1 : 0, pa: this.mxLeaders("pa").length ? 1 : 0 }));
        this.mxTell(true);
        return;
      }
      // 見ている人から：配信者用ページを離れた（ふつうの配信ページに戻った）
      if (m.t === "mx-leave" && a.mx) { ws.serializeAttachment({ ...a, mx: 0, au: 0 }); this.mxTell(false); return; }
      // 見ている人から：音を聞く・やめる
      if (m.t === "mx-audio" && a.mx && a.staff) { const au = m.on ? 1 : 0; if (!!a.au !== !!au) { ws.serializeAttachment({ ...a, au }); this.mxTell(false); } return; }
      // 見ている人から：素材を頼む（mx-get：情報・mx-pull：中身）・画面を送り直してもらう（mx-snap）。10 秒に 60 回まで
      if ((m.t === "mx-get" || m.t === "mx-pull" || m.t === "mx-snap") && a.mx && a.staff) {
        const q = this.mxAsk[a.v] && now - this.mxAsk[a.v][1] < 10000 ? this.mxAsk[a.v] : (this.mxAsk[a.v] = [0, now]);
        if (++q[0] > 60) return;
        if (m.t === "mx-snap") { this.mxTell(true); return; }
        if (m.src !== "ov" && m.src !== "pa") return;
        // 頼めるのは、画面に出ている動画・画像（blob か http(s) の URL）と、pachinko-assets の中の動画・画像の名前だけ（OBS 側でも同じように確かめる）
        const id = String(m.id || ""), url = String(m.url || ""), alt = String(m.alt || "");
        if (!/^[\w-]{1,40}$/.test(id)) return;
        if (url && (url.length > 600 || !/^(blob:)?https?:\/\/[^\s"'<>\\]+$/i.test(url) || url.includes(".."))) return;
        if (alt && (alt.length > 300 || !/^pachinko-assets\/[\w\-\/.]+\.(mp4|webm|png|jpe?g|webp|gif|svg)$/i.test(alt) || alt.includes(".."))) return;
        const out = JSON.stringify({ t: m.t, id, url, alt, from: a.v });
        this.mxLeaders(m.src).forEach((w) => { try { w.send(out); } catch (e) {} });
        return;
      }
      if (m.t === "like" && typeof m.id === "string" && /^[\w-]{1,64}$/.test(m.id)) {
        if (this.lastLike[a.v] && now - this.lastLike[a.v] < 300) return;
        this.lastLike[a.v] = now;
        const obs = this.obsSockets();
        if (!obs.length) { ws.send(JSON.stringify({ t: "err", id: m.id, code: "C02", why: "配信オーバーレイがつながっていません（配信していないときは使えません）" })); return; }
        const s = JSON.stringify({ t: "like", id: m.id, by: a.n, byId: a.v });
        obs.forEach((o) => { try { o.send(s); } catch (e) {} });
      }
      return;
    }
    if (m.auth != null) { // OBS：最初に上げる鍵
      const ok = !!this.env.UPLOAD_KEY && (await sameKey(String(m.auth), this.env.UPLOAD_KEY));
      ws.serializeAttachment({ ok, at: now });
      ws.send(JSON.stringify({ t: "auth", ok }));
      if (!ok) ws.close(4001, "key"); else this.toViewers({ t: "obs", on: 1 });
      return;
    }
    if (!a.ok) return;
    // OBS から：確かめたいいねの数・配信のコメント欄に出たシステムログ
    if (m.t === "likes" && typeof m.id === "string" && /^[\w-]{1,64}$/.test(m.id) && m.c >= 0) {
      delete this.likes[m.id]; this.likes[m.id] = Math.floor(+m.c) || 0;
      const ks = Object.keys(this.likes); ks.slice(0, Math.max(0, ks.length - 300)).forEach((k) => delete this.likes[k]);
      this.toViewers({ t: "likes", id: m.id, c: this.likes[m.id], byId: String(m.byId || "").slice(0, 20) });
      await this.state.storage.put("likes", this.likes);
    }
    // OBS から：MONO LINK にいまいる人の名前（ラウンジに 3 分以内に来た人と、配信ページを開いている人）。鹿物語の「みんなに玉」に使う
    if (m.t === "who") {
      for (const k of Object.keys(this.map)) if (now - this.map[k].at > HERE_MS) delete this.map[k];
      const names = new Set();
      Object.values(this.map).forEach((x) => { const n = x.n || x.l; if (n) names.add(String(n).slice(0, 40)); });
      this.viewers().forEach((v) => { const n = this.att(v).n; if (n) names.add(String(n).slice(0, 40)); });
      ws.send(JSON.stringify({ t: "who", id: String(m.id || "").slice(0, 40), names: [...names].slice(0, 500) }));
      return;
    }
    if (m.t === "sys" && typeof m.text === "string" && m.text.trim()) this.toViewers({ t: "sys", text: m.text.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 300), at: now });
    // OBS から：バグ報告（同じ id は 1 回だけ）。受け取ったら返事をして、OBS 側は送り直さない
    if (m.t === "bug" && typeof m.id === "string" && /^[\w-]{1,40}$/.test(m.id) && typeof m.text === "string" && m.text.trim()) {
      if (!this.bugs.some((b) => b.id === m.id)) {
        // 制御文字と、文字の向きを変える見えない文字は消す（あとで人と Claude が読むので）
        const clean = (v, n) => String(v || "").replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g, " ").slice(0, n);
        this.bugs.push({ id: m.id, name: clean(m.name, 40), text: clean(m.text, 300), ctx: clean(m.ctx, 80), at: +m.at || now, got: now, seen: 0 });
        this.bugs = this.bugs.slice(-200);
        await this.state.storage.put("bugs", this.bugs);
      }
      ws.send(JSON.stringify({ t: "bugok", id: m.id }));
    }
  }
  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) {}
    const a = this.att(ws);
    if (a.mxl) { if (a.ok && !this.mxLeaders(a.src, ws).length) this.mxToFollowers(JSON.stringify({ t: "mx-src", src: a.src, on: 0 })); return; }
    if (a.mx) this.mxTell(false, ws); // 見ている人が減った（0 になったら OBS は記録をやめる）
    if (a.ok && !this.obsSockets(ws).length) this.toViewers({ t: "obs", on: 0 });
  }
  async webSocketError() {}
  // OBS の口（obs・mx）：鍵をまだ送っていないつなぎだけを片づける（10 秒たったもの。多すぎるときは古いものから）。
  // 鍵の合ったつなぎは、知らない人がたくさんつないできても閉じない
  trimPending(tag, now) {
    const pend = this.state.getWebSockets(tag).filter((w) => !this.att(w).ok);
    pend.forEach((w, i) => { if (now - (this.att(w).at || 0) > 10000 || i < pend.length - 5) try { w.close(1000, "too many"); } catch (e) {} });
  }
  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    if (url.pathname === "/obs" || url.pathname === "/mirror") this.trimPending(url.pathname === "/obs" ? "obs" : "mx", now);
    if (url.pathname === "/obs") {
      const pair = new WebSocketPair(), client = pair[0], server = pair[1];
      this.state.acceptWebSocket(server, ["obs"]);
      server.serializeAttachment({ ok: false, at: now });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === "/mirror") {
      const pair = new WebSocketPair(), client = pair[0], server = pair[1];
      this.state.acceptWebSocket(server, ["mx"]);
      server.serializeAttachment({ mxl: 1, ok: false, at: now });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === "/bugs/meta") return new Response(JSON.stringify({ lastOk: this.bugsReadAt || 0 }));
    if (url.pathname === "/bugs") { this.bugsReadAt = now; await this.state.storage.put("bugsReadAt", now); return new Response(JSON.stringify({ bugs: this.bugs.slice(-100) }), { headers: { "Content-Type": "application/json; charset=utf-8" } }); }
    if (url.pathname === "/bugs/seen") {
      const b = await req.json().catch(() => ({})), ids = Array.isArray(b.ids) ? b.ids.map(String) : [];
      let n = 0; this.bugs.forEach((x) => { if (!x.seen && (b.all || ids.indexOf(x.id) >= 0)) { x.seen = now; n++; } });
      if (n) await this.state.storage.put("bugs", this.bugs);
      return new Response(JSON.stringify({ ok: true, marked: n }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/ticket") {
      const b = await req.json().catch(() => ({}));
      const id = /^\d{1,20}$/.test(String(b.id || "")) ? String(b.id) : "";
      if (!id) return new Response(JSON.stringify({ error: "id" }), { status: 400 });
      if (typeof b.n === "string" && b.n) this.names[id] = b.n.slice(0, 40);
      const name = this.names[id] || (this.map[id] && this.map[id].n) || "";
      if (!name) return new Response(JSON.stringify({ needName: true }));
      for (const k of Object.keys(this.tickets)) if (this.tickets[k].until < now) delete this.tickets[k];
      const tk = crypto.randomUUID();
      this.tickets[tk] = { id, n: name, staff: b.staff === true, until: now + 60000 };
      return new Response(JSON.stringify({ ticket: tk }));
    }
    if (url.pathname === "/live") {
      const tk = url.searchParams.get("ticket") || "", t = this.tickets[tk];
      delete this.tickets[tk];
      if (!t || t.until < now) return new Response("ticket", { status: 403 });
      // 1 人 3 つまで・全部で 500 まで（古いものから閉じる）
      const mine = this.viewers().filter((w) => this.att(w).v === t.id);
      mine.slice(0, Math.max(0, mine.length - 2)).forEach((w) => { try { w.close(1000, "too many"); } catch (e) {} });
      const vs = this.viewers();
      if (vs.length >= 500) vs.slice(0, vs.length - 499).forEach((w) => { try { w.close(1000, "too many"); } catch (e) {} });
      const pair = new WebSocketPair(), client = pair[0], server = pair[1];
      this.state.acceptWebSocket(server, ["v"]);
      server.serializeAttachment({ v: t.id, n: t.n, staff: t.staff ? 1 : 0 });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === "/cmd") {
      const b = await req.json().catch(() => ({}));
      const id = /^\d{1,20}$/.test(String(b.id || "")) ? String(b.id) : "";
      const res = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
      if (!id) return res({ ok: false, code: "C03", why: "コマンドではありません" });
      if (this.last[id] && now - this.last[id] < 1000) return res({ ok: false, code: "C01", why: "1 秒に 1 回までです" });
      if (typeof b.n === "string" && b.n) this.names[id] = b.n.slice(0, 40);
      const name = this.names[id] || (this.map[id] && this.map[id].n) || "";
      if (!name) return res({ needName: true });
      const socks = this.obsSockets();
      if (!socks.length) return res({ ok: false, code: "C02", why: "配信オーバーレイがつながっていません（配信していないときは使えません）" });
      this.last[id] = now;
      const msg = JSON.stringify({ t: "cmd", n: name, l: String(b.l || "").slice(0, 40), id, text: String(b.text || "").slice(0, 320), at: now });
      socks.forEach((ws) => { try { ws.send(msg); } catch (e) {} });
      return res({ ok: true });
    }
    for (const k of Object.keys(this.map)) if (now - this.map[k].at > HERE_MS) delete this.map[k];
    let needName = false;
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = /^\d{1,20}$/.test(String(b.id || "")) ? String(b.id) : "";
      if (id && url.pathname === "/beat") {
        const old = this.map[id] || {};
        const n = typeof b.n === "string" && b.n ? b.n.slice(0, 40) : old.n || "";
        this.map[id] = { n, l: String(b.l || old.l || "").slice(0, 40), at: now };
        if (n) this.names[id] = n;
        needName = !n;
      }
      if (id && url.pathname === "/bye") delete this.map[id];
      await this.state.storage.put("here", this.map);
    }
    const list = Object.values(this.map).filter((x) => x.n || x.l).map((x) => ({ n: x.n || x.l, l: x.l }));
    return new Response(JSON.stringify({ needName, list, obs: this.obsSockets().length }), { headers: { "Content-Type": "application/json" } });
  }
}
