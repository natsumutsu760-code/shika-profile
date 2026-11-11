import { describeEn } from "./lounge-en-names.js";   // 特殊複合の 技の 説明（効果から 英語を 作る）
// 英語の 辞書：研究所の エッセンス（抽出・つくる・売る）。画面 lab.html・門番 lounge-server/lounge-essence.js の 返事・決まり essence.js（2026-11-11）
export const WORDS = {
  // 見出し・タブ
  "研究所": "Lab", "研究所で すること": "What to do in the Lab", "抽出": "Extract", "つくる": "Craft", "売る": "Sell",
  "なかまを 研究する（アメジスト） ›": "Research companions (Amethyst) ›", "研究所を つかう": "Use the Lab",
  "研究所が まだ ない": "No Lab yet", "隠れ家で 研究所を 作る ›": "Build a Lab in the hideout ›",
  "かぶりの 子 # 体": "# duplicates", "作れる 物 #": "# craftable",
  // 抽出
  "あまった 子": "Spare companions", "ぜんぶで # 体": "# total", "かぶり": "Duplicates", "すべて": "All", "通常": "Normal", "希少": "Rare", "配合": "Fusion", "ボス": "Boss",
  "パーティ": "Party", "出かけて いる": "Away", "坑道": "Mine",
  "ランク順": "By rank", "Lv順": "By Lv", "Lv の 低い順（押すと ランク順）": "Lowest Lv first (tap: by rank)", "ランクの 低い順（押すと Lv順）": "Lowest rank first (tap: by Lv)",
  "見えている 子を ぜんぶ えらぶ": "Select all shown", "えらびを はずす": "Clear selection", "この しぼりこみの 子は いない": "No companions match this filter",
  "なかまが いない。派遣で 勝つと、ときどき 敵を 捕まえる": "No companions. Winning expeditions sometimes captures enemies",
  "一覧から 抽出する 子を えらぶ（いくつでも）": "Pick companions to extract (any number)",
  "えらんだ 子#体": "# selected", "エッセンス#こ": "# essence", "エッセンス # こ": "# essence", "持って いる # → #": "Have #1 → #2",
  "# 体とは おわかれ（付けて いた 装備は 持ち物に もどる）": "Say goodbye to # (their gear returns to your inventory)",
  "抽出する": "Extract", "もう 一度 押すと 抽出する": "Tap again to extract", "ほか # 種": "+# more types", "ほか # 体": "+# more",
  "# 体から エッセンスを # こ 抽出した": "Extracted #2 essence from #1 companions",
  // つくる
  "つくれる 物": "Craftable", "アメジストなし・すぐ": "No Amethyst · instant", "サブツリー": "Subtree", "上位スキル「＋」": "Advanced skill \"+\"", "上位「＋」": "Advanced \"+\"",
  "特殊スキル": "Special skill", "特殊": "Special", "特殊複合スキル": "Special combo skill", "複合": "Combo", "しぼりこみ": "Filter",
  "エッセンスを 抽出すると、作れる 物が ここに 出る": "Extract essence and craftable trees appear here",
  "この しゅるいで 作れそうな 物は まだ ない": "Nothing close to craftable in this type yet", "一覧から 作る 物を えらぶ": "Pick something to craft",
  "その 系統の どの 種でも": "Any species of that family", "技を 見る（#）": "See skills (#)", "作れる": "Craftable",
  // 売る
  "持って いる エッセンス": "Your essence", "エッセンス": "Essence", "# 種": "# types", "売値順": "By price", "数順": "By amount",
  "数の 多い順（押すと 売値の 高い順）": "Most first (tap: by price)", "売値の 高い順（押すと 数の 多い順）": "Highest price first (tap: by amount)",
  "この しぼりこみの エッセンスは ない": "No essence matches this filter", "エッセンスを 持って いない（抽出の タブで 作る）": "No essence (make some in the Extract tab)",
  "売る エッセンスを えらぶ（いくつでも）": "Pick essence to sell (any number)", "持って いる # こ・# こ #": "Have #1 · #3 each",
  "もらえる": "You get", "えらんだ#種": "# types selected", "#こ": "#", "# こ 売る": "Sell #", "ぜんぶ（#）": "All (#)",
  "えらんだ 種を ぜんぶ 売る": "Sell all selected", "もう 一度 押すと ぜんぶ 売る": "Tap again to sell all",
  "×#・# こ #": "×#1 · #3 each", "×#・# こ #・ツリー ずみ": "×#1 · #3 each · tree owned",
  "売る 数": "Amount to sell", "1 こ へらす": "One less", "1 こ ふやす": "One more",
  // 門番の 返事・決まり
  "隠れ家に 研究所を 作ると 使える": "Build a Lab in the hideout to use this", "抽出する 子を えらんで": "Pick companions to extract", "1 回に 200 体まで": "Up to 200 at a time",
  "売る 数を えらんで": "Pick an amount to sell", "売る エッセンスを えらんで": "Pick essence to sell", "その レシピは ない": "No such recipe",
  "もう 持って いる（ペットの サブツリーに 付けられる）": "Already owned (you can set it as a pet's subtree)",
};

