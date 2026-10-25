// 英語の 辞書：派遣（dungeon.html）・派遣の 記録と 日記（dungeon-sim.js）・DEEP LINK/: の タスク（tasks.js）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], WD = { 日: "Sun", 月: "Mon", 火: "Tue", 水: "Wed", 木: "Thu", 金: "Fri", 土: "Sat" };
const P = (p, s) => p(s) || s;   // 名前（訳せなければ そのまま）

export const WORDS = {
  // 島（ニライ諸島）
  "マッサラ島": "Massara Island", "ニライ諸島": "Nirai Isles", "ニライ村": "Nirai Village", "島": "Island", "隠れ家に 無線機を 作ると 行ける": "Build a Radio in your hideout to go here",
  // ---- 行き先を えらぶ ----
  "行き先": "Destination", "ワールドマップ": "World Map", "スタート": "Start", "Lv の色": "Lv colors", "らく": "Easy", "ちょうどいい": "Just right", "きびしい": "Tough", "むずかしい": "Hard", "あんしん": "Safe",
  "階": "F", "おすすめ": "Recommended", "まだ": "—", "はじめて": "First time", "ずっと": "Forever", "# 回": "×#", "この 派遣で おわり": "Ends after this trip", "周回": "Repeat",
  "素材": "Materials", "こ": "", "周回を 止めた": "Stopped repeating", "経験値": "XP", "売った 装備": "Gear sold", "捕まえた": "Caught", "おやつ": "Treats", "周回の まとめ": "Repeat summary",
  "装備を 見る": "View gear", "装備を見る": "View gear", "きょう": "Today", "# 階": "#F", "かくし通路": "Hidden passage", "ボスの部屋": "Boss room", "えらんだ行き先": "Chosen destination",
  "おすすめ Lv#": "Recommended Lv#", "探索率": "Explored", "出てくる敵": "Enemies", "希少": "Rare", "ボス": "Boss", "宝箱の 装備": "Chest gear", "この 素材で できた 装備（形と 色は くじ）": "Gear made of these materials (shape and color are random)",
  "採取の 素材": "Gathered materials", "ボスから ごくまれに。ここだけの ミシック装備": "Very rarely from the boss. Mythic gear found only here", "じゅんびへ": "Prepare",
  "これまでの冒険": "Past adventures", "帰ってきた": "Returned", "力つきた": "Fell", "ときどき 前の 素材": "sometimes earlier materials",
  "まだ 見ていない マスを うめる": "Fill in unseen tiles", "ボスの 部屋へ まっすぐ": "Straight to the boss room", "採取ポイントを 回る": "Visit gathering spots", "えらんだ 敵とだけ 戦う": "Fight only the chosen enemy",
  "戦う敵": "Enemy to fight", "笛で よぶ敵": "Enemy to lure", "ボスを たおせそう": "Chance to beat the boss", "採取ポイント": "Gathering spots", "か所くらい": "spots or so", "回 出会えそう": "encounters likely",
  "くらい": "or so", "行き先を えらびなおす": "Choose another destination", "目的と時間": "Goal & time", "目的": "Goal", "出発する 階": "Starting floor", "時間": "Time", "持っていく 道具": "Tool to bring",
  "出発": "Set out", "1 つ": "1", "なし": "None", "パーティ": "Party", "見通し": "Outlook", "力つきる": "Wipe", "分": "min", "# 歩": "# steps",
  "ボスの": "Boss", "たち": "and co.", "オ": "A", "# 階の地図": "Floor # map", "力つきた……": "Everyone fell……", "探索を おえた": "Done exploring", "ボスを たおした": "Beat the boss", "採取を おえた": "Done gathering",
  "かくし通路を 見つけた": "Found a hidden passage", "戦っている": "Fighting", "休憩中": "Resting", "探索中": "Exploring", "# 階を 探索中": "Exploring floor #", "HP と MP が もどっている": "Recovering HP and MP",
  "探索率 #%": "Explored #%", "出かけている": "Out on an expedition", "ゴーグルの中": "Inside the goggles", "帰って くる": "Returns", "のこり": "Left",
  "売った": "Sold", "自動で 売る": "Auto-sell", "ミシック": "Mythic", "力つきて 帰ってきた": "Came back after everyone fell", "ボスを たおした！": "Beat the boss!",
  "目的を はたして 帰ってきた": "Came back with the goal done", "時間に なって 帰ってきた": "Came back when time was up", "品質 #": "Quality #", "もう一度 出発": "Set out again", "うけとる": "Collect",
  "結果": "Result", "宝箱から 届いた装備": "Gear from chests", "採取": "Gathered", "か所": "spots", "地図室で 素材": "Map Room bonus",
  "なかまの画面で 研究（リソース #）・懐柔できる": "Research it on the Companions screen (# Resources) to tame it", "通常": "Regular",
  "今回は 宝箱を 見つけられなかった。地図が うまるほど 見つけやすい": "No chests this time. The more of the map you fill in, the easier they are to find",
  "拾った素材": "Materials picked up", "売ると 玉 #": "Sells for # balls", "あずかり箱へ": "To the holding box", "倉庫が いっぱい・# 日 のこる": "Storage full · kept # days", "倉庫で うけとる": "Collect at Storage",
  "職業": "Job", "合う 職業": "Suited jobs", "ほかの 職業": "Other jobs", "えらんだ 職業": "Chosen job", "よく 伸びる": "Grows well", "この 職業に する": "Pick this job", "あとで かえられる": "You can change it later",
  "合う": "Good fit", "決められませんでした": "Couldn't decide", "出発して います…": "Setting out…", "出発できませんでした": "Couldn't set out", "うけとれませんでした": "Couldn't collect",
  "に 上がった": "reached", "見る ›": "View ›", "勝った": "Won", "負けた": "Lost", "勝った！": "Won!",
  // ---- 派遣の 記録（dungeon-sim.js） ----
  "かべの むこうに かくし通路を 見つけた！": "Found a hidden passage behind the wall!", "# 階に 着いた": "Reached floor #", "採取ポイントを 回りおえた": "Visited every gathering spot",
  "力つきそうに なった": "Almost fell", "元気のお茶を のんで 立ちあがった": "Drank Pep Tea and got back up", "おやつを 拾った": "Found a treat", "罠を 見ぬいた": "Spotted a trap", "罠に かかった！": "Caught in a trap!",
  "宝箱を あけた": "Opened a treasure chest", "かくし通路の 宝箱を あけた": "Opened a treasure chest in the hidden passage", "休憩を おえた": "Done resting", "つかれたので 休憩する": "Tired, taking a rest",
  "階段を おりた": "Went down the stairs", "ボスを たおしたので 帰る": "Beat the boss, heading home", "採取を おえて 帰る": "Done gathering, heading home", "探索を おえて 帰る": "Done exploring, heading home",
  // 日記（文ごと）
  "が とどいた": "arrived", "は たべられなかった": "couldn't be eaten", "ゴーグルを つけた": "Put on the goggles", "ねた": "Slept", "手紙は ぶじ": "The letters are safe", "ゴーグル ゴーグル": "Goggles goggles", "かった かった": "Won won", "まけた まけた": "Lost lost",
  "むかしの ゲームの方が よかった": "Old games were better", "むかしは もっと かんたんだった": "It used to be easier", "かった": "Won", "まけた": "Lost",
  "ゴーグルの中で ゆらゆら": "Swaying inside the goggles", "なにかに まけた きがする": "Feels like I lost to something", "ゆらゆら": "Sway, sway", "チャリチャリ いった": "Went jingle jingle", "なにか": "something",
  // ---- タスク（tasks.js） ----
  "力つきずに 帰る 派遣で": "on an expedition where nobody falls", "休憩を しない 派遣で": "on an expedition without resting", "道具を 持たない 派遣で": "on an expedition without tools",
  "1 回の 派遣で": "in a single expedition", "10 分 コースで": "on the 10-min course", "ほか": "Other", "素材を 売る": "Sell materials", "派遣で 休憩する": "Rest on expeditions",
  "仲間に おやつを あげる": "Give treats to companions", "作業台で 装備を 作る": "Craft gear at the Workbench", "作業台で 合成する": "Fuse at the Workbench", "たおす": "Defeat", "たい": "", "捕まえる": "Capture",
  "納める": "Deliver", "施設": "Facilities", "作る": "Craft", "回": "times", "作るの レシピ": "Craft recipe",
};

