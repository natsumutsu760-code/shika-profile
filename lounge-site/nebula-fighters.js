// ネビュラ（鹿物語）の ペットの 戦いで 使う 戦う 形（2026-11-12 鹿さんの カード）。帯（OBS の オーバーレイ）と 試験が 読む
//   ・ボス 10 体：鹿物語の 盤面の ボス。技と 作戦は 今の ボスの 敵ツリーを 借りる（下の NEB_BOSS_TREE。Claude の 案〔C〕）。体力は 盤面の ボスの 体力の まま
//     ペットの HP は みんなの 回転数（battle-sim.js の pool）。回転数が 1 回の 戦いで 減りすぎない ように、ボスの 攻めの 能力は NEB_FOE_ATK 倍（〔C〕）
//   ・精鋭 POM：ペットが いない 人（鹿さん「精鋭POM」）。クローラーの 精鋭 32 人の 解析ツリー（crawler-elite-trees.js）で 戦う
//   ・PEREGRINE：戦い 20 回に 1 回、だれにでも 加勢（鹿さん「稀にPEREGRINE(ペット持ちでも)」）。技は 資料 docs/mono-link-crawler-elites.md の 6 つと パッシブ（数は 資料の 仮）
//     予告の 大技 2 つ（急降下・プロテクトバースト）は、帯で オペレーターの 予告の 台詞を 出して、技は ふつうの 大技として 撃つ（〔C〕）
import { foeOf } from "./dungeon-sim.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { SKILL } from "./skills.js";
import { ELITE_TREES } from "./crawler-elite-trees.js";
import { D, F, M, S, P, G } from "./tree-kit.js";

// 盤面の ボス → 借りる 敵ツリー（形と 妨害に 近い 物）
export const NEB_BOSS_TREE = {
  ORION: "e_boss_sleep", HYDRA: "e3_boss_mukade", IGNIS: "e_boss_salamander", KRAKEN: "e_boss_octopus", PULSAR: "e_boss_seagod",
  TITAN: "e_boss_crab", NIGHTMARE: "e3_boss_bonedragon", VOID: "e_boss_gatekeeper", GENESIS: "e3_boss_colossus", SERAPH: "e3_boss_roc",
};
export const NEB_FOE_ATK = 0.15;        // ボスの 攻めの 能力の 倍率（回転数を 減らしすぎない）
export const NEB_LV = (round) => 18 + 6 * round;   // ボス・精鋭 POM・PEREGRINE の Lv（ラウンドで 上がる）

// 帯の 中の ボスは ペットと 同じ 大きさの HP（敵ツリーの その Lv の まま）で 倒れない（pool）。与えた ダメージ × nebDmgK を 盤面の ボスの 体力から 引く
//   盤面の 体力（数千）を そのまま 入れると、毒・おさえこみ など 割合で 効く 技だけが 何十倍も 強く なる ため（〔C〕）
//   ボスの Lv は ラウンドの Lv と「相手の Lv − NEB_LV_GAP」の 高い 方（強く 育てた ペットでも 1 回で ボスを 倒しきらない。育てた 分の 得は NEB_LV_GAP だけ 残す。〔C〕）
export const NEB_LV_GAP = 10;
export function nebBossFighter(boss, round, foeLv = 0) {
  const tree = NEB_BOSS_TREE[boss.name] && ENEMY_TREES[NEB_BOSS_TREE[boss.name]] ? NEB_BOSS_TREE[boss.name] : "e_boss_thief", T = ENEMY_TREES[tree];
  const f = foeOf({ tree, type: T.type, lv: Math.max(NEB_LV(round), (foeLv || 0) - NEB_LV_GAP), name: boss.name }), st = { ...f.stats };
  st.atk = Math.round(st.atk * NEB_FOE_ATK); st.int = Math.round(st.int * NEB_FOE_ATK); st.dex = Math.round(st.dex * NEB_FOE_ATK);   // 攻めの 能力（ATK・INT・DEX）
  return { ...f, stats: st, owner: "NEBULA", boss: true, holo: true, pool: 1, tree };
}
// 帯の 中の ダメージ → 盤面の ボスの 体力：帯の ボスの 体力 NEB_DMG_N 本ぶん 削ると 盤面の ボス 1 体ぶん（〔C〕）
//   削った 量を 帯の ボスの 体力で 割るので、ボスの Lv や 割合で 効く 技が かわっても 写し方は かわらない。Lv30 の ペットで 1 回 約 15%・精鋭 POM で 約 6%
export const NEB_DMG_N = 12;
export const nebDmgK = (bossMax, B) => bossMax / (Math.max(1, (B && B.stats && B.stats.hp) || 150) * NEB_DMG_N);

