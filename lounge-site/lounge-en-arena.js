// 英語の 辞書：闘技場（arena）・戦いの 絵（battle-view.js）・戦いの 記録と ガンビットの 条件（battle-sim.js）・部屋の 決まり（lounge-rules.js）
// 書き方は lounge-en-dict.js の 上を 見る（数字は #、名前が 入る 文は RULES）
const P = (p, s) => p(s) || s;
const n1 = (n, one, many) => (n === "1" ? `1 ${one}` : `${n} ${many}`);

export const WORDS = {
  // ---- 闘技場（arena.html） ----
  "デュエル": "Duel", "トーナメント": "Tournament", "記録": "Log", "きょうは もらった": "Claimed today", "ごほうび なし": "No reward", "挑む": "Challenge", "ごほうび あと": "Rewards left",
  "きょう あと": "Today:", "回 戦える": "fights left", "入れかえ": "Shuffle", "まだ 相手が いない": "No opponents yet", "闘技場を 開いた 人が 相手に なる": "People who open the Arena become opponents",
  "結果だけ 見る": "Skip to result", "勝負あり": "Decided", "もどる": "Back", "ごほうびは なし（きょうの 分は もらった）": "No reward (already claimed today)", "何も へらない": "You lose nothing",
  "つぎの 相手へ": "Next opponent", "下克上！": "Upset!", "勝ち！": "Victory!", "負け…": "Defeat…", "見る": "Watch", "優勝！": "Champion!", "準優勝！": "Runner-up!", "ベスト 4！": "Top 4!",
  "参加": "Entry", "きょうの 大会": "Today's tournament", "あと": "left", "人": "people", "優勝": "Champion", "準優勝": "Runner-up", "ベスト 4": "Top 4", "参加を やめる": "Withdraw", "参加する": "Enter",
  "前の 大会": "Last tournament", "試合中…": "Match in progress…", "守った": "Defended", "やられた": "Lost", "派遣先": "Expedition", "留守の あいだ": "While you were away", "まだ 記録が ない": "No records yet",
  "さがして います…": "Searching…", "相手を よんで います…": "Calling the opponent…", "よんで います…": "Calling…", "申しこんで います…": "Entering…", "とりけして います…": "Withdrawing…",
  "参加を やめました": "Withdrew", "いまは 闘技場に つながらない": "Can't reach the Arena right now", "その 戦いは もう ない": "That battle is gone",
  // ---- 戦いの 絵（battle-view.js） ----
  "ミス": "Miss", "浄化": "Cleanse", "はじけた": "Popped", "オート": "Auto", "▲バフ": "▲Buff", "がんばり": "Grit", "8 ターンで決着せず": "No result in 8 turns", "勝負あり！": "It's decided!",
  "（30 ターンでも決着せず・HP の割合）": "(no result in 30 turns · decided by HP %)",
  // ---- ガンビットの 条件（battle-sim.js） ----
  "自分にデバフがある": "I have a debuff", "自分にバフがない": "I have no buffs", "相手にバフがある": "Foe has a buff", "相手が前の番にイタズラをした": "Foe used a prank last turn", "相手の方が強い": "Foe is stronger",
  // 戦いの 記録
  "おさえこみ": "Pin", "ひび": "Cracks", "凍っていて動けない": "is frozen and can't move", "バナナの皮で転んだ！": "slipped on a banana peel!", "気絶している": "is stunned", "寝ている": "is asleep",
  "しびれて動けない": "is numb and can't move", "おさえこんでいる": "is pinning", "おさえこまれて動けない": "is pinned and can't move", "転ばなかった": "didn't slip", "平気だった": "was fine",
  // ---- 部屋の 決まり（lounge-rules.js） ----
  "置き方の 形が ちがう": "The layout is invalid", "知らない 家具": "Unknown furniture",
};

