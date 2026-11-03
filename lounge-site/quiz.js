// 最初の 1 匹（性格診断）のデータと点の数え方。画面の見本は quiz.html。決まりは docs/mono-link-pet-battle.md の「最初の 1 匹（性格診断）」
// 9 問・4 択（鹿さんの 決め、2026-10-31。12 匹に した とき）。答えごとに [いちばん合う子（3 点）, つぎに合う子（2 点）, その次に合う子（1 点）]
// どの質問でも 12 匹が 1 回ずつ出る。9 問を通して、どの子も 3 点 3 回・2 点 3 回・1 点 3 回
// 4^9 = 262,144 通りの答え方で、どの子が来る割合も 8.2〜8.5%（1 匹に決まる 78.7%・2 匹 同点 16.8%）。同じ 2 匹が 同じ 答えに 何度も 入ると 点を 取り合って 来にくく なる ので、重ならない ように 配った
// （前は 6 問・4 択・8 匹で、答えごとに 3 点と 1 点）

export const POINT = [3, 2, 1];

// 2 匹目からの 解放（鹿さんの 決め、2026-10-31）：N 匹目を むかえる アメジスト。2 匹目は 無料（1 匹目の すぐ あと）、3 匹目から 10・50 から 50 ずつ。12 匹から えらぶ
export const UNLOCK = [0, 0, 10, 50, 100, 150, 200, 250, 300, 350, 400, 450];
export const unlockCost = (have) => UNLOCK[have];   // have：いま いる 数（いない ときは 1 匹目＝性格診断。12 匹 そろったら undefined）

// 12 匹（性格・口ぐせは docs/mono-link-lounge.md と docs/mono-link-new-pets.md、合う職業はステータス適正の表から、tree は その子の メインの ツリー docs/mono-link-main-trees.md）。sp は 種類（pets.js の 3D・trees.js の ステータス適正・日記の 口ぐせ で 使う 名前）
export const PETS = {
  nemu: { sp: "shika", name: "ネム", label: "しか", img: "img/nemu.png", trait: "一日 20 時間ねている。配信の時間だけぴったり起きる", diary: "ねた。おきた。ねた。……はいしん みた。ねた。", jobs: ["ヒーラー", "キャスター"], tree: "ドロウジー" },
  posuke: { sp: "pelican", name: "ポスケ", label: "ペリカン", img: "img/pet-pelican.png", trait: "まじめすぎる郵便屋さん。手紙をわたすとき、かならず敬礼する", diary: "てがみを 3つう とどけた。ぜんぶに 貝がらを つけた。", jobs: ["テクニシャン", "ディフェンダー"], tree: "パンクチュアル" },
  kachi: { sp: "mouse", name: "カチ", label: "マウス", img: "img/kachi.png", trait: "せっかちで、なんでも 2 回言う。ほめると部屋を 3 周走る", diary: "はしった はしった。かくれた かくれた。みつかった みつかった。", jobs: ["テクニシャン", "アタッカー"], tree: "スウィフト" },
  zaza: { sp: "tv", name: "ザザ", label: "ブラウン管", img: "img/pet-tv.png", trait: "昔話が長い物知り。気分が画面に出るのに、本人は隠せていると思っている", diary: "むかしは よかった。（きょう 3かいめ）", jobs: ["ヒーラー", "キャスター"], tree: "スタティック" },
  hori: { sp: "mogura", name: "ホリ", label: "もぐら", img: "img/pet-mogura.png", trait: "働き者すぎて、気がつくとよその部屋の床から顔を出している", diary: "みぎに ほった。となりの へやに でた。あいさつした。かえった。", jobs: ["アタッカー", "ディフェンダー"], tree: "タフ" },
  yura: { sp: "kurage", name: "ユラ", label: "くらげ", img: "img/pet-kurage.png", trait: "話の途中で言いたいことをわすれる。夜は光ってはしゃぎすぎる", diary: "きょうは たしか なにかが あった。ゆらゆら。", jobs: ["キャスター", "ヒーラー"], tree: "トランスルーセント" },
  chiku: { sp: "saboten", name: "チク", label: "サボテン", img: "img/pet-saboten.png", trait: "無口でクール…のふりをして、なでられ待ちでずっと近くに立っている", diary: "……。（きょうは 3かい なでられた）", jobs: ["ディフェンダー", "ヒーラー"], tree: "スパイキー" },
  charin: { sp: "chokin", name: "チャリン", label: "ちょきんばこ", img: "img/pet-chokin.png", trait: "食いしんぼう。コインならなんでも食べる。食べすぎると重くて動けない", diary: "ボタンを たべようとした。コインじゃ なかった。ふられた。チャリチャリ いった。", jobs: ["アタッカー", "テクニシャン"], tree: "グリーディ" },
  // 2026-10-31 に ふやした 4 匹（docs/mono-link-new-pets.md）。テクは 適正が ぜんぶ B なので 合う 職業が ない
  takochi: { sp: "tako", name: "たこちー", label: "タコ", img: "img/pet-tako.png", trait: "料理好きで、偉そうだけど熱血。足の 1 本でいつもフライパンを持っている", diary: "きょうも ボクの りょうりは さいこうだった。（こがした）", jobs: ["アタッカー", "キャスター"], tree: "マリアージュ" },
  pera: { sp: "ittan", name: "ペラ", label: "一反木綿", img: "img/pet-ittan.png", trait: "アルミの板でできた一反木綿。顔に紙が貼ってある。夜中に天井からぶらさがる", diary: "わしは ひらひら しとらん。カタカタ しとる。", jobs: ["キャスター", "テクニシャン"], tree: "スプーキー" },
  kurotora: { sp: "ebi", name: "クロトラ", label: "黒いエビ", img: "img/pet-ebi.png", trait: "淡白で冷静なメカのエビ。だまって見回りをして、報告だけする", diary: "異常なし。……以上。", jobs: ["ヒーラー", "キャスター"], tree: "シャープ" },
  teku: { sp: "beagle", name: "テク", label: "ビーグル", img: "img/pet-beagle.png", trait: "元気すぎる散歩係。じっとしていられず、みんなを散歩にさそう", diary: "さんぽ いった。もういっかい いった。まだ いける。", jobs: [], tree: "フレキシブル" },
};

