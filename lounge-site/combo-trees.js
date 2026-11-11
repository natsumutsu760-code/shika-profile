// 特殊複合スキル（docs/mono-link-essence.md。鹿さんの 決め 2026-11-11「全通りを決まりで組み立てる」）
// どの 2 種族でも 複合の サブツリーが できる（同じ 種族どうしは なし・A と B を 入れかえても 同じ 1 本。429 種族で 91,806 本）
// その 組だけの 名前と 技 15 こ（技 8・パッシブ 7）を、2 種族の テーマ（状態異常か バフ）・役・強い 力から 決まりで 組み立てる
// 強さは 島 3 の 決まり（isle3-kit.js：島 2 の 50 本の 平均の 威力・MP・効果の 量）に そろえる。手で 1 本ずつ 考えた 技では ない
// 前もって 作らない：id（cx:種+種）を さわった ときに enemy-trees.js が buildCombo で 組み立てて ENEMY_TREES・SKILL に 入れる
// この ファイルは ツリーの 表（enemy-trees.js）や fusion.js を 読みこまない（読みこみの 輪を 作らない）。表は 引数で もらう
import { D, M, H, CURE, DIS, S, P, G, describe } from "./tree-kit.js";
import { ap, gn, fx1, onHit, AMT, SMALL, ADD, CC, isStack, isDebuff, ptext, TY } from "./isle3-kit.js";

export const COMBO_PREFIX = "cx:";
export const comboId = (a, b) => COMBO_PREFIX + [a, b].sort().join("+");
// id → [a, b]（ちがう 2 つ・ならびが 決まった 形 の ときだけ。種族かどうかは 表を 見る ほうで）
export function comboParts(id) {
  if (typeof id !== "string" || !id.startsWith(COMBO_PREFIX)) return null;
  const xs = id.slice(COMBO_PREFIX.length).split("+");
  return xs.length === 2 && xs[0] !== xs[1] && comboId(xs[0], xs[1]) === id ? xs : null;
}
const CAT = ["通常", "希少", "配合", "ボス"];
// 種族の ツリー（捕まえられる・配合で 生まれる 429 種。進化「＋」・敵用の 写し・精鋭・複合は ちがう）
export const isSpeciesTree = (t) => !!t && !!t.enemy && !t.evo && !t.foeOf && !t.combo && CAT.includes(t.rank);

