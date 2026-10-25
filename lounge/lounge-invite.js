// 招待コード（MONO LINK の 仲間を ふやす）。決まりは docs/invite.md（鹿さんの決め：2026-10-25）
// - だれでも 自分の コードを 1 つ 持つ（自分の ページの 札。はじめて 開いた とき 作る）
// - コードを 使えるのは まだ フォローして いない 人だけ（ログイン画面の「フォローする」の 所）。始めた 日の フォロワーと、MONO LINK に 入った ことの ある 人は 使えない
// - 使った 人が フォローして MONO LINK に 入ったら 成立：使った 人に リソース 500、招待した 人に 人数で ふえる 分（rewardFor）
// - サブアカウントでの 招待は BAN（画面で 警告する。見つけるのは 配信者。記録に Twitch の アカウントを 作った 日を 出す）
// 部品は 2 つ：
// 画面に 出す 文（why）は MONO LINK の 書き方（ことばの 間を あけない）
// - Lounge の fetch() で：const ivr = await inviteFetch(this, url, req); if (ivr) return ivr;（数える 所。部屋の 箱は 1 つ なので 同時でも 正しく 数える）
// - 門番の route() で：inviteApi(req, env, url, h)（/api/invite・/api/invite/use・/api/invite/log。リソースは 1 人ずつの 箱の /inbox で 渡す）

export const INVITEE_RES = 500;
const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // 見まちがえやすい 0 O 1 I L は 使わない
const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/, TRY_MAX = 10, TRY_MS = 3600e3, LOG_MAX = 200, LIST_MAX = 30, PAY_MAX = 6;

// n 人目の 招待で 招待した 人が もらう リソース：500・1,000・1,500・2,000、5 人目からは ふえ方が 半分ずつ（2,250・2,380・2,440…）で 2,500 まで（10 の 位で まるめる）
export function rewardFor(n) {
  if (!(n >= 1)) return 0;
  return n <= 4 ? 500 * n : Math.round((2500 - 250 * 0.5 ** (n - 5)) / 10) * 10;
}
export const cleanCode = (s) => String(s || "").normalize("NFKC").toUpperCase().replace(/[\s-]/g, "").slice(0, 12);

const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const idOk = (v) => (/^\d{1,20}$/.test(String(v || "")) ? String(v) : "");
const str = (v, n) => String(v || "").slice(0, n);
const nameOf = (lounge, id, login) => (lounge.names && lounge.names[id]) || login || "";

