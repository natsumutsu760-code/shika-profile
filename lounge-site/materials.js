// 素材（試作。鹿さんの OK、2026-10-22）。数字はすべて仮
// 採取の素材：行き先ごとに 4 種類 ＋ かくし通路だけのレア 1 種類。階ごとに 2 種類ずつずらして出る（深い階ほどいい、ではない）
// 敵の素材：敵ごとに 1 種類。品質 1〜5 は深い階ほど上がる（希少な敵は ＋1、ボスはいつも 5）
// 使いみち：作業台での装備の作成・合成、施設の強化、DEEP LINK/: のタスク、ラウンジの家具、売って玉にする

export const GATHER = {
  hals: { mats: [["herb", "薬草"], ["pebble", "きれいな小石"], ["straw", "麦わら"], ["berry", "野いちご"]], hidden: ["clover", "四つ葉のクローバー"] },
  morph: { mats: [["brick", "古いレンガ"], ["sleepmoss", "ねむり苔"], ["stardust", "星の砂"], ["oldcloth", "色あせた布"]], hidden: ["dreamshard", "夢のかけら"] },
  kurai: { mats: [["oldnail", "古い釘"], ["nightbloom", "夜咲き草"], ["wellwater", "井戸の水"], ["candle", "ろうそく"]], hidden: ["moondrop", "月のしずく"] },
  crystal: { mats: [["crystalbit", "水晶のかけら"], ["glowstone", "光る石"], ["deepwater", "地底の水"], ["ironore", "鉄鉱石"]], hidden: ["rainbowcrystal", "虹水晶"] },
};
// 敵の素材（キーは敵のツリーの id）
export const ENEMY_MAT = {
  e_hare: ["hare_horn", "ウサギの角"], e_thief: ["goblin_knife", "ゴブリンのナイフ"], e_watch: ["kobold_fur", "コボルトの毛"], e_bard: ["old_score", "古い楽譜"], e_boss_thief: ["crown_shard", "王冠のかけら"],
  e_sentinel: ["golem_stone", "ゴーレムの石"], e_ghost: ["ghost_cloth", "霊布"], e_trapper: ["mimic_tooth", "ミミックの歯"], e_owl: ["dream_feather", "夢見の羽"], e_boss_sleep: ["sleep_hourglass", "眠りの砂時計"],
  e_wolf: ["wolf_fang", "狼の牙"], e_shade: ["shadow_shard", "影のかけら"], e_witch: ["poison_vial", "毒の小びん"], e_lantern: ["light_drop", "灯火のしずく"], e_boss_mayor: ["midnight_bell", "夜ふけの鐘"],
  e_lizard: ["crystal_scale", "水晶のうろこ"], e_bat: ["bat_wing", "コウモリの羽"], e_crystal: ["slime_core", "スライムの核"], e_turtle: ["rainbow_shell", "七色の甲羅片"], e_boss_crystal: ["dragon_crystal", "竜水晶"],
};

// 採取ポイント 1 か所で 1〜2 こ（70%・30%）。その階の 2 種類から半々。かくし通路の採取ポイントは、レア 1 こ ＋ その階の素材 1 こ
export const GATHER_N = { 1: 70, 2: 30 };
export const floorMats = (did, n) => { const m = GATHER[did].mats; return [m[(n - 1) % 4], m[n % 4]]; };
// 敵の素材を落とす確率（たおした 1 体ごと）と、階ごとの品質
export const ENEMY_DROP = { 通常: 0.3, 希少: 1, ボス: 1 };
export const QUALITY = { 1: { 1: 100 }, 2: { 1: 60, 2: 40 }, 3: { 2: 60, 3: 40 }, 4: { 3: 60, 4: 40 }, 5: { 4: 60, 5: 40 } };
// 売ると玉（品質が高いほど高い）
export const SELL = { gather: 20, hidden: 150, enemy: (q) => 10 * 2 ** (q - 1) };

// 素材の名前（id から）
export const MAT_NAME = Object.fromEntries([...Object.values(GATHER).flatMap((g) => [...g.mats, g.hidden]), ...Object.values(ENEMY_MAT)]);
// どの敵の素材か（ドット絵を出すため）
export const MAT_FROM = Object.fromEntries(Object.entries(ENEMY_MAT).map(([tree, [id]]) => [id, tree]));
export const HIDDEN_MAT = new Set(Object.values(GATHER).map((g) => g.hidden[0]));
export const sellPrice = (m) => (MAT_FROM[m.id] ? SELL.enemy(m.q || 1) : HIDDEN_MAT.has(m.id) ? SELL.hidden : SELL.gather);

// 倉庫が いっぱいの とき（鹿さんの決め、2026-10-23）：入らない分は あずかり箱へ。7 日の うちに 倉庫を あければ うけとれる（すぎると なくなる）
// 倉庫に 入れるのは いい物から：かくし通路の レア → 敵の素材（品質の 高い順）→ 採取の素材。ほかは 箱へ
export const BOX_DAYS = 7;
const rankMat = (m) => (HIDDEN_MAT.has(m.id) ? 100 : MAT_FROM[m.id] ? 10 + (m.q || 1) : 0);
export function toStash(mats, free) {
  const stash = [], box = []; let left = Math.max(0, free);
  for (const m of [...mats].sort((a, b) => rankMat(b) - rankMat(a))) { const k = Math.min(m.n, left); left -= k;
    if (k) stash.push({ ...m, n: k }); if (m.n > k) box.push({ ...m, n: m.n - k }); }
  return { stash, box };
}
