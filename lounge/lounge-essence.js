// モンスターの エッセンス（docs/mono-link-essence.md）の 門番：抽出・つくる・売る
// 記録：rec.ess = { 種（ツリー id）：数 }。つくった ツリーは 研究ずみ（rec.lab）に 入る（研究・取り出しと 同じ。どの ペットでも サブツリーに 付けられる）
// アメジストを 使わない ので 配信の 画面の 返事を 待たない（すぐ。鹿さんの 決め「すぐできる」2026-11-11）
import { essYield, essPrice, essRecipe, essPlan, essWhy, essName, ESS_MAX } from "./essence.js";

const away = (rec, uid) => rec.trips.some((t) => !t.done && t.party.includes(uid));
const pendingBye = (unknown, uid) => unknown.some((u) => u.grant && u.grant.bye === uid);
const pendingLab = (unknown, id) => unknown.some((u) => u.grant && (u.grant.lab === id || (u.grant.labQ && u.grant.labQ.tree === id)));
// 〔C〕研究所（隠れ家の 施設）を 作って いる こと。画面が 研究所の 中（鹿さんの 決め「研究所にまとめる」）なので 門番も 同じ。売るは いつでも
export const ESS_NO_LAB = "隠れ家に 研究所を 作ると 使える";
const noLab = (rec) => !(((rec.hideout || {}).lab || 0) >= 1);

// 抽出：あまった 子（いくつでも）→ その 種の エッセンス。子とは おわかれ（装備は 持ち物に のこる。配合と 同じ）
// パーティ・出かけて いる・坑道で 掘って いる・取り出しの 返事を 待って いる 子は できない
export function essExtract(rec, b, unknown = []) {
  if (noLab(rec)) return { ok: false, why: ESS_NO_LAB };
  const uids = Array.isArray(b && b.uids) ? [...new Set(b.uids.map(String))] : [];
  if (!uids.length) return { ok: false, why: "抽出する 子を えらんで" };
  if (uids.length > 200) return { ok: false, why: "1 回に 200 体まで" };
  const list = [];
  for (const u of uids) {
    const c = rec.tamed.find((x) => x.uid === u);
    if (!c) return { ok: false, why: "その 子は いない" };
    if (rec.party.includes(u)) return { ok: false, why: `${c.name}は パーティに いる（部屋に もどして から）` };
    if (away(rec, u)) return { ok: false, why: `${c.name}は 出かけて いる（帰って から）` };
    if (rec.mine && rec.mine.on.some((w) => w.uid === u)) return { ok: false, why: `${c.name}は 坑道で 掘って いる（坑道から もどして から）` };
    if (pendingBye(unknown, u)) return { ok: false, why: `${c.name}は 取り出しの 返事を 待って いる` };
    list.push(c);
  }
  rec.ess ||= {};
  const got = {};
  for (const c of list) { const n = essYield(c.tree); got[c.tree] = (got[c.tree] || 0) + n; }
  for (const [t, n] of Object.entries(got)) rec.ess[t] = Math.min(ESS_MAX, (rec.ess[t] || 0) + n);
  rec.tamed = rec.tamed.filter((c) => !list.includes(c));
  return { ok: true, got, n: list.length };
}

// つくる：kind（sub サブツリー・evo 上位スキル「＋」・special 特殊スキル）と id（できる ツリー）
export function essMake(rec, b, unknown = []) {
  if (noLab(rec)) return { ok: false, why: ESS_NO_LAB };
  const r = essRecipe(String((b && b.kind) || ""), String((b && b.id) || ""));
  const why = essWhy(rec, r);
  if (why) return { ok: false, why };
  if (pendingLab(unknown, r.id)) return { ok: false, why: "前の 研究が まだ 決まって いない（配信の 画面の 返事を 待って いる）" };
  const p = essPlan(rec.ess, r);
  for (const [t, n] of Object.entries(p.take)) { rec.ess[t] -= n; if (rec.ess[t] <= 0) delete rec.ess[t]; }
  rec.lab.push(r.id);
  return { ok: true, id: r.id, kind: r.kind, used: p.take };
}

// 売る：{ tree, n }（1 種）か { all: [種…] }（えらんだ 種を ぜんぶ）。売値は ランク（F 15 〜 EX 600）
export function essSell(rec, b) {
  rec.ess ||= {};
  const pick = [];
  if (Array.isArray(b && b.all)) for (const t of new Set(b.all.map(String))) { if (rec.ess[t] > 0) pick.push([t, rec.ess[t]]); }
  else if (b && b.tree) {
    const t = String(b.tree), n = Number(b.n);
    if (!Number.isInteger(n) || n < 1) return { ok: false, why: "売る 数を えらんで" };
    if (!(rec.ess[t] >= n)) return { ok: false, why: `${essName(t)}が 足りない（${rec.ess[t] || 0} こ）` };
    pick.push([t, n]);
  }
  if (!pick.length) return { ok: false, why: "売る エッセンスを えらんで" };
  let paid = 0, n = 0;
  for (const [t, k] of pick) { paid += essPrice(t) * k; n += k; rec.ess[t] -= k; if (rec.ess[t] <= 0) delete rec.ess[t]; }
  rec.credits = (rec.credits || 0) + paid;
  return { ok: true, paid, n };   // credits は 門番の 返事で 残高に なる ので paid
}

export const essView = (rec) => rec.ess || {};
