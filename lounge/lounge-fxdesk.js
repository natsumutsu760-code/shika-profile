// FX の 窓口（Discord から FX の Claude に 頼む。2026-11-20 鹿さんの カード「窓口と 同じ 形を Discord で」）
// サポート窓口（lounge-support.js）と 同じ 形：書いた 文は 箱に しまい、GitHub の 受付の PR に 1 行 知らせる → その PR を 見て いる FX の スレッドが 起きて 読み、返事を 書く
// 入口
// - Discord：/api/fxdesk/discord（Discord の「スラッシュコマンド」/fx。Discord の 署名〈Ed25519〉を 確かめる。だれかは Discord の id で 決める。文の 名乗りでは 決めない）
// - FX の Claude：/api/fxdesk/claude（門番の 鍵 UPLOAD_KEY。GET で 読む・POST で 返事 → ボットが その チャンネルに 書く）
// - はじめの 1 回：/api/fxdesk/setup（UPLOAD_KEY。/fx の コマンドを Discord に 登録する）
// 設定（Cloudflare）：FX_DESK_APP_ID・FX_DESK_PUBKEY（Discord の アプリの 番号と 公開鍵）・FX_DESK_USERS（使える 人の Discord の id。「,」で 区切る）・
//   FX_DESK_BOT_TOKEN（ボットの 鍵。秘密に 入れる。ここにも リポジトリにも 書かない）・FX_INBOX（"owner/repo#番号"。知らせる 受付の PR）。トークンは 窓口と 同じ GH_INBOX_TOKEN
// 文は メンバーの 頼み（報告・提案）。お金の 数・ルールを 採るか・本物の 口座で 動かすかの 最終決定は 鹿さん（FX の リポジトリの CLAUDE.md）
// 記録は 依頼の 箱（Durable Object「Market」）に 間借り：fx:meta（最後の 番号・知らせた 時・返事を 書く チャンネル）・fx:m:<番号>（文 1 つ）
// GitHub の コメントには 文の 中身を 書かない（番号と だれかだけ。中身は 窓口で 読む）

