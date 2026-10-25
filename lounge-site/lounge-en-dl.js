// 英語の 辞書：DEEP LINK/:（deeplink.html・deeplink.js）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const P = (p, s) => p(s) || s;
const n1 = (n, one, many) => (n === "1" ? `1 ${one}` : `${n} ${many}`);

export const WORDS = {
  "商人": "Traders", "< ラウンジに もどる": "< Back to Lounge", "> 商人": "> Traders", "友好度 Lv#": "Rapport Lv#", "友好 ＋#": "Rapport +#", "みんなの依頼": "Requests board",
  "ごほうび": "Reward", "拾った物": "Found", "おわった": "Done", "報告する": "Report", "友好度": "Rapport", "タスク #": "Tasks #", "ショップ #": "Shop #", "タスク": "Tasks", "ショップ": "Shop",
  "いちばん上": "Max", "1 回だけ": "Once only", "今週": "This week", "来週": "Next week", "あした": "Tomorrow", "売る": "Sell", "交換する": "Trade", "買った": "Bought", "売り切れ": "Sold out",
  "友好度 Lv# で 買える": "Unlocks at Rapport Lv#", "えらべる 物が ない（レシピは もう ぜんぶ 出て いる）": "Nothing to choose (all recipes are already unlocked)",
  "店で 買った 物から 先に 売る": "Items bought at shops are sold first", "（買い取り ＋#%）": "(buyback +#%)", "全": "All", "この しゅるいの 素材は ない": "No materials of this type",
  "ほしい 物": "Want", "同じ 行き先の 採取の 素材が 3 こ ない": "You don't have 3 gathered materials from the same destination", "支払いは": "Pay with", "だけ": "only",
  "リソースは コスメの かぶりで もらえる（玉 1,000 → 1 にも かえられる）": "Resources come from cosmetic duplicates (you can also trade 1,000 balls → 1)",
  "もうすぐ おわる": "Ending soon", "消す": "Delete", "通報": "Report", "さんの 依頼": "'s request", "お礼": "Reward", "届ける": "Deliver", "だれか": "Someone",
  "いま 出している 依頼": "Your active request", "取り下げる": "Withdraw", "依頼は # 人 # つまで": "Up to #2 request(s) per person", "依頼を 板に 送って います": "Sending your request to the board",
  "つぎに 開いた ときに 板に 出ます": "It'll appear on the board next time you open this", "ほしい物": "Wanted", "品質": "Quality", "お礼の 玉": "Reward balls", "お礼の リソース": "Reward Resources",
  "期限": "Deadline", "ひとこと": "Note", "ひとこと（# 字まで）": "Note (up to # characters)", "依頼を 出す": "Post request", "お礼 玉": "Reward: balls", "じぶんで 書く": "Write my own", "手数料": "Fee",
  "（お礼の 1 割・出す人が はらう）": "(10% of the reward, paid by the poster)", "# 以上": "# or more", "なんでも": "Any", "ほしい物を 届けると、預けてある お礼が もらえる": "Deliver what they want to receive the deposited reward",
  "いまは ほかの 人の 依頼が ない": "No requests from others right now", "> MONO LINK で ログイン": "> Log in to MONO LINK", "（冒険の じゅんびで 持っていける）": "(take it when preparing an adventure)",
  " → 装備に 入った": " → added to gear", "→ 装備に 入った": "→ added to gear", "→ 作業台に レシピが 出た": "→ recipe unlocked at the Workbench", "（板に 送って います）": "(sending to the board)",
  "取り下げた：お礼は もどる（手数料は もどらない）": "Withdrawn: the reward is returned (the fee isn't)", "通報した：ひとことを かくした": "Reported: the note was hidden", "通報した": "Reported",
  "通報できませんでした": "Couldn't report", "ひとことを 消した": "Note deleted", "消せませんでした": "Couldn't delete", "あなた": "you", "ようこそ。": "Welcome.",
  "MONO LINK:// を うらがえしています …": "Flipping MONO LINK:// inside out …", "DEEP LINK/: に つないでいます …": "Connecting to DEEP LINK/: …",
  "特別ショップ": "Special Shop", "素材": "Materials", "装備": "Gear",
  // 依頼の 決まり（deeplink.js）
  "# 時間": "# h", "いそぎです": "It's urgent", "品質 高めだと うれしい": "Higher quality appreciated", "何回かに 分けても OK": "Partial deliveries OK", "のんびり 待ちます": "No rush",
  "はじめて 出しました": "My first request", "よろしく おねがいします": "Thank you!", "URL は 書けない": "URLs aren't allowed", "連絡先は 書けない": "Contact info isn't allowed", "使えない ことばが ある": "Contains words that aren't allowed",
  "# 字まで": "Up to # characters",
};

