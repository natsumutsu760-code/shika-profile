// 集合住宅（TD）の 助けを よぶ 掲示板（2026-11-16 鹿さんの カード「助けをよぶ掲示板」「自動行動」「この案でよい」。2 代目）
// 決め：敵を 呼ぶ ときに「手伝い 募集」を 出す・みんなの 募集が 並ぶ 掲示板から 助けに 行く・フレンドは いらない・募集 1 つに 3 体まで
//   手伝いの 子は 自動で 動く（td-battle.js の helpers）・殺されない・守りきると 手伝った 人に 報酬の 4 割（rewardOf の helper）
//   手伝う 人は 時間を 合わせなくて よい（子の 写し〈種・Lv・型・名前〉を 送る。防衛は 募集した 人の 画面で 回る）
// ① 人の 記録（Viewer）：td.help.post {i}（電波塔の 通知に 募集を 出す）・td.help.list（みんなの 募集）・td.help.send {pid, uid}（子を 送る）・td.help.view（自分の 募集）
//    td.def.start は 募集が あれば 締めて（lock）送られた 子を T.def.help に・td.def.end は 結果を 板へ（end。とどかなければ T.helpOut に のこして 次に もう 1 回）
//    送った 子は 募集が 終わるまで T.lent に（同じ 子を 2 つの 募集に 送らない）。ごほうびと 引き上げは Market の 送る 箱から /inbox（m.td）で とどく
// ② Market（みんなで 1 つの 箱）：募集は "tdh:p:<番号>"（番号 ＝ 募集した 人の id ＋ 通知の 番号。同じ 番号は 1 回目の まま）
//    期限（6 時間）を すぎた 募集・戦いが 1 時間 終わらない 募集は 閉じて、手伝いの 子を 引き上げる（ごほうび なし）
//    〔C〕期限 6 時間・募集は 1 人 1 つ まで・同じ 人は 同じ 募集に 1 体・掲示板に 出すのは 新しい 30 こ・手伝いの ごほうびは 1 人 1 日 3 回まで（"tdh:d:<id>:<日>"）
import { HELP, rewardOf } from "./td-numbers.js";
import { ensureTd, tdOpen, tdAct } from "./lounge-td.js";

const res = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const NOCONN = "いまは 助けを よぶ 掲示板に つながらない";
const FIGHT_MS = 3600000, KEEP_MS = 2 * 86400000;
const ask = async (v, path, body) => (await v.market().fetch("https://market/tdh/" + path, body ? { method: "POST", body: JSON.stringify(body) } : undefined)).json();

