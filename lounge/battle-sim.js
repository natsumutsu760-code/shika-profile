// ペットのバトルの計算（試作 3）。simulate(a, b, seed) が「何が起きたか」の一覧を返す。同じ種なら毎回同じ結果
// 技（ATK・相手の DEF で受ける）とイタズラ（INT・相手の RES で受ける）
// 形：1 ターンに 1 回ずつ交代に動く（AGI の高い方が先。「かならず先に動く」技はその前）
// 動き方：ガンビット（上から順に「条件 → 技」）→ どれにも当てはまらなければオートの作戦
// バフ・デバフ（状態）は effects.js の決まりで重なる（量・持続ターン・上限・相殺）。技とパッシブの中身は skills.js。数字はすべて仮
import { SKILL } from "./skills.js";
import { itemStats, itemPower, baseOf, hasFx } from "./equip.js";
import { EFFECTS, PAIR, isBuff } from "./effects.js";

export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 続きから 使える 乱数（いまの 位置を o[k] に しまう。rng と 同じ 並び。派遣を 少しずつ 計算する ときに 使う）
export function rngIn(o, k) { o[k] >>>= 0; return () => { const s = (o[k] = (o[k] + 0x6D2B79F5) >>> 0); let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 画面に出すのは 8 ターンまで。決着がつかなければ、そのまま計算だけで続ける（9 ターン目からの出来事には sim: true が付く。鹿さんの決め、2026-10-20）
// 計算で進めるのは SIM_TURN まで。それでも決着しなければ、そのときだけ HP の割合で決める
export const MAX_TURN = 8, SIM_TURN = 30;
const STATS = ["atk", "def", "int", "res", "agi", "dex", "luk"];
export const powerOf = (s) => s.hp / 4 + s.mp / 2 + STATS.reduce((a, k) => a + s[k], 0);   // 強さの目安（下克上の判定用）

// パッシブの 中身を 足す（一覧は つなぐ・表は まぜる・Mul は かける・数は 足す）
function addP(P, p) { for (const [k, v] of Object.entries(p || {})) P[k] = Array.isArray(v) ? [...(P[k] || []), ...v] : v && typeof v === "object" ? { ...(P[k] || {}), ...v } : /Mul$/.test(k) ? (P[k] || 1) * v : typeof v === "number" ? (P[k] || 0) + v : v; }
function passives(ids) {
  const P = {};
  for (const id of ids || []) addP(P, SKILL[id]?.p);
  return P;
}

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
      else P[k] = (P[k] || 0) + v;                                                                 // wazaDmg・itazuraDmg・critDmg・dmgCut・drain・statusRes
    }
    if (hasFx(it)) addP(P, baseOf(it.base).fxp);                                                  // 上の装備の とくべつな効果・ミシックの 効果
    bonus += itemPower(it);
  }
  return { s, P, bonus };
}

function makeFighter(c, side) {
  const { s, P, bonus } = withEquip(c);
  const base = { atk: s.atk * (P.atkMul || 1), def: s.def * (P.defMul || 1), int: s.int * (P.intMul || 1), res: s.res * (P.resMul || 1), agi: s.agi * (P.agiMul || 1), dex: s.dex * (P.dexMul || 1), luk: s.luk };
  const maxHp = Math.round(s.hp * (P.hpMul || 1));
  // startHp・startMp・startFx：ダンジョンで続けて戦うとき、前の戦いの残りから始める
  return { c, name: c.name, P, base, maxHp, hp: Math.min(maxHp, c.startHp ?? maxHp), maxMp: s.mp, mp: Math.min(s.mp, c.startMp ?? s.mp), power: powerOf(c.stats) + bonus,
    side, fx: structuredClone(c.startFx || {}), boss: !!c.boss, slow: false, pinned: 0, pinning: 0, pinPct: 0, revived: false, hitLast: false, lastKind: null, dot: 0 };
}

// ---------- 状態 ----------
const amt = (f, id) => f.fx[id]?.amt || 0;
const debuffs = (f) => Object.keys(f.fx).filter((id) => !isBuff(id));
const buffs = (f) => Object.keys(f.fx).filter((id) => isBuff(id));
const rollTurns = (R, b) => (Array.isArray(b) ? b[0] + Math.floor(R() * (b[1] - b[0] + 1)) : b);
const halve = (f, id) => { const x = f.fx[id]; if (!x) return; if (x.turns == null) { x.amt = Math.floor(x.amt / 2); if (x.amt <= 0) delete f.fx[id]; } };

