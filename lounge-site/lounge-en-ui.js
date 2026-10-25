// 英語の 辞書：共通の 部品・ラウンジの 部屋・家具の お店・はじめての 子（lounge-en-dict.js が まとめる）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const n1 = (n, one, many) => (n === "1" ? `1 ${one}` : `${n} ${many}`);

export const WORDS = {
  // ---- 通貨（wallet-bar.js）と 門番との やりとり（lounge-client.js） ----
  "玉": "Balls", "リソース": "Resources", "クレジット": "Credits",
  "（配信で 1 回 チャットすると わかります）": "(chat once on stream to see it)", "玉 （配信で 1 回 チャットすると わかります）": "Balls (chat once on stream to see them)",
  "リソース （配信で 1 回 チャットすると わかります）": "Resources (chat once on stream to see them)", "クレジット （配信で 1 回 チャットすると わかります）": "Credits (chat once on stream to see them)",
  "持って いる お金": "Your money", "両替": "Exchange", "両替する": "Exchange",
  "玉と リソースが まだ わかりません（配信で 1 回 チャットすると わかります）": "Balls and Resources aren't known yet (chat once on stream to see them)",
  "とじる": "Close", "わたす": "Pay", "もらう": "Get", "数": "Amount", "ぜんぶ": "All", "わたす 玉": "Balls to pay", "わたす クレジット": "Credits to pay",
  "リソースの 数": "Number of Resources", "1万": "10K", "から": "to", "10 の 倍数で（100 万まで）": "In multiples of 10 (up to 1M)", "リソースは 1〜100 こ": "1–100 Resources",
  "手数料 1 割": "10% fee", "できませんでした": "Couldn't do that",
  "ためしの 門番を 読めません（stream-layouts/ を まるごと 出す サーバーで 開いて ください）": "Can't load the test gatekeeper (open it from a server that serves all of stream-layouts/)",
  "入れません": "Can't enter", "門番に つながりません。もう 1 回 押して ください": "Can't reach the server. Please tap again",
  "たしかめて います…": "Checking…", "配信の 画面の 返事を 待って います。つぎに 開いた ときに 決まります": "Waiting for the stream to reply. It'll be settled next time you open this",
  // ---- ペットの 見出し（pet-head.js） ----
  "ペット": "Pet", "ステータス": "Stats", "スキルツリー": "Skill Tree", "ガンビット": "Gambits", "装備": "Gear", "冒険": "Adventure", "なかま": "Companions", "闘技場": "Arena",
  "もう 1 回 開いて ください": "Please open it again", "MONO LINK で ログイン": "Log in to MONO LINK", "まず 1 匹目を むかえる": "Welcome your first pet",
  "6 つの 質問で、いっしょに 冒険する 子が 決まります": "6 questions decide who will adventure with you", "性格診断へ": "Take the personality quiz",
  "冒険の 画面で えらべます": "You can choose it on the Adventure screen", "職業を えらぶ": "Choose a job",
  "ラウンジ": "Lounge", "プライベートラウンジ": "Private Lounge", "MONO LINK の サイトへ": "To the MONO LINK site",
  // ---- 部屋（lounge-room.html） ----
  "部屋": "Room", "6×6 マスの 部屋。ペットを 押すと なでる": "A 6×6 room. Tap your pet to pet it", "もようがえ": "Redecorate", "家具の お店": "Furniture Shop",
  "☀ 昼": "☀ Day", "☾ 夜": "☾ Night", "昼": "Day", "夜": "Night", "照明：昼": "Lighting: Day", "照明：夜": "Lighting: Night",
  "地下へ": "Down", "ペットを むかえる": "Welcome a pet",
  "ここは ほかの 物と かさなる": "That overlaps something else", "ここには 置けない": "Can't place it here", "回すと ほかの 物に ぶつかる": "Rotating would bump into something",
  "すべて": "All", "床": "Floor", "壁": "Wall", "光る": "Glowing", "壁・はば #": "Wall · width #", "しく 物": "Rugs", "床・#×#": "Floor · #×#", "しく 物・#×#": "Rug · #×#",
  "やめる": "Cancel", "回す": "Rotate", "動かす": "Move", "しまう": "Put away", "PC は DEEP LINK/: の 入口なので しまえない": "The PC is the entrance to DEEP LINK/:, so it can't be put away",
  "この しゅるいは ぜんぶ 置いた": "All of this kind are placed", "ぜんぶ 置いた 物": "All placed", "★の 高い順": "Highest ★", "名前順": "By name",
  "しゅるい": "Type", "持ち物": "Inventory", "できた": "Done", "分け方": "Group by", "置いた # こ": "# placed", "ならべる": "Sort",
  "しまって います…": "Saving…", "しまえなかった": "Couldn't save", "設備": "Equipment", "DEEP LINK/: の 入口": "Entrance to DEEP LINK/:",
  "……なでられた。ねる。": "……got petted. Sleeping.", "はいっ！ なでて いただきました！": "Yes sir! I have been petted!", "なでた なでた！ はしる はしる！": "Petted petted! Running running!",
  "（画面に ハート）": "(a heart on the screen)", "えへへ。あなを ほって くる": "Hehe. Gonna go dig a hole", "なんだっけ… うれしい。ゆらゆら": "What was it… happy. Sway, sway",
  "……。（チクッ）": "……. (prick)", "チャリン♪ コイン ある？": "Jingle♪ Got a coin?", "……ねてた。": "……was sleeping.",
  // ---- 家具の お店（lounge-shop.html） ----
  "配信の 画面の 返事を 待って いる 買い物。つぎに 開いた ときに 決まります": "Purchases waiting for the stream to reply. They'll be settled next time you open this",
  "売り場": "Shop", "くわしく": "Details", "部屋に もどる": "Back to room", "きょうの # 品": "Today's # items", "ガチャの 中身": "Gacha contents", "# しゅるい": "# types",
  "カタログ": "Catalog", "# こ": "#", "レア": "Rarity", "安い順": "Cheapest", "インテリアガチャ": "Furniture Gacha", "かぶったら # こ目": "Duplicates become a #nd copy",
  "# 回 まわす": "Pull ×#", "リソースが まだ わかりません（配信で 1 回 チャットすると わかります）": "Resources aren't known yet (chat once on stream to see them)",
  "部屋に 置く": "Place in room", "ガチャの #% の 中の 1 つ": "One of the #% in the gacha", "ガチャへ もどる": "Back to gacha", "買う": "Buy", "2 割引き": "20% off",
  "返事まち #": "Waiting #", "日替わり": "Daily", "ガチャ": "Gacha", "まわして います…": "Pulling…",
  // ---- はじめての 子（quiz.html） ----
  "はじめての子": "Your First Pet", "あなたに合う子が、": "A pet that suits you", "# 匹やってきます": "will come — just #",
  "# つの質問に答えてください。正しい答えはありません。思ったとおりに選んでください。": "Answer # questions. There are no right answers. Just pick what feels true.",
  "はじめる": "Start", "ひとつもどる": "Back one", "はこがとどきました": "A box has arrived", "中で、なにかが動いています": "Something is moving inside",
  "あなた さま": "To: You", "MONO LINK ラウンジ": "MONO LINK Lounge", "なまもの・やさしく": "Live contents · handle gently", "局": "P.O.", "はこをあける": "Open the box",
  "合う職業": "Suited jobs", "この子とはじめる": "Start with this one", "答えなおす": "Answer again", "はこがいくつかとどきました。どの子をむかえますか？": "Several boxes have arrived. Which one will you welcome?",
  "質問の進みぐあい": "Quiz progress", "ラウンジへ": "To the Lounge", "# 問目": "Q#", "（答えた）": "(answered)",
  "# 匹が、同じくらい合いそうです": "# pets look about equally suited", "むかえて います…": "Welcoming…", "むかえられませんでした": "Couldn't welcome them",
  "ガチャの #% の 中の # つ": "From the #1% tier of the gacha",
};

