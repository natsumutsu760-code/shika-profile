// 3 つめの 島「ミカネル島」の 敵の ツリーを 組み立てる 道具（データは isle3-data.js。設定資料は docs/mono-link-island3.md）
// 島 2 と 同じ 形（技 8・パッシブ 7・作戦）。技の 威力と MP は 島 2 の 50 本の 平均に そろえた（技① 威力 9・MP 3 … 技⑧ 威力 28・MP 12）
// テーマ（状態異常か バフ 1 つ）と 役（5 タイプ）から 技と パッシブを 組み、名前だけ 1 体ずつ 付ける（ぜんぶ Claude の 案。鹿さんが 直せる）
// 敵は 分かれ道で いつも 左（技④・技⑥・パッシブ③・⑤）を 取る（trees.js の AUTO_ORDER）ので、作戦は 左の 技だけで 組む。右は 研究して サブツリーに した 人が えらべる
import { D, F, M, H, CURE, DIS, SH, S, P, G } from "./tree-kit.js";
import { EFFECTS } from "./effects.js";

const STACK = new Set(["poison", "burn", "sickness", "frostbite", "weakness", "paralysis"]);
const CC = new Set(["stun", "sleep", "freeze"]);
const TURN_DEBUFF = new Set(["venom", "scald", "rot", "blind", "confusion", "daze", "silence", "fatigue"]);
export const isDebuff = (id) => STACK.has(id) || CC.has(id) || TURN_DEBUFF.has(id) || id.startsWith("down_");
const isStack = (id) => STACK.has(id) || id.startsWith("down_");
const L = (id) => EFFECTS[id].label;

// 相手に 付ける（s：強い 方）。数は 島 2 で いちばん 多く 使われて いる 量
function ap(id, s) {
  switch (id) {
    case "poison": return F(id, s ? 6 : 4);
    case "burn": case "frostbite": case "sickness": return F(id, s ? 4 : 3);
    case "weakness": case "paralysis": return F(id, s ? 30 : 20);
    case "venom": return F(id, 2, s ? {} : { chance: 0.6 });
    case "scald": case "fatigue": return F(id, 3);
    case "rot": return F(id, s ? 4 : 3);
    case "blind": return F(id, s ? 3 : 2);
    case "daze": return F(id, s ? 2 : 1);
    case "confusion": case "silence": return F(id, 2, { chance: s ? 0.6 : 0.5 });
    case "stun": return F(id, 1, { chance: s ? 0.4 : 0.3 });
    case "sleep": return F(id, 2, { chance: s ? 0.6 : 0.4 });
    case "freeze": return F(id, 1, { chance: s ? 0.45 : 0.3 });
    default: return F(id, s ? 25 : 20, { turns: 3 });   // down_*
  }
}
// 自分に 付ける
const AMT = { thorns: [30, 40], armor: [20, 30], ward: [20, 30], mirage: [20, 30], regen: [12, 20], barrier: [1, 2], pierce: [15, 20], immunity: [20, 30], mastery: [20, 30] };
const TURN = { haste: [3, 3], frenzy: [1, 2], focus: [2, 3], blessing: [2, 3], clarity: [2, 3], activation: [3, 3] };
function gn(id, s) {
  if (AMT[id]) return M(id, AMT[id][s ? 1 : 0]);
  if (TURN[id]) return M(id, TURN[id][s ? 1 : 0]);
  if (id === "counter") return M(id, undefined, { amt: s ? 80 : 60 });
  if (id === "shield") return SH(s ? 0.25 : 0.15);
  if (id.startsWith("up_")) return M(id, s ? 25 : 20, { turns: 3 });
  return M(id);   // overheal・reincarnation・guard
}
const fx1 = (id, s) => (isDebuff(id) ? ap(id, s) : gn(id, s));
const SMALL = (id) => (id === "poison" ? 3 : STACK.has(id) && id !== "weakness" && id !== "paralysis" ? 2 : 10);   // 戦いの はじめに 付ける 量
const ADD = (id) => (id === "poison" ? 2 : id === "weakness" || id === "paralysis" ? 10 : id.startsWith("down_") ? 5 : 1);   // 付ける 量 ＋
const TURNS = { blind: 2, confusion: 2, silence: 2, fatigue: 3, daze: 1, venom: 2, scald: 3, rot: 3, stun: 1, sleep: 1, freeze: 1 };
const onHit = (id) => (CC.has(id) ? [id, 0.1, null, 1] : isStack(id) ? [id, 0.15, SMALL(id), id.startsWith("down_") ? 3 : undefined] : [id, 0.15, null, TURNS[id]]);

