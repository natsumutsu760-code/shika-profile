// 競り（ガラク）と フリマ（アンビル・ピーコ）の 決まり。門番（lounge-server/lounge-auction.js）と 画面（auction.html）の 両方が 読む
// 資料：docs/mono-link-auction.md（原案・鹿さんの 決め・Claude の 案を 分けて 書いた）
// 原案（mono-link-deeplink-story.md）：フリマは 委託販売・出品の 手数料と 枠・期限が 来たら 会社の 最低値 か 自動リサイクルを えらぶ。競り（ガラク）も 同じ 形
// 鹿さんの 決め（24 回目の カード、2026-11-07）：競りの 画面は 別の ページ・競りに 出せるのは ぜんぶ（素材・スフィア〈鑑定した 物〉・装備・サンプル）・フリマも いっしょに
// Claude の 案：数は ぜんぶ docs/mono-link-numbers.md 6 章の 下書き（フリマ 2%〈最低 5〉・8%・枠 5〈好感度 ＋1〜＋3〉・3 日・引き取り 8 割・リサイクル 5 割／
//   競り 3%・10%・1 日・5% 刻み・即決。「まだ 決めて いない こと」に ある。鹿さんが 直す）・競りの 枠 5・フリマは 作った 装備だけ・取り下げても 品は もどらない など
import { baseOf, recycleOf } from "./equip.js";
import { GATHER, sellPrice } from "./materials.js";

const DAY = 864e5;
// 場（mode）。co は 売り上げを つける 会社（トークン）・group は 枠の 好感度を 見る グループ（ガラクは 中立なので なし）
export const AU_MODES = {
  auc: { name: "競り", who: "ガラク", tid: "junk", co: "GLK", group: null, fee: 0.03, feeMin: 1, cut: 0.1, ms: 1 * DAY, slots: 5, bid: true },
  anvil: { name: "フリマ", who: "アンビル", tid: "anvil", co: "VLC", group: "sva", fee: 0.02, feeMin: 5, cut: 0.08, ms: 3 * DAY, slots: 5, slot: "weapon", perkSlot: "consignA" },
  hanger: { name: "フリマ", who: "ピーコ", tid: "hanger", co: "RSL", group: "tcu", fee: 0.02, feeMin: 5, cut: 0.08, ms: 3 * DAY, slots: 5, slot: "armor", perkOpen: "consignH" },
};
export const isMode = (m) => typeof m === "string" && Object.prototype.hasOwnProperty.call(AU_MODES, m);
export const AU_STEP = 0.05;           // 入札は 5% 刻み（Claude の 案。数の 下書き 6 章）
export const AU_PRICE_MAX = 1000000;   // 値の 上限（Claude の 案）
export const AU_MAT_MAX = 999;         // 素材を 1 回に 出せる 数（Claude の 案）
export const AU_TAKE = 0.8;            // 引き取り：リサイクルした 素材の ねうちの 8 割（Claude の 案。数の 下書き 6 章）
export const AU_SCRAP = 0.5;           // 自動リサイクル：素材の 5 割（Claude の 案。数の 下書き 6 章）
export const AU_LEFT_MS = 7 * DAY;     // 売れ残りを えらばずに 7 日で 引き取り（Claude の 案）
export const AU_KEEP_MS = 7 * DAY;     // 終わった 出品を 見せる 日数（Claude の 案）

// 好感度の 段（docs/mono-link-numbers.md 2 章：なじみ 25・信頼 50・盟友 75）で 枠が ふえる
export const affSlots = (aff) => (aff >= 75 ? 3 : aff >= 50 ? 2 : aff >= 25 ? 1 : 0);
// 枠の 数。aff：その 場の グループの 好感度・perks：店で 買った 物（アンビルの「武器の 委託の 枠 ＋1」）
export const slotsOf = (mode, aff = 0, perks = {}) => { const M = AU_MODES[mode]; return M ? M.slots + (M.group ? affSlots(aff) : 0) + (M.perkSlot && perks[M.perkSlot] ? 1 : 0) : 0; };
// 場が 開いて いるか（ピーコの フリマは 店の「防具の 委託」〈プライマリータスクで 開く〉を うけとってから）
export const modeOpen = (mode, perks = {}) => { const M = AU_MODES[mode]; return !!M && (!M.perkOpen || !!perks[M.perkOpen]); };
// 出品料（競りは 開始値・フリマは 出品値）と 売れた ときの 手数料
export const feeOf = (mode, price) => { const M = AU_MODES[mode]; return Math.max(M.feeMin, Math.ceil(price * M.fee)); };
export const cutOf = (mode, amt) => Math.floor(amt * AU_MODES[mode].cut);
// 次に 入れられる いちばん 低い 値（入札が なければ 開始値・あれば 5% 上。少なくとも ＋1）
export const minBid = (L) => (L.bid ? Math.max(L.bid.amt + 1, Math.ceil(L.bid.amt * (1 + AU_STEP))) : L.start);

// 品の 形：{ k: "mat", id, q, n } ・{ k: "sphere", op, star, did } ・{ k: "equip", base, star, ops, opStar?, fx?, mk? } ・{ k: "sample", id, star, known }
export const isGear = (it) => !!it && it.k === "equip";
export const gearSlot = (base) => ((baseOf(base) || {}).slot === "weapon" ? "weapon" : "armor");
// その 場に 出せる 品か（出せなければ 理由）
export function itemWhy(mode, it) {
  const M = AU_MODES[mode];
  if (!M || !it) return "品を えらんで";
  if (M.bid) return ["mat", "sphere", "equip", "sample"].includes(it.k) ? null : "出せない 品";
  if (it.k !== "equip") return "フリマに 出せるのは 装備だけ";
  if (gearSlot(it.base) !== M.slot) return M.slot === "weapon" ? "アンビルの フリマは 武器だけ" : "ピーコの フリマは 防具だけ";
  if (!it.mk) return "フリマに 出せるのは 自分で 作った 装備だけ（開発・合成）";
  return null;
}

// リサイクルした ときの 素材の ねうち（平均。リサイクルは その 行き先の 素材を ★の 数・★4 から かくれた 素材も 1 こ）
export function scrapValue(it) {
  const r = recycleOf(it), g = GATHER[r.did]; if (!g) return 0;
  const avg = g.mats.reduce((a, [id]) => a + sellPrice({ id, q: 0 }), 0) / g.mats.length;
  return avg * r.n + (r.hidden ? sellPrice({ id: g.hidden[0], q: 0 }) : 0);
}
export const takePrice = (it) => Math.floor(scrapValue(it) * AU_TAKE);
// 自動リサイクル：リサイクルの 素材を 1 こずつ 5 割で のこす（R は 0〜1 の くじ）
export function halfScrap(it, R) {
  const r = recycleOf(it), g = GATHER[r.did], got = new Map(); if (!g) return [];
  const add = (id) => got.set(id, (got.get(id) || 0) + 1);
  for (let i = 0; i < r.n; i++) { const id = g.mats[Math.floor(R() * g.mats.length)][0]; if (R() < AU_SCRAP) add(id); }
  if (r.hidden && R() < AU_SCRAP) add(g.hidden[0]);
  return [...got].map(([id, n]) => ({ id, q: 0, n, ...(it.b ? { b: 1 } : {}) }));
}
// 出品の 期限が 来た／取り下げた ときに えらべる こと（装備は 引き取り か リサイクル。ほかは もどる）
export const endHows = (it) => (isGear(it) ? ["take", "scrap"] : ["back"]);