export const RULES = [
  [/^玉 ([\d,]+)$/, (m) => n1(m[1], "ball", "balls")], [/^([\d,]+) ?玉$/, (m) => n1(m[1], "ball", "balls")], [/^\+([\d,]+) ?玉$/, (m) => "+" + n1(m[1], "ball", "balls")],
  [/^リソース ([\d,]+)$/, (m) => n1(m[1], "Resource", "Resources")], [/^リソース \+([\d,]+)$/, (m) => "+" + n1(m[1], "Resource", "Resources")],
  [/^クレジット ([\d,]+)$/, (m) => n1(m[1], "credit", "credits")],
  [/^([\d.]+)億$/, (m) => `${+(+m[1] * 100).toFixed(1)}M`], [/^([\d,]+)万$/, (m) => `${+(+m[1].replace(/,/g, "") / 100).toFixed(2)}M`],
  // 足りない 物（「足りない：きれいな小石 あと 8、ゴブリンのナイフ あと 2、ほか 1 こ」）
  [/^足りない：(.+)$/, (m, p) => { const xs = m[1].split("、").map((x) => { let k = x.match(/^(.+) あと ([\d,]+)$/); if (k) { const a = p(k[1]); return a && `${a} ×${k[2]}`; } k = x.match(/^ほか ([\d,]+) こ$/); return k ? `+${k[1]} more` : p(x); }); return xs.every(Boolean) ? "Missing: " + xs.join(", ") : null; }],
  [/^リソースが 足りない：あと ([\d,]+)$/, (m) => `Not enough Resources: ${m[1]} more`],
  [/^リソース 1 ＝ (.+) ([\d,]+)$/, (m, p) => `1 Resource = ${m[2]} ${p(m[1])}`], [/^リソース 1 → (.+) ([\d,]+)$/, (m, p) => `1 Resource → ${m[2]} ${p(m[1])}`],
  [/^(.+) の 部屋$/, (m) => `${m[1]}'s room`], [/^(.+) ／ (.+) の相棒$/, (m, p) => p(m[1]) && `${p(m[1])} / ${m[2]}'s partner`], [/^(.+) の相棒$/, (m) => `${m[1]}'s partner`],
  [/^(.+)の 職業を えらぶ$/, (m, p) => `Choose ${p(m[1]) || m[1]}'s job`],
  [/^(.+)を しまった$/, (m, p) => p(m[1]) && `Put away the ${p(m[1])}`],
  [/^・持っている ×([\d,]+)$/, (m) => ` · own ×${m[1]}`], [/^(.+)・持っている ×([\d,]+)$/, (m, p) => p(m[1]) && `${p(m[1])} · own ×${m[2]}`],
  [/^あと (\d+):(\d+) で 入れかわる$/, (m) => `Changes in ${m[1]}:${m[2]}`],
  [/^買った：(.+)（もようがえの 持ち物に 入った）$/, (m, p) => p(m[1]) && `Bought: ${p(m[1])} (added to your redecorating inventory)`],
  [/^出た：(.+)（★(\d)）$/, (m, p) => p(m[1]) && `Got: ${p(m[1])} (★${m[2]})`],
  [/^(\d+) こ 出た。いちばん いいのは (.+)（★(\d)）$/, (m, p) => p(m[2]) && `Got ${m[1]}. Best: ${p(m[2])} (★${m[3]})`],
  [/^とどけるのは郵便屋さんの(.+)です$/, (m, p) => `Delivered by ${p(m[1]) || m[1]} the mail carrier`],
  [/^(.+)が 待って います$/, (m, p) => `${p(m[1]) || m[1]} is waiting`],
  [/^(.+)がやってきた！$/, (m, p) => `${p(m[1]) || m[1]} is here!`],
  [/^(.+)の日記（さいしょの日）$/, (m, p) => `${p(m[1]) || m[1]}'s diary (day 1)`],
];
