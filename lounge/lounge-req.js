// プライベートラウンジ 6 だんかい目：みんなの依頼（ユーザーから ユーザーへ）の 決まり。viewer.js と market.js が 使う
// 決まりは docs/mono-link-pet-battle.md の「みんなの依頼」（鹿さんの決め、2026-10-22・23）
// - お礼は 出すときに 先に 預ける（Market が 持つ）。届いたら すぐ 届けた人へ、期限が 来たら・取り下げたら 出した人へ もどる
// - 頼めるのは 素材と 装備（いちどに ぜんぶ 届ける）。お礼は 玉・リソース・素材・装備
// - 手数料：お礼の ねうちの 1 割を 玉で、出した人が はらう（もどらない。案）。1 人 1 つまで
// - ひとこと：えらぶ ことば か 自由に 書く（20 字まで）。NG ことば・URL・連絡先は 出せない（門番でも たしかめる）。通報 3 回で かくす
import { MAT_NAME, sellPrice, baseOf, REQ_FEE, RES_VALUE, NOTE_PRESETS, NOTE_HIDE_AT, noteBlock } from "./game.js";
import { putMats, putEquip, takeMats } from "./lounge-game.js";
import { equippedUids } from "./lounge-pet.js";   // lounge-game.js も ここを 読む（どちらも 呼ぶ ときに 使うだけ）

export const LIMIT_MS = [6, 24, 72, 168].map((h) => h * 3600e3);   // 6 時間・1 日・3 日・7 日（deeplink.js の REQ_LIMITS と 同じ 順）
export const KEEP_DONE = 7 * 864e5;                                 // 終わった 依頼を のこす 日（2 回 届けない ため）
export { NOTE_HIDE_AT };
const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const clean = (s) => String(s || "").replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁩﻿]/g, "").trim();

