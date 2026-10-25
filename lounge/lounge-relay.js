// 配信の 中継（鹿物語の 持ち玉ランキングの 窓）：いま 派遣中の ペットを、鹿物語が 自分で 計算しなおして 見せる ための 材料
// 門番の 派遣の 計算は 軽く する ため 歩いた 道や 出来事を のこさない（lite）。派遣の 画面と 同じく、同じ 種・パーティで もう 1 回 計算すれば 同じ 道に なる
// - Viewer：出かけた とき relay-put（材料を Lounge に あずける）、計算が 終わったら relay-end（本当の 帰る 時間）、うけとったら relay-del
// - Lounge：relayFetch（Viewer からの 3 つと、門番の /api/relay からの /relay。帰った 物は 消す）
// - 門番：lounge-api.js の relayList（入れない 人の 分は 出さない。Twitch の id は 出さない）
// - relay-pvp：帯の 戦い（派遣先で 出会った・大会の ベスト 8 から）を OBS へ（lounge-arena.js・viewer.js から）
import { fighterOf, mateOf } from "./lounge-game.js";

const KEEP_MS = 60 * 1000, MAX_BYTES = 48 * 1024, MAX_LIST = 30, MAX_PVP = 192 * 1024;   // MAX_PVP：帯の 戦い（大会は ペット 8 匹まで まとめて 来る）
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const idOk = (v) => (/^\d{1,20}$/.test(String(v || "")) ? String(v) : "");

// 出かけた 派遣の 材料。パーティは 出かけた ときの tripStart と 同じ 作り方（ペットに 持ち主の 名前を つけるのは 派遣の 画面と 同じ）
export function relayEntry(rec, t) {
  const pet = rec.pets.find((p) => p.uid === t.party[0]) || rec.pets[0];
  const mates = t.party.slice(1).map((u) => rec.tamed.find((c) => c.uid === u)).filter(Boolean);
  return {
    id: rec.id, uid: t.uid, name: rec.name, pet: { name: pet.name, qid: pet.qid, species: pet.species, type: pet.type, lv: pet.lv },
    did: t.did, run: t.run, purpose: t.purpose, target: t.target, tool: t.tool, floor: t.floor || 0, seed: t.seed, start: t.start, end: t.end, calc: !!t.calc, med: t.med || 0, st: t.st ? 1 : 0,   // floor：えらんだ 出発の 階（0 は ふつう）。med・st：出かけた ときの 救護室の Lv・地図室 Lv1 から（同じ 計算に する）
    party: t.team ? t.team.map((c, k) => (k ? c : { ...c, owner: rec.name })) : [{ ...fighterOf(pet, rec), owner: rec.name }, ...mates.map((c) => mateOf(c, rec))], progress: rec.explore[t.did] || null,
  };
}

// Lounge の fetch() で：const rr = await relayFetch(this, url, req); if (rr) return rr;
export async function relayFetch(lounge, url, req) {
  const st = lounge.state.storage, now = Date.now();
  // 帯の 戦い（⑤ 派遣先で 出会った・④ 大会の ベスト 8 から）：配信中の OBS（オーバーレイ）へ そのまま 送る。OBS が いなければ 何も しない
  if (req.method === "POST" && url.pathname === "/relay-pvp") {
    const text = await req.text(); if (text.length > MAX_PVP) return J({ error: "big" }, 413);
    let b; try { b = JSON.parse(text); } catch (e) { return J({ error: "json" }, 400); }
    let m;
    if (b && b.kind === "tour") {   // 大会：ベスト 8 からの 試合を まとめて（fs：ペット。番号で 引く。オーバーレイが 1 試合ずつ 流す）
      if (!b.fs || typeof b.fs !== "object" || !Array.isArray(b.list)) return J({ error: "pvp" }, 400);
      const str = (v) => String(v || "").slice(0, 20), list = b.list.slice(0, 15).filter((x) => x && b.fs[x.a] && b.fs[x.b] && Number.isFinite(+x.seed))
        .map((x) => ({ a: str(x.a), b: str(x.b), seed: +x.seed, label: str(x.label), no: Math.max(0, Math.floor(+x.no || 0)), next: str(x.next), final: !!x.final }));
      if (!list.length) return J({ error: "pvp" }, 400);
      m = JSON.stringify({ t: "pvp", kind: "tour", day: str(b.day), fs: b.fs, list });
    } else {
      if (!b || !b.A || !b.B || !Number.isFinite(+b.seed)) return J({ error: "pvp" }, 400);
      const pay = b.pay && typeof b.pay === "object" ? { credits: Math.max(0, Math.floor(+b.pay.credits || 0)), res: Math.max(0, Math.floor(+b.pay.res || 0)) } : null;   // 帯に 出す ごほうびの 数
      m = JSON.stringify({ t: "pvp", kind: b.kind === "final" ? "final" : "enc", A: b.A, B: b.B, seed: +b.seed, did: String(b.did || ""), day: String(b.day || ""), pay });
    }
    let sent = 0; for (const ws of lounge.obsSockets()) { try { ws.send(m); sent++; } catch (e) {} }
    return J({ ok: true, sent });
  }
  if (req.method === "POST" && /^\/relay-(put|end|del)$/.test(url.pathname)) {
    const text = await req.text(); if (text.length > MAX_BYTES) return J({ error: "big" }, 413);
    let b; try { b = JSON.parse(text); } catch (e) { return J({ error: "json" }, 400); }
    const id = idOk(b && b.id); if (!id) return J({ error: "id" }, 400);
    const key = "relay:" + id;
    if (url.pathname === "/relay-put") {
      if (typeof b.uid !== "string" || !Array.isArray(b.party) || !Number.isFinite(b.start) || !Number.isFinite(b.end)) return J({ error: "entry" }, 400);
      await st.put(key, b); return J({ ok: true });
    }
    const e = await st.get(key);
    if (!e || e.uid !== b.uid) return J({ ok: false });   // ほかの 派遣（あとから 出かけた）の 分は さわらない
    if (url.pathname === "/relay-end") { if (Number.isFinite(b.end)) { e.end = b.end; e.calc = false; await st.put(key, e); } return J({ ok: true }); }
    await st.delete(key); return J({ ok: true });
  }
  if (req.method === "GET" && url.pathname === "/relay") {
    const all = await st.list({ prefix: "relay:" }), list = [], old = [];
    for (const [k, e] of all) {
      if (now > e.end + KEEP_MS) old.push(k);   // 帰って しばらく たった 物は 消す（うけとらない 人の 分も）
      else if (now >= e.start && now < e.end) list.push(e);
    }
    for (const k of old) await st.delete(k);
    return J({ now, list: list.slice(0, MAX_LIST) });
  }
  return null;
}