// 名前の 言葉（日本語・英語）。テーマ 1 つに 2 つ（組ごとに 決まりで えらぶ）
const W = {
  burn: [["炎", "Flame"], ["火の粉", "Ember"]], rot: [["腐れ", "Rot"], ["朽ち", "Decay"]], confusion: [["まどい", "Bewilder"], ["渦巻き", "Whirl"]],
  mirage: [["幻", "Phantom"], ["陽炎", "Haze"]], paralysis: [["雷", "Thunder"], ["しびれ", "Shock"]], blessing: [["祝福", "Blessed"], ["恵み", "Grace"]],
  poison: [["毒", "Toxic"], ["毒霧", "Miasma"]], regen: [["芽吹き", "Sprout"], ["いのち", "Life"]], thorns: [["いばら", "Thorn"], ["棘", "Spike"]],
  guard: [["構え", "Stance"], ["守勢", "Bulwark"]], daze: [["朦朧", "Daze"], ["めまい", "Dizzy"]], charge: [["溜め", "Charge"], ["力み", "Strain"]],
  sleep: [["眠り", "Slumber"], ["子守", "Lullaby"]], weakness: [["脱力", "Wither"], ["萎え", "Sap"]], armor: [["鋼", "Steel"], ["鎧", "Armor"]],
  pierce: [["貫き", "Pierce"], ["穿ち", "Drill"]], haste: [["疾風", "Gale"], ["加速", "Swift"]], frostbite: [["霜", "Frost"], ["凍て", "Chill"]],
  mastery: [["極み", "Mastery"], ["冴え", "Keen"]], blind: [["闇", "Dark"], ["目くらまし", "Blinding"]], shield: [["光の盾", "Aegis"], ["盾", "Shield"]],
  barrier: [["泡", "Bubble"], ["膜", "Veil"]], venom: [["猛毒", "Venom"], ["毒牙", "Fang"]], silence: [["沈黙", "Silence"], ["封じ", "Seal"]],
  activation: [["活性", "Vital"], ["目覚め", "Awaken"]], frenzy: [["狂乱", "Frenzy"], ["猛り", "Rage"]], stun: [["衝撃", "Impact"], ["一閃", "Flash"]],
  counter: [["返し", "Riposte"], ["迎え", "Counter"]], clarity: [["明鏡", "Clear"], ["澄み", "Lucid"]], fatigue: [["疲れ", "Weary"], ["重み", "Heavy"]],
  scald: [["熱湯", "Scald"], ["湯気", "Steam"]], reincarnation: [["輪廻", "Rebirth"], ["転生", "Reborn"]], freeze: [["氷", "Ice"], ["氷結", "Glacial"]],
  ward: [["結界", "Ward"], ["守り", "Guardian"]], immunity: [["清め", "Purity"], ["免れ", "Immune"]], sickness: [["瘴気", "Plague"], ["病", "Sickly"]],
  focus: [["集中", "Focus"], ["狙い", "Aim"]], overheal: [["あふれ", "Overflow"], ["満ち", "Brim"]],
  down_agi: [["足止め", "Snare"], ["泥", "Mire"]], down_dex: [["乱し", "Jitter"], ["手元", "Fumble"]], down_def: [["砕き", "Shatter"], ["ひび", "Crack"]],
  down_atk: [["鈍り", "Dull"], ["萎縮", "Cower"]], down_int: [["曇り", "Cloud"], ["霞", "Fog"]], down_res: [["ほころび", "Fray"], ["裂け", "Rift"]], down_luk: [["不運", "Jinx"], ["凶", "Omen"]],
  up_atk: [["力", "Might"], ["剛", "Power"]], up_int: [["知恵", "Wisdom"], ["叡智", "Sage"]], up_dex: [["技", "Skill"], ["巧み", "Deft"]], up_agi: [["速さ", "Speed"], ["俊足", "Fleet"]], up_def: [["守り", "Guard"], ["堅牢", "Sturdy"]],
};
const ROLE = { attacker: ["剛力", "Brawn"], caster: ["魔力", "Arcane"], technician: ["技巧", "Finesse"], healer: ["慈愛", "Mercy"], defender: ["鉄壁", "Bastion"] };
const NOUN = {
  waza: { 1: [["一撃", "Strike"], ["打ち", "Blow"], ["かみつき", "Bite"], ["ひっかき", "Claw"]], 2: [["払い", "Sweep"], ["突き", "Thrust"], ["けり", "Kick"], ["はたき", "Slap"]],
    4: [["追い打ち", "Pursuit"], ["くだき", "Crush"], ["連打", "Flurry"], ["斬り", "Slash"]], 5: [["突進", "Rush"], ["強打", "Smash"], ["大振り", "Swing"], ["つらぬき", "Lance"]],
    6: [["乱れ打ち", "Rampage"], ["三段打ち", "Triple Strike"], ["連舞", "Dance"], ["つむじ打ち", "Whirlwind"]], 8: [["大技", "Grand Strike"], ["奥義", "Secret Art"], ["終の一撃", "Final Blow"], ["大いなる一撃", "Great Blow"]] },
  itazura: { 1: [["つぶて", "Pebble"], ["光弾", "Bolt"], ["しずく", "Drop"], ["火花", "Spark"]], 2: [["霧", "Mist"], ["粉", "Dust"], ["吐息", "Breath"], ["ささやき", "Whisper"]],
    4: [["呪い", "Curse"], ["渦", "Vortex"], ["しるし", "Mark"], ["うず潮", "Tide"]], 5: [["波", "Wave"], ["嵐", "Storm"], ["矢", "Arrow"], ["大つぶて", "Boulder"]],
    6: [["雨", "Rain"], ["群れ", "Swarm"], ["花吹雪", "Petal Storm"], ["乱舞", "Revel"]], 8: [["大魔法", "Grand Spell"], ["大輪", "Great Bloom"], ["終の歌", "Final Song"], ["大いなる呪文", "Great Incantation"]] },
  buff: [["構え", "Stance"], ["舞", "Dance"], ["祈り", "Prayer"], ["衣", "Mantle"]],
  heal: [["癒し", "Mending"], ["手当て", "Remedy"], ["いたわり", "Care"], ["息吹", "Breath"]],
};
const PN = [["心得", "Lore"], ["体質", "Nature"], ["気配", "Aura"], ["鍛錬", "Training"], ["執念", "Tenacity"], ["本能", "Instinct"], ["絆", "Bond"]];

