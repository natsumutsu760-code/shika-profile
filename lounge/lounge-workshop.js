// 工房（鹿さんの頼み、2026-10-25）：道具・品を 作る（ws.make）・武器の アタッチメントを 作る（ws.att）・付ける（att.set）・はずす（att.off）・すてる（att.drop）
// 決まりの 中身は 見本の lounge-proto/workshop.js。支払いは 素材 ＋ クレジット（帳簿を 使わない ので その場で 決まる）
// アタッチメントは 記録の own.att に { uid, base, star, ops, on }（on：付けて いる 武器の uid か null）。武器が 合成・売る・届けるで なくなっても、アタッチメントは のこる（付いて いない 扱い）
import { WS_ITEMS, WS_MAX, ATT_MAX, attBase, rollAtt, baseOf } from "./game.js";
import { takeMats, applyTake, give } from "./lounge-game.js";

const newUid = (rec, p) => p + (++rec.uidN).toString(36);
export const ensureWs = (rec) => { rec.own.att ||= []; return rec; };
// 付いて いない アタッチメント（武器が もう ない 物も）
const loose = (rec) => rec.own.att.filter((a) => !a.on || !rec.own.equip.some((e) => e.uid === a.on));
// その 装備を 付けて いる 子が 出かけて いるか
function wornAway(rec, uid) {
  const who = [...rec.pets, ...rec.tamed].filter((x) => x.equip && Object.values(x.equip).includes(uid)).map((x) => x.uid);
  return rec.trips.some((t) => !t.done && t.party.some((u) => who.includes(u)));
}

// 道具・品を n こ 作る。b：{ id, n }
export function wsMake(rec, b, now = Date.now()) {
  ensureWs(rec);
  const lv = rec.hideout.workshop || 0, r = WS_ITEMS.find((x) => x.id === b.id);
  if (!lv) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  if (!r) return { ok: false, why: "作る 物を えらんで" };
  if (lv < r.lv) return { ok: false, why: `工房 Lv${r.lv} から 作れる` };
  const n = Number.isInteger(b.n) && b.n >= 1 && b.n <= WS_MAX ? b.n : 0;
  if (!n) return { ok: false, why: `作る 数は 1〜${WS_MAX}` };
  const cr = r.credits * n;
  if (cr > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (cr - rec.credits).toLocaleString("ja-JP") };
  const t = takeMats(rec, r.mats.map(([id, k, q]) => [id, k * n, q || 0]), { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks); rec.credits -= cr;
  const g = {}; for (const [kind, o] of Object.entries(r.to)) g[kind] = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * n]));
  give(rec, g, now);
  return { ok: true, id: r.id, n };
}

// アタッチメントを 1 つ 作る（★と OP は くじ）。b：{ base }
export function wsAtt(rec, b, R, now = Date.now()) {
  ensureWs(rec);
  const lv = rec.hideout.workshop || 0, base = attBase(b.base);
  if (!lv) return { ok: false, why: "工房が まだ ない（隠れ家で 作る）" };
  if (!base) return { ok: false, why: "作る アタッチメントを えらんで" };
  if (loose(rec).length >= ATT_MAX) return { ok: false, why: `付けて いない アタッチメントが いっぱい（${ATT_MAX} こ）。いらない 物を すてて から` };
  if (base.credits > rec.credits) return { ok: false, why: "クレジットが 足りない：あと " + (base.credits - rec.credits).toLocaleString("ja-JP") };
  const t = takeMats(rec, base.mats, { now });
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks); rec.credits -= base.credits;
  const att = { uid: newUid(rec, "a"), ...rollAtt(R, base, lv), on: null };
  rec.own.att.push(att);
  return { ok: true, att };
}

// 武器に 付ける（同じ 場所に 付いて いた 物は はずれる）。b：{ att, weapon }
export function attSet(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att), w = rec.own.equip.find((e) => e.uid === b.weapon), base = a && attBase(a.base);
  if (!a || !base) return { ok: false, why: "その アタッチメントは ない" };
  if (!w || (baseOf(w.base) || {}).slot !== "weapon") return { ok: false, why: "付けられるのは 武器だけ" };
  if (wornAway(rec, w.uid) || (a.on && wornAway(rec, a.on))) return { ok: false, why: "その 武器を 持って いる 子が 出かけて いる" };
  for (const x of rec.own.att) if (x !== a && x.on === w.uid && (attBase(x.base) || {}).kind === base.kind) x.on = null;
  a.on = w.uid;
  return { ok: true };
}
export function attOff(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att);
  if (!a) return { ok: false, why: "その アタッチメントは ない" };
  if (a.on && wornAway(rec, a.on)) return { ok: false, why: "その 武器を 持って いる 子が 出かけて いる" };
  a.on = null;
  return { ok: true };
}
export function attDrop(rec, b) {
  ensureWs(rec);
  const a = rec.own.att.find((x) => x.uid === b.att);
  if (!a) return { ok: false, why: "その アタッチメントは ない" };
  if (a.on && rec.own.equip.some((e) => e.uid === a.on)) return { ok: false, why: "武器に 付いて いる（はずして から）" };
  rec.own.att = rec.own.att.filter((x) => x !== a);
  return { ok: true };
}