const MAX = 300, LEN = 4000, REPLY = 8000, NOTIFY_GAP = 20000, SKEW = 300, OPT = "依頼";
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const bearer = (req) => { const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || ""); return m ? m[1].trim() : ""; };
async function same(a, b) {   // 鍵の くらべ（かかる 時間で 中身が わからない ように、ハッシュを 全部 くらべる）
  if (!a || !b) return false;
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
const hex = (s) => new Uint8Array((String(s).match(/../g) || []).map((h) => parseInt(h, 16)));
const users = (env) => String(env.FX_DESK_USERS || "").split(",").map((s) => s.trim()).filter((s) => /^\d{1,20}$/.test(s));
const oneLine = (s, n) => String(s || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, n);

// ---- 箱（Market）の 中。Market の fetch で：const fx = await fxdeskFetch(this, url, b); if (fx) return fx; ----
const R = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
const pad = (n) => "fx:m:" + String(n).padStart(6, "0");
export async function fxdeskFetch(mk, url, b) {
  if (!url.pathname.startsWith("/fxdesk/")) return null;
  const st = mk.state.storage, p = url.pathname.slice(8);
  const one = (f) => (mk.fxQ = (mk.fxQ || Promise.resolve()).then(f, f));   // 書く 頼みは 1 つずつ（番号が かさならない）
  if (p === "view") {
    const since = Math.max(0, +url.searchParams.get("since") || 0), meta = (await st.get("fx:meta")) || { n: 0 };
    const list = [...(await st.list({ prefix: "fx:m:" })).values()].filter((m) => m.id > since).sort((a, c) => a.id - c.id);
    return R({ list, last: meta.n });
  }
  if (p === "add") return one(async () => {
    const meta = (await st.get("fx:meta")) || { n: 0, told: 0, ch: "" }, now = Date.now(), claude = b.from === "claude";
    meta.n++;
    const notify = !!b.inbox && !claude && now - (meta.told || 0) >= NOTIFY_GAP;   // 続けて 来たら 20 秒に 1 回（起きたら まとめて 読む）
    if (notify) meta.told = now;
    if (!claude && /^\d{1,20}$/.test(String(b.ch || ""))) meta.ch = String(b.ch);   // 返事は さいごに 頼まれた チャンネルへ
    const m = { id: meta.n, at: now, from: claude ? "claude" : "member", name: claude ? "FX の Claude" : oneLine(b.name, 40), text: String(b.text || "") };
    if (!claude) m.uid = String(b.uid || "");
    await st.put(pad(meta.n), m);
    if (meta.n > MAX) await st.delete(pad(meta.n - MAX));
    await st.put("fx:meta", meta);
    return R({ ok: true, id: meta.n, notify, ch: meta.ch || "" });
  });
  return R({ ok: false, status: 404, why: "none" });
}

// ---- 門番の 入口 ----
const ask = async (env, path, body) => (await env.MARKET.get(env.MARKET.idFromName("market"))
  .fetch("https://market/fxdesk/" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined)).json();

// Discord の 署名（X-Signature-Ed25519 ＝ 時刻 ＋ 中身 の 署名）。古い 時刻（5 分より 前）は ことわる（同じ 頼みの 送り直しを ふせぐ）
async function signed(req, env, raw) {
  const sig = req.headers.get("X-Signature-Ed25519") || "", ts = req.headers.get("X-Signature-Timestamp") || "";
  if (!/^[0-9a-f]{64}$/i.test(String(env.FX_DESK_PUBKEY || "")) || !/^[0-9a-f]{128}$/i.test(sig) || !/^\d{1,12}$/.test(ts)) return false;
  if (Math.abs(Date.now() / 1000 - +ts) > SKEW) return false;
  const msg = new TextEncoder().encode(ts + raw);
  for (const alg of [{ name: "Ed25519" }, { name: "NODE-ED25519", namedCurve: "NODE-ED25519" }]) {   // 後ろは 古い Workers の 名前
    try {
      const key = await crypto.subtle.importKey("raw", hex(env.FX_DESK_PUBKEY), alg, false, ["verify"]);
      return await crypto.subtle.verify(alg, key, hex(sig), msg);
    } catch (e) {}
  }
  return false;
}
async function tell(env, id, name) {
  const m = /^([\w.-]+)\/([\w.-]+)#(\d+)$/.exec(env.FX_INBOX || "");
  if (!m || !env.GH_INBOX_TOKEN) return;
  try {
    await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}/issues/${m[3]}/comments`, { method: "POST", signal: AbortSignal.timeout(1500),
      headers: { Authorization: "Bearer " + env.GH_INBOX_TOKEN, Accept: "application/vnd.github+json", "User-Agent": "mono-link-fxdesk", "Content-Type": "application/json" },
      body: JSON.stringify({ body: `FX 窓口に 新しい 文（#${id}・${name}）` }) });
  } catch (e) {}   // 知らせが 届かなくても 文は 窓口に のこる（Discord には 3 秒で 答えないと いけないので 待ちすぎない）
}
const say = (content, eph) => J({ type: 4, data: { content, allowed_mentions: { parse: [] }, ...(eph ? { flags: 64 } : {}) } });   // 64：本人だけに 見える

async function discord(req, env) {
  const raw = await req.text();
  if (!(await signed(req, env, raw))) return J({ error: "signature" }, 401);
  let it; try { it = JSON.parse(raw); } catch (e) { return J({ error: "json" }, 400); }
  if (it.type === 1) return J({ type: 1 });   // Discord の 確かめ（つなぐ ときに 来る）
  if (it.type !== 2 || !it.data || it.data.name !== "fx") return say("この コマンドは ありません。", true);
  const u = (it.member && it.member.user) || it.user || {}, uid = String(u.id || "");
  if (!users(env).includes(uid)) return say("この 窓口は 決まった 人だけが 使えます。", true);
  const o = (it.data.options || []).find((x) => x.name === OPT), text = o && typeof o.value === "string" ? o.value.trim() : "";
  if (!text || text.length > LEN) return say(`頼む 文は 1〜${LEN} 文字で 書いて ください。`, true);
  const name = oneLine((it.member && it.member.nick) || u.global_name || u.username, 32) || "メンバー";
  const inbox = /^[\w.-]+\/[\w.-]+#\d+$/.test(env.FX_INBOX || "") && !!env.GH_INBOX_TOKEN;
  const r = await ask(env, "add", { from: "member", uid, name, text, ch: it.channel_id, inbox });
  if (!r.ok) return say("受けとれませんでした。少し 待って もう一度 送って ください。", true);
  if (r.notify) await tell(env, r.id, name);
  const shown = text.length > 1700 ? text.slice(0, 1700) + "…（つづきも 受けとりました）" : text;
  return say(`受付 #${r.id}（${name}）\n>>> ${shown}\n\nFX の Claude が 起きたら、この チャンネルに 返事します。`);
}

