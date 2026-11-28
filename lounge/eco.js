// リサイクルと エコポイント（2026-11-27 鹿さんの カード。docs/mono-link-border-zone.md「完成に 向けて」）
// - リサイクル：ボーダーゾーンの 素材と クローラーの スクラップ（どこにも 使えない 物）を 1 こ ＝ その 素材の 値段の ポイントに（焦げた土 6・CPUチップ 55）
// - 交換：封鎖された 所の キーカード・クレートの カードキー 1 枚 1,000 ポイント（鹿さんの 答え「1000」）・他の 島の 素材 1 こ ＝ 値段の 2 倍の ポイント
// - プライベートラウンジの 引越しに アメジストの 代わりに 使える（鹿さんの 言葉。引越しは move.js〈これから〉）
// 〔C〕他の 島の 素材は 採取の 素材（品質 0）。鉱石と 延べ棒は 坑道と DRN だけ（2026-10-31 の 決め）なので 入れない。リサイクルは 品質の 低い 物から
import { BORDER_MAT, SCRAP_MAT, VALUE, GATHER, ORE_MAT } from "./materials.js";
import { DUNGEONS_ALL, ISLAND_OPEN } from "./dungeons.js";

export const ECO = { key: 1000, buy: 2, max: 999 };   // max：1 回に 交換・リサイクルする 数の 上限（1 しゅるい）
export const recyclable = (id) => typeof id === "string" && (BORDER_MAT.has(id) || SCRAP_MAT.has(id));
export const ecoOf = (id) => (recyclable(id) ? VALUE[id] || 0 : 0);
export const ECO_KEYS = { key_bz: "封鎖された 所の キーカード", key_crate: "クレートの カードキー" };
// 島ごとの 採取の 素材（出て いる 島だけ・かくれた 行き先は のぞく）
export const ECO_ISLES = {};
for (const d of DUNGEONS_ALL) {
  if (d.hidden || (d.isle || 1) > ISLAND_OPEN) continue;
  const L = (ECO_ISLES[d.isle || 1] ||= []);
  for (const [id] of (GATHER[d.id] || {}).mats || []) if (!ORE_MAT.has(id) && id !== "ironore" && !L.includes(id) && VALUE[id] > 0) L.push(id);
}
export const ECO_BUY = new Set(Object.values(ECO_ISLES).flat());
export const ecoBuyPrice = (id) => (ECO_BUY.has(id) ? VALUE[id] * ECO.buy : 0);
