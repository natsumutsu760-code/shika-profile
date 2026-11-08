// 英語の 辞書：農園（garden.html・門番 lounge-farmv.js・畑の 決まり farm-core.js）
// 2026-11-05：農園の 画面が 英語の しくみに つながって いなかった（ラウンジの ページ ぜんぶ 英語に する 決め〈2026-10-25〉の 抜け）。プリセット・まとめて とると いっしょに 足した
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）。決まりは どれも 農園の 言葉で はじまる せまい 物だけ（辞書の まとめで いちばん 先に 見る）
const P = (p, s) => p(s) || s;
const parts = (p, s, sep = "・", join = " · ") => s.split(sep).map((x) => P(p, x.trim())).join(join);

export const WORDS = {
  // 上・タブ
  "農業": "Farming", "庭の 農園": "Garden Farm", "図鑑": "Dex", "掲示板": "Board", "注文は まだ ありません": "No orders yet", "農園は まだ 開いて いません": "The farm isn't open yet",
  "お菓子の箱の箱庭": "Candy Box Garden", "CLR の温室": "CLR Greenhouse",   // 畑の 見た目（farm3d.js の SKINS）
  "まとめて とる": "Harvest all", "土": "Soil", "スキン": "Skin", "見本": "Demo", "経験": "XP",
  // 土
  "土を かえる": "Change soil", "いまの 土": "Current soil", "得意も 弱い 所も ない": "No strengths or weaknesses", "農業 Lv# から": "From Farming Lv#",
  "島 2 の 作物が よく 育つ・かけ合わせ ×1.5（島 1 は 育つ 速さ ×0.8）": "Island 2 crops thrive · crossbreeding ×1.5 (Island 1 crops grow ×0.8)",
  // マスの ようす
  "芽": "Sprout", "実り": "Ripe", "放っておいた あと": "Left too long",
  "まだ 使えない マス": "Locked plot", "農業 Lv# で 使える": "Unlocks at Farming Lv#", "あいて いる マス": "Empty plot",
  "下の たねから えらぶ": "Pick from the seeds below", "種は 派遣の 採取で 拾える": "Find seeds by gathering on expeditions", "種は 派遣の 採取で 拾う": "Find seeds by gathering on expeditions",
  "上下左右 4 マス": "the 4 adjacent plots", "まわり 8 マス": "the 8 surrounding plots",
  "かわった 物": "Transformed", "あと # 回 たたくと とれる": "# more taps to collect", "かわる": "Turns", "逃げる": "Runs off", "枯れる": "Withers",
  "とる": "Harvest", "かわった。": "It transformed.", "たたいて とる": "Tap to collect", "逃げて しまった": "It ran off", "逃げて しまった……": "It ran off…", "枯れて しまった": "It withered",
  "たたく": "Tap", "片づける": "Clear", "たね": "Seeds", "種から": "From seed", "生まれた 品種": "Crossbred",
  "種が ない（派遣の 採取で 拾える）": "No seeds (find them by gathering on expeditions)", "かけ合わせの 芽が 出た": "A crossbreed sprouted",
  // とった ときの 知らせ
  "金色！": "Gold!", "とれた": "Collected", "図鑑に のった！": "Added to the Dex!", "種 ×#": "Seeds ×#", "農業 Lv#！": "Farming Lv#!", "農業 Lv#": "Farming Lv#",
  "枯れた 物 # こを 片づけた": "Cleared # withered", "あと # 回": "# more taps",
  // プリセット（鹿さんの 頼み 2026-11-05）
  "プリセット": "Preset", "塗る": "Paint", "いまの 畑から": "Copy current field", "保存": "Save", "空き": "Empty", "# マス": "# plots",
  "種を えらんで マスを 押すと 塗れる": "Pick a seed, then tap plots to paint", "塗る 種を えらんで": "Pick a seed to paint", "プリセット # に 保存した": "Saved to Preset #",
  "あいて いる マスが ない": "No empty plots", "植えられる マスが ない": "No plots to plant",
  // 時間の 肥料（2026-11-08）
  "時間の 肥料": "Time Fertilizer", "まだ 実らない": "Won't ripen yet", "育って いる 作物が ない": "Nothing is growing",
  // 図鑑
  "種類": "Type", "並べる": "Sort", "番号": "Number", "のった 順": "By discovery",
  // 門番（lounge-farmv.js）
  "農園は まだ 開いて いない": "The farm isn't open yet", "その 種は ない": "No such seed", "そこには 植えられない": "You can't plant there", "農業 Lv# から 植えられる": "Plantable from Farming Lv#",
  "派遣の 採取で 拾う": "find them by gathering on expeditions", "生まれた 品種を 収穫すると とれる": "harvest the crossbred crop to get them",
  "その 肥料は ない": "No such fertilizer", "肥料が ない（工房で 作る）": "No fertilizer (make it in the Workshop)",
  "その マスは ない": "No such plot", "その スプリンクラーは ない": "No such sprinkler", "スプリンクラーが ない（工房で 作る）": "No sprinkler (make it in the Workshop)",
  "とれる 物が ない": "Nothing to harvest", "その プリセットは ない": "No such preset", "こわれた プリセット": "Broken preset", "その プリセットは 空": "That preset is empty",
  "その 土は ない": "No such soil", "いまの 土と 同じ": "That's already your soil", "その 見た目は ない": "No such look",
  // 畑の 決まり（farm-core.js）
  "ふつうの土": "Plain Soil", "腐葉土": "Leaf Mold", "粘土": "Clay", "砂地": "Sandy Soil", "火山灰の土": "Volcanic Ash Soil", "ミカネル島": "Mikaneru Isle",
  "その 作物は ない": "No such crop", "畑の 外": "Outside the field", "あいて いない": "That plot isn't empty", "スプリンクラーは ない": "No sprinkler here",
  "何も ない": "Nothing here", "スプリンクラーは「はずす」で": "Use “Remove” for sprinklers", "まだ 実って いない": "Not ripe yet", "うまって いる": "Already planted",
};

