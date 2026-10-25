// 英語の 辞書：敵の パッシブ・装備の 効果の 説明（形が 決まって いる 文。はじめの 島と ニライ諸島の 敵の ツリーで 使う）
// 書き方は lounge-en-dict.js の 上を 見る。「・」で つながった 文は lounge-en-core.js が 分けて から 1 つずつ 引く
const P = (p, s) => p(s) || s;
// 効果の 名前 ＋ 数・ターン（「棘 +20」「祝福（3 ターン）」「加速（ずっと）」）
const fx = (p, s) => {
  const m = String(s).trim().match(/^(.+?)(?: ?([+＋−-])? ?(\d+(?:\.\d+)?)(%?))?(?:（(\d+) ターン）|（ずっと）)?$/);
  if (!m) return null;
  const name = p(m[1]); if (name == null) return null;
  const n = m[3] ? ` ${!m[2] ? "" : m[2] === "−" || m[2] === "-" ? "−" : "+"}${m[3]}${m[4]}` : "", t = m[5] ? ` (${m[5]} turn${m[5] === "1" ? "" : "s"})` : /（ずっと）$/.test(s) ? " (permanent)" : "";
  return `${name}${n}${t}`;
};
// 「A と B」を 両方 訳す（かっこの 中の「と」＝「ずっと」では 分けない）
const both = (p, s) => { const parts = String(s).split(/\s*と\s*(?![^（]*）)/).map((x) => fx(p, x)); return parts.every((x) => x != null) ? parts.join(" and ") : null; };
const or = (p, s) => { const parts = String(s).split("か").map((x) => p(x)); return parts.every((x) => x != null) ? parts.join(" or ") : null; };

export const WORDS = {
  "戦いのはじめに": "Start of battle:", "攻撃のとき": "On hit",
};

export const RULES = [
  // 戦いの はじめ
  [/^戦いのはじめに相手(全員)?(?:に|を)(.+)$/, (m, p) => { const b = both(p, m[2]); return b && `Start of battle: ${m[1] ? "all foes" : "foe"} ${b}`; }],
  [/^戦いのはじめに(.+)$/, (m, p) => { const b = both(p, m[1]); return b && `Start of battle: ${b}`; }],
  // 付ける 量・ターン
  [/^付ける(.+?) \+(\d+) ターン$/, (m, p) => p(m[1]) && `${p(m[1])} you inflict +${m[2]} turn${m[2] === "1" ? "" : "s"}`],
  [/^付ける(.+?) \+(\d+)$/, (m, p) => p(m[1]) && `${p(m[1])} you inflict +${m[2]}`],
  [/^自分が付けた(.+)のダメージ ([\d.]+) 倍$/, (m, p) => p(m[1]) && `Your ${p(m[1])} deals ${m[2]}× damage`],
  // 相手の 状態で 強く なる
  [/^(.+)の相手への会心 \+(\d+)%$/, (m, p) => or(p, m[1]) && `Critical +${m[2]}% vs ${or(p, m[1])} foes`],
  [/^(.+)の相手に \+(\d+)%$/, (m, p) => or(p, m[1]) && `+${m[2]}% vs ${or(p, m[1])} foes`],
  [/^(.+)した相手に \+(\d+)%$/, (m, p) => p(m[1]) && `+${m[2]}% vs ${p(m[1])} foes`],   // 凍結した・気絶した
  [/^前の番に当てていたら、技 \+(\d+)%$/, (m) => `Waza +${m[1]}% if your last move hit`],
  [/^相手の HP が半分以下なら、技 \+(\d+)%$/, (m) => `Waza +${m[1]}% vs foes at half HP or less`],
  // 攻撃・受けた とき・自分の 番
  [/^攻撃のとき (\d+)% で(.+)$/, (m, p) => { const b = fx(p, m[2]); return b && `${m[1]}% on hit: ${b}`; }],
  [/^直接攻撃を受けると (\d+)% で相手(?:を|に)(.+)$/, (m, p) => { const b = fx(p, m[2]); return b && `When hit directly: ${m[1]}% to give the attacker ${b}`; }],
  [/^自分の番のはじめに (\d+)% で相手(?:を|に)(.+)$/, (m, p) => { const b = fx(p, m[2]); return b && `Start of your turn: ${m[1]}% to give the foe ${b}`; }],
  // 守り・回復
  [/^防御中に受けるダメージがさらに −(\d+)%$/, (m) => `While guarding, damage taken a further −${m[1]}%`],
  [/^毎ターン HP ([\d.]+)% 回復$/, (m) => `Heal ${m[1]}% HP each turn`],
  [/^与えたダメージの (\d+)% を回復$/, (m) => `Heal ${m[1]}% of damage dealt`],
  [/^回復する量 \+(\d+)%$/, (m) => `Healing +${m[1]}%`],
  [/^自分のシールドの量 \+(\d+)%$/, (m) => `Your Shield +${m[1]}%`],
  [/^(.+)に強い（(\d+)% で防ぐ）$/, (m, p) => or(p, m[1]) && `Resist ${or(p, m[1])} (${m[2]}% block)`],
  [/^(.+)に強い$/, (m, p) => or(p, m[1]) && `Resist ${or(p, m[1])}`],   // 短い 形（敵の ツリーの 一覧）
  [/^自分の HP が (\d+)% 以下で ?(.+)$/, (m, p) => `${P(p, m[2])} at ${m[1]}% HP or less`],
  [/^自分にかける能力上昇 \+(\d+) ターン$/, (m) => `Your stat buffs +${m[1]} turn${m[1] === "1" ? "" : "s"}`],
  [/^会心で ふえた 分は ひびに なり、(\d+) ターンに 分けて 受ける$/, (m) => `extra damage from critical hits becomes cracks, taken over ${m[1]} turns`],
];
