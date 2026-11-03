// 詳細ステータス・栄養・満腹度（鹿さんの 決め、2026-10-31。docs/mono-link-crafting.md の 3〜6 回目の カード）
// 作物の おやつを 食べると 栄養 1 ＝ その 詳細ステータス ＋0.1%。キャップは 詳細ステータス ぜんぶの 合計で 5%（栄養 50）
// キャップに 届いたら 謎のお菓子で 上限突破（詳細ステータスは リセット・キャップ ＋1%）。届く 前なら デトックス茶で リセット
// 満腹度：食べると ふえ、時間で へる（派遣中は 早い）。満腹だと 食べられない。腹八分目で 食べると ときどき 栄養が 多く 入る
// ペットと なかまの 両方（上限は 同じ）。記録は その 子の nut = { s: { 詳細ステータス: 栄養 }, br: 上限突破の 回数, full: 満腹度, at: 満腹度を 数えた 時 }
// 戦いの 計算に 入れるのは メインの ツリーの 新しい しくみと いっしょ（8 回目の カード）。それまで DETAIL_OPEN は false（画面と 門番で 閉じる）
// 数は Claude の 案（カードの 案の まま：12 時間で 満腹 → はらぺこ・派遣中は 3 倍・腹八分目は 6〜8 割）

// 2026-11-03 鹿さんの 決め（カード）：新しい ペットと いっしょに 開く（いまは 大工事の ロックと PET_OPEN で 鹿さんと おたこまるさんだけ。lounge-lock.js）
export const DETAIL_OPEN = true;
export const detailOpen = () => (globalThis.MONO_DETAIL_OPEN === false ? false : DETAIL_OPEN || globalThis.MONO_DETAIL_OPEN === true);   // 試験で 閉じた ときの 形も 見る ため（false で 閉じる）

// 詳細ステータス 27（6 回目の カード。おやつ・作物と 1 つずつ）。new：新しく 作る 戦いの 能力
export const DETAIL = {
  dmgCutAdd: { label: "被ダメ軽減加算", en: "Flat Damage Reduction" },
  statusRes: { label: "状態異常に 強い", en: "Status Resistance" },
  crit: { label: "会心", en: "Critical Rate" },
  drain: { label: "吸収", en: "Drain" },
  inflict: { label: "状態異常の 付与率", en: "Status Infliction" },
  hit: { label: "命中", en: "Accuracy", new: true },
  mpEff: { label: "MP 効率", en: "MP Efficiency" },
  healUp: { label: "回復量", en: "Healing" },
  evade: { label: "回避", en: "Evasion" },
  itazuraDmg: { label: "イタズラの ダメージ", en: "Trick Damage" },
  dmgAdd: { label: "基礎ダメージ加算", en: "Flat Damage Bonus" },
  wazaDmg: { label: "技の ダメージ", en: "Skill Damage" },
  regen: { label: "ターン経過自動回復", en: "Regeneration per Turn" },
  critDmg: { label: "会心の ダメージ", en: "Critical Damage" },
  critRes: { label: "クリティカル耐性", en: "Critical Resistance" },
  refLuk: { label: "LUK 参照加算", en: "LUK-Scaled Damage" },
  refDef: { label: "DEF 参照加算", en: "DEF-Scaled Damage" },
  refRes: { label: "RES 参照加算", en: "RES-Scaled Damage" },
  refAtk: { label: "ATK 参照加算", en: "ATK-Scaled Damage" },
  refAgi: { label: "AGI 参照加算", en: "AGI-Scaled Damage" },
  dmgCut: { label: "受ける ダメージ −%", en: "Damage Taken −%" },
  refInt: { label: "INT 参照加算", en: "INT-Scaled Damage" },
  refDex: { label: "DEX 参照加算", en: "DEX-Scaled Damage" },
  counter: { label: "反撃", en: "Counterattack", new: true },
  pierceRes: { label: "貫通耐性", en: "Pierce Resistance" },
  graze: { label: "かすりヒット付与", en: "Graze Hits" },
  chase: { label: "追撃", en: "Follow-up Attack", new: true },
};

