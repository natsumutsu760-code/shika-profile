// 工房（鹿さんの頼み、2026-10-25）：素材から 道具・スプリンクラーと、武器の アタッチメントを 作る。数は すべて 案
// スタック数（1 しゅるい 50〜400）を 増やした ぶん、素材を たくさん 使う（1 回 20〜30 こ）
// 支払いは 素材 ＋ クレジット（玉・アメジストは 使わない）。工房の Lv で 作れる 物と アタッチメントの ★が かわる
import { OPS } from "./equip.js";
import { farmOpen } from "./crops.js";
import { detailOpen } from "./nutrition.js";   // 詳細ステータス（デトックス茶）
import { BITEM_RECIPES } from "./battle-items.js";   // 戦いの アイテム（爆弾・薬）

// ---------- 道具・品（数を えらんで まとめて 作れる） ----------
// to：もらう 物（tools は 派遣に 持っていく 道具、items は 品）。lv：工房の 段（Lv1・20・50・80 で 1〜4。施設の 作り直し、2026-11-03。前は 工房の Lv1〜4）
export const WS_ITEMS = [
  { id: "lure", name: "おとりの笛", note: "派遣の 道具：えらんだ 敵と 出会いやすい", lv: 1, to: { tools: { lure: 1 } }, mats: [["straw", 8], ["oldnail", 4], ["hare_horn", 1]], credits: 80 },
  { id: "net", name: "捕獲ネット", note: "派遣の 道具：捕まえる 確率 2 倍", lv: 1, to: { tools: { net: 1 } }, mats: [["oldcloth", 8], ["straw", 12], ["kobold_fur", 2]], credits: 200 },
  { id: "sprinkler", name: "スプリンクラー", note: "畑に 置くと まわりの 作物の 品質が 上がる", lv: 1, to: { items: { sprinkler: 1 } }, mats: [["oldnail", 12], ["pebble", 15], ["wellwater", 8]], credits: 300 },
  { id: "tea", name: "元気のお茶", note: "派遣の 道具：力つきても 1 回だけ 全回復", lv: 2, to: { tools: { tea: 1 } }, mats: [["herb", 5]], credits: 1500 },   // 薬草 5（鹿さんの 決め、2026-10-31。前は 薬草 20・夜咲き草 10・地底の水 10・夢見の羽）
  { id: "sprinkler2", name: "上の スプリンクラー", note: "品質が もっと 上がる・とどく 広さも 広い", lv: 2, to: { items: { sprinkler2: 1 } }, mats: [["ironore", 15], ["oldnail", 20], ["deepwater", 10]], credits: 900 },
  { id: "sprinkler3", name: "星の スプリンクラー", note: "いちばん 品質が 上がる", lv: 3, to: { items: { sprinkler3: 1 } }, mats: [["crystalbit", 20], ["glowstone", 15], ["rainbow_shell", 1, 3]], credits: 3000 },
  { id: "blankcore", name: "ブランクコア", note: "装備から OP を 1 つ 抜き出す（抜いた 装備は なくなる。コアは 別の 装備に 付ける）", lv: 2, to: { items: { blankcore: 1 } }, mats: [["crystalbit", 8], ["glowstone", 8], ["slime_core", 1, 2]], credits: 1500 },   // 鹿さんの決め、2026-10-25
  // 畑と 坑道で 使う 物（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md。数は Claude の 案）：肥料（1 回で 4 こ）・つるはし・ランプ
  { id: "fert", name: "肥料", note: "畑：植える ときに まくと 育つ 時間 −30%（1 マス 1 こ）", lv: 1, to: { items: { fert: 4 } }, mats: [["straw", 8], ["sleepmoss", 2]], credits: 100 },
  { id: "fert2", name: "上の 肥料", note: "畑：育つ 時間 −30%・品質も スプリンクラー 1 段ぶん 上がる", lv: 2, to: { items: { fert2: 4 } }, mats: [["salt_hay", 4], ["wellcap", 4], ["deep_mushroom", 2]], credits: 300, farm: true },
  // デトックス茶（鹿さんの 決め、2026-10-31）：詳細ステータスを リセット（キャップに 届く 前だけ。届いたら 謎のお菓子で 上限突破）
  { id: "detox", name: "デトックス茶", note: "ペット・なかま：詳細ステータスを リセット（キャップに 届く 前だけ）", lv: 1, to: { items: { detox: 1 } }, mats: [["shadow_mugwort", 2], ["inn_wheat", 2]], credits: 200, farm: true, detail: true },
  { id: "pickaxe", name: "つるはし", note: "坑道：使うと 12 時間、掘る 数 ×1.3", lv: 1, to: { items: { pickaxe: 1 } }, mats: [["iron_bar", 2], ["oldnail", 6], ["brick", 4]], credits: 200 },
  // 足場（鹿さんの 決め、2026-10-31：施設の 建設に 待ち時間が 入ったら 作る。2026-11-05 に 入れた。数は Claude の 案：素材 10 こ・2 時間）
  { id: "scaffold", name: "足場", note: "施設：建てて いる 途中に 使うと 建設が 2 時間 進む", lv: 1, to: { items: { scaffold: 1 } }, mats: [["bamboo_lumber", 4], ["straw_bundle", 6]], credits: 50, farm: true },
  { id: "lamp", name: "ランプ", note: "坑道：使うと 12 時間、銀鉱石と 金鉱石が 2 倍 出やすい", lv: 1, to: { items: { lamp: 1 } }, mats: [["copper_bar", 2], ["candle", 6], ["glowstone", 2]], credits: 300 },
  // 薬・エンチャント・お守り（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md）。島 1 で ぜんぶ 作れ、島 2（工房 Lv4）で 上の 版。farm：作物が いる（大工事の 畑が つながってから）
  { id: "tea_heal", name: "元気のお茶（癒し草）", note: "派遣の 道具：力つきても 1 回だけ 全回復", lv: 2, to: { tools: { tea: 1 } }, mats: [["healherb", 3]], credits: 1500, farm: true },
  { id: "cure", name: "気つけ薬", note: "派遣の 道具：1 回だけ 状態異常を 防ぐ", lv: 2, to: { tools: { cure: 1 } }, mats: [["herb", 2], ["healherb", 2]], credits: 300, farm: true },
  { id: "cure2", name: "上の 気つけ薬", note: "派遣の 道具：1 回 防ぐ ＋ 状態異常に 強い ＋10%", lv: 4, to: { tools: { cure2: 1 } }, mats: [["sannin", 2], ["herb", 2]], credits: 900, farm: true },
  { id: "revive", name: "起こし薬", note: "派遣の 道具：倒れた 子が 1 回 HP 3 割で 起きる", lv: 2, to: { tools: { revive: 1 } }, mats: [["shadow_mugwort", 2], ["healherb", 2]], credits: 400, farm: true },
  { id: "revive2", name: "上の 起こし薬", note: "派遣の 道具：倒れた 子が 1 回 HP 5 割で 起きる", lv: 4, to: { tools: { revive2: 1 } }, mats: [["ryugu_ginger", 2], ["shadow_mugwort", 1]], credits: 1200, farm: true },
  { id: "incense", name: "はじまりの香", note: "派遣の 道具：さいしょの 戦いの はじめに 再生", lv: 1, to: { tools: { incense: 1 } }, mats: [["healherb", 1], ["sleepmoss", 2]], credits: 200, farm: true },
  { id: "incense2", name: "上の はじまりの香", note: "派遣の 道具：さいしょの 戦いの はじめに 強い 再生", lv: 4, to: { tools: { incense2: 1 } }, mats: [["sannin", 1], ["ryugu_ginger", 1]], credits: 700, farm: true },
  { id: "ench_burn", name: "炎上の エンチャント", note: "派遣の 道具：当たると 5% で 炎上", lv: 2, to: { tools: { ench_burn: 1 } }, mats: [["herb", 4], ["light_drop", 1]], credits: 300 },
  { id: "ench_frost", name: "凍傷の エンチャント", note: "派遣の 道具：当たると 5% で 凍傷", lv: 2, to: { tools: { ench_frost: 1 } }, mats: [["herb", 4], ["crystal_scale", 1]], credits: 300 },
  { id: "ench_poison", name: "毒の エンチャント", note: "派遣の 道具：当たると 5% で 毒", lv: 2, to: { tools: { ench_poison: 1 } }, mats: [["herb", 4], ["poison_vial", 1]], credits: 300 },
  { id: "ench_sick", name: "体調不良の エンチャント", note: "派遣の 道具：当たると 5% で 体調不良", lv: 2, to: { tools: { ench_sick: 1 } }, mats: [["herb", 4], ["ghost_cloth", 1]], credits: 300 },
  { id: "charm_sleep", name: "眠りよけの お守り", note: "派遣の 道具：眠りに かかりにくい", lv: 2, to: { tools: { charm_sleep: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["dream_feather", 1]], credits: 300, farm: true },
  { id: "charm_poison", name: "毒よけの お守り", note: "派遣の 道具：毒に かかりにくい", lv: 2, to: { tools: { charm_poison: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["poison_vial", 1]], credits: 300, farm: true },
  { id: "charm_burn", name: "炎上よけの お守り", note: "派遣の 道具：炎上に かかりにくい", lv: 2, to: { tools: { charm_burn: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["light_drop", 1]], credits: 300, farm: true },
  { id: "charm_frost", name: "凍傷よけの お守り", note: "派遣の 道具：凍傷に かかりにくい", lv: 2, to: { tools: { charm_frost: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["crystal_scale", 1]], credits: 300, farm: true },
  { id: "charm_para", name: "麻痺よけの お守り", note: "派遣の 道具：麻痺に かかりにくい", lv: 2, to: { tools: { charm_para: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["bat_wing", 1]], credits: 300, farm: true },
  { id: "charm_stun", name: "気絶よけの お守り", note: "派遣の 道具：気絶に かかりにくい", lv: 2, to: { tools: { charm_stun: 1 } }, mats: [["cotton_cloth", 1], ["herb", 2], ["golem_stone", 1]], credits: 300, farm: true },
  ...BITEM_RECIPES,   // 戦いで 使う アイテム（鹿さんの 決め、2026-10-31。battle-items.js。ガンビットで 使う）
];
export const wsLvOk = (r, wsLv) => !!r && attBand(wsLv) >= r.lv && (wsLv || 0) >= 1;   // その 物を 作れる 工房の Lv か（段で くらべる）
export const wsOpen = (r) => (!r.farm || farmOpen()) && (!r.detail || detailOpen());   // 作物の いる 物は 大工事の 畑が つながってから。詳細ステータスの 物は 開いてから
export const WS_MAX = 20;   // 道具・品を 1 回に 作れる 数

// ---------- 加工（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md）：作物 3 こ → 布・建材 1 こ（すぐ できる）----------
// 布は お守り・防具の 開発・施設、建材は 施設に 使う。作物も 使い道も 大工事の 畑が つながってから なので、それまでは 出さない（FARM_OPEN）
// key：レシピの 名前（同じ 物を 2 とおりで 作る ときだけ id と ちがう）
export const WS_PROC = [
  { id: "cotton_cloth", mats: [["cloudcotton", 3]] }, { id: "flax_cloth", mats: [["starflax", 3]] }, { id: "sky_cloth", mats: [["skycotton", 3]] },
  { id: "whitesand_cloth", mats: [["whitesand_cotton", 3]] }, { id: "sylph_sail", mats: [["sylph_linen", 3]] }, { id: "pearl_silk", mats: [["pearl_silkcotton", 3]] },
  { id: "bamboo_lumber", mats: [["iron_bamboo", 3]] }, { id: "nightbamboo_lumber", mats: [["night_bamboo", 3]] }, { id: "blackbamboo_lumber", mats: [["black_bamboo", 3]] },
  { id: "stormbamboo_lumber", mats: [["storm_bamboo", 3]] }, { id: "straw_bundle", mats: [["straw", 3]] }, { id: "straw_bundle", key: "straw_bundle_hay", mats: [["salt_hay", 1]] },
].map((r) => ({ key: r.key || r.id, ...r }));
export const PROC_MAX = 50;   // 1 回に 作れる 数
export const procOpen = () => farmOpen();
export const procOf = (key) => WS_PROC.find((r) => r.key === key) || null;

// ---------- 精錬（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md）：鉱石 → 延べ棒 ----------
// 炉は 工房の Lv の 数（1〜4）。1 つの 炉に 同じ 延べ棒を 何本でも 入れて、本数 × 時間（1 本ずつ 順に できる）。素材は 入れた ときに 取る
// min：1 本の 時間（分。下書き）。暖炉（家具）で 早く なる 決めは 家具の 効果を 入れる ときに
export const SMELT = [
  { id: "copper_bar", mats: [["copperore", 3], ["coal", 1]], min: 60 },
  { id: "iron_bar", mats: [["ironore", 3], ["coal", 1]], min: 60 },
  { id: "silver_bar", mats: [["silverore", 3], ["coal", 2]], min: 180 },
  { id: "gold_bar", mats: [["goldore", 3], ["coal", 2]], min: 360 },
];
export const SMELT_MAX = 50;   // 1 つの 炉に 1 回で 入れられる 本数
// 石炭で 早める（2026-11-11 鹿さん「石炭で精錬が早く終わる仕組みも作り実装してください」。数は Claude）：動いて いる 炉に 石炭を くべると 1 こ 15 分 早く 終わる。いる 分だけ 使う
export const SMELT_COAL = { id: "coal", min: 15, max: 99 };
export const furnaces = (wsLv) => [1, 20, 50, 80].filter((x) => (wsLv || 0) >= x).length;   // 炉の 数は 段（工房 Lv1・20・50・80 で 1〜4。施設の 作り直し、2026-11-03）
export const smeltOf = (id) => SMELT.find((x) => x.id === id) || null;
// 炉の ようす。f：{ id, n, at }（at：いま 作って いる 1 本目を 入れた 時刻）。done：できた 本数・next：つぎの 1 本が できる 時刻・end：ぜんぶ できる 時刻
export function smeltDone(f, now) {
  const ms = f.ms || smeltOf(f.id).min * 60000, done =   // ms：入れた ときの 1 本の 時間（家具〈暖炉 など〉で 短い）。前の 炉は ない
    Math.max(0, Math.min(f.n, Math.floor((now - f.at) / ms)));
  return { done, left: f.n - done, next: done < f.n ? f.at + (done + 1) * ms : 0, end: f.at + f.n * ms };
}

// ---------- 武器の アタッチメント ----------
// 武器 1 つに 先っぽ・持ち手 の 2 つ。作る たびに ★と OP が くじ（同じ レシピでも 毎回 ちがう）
export const ATT_KINDS = { tip: { label: "先っぽ" }, grip: { label: "持ち手" } };
// pool：付く OP（この 中から くじ）。mats の さいごは 敵の 素材
export const ATT_BASES = [
  { id: "spike", kind: "tip", name: "とげキャップ", pool: ["atk", "crit", "critDmg"], mats: [["oldnail", 12], ["pebble", 12], ["wolf_fang", 1]], credits: 300 },
  { id: "lens", kind: "tip", name: "ルーペ", pool: ["dex", "crit", "int"], mats: [["crystalbit", 10], ["candle", 10], ["bat_wing", 1]], credits: 400 },
  { id: "bulb", kind: "tip", name: "ちいさな 電球", pool: ["int", "itazuraDmg", "wazaDmg", "mp"], mats: [["glowstone", 10], ["oldnail", 10], ["light_drop", 1]], credits: 400 },
  { id: "rubber", kind: "tip", name: "ゴムキャップ", pool: ["def", "dmgCut", "hp"], mats: [["oldcloth", 12], ["sleepmoss", 12], ["slime_core", 1]], credits: 300 },
  { id: "tape", kind: "grip", name: "グリップテープ", pool: ["dex", "agi", "firstStrike"], mats: [["oldcloth", 12], ["straw", 15], ["goblin_knife", 1]], credits: 250 },
  { id: "strap", kind: "grip", name: "ストラップ", pool: ["agi", "evade", "luk"], mats: [["straw", 15], ["berry", 10], ["kobold_fur", 1]], credits: 250 },
  { id: "weight", kind: "grip", name: "おもり", pool: ["atk", "def", "critDmg", "drain"], mats: [["ironore", 12], ["brick", 12], ["golem_stone", 1]], credits: 400 },
  { id: "bell", kind: "grip", name: "鈴", pool: ["mp", "mpRegen", "focusStart", "healUp"], mats: [["stardust", 12], ["candle", 8], ["old_score", 1]], credits: 400 },
];
export const attBase = (id) => ATT_BASES.find((b) => b.id === id) || null;
// ★の くじ（工房の Lv ごと）。★4 だけ OP が 2 つ
export const ATT_STAR = { 1: { 1: 70, 2: 30 }, 2: { 1: 35, 2: 45, 3: 20 }, 3: { 2: 40, 3: 40, 4: 20 }, 4: { 3: 35, 4: 45, 5: 20 } };   // Lv4 は ビサイ諸島が 開いてから
export const attOpN = (star) => (star >= 5 ? 3 : star >= 4 ? 2 : 1);
export const ATT_MAX = 60;   // 武器に 付けて いない アタッチメントを 持てる 数

const pickW = (R, w) => { const t = Object.values(w).reduce((a, b) => a + b, 0); let x = R() * t; for (const [k, v] of Object.entries(w)) if ((x -= v) < 0) return +k; return +Object.keys(w)[0]; };
// アタッチメントを 1 つ 引く（uid は 呼ぶ 側が つける）
// 工房 Lv1〜100（施設の 作り直し）：段（Lv1・20・50・80）の 表に、いちばん 上の ★の 重みを ×（1 ＋ 0.3% × Lv）（作業台と 同じ 形）
export const attBand = (wsLv) => Math.max(1, [1, 20, 50, 80].filter((x) => (wsLv || 0) >= x).length);
export const attStarW = (wsLv) => { const w = ATT_STAR[attBand(wsLv)], top = Math.max(...Object.keys(w).map(Number)); return { ...w, [top]: w[top] * (1 + 0.003 * (wsLv || 0)) }; };
export function rollAtt(R, base, wsLv) {
  const star = pickW(R, attStarW(wsLv)), ops = [];
  const pool = base.pool.filter((k) => (OPS[k].from || 1) <= star && OPS[k].v[star - 1] > 0);
  for (let i = 0; i < attOpN(star) && pool.length; i++) { const k = pool.splice(Math.floor(R() * pool.length), 1)[0]; ops.push(k); }
  return { base: base.id, star, ops };
}
// アタッチメントの 数字（OP だけ。もとの 強さは ない）
export function attStats(a) { const out = {}; for (const op of a.ops || []) if (OPS[op]) out[op] = (out[op] || 0) + OPS[op].v[a.star - 1]; return out; }
export const attName = (a) => { const b = attBase(a.base); return b ? `${b.name} ★${a.star}` : "？"; };
// 武器に 付いて いる アタッチメントを 武器の 中に 入れた 写し（戦いの 計算・画面の 数字は これを 使う）。atts：記録の own.att
export function withAtt(it, atts) {
  const on = (atts || []).filter((a) => a.on === it.uid);
  return on.length ? { ...it, att: on.map((a) => ({ base: a.base, star: a.star, ops: a.ops, kind: (attBase(a.base) || {}).kind })) } : it;
}
