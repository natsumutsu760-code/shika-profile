// 装備開発（鹿さんと カードで 決めた、2026-10-28。仕様は docs/mono-link-equip-dev.md）。2026-11-04 に ゲームに つないだ（作業台の「開発」・門番 bench.dev）
// 敵 1 体に 3 つ。中心は その敵の 結晶（結晶Ⅰ・Ⅱ・Ⅲ・結晶核Ⅰ・Ⅱ ＝ 品質 1〜5）、添えるのは 採取の素材・敵の素材
// 作った 装備は OP なし（枠は 空いて 出る）。決まった 能力は 重みの 合計 1.0 で、数字は ★ × 部位の 重み × DEV_MULT
// 効果は 小さく 1 つ。無効と、相手を 止める 状態異常（眠り・気絶・凍結）・混乱・沈黙・腐敗は 使わない（戦いの つりあい。鹿さんの決め）
import { KINDS, MAIN, FORMS } from "./equip.js";
import { EFFECTS } from "./effects.js";
import { DEV3 } from "./equip-dev-isle3.js";   // ミカネル島（島 3）の 255（Claude の 案、2026-11-04）
import { DUNGEONS_ALL } from "./dungeons.js";
import { MAT_NAME, CRYSTAL } from "./materials.js";

export const DEV_MULT = 2;
export const CRYSTAL_N = { 通常: 5, 希少: 3, ボス: 2 };   // 結晶の 数
export const CRYSTAL_GRADE = ["", "結晶Ⅰ", "結晶Ⅱ", "結晶Ⅲ", "結晶核Ⅰ", "結晶核Ⅱ"];   // 品質 1〜5
export const ON_HIT = 0.05;                                // 攻撃が 当たると 5% で 状態異常
// 作る 値段（クレジット。行き先の Lv から。希少 ×1.5・ボス ×2.5）と、作れる 作業台の Lv（島 2 は Lv4・島 3 は Lv5）。数は 仮
// 作業台の Lv は 施設が Lv1〜100 に 作り直される 前の 段（1〜5）。ゲームでは DEV_BENCH_LV で いまの Lv に うつす（1・20・50・80、島 3 の 5 は 90。2026-11-04 に つないだ とき）
export const devCost = (lv, rank) => Math.round(((100 + lv * 10) * { 通常: 1, 希少: 1.5, ボス: 2.5 }[rank]) / 10) * 10;
export const devBench = (d) => ((d.isle || 1) >= 3 ? 5 : (d.isle || 1) >= 2 ? 4 : { hals: 1, morph: 1, kurai: 2, crystal: 3 }[d.id]);

