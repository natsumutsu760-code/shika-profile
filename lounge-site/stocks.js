// 株（トークン）の 銘柄と 値の 決まり。門番（lounge-server/lounge-stock.js）と DEEP LINK/: の 画面が 読む
// 鹿さんの 決め（docs/mono-link-deeplink-story.md）：トークン＝株。クレジットで 買う・売る。サービスに 払った クレジットが その 子会社の 売り上げ →
//   株の 値と 配当（クレジット）に なる。子会社 12 ＋ 中立 2 ＝ 14 銘柄。値は 売り上げ ＋ プレイヤーの 売り買い ＋ NPC の 動きで、基準の 0.5〜2 倍
//   「景品交換の 会社（ヨル）は 換金も 景品も 受けもつ：玉 → クレジットの 換金（鹿物語の !換金）の 量で 株が 動く」
// 数は ぜんぶ 仮（Claude の 案。docs/mono-link-numbers.md の 3 章）

// g：グループ（sva・harmonia・tcu・neutral）。src：売り上げの 入口が まだ ない 銘柄は false（値は 売り上げで 動かない。預金・家具の 効果が できたら 入口を 足す）
export const STOCKS = [
  { co: "VLC", name: "ヴァルコ火器", en: "Valco Arms", g: "sva" },
  { co: "ODH", name: "オルド・ハウンド社", en: "Ord Hound Co.", g: "sva" },
  { co: "DRN", name: "ドルン鉱業", en: "Dorn Mining", g: "sva" },
  { co: "HLX", name: "ヘリクス電力", en: "Helix Power", g: "sva" },
  { co: "MLV", name: "メルヴィル製薬", en: "Melville Pharma", g: "harmonia" },
  { co: "AMB", name: "アンバー相互保証", en: "Amber Mutual", g: "harmonia" },
  { co: "SRN", name: "セレナ信託", en: "Serena Trust", g: "harmonia", src: false },
  { co: "CLR", name: "クロロシス・バイオテック", en: "Chlorosis Biotech", g: "harmonia" },
  { co: "RSL", name: "ローゼル繊工", en: "Rozel Textiles", g: "tcu" },
  { co: "GRN", name: "グラナート建設", en: "Granat Construction", g: "tcu" },
  { co: "LDN", name: "リンデン家具工房", en: "Linden Furniture Works", g: "tcu", src: false },
  { co: "CRV", name: "キャラバン運送", en: "Caravan Freight", g: "tcu" },
  { co: "GLK", name: "ガラク・サルベージ", en: "Garak Salvage", g: "neutral" },
  { co: "NOX", name: "ノクス仲介", en: "Nox Brokerage", g: "neutral" },
];
export const CO = Object.fromEntries(STOCKS.map((s) => [s.co, s]));
export const isCo = (c) => typeof c === "string" && Object.prototype.hasOwnProperty.call(CO, c);   // 「__proto__」などは 銘柄に しない
export const GROUPS = { sva: { name: "SVA", en: "SVA" }, harmonia: { name: "ハルモニア・コンコード", en: "Harmonia Concord" }, tcu: { name: "TCU", en: "TCU" }, neutral: { name: "中立", en: "Neutral" } };

// 数（仮）
export const ST = {
  shares: 10000,      // 1 銘柄の 株の 数
  base: 100,          // 基準の 値（クレジット）
  min: 50, max: 200,  // 値は 基準の 0.5〜2 倍
  fee: 0.02,          // 売り買いの 手数料（買う ときも 売る ときも。消える ＝ クレジットの 出口）
  cap: 1000,          // 1 人が 1 銘柄 持てる 数（買い占めを ふせぐ）
  minBuy: 5000,       // 1 回に 買う 額（株の 数 × 値）は 5,000 クレジットから。鹿さん「トークンの購入はクレジット5000～できるようにしてください。」（2026-11-06。売る ときは 決まり なし）
  div: 0.05,          // 配当：1 株 ＝ その 日の 売り上げ × 5% ÷ 10,000
  divHour: 22,        // 配当の 時間（日本時間。毎晩の 大会と 同じ）
  flow: 0.0002,       // 買い越し 1 株ごとに ＋0.02%（100 株〈1%〉で ＋2%）。売り越しは 下がる
  flowHalf: 24,       // 買い越しの 効きが 半分に もどる 時間
  noise: 0.03,        // NPC の ゆらぎ：1 時間に ±3% まで
  noiseBack: 0.15,    // ゆらぎが 基準へ もどる 速さ（1 時間に 15%）
  near: 168,          // 売り上げの「直近」：7 日（時間）
  far: 672,           // 売り上げの「ふだん」：28 日（時間）。値の 物差しは 直近 7 日 ÷ ふだん（会社ごとに 大きさが ちがっても 同じ 物差し）
  smooth: 40,         // 1 時間あたりの 売り上げに 足す 数（売り上げが 小さい 会社が すこしの 売り上げで ゆれすぎない）
  hist: 168,          // 値の 記録（1 時間ごと・7 日）
  news: 30,           // ニュースを おぼえて おく 数
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 売り上げの 効き：√((直近 7 日の 1 時間あたり ＋ smooth) ÷ (ふだんの 1 時間あたり ＋ smooth))。直近が ふだんの 4 倍で 2 倍（200）
export const salesPart = (near, far) => Math.sqrt((Math.max(0, near) + ST.smooth) / (Math.max(0, far) + ST.smooth));
export const flowMult = (f) => clamp(1 + ST.flow * f, 0.5, 2);
// 値（小数 1 けた）。sp：売り上げの 効き・z：NPC の ゆらぎ（対数）・f：買い越しの 株の 数
export const priceOf = (sp, z, f) => Math.round(clamp(ST.base * sp * Math.exp(z) * flowMult(f), ST.min, ST.max) * 10) / 10;
// n 株 買う（n < 0 は 売る）ときの 1 株の 平均の 値。売り買いで 値が 動く 分は、その 取引の 中で 平均を とる（自分で 買って 上げた 値で 売り抜けられない）
export const tradePrice = (sp, z, f, n) => clamp(ST.base * sp * Math.exp(z) * flowMult(f + n / 2), ST.min, ST.max);
// 払う・もらう クレジット（手数料 こみ。買う ときは 切り上げ・売る ときは 切り捨て）
export const minShares = (p) => Math.ceil(ST.minBuy / p);   // いまの 値で 買える いちばん 少ない 株の 数
export const tradeCost = (avg, n) => (n > 0 ? Math.ceil(n * avg * (1 + ST.fee)) : -Math.floor(-n * avg * (1 - ST.fee)));
// 1 時間ごとの NPC の ゆらぎ（銘柄と 時間で 決まる。-1〜1）
export const noiseAt = (co, h) => { let x = (h * 2654435761 + co.charCodeAt(0) * 97 + co.charCodeAt(1) * 31 + co.charCodeAt(2)) >>> 0; x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 2246822519) >>> 0; x = (x ^ (x >>> 13)) >>> 0; x = Math.imul(x, 3266489917) >>> 0; x = (x ^ (x >>> 16)) >>> 0; return (x / 4294967296) * 2 - 1; };
