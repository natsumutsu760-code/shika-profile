// 英語の 辞書：トークン（意味は 株式。画面では「株」と 書かない。DEEP LINK/: の deeplink-stock.js・門番 lounge-stock.js の 返事。2026-11-05）
import { STOCKS, GROUPS } from "./stocks.js";
const WHY_EN = {
  "国境の 緊張で 受注が ふえた": "border tensions lift orders", "停戦の うわさで 売られた": "sold on ceasefire rumors", "討伐の 依頼が 相次ぐ": "hunting contracts pile up", "狩り場の 封鎖で 足踏み": "stalled by hunting-ground closures",
  "坑道の 採掘量が ふえた": "mine output is up", "落盤の 報告で 売られた": "sold on cave-in reports", "施設の 電力が 足りない": "facilities short on power", "送電網の 故障が 響いた": "grid failure weighs",
  "救護の 需要が ふえた": "demand for medical care rises", "新薬の 治験が 遅れた": "new drug trial delayed", "保険の 契約が ふえた": "more policies signed", "支払いが かさんだ": "claims pile up",
  "預金が 集まって いる": "deposits flowing in", "取りつけの うわさ": "bank-run rumors", "収穫期の 需要": "harvest-season demand", "作物の 病気の うわさ": "crop-blight rumors",
  "防具の 注文が ふえた": "armor orders up", "布の 値上がりが 響いた": "cloth prices weigh", "施設の 工事が 相次ぐ": "construction jobs pile up", "工期の 遅れが 響いた": "construction delays weigh",
  "家具の 新作が 話題": "new furniture line is a hit", "注文の 取り消しが 続く": "cancellations continue", "島への 便が 満席": "island routes fully booked", "嵐で 便が 止まった": "storms halt shipping",
  "鑑定の 行列が できた": "lines form for appraisals", "掘り出し物が 減った": "fewer finds", "換金の 窓口が 混雑": "exchange counter is packed", "情報の 出どころに 疑い": "doubts over intel sources",
};
export const WORDS = {
  ...Object.fromEntries(STOCKS.map((s) => [s.name, s.en])), ...Object.fromEntries(Object.values(GROUPS).filter((g) => /[^\x00-\x7F]/.test(g.name)).map((g) => [g.name, g.en])), ...WHY_EN,
  "ひらく ▲": "Open ▲", "しまう ▼": "Close ▼",   // スマホの 下の 引き出し（phone-drawer.js。前から 訳が なかった）
  "最小 #": "Min #",
  "トークン": "Tokens", "# 社の 取引所": "Exchange · # companies", "つぎの 配当まで #": "Next dividend in #", "つぎの 配当まで": "Next dividend in",
  "一覧 #": "List #", "保有 #": "Held #", "ニュース": "News", "グループ": "Group", "ぜんぶ #": "All #", "ハルモニア #": "Harmonia #", "中立 #": "Neutral #", "中立": "Neutral",
  "ならべる": "Sort", "グループ順": "By group", "動いた順": "Biggest moves", "配当": "Dividend", "保有": "Held", "24 時間": "24h", "# 日の 値": "#-day range",
  "売ると": "If sold", "# トークンの 配当": "Dividend / token", "保有分で #": "Yours: #", "数": "Qty", "ぜんぶ": "All", "買う": "Buy", "売る": "Sell",
  "買う：およそ #": "Buy ≈ #", "買う：およそ #　売る：およそ #": "Buy ≈ #   Sell ≈ #", "手数料 #% こみ": "incl. #% fee",
  "前の 配当 #（#/# #:#）・これまで #": "Last dividend # (#/# #:#) · Total #",
  "まだ トークンを 持って いない。「一覧」で えらんで 買える": "No tokens yet. Pick one under List to buy.", "まだ ニュースは ない": "No news yet",
  "取引所に つないで います …": "Connecting to the exchange…", "取引所に つながらない": "Can't reach the exchange", "準備中（トークンは、公開まで もう 少し お待ちください）": "Coming soon (tokens open shortly)",
  "会社を えらんで": "Pick a company", "トークンの 数は 1〜1000": "Tokens: 1–1000", "取引所が こたえませんでした。つぎに 開いた ときに 決まります": "The exchange didn't answer. It will settle next time you open it.",
  "前の 取引の 返事を 待って いる（取引所が こたえません）": "Waiting on your last trade (the exchange isn't answering)", "返事が とどかなかったので 取り消した": "Cancelled (no reply)",
};
export const RULES = [
  [/^(.+)、24 時間で (\d+)% (上昇|下落)（(.+)）$/, (m, p) => { const a = p(m[1]), b = p(m[4]); return a && b ? `${a} ${m[3] === "上昇" ? "up" : "down"} ${m[2]}% in 24h (${b})` : null; }],
  [/^(.+)、値が (上限|下限)の (\d+) に$/, (m, p) => { const a = p(m[1]); return a ? `${a} hits the ${m[2] === "上限" ? "ceiling" : "floor"} of ${m[3]}` : null; }],
  [/^きょうの 配当 1 位：(.+)（1 トークン ([\d.]+)）$/, (m, p) => { const a = p(m[1]); return a ? `Today's top dividend: ${a} (${m[2]} / token)` : null; }],
  [/^(買った|売った)：([A-Z]{3}) ([\d,]+) トークン（1 トークン ([\d.]+)・(払った|もらった) ([\d,]+)）(?:　損益 ([＋−])([\d,]+))?$/, (m) => `${m[1] === "買った" ? "Bought" : "Sold"}: ${m[2]} ${m[3]} tokens (${m[4]} each · ${m[5] === "払った" ? "paid" : "got"} ${m[6]})${m[7] ? `  P/L ${m[7] === "＋" ? "+" : "−"}${m[8]}` : ""}`],
  [/^([\d,]+) クレジットから（いまの 値で ([\d,]+) トークン〜）$/, (m) => `From ${m[1]} credits (${m[2]}+ tokens at today's price)`],
  [/^1 社 ([\d,]+) トークンまで（いま ([\d,]+)）$/, (m) => `Up to ${m[1]} tokens per company (you have ${m[2]})`],
  [/^売りに 出て いる トークンが 足りない（あと ([\d,]+)）$/, (m) => `Not enough tokens on offer (${m[1]} left)`],
  [/^持って いる トークンが 足りない（([\d,]+)）$/, (m) => `You don't have that many tokens (${m[1]})`],
  [/^足りない：クレジット あと ([\d,]+)$/, (m) => `Not enough: ${m[1]} more credits`],
  [/^クレジットが 足りない：あと ([\d,]+)$/, (m) => `Not enough credits: ${m[1]} more`],
];
