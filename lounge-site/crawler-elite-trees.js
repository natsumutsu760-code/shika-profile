// 精鋭の 解析ツリー 32 本（戦いで 使う 形）。クローラーだけが 読みこむ（門番・派遣・配合には 入れない）
// 中身の 文は 資料 docs/mono-link-crawler-elite-skills.md の「解析で 手に 入る ツリー」（crawler-analysis-data.js）。fx は crawler-elite-trees-{a,b,c}.js
// 読みこむと 敵の ツリーと 同じ 入れ物（ENEMY_TREES・SKILL）に 入るので、いまの サブツリーの 決まり（petAt の subs）で 付けられる
import { ENEMY_TREES } from "./enemy-trees.js";
import { SKILL } from "./skills.js";
import { TREES as A } from "./crawler-elite-trees-a.js";
import { TREES as B } from "./crawler-elite-trees-b.js";
import { TREES as C } from "./crawler-elite-trees-c.js";

export const ELITE_TREES = { ...A, ...B, ...C };
for (const [tree, t] of Object.entries(ELITE_TREES)) {
  ENEMY_TREES[tree] ??= t;
  for (const s of t.list) SKILL[s.id] ??= { ...s, type: t.type, tree };
}
// 精鋭の 名前（ONE SHOE など）→ ツリーの id
export const eliteTreeOf = (name) => Object.keys(ELITE_TREES).find((k) => ELITE_TREES[k].enemy === name) ?? null;
