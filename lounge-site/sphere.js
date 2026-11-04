// スフィアと 素材の OP 抽選（大工事。鹿さんと カードで 決めた、2026-10-29。数は すべて 案）
// ・作った 装備は OP なしで、OP の 枠は 空いて 出る（★N の 装備は N 枠）。空いた 枠に はめる／引く のは 2 つ
// ・宝箱の スフィア：宝箱 1 つに 3%。OP が 1 つ 入って いて、鑑定（ガラク）で 中身が 見える。はめた 強さは スフィアの ★（コアと 同じ）
//   中身は 行き先ごとの「得意な OP」5 つから 7 割、ほかの OP から 3 割。★は 行き先で 出やすさが ちがう（★1〜3 が 中心）
// ・素材の OP 抽選（工房）：同じ 敵の 素材 5 こ ＋ クレジット で、空いた 枠に OP を 1 つ 引く。★は 素材の 品質
//   出る OP：その 素材の「付きやすい OP」5 割・その 素材の 行き先の 得意な OP 3 割・ほか 2 割
// ・★が 足りない とくべつな OP（先手・集中・MP 回復・開幕バリアは ★3 から、根性は ★5、ユニーク OP は ★4 から）は 出ない（引き直す）
// ・OP は 今の 22 ＋ 新しい 33（op-new.js。2026-10-29）。島の 名物（ISLAND_OPS）は その 島の 行き先で しか 出ない
import { ALL_OPS, ISLAND_OPS, opAt } from "./op-new.js";
import { OPS } from "./equip.js";
import { DUNGEONS_ALL } from "./dungeons.js";
import { TREES3, ENEMY_MAT3 } from "./isle3-data.js";   // ミカネル島の 敵と 素材

export const SPHERE_RATE = 0.03;
// 新しい OP は 戦いの 計算を 入れてから 出す（docs/mono-link-sphere.md）。2026-11-04 に 計算を 入れた（battle-sim.js）
// OP_HOLD：まだ 出さない 物。早い治り（cureFast）は「デバフを 受けた ときだけ はたらく」形なので、鹿さんに 聞くまで 止める（2026-11-04 の 決め「デバフを受ける前提の能力は弱いし再現性にかける」）
export const NEW_OPS_LIVE = true;
export const OP_HOLD = new Set(["cureFast"]);
export const opLive = (op) => op in OPS || (NEW_OPS_LIVE && !OP_HOLD.has(op));
// 鑑定（ガラク）の 値段・持てる 数（Claude の 案、2026-11-04）
export const SPHERE_LOOK = 100, SPHERE_MAX = 100;
export const SPHERE_ODDS = { land: 0.7 };
export const DRAW = { mats: 5, credits: [120, 240, 480, 960, 1920], odds: { fav: 0.5, land: 0.3 } };

