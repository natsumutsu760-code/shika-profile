// おたこまるさん 専用の 窓口（カスタマーセンター風の チャット。鹿さんの決め、2026-10-28）
// 書く 人と 入り方（だれが 書いたかは 入り方で 決める。文の 中身では 決めない）
// - おたこまるさん・鹿さん：MONO LINK の サイトに Twitch で ログイン（/api/support）
// - おたこまるさんの Claude：窓口の 合言葉（おたこまるさんの 画面に だけ 出る。/api/support/agent）
// - こちらの Claude：門番の 鍵 UPLOAD_KEY（/api/support/claude）
// 文は 報告・相談。パッチ・アップデートの 最終決定は 鹿さん（CLAUDE.md・Obsidian の「絶対のルール」）。画面は かならず エスケープして 出す
const OTAKO = "420214272", SHIKA = "1140507103";
const KEY = "support:" + OTAKO, TOK = "support:tok", MAX = 300, LEN = 4000, GAP = 2000;
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const bearer = (req) => { const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || ""); return m ? m[1].trim() : ""; };
// 鍵の くらべ（かかる 時間で 中身が わからない ように、ハッシュを 全部 くらべる）
async function same(a, b) {
  if (!a || !b) return false;
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
const newTok = () => [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
const load = async (env) => (await env.DB.get(KEY, "json")) || { list: [], n: 0, last: {} };
const view = (s, since) => ({ list: s.list.filter((m) => m.id > since), last: s.n });

async function add(env, from, body) {
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > LEN) return J({ ok: false, why: `文は 1〜${LEN} 文字` }, 400);
  const s = await load(env), now = Date.now();
  s.last ||= {};
  if (now - (s.last[from] || 0) < GAP) return J({ ok: false, why: "少し 待ってから 送って ください" }, 429);
  s.n++; s.last[from] = now;
  s.list.push({ id: s.n, at: now, from, text });
  s.list = s.list.slice(-MAX);
  await env.DB.put(KEY, JSON.stringify(s));
  return J({ ok: true, id: s.n });
}
async function body(req) { try { return await req.json(); } catch (e) { return null; } }

// h：{ enterSoon }（loungeApi と 同じ）
export async function supportApi(req, env, url, h) {
  const p = url.pathname, since = Math.max(0, +url.searchParams.get("since") || 0);
  if (p === "/api/support/claude" || p === "/api/support/agent") {
    const claude = p.endsWith("claude"), key = claude ? env.UPLOAD_KEY : await env.DB.get(TOK);
    if (!key || !(await same(bearer(req), key))) return J({ error: "key" }, 401);
    if (req.method === "GET") return J(view(await load(env), since));
    if (req.method === "POST") return add(env, claude ? "claude" : "otako_ai", await body(req));
    return J({ error: "method" }, 405);
  }
  if (p !== "/api/support" && p !== "/api/support/token") return null;
  const e = await h.enterSoon(req, env); if (e.res) return e.res;
  const id = String(e.who.id), otako = id === OTAKO || id === env.SUPPORT_TEST;   // SUPPORT_TEST：見本と 試験だけ
  if (!otako && id !== SHIKA) return J({ error: "none" }, 404);
  if (p === "/api/support/token") {   // 合言葉を 作りなおす（前の 合言葉は 使えなく なる）
    if (!otako || req.method !== "POST") return J({ error: "none" }, 404);
    const t = newTok(); await env.DB.put(TOK, t); return J({ ok: true, token: t });
  }
  if (req.method === "POST") return add(env, otako ? "otako" : "shika", await body(req));
  let token;
  if (otako) { token = await env.DB.get(TOK); if (!token) { token = newTok(); await env.DB.put(TOK, token); } }
  return J({ me: otako ? "otako" : "shika", ...view(await load(env), since), ...(token ? { token } : {}) });
}
