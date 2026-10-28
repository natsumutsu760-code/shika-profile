// おたこまるさん 専用の 窓口（カスタマーセンター風の チャット。鹿さんの決め、2026-10-28）
// 書く 人と 入り方（だれが 書いたかは 入り方で 決める。文の 中身では 決めない）
// - おたこまるさん・鹿さん：MONO LINK の サイトに Twitch で ログイン（/api/support）
// - おたこまるさんの Claude：窓口の 合言葉（おたこまるさんの 画面に だけ 出る。/api/support/agent）
// - こちらの Claude：門番の 鍵 UPLOAD_KEY（/api/support/claude）
// 文は 報告・相談。パッチ・アップデートの 最終決定は 鹿さん（CLAUDE.md・Obsidian の「絶対のルール」）。画面は かならず エスケープして 出す
// 記録は 依頼の 箱（Durable Object「Market」。闘技場と 同じ ように 間借り）に しまう。前は KV で、読む 場所に よって 最大 60 秒 おくれ、
//   古い 記録に 足して 書くと 相手の 文を 上書きする ことが あった（鹿さんの決め「きちんと 直す」、2026-10-28）。はじめて 開いた ときに KV の 前の 記録を 1 回だけ 写す
//   箱の 中：s:meta（最後の 番号・人ごとの 前に 書いた 時・知らせた 時）・s:m:<番号>（文 1 つ）・s:tok（合言葉）
// 知らせ：こちらの Claude 以外が 書いたら、GitHub の 受付の PR に 1 行 コメントする（その コメントで こちらの Claude の セッションが 起きる）
//   env.GH_INBOX ＝ "owner/repo#番号"・env.GH_INBOX_TOKEN ＝ その リポジトリだけの トークン（鹿さんが Cloudflare の 秘密に 入れる）。どちらか ない ときは 何も しない
//   コメントには 文の 中身を 書かない（番号と だれかだけ。中身は 窓口で 読む）
const OTAKO = "420214272", SHIKA = "1140507103";
const OLD = "support:" + OTAKO, OLD_TOK = "support:tok", MAX = 300, LEN = 4000, GAP = 2000, NOTIFY_GAP = 20000;
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
const NAME = { otako: "おたこまるさん", otako_ai: "おたこまるさんの Claude", shika: "鹿さん" };

// ---- 箱（Market）の 中。Market の fetch で：const sp = await supportFetch(this, url, b); if (sp) return sp; ----
const R = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
const pad = (n) => "s:m:" + String(n).padStart(6, "0");
async function ready(mk) {   // はじめて 開いた とき：KV の 前の 記録と 合言葉を 写す（KV は 消さずに のこす）
  const st = mk.state.storage;
  if (await st.get("s:meta")) return;
  const old = (await mk.env.DB.get(OLD, "json")) || { list: [], n: 0, last: {} }, tok = await mk.env.DB.get(OLD_TOK);
  for (const m of (old.list || []).slice(-MAX)) await st.put(pad(m.id), m);
  if (tok) await st.put("s:tok", tok);
  await st.put("s:meta", { n: old.n || 0, last: old.last || {}, told: old.told || 0 });
}
export async function supportFetch(mk, url, b) {
  if (!url.pathname.startsWith("/support/")) return null;
  const st = mk.state.storage, p = url.pathname.slice(9);
  try { await (mk.supReady ||= ready(mk)); } catch (e) { mk.supReady = null; throw e; }   // 写すのは 1 回（同時に 来ても 1 つの 約束を 待つ）
  const one = (f) => (mk.supQ = (mk.supQ || Promise.resolve()).then(f, f));   // 書く 頼みは 1 つずつ（番号が かさならない）
  if (p === "view") {
    const since = Math.max(0, +url.searchParams.get("since") || 0), meta = await st.get("s:meta");
    const list = [...(await st.list({ prefix: "s:m:" })).values()].filter((m) => m.id > since).sort((a, c) => a.id - c.id);
    return R({ list, last: meta.n });
  }
  if (p === "tok" && !b.tok) return R({ tok: (await st.get("s:tok")) || null });
  if (p === "tok") return one(async () => {   // keep：もう ある ときは そのまま（はじめて 開いた ときに 作る）
    const cur = await st.get("s:tok");
    if (!(b.keep && cur)) await st.put("s:tok", b.tok);
    return R({ tok: b.keep && cur ? cur : b.tok });
  });
  if (p === "add") return one(async () => {
    const meta = await st.get("s:meta"), now = Date.now(), from = String(b.from || "");
    if (!NAME[from] && from !== "claude") return R({ ok: false, status: 400, why: "だれか わかりません" });
    if (now - (meta.last[from] || 0) < GAP) return R({ ok: false, status: 429, why: "少し 待ってから 送って ください" });
    meta.n++; meta.last[from] = now;
    const notify = !!b.inbox && from !== "claude" && now - (meta.told || 0) >= NOTIFY_GAP;   // 続けて 来たら 20 秒に 1 回（起きたら まとめて 読む）
    if (notify) meta.told = now;
    await st.put(pad(meta.n), { id: meta.n, at: now, from, text: String(b.text || "") });
    if (meta.n > MAX) await st.delete(pad(meta.n - MAX));
    await st.put("s:meta", meta);
    return R({ ok: true, id: meta.n, notify });
  });
  return R({ ok: false, status: 404, why: "none" });
}