// [名前, 形, 決まった 能力の 重み, 効果, 添える 素材]
// 効果：onHit（状態異常の id）・start（戦いの はじめに [効果の id, 量, ターン]）・OP と 同じ 単位の 数字（crit・evade・critDmg・dmgCut・statusRes・healUp・itazuraDmg・wazaDmg・drain は %）・firstHit・hpRegen（割合）・mpRegen（1 ターンの 量）
export const DEV = {
  // ハルス街道
  e_hare: [
    ["ホーンスティック", "stick", { atk: 0.6, agi: 0.4 }, { onHit: "paralysis" }, [["ウサギの角", 1]]],
    ["跳ね足スニーカー", "sneakers", { agi: 0.7, dex: 0.3 }, { evade: 2 }, [["麦わら", 3]]],
    ["うさ耳ずきん", "hood", { res: 0.5, agi: 0.5 }, { statusRes: 5 }, []]],
  e_thief: [
    ["火打ちハンマー", "hammer", { atk: 0.7, dex: 0.3 }, { onHit: "burn" }, [["きれいな小石", 2]]],
    ["スリの指ぬき", "band", { agi: 0.6, dex: 0.4 }, { crit: 2 }, [["ゴブリンのナイフ", 1]]],
    ["火薬玉のチャーム", "keychain", { agi: 0.5, luk: 0.5 }, { firstHit: 0.1 }, [["きれいな小石", 3]]]],
  e_watch: [
    ["見張りの盾", "shield", { def: 1.2, agi: -0.2 }, { dmgCut: 2 }, [["コボルトの毛", 1]]],
    ["毛皮のマフラー", "scarf", { hp: 0.7, res: 0.3 }, { statusRes: 5 }, [["麦わら", 3]]],
    ["コボルトのブーツ", "boots", { def: 0.6, res: 0.4 }, { start: ["armor", 10] }, [["きれいな小石", 2]]]],
  e_bard: [
    ["ララバイの歌集", "book", { int: 0.6, mp: 0.4 }, { onHit: "fatigue" }, [["古い楽譜", 1]]],
    ["旅芸人のスカーフ", "scarf", { mp: 0.7, int: 0.3 }, { healUp: 5 }, [["薬草", 3]]],
    ["羽根飾りのベレー帽", "hat", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["野いちご", 3]]]],
  e_boss_thief: [
    ["頭領の大槌", "hammer", { atk: 0.7, hp: 0.3 }, { start: ["up_atk", 10, 3] }, [["王冠のかけら", 1], ["ゴブリンのナイフ", 2]]],
    ["号令の籠手", "gauntlet", { def: 0.5, atk: 0.5 }, { firstHit: 0.1 }, [["ゴブリンのナイフ", 2]]],
    ["欠けた王冠の指輪", "ring", { dex: 0.5, luk: 0.5 }, { critDmg: 5 }, [["王冠のかけら", 1], ["四つ葉のクローバー", 1]]]],
  // モーフィアス遺跡
  e_sentinel: [
    ["石の面", "helmet", { def: 0.6, res: 0.4 }, { start: ["barrier", 1] }, [["ゴーレムの石", 1]]],
    ["石積みの籠手", "gauntlet", { def: 0.6, atk: 0.4 }, { dmgCut: 2 }, [["古いレンガ", 3]]],
    ["苔むした脚甲", "boots", { def: 0.5, hp: 0.5 }, { statusRes: 5 }, [["ねむり苔", 3]]]],
  e_ghost: [
    ["霊布のずきん", "hood", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["霊布", 1]]],
    ["ささやきの本", "book", { int: 0.6, mp: 0.4 }, { onHit: "blind" }, [["色あせた布", 3]]],
    ["ファントムのロケット", "amulet", { mp: 0.6, int: 0.4 }, { evade: 2 }, [["星の砂", 2]]]],
  e_trapper: [
    ["びっくり箱ハンマー", "hammer", { atk: 0.5, dex: 0.5 }, { onHit: "blind" }, [["ミミックの歯", 1]]],
    ["わな師の手袋", "glove", { dex: 0.7, agi: 0.3 }, { crit: 2 }, [["古いレンガ", 2]]],
    ["宝箱の合鍵", "keychain", { luk: 0.6, dex: 0.4 }, { critDmg: 5 }, []]],
  e_owl: [
    ["ふくろうの羽毛ストール", "scarf", { mp: 0.6, res: 0.4 }, { mpRegen: 0.2 }, [["夢見の羽", 1]]],
    ["夢見のランタン", "lantern", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["星の砂", 3]]],
    ["羽づくろいのブローチ", "brooch", { luk: 0.5, res: 0.5 }, { statusRes: 5 }, [["夢のかけら", 1]]]],
  e_boss_sleep: [
    ["ヒュプノスの杖", "stick", { int: 0.7, hp: 0.3 }, { onHit: "fatigue" }, [["眠りの砂時計", 1], ["ねむり苔", 3]]],
    ["砂時計のペンダント", "necklace", { hp: 0.6, int: 0.4 }, { hpRegen: 0.01 }, [["眠りの砂時計", 1]]],
    ["夢路のサンダル", "socks", { hp: 0.6, res: 0.4 }, { start: ["ward", 10] }, [["夢のかけら", 1]]]],
  // 暗い村
  e_wolf: [
    ["狼牙のこん棒", "stick", { atk: 0.7, agi: 0.3 }, { onHit: "weakness" }, [["狼の牙", 1]]],
    ["爪とぎの手袋", "glove", { atk: 0.5, dex: 0.5 }, { critDmg: 5 }, [["古い釘", 3]]],
    ["狼の首輪", "necklace", { hp: 0.6, agi: 0.4 }, { start: ["up_atk", 10, 3] }, []]],
  e_shade: [
    ["影縫いの腕輪", "band", { dex: 0.6, agi: 0.4 }, { onHit: "blind" }, [["影のかけら", 1]]],
    ["シャドウステップ", "sneakers", { agi: 0.7, dex: 0.3 }, { evade: 2 }, [["ろうそく", 2]]],
    ["影かくしの頭巾", "hood", { agi: 0.5, res: 0.5 }, { crit: 2 }, [["夜咲き草", 3]]]],
  e_witch: [
    ["ウィッチワンド", "stick", { int: 0.7, mp: 0.3 }, { onHit: "poison" }, [["毒の小びん", 1]]],
    ["魔女のとんがり帽子", "hat", { int: 0.5, res: 0.5 }, { itazuraDmg: 3 }, [["夜咲き草", 3]]],
    ["毒草摘みのブーツ", "boots", { mp: 0.6, res: 0.4 }, { statusRes: 5 }, [["井戸の水", 3]]]],
  e_lantern: [
    ["灯火のランタン", "lantern", { int: 0.5, res: 0.5 }, { healUp: 5 }, [["灯火のしずく", 1]]],
    ["迷い火のブローチ", "brooch", { res: 0.6, luk: 0.4 }, { start: ["regen", 10] }, [["ろうそく", 3]]],
    ["清め火のストール", "scarf", { mp: 0.6, res: 0.4 }, { hpRegen: 0.01 }, [["月のしずく", 1]]]],
  e_boss_mayor: [
    ["村長の杖", "stick", { int: 0.7, hp: 0.3 }, { onHit: "fatigue" }, [["夜ふけの鐘", 1], ["古い釘", 3]]],
    ["村のおきての本", "book", { int: 0.6, hp: 0.4 }, { start: ["ward", 10] }, [["夜ふけの鐘", 1]]],
    ["弔い鐘のペンダント", "necklace", { hp: 0.6, mp: 0.4 }, { mpRegen: 0.2 }, [["月のしずく", 1]]]],
  // 水晶洞窟
  e_lizard: [
    ["水晶うろこの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["水晶のうろこ", 1]]],
    ["結晶鱗のすね当て", "boots", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["鉄鉱石", 3]]],
    ["逆立ちうろこの兜", "helmet", { def: 0.6, hp: 0.4 }, { statusRes: 5 }, [["水晶のかけら", 3]]]],
  e_bat: [
    ["コウモリ羽の扇", "fan", { agi: 0.6, dex: 0.4 }, { evade: 2 }, [["コウモリの羽", 1]]],
    ["吸血の牙のネックレス", "necklace", { hp: 0.6, dex: 0.4 }, { drain: 1 }, [["地底の水", 3]]],
    ["超音波の腕輪", "band", { dex: 0.6, agi: 0.4 }, { onHit: "blind" }, [["光る石", 2]]]],
  e_crystal: [
    ["フロストガン", "gun", { int: 0.7, mp: 0.3 }, { onHit: "frostbite" }, [["スライムの核", 1]]],
    ["スライムのぼうし", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["地底の水", 3]]],
    ["氷の鏡のブローチ", "brooch", { int: 0.5, res: 0.5 }, { start: ["ward", 10] }, [["水晶のかけら", 3]]]],
  e_turtle: [
    ["甲羅の兜", "helmet", { def: 0.6, res: 0.4 }, { start: ["barrier", 1] }, [["七色の甲羅片", 1]]],
    ["プリズムのお守り", "amulet", { res: 0.6, mp: 0.4 }, { statusRes: 5 }, [["虹水晶", 1]]],
    ["七色甲羅のすね当て", "geta", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["光る石", 3]]]],
  e_boss_crystal: [
    ["竜水晶の槍", "stick", { atk: 0.6, def: 0.4 }, { start: ["thorns", 10] }, [["竜水晶", 1], ["鉄鉱石", 3]]],
    ["竜鱗の籠手", "gauntlet", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["竜水晶", 1]]],
    ["結晶竜の指輪", "ring", { def: 0.5, luk: 0.5 }, { critDmg: 5 }, [["虹水晶", 1]]]],
  // イノーの浜（島 2）
  e_coconutcrab: [
    ["ヤシ割りの籠手", "gauntlet", { def: 0.6, atk: 0.4 }, { start: ["thorns", 10] }, [["ヤシガニのはさみ", 1]]],
    ["ヤシの実ヘルメット", "helmet", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["ヤシの実", 3]]],
    ["とげ殻のすね当て", "boots", { def: 0.6, hp: 0.4 }, { statusRes: 5 }, [["小さな貝殻", 3]]]],
  e_gull: [
    ["砂かけのうちわ", "fan", { agi: 0.6, dex: 0.4 }, { onHit: "blind" }, [["白い砂", 3]]],
    ["ウミネコの羽根帽子", "hat", { agi: 0.5, res: 0.5 }, { evade: 2 }, [["ウミネコの羽", 1]]],
    ["浜風のスニーカー", "sneakers", { agi: 0.7, dex: 0.3 }, { crit: 2 }, [["アーサ", 2]]]],
  e_sahagin: [
    ["サハギンの銛", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "weakness" }, [["サハギンのうろこ", 1]]],
    ["サンゴ研ぎの腕輪", "band", { dex: 0.6, atk: 0.4 }, { critDmg: 5 }, [["小さな貝殻", 3]]],
    ["珊瑚の首飾り", "necklace", { hp: 0.6, dex: 0.4 }, { firstHit: 0.1 }, [["アーサ", 3]]]],
  e_clownfish: [
    ["イソギンチャクのずきん", "hood", { res: 0.6, int: 0.4 }, { start: ["regen", 10] }, [["虹色のひれ", 1]]],
    ["泡のネックレス", "necklace", { mp: 0.6, int: 0.4 }, { healUp: 5 }, [["アーサ", 3]]],
    ["七色うろこのブローチ", "brooch", { res: 0.5, luk: 0.5 }, { statusRes: 5 }, [["桃色珊瑚", 1]]]],
  e_boss_crab: [
    ["キングクラブの大ばさみ", "hammer", { atk: 0.6, def: 0.4 }, { start: ["armor", 10] }, [["王のこうら", 1], ["ヤシガニのはさみ", 2]]],
    ["王のこうらの盾", "shield", { def: 1.2, agi: -0.2 }, { dmgCut: 2 }, [["王のこうら", 1]]],
    ["泡ぶきのネックレス", "necklace", { hp: 0.7, def: 0.3 }, { hpRegen: 0.01 }, [["桃色珊瑚", 1]]]],
  // ガマの隠れ港
  e_pirate: [
    ["下っぱのカトラス", "stick", { atk: 0.7, agi: 0.3 }, { critDmg: 5 }, [["海賊のバンダナ", 1]]],
    ["海賊バンダナ", "cap", { agi: 0.5, def: 0.5 }, { firstHit: 0.1 }, [["古い帆布", 3]]],
    ["ラム酒のキーホルダー", "keychain", { luk: 0.5, atk: 0.5 }, { crit: 2 }, [["空きびん", 3]]]],
  e_parrot: [
    ["オウムの羽根うちわ", "fan", { dex: 0.6, agi: 0.4 }, { onHit: "weakness" }, [["オウムの羽", 1]]],
    ["ものまねのブローチ", "brooch", { luk: 0.5, dex: 0.5 }, { evade: 2 }, [["古い金貨", 1]]],
    ["おしゃべりスカーフ", "scarf", { mp: 0.5, agi: 0.5 }, { itazuraDmg: 3 }, [["古い帆布", 3]]]],
  e_barrel: [
    ["樽ぶたの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["樽のたが", 1]]],
    ["樽板の木靴", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["錆びた鎖", 3]]],
    ["待ちぶせのずきん", "hood", { res: 0.6, def: 0.4 }, { statusRes: 5 }, [["古い帆布", 3]]]],
  e_mapseller: [
    ["旅の祈りのコイン", "amulet", { luk: 0.6, res: 0.4 }, { healUp: 5 }, [["古いコンパス", 1]]],
    ["道しるべの旅靴", "boots", { res: 0.6, agi: 0.4 }, { start: ["regen", 10] }, [["宝の地図の切れはし", 1]]],
    ["金貨のネックレス", "necklace", { hp: 0.5, luk: 0.5 }, { crit: 2 }, [["古い金貨", 3]]]],
  e_boss_redbeard: [
    ["船長のサーベル", "stick", { atk: 0.7, hp: 0.3 }, { start: ["up_atk", 10, 3] }, [["赤いひげ", 1], ["錆びた鎖", 3]]],
    ["赤ひげのガントレット", "gauntlet", { atk: 0.6, hp: 0.4 }, { firstHit: 0.1 }, [["赤いひげ", 1]]],
    ["船長のトリコーン", "hat", { def: 0.5, hp: 0.5 }, { critDmg: 5 }, [["宝の地図の切れはし", 1]]]],
  // ティダ岬の灯台
  e_keeper: [
    ["灯台のランタン", "lantern", { int: 0.6, mp: 0.4 }, { onHit: "blind" }, [["灯台の鍵", 1]]],
    ["霧笛のスカーフ", "scarf", { mp: 0.6, res: 0.4 }, { evade: 2 }, [["潮風の草", 3]]],
    ["灯台守の帽子", "cap", { int: 0.5, res: 0.5 }, { itazuraDmg: 3 }, [["灯台のガラス", 3]]]],
  e_harpy: [
    ["ハーピーの鉤爪", "glove", { dex: 0.7, agi: 0.3 }, { onHit: "fatigue" }, [["ハーピーの爪", 1]]],
    ["風切りのすね当て", "sneakers", { agi: 0.7, dex: 0.3 }, { evade: 2 }, [["アカバナー", 3]]],
    ["急降下のブローチ", "brooch", { dex: 0.5, luk: 0.5 }, { firstHit: 0.1 }, [["岬の石", 2]]]],
  e_shisa: [
    ["獅子瓦の盾", "shield", { def: 1.2, agi: -0.2 }, { dmgCut: 2 }, [["シーサーの瓦", 1]]],
    ["阿吽のお守り", "amulet", { res: 0.6, def: 0.4 }, { statusRes: 5 }, [["アカバナー", 3]]],
    ["石獅子の籠手", "gauntlet", { def: 0.6, res: 0.4 }, { start: ["armor", 10] }, [["岬の石", 3]]]],
  e_glimmer: [
    ["光の膜のネックレス", "necklace", { hp: 0.5, res: 0.5 }, { start: ["barrier", 1] }, [["光の粉", 1]]],
    ["やさしい灯のランタン", "lantern", { int: 0.5, res: 0.5 }, { healUp: 5 }, [["太陽の結晶", 1]]],
    ["きらめきの指輪", "ring", { luk: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["灯台のガラス", 3]]]],
  e_boss_fog: [
    ["霧の巨人の棍棒", "stick", { int: 0.7, hp: 0.3 }, { onHit: "sickness" }, [["霧の核", 1], ["潮風の草", 3]]],
    ["霧の衣", "scarf", { hp: 0.6, int: 0.4 }, { evade: 2 }, [["霧の核", 1]]],
    ["巨人の脚甲", "boots", { hp: 0.5, def: 0.5 }, { dmgCut: 2 }, [["太陽の結晶", 1]]]],
  // アトゥイ号の沈没船
  e_skelsailor: [
    ["錆びたカトラス", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "poison" }, [["水夫の骨", 1]]],
    ["骨の腕輪", "band", { dex: 0.6, atk: 0.4 }, { critDmg: 5 }, [["錆びた金具", 3]]],
    ["ドクロのバンダナ", "cap", { atk: 0.5, def: 0.5 }, { firstHit: 0.1 }, [["船の木材", 3]]]],
  e_barnacle: [
    ["フジツボの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["armor", 10] }, [["フジツボの板", 1]]],
    ["錨の足かせ", "boots", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["フジツボ", 3]]],
    ["殻の籠手", "gauntlet", { def: 0.6, hp: 0.4 }, { statusRes: 5 }, [["錆びた金具", 3]]]],
  e_jelly: [
    ["放電ガン", "gun", { int: 0.7, mp: 0.3 }, { onHit: "paralysis" }, [["クラゲのゼリー", 1]]],
    ["クラゲの帽子", "hat", { res: 0.5, int: 0.5 }, { evade: 2 }, [["真鍮の部品", 2]]],
    ["しびれ針のブローチ", "brooch", { int: 0.5, mp: 0.5 }, { itazuraDmg: 3 }, [["真鍮の部品", 3]]]],
  e_goldcrab: [
    ["金のはさみグローブ", "glove", { dex: 0.7, agi: 0.3 }, { crit: 2 }, [["金のはさみ", 1]]],
    ["砂もぐりのげた", "geta", { agi: 0.6, luk: 0.4 }, { evade: 2 }, [["沈んだ金貨", 1]]],
    ["金貨のキーホルダー", "keychain", { luk: 0.6, agi: 0.4 }, { critDmg: 5 }, [["真鍮の部品", 3]]]],
  e_boss_octopus: [
    ["タコ足のむち", "stick", { atk: 0.7, hp: 0.3 }, { onHit: "paralysis" }, [["大ダコの墨", 1], ["船の木材", 3]]],
    ["墨けむりの扇", "fan", { agi: 0.5, hp: 0.5 }, { evade: 2 }, [["大ダコの墨", 1]]],
    ["吸盤の首飾り", "necklace", { hp: 0.7, atk: 0.3 }, { drain: 1 }, [["沈んだ金貨", 1]]]],
  // ザンの洞窟
  e_siren: [
    ["舟歌の楽譜", "book", { int: 0.6, mp: 0.4 }, { onHit: "fatigue" }, [["セイレーンのうろこ", 1]]],
    ["潮騒のネックレス", "necklace", { mp: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["真珠", 2]]],
    ["セイレーンの髪かざり", "hat", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["滝の水", 3]]]],
  e_eel: [
    ["ウナギ皮のグローブ", "glove", { dex: 0.6, agi: 0.4 }, { onHit: "paralysis" }, [["ウナギの皮", 1]]],
    ["ぬめり皮の足袋", "socks", { agi: 0.7, dex: 0.3 }, { evade: 2 }, [["光るコケ", 3]]],
    ["放電のネックレス", "necklace", { hp: 0.5, dex: 0.5 }, { crit: 2 }, [["青い石", 3]]]],
  e_clam: [
    ["貝がらの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["barrier", 1] }, [["大きな貝がら", 1]]],
    ["真珠層の兜", "helmet", { def: 0.5, res: 0.5 }, { dmgCut: 2 }, [["真珠", 2]]],
    ["二枚貝のすね当て", "geta", { def: 0.6, res: 0.4 }, { statusRes: 5 }, [["青い石", 3]]]],
  e_pearl: [
    ["満ち潮の本", "book", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["歌う真珠", 1]]],
    ["真珠のネックレス", "necklace", { hp: 0.5, res: 0.5 }, { start: ["regen", 10] }, [["真珠", 3]]],
    ["人魚の涙の指輪", "ring", { res: 0.5, luk: 0.5 }, { mpRegen: 0.2 }, [["人魚の涙", 1]]]],
  e_boss_mermaid: [
    ["女王の扇", "fan", { int: 0.6, hp: 0.4 }, { onHit: "sickness" }, [["女王のくし", 1], ["滝の水", 3]]],
    ["女王のティアラ", "hat", { int: 0.5, hp: 0.5 }, { healUp: 5 }, [["女王のくし", 1]]],
    ["人魚のヴェール", "scarf", { hp: 0.6, res: 0.4 }, { hpRegen: 0.01 }, [["人魚の涙", 1]]]],
  // ウフ火山
  e_lavalizard: [
    ["溶岩のハンマー", "hammer", { atk: 0.7, agi: 0.3 }, { onHit: "burn" }, [["溶岩のうろこ", 1]]],
    ["焼けた爪の手甲", "glove", { atk: 0.5, dex: 0.5 }, { critDmg: 5 }, [["硫黄", 3]]],
    ["溶岩石の鉄靴", "geta", { agi: 0.6, hp: 0.4 }, { hpRegen: 0.01 }, [["溶岩石", 3]]]],
  e_hidama: [
    ["ゆらめく火の玉", "balloon", { int: 0.7, agi: 0.3 }, { onHit: "scald" }, [["ヒーダマの火種", 1]]],
    ["陽炎のマフラー", "scarf", { int: 0.6, mp: 0.4 }, { evade: 2 }, [["硫黄", 3]]],
    ["火種のブローチ", "brooch", { int: 0.5, mp: 0.5 }, { itazuraDmg: 3 }, [["火山灰", 3]]]],
  e_obsidian: [
    ["黒曜石の盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["黒曜石の芯", 1]]],
    ["黒曜石の兜", "helmet", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["黒曜石", 3]]],
    ["黒曜のかけらの腕輪", "bangle", { def: 0.5, res: 0.5 }, { statusRes: 5 }, [["溶岩石", 3]]]],
  e_firechick: [
    ["再生の灯のランタン", "lantern", { int: 0.5, res: 0.5 }, { healUp: 5 }, [["火の鳥の綿毛", 1]]],
    ["綿毛のマフラー", "scarf", { hp: 0.6, res: 0.4 }, { hpRegen: 0.01 }, [["火の心", 1]]],
    ["命の火のお守り", "amulet", { res: 0.6, int: 0.4 }, { start: ["regen", 10] }, [["火山灰", 3]]]],
  e_boss_salamander: [
    ["炎の尾むち", "stick", { atk: 0.7, hp: 0.3 }, { onHit: "burn" }, [["サラマンダーの尾", 1], ["溶岩石", 3]]],
    ["火炎の籠手", "gauntlet", { atk: 0.6, hp: 0.4 }, { firstHit: 0.1 }, [["サラマンダーの尾", 1]]],
    ["火山の指輪", "ring", { atk: 0.5, luk: 0.5 }, { critDmg: 5 }, [["火の心", 1]]]],
  // カジの海峡
  e_thunderbird: [
    ["雷羽の手甲", "glove", { dex: 0.6, agi: 0.4 }, { onHit: "paralysis" }, [["雷の羽", 1]]],
    ["黒雲のずきん", "hood", { agi: 0.5, res: 0.5 }, { evade: 2 }, [["嵐の雲", 3]]],
    ["雷鳴のアンクレット", "sneakers", { dex: 0.5, agi: 0.5 }, { crit: 2 }, [["雷の石", 3]]]],
  e_whirl: [
    ["渦潮のロッド", "stick", { int: 0.7, mp: 0.3 }, { onHit: "weakness" }, [["渦の玉", 1]]],
    ["引き潮のマフラー", "scarf", { mp: 0.6, int: 0.4 }, { mpRegen: 0.2 }, [["流木", 3]]],
    ["大渦の本", "book", { int: 0.6, res: 0.4 }, { itazuraDmg: 3 }, [["海鳥の羽", 3]]]],
  e_stormship: [
    ["嵐のカトラス", "stick", { atk: 0.7, agi: 0.3 }, { firstHit: 0.1 }, [["嵐の船板", 1]]],
    ["追い風の腕輪", "band", { agi: 0.7, atk: 0.3 }, { start: ["up_agi", 10, 3] }, [["流木", 3]]],
    ["甲板のブーツ", "boots", { agi: 0.6, def: 0.4 }, { dmgCut: 2 }, [["雷の石", 2]]]],
  e_vane: [
    ["風見のスニーカー", "sneakers", { agi: 0.5, int: 0.5 }, { start: ["up_agi", 10, 3] }, [["風見の羽", 1]]],
    ["追い風のネックレス", "necklace", { hp: 0.5, agi: 0.5 }, { healUp: 5 }, [["風のオーブ", 1]]],
    ["つむじ風のブローチ", "brooch", { res: 0.5, luk: 0.5 }, { evade: 2 }, [["海鳥の羽", 3]]]],
  e_boss_irabu: [
    ["凍える牙の杖", "stick", { int: 0.7, hp: 0.3 }, { onHit: "frostbite" }, [["イラブーの牙", 1], ["嵐の雲", 3]]],
    ["とぐろの首巻き", "scarf", { hp: 0.6, def: 0.4 }, { dmgCut: 2 }, [["イラブーの牙", 1]]],
    ["海へびの腕輪", "bangle", { int: 0.5, hp: 0.5 }, { statusRes: 5 }, [["風のオーブ", 1]]]],
  // ニライ寺院
  e_guard: [
    ["衛兵の盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["ward", 10] }, [["衛兵の紋章", 1]]],
    ["門番の兜", "helmet", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["白い大理石", 3]]],
    ["聖なる貝のお守り", "amulet", { res: 0.6, def: 0.4 }, { statusRes: 5 }, [["聖なる貝", 3]]]],
  e_trident: [
    ["トライデント", "stick", { atk: 0.7, dex: 0.3 }, { start: ["pierce", 10] }, [["三叉の穂先", 1]]],
    ["潮の構えの籠手", "gauntlet", { atk: 0.5, def: 0.5 }, { critDmg: 5 }, [["青い珊瑚", 3]]],
    ["騎士の脚甲", "boots", { dex: 0.6, atk: 0.4 }, { crit: 2 }, [["白い大理石", 2]]]],
  e_priest: [
    ["うろこの杖", "stick", { int: 0.7, mp: 0.3 }, { onHit: "weakness" }, [["神官のうろこ", 1]]],
    ["黒い潮の本", "book", { int: 0.6, mp: 0.4 }, { itazuraDmg: 3 }, [["古い鈴", 3]]],
    ["神官の頭巾", "hat", { int: 0.5, res: 0.5 }, { mpRegen: 0.2 }, [["聖なる貝", 3]]]],
  e_dolphin: [
    ["白波のマフラー", "scarf", { mp: 0.5, res: 0.5 }, { healUp: 5 }, [["白いひれ", 1]]],
    ["イルカのうでわ", "bangle", { res: 0.5, agi: 0.5 }, { start: ["regen", 10] }, [["青い珊瑚", 3]]],
    ["海神の真珠のブローチ", "brooch", { res: 0.5, luk: 0.5 }, { statusRes: 5 }, [["海神の真珠", 1]]]],
  e_boss_seagod: [
    ["海神の杖", "stick", { int: 0.7, hp: 0.3 }, { onHit: "frostbite" }, [["海神のうろこ", 1], ["聖なる貝", 3]]],
    ["海神の冠", "hat", { int: 0.5, hp: 0.5 }, { start: ["ward", 10] }, [["海神のうろこ", 1]]],
    ["大波の指輪", "ring", { hp: 0.5, luk: 0.5 }, { wazaDmg: 3 }, [["海神の真珠", 1]]]],
  // マブイの幽霊船
  e_ghostsailor: [
    ["鉤爪の手袋", "glove", { atk: 0.5, agi: 0.5 }, { onHit: "fatigue" }, [["幽霊の綱", 1]]],
    ["水夫の濡れ草履", "boots", { agi: 0.6, atk: 0.4 }, { critDmg: 5 }, [["黒い帆", 3]]],
    ["幽霊水夫のバンダナ", "cap", { agi: 0.5, res: 0.5 }, { evade: 2 }, [["骨の破片", 3]]]],
  e_majimun: [
    ["化け火のランタン", "lantern", { int: 0.6, mp: 0.4 }, { onHit: "fatigue" }, [["マジムンの面", 1]]],
    ["化け面のずきん", "hood", { int: 0.5, res: 0.5 }, { itazuraDmg: 3 }, [["青い鬼火", 3]]],
    ["気吸いのお守り", "amulet", { mp: 0.6, int: 0.4 }, { drain: 1 }, [["古い船鐘", 2]]]],
  e_doll: [
    ["まち針の腕輪", "band", { dex: 0.7, agi: 0.3 }, { onHit: "blind" }, [["人形のボタン", 1]]],
    ["藁人形のわらじ", "socks", { dex: 0.6, agi: 0.4 }, { crit: 2 }, [["黒い帆", 3]]],
    ["ボタンのブローチ", "brooch", { luk: 0.5, dex: 0.5 }, { evade: 2 }, [["骨の破片", 3]]]],
  e_shipcat: [
    ["船猫の鈴", "necklace", { hp: 0.5, agi: 0.5 }, { start: ["barrier", 1] }, [["猫の鈴", 1]]],
    ["ねこパンチのグローブ", "glove", { agi: 0.5, dex: 0.5 }, { firstHit: 0.1 }, [["古い船鐘", 3]]],
    ["ひなたぼっこのくつした", "socks", { agi: 0.5, res: 0.5 }, { hpRegen: 0.01 }, [["船長の日誌", 1]]]],
  e_boss_captain: [
    ["青い鬼火のランタン", "lantern", { int: 0.6, hp: 0.4 }, { onHit: "poison" }, [["船長の帽子", 1], ["青い鬼火", 3]]],
    ["幽霊船長の帽子", "hat", { int: 0.5, hp: 0.5 }, { itazuraDmg: 3 }, [["船長の帽子", 1]]],
    ["幽霊船の鍵", "keychain", { luk: 0.5, int: 0.5 }, { statusRes: 5 }, [["船長の日誌", 1]]]],
  // カナイの門
  e_angler: [
    ["ちょうちんのランタン", "lantern", { int: 0.6, mp: 0.4 }, { onHit: "blind" }, [["アンコウのちょうちん", 1]]],
    ["誘い火のブローチ", "brooch", { int: 0.5, luk: 0.5 }, { itazuraDmg: 3 }, [["光る泡", 3]]],
    ["闇にひそむずきん", "hood", { res: 0.5, agi: 0.5 }, { evade: 2 }, [["深海の泥", 3]]]],
  e_squid: [
    ["イカの触手むち", "stick", { atk: 0.7, hp: 0.3 }, { onHit: "weakness" }, [["イカのくちばし", 1]]],
    ["墨染めのストール", "scarf", { hp: 0.6, atk: 0.4 }, { drain: 1 }, [["深海の泥", 3]]],
    ["しめつけの籠手", "gauntlet", { atk: 0.6, def: 0.4 }, { critDmg: 5 }, [["深海の石", 3]]]],
  e_deepgiant: [
    ["巨人の殻の盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["armor", 10] }, [["巨人の殻", 1]]],
    ["水圧の兜", "helmet", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["深海の石", 3]]],
    ["水底の脚絆", "geta", { def: 0.5, hp: 0.5 }, { statusRes: 5 }, [["古代の歯車", 2]]]],
  e_deepfish: [
    ["命の光のネックレス", "necklace", { hp: 0.5, res: 0.5 }, { start: ["regen", 10] }, [["深海の光", 1]]],
    ["深海の光の杖", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["光る泡", 3]]],
    ["深海魚の腕輪", "bangle", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["門の鍵石", 1]]]],
  e_boss_gatekeeper: [
    ["門番の大槌", "hammer", { atk: 0.6, def: 0.4 }, { onHit: "frostbite" }, [["門のかけら", 1], ["古代の歯車", 3]]],
    ["凍てつく門の盾", "shield", { def: 1.2, agi: -0.2 }, { dmgCut: 2 }, [["門のかけら", 1]]],
    ["深淵の脚甲", "boots", { def: 0.5, hp: 0.5 }, { statusRes: 5 }, [["門の鍵石", 1]]]],
};
Object.assign(DEV, DEV3);   // ミカネル島（equip-dev-isle3.js）

