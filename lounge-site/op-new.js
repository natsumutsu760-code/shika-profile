// 新しい OP（大工事。鹿さんと カードで 決めた、2026-10-29。数は すべて 案）
// 今の OP（equip.js の OPS）には まだ 入れない（今の 装備の くじに 混ざると、戦いの 計算が ない OP が 付く）。スフィアの 表（sphere.js）だけが 使う
// ・どれも「少し 上がる・下がる」だけ。無効や、特定の ビルドを 完封する 効果は 作らない（CLAUDE.md の 戦いの つりあい）
// ・v は ★1〜5 の 強さ。from は 付きはじめる ★。unique（ユニーク OP）は ★に よらず 同じ 効果で、★4 から 出る（％の 振れ幅を 付けられない 物。鹿さんの決め）
// ・ISLAND_OPS：島の 名物。その 島の スフィアと 素材の 抽選で しか 出ない（島が ふえる たびに 2〜3 つ 足す。鹿さんの決め）
import { OPS } from "./equip.js";
import { NEW_OPS } from "./op-defs.js";   // 表は op-defs.js（2026-11-04 に 分けた）
export { NEW_OPS };

export const ALL_OPS = { ...OPS, ...NEW_OPS };
// 島の 名物（その 島で しか 出ない）
export const ISLAND_OPS = { 1: ["firstHitOp", "regenOp", "crackOp"], 2: ["thornsOp", "ironThorns", "hpCast"], 3: ["mirageOp", "oasisOp", "sandClock"] };
export const islandOf = (op) => Number(Object.keys(ISLAND_OPS).find((i) => ISLAND_OPS[i].includes(op)) || 0);
// その ★で 出せるか（とくべつな OP は from から、ユニーク OP は ★4 から）
export const opAt = (op, star) => star >= (ALL_OPS[op].unique ? 4 : ALL_OPS[op].from || 1);
