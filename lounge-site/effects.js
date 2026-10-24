// バフ・デバフ（状態）のデータ（試作）。決まりは「バフ・デバフ要件一覧」（別のゲーム用に組んだもの）をもとに、1 対 1 のバトルに合わせた
// dur：stack（量を持つ・量に応じて効く）、turn（あるかないか）、value（吸収できる量）、once（1 回効いて消える）
// base：技でターン数を指定しないときの持続。数字はそのターン数、[a, b] は a〜b の抽選、null は永続（永続のスタック制は「効くたびに量が半分」）
// ext：重ねがけでさらに +1 ターン（延長あり）。cap：量の上限（"hp" は最大 HP まで）。boss：immune（効かない）、half（ターン半分）
// 1 対 1 なので、身代わり（substitute）と隠蔽（conceal）は使わない（データだけ残す）。数字はすべて仮

export const EFFECTS = {
  // ---- バフ ----
  regen: { label: "再生", buff: true, dur: "stack", base: null, cap: 100, text: "手番のはじめに 最大 HP × 量% を回復し、量が半分" },
  focus: { label: "集中", buff: true, dur: "turn", base: [3, 5], text: "行動のあとに 最大 MP の 20% を回復" },
  blessing: { label: "祝福", buff: true, dur: "turn", base: [3, 5], text: "行動のあとに 最大 HP の 20% を回復" },
  reincarnation: { label: "輪廻", buff: true, dur: "once", base: null, text: "HP が 0 になるとき、HP 1 で踏みとどまる" },
  guard: { label: "防御", buff: true, dur: "turn", base: 1, stance: true, text: "受ける直接ダメージが半分" },
  barrier: { label: "バリア", buff: true, dur: "stack", base: null, cap: 10, text: "直接攻撃を 1 回むこうにして、量が 1 減る" },
  substitute: { label: "身代わり", buff: true, dur: "turn", base: 1, stance: true, unused: true, text: "味方への直接攻撃を代わりに受ける（1 対 1 なので使わない）" },
  shield: { label: "シールド", buff: true, dur: "value", base: null, cap: "hp", text: "ダメージをその分だけ吸収する" },
  overheal: { label: "オーバーヒール", buff: true, dur: "value", base: 5, cap: "hp", text: "最大 HP をこえて回復した分をためて、ダメージを吸収する（シールドより先）" },
  thorns: { label: "棘", buff: true, dur: "stack", base: null, cap: 200, text: "直接攻撃を受けると、自分の ATK × 量% を返し（相手の DEF で減る）、量が半分" },
  armor: { label: "装甲", buff: true, dur: "stack", base: null, cap: 100, text: "技のダメージを 量% 減らし（最大 90%）、量が半分" },
  ward: { label: "障壁", buff: true, dur: "stack", base: null, cap: 100, text: "イタズラのダメージを 量% 減らし（最大 90%）、量が半分" },
  conceal: { label: "隠蔽", buff: true, dur: "turn", base: 3, stance: true, unused: true, text: "敵にねらわれない（1 対 1 なので使わない）" },
  immunity: { label: "免疫", buff: true, dur: "stack", base: [2, 3], ext: true, cap: 100, text: "デバフを「量 − 衰弱の量」% で防ぐ（最大 95%）" },
  activation: { label: "活性化", buff: true, dur: "turn", base: 5, text: "技の MP が半分（切り上げ）" },
  counter: { label: "カウンター", buff: true, dur: "turn", base: 1, stance: true, text: "直接攻撃を受けると、受けたダメージの 50% を返す" },
  mirage: { label: "幻影", buff: true, dur: "stack", base: null, cap: 70, text: "直接攻撃を 量% でかわし（回避は全部で最大 75%）、かわすと量が半分" },
  pierce: { label: "貫通", buff: true, dur: "stack", base: null, cap: 100, text: "直接攻撃のダメージに 量 をそのまま足し、量が半分" },
  frenzy: { label: "狂乱", buff: true, dur: "turn", base: 5, text: "与えるダメージ × 2、受けるダメージ × 1.5。でたらめな技を使う" },
  clarity: { label: "明瞭", buff: true, dur: "turn", base: 5, text: "攻撃がかならず会心になる" },
  mastery: { label: "研鑽", buff: true, dur: "stack", base: null, cap: 100, text: "技の会心のとき DEX × 量% を足し、量が半分" },
  haste: { label: "加速", buff: true, dur: "turn", base: null, text: "何回も当てる技の回数 +1〜3（ダメージは回数で分ける）" },
  charge: { label: "チャージ", buff: true, dur: "once", base: null, text: "次の直接攻撃のダメージが 2 倍" },
  // ---- デバフ ----
  poison: { label: "毒", dur: "stack", base: [2, 3], ext: true, cap: 100, text: "手番のはじめに 最大 HP × 量% のダメージ" },
  venom: { label: "猛毒", dur: "turn", base: [3, 5], text: "行動のあとに 最大 HP の 20% のダメージ" },
  burn: { label: "炎上", dur: "stack", base: [2, 3], ext: true, cap: 30, src: "atk", text: "手番のはじめに 付けた人の ATK × 0.1 × 量 のダメージ（DEF で減る）。30% で火傷" },
  sickness: { label: "体調不良", dur: "stack", base: [2, 3], ext: true, cap: 30, src: "int", text: "手番のはじめに 付けた人の INT × 0.2 × 量 のダメージ（RES で減る）。30% で疲労" },
  frostbite: { label: "凍傷", dur: "stack", base: [2, 3], ext: true, cap: 30, src: "dex", text: "手番のはじめに 付けた人の DEX × 0.2 × 量 のダメージ（DEF で減る）。凍結すると 量 × DEX ÷ 10 のダメージ" },
  freeze: { label: "凍結", dur: "turn", base: 3, boss: "immune", stop: true, text: "動けない。直接攻撃を受けるととけて、最大 HP の 10% の貫通ダメージ" },
  stun: { label: "気絶", dur: "turn", base: 1, boss: "immune", stop: true, text: "動けない" },
  scald: { label: "火傷", dur: "turn", base: 5, text: "受ける直接ダメージ × 1.1、炎上のダメージ × 1.5" },
  silence: { label: "沈黙", dur: "turn", base: 5, text: "こうげき しか使えない" },
  fatigue: { label: "疲労", dur: "turn", base: 5, text: "AGI が半分。手番のはじめに 最大 MP の 10% を失う" },
  weakness: { label: "衰弱", dur: "stack", base: [2, 3], ext: true, cap: 100, text: "免疫の効果を 量% 打ち消す" },
  sleep: { label: "眠り", dur: "turn", base: 5, boss: "immune", stop: true, text: "動けない。直接攻撃を受けると 50% で起きる" },
  paralysis: { label: "麻痺", dur: "stack", base: [2, 3], cap: 100, text: "手番ごとに 量 × 0.5% で動けない（最大 50%）" },
  blind: { label: "盲目", dur: "turn", base: 5, text: "技の命中が半分" },
  confusion: { label: "混乱", dur: "turn", base: 5, boss: "half", text: "自分か相手に、でたらめな技を使う" },
  daze: { label: "朦朧", dur: "turn", base: 5, boss: "half", text: "受ける攻撃がかならず会心。直接攻撃を受けると 10% で気絶" },
  rot: { label: "腐敗", dur: "turn", base: 5, text: "回復が、その量のダメージに変わる" },
  curse: { label: "呪い", dur: "turn", base: 5, unused: true, text: "使わない（鹿さんの決め、2026-10-21。がんばりを消すと、配信のバトルで下克上を止める道具になるため）" },
};

