// DEEP LINK/:（ラウンジの PC から入る、MONO LINK:// の「裏側」のサイト）の見本のデータ。鹿さんの決め、2026-10-22
// タルコフのような商人 8 人（ヨルは アメジストの 店）。商人ごとに友好度（Lv1〜100。10 Lv ごとに 章の プライマリータスク）。タスクを 終えると 大きく、売り買いでも 少しずつ 上がる
// 商人は どうぶつ（名前と どうぶつは 鹿さんの決め、2026-10-22。3D の おもちゃは traders3d.js、顔の絵は img/trader-*.png）。品ぞろえ・数字はすべて仮。画面は deeplink.html

import { GATHER, ENEMY_MAT } from "./materials.js";
import { BASES } from "./equip.js";
import { CRAFT, SYNTH } from "./recipes.js";
import { ATT_BASES } from "./workshop.js";
import { DUNGEONS } from "./dungeons.js";

// 友好度は Lv100 まで（鹿さんの 決め、2026-10-29）。点の のび方と 章の 門は primary.js（repLv は 点だけの Lv。章で 止めるのは 門番と 画面の lvOf）
export { lvOfPts as repLv } from "./primary.js";

// タスク：tasks.js が 決まりから 作る（つながりは 終わりが ない・毎日 1 つ）。プライマリータスク（章の 物語）は primary-data.js
// 品の id と get は 門番が 渡す 中身（get：mat・snacks・items・tools・acc・recipe・perk。pick は えらべる 物の 一覧。q は 品質の くじ）
const ISLE1 = DUNGEONS.filter((d) => (d.isle || 1) === 1);   // 店の 素材は はじめの 島の 分だけ（ニライ諸島の 素材は 島で 集める）
const FOE_MATS = ISLE1.flatMap((d) => d.foes.map((f) => ENEMY_MAT[f.tree][0]));   // ふつうの 敵の素材
const ARMOR = BASES.filter((b) => b.slot !== "weapon").map((b) => b.id), WEAPON = BASES.filter((b) => b.slot === "weapon").map((b) => b.id);   // ピーコは あたま・くび、アンビルは 武器（鹿さんの 決め、2026-11-03）
const ATT_MATS = [...new Set(ATT_BASES.flatMap((b) => b.mats.filter(([, n]) => n === 1).map(([id]) => id)))];   // アタッチメントに 1 こ いる 敵の 素材
// ショップ：lv は その 友好度 Lv から 買える（Claude の 案：前の Lv2・3・4 を Lv10・20・30 に）。プライマリータスクで 開く 品（primary.js の UNLOCK_BY）は その タスクを 終えると 買える
// cur は クレジット か アメジスト（MONO LINK の 通貨は クレジットと アメジストだけ。鹿さんの 決め、2026-10-28。前は 玉で、同じ 数の クレジットに した）
// stock は 1 日に 買える数（毎日 もどる。week は 1 週ごと）、left は 見本の きょうの のこり。once は 1 回だけ。tool は 派遣に 持っていく 道具（dungeons.js の TOOLS）
// soon：まだ ない しくみ（品は 見せるが 買えない）
export const TRADERS = [
  { id: "junk", name: "ガラク", animal: "アライグマ", co: "GLK ガラク・サルベージ", group: "中立", role: "素材の買い取り・交換", rep: 140, say: "いらない物は、なんでも 買うよ。",
    chain: 7, prog: { chain: 1, daily: 0.4 },   // 見本：いま 7 こ目（もう 報告できる）・きょうの タスクは 4 割
    shop: [
      { id: "j-g1", name: "採取の素材（ハルス街道）", note: "薬草・きれいな小石・麦わら・野いちご", price: 30, cur: "credits", lv: 1, stock: 10, left: 10, get: { mat: "pick" }, pick: GATHER.hals.mats.map(([id]) => id) },
      { id: "j-sell", name: "素材を まとめて 売る", note: "持っている素材を クレジットに かえる", price: 0, cur: "credits", lv: 1, sell: true },
      { id: "j-g2", name: "採取の素材（モーフィアス遺跡・暗い村）", note: "8 しゅるい", price: 40, cur: "credits", lv: 10, stock: 10, left: 6, get: { mat: "pick" }, pick: [...GATHER.morph.mats, ...GATHER.kurai.mats].map(([id]) => id) },
      { id: "j-trade", name: "素材の 交換", note: "同じ 行き先の 素材 3 こ → ほしい 1 こ", price: 0, cur: "credits", lv: 1, trade: true },
      { id: "j-g3", name: "採取の素材（水晶洞窟）", note: "水晶のかけら・光る石・地底の水", price: 60, cur: "credits", lv: 20, stock: 10, left: 10, get: { mat: "pick" }, pick: GATHER.crystal.mats.map(([id]) => id).filter((id) => id !== "ironore") },   // 鉱石は 坑道と 採掘の 会社だけ（鹿さんの 決め）
      { id: "j-sell10", name: "買い取り ＋10%", note: "ずっと 高く 売れる", price: 2000, cur: "credits", lv: 1, once: true, get: { perk: "sell10" } },
      { id: "j-rare", name: "かくし通路の レア素材", note: "四つ葉のクローバー・夢のかけら・月のしずく・虹水晶", price: 600, cur: "credits", lv: 1, stock: 1, left: 1, get: { mat: "pick" }, pick: Object.values(GATHER).map((g) => g.hidden[0]) },
      { id: "j-sell20", name: "買い取り ＋20%", note: "＋10% と あわせて", price: 5000, cur: "credits", lv: 1, once: true, get: { perk: "sell20" } },
    ] },
  { id: "doc", name: "ウール先生", animal: "ヒツジ", co: "MLV メルヴィル製薬", group: "ハルモニア・コンコード", role: "回復・おやつ・救護室の部品", rep: 60, say: "むりは しないこと。休むのも 仕事だよ。",
    chain: 3, prog: { chain: 0.5, daily: 1 },
    shop: [
      { id: "d-snack", name: "懐柔のおやつ", note: "なかよしゲージ ＋1", price: 50, cur: "credits", lv: 1, stock: 10, left: 7, get: { snacks: 1 } },
      { id: "d-snack5", name: "おやつ 5 こ セット", note: "1 こ 46", price: 230, cur: "credits", lv: 1, stock: 3, left: 3, get: { snacks: 5 } },
      { id: "d-herb", name: "薬草", note: "おやつ工房・救護室で 使う", price: 30, cur: "credits", lv: 1, stock: 10, left: 10, get: { mat: "herb" } },
      { id: "d-snack3", name: "とくべつおやつ", note: "なかよしゲージ ＋3", price: 300, cur: "credits", lv: 1, stock: 3, left: 3, get: { items: { snack3: 1 } } },
      { id: "d-tea", name: "元気のお茶", note: "派遣に 持っていく：力つきても 1 回だけ 全回復", price: 1500, cur: "credits", lv: 1, stock: 2, left: 2, tool: "tea", get: { tools: { tea: 1 } } },   // 1,500 クレジット（鹿さんの 決め、2026-10-31）
    ] },
  { id: "hanger", name: "ピーコ", animal: "クジャク", co: "RSL ローゼル繊工", group: "TCU", role: "防具（あたま・くび）を売る", rep: 30, say: "似合う物を さがしに おいで。",
    chain: 2, prog: { chain: 0.3, daily: 0 },
    shop: [
      { id: "h-acc1", name: "防具 ★1", note: "あたま・くびの 8 しゅるいから えらぶ。OP は くじ", price: 120, cur: "credits", lv: 1, stock: 3, left: 3, get: { acc: 1 }, pick: ARMOR },
      { id: "h-acc2", name: "防具 ★2", note: "あたま・くびの 8 しゅるいから えらぶ。OP は くじ", price: 360, cur: "credits", lv: 10, stock: 2, left: 2, get: { acc: 2 }, pick: ARMOR },
      { id: "h-acc3", name: "防具 ★3", note: "あたま・くびの 8 しゅるいから えらぶ。OP は くじ", price: 1200, cur: "credits", lv: 20, stock: 1, left: 1, get: { acc: 3 }, pick: ARMOR },
      { id: "h-acc3op", name: "防具 ★3・OP を 1 つ えらべる", note: "のこりの OP は くじ", price: 2500, cur: "credits", lv: 30, stock: 1, left: 1, get: { acc: 3, op: true }, pick: ARMOR },
      { id: "h-consign", name: "防具の 委託", note: "作った 防具を 店に 並べて 売る", price: 0, cur: "credits", lv: 1, soon: "フリマ" },
      { id: "h-starflax", name: "麻の布", note: "星麻を 織った 布", price: 240, cur: "credits", lv: 1, stock: 3, left: 3, get: { mat: "flax_cloth" } },
      { id: "h-skycotton", name: "天の布", note: "天綿を 織った 布", price: 300, cur: "credits", lv: 1, stock: 3, left: 3, get: { mat: "sky_cloth" } },
      { id: "h-whitesand", name: "白砂の布", note: "白砂綿を 織った 布", price: 300, cur: "credits", lv: 1, stock: 3, left: 3, get: { mat: "whitesand_cloth" } },
    ] },
  { id: "mecha", name: "ボルト", animal: "ビーバー", co: "GRN グラナート建設", group: "TCU", role: "施設の部品・作業台のレシピ", rep: 260, say: "部品さえ あれば、なんでも 作れる。",
    chain: 11, prog: { chain: 0.8, daily: 0.5 },
    shop: [
      { id: "m-nail", name: "古い釘", note: "作業台・施設で 使う", price: 30, cur: "credits", lv: 1, stock: 10, left: 10, get: { mat: "oldnail" } },
      { id: "m-recipe", name: "作るの レシピ", note: "素材を 拾う前に レシピを 1 つ 出せる", price: 400, cur: "credits", lv: 1, stock: 1, left: 1, get: { recipe: "craft" }, pick: CRAFT.map((r) => r.base) },
      { id: "m-synth", name: "合成の レシピ", note: "上の装備の レシピを 1 つ 出せる", price: 1000, cur: "credits", lv: 20, stock: 1, left: 1, get: { recipe: "synth" }, pick: SYNTH.map((r) => r.out) },
      { id: "m-shelf", name: "倉庫の棚", note: "倉庫に 1 しゅるい 置ける数 ＋25", price: 1500, cur: "credits", lv: 1, once: true, get: { perk: "shelf" } },
      { id: "m-fast10", name: "建設の 時間 −10%", note: "施設の 建設が 早く 進む", price: 2000, cur: "credits", lv: 1, once: true, get: { perk: "build10" } },   // 値段は 買い取り ＋10% と 同じ（Claude の 案、2026-11-03）
      { id: "m-fast20", name: "建設の 時間 −20%", note: "−10% と あわせて −20%", price: 5000, cur: "credits", lv: 1, once: true, get: { perk: "build20" } },
    ] },
  { id: "hunter", name: "ホーク", animal: "タカ", co: "ODH オルド・ハウンド社", group: "SVA", role: "敵をたおす・捕まえるタスク", rep: 10, say: "えものの 話なら、まかせて。",
    chain: 1, prog: { chain: 0.6, daily: 0 },
    shop: [
      { id: "k-lure", name: "おとりの笛", note: "派遣に 持っていく：えらんだ 敵と 出会いやすい", price: 250, cur: "credits", lv: 1, stock: 3, left: 3, tool: "lure", get: { tools: { lure: 1 } } },
      { id: "k-net", name: "捕獲ネット", note: "派遣に 持っていく：捕まえる 確率 2 倍", price: 600, cur: "credits", lv: 1, stock: 2, left: 2, tool: "net", get: { tools: { net: 1 } } },
      { id: "k-mat2", name: "敵の素材（品質 2）", note: "ふつうの 敵の素材。しゅるいを えらぶ", price: 80, cur: "credits", lv: 1, stock: 3, left: 3, get: { mat: "pick", q: [2] }, pick: FOE_MATS },
      { id: "k-mat34", name: "敵の素材（品質 3〜4）", note: "ふつうの 敵の素材。しゅるいを えらぶ", price: 200, cur: "credits", lv: 1, stock: 2, left: 2, get: { mat: "pick", q: [3, 4] }, pick: FOE_MATS },
      { id: "k-boss", name: "ボスの素材", note: "1 週に 1 こ", price: 1500, cur: "credits", lv: 40, stock: 1, left: 1, week: true, get: { mat: "pick", q: [5] }, pick: ISLE1.map((d) => ENEMY_MAT[d.boss.tree][0]) },
    ] },
  // 新しい 2 人（鹿さんの 決め、2026-10-29。店も いっしょに 作る、2026-11-03）
  { id: "anvil", name: "アンビル", animal: "サイ", co: "VLC ヴァルコ火器", group: "SVA", role: "武器と アタッチメントの 素材", rep: 0, say: "……試して みろ。いい 品だ。",
    chain: 1, prog: { chain: 0, daily: 0 },
    shop: [
      { id: "a-w1", name: "武器 ★1", note: "4 しゅるいから えらぶ。OP は くじ", price: 120, cur: "credits", lv: 1, stock: 3, left: 3, get: { acc: 1 }, pick: WEAPON },
      { id: "a-w2", name: "武器 ★2", note: "4 しゅるいから えらぶ。OP は くじ", price: 360, cur: "credits", lv: 10, stock: 2, left: 2, get: { acc: 2 }, pick: WEAPON },
      { id: "a-w3", name: "武器 ★3", note: "4 しゅるいから えらぶ。OP は くじ", price: 1200, cur: "credits", lv: 20, stock: 1, left: 1, get: { acc: 3 }, pick: WEAPON },
      { id: "a-w3op", name: "武器 ★3・OP を 1 つ えらべる", note: "のこりの OP は くじ", price: 2500, cur: "credits", lv: 30, stock: 1, left: 1, get: { acc: 3, op: true }, pick: WEAPON },
      { id: "a-attmat", name: "アタッチメントの 素材", note: "工房で 武器の アタッチメントを 作る 敵の素材。しゅるいを えらぶ", price: 80, cur: "credits", lv: 10, stock: 3, left: 3, get: { mat: "pick" }, pick: ATT_MATS },
      { id: "a-consign", name: "武器の 委託の 枠 ＋1", note: "作った 武器を 店に 並べる 枠", price: 0, cur: "credits", lv: 1, soon: "フリマ" },
      { id: "a-bar", name: "鉄の延べ棒", note: "装備開発・施設で 使う", price: 100, cur: "credits", lv: 1, stock: 5, left: 5, get: { mat: "iron_bar" } },
      { id: "a-silver", name: "銀の延べ棒", note: "装備開発・施設で 使う", price: 240, cur: "credits", lv: 1, stock: 3, left: 3, get: { mat: "silver_bar" } },
      { id: "a-gold", name: "金の延べ棒", note: "装備開発・施設で 使う", price: 600, cur: "credits", lv: 1, stock: 1, left: 1, get: { mat: "gold_bar" } },
    ] },
  { id: "minerva", name: "ミネルバ", animal: "フクロウ", co: "AMB アンバー相互保証", group: "ハルモニア・コンコード", role: "保険（出発の 前に 掛ける）", rep: 0, say: "契約書の、ここを よく 読んでね。",
    chain: 1, prog: { chain: 0, daily: 0 },
    shop: [
      { id: "n-ins1", name: "保険（ふつう）", note: "派遣に 出る ときに 掛ける。力つきたら 失った 素材の 半分が 2 時間 あとに 届く", price: 0, cur: "credits", lv: 1, ins: 1 },
      { id: "n-ins2", name: "手厚い 保険", note: "保険料 2 倍。失った 素材が ぜんぶ 30 分 あとに 届く", price: 500, cur: "credits", lv: 1, once: true, get: { perk: "ins2" } },
      { id: "n-cheap", name: "保険料 割引", note: "保険料 −20%", price: 1500, cur: "credits", lv: 1, once: true, get: { perk: "insCheap" } },
      { id: "n-fast", name: "支払いが すぐ 届く", note: "保険の 支払いを 待たずに うけとる", price: 3000, cur: "credits", lv: 1, once: true, get: { perk: "insFast" } },
      { id: "n-ship", name: "船の 保険", note: "ニライ諸島の 保険料 −20%（割引と あわせて）", price: 5000, cur: "credits", lv: 1, once: true, get: { perk: "insShip" } },
    ] },
];
// 特別ショップ（ヨル）：アメジストで買う、ここだけの品（家具は ラウンジの お店で 買うので 置かない。鹿さんの決め）
// ヨルも プライマリータスクの 商人（友好度 Lv100）。情報屋の 品は 情報屋が できるまで 買えない（soon）
export const SPECIAL = { id: "special", name: "ヨル", animal: "黒ネコ", dir: "特別ショップ", co: "NOX ノクス仲介", group: "中立", role: "アメジストで買える、ここだけの品", say: "アメジストで しか 買えない 物が ある。",
  shop: [
    { id: "y-map", name: "かくし通路の地図", note: "1 階ぶん、100% に しなくても 開く", price: 3, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { map: 1 } } },
    { id: "y-collar", name: "なかよしの首輪", note: "なかよしゲージ ＋5", price: 4, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { collar: 1 } } },
    { id: "y-core", name: "ブランクコア", note: "装備から OP を 1 つ 抜き出す（抜いた 装備は なくなる）", price: 5, cur: "res", lv: 1, stock: 2, left: 2, week: true, get: { items: { blankcore: 1 } } },   // 1 週に 2 こまで（鹿さんの決め、2026-10-25）
    { id: "y-charm", name: "くじの お守り", note: "次の 作る・合成で ★ ＋1", price: 8, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { charm: 1 } } },
    { id: "y-call", name: "侵入の 呼び寄せ", note: "この 派遣の 侵入 1% → 20%", price: 0, cur: "credits", lv: 1, soon: "情報屋" },
    { id: "y-rare", name: "希少種の 呼び寄せ", note: "この 派遣の 希少な 敵 ×3", price: 0, cur: "credits", lv: 1, soon: "情報屋" },
  ] };