// 行き先ごとの 得意な OP 5 つと、スフィアの ★1〜5 の 出やすさ（%）。土地の 色から 連想（★名物 は その 島の 名物）
export const SPHERE = {
  hals: { ops: ["hp", "def", "atk", "firstHitOp", "regenOp"], stars: [70, 25, 5, 0, 0] },                  // 街道：はじめての 旅の 基本。★名物 最初の一撃・自然回復
  morph: { ops: ["int", "mp", "wazaDmg", "focusStart", "mpSave"], stars: [60, 30, 10, 0, 0] },              // 夢の 遺跡：心と 魔力
  kurai: { ops: ["crit", "drain", "itazuraDmg", "hitPoison", "execute"], stars: [50, 35, 14, 1, 0] },       // 夜の 村：牙・影・魔女の 毒
  crystal: { ops: ["res", "dmgCut", "resShield", "hitFrostbite", "crackOp"], stars: [40, 40, 18, 2, 0] },   // 水晶：かたさと 冷たさ。★名物 ひび（★4 だけ）
  inoh: { ops: ["hp", "def", "dmgCut", "healRecv", "thornsOp"], stars: [35, 40, 22, 3, 0] },                // 浜：甲羅と 波。★名物 反撃
  gama: { ops: ["atk", "gamble", "whim", "badLuck", "dexGuard"], stars: [30, 40, 25, 5, 0] },               // 海賊の 港：荒っぽさと 運だめし
  tida: { ops: ["res", "evade", "accuracy", "hitBlind", "firstStrike"], stars: [25, 40, 28, 6, 1] },        // 灯台と 霧：見通し
  atui: { ops: ["drain", "statusRes", "desperate", "hitSickness", "delayPain"], stars: [22, 38, 30, 8, 2] }, // 沈没船：しぶとさ
  zan: { ops: ["int", "healUp", "mpRegen", "healRecv", "hpCast"], stars: [20, 36, 32, 10, 2] },             // 人魚の 洞窟：歌と 癒し。★名物 命の詠唱
  ufu: { ops: ["atk", "critDmg", "hitBurn", "hitScald", "ironThorns"], stars: [18, 34, 34, 11, 3] },        // 火山：熱と 力。★名物 鉄の棘
  kaji: { ops: ["agi", "dex", "firstStrike", "agiGuard", "hitParalysis"], stars: [15, 32, 36, 13, 4] },     // 嵐の 海峡：速さと 雷
  nirai: { ops: ["res", "statusRes", "cureFast", "critGuard", "avgGuard"], stars: [12, 30, 38, 15, 5] },    // 寺院：祈りと 守り
  mabui: { ops: ["drain", "luk", "hitWeakness", "hitFatigue", "swapPower"], stars: [15, 33, 35, 13, 4] },   // 幽霊船：魂と あべこべ
  kanai: { ops: ["hp", "critDmg", "pierceOp", "barrierOp", "endure"], stars: [10, 25, 40, 18, 7] },         // 深淵の 門
  // ミカネル島（Claude の 案、2026-11-04）。★は ビサイ諸島の 奥より 少し 上。★名物 蜃気楼・オアシス・砂時計
  mika: { ops: ["hp", "healRecv", "oasisOp", "mpRegen", "res"], stars: [10, 28, 40, 17, 5] },              // オアシスの 湖：水と 休み。★名物 オアシス
  karegawa: { ops: ["atk", "crit", "execute", "hitPoison", "drain"], stars: [9, 27, 40, 18, 6] },          // 涸れ川：狩りと 毒
  shiohara: { ops: ["def", "res", "dmgCut", "mirageOp", "hitFatigue"], stars: [9, 26, 40, 19, 6] },        // 塩原：かたさと かげろう。★名物 蜃気楼
  akaiwa: { ops: ["atk", "agi", "critDmg", "pierceOp", "hitWeakness"], stars: [8, 25, 40, 20, 7] },        // 赤岩：爪と 角
  kaseki: { ops: ["hp", "drain", "delayPain", "desperate", "hitSickness"], stars: [7, 24, 40, 21, 8] },    // 化石：骨と しぶとさ
  seran: { ops: ["int", "itazuraDmg", "hitSickness", "hitPoison", "sandClock"], stars: [6, 22, 40, 23, 9] }, // 王墓：呪いと 時。★名物 砂時計
  noru: { ops: ["def", "atk", "critGuard", "hitBurn", "hitParalysis"], stars: [7, 24, 40, 21, 8] },        // 砦：兵の 守り
  yaei: { ops: ["luk", "hp", "healUp", "gamble", "oasisOp"], stars: [8, 25, 40, 20, 7] },                  // 隊商：旅と 運。★名物 オアシス
  sakyu: { ops: ["agi", "evade", "hitBlind", "hitScald", "mirageOp"], stars: [7, 24, 40, 21, 8] },         // 砂丘：砂と 熱。★名物 蜃気楼
  kaze: { ops: ["agi", "dex", "firstStrike", "agiGuard", "whim"], stars: [6, 22, 40, 23, 9] },             // 風の 峡谷：速さと 気まぐれ
  ena: { ops: ["int", "mp", "statusRes", "cureFast", "hitParalysis"], stars: [5, 20, 40, 25, 10] },        // 内海の 遺跡：祈りと 雷
  daimon: { ops: ["def", "hp", "avgGuard", "dexGuard", "hitFatigue"], stars: [5, 20, 40, 25, 10] },        // 岩の 大門：門番
  tiruka: { ops: ["res", "accuracy", "hitBurn", "resShield", "critDmg"], stars: [5, 19, 40, 26, 10] },     // 灯台：光と 炎
  kyozo: { ops: ["hp", "dmgCut", "endure", "sandClock", "atk"], stars: [4, 17, 40, 27, 12] },              // 巨像：王の 力。★名物 砂時計
  shizumu: { ops: ["drain", "agiGuard", "desperate", "hitWeakness", "oasisOp"], stars: [6, 22, 40, 23, 9] }, // 沈む 砂：引きこむ。★名物 オアシス
  gekka: { ops: ["mp", "mpSave", "hitPoison", "hitFrostbite", "mirageOp"], stars: [4, 17, 40, 27, 12] },   // 月下の 流砂：夜と 毒。★名物 蜃気楼
  kazeme: { ops: ["itazuraDmg", "whim", "firstStrike", "barrierOp", "sandClock"], stars: [3, 15, 40, 29, 13] }, // 風の 目：嵐。★名物 砂時計
};