// 栄養の おやつ 27（おやつ工房で 作物から 作る）。sp：とくべつおやつにも なる 作物（懐柔の ＋3 は その まま）
export const NUT_SNACKS = [
  { id: "nut_bread", name: "パン", en: "Bread", crop: "kaido_wheat", stat: "dmgCutAdd" },
  { id: "nut_herbcandy", name: "薬草あめ", en: "Herb Candy", crop: "herb", stat: "statusRes" },
  { id: "nut_jam", name: "ジャム", en: "Jam", crop: "berry", stat: "crit" },
  { id: "nut_skewer", name: "串焼き", en: "Mushroom Skewer", crop: "wellcap", stat: "drain" },
  { id: "nut_mossyokan", name: "苔ようかん", en: "Moss Yokan", crop: "sleepmoss", stat: "inflict" },
  { id: "nut_coffee", name: "コーヒー", en: "Coffee", crop: "wakebean", stat: "hit" },
  { id: "nut_barleytea", name: "麦茶", en: "Barley Tea", crop: "inn_wheat", stat: "mpEff" },
  { id: "nut_kusamochi", name: "草餅", en: "Herb Mochi", crop: "healherb", stat: "healUp" },
  { id: "nut_sasadango", name: "笹だんご", en: "Bamboo Dumpling", crop: "bellbamboo", stat: "evade" },
  { id: "nut_herbcookie", name: "ハーブクッキー", en: "Herb Cookie", crop: "drowsegrass", stat: "itazuraDmg" },
  { id: "nut_choco", name: "チョコ", en: "Chocolate", crop: "nectarbean", stat: "dmgAdd" },
  { id: "nut_starbread", name: "星の パン", en: "Star Bread", crop: "stardust_wheat", stat: "wazaDmg" },
  { id: "nut_latte", name: "ラテ", en: "Latte", crop: "phoenix_coffee", stat: "regen" },
  { id: "nut_yomogi", name: "よもぎ団子", en: "Mugwort Dumpling", crop: "shadow_mugwort", stat: "critDmg" },
  { id: "nut_tart", name: "タルト", en: "Tart", crop: "rubyberry", stat: "critRes", sp: true },
  { id: "nut_cookie", name: "クッキー", en: "Cookie", crop: "clover", stat: "refLuk", sp: true },
  { id: "nut_coconut", name: "ココナッツ", en: "Coconut Treat", crop: "coconut", stat: "refDef" },
  { id: "nut_tempura", name: "天ぷら", en: "Aasa Tempura", crop: "aasa", stat: "refRes" },
  { id: "nut_kokuto", name: "黒糖", en: "Brown Sugar", crop: "uuji", stat: "refAtk" },
  { id: "nut_juice", name: "ジュース", en: "Grape Juice", crop: "inoh_grape", stat: "refAgi" },
  { id: "nut_niraitea", name: "ニライ麦茶", en: "Nirai Barley Tea", crop: "nirai_barley", stat: "dmgCut" },
  { id: "nut_bitter", name: "ビターチョコ", en: "Bitter Chocolate", crop: "onyx_cacao", stat: "refInt" },
  { id: "nut_candy", name: "キャンディ", en: "Candy", crop: "cape_cane", stat: "refDex" },
  { id: "nut_jelly", name: "ゼリー", en: "Jelly", crop: "abyss_grape", stat: "counter" },
  { id: "nut_pie", name: "パイ", en: "Pie", crop: "tida_fruit", stat: "pierceRes", sp: true },
  { id: "nut_sherbet", name: "シャーベット", en: "Sherbet", crop: "mermaid_berry", stat: "graze", sp: true },
  { id: "nut_pudding", name: "プリン", en: "Pudding", crop: "lava_dragonfruit", stat: "chase", sp: true },
];
export const nutSnack = (id) => NUT_SNACKS.find((x) => x.id === id) || null;
export const NUT_CROP_N = 2;   // おやつ 1 こに 作物 2 こ（Claude の 案）
export const NUT_CRAFT_MAX = 50;

const H = 3600 * 1000;
export const NUT = {
  step: 0.1,        // 栄養 1 ＝ ＋0.1%
  cap: 50,          // キャップ（栄養。5%）
  capUp: 10,        // 上限突破 1 回で ＋10（＋1%）
  full: 100,        // 満腹
  eat: 10,          // おやつ 1 こで 満腹度 ＋10
  drain: 100 / 12,  // 1 時間に へる 満腹度（12 時間で 満腹 → はらぺこ）
  trip: 3,          // 派遣中は 3 倍
  sweet: [60, 80],  // 腹八分目（食べる 前の 満腹度が この あいだ）
  bonus: 0.25,      // 腹八分目で 食べると この 確率で 栄養 ＋1（あわせて 2）
};
export const MYSTERY_DROP = 0.0005;   // 謎のお菓子：派遣で 戦いに 勝つ たびに（ごく まれ。Claude の 案）。パチンコの 景品（10,000 玉）は 景品交換が できたら
export const MYSTERY_BALLS = 10000;

export const nutOf = (x) => x.nut || { s: {}, br: 0, full: 0, at: 0 };
export const nutTotal = (n) => Object.values(n.s || {}).reduce((a, v) => a + v, 0);
export const nutCap = (n) => NUT.cap + NUT.capUp * (n.br || 0);
export const fullAt = (n, now) => Math.max(0, (n.full || 0) - (Math.max(0, now - (n.at || now)) / H) * NUT.drain);
export const isSweet = (f) => f >= NUT.sweet[0] && f < NUT.sweet[1];
// 詳細ステータスの %（戦いの 計算に 入れる ときに 使う）
export const detailPct = (n) => Object.fromEntries(Object.entries(n.s || {}).map(([k, v]) => [k, Math.round(v * NUT.step * 10) / 10]));

// 満腹度を いまに あわせる（記録を 書きかえる。なければ 作る）
export function nutSettle(x, now) {
  const n = nutOf(x);
  x.nut = { s: { ...(n.s || {}) }, br: n.br || 0, full: Math.round(fullAt(n, now) * 100) / 100, at: now };
  return x.nut;
}
// 派遣から 帰った 子：出かけて いた 時間 ぶん、ふだんより 多く へる（3 倍 ＝ ふだんの 分 ＋ 2 倍 ぶん）
export function nutAway(x, ms, now) {
  const n = nutSettle(x, now);
  n.full = Math.max(0, Math.round((n.full - (Math.max(0, ms) / H) * NUT.drain * (NUT.trip - 1)) * 100) / 100);
  return n;
}
// 謎のお菓子：勝った 回数 ぶん くじ
export const mysteryRoll = (R, wins) => { let k = 0; for (let i = 0; i < (wins || 0); i++) if (R() < MYSTERY_DROP) k++; return k; };
// 食べられる まで（満腹度が おやつ 1 こ ぶん 下がる まで）の ミリ秒
export const eatWait = (n, now) => Math.max(0, Math.ceil(((fullAt(n, now) + NUT.eat - NUT.full) / NUT.drain) * H));