export const RULES = [
  [/^([^・]+)・(.+)$/, (m, p) => p(m[1]) && p(m[2]) && `${p(m[1])} · ${p(m[2])}`],   // 「アライグマ・素材の買い取り・交換」（動物・役目）
  [/^(\d+) 日$/, (m) => n1(m[1], "day", "days")],
  [/^(.+) の ラウンジ PC から 接続中$/, (m) => `Connected from ${m[1]}'s lounge PC`], [/^(.+)（管理）で 接続中$/, (m) => `Connected as ${m[1]} (admin)`],
  [/^(.+) の ラウンジ PC を 確認しました$/, (m, p) => `Verified ${m[1] === "あなた" ? "your" : m[1] + "'s"} lounge PC`],
  [/^つながり #(\d+)$/, (m) => `Chain #${m[1]}`], [/^じょうけん：(.+)$/, (m, p) => p(m[1]) && `Condition: ${p(m[1])}`],
  [/^売る 素材を えらぶ(.*)$/, (m, p) => `Choose materials to sell${m[1] ? " " + P(p, m[1]) : ""}`], [/^売る（(\d+) こ・玉 ([\d,]+)）$/, (m) => `Sell (${m[1]} · ${m[2]} balls)`],
  [/^あげる：(.+)$/, (m, p) => p(m[1]) && `Give: ${p(m[1])}`],
  [/^(.+?)(?:（品質 (\d) 以上）)?を (\d+) こ$/, (m, p) => p(m[1]) && `${m[3]} × ${p(m[1])}${m[2] ? ` (Q${m[2]}+)` : ""}`], [/^(.+) ★(\d) 以上を 1 つ$/, (m, p) => p(m[1]) && `1 × ${p(m[1])} ★${m[2]}+`],
  [/^(.+) ★(\d) 以上$/, (m, p) => p(m[1]) && `${p(m[1])} ★${m[2]}+`], [/^品質 (\d) 以上の (.+)$/, (m, p) => p(m[2]) && `${p(m[2])} (Q${m[1]}+)`], [/^品質 (\d) の (.+)$/, (m, p) => p(m[2]) && `${p(m[2])} (Q${m[1]})`],
  [/^通報 (\d+)$/, (m) => `Reports ${m[1]}`], [/^出せない：(.+)$/, (m, p) => `Can't post: ${P(p, m[1])}`], [/^持っている (\d+) \/ (\d+)$/, (m) => `Have ${m[1]} / ${m[2]}`],
  [/^(.+) お礼$/, (m, p) => p(m[1]) && `Reward: ${p(m[1])}`], [/^(\S+)の (\S+)$/, (m, p) => p(m[1]) && p(m[2]) && `${p(m[1])}'s ${p(m[2])}`],   // 「ヨルの 特別ショップ」
  [/^受けとった！(.*)$/, (m, p) => `Claimed!${m[1] ? " " + P(p, m[1]) : ""}`], [/^友好度 Lv(\d) に なった$/, (m) => `Rapport reached Lv${m[1]}`], [/^次の タスク（#(\d+)）が 出た$/, (m) => `Next task (#${m[1]}) unlocked`],
  [/^買った：(.+?)((?:（冒険の じゅんびで 持っていける）| → 装備に 入った| → 作業台に レシピが 出た)?)$/, (m, p) => p(m[1]) && `Bought: ${p(m[1])}${m[2] ? " " + P(p, m[2].trim()) : ""}`],
  [/^交換した：(.+) が 1 こ 倉庫に 入った$/, (m, p) => p(m[1]) && `Traded: 1 ${p(m[1])} added to Storage`], [/^届けた：お礼 (.+) を もらった$/, (m, p) => `Delivered: got the reward ${P(p, m[1])}`],
  [/^依頼を 出した：お礼と 手数料 玉 ([\d,]+) を 預けた(.*)$/, (m, p) => `Request posted: deposited ${m[1]} balls for the reward and fee${m[2] ? " " + P(p, m[2]) : ""}`],
];
