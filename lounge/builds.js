// 試しに戦わせるペット。Lv までの SP を職業ツリーに自動で振り（trees.js）、覚えた技からセットとガンビットを組む
// ガンビットは職業ごとのお手本（上から順）。まだ覚えていない技の行は飛ばし、ガンビットの枠の数だけ入れる
import { buildPet, SET_SLOTS, passiveSet } from "./trees.js";
import { ENEMY_TREES } from "./enemy-trees.js";

// ガンビットの枠：最初 3、Lv5・10・15・20・30 で 1 つずつ（最大 8）。ツリーの奥義（キーワード）でさらに +1
export const gambitSlots = (lv, keywords = 0) => 3 + [5, 10, 15, 20, 30].filter((x) => lv >= x).length + keywords;

const G = (cond, v, skill) => ({ if: v === undefined ? [cond] : [cond, v], do: skill });
// メインの ツリー 12 本の お手本（Claude の 案。数と 同じく 仮）。cntAtLeast は カウント（帯電・コイン など）
const Gc = (c, n, skill) => ({ if: ["cntAtLeast", [c, n]], do: skill });
export const PLANS = {
  drowsy: { auto: "balance", gambits: [G("foeHas", "sleep", "dr_yumemakura"), G("every", 4, "dr_negaeri"), G("first", undefined, "dr_negaeri"), G("every", 2, "dr_nidone"), G("hpBelow", 70, "dr_nidone"), G("always", undefined, "dr_negaeri"), G("every", 2, "dr_negaeri"), G("every", 4, "dr_yumemakura"), G("hpBelow", 60, "dr_neta"), G("hpBelow", 55, "dr_moufu")] },
  punctual: { auto: "balance", gambits: [G("foeBuffed", undefined, "pu_shuka"), G("every", 3, "pu_fuutou"), G("mpAtLeast", 14, "pu_fuutou"), G("always", undefined, "pu_kakitome"), G("selfNotHas", "clarity", "pu_yubisashi"), G("every", 3, "pu_otodoke"), G("always", undefined, "pu_sokutatsu"), G("selfNotHas", "armor", "pu_mamoru"), G("every", 2, "pu_mamoru"), G("every", 3, "pu_sokutatsu")] },
  swift: { auto: "attack", gambits: [G("every", 3, "sw_hayaoshi"), G("every", 3, "sw_kachikachi"), G("always", undefined, "sw_choro"), G("first", undefined, "sw_hayaoshi"), G("every", 3, "sw_renda"), G("first", undefined, "sw_hashiru"), G("every", 2, "sw_choro"), G("first", undefined, "sw_kakureta"), G("first", undefined, "sw_sukima"), G("every", 4, "sw_hayaoshi")] },
  static: { auto: "balance", gambits: [G("every", 4, "st_housou"), Gc("static", 6, "st_short"), G("every", 5, "st_houden"), G("mpAtLeast", 30, "st_housou"), G("every", 4, "st_sunaarashi"), G("mpAtLeast", 20, "st_biribiri"), G("selfNotHas", "focus", "st_mukashi"), G("foeNotHas", "confusion", "st_channel"), G("every", 3, "st_houden"), G("every", 4, "st_biribiri"), G("every", 3, "st_seidenki")] },   // 帯電の 形（2026-11-06）でも この まま。勝率を 上げる 道具で 作りなおすと、帯電で 長持ちする 麻痺を 毎回 かけ直す（止め続ける）作戦に なった ので 入れない
  tough: { auto: "attack", gambits: [G("selfNotHas", "ward", "to_bikutomo"), G("every", 4, "to_horinuku"), G("foeBuffed", undefined, "to_otoshiana"), G("mpAtLeast", 20, "to_bikutomo"), G("first", undefined, "to_furikaburu"), G("always", undefined, "to_horinuku"), G("mpAtLeast", 11, "to_otoshiana"), G("every", 3, "to_hitohori"), G("selfNotHas", "armor", "to_chichu"), G("always", undefined, "to_otoshiana"), G("every", 3, "to_ana")] },
  translucent: { auto: "balance", gambits: [G("first", undefined, "tr_fuwa"), G("every", 4, "tr_mabushii"), G("every", 3, "tr_yasashii"), G("every", 2, "tr_mabushii"), G("mpBelow", 16, "tr_neon"), G("every", 4, "tr_moudoku"), G("every", 3, "tr_moudoku"), G("mpAtLeast", 6, "tr_yurayura"), G("every", 4, "tr_sukitooru"), G("every", 3, "tr_neon"), G("every", 3, "tr_fuwa"), G("first", undefined, "tr_yurayura")] },
  spiky: { auto: "balance", gambits: [G("first", undefined, "sp_hakidasu"), G("selfNotHas", "regen", "sp_hakidasu"), G("every", 3, "sp_chiku"), G("selfHas", "frostbite", "sp_mizu"), G("first", undefined, "sp_gaman"), G("every", 2, "sp_kaika"), G("mpAtLeast", 12, "sp_chiku"), G("first", undefined, "sp_toge"), G("every", 4, "sp_chiku"), G("mpAtLeast", 10, "sp_hinata"), G("every", 2, "sp_chiku")] },
  greedy: { auto: "attack", gambits: [G("every", 2, "gr_fukubiki"), G("every", 3, "gr_taiatari"), G("every", 2, "gr_manki"), G("mpAtLeast", 12, "gr_ooatari"), G("always", undefined, "gr_ooatari"), Gc("coin", 5, "gr_daiburumai"), G("mpAtLeast", 9, "gr_taiatari"), G("every", 3, "gr_fukubiki"), G("mpAtLeast", 10, "gr_taberu"), G("every", 3, "gr_naraasu"), G("first", undefined, "gr_taberu")] },
  mariage: { auto: "attack", gambits: [G("always", undefined, "ma_fullcourse"), G("selfHas", "fatigue", "ma_hiyasu"), G("every", 2, "ma_tsuyobi"), G("every", 4, "ma_yaku"), G("mpBelow", 10, "ma_hiyasu"), G("every", 3, "ma_tsuyobi"), G("mpAtLeast", 10, "ma_tsuyobi"), G("every", 4, "ma_kyusoku"), G("mpAtLeast", 6, "ma_yaku"), G("mpAtLeast", 8, "ma_kizamu"), G("every", 2, "ma_hiyasu")] },
  spooky: { auto: "balance", gambits: [G("mpAtLeast", 18, "so_mekureru"), G("always", undefined, "so_katakata"), G("first", undefined, "so_katakata"), G("selfNotHas", "regen", "so_migaku"), G("every", 3, "so_me"), G("mpAtLeast", 8, "so_katakata"), G("first", undefined, "so_kami")] },
  sharp: { auto: "balance", gambits: [G("every", 4, "sh_jamming"), G("mpAtLeast", 11, "sh_hainetsu"), G("every", 3, "sh_hainetsu"), G("every", 3, "sh_laser"), G("selfNotHas", "focus", "sh_shousha"), G("selfNotHas", "barrier", "sh_bouheki"), G("always", undefined, "sh_rensha"), G("every", 3, "sh_soukou"), G("every", 3, "sh_shusoku"), G("every", 2, "sh_soukou"), G("selfHas", "fatigue", "sh_shousha")] },
  flexible: { auto: "balance", gambits: [G("selfHas", "up_dex", "fl_tobikakaru"), G("selfNotHas", "moody", "fl_kibun"), G("every", 2, "fl_dash"), G("selfNotHas", "activation", "fl_hashiri"), G("always", undefined, "fl_dash"), G("selfHas", "up_dex", "fl_osusowake"), G("every", 4, "fl_hashiri"), G("every", 3, "fl_shippo"), G("every", 4, "fl_yorimichi"), G("every", 3, "fl_kunkun"), G("mpBelow", 16, "fl_hashiri")] },
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
  return { type, lv, stats: p.stats, set, passives: passiveSet(p.passives, o.passives), gambits, auto: PLANS[type]?.auto || AUTO_OF[type] || "balance", trees: p.trees };
}

// Lv15 のお手本（分岐はどれも左）
export const BUILDS = Object.fromEntries(Object.keys(PLANS).map((t) => [t, petAt(t, 15)]));
