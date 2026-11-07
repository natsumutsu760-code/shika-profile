// 英語の 辞書：競り（ガラク）・フリマ（アンビル・ピーコ）。画面 auction.html・入口 deeplink.html・門番 lounge-server/lounge-auction.js の 返事・決まり auction.js（2026-11-07）
export const WORDS = {
  // 見出し・入口
  "DEEP LINK — 競り": "DEEP LINK — Auction", "DEEP LINK — フリマ": "DEEP LINK — Flea Market", "競り": "Auction", "フリマ": "Flea Market", "ガラク・サルベージ": "Garaku Salvage",
  "アンビル（武器）": "Anvil (weapons)", "ピーコ（防具）": "Peeko (armor)", "＜ 店へ もどる": "< Back to shop", "＜ ガラクの 店": "< Garaku's shop", "＜ アンビルの 店": "< Anvil's shop", "＜ ピーコの 店": "< Peeko's shop",
  "競り場へ": "To the auction", "フリマへ": "To the flea market", "素材・スフィア・装備・サンプルを 出す・入札する": "List or bid on materials, spheres, gear and samples",
  "作った 武器を 並べて 売る・買う": "Sell weapons you made, or buy them", "作った 防具を 並べて 売る・買う": "Sell armor you made, or buy them",
  // タブ・チップ
  "さがす": "Browse", "出す": "Sell", "自分の": "Mine", "しゅるい": "Type", "ならべる": "Sort", "ぜんぶ": "All", "終わりが 近い": "Ending soon", "安い": "Cheapest", "新しい": "Newest", "★が 高い": "Highest ★",
  "素材": "Materials", "スフィア": "Sphere", "装備": "Gear", "サンプル": "Sample", "武器": "Weapon", "防具": "Armor", "鑑定まえ": "Unappraised",
  // カード
  "いま": "Now", "開始": "Start", "即決 #": "Buyout #", "最高値": "Top bid", "入札 #": "# bids", "売れ残り": "Unsold", "売れた": "Sold", "もどった": "Returned", "引き取り": "Bought back", "リサイクル": "Recycled",
  "まもなく 終わる": "Ending now", "のこり # 分": "# min left", "のこり # 時間": "# h left", "のこり # 日": "# d left", "OP #": "OP #",
  // おしらせ
  "落札": "Won", "とどいた": "delivered", "入札で ぬかれた": "Outbid", "競り場に つないで います …": "Connecting to the auction…", "競り場に つながらない": "Can't reach the auction",
  // 一覧が 空・出す
  "いま 出て いる 品は ない": "Nothing listed right now", "出して いる 物は ない": "You have no listings", "出せる 物が ない": "Nothing to sell",
  "ピーコの 店で「防具の 委託」を うけとると 出せる": "Get “Armor consignment” at Peeko's shop to list here", "＞ ピーコの 店": "> Peeko's shop",
  "枠 # / #": "Slots # / #", "枠": "Slots", "出品料 #%・売れたら #%・期限 # 日": "Fee #% · #% on sale · # days", "出品料 #%（最低 #）・売れたら #%・期限 # 日": "Fee #% (min #) · #% on sale · # days",
  "出せる 装備が ない（作業台で 作った 武器だけ）": "No gear to sell (only weapons you made at the workbench)", "出せる 装備が ない（作業台で 作った 防具だけ）": "No gear to sell (only armor you made at the workbench)",
  // 小窓
  "とじる": "Close", "出品：": "Seller:", "あなたが 最高値": "You're the top bidder", "開始値": "Starting bid", "次に 入れられる": "Next bid", "# から": "from #", "即決": "Buyout", "入札": "Bids", "# 回": "#", "期限": "Ends",
  "値段": "Price", "入れる 値": "Your bid", "入札する": "Place bid", "即決 #": "Buyout #", "買う #": "Buy #", "数": "Qty", "なし": "none",
  "売れ残ったら：引き取り # か リサイクル（素材の # 割）": "If unsold: buy-back # or recycle (half the materials)", "売れ残ったら もどる": "Returned if unsold",
  "出す（出品料 #）": "List (fee #)", "開始値を 入れて": "Enter a starting bid", "値段を 入れて": "Enter a price", "即決は 開始値より 高く": "Buyout must be above the starting bid",
  "出品料が 足りない：あと #": "Not enough for the fee: # short", "クレジットが 足りない：あと #": "Not enough credits: # short",
  "売れた 値": "Sold for", "手数料": "Fee", "うけとり": "You got", "引き取り #": "Buy back #", "リサイクル（素材の 5 割）": "Recycle (half the materials)", "取り下げて もどす": "Withdraw and return",
  "売れ残った。どちらかを えらぶ（7 日 えらばないと 引き取り）": "It didn't sell. Pick one (buy-back after 7 days if you don't).", "入札が ある ので 取り下げられない": "Can't withdraw: it has bids",
  "取り下げる（品は もどらない）": "Withdraw (the item won't come back)", "取り下げる": "Withdraw",
  "即決で 落札した（品は すぐ とどく）": "Won at buyout (arriving shortly)", "入札した": "Bid placed", "買った（品は すぐ とどく）": "Bought (arriving shortly)", "出した": "Listed", "引き取った": "Bought back", "リサイクルした": "Recycled", "取り下げた": "Withdrawn",
  "うまく いかなかった": "That didn't work", "# から 入れられる（#% 刻み）": "Bids start at # (#% steps)",
  // 門番の 返事
  "いまは 競り場に つながらない": "Can't reach the auction right now", "競り場が こたえませんでした。つぎに 開いた ときに 決まります（2 回 へる ことは ありません）": "The auction didn't answer. It settles next time you open it (you won't be charged twice).",
  "素材と 数（#〜#）を えらんで": "Pick a material and amount (#–#)", "その 素材が 足りない": "Not enough of that material", "その スフィアは ない": "No such sphere",
  "鑑定して いない スフィアは 出せない（ガラクで 鑑定）": "Unappraised spheres can't be listed (appraise at Garaku's)", "その 装備は ない": "No such gear", "付けて いる 装備は 出せない（はずして から）": "Equipped gear can't be listed (unequip it first)",
  "その サンプルは ない": "No such sample", "品を えらんで": "Pick an item", "場を えらんで": "Pick a market", "開始値は #〜#": "Starting bid: #–#", "値段は #〜#": "Price: #–#", "即決の 値は 開始値より 高く": "Buyout must be above the starting bid",
  "値を 入れて": "Enter an amount", "引き取り か リサイクルを えらんで": "Choose buy-back or recycle", "出品の 枠が いっぱい（# こ）。売れるか 終わるのを 待って": "Listing slots are full (#). Wait for something to sell or end.",
  "その 出品は もう 終わった": "That listing has ended", "自分の 出品には 入れられない": "You can't bid on your own listing", "値段が かわった（もう 一度 見て）": "The price changed (check again)", "その 出品は ない": "No such listing",
  "入札が ある 出品は 取り下げられない": "Listings with bids can't be withdrawn", "準備中（競り・フリマは、公開まで もう 少し お待ちください）": "Coming soon (the auction and flea market open shortly)",
  "返事が とどかなかったので 取り消した": "Cancelled because no reply arrived", "知らない やること": "Unknown action",
  // 決まり（auction.js）
  "出せない 品": "Can't list that", "フリマに 出せるのは 装備だけ": "Only gear can go to the flea market", "アンビルの フリマは 武器だけ": "Anvil's flea market takes weapons only",
  "ピーコの フリマは 防具だけ": "Peeko's flea market takes armor only", "フリマに 出せるのは 自分で 作った 装備だけ（開発・合成）": "Only gear you made yourself (craft or fuse) can go to the flea market",
  // 店の 品（deeplink.js）
  "作った 防具を この 店の フリマに 並べて 売れる": "Lets you list armor you made at this shop's flea market", "作った 武器を この 店の フリマに 並べる 枠": "A slot to list weapons you made at this shop's flea market",
};
export const RULES = [];
