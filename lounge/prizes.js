// パチンコの 景品（シーズンラインナップ。鹿さんの 決め 2026-11-03。docs/mono-link-release-plan.md の「景品の 交換の 場所」）
// 払うのは 持ち玉（鹿物語の 玉。ラウンジの 帳簿で 引く）。ボタンで 買えるのは MONO LINK の ショップと サイト（どちらも 門番の prize.*）
// - いつも 並ぶ 枠（入れ替わらない）：鍵 6 しゅ と 謎のお菓子（カードの 決め：区画の 鍵も いま 入れる）
// - 6 時間ごとに 入れ替わる 枠（日本時間の 0・6・12・18 時。オーバーレイの お店と 同じ 時計）：コスメ 5 品（オーバーレイが 決める・!購入 と 同じ 品）＋ 家具 2 品（ここで 決める）
// 鍵は クローラー・ボーダーゾーンが 開いたら 使う（いまは 持って おくだけ）。持ち物は rec.items[id]（謎のお菓子は rec.items.mystery）
import { FURN } from "./lounge-rules.js";

export const PRIZE_SLOT_MS = 6 * 3600e3;
const JST = 9 * 3600e3;
export const prizeSlot = (now = Date.now()) => Math.floor((now + JST) / PRIZE_SLOT_MS);
export const slotUntil = (slot) => (slot + 1) * PRIZE_SLOT_MS - JST;

// いつも 並ぶ 枠。値段は 資料の 決め（キーカード・クレートの カードキー 3,000・謎のお菓子 10,000）と、区画の 鍵は Claude の 仮（資料は 5,000〜50,000。クローラーを 作る ときに 直す）
// c：鍵の 色（クローラーの 地図の KEYS と 同じ）
export const PRIZE_ALWAYS = [
  { id: "key_bz", name: "ボーダーゾーンの キーカード", price: 3000, c: "#2EA8FF", note: "封鎖された 所に 入る（使うと なくなる）" },
  { id: "key_crate", name: "クレートの カードキー", price: 3000, c: "#FF8A3D", note: "クローラーの 施錠された クレートを 開ける" },
  { id: "key_shortcut", name: "近道の 鍵", price: 5000, c: "#57D17A", note: "クローラーの 近道の 区画に 入る" },
  { id: "key_research", name: "研究区画の 鍵", price: 15000, c: "#C35BD8", note: "クローラーの 企業の 秘密の 研究区画に 入る" },
  { id: "key_sphere", name: "スフィアの 鍵", price: 25000, c: "#5FE3F0", note: "クローラーの 高価値スフィアの 区画に 入る" },
  { id: "key_vault", name: "宝物庫の 鍵", price: 50000, c: "#E3B341", note: "クローラーの 宝物庫に 入る" },
  { id: "mystery", name: "謎のお菓子", price: 10000, note: "詳細ステータスが キャップに 届いた とき、上限を 突破する" },
];
export const prizeOf = (id) => PRIZE_ALWAYS.find((p) => p.id === id) || null;
export const isKey = (id) => /^key_/.test(id);

// 入れ替わる 家具：★ごとの 値段（資料の 1,000〜5,000 玉を ★で 割りふる。カードの 決め）。★の 低い 物（★1〜2）と 高い 物（★3〜5）を 1 つずつ
export const FURN_PRICE = { 1: 1000, 2: 1500, 3: 2500, 4: 3500, 5: 5000 };
const LOW = FURN.filter((f) => f.star >= 1 && f.star <= 2), HIGH = FURN.filter((f) => f.star >= 3);
function rnd(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function furnLineup(slot) {
  const R = rnd(slot * 2654435761 + 97);
  return [LOW[Math.floor(R() * LOW.length)], HIGH[Math.floor(R() * HIGH.length)]].map((f) => ({ id: f.id, star: f.star, price: FURN_PRICE[f.star] }));
}
