// ペットの技とタイプのデータ（試作 3）。設計メモの表・バトルの計算・画面の見本は、みんなここから読む
// kind：waza（技・ATK で強さが決まり、相手の DEF で受ける）、itazura（イタズラ・INT で強さが決まり、相手の RES で受ける）、passive（パッシブ・いつも効く）
// slot：職業ツリーでの場所（S1〜S8 は技 ①〜⑧、P1〜P7 はパッシブ ①〜⑦）。どのノードに入るかは trees.js
// fx（技の効果）と p（パッシブの効果）は battle-sim.js が読む。バフ・デバフ（状態）の中身は effects.js。数字はすべて仮
//   dmg：ダメージ（pow 威力・hits 回数・stat 強さを決めるステータス・ignore 相手の守りを無視する割合・sure かならず当たる・recoil 反動・execute 相手の HP がこれ以下なら 2 倍
//        perDebuff 相手のデバフ 1 つにつき威力が増える・clear 当たったら相手のデバフを全部消す・consume その状態をはじけさせる（perAmt 量 1 につき・perTurn 残りターン 1 につき威力が増える））
//   fx：状態を付ける（id・amt 量・turns ターン・who me か foe・chance 確率・atLeast {id, n} 相手のその状態の量が n 以上のときだけ・ifConsumed はじけさせた量が n 以上のときだけ）
//   shield：最大 HP の pct のシールド
//   heal（最大 HP の pct を回復）・cure（自分のデバフを全部消す＝浄化）・dispel（相手のバフを n こ消す）・mp（MP を n 回復）・slow（次の番は後から動く）・pin（おさえこみ）
import { BITEMS } from "./battle-items.js";
import { ENEMY_TREES, setComboSkills } from "./enemy-trees.js";
import { MAIN_TREES, MAIN_TREE_LIST } from "./main-trees.js";

// 役割（敵の ツリーの type。色と ラベルに 使う）と、メインの ツリー 12 本（ペットの type）
export const ROLES = {
  attacker: { label: "アタッカー", role: "技で大きなダメージ", color: "#FF5A64", grow: ["atk", "dex"] },
  caster: { label: "キャスター", role: "イタズラで攻める", color: "#8E6CFF", grow: ["int", "mp"] },
  technician: { label: "テクニシャン", role: "状態異常を重ねて、はじけさせる", color: "#FFC21A", grow: ["agi", "dex", "luk"] },
  healer: { label: "ヒーラー", role: "回復と強化", color: "#22CC88", grow: ["int", "res", "mp"] },
  defender: { label: "ディフェンダー", role: "守る・耐える・反撃", color: "#2EA8FF", grow: ["hp", "def", "res"] },
};
export const TYPES = { ...ROLES, ...Object.fromEntries(Object.entries(MAIN_TREES).map(([id, t]) => [id, { label: t.name, role: t.role, color: t.color, grow: [t.main, t.sub], tree: true }])) };
export const TREE_IDS = Object.keys(MAIN_TREES);   // ペットが えらべる ツリー（どの キャラでも どの ツリーでも。鹿さんの 決め）

// どのタイプでもいつでも使える
export const COMMON = {
  kogeki: { name: "こうげき", kind: "waza", mp: 0, text: "威力 8。強さは ATK・INT・DEX のいちばん高いもので決まる", fx: [{ t: "dmg", pow: 8, stat: "best" }] },
  bougyo: { name: "ぼうぎょ", kind: "waza", mp: 0, text: "防御（次の番まで、受けるダメージ半分。継続ダメージも）、MP +2", fx: [{ t: "fx", id: "guard", who: "me" }, { t: "mp", n: 2 }] },
};

// メインの スキルツリー 12 本（鹿さんの 決め、2026-10-30・31。中身は main-trees.js）。いまの 5 本（アタッカー〜ディフェンダー）の 技は 使わない（作りなおし）
export const TREES = MAIN_TREE_LIST;

// id → 技（タイプも付ける）。敵ツリーの技は、その敵のタイプ（色に使う）と tree（どのツリーか）を付ける
// 複合ツリー（cx:種+種）の 技・パッシブ（id は ツリーの id ＋「:s1」など）は、ツリーを 組み立てる ときに ここへ 入る。まだ なければ ツリーを さわって 組み立てる
const cxTree = (k) => (typeof k === "string" && k.startsWith("cx:") && k.lastIndexOf(":") > 2 ? k.slice(0, k.lastIndexOf(":")) : null);
const SKILL0 = Object.fromEntries([
  ...Object.entries(COMMON).map(([id, s]) => [id, { id, ...s, type: null }]),
  ...Object.entries(BITEMS).map(([id, s]) => [id, { id, ...s, type: null, item: true }]),   // 戦いの アイテム（ガンビットで 使う。袋に ある ときだけ）
  ...Object.entries(TREES).flatMap(([type, list]) => list.map((s) => [s.id, { ...s, type, tree: type }])),
  ...Object.entries(ENEMY_TREES).flatMap(([tree, t]) => t.list.map((s) => [s.id, { ...s, type: t.type, tree }])),
]);
setComboSkills(SKILL0);
export const SKILL = new Proxy(SKILL0, {
  get: (t, k) => { const v = t[k]; if (v !== undefined) return v; const tr = cxTree(k); if (tr) ENEMY_TREES[tr]; return tr ? t[k] : v; },
  has: (t, k) => k in t || (!!cxTree(k) && (ENEMY_TREES[cxTree(k)], k in t)),
  getOwnPropertyDescriptor: (t, k) => { if (!(k in t) && cxTree(k)) ENEMY_TREES[cxTree(k)]; return Reflect.getOwnPropertyDescriptor(t, k); },
});
