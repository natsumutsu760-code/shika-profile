// 大工事の あいだの ロック（鹿さんの決め、2026-10-28）：ラウンジ（部屋・ショップ・両替）の ほかの ゲームは 止める
// デバッグを して くれる おたこまるさんと 鹿さんだけ 通す。表示名は だれでも 同じに できるので Twitch の ユーザー ID で 見る
// 見本（lounge-demo.js）と 試験は env.LOCK_OFF で 止めない。工事が おわったら LOCK を false に
export const LOCK = false;   // 2026-11-05 鹿さん「先に全プレイヤーにペットコンテンツを解禁してください。」で とく（前は true）
export const LOCK_PASS = new Set(["420214272", "1140507103"]);   // おたこまる・鹿さん（配信者。門番の gate.owner と 同じ）
const OPEN = /^(room\.|shop\.|money\.)/;            // 止めない やること
export const LOCK_WHY = "工事中（MONO LINK の 大工事の あいだは、ラウンジの 部屋と ショップだけ 使えます）";
// 新しい ペットと 農園は、大工事の ロックが とけても みんなに 開くまで 2 人だけ（鹿さんの 決め 2026-11-03。docs/mono-link-release-plan.md）
// PET_OPEN を true に すると みんなに 開く（新ペットの 公開。その 前に パチンコの 景品を シーズンラインナップに そろえる）
export const PET_OPEN = true;   // 2026-11-05 みんなに 開いた（同じ 頼み）
export const PET_WHY = "準備中（新しい ペットと 農園は、公開まで もう 少し お待ちください。ラウンジの 部屋と ショップは 使えます）";
// ボーダーゾーン（2026-11-05 作りはじめ）：BZ_OPEN を false に すると 2 人だけ（見本と 試験は env.LOCK_OFF で 止めない）
// みんなに 開く：鹿さんの カード（2026-11-05）「1。島3も反映お願いします。クローラーとボーダーゾーンも。」（そのときは 遊ぶ 部分が まだ なかった）
export const BZ_OPEN = true;
export const BZ_WHY = "準備中（ボーダーゾーンは、公開まで もう 少し お待ちください）";
// 株（トークン。2026-11-05 作りはじめ）：STOCK_OPEN を true に すると みんなに 開く（公開は 鹿さんの カード）。売り上げを 数えるのは 前から みんな
// みんなに 開く：鹿さんの カード（2026-11-06）「出す・みんなに公開」
export const STOCK_OPEN = true;
export const STOCK_WHY = "準備中（トークンは、公開まで もう 少し お待ちください）";
export const stockLocked = (rec, env) => !STOCK_OPEN && !(env && env.LOCK_OFF) && !LOCK_PASS.has(String(rec.id));
export const bzLocked = (rec, env) => !BZ_OPEN && !(env && env.LOCK_OFF) && !LOCK_PASS.has(String(rec.id));
export const locked = (rec, env) => (LOCK || !PET_OPEN) && !(env && env.LOCK_OFF) && !LOCK_PASS.has(String(rec.id));
export const lockKind = () => (LOCK ? "build" : "pet");   // 画面の 文の えらび（工事中 ／ 準備中）
export const lockWhy = () => (LOCK ? LOCK_WHY : PET_WHY);
export const lockedAct = (rec, a, env) => locked(rec, env) && !OPEN.test(String(a));