// ---- Lounge の 箱の 中 ----
// invc:<コード> → 持ち主の id　invo:<id> → { code, login, name, n, sum, list, news }　invu:<id> → 使った 人 { by, code, at, login, name, created, state: "wait"|"done" }
// invs:<id> → MONO LINK に 入った ことが ある　invpay → まだ 渡して いない リソース　invlog → 配信者の 記録（新しい 200 件）
export async function inviteFetch(lounge, url, req) {
  if (!/^\/inv-(code|use|paid|log)$/.test(url.pathname)) return null;
  const st = lounge.state.storage, now = Date.now();
  if (url.pathname === "/inv-log") return J({ log: ((await st.get("invlog")) || []).slice().reverse() });
  const b = await req.json().catch(() => ({}));
  if (url.pathname === "/inv-paid") {   // 門番が 渡し 終えた 分（同じ mid は 箱が 2 回 足さない ので、渡しそこねたら また 送る）
    const done = new Set(Array.isArray(b.mids) ? b.mids.map(String) : []), q = (await st.get("invpay")) || [];
    await st.put("invpay", q.filter((p) => !done.has(p.mid))); return J({ ok: true });
  }
  const id = idOk(b.id); if (!id) return J({ error: "id" }, 400);
  const login = str(b.login, 40), name = str(b.name, 40) || nameOf(lounge, id, login);

  if (url.pathname === "/inv-code") {   // 自分の コード（なければ 作る）。使った 人が はじめて 入れたら ここで 成立
    let o = await st.get("invo:" + id), dirty = !o;   // ページを 開く たびに 呼ばれるので、かわった ときだけ しまう
    if (!o) {
      let code = "";
      for (let i = 0; i < 20 && !code; i++) { const c = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => ABC[x % ABC.length]).join(""); if (!(await st.get("invc:" + c))) code = c; }
      if (!code) return J({ error: "code" }, 500);
      o = { code, login, name, n: 0, sum: 0, list: [], news: [] };
      await st.put("invc:" + code, id);
    }
    if (login && o.login !== login) { o.login = login; dirty = true; }
    if (name && o.name !== name) { o.name = name; dirty = true; }
    let got = null;
    const u = await st.get("invu:" + id);
    if (u && u.state === "wait") {
      const by = await st.get("invo:" + u.by);
      if (by) {
        by.n += 1; const d = rewardFor(by.n); by.sum += d;
        by.list = [...by.list, { name, at: now, d }].slice(-LIST_MAX); by.news = [...(by.news || []), { name, d }].slice(-10);
        await st.put("invo:" + u.by, by);
        u.state = "done"; u.doneAt = now; u.d = d; u.name = name; await st.put("invu:" + id, u);
        const q = (await st.get("invpay")) || [];
        q.push({ mid: "inv:" + id + ":me", id, login, d: INVITEE_RES }, { mid: "inv:" + id + ":by", id: u.by, login: by.login, d });
        await st.put("invpay", q);
        await logPut(st, { t: now, k: "done", by: u.by, byName: by.name, id, login, name, created: u.created || "", d, n: by.n });
        got = { d: INVITEE_RES, by: by.name };
      }
    }
    if (!(await st.get("invs:" + id))) await st.put("invs:" + id, now);   // 入った ことが ある（このあと コードは 使えない）
    const news = o.news || []; o.news = [];
    if (dirty || news.length) await st.put("invo:" + id, o);
    return J({ code: o.code, n: o.n, sum: o.sum, next: rewardFor(o.n + 1), names: o.list.slice(-10).map((x) => x.name).reverse(), news, got, pay: ((await st.get("invpay")) || []).slice(0, PAY_MAX) });
  }

  // /inv-use：まだ フォローして いない 人が コードを 使う（フォローして いないか・前の フォロワーで ないかは 門番が たしかめて から 来る）
  lounge.invTry = lounge.invTry || new Map();
  const tries = (lounge.invTry.get(id) || []).filter((t) => now - t < TRY_MS);
  if (tries.length >= TRY_MAX) return J({ ok: false, why: "コードをためすのは 1 時間に " + TRY_MAX + " 回までです" });
  lounge.invTry.set(id, [...tries, now]);
  const code = cleanCode(b.code);
  if (!CODE_RE.test(code)) return J({ ok: false, why: "招待コードは英字と数字の 6 文字です" });
  if (await st.get("invs:" + id)) return J({ ok: false, why: "MONO LINK に入ったことのある人は使えません" });
  const owner = await st.get("invc:" + code);
  if (!owner || (b.ban && b.ban.includes(owner))) return J({ ok: false, why: "その招待コードはありません" });
  if (owner === id) return J({ ok: false, why: "自分のコードは使えません" });
  const had = await st.get("invu:" + id);
  if (had && had.state === "done") return J({ ok: false, why: "招待コードは 1 回だけ使えます" });
  const by = await st.get("invo:" + owner);
  await st.put("invu:" + id, { by: owner, code, at: now, login, name, created: str(b.created, 30), state: "wait" });   // フォローする 前なら 入れ直せる
  await logPut(st, { t: now, k: "use", by: owner, byName: (by && by.name) || "", id, login, name, created: str(b.created, 30) });
  return J({ ok: true, by: (by && by.name) || "", d: INVITEE_RES });
}
async function logPut(st, e) { const L = (await st.get("invlog")) || []; L.push(e); await st.put("invlog", L.slice(-LOG_MAX)); }

// ---- 門番の 入口 ----
const loungeOf = (env) => env.LOUNGE.get(env.LOUNGE.idFromName("lounge"));
const viewerOf = (env, id) => env.VIEWER.get(env.VIEWER.idFromName("v:" + id));
const post = async (stub, u, body) => (await stub.fetch(u, { method: "POST", body: JSON.stringify(body) })).json();
const staffOf = (gate, id) => !!gate && (id === gate.owner || !!(gate.mods && gate.mods[id]));