// 決まった 散らし（同じ 組は いつも 同じ 言葉）
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (arr, seed) => arr[seed % arr.length];
const wd = (th, k) => (W[th] || [[th, th], [th, th]])[k & 1];

// 英語の 名前（画面の 英語。lounge-en-lab.js の 決まりが ここを 見る）。ツリーの 名前は 種族の 英語から（{ a, b }）
const EN = (globalThis.__ML_COMBO_EN ||= new Map());

// 主（名前の 前半・役・強い 力）は 格の 高い 方（ボス ＞ 配合 ＞ 希少 ＞ 通常。同じ なら id の 順）。もう 一方の テーマを 2 つめの テーマに
function order(TR, a, b) {
  const ra = CAT.indexOf(TR[a].rank), rb = CAT.indexOf(TR[b].rank);
  return ra > rb || (ra === rb && a < b) ? [a, b] : [b, a];
}
// テーマが 同じ ときは、もう 一方の ツリーで いちばん よく 使う 効果を 2 つめに
function second(Q, th) {
  const n = {};
  for (const s of Q.list) for (const x of s.fx || []) if (x.t === "fx" && x.id !== th && W[x.id]) n[x.id] = (n[x.id] || 0) + 1;
  const best = Object.entries(n).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0];
  return best ? best[0] : TY[Q.type].up;
}
// 名前の 前半（主の ツリーの 名前の「〇〇の」）と 後半（もう 一方の「△△」）。同じ 前半・後半が ほかの 種族に あれば 名前 まるごと（その 組だけの 名前に する）
const headOf = (n) => (n.includes("の") ? n.slice(0, n.lastIndexOf("の") + 1) : n + "の");
const tailOf = (n) => (n.includes("の") ? n.slice(n.lastIndexOf("の") + 1) : n);
let HEADS = null, TAILS = null;
function index(TR) {
  if (HEADS) return; HEADS = {}; TAILS = {};
  for (const [id, t] of Object.entries(TR)) if (isSpeciesTree(t)) { const n = t.name; HEADS[headOf(n)] = (HEADS[headOf(n)] || 0) + 1; TAILS[tailOf(n)] = (TAILS[tailOf(n)] || 0) + 1; }
}
const headU = (n) => (HEADS[headOf(n)] > 1 ? n + "の" : headOf(n));
const tailU = (n) => (TAILS[tailOf(n)] > 1 ? n : tailOf(n));
export const comboName = (TR, p, q) => { index(TR); return headU(TR[p].name) + tailU(TR[q].name); };

