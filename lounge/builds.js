// 試しに戦わせるペット。Lv までの SP を職業ツリーに自動で振り（trees.js）、覚えた技からセットとガンビットを組む
// ガンビットは職業ごとのお手本（上から順）。まだ覚えていない技の行は飛ばし、ガンビットの枠の数だけ入れる
import { buildPet, SET_SLOTS } from "./trees.js";
import { ENEMY_TREES } from "./enemy-trees.js";

// ガンビットの枠：最初 3、Lv5・10・15・20・30 で 1 つずつ（最大 8）。ツリーの奥義（キーワード）でさらに +1
export const gambitSlots = (lv, keywords = 0) => 3 + [5, 10, 15, 20, 30].filter((x) => lv >= x).length + keywords;

const G = (cond, v, skill) => ({ if: v === undefined ? [cond] : [cond, v], do: skill });
export const PLANS = {
  attacker: { auto: "attack", gambits: [G("first", undefined, "udemakuri"), G("mpBelow", 8, "udemakuri"), G("mpAtLeast", 10, "chabudai"), G("foeHpBelow", 35, "elbow"), G("every", 3, "brazil"), G("every", 3, "swing"), G("mpAtLeast", 5, "tossin"), G("every", 2, "chop"), G("always", undefined, "yamakan")] },
  caster: { auto: "balance", gambits: [G("mpAtLeast", 14, "hanabi"), G("first", undefined, "kutsushita"), G("foeNotHas", "rot", "tamago"), G("mpBelow", 10, "note"), G("every", 3, "note"), G("foeNotHas", "scald", "lighter"), G("mpAtLeast", 7, "mushimegane"), G("mpAtLeast", 8, "lighter"), G("mpAtLeast", 16, "kamifubuki"), G("always", undefined, "bakuchiku")] },
  technician: { auto: "balance", gambits: [G("mpBelow", 6, "hanakuso"), G("foeDebuffs", 3, "decopin"), G("foeHas", "paralysis", "banana"), G("foeHas", "blind", "patchin"), G("foeNotHas", "poison", "kinoko"), G("foeNotHas", "frostbite", "kori"), G("foeNotHas", "paralysis", "kancho"), G("foeNotHas", "blind", "hanakuso"), G("always", undefined, "chokomaka")] },
  healer: { auto: "balance", gambits: [G("selfHas", "rot", "genetsu"), G("selfHas", "rot", "drink"), G("selfHas", "rot", "mizu"), G("hpBelow", 30, "hirune"), G("hpBelow", 55, "okashi"), G("mpBelow", 14, "genetsu"), G("mpBelow", 12, "drink"), G("debuffed", undefined, "genetsu"), G("every", 3, "drink"), G("hpBelow", 70, "bansoko"), G("hpBelow", 70, "negi"), G("foeBuffed", undefined, "mizu"), G("always", undefined, "sekkyo"), G("always", undefined, "mizu")] },
  defender: { auto: "balance", gambits: [G("first", undefined, "peekaboo"), G("mpBelow", 6, "peekaboo"), G("hpBelow", 40, "kotatsu"), G("every", 3, "tomoe"), G("every", 3, "ground"), G("every", 2, "noshikakari"), G("foeHas", "focus", "clinch"), G("selfNotHas", "barrier", "danboru"), G("every", 4, "clinch"), G("always", undefined, "manju")] },
};

// type の Lv のペット（branch：{ 1: "R" } で分岐①を右に。seed：個体差。free：手で振ったステータス。subs：サブツリー。main：敵のツリー）
// ガンビット：サブツリーのお手本から「いつでも」以外の行を先に入れ、そのあとに職業のお手本。o.gambits で自分で決めることもできる
const AUTO_OF = { attacker: "attack" };
export function petAt(type, lv, o = {}) {
  const p = buildPet(type, lv, o), has = (g) => p.learnedSkills.includes(g.do);
  const own = o.main ? ENEMY_TREES[o.main].plan : PLANS[type].gambits;
  const fromSubs = (o.subs || []).flatMap(([id]) => ENEMY_TREES[id].plan.filter((g) => g.if[0] !== "always" && has(g)));
  const gambits = (o.gambits || [...fromSubs, ...own]).filter(has).slice(0, gambitSlots(lv, p.keywords));
  const used = [...new Set(gambits.map((g) => g.do))], set = [...used, ...p.learnedSkills.filter((s) => !used.includes(s))].slice(0, SET_SLOTS);
  return { type, lv, stats: p.stats, set, passives: p.passives, gambits, auto: PLANS[type]?.auto || AUTO_OF[type] || "balance", trees: p.trees };
}

// Lv15 のお手本（分岐はどれも左）
export const BUILDS = Object.fromEntries(Object.keys(PLANS).map((t) => [t, petAt(t, 15)]));