// 保険料（Claude の 案。数の 決まりは docs/mono-link-numbers.md「保険・ふつう 行き先の 稼ぎの 目安 × 15%（暗い村 26・水晶洞窟 35・島 2 40〜60）」）
// ふつう：力つきたら 失った 素材の 50% が 2 時間 あと。手厚い（ins2 を 買うと）：保険料 2 倍・100% が 30 分 あと
export const INS_BASE = { hals: 15, morph: 20, kurai: 26, crystal: 35 };
export const INS_PLAN = { 1: { mult: 1, back: 0.5, wait: 2 * 3600e3 }, 2: { mult: 2, back: 1, wait: 30 * 60e3 } };
export function insPrice(d, plan, perks = {}) {
  const P = INS_PLAN[plan]; if (!d || !P) return 0;
  const isle2 = DUNGEONS.filter((x) => (x.isle || 1) === 2), i = isle2.findIndex((x) => x.id === d.id);
  let p = INS_BASE[d.id] || (i >= 0 ? 40 + Math.round((20 * i) / Math.max(1, isle2.length - 1)) : 60);   // 島 2 は 40〜60（奥ほど 高い）
  p *= P.mult;
  if (perks.insCheap) p *= 0.8;
  if (perks.insShip && i >= 0) p *= 0.8;
  return Math.max(1, Math.round(p));
}
// みんなの依頼（ユーザーから ユーザーへ。鹿さんの決め、2026-10-22）。見本の 名前は 仮
// ・お礼は 出すときに 先に 預ける。届いたら すぐ 届けた人へ、期限が 来たら もどる
// ・頼めるのは 素材と 装備。お礼は 玉・アメジスト・素材・装備（物どうしの 交換も できる）
// ・手数料：お礼の ねうちの 1 割を 玉で、出した人が はらう（届けた人は お礼を ぜんぶ もらう）。ねうちは アメジスト 1 ＝ 玉 1,000、素材は 売ると いくらか、装備は ★ × アメジスト 1。期限が 来ても 手数料は もどらない（案）
// ・1 人 1 つまで。期限は 出す人が えらぶ
export const REQ_FEE = 0.1, REQ_MAX = 1, RES_VALUE = 1000;
export const REQ_LIMITS = ["6 時間", "1 日", "3 日", "7 日"];
// 依頼を 出すときの えらぶ物（見本）。v は お礼の ねうち（玉）
export const REQ_WANTS = [["素材", ["ねむり苔", "夢のかけら", "品質 3 以上の 霊布", "鉄鉱石"]], ["装備", ["工事のヘルメット ★2 以上", "お守り ★3 以上"]]];
// ひとこと（鹿さんの決め、2026-10-23）：えらぶ ことばと 自由に 書く（20 字まで）の 両方。だれでも すぐ 使える
// まもり：NG ことば・URL・連絡先は はじめから 出せない。通報 3 回で 自動で かくす。鹿さんは いつでも 消せる
export const NOTE_PRESETS = ["いそぎです", "品質 高めだと うれしい", "何回かに 分けても OK", "のんびり 待ちます", "はじめて 出しました", "よろしく おねがいします"];
export const NOTE_MAX = 20, NOTE_HIDE_AT = 3;
export const NG_WORDS = ["ばか", "あほ", "しね", "きもい", "うざい"];   // 見本。ほんものの 一覧は サーバーに 置き、画面には 出さない
// 出せない 理由（出せるときは ""）。全角・カタカナ・すきまを そろえてから くらべる
export function noteBlock(text) {
  const s = String(text).normalize("NFKC"), flat = s.toLowerCase().replace(/[\s・ー\-_.。、]/g, "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  if ([...s].length > NOTE_MAX) return `${NOTE_MAX} 字まで`;
  if (/https?:|www|\.(com|net|jp|tv|gg|io|me)\b/i.test(s)) return "URL は 書けない";
  if (/@/.test(s) || /\d{7,}/.test(s.replace(/[\s\-]/g, ""))) return "連絡先は 書けない";
  if (NG_WORDS.some((w) => flat.includes(w))) return "使えない ことばが ある";
  return "";
}
export const REQ_REWARDS = [
  { label: "玉 300", reward: { balls: 300 }, v: 300 }, { label: "玉 1,000", reward: { balls: 1000 }, v: 1000 },
  { label: "アメジスト 1", reward: { res: 1 }, v: 1000 }, { label: "アメジスト 2", reward: { res: 2 }, v: 2000 },
  { label: "素材：月のしずく ×1", reward: { mat: "月のしずく ×1" }, v: 150 }, { label: "装備：蝶ネクタイ ★3", reward: { eq: "蝶ネクタイ ★3" }, v: 3000 },
];
// note は ひとこと。free は 自由に 書いた 文（通報できる）、reports は 見本の 通報の 数
export const REQUESTS = [
  { from: "たぬき", want: "夢のかけら", n: 1, have: 1, reward: { balls: 400 }, left: "あと 2 日", note: "いそぎです" },
  { from: "ぽんず", want: "品質 4 の 霊布", n: 2, have: 0, reward: { res: 2 }, left: "あと 5 時間", note: "霊布の 服を 作りたい！", free: true },
  { from: "しろくま", want: "野いちご", n: 12, have: 4, reward: { mat: "月のしずく ×1" }, left: "あと 1 日", note: "ジャムに します🍓", free: true, reports: 2 },
  { from: "くろまめ", want: "工事のヘルメット ★3 以上", n: 1, have: 1, reward: { eq: "蝶ネクタイ ★3" }, left: "あと 3 日" },
];