const nm = (p, x) => p(x) || x;
// 特殊複合スキル（combo-trees.js が 組み立てた ときに 日本語 → 英語を 入れる）：ツリーの 名前は 2 種族の 英語、技・パッシブの 名前は 言葉の 表の 英語
const COMBO_EN = (globalThis.__ML_COMBO_EN ||= new Map());
export const RULES = [
  [/^[^]+$/, (m, p) => { const e = COMBO_EN.get(m[0]); return e == null ? null : typeof e === "string" ? e : e.fx ? describeEn(e.fx) : `${nm(p, e.a)} × ${nm(p, e.b)}`; }],
  [/^ならべかた：(.+)$/, (m, p) => { const x = p(m[1]); return x == null ? null : `Sort: ${x}`; }],
  [/^(.+)の エッセンス$/, (m, p) => `${nm(p, m[1])} Essence`],
  [/^([A-Z]{1,2})・(.+)を 抽出$/, (m, p) => `${m[1]} · extract ${nm(p, m[2])}`],
  [/^✓ 「(.+)」を 持って いる$/, (m, p) => `✓ Own "${nm(p, m[1])}"`],
  [/^「(.+)」が できた。スキルツリーの サブツリーに 付けられる$/, (m, p) => `Crafted "${nm(p, m[1])}". Set it as a subtree in the Skill Tree`],
  [/^(.+)を ([\d,]+) こ 売った（＋([\d,]+) クレジット）$/, (m, p) => `Sold ${m[2]} ${nm(p, m[1])} (+${m[3]} credits)`],
  [/^先に「(.+)」を 持って いる こと（研究か エッセンスで）$/, (m, p) => `Own "${nm(p, m[1])}" first (by research or essence)`],
  [/^(.+)が 足りない（([\d,]+) こ）$/, (m, p) => `Not enough ${nm(p, m[1])} (have ${m[2]})`],
  [/^(.+)は パーティに いる（部屋に もどして から）$/, (m) => `${m[1]} is in your party (return them to the room first)`],
  [/^(.+)は 出かけて いる（帰って から）$/, (m) => `${m[1]} is away (wait until they return)`],
  [/^(.+)は 坑道で 掘って いる（坑道から もどして から）$/, (m) => `${m[1]} is digging in the mine (bring them back first)`],
  [/^(.+)は 取り出しの 返事を 待って いる$/, (m) => `${m[1]} is waiting on an extraction reply`],
  // 大事そうな 子：ガミジン＋2・デーモンロード ほか 1 体
  [/^大事そうな 子：(.+)$/, (m, p) => { const more = m[1].match(/ ほか ([\d,]+) 体$/), body = m[1].replace(/ ほか ([\d,]+) 体$/, "");
    return `Looks precious: ${body.split("・").map((x) => { const k = x.match(/^(.+?)(＋\d+)?$/); return nm(p, k[1]) + (k[2] ? "+" + k[2].slice(1) : ""); }).join(", ")}${more ? ` +${more[1]} more` : ""}`; }],
];