// 能力変化：9 つのステータスに 上昇（バフ）と 減少（デバフ）。量 1 につき 1%、それぞれ最大 90。技で決めたターン（なければ永続）
export const STATS9 = ["hp", "mp", "atk", "def", "int", "res", "agi", "dex", "luk"];
const SL = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", int: "INT", res: "RES", agi: "AGI", dex: "DEX", luk: "LUK" };
for (const k of STATS9) {
  EFFECTS[`up_${k}`] = { label: `${SL[k]} 上昇`, buff: true, dur: "stack", base: null, cap: 90, stat: k, text: `${SL[k]} + 量%` };
  EFFECTS[`down_${k}`] = { label: `${SL[k]} 減少`, dur: "stack", base: null, cap: 90, stat: k, text: `${SL[k]} − 量%` };
}

// 対になるバフとデバフ。stack の組は量で打ち消し合い（相殺）、turn の組は後から付けた方が残る（上書き）
export const PAIRS = [["regen", "poison"], ["armor", "burn"], ["ward", "sickness"], ["mastery", "frostbite"], ["immunity", "weakness"], ["focus", "fatigue"], ["blessing", "venom"], ["frenzy", "confusion"]];
export const PAIR = Object.fromEntries(PAIRS.flatMap(([a, b]) => [[a, b], [b, a]]));
export const isBuff = (id) => !!EFFECTS[id]?.buff;
