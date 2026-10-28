// プライベートラウンジ 6 だんかい目：みんなの依頼の 箱（Durable Object「Market」。idFromName("market") の 1 つだけ）
// 決まりは lounge-req.js。依頼 1 つを 1 つの 鍵（"r:" + 番号）に しまう。お礼は ここが 預かる
// 人の 記録（Viewer）への 知らせ（届いた 物・もどす お礼）は 送る 箱（"o:" + 番号）に 入れて、アラームで 送る（とどくまで くりかえす。同じ 知らせは Viewer が 1 回だけ 受ける）
// Viewer から 頼まれた ときに その場で Viewer へ 送らない（おたがいに 待って 動かなく なるのを ふせぐ）
// 終わって 7 日 たった 依頼は 小さな しるし（"t:" + 番号）に して ずっと のこす（何日も たってから 来た やりなおしにも 同じ 答えを 返す。2 重に しない）
import { LIMIT_MS, KEEP_DONE, NOTE_HIDE_AT, fits, items } from "./lounge-req.js";
import { arenaFetch, arenaAlarm } from "./lounge-arena.js";   // 闘技場（名簿・大会）も この 箱
import { supportFetch } from "./lounge-support.js";   // おたこまるさんの 窓口の 記録も この 箱（KV の おくれで 上書きされない ように）

const res = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const RETRY_MS = 60e3;   // 知らせが とどかなかったら 1 分後に もう 1 回

export class Market {
  constructor(state, env) { this.state = state; this.env = env; this.reqs = null; }

  async load() {
    if (this.reqs) return;
    this.reqs = Object.fromEntries([...(await this.state.storage.list({ prefix: "r:" })).values()].map((r) => [r.rid, r]));
  }
  put(r) { return this.state.storage.put("r:" + r.rid, r); }
  // 人の 記録への 知らせを 送る 箱に 入れる（mid：知らせの 番号。Viewer は 同じ 番号を 2 回 受けない）
  async tell(to, mid, msg) { await this.state.storage.put("o:" + mid, { to, mid, ...msg }); await this.wake(Date.now()); }
  async wake(at) { const cur = await this.state.storage.getAlarm(); if (cur == null || at < cur) await this.state.storage.setAlarm(at); }
  view(r, now) { return { rid: r.rid, by: r.by, name: r.name, want: r.want, reward: r.reward, note: r.note, hidden: r.hidden, reports: r.reports.length, until: r.until, at: r.at, open: r.status === "open" && r.until > now }; }

