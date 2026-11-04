// クローラーの 歩く 決まり（一人称の マス目。資料 docs/mono-link-crawler-missions.md）。three を 使わない（node でも 動く）
// 地図は ブリーフィングと 同じ 16×16 の 文字（crawler-ch1-data.js）。ミッションの 目的は crawler-ch1.js の KIND（種類ごとの 決まり）
//   const S = newRun(def, { party, items, seed });
//   act(S, { t: "move", dir: "f" })  … 前・後ろ・左・右へ 1 歩（時計が 1 つ 進む）。{ t: "turn", k: 1 } は 向きだけ（時計は 進まない）
//   act(S, { t: "use" })             … 前か 足もとの しかけを 使う（調べる・握る・壊す など。時計が 1 つ 進む）
//   act(S, { t: "wait" })            … その場で 1 ターン
//   S.battle が 立ったら 戦い（crawler-battle.js）→ endBattle(S, B) で もどす。S.result が 立ったら 終わり
// 決まり（鹿さんの 決め）：時計は 共通・視界は 通路の 先 4 マス・雑魚は 見えずに 出会う（区画ごとの 数）・POM と 精鋭は 見えて 1 ターンに 1 歩
//   見える 敵の 背中に 当たれば 先制、背中から 当たられたら 不意打ち（最初の 1 ターン 動けない）
// 拾った 物（戦いの 取り分・漁った 物）は S.loot に ためる（crawler-reward.js。終わりの 精算も そこ）
import { newLoot, battleLoot, scavenge, SCAV } from "./crawler-reward.js";
export const DIRV = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 0 北・1 東・2 南・3 西（crawler3d.js と 同じ）
export const VIEW = 4; // 視界（マス）

