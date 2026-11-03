// 戦いで 使う アイテム（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md の 5・7 回目の カード）
// 爆弾（ふつう・炎上・凍傷・毒 × 小・中・大。固定ダメージ）・回復薬・MP の 薬・バフの 薬（力・守り・速さ）
// 使う 時は ガンビットの 行で 決める（自分では 使わない）。派遣に 出る ときに 持って いる 物を ぜんぶ 袋に 入れて 持って いき、使わなかった 物は 帰りに もどる。闘技場では 使わない
// 技と 同じ 形（skills.js の SKILL に type null ＋ item で 入る。どの 子でも ガンビットに 書ける）。袋に ある ときだけ 使える（battle-sim.js の usable）
// 数と レシピは Claude の 案（工房の「道具・品は 1 こに 素材 10 こ 以上」の 決まりに そろえた）
// 1 回の 派遣で 使える のは ぜんぶで 5 こ まで（鹿さんの 決め、2026-10-31。持って いく のは ぜんぶ。クローラーの 持ちこみ 5 こと そろえた）
export const BAG_USE_MAX = 5;
export const BOMB_SIZE = { s: { label: "小", en: "S", dmg: 15, lv: 1, credits: 60 }, m: { label: "中", en: "M", dmg: 35, lv: 2, credits: 200 }, l: { label: "大", en: "L", dmg: 70, lv: 4, credits: 500 } };
const SIZE_I = { s: 0, m: 1, l: 2 };
// fx：付ける 状態異常（量は 小・中・大。敵の 技と 同じ くらい）。mat：その 状態異常の 敵の 素材（エンチャントと 同じ）
export const BOMB_KIND = {
  plain: { label: "爆弾", en: "Bomb", fxEn: "", fx: null, mat: "pebble" },
  burn: { label: "炎上爆弾", en: "Fire Bomb", fxEn: "Burn", fx: "burn", amt: [3, 4, 5], mat: "light_drop" },
  frost: { label: "凍傷爆弾", en: "Frost Bomb", fxEn: "Frostbite", fx: "frostbite", amt: [3, 4, 5], mat: "crystal_scale" },
  poison: { label: "毒爆弾", en: "Poison Bomb", fxEn: "Poison", fx: "poison", amt: [5, 7, 10], mat: "poison_vial" },
};
const BOMB_BASE = { s: [["coal", 4], ["herb", 4]], m: [["coal", 6], ["healherb", 4]], l: [["coal", 8], ["sannin", 4]] };   // 石炭 ＋ 薬の 作物（カードの 案）
const BOMB_ADD = { s: 2, m: 3, l: 4 };   // 状態異常の 素材（ふつうの 爆弾は きれいな小石）

const bombs = Object.entries(BOMB_KIND).flatMap(([k, K]) => Object.entries(BOMB_SIZE).map(([sz, Z]) => {
  const fx = [{ t: "fixed", n: Z.dmg }, ...(K.fx ? [{ t: "fx", id: K.fx, who: "foe", amt: K.amt[SIZE_I[sz]] }] : [])];
  return [`bomb_${k}_${sz}`, { name: `${K.label}（${Z.label}）`, kind: "item", group: "爆弾", mp: 0, fx, text: `${Z.dmg} の ダメージ（守りで へらない・よけられない）${K.fx ? `＋ ${K.label.replace("爆弾", "")}` : ""}`,
    en: [`${K.en} (${Z.en})`, `${Z.dmg} damage (ignores defense, can't be dodged)${K.fxEn ? ` + ${K.fxEn}` : ""}`],
    recipe: { lv: Z.lv, credits: Z.credits, mats: [...BOMB_BASE[sz], [K.mat, BOMB_ADD[sz]]], farm: sz !== "s" } }];
}));
const POT_EN = {"pot_hp": ["Healing Potion", "Restore 25% HP"], "pot_hp2": ["Strong Healing Potion", "Restore 40% HP"], "pot_mp": ["MP Potion", "MP +6"], "pot_mp2": ["Strong MP Potion", "MP +12"], "pot_atk": ["Power Potion", "ATK & INT +20% (3 turns)"], "pot_def": ["Guard Potion", "DEF & RES +20% (3 turns)"], "pot_agi": ["Speed Potion", "AGI +20% (3 turns)"]};
const potions = [
  ["pot_hp", "回復薬", "HP を 25% 回復", [{ t: "heal", pct: 0.25 }], { lv: 1, credits: 60, mats: [["herb", 6], ["berry", 4]] }],
  ["pot_hp2", "上の 回復薬", "HP を 40% 回復", [{ t: "heal", pct: 0.4 }], { lv: 2, credits: 200, mats: [["healherb", 6], ["herb", 4]], farm: true }],
  ["pot_mp", "MP の 薬", "MP ＋6", [{ t: "mp", n: 6 }], { lv: 1, credits: 60, mats: [["sleepmoss", 6], ["herb", 4]] }],
  ["pot_mp2", "上の MP の 薬", "MP ＋12", [{ t: "mp", n: 12 }], { lv: 2, credits: 200, mats: [["moonshroom", 6], ["inn_wheat", 4]], farm: true }],
  ["pot_atk", "力の 薬", "ATK・INT ＋20%（3 ターン）", [{ t: "fx", id: "up_atk", who: "me", amt: 20, turns: 3 }, { t: "fx", id: "up_int", who: "me", amt: 20, turns: 3 }], { lv: 2, credits: 200, mats: [["nectarbean", 6], ["herb", 4]], farm: true }],
  ["pot_def", "守りの 薬", "DEF・RES ＋20%（3 ターン）", [{ t: "fx", id: "up_def", who: "me", amt: 20, turns: 3 }, { t: "fx", id: "up_res", who: "me", amt: 20, turns: 3 }], { lv: 2, credits: 200, mats: [["kaido_wheat", 6], ["herb", 4]], farm: true }],
  ["pot_agi", "速さの 薬", "AGI ＋20%（3 ターン）", [{ t: "fx", id: "up_agi", who: "me", amt: 20, turns: 3 }], { lv: 2, credits: 200, mats: [["wakebean", 6], ["herb", 4]], farm: true }],
].map(([id, name, text, fx, recipe]) => [id, { name, kind: "item", group: "戦いの 薬", mp: 0, fx, text, recipe, en: POT_EN[id] }]);

export const BITEMS = Object.fromEntries([...bombs, ...potions]);
export const isBItem = (id) => Object.prototype.hasOwnProperty.call(BITEMS, id);
// 工房の レシピ（workshop.js の WS_ITEMS に 足す）
export const BITEM_NOTE = (b) => `戦いの アイテム：${b.text}（ガンビットで 使う 時を 決める）`, BITEM_NOTE_EN = (b) => `Battle item: ${b.en[1]} (set when to use it in Gambits)`;
export const BITEM_RECIPES = Object.entries(BITEMS).map(([id, b]) => ({ id, name: b.name, note: BITEM_NOTE(b), lv: b.recipe.lv, to: { items: { [id]: 1 } }, mats: b.recipe.mats, credits: b.recipe.credits, group: b.group, ...(b.recipe.farm ? { farm: true } : {}) }));
// 派遣の 袋：持って いる 物 ぜんぶ（{ id: 数 }。なければ null）
export const bagOf = (items) => { const out = {}; for (const id of Object.keys(BITEMS)) if ((items || {})[id] > 0) out[id] = items[id]; return Object.keys(out).length ? out : null; };
