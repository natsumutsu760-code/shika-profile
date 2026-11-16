// ボーダーゾーンの ばったりの 名簿（Lounge の 中。lounge-relay.js の relayFetch から 呼ぶ。2026-11-16 鹿さんの カード）
// - Viewer：出撃した とき bz-put（だれが・どの ゾーンに・いつまで）、うけとった とき bz-del
// - 見回り（viewer.js の bzTick・1 分ごと）：bz-pick で 同じ ゾーンに いま 出て いる ほかの 人を 引く。人が いれば BZ_MEET.chance で 出会う
// - 同じ 相手とは 1 回の 出撃で 1 回まで（組を ここで 覚える。Lounge は 1 つ ずつ 順に 動くので、2 人が 同時に 見回っても 2 回 出会わない）
// 決まりは lounge-proto/border.js の BZ_MEET・docs/mono-link-border-zone.md の「ばったり」
import { BZ_MEET, BZ_AREAS } from "./border.js";

const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const idOk = (v) => (/^\d{1,20}$/.test(String(v || "")) ? String(v) : "");
const uidOk = (v) => (typeof v === "string" && /^[a-z0-9]{1,20}$/.test(v) ? v : "");
const KEEP_MS = 60 * 1000;   // 終わりから これだけ たったら 名簿から 消す

export async function bzRosterFetch(lounge, url, req, now = Date.now(), R = Math.random) {
  if (req.method !== "POST" || !/^\/bz-(put|del|pick)$/.test(url.pathname)) return null;
  let b; try { b = JSON.parse(await req.text()); } catch (e) { return J({ error: "json" }, 400); }
  const id = idOk(b && b.id), uid = uidOk(b && b.uid); if (!id || !uid) return J({ error: "id" }, 400);
  const st = lounge.state.storage, key = "bzr:" + id;
  if (url.pathname === "/bz-put") {
    if (!Object.prototype.hasOwnProperty.call(BZ_AREAS, b.area) || !Number.isFinite(b.start) || !Number.isFinite(b.end)) return J({ error: "entry" }, 400);
    await st.put(key, { id, uid, name: String(b.name || "").slice(0, 40), area: b.area, start: b.start, end: b.end });
    return J({ ok: true });
  }
  if (url.pathname === "/bz-del") { const e = await st.get(key); if (e && e.uid === uid) await st.delete(key); return J({ ok: true }); }
  // bz-pick：同じ ゾーンに いま いる ほかの 人（まだ 組に なって いない 人）から くじ
  const all = await st.list({ prefix: "bzr:" }), list = []; let me = null;
  for (const [k, e] of all) {
    if (now > e.end + KEEP_MS) { await st.delete(k); continue; }
    if (e.id === id) me = e;
    else if (now >= e.start && now < e.end) list.push(e);
  }
  if (!me || me.uid !== uid) return J({ ok: true, foe: null });
  const pairs = (await st.get("bzpairs")) || {};
  for (const k of Object.keys(pairs)) if (!(pairs[k] > now)) delete pairs[k];
  const pairOf = (e) => [me.id + ":" + me.uid, e.id + ":" + e.uid].sort().join("|");   // 出撃の 番号（z3 など）は 人ごとの 数え方なので、人の id と 組みに する
  const cand = list.filter((e) => e.area === me.area && !pairs[pairOf(e)]);
  let foe = null;
  if (cand.length && R() < BZ_MEET.chance) { foe = cand[Math.floor(R() * cand.length)]; pairs[pairOf(foe)] = Math.max(me.end, foe.end) + KEEP_MS; }
  await st.put("bzpairs", pairs);
  return J({ ok: true, foe: foe ? { id: foe.id, uid: foe.uid, name: foe.name } : null });
}