export const RULES = [
  [/^(.+)の つながった タスク #(\d+) の ごほうびで 行ける$/, (m, p) => `Unlocked by finishing task #${m[2]} in ${P(p, m[1])}'s chain`],   // かくしの 行き先（canGo）
  // 行き先・日付
  [/^(.+)（おすすめ Lv(\d+)）$/, (m, p) => p(m[1]) && `${p(m[1])} (Recommended Lv${m[2]})`],
  [/^(\d+)月(\d+)日（(.)）$/, (m) => `${WD[m[3]] || ""}, ${MON[+m[1] - 1]} ${m[2]}`],
  [/^(.+) (\d+)分$/, (m, p) => p(m[1]) && `${p(m[1])} · ${m[2]} min`],
  [/^(\d+) 分コース・(.+)・(\d+) 戦 勝った$/, (m, p) => p(m[2]) && `${m[1]}-min course · ${p(m[2])} · won ${m[3]}`],
  [/^(.+)の日記$/, (m, p) => `${P(p, m[1])}'s diary`], [/^(.+)のようす$/, (m, p) => `How ${P(p, m[1])} is doing`],
  [/^ゴーグルをつけて出発(?:（周回 (.+)）)?$/, (m, p) => `Put on the goggles and set out${m[1] ? ` (repeat ${p(m[1]) || m[1]})` : ""}`],
  [/^ゴーグルをつけた(.*)$/, (m, p) => `${P(p, m[1])} put on the goggles`],
  [/^(.+)に 合う$/, (m, p) => p(m[1]) && `Suits ${p(m[1])}`],
  [/^スキルツリー「(.+)」$/, (m, p) => p(m[1]) && `Skill tree “${p(m[1])}”`],
  [/^(.+) (\d) 階で (.+)$/, (m, p) => p(m[1]) && p(m[3]) && `${p(m[1])} ${m[2]}F: ${p(m[3])}`],
  [/^(.+) (\d) 階を 探索中$/, (m, p) => p(m[1]) && `Exploring ${p(m[1])} ${m[2]}F`],
  [/^(\d+) 階で (.+)$/, (m, p) => p(m[2]) && `Floor ${m[1]}: ${p(m[2])}`], [/^(.+)と$/, (m, p) => p(m[1]) && `${p(m[1])}:`],
  [/^ボス (.+)$/, (m, p) => p(m[1]) && `Boss: ${p(m[1])}`],
  [/^(.+)へ$/, (m, p) => p(m[1]) && `To ${p(m[1])}`],
  // 周回
  [/^(\d+) 回め(?: \/ (\d+))?$/, (m) => `Run ${m[1]}${m[2] ? ` / ${m[2]}` : ""}`],
  [/^倉庫が いっぱいに なったので 止まった(?:（あずかり箱に (\d+) こ）)?$/, (m) => `Stopped because Storage is full${m[1] ? ` (${m[1]} in the holding box)` : ""}`],
  [/^(\d+) 回 回ったので おわり$/, (m) => `Finished after ${m[1]} runs`], [/^止まった：(.*)$/, (m, p) => `Stopped: ${P(p, m[1])}`],
  [/^(\d+) 回 帰って きた(?:（力つきた (\d+) 回）)?$/, (m) => `Returned ${m[1]} times${m[2] ? ` (fell ${m[2]} times)` : ""}`],
  [/^倉庫が いっぱい：(.+?)(?: ほか (\d+))?。入らない分は あずかり箱へ$/, (m, p) => p(m[1]) && `Storage full: ${p(m[1])}${m[2] ? ` +${m[2]} more` : ""}. What doesn't fit goes to the holding box`],
  [/^探索率 \+(\d+)%・(\d+) たい たおした(?:・装備 (\d+) こ)?$/, (m) => `Explored +${m[1]}% · beat ${m[2]}${m[3] ? ` · ${m[3]} gear` : ""}`],
  [/^ボスを たおした (\d+) 回$/, (m) => `Beat the boss ${m[1]} times`],
  [/^(\d+) 戦 勝った・(\d+) たい たおした・休憩 (\d+) 回$/, (m) => `Won ${m[1]} · beat ${m[2]} · rested ${m[3]} times`],
  // 結果の 知らせ（<b> で 分かれた 字）
  [/^・装備 (\d+) こ 売った（(.+)）$/, (m, p) => ` · sold ${m[1]} gear (${P(p, m[2])})`], [/^・ボスから ブランクコア ×(\d+)$/, (m) => ` · Blank Core ×${m[1]} from the boss`],
  [/^・(\d+) こ あずかり箱へ$/, (m) => ` · ${m[1]} to the holding box`], [/^・装備 (\d+) こ$/, (m) => ` · ${m[1]} gear`],
  [/^派遣先で ばったり！ (.+?) の (.+)に (勝った|負けた)（(.*)$/, (m, p) => `Ran into ${m[1]}'s ${P(p, m[2])} on the expedition! You ${m[3] === "勝った" ? "won" : "lost"} (${P(p, m[4])} `],
  // 戦いの 出会い
  [/^(ボスの )?(.+?)( たち)? が あらわれた！$/, (m, p) => p(m[2]) && `${m[1] ? "Boss " : ""}${p(m[2])}${m[3] ? " and co." : ""} appeared!`],
  [/^(ボスの )?(.+?)(?: たち（(\d+) たい）)?と 戦った$/, (m, p) => p(m[2]) && `Fought ${m[1] ? "the boss " : ""}${p(m[2])}${m[3] ? ` and co. (${m[3]})` : ""}`],
  [/^(\d+) たい たおしたが、力つきた……$/, (m) => `Beat ${m[1]}, but everyone fell……`],
  [/^(かくし通路で )?(.+)を 採取した$/, (m, p) => { const xs = m[2].split("と ").map((x) => p(x)); return xs.every(Boolean) ? `Gathered ${xs.join(" and ")}${m[1] ? " in the hidden passage" : ""}` : null; }],
  [/^(.+?)(?:たち (\d+) 体)?で 出発した$/, (m, p) => `${P(p, m[1])}${m[2] ? ` and party (${m[2]})` : ""} set out`],
  [/^目的：(.+)$/, (m, p) => p(m[1]) && `Goal: ${p(m[1])}`], [/^(.+)を 持っていく$/, (m, p) => p(m[1]) && `Brought a ${p(m[1])}`],
  [/^(.+)が 起きあがった$/, (m, p) => `${P(p, m[1])} got back up`],   // 救護室 Lv3 から（名前は 人が つけた 物も あるので そのまま でも よい）
  [/^(.+)を 捕まえた！$/, (m, p) => p(m[1]) && `Caught ${p(m[1])}!`], [/^★ミシック★ (.+)を 手に入れた！$/, (m, p) => p(m[1]) && `★Mythic★ Got ${p(m[1])}!`],
  // 日記（文ごと）
  [/^(.+)で ねた$/, (m, p) => p(m[1]) && `Slept in ${p(m[1])}`], [/^おきたら (\d+)たい たおしてた$/, (m) => `Woke up having beaten ${m[1]}`],
  [/^(.+)に まけてた$/, (m, p) => `Had lost to ${P(p, m[1])}`], [/^(.+)へ 配達に 行った$/, (m, p) => p(m[1]) && `Went to ${p(m[1])} on a delivery`],
  [/^(\d+)たい たおした$/, (m) => `Beat ${m[1]}`], [/^(.+)で (.+)に つかまった$/, (m, p) => p(m[1]) && `Got caught by ${P(p, m[2])} in ${p(m[1])}`],
  [/^(.+)は まあまあ$/, (m, p) => p(m[1]) && `${p(m[1])} was so-so`], [/^(.+)は むずかしい$/, (m, p) => p(m[1]) && `${p(m[1])} is hard`],
  [/^(.+)の かべを ほった$/, (m, p) => p(m[1]) && `Dug through a wall in ${p(m[1])}`], [/^(.+)が でた$/, (m, p) => p(m[1]) && `${p(m[1])} showed up`],
  [/^(.+)で ほったら (.+)の 上に でた$/, (m, p) => p(m[1]) && `Dug in ${p(m[1])} and popped up right on top of ${P(p, m[2])}`],
  [/^たしか (.+)に いた$/, (m, p) => p(m[1]) && `I think I was in ${p(m[1])}`], [/^(.+)で (\d+)かい かった$/, (m, p) => p(m[1]) && `Won ${m[2]} times in ${p(m[1])}`],
  [/^(.+)に まけた$/, (m, p) => `Lost to ${P(p, m[1])}`], [/^(.+)で コインを さがした$/, (m, p) => p(m[1]) && `Looked for coins in ${p(m[1])}`],
  [/^(.+)で (.+)に ふられた$/, (m, p) => p(m[1]) && `Got shaken by ${P(p, m[2])} in ${p(m[1])}`],
  [/^(.+)（★(\d)）は たべられなかった$/, (m, p) => p(m[1]) && `Couldn't eat the ${p(m[1])} (★${m[2]})`], [/^(.+)（★(\d)）が とどいた$/, (m, p) => p(m[1]) && `${p(m[1])} (★${m[2]}) arrived`],
  [/^ちずが (\d+)% うまった$/, (m) => `Filled in ${m[1]}% of the map`], [/^素材を (\d+)こ 拾った$/, (m) => `Picked up ${m[1]} materials`],
  // タスク
  [/^品質 (\d+) 以上の (.+)を 納める$/, (m, p) => p(m[2]) && `Deliver ${p(m[2])} (Quality ${m[1]}+)`],
  [/^★(\d) 以上の アクセサリーを 納める$/, (m) => `Deliver a ★${m[1]}+ accessory`], [/^作業台で ★(\d) 以上の アクセサリーを 作る$/, (m) => `Craft a ★${m[1]}+ accessory at the Workbench`],
  [/^(.+)を 納める$/, (m, p) => p(m[1]) && `Deliver ${p(m[1])}`], [/^(.+)で 採取ポイントを 回る$/, (m, p) => p(m[1]) && `Visit gathering spots in ${p(m[1])}`],
  [/^力つきずに (.+)から 帰る$/, (m, p) => p(m[1]) && `Return from ${p(m[1])} without falling`], [/^(.+)を Lv(\d+) に する$/, (m, p) => p(m[1]) && `Upgrade the ${p(m[1])} to Lv${m[2]}`],
  [/^(.+)の かくし通路で 宝箱を 開ける$/, (m, p) => p(m[1]) && `Open chests in the hidden passages of ${p(m[1])}`], [/^(.+)で 宝箱を 開ける$/, (m, p) => p(m[1]) && `Open treasure chests in ${p(m[1])}`],
  [/^(.+)の (\d) 階を 100% に する$/, (m, p) => p(m[1]) && `Explore floor ${m[2]} of ${p(m[1])} to 100%`],
  [/^希少な (.+)を たおす$/, (m, p) => p(m[1]) && `Defeat the rare ${p(m[1])}`], [/^ボスの (.+)を たおす$/, (m, p) => p(m[1]) && `Defeat the boss ${p(m[1])}`],
  [/^(.+)を たおす$/, (m, p) => p(m[1]) && `Defeat ${p(m[1])}`], [/^(.+)を 捕まえる$/, (m, p) => p(m[1]) && `Capture ${p(m[1])}`],
  [/^採取の素材 ×(\d+)$/, (m) => `Gathered materials ×${m[1]}`], [/^懐柔のおやつ ×(\d+)$/, (m) => `Taming Treat ×${m[1]}`], [/^装備 ★(\d)$/, (m) => `Gear ★${m[1]}`],
];
