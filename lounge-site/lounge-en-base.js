// 英語の 辞書：装備（equip・att-panel）・地下の 隠れ家（hideout・hideout-room）・作業台 bench・工房 workshop・畑と 坑道 farm・おやつ工房（snack-craft）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const P = (p, s) => p(s) || s;
const n1 = (n, one, many) => (n === "1" ? `1 ${one}` : `${n} ${many}`);

export const WORDS = {
  // ---- 装備（equip.html） ----
  "アクセ": "Acc", "オフ ハンド": "Off-hand", "★の多い順": "Most ★", "新しい順": "Newest", "（そうび中）": "(equipped)", "装": "G", "ペ": "P", "仲": "C",
  "の 宝箱か": "chests or the", "で 手に 入る": "", "まだ 装備が ない。": "No gear yet.", "出かけて いる あいだは かえられない": "Can't change while out on an expedition",
  "はずす": "Unequip", "つける": "Equip", "もとの強さ": "Base stats", "数は おなじ": "Same numbers", "着ているもの": "Wearing", "持っている装備": "Gear owned", "部位": "Slot",
  "✦ おすすめ装備": "✦ Recommended gear", "まとめて 手放す": "Bulk discard", "自動で 売る": "Auto-sell", "増やす": "Expand", "おすすめ装備": "Recommended gear", "えらんだ装備": "Selected gear",
  "アクセ 1": "Acc 1", "アクセ 2": "Acc 2", "アクセ 3": "Acc 3", "強さの 数字が いちばん 上がる 組み合わせ": "The combo that raises the power number the most",
  "えらび方": "Method", "だれ": "Who", "パーティ 全員": "Whole party", "この 子": "This one", "職業に 合う": "Job fit", "強さ": "Power", "弱点を 補う": "Cover weaknesses",
  "いまが いちばん": "Already the best", "この 装備に する": "Use this gear", "付けて いる 装備からは 抜けない（はずして から）": "Can't extract from equipped gear (unequip it first)",
  "この 装備には OP が ない": "This gear has no OPs", "ブランクコアを 1 つ 使う。抜いた OP は コアに なり、別の 装備に 付けられる": "Uses 1 Blank Core. The extracted OP becomes a core you can put on other gear",
  "もう一度 押すと 抜く（装備は なくなる）": "Tap again to extract (the gear is used up)", "あいて いる 枠に 付ける": "Put in an empty slot", "もう一度 押すと 入れかえ": "Tap again to replace",
  "OP の 枠が いっぱい。はずれた OP は 消える": "OP slots are full. The replaced OP disappears", "この 装備には OP の 枠が ない": "This gear has no OP slots", "コア": "Core", "・コア": " · Core",
  "OP を 抜く": "Extract OP", "コアを 付ける": "Attach core", "玉で 売る": "Sell for balls", "クレジットで 売る": "Sell for credits", "リサイクル": "Recycle",
  "もう一度 押すと 手放す": "Tap again to discard", "手放す": "Discard", "（かくし通路の 素材も 1 こ）": "(plus 1 hidden-passage material)", "この ★ 以下": "This ★ and below", "手放し方": "How to discard",
  "しない": "Off", "もらう 物": "Receive", "派遣で 拾った 物だけ・ミシックなどは 売らない": "Only gear found on expeditions · Mythics and such are never sold",
  "自動で 売るのを やめた": "Auto-sell turned off", "だれの 装備": "Whose gear", "オフ": "Off", "ハンド": "hand",
  // アタッチメント（att-panel.js）
  "かえる": "Change", "付ける": "Attach", "工房で 作る": "Make at the Workshop", "アタッチメント": "Attachments", "アタッチメントを 付けた": "Attachment added", "アタッチメントを はずした": "Attachment removed",
  // おやつ工房（snack-craft.js）
  "なかよし ＋#": "Friendship +#", "# こ 作る": "Make #", "作れるだけ（# こ）": "As many as possible (#)",
  // ---- 地下の 隠れ家（hideout.html・hideout-room.html） ----
  "持っている物": "Inventory", "地下の 隠れ家": "Basement Hideout", "部屋を 見る": "View room", "つくる": "Craft", "派遣": "Trips", "拡張": "Expand", "敵": "Enemies",
  "採取ポイントで 拾う": "Picked up at gathering spots", "かくし通路の 採取ポイントだけ": "Only at hidden-passage gathering spots", "敵が 落とす。品質 1〜5": "Dropped by enemies. Quality 1–5",
  "多い順": "Most", "品質の 高い順": "Highest quality", "スタッシュ": "Stash", "強化": "Upgrade", "預かり箱": "Holding box", "あずかり箱": "Holding box", "上げられる": "Upgradable", "足りない": "Missing",
  "PC：DEEP LINK/: を 開く": "PC: open DEEP LINK/:", "上げられる #": "Upgradable #", "あずかり箱 #": "Holding box #", "預かり箱 #": "Holding box #", "まだ 作っていない": "Not built yet",
  "倉庫の その しゅるいが いっぱい：素材を 使うか 売ると あく": "That type is full in Storage: use or sell materials to make room", "ガラクに 売る": "Sell to Garaku",
  "いっぱい：入らない 分は あずかり箱へ": "Full: what doesn't fit goes to the holding box", "あと # こ 入る": "Room for #", "倉庫の中": "In Storage", "倉庫の 中": "In Storage",
  "# しゅるい": "# types", "1 しゅるい": "Per type:", "こ まで": "max", "いっぱい #": "Full #", "強化できる": "Can upgrade", "うち 箱 #": "# in the box", "うち 箱": "in the box",
  "作業台を つかう": "Use the Workbench", "工房を つかう": "Use the Workshop", "広がった 地下を 見る": "View the expanded basement", "畑を ひらく": "Open the Farm", "坑道を ひらく": "Open the Mine", "おやつを 作る": "Make treats",
  "Lv# まで 見る": "See up to Lv#", "無線機を 作ると Lv# に できる": "Build the Radio to reach Lv#", "Lv# に すると": "At Lv#", "使う物": "Requires", "Lv# に する": "Upgrade to Lv#",
  "地下の 隠れ家。施設が ならぶ うす暗い 部屋（ドラッグで 動かす・ホイールで 寄る／引く）": "The basement hideout. A dim room lined with facilities (drag to move · scroll to zoom in/out)",
  "見る 広さ": "Zoom", "寄る": "Zoom in", "引く": "Zoom out", "施設の 一覧": "Facility list", "全体": "Overview", "施設の しゅるい": "Facility types",
  // ---- 作業台（bench.html） ----
  "装備の木": "Gear tree", "身につける": "Wearables", "手に持つ": "Handhelds", "作れる": "Craftable", "合成できる": "Fusable", "レシピ まだ": "No recipe yet", "作れる・合成できる": "Craftable · Fusable",
  "持っていない": "Not owned", "付きやすい OP": "Likely OPs", "合成・ボスの素材": "Fusion · boss material", "合成": "Fusion", "★ くじ": "★ odds", "素材（くじ）": "Material (random)", "色（くじ）": "Color (random)",
  "8 色の どれか": "One of 8 colors", "作業台が まだ ない": "No Workbench yet", "隠れ家で 作業台を 作る": "Build a Workbench in the Hideout", "合成は 作業台 Lv2 から できる": "Fusion unlocks at Workbench Lv2",
  "（宝箱か 作業台で）": "(from chests or the Workbench)", "レシピは まだ ない。これを 手に入れると 出てくる：": "No recipe yet. It appears once you get:", "合成する": "Fuse", "合成して います…": "Fusing…", "作って います…": "Crafting…",
  "まだ ない": "None yet",
  // ---- 工房（workshop.html） ----
  "作る 物": "Make", "道具・品": "Tools & items", "作れる #": "Craftable #", "品質 # 以上": "Quality #+", "武器に 付ける ›": "Attach to a weapon ›", "派遣の 道具": "Expedition tool", "品": "Item",
  "付く OP": "Possible OPs", "OP の 数": "Number of OPs", "★1〜3 は 1 つ・★4 は 2 つ（作る たびに くじ）": "★1–3 get 1, ★4 gets 2 (random each time)", "工房 Lv# から 作れる": "Unlocks at Workshop Lv#",
  "工房が まだ ない": "No Workshop yet", "隠れ家で 工房を 作る": "Build a Workshop in the Hideout", "作れるだけ": "As many as possible",
  // ---- 畑と 坑道（farm.html） ----
  "# 時間": "# h", "# 分": "# min", "品質 #〜#": "Quality #–#", "あき": "Empty", "とれる": "Ready", "畑が まだ ない": "No Farm yet", "隠れ家で 畑を 作る ›": "Build a Farm in the Hideout ›",
  "とる（# マス）": "Harvest (# plots)", "つぎに とれる：": "Next harvest:", "あと #": "# left", "あと # 日": "# days left", "あと # 時間": "# h left", "あと # 分": "# min left", "あと # 時間 # 分": "#h #m left",
  "＋ 畑 Lv# で # マス ふえる": "+ #2 more plots at Farm Lv#1", "＋ 地下の 拡張 Lv# で もう # 列": "+ #2 more row at Basement Expansion Lv#1", "植える": "Plant", "畑を 作ると 植えられる": "Build a Farm to plant",
  "あいて いる マスが ない": "No empty plots", "えらんだ # マスに 植える": "Plant in # selected plots", "# マスに 植える": "Plant in # plots", "マスに 植える": "Plant", "植える 物": "What to plant", "育つ 時間": "Grow time", "1 マスで": "Per plot",
  "置いて ある": "Placed", "置く": "Place", "工房で 作る ›": "Make at the Workshop ›", "‹ 植える に もどる": "‹ Back to planting", "坑道が まだ ない": "No Mine yet", "隠れ家で 坑道を 作る ›": "Build a Mine in the Hideout ›",
  "なかまを えらんで 掘らせる": "Choose companions to dig", "＋ 坑道 Lv# で もう # 体": "+ #2 more at Mine Lv#1", "（あずかり箱に # こ）": "(# to the holding box)", "＋ 地下の 拡張 Lv# で もう # 体": "+ #2 more at Basement Expansion Lv#1",
  "掘れる 物": "Can dig up", "掘らせる なかま": "Digging companions", "坑道を 作ると 掘らせられる": "Build a Mine to start digging", "掘る 場所が いっぱい": "All digging spots are taken",
  "掘れる なかまが いない（パーティに いない 子が 掘れる）": "No companions can dig (companions not in your party can)", "下の 一覧から えらぶ": "Choose from the list below",
  "Lv の 高い順": "Highest Lv", "Lv の 低い順": "Lowest Lv", "掘らせる": "Send to dig", "置いて います…": "Placing…", "はずして 持ち物に もどした": "Removed and returned to inventory",
  "もどして います…": "Returning…", "とって います…": "Harvesting…", "とれた！": "Harvested!", "うけとって います…": "Collecting…", "掘れた！": "Dug up!", "坑道へ 送って います…": "Sending to the Mine…", "植えて います…": "Planting…",
  "畑": "Farm", "坑道": "Mine", "畑・坑道": "Farm · Mine", "工房": "Workshop", "作業台": "Workbench",
};

