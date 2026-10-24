// 門番の 部屋の 箱（worker.js の Durable Object「Lounge」）に 足す 部品：1 人ずつの 箱（Viewer）と OBS の あいだで 玉と リソースの 頼みを 運ぶ
// 作りは docs/mono-link-lounge-server.md の「玉と リソースの やりとり」。つなぎ方は README.md
// - OBS へ：{ t: "lg", rid, items: [{ op, id, kind, d, need, grp }] }（need：足りる ときだけ 足す。ない 物は 0 で とめて かならず 足す。grp：同じ grp は ぜんぶか なしで）
// - OBS から：{ t: "lg-hi" }（玉を 持って いる オーバーレイです）・{ t: "lg-re", rid, res: [{ op, ok, seq, why, bal }] }
// 頼みを 送るのは「lg-hi」を 言った いちばん 新しい OBS 1 つだけ（2 つ つながって いても 2 回 足さない）

const WAIT_MS = 5000, CHUNK = 200, SYNC_MAX = 300;
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const viewerOf = (env, id) => env.VIEWER.get(env.VIEWER.idFromName("v:" + id));
const idOk = (v) => (/^\d{1,20}$/.test(String(v || "")) ? String(v) : "");

// 運んで よい 形だけ。op は 「その 人の id:」で はじまる 物だけ（ほかの 人の 分は 運ばない）
function cleanItems(list, id) {
  return (Array.isArray(list) ? list : []).slice(0, 500).filter((x) => x && typeof x.op === "string" && x.op.length <= 100 && x.op.startsWith(id + ":") && (x.kind === "balls" || x.kind === "res") && Number.isInteger(x.d) && Math.abs(x.d) <= 1e7)
    .map((x) => ({ op: x.op, id, kind: x.kind, d: x.d, need: x.need ? 1 : 0, ...(typeof x.grp === "string" && x.grp.length <= 100 && x.grp.startsWith(id + ":") ? { grp: x.grp } : {}) }));
}
function lgSocket(lounge) {
  return lounge.obsSockets().filter((w) => lounge.att(w).lg).sort((a, b) => (lounge.att(b).at || 0) - (lounge.att(a).at || 0))[0] || null;
}
async function marks(lounge) { if (!lounge.lgMark) lounge.lgMark = (await lounge.state.storage.get("lgMark")) || {}; return lounge.lgMark; }

// Lounge の fetch() の はじめに：const lr = await lgFetch(this, url, req); if (lr) return lr;
export async function lgFetch(lounge, url, req) {
  if (url.pathname === "/lg-mark" && req.method === "POST") {   // Viewer：「送って いない 分が ある」
    const id = idOk((await req.json().catch(() => ({}))).id); if (!id) return J({ error: "id" }, 400);
    const m = await marks(lounge);
    if (!m[id]) { m[id] = Date.now(); await lounge.state.storage.put("lgMark", m); }
    return J({ ok: true });
  }
  if (url.pathname === "/lg" && req.method === "POST") {        // Viewer：配信中なら OBS に きく
    const b = await req.json().catch(() => ({})), id = idOk(b.id), items = cleanItems(b.items, id);
    if (!id || !items.length) return J({ error: "items" }, 400);
    const ws = lgSocket(lounge); if (!ws) return J({ offline: 1 });
    const rid = "l" + crypto.randomUUID();
    lounge.lgWait = lounge.lgWait || new Map();
    const got = new Promise((done) => {
      const t = setTimeout(() => { lounge.lgWait.delete(rid); done(null); }, lounge.lgWaitMs || WAIT_MS);
      lounge.lgWait.set(rid, (r) => { clearTimeout(t); lounge.lgWait.delete(rid); done(r); });
    });
    try { ws.send(JSON.stringify({ t: "lg", rid, items })); } catch (e) { lounge.lgWait.get(rid)(null); }
    const r = await got;
    return J(r ? { res: r } : { timeout: 1 });   // 返事が ない：Viewer は「わからない」に して、つぎに たしかめる
  }
  return null;
}

// webSocketMessage の、鍵が 合った OBS の 所（if (!a.ok) return; の あと）に：if (await lgFromObs(this, ws, m)) return;
export async function lgFromObs(lounge, ws, m) {
  if (m.t === "lg-hi") { ws.serializeAttachment({ ...lounge.att(ws), lg: 1 }); await lgSync(lounge); return true; }
  if (m.t !== "lg-re" || !Array.isArray(m.res)) return false;
  const res = m.res.slice(0, 1000).filter((r) => r && typeof r.op === "string" && r.op.length <= 100)
    .map((r) => ({ op: r.op, ok: r.ok ? 1 : 0, seq: Math.max(0, +r.seq || 0), why: String(r.why || "").slice(0, 20), bal: Number.isFinite(+r.bal) ? +r.bal : -1 }));
  const w = lounge.lgWait && lounge.lgWait.get(String(m.rid || ""));
  if (w) { w(res); return true; }
  // まとめ送りの 返事・5 秒を すぎて 来た 返事：op の はじめの id で 1 人ずつの 箱へ
  const by = {};
  res.forEach((r) => { const id = idOk(r.op.split(":")[0]); if (id) (by[id] = by[id] || []).push(r); });
  const m2 = await marks(lounge); let changed = false;
  await Promise.all(Object.entries(by).map(async ([id, list]) => {
    try {
      const j = await (await viewerOf(lounge.env, id).fetch("https://viewer/acked", { method: "POST", body: JSON.stringify({ res: list }) })).json();
      if (j.left === 0 && m2[id]) { delete m2[id]; changed = true; }
    } catch (e) {}
  }));
  if (changed) await lounge.state.storage.put("lgMark", m2);
  return true;
}

// 配信が はじまった（OBS が lg-hi を 言った）とき：送って いない 分が ある 人の 分を あつめて まとめて 送る
export async function lgSync(lounge) {
  const ws = lgSocket(lounge); if (!ws) return 0;
  const m = await marks(lounge), items = []; let changed = false;
  for (const id of Object.keys(m).slice(0, SYNC_MAX)) {
    try {
      const j = await (await viewerOf(lounge.env, id).fetch("https://viewer/pending")).json(), list = cleanItems(j.items, id);
      if (list.length) items.push(...list); else { delete m[id]; changed = true; }
    } catch (e) {}
  }
  if (changed) await lounge.state.storage.put("lgMark", m);
  for (let i = 0; i < items.length; i += CHUNK) { try { ws.send(JSON.stringify({ t: "lg", rid: "s" + crypto.randomUUID(), items: items.slice(i, i + CHUNK) })); } catch (e) {} }
  return items.length;
}