// 強さを 割合 k で そろえる（島 3 の ボスの そろえ方〈isle3-kit.js の BOSS_TUNE〉を 技・パッシブ ぜんぶに）
// 技：威力・回復・相手に 付ける 量と 確率・自分に 付ける 量・シールド ×k。ターン数と MP は そのまま
// パッシブ：〜Mul は 1 との 差 ×k、ほかの 数 ×k（MP の 回復・付ける ターン ＋ は そのまま）
const r2 = (v) => Math.round(v * 100) / 100, ri = (v) => Math.max(1, Math.round(v));
function tuneList(list, k) {
  if (k === 1) return list;
  return list.map((n) => {
    if (n.kind === "passive") {
      const p = structuredClone(n.p);
      for (const [key, v] of Object.entries(p)) {
        if (typeof v === "number") { if (/Mul$/.test(key)) p[key] = r2(1 + (v - 1) * k); else if (key !== "mpRegen") p[key] = Number.isInteger(v) ? ri(v * k) : r2(v * k); }
        else if (["vsFx", "critVsFx"].includes(key)) for (const f of Object.keys(v)) v[f] = r2(v[f] * k);
        else if (key === "fxAmtAdd") for (const f of Object.keys(v)) v[f] = ri(v[f] * k);
        else if (["onHitFx", "auraFx", "whenHitFx"].includes(key)) for (const x of v) x[1] = r2(Math.min(1, x[1] * k));
        else if (["startFoeFx", "startFx"].includes(key)) for (const x of v) if (typeof x[1] === "number" && x[0] !== "barrier") x[1] = ri(x[1] * k);
      }
      return { ...n, p, text: ptext(p) };
    }
    const fx = n.fx.map((x0) => { const x = { ...x0 };
      if (x.t === "dmg") x.pow = ri(x.pow * k);
      else if (x.t === "heal" || x.t === "shield") x.pct = r2(x.pct * k);
      else if (x.t === "fx") { if (x.chance) x.chance = r2(Math.min(1, x.chance * k)); if (x.amt && x.id !== "barrier") x.amt = ri(x.amt * k); }
      return x; });
    return { ...n, fx, text: describe(fx) };
  });
}