// 精鋭 POM：解析ツリーの ある 32 人から 1 人（r は 0〜1 の くじ）。elite は 3D の 塗り分けの id（pom3d.js の ELITES）
export const ELITE_IDS = Object.keys(ELITE_TREES);
export function nebEliteFighter(r, round) {
  const tree = ELITE_IDS[Math.floor(r * ELITE_IDS.length) % ELITE_IDS.length], T = ELITE_TREES[tree];
  const f = foeOf({ tree, type: T.type, lv: NEB_LV(round), name: T.enemy });
  return { ...f, owner: "精鋭 POM", elite: T.enemy.toLowerCase().replace(/ /g, "_"), tree };
}

// ---- PEREGRINE（脱獄された ハヤブサ。テクニシャン・主 AGI・副 DEX）----
const PT = "x_peregrine";
ENEMY_TREES[PT] ??= { name: "PEREGRINE", enemy: "PEREGRINE", rank: "精鋭", type: "technician", main: "agi", sub: "dex", theme: "blind",
  list: [
    S(1, "pg_kazekiri", "風切り", "waza", 3, [D(7, { stat: "agi", hits: 2 }), F("blind", 2)]),
    S(2, "pg_kagizume", "かぎ爪", "waza", 3, [D(6, { stat: "dex" }), F("paralysis", 40)]),
    S(3, "pg_yusaburi", "揺さぶり", "itazura", 4, [D(4, { stat: "dex", consume: "blind" }), F("daze", 2)]),
    S(4, "pg_zanzo", "残像", "waza", 4, [M("mirage", 45)]),   // 幻影 +30 × 幻影上手 1.5
    S(5, "pg_stoop", "急降下（ストゥープ）", "waza", 8, [D(40, { stat: "agi", ignore: 0.3 })]),   // 予告の 大技（帯で 予告の 台詞）
    S(6, "pg_burst", "プロテクトバースト", "waza", 10, [D(24, { stat: "agi", aoe: true }), F("sickness", 3)]),   // シールドを ぜんぶ 使う 大技（帯で 予告の 台詞）
    P(1, "pg_coat", "フェザーコート", "戦いの はじめから シールド ＝ 最大 HP", { startFx: [["shield", 99999]] }),
    P(2, "pg_repair", "フェザーリペア", "毎ターン シールド ＋ 最大 HP の 1 割", { turnFx: [{ shield: 0.1 }] }),
    P(3, "pg_mirage", "幻影上手", "付ける 幻影 ＋50%（残像の 数に 入れて ある）", {}),
  ],
  plan: [G("first", undefined, "pg_zanzo"), G("every", 7, "pg_burst"), G("every", 4, "pg_stoop"), G("foeNotHas", "blind", "pg_kazekiri"), G("foeHas", "blind", "pg_yusaburi"), G("foeNotHas", "paralysis", "pg_kagizume"), G("always", undefined, "pg_kazekiri")] };
for (const s of ENEMY_TREES[PT].list) SKILL[s.id] ??= { ...s, type: "technician", tree: PT };
export function nebPeregrineFighter(round) {
  const f = foeOf({ tree: PT, type: "technician", lv: NEB_LV(round) + 8, name: "PEREGRINE" });
  return { ...f, owner: "PEREGRINE", peregrine: true, tree: PT };
}
// オペレーター（メリル）の 台詞（鹿さんの 決め。mono-link-crawler-elites.md。PEREGRINE は 話さない）
export const MERYL = {
  join: "私はレグルスよりPEREGRINEのオペレーター。戦術的動機一致のため加勢します。彼にまかせて。",
  mid: "大丈夫。あなたは 落ちない",
  pg_stoop: "高度、取れました。……あなたの 間合いです",
  pg_burst: "装甲を 開きます。……近くの 方は 離れて ください",
};