// ---- 門番の 入口 ----
const ask = async (env, path, body) => (await env.MARKET.get(env.MARKET.idFromName("market"))
  .fetch("https://market/support/" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined)).json();
async function tell(env, m, id, from) {
  try {
    await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}/issues/${m[3]}/comments`, { method: "POST",
      headers: { Authorization: "Bearer " + env.GH_INBOX_TOKEN, Accept: "application/vnd.github+json", "User-Agent": "mono-link-support", "Content-Type": "application/json" },
      body: JSON.stringify({ body: `サポート窓口に 新しい 文（#${id}・${NAME[from] || from}）` }) });
  } catch (e) {}   // 知らせが 届かなくても 文は 窓口に のこる
}
async function add(env, from, body) {
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > LEN) return J({ ok: false, why: `文は 1〜${LEN} 文字` }, 400);
  const m = /^([\w.-]+)\/([\w.-]+)#(\d+)$/.exec(env.GH_INBOX || ""), inbox = !!(m && env.GH_INBOX_TOKEN);
  const r = await ask(env, "add", { from, text, inbox });
  if (!r.ok) return J({ ok: false, why: r.why }, r.status || 400);
  if (r.notify) await tell(env, m, r.id, from);
  return J({ ok: true, id: r.id });
}
async function body(req) { try { return await req.json(); } catch (e) { return null; } }

// h：{ enterSoon }（loungeApi と 同じ）
export async function supportApi(req, env, url, h) {
  const p = url.pathname, since = Math.max(0, +url.searchParams.get("since") || 0);
  if (p === "/api/support/claude" || p === "/api/support/agent") {
    const claude = p.endsWith("claude"), key = claude ? env.UPLOAD_KEY : (await ask(env, "tok")).tok;
    if (!key || !(await same(bearer(req), key))) return J({ error: "key" }, 401);
    if (req.method === "GET") return J(await ask(env, "view?since=" + since));
    if (req.method === "POST") return add(env, claude ? "claude" : "otako_ai", await body(req));
    return J({ error: "method" }, 405);
  }
  if (p !== "/api/support" && p !== "/api/support/token") return null;
  const e = await h.enterSoon(req, env); if (e.res) return e.res;
  const id = String(e.who.id), otako = id === OTAKO || id === env.SUPPORT_TEST;   // SUPPORT_TEST：見本と 試験だけ
  if (!otako && id !== SHIKA) return J({ error: "none" }, 404);
  if (p === "/api/support/token") {   // 合言葉を 作りなおす（前の 合言葉は 使えなく なる）
    if (!otako || req.method !== "POST") return J({ error: "none" }, 404);
    return J({ ok: true, token: (await ask(env, "tok", { tok: newTok() })).tok });
  }
  if (req.method === "POST") return add(env, otako ? "otako" : "shika", await body(req));
  const token = otako ? (await ask(env, "tok", { tok: newTok(), keep: true })).tok : null;
  return J({ me: otako ? "otako" : "shika", ...(await ask(env, "view?since=" + since)), ...(token ? { token } : {}) });
}