// 作物・布・建材・延べ棒も 添える（鹿さんの 決め、2026-10-31「その装備に対して必要になりそうな物に適切なものを加えてください」。docs/mono-link-crafting.md）
// 何を 足すかは Claude が 決めた 決まり（一覧は docs/mono-link-equip-dev.md）：
//   1. 部位で 延べ棒・布・建材の どれか 1 つ（金具の 物は 延べ棒・棒と げたと うちわは 建材・ほかの 身に つける 物は 布）。奥の 行き先と ボスほど 上の 物
//   2. 力の 物（INT・MP・RES が 主の 装備、回復・状態異常・イタズラ・吸収・MP の 効果、当てると 状態異常）に 作物
//   3. ボスの 装備に いちばん 上の 素材 1 つ（島 1 は マンドラゴラ、島 1 の 奥と 島 2 は 夢幻樹の葉、島 2 の 奥は 世界樹の葉、島 3 は 黄金樹の葉）
// 島 3（ミカネル島。Claude の 案、2026-11-04）：延べ棒は 金・布は 砂丘綿（作物の 説明「布（島 3 の 防具の 開発）」）で 奥は 真珠絹・建材は 嵐竹（島 3 の 建材は まだ ない）
//   作物は 種から 育てる 5 つ（ナツメヤシの実・スイレン・砂漠のセージ・サボテン・パピルス。採取でも とれる）
const METAL = new Set(["hammer", "shield", "helmet", "gauntlet", "ring", "bangle", "keychain", "gun", "boots", "necklace", "brooch", "lantern"]);
const WOOD = new Set(["stick", "geta", "fan"]);
const LADDER = {   // 島ごとに 3 段（下・中・上）
  1: { bar: ["copper_bar", "iron_bar", "silver_bar"], cloth: ["cotton_cloth", "flax_cloth", "sky_cloth"], wood: ["bamboo_lumber", "nightbamboo_lumber", "blackbamboo_lumber"] },
  2: { bar: ["silver_bar", "silver_bar", "gold_bar"], cloth: ["whitesand_cloth", "sylph_sail", "pearl_silk"], wood: ["stormbamboo_lumber", "stormbamboo_lumber", "stormbamboo_lumber"] },
  3: { bar: ["gold_bar", "gold_bar", "gold_bar"], cloth: ["dune_cotton", "dune_cotton", "pearl_silk"], wood: ["stormbamboo_lumber", "stormbamboo_lumber", "stormbamboo_lumber"] },
};
const STEP = { hals: 0, morph: 0, kurai: 1, crystal: 1, inoh: 0, gama: 0, tida: 0, atui: 0, zan: 1, ufu: 1, kaji: 1, mabui: 1, nirai: 2, kanai: 2,
  mika: 0, karegawa: 0, shiohara: 0, akaiwa: 1, kaseki: 1, seran: 1, noru: 1, yaei: 1, sakyu: 1, kaze: 1, shizumu: 1, ena: 2, daimon: 2, tiruka: 2, kyozo: 2, gekka: 2, kazeme: 2 };   // ボスは ＋1 段
