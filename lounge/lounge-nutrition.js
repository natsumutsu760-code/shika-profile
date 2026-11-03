// 栄養（詳細ステータス。鹿さんの 決め、2026-10-31）。決まりの 中身は 見本の lounge-proto/nutrition.js
// nut.craft {id, n}：おやつ工房で 作物から おやつ・nut.feed {uid, id, n}：ペットか なかまに 食べさせる
// nut.detox {uid}：デトックス茶で リセット（キャップの 前だけ）・nut.break {uid}：謎のお菓子で 上限突破（キャップで）
// 記録：その 子の nut（nutrition.js）。おやつ・デトックス茶・謎のお菓子は rec.items
import { detailOpen, nutSnack, NUT_CROP_N, NUT_CRAFT_MAX, NUT, nutTotal, nutCap, nutSettle, isSweet, eatWait } from "./game.js";
import { takeMats, applyTake } from "./lounge-game.js";

const CLOSED = { ok: false, why: "詳細ステータスは まだ 開いて いない" };
const childOf = (rec, uid) => (typeof uid === "string" && (rec.pets.find((p) => p.uid === uid) || rec.tamed.find((c) => c.uid === uid))) || null;
const nOf = (b, max) => (Number.isInteger(b.n) && b.n >= 1 && b.n <= max ? b.n : 0);
const mins = (ms) => Math.max(1, Math.ceil(ms / 60000));

export function nutCraft(rec, b) {
  if (!detailOpen()) return CLOSED;
  const lv = rec.hideout.snack || 0;
  if (!lv) return { ok: false, why: "おやつ工房が まだ ない（隠れ家で 作る）" };
  const r = nutSnack(b.id), n = nOf(b, NUT_CRAFT_MAX);
  if (!r) return { ok: false, why: "作る おやつを えらんで" };
  if (!n) return { ok: false, why: "作る 数を えらんで" };
  const t = takeMats(rec, [[r.crop, NUT_CROP_N * n]]);
  if (t.why) return { ok: false, why: t.why };
  applyTake(rec, t.picks);
  rec.items ||= {}; rec.items[r.id] = (rec.items[r.id] || 0) + n;
  return { ok: true, id: r.id, n };
}

// 食べさせる：1 こずつ。満腹（あと 1 こで 満腹度が こえる）か キャップで 止まる。腹八分目なら ときどき 栄養 ＋1
export function nutFeed(rec, b, R, now = Date.now()) {
  if (!detailOpen()) return CLOSED;
  const x = childOf(rec, b.uid), r = nutSnack(b.id), n = nOf(b, NUT_CRAFT_MAX);
  if (!x) return { ok: false, why: "その 子は いない" };
  if (!r) return { ok: false, why: "おやつを えらんで" };
  if (!n) return { ok: false, why: "食べさせる 数を えらんで" };
  const have = (rec.items || {})[r.id] || 0;
  if (have < n) return { ok: false, why: `${r.name}が 足りない：あと ${n - have}` };
  const nut = nutSettle(x, now), cap = nutCap(nut);
  let ate = 0, got = 0, bonus = 0, stop = null;
  for (let i = 0; i < n; i++) {
    const left = cap - nutTotal(nut);
    if (left <= 0) { stop = "cap"; break; }
    if (nut.full + NUT.eat > NUT.full) { stop = "full"; break; }
    const k = Math.min(left, 1 + (isSweet(nut.full) && R() < NUT.bonus ? 1 : 0));
    nut.s[r.stat] = (nut.s[r.stat] || 0) + k; nut.full += NUT.eat; ate++; got += k; bonus += k - 1;
  }
  if (!ate) return { ok: false, why: stop === "cap" ? "キャップに 届いて いる（謎のお菓子で 上限突破）" : `おなかが いっぱい（あと ${mins(eatWait(nut, now))} 分で 食べられる）` };
  rec.items[r.id] -= ate;
  return { ok: true, n: ate, got, bonus, stat: r.stat, full: nut.full, total: nutTotal(nut), cap, stop };
}

// デトックス茶：キャップに 届く 前に リセット（上限は かわらない）
export function nutDetox(rec, b, now = Date.now()) {
  if (!detailOpen()) return CLOSED;
  const x = childOf(rec, b.uid);
  if (!x) return { ok: false, why: "その 子は いない" };
  if (!((rec.items || {}).detox > 0)) return { ok: false, why: "デトックス茶を 持って いない（工房で 作る）" };
  const nut = nutSettle(x, now), tot = nutTotal(nut);
  if (!tot) return { ok: false, why: "まだ 栄養が ない" };
  if (tot >= nutCap(nut)) return { ok: false, why: "キャップに 届いたら デトックス茶は 使えない（謎のお菓子で 上限突破）" };
  rec.items.detox--; nut.s = {};
  return { ok: true, reset: tot };
}

// 謎のお菓子：キャップに 届いたら 上限突破（詳細ステータスは リセット・キャップ ＋1%）
export function nutBreak(rec, b, now = Date.now()) {
  if (!detailOpen()) return CLOSED;
  const x = childOf(rec, b.uid);
  if (!x) return { ok: false, why: "その 子は いない" };
  if (!((rec.items || {}).mystery > 0)) return { ok: false, why: "謎のお菓子を 持って いない（派遣で ごく まれに 見つかる）" };
  const nut = nutSettle(x, now), tot = nutTotal(nut), cap = nutCap(nut);
  if (tot < cap) return { ok: false, why: `キャップに 届いて から（いま 栄養 ${tot} / ${cap}）` };
  rec.items.mystery--; nut.s = {}; nut.br = (nut.br || 0) + 1;
  return { ok: true, br: nut.br, cap: nutCap(nut) };
}
