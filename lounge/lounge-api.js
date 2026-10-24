// プライベートラウンジの 入口（門番 worker.js の route() から 呼ぶ）。/api/me・/api/act・/api/room/<login>
// ログインと フォローの たしかめは worker.js の enter() / enterSoon() を そのまま 使う（ここでは 受けとるだけ）
// 玉と リソースは OBS が 上げた KV の data ＋ 1 人ずつの 帳簿（viewer.js・ledger.js）。数は いつも 門番が 作って 渡す（ブラウザの 数は 使わない）

import { MONEY } from "./viewer.js";   // 玉か リソースが うごく やること（このときだけ KV の data を 読む。viewer.js と 同じ 一覧）
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const viewer = (env, id) => env.VIEWER.get(env.VIEWER.idFromName("v:" + id));
const post = (stub, path, body) => stub.fetch("https://viewer" + path, { method: "POST", body: JSON.stringify(body) });

// OBS が 上げた 記録から、その 人の 玉と リソース。Twitch の id（uid）で さがす
// 表示名では さがさない（日本語の 表示名は ほかの 人と 同じに できるので、他人の 玉が 見えたり 使えたり して しまう）
// OBS の 記録に まだ uid が ない 人は「わからない」（known: false。玉は 0 あつかいで、使う ことも できない）
async function wallet(env, id) {
  const d = await env.DB.get("data", "json"), v = ((d && d.viewers) || []).find((x) => x.uid != null && String(x.uid) === id);
  return v ? { balls: +v.balls || 0, res: +v.res || 0, lg: +d.lg || 0, known: true } : { balls: 0, res: 0, lg: 0, known: false };   // lg：OBS の 帳簿の 番号（この 記録に 入って いる 所まで）
}

// 入れない 人（BAN・ブロック・フォローして いない）の 部屋は 見せない。記録は 消さない（鹿さんの決め）
function hidden(gate, id) {
  if (!gate) return true;
  if (id === gate.owner || (gate.mods && gate.mods[id])) return false;
  if ((gate.ban && gate.ban[id]) || (gate.block && gate.block[id])) return true;
  return !!gate.follow && !gate.follow[id];
}

const staff = (gate, id) => !!gate && (id === gate.owner || !!(gate.mods && gate.mods[id]));   // 配信者と モデレーター
const market = (env) => env.MARKET.get(env.MARKET.idFromName("market"));

// h：{ enter, enterSoon, displayName } を worker.js から わたす
export async function loungeApi(req, env, url, h) {
  if (url.pathname === "/api/me" && req.method === "GET") {
    const e = await h.enter(req, env); if (e.res) return e.res;
    const stub = viewer(env, e.who.id);
    const w = await wallet(env, e.who.id);
    let me = await (await post(stub, "/init", { id: e.who.id, login: e.who.login, wallet: w })).json();
    if (!me.nameAt || Date.now() - me.nameAt > 864e5) me = await (await post(stub, "/init", { id: e.who.id, login: e.who.login, wallet: w, name: await h.displayName(e.who) })).json();   // 表示名は 1 日 1 回だけ Twitch に きく
    const vk = "vl:" + e.who.login.toLowerCase(); if ((await env.DB.get(vk)) !== e.who.id) await env.DB.put(vk, e.who.id);   // login → id（部屋を 見に 行く ため）
    return J(me);
  }
  if (url.pathname === "/api/act" && req.method === "POST") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    let body; try { body = await req.json(); } catch (x) { return J({ ok: false, why: "こわれた 頼み" }, 400); }
    if (!body || typeof body !== "object") return J({ ok: false, why: "こわれた 頼み" }, 400);
    const r = await post(viewer(env, e.who.id), "/act", { body, wallet: MONEY.test(String(body.a)) ? await wallet(env, e.who.id) : null });   // ブラウザが 送った 数は 使わない
    return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const m = /^\/api\/room\/([A-Za-z0-9_]{1,25})$/.exec(url.pathname);
  if (m && req.method === "GET") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    const id = await env.DB.get("vl:" + m[1].toLowerCase()), gate = await env.DB.get("gate", "json");
    if (!id || hidden(gate, id)) return J({ error: "none" }, 404);
    const r = await viewer(env, id).fetch("https://viewer/public");
    return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
  // みんなの依頼の 板（出す・届ける・取り下げるは /api/act。ここは 見る・通報・ひとことを 消す）
  if (url.pathname === "/api/board" && req.method === "GET") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    const gate = await env.DB.get("gate", "json"), me = e.who.id, st = staff(gate, me);
    const { list } = await (await market(env).fetch("https://market/list")).json();
    return J({ staff: st, list: list.filter((x) => x.by === me || !hidden(gate, x.by)).map((x) => ({   // 入れない 人の 依頼は 見せない
      rid: x.rid, name: x.name, want: x.want, reward: x.reward, until: x.until, mine: x.by === me,
      note: x.note && (!x.hidden || st) ? x.note : null, ...(st ? { hidden: x.hidden, reports: x.reports } : {}) })) });   // 文は 画面で かならず エスケープして 出す
  }
  if ((url.pathname === "/api/board/report" || url.pathname === "/api/board/notedel") && req.method === "POST") {
    const e = await h.enterSoon(req, env); if (e.res) return e.res;
    let b; try { b = await req.json(); } catch (x) { return J({ ok: false, why: "こわれた 頼み" }, 400); }
    if (typeof b.rid !== "string" || b.rid.length > 100) return J({ ok: false, why: "依頼を えらんで" }, 400);
    const del = url.pathname.endsWith("notedel");
    if (del && !staff(await env.DB.get("gate", "json"), e.who.id)) return J({ ok: false, why: "配信者と モデレーターだけ" }, 403);
    const r = await market(env).fetch("https://market/" + (del ? "notedel" : "report"), { method: "POST", body: JSON.stringify({ rid: b.rid, by: e.who.id }) });
    return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  return null;   // ラウンジの 入口では ない
}
