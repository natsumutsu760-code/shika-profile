// 島 3 が 開いた 夜の 招待（クローラーと ボーダーゾーンの はじまり）の フラグ。2026-11-11 鹿さん「島3を解放した時点でイントロイベント発生、その際のフラグが立っておりません」
// 決め（docs/mono-link-story-missions.md・mono-link-story-ch1.md「はじまり」）：
//   無線機が 島 3 に 届く 段（Lv2）に なると、知らない 周波数から 通信（UNKNOWN）→ ラウンジの PC に 誓約書と サインインパネル →
//   サインすると クローラーと ボーダーゾーンが 開き、1-01 の 依頼が 届く
// 記録：rec.order = { signed：サインした 時刻 }。受付：order.sign。me の order = { ready：招待が 届いて いるか, signed }
import { bzIsleOk } from "./border.js";   // 島 3 へ 行けるか（隠れ家の 無線機 Lv2。dungeons.js の canGo と 同じ）

export const ORDER_WAIT_WHY = "まだ 招待が 届いて いない（隠れ家の 無線機を Lv2 に すると、知らない 周波数から 通信が 入る）";
export const ORDER_SIGN_WHY = "招待の 誓約書に サインすると 開く（クローラーの はじまり）";
export const orderReady = (rec) => bzIsleOk(rec && rec.hideout);
export const orderSigned = (rec) => !!(rec && rec.order && rec.order.signed);
export function orderSign(rec, now = Date.now()) {
  if (orderSigned(rec)) return { ok: true, signed: rec.order.signed, again: true };
  if (!orderReady(rec)) return { ok: false, why: ORDER_WAIT_WHY };
  rec.order = { signed: now };
  return { ok: true, signed: now };
}
export const orderView = (rec) => ({ ready: orderReady(rec), signed: (rec && rec.order && rec.order.signed) || 0 });