// ---------- 人の 記録（Viewer） ----------
const lentOf = (T) => (T.lent && typeof T.lent === "object" ? T.lent : (T.lent = {}));
async function flush(v, rec, T) {   // 前に とどかなかった 結果を もう 1 回
  if (!Array.isArray(T.helpOut) || !T.helpOut.length) return;
  const left = [];
  for (const e of T.helpOut) { try { const j = await ask(v, "end", { ...e, by: rec.id }); if (!j.ok && !j.done) left.push(e); } catch (x) { left.push(e); } }
  T.helpOut = left;
}
export async function tdhAct(v, rec, b, now) {
  if (!tdOpen(rec)) return { ok: false, why: "ペットを むかえると 集合住宅に 入れます" };
  const T = ensureTd(rec), a = b && b.a;
  await flush(v, rec, T).catch(() => {});
  if (a === "td.help.post") {
    const N = T.notes && Array.isArray(T.notes.list) ? T.notes : { list: [] }, note = N.list[b.i | 0];
    if (!note) return { ok: false, why: "その 通知は もう ない" };
    if (T.def) return { ok: false, why: "防衛中" };
    if (T.help && T.help.k !== note.k) return { ok: false, why: "募集は 1 つ まで（前の 募集の 防衛を 先に）" };
    const pid = `${rec.id}:${note.k}`;
    let j; try { j = await ask(v, "post", { pid, by: rec.id, name: rec.name || "", strength: note.strength, lv: note.lv, foes: note.foes.map((f) => f.id).slice(0, 16) }); } catch (x) { return { ok: false, why: NOCONN }; }
    if (!j.ok) return j;
    T.help = { pid, k: note.k, at: now };
    return { ok: true, pid };
  }
  if (a === "td.help.view") {
    if (!T.help) return { ok: true, post: null };
    try { const j = await ask(v, "get?pid=" + encodeURIComponent(T.help.pid)); return { ok: true, post: j.ok ? j.post : null }; } catch (x) { return { ok: false, why: NOCONN }; }
  }
  if (a === "td.help.list") {
    try { const j = await ask(v, "list?id=" + encodeURIComponent(rec.id)); return { ok: true, list: j.list || [], lent: lentOf(T) }; } catch (x) { return { ok: false, why: NOCONN }; }
  }
  if (a === "td.help.send") {
    const c = (rec.tamed || []).find((x) => x && x.uid === b.uid);
    if (!c || !c.tree) return { ok: false, why: "送る 子を えらんで" };
    if ((T.dead || []).includes(c.uid)) return { ok: false, why: "その 子は 復活待ち" };
    if (lentOf(T)[c.uid]) return { ok: false, why: "その 子は ほかの 募集に 行って いる" };
    if (typeof b.pid !== "string" || b.pid.startsWith(rec.id + ":")) return { ok: false, why: "ほかの 人の 募集を えらんで" };
    const snap = { uid: c.uid, tree: c.tree, lv: c.lv | 0, name: c.name || "", type: c.type || null, ...(c.tdMix ? { tdMix: c.tdMix } : {}) };   // tdMix：まざった 子の 絵（2026-11-18）
    let j; try { j = await ask(v, "send", { pid: b.pid, by: rec.id, name: rec.name || "", c: snap }); } catch (x) { return { ok: false, why: NOCONN }; }
    if (!j.ok) return j;
    lentOf(T)[c.uid] = { pid: b.pid, at: now };
    return { ok: true, n: j.n };
  }
  if (a === "td.def.start") {   // 募集が この 通知の ものなら 締めて、送られた 子を 防衛に
    const note = T.notes && T.notes.list ? T.notes.list[b.i | 0] : null, H = T.help && note && T.help.k === note.k ? T.help : null;
    let help = [];
    if (H) { try { const j = await ask(v, "lock", { pid: H.pid, by: rec.id }); if (j.ok) help = j.helpers || []; } catch (x) { /* つながらなければ 手伝い なしで 始める（募集は 期限で 閉じる） */ } }
    const r = tdAct(rec, b, now);
    if (r.ok && H) { T.def.pid = H.pid; T.def.help = help.map((h) => ({ by: h.by, name: h.name, c: h.c })); T.help = null; r.def = T.def; }
    return r;
  }
  if (a === "td.def.end") {
    const D = T.def, pid = D && D.pid, strength = D && D.strength;
    const r = tdAct(rec, b, now);
    if (r.ok && pid) {
      const e = { pid, won: !!r.won, strength };
      try { const j = await ask(v, "end", { ...e, by: rec.id }); if (!j.ok && !j.done) (T.helpOut ||= []).push(e); } catch (x) { (T.helpOut ||= []).push(e); }
      r.helpers = (D.help || []).length;
    }
    return r;
  }
  return { ok: false, why: "知らない 受付" };
}
// Market から（/inbox の m.td）：手伝いの ごほうびの シグナルと、送った 子の 引き上げ
export function tdhInbox(rec, m) {
  const T = ensureTd(rec), x = m.td || {};
  if (Number.isFinite(x.sig) && x.sig > 0) T.sig += Math.floor(x.sig);
  if (typeof x.free === "string") delete lentOf(T)[x.free];
  if (x.note) { T.log.unshift({ at: Date.now(), s: x.note }); T.log.length = Math.min(T.log.length, 20); }
}

// ---------- Market ----------
const view = (P, id) => ({ pid: P.pid, name: P.name, strength: P.strength, lv: P.lv, foes: P.foes, n: P.helpers.length, max: HELP.max, until: P.until, status: P.status,
  mine: !!id && P.helpers.some((h) => h.by === id), helpers: P.helpers.map((h) => ({ name: h.name, c: h.c })) });