// パッシブの 説明（島 2 の 言い回しに そろえる）
const STL = { atkMul: "ATK", intMul: "INT", dexMul: "DEX", agiMul: "AGI", defMul: "DEF", hpMul: "HP" };
const pc = (x) => Math.round(x * 100);
export function ptext(p) {
  const out = [];
  for (const [k, v] of Object.entries(p)) {
    if (STL[k]) out.push(`${STL[k]} +${pc(v - 1)}%`);
    else if (k === "dmgCut") out.push(`受けるダメージ −${v}%`);
    else if (k === "evade") out.push(`回避 +${pc(v)}%`);
    else if (k === "crit") out.push(`会心 +${pc(v)}%`);
    else if (k === "healMul") out.push(`回復する量 +${pc(v - 1)}%`);
    else if (k === "hpRegen") out.push(`毎ターン HP ${pc(v)}% 回復`);
    else if (k === "mpRegen") out.push(`毎ターン MP +${v}`);
    else if (k === "statusRes") out.push(`状態異常に強い +${v}%`);
    else if (k === "wazaDmg") out.push(`技のダメージ +${v}%`);
    else if (k === "guardBonus") out.push(`防御中に受けるダメージがさらに −${pc(v)}%`);
    else if (k === "shieldMul") out.push(`シールド +${pc(v - 1)}%`);
    else if (k === "momentum") out.push(`前の番に当てていたら、技 +${pc(v)}%`);
    else if (k === "vsFx") for (const [id, x] of Object.entries(v)) out.push(`${L(id)}の相手に +${pc(x)}%`);
    else if (k === "critVsFx") for (const [id, x] of Object.entries(v)) out.push(`${L(id)}の相手への会心 +${pc(x)}%`);
    else if (k === "extendIds") for (const [id, x] of Object.entries(v)) out.push(`付ける${L(id)} +${x} ターン`);
    else if (k === "fxAmtAdd") for (const [id, x] of Object.entries(v)) out.push(`付ける${L(id)} +${x}`);
    else if (k === "startFoeFx") out.push("戦いのはじめに相手に" + v.map(([id, n, t]) => `${L(id)}${n != null ? ` +${n}` : ""}${t ? `（${t} ターン）` : ""}`).join("・"));
    else if (k === "startFx") out.push("戦いのはじめに" + v.map(([id, n]) => (id === "counter" ? `カウンター（受けた直接ダメージの ${n}% を返す）` : `${L(id)}${n != null ? ` +${n}` : ""}`)).join("・"));
    else if (k === "onHitFx") for (const [id, ch, n, t] of v) out.push(`攻撃のとき ${pc(ch)}% で${L(id)}${n != null ? ` +${n}` : ""}${t ? `（${t} ターン）` : ""}`);
    else throw new Error("説明の ない パッシブ：" + k);
  }
  return out.join("・");
}

// 役ごとの 決まり（kind：技の 種類、st：強さを 決める ステータス〈なし は ATK か INT〉、small：パッシブ①、up：自分を 強く する バフ）
const TY = {
  attacker: { kind: "waza", st: null, main: "atk", sub: "dex", mul: "atkMul", small: { crit: 0.03 }, up: "up_atk", p3: { wazaDmg: 10 } },
  caster: { kind: "itazura", st: null, main: "int", sub: "mp", mul: "intMul", small: { intMul: 1.05 }, up: "up_int", p3: { statusRes: 10 } },
  technician: { kind: "waza", st: "dex", main: "dex", sub: "agi", mul: "dexMul", small: { evade: 0.03 }, up: "up_dex", p3: { evade: 0.04 } },
  healer: { kind: "itazura", st: null, main: "int", sub: "res", mul: "intMul", small: { healMul: 1.1 }, up: "up_int", p3: null },
  defender: { kind: "waza", st: "def", main: "def", sub: "hp", mul: "defMul", small: { dmgCut: 3 }, up: "guard", p3: { guardBonus: 0.1 } },
};