// ステータス（能力変化・疲労・HP が減ったときのパッシブを込み）
function st(f, k) {
  let v = f.base[k] * Math.max(0, 1 + Math.min(0.9, amt(f, `up_${k}`) / 100) - Math.min(0.9, amt(f, `down_${k}`) / 100));
  if (k === "agi" && f.fx.fatigue) v *= 0.5;
  if (k === "atk" && f.P.lowHpAtk && f.hp <= f.maxHp * 0.3) v *= 1 + f.P.lowHpAtk;
  if ((k === "def" || k === "res") && f.P.lowHpDef && f.hp <= f.maxHp * 0.5) v *= 1 + f.P.lowHpDef;
  return v;
}
const hpPct = (f) => (f.hp / f.maxHp) * 100;
// 継続ダメージを DEF や RES で減らす（直接ダメージの式と同じ 0.6 乗）
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
  first: (me, foe, v, turn) => turn === 1, every: (me, foe, v, turn) => turn % v === 0, after: (me, foe, v, turn) => turn > v, always: () => true,
};
export const COND_TEXT = {
  hpBelow: (v) => `自分の HP が ${v}% より少ない`, hpAbove: (v) => `自分の HP が ${v}% より多い`, mpAtLeast: (v) => `自分の MP が ${v} 以上`, mpBelow: (v) => `自分の MP が ${v} より少ない`,
  debuffed: () => "自分にデバフがある", notBuffed: () => "自分にバフがない", foeHpBelow: (v) => `相手の HP が ${v}% より少ない`, foeHpAbove: (v) => `相手の HP が ${v}% より多い`,
  foeBuffed: () => "相手にバフがある", foeMpBelow: (v) => `相手の MP が ${v} より少ない`, foeDebuffs: (v) => `相手のデバフが ${v} つ以上`, foeHas: (v) => `相手が${EFFECTS[v].label}`, foeNotHas: (v) => `相手が${EFFECTS[v].label}でない`, selfHas: (v) => `自分が${EFFECTS[v].label}`, selfNotHas: (v) => `自分が${EFFECTS[v].label}でない`, foeUsedPrank: () => "相手が前の番にイタズラをした", foeStronger: () => "相手の方が強い",
  first: () => "最初のターン", every: (v) => `${v} ターンごと`, after: (v) => `${v} ターン目より後`, always: () => "いつでも",
};
const mpCost = (me, id) => (me.fx.activation ? Math.ceil(SKILL[id].mp / 2) : SKILL[id].mp);
const usable = (me, id) => SKILL[id] && me.mp >= mpCost(me, id) && (!me.fx.silence || id === "kogeki");
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
function choose(me, foe, turn, R) {
  if (me.fx.silence) return { id: "kogeki", by: "auto" };
  if (me.fx.frenzy || me.fx.confusion) {                                                           // 狂乱・混乱：でたらめな技
    const all = [...me.c.set, "kogeki"].filter((id) => usable(me, id));
    return { id: all[Math.floor(R() * all.length)] || "kogeki", by: "auto", wild: true };
  }
  for (let i = 0; i < (me.c.gambits || []).length; i++) {
    const g = me.c.gambits[i]; if (g.on === false) continue;
    const [k, v] = g.if; if (!COND[k](me, foe, v, turn)) continue;
    if (!(me.c.set.includes(g.do) || SKILL[g.do].type === null) || !usable(me, g.do)) continue;   // 使えないときは次の行へ
    return { id: g.do, by: i + 1 };
  }
  return { id: auto(me, foe, turn, R), by: "auto" };
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
export function simulateTeams(SA, SB, seed, opts = {}) {
  const R = rng(seed), F = [...SA.map((c) => makeFighter(c, 0)), ...SB.map((c) => makeFighter(c, 1))], ev = [], duel = F.length === 2, quiet = !!opts.quiet;
  const sideP = [0, 1].map((s) => F.filter((f) => f.side === s).reduce((a, f) => a + f.power, 0));
  const weak = sideP[0] < sideP[1] ? 0 : 1, gap = sideP[1 - weak] / sideP[weak];
  // 弱い方に「がんばり」（1 対 1 で、強さの差が 5% 以上）：差が大きいほど、受けるダメージが減り（最大 −35%）、会心が出やすい（最大 +15%）
  const gIdx = duel && gap >= 1.05 && !opts.pve ? weak : -1, gGuard = Math.min(0.35, (gap - 1) * 0.9), gCrit = Math.min(0.15, (gap - 1) * 0.4);
  const ganbari = (f) => gIdx === f.side && !f.fx.curse;
  const alive = (s) => F.filter((f) => f.side === s && f.hp > 0);
  const targetOf = (me) => { let t = null; for (const f of F) if (f.side !== me.side && f.hp > 0 && (!t || f.hp < t.hp)) t = f; return t; };
  const fxList = (f) => Object.entries(f.fx).map(([id, x]) => ({ id, amt: typeof x.amt === "number" ? x.amt : null, turns: x.turns ?? null }));
  const snap = () => F.map((f) => ({ hp: f.hp, mp: f.mp, fx: fxList(f), up: buffs(f).some((id) => !EFFECTS[id].stance), down: debuffs(f).length > 0 }));

  // 状態を付ける：耐性（装備 → 免疫 − 衰弱）・ボス・相殺と上書き・量とターンの足し方
  function addFx(t, id, o, notes, from) {
    const D = EFFECTS[id]; if (!D || D.unused) return false;
    if (!D.buff) {
      if (t.boss && D.boss === "immune") { notes.push(`${t.name} に${D.label}は効かない`); return false; }
      if (t.P.noFx?.[id] && from !== t) { notes.push(`${t.name} は${D.label}に ならない`); return false; }   // ねむりがお など（自分で 付けた 物は とめない）
      const pr = 1 - ((from && from !== t && from.P.pierceRes) || 0);                              // いたずらの天才：耐性と免疫を半分だけ無視
      if (t.P.statusRes && R() < (t.P.statusRes / 100) * pr) { notes.push(`${t.name} は${D.label}を防いだ`); return false; }
      if (t.P.resistFx?.[id] && R() < (t.P.resistFx[id] / 100) * pr) { notes.push(`${t.name} は${D.label}に強い`); return false; }
      const imm = (Math.min(95, Math.max(0, amt(t, "immunity") - amt(t, "weakness"))) / 100) * pr;
      if (imm && R() < imm) { notes.push(`${t.name} は免疫で${D.label}を防いだ`); return false; }
    }
    let a = typeof o.amt === "number" ? o.amt : 1, turns = o.turns ?? rollTurns(R, D.base);
    if (from && from !== t && from.P.fxAmtAdd?.[id] && D.dur === "stack") a += from.P.fxAmtAdd[id];
    if (from?.P.fxAmtMul?.[id]) a = Math.round(a * from.P.fxAmtMul[id]);
    if (id === "barrier" && from === t && t.P.barrierPlus) a += t.P.barrierPlus;
    if (turns != null && !D.buff && from && from !== t && from.P.extendDebuff) turns += from.P.extendDebuff;
    if (turns != null && from && from !== t && from.P.extendIds?.[id]) turns += from.P.extendIds[id];
    if (turns != null && from === t && D.buff && D.stat && from.P.extendSelfUp) turns += from.P.extendSelfUp;
    if (turns != null && t.boss && D.boss === "half") turns = Math.max(1, Math.ceil(turns / 2));
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
    // 凍傷があるところに凍結：凍傷の量 × DEX ÷ 10 のダメージ
    if (id === "freeze" && t.fx.frostbite) { const d = Math.max(1, Math.round(soften(t.fx.frostbite.amt * (t.fx.frostbite.src || 10) / 10, st(t, "def")))); hurt(t, d, notes); notes.push(`凍傷がしみて ${d}`); }
    return true;
  }
  const clearDebuffs = (f) => { for (const id of debuffs(f)) delete f.fx[id]; };
  // はじけさせたとき：残りの継続ダメージ（1 回分 × 残りターン）
  function burstOf(f, id) {
    const x = f.fx[id]; if (!x) return 0; const t = Math.max(1, x.turns ?? 1);
    const one = id === "poison" ? f.maxHp * x.amt / 100 * (x.mul || 1) : id === "burn" ? soften((x.src || 10) * 0.1 * x.amt, st(f, "def")) : id === "sickness" ? soften((x.src || 10) * 0.2 * x.amt, st(f, "res")) : id === "frostbite" ? soften((x.src || 10) * 0.2 * x.amt * (x.mul || 1), st(f, "def")) : 0;
    return Math.round(Math.min(f.maxHp * 0.6, one * t));
  }

  // HP が減る（輪廻・あきらめない）
  function hurt(f, d, notes) {
    if (f.hp - d > 0) { f.hp -= d; return; }
    if (f.fx.reincarnation) { delete f.fx.reincarnation; f.hp = 1; notes.push(`${f.name} は輪廻で踏みとどまった！`); return; }
    if (f.P.revive && !f.revived) { f.revived = true; f.hp = Math.round(f.maxHp * f.P.revive); notes.push(`${f.name} はあきらめない！ 立ち上がった`); return; }
    f.hp = 0; f.fx = {};                                                                              // 倒れたら状態は全部消える
  }
  // 回復（腐敗ならダメージに変わる。あふれた分はオーバーヒールにためる）
  function heal(f, n, notes) {
    n = Math.round(n); if (n <= 0) return 0;
    if (f.fx.rot) { hurt(f, n, notes); notes.push(`腐敗で ${n} のダメージに変わった`); return -n; }
    const a = Math.min(f.maxHp - f.hp, n); f.hp += a;
    if (n > a && f.fx.overheal) f.fx.overheal.amt = Math.min(f.maxHp, f.fx.overheal.amt + n - a);
    return a;
  }
  // 継続ダメージ（1 ターンに受けるのは最大 HP の 40% まで）
  function dot(f, d, why, items, i, notes) {
    const room = Math.max(0, Math.round(f.maxHp * 0.4) - f.dot), x = Math.min(room, Math.max(1, Math.round(d)));
    if (x <= 0) return; f.dot += x; hurt(f, x, notes); items.push({ who: i, dmg: x, why });
  }

  // 直接攻撃 1 回：命中 → 幻影 → バリア → ダメージ → 防御 → 装甲・障壁 → 貫通 → オーバーヒール → シールド → HP（輪廻）→ カウンター・棘
  function strike(i, me, foe, sk, x, pow, e, charged) {
    const waza = sk.kind === "waza";
    const acc = x.sure ? 1 : Math.min(0.97, Math.max(0.75, 0.92 + (st(me, "dex") - st(foe, "agi")) * 0.005)) * (waza && me.fx.blind ? 0.5 : 1) * (1 - (foe.P.foeAcc || 0));   // foeAcc：暗い村のランタン
    if (R() > acc) { e.hits.push({ miss: true, dmg: 0 }); return false; }
    const ev = Math.min(0.75, amt(foe, "mirage") / 100 + (foe.P.evade || 0) + (foe.P.lowHpEvade && foe.hp <= foe.maxHp * 0.3 ? foe.P.lowHpEvade : 0));
    if (R() < ev) { e.hits.push({ miss: true, dmg: 0 }); if (foe.fx.mirage) { halve(foe, "mirage"); e.notes.push(`${foe.name} は幻影でかわした`); } return false; }
    if (foe.fx.barrier) { foe.fx.barrier.amt--; if (foe.fx.barrier.amt <= 0) delete foe.fx.barrier; e.hits.push({ dmg: 0, blocked: true }); e.notes.push(`${foe.name} のバリアが防いだ`); return false; }
    const atk = x.stat === "best" ? Math.max(st(me, "atk"), st(me, "int"), st(me, "dex")) : x.stat === "mpNow" ? me.mp * (x.statMul || 1) : x.stat === "hp" ? me.maxHp * (x.statMul || 1) : x.stat ? st(me, x.stat) * (x.statMul || 1) : waza ? st(me, "atk") : st(me, "int");   // best：ATK・INT・DEX のいちばん高いもの（こうげき）
    const grd = (waza ? st(foe, "def") : st(foe, "res")) * (1 - (x.ignore || 0));
    const critVs = Object.entries(me.P.critVsFx || {}).reduce((a, [id, v]) => a + (foe.fx[id] ? v : 0), 0);
    const crit = me.fx.clarity || foe.fx.daze || R() < 0.03 + st(me, "dex") * 0.004 + (me.P.crit || 0) + (!waza ? me.P.magicCrit || 0 : 0) + (x.critUp || 0) + critVs + (ganbari(me) ? gCrit : 0);
    const cm = crit ? 1.5 + st(me, "luk") * 0.01 + (me.P.critDmg || 0) / 100 : 1;
    let d = pow * Math.pow((atk + 10) / (grd + 10), 0.6) * cm * (0.8 + R() * 0.4);
    d *= 1 + ((waza ? me.P.wazaDmg : me.P.itazuraDmg) || 0) / 100;
    if (me.P.firstHit) { me.firstE ??= e; if (me.firstE === e) d *= 1 + me.P.firstHit; }             // 竜の いぶき：最初に 攻撃した 技（何回 当てても その技 ぜんぶ）
    if (foe.P.dmgCut) d *= 1 - foe.P.dmgCut / 100;
    if (!waza && foe.P.itazuraCut) d *= 1 - foe.P.itazuraCut;                                     // 厚着：受けるイタズラのダメージを減らす（RES を無視されても効く）
    if (charged) d *= 2;
    if (waza && me.hitLast && me.P.momentum) d *= 1 + me.P.momentum;
    if (!waza && me.P.highMpMagic && me.mp + sk.mp >= me.maxMp / 2) d *= 1 + me.P.highMpMagic;
    if (me.P.perDebuff) d *= 1 + Math.min(0.3, me.P.perDebuff * debuffs(foe).length);
    if (x.execute && foe.hp <= foe.maxHp * x.execute) d *= 2;
    if (waza && me.P.vsLowHp && foe.hp <= foe.maxHp * 0.5) d *= 1 + me.P.vsLowHp;
    const vsFx = Math.max(0, ...Object.entries(me.P.vsFx || {}).map(([id, v]) => (foe.fx[id] ? v : 0))); if (vsFx) d *= 1 + vsFx;
    const vsSk = Math.max(0, ...Object.entries(x.vsFx || {}).map(([id, v]) => (foe.fx[id] ? v : 0))); if (vsSk) d *= 1 + vsSk;
    if (me.fx.curse) d *= 0.9;
    if (me.fx.frenzy) d *= 2;
    if (foe.fx.frenzy) d *= 1.5;
    if (foe.fx.scald) d *= 1.1;
    if (ganbari(foe)) d *= 1 - gGuard;
    if (foe.fx.guard) d *= 0.5 * (1 - (foe.P.guardBonus || 0));
    const shellId = waza ? "armor" : "ward";
    if (foe.fx[shellId]) { d *= 1 - Math.min(0.9, foe.fx[shellId].amt / 100); halve(foe, shellId); }
    // 水晶の体など（critSplit）：会心で ふえた 分は いま 受けず、ひびに して あとから 分けて 受ける
    let split = 0; if (crit && foe.P.critSplit) { split = d - d / cm; d -= split; }
    if (crit && waza && me.fx.mastery) { const m = st(me, "dex") * me.fx.mastery.amt / 100; if (foe.P.critSplit) split += m; else d += m; halve(me, "mastery"); }
    if (me.fx.pierce) { d += me.fx.pierce.amt; halve(me, "pierce"); }
    d = Math.max(1, Math.round(d));
    let rest = d;
    for (const sid of ["overheal", "shield"]) if (rest > 0 && foe.fx[sid]?.amt > 0) { const t = Math.min(rest, foe.fx[sid].amt); foe.fx[sid].amt -= t; rest -= t; e.absorbed = (e.absorbed || 0) + t; if (sid === "shield" && foe.fx.shield.amt <= 0) delete foe.fx.shield; }
    hurt(foe, rest, e.notes); e.hits.push({ dmg: d, crit });
    if (split >= 1 && foe.hp > 0) { const c = (foe.crack ||= { left: 0, per: 0 }); c.left += Math.round(split); c.per = Math.ceil(c.left / foe.P.critSplit); e.notes.push(`${foe.name} に ひびが 入った（会心の 分 ${Math.round(split)} は あとから）`); }
    // 受けたあと：凍結がとける・眠りから起きる・朦朧で気絶・カウンター・棘・吸収・反動
    if (foe.hp > 0 && foe.fx.freeze) { delete foe.fx.freeze; const p = Math.max(1, Math.round(foe.maxHp * 0.1)); hurt(foe, p, e.notes); e.notes.push(`${foe.name} の凍結がとけて ${p}`); }
    if (foe.hp > 0 && foe.fx.sleep && R() < 0.5) { delete foe.fx.sleep; e.notes.push(`${foe.name} は目をさました`); }
    if (foe.hp > 0 && foe.fx.daze && !foe.fx.stun && R() < 0.1) addFx(foe, "stun", { turns: 1 }, e.notes, me);
    // しびれ上手（paraCounterCut）：麻痺している相手のカウンターと棘は弱い
    if (foe.hp > 0 && foe.fx.counter) { const back = Math.max(1, Math.round((rest * (foe.fx.counter.amt ?? 50) / 100 + st(foe, "def") * (foe.P.counterDef || 0)) * (foe.fx.paralysis && me.P.paraCounterCut ? 1 - me.P.paraCounterCut : 1))); hurt(me, back, e.notes); e.back = (e.back || 0) + back; e.notes.push(`${foe.name} のカウンター！ ${back} 返した`); }
    if (foe.hp > 0 && foe.fx.thorns) { const t = Math.max(1, Math.round(soften(st(foe, "atk") * foe.fx.thorns.amt / 100, st(me, "def")) * (foe.fx.paralysis && me.P.paraCounterCut ? 1 - me.P.paraCounterCut : 1))); hurt(me, t, e.notes); e.thorns = (e.thorns || 0) + t; halve(foe, "thorns"); }
    if ((me.P.drain || x.drain) && me.hp > 0) { const a = heal(me, d * ((me.P.drain || 0) / 100 + (x.drain || 0)), e.notes); if (a > 0) e.drain = (e.drain || 0) + a; }
    if (crit) e.critHit = true;
    for (const [id, ch, n, tu] of me.P.onHitFx || []) if (foe.hp > 0 && R() < ch && addFx(foe, id, { amt: n, turns: tu, src: EFFECTS[id].src ? st(me, EFFECTS[id].src) : undefined }, e.notes, me)) e.tags.push(id);
    for (const [id, ch, n, tu] of foe.P.whenHitFx || []) if (me.hp > 0 && foe.hp > 0 && R() < ch) addFx(me, id, { amt: n, turns: tu, src: EFFECTS[id].src ? st(foe, EFFECTS[id].src) : undefined }, e.notes, foe);
    if (x.recoil) { const rc = Math.max(1, Math.round(d * x.recoil * (me.P.recoilMul || 1))); hurt(me, rc, e.notes); e.recoil = (e.recoil || 0) + rc; }
    return true;
  }

  if (!quiet) ev.push({ type: "start", ganbari: gIdx, gap, fighters: F.map((f) => ({ name: f.name, owner: f.c.owner, lv: f.c.lv, type: f.c.type, maxHp: f.maxHp, maxMp: f.maxMp, ...(duel ? {} : { side: f.side }) })) });
  F.forEach((f) => { for (const [id, n, tu] of f.P.startFx || []) { addFx(f, id, { amt: n, turns: tu }, [], f); if (f.fx[id]) f.fx[id].perm = true; } });   // パッシブ・装備の「戦いのはじめに」
  F.forEach((f) => { for (const [id, n, tu] of f.P.startFoeFx || []) for (const t of F.filter((g) => g.side !== f.side)) addFx(t, id, { amt: n, turns: tu }, [], f); });   // 「戦いのはじめに相手を〇〇」（相手全員）

  let lastTurn = 0, simFrom = -1;
  for (let turn = 1; turn <= SIM_TURN && alive(0).length && alive(1).length; turn++) {
    lastTurn = turn; if (turn === MAX_TURN + 1) simFrom = ev.length;
    const plan = F.map((f) => { if (f.hp <= 0) return null; const tgt = targetOf(f); return { ...choose(f, tgt, turn, R), tgt }; });
    const speed = F.map((f, i) => (f.hp <= 0 ? -Infinity : (SKILL[plan[i].id].first ? 1000 : 0) + (turn === 1 && f.P.firstStrike ? 500 : 0) + (f.slow ? -1000 : 0) + st(f, "agi") * (0.9 + R() * 0.2)));
    F.forEach((f) => (f.slow = false));
    const order = F.map((_, i) => i).sort((a, b) => (speed[b] - speed[a]) || 0);   // 同じ速さなら番号の小さい方が先
    for (const i of order) {
      const me = F[i];
      if (!alive(0).length || !alive(1).length) break;
      if (me.hp <= 0) continue;
      const foe = plan[i].tgt.hp > 0 ? plan[i].tgt : targetOf(me);                                  // ねらっていた相手が倒れていたら、ねらいなおす
      // 手番のはじめ：再生・毎ターンのパッシブ・毒・炎上・体調不良・凍傷・疲労・おさえこみ
      me.dot = 0;
      const tick = { type: "tick", turn, who: i, items: [] }, tn = [];
      if (me.fx.regen) { const a = heal(me, me.maxHp * me.fx.regen.amt / 100, tn); if (a) tick.items.push({ who: i, heal: a, why: "再生" }); halve(me, "regen"); }
      if (me.P.hpRegen) { const a = heal(me, me.maxHp * me.P.hpRegen, tn); if (a) tick.items.push({ who: i, heal: a }); }
      if (me.P.mpRegen) { me.mpAcc = (me.mpAcc || 0) + me.P.mpRegen; const g = Math.floor(me.mpAcc + 1e-9); if (g) { me.mpAcc -= g; me.mp = Math.min(me.maxMp, me.mp + g); } }   // 0.5 なら 2 ターンごとに +1
      if (me.P.bellMp && turn % (me.P.bellEvery || 3) === 0) me.mp = Math.min(me.maxMp, me.mp + me.P.bellMp);   // 夜ふけの鐘
      if (me.fx.poison) dot(me, me.maxHp * me.fx.poison.amt / 100 * (me.fx.poison.mul || 1), "毒", tick.items, i, tn);
      if (me.fx.burn) { dot(me, soften((me.fx.burn.src || 10) * 0.1 * me.fx.burn.amt, st(me, "def")) * (me.fx.scald ? 1.5 : 1), "炎上", tick.items, i, tn); if (me.hp > 0 && R() < 0.3) addFx(me, "scald", {}, tn, null); }
      if (me.fx.sickness) { dot(me, soften((me.fx.sickness.src || 10) * 0.2 * me.fx.sickness.amt, st(me, "res")), "体調不良", tick.items, i, tn); if (me.hp > 0 && R() < 0.3) addFx(me, "fatigue", {}, tn, null); }
      if (me.fx.frostbite) dot(me, soften((me.fx.frostbite.src || 10) * 0.2 * me.fx.frostbite.amt * (me.fx.frostbite.mul || 1), st(me, "def")), "凍傷", tick.items, i, tn);
      if (me.fx.fatigue) me.mp = Math.max(0, me.mp - Math.round(me.maxMp * 0.1));
      if (me.pinned && me.pinPct) dot(me, me.maxHp * me.pinPct, "おさえこみ", tick.items, i, tn);
      for (const [id, ch, tu] of me.P.auraFx || []) if (me.hp > 0 && R() < ch && addFx(foe, id, { turns: tu }, tn, me)) tn.push(`${foe.name} は${EFFECTS[id].label}になった`);
      if (me.crack?.left > 0) { const c = me.crack, k = Math.min(c.left, c.per); c.left -= k; hurt(me, k, tn); tick.items.push({ who: i, dmg: k, why: "ひび" }); }   // 40% の 上限は かけない（もとは 直接の ダメージ）
      if (!quiet && (tick.items.length || tn.length)) { tick.notes = tn; tick.after = snap(); ev.push(tick); }
      if (me.hp <= 0) continue;

      const e = { type: "act", who: i, turn, by: plan[i].by, notes: [], ...(duel ? {} : { tgt: F.indexOf(foe) }) };
      // 動けないとき：凍結 → 気絶 → 眠り → 麻痺 → おさえこみ
      const skip = me.fx.freeze ? "凍っていて動けない" : me.fx.stun ? (me.fx.stun.amt === "banana" ? "バナナの皮で転んだ！" : "気絶している") : me.fx.sleep ? "寝ている"
        : me.fx.paralysis && R() < Math.min(0.5, me.fx.paralysis.amt * 0.005) ? "しびれて動けない" : me.pinning ? "おさえこんでいる" : me.pinned ? "おさえこまれて動けない" : null;
      if (skip) Object.assign(e, { skill: null, name: skip, kind: "skip", log: `${me.name} は ${skip}` });
      else {
        let id = plan[i].id;
        if (me.fx.rot && hasT(id, "heal")) { const p2 = choose(me, foe, turn, R); id = p2.id; e.by = p2.by; }   // 動く前に腐敗にされたら、回復をやめて選びなおす
        if (!usable(me, id)) { id = "kogeki"; e.by = "auto"; }
        const sk = SKILL[id], cost = mpCost(me, id); me.mp -= cost;
        // 混乱：半分の確率で自分に使ってしまう
        const self = !!me.fx.confusion && R() < 0.5, tgt = self ? me : foe;
        Object.assign(e, { skill: id, name: sk.name, kind: sk.kind, mp: cost, hits: [], heal: 0, tags: [], wild: !!plan[i].wild, self });
        if (self) e.notes.push(`${me.name} は混乱して自分に使った`);
        let landed = true;
        if (!hasT(id, "dmg") && giveFoe(id)) {                                                    // ダメージのないイタズラも当たるか決める
          const acc = Math.min(0.97, Math.max(0.75, 0.92 + (st(me, "dex") - st(tgt, "agi")) * 0.005)) * (1 - (tgt.P.foeAcc || 0));
          landed = R() < acc; if (!landed) e.notes.push(`${tgt.name} はよけた`);
        }
        let dealt = false;
        const charged = !!me.fx.charge && hasT(id, "dmg"); if (charged) delete me.fx.charge;
        for (const x of sk.fx) {
          if (x.t === "dmg") {
            let hits = x.hits || 1, pow = x.pow + (x.perDebuff || 0) * debuffs(tgt).length;
            if (x.consume) { const c = tgt.fx[x.consume]; e.consumed = c ? { id: x.consume, amt: typeof c.amt === "number" ? c.amt : 0, turns: c.turns ?? 0, burst: x.burst ? burstOf(tgt, x.consume) : 0 } : null; if (c) pow += (x.perAmt || 0) * e.consumed.amt + (x.perTurn || 0) * e.consumed.turns; }
            if (me.fx.haste && hits > 1) { const n = hits + 1 + Math.floor(R() * 3); pow = (pow * hits) / n; hits = n; }
            if (x.perDebuff) e.popped = debuffs(tgt).length;
            for (let h = 0; h < hits && tgt.hp > 0; h++) dealt = strike(i, me, tgt, sk, x, pow, e, charged) || dealt;
            if (x.clear && dealt && tgt.hp > 0) { clearDebuffs(tgt); if (e.popped) e.notes.push(`デバフが ${e.popped} つ はじけた！`); }
            if (x.consume && dealt && e.consumed && tgt.fx[x.consume]) { delete tgt.fx[x.consume]; e.notes.push(`${EFFECTS[x.consume].label}がはじけた！`); if (e.consumed.burst && tgt.hp > 0) { hurt(tgt, e.consumed.burst, e.notes); e.notes.push(`残りの${EFFECTS[x.consume].label}が一度に回って ${e.consumed.burst}`); e.burst = e.consumed.burst; } }
            landed = dealt;
          } else if (x.t === "fx") {
            const t = x.who === "me" ? me : tgt;
            if (x.who === "foe" && (!landed || t.hp <= 0)) continue;
            if (x.chance && R() > x.chance) { if (x.who === "foe") e.notes.push(`${t.name} は${sk.id === "banana" ? "転ばなかった" : "平気だった"}`); continue; }
            if (x.atLeast && amt(t, x.atLeast.id) < x.atLeast.n) continue;
            if (x.ifConsumed != null && !(e.consumed && dealt && (EFFECTS[e.consumed.id].dur !== "stack" || e.consumed.amt >= x.ifConsumed))) continue;
            if (x.ifCrit && !e.critHit) continue;
            const src = EFFECTS[x.id].src ? st(me, EFFECTS[x.id].src) : undefined;
            const ok = addFx(t, x.id, { amt: x.id === "stun" && sk.id === "banana" ? "banana" : x.amt, turns: x.turns, src }, e.notes, me);
            if (ok) e.tags.push(x.id);
          } else if (x.t === "heal") { const a = heal(me, me.maxHp * x.pct * (me.P.healMul || 1), e.notes); if (a > 0) e.heal += a;
            if (a > 0 && me.P.healHit && foe.hp > 0) { const d = Math.max(1, Math.round(a * me.P.healHit)); hurt(foe, d, e.notes); e.healHit = (e.healHit || 0) + d; e.notes.push(`${foe.name} はくやしがって ${d} のダメージ`); } }
          else if (x.t === "cure") { const n = debuffs(me).length; clearDebuffs(me); if (n) { e.notes.push(`${me.name} のデバフが消えた`); e.tags.push("cure"); } }
          else if (x.t === "dispel") { if (!landed) continue; let n = x.n, k = 0; for (const id2 of buffs(tgt).sort((a, b) => DISPEL_FIRST.indexOf(b) - DISPEL_FIRST.indexOf(a))) if (n > 0 && !EFFECTS[id2].stance) { delete tgt.fx[id2]; n--; k++; } if (k) e.notes.push(`${tgt.name} のバフが消えた`); e.tags.push("dispel"); }
          else if (x.t === "mp") me.mp = Math.min(me.maxMp, me.mp + x.n);
          else if (x.t === "mpDrain") { if (!landed) continue; const n = Math.min(tgt.mp, x.n); tgt.mp -= n; if (n) e.notes.push(`${tgt.name} の MP が ${n} 減った`); }
          else if (x.t === "shield") { addFx(me, "shield", { amt: Math.round(me.maxHp * x.pct * (me.P.shieldMul || 1)) }, e.notes, me); e.tags.push("shield"); }
          else if (x.t === "slow") me.slow = true;
          else if (x.t === "pin") { if (!landed) continue; if (x.chance && R() > x.chance) { e.notes.push(`${tgt.name} はふりほどいた`); continue; } tgt.pinned = x.turns; me.pinning = x.turns; tgt.pinPct = x.pct * (me.P.pinMul || 1); e.tags.push("pin"); }
        }
        me.hitLast = dealt; me.lastKind = sk.kind;
        const hs = quiet ? null : e.hits.filter((h) => !h.miss && !h.blocked);
        if (!quiet) e.log = `${me.name} の ${sk.name}！` + (e.hits.length ? (hs.length ? ` ${tgt.name} に ${hs.map((h) => h.dmg).join(" + ")}${hs.some((h) => h.crit) ? "（会心！）" : ""}` : e.hits.some((h) => h.blocked) ? "" : ` ${tgt.name} はよけた`) : "") + (e.heal ? ` HP +${e.heal}` : "") + (e.notes.length ? "　" + e.notes.join("　") : "");
        // 行動のあと：集中・祝福・猛毒
        if (me.hp > 0 && me.fx.focus) me.mp = Math.min(me.maxMp, me.mp + Math.round(me.maxMp * 0.2));
        if (me.hp > 0 && me.fx.blessing) { const a = heal(me, me.maxHp * 0.2, e.notes); if (a > 0) e.heal += a; }
        if (me.hp > 0 && me.fx.venom) { const its = []; dot(me, me.maxHp * 0.2, "猛毒", its, i, e.notes); if (its[0]) e.venom = its[0].dmg; }
      }
      if (me.pinning) me.pinning--; if (me.pinned) me.pinned--;
      // 手番のおわり：持続ターンを 1 減らす（自分の番に自分へ付けたものは、次の自分の番まで残す）
      for (const [id2, x] of Object.entries(me.fx)) { if (x.turns == null) continue; if (x.fresh) { x.fresh = false; continue; } if (--x.turns <= 0) delete me.fx[id2]; }
      if (!quiet) ev.push({ ...e, after: snap() });
    }
  }
  if (simFrom >= 0) for (let k = simFrom; k < ev.length; k++) ev[k].sim = true;
  const ratio = (s) => { const g = F.filter((f) => f.side === s); return g.reduce((a, f) => a + f.hp, 0) / g.reduce((a, f) => a + f.maxHp, 0); };
  const r0 = ratio(0), r1 = ratio(1), winner = r0 === r1 ? (R() < 0.5 ? 0 : 1) : r0 > r1 ? 0 : 1;   // SIM_TURN でも決着がつかなければ HP の割合（パーティは合計で）
  const ko = !alive(0).length || !alive(1).length;
  const upset = winner === weak && gap >= 1.2, reward = !upset ? 3 : gap >= 1.5 ? 9 : 6;
  // 持ちこし（ダンジョン）：その場の構え（防御・カウンター）と、パッシブ・装備の「戦いのはじめに」の効果は解ける
  const carry = F.map((f) => Object.fromEntries(Object.entries(f.fx).filter(([id, x]) => !EFFECTS[id].stance && !x.perm).map(([id, x]) => [id, { ...x, fresh: false }])));
  ev.push({ type: "end", winner, upset, reward, ko: !alive(1 - winner).length, timeout: !ko, turns: lastTurn, overtime: lastTurn > MAX_TURN, carry, final: snap() });
  return ev;
}
