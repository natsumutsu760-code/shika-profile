// 大工事の あいだの ロック（鹿さんの決め、2026-10-28）：ラウンジ（部屋・ショップ・両替）の ほかの ゲームは 止める
// デバッグを して くれる おたこまるさんだけ 通す。表示名は だれでも 同じに できるので Twitch の ユーザー ID で 見る
// 見本（lounge-demo.js）と 試験は env.LOCK_OFF で 止めない。工事が おわったら LOCK を false に
export const LOCK = true;
export const LOCK_PASS = new Set(["420214272"]);   // おたこまる
const OPEN = /^(room\.|shop\.|money\.)/;            // 止めない やること
export const LOCK_WHY = "工事中（MONO LINK の 大工事の あいだは、ラウンジの 部屋と ショップだけ 使えます）";
export const locked = (rec, env) => LOCK && !(env && env.LOCK_OFF) && !LOCK_PASS.has(String(rec.id));
export const lockedAct = (rec, a, env) => locked(rec, env) && !OPEN.test(String(a));