async function close(mk, P, won, now) {   // 終わり：手伝った 人へ ごほうび（守りきったら 4 割。1 人 1 日 HELP.dayMax 回まで）と 引き上げ
  const R0 = won ? rewardOf(P.strength, { won: true, helper: true }) : null, day = Math.floor((now + 9 * 3600000) / 86400000);
  for (const h of P.helpers) {
    let R = R0;
    if (R) { const dk = `tdh:d:${h.by}:${day}`, n = (await mk.state.storage.get(dk)) || 0; if (n >= HELP.dayMax) R = null; else await mk.state.storage.put(dk, n + 1); }
    const note = won && !R ? `${P.name || "だれか"} の 防衛を 手伝って 守りきった（今日の 手伝いの ごほうびは もう ${HELP.dayMax} 回 もらった）` : won ? `${P.name || "だれか"} の 防衛を 手伝って 守りきった（${R.cr.toLocaleString("ja-JP")} cr・シグナル ${R.sig}）` : `${P.name || "だれか"} の 防衛から ${h.c.name || "子"} が 帰った`;
    await mk.tell(h.by, `tdh:${P.pid}:${h.by}`, { give: R && R.cr ? { credits: R.cr } : {}, td: { sig: R ? R.sig : 0, free: h.c.uid, note }, why: "tdh:" + P.pid });
  }
  P.status = won == null ? "gone" : "done"; P.end = now; await mk.state.storage.put("tdh:p:" + P.pid, P);
}
async function sweep(mk, now) {
  for (const P of (await mk.state.storage.list({ prefix: "tdh:p:" })).values()) {
    if ((P.status === "open" && now > P.until) || (P.status === "fight" && now - P.fightAt > FIGHT_MS)) await close(mk, P, null, now);
    else if ((P.status === "done" || P.status === "gone") && now - P.end > KEEP_MS) await mk.state.storage.delete("tdh:p:" + P.pid);
  }
  const today = Math.floor((now + 9 * 3600000) / 86400000);   // 前の 日の 回数の しるしは 消す
  for (const k of (await mk.state.storage.list({ prefix: "tdh:d:" })).keys()) if (+k.split(":").pop() < today - 1) await mk.state.storage.delete(k);
}
export async function tdhFetch(mk, url, b, now) {
  if (!url.pathname.startsWith("/tdh/")) return null;
  const st = mk.state.storage, path = url.pathname.slice(5);
  await sweep(mk, now);
  const pid = String(b.pid || url.searchParams.get("pid") || ""), P = pid ? await st.get("tdh:p:" + pid) : null;
  if (path === "list") {
    const id = url.searchParams.get("id") || "", all = [...(await st.list({ prefix: "tdh:p:" })).values()];
    return res({ ok: true, list: all.filter((x) => x.status === "open" && x.until > now && x.by !== id && (x.helpers.length < HELP.max || x.helpers.some((h) => h.by === id))).sort((x, y) => y.at - x.at).slice(0, 30).map((x) => view(x, id)) });
  }
  if (path === "get") return res(P ? { ok: true, post: view(P) } : { ok: false, why: "その 募集は ない" });
  if (path === "post") {
    if (P) return res({ ok: true, post: view(P) });   // 同じ 番号は 1 回目の まま
    if (typeof b.by !== "string" || !pid.startsWith(b.by + ":")) return res({ ok: false, why: "募集の 番号が ちがう" });
    const mine = [...(await st.list({ prefix: "tdh:p:" })).values()].find((x) => x.by === b.by && (x.status === "open" || x.status === "fight"));
    if (mine) return res({ ok: false, why: "募集は 1 つ まで" });
    const strength = Math.max(1, Math.min(5, b.strength | 0));
    const N = { pid, by: b.by, name: String(b.name || "").slice(0, 32), strength, lv: b.lv | 0, foes: (Array.isArray(b.foes) ? b.foes : []).filter((x) => typeof x === "string").slice(0, 16), at: now, until: now + HELP.postMs, status: "open", helpers: [] };
    await st.put("tdh:p:" + pid, N);
    return res({ ok: true, post: view(N) });
  }
  if (path === "send") {
    if (!P || P.status !== "open" || P.until <= now) return res({ ok: false, why: "その 募集は もう 終わった" });
    if (b.by === P.by) return res({ ok: false, why: "自分の 募集には 送れない" });
    if (P.helpers.some((h) => h.by === b.by)) return res({ ok: false, why: "この 募集には もう 送った" });
    if (P.helpers.length >= HELP.max) return res({ ok: false, why: `この 募集は ${HELP.max} 体 そろった` });
    const c = b.c || {};
    if (typeof c.uid !== "string" || typeof c.tree !== "string") return res({ ok: false, why: "送る 子が ない" });
    P.helpers.push({ by: String(b.by), name: String(b.name || "").slice(0, 32), c: { uid: c.uid, tree: c.tree, lv: Math.max(1, c.lv | 0), name: String(c.name || "").slice(0, 32), type: typeof c.type === "string" ? c.type : null, ...(typeof c.tdMix === "string" && /^t_[a-z0-9_]{1,40}$/.test(c.tdMix) ? { tdMix: c.tdMix } : {}) } });
    await st.put("tdh:p:" + pid, P);
    return res({ ok: true, n: P.helpers.length });
  }
  if (path === "lock") {
    if (!P || P.by !== b.by) return res({ ok: false, why: "その 募集は ない" });
    if (P.status === "open") { P.status = "fight"; P.fightAt = now; await st.put("tdh:p:" + pid, P); }
    return res(P.status === "fight" ? { ok: true, helpers: P.helpers } : { ok: false, why: "その 募集は もう 終わった" });
  }
  if (path === "end") {
    if (!P) return res({ ok: false, done: true, why: "その 募集は もう ない" });
    if (P.by !== b.by) return res({ ok: false, why: "その 募集は ない" });
    if (P.status === "done" || P.status === "gone") return res({ ok: false, done: true, why: "もう 終わった" });
    await close(mk, P, !!b.won, now);
    return res({ ok: true });
  }
  return res({ ok: false, why: "知らない 道" });
}