  tomb(r) { return { rid: r.rid, by: r.by, status: r.status, doneBy: r.doneBy, doneCid: r.doneCid, reward: r.reward, end: r.end }; }

  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    await this.load();
    const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const r = typeof b.rid === "string" ? this.reqs[b.rid] : this.reqs[url.searchParams.get("rid") || ""];
    const t = !r && typeof b.rid === "string" ? await this.state.storage.get("t:" + b.rid) : null;   // 終わった 依頼の しるし
    const ar = await arenaFetch(this, url, b, now); if (ar) return ar;
    const sp = await supportFetch(this, url, b); if (sp) return sp;
    if (url.pathname === "/list") return res({ list: Object.values(this.reqs).filter((x) => x.status === "open" && x.until > now).sort((a, c) => c.at - a.at).map((x) => this.view(x, now)) });
    if (url.pathname === "/get") return r ? res({ ok: true, req: this.view(r, now) }) : res({ ok: false, why: "その 依頼は ない" });
    // Viewer から：出す（払い終わった あと。同じ 番号は 1 回だけ）
    if (url.pathname === "/post") {
      const d = b.data || {};
      if (this.reqs[d.rid]) return res({ ok: true, again: true });
      const td = typeof d.rid === "string" ? await this.state.storage.get("t:" + d.rid) : null;
      if (td) return td.status === "void" ? res({ ok: false, why: "取り下げた 依頼" }) : res({ ok: true, again: true });   // 取り下げた あとで おくれて 来た・板に 出て もう 終わった（お礼は もう 動いた）
      if (typeof d.rid !== "string" || !d.rid.startsWith(d.by + ":") || !d.want || !LIMIT_MS[d.limit]) return res({ ok: false, why: "こわれた 依頼" });
      if (Object.values(this.reqs).some((x) => x.by === d.by && x.status === "open" && x.until > now)) return res({ ok: false, why: "依頼は 1 人 1 つまで" });
      const x = { rid: d.rid, by: d.by, name: String(d.name || "").slice(0, 40), want: d.want, reward: { balls: d.reward.balls || 0, res: d.reward.res || 0, ...items(d.reward) }, fee: d.fee, note: d.note || null,
        hidden: false, reports: [], at: now, until: now + LIMIT_MS[d.limit], status: "open" };
      this.reqs[x.rid] = x; await this.put(x); await this.wake(x.until);
      return res({ ok: true });
    }
    // Viewer から：届ける。同じ 届けの 番号（cid）なら 1 回目の 答え（返事が とどかなかった ときの やりなおし）
    if (url.pathname === "/claim") {
      const x = r || t, again = x && x.status === "done" && x.doneBy === b.by && typeof b.cid === "string" && x.doneCid === b.cid;
      if (again) return res({ ok: true, again: true, reward: x.reward });
      if (!r) return res({ ok: false, why: t ? "その 依頼は もう 終わった" : "その 依頼は ない" });
      if (r.status !== "open" || r.until <= now) return res({ ok: false, why: "その 依頼は もう 終わった" });
      if (r.by === b.by) return res({ ok: false, why: "自分の 依頼には 届けられない" });
      const got = items(b.items || {});
      if (!fits(r.want, got)) return res({ ok: false, why: "ほしい物と ちがう" });
      if (typeof b.cid !== "string" || !b.cid.startsWith(b.by + ":")) return res({ ok: false, why: "こわれた 頼み" });
      Object.assign(r, { status: "done", doneBy: b.by, doneCid: b.cid, doneName: String(b.name || "").slice(0, 40), got, end: now });
      await this.put(r);
      await this.tell(r.by, r.rid + ":got", { give: { reqGet: got }, clear: r.rid });   // 出した 人へ 届いた 物
      return res({ ok: true, reward: r.reward });
    }
    // Viewer から：取り下げる（手数料は もどらない）。お礼は 答えで 返す（Viewer が もどす）
    // 板に まだ ない 依頼（出す 頼みが とどかなかった）は「なかった」しるしを のこして never（Viewer は 手数料も もどす。おくれて 来た 出す 頼みは ことわる）
    if (url.pathname === "/cancel") {
      if (typeof b.rid !== "string" || !b.rid.startsWith(b.by + ":")) return res({ ok: false, why: "その 依頼は ない" });
      if (!r) {
        if (t) return t.by === b.by && (t.status === "void" || t.status === "cancelled") ? res({ ok: true, again: true, never: t.status === "void", reward: t.reward }) : res({ ok: false, why: "その 依頼は もう 終わった" });
        await this.state.storage.put("t:" + b.rid, { rid: b.rid, by: b.by, status: "void", end: now });
        return res({ ok: true, never: true });
      }
      if (r.by !== b.by) return res({ ok: false, why: "その 依頼は ない" });
      if (r.status === "cancelled") return res({ ok: true, again: true, reward: r.reward });
      if (r.status !== "open") return res({ ok: false, why: "その 依頼は もう 終わった" });
      r.status = "cancelled"; r.end = now; await this.put(r);
      return res({ ok: true, reward: r.reward });
    }
    // 門番の 入口から：通報（自由に 書いた ひとことだけ・1 人 1 回・3 回で かくす）・配信者と モデレーターが 消す
    if (url.pathname === "/report") {
      if (!r || !r.note || !r.note.free) return res({ ok: false, why: "通報 できない" });
      if (r.by === b.by || r.reports.includes(b.by)) return res({ ok: false, why: "もう 通報した" });
      r.reports.push(String(b.by)); if (r.reports.length >= NOTE_HIDE_AT) r.hidden = true;
      await this.put(r); return res({ ok: true, hidden: r.hidden });
    }
    if (url.pathname === "/notedel") {
      if (!r || !r.note) return res({ ok: false, why: "ひとことは ない" });
      r.note = null; r.hidden = false; await this.put(r); return res({ ok: true });
    }
    return res({ error: "notfound" }, 404);
  }

  // 期限の 来た 依頼の お礼を もどす・古い 依頼を 消す・知らせを 送る
  async alarm() {
    await this.load();
    const now = Date.now();
    for (const r of Object.values(this.reqs)) {
      if (r.status === "open" && r.until <= now) {
        r.status = "expired"; r.end = now; await this.put(r);
        await this.state.storage.put("o:" + r.rid + ":back", { to: r.by, mid: r.rid + ":back", give: { reqBack: { mats: r.reward.mats, equip: r.reward.equip } }, earn: [["balls", r.reward.balls], ["res", r.reward.res]].filter(([, d]) => d > 0).map(([kind, d]) => ({ kind, d })), clear: r.rid });
      }
      if (r.status !== "open" && now - (r.end || r.at) > KEEP_DONE) { delete this.reqs[r.rid]; await this.state.storage.put("t:" + r.rid, this.tomb(r)); await this.state.storage.delete("r:" + r.rid); }
    }
    const ta = await arenaAlarm(this, now);   // 22:00 の 大会を 進める（ごほうびは 下の 送る 箱へ）
    let left = 0, sent = 0;
    for (const m of (await this.state.storage.list({ prefix: "o:" })).values()) {
      if (++sent > 30) { left++; continue; }   // 1 回の アラームで 送るのは 30 こまで（よそへの 頼みの 上限）
      try {
        const v = this.env.VIEWER.get(this.env.VIEWER.idFromName("v:" + m.to));
        const j = await (await v.fetch("https://viewer/inbox", { method: "POST", body: JSON.stringify(m) })).json();
        if (j.ok) { await this.state.storage.delete("o:" + m.mid); continue; }
      } catch (e) {}
      left++;
    }
    const next = Object.values(this.reqs).filter((r) => r.status === "open").reduce((a, r) => Math.min(a, r.until), Infinity);
    const at = Math.min(left ? now + RETRY_MS : Infinity, next, ta);
    if (at < Infinity) await this.state.storage.setAlarm(at);
  }
}