// ほしい物：{ mat, q, n }（品質 q 以上を n こ）か { equip, star }（★star 以上を 1 つ）
export function cleanWant(w) {
  if (w && has(MAT_NAME, w.mat)) { const q = int(w.q ?? 0, 0, 5), n = int(w.n ?? 1, 1, 99); return q == null || n == null ? null : { mat: w.mat, q, n }; }
  if (w && typeof w.equip === "string" && baseOf(w.equip)) { const star = int(w.star ?? 1, 1, 5); return star == null ? null : { equip: w.equip, star, n: 1 }; }
  return null;
}
// お礼の ねうち（玉）：リソース 1 ＝ 玉 1,000、素材は 売ると いくらか、装備は ★ × リソース 1
export const valueOf = (rw) => (rw.balls || 0) + (rw.res || 0) * RES_VALUE + (rw.mats || []).reduce((a, m) => a + sellPrice(m) * m.n, 0) + (rw.equip || []).reduce((a, e) => a + e.star * RES_VALUE, 0);
export const feeOf = (rw) => Math.max(10, Math.round((valueOf(rw) * REQ_FEE) / 10) * 10);
// ひとこと。{ preset: 番号 } か { text: "自由に 書く" }。extra は 門番だけが 持つ NG ことば（画面には 出さない）
export function cleanNote(nt, extra = []) {
  if (nt == null || nt === "") return { note: null };
  if (Number.isInteger(nt.preset)) return NOTE_PRESETS[nt.preset] ? { note: { text: NOTE_PRESETS[nt.preset], free: false } } : { why: "ことばを えらんで" };
  const t = clean(nt.text).normalize("NFKC");
  if (!t) return { note: null };
  const why = noteBlock(t) || (ngExtra(t, extra) ? "使えない ことばが ある" : "");
  return why ? { why } : { note: { text: t, free: true } };
}
const flat = (s) => s.toLowerCase().replace(/[\s・ー\-_.。、]/g, "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));   // noteBlock と 同じ そろえ方
const ngExtra = (t, list) => list.some((w) => w && flat(t).includes(flat(w.normalize("NFKC"))));
// 届けた 物が ほしい物に 合うか（Market でも たしかめる）
export function fits(want, items) {
  if (want.mat) return Array.isArray(items.mats) && items.mats.every((m) => m.id === want.mat && m.q >= want.q) && items.mats.reduce((a, m) => a + m.n, 0) === want.n && !(items.equip || []).length;
  return Array.isArray(items.equip) && items.equip.length === 1 && items.equip[0].base === want.equip && items.equip[0].star >= want.star && !(items.mats || []).length;
}
// 預ける・わたす 物の 形。装備の 番号は 落とす（受けとる 人の 番号を つけなおす）。買った 印（b）は のこす（もどす とき 拾った 物に ならない ように）
const strip = (e) => ({ base: e.base, star: e.star, ops: [...(e.ops || [])], ...(e.fx ? { fx: true } : {}), ...(e.b ? { b: 1 } : {}) });
export const items = (x) => ({ mats: (x.mats || []).map((m) => ({ id: m.id, q: m.q || 0, n: m.n, ...(m.b ? { b: 1 } : {}) })), equip: (x.equip || []).map(strip) });

// 渡す 物の データ（lounge-game.js の give から 呼ぶ）
//   reqSend：払えたので 依頼を 送る 箱へ（wait → out）。reqDrop：払えなかったので 依頼を やめる
//   reqGet：人から もらった 物（買った 印 b を つける。タスクで 納められるのは 派遣で 拾った 物だけ）
export function giveReq(rec, g, now) {
  const R = rec.req;
  if (g.reqSend && R.wait[g.reqSend]) { R.out.push({ k: "post", rid: g.reqSend, data: R.wait[g.reqSend] }); delete R.wait[g.reqSend]; }
  if (g.reqDrop) { delete R.wait[g.reqDrop]; if (R.mine === g.reqDrop) R.mine = null; }
  if (g.reqGet) { putMats(rec, (g.reqGet.mats || []).map((m) => ({ ...m, b: 1 })), now); putEquip(rec, (g.reqGet.equip || []).map((e) => ({ ...e, b: 1 })), now); }
  if (g.reqBack) { putMats(rec, g.reqBack.mats || [], now); putEquip(rec, g.reqBack.equip || [], now); }
}
export const ensureReq = (rec) => { rec.req ||= { mine: null, wait: {}, out: [], done: [], n: 0 }; return rec; };

// 出す 計画（viewer.js の charge で 払う）。お礼の 玉と 手数料は 玉で、リソースは リソースで（ぜんぶか なし）
// reward：{ balls, res, mats: [{ id, q, n }], equip: [装備の uid] }・want・limit（LIMIT_MS の 番号）・note
export function reqPostPlan(rec, b, extra = []) {
  ensureReq(rec);
  if (rec.req.mine) return { ok: false, why: "依頼は 1 人 1 つまで（いまの 依頼が 終わるか 取り下げると 出せる）" };
  const want = cleanWant(b.want);
  if (!want) return { ok: false, why: "ほしい物を えらんで" };
  if (!Number.isInteger(b.limit) || !LIMIT_MS[b.limit]) return { ok: false, why: "期限を えらんで" };
  const nt = cleanNote(b.note, extra);
  if (nt.why) return { ok: false, why: nt.why };
  const rw = b.reward || {}, balls = int(rw.balls ?? 0, 0, 1e6), resN = int(rw.res ?? 0, 0, 999);
  const ms = Array.isArray(rw.mats) ? rw.mats.slice(0, 5) : [], us = Array.isArray(rw.equip) ? rw.equip.slice(0, 3) : [];
  if (balls == null || resN == null || !ms.every((m) => has(MAT_NAME, m.id) && int(m.n, 1, 999) && int(m.q ?? 0, 0, 5) != null)) return { ok: false, why: "お礼が ちがう" };
  const t = takeMats(rec, ms.map((m) => [m.id, m.n, m.q || 0]));
  if (t.why) return { ok: false, why: t.why };
  const on = equippedUids(rec), eq = us.map((u) => rec.own.equip.find((e) => e.uid === u && !on.has(e.uid)));
  if (eq.some((e) => !e) || new Set(us).size !== us.length) return { ok: false, why: "お礼の 装備を えらびなおして（付けて いる 物は はずして から）" };
  const reward = { balls, res: resN, ...items({ mats: t.taken, equip: eq }) };
  if (!valueOf(reward)) return { ok: false, why: "お礼を えらんで" };
  const fee = feeOf(reward), rid = `${rec.id}:${rec.at.toString(36)}:q${++rec.req.n}`;
  const data = { rid, by: rec.id, name: rec.name, want, reward, fee, note: nt.note, limit: b.limit };
  return { costs: [{ kind: "balls", d: -(balls + fee) }, { kind: "res", d: -resN }].filter((c) => c.d), why: "req:" + rid,
    take: () => { rec.own.mats = t.mats; rec.own.equip = rec.own.equip.filter((e) => !eq.includes(e)); rec.req.mine = rid; rec.req.wait[rid] = data; },
    grant: { reqSend: rid }, refund: { reqDrop: rid, reqBack: items({ mats: t.taken, equip: eq }) }, info: { rid, fee } };
}
// 届ける 物を 取る（素材は 品質の 低い 物から・買った 物から、装備は uid か ★の いちばん 低い 物）
export function takeFor(rec, want, uid) {
  if (want.mat) { const t = takeMats(rec, [[want.mat, want.n, want.q]]); return t.why ? { why: t.why } : { take: () => { rec.own.mats = t.mats; }, items: { mats: t.taken, equip: [] } }; }
  const on = equippedUids(rec), list = rec.own.equip.filter((e) => e.base === want.equip && e.star >= want.star && !on.has(e.uid)), e = list.find((x) => x.uid === uid) || list.sort((a, c) => a.star - c.star)[0];
  return e ? { take: () => { rec.own.equip = rec.own.equip.filter((x) => x !== e); }, items: { mats: [], equip: [e] } } : { why: "ほしい 装備を 持って いない" };
}