const THEME = { hals: "wellcap", morph: "ruin_lavender", kurai: "wisp_shiitake", crystal: "crystal_shoot", inoh: "coconut", gama: "coconut", tida: "akabanaa", atui: "seagrass", zan: "seagrass", ufu: "akabanaa", kaji: "seagrass", nirai: "coconut", mabui: "akabanaa", kanai: "seagrass",
  mika: "lotus", karegawa: "desert_sage", shiohara: "desert_sage", akaiwa: "cactus", kaseki: "cactus", seran: "papyrus", noru: "date_fruit", yaei: "date_fruit", sakyu: "cactus", kaze: "desert_sage", ena: "lotus", daimon: "desert_sage", tiruka: "date_fruit", kyozo: "papyrus", shizumu: "cactus", gekka: "date_fruit", kazeme: "lotus" };   // その 行き先らしい 作物
const FX_CROP = { healUp: ["healherb", "ryugu_ginger", "date_fruit"], hpRegen: ["healherb", "ryugu_ginger", "date_fruit"], statusRes: ["herb", "sannin", "desert_sage"], mpRegen: ["moonshroom", "seagrass", "lotus"], itazuraDmg: ["nightbloom", "akabanaa", "papyrus"], drain: ["deep_mushroom", "coconut", "cactus"] };   // [島 1, 島 2, 島 3]
const HIT_CROP = { poison: "shadow_mugwort", fatigue: "sleepmoss", blind: "nightbloom", sickness: "deep_mushroom" };   // 当てると 状態異常（島 1。島 2・3 は 行き先の 作物）
export const DEV_N = { 通常: 2, 希少: 3, ボス: 4 };   // 延べ棒・布・建材の 数。作物は 3（ボス 4）・いちばん 上の 素材は 1（数は Claude の 案）
export function devExtra(d, rank, [, form, st, fx]) {
  const isle = Math.min(3, d.isle || 1), step = Math.min(2, (STEP[d.id] || 0) + (rank === "ボス" ? 1 : 0));
  const kind = METAL.has(form) ? "bar" : WOOD.has(form) ? "wood" : "cloth", out = [[LADDER[isle][kind][step], DEV_N[rank]]];
  const main = Object.entries(st).sort((a, b) => b[1] - a[1])[0][0], fk = Object.keys(fx)[0];
  if (FX_CROP[fk] || fx.onHit || ["int", "mp", "res"].includes(main)) out.push([(FX_CROP[fk] || [])[isle - 1] || (isle === 1 && HIT_CROP[fx.onHit]) || THEME[d.id], rank === "ボス" ? 4 : 3]);
  if (rank === "ボス") out.push([isle === 3 ? "goldtree_leaf" : isle === 1 ? (step >= 2 && d.id === "crystal" ? "dreamtree_leaf" : "mandragora") : step >= 2 && STEP[d.id] === 2 ? "worldtree_leaf" : "dreamtree_leaf", 1]);
  return out;
}

