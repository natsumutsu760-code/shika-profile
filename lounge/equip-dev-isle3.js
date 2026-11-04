// 装備開発：ミカネル島（島 3）の 敵 85 体 × 3 ＝ 255（Claude の 案、2026-11-04。鹿さん「ミカネル島装備255個対応してください。」）
// 形と 決まりは 島 1・2 と 同じ（equip-dev.js の 頭・docs/mono-link-equip-dev.md）：
//   決まった 能力は 重みの 合計 1.0・敵 1 体に 3 つで 部位は かぶらない・効果は 小さく 1 つ・止める 状態異常（眠り・気絶・凍結）と 混乱・沈黙・腐敗・猛毒は かけない
//   止める テーマは 置きかえ：眠り・朦朧 → 疲労・気絶 → 麻痺・凍結 → 凍傷・腐敗・猛毒 → 毒・沈黙 → 体調不良・混乱 → 盲目
//   名前は 敵の テーマ・技・素材から。通常の 敵は 素朴に、希少と ボスは 少し 大きな 響き
// 1 行：[名前, 形, 決まった 能力の 重み, 効果, 添える 素材（その 行き先の 物）]
export const DEV3 = {
  // ミカの湖
  e3_mizuhebi: [
    ["毒牙の小刀", "stick", { atk: 0.6, dex: 0.4 }, { onHit: "poison" }, [["ミズヘビの皮", 1]]],
    ["蛇皮の腕巻き", "band", { dex: 0.6, agi: 0.4 }, { crit: 2 }, [["湖のアシ", 3]]],
    ["水草まぎれのずきん", "hood", { agi: 0.5, res: 0.5 }, { evade: 2 }, [["オアシスの水", 3]]]],
  e3_yumegaeru: [
    ["夕べの子守うた集", "book", { int: 0.6, mp: 0.4 }, { onHit: "fatigue" }, [["カエルの鳴きぶくろ", 1]]],
    ["葉かげのストール", "scarf", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["スイレン", 3]]],
    ["輪唱のブローチ", "brooch", { luk: 0.5, int: 0.5 }, { itazuraDmg: 3 }, [["湖のアシ", 3]]]],
  e3_oasiswani: [
    ["ワニ歯のこん棒", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "weakness" }, [["ワニの歯", 1]]],
    ["ワニ革の籠手", "gauntlet", { atk: 0.5, def: 0.5 }, { critDmg: 5 }, [["オアシスの水", 2]]],
    ["ぬかるみの脚絆", "socks", { hp: 0.5, atk: 0.5 }, { firstHit: 0.1 }, [["湖のアシ", 2]]]],
  e3_flamingo: [
    ["桃色の羽扇", "fan", { res: 0.5, int: 0.5 }, { start: ["regen", 10] }, [["桃色の羽", 1]]],
    ["浅瀬の舞姫の足輪", "socks", { hp: 0.5, res: 0.5 }, { hpRegen: 0.01 }, [["スイレン", 3]]],
    ["桃色の羽冠", "hat", { res: 0.6, int: 0.4 }, { healUp: 5 }, [["ミカの湖の真珠", 1]]]],
  e3_boss_namazu: [
    ["湖底ゆらしの大槌", "hammer", { atk: 0.6, def: 0.4 }, { onHit: "paralysis" }, [["大ナマズのひげ", 1], ["オアシスの水", 3]]],
    ["湖底の泥の大盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["armor", 10] }, [["大ナマズのひげ", 1]]],
    ["ミカの主の首飾り", "necklace", { hp: 0.6, def: 0.4 }, { dmgCut: 2 }, [["ミカの湖の真珠", 1]]]],
  // 涸れ川の谷
  e3_jackal: [
    ["ジャッカル牙の短刀", "stick", { atk: 0.7, agi: 0.3 }, { critDmg: 5 }, [["ジャッカルの牙", 1]]],
    ["群れ狩りの首輪", "necklace", { hp: 0.6, atk: 0.4 }, { start: ["up_atk", 10, 3] }, [["涸れ川の小石", 3]]],
    ["砂走りの足袋", "sneakers", { agi: 0.7, atk: 0.3 }, { firstHit: 0.1 }, [["干からびた粘土", 2]]]],
  e3_honeuo: [
    ["魚骨の杖", "stick", { int: 0.7, mp: 0.3 }, { onHit: "poison" }, [["干からびた魚の骨", 1]]],
    ["よどみの護符", "amulet", { mp: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["貝の化石", 2]]],
    ["涸れ川のずきん", "hood", { res: 0.6, int: 0.4 }, { statusRes: 5 }, [["干からびた粘土", 3]]]],
  e3_togetokage: [
    ["とげうろこの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["とげのうろこ", 1]]],
    ["とげ皮の籠手", "gauntlet", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["涸れ川の小石", 3]]],
    ["日なたぼっこの帽子", "hat", { def: 0.5, hp: 0.5 }, { statusRes: 5 }, [["砂漠のセージ", 3]]]],
  e3_amagumo: [
    ["恵みの雨の杖", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["雨雲のかけら", 1]]],
    ["雲のゆりかごの肩掛け", "scarf", { mp: 0.6, res: 0.4 }, { mpRegen: 0.2 }, [["砂漠のセージ", 3]]],
    ["夕立の腕輪", "bangle", { res: 0.6, int: 0.4 }, { hpRegen: 0.01 }, [["水脈の石", 1]]]],
  e3_boss_mukade: [
    ["千足の大あご", "hammer", { atk: 0.7, dex: 0.3 }, { onHit: "poison" }, [["大ムカデのあご", 1], ["涸れ川の小石", 3]]],
    ["千の足の脚甲", "boots", { def: 0.5, agi: 0.5 }, { evade: 2 }, [["大ムカデのあご", 1]]],
    ["毒あごの指輪", "ring", { dex: 0.5, atk: 0.5 }, { crit: 2 }, [["水脈の石", 1]]]],
  // 白い塩原
  e3_shiomushi: [
    ["塩殻の兜", "helmet", { def: 0.6, hp: 0.4 }, { start: ["armor", 10] }, [["塩の殻", 1]]],
    ["塩の殻のすね当て", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["岩塩", 3]]],
    ["塩の殻の首当て", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["白い泥", 3]]]],
  e3_saltslime: [
    ["しょっぱい泡玉", "balloon", { int: 0.7, mp: 0.3 }, { onHit: "fatigue" }, [["塩のゼリー", 1]]],
    ["ぷるぷるの腕輪", "bangle", { res: 0.5, mp: 0.5 }, { mpRegen: 0.2 }, [["塩草", 3]]],
    ["塩なめのお守り", "amulet", { mp: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["岩塩", 2]]]],
  e3_mirafox: [
    ["かげろうの尾飾り", "keychain", { agi: 0.6, dex: 0.4 }, { evade: 2 }, [["蜃気楼の毛", 1]]],
    ["化かしの手袋", "glove", { dex: 0.6, agi: 0.4 }, { crit: 2 }, [["塩草", 3]]],
    ["白ギツネの足袋", "sneakers", { agi: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["白い泥", 2]]]],
  e3_saltfairy: [
    ["白いきらめきの杖", "stick", { int: 0.6, res: 0.4 }, { start: ["barrier", 1] }, [["塩のきらめき", 1]]],
    ["塩の結界の書", "book", { int: 0.5, res: 0.5 }, { healUp: 5 }, [["塩の結晶", 3]]],
    ["塩の女王のティアラ", "hat", { res: 0.6, int: 0.4 }, { statusRes: 5 }, [["塩のバラ", 1]]]],
  e3_boss_pillar: [
    ["塩柱の大盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["ward", 10] }, [["塩柱のかけら", 1], ["岩塩", 3]]],
    ["番人の誓いの首飾り", "necklace", { hp: 0.6, def: 0.4 }, { dmgCut: 2 }, [["塩柱のかけら", 1]]],
    ["白柱のこて", "gauntlet", { def: 0.6, atk: 0.4 }, { statusRes: 5 }, [["塩のバラ", 1]]]],
  // 赤岩の台地
  e3_hagetaka: [
    ["えぐり爪の手甲", "glove", { dex: 0.7, atk: 0.3 }, { onHit: "weakness" }, [["ハゲタカの羽", 1]]],
    ["上昇気流の羽扇", "fan", { agi: 0.5, dex: 0.5 }, { evade: 2 }, [["黄土", 3]]],
    ["赤い空の首飾り", "necklace", { hp: 0.6, agi: 0.4 }, { critDmg: 5 }, [["赤い砂岩", 2]]]],
  e3_iwayagi: [
    ["岩ヤギの角の槌", "hammer", { atk: 0.7, dex: 0.3 }, { onHit: "paralysis" }, [["岩ヤギの角", 1]]],
    ["崖のぼりの靴", "sneakers", { agi: 0.6, atk: 0.4 }, { firstHit: 0.1 }, [["砂鉄", 2]]],
    ["頭突きの兜", "helmet", { def: 0.6, atk: 0.4 }, { dmgCut: 2 }, [["赤い砂岩", 3]]]],
  e3_redgolem: [
    ["赤岩のこて", "gauntlet", { def: 0.6, atk: 0.4 }, { dmgCut: 2 }, [["赤岩の芯", 1]]],
    ["仕返しの岩盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["砂鉄", 3]]],
    ["岩芯の首当て", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["黄土", 2]]]],
  e3_sunsetlizard: [
    ["夕日追いの疾走靴", "sneakers", { agi: 0.7, dex: 0.3 }, { start: ["up_agi", 10, 3] }, [["夕焼けのうろこ", 1]]],
    ["夕焼けうろこの細剣", "stick", { atk: 0.5, agi: 0.5 }, { firstHit: 0.1 }, [["サボテン", 3]]],
    ["茜色のうろこの指輪", "ring", { dex: 0.5, agi: 0.5 }, { crit: 2 }, [["火のめのう", 1]]]],
  e3_boss_roc: [
    ["大鷲の爪の大槍", "stick", { atk: 0.7, dex: 0.3 }, { start: ["pierce", 10] }, [["大鷲の大爪", 1], ["砂鉄", 3]]],
    ["赤岩の空の王冠", "hat", { def: 0.5, agi: 0.5 }, { critDmg: 5 }, [["大鷲の大爪", 1]]],
    ["火のめのうのブローチ", "brooch", { luk: 0.6, atk: 0.4 }, { firstHit: 0.1 }, [["火のめのう", 1]]]],
  // 巨竜の化石
  e3_raptor: [
    ["かぎ爪の手甲", "gauntlet", { atk: 0.6, dex: 0.4 }, { onHit: "fatigue" }, [["ラプトルの骨", 1]]],
    ["骨のすね当て", "sneakers", { agi: 0.6, atk: 0.4 }, { firstHit: 0.1 }, [["化石の骨", 3]]],
    ["狩人の骨の首飾り", "necklace", { hp: 0.6, atk: 0.4 }, { critDmg: 5 }, [["骨の粉", 2]]]],
  e3_bonewisp: [
    ["鬼火のランタン", "lantern", { mp: 0.5, dex: 0.5 }, { onHit: "sickness" }, [["骨の鬼火", 1]]],
    ["声なきずきん", "hood", { agi: 0.5, res: 0.5 }, { evade: 2 }, [["古代のシダ", 3]]],
    ["冷たい手のゆびわ", "ring", { dex: 0.6, agi: 0.4 }, { crit: 2 }, [["骨の粉", 3]]]],
  e3_amberbug: [
    ["こはくの殻の盾", "shield", { def: 1.2, agi: -0.2 }, { dmgCut: 2 }, [["こはくのかたまり", 1]]],
    ["こはくの兜", "helmet", { def: 0.6, hp: 0.4 }, { start: ["ward", 10] }, [["こはくのかけら", 3]]],
    ["こはくのペンダント", "necklace", { hp: 0.6, def: 0.4 }, { statusRes: 5 }, [["古代のシダ", 2]]]],
  e3_dragonegg: [
    ["目ざめの光の杖", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["竜の卵の殻", 1]]],
    ["ゆりかごの殻の腕輪", "bangle", { res: 0.6, hp: 0.4 }, { hpRegen: 0.01 }, [["こはくのかけら", 3]]],
    ["命のぬくもりのお守り", "amulet", { mp: 0.5, res: 0.5 }, { start: ["regen", 10] }, [["竜の心臓石", 1]]]],
  e3_boss_bonedragon: [
    ["竜の死の息の書", "book", { int: 0.6, mp: 0.4 }, { onHit: "poison" }, [["竜の化石", 1], ["骨の粉", 3]]],
    ["骨をつなぐ脚甲", "boots", { hp: 0.5, int: 0.5 }, { itazuraDmg: 3 }, [["竜の化石", 1]]],
    ["竜骨の大杖", "stick", { int: 0.7, hp: 0.3 }, { mpRegen: 0.2 }, [["竜の心臓石", 1]]]],
  // セラン王墓
  e3_mummy: [
    ["呪い包帯のこて", "gauntlet", { def: 0.6, hp: 0.4 }, { onHit: "sickness" }, [["古い包帯", 1]]],
    ["包帯の首巻き", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["古い香", 3]]],
    ["包帯の脚絆", "socks", { hp: 0.5, def: 0.5 }, { dmgCut: 2 }, [["パピルス", 2]]]],
  e3_scarab: [
    ["黄金の角の短剣", "stick", { dex: 0.5, atk: 0.5 }, { onHit: "poison" }, [["黄金スカラベの殻", 1]]],
    ["太陽ころがしの腕輪", "band", { agi: 0.6, dex: 0.4 }, { firstHit: 0.1 }, [["金ぱく", 3]]],
    ["黄金虫のブローチ", "brooch", { luk: 0.6, dex: 0.4 }, { crit: 2 }, [["ラピスラズリ", 2]]]],
  e3_cursepot: [
    ["けむり立つ香炉", "lantern", { int: 0.5, mp: 0.5 }, { onHit: "blind" }, [["呪いの壺のかけら", 1]]],
    ["封じの布帽子", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["古い香", 3]]],
    ["壺のかけらの首飾り", "necklace", { mp: 0.6, int: 0.4 }, { mpRegen: 0.2 }, [["パピルス", 3]]]],
  e3_tombcat: [
    ["墓守の鈴の首輪", "necklace", { hp: 0.5, res: 0.5 }, { healUp: 5 }, [["墓守ネコの鈴", 1]]],
    ["王の眠りの祈祷書", "book", { int: 0.6, res: 0.4 }, { statusRes: 5 }, [["パピルス", 3]]],
    ["ラピスの猫目の指輪", "ring", { luk: 0.5, res: 0.5 }, { evade: 2 }, [["セラン王の印章", 1]]]],
  e3_boss_sphinx: [
    ["なぞの守り手の杖", "stick", { int: 0.7, mp: 0.3 }, { onHit: "sickness" }, [["スフィンクスの石", 1], ["金ぱく", 3]]],
    ["スフィンクスの頭飾り", "hat", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["スフィンクスの石", 1]]],
    ["石の門番の脚甲", "boots", { def: 0.5, int: 0.5 }, { statusRes: 5 }, [["セラン王の印章", 1]]]],
  // ノルの砦
  e3_sandguard: [
    ["砂岩の盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["ward", 10] }, [["砂岩の盾のかけら", 1]]],
    ["衛兵の兜", "helmet", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["砦のれんが", 3]]],
    ["衛兵のすね当て", "boots", { def: 0.6, res: 0.4 }, { statusRes: 5 }, [["さびた槍", 2]]]],
  e3_ghostarcher: [
    ["亡霊の弓", "stick", { dex: 0.6, atk: 0.4 }, { onHit: "paralysis" }, [["亡霊の矢", 1]]],
    ["弓引きの手袋", "glove", { dex: 0.7, agi: 0.3 }, { crit: 2 }, [["古い旗", 3]]],
    ["狙いの指輪", "ring", { dex: 0.5, luk: 0.5 }, { firstHit: 0.1 }, [["さびた槍", 2]]]],
  e3_sapper: [
    ["すすけた銃剣", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "burn" }, [["しめった火薬", 1]]],
    ["火薬袋の首ひも", "tie", { hp: 0.6, atk: 0.4 }, { firstHit: 0.1 }, [["硝石", 3]]],
    ["火打ちの手甲", "gauntlet", { atk: 0.6, def: 0.4 }, { critDmg: 5 }, [["砦のれんが", 2]]]],
  e3_bugler: [
    ["進軍の譜面", "book", { int: 0.5, res: 0.5 }, { crit: 2 }, [["らっぱの吹き口", 1]]],
    ["はげましの襟巻き", "scarf", { mp: 0.6, res: 0.4 }, { healUp: 5 }, [["古い旗", 3]]],
    ["らっぱ吹きの羽根帽", "hat", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["ノルの勲章", 1]]]],
  e3_boss_general: [
    ["鎧くだきの大剣", "hammer", { atk: 0.7, dex: 0.3 }, { start: ["pierce", 10] }, [["将軍の紋章", 1], ["さびた槍", 3]]],
    ["将軍の紋章の指輪", "ring", { atk: 0.5, luk: 0.5 }, { start: ["up_atk", 10, 3] }, [["将軍の紋章", 1]]],
    ["砂の将軍の軍靴", "boots", { def: 0.5, atk: 0.5 }, { dmgCut: 2 }, [["ノルの勲章", 1]]]],
  // 隊商の野営地
  e3_camel: [
    ["ラクダ毛の首巻き", "tie", { hp: 0.7, def: 0.3 }, { start: ["regen", 10] }, [["ラクダの毛", 1]]],
    ["こぶの水のお守り", "amulet", { hp: 0.6, res: 0.4 }, { hpRegen: 0.01 }, [["ラクダの乳", 3]]],
    ["長旅の脚絆", "socks", { hp: 0.5, def: 0.5 }, { statusRes: 5 }, [["織物", 2]]]],
  e3_jerboa: [
    ["トビネズミのしっぽ飾り", "keychain", { agi: 0.6, luk: 0.4 }, { evade: 2 }, [["トビネズミのしっぽ", 1]]],
    ["跳ね足のサンダル", "sneakers", { agi: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["織物", 3]]],
    ["とびげりの腕輪", "band", { agi: 0.5, dex: 0.5 }, { onHit: "fatigue" }, [["香辛料", 2]]]],
  e3_bandit: [
    ["砂賊の曲刀", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "weakness" }, [["砂賊の覆面", 1]]],
    ["砂よけの覆面", "hood", { agi: 0.5, atk: 0.5 }, { crit: 2 }, [["織物", 3]]],
    ["盗っ人の手袋", "glove", { dex: 0.6, atk: 0.4 }, { critDmg: 5 }, [["香辛料", 3]]]],
  e3_fortune: [
    ["星読みの水晶玉", "lantern", { int: 0.5, res: 0.5 }, { statusRes: 5 }, [["占いのカード", 1]]],
    ["幸運のまじないのブローチ", "brooch", { luk: 0.6, res: 0.4 }, { healUp: 5 }, [["隊商の茶葉", 3]]],
    ["星読みの頭布", "hood", { res: 0.6, int: 0.4 }, { mpRegen: 0.2 }, [["隊商の地図", 1]]]],
  e3_boss_bodyguard: [
    ["一刀両断の太刀", "stick", { atk: 0.7, dex: 0.3 }, { critDmg: 5 }, [["用心棒の刀のつば", 1], ["香辛料", 3]]],
    ["受け流しの鉄扇", "fan", { agi: 0.5, def: 0.5 }, { start: ["thorns", 10] }, [["用心棒の刀のつば", 1]]],
    ["用心棒のお守り袋", "necklace", { hp: 0.6, atk: 0.4 }, { dmgCut: 2 }, [["隊商の地図", 1]]]],
  // 大砂丘
  e3_sunamoguri: [
    ["砂かけの腕輪", "band", { agi: 0.6, dex: 0.4 }, { onHit: "blind" }, [["砂のうろこ", 1]]],
    ["砂もぐりのずきん", "hood", { agi: 0.6, res: 0.4 }, { evade: 2 }, [["細かい砂", 3]]],
    ["砂のうろこの足袋", "sneakers", { agi: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["砂丘の草", 2]]]],
  e3_dunescorpion: [
    ["サソリの毒針の細剣", "stick", { atk: 0.6, dex: 0.4 }, { onHit: "poison" }, [["サソリの毒針", 1]]],
    ["サソリ殻のこて", "gauntlet", { atk: 0.5, def: 0.5 }, { critDmg: 5 }, [["砂漠のガラス", 3]]],
    ["はさみ飾りの指輪", "ring", { dex: 0.5, atk: 0.5 }, { crit: 2 }, [["細かい砂", 2]]]],
  e3_hotsand: [
    ["熱砂のランタン", "lantern", { mp: 0.5, int: 0.5 }, { onHit: "scald" }, [["熱い砂", 1]]],
    ["かげろうの肩布", "scarf", { mp: 0.7, int: 0.3 }, { itazuraDmg: 3 }, [["太陽の石", 2]]],
    ["真昼の日よけ帽", "hat", { res: 0.6, int: 0.4 }, { statusRes: 5 }, [["砂丘の草", 3]]]],
  e3_desertrose: [
    ["砂の花の杖", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["砂漠のバラ", 1]]],
    ["砂の花びらのブローチ", "brooch", { luk: 0.5, res: 0.5 }, { start: ["ward", 10] }, [["砂漠のガラス", 3]]],
    ["花吹雪の扇", "fan", { res: 0.6, int: 0.4 }, { start: ["regen", 10] }, [["砂の真珠", 1]]]],
  e3_boss_sandworm: [
    ["大ワームの皮の首当て", "tie", { hp: 0.7, atk: 0.3 }, { onHit: "paralysis" }, [["サンドワームの皮", 1], ["細かい砂", 3]]],
    ["うねる砂の脚甲", "boots", { def: 0.5, atk: 0.5 }, { dmgCut: 2 }, [["サンドワームの皮", 1]]],
    ["砂の真珠の大指輪", "ring", { atk: 0.5, luk: 0.5 }, { start: ["up_atk", 10, 3] }, [["砂の真珠", 1]]]],
  // 風の峡谷
  e3_falcon: [
    ["風切り羽の根付", "keychain", { agi: 0.6, dex: 0.4 }, { start: ["up_agi", 10, 3] }, [["ハヤブサの羽", 1]]],
    ["急降下の手袋", "glove", { dex: 0.6, agi: 0.4 }, { firstHit: 0.1 }, [["鷹の綿毛", 3]]],
    ["疾風の羽ずきん", "hood", { agi: 0.6, res: 0.4 }, { evade: 2 }, [["風の石", 2]]]],
  e3_leopard: [
    ["ヒョウ爪の手斧", "hammer", { atk: 0.7, dex: 0.3 }, { critDmg: 5 }, [["ヒョウの毛皮", 1]]],
    ["しのび足の毛皮靴", "sneakers", { agi: 0.6, atk: 0.4 }, { crit: 2 }, [["峡谷の苔", 2]]],
    ["ヒョウの首輪", "necklace", { hp: 0.6, atk: 0.4 }, { start: ["up_atk", 10, 3] }, [["峡谷の苔", 3]]]],
  e3_twister: [
    ["つむじ風の扇", "fan", { int: 0.5, agi: 0.5 }, { onHit: "blind" }, [["つむじ風の芯", 1]]],
    ["風あつめの帽子", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["風の石", 3]]],
    ["渦巻く風の肩布", "scarf", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["赤い結晶", 2]]]],
  e3_chimebat: [
    ["風鈴の音のお守り", "amulet", { mp: 0.5, res: 0.5 }, { healUp: 5 }, [["風鈴コウモリの羽", 1]]],
    ["涼しい音の腕輪", "bangle", { res: 0.6, int: 0.4 }, { start: ["up_agi", 10, 3] }, [["鷹の綿毛", 3]]],
    ["風鈴の音色の譜", "book", { int: 0.6, res: 0.4 }, { statusRes: 5 }, [["風の竪琴", 1]]]],
  e3_boss_griffon: [
    ["風獅子の爪の大剣", "stick", { atk: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["風獅子の羽", 1], ["風の石", 3]]],
    ["空の王座の脚甲", "boots", { agi: 0.6, def: 0.4 }, { evade: 2 }, [["風獅子の羽", 1]]],
    ["空の王の紋章", "brooch", { luk: 0.5, atk: 0.5 }, { critDmg: 5 }, [["風の竪琴", 1]]]],
  // エナ遺跡
  e3_gargoyle: [
    ["ガーゴイルの石爪", "glove", { dex: 0.6, atk: 0.4 }, { crit: 2 }, [["ガーゴイルの角", 1]]],
    ["石のまなざしの兜", "helmet", { def: 0.5, dex: 0.5 }, { dmgCut: 2 }, [["遺跡のタイル", 3]]],
    ["ガーゴイルの角の指輪", "ring", { dex: 0.5, agi: 0.5 }, { firstHit: 0.1 }, [["青いガラス", 2]]]],
  e3_saltjelly: [
    ["しびれ触手のむち", "stick", { int: 0.6, dex: 0.4 }, { onHit: "paralysis" }, [["塩クラゲのかさ", 1]]],
    ["ふわりかさの帽子", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["内海の塩", 3]]],
    ["塩水のお守り", "amulet", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["塩のサンゴ", 2]]]],
  e3_stonesoldier: [
    ["千年の石盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["armor", 10] }, [["古代の石", 1]]],
    ["石兵の脚甲", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["遺跡のタイル", 3]]],
    ["見張りの石の首当て", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["内海の塩", 2]]]],
  e3_scribe: [
    ["消えない文字の書", "book", { int: 0.6, res: 0.4 }, { statusRes: 5 }, [["古代の巻物", 1]]],
    ["古代の書記の筆", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["青いガラス", 3]]],
    ["守りの文字の腕輪", "bangle", { res: 0.6, int: 0.4 }, { start: ["ward", 10] }, [["エナの石板", 1]]]],
  e3_boss_priestess: [
    ["眠りの舞の首飾り", "necklace", { hp: 0.5, int: 0.5 }, { onHit: "fatigue" }, [["巫女の鈴", 1], ["塩のサンゴ", 3]]],
    ["舞い手の足袋", "socks", { hp: 0.5, int: 0.5 }, { healUp: 5 }, [["巫女の鈴", 1]]],
    ["エナの巫女のブローチ", "brooch", { luk: 0.5, int: 0.5 }, { itazuraDmg: 3 }, [["エナの石板", 1]]]],
  // 岩の大門
  e3_gatespider: [
    ["糸あやつりの手袋", "glove", { dex: 0.6, agi: 0.4 }, { firstHit: 0.1 }, [["大門グモの糸", 1]]],
    ["大門グモの糸の襟巻き", "scarf", { agi: 0.5, hp: 0.5 }, { evade: 2 }, [["岩苔", 3]]],
    ["網目のずきん", "hood", { agi: 0.6, res: 0.4 }, { crit: 2 }, [["崖の花", 2]]]],
  e3_troll: [
    ["苔むしたこん棒", "hammer", { atk: 0.8, hp: 0.2 }, { onHit: "fatigue" }, [["トロールのこん棒", 1]]],
    ["大足のわらじ", "socks", { hp: 0.6, atk: 0.4 }, { hpRegen: 0.01 }, [["花こう岩", 3]]],
    ["重い一撃のこて", "gauntlet", { atk: 0.6, def: 0.4 }, { critDmg: 5 }, [["大門の石", 2]]]],
  e3_mossgolem: [
    ["苔むした盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["barrier", 1] }, [["ゴーレムの苔", 1]]],
    ["苔むす兜", "helmet", { def: 0.6, hp: 0.4 }, { start: ["regen", 10] }, [["岩苔", 3]]],
    ["苔の胞子のお守り", "amulet", { hp: 0.5, res: 0.5 }, { statusRes: 5 }, [["崖の花", 2]]]],
  e3_hermit: [
    ["隠者の戒めの杖", "stick", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["隠者の薬草", 1]]],
    ["静けさの数珠", "ring", { res: 0.5, luk: 0.5 }, { mpRegen: 0.2 }, [["崖の花", 3]]],
    ["岩穴の祈りの書", "book", { int: 0.5, res: 0.5 }, { statusRes: 5 }, [["花こう岩", 3]]]],
  e3_boss_gategiant: [
    ["巨人の首当て", "tie", { hp: 0.7, def: 0.3 }, { start: ["thorns", 10] }, [["巨人のこぶしの石", 1], ["大門の石", 3]]],
    ["大門の守りの脚甲", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["巨人のこぶしの石", 1]]],
    ["かなめ石のブローチ", "brooch", { luk: 0.5, def: 0.5 }, { start: ["armor", 10] }, [["大門のかなめ石", 1]]]],
  // ティルカ灯台
  e3_torchknight: [
    ["灯火の剣", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "burn" }, [["灯火の騎士の紋", 1]]],
    ["見回り騎士の兜", "helmet", { def: 0.5, atk: 0.5 }, { firstHit: 0.1 }, [["灯台の油", 3]]],
    ["騎士の紋の籠手", "gauntlet", { atk: 0.6, def: 0.4 }, { critDmg: 5 }, [["古い綱", 2]]]],
  e3_bigcrab: [
    ["赤いはさみの盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["thorns", 10] }, [["大ガニのはさみ", 1]]],
    ["岩場のカニ殻の脚甲", "boots", { def: 0.6, hp: 0.4 }, { dmgCut: 2 }, [["古い綱", 3]]],
    ["とげ殻の首当て", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["合図の鏡", 2]]]],
  e3_lightsprite: [
    ["まぶしい光のランタン", "lantern", { int: 0.5, mp: 0.5 }, { onHit: "blind" }, [["光の粒", 1]]],
    ["光あつめの指輪", "ring", { int: 0.5, luk: 0.5 }, { itazuraDmg: 3 }, [["レンズのガラス", 3]]],
    ["光の粒の肩布", "scarf", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["灯台の油", 2]]]],
  e3_oldkeeper: [
    ["灯台守の杖", "stick", { int: 0.6, res: 0.4 }, { start: ["barrier", 1] }, [["灯台守のランプ", 1]]],
    ["灯台守の古帽子", "cap", { res: 0.6, int: 0.4 }, { healUp: 5 }, [["合図の鏡", 3]]],
    ["絶えぬ灯のお守り", "amulet", { mp: 0.5, res: 0.5 }, { hpRegen: 0.01 }, [["灯台の油", 3]]]],
  e3_boss_lightwarden: [
    ["光の番人の腕輪", "bangle", { int: 0.6, res: 0.4 }, { onHit: "scald" }, [["大レンズのかけら", 1], ["レンズのガラス", 3]]],
    ["灯台の番人の脚甲", "boots", { res: 0.5, int: 0.5 }, { statusRes: 5 }, [["大レンズのかけら", 1]]],
    ["消えない灯のブローチ", "brooch", { luk: 0.5, int: 0.5 }, { start: ["up_int", 10, 3] }, [["消えない灯", 1]]]],
  // セランの巨像
  e3_stonechip: [
    ["石片の兜", "helmet", { def: 0.6, hp: 0.4 }, { start: ["ward", 10] }, [["巨像の石片", 1]]],
    ["石片の脚甲", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["巨像の砂", 3]]],
    ["石片の首当て", "tie", { hp: 0.7, def: 0.3 }, { statusRes: 5 }, [["青銅のかけら", 2]]]],
  e3_royalguard: [
    ["近衛の槍", "stick", { atk: 0.7, dex: 0.3 }, { start: ["pierce", 10] }, [["近衛の槍の穂", 1]]],
    ["近衛の青銅かぶと", "hat", { def: 0.5, atk: 0.5 }, { firstHit: 0.1 }, [["青銅のかけら", 3]]],
    ["近衛の籠手", "gauntlet", { atk: 0.6, def: 0.4 }, { critDmg: 5 }, [["王の布", 2]]]],
  e3_sandmage: [
    ["夜の冷気の書", "book", { int: 0.6, mp: 0.4 }, { onHit: "frostbite" }, [["夜の砂", 1]]],
    ["砂のまじないの頭巾", "hood", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["星の図", 3]]],
    ["夜の砂の足袋", "socks", { hp: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["巨像の砂", 2]]]],
  e3_kingshadow: [
    ["王の影の襟巻き", "scarf", { agi: 0.6, mp: 0.4 }, { evade: 2 }, [["王の影のかけら", 1]]],
    ["影の爪の手袋", "glove", { dex: 0.6, agi: 0.4 }, { crit: 2 }, [["巨像の砂", 3]]],
    ["影渡りの靴", "sneakers", { agi: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["王の布", 3]]]],
  e3_boss_colossus: [
    ["王の大鉄槌", "hammer", { atk: 0.6, def: 0.4 }, { onHit: "paralysis" }, [["巨像の核", 1], ["青銅のかけら", 3]]],
    ["目ざめた王の大盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["armor", 10] }, [["巨像の核", 1]]],
    ["巨像の王の指輪", "ring", { def: 0.5, luk: 0.5 }, { dmgCut: 2 }, [["セラン王の冠", 1]]]],
  // 沈む砂の穴（かくし）
  e3_antlion: [
    ["あごの手甲", "glove", { dex: 0.6, atk: 0.4 }, { firstHit: 0.1 }, [["アリジゴクのあご", 1]]],
    ["すりばち歩きの靴", "sneakers", { agi: 0.5, dex: 0.5 }, { evade: 2 }, [["流砂", 3]]],
    ["すりばちの頭巾", "hood", { agi: 0.5, res: 0.5 }, { crit: 2 }, [["底の砂", 2]]]],
  e3_sandcatfish: [
    ["砂ナマズの皮盾", "shield", { def: 1.2, agi: -0.2 }, { start: ["regen", 10] }, [["流砂ナマズのひげ", 1]]],
    ["ナマズひげの首当て", "tie", { hp: 0.7, def: 0.3 }, { hpRegen: 0.01 }, [["流砂", 3]]],
    ["沈んだ土器のかぶと", "hat", { def: 0.5, hp: 0.5 }, { statusRes: 5 }, [["沈んだ土器", 2]]]],
  e3_sandmouth: [
    ["砂のささやきの書", "book", { int: 0.6, mp: 0.4 }, { onHit: "sickness" }, [["沈む砂", 1]]],
    ["砂の根の腕輪", "bangle", { res: 0.5, int: 0.5 }, { itazuraDmg: 3 }, [["砂の根", 3]]],
    ["穴の底の肩布", "scarf", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["底の砂", 3]]]],
  e3_sandfirefly: [
    ["ほのかな光のランタン", "lantern", { mp: 0.5, res: 0.5 }, { healUp: 5 }, [["砂ホタルの光", 1]]],
    ["光のまゆの帽子", "cap", { res: 0.6, int: 0.4 }, { start: ["ward", 10] }, [["砂の根", 3]]],
    ["ホタル火の足輪", "socks", { hp: 0.5, res: 0.5 }, { hpRegen: 0.01 }, [["流砂", 2]]]],
  e3_boss_antlion: [
    ["大あごの大鎌", "stick", { atk: 0.7, dex: 0.3 }, { onHit: "weakness" }, [["大アリジゴクの殻", 1], ["流砂", 3]]],
    ["大アリジゴク殻のこて", "gauntlet", { atk: 0.5, def: 0.5 }, { critDmg: 5 }, [["大アリジゴクの殻", 1]]],
    ["底なしの石の指輪", "ring", { atk: 0.5, luk: 0.5 }, { drain: 1 }, [["底なしの石", 1]]]],
  // 月下の流砂（かくし）
  e3_moonscorpion: [
    ["月光の針の腕輪", "band", { dex: 0.6, agi: 0.4 }, { onHit: "poison" }, [["月光サソリの針", 1]]],
    ["月かげの忍び靴", "sneakers", { agi: 0.7, dex: 0.3 }, { evade: 2 }, [["銀の砂", 3]]],
    ["銀砂の頭巾", "hood", { agi: 0.5, res: 0.5 }, { crit: 2 }, [["夜露", 2]]]],
  e3_nightsnake: [
    ["砂ヘビの牙の短剣", "stick", { atk: 0.7, agi: 0.3 }, { onHit: "fatigue" }, [["夜の砂ヘビの皮", 1]]],
    ["とぐろの脚絆", "socks", { hp: 0.5, atk: 0.5 }, { firstHit: 0.1 }, [["月の砂", 3]]],
    ["夜ヘビの首巻き", "tie", { hp: 0.6, atk: 0.4 }, { critDmg: 5 }, [["夜の花", 2]]]],
  e3_moonsprite: [
    ["月の冷光の扇", "fan", { int: 0.5, res: 0.5 }, { onHit: "frostbite" }, [["月の光のかけら", 1]]],
    ["月見の帽子", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["夜露", 3]]],
    ["雲がくれのお守り", "amulet", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["銀の砂", 2]]]],
  e3_moonrabbit: [
    ["月うさぎのきね", "hammer", { int: 0.6, res: 0.4 }, { healUp: 5 }, [["月のおもち", 1]]],
    ["満月の首飾り", "necklace", { hp: 0.5, res: 0.5 }, { start: ["regen", 10] }, [["夜の花", 3]]],
    ["月の加護の腕輪", "bangle", { res: 0.6, int: 0.4 }, { statusRes: 5 }, [["夜露", 3]]]],
  e3_boss_moonserpent: [
    ["月飲みの大蛇の書", "book", { int: 0.6, mp: 0.4 }, { onHit: "sickness" }, [["月下の大蛇の鱗", 1], ["月の砂", 3]]],
    ["大蛇の鱗の脚甲", "boots", { res: 0.5, int: 0.5 }, { dmgCut: 2 }, [["月下の大蛇の鱗", 1]]],
    ["月の涙のブローチ", "brooch", { luk: 0.5, int: 0.5 }, { start: ["up_int", 10, 3] }, [["月の涙", 1]]]],
  // 風の目（かくし）
  e3_stormsprite: [
    ["稲光の腕輪", "bangle", { int: 0.6, res: 0.4 }, { onHit: "paralysis" }, [["嵐の芯", 1]]],
    ["雷雲の帽子", "cap", { res: 0.6, int: 0.4 }, { itazuraDmg: 3 }, [["雷雲", 3]]],
    ["雲よびの肩布", "scarf", { mp: 0.7, int: 0.3 }, { mpRegen: 0.2 }, [["雷のかけら", 2]]]],
  e3_galebird: [
    ["はやての手袋", "glove", { dex: 0.6, agi: 0.4 }, { onHit: "fatigue" }, [["ハヤテドリの羽", 1]]],
    ["はやて羽の靴", "sneakers", { agi: 0.7, dex: 0.3 }, { firstHit: 0.1 }, [["風の真珠", 3]]],
    ["風つかみの頭巾", "hood", { agi: 0.6, res: 0.4 }, { evade: 2 }, [["渦の砂", 2]]]],
  e3_windwarden: [
    ["風の壁の盾", "shield", { def: 1.2, agi: -0.2 }, { statusRes: 5 }, [["風の壁の芯", 1]]],
    ["風よけの脚甲", "boots", { def: 0.6, res: 0.4 }, { dmgCut: 2 }, [["雷雲", 3]]],
    ["風くるみの首当て", "tie", { hp: 0.7, def: 0.3 }, { start: ["ward", 10] }, [["渦の砂", 3]]]],
  e3_windbird: [
    ["そよ風の羽扇", "fan", { res: 0.5, int: 0.5 }, { mpRegen: 0.2 }, [["そよ風の羽", 1]]],
    ["風のうたの腕輪", "bangle", { res: 0.6, int: 0.4 }, { healUp: 5 }, [["風の真珠", 3]]],
    ["風の小鳥の羽飾り", "hat", { res: 0.5, int: 0.5 }, { start: ["regen", 10] }, [["雷雲", 3]]]],
  e3_boss_djinn: [
    ["つむじ風の王の首飾り", "necklace", { mp: 0.6, int: 0.4 }, { onHit: "blind" }, [["魔人の腕輪のかけら", 1], ["雷のかけら", 3]]],
    ["大嵐の足甲", "boots", { res: 0.5, int: 0.5 }, { start: ["up_int", 10, 3] }, [["魔人の腕輪のかけら", 1]]],
    ["風の魔人の指輪", "ring", { int: 0.5, luk: 0.5 }, { itazuraDmg: 3 }, [["風の目の玉", 1]]]],
};