// 9 問。1〜6 問は 鹿さんの OK（2026-10-21）の まま、7〜9 問は 2026-10-31 に 足した（鹿さんが カードで えらんだ）
export const QUIZ = [
  { q: "休みの日の朝、なにをする？", a: [
    ["目覚ましを止めて、もう一回ねる", "nemu", "yura", "takochi"],
    ["早起きして、やることを先に片づける", "hori", "kurotora", "posuke"],
    ["起きてすぐ、きのうのゲームのつづき", "zaza", "kachi", "pera"],
    ["まずは朝ごはん。おかわりもする", "charin", "teku", "chiku"] ] },
  { q: "友だちから手紙がとどいた。どうする？", a: [
    ["すぐ返事を書く。切手もまっすぐはる", "posuke", "hori", "pera"],
    ["読んだけど、返事を書くのをわすれる", "yura", "nemu", "teku"],
    ["うれしいけど、べつに…という顔をする", "chiku", "zaza", "takochi"],
    ["お金が入っていないか、まずふってみる", "charin", "kachi", "kurotora"] ] },
  { q: "お店の前に長い列。どうする？", a: [
    ["待てない。気づくと列から出ている", "kachi", "takochi", "yura"],
    ["立ったまま、うとうとする", "nemu", "pera", "chiku"],
    ["前の人に、むかしの行列の話をはじめる", "zaza", "posuke", "teku"],
    ["うら口がないか、さがしに行く", "hori", "kurotora", "charin"] ] },
  { q: "ほめられたら、どうなる？", a: [
    ["「ありがとうございます！」と大きな声で言う", "posuke", "hori", "takochi"],
    ["うれしくて、部屋を 3 周走る", "kachi", "charin", "pera"],
    ["なにも言わない。でも、もっとほめてほしくて近くにいる", "chiku", "zaza", "teku"],
    ["ほめられたことを、すぐわすれる", "yura", "nemu", "kurotora"] ] },
  { q: "ごほうびがもらえるなら、どれ？", a: [
    ["ピカピカのもの", "charin", "takochi", "posuke"],
    ["夜に光るおもちゃ", "yura", "kurotora", "zaza"],
    ["日当たりのいい窓ぎわの席", "chiku", "pera", "nemu"],
    ["近道できるトンネル", "hori", "teku", "kachi"] ] },
  { q: "夜、なかなかねむれないときは？", a: [
    ["そんな日はない。すぐねる", "nemu", "hori", "kurotora"],
    ["あしたの持ち物を、きちんとそろえる", "posuke", "takochi", "chiku"],
    ["寝返りを 20 回うつ", "kachi", "teku", "charin"],
    ["こっそり、むかしのゲームをつける", "zaza", "pera", "yura"] ] },
  { q: "散歩にさそわれた。どうする？", a: [
    ["もう玄関で待っている", "teku", "charin", "nemu"],
    ["道順と帰る時間を決めてから出る", "kurotora", "chiku", "kachi"],
    ["風が強い日なら行く", "pera", "yura", "posuke"],
    ["帰りに材料を買って、ごはんを作る", "takochi", "zaza", "hori"] ] },
  { q: "雨の日の夕方、なにをする？", a: [
    ["あたたかいスープを作って、みんなにふるまう", "takochi", "charin", "zaza"],
    ["しょうじのかげから、そっと外をのぞく", "pera", "nemu", "hori"],
    ["雨の量を、だまって記録する", "kurotora", "chiku", "yura"],
    ["かさをさして、それでも散歩に行く", "teku", "posuke", "kachi"] ] },
  { q: "こわい話を聞いたら？", a: [
    ["「わしの話のほうがこわいぞ」と話しはじめる", "pera", "chiku", "charin"],
    ["「説明できる」と、たんたんと言う", "kurotora", "posuke", "zaza"],
    ["こわくなって、だれかのところへ走っていく", "teku", "yura", "hori"],
    ["「こわくない！」と言いながら、フライパンをかまえる", "takochi", "kachi", "nemu"] ] },
];

// answers：質問ごとに選んだ答えの番号（0〜3）。いちばん点の多い子たち（同点なら 2 匹 以上）を返す
export function score(answers) {
  const pts = Object.fromEntries(Object.keys(PETS).map((id) => [id, 0]));
  answers.forEach((n, i) => QUIZ[i].a[n].slice(1).forEach((id, j) => (pts[id] += POINT[j])));
  const max = Math.max(...Object.values(pts));
  return { pts, top: Object.keys(pts).filter((id) => pts[id] === max) };
}
