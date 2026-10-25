// DEEP LINK/:（ラウンジの PC から入る、MONO LINK:// の「裏側」のサイト）の見本のデータ。鹿さんの決め、2026-10-22
// タルコフのような商人 5 人 ＋ リソースで買う特別ショップ。商人ごとに友好度（Lv 1〜4）。タスクをクリアすると大きく、売り買いでも少しずつ上がる
// 商人は どうぶつ（名前と どうぶつは 鹿さんの決め、2026-10-22。3D の おもちゃは traders3d.js、顔の絵は img/trader-*.png）。品ぞろえ・数字はすべて仮。画面は deeplink.html

import { GATHER, ENEMY_MAT } from "./materials.js";
import { BASES } from "./equip.js";
import { CRAFT, SYNTH } from "./recipes.js";
import { DUNGEONS } from "./dungeons.js";

export const REP_LV = [0, 100, 250, 500];   // 友好度 Lv 2・3・4 になる点（Lv 1 は 0 点から）
export const repLv = (p) => REP_LV.filter((x) => p >= x).length;

// タスク：tasks.js が 決まりから 作る（つながりは 終わりが ない・毎日 1 つ）。chain は いま 何こ目か、prog は 見本の 進み（need に かける 割合）
// 品の id と get は 門番が 渡す 中身（get：mat・snacks・items・tools・acc・recipe・perk。pick は えらべる 物の 一覧。q は 品質の くじ）
const FOE_MATS = DUNGEONS.flatMap((d) => d.foes.map((f) => ENEMY_MAT[f.tree][0]));   // ふつうの 敵の素材
// ショップ：lv はその友好度 Lv から買える。cur は 玉 か リソース。stock は 1 日に 買える数（毎日 もどる。week は 1 週ごと）、left は 見本の きょうの のこり。once は 1 回だけ。tool は 派遣に 持っていく 道具（dungeons.js の TOOLS）
// 品ぞろえは 鹿さんの決め（2026-10-22）。値段は すべて 仮
export const TRADERS = [
  { id: "junk", name: "ガラク", animal: "アライグマ", role: "素材の買い取り・交換", rep: 140, say: "いらない物は、なんでも 買うよ。",
    chain: 7, prog: { chain: 1, daily: 0.4 },   // 見本：いま 7 こ目（もう 報告できる）・きょうの タスクは 4 割
    shop: [
      { id: "j-g1", name: "採取の素材（ハルス街道）", note: "薬草・きれいな小石・麦わら・野いちご", price: 30, cur: "balls", lv: 1, stock: 10, left: 10, get: { mat: "pick" }, pick: GATHER.hals.mats.map(([id]) => id) },
      { id: "j-sell", name: "素材を まとめて 売る", note: "持っている素材を 玉に かえる", price: 0, cur: "balls", lv: 1, sell: true },
      { id: "j-g2", name: "採取の素材（モーフィアス遺跡・暗い村）", note: "8 しゅるい", price: 40, cur: "balls", lv: 2, stock: 10, left: 6, get: { mat: "pick" }, pick: [...GATHER.morph.mats, ...GATHER.kurai.mats].map(([id]) => id) },
      { id: "j-trade", name: "素材の 交換", note: "同じ 行き先の 素材 3 こ → ほしい 1 こ", price: 0, cur: "balls", lv: 2, trade: true },
      { id: "j-g3", name: "採取の素材（水晶洞窟）", note: "水晶のかけら・光る石・地底の水・鉄鉱石", price: 60, cur: "balls", lv: 3, stock: 10, left: 10, get: { mat: "pick" }, pick: GATHER.crystal.mats.map(([id]) => id) },
      { id: "j-sell10", name: "買い取り ＋10%", note: "ずっと 高く 売れる", price: 2000, cur: "balls", lv: 3, once: true, get: { perk: "sell10" } },
      { id: "j-rare", name: "かくし通路の レア素材", note: "四つ葉のクローバー・夢のかけら・月のしずく・虹水晶", price: 600, cur: "balls", lv: 4, stock: 1, left: 1, get: { mat: "pick" }, pick: Object.values(GATHER).map((g) => g.hidden[0]) },
      { id: "j-sell20", name: "買い取り ＋20%", note: "＋10% と あわせて", price: 5000, cur: "balls", lv: 4, once: true, get: { perk: "sell20" } },
    ] },
  { id: "doc", name: "ウール先生", animal: "ヒツジ", role: "回復・おやつ・救護室の部品", rep: 60, say: "むりは しないこと。休むのも 仕事だよ。",
    chain: 3, prog: { chain: 0.5, daily: 1 },
    shop: [
      { id: "d-snack", name: "懐柔のおやつ", note: "なかよしゲージ ＋1", price: 50, cur: "balls", lv: 1, stock: 10, left: 7, get: { snacks: 1 } },
      { id: "d-snack5", name: "おやつ 5 こ セット", note: "1 こ 46 玉", price: 230, cur: "balls", lv: 2, stock: 3, left: 3, get: { snacks: 5 } },
      { id: "d-herb", name: "薬草", note: "おやつ工房・救護室で 使う", price: 30, cur: "balls", lv: 2, stock: 10, left: 10, get: { mat: "herb" } },
      { id: "d-snack3", name: "とくべつおやつ", note: "なかよしゲージ ＋3", price: 300, cur: "balls", lv: 3, stock: 3, left: 3, get: { items: { snack3: 1 } } },
      { id: "d-tea", name: "元気のお茶", note: "派遣に 持っていく：力つきても 1 回だけ 全回復", price: 600, cur: "balls", lv: 4, stock: 2, left: 2, tool: "tea", get: { tools: { tea: 1 } } },
    ] },
  { id: "hanger", name: "ピーコ", animal: "クジャク", role: "装備を売る", rep: 30, say: "似合う物を さがしに おいで。",
    chain: 2, prog: { chain: 0.3, daily: 0 },
    shop: [
      { id: "h-acc1", name: "装備 ★1", note: "12 しゅるいから えらぶ。OP は くじ", price: 120, cur: "balls", lv: 1, stock: 3, left: 3, get: { acc: 1 }, pick: BASES.map((b) => b.id) },
      { id: "h-acc2", name: "装備 ★2", note: "12 しゅるいから えらぶ。OP は くじ", price: 360, cur: "balls", lv: 2, stock: 2, left: 2, get: { acc: 2 }, pick: BASES.map((b) => b.id) },
      { id: "h-acc3", name: "装備 ★3", note: "12 しゅるいから えらぶ。OP は くじ", price: 1200, cur: "balls", lv: 3, stock: 1, left: 1, get: { acc: 3 }, pick: BASES.map((b) => b.id) },
      { id: "h-acc3op", name: "装備 ★3・OP を 1 つ えらべる", note: "のこりの OP は くじ", price: 2500, cur: "balls", lv: 4, stock: 1, left: 1, get: { acc: 3, op: true }, pick: BASES.map((b) => b.id) },
    ] },
  { id: "mecha", name: "ボルト", animal: "ビーバー", role: "施設の部品・作業台のレシピ", rep: 260, say: "部品さえ あれば、なんでも 作れる。",
    chain: 11, prog: { chain: 0.8, daily: 0.5 },
    shop: [
      { id: "m-nail", name: "古い釘", note: "作業台・施設で 使う", price: 30, cur: "balls", lv: 1, stock: 10, left: 10, get: { mat: "oldnail" } },
      { id: "m-recipe", name: "作るの レシピ", note: "素材を 拾う前に レシピを 1 つ 出せる", price: 400, cur: "balls", lv: 2, stock: 1, left: 1, get: { recipe: "craft" }, pick: CRAFT.map((r) => r.base) },
      { id: "m-iron", name: "鉄鉱石", note: "作業台・施設で 使う", price: 60, cur: "balls", lv: 3, stock: 10, left: 10, get: { mat: "ironore" } },
      { id: "m-synth", name: "合成の レシピ", note: "上の装備の レシピを 1 つ 出せる", price: 1000, cur: "balls", lv: 3, stock: 1, left: 1, get: { recipe: "synth" }, pick: SYNTH.map((r) => r.out) },
      { id: "m-shelf", name: "倉庫の棚", note: "倉庫に 1 しゅるい 置ける数 ＋25", price: 1500, cur: "balls", lv: 4, once: true, get: { perk: "shelf" } },
    ] },
  { id: "hunter", name: "ホーク", animal: "タカ", role: "敵をたおす・捕まえるタスク", rep: 10, say: "えものの 話なら、まかせて。",
    chain: 1, prog: { chain: 0.6, daily: 0 },
    shop: [
      { id: "k-lure", name: "おとりの笛", note: "派遣に 持っていく：えらんだ 敵と 出会いやすい", price: 250, cur: "balls", lv: 1, stock: 3, left: 3, tool: "lure", get: { tools: { lure: 1 } } },
      { id: "k-net", name: "捕獲ネット", note: "派遣に 持っていく：捕まえる 確率 2 倍", price: 600, cur: "balls", lv: 2, stock: 2, left: 2, tool: "net", get: { tools: { net: 1 } } },
      { id: "k-mat2", name: "敵の素材（品質 2）", note: "ふつうの 敵の素材。しゅるいを えらぶ", price: 80, cur: "balls", lv: 3, stock: 3, left: 3, get: { mat: "pick", q: [2] }, pick: FOE_MATS },
      { id: "k-mat34", name: "敵の素材（品質 3〜4）", note: "ふつうの 敵の素材。しゅるいを えらぶ", price: 200, cur: "balls", lv: 4, stock: 2, left: 2, get: { mat: "pick", q: [3, 4] }, pick: FOE_MATS },
      { id: "k-boss", name: "ボスの素材", note: "1 週に 1 こ", price: 1500, cur: "balls", lv: 4, stock: 1, left: 1, week: true, get: { mat: "pick", q: [5] }, pick: DUNGEONS.map((d) => ENEMY_MAT[d.boss.tree][0]) },
    ] },
];
// 特別ショップ：リソースで買う、ここだけの品（家具は ラウンジの お店で 買うので 置かない。鹿さんの決め）
export const SPECIAL = { id: "special", name: "ヨル", animal: "黒ネコ", dir: "特別ショップ", role: "リソースで買える、ここだけの品", say: "リソースで しか 買えない 物が ある。",
  shop: [
    { id: "y-map", name: "かくし通路の地図", note: "1 階ぶん、100% に しなくても 開く", price: 3, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { map: 1 } } },
    { id: "y-collar", name: "なかよしの首輪", note: "なかよしゲージ ＋5", price: 4, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { collar: 1 } } },
    { id: "y-charm", name: "くじの お守り", note: "次の 作る・合成で ★ ＋1", price: 8, cur: "res", lv: 1, stock: 1, left: 1, get: { items: { charm: 1 } } },
  ] };