// 始めた 日の フォロワーの 写し（KV の inv-old）。はじめて 招待の 入口が 呼ばれた とき 1 回だけ 作る。この 人たちは コードを 使えない
async function oldList(env, gate) {
  const had = await env.DB.get("inv-old", "json"); if (had) return had;
  if (!gate || !gate.follow) return null;   // フォロワーの 一覧が まだ ない：作らない（使う 方は 準備中）
  const ids = { ...gate.follow, ...(gate.mods || {}) }; if (gate.owner) ids[gate.owner] = 1;
  const o = { at: Date.now(), n: Object.keys(ids).length, ids };
  await env.DB.put("inv-old", JSON.stringify(o)); return o;
}

// まだ 渡して いない リソースを 1 人ずつの 箱へ（はじめての 人には 記録を 作って から）。同じ mid は 箱が 2 回 足さない
async function pay(env, list) {
  const done = [];
  for (const p of list || []) {
    try {
      const v = viewerOf(env, p.id);
      await post(v, "https://viewer/init", { id: p.id, login: p.login || p.id });
      const r = await post(v, "https://viewer/inbox", { mid: p.mid, earn: [{ kind: "res", d: p.d }] });
      if (r && r.ok) done.push(p.mid);
    } catch (e) {}
  }
  if (done.length) try { await post(loungeOf(env), "https://lounge/inv-paid", { mids: done }); } catch (e) {}   // とどかなくても 次に 送り直すだけ
}

// Twitch の アカウントを 作った 日（配信者の 記録に 出す。サブアカウントを 見つける ため）
async function createdAt(who) {
  try {
    const r = await fetch("https://api.twitch.tv/helix/users?id=" + encodeURIComponent(who.id), { headers: { "Client-Id": who.client, Authorization: "Bearer " + who.tok } });
    const j = r.ok ? await r.json() : null; return (j && j.data && j.data[0] && j.data[0].created_at) || "";
  } catch (e) { return ""; }
}

// h：{ enter, enterSoon, whoAny }。whoAny は フォローして いない 人も 通す（{ who, follow, gate } か { res }）
export async function inviteApi(req, env, url, h) {
  if (url.pathname === "/api/invite" && req.method === "GET") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    const gate = await env.DB.get("gate", "json"); await oldList(env, gate);
    const j = await post(loungeOf(env), "https://lounge/inv-code", { id: e.who.id, login: e.who.login });
    if (j.error) return J({ error: j.error }, 500);
    await pay(env, j.pay); delete j.pay;
    return J({ ...j, staff: staffOf(gate, e.who.id) });
  }
  if (url.pathname === "/api/invite/use" && req.method === "POST") {
    const w = await h.whoAny(req, env); if (w.res) return w.res;
    let body; try { body = await req.json(); } catch (x) { return J({ ok: false, why: "こわれた頼み" }, 400); }
    if (w.follow === "yes") return J({ ok: false, why: "もうフォローしている人は使えません（招待コードはフォローする前に使います）" });
    if (w.follow !== "no") return J({ ok: false, why: "フォローしているか確かめられませんでした。もう一度ログインしてください" });
    const old = await oldList(env, w.gate);
    if (!old) return J({ ok: false, why: "招待はまだ準備中です。少し待ってからためしてください" });
    if (old.ids[w.who.id]) return J({ ok: false, why: "前にフォローしていた人は使えません" });
    const ban = Object.keys({ ...((w.gate && w.gate.ban) || {}), ...((w.gate && w.gate.block) || {}) }).slice(0, 5000);
    return J(await post(loungeOf(env), "https://lounge/inv-use", { id: w.who.id, login: w.who.login, code: body && body.code, created: await createdAt(w.who), ban }));
  }
  if (url.pathname === "/api/invite/log" && req.method === "GET") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    if (!staffOf(await env.DB.get("gate", "json"), e.who.id)) return J({ error: "staff" }, 403);
    return loungeOf(env).fetch("https://lounge/inv-log");
  }
  return null;
}