const key = (x, y) => `${x},${y}`;
export function rngOf(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- 地図 ----
export const cellAt = (S, x, y) => (y >= 0 && y < S.rows.length && x >= 0 && x < S.rows[y].length ? S.rows[y][x] : "#");
export const stateAt = (S, x, y) => S.state[key(x, y)];
// 通れるか（壁・閉じた 扉／隔壁・壊れて いない 発電機と 砲台・立って いる 防壁は 通れない）
export function passable(S, x, y) {
  const ch = cellAt(S, x, y), st = stateAt(S, x, y);
  if (ch === "#") return false;
  if ((ch === "D" || ch === "K") && st !== "open") return false;
  if (ch === "B" && st !== "open") return false;
  if ((ch === "G" || ch === "R") && st !== "broken") return false;
  if (ch === "F") return false;
  return true;
}
// 昇降機（L）の 行き先：地図の lifts の 組（2 つ目の 区画へ。1-14）
export const liftTo = (S, x, y) => { for (const [a, b] of S.def.map?.lifts ?? []) { if (a[0] === x && a[1] === y) return b; if (b[0] === x && b[1] === y) return a; } return null; };
// 道を たどる（幅優先）。from から to への 次の 1 マス（なければ null）。walk：通れるかの 判定。useLift：昇降機に 入ると 向こうへ（プレイヤーの 道）
export function nextStep(S, from, to, walk = (x, y) => passable(S, x, y), useLift = false) {
  if (from[0] === to[0] && from[1] === to[1]) return null;
  const prev = new Map([[key(...from), null]]), q = [from];
  while (q.length) {
    const p = q.shift();
    if (p[0] === to[0] && p[1] === to[1]) break;
    for (const [dx, dy] of DIRV) {
      const n = [p[0] + dx, p[1] + dy], isTo = n[0] === to[0] && n[1] === to[1];
      if (!(walk(n[0], n[1]) || isTo)) continue;
      const land = (useLift && !isTo && liftTo(S, ...n)) || n, k = key(...land);
      if (prev.has(k)) continue;
      prev.set(k, { p, via: n }); q.push(land);
    }
  }
  if (!prev.has(key(...to))) return null;
  for (let cur = to; ;) { const r = prev.get(key(...cur)); if (r.p[0] === from[0] && r.p[1] === from[1]) return r.via; cur = r.p; }
}
export const distOf = (S, a, b) => { // 道の 長さ（行けなければ 99）
  if (a[0] === b[0] && a[1] === b[1]) return 0;
  const seen = new Set([key(...a)]); let fr = [a];
  for (let d = 1; d < 64 && fr.length; d++) {
    const nx = [];
    for (const p of fr) for (const [dx, dy] of DIRV) {
      const n = [p[0] + dx, p[1] + dy], k = key(...n);
      if (seen.has(k) || !passable(S, n[0], n[1])) continue;
      if (n[0] === b[0] && n[1] === b[1]) return d;
      seen.add(k); nx.push(n);
    }
    fr = nx;
  }
  return 99;
};
// 見える マス：4 つの 向きに 通路の 先 VIEW マスまで（壁と 閉じた 扉で 止まる）。いる マスと となりも
export function visibleFrom(S, x, y) {
  const out = new Set([key(x, y)]);
  for (const [dx, dy] of DIRV) {
    for (let i = 1; i <= VIEW; i++) {
      const cx = x + dx * i, cy = y + dy * i;
      out.add(key(cx, cy));
      if (!passable(S, cx, cy) && cellAt(S, cx, cy) !== "G" && cellAt(S, cx, cy) !== "F") break;
    }
  }
  return out;
}

// ---- 走る 状態 ----
// def：crawler-ch1.js の ミッション（map・theme・kind・…）。party：[{ c：戦う 子の 形, hp, mp, maxHp, maxMp, merc? }]
export function newRun(def, { party, items = {}, seed = 1, kind, first = true }) { // first：その ミッションを はじめて 遊ぶ（2 回目からは 経験値だけ）
  const rows = def.map.rows.slice();
  const st = rows.flatMap((r, y) => [...r].map((ch, x) => [ch, x, y])).find(([ch]) => ch === "S");
  const S = {
    def, rows, state: {}, turn: 0, R: rngOf(seed), LR: rngOf((seed ^ 0x9e3779b9) >>> 0), seed, // LR：取り分の くじ（迷宮の くじと 分けて、ドロップで 出会いの 運が かわらない）
    me: { x: st[1], y: st[2], d: firstDir(rows, st[1], st[2]) },
    party, items: { ...items }, seen: new Set(), foes: [], fixed: [], hidden: def.hidden ?? 2,
    obj: {}, flags: {}, talk: [], log: [], battle: null, result: null, bonus: false, nextId: 1, kind, first, loot: newLoot(),
  };
  // 決まった 所に 隠れて いる 部隊（ブリーフィングの 敵の マス。見えずに 出会う）
  for (const u of def.map.unit ?? []) S.fixed.push({ x: u[0], y: u[1], alive: true });
  kind.init?.(S);
  look(S);
  return S;
}
const firstDir = (rows, x, y) => [0, 1, 2, 3].reduce((b, d) => (run(rows, x, y, d) > run(rows, x, y, b) ? d : b), 1);
const run = (rows, x, y, d) => { let n = 0; while (rows[y + DIRV[d][1] * (n + 1)]?.[x + DIRV[d][0] * (n + 1)] && rows[y + DIRV[d][1] * (n + 1)][x + DIRV[d][0] * (n + 1)] !== "#") n++; return n; };
export function look(S) { for (const k of visibleFrom(S, S.me.x, S.me.y)) S.seen.add(k); }
export const foeVisible = (S, f) => visibleFrom(S, S.me.x, S.me.y).has(key(f.x, f.y));
export const say = (S, who, text, emblem) => S.talk.push({ who, text, emblem, turn: S.turn });
export const note = (S, text) => S.log.push({ turn: S.turn, text });

// 見える 敵を 置く（POM・精鋭・波の 部隊）。move：wait（その場）・patrol（道を 回る）・chase（いつも 追う）・goto（目的地へ）
export function addFoe(S, f) {
  const o = { id: S.nextId++, d: 2, move: "wait", alive: true, seen: 0, ...f };
  S.foes.push(o);
  return o;
}

// ---- 1 手 ----
export function act(S, a) {
  if (S.result || S.battle) return S;
  if (a.t === "turn") { S.me.d = (S.me.d + a.k + 4) % 4; look(S); return S; }
  if (a.t === "move") {
    const off = { f: 0, r: 1, b: 2, l: 3 }[a.dir], d = (S.me.d + off) % 4, [dx, dy] = DIRV[d], nx = S.me.x + dx, ny = S.me.y + dy;
    if (!passable(S, nx, ny)) {
      // 閉じた 扉は 押すと 開く（鍵の ない 扉）
      if (cellAt(S, nx, ny) === "D" && stateAt(S, nx, ny) !== "open") { S.state[key(nx, ny)] = "open"; note(S, "扉を 開けた"); tick(S); }
      return S;
    }
    // 見える 敵の いる マスへ 入ったら 戦い（向きで 先制）
    const hit = S.foes.find((f) => f.alive && f.x === nx && f.y === ny);
    if (hit) { startFoeBattle(S, hit, hit.d === d ? "me" : null); return S; }
    S.prev = [S.me.x, S.me.y]; // 1 歩 前の マス（護衛の 相手が ついて 来る）
    S.me.x = nx; S.me.y = ny; // 向きは そのまま（横歩き・後ろ歩きも 向きを かえない）
    const lp = liftTo(S, nx, ny); if (lp) { S.me.x = lp[0]; S.me.y = lp[1]; S.prev = null; note(S, "昇降機で 移った"); } // 昇降機に 乗ると もう 一つの 区画へ
    S.kind.onStep?.(S);
    if (S.result) return S;
    tick(S);
    if (S.kind.slow?.(S) && !S.battle && !S.result) tick(S); // 荷を 持つと 足が 遅い（1 歩に 2 ターン）
    if (!S.battle && !S.result) hiddenCheck(S);
    return S;
  }
  if (a.t === "use") {
    const used = S.kind.onUse ? S.kind.onUse(S, ahead(S)) : false;
    if (used === false) { // しかけが なければ 漁る（前か 足もとの 残骸・キャビネット。1 マス 1 回）
      const ah = ahead(S), c = [[ah.x, ah.y, ah.ch], [S.me.x, S.me.y, ah.here]].find(([x, y, ch]) => SCAV[ch] && stateAt(S, x, y) !== "taken");
      if (!c) return S;
      S.state[key(c[0], c[1])] = "taken"; note(S, `${SCAV[c[2]]}を 漁った：${scavenge(S, c[2])}`);
    }
    if (!S.result) tick(S);
    return S;
  }
  if (a.t === "wait") { tick(S); return S; }
  return S;
}
export const ahead = (S) => { const [dx, dy] = DIRV[S.me.d]; return { x: S.me.x + dx, y: S.me.y + dy, ch: cellAt(S, S.me.x + dx, S.me.y + dy), here: cellAt(S, S.me.x, S.me.y) }; };

// 時計を 1 つ 進める：目的の 決まり → 見える 敵が 1 歩 → ぶつかったら 戦い
export function tick(S) {
  S.turn += 1;
  S.kind.onTick?.(S);
  if (S.result || S.battle) { look(S); return; }
  for (const f of S.foes) if (f.alive) moveFoe(S, f);
  look(S);
  const near = S.foes.find((f) => f.alive && f.x === S.me.x && f.y === S.me.y);
  if (near && !S.battle) {
    // 背中から 当たられたら 不意打ち（敵が 来た 向きが こちらの 向きと 同じ ＝ 後ろから）
    const from = near.lastDir, behind = from != null && from === S.me.d;
    startFoeBattle(S, near, behind ? "foe" : null);
  }
}
function moveFoe(S, f) {
  if (f.stay) { f.stay -= 1; return; }
  const me = [S.me.x, S.me.y], at = [f.x, f.y];
  const sees = visibleFrom(S, f.x, f.y).has(key(S.me.x, S.me.y));
  let to = null;
  if (f.move === "chase" || (f.move === "patrol" && (sees || f.alert > 0))) { to = me; f.alert = sees ? 3 : (f.alert ?? 0) - 1; }
  else if (f.move === "patrol" && f.path?.length) { const p = f.path[f.pi % f.path.length]; if (p[0] === f.x && p[1] === f.y) f.pi = (f.pi + 1) % f.path.length; to = f.path[f.pi % f.path.length]; }
  else if (f.move === "goto" && f.to) to = f.to;
  if (!to) return;
  if (f.every && S.turn % f.every) return; // 足の 遅い 敵（2 ターンに 1 歩 など）
  const n = nextStep(S, at, to, (x, y) => (passable(S, x, y) || (f.walkF && cellAt(S, x, y) === "F")) && !S.foes.some((o) => o !== f && o.alive && o.x === x && o.y === y)); // walkF：仕上がって いない 門を 越えて くる 波
  if (!n) return;
  if (f.noMeet && n[0] === S.me.x && n[1] === S.me.y) { S.kind.onBlocked?.(S, f); return; } // こちらに 入らない 敵（運び屋・逃げる 者）が 道を ふさがれた
  const d = DIRV.findIndex(([dx, dy]) => dx === n[0] - f.x && dy === n[1] - f.y);
  f.lastDir = d; f.d = d; f.x = n[0]; f.y = n[1];
  if (f.trail) (S.obj.trail ??= []).push({ x: at[0], y: at[1], turn: S.turn });
  S.kind.onFoeMove?.(S, f);
}

// ---- 出会い ----
// 決まった 所の 部隊（その マスに 入ると）・見えない 部隊（歩くと ときどき。区画ごとの 数）
function hiddenCheck(S) {
  const fx = S.fixed.find((u) => u.alive && u.x === S.me.x && u.y === S.me.y);
  if (fx) { fx.alive = false; return startHidden(S, fx); }
  if (S.hidden > 0 && S.kind.hiddenOk?.(S) !== false && S.R() < (S.def.encounter ?? 0.07)) { S.hidden -= 1; return startHidden(S, null); }
}
function startHidden(S, fx) {
  note(S, "……気配が する");
  const first = S.R() < 0.12 ? (S.R() < 0.5 ? "me" : "foe") : null; // 見えない 雑魚は 少しの 確率で どちらかが 先に 気づく
  S.battle = { kind: "unit", foes: S.kind.squad(S), first, fixed: fx };
}
function startFoeBattle(S, f, first) {
  S.battle = { kind: f.kind ?? "pom", foes: f.squad, first, foe: f, elite: !!f.elite, name: f.name };
  S.kind.onMeet?.(S, f);
}
// 戦いの あと（B：crawler-battle.js の 戦い。outcome：win・lose・retreat）
export function endBattle(S, B, outcome) {
  const b = S.battle;
  S.battle = null;
  if (B?.now) S.party.forEach((p, i) => { p.hp = Math.max(0, B.now[i].hp); p.mp = B.now[i].mp; });
  if (B?.used) for (const [id, n] of Object.entries(B.used)) S.items[id] = Math.max(0, (S.items[id] ?? 0) - n);
  if (outcome === "retreat") {
    // 同じ マスの 班 みんなで 撤退。成功すると 来た マスへ もどる（鹿さんの 決め）
    const [dx, dy] = DIRV[S.me.d];
    if (passable(S, S.me.x - dx, S.me.y - dy)) { S.me.x -= dx; S.me.y -= dy; }
    if (b?.fixed) b.fixed.alive = true;
    if (b?.foe) b.foe.stay = 2;
    look(S);
    return S;
  }
  if (outcome === "win") {
    if (b?.foe) b.foe.alive = false;
    const got = battleLoot(S, b, { first: S.first, mult: S.def.mult ?? 1 }); // ランダム・境界は mult 2（第 1 章は 1）
    if (got.length) note(S, `拾った：${got.join("・")}`);
    S.kind.onWin?.(S, b);
  }
  // 力つきた 子：味方が 生きて いれば 戦いの あとに 起こす（HP 少し。鹿さんの 決め「味方が その マスに 来て 起こす」を 同じ 班なので その場で）
  const up = S.party.filter((p) => p.hp > 0);
  if (!up.length) { S.result = { ok: false, why: "全員が 力つきた" }; return S; }
  for (const p of S.party) if (p.hp <= 0) { p.hp = Math.max(1, Math.round(p.maxHp * 0.1)); note(S, `${p.c.name} を 起こした`); }
  S.kind.afterBattle?.(S, b);
  look(S);
  return S;
}
// 力つきた 味方を 起こす 薬（戦いの あと。メルヴィル蘇生アンプル）・HP の 薬（歩いて いる ときも 使える）
export function useItem(S, id, who = 0) {
  if (!(S.items[id] > 0)) return false;
  const p = S.party[who];
  if (id === "mlv_revive") { if (p.hp > 0) return false; p.hp = Math.round(p.maxHp * 0.3); }
  else { if (p.hp <= 0) return false; const pct = { mlv_patch_s: 0.3, mlv_patch_m: 0.6, mlv_patch_l: 1 }[id] ?? 0; p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * pct)); }
  S.items[id] -= 1;
  return true;
}
export const finish = (S, ok, why, bonus) => { S.result = { ok, why, bonus: !!bonus }; };