export const RULES = [
  [/^育つ 速さ ×([\d.]+)$/, (m) => `Growth ×${m[1]}`], [/^かけ合わせ ×([\d.]+)$/, (m) => `Crossbreeding ×${m[1]}`], [/^実ってからの 猶予 ×([\d.]+)$/, (m) => `Ripe window ×${m[1]}`],
  [/^色ちがい ×([\d.]+)$/, (m) => `Color variants ×${m[1]}`], [/^とれる 数 ([−+-]\d+)$/, (m) => `Yield ${m[1]}`],
  [/^(\d+)時間 (\d+)分$/, (m) => `${m[1]}h ${m[2]}m`], [/^(\d+)分 (\d+)秒$/, (m) => `${m[1]}m ${m[2]}s`], [/^(\d+)秒$/, (m) => `${m[1]}s`],
  [/^(.+)を 植える（([\d.]+) 時間(?:・(.+)で ×0\.7)?）$/, (m, p) => p(m[1]) && `Plant ${p(m[1])} (${m[2]} h${m[3] ? ` · ×0.7 with ${P(p, m[3])}` : ""})`],
  [/^(.+)の 作物が (.+)$/, (m, p) => p(m[1]) && `Crops on ${p(m[1])}: ${P(p, m[2])}`],
  [/^のこり (.+)で (かわる|逃げる|枯れる)$/, (m, p) => `${{ かわる: "Turns", 逃げる: "Runs off", 枯れる: "Withers" }[m[2]]} in ${P(p, m[1])}`],
  [/^(芽|若葉)・実るまで あと (.+?)(?:・(品質 .+))?$/, (m, p) => `${P(p, m[1])} · Ripe in ${P(p, m[2])}${m[3] ? ` · ${P(p, m[3])}` : ""}`],   // ほかの 辞書の「(.+) (\d+)分」より 先に
  [/^実り・のこり (.+?)で (かわる|逃げる|枯れる)(?:・(品質 .+))?$/, (m, p) => `Ripe · ${{ かわる: "Turns", 逃げる: "Runs off", 枯れる: "Withers" }[m[2]]} in ${P(p, m[1])}${m[3] ? ` · ${P(p, m[3])}` : ""}`],
  [/^実るまで あと (.+)$/, (m, p) => `Ripe in ${P(p, m[1])}`],
  [/^たね：(.+)$/, (m, p) => p(m[1]) && `Seeds: ${p(m[1])}`], [/^塗る：(.+)$/, (m, p) => p(m[1]) && `Paint: ${p(m[1])}`],
  [/^植える（(\d+) マス）$/, (m) => `Plant (${m[1]} plots)`], [/^(\d+) マス 植えた(?:（肥料 (\d+)）)?$/, (m) => `Planted ${m[1]} plots${m[2] ? ` (fertilizer ${m[2]})` : ""}`],
  [/^種が 足りない：(.+)$/, (m, p) => `Not enough seeds: ${parts(p, m[1])}`],
  [/^農業 Lv(\d+) から 植えられる 種が ある$/, (m) => `Some seeds need Farming Lv${m[1]}`],
  [/^(.+)の 種が ない（(.+)）$/, (m, p) => p(m[1]) && `No ${p(m[1])} seeds (${P(p, m[2])})`],
  [/^(.+)に した(?:（([\d,]+) クレジット）)?$/, (m, p) => p(m[1]) && `Switched to ${p(m[1])}${m[2] ? ` (${m[2]} Credits)` : ""}`],
  [/^(LEGENDARY! |金色！ )?(.+?) ×(\d+)(?: ほか (\d+))?（倉庫へ）$/, (m, p) => p(m[2]) && `${m[1] ? (m[1].startsWith("L") ? "LEGENDARY! " : "Gold! ") : ""}${p(m[2])} ×${m[3]}${m[4] ? ` + ${m[4]} more` : ""} (to Storage)`],
  [/^種から・農業 Lv(\d+)$/, (m) => `From seed · Farming Lv${m[1]}`],
  [/^かえて (\d+) 時間は かえられない$/, (m) => `You can't change it again for ${m[1]} hours`],
  // 時間の 肥料（2026-11-08）
  [/^(?:芽と 若葉の 作物 (\d+) マスが 育つ（実る 所で 止まる）|育って いる 作物が ない（植えると まける）)・持って いる ([\d,]+) クレジット$/, (m) => `${m[1] ? `${m[1]} growing plots advance (they stop once ripe)` : "Nothing is growing (plant something first)"} · You have ${m[2]} Credits`],
  [/^(\d+) 時間 進む$/, (m) => `Advance ${m[1]} h`], [/^([\d,]+) クレジット$/, (m) => `${m[1]} Credits`],
  [/^(?:実る (\d+) マス|まだ 実らない)(?:・足りない：あと ([\d,]+))?$/, (m) => `${m[1] ? `${m[1]} will ripen` : "Won't ripen yet"}${m[2] ? ` · ${m[2]} short` : ""}`],
  [/^(\d+) 時間 進めた：(\d+) マスが 育った(?:・(\d+) マス 実った)?（([\d,]+) クレジット）$/, (m) => `Advanced ${m[1]} h: ${m[2]} plots grew${m[3] ? ` · ${m[3]} ripened` : ""} (${m[4]} Credits)`],
  [/^値段が かわった：いま ([\d,]+) クレジット$/, (m) => `The price changed: now ${m[1]} Credits`], [/^クレジットが 足りない：あと ([\d,]+)$/, (m) => `Not enough credits: ${m[1]} short`],
];
