// 最初の 1 匹（性格診断）のデータと点の数え方。画面の見本は quiz.html。決まりは docs/mono-link-pet-battle.md の「最初の 1 匹（性格診断）」
// 答えごとに [いちばん合う子（3 点）, つぎに合う子（1 点）]。どの質問でも 8 匹が 1 回ずつ出る（3 点が 4 匹・1 点が 4 匹）
// 6 問を通して、どの子も 3 点 3 回・1 点 3 回。4^6 = 4096 通りの答え方で、どの子が来る割合も 12.1〜12.7%（1 匹に決まる 82%・同点 18%）

export const POINT = [3, 1];

// 8 匹（性格・口ぐせは docs/mono-link-lounge.md、合う職業はステータス適正の表から）。sp は 種類（pets.js の 3D・trees.js の ステータス適正・日記の 口ぐせ で 使う 名前）
export const PETS = {
  nemu: { sp: "shika", name: "ネム", label: "しか", img: "img/nemu.png", trait: "一日 20 時間ねている。配信の時間だけぴったり起きる", diary: "ねた。おきた。ねた。……はいしん みた。ねた。", jobs: ["ヒーラー", "キャスター"] },
  posuke: { sp: "pelican", name: "ポスケ", label: "ペリカン", img: "img/pet-pelican.png", trait: "まじめすぎる郵便屋さん。手紙をわたすとき、かならず敬礼する", diary: "てがみを 3つう とどけた。ぜんぶに 貝がらを つけた。", jobs: ["テクニシャン", "ディフェンダー"] },
  kachi: { sp: "mouse", name: "カチ", label: "マウス", img: "img/kachi.png", trait: "せっかちで、なんでも 2 回言う。ほめると部屋を 3 周走る", diary: "はしった はしった。かくれた かくれた。みつかった みつかった。", jobs: ["テクニシャン", "アタッカー"] },
  zaza: { sp: "tv", name: "ザザ", label: "ブラウン管", img: "img/pet-tv.png", trait: "昔話が長い物知り。気分が画面に出るのに、本人は隠せていると思っている", diary: "むかしは よかった。（きょう 3かいめ）", jobs: ["ヒーラー", "キャスター"] },
  hori: { sp: "mogura", name: "ホリ", label: "もぐら", img: "img/pet-mogura.png", trait: "働き者すぎて、気がつくとよその部屋の床から顔を出している", diary: "みぎに ほった。となりの へやに でた。あいさつした。かえった。", jobs: ["アタッカー", "ディフェンダー"] },
  yura: { sp: "kurage", name: "ユラ", label: "くらげ", img: "img/pet-kurage.png", trait: "話の途中で言いたいことをわすれる。夜は光ってはしゃぎすぎる", diary: "きょうは たしか なにかが あった。ゆらゆら。", jobs: ["キャスター", "ヒーラー"] },
  chiku: { sp: "saboten", name: "チク", label: "サボテン", img: "img/pet-saboten.png", trait: "無口でクール…のふりをして、なでられ待ちでずっと近くに立っている", diary: "……。（きょうは 3かい なでられた）", jobs: ["ディフェンダー", "ヒーラー"] },
  charin: { sp: "chokin", name: "チャリン", label: "ちょきんばこ", img: "img/pet-chokin.png", trait: "食いしんぼう。コインならなんでも食べる。食べすぎると重くて動けない", diary: "ボタンを たべようとした。コインじゃ なかった。ふられた。チャリチャリ いった。", jobs: ["アタッカー", "テクニシャン"] },
};

// 6 問（鹿さんの OK、2026-10-21）
export const QUIZ = [
  { q: "休みの日の朝、なにをする？", a: [
    ["目覚ましを止めて、もう一回ねる", "nemu", "yura"],
    ["早起きして、やることを先に片づける", "hori", "posuke"],
    ["起きてすぐ、きのうのゲームのつづき", "zaza", "kachi"],
    ["まずは朝ごはん。おかわりもする", "charin", "chiku"] ] },
  { q: "友だちから手紙がとどいた。どうする？", a: [
    ["すぐ返事を書く。切手もまっすぐはる", "posuke", "hori"],
    ["読んだけど、返事を書くのをわすれる", "yura", "nemu"],
    ["うれしいけど、べつに…という顔をする", "chiku", "zaza"],
    ["お金が入っていないか、まずふってみる", "charin", "kachi"] ] },
  { q: "お店の前に長い列。どうする？", a: [
    ["待てない。気づくと列から出ている", "kachi", "yura"],
    ["立ったまま、うとうとする", "nemu", "chiku"],
    ["前の人に、むかしの行列の話をはじめる", "zaza", "posuke"],
    ["うら口がないか、さがしに行く", "hori", "charin"] ] },
  { q: "ほめられたら、どうなる？", a: [
    ["「ありがとうございます！」と大きな声で言う", "posuke", "hori"],
    ["うれしくて、部屋を 3 周走る", "kachi", "charin"],
    ["なにも言わない。でも、もっとほめてほしくて近くにいる", "chiku", "zaza"],
    ["ほめられたことを、すぐわすれる", "yura", "nemu"] ] },
  { q: "ごほうびがもらえるなら、どれ？", a: [
    ["ピカピカのもの", "charin", "posuke"],
    ["夜に光るおもちゃ", "yura", "zaza"],
    ["日当たりのいい窓ぎわの席", "chiku", "nemu"],
    ["近道できるトンネル", "hori", "kachi"] ] },
  { q: "夜、なかなかねむれないときは？", a: [
    ["そんな日はない。すぐねる", "nemu", "hori"],
    ["あしたの持ち物を、きちんとそろえる", "posuke", "chiku"],
    ["寝返りを 20 回うつ", "kachi", "charin"],
    ["こっそり、むかしのゲームをつける", "zaza", "yura"] ] },
];

// answers：質問ごとに選んだ答えの番号（0〜3）。いちばん点の多い子たち（同点なら 2〜3 匹）を返す
export function score(answers) {
  const pts = Object.fromEntries(Object.keys(PETS).map((id) => [id, 0]));
  answers.forEach((n, i) => { const [, best, next] = QUIZ[i].a[n]; pts[best] += POINT[0]; pts[next] += POINT[1]; });
  const max = Math.max(...Object.values(pts));
  return { pts, top: Object.keys(pts).filter((id) => pts[id] === max) };
}