// 1 本 組み立てる（TR：ツリーの 表。複合で ない・種族で ない id は null。o.k：強さの 割合〈はかる 道具だけ。ふつうは 決まりの 表から〉）
export function buildCombo(TR, id, o = {}) {
  const parts = comboParts(id); if (!parts || !isSpeciesTree(TR[parts[0]]) || !isSpeciesTree(TR[parts[1]])) return null;
  const [p, q] = order(TR, ...parts), A = TR[p], B = TR[q];
  const thP = A.theme && W[A.theme] ? A.theme : TY[A.type].up;
  let thQ = B.theme && W[B.theme] ? B.theme : TY[B.type].up;
  if (thQ === thP) thQ = second(B, thP);
  const T = { ...TY[A.type], ...(A.main === "agi" && A.type === "technician" ? { st: "agi", main: "agi", sub: "dex", mul: "agiMul", up: "up_agi" } : {}) };
  const kQ = TY[B.type].kind, h = hash(id), kP = h & 1;   // kP：主の テーマの 言葉の どちらを 先に 使うか
  const dth = isDebuff(thP) ? thP : isDebuff(thQ) ? thQ : null;   // 相手に 付ける テーマ（威力 ＋ に 使う）
  const sid = (k) => `${id}:${k}`, d = (pow, x = {}) => D(pow, T.st ? { stat: T.st, ...x } : x);
  const ja = (th, k) => wd(th, k)[0], en = (th, k) => wd(th, k)[1];
  const used = new Set();
  const uniq = (j, e, alt) => { if (used.has(j) && alt) [j, e] = alt; used.add(j); EN.set(j, e); return j; };
  const noun = (kind, slot, salt) => pick(NOUN[kind][slot], (h >>> (slot * 2 + salt)) & 7);
  const dmgName = (kind, slot, th, k) => { const [nj, ne] = noun(kind, slot, 0), [aj, ae] = noun(kind, slot, 1);
    return uniq(`${ja(th, k)}の${nj}`, `${en(th, k)} ${ne}`, [`${ja(th, k + 1)}の${aj}`, `${en(th, k + 1)} ${ae}`]); };
  const effName = (th, k, kind) => { const debuff = isDebuff(th), [nj, ne] = debuff ? noun(kind === "waza" ? "waza" : "itazura", 2, 2) : pick(NOUN.buff, h >>> 7);
    return debuff ? uniq(`${ja(th, k)}の${nj}`, `${en(th, k)} ${ne}`, [`${ja(th, k + 1)}の${nj}`, `${en(th, k + 1)} ${ne}`]) : uniq(`${ja(th, k)}の${nj}`, `${en(th, k)} ${ne}`, [`${ja(th, k + 1)}の${nj}`, `${en(th, k + 1)} ${ne}`]); };
  const sk = (i, kind, mp, fx, name) => ({ ...S(i, sid("s" + i), name, kind, mp, fx) });
  const ps = (i, pp, name) => P(i, sid("p" + i), name, ptext(pp), pp);
  const role = ROLE[A.type], roleQ = ROLE[B.type];
  const n8 = (kind) => { const [j, e] = noun(kind, 8, 0); return uniq(`${ja(thP, kP)}と${ja(thQ, kP)}の${j}`, `${en(thP, kP)} & ${en(thQ, kP)} ${e}`); };
  let list, plan;
  if (A.type === "healer") {
    const [hj, he] = pick(NOUN.heal, h >>> 3), [hj2, he2] = pick(NOUN.heal, (h >>> 3) + 1);
    list = [
      sk(1, T.kind, 3, [d(8)], dmgName(T.kind, 1, thP, kP)),
      sk(2, "itazura", 4, [H(0.15)], uniq(`${ja(thP, kP)}の${hj}`, `${en(thP, kP)} ${he}`)),
      sk(3, kQ, 4, isDebuff(thQ) ? [d(5), ap(thQ, 0)] : [gn(thQ, 0)], effName(thQ, kP, kQ)),
      sk(4, "itazura", 5, [CURE, isDebuff(thP) ? gn("regen", 0) : gn(thP, 1)], uniq(`${ja(thP, kP + 1)}の清め`, `${en(thP, kP + 1)} Cleanse`)),
      sk(5, T.kind, 5, [d(13), fx1(thQ, 0)], dmgName(T.kind, 5, thQ, kP)),
      sk(6, "itazura", 7, [H(0.3), gn("regen", 0)], uniq(`${ja(thP, kP + 1)}の${hj2}`, `${en(thP, kP + 1)} ${he2}`, [`${role[0]}の${hj2}`, `${role[1]} ${he2}`])),
      sk(7, kQ, 6, [d(6, { hits: 2 }), DIS(1)], uniq(`${ja(thQ, kP)}の晴らし`, `${en(thQ, kP)} Dispel`)),
      sk(8, T.kind, 12, [d(24), H(0.15), fx1(thP, 1)], n8(T.kind)),
    ];
  } else {
    const sust = A.type === "attacker" ? [d(10, { drain: 0.3 }), gn("up_atk", 0)] : A.type === "caster" ? [gn("barrier", 0), gn("up_int", 0)] : A.type === "technician" ? [gn("mirage", 0), gn(T.up, 0)] : [M("guard"), gn("regen", 0)];
    const s7 = B.type === "healer" ? [H(0.2), gn("regen", 0)] : sust;
    const [bj, be] = pick(NOUN.buff, (h >>> 11) + 1);
    list = [
      sk(1, T.kind, 3, [d(9)], dmgName(T.kind, 1, thP, kP)),
      sk(2, T.kind, 3, [d(5), fx1(thP, 0)], dmgName(T.kind, 2, thP, kP + 1)),
      sk(3, kQ, 4, [fx1(thQ, 0)], effName(thQ, kP, kQ)),
      sk(4, T.kind, 5, dth ? [d(11, { vsFx: { [dth]: 0.5 } })] : [gn(thP, 1), gn(T.up, 0)], dth ? dmgName(T.kind, 4, dth, kP) : effName(thP, kP + 1, T.kind)),
      sk(5, T.kind, 5, [d(13), fx1(thQ, 1)], dmgName(T.kind, 5, thQ, kP + 1)),
      sk(6, T.kind, 7, [d(5, { hits: 3 }), fx1(thP, 0)], dmgName(T.kind, 6, thP, kP)),
      sk(7, B.type === "healer" ? "itazura" : T.kind, 6, s7, uniq(`${(B.type === "healer" ? roleQ : role)[0]}の${bj}`, `${(B.type === "healer" ? roleQ : role)[1]} ${be}`)),
      sk(8, T.kind, 12, [d(26, dth ? { vsFx: { [dth]: 0.3 } } : {}), fx1(thP, 1), fx1(thQ, 0)], n8(T.kind)),
    ];
  }
  // パッシブ：① 主の 役 ② 主の テーマ ③ もう 一方の テーマ ④ 主の 強い 力 ⑤ 主の テーマを のばす ⑥ もう 一方の 役 ⑦ 2 つの テーマ（奥の パッシブ）
  const dP = isDebuff(thP), dQ = isDebuff(thQ), ccP = CC.has(thP), stP = isStack(thP);
  const themeP = dP ? (ccP ? { statusRes: 10 } : stP ? { startFoeFx: [[thP, SMALL(thP), thP.startsWith("down_") ? 3 : undefined]] } : { critVsFx: { [thP]: 0.1 } })
    : AMT[thP] ? { startFx: [[thP, AMT[thP][0]]] } : thP === "counter" ? { startFx: [["counter", 60]] } : thP === "shield" ? { shieldMul: 1.3 } : { mpRegen: 1 };
  let themeQ = dQ ? { vsFx: { [thQ]: 0.2 } } : AMT[thQ] ? { startFx: [[thQ, AMT[thQ][0]]] } : thQ === "counter" ? { startFx: [["counter", 60]] } : thQ === "shield" ? { shieldMul: 1.3 } : { wazaDmg: 10 };
  if (JSON.stringify(themeQ) === JSON.stringify(themeP)) themeQ = { crit: 0.05 };
  const grow = A.type === "healer" ? { hpRegen: 0.02 } : dP ? (ccP ? { critVsFx: { [thP]: 0.15 } } : stP ? { fxAmtAdd: { [thP]: ADD(thP) } } : { extendIds: { [thP]: 1 } }) : { hpMul: 1.1 };
  let smallQ = TY[B.type].small;
  if (JSON.stringify(smallQ) === JSON.stringify(T.small)) smallQ = grow.hpMul ? { crit: 0.05 } : { hpMul: 1.1 };
  const top = A.type === "healer" ? { healMul: 1.2, dmgCut: 5 } : dth ? { dmgCut: 6, onHitFx: [onHit(dth)] }
    : AMT[thP] ? { dmgCut: 6, startFx: [[thP, AMT[thP][1]]] } : thP === "counter" ? { dmgCut: 6, startFx: [["counter", 80]] } : { dmgCut: 6, momentum: 0.1 };
  const pn = (i, w) => uniq(`${w[0]}の${PN[i][0]}`, `${w[1]} ${PN[i][1]}`, [`${w[0]}の${PN[(i + 3) % 7][0]}`, `${w[1]} ${PN[(i + 3) % 7][1]}`]);
  list.push(
    ps(1, T.small, pn(0, role)), ps(2, themeP, pn(1, wd(thP, kP))), ps(3, themeQ, pn(2, wd(thQ, kP))), ps(4, { [T.mul]: 1.1 }, pn(3, role)),
    ps(5, grow, pn(4, wd(thP, kP + 1))), ps(6, smallQ, pn(5, roleQ)),
    ps(7, top, uniq(`${ja(thP, kP)}と${ja(thQ, kP)}の絆`, `${en(thP, kP)} & ${en(thQ, kP)} Bond`, [`${ja(thP, kP + 1)}と${ja(thQ, kP + 1)}の絆`, `${en(thP, kP + 1)} & ${en(thQ, kP + 1)} Bond`])));
  const s = sid;
  if (A.type === "healer") plan = [G("first", undefined, s("s3")), G("hpBelow", 40, s("s6")), G("debuffed", undefined, s("s4")), G(isDebuff(thQ) ? "foeNotHas" : "selfNotHas", thQ, s("s3")), G("hpBelow", 70, s("s2")), G("mpAtLeast", 14, s("s8")), G("always", undefined, s("s1"))];
  else plan = [G("first", undefined, s("s3")), CC.has(thP) ? G("every", 2, s("s2")) : G(dP ? "foeNotHas" : "selfNotHas", thP, s("s2")), G("mpAtLeast", 14, s("s8")), G("every", 3, s("s6")),
    dth ? G("foeHas", dth, s("s4")) : G("every", 4, s("s4")), G("always", undefined, s("s1"))];
  const rank = CAT[Math.max(CAT.indexOf(A.rank), CAT.indexOf(B.rank), 0)];
  const name = comboName(TR, p, q);
  EN.set(name, { a: A.enemy, b: B.enemy });
  const k = o.k ?? comboK(A.type, thP, thQ), tuned = tuneList(list, k);
  for (const x of tuned) if (x.kind !== "passive") EN.set(x.text, { fx: x.fx });   // 技の 説明文（数が 半端な ので 英語は 効果から 作る）
  return { name, enemy: `${A.enemy}×${B.enemy}`, dungeon: null, rank, type: A.type, main: T.main, sub: T.sub, theme: thP, theme2: thQ, combo: [p, q], k, list: tuned, plan };
}