// 敵の 素材の「付きやすい OP」（素材の 名前から 連想。ユニーク OP と ★3 からの OP は、品質の 高い 希少と ボスの 素材に だけ）
export const MAT_OP = {
  hare_horn: "agi", goblin_knife: "firstHitOp", kobold_fur: "def", old_score: "healUp", crown_shard: "luk",
  golem_stone: "def", ghost_cloth: "evade", mimic_tooth: "itazuraDmg", dream_feather: "mpSave", sleep_hourglass: "delayPain",
  wolf_fang: "execute", shadow_shard: "crit", poison_vial: "hitPoison", light_drop: "mp", midnight_bell: "firstStrike",
  crystal_scale: "res", bat_wing: "hitBlind", slime_core: "regenOp", rainbow_shell: "resShield", dragon_crystal: "crackOp",
  crab_claw: "thornsOp", gull_feather: "agi", sahagin_scale: "def", rainbow_fin: "evade", king_shell: "ironThorns",
  pirate_bandana: "crit", parrot_feather: "luk", barrel_hoop: "hitSickness", old_compass: "accuracy", red_beard: "gamble",
  keeper_key: "int", harpy_talon: "critDmg", shisa_tile: "res", glimmer_dust: "mpRegen", fog_core: "evade",
  sailor_bone: "hitFatigue", barnacle_plate: "dmgCut", jelly_gel: "statusRes", gold_claw: "dexGuard", octo_ink: "hitBlind",
  siren_scale: "int", eel_skin: "agiGuard", clam_shell: "def", song_pearl: "healUp", queen_comb: "hpCast",
  lava_scale: "hitScald", hidama_ember: "hitBurn", obsidian_core: "atk", firechick_down: "healUp", salamander_tail: "critDmg",
  thunder_feather: "hitParalysis", whirl_pearl: "wazaDmg", storm_plank: "hitFrostbite", vane_feather: "whim", irabu_fang: "hitPoison",
  guard_crest: "critGuard", trident_tip: "pierceOp", priest_scale: "cureFast", white_fin: "barrierOp", seagod_scale: "avgGuard",
  ghost_rope: "drain", majimun_mask: "itazuraDmg", doll_button: "hitWeakness", cat_bell: "badLuck", captain_hat: "swapPower",
  angler_lamp: "mp", squid_beak: "critDmg", giant_shell: "hp", deep_glow: "mpRegen", gate_shard: "endure",
};

// ミカネル島の 敵の 素材：その 敵の テーマから（ほかの 島の 名物は 付けない。★3 からの OP と ユニークは 希少と ボスだけ。Claude の 案）
const THEME_OP = { poison: "hitPoison", venom: "hitPoison", burn: "hitBurn", sickness: "hitSickness", frostbite: "hitFrostbite", freeze: "hitFrostbite", scald: "hitScald", fatigue: "hitFatigue",
  weakness: "hitWeakness", paralysis: "hitParalysis", blind: "hitBlind", rot: "drain", stun: "critDmg", sleep: "mpSave", confusion: "whim", daze: "accuracy", silence: "itazuraDmg",
  down_def: "execute", down_agi: "agiGuard", down_dex: "dexGuard", regen: "healRecv", frenzy: "atk", thorns: "def", armor: "def", ward: "res", mirage: "mirageOp", counter: "desperate",
  barrier: "barrierOp", pierce: "pierceOp", haste: "firstStrike", focus: "focusStart", blessing: "statusRes", clarity: "cureFast", shield: "resShield", overheal: "healUp",
  reincarnation: "endure", immunity: "statusRes", activation: "mpRegen" };
const LOW = { firstStrike: "agi", focusStart: "mp", mpRegen: "mp", barrierOp: "res", endure: "hp" };   // ふつうの 敵の 素材は ★3 からの OP の かわり
for (const [tid, [mid]] of Object.entries(ENEMY_MAT3)) {
  const T = TREES3[tid], op = THEME_OP[T.theme] || "hp";
  MAT_OP[mid] = T.rank === "通常" && (ALL_OPS[op].from || ALL_OPS[op].unique) ? LOW[op] || "hp" : op;
}
Object.assign(MAT_OP, { colossus_core: "sandClock", sphinx_stone: "sandClock", desert_rose: "oasisOp", pink_feather: "oasisOp" });   // 名物の ユニーク・オアシスは 王の 物と オアシスの 物に

const pickW = (r, ws) => { const t = ws.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x < 0) return i; } return ws.length - 1; };
// ほかの OP：ほかの 島の 名物は 入れない
const isleOf = (did) => DUNGEONS_ALL.find((d) => d.id === did).isle || 1;
const others = (did, ex) => { const away = Object.entries(ISLAND_OPS).filter(([i]) => Number(i) !== isleOf(did)).flatMap(([, l]) => l); return Object.keys(ALL_OPS).filter((k) => !ex.includes(k) && !away.includes(k) && opLive(k)); };
// 宝箱の スフィア 1 つ（r：0〜1 の 乱数を 返す 関数）→ { op, star }
export function rollSphere(did, r) {
  const t = SPHERE[did], star = pickW(r, t.stars) + 1, fav = t.ops.filter(opLive);
  for (;;) { const pool = r() < SPHERE_ODDS.land && fav.length ? fav : others(did, t.ops), op = pool[Math.floor(r() * pool.length)]; if (opAt(op, star)) return { op, star }; }
}
// 素材の OP 抽選 1 回（did：その 素材の 行き先。ex：もう 付いて いる OP〈同じ OP は 2 つ 付けない ので 引き直す〉）→ op
export function rollDraw(matId, q, did, r, ex = []) {
  const fav = MAT_OP[matId], land = SPHERE[did].ops.filter(opLive), f = opLive(fav) ? [fav] : land;
  for (;;) { const x = r(), pool = x < DRAW.odds.fav && f.length ? f : x < DRAW.odds.fav + DRAW.odds.land && land.length ? land : others(did, [fav, ...SPHERE[did].ops]), op = pool[Math.floor(r() * pool.length)]; if (opAt(op, q) && !ex.includes(op)) return op; }
}
