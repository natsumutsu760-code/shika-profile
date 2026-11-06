// 英語の 辞書：門番の 返事（../lounge-server の why。ことわる わけ・知らせ）。画面の 知らせ（toast）や ボタンの 下に そのまま 出る
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const P = (p, s) => p(s) || s;

export const WORDS = {
  // 装備開発・スフィア（2026-11-04）
  "使う 敵の 素材を えらんで": "Choose an enemy material", "素材の 品質を えらんで": "Choose the material quality", "空いた OP の 枠が ない（素材の OP 抽選は 空いた 枠に だけ）": "No empty OP slot (material draws only fill empty slots)", "工房が まだ ない（隠れ家で 作る）": "No Workshop yet (build it in the Hideout)",
  "知らない 装備": "Unknown gear", "使う 結晶の 段を えらんで": "Choose a crystal grade", "その スフィアは ない": "That Sphere doesn't exist", "鑑定する スフィアが ない": "No Spheres to appraise", "あずかり箱に 売れる 素材が ない": "No materials to sell in the holding box", "もう 鑑定して ある": "Already appraised",
  "鑑定して いない スフィアは はめられない（DEEP LINK/: の ガラクで 鑑定）": "Unappraised Spheres can't be set (appraise them with Garak in DEEP LINK/:)", "この OP は まだ 使えない": "This OP isn't available yet",
  "空いた OP の 枠が ない（スフィアは 空いた 枠に だけ はめる）": "No empty OP slot (Spheres only go into empty slots)",
  // 門番の 入口・頼み
  "こわれた 頼み": "Broken request", "こわれた頼み": "Broken request", "依頼を えらんで": "Choose a request", "配信者と モデレーターだけ": "Streamer and moderators only", "op が ない": "Missing op",
  "知らない やること": "Unknown action", "1 秒に 5 回まで": "Up to 5 times per second", "記録が ない": "No record", "昼か 夜": "Day or night", "1 回か 10 回": "1 or 10 pulls", "売って いない 品": "Not for sale",
  "配信の 画面が まだ あなたを 知りません（配信で 1 回 チャットすると なおります）": "The stream doesn't know you yet (chat once on stream to fix it)",
  "配信の 画面が こたえませんでした。つぎに つながった ときに 決まります（2 回 へる ことは ありません）": "The stream didn't answer. It'll be settled next time it connects (you won't be charged twice)",
  "いまは 依頼の 板に つながらない": "Can't reach the requests board right now", "前に 届けた 分の 返事を 待って いる": "Waiting for a reply about your last delivery",
  "依頼の 板が こたえませんでした。つぎに 開いた ときに 決まります": "The requests board didn't answer. It'll be settled next time you open this", "出して いる 依頼は ない": "You have no active request",
  "まだ 払いが 決まって いない（配信の 画面の 返事を 待って いる）": "Payment isn't settled yet (waiting for the stream to reply)",
  "その 相手とは 戦えない（入れかえて べつの 相手に）": "Can't fight that opponent (shuffle for another)", "相手に つながらない（入れかえて べつの 相手に）": "Can't reach the opponent (shuffle for another)",
  "10 の 倍数で、100 万まで": "In multiples of 10, up to 1M",
  // 闘技場
  "さきに ペットの 職業を えらんで": "Choose your pet's job first", "相手を えらんで": "Choose an opponent", "札が ない": "No ticket", "もう しめきった": "Entries are closed", "その 試合は ない": "That match doesn't exist",
  // ブランクコア
  "ブランクコアを 持って いない（工房で 作る・ヨルの 店）": "You don't have a Blank Core (make one at the Workshop or buy at Yoru's shop)", "その 装備は ない": "That gear doesn't exist",
  "抜く OP を えらんで": "Choose an OP to extract", "その コアは ない": "That core doesn't exist", "こわれた コア": "Broken core", "出かけて いる 子の 装備は かえられない（帰って から）": "Can't change gear of someone on an expedition (wait until they return)",
  "OP の 枠が いっぱい（入れかえる OP を えらんで）": "OP slots are full (choose an OP to replace)", "入れかえる OP を えらんで": "Choose an OP to replace",
  // 畑と 坑道
  "畑が まだ ない（隠れ家で 作る）": "No Farm yet (build it in the Hideout)", "植える 物を えらんで": "Choose what to plant", "マスを えらんで": "Choose plots", "もう 植えて ある マスが ある": "Some plots are already planted",
  "まだ とれる マスが ない": "Nothing to harvest yet", "列を えらんで": "Choose a row", "スプリンクラーを えらんで": "Choose a sprinkler", "その スプリンクラーを 持って いない（工房で 作る）": "You don't have that sprinkler (make it at the Workshop)",
  // 詳細ステータス・栄養（2026-10-31）
  "詳細ステータスは まだ 開いて いない": "Detailed stats aren't open yet", "作る おやつを えらんで": "Choose a treat to make", "おやつを えらんで": "Choose a treat", "食べさせる 数を えらんで": "Choose how many to feed",
  "キャップに 届いて いる（謎のお菓子で 上限突破）": "Reached the cap (break the limit with a Mystery Sweet)", "おなかが いっぱい（あと # 分で 食べられる）": "Too full (can eat again in # min)",
  "デトックス茶を 持って いない（工房で 作る）": "You don't have Detox Tea (make it at the Workshop)", "まだ 栄養が ない": "No nutrition yet",
  "キャップに 届いたら デトックス茶は 使えない（謎のお菓子で 上限突破）": "Detox Tea can't be used once you reach the cap (break the limit with a Mystery Sweet)",
  "謎のお菓子を 持って いない（派遣で ごく まれに 見つかる）": "You don't have a Mystery Sweet (very rarely found on expeditions)", "キャップに 届いて から（いま 栄養 # / #）": "Only after reaching the cap (nutrition now # / #)",
  "知らない 肥料": "Unknown fertilizer", "肥料が 足りない：あと #": "Not enough fertilizer: # more", "使う 物を えらんで": "Choose what to use", "持って いない（工房で 作る）": "You don't have it (make it at the Workshop)",
  "坑道が まだ ない（隠れ家で 作る）": "No Mine yet (build it in the Hideout)", "その 子は 掘って いない": "That companion isn't digging", "その 子は いない": "That companion isn't here", "もう 掘って いる": "Already digging",
  "パーティの 子は 掘れない（部屋に もどすと 掘れる）": "Party members can't dig (send them back to the room first)", "いまは 出かけて いる": "Out on an expedition right now",
  "掘る 場所が いっぱい（坑道の Lv で ふえる）": "All digging spots are taken (Mine level adds more)", "まだ 掘れて いない（1 時間ごとに たまる）": "Nothing dug up yet (it accumulates hourly)",
  // ペット・派遣・施設
  "あずかり箱は からっぽ": "The holding box is empty", "装備が いっぱい（武器庫を 強化するか、装備を 手放して から）": "Gear is full (upgrade the Armory or discard some gear)",
  "倉庫の その しゅるいが いっぱい（倉庫を 強化するか、素材を 使って から）": "That type is full in Storage (upgrade Storage or use some materials)",
  "もう ペットが いる": "You already have a pet", "答えが そろって いない": "Not all questions are answered", "はこを えらんで": "Choose a box", "まだ ペットが いない": "You don't have a pet yet",
  "職業は もう 決まって いる（かえるのは 振り直しから）": "Your job is already set (change it by resetting)", "知らない 職業": "Unknown job", "もう なかよし（パーティに 入れられる）": "Already friends (can join the party)",
  "前の おやつが まだ 決まって いない（配信の 画面の 返事を 待って いる）": "Your last treat isn't settled yet (waiting for the stream to reply)", "あげる 数を えらんで": "Choose how many to give",
  "作る 物を えらんで": "Choose what to make", "おやつ工房が まだ ない（隠れ家で 作る）": "No Treat Kitchen yet (build it in the Hideout)", "作る 数を えらんで": "Choose how many to make", "もう パーティに いる": "Already in the party",
  "まだ なかよしゲージが いっぱいで ない": "The friendship gauge isn't full yet", "パーティが いっぱい（だれかを 部屋に もどすと 入れられる）": "Party is full (send someone back to the room first)", "パーティに いない": "Not in the party",
  "取り出せるのは 進化した スキル（＋）だけ": "Only evolved skills (＋) can be extracted", "もう 取り出して ある（ペットの サブツリーに 付けられる）": "Already extracted (add it as a pet subtree)", "出かけて いる 子は 取り出せない（帰って から）": "A companion on a trip can't be extracted (wait until it's back)", "坑道で 掘って いる 子は 取り出せない（坑道から もどして から）": "A companion digging in the mine can't be extracted (bring it back first)", "前の 取り出しが まだ 決まって いない（配信の 画面の 返事を 待って いる）": "Your last extraction isn't settled yet (waiting for the stream to reply)", "もう 研究ずみ": "Already researched", "前の 研究が まだ 決まって いない（配信の 画面の 返事を 待って いる）": "Your last research isn't settled yet (waiting for the stream to reply)",
  "さきに 職業を えらんで": "Choose a job first", "もう 出かけて いる": "Already out on an expedition", "行き先か 時間が ちがう": "Invalid destination or time", "知らない 道具": "Unknown tool", "その 道具を 持って いない": "You don't have that tool",
  "敵を えらんで": "Choose an enemy", "その 階には まだ 行けない": "You can't go to that floor yet", "出かけて いない": "Not out on an expedition", "まだ 帰って いない（もう 少し）": "Not back yet (almost)",
  "回数を えらんで": "Choose how many times", "出発する ときに えらんで": "Choose when setting out", "手放し方を えらんで": "Choose how to discard", "手放す 装備を えらんで": "Choose gear to discard",
  "付けて いる 装備は 手放せない（はずして から）": "Can't discard equipped gear (unequip it first)", "売る ★と もらう 物を えらんで": "Choose the ★ to sell and what to receive", "知らない 施設": "Unknown facility",
  "もう いちばん 上の Lv": "Already at max Lv", "Lv# は 無線機を 作って から（ビサイ諸島が 開くと 上げられる）": "Lv# needs the Radio first (it opens with the Bisai Isles)", "前の 強化が まだ 決まって いない（配信の 画面の 返事を 待って いる）": "Your last upgrade isn't settled yet (waiting for the stream to reply)",
  "作業台が まだ ない（隠れ家で 作る）": "No Workbench yet (build it in the Hideout)", "知らない レシピ": "Unknown recipe", "レシピが まだ 出て いない（素材を ぜんぶ 1 回 拾うと 出る）": "Recipe not unlocked yet (pick up each material once to unlock it)",
  "合成は 作業台 Lv2 から": "Fusion needs Workbench Lv2", "レシピが まだ 出て いない": "Recipe not unlocked yet", "合成する 装備を えらんで": "Choose gear to fuse", "付けて いる 装備は 合成できない（はずして から）": "Can't fuse equipped gear (unequip it first)",
  // スキルツリー・ガンビット
  "その ツリーは 付けて いない": "That tree isn't attached", "知らない ノード": "Unknown node", "もう 取った": "Already learned", "まだ 取れない（前の ノードか、分岐の 反対側）": "Can't learn yet (needs the previous node, or it's on the other branch)",
  "SP が 足りない": "Not enough SP", "枠を えらんで": "Choose a slot", "研究した ツリーだけ 付けられる": "Only researched trees can be attached", "もう 付けて いる": "Already attached",
  "ふやす ことだけ できる（へらすのは 振り直し）": "You can only add (reset to remove)", "ポイントが 足りない": "Not enough points", "知らない 条件": "Unknown condition", "条件の 数が ちがう": "Invalid condition value",
  "覚えて いない 技": "Move not learned", "作戦を えらんで": "Choose tactics", "その 枠には 付けられない": "Can't go in that slot", "ほかの 子が 付けて いる": "Someone else is wearing it", "えらび方を えらんで": "Choose a method",
  "かえる 職業を えらんで": "Choose a new job", "持ちこせるのは 覚えた 技だけ": "You can only keep a move you've learned",
  // みんなの 依頼
  "ことばを えらんで": "Choose a phrase", "依頼は 1 人 1 つまで（いまの 依頼が 終わるか 取り下げると 出せる）": "1 request per person (finish or withdraw your current one first)", "ほしい物を えらんで": "Choose what you want",
  "期限を えらんで": "Choose a deadline", "お礼が ちがう": "Invalid reward", "お礼の 装備を えらびなおして（付けて いる 物は はずして から）": "Choose the reward gear again (unequip it first)", "お礼を えらんで": "Choose a reward",
  "ほしい 装備を 持って いない": "You don't have the wanted gear", "その 依頼は ない": "That request doesn't exist", "取り下げた 依頼": "Withdrawn request", "こわれた 依頼": "Broken request",
  "その 依頼は もう 終わった": "That request is already finished", "自分の 依頼には 届けられない": "You can't deliver to your own request", "ほしい物と ちがう": "That's not what they want",
  "通報 できない": "Can't report", "もう 通報した": "Already reported", "ひとことは ない": "No note",
  // 商人
  "知らない 商人": "Unknown trader", "きょうの タスクは もう 終わった": "Today's task is already done", "その 品は ない": "That item doesn't exist", "もう 買った": "Already bought", "えらんで": "Choose one",
  "OP を えらんで": "Choose an OP", "その レシピは もう 出て いる": "That recipe is already unlocked", "売る 素材を えらんで": "Choose materials to sell", "数が ちがう": "Invalid amount", "その 素材が 足りない": "Not enough of that material",
  "同じ 行き先の 素材を 3 こ えらんで": "Choose 3 materials from the same destination", "その 品を 持って いない": "You don't have that item", "行った ことの ある 階を えらんで": "Choose a floor you've visited",
  "もう 開いて いる": "Already open", "もう なかよし": "Already friends", "レシピを えらんで": "Choose a recipe", "使えない 品": "That item can't be used",
  // 工房
  "工房が まだ ない（隠れ家で 作る）": "No Workshop yet (build it in the Hideout)", "作る アタッチメントを えらんで": "Choose an attachment to make", "その アタッチメントは ない": "That attachment doesn't exist",
  "付けられるのは 武器だけ": "Only weapons can take attachments", "その 武器を 持って いる 子が 出かけて いる": "Whoever holds that weapon is out on an expedition", "武器に 付いて いる（はずして から）": "It's on a weapon (remove it first)",
  // ペットの 解放・いまの 子（lounge-game.js の petUnlockPlan・petSwitch）
  "まず 1 匹目を むかえて（性格診断）": "Welcome your first pet first (personality quiz)", "知らない 子": "Unknown pet", "もう いっしょに いる": "Already with you", "もう みんな いる": "You already have everyone",
  "前の 子の 支払いを たしかめて います（配信の 画面が こたえたら むかえられます）": "Checking the payment for the previous pet (you can welcome another once the stream replies)",
  // 工房の 精錬（lounge-workshop.js の smeltPut・smeltTake・smeltStop）
  "炉を えらんで": "Choose a furnace", "その 炉は 使って いる": "That furnace is in use", "作る 延べ棒を えらんで": "Choose an ingot", "入れる 数は 1〜# 本": "Load 1–#", "その 炉は 空いて いる": "That furnace is empty",
  // 施設の 作り直し（2026-11-03）：建設・つまみ・維持費の 断り
  "いま 建てて いる": "Already under construction", "もう いちばん 上": "Already at max level", "建てて いない": "Not under construction",
  "Lv# は 無線機を 作って から（ビサイ諸島の 素材が いる）": "Lv# needs the Radio first (uses Bisai Isles materials)", "その 素材は いらない": "That material isn't needed",
  "入れる 素材を 持って いない": "You have no materials to add", "時間は もう 足りて いる（素材を 入れると できる）": "The time is already done (add the materials to finish)",
  "燃料の 数を えらんで": "Choose how much fuel", "つまみの ない 施設": "This facility has no dial", "#〜# で えらんで": "Choose #–#",
  "クレジットが 足りない": "Not enough credits", "維持費が 足りない": "Not enough for upkeep", "クレジット あと #（つまみを 下げると 安い）": "# more credits (lower the dial to pay less)",
  "あと #（維持費こみ。つまみを 下げると 安い）": "# more (incl. upkeep; lower the dial to pay less)", "あと #（維持費 # こみ）": "# more (incl. # upkeep)",
  "いま 研究して いる": "Already researching", "作業台の つまみが 0（隠れ家で 上げる）": "The Workbench dial is at 0 (raise it in the Hideout)", "合成は 作業台 Lv# から": "Fusion unlocks at Workbench Lv#",
  "入れる 数は #〜# 本": "Choose #–# bars", "工房 Lv# から 作れる": "Unlocks at Workshop Lv#", "おやつ工房 Lv# から 作れる": "Unlocks at Treat Kitchen Lv#", "おやつ工房 Lv# から": "From Treat Kitchen Lv#",
  // 通貨の 作り直し（2026-10-28 の 決め）：両替を やめた・!換金・!貸し玉・装備は 売れない
  "玉と クレジットは ここでは 両替できない（配信の チャットで !貸し玉・!換金）": "Balls and credits can't be exchanged here (use !貸し玉 / !換金 in stream chat)",
  "MONO LINK に まだ 入って いない（ラウンジを 1 回 開くと 使える）": "You're not in MONO LINK yet (open the Lounge once to use this)", "MONO LINK の 人が わからない": "Couldn't find you in MONO LINK",
  "MONO LINK の 公開の あとで 使える": "Available after MONO LINK launches", "借りる 玉の 数を 入れて": "Enter how many balls to borrow",
  "装備は 売れない（リサイクルで 素材に もどす）": "Gear can't be sold (recycle it into materials)", "リサイクルする ★を えらんで（装備は 売れない）": "Choose the ★ to recycle (gear can't be sold)",
  "行き先 #": "Destination #", "保険料 #": "Premium #", "（維持費こみ。つまみを 下げると 安い）": "(incl. upkeep; lower the dial to pay less)",
};