const FX = (p, s) => p(s);   // 状態の 名前
export const RULES = [
  // 闘技場
  [/^(.+) の 相棒$/, (m) => `${m[1]}'s partner`], [/^きょうは もう (\d+) 回 戦った（あした また）$/, (m) => `Already fought ${m[1]} times today (come back tomorrow)`],
  [/^クレジット(.*)$/, (m, p) => `Credits${m[1] ? " " + P(p, m[1]) : ""}`], [/^（(.+)に 勝った）$/, (m) => `(beat ${m[1]})`], [/^(.+)から 見る$/, (m, p) => `Watch from ${P(p, m[1])}`],
  [/^([\d,]+) クレジット(.*)$/, (m, p) => `${n1(m[1], "credit", "credits")}${m[2] ? " " + P(p, m[2]) : ""}`],
  [/^／ (\d+) 人から ひらく（(\d+) 人まで）$/, (m) => `/ starts at ${m[1]} (max ${m[2]})`], [/^(\d+) 人 そろわず 中止$/, (m) => `Cancelled: fewer than ${m[1]} entrants`],
  [/^(\d+) 分前$/, (m) => `${m[1]} min ago`], [/^(\d+) 日前$/, (m) => `${n1(m[1], "day", "days")} ago`], [/^(\d+) 時間前$/, (m) => `${m[1]} h ago`],
  [/^(.+) の (.+)に$/, (m, p) => `vs ${m[1]}'s ${P(p, m[2])}:`], [/^(.+) の (.+)が 来た →$/, (m, p) => `${m[1]}'s ${P(p, m[2])} came →`],
  [/^(.+)で (.+) の (.+)と ばったり →(?: (勝った|負けた))?$/, (m, p) => `Ran into ${m[2]}'s ${P(p, m[3])} in ${P(p, m[1])} →${m[4] ? (m[4] === "勝った" ? " Won" : " Lost") : ""}`],
  [/^(\d+) 勝 (\d+) 敗$/, (m) => `${m[1]}W ${m[2]}L`], [/^(.+) → (.+) の 勝ち$/, (m, p) => `${P(p, m[1])} → ${P(p, m[2])} wins`], [/^参加しました（きょう (\d+):00）$/, (m) => `Entered (today ${m[1]}:00 JST)`],
  // 戦いの 絵
  [/^デバフ (\d+) つ はじけた！$/, (m) => `${m[1]} debuffs popped!`], [/^ターン (\d+) は計算で進めた$/, (m) => `Turn ${m[1]} was simulated`],
  [/^(.+) の勝ち(.*)$/, (m, p) => `${P(p, m[1])} wins${m[2] ? " " + P(p, m[2]) : ""}`], [/^（(\d+) ターン目で決着）$/, (m) => `(decided on turn ${m[1]})`],
  // ガンビットの 条件
  [/^(自分|相手)の HP が (\d+)% より(少ない|多い)$/, (m) => `${m[1] === "自分" ? "My" : "Foe"} HP ${m[3] === "少ない" ? "below" : "above"} ${m[2]}%`],
  [/^(自分|相手)の MP が (\d+) (以上|より少ない)$/, (m) => `${m[1] === "自分" ? "My" : "Foe"} MP ${m[3] === "以上" ? `${m[2]} or more` : `below ${m[2]}`}`],
  [/^相手のデバフが (\d+) つ以上$/, (m) => `Foe has ${m[1]}+ debuffs`],
  [/^(相手|自分)が(.+?)(でない)?$/, (m, p) => FX(p, m[2]) && `${m[1] === "相手" ? (m[3] ? "Foe doesn't have" : "Foe has") : m[3] ? "I don't have" : "I have"} ${FX(p, m[2])}`],
  // 戦いの 記録（「名前 の 技！ 相手 に 22（会心！） HP +5」）
  [/^(.+?) の (.+?)！(?: (.+?) に ([\d +]+?)(（会心！）)?| (.+?) はよけた)?(?: HP \+(\d+))?$/, (m, p) => { const sk = p(m[2]); if (!sk) return null;
    return `${P(p, m[1])} used ${sk}!${m[3] ? ` ${m[4]} to ${P(p, m[3])}${m[5] ? " (crit!)" : ""}` : m[6] ? ` ${P(p, m[6])} dodged` : ""}${m[7] ? ` HP +${m[7]}` : ""}`; }],
  [/^(.+) に(.+)は効かない$/, (m, p) => FX(p, m[2]) && `${FX(p, m[2])} has no effect on ${P(p, m[1])}`], [/^(.+) は(.+)に ならない$/, (m, p) => FX(p, m[2]) && `${P(p, m[1])} can't get ${FX(p, m[2])}`],
  [/^(.+) は免疫で(.+)を防いだ$/, (m, p) => FX(p, m[2]) && `${P(p, m[1])}'s Immunity blocked ${FX(p, m[2])}`], [/^(.+) は(.+)を防いだ$/, (m, p) => FX(p, m[2]) && `${P(p, m[1])} blocked ${FX(p, m[2])}`],
  [/^(.+) は(.+)に強い$/, (m, p) => FX(p, m[2]) && `${P(p, m[1])} resists ${FX(p, m[2])}`], [/^(.+)と打ち消しあった$/, (m, p) => FX(p, m[1]) && `Canceled out with ${FX(p, m[1])}`],
  [/^(.+)が消えた$/, (m, p) => FX(p, m[1]) && `${FX(p, m[1])} wore off`], [/^凍傷がしみて (\d+)$/, (m) => `Frostbite stings: ${m[1]}`],
  [/^(.+) は輪廻で踏みとどまった！$/, (m, p) => `${P(p, m[1])} hung on thanks to Rebirth!`], [/^(.+) はあきらめない！ 立ち上がった$/, (m, p) => `${P(p, m[1])} never gives up! Got back up`],
  [/^腐敗で (\d+) のダメージに変わった$/, (m) => `Rot turned it into ${m[1]} damage`], [/^(.+) は幻影でかわした$/, (m, p) => `${P(p, m[1])} dodged with Mirage`], [/^(.+) のバリアが防いだ$/, (m, p) => `${P(p, m[1])}'s Barrier blocked it`],
  [/^(.+) に ひびが 入った（会心の 分 (\d+) は あとから）$/, (m, p) => `${P(p, m[1])} cracked (${m[2]} crit damage comes later)`], [/^(.+) の凍結がとけて (\d+)$/, (m, p) => `${P(p, m[1])} thawed out: ${m[2]}`],
  [/^(.+) は目をさました$/, (m, p) => `${P(p, m[1])} woke up`], [/^(.+) のカウンター！ (\d+) 返した$/, (m, p) => `${P(p, m[1])} countered! Returned ${m[2]}`],
  [/^(.+) は(.+)になった$/, (m, p) => FX(p, m[2]) && `${P(p, m[1])} → ${FX(p, m[2])}`], [/^(.+) は混乱して自分に使った$/, (m, p) => `${P(p, m[1])} is confused and used it on itself`],
  [/^(.+) はよけた$/, (m, p) => `${P(p, m[1])} dodged`], [/^デバフが (\d+) つ はじけた！$/, (m) => `${m[1]} debuffs popped!`], [/^(.+)がはじけた！$/, (m, p) => FX(p, m[1]) && `${FX(p, m[1])} popped!`],
  [/^残りの(.+)が一度に回って (\d+)$/, (m, p) => FX(p, m[1]) && `The remaining ${FX(p, m[1])} hit all at once: ${m[2]}`], [/^(.+) はくやしがって (\d+) のダメージ$/, (m, p) => `${P(p, m[1])} got jealous and took ${m[2]} damage`],
  [/^(.+) のデバフが消えた$/, (m, p) => `${P(p, m[1])}'s debuffs were cleared`], [/^(.+) のバフが消えた$/, (m, p) => `${P(p, m[1])}'s buffs were removed`],
  [/^(.+) の MP が (\d+) 減った$/, (m, p) => `${P(p, m[1])} lost ${m[2]} MP`], [/^(.+) はふりほどいた$/, (m, p) => `${P(p, m[1])} broke free`],
  [/^(.+) は (.+)$/, (m, p) => p(m[2]) && `${P(p, m[1])} ${p(m[2])}`], [/^(.+) は(転ばなかった|平気だった)$/, (m, p) => `${P(p, m[1])} ${p(m[2])}`],
  // 部屋の 決まり
  [/^(.+)を 持って いる 数より 多い$/, (m, p) => p(m[1]) && `More ${p(m[1])} than you own`], [/^(.+)が ほかの 物と かさなる$/, (m, p) => p(m[1]) && `The ${p(m[1])} overlaps something else`],
  [/^(.+)は しまえない$/, (m, p) => p(m[1]) && `The ${p(m[1])} can't be put away`],
];