// 1 体の ツリー。names：技 8 ＋ パッシブ 7 の 名前を「|」で。sec：技③ に 使う 2 つめの 効果。o.agi：テクニシャンを AGI 型に
export function tree3(code, dungeon, rank, enemy, name, type, th, sec, names, o = {}) {
  const T = { ...TY[type], ...(o.agi ? { st: "agi", main: "agi", sub: "dex", mul: "agiMul", up: "up_agi" } : {}) };
  const n = names.split("|");
  if (n.length !== 15) throw new Error(`${code}：名前が ${n.length} こ（15 こ いる）`);
  if (!EFFECTS[th] || (sec && !EFFECTS[sec])) throw new Error(`${code}：知らない 効果 ${th} ${sec}`);
  const id = (k) => `e3_${code}_${k}`, d = (pow, x = {}) => D(pow, T.st ? { stat: T.st, ...x } : x);
  const sk = (i, mp, fx) => S(i, id("s" + i), n[i - 1], T.kind, mp, fx), ps = (i, p) => P(i, id("p" + i), n[7 + i], ptext(p), p);
  const dbf = isDebuff(th), stk = isStack(th), cc = CC.has(th), s = (i) => id("s" + i);
  const sust = type === "attacker" ? [d(10, { drain: 0.3 }), gn("up_atk", 0)] : type === "caster" ? [gn("barrier", 0), gn("up_int", 0)] : type === "technician" ? [gn("mirage", 0), gn(T.up, 0)] : [M("guard"), gn("regen", 0)];
  let list, plan;
  if (type === "healer") {
    const p2 = dbf ? (stk ? { startFoeFx: [[th, SMALL(th), th.startsWith("down_") ? 3 : undefined]] } : { critVsFx: { [th]: 0.1 } }) : AMT[th] ? { startFx: [[th, AMT[th][0]]] } : th === "shield" ? { shieldMul: 1.3 } : { mpRegen: 1 };
    list = [sk(1, 3, [d(8)]), sk(2, 4, [H(0.15)]), sk(3, 4, dbf ? [d(5), ap(th, 0)] : [gn(th, 0)]), sk(4, 5, [CURE, dbf ? gn("regen", 0) : gn(th, 1)]), sk(5, 5, [d(13), ap(sec || "down_int", 0)]),
      sk(6, 7, [H(0.3), gn("regen", 0)]), sk(7, 6, [d(6, { hits: 2 }), DIS(1)]), sk(8, 12, [d(24), H(0.15), fx1(th, 1)]),
      ps(1, T.small), ps(2, p2), ps(3, { hpRegen: 0.02 }), ps(4, { intMul: 1.1 }), ps(5, p2.mpRegen ? { statusRes: 10 } : { mpRegen: 1 }), ps(6, p2.mpRegen ? { dmgCut: 3 } : { statusRes: 10 }), ps(7, { healMul: 1.2, dmgCut: 5 })];
    plan = [G("first", undefined, s(3)), G("hpBelow", 40, s(6)), G("debuffed", undefined, s(4)), G(dbf ? "foeNotHas" : "selfNotHas", th, s(3)), G("hpBelow", 70, s(2)), G("mpAtLeast", 14, s(8)), G("always", undefined, s(1))];
  } else if (dbf) {   // 相手に 付ける テーマ
    list = [sk(1, 3, [d(9)]), sk(2, 3, [d(5), ap(th, 0)]), sk(3, 4, [fx1(sec || T.up, 0)]), sk(4, 5, [d(11, { vsFx: { [th]: 0.5 } })]), sk(5, 5, [d(14), ap(th, 1)]),
      sk(6, 7, [d(5, { hits: 3 }), ap(th, 0)]), sk(7, 6, sust), sk(8, 12, [d(28, { vsFx: { [th]: 0.3 } }), ap(th, 1)]),
      ps(1, T.small), ps(2, cc ? { statusRes: 10 } : stk ? { startFoeFx: [[th, SMALL(th), th.startsWith("down_") ? 3 : undefined]] } : { critVsFx: { [th]: 0.1 } }), ps(3, { vsFx: { [th]: 0.2 } }), ps(4, { [T.mul]: 1.1 }),
      ps(5, cc ? { critVsFx: { [th]: 0.15 } } : stk ? { fxAmtAdd: { [th]: ADD(th) } } : { extendIds: { [th]: 1 } }), ps(6, { hpMul: 1.1 }), ps(7, { dmgCut: 6, onHitFx: [onHit(th)] })];
    plan = cc ? [G("first", undefined, s(3)), G("every", 2, s(2)), G("mpAtLeast", 14, s(8)), G("foeHas", th, s(4)), G("every", 3, s(6)), G("always", undefined, s(1))]
      : [G("first", undefined, s(3)), G("foeNotHas", th, s(2)), G("mpAtLeast", 14, s(8)), G("every", 3, s(6)), G("foeHas", th, s(4)), G("always", undefined, s(1))];
  } else {   // 自分に 付ける テーマ
    const p2 = AMT[th] ? { startFx: [[th, AMT[th][0]]] } : th === "counter" ? { startFx: [["counter", 60]] } : th === "shield" ? { shieldMul: 1.3 } : { mpRegen: 1 };
    const p7 = AMT[th] ? { dmgCut: 6, startFx: [[th, AMT[th][1]]] } : th === "counter" ? { dmgCut: 6, startFx: [["counter", 80]] } : { dmgCut: 6, momentum: 0.1 };
    list = [sk(1, 3, [d(9)]), sk(2, 3, [d(5), gn(th, 0)]), sk(3, 4, [ap(sec || "down_def", 0)]), sk(4, 5, [gn(th, 1), gn(T.up, 0)]), sk(5, 5, [d(14), DIS(1)]),
      sk(6, 7, [d(13), gn(th, 0)]), sk(7, 6, sust), sk(8, 12, [d(28), gn(th, 1)]),
      ps(1, T.small), ps(2, p2), ps(3, p2.mpRegen && T.p3.mpRegen ? { wazaDmg: 10 } : T.p3), ps(4, { [T.mul]: 1.1 }), ps(5, { hpMul: 1.1 }), ps(6, { crit: 0.05 }), ps(7, p7)];
    plan = [G("first", undefined, s(4)), G("selfNotHas", th, s(2)), G("mpAtLeast", 14, s(8)), G("every", 3, s(3)), G("every", 2, s(6)), G("always", undefined, s(1))];
  }
  return { name, enemy, dungeon, rank, type, main: T.main, sub: T.sub, theme: th, list, plan };
}