export const RULES = [
  [/^素材が 足りない：(.+)（(結晶Ⅰ|結晶Ⅱ|結晶Ⅲ|結晶核Ⅰ|結晶核Ⅱ)）あと (\d+)$/, (m, p) => `Not enough materials: ${p(m[1]) || m[1]} (${p(m[2])}) ${m[3]} more`],
  [/^(.+)は もう 付いて いる$/, (m, p) => p(m[1]) && `${p(m[1])} is already on it`],
  [/^(.+)を まだ 拾って いない（その 敵を たおすと 落とす）$/, (m, p) => `You haven't picked up ${p(m[1]) || m[1]} yet (defeat that enemy to get it)`],
  [/^この 装備は 作業台 Lv(\d+) から$/, (m) => `This gear needs Workbench Lv${m[1]}`],
  [/^素材が 足りない：(.+)$/, (m, p) => { const xs = m[1].split("・").map((x) => { const k = x.match(/^(.+?)(?:（品質 (\d) 以上）)? あと (\d+)$/); return k && p(k[1]) && `${p(k[1])}${k[2] ? ` (Q${k[2]}+)` : ""} ×${k[3]}`; }); return xs.every(Boolean) ? "Not enough materials: " + xs.join(", ") : null; }],
  [/^まだ 帰って いない（あと (\d+) 秒）$/, (m) => `Not back yet (${m[1]} s left)`], [/^(.+) Lv(\d) が いる$/, (m, p) => p(m[1]) && `Needs ${p(m[1])} Lv${m[2]}`],
  [/^もう 持てない（(\d+) こまで）$/, (m) => `Can't hold more (max ${m[1]})`], [/^まだ たりない（(\d+)\/(\d+)(.*)）$/, (m, p) => `Not enough yet (${m[1]}/${m[2]}${m[3] ? " " + P(p, m[3]) : ""})`],
  [/^(きょう|この 週)は あと (\d+) こ$/, (m) => `Only ${m[2]} left ${m[1] === "きょう" ? "today" : "this week"}`], [/^(きょう|この 週)は もう 売りきれ$/, (m) => `Sold out ${m[1] === "きょう" ? "for today" : "for this week"}`],
  [/^友好度 Lv(\d) から 買える$/, (m) => `Unlocks at Rapport Lv${m[1]}`], [/^(.+)は 出かけて いる（帰ってから 戦える）$/, (m, p) => `${P(p, m[1])} is out on an expedition (fight after they return)`],
  [/^いっぱい（(\d+) 人まで）$/, (m) => `Full (max ${m[1]})`], [/^コアは (\d+) こまで（付けて へらして から）$/, (m) => `Up to ${m[1]} cores (use some first)`],
  [/^(.+)は もう 付いて いる（入れかえなら できる）$/, (m, p) => p(m[1]) && `${p(m[1])} is already on it (you can replace it)`], [/^(.+)は もう 付いて いる（同じ OP と 入れかえて）$/, (m, p) => p(m[1]) && `${p(m[1])} is already on it (replace the same OP)`],
  [/^ガンビットは (\d+) こまで$/, (m) => `Up to ${m[1]} gambits`], [/^作る 数は 1〜(\d+)$/, (m) => `Make 1–${m[1]}`],
  [/^付けて いない アタッチメントが いっぱい（(\d+) こ）。いらない 物を すてて から$/, (m) => `Unattached attachments are full (${m[1]}). Discard some first`],
  [/^まだ できて いない（あと (\d+) 分）$/, (m) => `Not ready yet (${m[1]} min left)`],
  [/^換金は 玉 (\d+) こから（(\d+) 玉 → (\d+) クレジット）$/, (m) => `Cash-out starts at ${m[1]} balls (${m[2]} balls → ${m[3]} credits)`],
  [/^クレジットが 足りない：あと ([\d,]+)（((?:行き先|保険料) [\d,]+(?:・(?:行き先|保険料) [\d,]+)?)）$/, (m, p) => `Not enough credits: ${m[1]} more (${m[2].split("・").map((x) => P(p, x)).join(" · ")})`],
];