// みんなの依頼（ユーザーから ユーザーへ。鹿さんの決め、2026-10-22）。見本の 名前は 仮
// ・お礼は 出すときに 先に 預ける。届いたら すぐ 届けた人へ、期限が 来たら もどる
// ・頼めるのは 素材と 装備。お礼は 玉・リソース・素材・装備（物どうしの 交換も できる）
// ・手数料：お礼の ねうちの 1 割を 玉で、出した人が はらう（届けた人は お礼を ぜんぶ もらう）。ねうちは リソース 1 ＝ 玉 1,000、素材は 売ると いくらか、装備は ★ × リソース 1。期限が 来ても 手数料は もどらない（案）
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
  { label: "リソース 1", reward: { res: 1 }, v: 1000 }, { label: "リソース 2", reward: { res: 2 }, v: 2000 },
  { label: "素材：月のしずく ×1", reward: { mat: "月のしずく ×1" }, v: 150 }, { label: "装備：蝶ネクタイ ★3", reward: { eq: "蝶ネクタイ ★3" }, v: 3000 },
];
// note は ひとこと。free は 自由に 書いた 文（通報できる）、reports は 見本の 通報の 数
export const REQUESTS = [
  { from: "たぬき", want: "夢のかけら", n: 1, have: 1, reward: { balls: 400 }, left: "あと 2 日", note: "いそぎです" },
  { from: "ぽんず", want: "品質 4 の 霊布", n: 2, have: 0, reward: { res: 2 }, left: "あと 5 時間", note: "霊布の 服を 作りたい！", free: true },
  { from: "しろくま", want: "野いちご", n: 12, have: 4, reward: { mat: "月のしずく ×1" }, left: "あと 1 日", note: "ジャムに します🍓", free: true, reports: 2 },
  { from: "くろまめ", want: "工事のヘルメット ★3 以上", n: 1, have: 1, reward: { eq: "蝶ネクタイ ★3" }, left: "あと 3 日" },
];