// 強さの 割合 k（2026-11-11 に Claude が はかって 決めた。docs/mono-link-essence.md）
// 目標：サブツリー単体の 勝率 60%（いまの 種族の サブツリーの まんなか 61%・ボスを そろえた 55〜65% の まんなか）
// 600 本を k=1 で はかり、勝率の ロジットを「切片 ＋ 主の 役 ＋ 主の テーマ ＋ 2 つめの テーマ」の 足し算で 近づけた（当てはまり R2 0.86）
// k を 0.7 → 1 → 1.4 に すると 勝率の ロジットが 1 あたり 約 2.8 動く ので、k ＝ 1 ＋（目標 − 予想）÷ 2.8（0.6〜1.6）
const K_B0 = 0.212, K_SLOPE = 2.8, K_TARGET = Math.log(0.6 / 0.4);
const K_TYPE = { attacker: -0.06, caster: 0.44, defender: 0.42, healer: -1.2, technician: 0.4 };
const K_THP = { activation: -0.04, armor: -0.2, barrier: 0.19, blessing: 0.35, blind: -0.4, burn: 0.65, charge: 0.6, clarity: 0.22, confusion: 0.1, counter: -0.49, daze: -0.82, down_agi: 0.26, down_def: 0.3, down_dex: 0.2, focus: 0.22, freeze: -0.53, frenzy: -1.73, frostbite: 0.32, haste: -0.81, immunity: -0.06, mastery: -0.18, mirage: 0.02, overheal: 0, paralysis: 0.35, pierce: 0.9, poison: 0.16, regen: 0, reincarnation: 0.18, rot: -0.13, scald: -0.17, shield: -0.1, sickness: 1.41, silence: 0.13, sleep: -0.26, stun: -0.62, thorns: -0.06, venom: 0.22, ward: -0.21, weakness: 0.02 };
const K_THQ = { activation: -0.06, armor: -0.07, barrier: 0.38, blessing: 0.18, blind: 0.11, burn: -0.07, charge: 0.36, clarity: 0.1, confusion: 0.32, counter: -0.25, daze: -0.43, down_agi: -0.03, down_atk: -0.04, fatigue: 0.47, focus: 0, freeze: -0.21, frenzy: -0.66, frostbite: 0.09, guard: -0.14, haste: -0.46, immunity: -0.2, mastery: -0.27, mirage: 0.16, overheal: -0.4, paralysis: -0.03, pierce: 0.27, poison: -0.08, regen: 0.07, reincarnation: -0.12, rot: 0.24, scald: 0.04, shield: 0.07, sickness: 0.5, silence: 0.12, sleep: 0.47, stun: -0.19, thorns: -0.16, up_int: -0.02, venom: 0.33, ward: -0.17, weakness: -0.21 };
export function comboK(typeP, thP, thQ) {
  const pred = K_B0 + (K_TYPE[typeP] || 0) + (K_THP[thP] || 0) + (K_THQ[thQ] || 0);
  return Math.round(Math.min(1.6, Math.max(0.6, 1 + (K_TARGET - pred) / K_SLOPE)) * 100) / 100;
}
