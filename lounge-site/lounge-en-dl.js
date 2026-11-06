// 英語の 辞書：DEEP LINK/:（deeplink.html・deeplink.js）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const P = (p, s) => p(s) || s;
const n1 = (n, one, many) => (n === "1" ? `1 ${one}` : `${n} ${many}`);

export const WORDS = {
  "商人": "Traders", "< ラウンジに もどる": "< Back to Lounge", "> 商人": "> Traders", "友好度 Lv#": "Rapport Lv#", "友好 ＋#": "Rapport +#", "みんなの依頼": "Requests board", "クローラー": "Crawler", "先行体験版": "Early access",
  "ごほうび": "Reward", "拾った物": "Found", "おわった": "Done", "報告する": "Report", "友好度": "Rapport", "タスク #": "Tasks #", "ショップ #": "Shop #", "タスク": "Tasks", "ショップ": "Shop",
  "いちばん上": "Max", "1 回だけ": "Once only", "今週": "This week", "来週": "Next week", "あした": "Tomorrow", "売る": "Sell", "交換する": "Trade", "買った": "Bought", "売り切れ": "Sold out",
  "友好度 Lv# で 買える": "Unlocks at Rapport Lv#", "えらべる 物が ない（レシピは もう ぜんぶ 出て いる）": "Nothing to choose (all recipes are already unlocked)",
  "店で 買った 物から 先に 売る": "Items bought at shops are sold first", "売る 数": "Amount to sell", "（買い取り ＋#%）": "(buyback +#%)", "全": "All", "この しゅるいの 素材は ない": "No materials of this type",
  "ほしい 物": "Want", "同じ 行き先の 採取の 素材が 3 こ ない": "You don't have 3 gathered materials from the same destination", "支払いは": "Pay with", "だけ": "only",
  "アメジストは 招待・毎晩の 大会・虹保留・!アメジスト交換（玉 500 → 1）で 手に 入る": "Amethyst comes from invites, the nightly tournament, rainbow holds, and !アメジスト交換 (500 balls → 1)",
  "もうすぐ おわる": "Ending soon", "消す": "Delete", "通報": "Report", "さんの 依頼": "'s request", "お礼": "Reward", "届ける": "Deliver", "だれか": "Someone",
  "いま 出している 依頼": "Your active request", "取り下げる": "Withdraw", "依頼は # 人 # つまで": "Up to #2 request(s) per person", "依頼を 板に 送って います": "Sending your request to the board",
  "つぎに 開いた ときに 板に 出ます": "It'll appear on the board next time you open this", "ほしい物": "Wanted", "品質": "Quality", "お礼の 玉": "Reward balls", "お礼の アメジスト": "Reward Amethyst",
  "期限": "Deadline", "ひとこと": "Note", "ひとこと（# 字まで）": "Note (up to # characters)", "依頼を 出す": "Post request", "お礼 玉": "Reward: balls", "じぶんで 書く": "Write my own", "手数料": "Fee",
  "（お礼の 1 割・出す人が はらう）": "(10% of the reward, paid by the poster)", "# 以上": "# or more", "なんでも": "Any", "ほしい物を 届けると、預けてある お礼が もらえる": "Deliver what they want to receive the deposited reward",
  "いまは ほかの 人の 依頼が ない": "No requests from others right now", "> MONO LINK で ログイン": "> Log in to MONO LINK", "（冒険の じゅんびで 持っていける）": "(take it when preparing an adventure)",
  " → 装備に 入った": " → added to gear", "→ 装備に 入った": "→ added to gear", "→ 作業台に レシピが 出た": "→ recipe unlocked at the Workbench", "（板に 送って います）": "(sending to the board)",
  "取り下げた：お礼は もどる（手数料は もどらない）": "Withdrawn: the reward is returned (the fee isn't)", "通報した：ひとことを かくした": "Reported: the note was hidden", "通報した": "Reported",
  "通報できませんでした": "Couldn't report", "ひとことを 消した": "Note deleted", "消せませんでした": "Couldn't delete", "あなた": "you", "ようこそ。": "Welcome.",
  "MONO LINK:// を うらがえしています …": "Flipping MONO LINK:// inside out …", "DEEP LINK/: に つないでいます …": "Connecting to DEEP LINK/: …",
  "特別ショップ": "Special Shop", "素材": "Materials", "装備": "Gear",
  // 友好度 Lv100・章の 物語・新しい 2 人と 保険（2026-11-03）
  "物語": "Story", "物語は まだ ない": "No story yet", "つぎの 章は 新しい 島と いっしょに 出る": "The next chapter comes with a new island", "派遣に 出る ときに 掛ける": "Taken out when you set off on a trip",
  "アンビル": "Anvil", "ミネルバ": "Minerva", "サイ": "Rhino", "フクロウ": "Owl", "……試して みろ。いい 品だ。": "...Try it. It's good work.", "契約書の、ここを よく 読んでね。": "Read this part of the contract carefully.",
  "武器と アタッチメントの 素材": "Weapons and attachment materials", "保険（出発の 前に 掛ける）": "Insurance (taken out before you set off)", "防具（あたま・くび）を売る": "Sells armor (head and neck)",
  "武器 ★1": "Weapon ★1", "武器 ★2": "Weapon ★2", "武器 ★3": "Weapon ★3", "武器 ★3・OP を 1 つ えらべる": "Weapon ★3 · choose 1 OP", "4 しゅるいから えらぶ。OP は くじ": "Choose from 4 types. OPs are random",
  "防具 ★1": "Armor ★1", "防具 ★2": "Armor ★2", "防具 ★3": "Armor ★3", "防具 ★3・OP を 1 つ えらべる": "Armor ★3 · choose 1 OP", "あたま・くびの 8 しゅるいから えらぶ。OP は くじ": "Choose from 8 head/neck types. OPs are random",
  "アタッチメントの 素材": "Attachment materials", "工房で 武器の アタッチメントを 作る 敵の素材。しゅるいを えらぶ": "Enemy materials for weapon attachments at the Workshop. Choose the type",
  "武器の 委託の 枠 ＋1": "Weapon consignment slot +1", "作った 武器を 店に 並べる 枠": "A slot to list weapons you made", "防具の 委託": "Armor consignment", "作った 防具を 店に 並べて 売る": "List armor you made in the shop",
  "装備開発・施設で 使う": "Used for gear development and facilities", "星麻を 織った 布": "Cloth woven from star flax", "天綿を 織った 布": "Cloth woven from sky cotton", "白砂綿を 織った 布": "Cloth woven from white-sand cotton",
  "保険（ふつう）": "Insurance (basic)", "派遣に 出る ときに 掛ける。力つきたら 失った 素材の 半分が 2 時間 あとに 届く": "Taken out when you set off. If you collapse, half of the lost materials arrive 2 hours later",
  "手厚い 保険": "Full insurance", "保険料 2 倍。失った 素材が ぜんぶ 30 分 あとに 届く": "Double premium. All lost materials arrive 30 minutes later", "保険料 割引": "Premium discount", "保険料 −20%": "Premium −20%",
  "支払いが すぐ 届く": "Instant payouts", "保険の 支払いを 待たずに うけとる": "Get insurance payouts without waiting", "船の 保険": "Ship insurance", "ビサイ諸島の 保険料 −20%（割引と あわせて）": "Bisai Isles premium −20% (stacks with the discount)",
  "建設の 時間 −10%": "Build time −10%", "建設の 時間 −20%": "Build time −20%", "施設の 建設が 早く 進む": "Facility construction goes faster", "−10% と あわせて": "Stacks with −10%", "−10% と あわせて −20%": "−20% in total with −10%",
  "侵入の 呼び寄せ": "Call an intruder", "この 派遣の 侵入 1% → 20%": "Intruder chance 1% → 20% on this trip", "希少種の 呼び寄せ": "Call rare monsters", "この 派遣の 希少な 敵 ×3": "Rare enemies ×3 on this trip",
  "持っている素材を クレジットに かえる": "Turn your materials into credits", "1 こ 46": "46 each",
  "いまは プライマリータスクが ない": "No story task right now", "その タスクは いまの タスクでは ない": "That isn't the current task", "プライマリータスクを 進めると 買える": "Unlocks as you progress the story",
  "ガラクの 第 1 章を 終えると 使える": "Unlocks after Garaku's Chapter 1",
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
  [/^つながり #(\d+)$/, (m) => `Chain #${m[1]}`], [/^ランダム #(\d+)$/, (m) => `Random #${m[1]}`], [/^物語(.*)$/, (m) => `Story${m[1]}`],
  [/^第 (\d+) 章を 終えると 上がる$/, (m) => `Rises after Chapter ${m[1]}`], [/^第 (\d+) 章を 終えると 買える$/, (m) => `Buy after finishing Chapter ${m[1]}`], [/^第 (\d+) 章「(.+)」(?:　(\d+) \/ (\d+))?$/, (m) => `Chapter ${m[1]} "${m[2]}"${m[3] ? ` ${m[3]} / ${m[4]}` : ""}`],
  [/^第 (\d+) 章まで ぜんぶ 終えた$/, (m) => `All chapters up to ${m[1]} done`], [/^ここで 止まって いる：(.+)が できたら 先へ$/, (m) => `Stopped here: continues once ${m[1]} exists`],
  [/^友好度を Lv(\d+) に すると 始まる$/, (m) => `Starts at Rapport Lv${m[1]}`], [/^止まる：(.+)$/, (m) => `Stops at: ${m[1]}`], [/^章の 一覧（(\d+) 章）$/, (m) => `Chapters (${m[1]})`],
  [/^店に「(.+)」(が 並んだ)?$/, (m, p) => `${m[2] ? "Now in the shop" : "Shop"}: "${P(p, m[1])}"`], [/^(.+)へ 行ける$/, (m, p) => `Unlocks ${P(p, m[1])}`],
  [/^(.+)が できたら$/, (m) => `When ${m[1]} exists`], [/^(.+)の 第 (\d+) 章で 開く$/, (m, p) => `Unlocks in ${P(p, m[1])}'s Chapter ${m[2]}`],
  [/^クレジット ([\d,]+)〜([\d,]+)$/, (m) => `${m[1]}–${m[2]} credits`], [/^売る（(\d+) こ・クレジット ([\d,]+)）$/, (m) => `Sell (${m[1]} · ${m[2]} credits)`], [/^売った：クレジット ([\d,]+)$/, (m) => `Sold: ${m[1]} credits`],
  [/^受けとった！ クレジット ＋([\d,]+)(.*)$/, (m, p) => `Claimed! +${m[1]} credits${m[2] ? " " + P(p, m[2].trim()) : ""}`], [/^保険料 (\d+) クレジット・力つきても 素材の (ぜんぶ|半分)が (30 分|2 時間) あとに 届く$/, (m) => `Premium ${m[1]} credits · if you collapse, ${m[2] === "ぜんぶ" ? "all" : "half"} of the materials arrive ${m[3] === "30 分" ? "30 minutes" : "2 hours"} later`],
  [/^・力つきて 素材 (\d+) こを 失った(.*)$/, (m) => ` · collapsed and lost ${m[1]} materials${m[2] ? m[2].replace(/（保険で (\d+) こ が あとで 届く）/, " (insurance will deliver $1 later)") : ""}`],
  [/^保険料が 足りない：クレジット あと ([\d,]+)$/, (m) => `Not enough for the premium: ${m[1]} more credits`], [/^じょうけん：(.+)$/, (m, p) => p(m[1]) && `Condition: ${p(m[1])}`],
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
  [/^依頼を 出した：お礼と 手数料 ([\d,]+) クレジットを 預けた(.*)$/, (m, p) => `Request posted: deposited ${m[1]} credits for the reward and fee${m[2] ? " " + P(p, m[2]) : ""}`],
];
