// パチンコの 景品（シーズンラインナップ）を ボタンで 買う 受付（鹿さんの 決め 2026-11-03。並びは lounge-proto/prizes.js）
// prize.view：いまの 並び（いつも 並ぶ 7・家具 2・コスメ 5）。コスメは オーバーレイが 上げた サイトの データ（KV の data.shop）から
// prize.buy {kind: "always" | "furn" | "cos", id, slot, no, ck, price}：持ち玉で 買う（帳簿で 引く）
//   鍵・謎のお菓子・家具は ラウンジの 持ち物へ。コスメは オーバーレイの ガチャの 記録に しか 入らないので、
//   帳簿の 頼みに give を のせて オーバーレイが 渡す（!購入 と 同じ 決まりで 確かめる）。だから コスメは 配信中だけ
// 景品の 受付は prize.（shop. では ない）：新ペットの 公開（PET_OPEN）までは ロックで 鹿さんと おたこまるさんだけ
import { PRIZE_ALWAYS, prizeOf, furnLineup, prizeSlot, slotUntil } from "./game.js";
import { FURN_MAX } from "./lounge-game.js";
import { F } from "./lounge-rules.js";

const cosOf = (data, slot) => {
  const s = data && Array.isArray(data.shop) ? data.shop.find((x) => x && x.slot === slot) : null;
  return s && Array.isArray(s.items) ? s.items : null;
};
// 画面に 渡す 形。have：持って いる 数。name・note も のせる（サイトは 見本の ファイルを 読まずに 出せる）
export function prizeView(rec, data, now = Date.now()) {
  const slot = prizeSlot(now), it = rec.items || {}, own = (rec.own && rec.own.furniture) || {};
  return {
    slot, until: slotUntil(slot),
    always: PRIZE_ALWAYS.map((p) => ({ id: p.id, name: p.name, note: p.note, c: p.c || "", price: p.price, have: it[p.id] || 0 })),
    furn: furnLineup(slot).map((f) => ({ ...f, name: F(f.id).name, have: own[f.id] || 0 })),
    cos: cosOf(data, slot),   // null：オーバーレイが まだ この 6 時間の 並びを 上げて いない（配信の 画面が 動くと 出る）
  };
}
// 買う 計画（Viewer の charge に 渡す）。だめなら { why }
export function prizePlan(rec, b, data, now = Date.now()) {
  const slot = prizeSlot(now), kind = b && b.kind;
  if (kind === "always") {
    const p = prizeOf(b.id); if (!p) return { why: "その 景品は ない" };
    return { costs: [{ kind: "balls", d: -p.price }], why: "prize:" + p.id, grant: { items: { [p.id]: 1 } } };
  }
  if (kind !== "furn" && kind !== "cos") return { why: "えらぶ 物が ない" };
  if (b.slot !== slot) return { why: "景品が 入れ替わりました（もう 一度 開いて ください）" };
  if (kind === "furn") {
    const f = furnLineup(slot).find((x) => x.id === b.id); if (!f) return { why: "その 家具は いま ならんで いない" };
    if (((rec.own.furniture || {})[f.id] || 0) >= FURN_MAX) return { why: `もう 持てない（${FURN_MAX} こまで）` };
    return { costs: [{ kind: "balls", d: -f.price }], why: "prize:furn:" + f.id, grant: { furniture: { [f.id]: 1 } } };
  }
  const c = (cosOf(data, slot) || []).find((x) => x && x.no === b.no && x.id === b.id && x.kind === b.ck);
  if (!c) return { why: "その コスメは いま ならんで いない" };
  if (b.price !== c.price) return { why: "値段が かわりました（もう 一度 開いて ください）" };
  return { costs: [{ kind: "balls", d: -c.price }], why: "prize:cos:" + slot + ":" + c.no, grant: null, online: true,
    give: { cos: { slot, no: c.no, kind: c.kind, id: c.id, price: c.price } } };
}
