// ペットのバトルの計算（試作 3）。simulate(a, b, seed) が「何が起きたか」の一覧を返す。同じ種なら毎回同じ結果
// 技（ATK・相手の DEF で受ける）とイタズラ（INT・相手の RES で受ける）
// 形：1 ターンに 1 回ずつ交代に動く（AGI の高い方が先。「かならず先に動く」技はその前）
// 動き方：ガンビット（上から順に「条件 → 技」）→ どれにも当てはまらなければオートの作戦
// バフ・デバフ（状態）は effects.js の決まりで重なる（量・持続ターン・上限・相殺）。技とパッシブの中身は skills.js。数字はすべて仮
import { SKILL } from "./skills.js";
import { itemStats, itemPower, baseOf, hasFx } from "./equip.js";
import { HIT_AMT } from "./equip-dev.js";   // 追撃の OP の 量（装備開発の「当てると 状態異常」と 同じ）
import { EFFECTS, PAIR, isBuff } from "./effects.js";
import { COUNTS } from "./main-trees.js";

export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 続きから 使える 乱数（いまの 位置を o[k] に しまう。rng と 同じ 並び。派遣を 少しずつ 計算する ときに 使う）
export function rngIn(o, k) { o[k] >>>= 0; return () => { const s = (o[k] = (o[k] + 0x6D2B79F5) >>> 0); let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 画面に出すのは 8 ターンまで。決着がつかなければ、そのまま計算だけで続ける（9 ターン目からの出来事には sim: true が付く。鹿さんの決め、2026-10-20）
// 計算で進めるのは SIM_TURN まで。それでも決着しなければ、そのときだけ HP の割合で決める
export const MAX_TURN = 8, SIM_TURN = 30;
const STATS = ["atk", "def", "int", "res", "agi", "dex", "luk"];
// 命中：DEX（当てる）と AGI（よける）の 比で きまる（鹿さんの決め、2026-10-25。Lv の 上限を なくしたので、差では なく 比に した。数が 大きく なっても 同じ 比なら 同じ）
// 同じ なら 92%、DEX が AGI の 2 倍で 97%（上限）、半分で 82%、4 分の 1 で 72%。下限は つけない（鹿さんの決め、2026-10-25。0% より 下には ならない だけ）
// 0 に 近い ときに 大きく ぶれない ように 両方に 10 を 足す
export const hitRate = (dex, agi) => Math.max(0, Math.min(0.97, 0.92 + 0.1 * Math.log2((Math.max(0, dex) + 10) / (Math.max(0, agi) + 10))));
export const powerOf = (s) => s.hp / 4 + s.mp / 2 + STATS.reduce((a, k) => a + s[k], 0);   // 強さの目安（下克上の判定用）

// パッシブの 中身を 足す（一覧は つなぐ・表は まぜる・Mul は かける・数は 足す）
function addP(P, p) { for (const [k, v] of Object.entries(p || {})) P[k] = Array.isArray(v) ? [...(P[k] || []), ...v] : v && typeof v === "object" ? { ...(P[k] || {}), ...v } : /Mul$/.test(k) ? (P[k] || 1) * v : typeof v === "number" ? (P[k] || 0) + v : v; }
function passives(ids) {
  const P = {};
  for (const id of ids || []) addP(P, SKILL[id]?.p);
  return P;
}

// 新しい OP（スフィア・素材の OP 抽選で 付く。op-defs.js。戦いの 計算は 2026-11-04）：もう ある 入れ物に 入る 物は そこへ、ほかは P[OP の 名前]
const HIT_OPS = { hitPoison: "poison", hitBurn: "burn", hitSickness: "sickness", hitFrostbite: "frostbite", hitScald: "scald", hitFatigue: "fatigue", hitWeakness: "weakness", hitParalysis: "paralysis", hitBlind: "blind" };
const NEWX = {
  firstHitOp: (P, v) => { P.firstHit = (P.firstHit || 0) + v / 100; },          // 最初の一撃（竜の いぶきと 同じ）
  regenOp: (P, v) => { P.hpRegen = (P.hpRegen || 0) + v / 100; },               // 自然回復
  accuracy: (P, v) => { P.foeEvadeCut = (P.foeEvadeCut || 0) + v / 100; },       // 命中：相手の 回避 −N%
  critGuard: (P, v) => { P.critTakenCut = (P.critTakenCut || 0) + v / 100; },    // 会心よけ
  barrierOp: (P, v) => { if (v > 0) P.startFx = [...(P.startFx || []), ["barrier", v]]; },   // 開幕バリア
  mirageOp: (P, v) => { P.startFx = [...(P.startFx || []), ["mirage", v]]; },     // 蜃気楼：はじめに 幻影
  crackOp: (P) => { P.critSplit = Math.max(P.critSplit || 0, 3); },              // ひび（水晶の王冠と 同じ）
};
for (const [op, id] of Object.entries(HIT_OPS)) NEWX[op] = (P, v) => { P.kogekiFx = [...(P.kogekiFx || []), [id, v / 100]]; };   // 追撃：通常攻撃の N%
// 装備：もとの強さと OP を足す（OP の % はパッシブと同じ入れ物に入れる）
function withEquip(c) {
  const s = { ...c.stats }, P = passives(c.passives); let bonus = 0;
  for (const it of c.equip || []) {
    for (const [k, v] of Object.entries(itemStats(it))) {
      if (k in s) s[k] += v;
      else if (k === "crit" || k === "evade") P[k] = (P[k] || 0) + v / 100;
      else if (k === "healUp") P.healMul = (P.healMul || 1) * (1 + v / 100);
      else if (k === "mpRegen") P.mpRegen = (P.mpRegen || 0) + v;
      else if (k === "endure") P.startFx = [...(P.startFx || []), ["reincarnation"]];             // 根性 ＝ 戦いのはじめに輪廻
      else if (k === "focusStart") P.startFx = [...(P.startFx || []), ["focus", undefined, v]];     // 集中 ＝ 戦いのはじめに集中（MP がもどる）。v は ターン数
      else if (k === "firstStrike") P.firstStrike = true;
      else if (NEWX[k]) NEWX[k](P, v);                                                              // 新しい OP
      else P[k] = (P[k] || 0) + v;                                                                 // wazaDmg・itazuraDmg・critDmg・dmgCut・drain・statusRes
    }
    if (hasFx(it)) addP(P, baseOf(it.base).fxp);                                                  // 上の装備の とくべつな効果・ミシックの 効果
    bonus += itemPower(it);
  }
  // 派遣の 道具（エンチャント・お守り・はじまりの香 など。dungeon-sim.js が 付ける）。お守りの 耐性は 上書きせず 足す
  for (const [k, v] of Object.entries(c.extraP || {})) {
    if (k === "resistFx") { P.resistFx = { ...(P.resistFx || {}) }; for (const [id, n] of Object.entries(v)) P.resistFx[id] = (P.resistFx[id] || 0) + n; }
    else addP(P, { [k]: v });
  }
  return { s, P, bonus };
}

export function makeFighter(c, side) {
  const { s, P, bonus } = withEquip(c);
  const base = { atk: s.atk * (P.atkMul || 1), def: s.def * (P.defMul || 1), int: s.int * (P.intMul || 1), res: s.res * (P.resMul || 1), agi: s.agi * (P.agiMul || 1), dex: s.dex * (P.dexMul || 1), luk: s.luk };
  if (P.dexGuard) { base.def += base.dex * P.dexGuard / 100; base.res += base.dex * P.dexGuard / 100; }   // 手さばき：DEX の N% を 守りに
  const maxHp = Math.round(s.hp * (P.hpMul || 1));
  // startHp・startMp・startFx：ダンジョンで続けて戦うとき、前の戦いの残りから始める
  return { c, name: c.name, P, base, maxHp, hp: Math.min(maxHp, c.startHp ?? maxHp), maxMp: s.mp, mp: Math.min(s.mp, c.startMp ?? s.mp), power: powerOf(c.stats) + bonus,
    side, fx: structuredClone(c.startFx || {}), boss: !!c.boss, slow: false, pinned: 0, pinning: 0, pinPct: 0, revived: false, hitLast: false, lastKind: null, dot: 0, cnt: {}, onceUsed: {}, actedTurn: 0 };   // cnt：カウント（1 戦ごとに 0 から。鹿さんの 決め、2026-10-31）
}

// ---------- 状態 ----------
const amt = (f, id) => f.fx[id]?.amt || 0;
const debuffs = (f) => Object.keys(f.fx).filter((id) => !isBuff(id));
const buffs = (f) => Object.keys(f.fx).filter((id) => isBuff(id));
const rollTurns = (R, b) => (Array.isArray(b) ? b[0] + Math.floor(R() * (b[1] - b[0] + 1)) : b);
const halve = (f, id) => { const x = f.fx[id]; if (!x) return; if (x.turns == null) { x.amt = Math.floor(x.amt / 2); if (x.amt <= 0) delete f.fx[id]; } };

// ステータス（能力変化・疲労・HP が減ったときのパッシブを込み）
function st(f, k) {
  let v = f.base[k] * Math.max(0, 1 + amt(f, `up_${k}`) / 100 - amt(f, `down_${k}`) / 100);   // 上限 なし（原案。減少 100 で 0）
  if (k === "agi" && f.fx.fatigue) v *= 0.5;
  if (k === "atk" && f.P.lowHpAtk && f.hp <= f.maxHp * 0.3) v *= 1 + f.P.lowHpAtk;
  if (k === "atk" && f.P.lateAtk && (f.turnNow || 0) > f.P.lateAtk.after) v *= 1 + f.P.lateAtk.v;   // 長い狩り：決まった ターンを 越えると
  if ((k === "def" || k === "res") && f.P.lowHpDef && f.hp <= f.maxHp * 0.5) v *= 1 + f.P.lowHpDef;
  if (f.whimK === k && f.P.whim) v *= 1 + f.P.whim / 100;                                          // 気まぐれ（その ターンの 1 つ）
  return v;
}
const hpPct = (f) => (f.hp / f.maxHp) * 100;
// 直接ダメージの 能力の 効き方：威力 ×（こうげきの 能力 ＋ 10）÷（守りの 能力 ＋ 10）の STAT_EXP 乗
// 1 ＝ 能力が そのまま 効く（DEX を 2 倍に すると カンチョーの ダメージも だいたい 2 倍）。前は 0.6 で、能力を 上げても ほとんど 変わらなかった（鹿さんの 報告、2026-10-28）
export const STAT_EXP = 1;
// 継続ダメージを DEF や RES で減らす（0.6 乗の まま）
const soften = (d, guard) => d * Math.pow(10 / (guard + 10), 0.6);

// ---------- 技えらび：ガンビット → オート ----------
const COND = {
  hpBelow: (me, foe, v) => hpPct(me) < v, hpAbove: (me, foe, v) => hpPct(me) > v,
  mpAtLeast: (me, foe, v) => me.mp >= v, mpBelow: (me, foe, v) => me.mp < v,
  debuffed: (me) => debuffs(me).length > 0, notBuffed: (me) => buffs(me).length === 0,
  foeHpBelow: (me, foe, v) => hpPct(foe) < v, foeHpAbove: (me, foe, v) => hpPct(foe) > v,
  foeBuffed: (me, foe) => buffs(foe).length > 0, foeMpBelow: (me, foe, v) => foe.mp < v, foeDebuffs: (me, foe, v) => debuffs(foe).length >= v,
  foeHas: (me, foe, v) => !!foe.fx[v], foeNotHas: (me, foe, v) => !foe.fx[v], selfHas: (me, foe, v) => !!me.fx[v], selfNotHas: (me, foe, v) => !me.fx[v],
  foeUsedPrank: (me, foe) => foe.lastKind === "itazura", foeStronger: (me, foe) => foe.power > me.power,
  cntAtLeast: (me, foe, v) => Array.isArray(v) && (me.cnt?.[v[0]] || 0) >= v[1],   // カウント（帯電・コイン など）が n 以上（形が ちがえば 当てはまらない）
  first: (me, foe, v, turn) => turn === 1, every: (me, foe, v, turn) => turn % v === 0, after: (me, foe, v, turn) => turn > v, always: () => true,
};
// 精鋭の 解析ツリーの 条件（powIf・pIf・onlyIf で 使う。ガンビットの COND とは 分けた。2026-11-04）
const XCOND = {
  sameLast: (me, foe, v, turn, id) => me.lastId === id,                    // 前の 番も この 技
  freshSkill: (me, foe, v, turn, id) => !me.usedIds?.has(id),             // この 戦いで まだ 使って いない 技
  foeRepeat: (me, foe) => !!foe && foe.lastId != null && foe.lastId === foe.curId,   // 相手が 前の 番と 同じ 技（受ける 側で 見る）
  hurtLast: (me) => !!me.hurtSince,                                        // 前の 番の あと ダメージを 受けた
  behind: (me, foe) => !!foe && hpPct(me) < hpPct(foe),                    // HP の 割合が 相手より 低い
  foeNotBuffed: (me, foe) => !!foe && buffs(foe).length === 0,
  mpPctBelow: (me, foe, v) => me.mp * 100 < v * me.maxMp,
  lastTag: (me, foe, v) => !!me.lastTags?.includes(v),                     // 前の 技で 起きた こと（dispel・payHp など）
};
const chk = (c, v, me, foe, turn, id) => !!(XCOND[c] ?? COND[c])?.(me, foe, v, turn, id);
export const COND_TEXT = {
  hpBelow: (v) => `自分の HP が ${v}% より少ない`, hpAbove: (v) => `自分の HP が ${v}% より多い`, mpAtLeast: (v) => `自分の MP が ${v} 以上`, mpBelow: (v) => `自分の MP が ${v} より少ない`,
  debuffed: () => "自分にデバフがある", notBuffed: () => "自分にバフがない", foeHpBelow: (v) => `相手の HP が ${v}% より少ない`, foeHpAbove: (v) => `相手の HP が ${v}% より多い`,
  foeBuffed: () => "相手にバフがある", foeMpBelow: (v) => `相手の MP が ${v} より少ない`, foeDebuffs: (v) => `相手のデバフが ${v} つ以上`, foeHas: (v) => `相手が${EFFECTS[v].label}`, foeNotHas: (v) => `相手が${EFFECTS[v].label}でない`, selfHas: (v) => `自分が${EFFECTS[v].label}`, selfNotHas: (v) => `自分が${EFFECTS[v].label}でない`, foeUsedPrank: () => "相手が前の番にイタズラをした", foeStronger: () => "相手の方が強い",
  cntAtLeast: (v) => (Array.isArray(v) ? `自分の ${COUNTS[v[0]] || "カウント"}が ${v[1]} 以上` : "自分の カウント"),
  first: () => "最初のターン", every: (v) => `${v} ターンごと`, after: (v) => `${v} ターン目より後`, always: () => "いつでも",
};
export const mpCost = (me, id) => { let m = SKILL[id].mp; if (me.fx.activation) m = Math.ceil(m / 2); if (me.P?.foeBuffBoost === id && me.boostOn) m = Math.ceil(m / 2); return m; };   // あて先ちがい：相手が バフを かけた つぎの 番は MP 半分
const needOk = (me, fx, need) => (fx || []).every((x) => x.t !== "spend" || !x.need || (me.cnt?.[x.c] || 0) >= x.need) && Object.entries(need || {}).every(([c, n]) => (me.cnt?.[c] || 0) >= n);
const optOk = (me, o) => needOk(me, o.fx, o.need);
const cntOk = (me, sk) => needOk(me, sk.fx) && (!sk.choose || sk.choose.some((o) => optOk(me, o))) && !(sk.fx?.length && sk.fx.every((x) => x.once) && me.onceUsed?.[sk.id]);   // カウントを 使う 技は 足りる ときだけ・1 戦 1 回の 技は 使ったら おしまい
export const usable = (me, id) => SKILL[id] && (SKILL[id].item ? !!(me.bag && me.bag[id] > 0 && (!me.bagCap || me.bagCap.n > 0)) : (me.mp >= mpCost(me, id) || (!!me.P?.hpCast && me.hp > 2 * (mpCost(me, id) - me.mp))) && (!me.fx.silence || id === "kogeki") && cntOk(me, SKILL[id]));   // 戦いの アイテムは 袋に ある ときだけ（派遣の 味方。闘技場は 袋なし）
const hasT = (id, t) => SKILL[id].fx?.some((x) => x.t === t);
const giveMe = (id) => SKILL[id].fx.some((x) => x.t === "fx" && x.who === "me" && isBuff(x.id));
const giveFoe = (id) => SKILL[id].fx.some((x) => (x.t === "fx" && x.who === "foe") || x.t === "dispel" || x.t === "pin");
function auto(me, foe, turn, R) {
  const set = me.c.set.filter((id) => usable(me, id)), pick = (f) => set.filter(f);
  const dmg = pick((id) => hasT(id, "dmg")).sort((a, b) => expPow(SKILL[b], foe) - expPow(SKILL[a], foe));
  // 腐敗のあいだは回復しない（浄化はする）
  const heal = me.fx.rot ? pick((id) => hasT(id, "cure")) : pick((id) => hasT(id, "heal") || SKILL[id].fx.some((x) => x.t === "fx" && x.id === "regen")), self = pick((id) => !hasT(id, "dmg") && !hasT(id, "heal") && giveMe(id));
  const ctrl = pick((id) => !hasT(id, "dmg") && giveFoe(id));
  const foc = me.fx.focus ? [] : pick((id) => SKILL[id].fx.some((x) => x.t === "fx" && x.id === "focus" && x.who === "me"));   // MP をもどす集中の技
  const mpRate = me.mp / me.maxMp, s = me.c.auto || "balance", atk = usable(me, "kogeki") ? "kogeki" : set[0] || "kogeki";
  if (mpRate < 0.3 && foc[0] && s !== "mp") return foc[0];                                        // MP が少なくなったら集中
  if (s === "attack") return dmg[0] || atk;
  if (s === "defense") { if (hpPct(me) < 50 && heal[0]) return heal[0]; if (!buffs(me).length && self[0]) return self[0]; if (hpPct(me) < 30 && usable(me, "bougyo")) return "bougyo"; return (mpRate >= 0.5 && dmg[0]) || atk; }
  if (s === "mp") { if (hpPct(me) < 30 && heal[0]) return heal[0]; return (mpRate >= 0.6 && dmg[0]) || atk; }
  if (hpPct(me) < 40 && heal[0]) return heal[0];                                                  // バランス
  if (turn === 1 && (self[0] || ctrl[0])) return self[0] || ctrl[0];
  if (ctrl[0] && debuffs(foe).length < 2 && R() < 0.3) return ctrl[0];
  return (mpRate >= 0.3 && dmg[0]) || atk;
}
const expPow = (s, foe) => s.fx.filter((x) => x.t === "dmg").reduce((a, x) => a + (x.pow + (x.perDebuff || 0) * (foe ? debuffs(foe).length : 0)) * (x.hits || 1), 0);
function choose(me, foe, turn, R, noAgain) {
  if (me.fx.silence) return { id: "kogeki", by: "auto" };
  if (me.fx.frenzy || me.fx.confusion) {                                                           // 狂乱・混乱：でたらめな技
    const all = [...me.c.set, "kogeki"].filter((id) => usable(me, id));
    return { id: all[Math.floor(R() * all.length)] || "kogeki", by: "auto", wild: true };
  }
  for (let i = 0; i < (me.c.gambits || []).length; i++) {
    const g = me.c.gambits[i]; if (g.on === false) continue;
    const [k, v] = g.if; if (!COND[k](me, foe, v, turn)) continue;
    if (!(me.c.set.includes(g.do) || SKILL[g.do].type === null) || !usable(me, g.do)) continue;   // 使えないときは次の行へ
    if (noAgain && hasT(g.do, "again")) continue;
    return { id: g.do, by: i + 1, opt: g.opt };
  }
  return { id: auto(me, foe, turn, R), by: "auto" };
}

// 技の 中で えらぶ（肥料を もらう・本日の おすすめ・走りまわる など）：ガンビットの opt → 能力の 名前なら いちばん 高い 能力 → 足りる 物の いちばん 上
const STAT_KEYS = ["atk", "def", "int", "res", "agi", "dex", "luk"];
export function optionOf(me, sk, want) {
  if (!sk.choose) return null;
  const ok = sk.choose.filter((o) => optOk(me, o));
  if (want) { const w = ok.find((o) => o.key === want); if (w) return w; }
  const k3 = (o) => o.key.slice(0, 3);   // 「atkdef」の ような 2 つ組は 前の 能力で くらべる
  if (ok.length && ok.every((o) => STAT_KEYS.includes(k3(o)))) return ok.reduce((a, b) => (me.base[k3(b)] > me.base[k3(a)] ? b : a));
  return ok[0] || null;
}
// 水をかける などで消すバフの順番：回復と MP にかかわるものから先に（うしろほど先に消す）
const DISPEL_FIRST = ["immunity", "activation", "overheal", "shield", "blessing", "regen", "focus"];

// ---------- 1 試合 ----------
// 配信のバトルは 1 対 1。派遣（ダンジョン）はパーティ（ペット＋懐柔した子 2 体まで）対 敵 1〜3 体で、simulateTeams を使う
// opts.pve：ダンジョン（敵はゲームの中のモンスター）。「がんばり」はなし
// 最大 HP・MP（装備とパッシブこみ）。ダンジョンの休憩や罠で使う
export function vitalsOf(c) { const f = makeFighter(c, 0); return { maxHp: f.maxHp, maxMp: f.maxMp }; }
export const fighterPower = (c) => Math.round(makeFighter(c, 0).power);   // 強さの 目安（装備こみ）。闘技場の 相手えらび・ごほうび
export function simulate(A, B, seed, opts = {}) { return simulateTeams([A], [B], seed, opts); }

// 何体対何体でも同じ決まりで戦う（1 対 1 は simulate と同じ結果）。全員が AGI の順に 1 回ずつ動き、ねらうのは生きている相手の中で HP がいちばん少ない子
// 出来事の who は全員の通し番号（SA が 0 から、そのあとに SB）。end の winner は 0（SA の側）か 1（SB の側）
// opts.quiet：結果（end）だけ 返す（門番の 派遣の 計算。ようすの 記録を 作らない ぶん 軽い。勝ち負けは 同じ）
// opts.pick(i, f, tgt, turn)：その ターンの 技を 外から 決める（クローラーの コマンドの 戦い。{ id, by, tgt?：ねらう 子の 番号 } か、自動なら null）
// opts.until：この ターンまで 計算して 止める（コマンドの 戦いは 毎ターン、それまでの 選択を 全部 渡して 最初から 計算しなおす。同じ 種なら 同じ 結果）
export function simulateTeams(SA, SB, seed, opts = {}) {
  const R = rng(seed), F = [...SA.map((c) => makeFighter(c, 0)), ...SB.map((c) => makeFighter(c, 1))], ev = [], duel = F.length === 2, quiet = !!opts.quiet;
  // 1 回だけ 効く 派遣の 道具（側 0＝味方。気つけ薬：状態異常を 1 回 防ぐ・起こし薬：倒れた 子を 1 回 起こす）。使ったら 終わりの used に のる
  const once = opts.once || {}, used = {};
  let curTurn = 0;
  // 戦いの アイテムの 袋（側 0＝味方が みんなで 使う。派遣の あいだ へって いく）。使った 数は 終わりの items に のる
  const bag = opts.items || null, itemsUsed = {};
  const bagCap = { n: opts.itemCap ?? Infinity };   // この 戦いで あと 何こ 使えるか（派遣は BAG_USE_MAX から 使った 数を 引いて 渡す）
  if (bag) for (const f of F) if (f.side === 0) { f.bag = bag; f.bagCap = bagCap; }
  const sideP = [0, 1].map((s) => F.filter((f) => f.side === s).reduce((a, f) => a + f.power, 0));
  const weak = sideP[0] < sideP[1] ? 0 : 1, gap = sideP[1 - weak] / sideP[weak];
  // 弱い方に「がんばり」（1 対 1 で、強さの差が 5% 以上）：差が大きいほど、受けるダメージが減り（最大 −35%）、会心が出やすい（最大 +15%）
  const gIdx = duel && gap >= 1.05 && !opts.pve ? weak : -1, gGuard = Math.min(0.35, (gap - 1) * 0.9), gCrit = Math.min(0.15, (gap - 1) * 0.4);
  const ganbari = (f) => gIdx === f.side && !f.fx.curse;
  const alive = (s) => F.filter((f) => f.side === s && f.hp > 0);
  // 隠蔽して いる 子は ねらわれない（相手が みんな 隠れて いたら ふつうに ねらう）
  const targetOf = (me) => { const c = F.filter((f) => f.side !== me.side && f.hp > 0), open = c.filter((f) => !f.fx.conceal), pool = open.length ? open : c; let t = null; for (const f of pool) if (!t || f.hp < t.hp) t = f; return t; };
  const fxList = (f) => Object.entries(f.fx).map(([id, x]) => ({ id, amt: typeof x.amt === "number" ? x.amt : null, turns: x.turns ?? null }));
  const snap = () => F.map((f) => ({ hp: f.hp, mp: f.mp, fx: fxList(f), up: buffs(f).some((id) => !EFFECTS[id].stance), down: debuffs(f).length > 0 }));

  // 状態を付ける：抵抗率（装備の 状態異常に強い ＋ 免疫 − 衰弱 ＋ ボスの 抵抗。原案）・相殺と上書き・量とターンの足し方
  function addFx(t, id, o, notes, from) {
    const D = EFFECTS[id]; if (!D || D.unused) return false;
    // ソロ（味方が いない）ときは かわりの 状態（身代わり → 防御・隠蔽 → バリア。鹿さんの 決め、2026-10-30）
    if (D.solo && !F.some((g) => g !== t && g.side === t.side && g.hp > 0)) return addFx(t, D.solo, D.solo === "guard" ? { turns: o.turns } : { amt: o.amt }, notes, from);
    if (!D.buff) {
      if (t.P.noFx?.[id] && from !== t) { notes.push(`${t.name} は${D.label}に ならない`); return false; }   // ねむりがお など（自分で 付けた 物は とめない）
      const pr = 1 - ((from && from !== t && from.P.pierceRes) || 0) - ((from && from !== t && from.P.pierceResIds?.[id]) || 0);                              // いたずらの天才：耐性と免疫を半分だけ無視
      if (t.P.resistFx?.[id] && R() < (t.P.resistFx[id] / 100) * pr) { notes.push(`${t.name} は${D.label}に強い`); return false; }
      const res = Math.max(0, Math.min(100, (t.P.statusRes || 0) + amt(t, "immunity") - amt(t, "weakness") + (t.boss ? D.bossRes || 0 : 0)));   // 100 で かからない（対策は 衰弱）
      if (res && R() < (res / 100) * pr) { notes.push(`${t.name} は${D.label}を防いだ`); return false; }
      if (t.side === 0 && once.cure && !used.cure && from !== t) { used.cure = true; notes.push(`${t.name} は 気つけ薬で ${D.label}を 防いだ`); return false; }
    }
    let a = typeof o.amt === "number" ? o.amt : 1, turns = o.turns ?? rollTurns(R, D.base);
    if (from && from !== t && from.P.fxAmtAdd?.[id] && D.dur === "stack") a += from.P.fxAmtAdd[id];
    if (from?.P.fxAmtMul?.[id]) a = Math.round(a * from.P.fxAmtMul[id]);
    if (id === "barrier" && from === t && t.P.barrierPlus) a += t.P.barrierPlus;
    if (turns != null && !D.buff && from && from !== t && from.P.extendDebuff) turns += from.P.extendDebuff;
    if (turns != null && !D.buff && from !== t && t.P.debuffTurnCut && turns >= 2) turns = Math.max(1, turns - t.P.debuffTurnCut);   // 白紙（2 ターン 以上の デバフだけ）
    if (turns != null && from && from !== t && from.P.extendIds?.[id]) turns += from.P.extendIds[id];
    if (turns != null && from === t && D.buff && D.stat && from.P.extendSelfUp) turns += from.P.extendSelfUp;
    if (from && D.buff && D.stat && id.startsWith("up_")) {   // 自分が かける 上昇
      a = Math.round((a + (from.P.upAdd || 0)) * (from.P.upMul || 1));
      if (turns != null) turns = Math.max(1, turns + (from.P.upTurns || 0) - (from.P.upTurnsCut || 0));
    }
    if (id === "daze" && turns != null && from && from !== t && from.P.dazeVsWeak && t.fx.weakness) turns += from.P.dazeVsWeak;
    // 凍傷が ある ところに 凍結：凍傷の量 × DEX ÷ 10 の ダメージ（凍らせる 前に。あとだと その ダメージで とける）
    if (id === "freeze" && t.fx.frostbite) { const d = Math.max(1, Math.round(soften(t.fx.frostbite.amt * (t.fx.frostbite.src || 10) / 10, st(t, "def")))); hurt(t, d, notes); notes.push(`凍傷がしみて ${d}`); if (t.hp <= 0) return true; }
    const p = PAIR[id];
    if (p && t.fx[p]) {
      if (D.dur === "stack") { const cut = Math.min(a, t.fx[p].amt); t.fx[p].amt -= cut; a -= cut; if (t.fx[p].amt <= 0) delete t.fx[p]; if (a <= 0) { notes.push(`${EFFECTS[p].label}と打ち消しあった`); return true; } }
      else { delete t.fx[p]; notes.push(`${EFFECTS[p].label}が消えた`); }
    }
    const cur = t.fx[id], fresh = from === t, cap = D.cap === "hp" ? t.maxHp : D.cap ?? Infinity;
    const longer = (x, y) => (x == null || y == null ? null : Math.max(x, y));
    if (D.dur === "stack" || D.dur === "value") {
      const mul = from?.P.dotMul?.[id];
      if (cur) { cur.amt = Math.min(cap, cur.amt + a); cur.turns = longer(cur.turns, turns); if (cur.turns != null && D.ext) cur.turns++; if (o.src) cur.src = Math.max(cur.src || 0, o.src); if (mul) cur.mul = Math.max(cur.mul || 1, mul); }
      else t.fx[id] = { amt: Math.min(cap, a), turns, src: o.src, fresh, ...(mul ? { mul } : {}) };
    } else if (D.dur === "once") t.fx[id] = { amt: o.amt ?? 1, turns: null };
    else if (cur) cur.turns = longer(cur.turns, turns);
    else t.fx[id] = { turns, fresh, amt: o.amt };
    if (from && from !== t && !D.buff) { if (from.P.debuffMp) from.mp = Math.min(from.maxMp, from.mp + from.P.debuffMp); if (id === "burn" && from.P.burnMeat) cntAdd(from, "meat", from.P.burnMeat); if (id === "daze") from.dazeTurn = curTurn; }
    if (id.startsWith("up_") && t.fx[id]) t.fx[id].seq = t.upSeqN = (t.upSeqN || 0) + 1;   // あとから かけた 上昇（量が 同じ ときの「いちばん 多い 上昇」に 使う）
    if (D.buff && D.stat && id.startsWith("up_")) for (const g of F) if (g.side !== t.side && g.hp > 0 && g.P.foeUpFx && g.foeUpTurn !== curTurn) { g.foeUpTurn = curTurn; for (const [i2, a2, t2] of g.P.foeUpFx) addFx(g, i2, { amt: a2, turns: t2 }, notes, g); }   // 負けてられない
    if (D.buff && from === t) { t.selfBuffTurn = curTurn; for (const g of F) if (g.side !== t.side && g.hp > 0 && g.P.cntOnFoeBuff) for (const [c, n] of Object.entries(g.P.cntOnFoeBuff)) cntAdd(g, c, n); }
    return true;
  }
  // シールドを 使う（シャープの レーザー）
  const useShield = (f, n) => { if (!f.fx.shield) return; f.fx.shield.amt -= n; if (f.fx.shield.amt <= 0) delete f.fx.shield; };
  // 寄り道：上昇を 攻め ↔ 守りで 入れかえる（量と ターンは その まま。寄り道上手：量 +10・+1 ターン）
  function swapUps(f, notes) {
    const B = f.P.swapBonus || { amt: 0, turns: 0 }; let n = 0;
    for (const [a, b] of [["atk", "def"], ["dex", "agi"], ["int", "res"]]) {
      const x = f.fx[`up_${a}`], y = f.fx[`up_${b}`]; delete f.fx[`up_${a}`]; delete f.fx[`up_${b}`];
      const mv = (v) => (v ? { ...v, amt: (v.amt || 0) + B.amt, turns: v.turns == null ? null : v.turns + B.turns } : null);
      if (x) { f.fx[`up_${b}`] = mv(x); n++; } if (y) { f.fx[`up_${a}`] = mv(y); n++; }
    }
    if (n) notes.push(`${f.name} の 上昇が 入れかわった`);
  }
  // 上昇で 中身が 変わる（くんくん・ダッシュ・寄り道）：量の いちばん 多い 上昇で 付く 物。一直線 1.5 倍・よりみち散歩（3 種類 以上なら ぜんぶ 7 割ずつ）
  const FLEX = { atk: ["foe", "burn", 3], dex: ["foe", "frostbite", 3], int: ["foe", "sickness", 3], res: ["me", "regen", 8], def: ["me", "armor", 15], agi: ["me", "mirage", 15] };
  // 量の 多い 順。同じ 量なら あとから かけた 方が 先（鹿さんの 決めの 気分 しだい で そろえた。2026-11-02）
  const topUps = (f) => Object.keys(FLEX).filter((k) => f.fx[`up_${k}`]).sort((a, b) => (f.fx[`up_${b}`].amt || 0) - (f.fx[`up_${a}`].amt || 0) || (f.fx[`up_${b}`].seq || 0) - (f.fx[`up_${a}`].seq || 0));
  function flex(f, tgt, landed, e) {
    const ups = topUps(f);
    if (!ups.length) return;
    const all = f.P.flexAll && ups.length >= f.P.flexAll.at, pick = all ? ups : [ups[0]], mul = (f.P.flexMul || 1) * (all ? f.P.flexAll.mul : 1);
    for (const k of pick) {
      const [who, id, n] = FLEX[k], t = who === "me" ? f : tgt;
      if (who === "foe" && (!landed || !t || t.hp <= 0)) continue;
      if (addFx(t, id, { amt: Math.max(1, Math.round(n * mul)), src: EFFECTS[id].src ? st(f, EFFECTS[id].src) : undefined }, e.notes, f)) e.tags.push(id);
    }
  }
  // 気分 しだい（気分屋）：いちばん 多い 上昇の 種類が 変わったら、その 上昇の 効果が はじける（くんくんと 同じ 表と 量。鹿さんの 決め 2026-11-02）
  function moodCheck(f, foe, notes) {
    const k = topUps(f)[0] || null, was = f.moodLast; f.moodLast = k;
    if (!f.fx.moody || !k || k === was || f.hp <= 0) return;
    const [who, id, n] = FLEX[k], t = who === "me" ? f : foe;
    if (!t || t.hp <= 0) return;
    if (addFx(t, id, { amt: Math.max(1, Math.round(n * (f.P.flexMul || 1) * (f.fx.moody.amt || 1))), src: EFFECTS[id].src ? st(f, EFFECTS[id].src) : undefined }, notes, f)) notes.push(`${f.name} は 気分が 変わって ${EFFECTS[id].label}が はじけた`);
  }
  // カウント（ためる と、根を はる の 合わせ方）
  function cntAdd(f, c, n) {
    if (!n) return; f.cnt[c] = (f.cnt[c] || 0) + n;
    const m = f.P.rootMerge; if (m) while ((f.cnt.water || 0) >= m && (f.cnt.nutrient || 0) >= m) { f.cnt.water -= m; f.cnt.nutrient -= m; f.cnt.growth = (f.cnt.growth || 0) + 1; }
  }
  // 味方：HP の 割合が いちばん 少ない 子（自分も 入る）。notSelf なら 自分を のぞく。ソロは 自分
  const allyOf = (me, notSelf) => { let best = null; for (const g of F) if (g.side === me.side && g.hp > 0 && !(notSelf && g === me)) if (!best || g.hp / g.maxHp < best.hp / best.maxHp) best = g; return best || (notSelf ? null : me); };
  // 起きた とき（ぴったり 起きる）
  function wake(f, notes) {
    if (!f.fx.sleep) return; delete f.fx.sleep;
    if (f.hp > 0 && f.P.wakeHeal) { heal(f, f.maxHp * f.P.wakeHeal, notes); if (f.P.wakeFocus) addFx(f, "focus", { turns: f.P.wakeFocus }, notes, f); notes.push(`${f.name} は ぴったり 起きた`); }
  }
  // 自分の バフが 切れた・消された（エネルギー回収：シールドに する）
  function buffGone(f, n, notes) { if (n > 0 && f.hp > 0 && f.P.buffEndShield) addFx(f, "shield", { amt: Math.round(f.maxHp * f.P.buffEndShield * n) }, notes, f); }
  const clearDebuffs = (f) => { for (const id of debuffs(f)) delete f.fx[id]; };
  // はじけさせたとき：残りの継続ダメージ（1 回分 × 残りターン）
  function burstOf(f, id) {
    const x = f.fx[id]; if (!x) return 0; const t = Math.max(1, x.turns ?? 1);
    const one = id === "poison" ? f.hp * x.amt / 100 * (x.mul || 1) : id === "burn" ? soften((x.src || 10) * 0.1 * x.amt, st(f, "def")) : id === "sickness" ? soften((x.src || 10) * 0.2 * x.amt, st(f, "res")) : id === "frostbite" ? soften((x.src || 10) * 0.2 * x.amt * (x.mul || 1), st(f, "def")) : 0;
    return Math.round(Math.min(f.maxHp * 0.6, one * t));
  }

  // HP が減る（輪廻・あきらめない）。ダメージを 受けたら 凍結が とける（継続ダメージでも。原案）
  function hurt(f, d, notes) {
    if (d <= 0) return;
    f.hurtSince = true; hurt0(f, d, notes); trig(f, notes);
  }
  // 精鋭の 解析ツリー：その場で 効果の 一覧を かける（rollFx・onceFx・allyLowOnce・turnFx。who：me・foe・ally）
  function applyList(src, list, notes, allyT) {
    const alone = !F.some((g) => g !== src && g.side === src.side && g.hp > 0);
    for (let x of list || []) {
      if (x.solo && alone) { applyList(src, x.solo, notes, allyT); continue; }
      const t = x.who === "foe" ? targetOf(src) : x.who === "ally" ? allyT || allyOf(src) : src;
      if (!t || t.hp <= 0) continue;
      if (x.t === "fx") addFx(t, x.id, { amt: x.amt, turns: x.turns, src: EFFECTS[x.id]?.src ? st(src, EFFECTS[x.id].src) : undefined }, notes, src);
      else if (x.t === "heal") heal(t, t.maxHp * x.pct, notes);
      else if (x.t === "shield") addFx(t, "shield", { amt: Math.round(t.maxHp * x.pct) }, notes, src);
      else if (x.t === "cure") cureN(t, x.n, notes);
    }
  }
  // onceFx の 1 行（fx は [id, 量, ターン]）
  function applyOnce(g, en, notes, who) {
    const ts = en.team ? F.filter((h) => h.side === g.side && h.hp > 0) : [who || g];
    for (const t of ts) {
      if (en.cure) cureN(t, null, notes);
      for (const [id, a, tu] of en.fx || []) addFx(t, id, { amt: a ?? undefined, turns: tu ?? undefined }, notes, g);
      if (en.shield) addFx(t, "shield", { amt: Math.round(t.maxHp * en.shield) }, notes, g);
      if (en.heal) heal(t, t.maxHp * en.heal, notes);
    }
  }
  // HP が 節目を 下回った・味方が 力つきた ときの 一度だけの 効果（lowHpOnce・lowHpHeal・allyLowOnce・onceFx）
  function trig(f, notes) {
    for (const g of F) {
      if (g.side !== f.side || g.hp <= 0) continue;
      const P = g.P; if (!P.lowHpOnce && !P.lowHpHeal && !P.allyLowOnce && !P.onceFx) continue;
      const done = (g.trigDone ||= {}), alone = !F.some((h) => h !== g && h.side === g.side && h.hp > 0), low = (h, at) => h.hp > 0 && h.hp <= h.maxHp * at;
      if (f === g) (P.lowHpOnce || []).forEach(([at, id, a, tu], k) => { if (!done["l" + k] && low(g, at)) { done["l" + k] = 1; addFx(g, id, { amt: a ?? undefined, turns: tu ?? undefined }, notes, g); notes.push(`${g.name} は 踏みとどまった`); } });
      if (f === g) (P.lowHpHeal || []).forEach(([at, pct], k) => { if (!done["h" + k] && low(g, at)) { done["h" + k] = 1; heal(g, g.maxHp * pct, notes); } });
      (P.allyLowOnce || []).forEach((en, k) => { if (done["a" + k]) return; if (alone ? f === g && low(g, en.at) : f !== g && low(f, en.at)) { done["a" + k] = 1; applyList(g, alone ? en.solo : en.fx, notes, f); } });
      (P.onceFx || []).forEach((en0, k) => {
        if (done["o" + k]) return; const en = alone && en0.solo ? en0.solo : en0;
        const hit = en.on === "lowHp" ? f === g && low(g, en.at) : en.on === "allyLow" ? f !== g && low(f, en.at) : en.on === "allyDown" ? f !== g && f.hp <= 0 : false;
        if (hit) { done["o" + k] = 1; applyOnce(g, en, notes); }
      });
    }
  }
  // 浄化：n が あれば その 数だけ（なければ ぜんぶ）
  function cureN(f, n, notes) {
    const list = debuffs(f); if (!list.length) return 0;
    const k = n ? Math.min(n, list.length) : list.length;
    for (const id of list.slice(0, k)) { if (id === "sleep") wake(f, notes); delete f.fx[id]; }
    notes.push(`${f.name} の デバフが ${k === list.length ? "" : k + " つ "}消えた`); return k;
  }
  function hurt0(f, d, notes) {
    if (f.hp - d > 0) { f.hp -= d; if (f.fx.freeze) { delete f.fx.freeze; const p = Math.max(1, Math.round(f.maxHp * 0.1)); notes.push(`${f.name} の凍結がとけて ${p}`); hurt(f, p, notes); } return; }
    if (f.fx.reincarnation) { f.fx = {}; f.hp = 1; notes.push(`${f.name} は輪廻で復活した！`); return; }   // 原案：撃破 → 状態が ぜんぶ 消える → HP 1 で 復活
    if (f.P.revive && !f.revived) { f.revived = true; f.hp = Math.round(f.maxHp * f.P.revive); notes.push(`${f.name} はあきらめない！ 立ち上がった`); return; }
    if (f.side === 0 && once.revive && !used.revive) { used.revive = true; f.fx = {}; f.hp = Math.max(1, Math.round(f.maxHp * once.revive)); notes.push(`${f.name} は 起こし薬で 立ち上がった`); return; }
    f.hp = 0; f.fx = {};                                                                              // 倒れたら状態は全部消える
  }
  // 回復（腐敗ならダメージに変わる。あふれた分はオーバーヒールにためる）
  function heal(f, n, notes) {
    n = Math.round(n * (1 + (f.P.healRecv || 0) / 100)); if (n <= 0) return 0;   // 受ける回復（新しい OP）
    if (f.fx.rot) { hurt(f, n, notes); notes.push(`腐敗で ${n} のダメージに変わった`); return -n; }
    const a = Math.min(f.maxHp - f.hp, n); f.hp += a;
    if (n > a && f.fx.overheal) f.fx.overheal.amt = Math.min(f.maxHp, f.fx.overheal.amt + n - a);
    return a;
  }
  // 継続ダメージ（防御で 半分。前の「1 ターン 最大 HP の 40% まで」は やめた。鹿さんの 決め、2026-10-30）
  // P.counterSlip（ユニークスフィア などで 付く 予定）：カウンター中は 継続ダメージの 半分も 返す
  function dot(f, d, why, items, i, notes) {
    if (f.fx.guard) d *= 0.5 * (1 - (f.P.guardBonus || 0));
    if (f.fx.barrier && f.P.barrierDotCut) d *= 1 - f.P.barrierDotCut;   // 雨に ぬれない
    if (f.P.lowHpCut && f.hp <= f.maxHp * 0.5) d *= 1 - f.P.lowHpCut;   // がんこ（継続ダメージも。資料の「受ける ダメージ −15%」。2026-11-04）
    const x = Math.max(1, Math.round(d)); f.dot += x; hurt(f, x, notes); items.push({ who: i, dmg: x, why });
    if (f.hp > 0) hurtUp(f, false, false, notes);
    if (f.hp > 0 && f.P.hurtPierce) addFx(f, "pierce", { amt: Math.round(x * f.P.hurtPierce) }, notes, f);   // 働きすぎ（継続ダメージも）
    if (f.hp > 0 && f.P.hurtShield) addFx(f, "shield", { amt: Math.max(1, Math.round(x * f.P.hurtShield)) }, notes, f);   // 土まみれ（継続ダメージも。資料の「受けた ダメージの 1 割分の シールド」。2026-11-04）
    if (f.hp > 0 && f.fx.counter && f.P.counterSlip) { const to = targetOf(f), back = Math.round(x * (f.fx.counter.amt ?? 50) / 100); if (to && back > 0) { hurt(to, back, notes); notes.push(`${f.name} のカウンター！ ${back} 返した`); } }
  }

  // 条件つきの パッシブ（pIf：[[条件, 値, { crit・wazaDmg・dmgCut・evade・healMul }]]）
  const pAdd = (f, key, other, id) => { let s = 0; for (const [c, v, p] of f.P.pIf || []) if (p[key] != null && chk(c, v, f, other, curTurn, id)) s += p[key]; return s; };
  const pMul = (f, key, other, id) => { let s = 1; for (const [c, v, p] of f.P.pIf || []) if (p[key] != null && chk(c, v, f, other, curTurn, id)) s *= p[key]; return s; };
  // 受ける たびに 自分に 状態（hurtUp：[{ id, n, max, turns, direct（直接攻撃だけ）, crit（会心を 受けた ときだけ） }]）
  function hurtUp(f, crit, direct, notes) { for (const en of f.P.hurtUp || []) { if ((en.direct && !direct) || (en.crit && !crit)) continue; const add = Math.min(en.n, (en.max ?? Infinity) - amt(f, en.id)); if (add > 0) addFx(f, en.id, { amt: add, turns: en.turns }, notes, f); } }
  // チャージ（原案：次の 与ダメージ 2 倍）：行動の ほかに 与える ダメージ（カウンター・棘・大波）でも 使う
  const charge2 = (f) => { if (!f.fx.charge) return 1; delete f.fx.charge; return 2; };
  // 直接攻撃 1 回：命中 → 幻影 → バリア → ダメージ → 防御 → 装甲・障壁 → 貫通 → オーバーヒール → シールド → HP（輪廻）→ カウンター・棘
  function strike(i, me, foe, sk, x, pow, e, charged) {
    const waza = sk.kind === "waza";
    const acc = x.sure ? 1 : Math.min(1, hitRate(st(me, "dex"), st(foe, "agi")) * (1 + (me.P.accUp || 0))) * (waza && me.fx.blind ? 0.5 : 1) * (1 - (foe.P.foeAcc || 0));   // foeAcc：暗い村のランタン・accUp：時間厳守
    let graze = 1;   // かすりヒット（速達）：外れても その 割合が 入る
    const dodged = () => {   // よけた ときの パッシブ（かわして カチッ・はしった はしった）
      if (foe.hp <= 0) return;
      if (foe.P.dodgePierce) addFx(foe, "pierce", { amt: foe.P.dodgePierce }, e.notes, foe);
      if (foe.P.dodgeBite && foe.biteTurn !== curTurn && me.hp > 0) { foe.biteTurn = curTurn; const b = Math.max(1, Math.round(foe.P.dodgeBite * (st(foe, "agi") + 10) / (st(me, "def") + 10) * (0.8 + R() * 0.4))); hurt(me, b, e.notes); e.back = (e.back || 0) + b; e.notes.push(`${foe.name} は かわして カチッ！ ${b}`); }
    };
    if (R() > acc) { if (x.graze) graze = x.graze; else { e.hits.push({ miss: true, dmg: 0 }); dodged(); return false; } }
    const ev = Math.max(0, Math.min(0.75, amt(foe, "mirage") / 100 + (foe.P.evade || 0) + pAdd(foe, "evade", me, sk.id) + (foe.P.lowHpEvade && foe.hp <= foe.maxHp * 0.3 ? foe.P.lowHpEvade : 0)) - (me.P.foeEvadeCut || 0));   // foeEvadeCut：ティダのレンズ
    if (graze === 1 && R() < ev) { if (foe.fx.mirage) { halve(foe, "mirage"); e.notes.push(`${foe.name} は幻影でかわした`); } if (x.graze) graze = x.graze; else { e.hits.push({ miss: true, dmg: 0 }); dodged(); return false; } }
    if (graze < 1) e.notes.push("かすった");
    if (foe.fx.barrier) { foe.fx.barrier.amt--; if (foe.fx.barrier.amt <= 0) delete foe.fx.barrier; e.hits.push({ dmg: 0, blocked: true }); e.notes.push(`${foe.name} のバリアが防いだ`); return false; }
    const lukE = (f) => st(f, "luk") * (1 + (f.P.lukEff || 0) * (f.cnt.coin || 0));   // チャリンチャリン：LUK を 使う 効率が コイン 1 に つき +10%
    const atk = x.stat === "best" ? Math.max(st(me, "atk"), st(me, "int"), st(me, "dex")) : x.stat === "atkint" ? Math.max(st(me, "atk"), st(me, "int")) : x.stat === "mpNow" ? me.mp * (x.statMul || 1) : x.stat === "hp" ? me.maxHp * (x.statMul || 1) : x.stat === "luk" ? lukE(me) * (x.statMul || 1) : x.stat ? st(me, x.stat) * (x.statMul || 1) : me.P.swapPower ? st(me, waza ? "int" : "atk") : waza ? st(me, "atk") : st(me, "int");   // best：ATK・INT・DEX のいちばん高いもの（こうげき）
    // あべこべ（swapPower）：物理の 技は INT、イタズラは ATK（通常攻撃は もう「いちばん 高い 能力」なので かわらない。Claude の 読み、2026-11-04）
    // 守り：平均の守り（DEF と RES の 平均）・知恵の盾（物理の N% を RES で）・貫通（相手の 守りを N% 少なく 見る）。新しい OP
    const gD = st(foe, "def"), gR = st(foe, "res"), grd0 = foe.P.avgGuard ? (gD + gR) / 2 : waza ? (foe.P.resShield ? gD * (1 - foe.P.resShield / 100) + gR * (foe.P.resShield / 100) : gD) : gR;
    const grd = grd0 * (1 - (x.ignore || 0)) * (1 - Math.min(0.5, (me.P.pierceOp || 0) / 100));
    const critVs = Object.entries(me.P.critVsFx || {}).reduce((a, [id, v]) => a + (foe.fx[id] ? v : 0), 0) + (me.P.critVsLowHp && foe.hp <= foe.maxHp * 0.5 ? me.P.critVsLowHp : 0) + pAdd(me, "crit", foe, sk.id);
    const crit = !x.noCrit && (x.crit || me.fx.clarity || foe.fx.daze || R() < 0.03 + st(me, "dex") * 0.004 + (me.P.crit || 0) + (!waza ? me.P.magicCrit || 0 : 0) + (x.critUp || 0) + critVs + (ganbari(me) ? gCrit : 0) + lukE(me) * ((x.critLuk || 0) + (me.P.critLuk || 0)));
    const cm = crit ? 1.5 + lukE(me) * (0.01 + (x.critDmgLuk || 0)) + (me.P.critDmg || 0) / 100 + (me.fx.clarity && me.P.clarityCritDmg ? me.P.clarityCritDmg / 100 : 0) : 1;
    // 守りの 一部 無視：ずっしり＝会心の とき・利息＝会心で ない とき（どちらも 鹿さんの 決め 2026-11-02）
    const grdC = crit && me.P.critIgnore ? grd * (1 - me.P.critIgnore) : !crit && me.P.nonCritIgnore ? grd * (1 - me.P.nonCritIgnore) : grd;
    let d = pow * Math.pow((atk + 10) / (grdC + 10), STAT_EXP) * cm * (0.8 + R() * 0.4);
    if (x.hpPct) d += foe.maxHp * x.hpPct;   // 連打：1 発ごとに 相手の 最大 HP の 量% を 足す（打たれ強い 相手ほど 効く。鹿さんの 決め 2026-11-01）
    d *= 1 + (((waza ? me.P.wazaDmg : me.P.itazuraDmg) || 0) + (waza ? pAdd(me, "wazaDmg", foe, sk.id) : 0)) / 100;
    if (me.P.guardNext && me.lastId === "bougyo") d *= 1 + me.P.guardNext;                       // 防御した 次の 技
    if (me.P.execute && foe.hp <= foe.maxHp * 0.3) d *= 1 + me.P.execute / 100;                    // とどめ（新しい OP）
    if (me.P.desperate) d *= 1 + (me.P.desperate / 100) * (1 - me.hp / me.maxHp);                  // 背水
    if (me.P.badLuck) d *= 1 + Math.min(20, Math.max(0, (me.c.lv || 1) - st(me, "luk")) * me.P.badLuck) / 100;   // 不運の力（最大 ＋20%）
    if (waza && me.P.sandClock && curTurn >= 9) d *= 1.15;                                         // 砂時計：9 ターン目から 技 ＋15%
    if (foe.P.gamble) d *= R() < 0.5 ? 1 - foe.P.gamble / 100 : 1 + foe.P.gamble / 200;            // 守りの賭け
    if (foe.P.agiGuard && R() < foe.P.agiGuard / 100) d = soften(d, st(foe, "agi"));               // 受け流し：N% で AGI でも もう 一度 減らす
    if (crit && foe.P.critTakenCut) d *= 1 - foe.P.critTakenCut;                                   // 受ける 会心の ダメージを 減らす
    if (me.P.firstHit) { me.firstE ??= e; if (me.firstE === e) d *= 1 + me.P.firstHit; }             // 竜の いぶき：最初に 攻撃した 技（何回 当てても その技 ぜんぶ）
    { const dc = (foe.P.dmgCut || 0) + pAdd(foe, "dmgCut", me, sk.id); if (dc) d *= 1 - dc / 100; }
    if (!waza && foe.P.itazuraCut) d *= 1 - foe.P.itazuraCut;                                     // 厚着：受けるイタズラのダメージを減らす（RES を無視されても効く）
    if (charged) d *= 2 * (1 + (me.P.chargeDmg || 0) + (me.chargeBonus || 0));                  // 腰を 入れる・ステーキ
    if (foe.actedTurn !== curTurn) d *= (1 + (x.ifFirst || 0)) * (1 + (me.P.firstDmg || 0));        // 早押し・フライング：この 番に 相手より 先に 動いた
    if (me.fx.haste && me.P.hasteDmg) d *= 1 + me.P.hasteDmg;                                       // 指が とまらない
    if (me.P.upTypesDmg && buffs(me).filter((k) => k.startsWith("up_")).length >= me.P.upTypesDmg.at) d *= 1 + me.P.upTypesDmg.v;   // まだ いける
    if (me.pairBuff?.turns > 0) d *= 1 + me.pairBuff.v;                                             // 相性 ばつぐん
    if (me.P.dazeTurnDmg && me.dazeTurn === curTurn && foe.fx.daze) d *= 1 + me.P.dazeTurnDmg;     // びっくり
    if (me.P.coinInterest && !crit) d *= 1 + Math.min(me.P.coinInterest.max, me.P.coinInterest.per * (me.cnt.coin || 0));   // 利息
    if (me.P.thawBonus && foe.fx.freeze) d *= 1 + me.P.thawBonus;                                   // 解凍上手
    if (foe.fx.overheal && foe.P.overhealCut) d *= 1 - foe.P.overhealCut;                           // 羽毛ぶとん
    if (foe.P.lowHpCut && foe.hp <= foe.maxHp * 0.5) d *= 1 - foe.P.lowHpCut;                       // がんこ
    if (foe.P.shieldCut && foe.fx.shield?.amt > 0) d *= 1 - foe.P.shieldCut;                       // ヘルメット
    if (waza && me.hitLast && me.P.momentum) d *= 1 + me.P.momentum;
    if (!waza && me.P.highMpMagic && me.mp + sk.mp >= me.maxMp / 2) d *= 1 + me.P.highMpMagic;
    if (me.P.perDebuff) d *= 1 + Math.min(0.3, me.P.perDebuff * debuffs(foe).length);
    if (x.execute && foe.hp <= foe.maxHp * x.execute) d *= x.executeMul || 2;
    if (waza && me.P.vsLowHp && foe.hp <= foe.maxHp * 0.5) d *= 1 + me.P.vsLowHp;
    const vsFx = Math.max(0, ...Object.entries(me.P.vsFx || {}).map(([id, v]) => (foe.fx[id] ? v : 0))); if (vsFx) d *= 1 + vsFx;
    const vsSk = Math.max(0, ...Object.entries(x.vsFx || {}).map(([id, v]) => (foe.fx[id] ? v : 0))); if (vsSk) d *= 1 + vsSk;
    if (me.fx.curse) d *= 0.9;
    if (me.fx.frenzy) d *= 2;
    if (foe.fx.frenzy) d *= 1.5;
    if (foe.fx.scald) d *= 1.1;
    if (ganbari(foe)) d *= 1 - gGuard;
    const cp = 1 - (x.cutPierce || 0);   // 軽減で 減る 分の この 割合だけ 効く
    if (foe.fx.guard) d *= 1 - (1 - 0.5 * (1 - (foe.P.guardBonus || 0))) * cp;
    const shellId = waza ? "armor" : "ward";
    if (foe.fx[shellId]) { d *= Math.max(0, 1 - (foe.fx[shellId].amt / 100) * cp * (1 - (me.P.shellPierce || 0))); halve(foe, shellId); }   // 100 で 0（原案。効くと 半分に 減る）
    // 水晶の体など（critSplit）：会心で ふえた 分は いま 受けず、ひびに して あとから 分けて 受ける
    let split = 0; if (crit && foe.P.critSplit) { split = d - d / cm; d -= split; }
    if (crit && waza && me.fx.mastery) { const m = st(me, "dex") * me.fx.mastery.amt / 100; if (foe.P.critSplit) split += m; else d += m; halve(me, "mastery"); }
    if (me.fx.pierce) { d += me.fx.pierce.amt; halve(me, "pierce"); }
    if (x.addPierce) d += x.addPierce;                                                              // 掘り抜く
    d *= graze;
    d = Math.max(0, Math.round(d));   // 前の「最低 1 ダメージ」は やめた（鹿さんの 決め、2026-10-30）
    if (foe.P.delayPain && d > 0 && foe.hp > 0) { const k = Math.round(d * 0.2); if (k > 0) { d -= k; const pn = (foe.pain ||= { left: 0, per: 0 }); pn.left += k; pn.per = Math.ceil(pn.left / 2); e.notes.push(`${foe.name} は 痛みを あとに まわした（${k}）`); } }   // 遅れの痛み：2 割を 次の 2 ターンに
    let rest = d;
    for (const sid of ["overheal", "shield"]) if (rest > 0 && foe.fx[sid]?.amt > 0) { const t = Math.min(rest, foe.fx[sid].amt); foe.fx[sid].amt -= t; rest -= t; e.absorbed = (e.absorbed || 0) + t; if (sid === "shield" && foe.fx.shield.amt <= 0) delete foe.fx.shield; }
    hurt(foe, rest, e.notes); e.hits.push({ dmg: d, crit });
    if (d > 0) (foe.hitBy ||= new Set()).add(me);                                                   // 相手が この 子に 当てた（bonusIf の foeHit）
    if (me.P.bountyMp && foe.hp <= foe.maxHp * me.P.bountyMp.at && !(foe.bountyBy ||= new Set()).has(me)) { foe.bountyBy.add(me); me.mp = Math.min(me.maxMp, me.mp + Math.round(me.maxMp * me.P.bountyMp.pct)); e.notes.push(`${me.name} は 報酬を 受けとった（MP）`); }
    if (foe.hp > 0 && d > 0) hurtUp(foe, crit, true, e.notes);
    if (split >= 1 && foe.hp > 0) { const c = (foe.crack ||= { left: 0, per: 0 }); c.left += Math.round(split); c.per = Math.ceil(c.left / foe.P.critSplit); e.notes.push(`${foe.name} に ひびが 入った（会心の 分 ${Math.round(split)} は あとから）`); }
    // 受けたあと：眠りから起きる・朦朧で気絶・カウンター・棘・吸収・反動（凍結は hurt で とける）
    if (foe.hp > 0 && foe.fx.sleep && R() < 0.5) { e.notes.push(`${foe.name} は目をさました`); wake(foe, e.notes); }
    if (foe.hp > 0 && rest > 0) {
      if (foe.P.hurtShield) addFx(foe, "shield", { amt: Math.max(1, Math.round(rest * foe.P.hurtShield)) }, e.notes, foe);   // 土まみれ
      const pc = (foe.P.hurtPierce || 0) + (foe.brace || 0) + (foe.fx.guard || foe.fx.substitute ? foe.P.guardPierce || 0 : 0);   // 働きすぎ・ぐっと こらえる・責任感
      if (pc) addFx(foe, "pierce", { amt: Math.max(1, Math.round(rest * pc)) }, e.notes, foe);
      if (!foe.P.cntOnHurtOnce || !(e.cntHurt ||= new Set()).has(foe)) { if (foe.P.cntOnHurtOnce) e.cntHurt.add(foe); for (const [c, n] of Object.entries(foe.P.cntOnHurt || {})) cntAdd(foe, c, n); }   // 静電気を ためる・ピカピカに 目がない（1 回の 攻撃で 何回 当たっても 1 回。鹿さんの 決め 2026-11-02）
    }
    if (me.hp > 0 && d > 0) {
      if (me.P.hitPierce) addFx(me, "pierce", { amt: me.P.hitPierce }, e.notes, me);               // 近道
      if (x.gainOnHit) cntAdd(me, x.gainOnHit.c, x.gainOnHit.n);                                   // ずっしり 体当たり
      if (!waza) for (const [c, n] of Object.entries(me.P.cntOnItazuraHit || {})) cntAdd(me, c, n);
      for (const [id, [c, n]] of Object.entries(me.P.cntOnHitVs || {})) if (foe.fx[id]) cntAdd(me, c, n);   // はしゃぎすぎ
      if (crit && me.P.critRegen) addFx(me, "regen", { amt: me.P.critRegen }, e.notes, me);        // 風通し
      if (crit && me.P.critVsDazeRegen && foe.fx.daze) addFx(me, "regen", { amt: me.P.critVsDazeRegen }, e.notes, me);   // 見て しまったな
    }
    if (sk.id === "kogeki" && me.P.kogekiFx && foe.hp > 0) for (const [id, ch] of me.P.kogekiFx) if (foe.hp > 0 && R() < ch) { const [n, tu] = HIT_AMT[id] || [2]; if (addFx(foe, id, { amt: n, turns: tu, src: EFFECTS[id].src ? st(me, EFFECTS[id].src) : undefined }, e.notes, me)) e.tags.push(id); }   // 追撃の OP
    if (foe.hp > 0 && me.hp > 0 && d > 0 && foe.P.thornsOp) { const t = Math.round(soften(st(foe, foe.P.ironThorns ? "def" : "atk") * foe.P.thornsOp / 100, st(me, "def"))); if (t > 0) { hurt(me, t, e.notes); e.back = (e.back || 0) + t; e.notes.push(`${foe.name} の 反撃 ${t}`); } }   // 反撃（鉄の棘なら DEF で）
    if (foe.hp > 0 && foe.fx.daze && !foe.fx.stun && R() < 0.1) addFx(foe, "stun", { turns: 1 }, e.notes, me);
    // しびれ上手（paraCounterCut）：麻痺している相手のカウンターと棘は弱い
    if (foe.hp > 0 && foe.fx.counter && rest > 0) { const back = Math.round((rest * (foe.fx.counter.amt ?? 50) / 100 + st(foe, "def") * (foe.P.counterDef || 0)) * (foe.fx.paralysis && me.P.paraCounterCut ? 1 - me.P.paraCounterCut : 1) * charge2(foe)); hurt(me, back, e.notes); e.back = (e.back || 0) + back; e.notes.push(`${foe.name} のカウンター！ ${back} 返した`); }
    if (foe.hp > 0 && foe.fx.thorns) { const t = Math.round(soften((st(foe, foe.P.ironThorns ? "def" : "atk") * foe.fx.thorns.amt / 100 + st(foe, "def") * (foe.P.thornsDef || 0)) * (foe.P.thornsMul || 1), st(me, "def")) * (foe.fx.paralysis && me.P.paraCounterCut ? 1 - me.P.paraCounterCut : 1) * charge2(foe)); hurt(me, t, e.notes); e.thorns = (e.thorns || 0) + t; halve(foe, "thorns"); }
    if (x.toShield && x.drain && me.hp > 0) addFx(me, "shield", { amt: Math.max(1, Math.round(d * x.drain)) }, e.notes, me);   // 利息：吸った 分を シールドに
    else if ((me.P.drain || x.drain) && me.hp > 0) { const a = heal(me, d * ((me.P.drain || 0) / 100 + (x.drain || 0)), e.notes); if (a > 0) e.drain = (e.drain || 0) + a; }
    if (crit) e.critHit = true;
    for (const [id, ch, n, tu] of me.P.onHitFx || []) if (foe.hp > 0 && R() < ch && addFx(foe, id, { amt: n, turns: tu, src: EFFECTS[id].src ? st(me, EFFECTS[id].src) : undefined }, e.notes, me)) e.tags.push(id);
    for (const [id, ch, n, tu] of foe.P.whenHitFx || []) if (me.hp > 0 && foe.hp > 0 && R() < ch) addFx(me, id, { amt: n, turns: tu, src: EFFECTS[id].src ? st(foe, EFFECTS[id].src) : undefined }, e.notes, foe);
    if (x.recoil) { const rc = Math.max(1, Math.round(d * x.recoil * (me.P.recoilMul || 1))); hurt(me, rc, e.notes); e.recoil = (e.recoil || 0) + rc; }
    return true;
  }

  if (!quiet) ev.push({ type: "start", ganbari: gIdx, gap, fighters: F.map((f) => ({ name: f.name, owner: f.c.owner, lv: f.c.lv, type: f.c.type, maxHp: f.maxHp, maxMp: f.maxMp, ...(duel ? {} : { side: f.side }) })) });
  F.forEach((f) => { for (const [id, n, tu] of f.P.startFx || []) { addFx(f, id, { amt: n, turns: tu }, [], f); if (f.fx[id]) f.fx[id].perm = true; } });   // パッシブ・装備の「戦いのはじめに」
  F.forEach((f) => { for (const [id, n, tu] of f.P.startFoeFx || []) for (const t of F.filter((g) => g.side !== f.side)) addFx(t, id, { amt: n, turns: tu }, [], f); });
  // 精鋭の 解析ツリー（2026-11-04）：teamMul（味方 全員の 能力。ソロは solo）・startDispel・onceFx の start・rollFx の start
  F.forEach((f) => {
    const alone = !F.some((g) => g !== f && g.side === f.side && g.hp > 0);
    if (f.P.teamMul) { const m = alone ? f.P.teamMul.solo || {} : f.P.teamMul; for (const g of alone ? [f] : F.filter((h) => h.side === f.side)) for (const [k, v] of Object.entries(m)) if (k !== "solo" && g.base[k] != null) g.base[k] *= v; }
    if (f.P.startDispel) { const t = targetOf(f); let n = f.P.startDispel; if (t) for (const id of buffs(t)) if (n > 0 && !EFFECTS[id].stance) { delete t.fx[id]; n--; } }
    for (const en0 of f.P.onceFx || []) { const en = alone && en0.solo ? en0.solo : en0; if (en.on === "start") applyOnce(f, en, []); }
    for (const en of f.P.rollFx || []) if (en.at === "start") applyList(f, !en.chance || R() < en.chance ? en.fx : en.miss, []);
  });   // 「戦いのはじめに相手を〇〇」（相手全員）

  let lastTurn = 0, simFrom = -1;
  for (let turn = 1; turn <= (opts.until ?? SIM_TURN) && alive(0).length && alive(1).length; turn++) {
    lastTurn = turn; curTurn = turn; if (turn === MAX_TURN + 1) simFrom = ev.length;
    F.forEach((f) => (f.turnNow = turn));
    const plan = F.map((f, i) => {
      if (f.hp <= 0) return null;
      let tgt = targetOf(f);
      const pk = opts.pick ? opts.pick(i, f, tgt, turn) : null;
      if (pk && pk.tgt != null && F[pk.tgt] && F[pk.tgt].hp > 0 && F[pk.tgt].side !== f.side) tgt = F[pk.tgt];
      f.boostOn = !!f.P.foeBuffBoost && !!tgt && tgt.selfBuffTurn != null && tgt.selfBuffTurn >= (f.lastActTurn || 0) && f.lastActTurn > 0;
      return { ...(pk ? { id: pk.id, by: pk.by ?? "コマンド", opt: pk.opt } : choose(f, tgt, turn, R)), tgt };
    });
    const speed = F.map((f, i) => (f.hp <= 0 ? -Infinity : (SKILL[plan[i].id].first ? 1000 : 0) + (turn === 1 && f.P.firstStrike ? 500 : 0) + (f.slow ? -1000 : 0) + st(f, "agi") * (0.9 + R() * 0.2)));
    F.forEach((f) => (f.slow = false));
    const order = F.map((_, i) => i).sort((a, b) => (speed[b] - speed[a]) || 0);   // 同じ速さなら番号の小さい方が先
    for (const i of order) {
      const me = F[i];
      if (!alive(0).length || !alive(1).length) break;
      if (me.hp <= 0 || !plan[i]) continue;   // !plan：この ターンの 途中で 起こされた 子は 次の ターンから
      let foe = plan[i].tgt.hp > 0 ? plan[i].tgt : targetOf(me);                                    // ねらっていた相手が倒れていたら、ねらいなおす
      // 手番のはじめ：再生・毎ターンのパッシブ・毒・炎上・体調不良・凍傷・疲労・おさえこみ
      me.dot = 0;
      const tick = { type: "tick", turn, who: i, items: [] }, tn = [];
      me.brace = 0;
      if (me.fx.regen) {
        const a = heal(me, me.maxHp * me.fx.regen.amt / 100, tn); if (a) tick.items.push({ who: i, heal: a, why: "再生" });
        if (me.P.regenWater) cntAdd(me, "water", me.P.regenWater);                                  // 水はけが いい
        if (me.fx.regen && me.P.regenKeep) { me.fx.regen.amt = Math.floor(me.fx.regen.amt * me.P.regenKeep); if (me.fx.regen.amt <= 0) delete me.fx.regen; } else halve(me, "regen");   // ぬくぬく：3/4 に しか 減らない（腐敗で 回復が ダメージに なって 倒れたら 再生は もう ない）
      }
      if (me.hp > 0 && me.fx.sleep && me.P.sleepGrow) for (const [k, n] of Object.entries(me.P.sleepGrow)) addFx(me, `up_${k}`, { amt: n }, tn, me);   // 寝る子は 育つ
      if (me.hp > 0 && me.P.glowRegen && (me.cnt.glow || 0) >= me.P.glowRegen.at) { const a = heal(me, me.maxHp * me.P.glowRegen.pct, tn); if (a) tick.items.push({ who: i, heal: a, why: "ほんのり" }); }
      if (me.hp > 0 && me.P.coinTick && (me.cnt.coin || 0) > 0) { me.cnt.coin--; addFx(me, "up_atk", { amt: me.P.coinTick }, tn, me); }   // こつこつ
      if (me.hp > 0 && me.drip?.left > 0) { me.drip.left--; const a = heal(me, me.maxHp * me.drip.pct, tn); if (a) tick.items.push({ who: i, heal: a, why: "水" }); }   // 水を はきだす（続けて 回復）
      if (me.hp > 0 && me.P.hpRegen) { const a = heal(me, me.maxHp * me.P.hpRegen, tn); if (a) tick.items.push({ who: i, heal: a }); }
      if (me.hp > 0 && me.P.oasisOp && me.hp < me.maxHp / 2) { const a = heal(me, me.maxHp * me.P.oasisOp / 100, tn); if (a) tick.items.push({ who: i, heal: a, why: "オアシス" }); }   // オアシス（新しい OP）
      if (me.hp > 0 && me.P.rebound && me.hp < me.maxHp) { const a = heal(me, (me.maxHp - me.hp) * me.P.rebound / 100, tn); if (a) tick.items.push({ who: i, heal: a, why: "立ち直り" }); }   // 立ち直り：減った HP の N%（新しい OP。2026-11-05 の カード）
      if (me.P.whim) me.whimK = ["atk", "int", "agi"][Math.floor(R() * 3)];                       // 気まぐれ：この ターンの 1 つ
      if (me.P.teamRegen) for (const g of F) if (g.side === me.side && g.hp > 0) { const a = heal(g, g.maxHp * me.P.teamRegen, tn); if (a) tick.items.push({ who: F.indexOf(g), heal: a, why: "癒やしの歌" }); }   // ザンの竪琴：味方 全員
      if (me.P.waveEvery && turn % me.P.waveEvery === 0) for (const g of F) if (g.side !== me.side && g.hp > 0) {   // ニライの三叉槍：相手 全員に 水の こうげき（ATK か INT の 高い 方 → DEF と RES の 低い 方）
        let d = me.P.wavePow * Math.pow((Math.max(st(me, "atk"), st(me, "int")) + 10) / (Math.min(st(g, "def"), st(g, "res")) + 10), STAT_EXP) * (0.8 + R() * 0.4);
        if (g.P.dmgCut) d *= 1 - g.P.dmgCut / 100; if (g.fx.guard) d *= 0.5;
        d = Math.round(d * (me.fx.charge ? 2 : 1)); if (d > 0) { hurt(g, d, tn); tick.items.push({ who: F.indexOf(g), dmg: d, why: "大波" }); }
      }
      if (me.P.waveEvery && turn % me.P.waveEvery === 0 && me.fx.charge) delete me.fx.charge;     // 大波で チャージを 使った
      if (me.P.mpRegen) { me.mpAcc = (me.mpAcc || 0) + me.P.mpRegen; const g = Math.floor(me.mpAcc + 1e-9); if (g) { me.mpAcc -= g; me.mp = Math.min(me.maxMp, me.mp + g); } }   // 0.5 なら 2 ターンごとに +1
      if (me.P.bellMp && turn % (me.P.bellEvery || 3) === 0) me.mp = Math.min(me.maxMp, me.mp + me.P.bellMp);   // 夜ふけの鐘
      if (me.fx.poison) dot(me, me.hp * me.fx.poison.amt / 100 * (me.fx.poison.mul || 1), "毒", tick.items, i, tn);   // いまの HP（原案）
      if (me.fx.burn) { dot(me, soften((me.fx.burn.src || 10) * 0.1 * me.fx.burn.amt, st(me, "def")) * (me.fx.scald ? 1.5 : 1), "炎上", tick.items, i, tn); if (me.hp > 0 && R() < 0.3) addFx(me, "scald", {}, tn, null); }
      if (me.fx.sickness) { dot(me, soften((me.fx.sickness.src || 10) * 0.2 * me.fx.sickness.amt, st(me, "res")), "体調不良", tick.items, i, tn); if (me.hp > 0 && R() < 0.3) addFx(me, "fatigue", {}, tn, null); }
      if (me.fx.frostbite) dot(me, soften((me.fx.frostbite.src || 10) * 0.2 * me.fx.frostbite.amt * (me.fx.frostbite.mul || 1), st(me, "def")), "凍傷", tick.items, i, tn);
      if (me.fx.fatigue) me.mp = Math.max(0, me.mp - Math.round(me.maxMp * 0.1));
      if (me.pinned && me.pinPct) dot(me, me.maxHp * me.pinPct, "おさえこみ", tick.items, i, tn);
      for (const [id, ch, tu] of me.P.auraFx || []) if (me.hp > 0 && R() < ch && addFx(foe, id, { turns: tu }, tn, me)) tn.push(`${foe.name} は${EFFECTS[id].label}になった`);
      for (const [id, ch, tu, need, n] of me.P.auraFxAt || []) if (me.hp > 0 && amt(foe, need) >= n && R() < ch && addFx(foe, id, { turns: tu }, tn, me)) tn.push(`${foe.name} は${EFFECTS[id].label}になった`);   // 根腐れ
      if (me.hp > 0) for (const en of me.P.rollFx || []) if (en.at === "turn") applyList(me, !en.chance || R() < en.chance ? en.fx : en.miss, tn);
      if (me.hp > 0 && me.P.turnFx) { const alone = !F.some((g) => g !== me && g.side === me.side && g.hp > 0); for (const en0 of me.P.turnFx) { const en = alone && en0.solo ? en0.solo : en0; if (en.has && !(me.fx[en.has] && (!en.n || amt(me, en.has) >= en.n))) continue; if (en.fx) addFx(me, en.fx[0], { amt: en.fx[1], turns: en.fx[2] }, tn, me); if (en.heal) { const a = heal(me, me.maxHp * en.heal, tn); if (a) tick.items.push({ who: i, heal: a }); } if (en.shield) addFx(me, "shield", { amt: Math.max(1, Math.round(me.maxHp * en.shield)) }, tn, me); } }
      if (me.pain?.left > 0) { const k = Math.min(me.pain.left, me.pain.per); me.pain.left -= k; hurt(me, k, tn); tick.items.push({ who: i, dmg: k, why: "遅れの痛み" }); }   // 遅れの痛み（新しい OP）
      if (me.crack?.left > 0) { const c = me.crack, k0 = Math.min(c.left, c.per), k = Math.round(k0 * (me.fx.guard ? 0.5 * (1 - (me.P.guardBonus || 0)) : 1)); c.left -= k0; hurt(me, k, tn); tick.items.push({ who: i, dmg: k, why: "ひび" }); }   // 40% の 上限は かけない（もとは 直接の ダメージ）
      if (!quiet && (tick.items.length || tn.length)) { tick.notes = tn; tick.after = snap(); ev.push(tick); }
      if (me.hp <= 0) continue;
      if (foe.hp <= 0) { foe = targetOf(me); if (!foe) continue; }                                   // 大波で 相手が 倒れたら ねらいなおす

      for (let rep = 0; rep < 2; rep++) {   // ダブルクリック：この ターン、もう 1 回 動く
      if (rep === 1) {
        if (!me.again || me.hp <= 0 || !alive(0).length || !alive(1).length) break;
        me.again = false; if (foe.hp <= 0) { foe = targetOf(me); if (!foe) break; }
        plan[i] = { ...choose(me, foe, turn, R, true), tgt: foe };
      }
      me.again = false; me.actedTurn = turn;
      const e = { type: "act", who: i, turn, by: plan[i].by, notes: [], ...(duel ? {} : { tgt: F.indexOf(foe) }) };
      // 動けないとき：凍結 → 気絶 → 眠り → 麻痺 → おさえこみ
      const skip = me.fx.freeze ? "凍っていて動けない" : me.fx.stun ? (me.fx.stun.amt === "banana" ? "バナナの皮で転んだ！" : "気絶している") : me.fx.sleep ? "寝ている"
        : me.fx.paralysis && R() < Math.min(0.5, me.fx.paralysis.amt * 0.005) ? "しびれて動けない" : me.pinning ? "おさえこんでいる" : me.pinned ? "おさえこまれて動けない" : null;
      if (skip) Object.assign(e, { skill: null, name: skip, kind: "skip", log: `${me.name} は ${skip}` });
      else {
        let id = plan[i].id, want = plan[i].opt;
        if (me.fx.rot && hasT(id, "heal")) { const p2 = choose(me, foe, turn, R, rep === 1); id = p2.id; e.by = p2.by; want = p2.opt; }   // 動く前に腐敗にされたら、回復をやめて選びなおす
        if (!usable(me, id)) { id = "kogeki"; e.by = "auto"; }
        me.curId = id;
        const sk = SKILL[id], boosted = me.boostOn && me.P.foeBuffBoost === id; let cost = mpCost(me, id);
        if (me.P.mpSave && cost > 0) { me.mpSaveAcc = (me.mpSaveAcc || 0) + cost * me.P.mpSave / 100; const sv = Math.floor(me.mpSaveAcc + 1e-9); if (sv) { me.mpSaveAcc -= sv; cost = Math.max(0, cost - sv); } }   // MP 節約（はしたは ためて 1 に なったら 引く）
        me.mp -= cost;
        if (me.mp < 0) { const hp = -me.mp * 2; me.mp = 0; me.hp = Math.max(1, me.hp - hp); e.notes.push(`${me.name} は 命を けずって 技を 出した（HP −${hp}）`); }   // 命の詠唱
        if (sk.item) { me.bag[id]--; me.bagCap.n--; itemsUsed[id] = (itemsUsed[id] || 0) + 1; }   // 戦いの アイテムは 1 こ 使う
        // 混乱：半分の確率で自分に使ってしまう
        const self = !!me.fx.confusion && R() < 0.5;
        let tgt = self ? me : foe;
        // 身代わり：味方への 直接攻撃を、身代わりの 子が 代わりに 受ける（3 匹の とき。原案から 直接攻撃だけに した 形を 鹿さんが 残した）
        if (!self && (hasT(id, "dmg") || hasT(id, "bloom"))) { const sub = F.find((g) => g.side === tgt.side && g !== tgt && g.hp > 0 && g.fx.substitute); if (sub) { e.notes.push(`${sub.name} が ${tgt.name} の 身代わりに なった`); tgt = sub; if (!duel) e.tgt = F.indexOf(sub); } }
        // 技の 中で えらぶ（ガンビットの opt。なければ optionOf の 決まり）
        // solo：味方が いない ときは その 効果の かわりに solo の 一覧（ソロで はたらかない 技を 腐らせない。鹿さんの 決め。精鋭の 解析ツリー など）
        const alone = !F.some((g) => g !== me && g.side === me.side && g.hp > 0);
        const opt = optionOf(me, sk, want), fxs = [...(sk.fx || []), ...(opt ? opt.fx : [])].flatMap((x) => (x.solo && alone ? x.solo : [x])).map((x) => { if (!x.oneOf) return x; const all = [{ ...x, oneOf: undefined }, ...x.oneOf]; return all[Math.floor(R() * all.length)]; });   // oneOf：中から ばらばらに 1 つ
        Object.assign(e, { skill: id, name: sk.name + (opt ? `（${opt.name}）` : ""), kind: sk.kind, mp: cost, hits: [], heal: 0, tags: [], wild: !!plan[i].wild, self, ...(opt ? { opt: opt.key } : {}) });
        if (self) e.notes.push(`${me.name} は混乱して自分に使った`);
        let landed = true;
        if (!hasT(id, "dmg") && giveFoe(id) && !sk.item) {                                        // ダメージのないイタズラも当たるか決める（爆弾は よけられない）
          const acc = Math.min(1, hitRate(st(me, "dex"), st(tgt, "agi")) * (1 + (me.P.accUp || 0))) * (1 - (tgt.P.foeAcc || 0));
          landed = R() < acc; if (!landed) e.notes.push(`${tgt.name} はよけた`);
        }
        let dealt = false, spent = 0, hitSet = null; e.spent = {};   // hitSet：全員の 技で 当たった 相手（記録には のせない）
        const charged = !!me.fx.charge && (hasT(id, "dmg") || hasT(id, "bloom") || (hasT(id, "heal") && !!me.P.healHit)); if (charged) delete me.fx.charge;   // 次に 与える ダメージ（原案）
        // カウントで ふえる 数（spent：この 技で 使った 数／c と ref：いまの 数を 参照）。食べ合わせ：参照する 材料が 5 以上なら 1.5 倍
        const byOf = (b, base) => { const v = b.spent ? spent : me.cnt[b.c] || 0; let r = base + (b.ofHp ? b.add * v : Math.floor(v / b.per) * b.add); if (b.ref && me.P.refBoost && v >= me.P.refBoost.at) r *= me.P.refBoost.mul; return b.ofHp ? r : Math.round(r); };
        const accOf = (t) => Math.min(1, hitRate(st(me, "dex"), st(t, "agi")) * (1 + (me.P.accUp || 0))) * (1 - (t.P.foeAcc || 0));
        for (const x of fxs) {
          if (x.payHp || x.hpCost) { const c = Math.max(1, Math.round(me.maxHp * (x.payHp || x.hpCost))); hurt(me, c, e.notes); e.tags.push("payHp"); e.notes.push(`${me.name} は HP を ${c} 払った`); }   // 賭け金・迷い
          if (x.onlyIf && !chk(x.onlyIf[0], x.onlyIf[1], me, tgt, turn, id)) continue;
          if (x.t === "spend") {                                                                  // カウントを 使う（味見：使った 数 1 に つき HP 2%）
            const have = me.cnt[x.c] || 0, k = x.all ? have : Math.min(have, x.n || 0); me.cnt[x.c] = have - k; spent += k; e.spent[x.c] = (e.spent[x.c] || 0) + k;
            if (k && me.P.tasteHeal) { const a = heal(me, me.maxHp * me.P.tasteHeal * k, e.notes); if (a > 0) e.heal += a; }
          } else if (x.t === "gain") cntAdd(me, x.c, x.n);
          else if (x.t === "convertUps") {   // おすそわけ：自分の 上昇を ぜんぶ 使う（鹿さんの 決め 2026-11-02）。種類と 量は pushDowns で 相手に
            e.conv = topUps(me).map((k) => [k, me.fx[`up_${k}`].amt || 0]); for (const [k] of e.conv) { delete me.fx[`up_${k}`]; spent++; }
          } else if (x.t === "pushDowns") {   // おすそわけ：当たったら、使った 上昇を 同じ 種類・同じ 量の 減少に して 相手に 押しつける
            for (const [k, a] of e.conv || []) if (landed && tgt.hp > 0 && a > 0 && addFx(tgt, `down_${k}`, { amt: a, turns: x.turns }, e.notes, me)) e.tags.push(`down_${k}`);
          } else if (x.t === "consumeBuffs") {   // とびかかる：自分の バフを ぜんぶ 使う（構えは 残す）。いちばん 多かった 上昇を 覚えて おく
            e.topUp = topUps(me)[0] || null;
            for (const id2 of buffs(me)) if (!EFFECTS[id2].stance) { delete me.fx[id2]; spent++; }
          } else if (x.t === "impede") {   // とびかかる：いちばん 多かった 上昇で 行動阻害（ATK・DEF→気絶／DEX・AGI→凍結／INT・RES→混乱。鹿さんの 決め 2026-11-02）
            const m = e.topUp && x.map[e.topUp]; if (m && landed && dealt && tgt.hp > 0 && addFx(tgt, m[0], { turns: m[1] }, e.notes, me)) e.tags.push(m[0]);
          }
          else if (x.t === "dmg") {
            const tgt0 = tgt, tlist = x.aoe && !self ? F.filter((g) => g.side !== me.side && g.hp > 0) : [tgt]; let anyD = false; const d0 = dealt; hitSet ||= new Set();
            for (const T of tlist) { tgt = T; dealt = false;
            let hits = x.hitsByUps ? Math.max(1, buffs(me).filter((k) => k.startsWith("up_")).length) : x.hits || 1;
            let pow = x.pow + (x.perDebuff || 0) * debuffs(tgt).length + (x.perSpent || 0) * spent + (x.perCnt ? x.perCnt.k * (me.cnt[x.perCnt.c] || 0) : 0);
            if (x.release && me.P.bigRelease && spent >= me.P.bigRelease.at) pow *= me.P.bigRelease.mul;   // 腹いっぱい
            // 精鋭の 解析ツリー：威力の 抽選・ターンで のびる・バフ 1 つに つき・条件つき（powIf・ifHitLast・bonusIf）
            if (x.powOf) pow += x.powOf[Math.floor(R() * x.powOf.length)] - x.pow;
            if (x.powByTurn) pow += Math.min(x.powByTurn.max, x.powByTurn.add * turn);
            if (x.perBuff) pow += x.perBuff * buffs(tgt).filter((b) => !EFFECTS[b].stance).length;
            if (x.powIf) { const m = Math.max(0, ...x.powIf.filter(([c, v]) => chk(c, v, me, tgt, turn, id)).map((q) => q[2])); pow *= 1 + m; }
            if (x.ifHitLast && me.hitLast && me.lastTgt === tgt) pow *= 1 + x.ifHitLast;
            let xs = x;
            if (x.bonusIf) { const b = x.bonusIf; let m = 0;
              if (b.foeNoBuff && !buffs(tgt).length) m = Math.max(m, b.foeNoBuff); if (b.foeHit && me.hitBy?.has(tgt)) m = Math.max(m, b.foeHit);
              if (b.selfShield && me.fx.shield?.amt > 0) m = Math.max(m, b.selfShield); if (b.hpLead && hpPct(me) > hpPct(tgt)) m = Math.max(m, b.hpLead);
              pow *= 1 + m; if (b.lowHpHits && me.hp <= me.maxHp * 0.5) hits += b.lowHpHits;
              const iv = Math.max(0, ...Object.entries(b.ignoreVs || {}).map(([fid, v]) => (tgt.fx[fid] ? v : 0))); if (iv) xs = { ...x, ignore: Math.max(x.ignore || 0, iv) }; }
            if (boosted) pow *= 2;                                                                // あて先ちがい
            // シールドを 使う（照射：あれば 5% 使って +8／収束：半分 使って 2 に つき +1／凝縮レーザー：ぜんぶ 使って その 量／連射：1 回ごとに 3%）
            let shPer = 0; e.shieldUsed = 0;
            if (x.shieldUse) {
              const sh = me.fx.shield?.amt || 0, u = x.shieldUse;
              if (u.pct) { const need = Math.max(1, Math.round(me.maxHp * u.pct)); if (sh >= need) { useShield(me, need); pow += u.add; e.shieldUsed = need; } }
              else if (u.half) { const k = Math.floor(sh / 2); if (k > 0) { useShield(me, k); pow += Math.floor(k / 2); e.shieldUsed = k; } }
              else if (u.all) { if (sh > 0) { useShield(me, sh); e.shieldUsed = sh; } }
              else if (u.per) shPer = Math.max(1, Math.round(me.maxHp * u.per));
            }
            if (x.consume) { const c = tgt.fx[x.consume]; e.consumed = c ? { id: x.consume, amt: typeof c.amt === "number" ? c.amt : 0, turns: c.turns ?? 0, burst: x.burst ? burstOf(tgt, x.consume) : 0 } : null; if (c) pow += (x.perAmt || 0) * e.consumed.amt + (x.perTurn || 0) * e.consumed.turns; }
            if (hits > 1 && me.P.extraHit && R() < me.P.extraHit) hits++;                         // 2 回 言う
            if (me.fx.haste && (hits > 1 || id === "kogeki")) { const n = hits + 1 + Math.floor(R() * 3); pow = (pow * hits) / n; hits = n; }   // 攻撃（こうげき）の 回数も（原案）
            if (x.perDebuff) e.popped = debuffs(tgt).length;
            for (let h = 0; h < hits && tgt.hp > 0; h++) { if (shPer && (me.fx.shield?.amt || 0) >= shPer) { useShield(me, shPer); e.shieldUsed += shPer; } dealt = strike(i, me, tgt, sk, xs, pow, e, charged) || dealt; }
            if (x.shieldUse?.all && e.shieldUsed && dealt && tgt.hp > 0) { const add = Math.max(1, Math.round(soften(e.shieldUsed, st(tgt, "res")) * (charged ? 2 : 1))); hurt(tgt, add, e.notes); e.hits.push({ dmg: add }); e.notes.push(`シールド ${e.shieldUsed} を 凝縮して ${add}`); }
            if (x.clear && dealt && tgt.hp > 0) { clearDebuffs(tgt); if (e.popped) e.notes.push(`デバフが ${e.popped} つ はじけた！`); }
            if (x.consume && dealt && e.consumed && tgt.fx[x.consume]) { delete tgt.fx[x.consume]; e.notes.push(`${EFFECTS[x.consume].label}がはじけた！`); if (e.consumed.burst && tgt.hp > 0) { const b = e.consumed.burst * (charged ? 2 : 1); hurt(tgt, b, e.notes); e.notes.push(`残りの${EFFECTS[x.consume].label}が一度に回って ${b}`); e.burst = b; } }
            if (dealt) { hitSet.add(T); anyD = true; }
            }
            tgt = tgt0; dealt = anyD || d0;
            landed = dealt;
          } else if (x.t === "fx") {
            if (x.once) { if (me.onceUsed[sk.id]) continue; me.onceUsed[sk.id] = true; }
            // aoe：相手 全員（ダメージの 技は 当たった 相手・ない 技は 1 匹ずつ 当たりを 決める）・team：味方 全員
            const T0 = x.who === "me" ? me : x.who === "ally" ? allyOf(me, x.notSelf) : tgt;
            const fxTs = x.who === "foe" && x.aoe && !self ? F.filter((g) => g.side !== me.side && g.hp > 0) : x.who === "ally" && x.team ? F.filter((g) => g.side === me.side && g.hp > 0) : [T0];
            for (const t of fxTs) {
            if (!t) continue;
            if (x.who === "foe" && t.hp <= 0) continue;
            if (x.who === "foe" && !(x.aoe && t !== tgt ? (hasT(id, "dmg") ? hitSet?.has(t) : R() < accOf(t)) : landed)) continue;
            if (x.ifTag && !e.tags.includes(x.ifTag)) continue;
            if (x.ifSpent != null && spent < x.ifSpent) continue;
            const elseFx = () => { if (x.elseFx && t.hp > 0 && addFx(t, x.elseFx.id, { amt: x.elseFx.amt, turns: x.elseFx.turns }, e.notes, me)) e.tags.push(x.elseFx.id); };   // ひつじを 数える：眠らなければ 疲労
            const ch = x.chance ? Math.min(1, x.chance + (me.P.fxChanceAdd?.[x.id] || 0)) : 0;
            if (ch && R() > ch) { if (x.who === "foe") e.notes.push(`${t.name} は${sk.id === "banana" ? "転ばなかった" : "平気だった"}`); elseFx(); continue; }
            if (x.atLeast && amt(t, x.atLeast.id) < x.atLeast.n) continue;
            if (x.ifConsumed != null && !(e.consumed && dealt && (EFFECTS[e.consumed.id].dur !== "stack" || e.consumed.amt >= x.ifConsumed))) continue;
            if (x.ifCrit && !e.critHit) continue;
            const src = EFFECTS[x.id].src ? st(me, EFFECTS[x.id].src) : undefined;
            let am = x.id === "stun" && sk.id === "banana" ? "banana" : x.amt, tu = x.turns;
            if (x.amtBy) { am = x.amtBy.ofHp ? Math.round(me.maxHp * byOf(x.amtBy, 0)) : byOf(x.amtBy, am || 0); if (!am) continue; }
            if (x.amtFoeFx) { am = Math.floor(amt(tgt, x.amtFoeFx.id) / x.amtFoeFx.div); if (!am) continue; }   // 接ぎ木：相手の 状態の 量から
            if (x.turnsBy) tu = byOf(x.turnsBy, tu || 0);
            const times = x.perHit ? Math.max(1, (e.hits || []).filter((h) => !h.miss && !h.blocked && h.dmg > 0).length) : 1;   // perHit：当たる たびに 付ける（カチカチ。鹿さんの 決め 2026-11-02）
            let ok = false; for (let k = 0; k < times; k++) ok = addFx(t, x.id, { amt: am, turns: tu, src }, e.notes, me) || ok;
            if (ok) { e.tags.push(x.id); if (x.who === "ally" && me.P.allyBuffShield && EFFECTS[x.id].buff) addFx(t, "shield", { amt: Math.round(t.maxHp * me.P.allyBuffShield) }, e.notes, me); }   // 貝がらの おまけ
            else elseFx();
            }
          } else if (x.t === "heal") { for (const ht of x.team ? F.filter((g) => g.side === me.side && g.hp > 0) : [x.who === "ally" ? allyOf(me) : me]) { const a = heal(ht, ht.maxHp * x.pct * (me.P.healMul || 1) * pMul(me, "healMul", foe, id), e.notes); if (a > 0) e.heal += a;
            if (a > 0 && me.P.healShield) addFx(ht, "shield", { amt: Math.max(1, Math.round(a * me.P.healShield)) }, e.notes, me);   // つめたい手当て
            if (a > 0 && me.P.healHit && foe.hp > 0) { const d = Math.max(1, Math.round(a * me.P.healHit * (charged ? 2 : 1))); hurt(foe, d, e.notes); e.healHit = (e.healHit || 0) + d; e.notes.push(`${foe.name} はくやしがって ${d} のダメージ`); } } }
          else if (x.t === "cure" && (x.who === "ally" || x.team || x.n)) {   // 味方の 浄化・n こだけ（解析ツリー）
            const most = () => F.filter((g) => g.side === me.side && g.hp > 0).sort((a, b) => debuffs(b).length - debuffs(a).length)[0] || me;
            for (const ct of x.team ? F.filter((g) => g.side === me.side && g.hp > 0) : [x.who === "ally" ? most() : me]) if (cureN(ct, x.n, e.notes)) e.tags.push("cure");
          }
          else if (x.t === "cure") { const n = debuffs(me).length; if (me.fx.sleep) wake(me, e.notes); clearDebuffs(me); if (n) { e.notes.push(`${me.name} のデバフが消えた`); e.tags.push("cure"); } }
          else if (x.t === "dispel") {   // 除去（ifTag：その 状態が 付いた ときだけ・ifShield：シールドを 使った ときだけ・only：その 名前で 始まる バフだけ・gainIf：消せたら カウント）
            if (!landed || tgt.hp <= 0 || (x.ifTag && !e.tags.includes(x.ifTag)) || (x.ifShield && !e.shieldUsed)) continue;
            let n = x.n, k = 0; for (const id2 of buffs(tgt).filter((b) => !x.only || b.startsWith(x.only)).sort((a, b) => DISPEL_FIRST.indexOf(b) - DISPEL_FIRST.indexOf(a))) if (n > 0 && !EFFECTS[id2].stance) { delete tgt.fx[id2]; n--; k++; }
            if (k && me.P.dispelMp) me.mp = Math.min(me.maxMp, me.mp + me.P.dispelMp * k);   // 仲介料
            if (k) { e.notes.push(`${tgt.name} のバフが消えた`); buffGone(tgt, k, e.notes); if (x.gainIf) cntAdd(me, x.gainIf.c, x.gainIf.n * k); } e.tags.push("dispel");
          }
          else if (x.t === "steal") {                                                             // 集荷：相手の バフを 取り上げて 味方へ（ソロは 自分）
            if (!landed || tgt.hp <= 0) continue; const to = allyOf(me); let n = x.n, k = 0;
            for (const id2 of buffs(tgt).sort((a, b) => DISPEL_FIRST.indexOf(b) - DISPEL_FIRST.indexOf(a))) if (n > 0 && !EFFECTS[id2].stance) {
              const v = tgt.fx[id2]; delete tgt.fx[id2]; n--; k++;
              to.fx[id2] = to.fx[id2] && typeof v.amt === "number" && typeof to.fx[id2].amt === "number" ? { ...to.fx[id2], amt: to.fx[id2].amt + v.amt } : { ...v, fresh: true };
              e.notes.push(`${tgt.name} の ${EFFECTS[id2].label}を 取り上げた`);
            }
            if (k) buffGone(tgt, k, e.notes); e.tags.push("steal");
          }
          else if (x.t === "mp") me.mp = Math.min(me.maxMp, me.mp + x.n);
          else if (x.t === "revive") { const d = F.find((g) => g.side === me.side && g !== me && g.hp <= 0); if (d) { d.hp = Math.max(1, Math.round(d.maxHp * x.pct)); d.fx = {}; e.notes.push(`${d.name} が 起きた`); e.tags.push("revive"); } }   // 起こす（クローラーの 蘇生アンプル：力つきた 味方を 戦いの 中でも。鹿さんの 決め）
          else if (x.t === "fixed") { if (tgt.hp <= 0) continue; const d = x.n; hurt(tgt, d, e.notes); e.hits.push({ dmg: d }); dealt = true; }   // 爆弾：守りで へらない 固定の ダメージ
          else if (x.t === "mpDrain") { if (!landed) continue; const n = Math.min(tgt.mp, x.n); tgt.mp -= n; if (n) e.notes.push(`${tgt.name} の MP が ${n} 減った`); }
          else if (x.t === "mpCut") { if (!landed) continue; const n = Math.min(tgt.mp, Math.round(tgt.maxMp * x.pct)); tgt.mp -= n; if (n) e.notes.push(`${tgt.name} の MP が ${n} 減った`); }   // ジャミング
          else if (x.t === "shield") for (const sh of x.team ? F.filter((g) => g.side === me.side && g.hp > 0) : [x.who === "ally" ? allyOf(me) : me]) { addFx(sh, "shield", { amt: Math.round(sh.maxHp * x.pct * (me.P.shieldMul || 1)) }, e.notes, me); e.tags.push("shield"); if (x.who === "ally" && me.P.allyBuffShield) addFx(sh, "shield", { amt: Math.round(sh.maxHp * me.P.allyBuffShield) }, e.notes, me); }
          else if (x.t === "slow") me.slow = true;
          else if (x.t === "pin") { if (!landed) continue; if (x.chance && R() > x.chance) { e.notes.push(`${tgt.name} はふりほどいた`); continue; } tgt.pinned = x.turns; me.pinning = x.turns; tgt.pinPct = x.pct * (me.P.pinMul || 1); e.tags.push("pin"); }
          else if (x.t === "again") { me.again = true; e.notes.push(`${me.name} は もう 1 回 動く！`); }
          else if (x.t === "swapUps") swapUps(me, e.notes);
          else if (x.t === "flex") flex(me, tgt, landed, e);
          else if (x.t === "cycle") {   // 走りまわる・しっぽを ふる：使う たびに 順番で 上昇が 切り替わり、合わせた 状態を 付ける（鹿さんの 決め 2026-11-02）
            me.cyc ||= {}; const ci = (me.cyc[x.key] || 0) % x.list.length; me.cyc[x.key] = ci + 1;
            const [k, who, id, n] = x.list[ci];
            if (addFx(me, `up_${k}`, { amt: x.up.amt, turns: x.up.turns }, e.notes, me)) e.tags.push(`up_${k}`);
            const t = who === "foe" ? tgt : who === "ally" ? allyOf(me) : me;
            if (t && t.hp > 0 && addFx(t, id, { amt: n, src: EFFECTS[id].src ? st(me, EFFECTS[id].src) : undefined }, e.notes, me)) e.tags.push(id);
          }
          else if (x.t === "brace") me.brace = x.pct;                                            // ぐっと こらえる：次の 自分の 番まで
          else if (x.t === "drip") { if (spent > 0) me.drip = { left: spent, pct: x.pct }; }
          else if (x.t === "chargeBonus") me.chargeBonus = byOf({ c: x.c, per: 1, add: x.per, ofHp: true, ref: x.ref }, 0);   // ステーキ：魚介 1 ごとに 次の 一撃 +5%
          else if (x.t === "pairDone") { const pd = me.P.pairDmg; if (pd) me.pairBuff = { turns: pd.turns + 1, v: (me.cnt[x.ref] || 0) >= pd.at ? pd.high : pd.v }; }   // 相性 ばつぐん
          else if (x.t === "refill") { if (me.P.refill) for (const c of ["veg", "meat", "fish"]) cntAdd(me, c, me.P.refill); }   // おかわり 自由
          else if (x.t === "bloom") {                                                             // 開花：棘と 成長を ぜんぶ 使う
            const th = me.fx.thorns?.amt || 0, gr = me.cnt.growth || 0; delete me.fx.thorns; me.cnt.growth = 0;
            const xx = { t: "dmg", pow: x.pow, stat: x.stat };
            dealt = strike(i, me, tgt, sk, xx, x.pow + th * (x.perThorns || 0), e, charged) || dealt;
            if (gr > 0 && tgt.hp > 0) { const td = gr * x.perGrowth; hurt(tgt, td, e.notes); e.hits.push({ dmg: td }); e.notes.push(`成長 ${gr} の 貫通ダメージ ${td}`); }
            if (me.P.bloomRegen) addFx(me, "regen", { amt: me.P.bloomRegen.base + me.P.bloomRegen.per * gr }, e.notes, me);
            landed = dealt;
          }
        }
        if (charged) me.chargeBonus = 0;
        // 技の あとの パッシブ：配達完了・冷却・エネルギー効率・異常なし
        if (me.P.deliverDone === id && dealt && tgt.hp > 0) { const b = buffs(tgt).filter((k) => !EFFECTS[k].stance).sort((a, c) => DISPEL_FIRST.indexOf(c) - DISPEL_FIRST.indexOf(a))[0]; if (b) { delete tgt.fx[b]; e.notes.push(`${tgt.name} の ${EFFECTS[b].label}が 消えた`); buffGone(tgt, 1, e.notes); } for (const g of F) if (g.side === me.side && g.hp > 0) addFx(g, "clarity", { turns: 1 }, e.notes, me); }
        if (me.P.afterSkillShield?.[id]) addFx(me, "shield", { amt: Math.round(me.maxHp * me.P.afterSkillShield[id]) }, e.notes, me);
        if (id === "sh_shusoku" && me.P.convergeRefund && e.shieldUsed) addFx(me, "shield", { amt: Math.max(1, Math.round(e.shieldUsed * me.P.convergeRefund)) }, e.notes, me);
        if (id === "sh_laser" && me.P.afterLaser) { addFx(me, "barrier", { amt: me.P.afterLaser.barrier }, e.notes, me); addFx(me, "shield", { amt: Math.round(me.maxHp * me.P.afterLaser.shield) }, e.notes, me); }
        if (boosted) me.boostOn = false;
        me.hitLast = dealt; me.lastKind = sk.kind; me.lastActTurn = turn;
        me.lastId = id; (me.usedIds ||= new Set()).add(id); me.lastTags = e.tags; me.lastTgt = dealt ? tgt : null; me.hurtSince = false; me.hitBy = null;   // 前の 番の 記録（解析ツリーの 条件）
        const hs = quiet ? null : e.hits.filter((h) => !h.miss && !h.blocked);
        if (!quiet) e.log = `${me.name} の ${e.name}！` + (e.hits.length ? (hs.length ? ` ${tgt.name} に ${hs.map((h) => h.dmg).join(" + ")}${hs.some((h) => h.crit) ? "（会心！）" : ""}` : e.hits.some((h) => h.blocked) ? "" : ` ${tgt.name} はよけた`) : "") + (e.heal ? ` HP +${e.heal}` : "") + (e.notes.length ? "　" + e.notes.join("　") : "");
        // 行動のあと：集中・祝福・猛毒
        if (me.hp > 0 && me.fx.focus) me.mp = Math.min(me.maxMp, me.mp + Math.round(me.maxMp * 0.2));
        if (me.hp > 0 && me.fx.blessing) { const a = heal(me, me.maxHp * 0.2, e.notes); if (a > 0) e.heal += a; }
        if (me.hp > 0 && me.fx.venom) { const its = []; dot(me, me.maxHp * 0.2, "猛毒", its, i, e.notes); if (its[0]) e.venom = its[0].dmg; }
      }
      const last = !(rep === 0 && me.again && me.hp > 0 && alive(0).length && alive(1).length);
      if (last) {
        if (me.pinning) me.pinning--; if (me.pinned) me.pinned--;
        // 手番のおわり：持続ターンを 1 減らす（自分の番に自分へ付けたものは、次の自分の番まで残す）。切れた バフは エネルギー回収・眠りが 切れたら ぴったり 起きる
        let gone = 0;
        for (const [id2, x] of Object.entries(me.fx)) { if (x.turns == null) continue; if (x.fresh) { x.fresh = false; continue; } if (--x.turns <= 0) { if (id2 === "sleep") wake(me, e.notes); else { delete me.fx[id2]; if (isBuff(id2) && id2 !== "shield" && !EFFECTS[id2].stance) gone++; } } }
        buffGone(me, gone, e.notes);
        if (me.hp > 0) {   // 手番の おわりの カウント：夜に 光る・根っこが 太い
          for (const [c, n] of Object.entries(me.P.cntTurnEnd || {})) cntAdd(me, c, n);
          if (me.P.wardNutrient && me.fx.ward) cntAdd(me, "nutrient", me.P.wardNutrient);
          if (me.pairBuff?.turns > 0) me.pairBuff.turns--;
        }
      }
      moodCheck(me, foe, e.notes); if (foe) moodCheck(foe, me, e.notes);
      if (!quiet) ev.push({ ...e, after: snap() });
      if (last) break;
      }
    }
  }
  if (simFrom >= 0) for (let k = simFrom; k < ev.length; k++) ev[k].sim = true;
  const ratio = (s) => { const g = F.filter((f) => f.side === s); return g.reduce((a, f) => a + f.hp, 0) / g.reduce((a, f) => a + f.maxHp, 0); };
  const r0 = ratio(0), r1 = ratio(1), winner = r0 === r1 ? (R() < 0.5 ? 0 : 1) : r0 > r1 ? 0 : 1;   // SIM_TURN でも決着がつかなければ HP の割合（パーティは合計で）
  const ko = !alive(0).length || !alive(1).length;
  const upset = winner === weak && gap >= 1.2, reward = !upset ? 3 : gap >= 1.5 ? 9 : 6;
  // 持ちこし（ダンジョン）：その場の構え（防御・カウンター）と、パッシブ・装備の「戦いのはじめに」の効果は解ける
  const carry = F.map((f) => Object.fromEntries(Object.entries(f.fx).filter(([id, x]) => !EFFECTS[id].stance && !x.perm).map(([id, x]) => [id, { ...x, fresh: false }])));
  ev.push({ type: "end", winner, upset, reward, ko: !alive(1 - winner).length, timeout: !ko, turns: lastTurn, overtime: lastTurn > MAX_TURN, carry, final: snap(), ...(used.cure || used.revive ? { used } : {}), ...(Object.keys(itemsUsed).length ? { items: itemsUsed } : {}) });
  return ev;
}