// 長い 返事は Discord の 1 回 2000 文字に 合わせて 分ける（行の 切れ目で）
function parts(text, n = 1900) {
  const out = []; let s = text;
  while (s.length > n) { let k = s.lastIndexOf("\n", n); if (k < n / 2) k = n; out.push(s.slice(0, k)); s = s.slice(k).replace(/^\n/, ""); }
  if (s) out.push(s);
  return out;
}
async function post(env, ch, text) {
  if (!env.FX_DESK_BOT_TOKEN) return { sent: 0, why: "ボットの 鍵が ない" };
  if (!ch) return { sent: 0, why: "まだ だれも Discord で 頼んで いない（返事を 書く チャンネルが ない）" };
  let sent = 0;
  for (const p of parts(text)) {
    const r = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, { method: "POST",
      headers: { Authorization: "Bot " + env.FX_DESK_BOT_TOKEN, "Content-Type": "application/json", "User-Agent": "DiscordBot (https://mono-link.deerman247.workers.dev, 1)" },
      body: JSON.stringify({ content: p, allowed_mentions: { parse: [] } }) }).catch(() => null);
    if (!r || !r.ok) return { sent, why: "Discord に 書けなかった（" + (r ? r.status : "つながらない") + "）" };
    sent++;
  }
  return { sent };
}
async function setup(env) {   // /fx を 登録（同じ 物を もう一度 送っても 同じ）
  if (!/^\d{1,20}$/.test(String(env.FX_DESK_APP_ID || "")) || !env.FX_DESK_BOT_TOKEN) return J({ ok: false, why: "FX_DESK_APP_ID と FX_DESK_BOT_TOKEN が いる" }, 400);
  const cmd = [{ name: "fx", type: 1, description: "FX の Claude に 頼む（日本語で）",
    options: [{ type: 3, name: OPT, description: "頼む こと", required: true, max_length: LEN }] }];
  const r = await fetch(`https://discord.com/api/v10/applications/${env.FX_DESK_APP_ID}/commands`, { method: "PUT",
    headers: { Authorization: "Bot " + env.FX_DESK_BOT_TOKEN, "Content-Type": "application/json", "User-Agent": "DiscordBot (https://mono-link.deerman247.workers.dev, 1)" },
    body: JSON.stringify(cmd) }).catch(() => null);
  return J({ ok: !!(r && r.ok), status: r ? r.status : 0 }, r && r.ok ? 200 : 502);
}
async function body(req) { try { return await req.json(); } catch (e) { return null; } }

export async function fxdeskApi(req, env, url) {
  const p = url.pathname;
  if (p === "/api/fxdesk/discord") return req.method === "POST" ? discord(req, env) : J({ error: "method" }, 405);
  if (p !== "/api/fxdesk/claude" && p !== "/api/fxdesk/setup") return J({ error: "notfound" }, 404);
  if (!env.UPLOAD_KEY || !(await same(bearer(req), env.UPLOAD_KEY))) return J({ error: "key" }, 401);
  if (p === "/api/fxdesk/setup") return req.method === "POST" ? setup(env) : J({ error: "method" }, 405);
  if (req.method === "GET") return J(await ask(env, "view?since=" + Math.max(0, +url.searchParams.get("since") || 0)));
  if (req.method !== "POST") return J({ error: "method" }, 405);
  const b = await body(req), text = b && typeof b.text === "string" ? b.text.trim() : "";
  if (!text || text.length > REPLY) return J({ ok: false, why: `返事は 1〜${REPLY} 文字` }, 400);
  const r = await ask(env, "add", { from: "claude", text });
  return J({ ok: true, id: r.id, ...(await post(env, r.ch, text)) });
}
