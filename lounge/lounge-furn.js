// 部屋の 家具の 効果（2026-11-11。表と となりの 計算は ./furn-fx.js）。門番の あちこちが ここを 読む
// rec.room.items（部屋の 置き方）から いま はたらいて いる 効果の 合計を かえす。{ smelt: 0.05, crop: 0.03, ... }
import { furnFx } from "./furn-fx.js";
import { F } from "./lounge-rules.js";
const sizeOf = (id) => { const f = F(id); return f ? f.size : [1, 1]; };
export const roomFxAll = (rec) => furnFx(rec && rec.room && rec.room.items, sizeOf);
export const roomFx = (rec) => roomFxAll(rec).fx;
export const fxOf = (rec, k) => roomFx(rec)[k] || 0;