export const RULES = [
  // 装備
  [/^コア ★(\d)$/, (m) => `Core ★${m[1]}`], [/^(.+)：なし$/, (m, p) => p(m[1]) && `${p(m[1])}: none`], [/^(.+)：(.+)$/, (m, p) => p(m[1]) && p(m[2]) && `${p(m[1])}: ${p(m[2])}`],
  [/^(.+)の 装備は まだ ない。$/, (m, p) => p(m[1]) && `No ${p(m[1])} gear yet. Get some from`],
  [/^(.+)から はずして つける$/, (m, p) => `Take from ${P(p, m[1])} and equip`], [/^(.+)に つける$/, (m, p) => `Equip on ${P(p, m[1])}`],
  [/^とくべつな効果：(.+)$/, (m, p) => p(m[1]) && `Special effect: ${p(m[1])}`], [/^いまの (.+) ★(\d) とくらべると$/, (m, p) => p(m[1]) && `Compared with current ${p(m[1])} ★${m[2]}`],
  [/^自動で 売る(.*)$/, (m, p) => `Auto-sell${m[1] ? " " + P(p, m[1]) : ""}`], [/^装備でふえる分　?(.*)$/, (m, p) => `From gear${m[1] ? ": " + P(p, m[1]) : ""}`],
  [/^★(\d) 以下$/, (m) => `★${m[1]} and below`], [/^(.+)は (.+) を 重く$/, (m, p) => p(m[1]) && `${p(m[1])} weights ${P(p, m[2])}`], [/^低い 能力（(.+)）を 重く$/, (m) => `Weights low stats (${m[1]})`],
  [/^(.+)から 外す$/, (m, p) => `Take from ${P(p, m[1])}`], [/^強さ (\d+) →$/, (m) => `Power ${m[1]} →`], [/^ほか (\d+) 枠$/, (m) => `${m[1]} more slots`],
  [/^(\d+) 枠 かえた・(.+)$/, (m, p) => `Changed ${m[1]} slots · ${m[2].split("・").map((x) => { const k = x.match(/^(.+) 強さ (\d+) → (\d+)$/); return k ? `${P(p, k[1])} power ${k[2]} → ${k[3]}` : P(p, x); }).join(" · ")}`],
  [/^(.+) ★(\d) を 抜く$/, (m, p) => p(m[1]) && `Extract ${p(m[1])} ★${m[2]}`], [/^(.+) と 入れかえ$/, (m, p) => p(m[1]) && `Replace ${p(m[1])}`],
  [/^(.+)は もう 付いて いる（同じ OP と 入れかえ）$/, (m, p) => p(m[1]) && `${p(m[1])} is already on it (replaces the same OP)`],
  [/^リサイクルは (.+)の 採取の 素材(.*)$/, (m, p) => p(m[1]) && `Recycling gives gathered materials from ${p(m[1])}${m[2] ? " " + P(p, m[2]) : ""}`],
  [/^玉 ([\d,]+) で 売る$/, (m) => `Sell for ${m[1]} balls`], [/^クレジット ([\d,]+) で 売る$/, (m) => `Sell for ${m[1]} credits`], [/^素材 (\d+) こに する$/, (m) => `Turn into ${m[1]} materials`],
  [/^付けて いる (\d+) こ$/, (m) => `${m[1]} equipped`], [/^ミシック・合成 (\d+) こ$/, (m) => `${m[1]} Mythic/fused`],
  [/^(\d+) こ（すべての 部位）(?:・(.+)は 入れない)?$/, (m, p) => `${m[1]} (all slots)${m[2] ? ` · excluding ${P(p, m[2])}` : ""}`], [/^・(.+)は 入れない$/, (m, p) => ` · excluding ${P(p, m[1])}`],
  [/^もう一度 押すと (\d+) こ 手放す$/, (m) => `Tap again to discard ${m[1]}`], [/^(\d+) こを (.+)$/, (m, p) => p(m[2]) && `${m[1]}: ${p(m[2])}`],
  [/^派遣で 拾った ★(\d) 以下を (.+)$/, (m, p) => p(m[2]) && `Expedition gear ★${m[1]} and below: ${p(m[2])}`],
  [/^(\d+) こ リサイクル：素材 (\d+) こ(?:（あずかり箱に (\d+) こ）)?$/, (m) => `Recycled ${m[1]}: ${m[2]} materials${m[3] ? ` (${m[3]} to the holding box)` : ""}`],
  [/^(\d+) こ 売った：(玉|クレジット) ([\d,]+)$/, (m) => `Sold ${m[1]}: ${m[3]} ${m[2] === "玉" ? "balls" : "credits"}`],
  [/^(.+) ★(\d) の コアが できた$/, (m, p) => p(m[1]) && `Made a ${p(m[1])} ★${m[2]} core`], [/^(.+) ★(\d) を 付けた$/, (m, p) => p(m[1]) && `Attached ${p(m[1])} ★${m[2]}`],
  [/^(.+)を はずした$/, (m, p) => p(m[1]) && `Unequipped ${p(m[1])}`], [/^(.+)に (.+)を つけた$/, (m, p) => p(m[2]) && `Equipped ${p(m[2])} on ${P(p, m[1])}`],
  [/^付ける（(.+)）$/, (m, p) => `Attach (${P(p, m[1])})`], [/^(.+)を えらぶ$/, (m, p) => p(m[1]) && `Choose ${p(m[1])}`],
  // おやつ工房
  [/^([^：、・]+) あと (\d+)$/, (m, p) => p(m[1]) && `${p(m[1])}: ${m[2]} more`],
  // 隠れ家
  [/^あと (\d+) 日(.*)$/, (m, p) => `${n1(m[1], "day", "days")} left${m[2] ? " " + P(p, m[2]) : ""}`], [/^・品質(\d)$/, (m) => ` · Q${m[1]}`], [/^品質(\d)$/, (m) => `Q${m[1]}`], [/^品質(\d) ×(\d+)$/, (m) => `Q${m[1]} ×${m[2]}`],
  [/^(\d+) こ・はやい物は あと (\d+) 日で なくなる$/, (m) => `${m[1]} · the oldest disappear in ${n1(m[2], "day", "days")}`], [/^あと (\d+) 日・装備$/, (m) => `${n1(m[1], "day", "days")} left · gear`],
  [/^(.+)。いまは ない$/, (m, p) => p(m[1]) && `${p(m[1])}. None right now`], [/^(.+)の 強化$/, (m, p) => p(m[1]) && `Upgrade ${p(m[1])}`],
  [/^預かり箱は からっぽ。倉庫の その しゅるいが いっぱいの ときに、入りきらない 物が (\d+) 日 入る$/, (m) => `The holding box is empty. When a type is full in Storage, overflow is kept here for ${m[1]} days`],
  [/^いちばん上の Lv(\d) です。いまは「(.+)」$/, (m, p) => `Maxed at Lv${m[1]}. Now: “${P(p, m[2])}”`], [/^Lv(\d) です。いまは「(.+)」$/, (m, p) => `Lv${m[1]}. Now: “${P(p, m[2])}”`], [/^(.+)を Lv(\d) に$/, (m, p) => p(m[1]) && `${p(m[1])} to Lv${m[2]}`],
  [/^いま（Lv(\d)）：(.+)$/, (m, p) => p(m[2]) && `Now (Lv${m[1]}): ${p(m[2])}`], [/^倉庫に 入れた：(\d+) こ(.*)$/, (m, p) => `Put in Storage: ${m[1]}${m[2] ? " " + P(p, m[2]) : ""}`],
  [/^（のこりは 箱に）$/, () => "(the rest went to the box)"], [/^(.+)が Lv(\d) に なった！ ?(.*)$/, (m, p) => p(m[1]) && `${p(m[1])} reached Lv${m[2]}!${m[3] ? " " + P(p, m[3]) : ""}`],
  // 作業台
  [/^(.+)（ときどき (.+)）$/, (m, p) => p(m[1]) && p(m[2]) && `${p(m[1])} (sometimes ${p(m[2])})`], [/^★(\d) を 使う（★の 低い物から）$/, (m) => `Uses ★${m[1]} (lowest ★ first)`],
  [/^(.+)の 1.5 倍$/, (m, p) => p(m[1]) && `${p(m[1])} ×1.5`], [/^(\d+)% で「(.+)」$/, (m, p) => p(m[2]) && `${m[1]}%: “${p(m[2])}”`], [/^玉 あと ([\d,]+)$/, (m) => `${m[1]} more balls`],
  // 工房
  [/^作れるだけ(.*)$/, (m, p) => `As many as possible${m[1] ? " " + P(p, m[1]) : ""}`], [/^アタッチメント (\d+) こ・武器に 付ける ›$/, (m) => `${m[1]} attachments · attach to a weapon ›`],
  // 畑と 坑道
  [/^(\d+) 時間(.*)$/, (m, p) => `${m[1]} h${m[2] ? " " + P(p, m[2]) : ""}`], [/^(.+) の マス（あき）$/, (m) => `Plot ${m[1]} (empty)`],
  [/^(.+)（とれる）$/, (m, p) => p(m[1]) && `${p(m[1])} (ready)`], [/^(.+)（育って いる）$/, (m, p) => p(m[1]) && `${p(m[1])} (growing)`],
  [/^(\d+) 列目の スプリンクラー(?:（(.+)）)?$/, (m, p) => `Row ${m[1]} sprinkler${m[2] ? ` (${P(p, m[2])})` : ""}`],
  [/^(.+)を 持って いない（(.+)の 採取で とれる）$/, (m, p) => p(m[1]) && p(m[2]) && `You don't have ${p(m[1])} (gather it in ${p(m[2])})`],
  [/^(\d+)〜(\d+) こ・(.+)（スプリンクラーで 上がる）$/, (m, p) => `${m[1]}–${m[2]} · ${P(p, m[3])} (sprinklers raise it)`], [/^・持って いる (\d+)$/, (m) => ` · own ${m[1]}`],
  [/^つぎに 掘れる まで あと (.+)$/, (m, p) => `Next dig in ${P(p, m[1])}`], [/^いっぱい（(\d+) こ）・うけとると また 掘る$/, (m) => `Full (${m[1]}) · collect to keep digging`],
  [/^(\d+) こ たまった・いっぱい まで あと (\d+)$/, (m) => `${m[1]} stored · ${m[2]} until full`], [/^(.+)に 掘らせる$/, (m, p) => `Send ${P(p, m[1])} to dig`],
  [/^(.+)を 置いた$/, (m, p) => p(m[1]) && `Placed the ${p(m[1])}`], [/^(.+)が もどった(.*)$/, (m, p) => `${P(p, m[1])} came back${m[2] ? " " + P(p, m[2]) : ""}`],
  [/^(.+)が 掘りはじめた$/, (m, p) => `${P(p, m[1])} started digging`], [/^(.+)を (\d+) マスに 植えた$/, (m, p) => p(m[1]) && `Planted ${p(m[1])} in ${m[2]} plots`],
];