// 決まった 能力（★ごと）。いまの 式（★ × 部位の 重み）の DEV_MULT 倍。HP は 4 倍・MP は 2 倍
export function devStats(form, st, star) {
  const kw = KINDS[FORMS[form].kind].w, out = {};
  for (const [k, w] of Object.entries(st)) { const v = DEV_MULT * MAIN[star] * w * kw * (k === "hp" ? 4 : k === "mp" ? 2 : 1); out[k] = Math.round(v) || Math.sign(v); }
  return out;
}

// 効果の 文
const UP = { up_atk: "ATK", up_def: "DEF", up_int: "INT", up_res: "RES", up_agi: "AGI", up_dex: "DEX" };
export function devFxText(fx) {
  if (fx.onHit) return `攻撃が 当たると ${ON_HIT * 100}% で ${EFFECTS[fx.onHit].label}`;
  if (fx.start) { const [id, n, t] = fx.start; return UP[id] ? `戦いの はじめに ${UP[id]} +${n}%（${t} ターン）` : `戦いの はじめに ${EFFECTS[id].label} ${n}`; }
  const [k, v] = Object.entries(fx)[0];
  return { crit: `会心 +${v}%`, critDmg: `会心の ダメージ +${v}%`, evade: `回避 +${v}%`, dmgCut: `受ける ダメージ −${v}%`, statusRes: `状態異常に 強い +${v}%`, healUp: `回復する 量 +${v}%`,
    itazuraDmg: `イタズラの ダメージ +${v}%`, wazaDmg: `技の ダメージ +${v}%`, drain: `与えた ダメージの ${v}% を 回復`, firstHit: `最初の 攻撃の ダメージ +${v * 100}%`,
    hpRegen: `毎ターン 最大 HP の ${v * 100}% を 回復`, mpRegen: `${Math.round(1 / v)} ターンごとに MP +1` }[k];
}

// ---------- ゲームに つなぐ（2026-11-04。鹿さん「全部反映しろ」）----------
// 装備の id は "dev.<敵の ツリー>.<0〜2>"（equip.js の baseOf が ここで 引く）。OP の 枠は 空いて 出る（ops: []。枠の 数は いまと 同じ ★ × 部位）
// どの 行き先の 敵か（ランクは 行き先の 中の 場所：foes 通常・rare 希少・boss ボス）
const WHERE = {};
for (const d of DUNGEONS_ALL) { d.foes.forEach((f) => (WHERE[f.tree] = { d, rank: "通常" })); WHERE[d.rare.tree] = { d, rank: "希少" }; WHERE[d.boss.tree] = { d, rank: "ボス" }; }
export const devWhere = (tree) => WHERE[tree] || null;
// 戦いの 効果：OP と 同じ 数の 物は 能力に 足す（itemStats）、ほかは パッシブの 入れ物（battle-sim.js の addP）
export const DEV_FX_STAT = new Set(["crit", "evade", "critDmg", "dmgCut", "statusRes", "healUp", "itazuraDmg", "wazaDmg", "drain", "mpRegen"]);
// 当てると 状態異常の 量（敵の 技の 小さめの 例に そろえた。Claude の 案）：[量, ターン]
export const HIT_AMT = { paralysis: [8], burn: [2], poison: [2], frostbite: [2], sickness: [2], weakness: [10], fatigue: [null, 1], blind: [null, 1], scald: [null, 1] };
export function devFxp(fx) {
  if (fx.onHit) { const [n, t] = HIT_AMT[fx.onHit] || [2]; return { onHitFx: [[fx.onHit, ON_HIT, n, t]] }; }
  if (fx.start) return { startFx: [fx.start.slice()] };
  if (fx.firstHit) return { firstHit: fx.firstHit };
  if (fx.hpRegen) return { hpRegen: fx.hpRegen };
  return null;
}
export const DEV_IDS = Object.keys(DEV).filter((t) => WHERE[t]).flatMap((t) => DEV[t].map((_, i) => `dev.${t}.${i}`));
// 型は 正しい id（DEV_IDS）の 分だけ はじめて 引いた ときに 1 回 作る。ほかの 文字は 覚えずに null（門番に でたらめな id が 来ても ふえない・「dev.e_hare.00」の ような 形も 通さない）
let DEV_BASE = null;
function devBuild() {
  DEV_BASE = new Map();
  for (const id of DEV_IDS) {
    const [, tree, i] = id.split("."), row = DEV[tree][Number(i)], w = WHERE[tree];
    DEV_BASE.set(id, { id, dev: true, tree, did: w.d.id, rank: w.rank, isle: w.d.isle || 1, slot: FORMS[row[1]].kind, form: row[1], name: row[0], main: row[2], st: row[2], fx: devFxText(row[3]), fxRaw: row[3],
      fxs: Object.fromEntries(Object.entries(row[3]).filter(([k]) => DEV_FX_STAT.has(k))), fxp: devFxp(row[3]) });
  }
}
export function devBase(id) {
  if (typeof id !== "string" || !id.startsWith("dev.")) return null;
  if (!DEV_BASE) devBuild();
  return DEV_BASE.get(id) || null;
}
// 作れる 作業台の Lv：前の Lv1〜4 は Lv1・20・50・80（施設の 作り直しの 決まり。facilities.js の band と 同じ 区切り）
// 島 3 の 段 5 は Lv90（★の 上限は Lv80 で ★5 なので、島 2 より 少し 上で 止める。Claude の 案、2026-11-04）
export const DEV_BENCH_LV = [0, 1, 20, 50, 80, 90];
export const devBenchLv = (tree) => { const w = WHERE[tree]; return w ? DEV_BENCH_LV[devBench(w.d)] : Infinity; };
// ★の 出やすさ：使った 結晶の 段（品質 1〜5）で 中身、作業台の Lv で 上限（benchStarMax の ★より 上は 上限に まとめる）。Claude の 案（2026-11-04）
export const DEV_STAR = { 1: { 1: 70, 2: 30 }, 2: { 1: 30, 2: 50, 3: 20 }, 3: { 2: 30, 3: 50, 4: 20 }, 4: { 3: 30, 4: 50, 5: 20 }, 5: { 4: 50, 5: 50 } };
export function devStarW(q, cap, topUp = 0) {
  const w = {};
  for (const [k, v] of Object.entries(DEV_STAR[Math.max(1, Math.min(5, q | 0))])) { const s = Math.min(cap, Number(k)); w[s] = (w[s] || 0) + v; }
  const top = Math.max(...Object.keys(w).map(Number)); w[top] *= 1 + topUp;   // 作業台の Lv で 高い ★が 少し 出やすい（作る・合成と 同じ）
  return w;
}
// 作るのに いる 物（結晶の id・数・添える 素材〈id〉・クレジット・作業台の Lv）
const MAT_ID = Object.fromEntries(Object.entries(MAT_NAME).map(([k, v]) => [v, k]));
export function devNeed(id) {
  const b = devBase(id); if (!b) return null;
  const row = DEV[b.tree][Number(id.split(".")[2])], w = WHERE[b.tree];
  const mats = [...row[4].map(([nm, n]) => [MAT_ID[nm] || nm, n]), ...devExtra(w.d, w.rank, row)];
  return { xtal: CRYSTAL[b.tree][0], n: CRYSTAL_N[w.rank], mats, credits: devCost(w.d.lv, w.rank), benchLv: devBenchLv(b.tree) };
}
