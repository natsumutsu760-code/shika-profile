// 集合住宅（TD）を 門番に つなぐ（2026-11-15 鹿さんの カード「集合住宅を 門番に つなぐ」。システム担当）
// 数は ぜんぶ lounge-proto/td-numbers.js（鹿さんの カードで 決まった 〔決〕）・建物の 形と 増築の 候補は lounge-proto/td-core.js（2 代目の 見本 td.html から 写した）
// 記録 rec.td = { order:[建てた 候補], res:{ 部屋の 鍵: 住人 }, day:家賃を 払った 日（日本時間）, board:{ h, n, taken }, sig:シグナル, notes:{ at, list }, def:防衛中, dead:[殺された 持って いる 子の uid], mods:モジュールの 数（持ち物）, modInv:[{id, star}], modAt:{ "cell:マス"|"blk:箱"|"room:鍵": {id, star} }, modOffer:{ id, list }, log }
//   住人 { id（絵＝敵の ツリー）, name, lv, sat（満足度）, type（型）, uid?（持って いる 子なら なかまの uid）, at }
// 受付：td.build {slot}・td.rent・td.movein {i, key}・td.out {key}・td.furn {key, id}・td.gear {key, id}・td.price {key, step}・td.scout {key}・td.def.start {i}・td.def.end {id, won, kills, fought, dead}
//       アメジスト（計画）：td.revive {uid}・td.board（掲示板を すぐ かえる）
// 〔決〕の 決め：家賃（（15 ＋ Lv）× 満足度の 倍率・1 日 1 回）・増築の 値段（パーツ 1 つずつ）・経験値は 戦いと 仕事（持って いる 子だけ）・素材は 本編と 共有（倉庫）・
//   防衛の 報酬（強さ 1〜5）と 負け・アメジストの 復活（ランク）と 掲示板・敵の 数と Lv・入口は ペットを むかえてから
// 〔決〕運び（TD_C。2026-11-15 鹿さんの カード「この案でよい」。前は Claude の 案）：
//   家賃は ためて おけるのは 3 日ぶんまで（毎日 開かなくても 損しない が、ためこみすぎない）・はじめて 開いた 日から 数える
//   入居希望の 掲示板は 3 人・1 時間で 入れかわる・ときどき（3 割）持って いる なかまが 1 人 借りに 来る（研究ノート「持って いる 子も たまに」）・入居の ときの 満足度 60（見本と 同じ）
//   電波塔の 通知は 建物の 部屋 16 ごとに 1 つ（最大 4）・3 時間に 1 つ 届く・強さは 建物が 大きいほど 高い 物も 来る
//   防衛の 戦いは ブラウザで 回し（td-battle.js）、門番は 始めた 記録と 結果を 照らす：始めて 3 分 たって から の 結果だけ・1 回きり・倒した 数は 敵の 数まで
//     （クローラーと 同じ 考え。戦いの 中身までは 確かめない ので、報酬は 強さの 表の 額と 上限の 中だけ）
//   報酬の 素材は 攻めて きた 敵の 素材（品質 0）・スクラップは 残骸の 物。モジュールは 数だけ（27 この 中身は あとで）
//   殺された NPC の 住人は 出て いく・持って いる 子は 復活待ち（アメジスト）。手伝い（ほかの 人の 防衛）・家具と 設備・満足度の 動きは あとで（この 段では 入居の 60 の まま）
// 〔決〕家賃の 高さ（2026-11-15 カード。2 代目が 入れた）：td.price {key, step}（0 安い〜4 強気。部屋に のこる）。相場（部屋の 格で 決まる 段）を 超えると
//   家具・設備・広さの 満足度が 効かず、不満が 1 段ごとに 毎日 3 たまる（下げると もどる）。住人の ug（不満）・ut（数えた とき）に しまい、段か 格が かわる ときに 数えなおす。
//   〔C〕相場を 超えた 部屋には 新しい 住人が 入らない
// 〔決〕不動産価値（Lv・上限なし）・1 つ目の 建物の 階・区画と 設計図・家具の Lv・病気の くじ・家具と 設計図の ドロップ（2026-11-15 カード。システム担当）：
//   T.prop { lv（下がらない）, wins（守りきった 強さの 合計）, rent（集めた 家賃の 合計）}・T.fl（1 つ目の 建物の 階）・T.bp（持って いる 設計図の ★）・T.bpAt（建てた 区画の 箱 → ★）・T.inv（ドロップした 家具）
//   td.build {slot:"A+"} で 1 つ目の 建物に 階・箱の 候補は 設計図 {bp:持ち物の 番号} が いる（区画の 数は Lv で）・td.bp.scrap {i} で 設計図を スクラップに・td.furn {key, id, inv:true} で ドロップの 家具を 置く
//   住人の sickTo（治る 日・日本時間）。病気の くじは 家賃を 受けとる ときに 1 日ずつ ひく
import { rentOf, rewardOf, battleExp, workExp, foeCount, foeLv, REVIVE, BOARD_REFRESH, FIGHT, TD_FURN, GEAR, FURN_MAX, SAT, satOf, SCOUT_SIG, RENT_STEP, GRUDGE, gradeOf, marketOf, stepOf, grudgeRate,
  MODULES, MOD_OFFER, PROP, propNeed, propLvOf, FIRST_FLOORS, firstFloorsOf, BLOCK_LV, blockSlotsOf, FURN_LV, BLUEPRINT, BP_DROP, BP_SCRAP, bpStar, FURN_DROP, furnDropPool, SICK, sickOdds, partPrice, WORK, WORK_OF, SKILL, skillOf, SKILL_IN, PAY, payOf , LIFE } from "./td-numbers.js";
import { FULL_BLOCKS, availOf, slotCost, shapeOf, roomsOf, roomsPer, hallOk } from "./td-core.js";   // 置き場所は 動く 候補（2026-11-16 案 1。2 代目）
import { ENEMY_TREES } from "./enemy-trees.js";
import { ENEMY_MAT, SCRAP } from "./materials.js";
import { speciesOf, RANKS, famOf } from "./fusion.js";
import { levelUp, putMats } from "./lounge-game.js";
import { foeOf } from "./dungeon-sim.js";
import { SNACK_NEED } from "./dungeons.js";
import { sexOf } from "./monster.js";
import { jstDay } from "./lounge-rules.js";
import { planOf, stateAt, slotTimes, pairsOf, bondKeyOf, kidOf, jstMin, kidInherit, kinOf, parentOf, treeOfRes } from "./td-life.js";   // 住人の 暮らし（2026-11-18 2 代目。画面と 同じ 式）

export const TD_C = { rentKeep: 3, board: 3, ownP: 0.3, satIn: 60, noteRooms: 16, notesMax: 4, noteEvery: 3 * 3600000, defMin: 3 * 60000, killsMax: 16, logMax: 20 };
const HOUR = 3600000;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (R, a) => a[Math.floor(R() * a.length)];
const TYPES = ["アタッカー", "ディフェンダー", "テクニシャン", "キャスター", "ヒーラー"];
// 住人に なる モンスター（通常・希少の 敵の ツリー）・攻めて くる 敵の かしら（ボス）
const WILD = Object.keys(ENEMY_TREES).filter((k) => /^e3?_/.test(k) && ["通常", "希少"].includes(ENEMY_TREES[k].rank));
const LIVE = WILD.filter((k) => famOf(k));   // 住人に なる のは 配合の 図鑑に いる（系統の ある）種類だけ（好みが 働く ように。_foe・_ev などの 敵だけの 形は 攻めて くる 側）
const BOSS = Object.keys(ENEMY_TREES).filter((k) => /^e3?_boss_/.test(k) && ENEMY_TREES[k].rank === "ボス");
const nameOf = (id) => ENEMY_TREES[id]?.enemy ?? id;
const typeOf = (id, R) => (TYPES.includes(ENEMY_TREES[id]?.type) ? ENEMY_TREES[id].type : pick(R, TYPES));

export function ensureTd(rec) {
  const T = (rec.td ||= {});
  if (!Array.isArray(T.order)) T.order = [];
  if (!T.res || typeof T.res !== "object") T.res = {};
  if (!Array.isArray(T.dead)) T.dead = [];
  if (!Number.isFinite(T.sig)) T.sig = 0;
  if (!Number.isFinite(T.mods)) T.mods = 0;
  if (!Array.isArray(T.modInv)) T.modInv = [];                  // モジュールの 持ち物 [{ id, star }]
  if (!T.modAt || typeof T.modAt !== "object") T.modAt = {};   // 置いた モジュール
  if (!Array.isArray(T.log)) T.log = [];
  if (!T.rooms || typeof T.rooms !== "object") T.rooms = {};   // 部屋の 家具と 設備（部屋に のこる。住人が かわっても）
  for (const [k, r] of Object.entries(T.res)) jobFill(r, k);
  if (!Number.isFinite(T.fl)) T.fl = FIRST_FLOORS.start;        // 1 つ目の 建物の 階
  if (!Array.isArray(T.bp)) T.bp = [];                          // 持って いる 設計図（★）
  if (!T.bpAt || typeof T.bpAt !== "object") T.bpAt = {};       // 建てた 区画（箱の id → ★）
  if (!T.inv || typeof T.inv !== "object") T.inv = {};          // ドロップした 家具 { id: 数 }
  if (!T.prop || typeof T.prop !== "object") T.prop = { lv: 1, wins: 0, rent: 0 };
  if (!T.bond || typeof T.bond !== "object") T.bond = {};       // となりどうしの なかよし { "鍵@入居|鍵@入居": 0〜100 }（暮らし。2026-11-18）
  return T;
}
export const tdOpen = (rec) => !!(rec.pets && rec.pets[0]);   // 〔決〕入口は ペットを むかえてから
const log = (T, s, now) => { T.log.unshift({ at: now, s }); T.log.length = Math.min(T.log.length, TD_C.logMax); };
const roomList = (T) => roomsOf(shapeOf(T.order, T.fl, T.bpAt));
const roomKeys = (T) => roomList(T).filter((r) => !r.cut).map((r) => r.key);   // 〔決〕入口から 歩いて 行けない 区画（外階段・渡り廊下で つなぐ 前）は 住めない
const DAY = 86400000;
// 住人の 満足度（〔決〕入居 60 ＋ 家具〈好みは 1.5 倍〉＋ 設備 ＋ 広さ − 汚れ。汚れは 入居から の 日数）
// 〔決〕家賃の 不満：相場を 超えた 1 段ごとに 1 日 3 たまる・相場より 下げると もどる（0〜100）。超えて いる あいだは 家具・設備・広さの ＋が 効かない
const marketAt = (R) => marketOf(gradeOf(R || {}));
export const grudgeNow = (T, key, now) => { const r = T.res[key]; if (!r) return 0; const R = T.rooms[key], t0 = r.ut ?? r.at ?? now;
  return Math.max(0, Math.min(GRUDGE.max, (r.ug || 0) + (grudgeRate(stepOf(R), marketAt(R)) * Math.max(0, now - t0)) / DAY)); };
const settle = (T, key, now) => { const r = T.res[key]; if (r) { r.ug = grudgeNow(T, key, now); r.ut = now; } };   // 段か 格を かえる 前に 数えて しまう
export const satNow = (T, key, now) => { const r = T.res[key], R = T.rooms[key] || {}; if (!r) return 0; return satOf({ furn: R.furn || [], gear: R.gear || [], size: R.size || null, dirtDays: Math.floor((now - (r.at || now)) / DAY), fam: famOf(r.id) || null, over: stepOf(R) > marketAt(R), grudge: grudgeNow(T, key, now) }); };
const lvsOf = (T) => Object.values(T.res).map((r) => r.lv);
// 不動産価値の 点（〔決〕部屋 × 10 ＋ 家具 × 5 ＋ 設備 × 8 ＋ 満足度の 合計 ÷ 10 ＋ 家賃の 合計 ÷ 10,000 ＋ 勝ち × 強さ × 20）と Lv（上限なし・下がらない）
export function propPts(T, now) {
  const keys = roomKeys(T); let furn = 0, gear = 0;
  for (const k of keys) { const R = T.rooms[k]; if (R) { furn += (R.furn || []).length; gear += (R.gear || []).length; } }
  const sat = Object.keys(T.res).reduce((a, k) => a + satNow(T, k, now), 0);
  return Math.floor(keys.length * PROP.room + furn * PROP.furn + gear * PROP.gear + sat / PROP.satDiv + (T.prop.rent || 0) / PROP.rentDiv + (T.prop.wins || 0) * PROP.win);
}
const plvOf = (T, now) => Math.max(T.prop.lv || 1, propLvOf(propPts(T, now)));
const sickNow = (r, day) => (r.sickTo || 0) > day;
// 〔決〕仕事（2026-11-16 カード。2 代目）：住人に wk（種類）・job（職種）・wd0（入居の ときの 腕の 日数）・tol（がまん）・sd（病気で 休んだ 日）。腕の 日数 ＝ wd0 ＋ 住んだ 日 − 休んだ 日
//   家賃は 払える 段（腕）＋ がまん まで。超えた 日は 日と 部屋で 決まる くじで 払わない（見せる 額と 受けとる 額が 同じ）
const jobMake = (id, R, skilled) => { const wk = WORK_OF[famOf(id)] || Object.keys(WORK)[hash(id) % 4], u = R();
  return { wk, job: pick(R, WORK[wk]), wd0: skilled ? (SKILL_IN.find(([p]) => u < p) || [0, 0])[1] : 0, tol: Math.floor(R() * (PAY.tolMax + 1)) }; };
const jobFill = (r, k) => { if (!r.job) Object.assign(r, jobMake(r.id, rngOf(hash(`tdw:${k}:${r.id}:${r.at || 0}`)), false)); return r; };   // 前から いる 住人
const workAt = (r, d) => Math.max(0, (r.wd0 || 0) + d - jstDay(r.at || 0) - (r.sd || 0));
export const workDays = (r, now) => workAt(r, jstDay(now));
const capAt = (r, d) => SKILL[skillOf(workAt(r, d))].pay + (r.tol || 0);
const payDay = (rec, T, key, r, sat, d) => payOf(r.lv, sat, stepOf(T.rooms[key]), capAt(r, d), rngOf(hash(`tdp:${rec.id ?? ""}:${key}:${d}`))());
// ためた 日ぶんの 家賃の 見こみ（いま 病気の 日は 0。病気の くじは 受けとる ときに）
const dueOf = (rec, T, key, r, sat, day, days) => { let cr = 0; for (let d = day - days + 1; d <= day; d++) if (!sickNow(r, d)) cr += payDay(rec, T, key, r, sat, d); return cr; };
// 設計図の 区画の 部屋の 広さ（★3・4 広い・★5 とても 広い）を 部屋に しまう（満足度・部屋の 格が 読む）
const sizeRooms = (T) => { for (const r of roomList(T)) { const st = T.bpAt[r.blk], sz = st && BLUEPRINT[st]?.size; if (sz) (T.rooms[r.key] ||= {}).size ||= sz; } };

const baseLv = (rec, T) => { const l = lvsOf(T); return l.length ? Math.round(l.reduce((a, v) => a + v, 0) / l.length) : Math.max(5, (rec.pets?.[0]?.lv | 0) || 10); };

// ---- 入居希望の 掲示板（1 時間ごと・アメジストで すぐ かえると n が ふえる）----
export function boardOf(rec, T, now) {
  const h = Math.floor(now / HOUR), B = T.board && T.board.h === h ? T.board : { h, n: 0, taken: [] };
  const R = rngOf(hash(`tdb:${h}:${B.n}:${rec.id ?? ""}`)), lv0 = baseLv(rec, T), out = [];
  const inRes = new Set(Object.values(T.res).map((r) => r.uid).filter(Boolean));
  const mine = (rec.tamed || []).filter((c) => c && c.uid && c.tree && !inRes.has(c.uid) && !T.dead.includes(c.uid));
  for (let i = 0; i < TD_C.board; i++) {
    const own = i === 0 && mine.length && R() < TD_C.ownP ? pick(R, mine) : null;
    const J = (id, skilled) => jobMake(id, rngOf(hash(`tdj:${h}:${B.n}:${i}:${rec.id ?? ""}`)), skilled);   // 仕事の くじは べつの 種（前の 掲示板の 並びを かえない）
    if (own) { out.push({ i, uid: own.uid, id: own.tree, name: own.name || nameOf(own.tree), lv: own.lv | 0, type: typeOf(own.tree, R), mine: true, ...J(own.tree, false) }); continue; }
    const id = pick(R, LIVE), lv = Math.max(3, Math.round(lv0 * (0.7 + R() * 0.5)));
    out.push({ i, id, name: nameOf(id), lv, type: typeOf(id, R), ...J(id, true) });
  }
  return { h, n: B.n, list: out.map((w) => ({ ...w, skill: skillOf(w.wd0), rent: rentOf(w.lv, TD_C.satIn), taken: B.taken.includes(w.i) })) };
}
// ---- 電波塔の 通知（3 時間に 1 つ・建物の 大きさで 数と 強さ）----
function notesOf(rec, T, now) {
  const rooms = roomKeys(T).length, max = Math.min(TD_C.notesMax, 1 + Math.floor(rooms / TD_C.noteRooms));
  const N = T.notes && Number.isFinite(T.notes.at) ? T.notes : { at: now, list: [], k: 0 };
  let { at, list, k } = { at: N.at, list: [...N.list], k: N.k | 0 };
  while (now - at >= TD_C.noteEvery && list.length < max) { at += TD_C.noteEvery; list.push(noteMake(rec, T, k++, rooms)); }
  if (!N.list.length && !T.notes) list.push(noteMake(rec, T, k++, rooms));   // はじめて 開いた とき 1 つ
  if (list.length >= max) at = now;
  return { at, list, k };
}
function noteMake(rec, T, k, rooms) {
  const R = rngOf(hash(`tdn:${rec.id ?? ""}:${k}`)), top = Math.min(5, 2 + Math.floor(rooms / 20));
  const strength = 1 + Math.floor(R() * top), lv = foeLv(strength, (T.prop && T.prop.lv) || 1, R()), n = foeCount(strength, rooms);   // 〔決〕襲撃の Lv は 電波塔の Lv（＝ 不動産価値の Lv）で 上が 決まり、★で 幅（住人の Lv には あわせない。2026-11-16）
  const foes = Array.from({ length: n }, (_, j) => ({ id: j === 0 && strength >= 3 && BOSS.length ? pick(R, BOSS) : pick(R, WILD), lv: j === 0 && strength >= 3 ? lv + 2 : lv }));
  return { k, strength, lv, foes, from: strength >= 4 && R() < 0.4 ? "脅迫" : "流れて きた モンスター" };
}

// ---- 見せる 形（me の td）----
export function tdView(rec, now = Date.now()) {
  if (!tdOpen(rec)) return { open: false };
  const T = ensureTd(rec), keys = roomKeys(T), day = jstDay(now);
  const days = T.day == null ? 0 : Math.min(TD_C.rentKeep, Math.max(0, day - T.day));
  const res = Object.fromEntries(Object.entries(T.res).map(([k, r]) => [k, { ...r, sat: satNow(T, k, now), fam: famOf(r.id) || null, step: stepOf(T.rooms[k]), market: marketAt(T.rooms[k]), grudge: Math.round(grudgeNow(T, k, now)), sick: sickNow(r, day), scout: r.uid ? null : (SCOUT_SIG[rankLetter(r.id)] ?? SCOUT_SIG.F), wdays: workDays(r, now), skill: skillOf(workDays(r, now)), cap: capAt(r, day) }]));   // scout：スカウトの シグナル（NPC だけ）
  const L = plvOf(T, now), pts = propPts(T, now), used = Object.keys(T.bpAt).length, flMax = firstFloorsOf(L);
  return { open: true, order: T.order, rooms: keys.length, empty: keys.filter((k) => !T.res[k]), res, bonds: Object.fromEntries(pairsOf(Object.keys(T.res)).map(([x, y]) => [[x, y].sort().join("|"), bondOf(T, x, y)])), lifeAt: T.life ? T.life.at : null, roomsIn: T.rooms, dead: T.dead, sig: T.sig, mods: T.modInv.length, modInv: T.modInv, modAt: T.modAt, modOffer: T.modOffer ? T.modOffer.list : null,
    avail: availOf(T.order, null, T.fl, T.bpAt).map((s) => ({ id: s.id, part: s.part, cost: slotCost(T.order, s.id, T.fl, T.bpAt) })), full: false,   // 区画の 数も 高さも 上限なし
    prop: { lv: L, pts, cur: propNeed(L), next: propNeed(L + 1), rent: T.prop.rent || 0, wins: T.prop.wins || 0 },   // rent・wins：画面の 点の 内わけ（2 代目）
    first: { fl: T.fl, max: flMax, cost: partPrice("addFloor", roomsPer(FULL_BLOCKS[0]), T.fl + 1), nextLv: FIRST_FLOORS.at.find((x) => x > L) ?? null },
    blocks: { used, max: blockSlotsOf(L), nextLv: BLOCK_LV.from + BLOCK_LV.every * (blockSlotsOf(L) + 1) }, bp: T.bp, bpAt: T.bpAt, inv: T.inv,
    rent: { days, cr: Object.entries(res).reduce((a, [k, r]) => a + (r.sick || !days ? 0 : dueOf(rec, T, k, T.res[k], r.sat, day, days)), 0) }, board: boardOf(rec, T, now), notes: notesOf(rec, T, now).list, help: T.help || null, lent: T.lent || {}, def: T.def ? { id: T.def.id, strength: T.def.strength, foes: T.def.foes, at: T.def.at, mods: T.def.mods || {} } : null, log: T.log };
}

// ---- 受付 ----
export function tdAct(rec, b, now = Date.now()) {
  if (!tdOpen(rec)) return { ok: false, why: "ペットを むかえると 集合住宅に 入れます" };
  const T = ensureTd(rec), a = b && b.a;
  if (T.day == null) T.day = jstDay(now);   // 家賃は はじめて 開いた 日から
  T.prop.lv = plvOf(T, now);   // 〔決〕上がった Lv は 下がらない（しまう）
  T.notes = notesOf(rec, T, now);   // 通知の 時計を しまう（見るだけ では しまわれない）
  const life = lifeRun(rec, T, now);   // 住人の 暮らし（前の 受付から いままで の 話す 時刻を まとめて 進める。見るだけ では しまわれない ので 受付で）
  if (a === "td.life") return { ok: true, ...life };   // 画面を 開いた ときに 呼ぶ
  if (a === "td.build") return build(rec, T, b, now);
  if (a === "td.rent") return rent(rec, T, now);
  if (a === "td.movein") return moveIn(rec, T, b, now);
  if (a === "td.out") return moveOut(T, b, now);
  if (a === "td.furn") return buyFurn(rec, T, b, now);
  if (a === "td.gear") return buyGear(rec, T, b, now);
  if (a === "td.price") return setPrice(T, b, now);
  if (a === "td.scout") return scout(rec, T, b, now);
  if (a === "td.bp.scrap") return bpScrap(rec, T, b, now);
  if (a === "td.mod.pick") return modPick(T, b, now);
  if (a === "td.mod.set") return modSet(T, b, now);
  if (a === "td.mod.off") return modOff(T, b, now);
  if (a === "td.mod.scrap") return modScrap(rec, T, b, now);
  if (a === "td.def.start") return defStart(rec, T, b, now);
  if (a === "td.def.end") return defEnd(rec, T, b, now);
  return { ok: false, why: "知らない 受付" };
}
function build(rec, T, b, now) {
  const id = b && b.slot, L = T.prop.lv, cr = rec.credits || 0;
  const short = (cost) => ({ ok: false, why: `クレジットが 足りない：あと ${(cost - cr).toLocaleString("ja-JP")}` });
  if (id === "A+") {   // 〔決〕1 つ目の 建物に 階を 足す（2 Lv きざみ・Lv10 で 5 階）
    if (T.fl >= firstFloorsOf(L)) { const nx = FIRST_FLOORS.at.find((x) => x > L); return { ok: false, why: nx ? `次の 階は 不動産価値 Lv${nx} で` : "1 つ目の 建物は ここまで（この 先は 区画で 広げる）" }; }
    const cost = partPrice("addFloor", roomsPer(FULL_BLOCKS[0]), T.fl + 1);
    if (cr < cost) return short(cost);
    rec.credits -= cost; T.fl++; log(T, `1 つ目の 建物に ${T.fl} 階（${cost.toLocaleString("ja-JP")} cr）`, now);
    return { ok: true, cost, rooms: roomKeys(T).length, fl: T.fl };
  }
  let star = null, stars = T.bpAt;
  if (String(id).startsWith("b:")) {   // 〔決〕区画は 設計図で・数は Lv10 から 先 Lv5 ごとに 1 つ
    const used = Object.keys(T.bpAt).length;
    if (used >= blockSlotsOf(L)) return { ok: false, why: `${used + 1} つ目の 区画は 不動産価値 Lv${BLOCK_LV.from + BLOCK_LV.every * (used + 1)} で` };
    star = Number.isInteger(b.bp) ? T.bp[b.bp] : null;
    if (!BLUEPRINT[star]) return { ok: false, why: "区画の 設計図を えらんで" };
    stars = { ...T.bpAt, ["K" + (T.order.filter((o) => String(o).startsWith("b:")).length + 1)]: star };   // 〔決〕廊下 2 マスの ★は 箱が 1 マス 太い（置き場所も 太さで 数える）
  }
  const x = availOf(T.order, null, T.fl, stars).find((s) => s.id === id);   // 区画の 階は 設計図の ★まで（availOf が 見る）
  if (!x) return { ok: false, why: "そこには まだ 建てられない" };
  const cost = slotCost(T.order, id, T.fl, stars);
  if (cr < cost) return short(cost);
  rec.credits -= cost; T.order.push(id);
  if (star) { T.bp.splice(b.bp, 1); T.bpAt[x.blk] = star; }
  sizeRooms(T); log(T, `増築${star ? `（★${star} の 区画）` : ""}（${cost.toLocaleString("ja-JP")} cr）`, now);
  return { ok: true, cost, rooms: roomKeys(T).length, ...(star ? { star } : {}) };
}
// 設計図の 分解（〔決〕★1 3・★2 6・★3 12・★4 24・★5 48 の スクラップ。本編の 倉庫と 共有）
function bpScrap(rec, T, b, now) {
  const i = b && b.i, st = Number.isInteger(i) ? T.bp[i] : null;
  if (!BLUEPRINT[st]) return { ok: false, why: "分解する 設計図を えらんで" };
  T.bp.splice(i, 1);
  const n = BP_SCRAP[st] ?? 3 * 2 ** (st - 1), rnd = rngOf(hash(`tdx:${rec.id ?? ""}:${now}:${i}`));
  putMats(rec, Array.from({ length: n }, () => ({ id: pick(rnd, SCRAP.wreck)[0], q: 0, n: 1 })), now);
  log(T, `★${st} の 設計図を 分解（スクラップ ${n}）`, now);
  return { ok: true, star: st, scrap: n };
}
// ---- モジュール（td-numbers.js の MODULES。置き場所 1 つに 1 つ・防衛の 合間なら 付けかえ 自由）----
function modPick(T, b, now) {
  const O = T.modOffer, i = b && b.i, m = O && Number.isInteger(i) ? O.list[i] : null;
  if (!m) return { ok: false, why: "えらべる モジュールが ない" };
  T.modInv.push({ id: m.id, star: m.star }); T.modOffer = null; T.mods = T.modInv.length;
  log(T, `モジュール「${MODULES[m.id].name}」★${m.star} を えらんだ`, now);
  return { ok: true, id: m.id, star: m.star };
}
// 置き場所の 鍵：cell（廊下と 階段の マス「階:x:z」）・blk（建てた 箱）・room（部屋の 鍵）
function modPlace(T, place, at) {
  const sh = shapeOf(T.order, T.fl, T.bpAt);
  if (place === "cell") return hallOk(sh, at) ? `cell:${at}` : null;
  if (place === "block") return sh.blocks.some((x) => x.id === at) ? `blk:${at}` : null;
  if (place === "room") return roomKeys(T).includes(at) ? `room:${at}` : null;
  return null;
}
function modSet(T, b, now) {
  if (T.def) return { ok: false, why: "防衛中は 付けかえられない" };
  const i = b && b.i, m = Number.isInteger(i) ? T.modInv[i] : null, M = m && Object.hasOwn(MODULES, m.id) ? MODULES[m.id] : null;
  if (!M) return { ok: false, why: "置く モジュールを えらんで" };
  const k = modPlace(T, M.place, b.at);
  if (!k) return { ok: false, why: M.place === "cell" ? "廊下か 階段の マスに 置く" : M.place === "block" ? "建てた 区画に 置く" : "部屋に 置く" };
  T.modInv.splice(i, 1);
  if (T.modAt[k]) T.modInv.push(T.modAt[k]);   // 置いて あった 物は 持ち物へ
  T.modAt[k] = { id: m.id, star: m.star }; T.mods = T.modInv.length;
  log(T, `モジュール「${M.name}」★${m.star} を 置いた`, now);
  return { ok: true, at: k };
}
function modOff(T, b, now) {
  if (T.def) return { ok: false, why: "防衛中は 付けかえられない" };
  const k = b && b.at;
  if (typeof k !== "string" || !Object.hasOwn(T.modAt, k)) return { ok: false, why: "そこには 置いて いない" };
  T.modInv.push(T.modAt[k]); delete T.modAt[k]; T.mods = T.modInv.length;
  return { ok: true };
}
function modScrap(rec, T, b, now) {   // 〔C〕分解は 設計図と 同じ スクラップ（★1 3〜★5 48）
  const i = b && b.i, m = Number.isInteger(i) ? T.modInv[i] : null;
  if (!m) return { ok: false, why: "分解する モジュールを えらんで" };
  T.modInv.splice(i, 1); T.mods = T.modInv.length;
  const n = BP_SCRAP[m.star] ?? 3 * 2 ** (m.star - 1), rnd = rngOf(hash(`tdm:${rec.id ?? ""}:${now}:${i}`));
  putMats(rec, Array.from({ length: n }, () => ({ id: pick(rnd, SCRAP.wreck)[0], q: 0, n: 1 })), now);
  log(T, `モジュール ★${m.star} を 分解（スクラップ ${n}）`, now);
  return { ok: true, scrap: n };
}
// ---- 住人の 暮らし（2026-11-18 2 代目。鹿さんの カード「本物の時刻」「約 7 日」「7 日」「NPC の子」。数は td-numbers.js の LIFE・式は td-life.js）----
//   日本時間の 7:30 と 20:30 に、となりの 部屋の 2 人が どちらも 家に いて 起きて いれば 話して なかよし ＋7。100 で 子が 生まれ、なかよしは 0 から
//   子は なかよしの 組の 片方の 部屋で 育つ（1 部屋に 1 体まで）・7 日で 大きく なって 空き部屋へ 自分で 移る（相場を 超えた 部屋には 入らない。空きが ない あいだは 待つ）
//   両方の 親が 自分の 子なら 子も 自分の 子（なかまに 入る）・ほかは NPC の 子。住人の diary に 話した・子が 生まれた・移った を 残す（新しい 順 8 つ）
//   〔C〕なかよしは 住人が 入れかわると 0 から（鍵に 入居の 時刻）・まとめて 進めるのは 14 日前まで・病気の 日は 話さない・子は 大きく なるまで 防衛に 出ず 家賃も ない
const diaryAdd = (r, at, s, n) => { (r.diary ||= []).unshift({ at, s, ...(n ? { n } : {}) }); r.diary.length = Math.min(r.diary.length, LIFE.diaryMax); };
const stampOf = (k, r) => `${k}@${r.at || 0}`;
export const bondOf = (T, a, b) => (T.res[a] && T.res[b] ? T.bond[bondKeyOf(stampOf(a, T.res[a]), stampOf(b, T.res[b]))] || 0 : 0);
// 親の 形：自分の 子は なかまの 記録（配合で 受けついだ 物も ふくむ）・NPC は 住人の 記録 ＋ 受けついだ 物（kin）
const parentRec = (rec, r) => (r.uid && (rec.tamed || []).find((c) => c.uid === r.uid)) || parentOf(r);
function lifeRun(rec, T, now) {
  if (!T.life || !Number.isFinite(T.life.at)) { T.life = { at: now }; return { talks: 0, born: [], moved: [] }; }   // はじめて 開いた ときから 数える
  const out = { talks: 0, born: [], moved: [] };
  if (now <= T.life.at) return out;
  for (const t of slotTimes(Math.max(T.life.at, now - LIFE.backDays * 86400000), now)) { lifeGrow(rec, T, t, out); lifeTalk(rec, T, t, out); }
  lifeGrow(rec, T, now, out);
  const live = new Set(Object.entries(T.res).map(([k, r]) => stampOf(k, r)));   // いない 住人の なかよしは しまう
  for (const k of Object.keys(T.bond)) if (!k.split("|").every((x) => live.has(x))) delete T.bond[k];
  T.life.at = now;
  return out;
}
function lifeTalk(rec, T, t, out) {
  const m = jstMin(t), d = jstDay(t);
  for (const [a, b] of pairsOf(Object.keys(T.res))) {
    const A = T.res[a], B = T.res[b];
    if ((A.at || 0) > t || (B.at || 0) > t || sickNow(A, d) || sickNow(B, d)) continue;
    if (stateAt(planOf("r:" + a, A.wk), m) !== "在宅" || stateAt(planOf("r:" + b, B.wk), m) !== "在宅") continue;
    const k = bondKeyOf(stampOf(a, A), stampOf(b, B)), v = Math.min(LIFE.full, (T.bond[k] || 0) + LIFE.talk);
    T.bond[k] = v; out.talks++; diaryAdd(A, t, "と 話した", B.name); diaryAdd(B, t, "と 話した", A.name);
    if (v < LIFE.full) continue;
    const home = !A.kid ? a : !B.kid ? b : null; if (!home) continue;   // 子は 1 部屋に 1 体まで（どちらの 部屋にも 子が いれば 待つ）
    const R = rngOf(hash(`tdk:${rec.id ?? ""}:${k}:${t}`)), kid = { ...kidOf(A, B, R()), born: t };   // kid.tree：戦いの ツリー（まざった 子は 親の ツリー〔C〕）
    // 〔決〕受けつぎは 配合と 同じ（サブスキル 2 つ〈自動〉・受けついだ 力・＋値・スキルポイント。2026-11-18 カード）
    const uid = kid.mine ? "t" + (rec.uidN = (rec.uidN || 0) + 1).toString(36) : undefined, c = kidInherit(parentRec(rec, A), parentRec(rec, B), kid.tree, kid.lv, R, uid);
    if (c) kid.kin = kinOf(c);
    if (kid.mine && c) { kid.uid = uid; (rec.tamed ||= []).push({ ...c, name: kid.name, ...(kid.id !== kid.tree ? { tdMix: kid.id } : {}) }); }   // 自分の 子どうしの 子は なかまに 入る（まざった 子は tdMix に 絵の id）
    T.res[home].kid = kid; T.bond[k] = 0; out.born.push(kid.name);
    diaryAdd(A, t, "子が 生まれた：", kid.name); diaryAdd(B, t, "子が 生まれた：", kid.name); log(T, `${A.name} と ${B.name} に 子（${kid.name}）`, t);
  }
}
function lifeGrow(rec, T, t, out) {
  for (const [k, r] of Object.entries(T.res)) {
    const kid = r.kid; if (!kid || t - kid.born < LIFE.growDays * 86400000) continue;
    const to = roomKeys(T).find((x) => !T.res[x] && stepOf(T.rooms[x]) <= marketAt(T.rooms[x]));
    if (!to) { kid.want = true; continue; }   // 空き部屋が ない あいだは 親の 部屋で 待つ
    const R = rngOf(hash(`tdg:${rec.id ?? ""}:${k}:${kid.born}`));
    T.res[to] = { id: kid.id, name: kid.name, lv: kid.lv, sat: TD_C.satIn, type: typeOf(kid.tree || kid.id, R), ...(kid.uid ? { uid: kid.uid } : {}), ...(kid.kin ? { kin: kid.kin } : {}), ...(kid.par ? { par: kid.par } : {}), at: t, born: kid.born, ...jobMake(kid.id, R, false) };
    delete r.kid; out.moved.push(kid.name);
    diaryAdd(r, t, "子が 部屋に 移った：", kid.name); diaryAdd(T.res[to], t, "大きく なって 部屋に 移った"); log(T, `${kid.name} が 大きく なって 部屋に 移った`, t);
  }
}
function rent(rec, T, now) {
  const day = jstDay(now), days = Math.min(TD_C.rentKeep, Math.max(0, day - T.day));
  if (!days) return { ok: false, why: "家賃は 1 日 1 回（あしたに なったら）" };
  let cr = 0; const up = [], fled = [], sick = [];
  for (const [key, r] of Object.entries(T.res)) {
    r.sat = satNow(T, key, now);
    if (r.sat < SAT.fleeBelow) { fled.push(r.name); delete T.res[key]; continue; }   // 〔決〕夜逃げ（持って いる 子は また 掲示板に 出る）
    // 〔決〕病気の くじ（1 日ずつ）：1% ＋（100 − 満足度）× 0.1% ＋ 汚れの 日数 × 0.5%（最大 5%）。3 日で 治る。病気の あいだは 仕事に 出ない（家賃 なし）
    const R = T.rooms[key] || {}, clean = (R.gear || []).some((g) => SAT.clean.includes(g)), d0 = jstDay(r.at || now);
    let work = 0;
    for (let d = day - days + 1; d <= day; d++) {
      if (!sickNow(r, d) && rngOf(hash(`tds:${rec.id ?? ""}:${key}:${r.at || 0}:${d}`))() < sickOdds(r.sat, clean ? 0 : d - d0)) { r.sickTo = d + SICK.days; sick.push(r.name); }
      if (!sickNow(r, d)) { work++; cr += payDay(rec, T, key, r, r.sat, d); }   // 〔決〕払える 段 ＋ がまん まで（2 代目）
      else r.sd = (r.sd || 0) + 1;   // 休んだ 日は 腕の 日数に 入れない
    }
    r.sick = sickNow(r, day);
    if (!work) continue;
    if (r.uid) { const c = (rec.tamed || []).find((x) => x.uid === r.uid); if (c) { const n = levelUp(c, workExp(r.lv, work)); r.lv = c.lv; if (n) up.push(c.uid); } }   // 〔決〕仕事の 経験値は 持って いる 子だけ
  }
  rec.credits = (rec.credits || 0) + cr; T.day = day; T.prop.rent = (T.prop.rent || 0) + cr; log(T, `家賃 ${days} 日ぶん（${cr.toLocaleString("ja-JP")} cr）`, now);
  return { ok: true, cr, days, up, fled, sick };
}
function moveIn(rec, T, b, now) {
  const B = boardOf(rec, T, now), w = B.list[b && b.i | 0], key = b && b.key;
  if (!w || w.taken) return { ok: false, why: "その 入居希望は もう いない" };
  if (!roomKeys(T).includes(key) || T.res[key]) return { ok: false, why: "空き部屋を えらんで" };
  if (stepOf(T.rooms[key]) > marketAt(T.rooms[key])) return { ok: false, why: `家賃が 部屋に 見合わないので 入らない（相場は「${RENT_STEP[marketAt(T.rooms[key])].name}」まで）` };   // 〔C〕
  if (w.uid && (!(rec.tamed || []).some((c) => c.uid === w.uid) || Object.values(T.res).some((r) => r.uid === w.uid))) return { ok: false, why: "その 子は もう 住んで いる" };
  T.res[key] = { id: w.id, name: w.name, lv: w.lv, sat: TD_C.satIn, type: w.type, ...(w.uid ? { uid: w.uid } : {}), at: now, wk: w.wk, job: w.job, wd0: w.wd0 || 0, tol: w.tol || 0 };
  T.board = { h: B.h, n: B.n, taken: [...(T.board && T.board.h === B.h ? T.board.taken : []), w.i] };
  log(T, `${w.name} が 入居`, now);
  return { ok: true };
}
// 家具（1 部屋 3 つまで）・設備（1 部屋に 1 しゅるい 1 つ）。部屋に のこる
function buyFurn(rec, T, b, now) {
  const key = b && b.key, F = Object.hasOwn(TD_FURN, b?.id) ? TD_FURN[b.id] : null, inv = !!(b && b.inv);   // 自分の 鍵だけ（「__proto__」を 家具に しない）
  if (!roomKeys(T).includes(key) || !F) return { ok: false, why: "部屋と 家具を えらんで" };
  const R = (T.rooms[key] ||= {}); R.furn ||= [];
  if (R.furn.length >= FURN_MAX) return { ok: false, why: `家具は 1 部屋 ${FURN_MAX} つまで` };
  if (inv && !(T.inv[b.id] > 0)) return { ok: false, why: "その 家具は 持って いない" };   // ドロップした 家具は Lv が 足りなくても 置ける・ただ
  if (!inv && (FURN_LV[b.id] || 1) > T.prop.lv) return { ok: false, why: `${F.name}は 不動産価値 Lv${FURN_LV[b.id]} で 買える` };   // 〔決〕家具の Lv（4 段）
  const cost = inv ? 0 : F.price;
  if ((rec.credits || 0) < cost) return { ok: false, why: `クレジットが 足りない：あと ${(cost - (rec.credits || 0)).toLocaleString("ja-JP")}` };
  settle(T, key, now); rec.credits -= cost; if (inv) T.inv[b.id]--; R.furn.push(b.id); log(T, `${F.name}（${inv ? "持ち物から" : `${cost.toLocaleString("ja-JP")} cr`}）`, now);
  return { ok: true, cost, sat: T.res[key] ? satNow(T, key, now) : null };
}
function buyGear(rec, T, b, now) {
  const key = b && b.key, G = Object.hasOwn(GEAR, b?.id) ? GEAR[b.id] : null;
  if (!roomKeys(T).includes(key) || !G) return { ok: false, why: "部屋と 設備を えらんで" };
  const R = (T.rooms[key] ||= {}); R.gear ||= [];
  if (R.gear.includes(b.id)) return { ok: false, why: "その 設備は もう ある" };
  if ((G.lv || 1) > T.prop.lv) return { ok: false, why: `${G.name}は 不動産価値 Lv${G.lv} で 買える` };   // 〔決〕設備の Lv
  if ((rec.credits || 0) < G.price) return { ok: false, why: `クレジットが 足りない：あと ${(G.price - (rec.credits || 0)).toLocaleString("ja-JP")}` };
  settle(T, key, now); rec.credits -= G.price; R.gear.push(b.id); log(T, `設備（${G.price.toLocaleString("ja-JP")} cr）`, now);
  return { ok: true, cost: G.price, sat: T.res[key] ? satNow(T, key, now) : null };
}
// 家賃の 高さ〔決〕：部屋ごとに 0 安い・1 ふつう・2 高い・3 とても高い・4 強気。部屋に のこる（住人が かわっても）
function setPrice(T, b, now) {
  const key = b && b.key, step = b && b.step;
  if (!roomKeys(T).includes(key) || !Number.isInteger(step) || !RENT_STEP[step]) return { ok: false, why: "部屋と 家賃の 高さを えらんで" };
  const R = (T.rooms[key] ||= {});
  settle(T, key, now); R.step = step;
  return { ok: true, step, market: marketAt(R), sat: T.res[key] ? satNow(T, key, now) : null };
}
// スカウト〔決〕：満足度 100 の NPC の 住人を シグナルで なかまに（なかよしの 形で 入る。部屋には そのまま 住む）
const rankLetter = (id) => { const rk = speciesOf(id)?.rank; return typeof rk === "number" ? RANKS[rk] ?? "F" : rk ?? "F"; };
function scout(rec, T, b, now) {
  const key = b && b.key, r = T.res[key];
  if (!r || r.uid) return { ok: false, why: "スカウトできる 住人を えらんで" };
  if (satNow(T, key, now) < SAT.scout) return { ok: false, why: `満足度が ${SAT.scout} に なると スカウトできる` };
  const rank = rankLetter(r.id), cost = SCOUT_SIG[rank] ?? SCOUT_SIG.F;
  if (T.sig < cost) return { ok: false, why: `シグナルが 足りない：あと ${cost - T.sig}` };
  const tr = treeOfRes(r), f = foeOf({ tree: tr, type: ENEMY_TREES[tr]?.type ?? r.type, lv: r.lv, name: r.name }), uid = "t" + (++rec.uidN).toString(36);   // まざった 子は 親の ツリー〔C〕・受けついだ 物は なかまでも そのまま（2026-11-18）
  const c = { uid, ...f, tree: tr, exp: 0, gauge: SNACK_NEED[ENEMY_TREES[tr]?.rank] ?? SNACK_NEED.通常, sex: sexOf(Math.random()), ...(r.kin ? { plus: r.kin.plus, inh: r.kin.inh, subs: r.kin.subs, sp: r.kin.sp, carry: r.kin.carry, gen: r.kin.gen } : {}), ...(tr !== r.id ? { tdMix: r.id } : {}) };
  (rec.tamed ||= []).push(c); T.sig -= cost; r.uid = uid;
  log(T, `${r.name} を スカウトした（シグナル ${cost}）`, now);
  return { ok: true, uid, cost, rank };
}
function moveOut(T, b, now) {
  const r = T.res[b && b.key];
  if (!r) return { ok: false, why: "その 部屋は 空いて いる" };
  delete T.res[b.key]; log(T, `${r.name} が 出て いった`, now);
  return { ok: true };
}
function defStart(rec, T, b, now) {
  if (T.def) return { ok: false, why: "防衛中" };
  const N = T.notes, i = b && b.i | 0, note = N.list[i];
  if (!note) return { ok: false, why: "その 通知は もう ない" };
  N.list.splice(i, 1); T.notes = N;
  T.def = { id: `d${now.toString(36)}${note.k}`, strength: note.strength, foes: note.foes, at: now, mods: { ...T.modAt } };   // 画面は この mods で td-battle を 回す
  return { ok: true, def: T.def };
}
function defEnd(rec, T, b, now) {
  const D = T.def;
  if (!D || !b || b.id !== D.id) return { ok: false, why: "防衛の 記録が ない" };
  if (now - D.at < TD_C.defMin) return { ok: false, why: "まだ 戦いの 途中" };
  const won = !!b.won, keys = Object.keys(T.res);
  const kills = won ? D.foes.length : Math.max(0, Math.min(D.foes.length, TD_C.killsMax, Math.floor(+b.kills || 0)));
  const R = rewardOf(D.strength, { won }), rnd = rngOf(hash(`tdr:${D.id}`));
  rec.credits = Math.max(0, (rec.credits || 0) + R.cr - R.take);
  T.sig += R.sig;
  // 素材：攻めて きた 敵の 素材・スクラップ（品質 0）〔決〕本編の 倉庫と 共有
  const mats = [];
  const matIds = D.foes.map((f) => ENEMY_MAT[f.id]).map((m) => (Array.isArray(m) ? m[0] : m)).filter(Boolean);   // 素材の 表の ない 敵（_ev など）は 除く。どの 敵にも なければ スクラップ
  for (let k = 0; k < R.mat; k++) mats.push({ id: matIds.length ? pick(rnd, matIds) : pick(rnd, SCRAP.wreck)[0], q: 0, n: 1 });
  for (let k = 0; k < R.scrap; k++) mats.push({ id: pick(rnd, SCRAP.wreck)[0], q: 0, n: 1 });
  if (mats.length) putMats(rec, mats, now);
  // 〔決〕モジュール：防衛の 報酬の 割合で 落ちると 3 つから 1 つ えらぶ（td.mod.pick）。★は 設計図と 同じ 表〔C〕3 つは 同じ ★・ちがう モジュール
  const mod = R.module && rnd() < R.module ? 1 : 0;
  if (mod) { const star = bpStar(D.strength, rnd()), pool = Object.keys(MODULES).filter((id) => !MODULES[id].star5 || star >= 5), list = [];
    while (list.length < MOD_OFFER && pool.length) list.push({ id: pool.splice(Math.floor(rnd() * pool.length), 1)[0], star });
    T.modOffer = { id: D.id, list }; }
  // 〔決〕守りきると：不動産価値の 勝ち（強さ）・家具（強さ × 4%。強いほど 高い）・設計図（強さ × 1.5%。★は 強さで）
  let furn = null, bp = null;
  if (won) {
    T.prop.wins = (T.prop.wins || 0) + D.strength;
    if (rnd() < D.strength * FURN_DROP) { furn = pick(rnd, furnDropPool(D.strength)); T.inv[furn] = (T.inv[furn] || 0) + 1; }
    if (rnd() < D.strength * BP_DROP) { bp = bpStar(D.strength, rnd()); T.bp.push(bp); }
  }
  // 経験値：倒した 敵の Lv × 0.3 を 戦いに 出た 持って いる 子 みんなに〔決〕
  const killed = [...D.foes].sort((x, y) => y.lv - x.lv).slice(0, kills).map((f) => f.lv), exp = battleExp(killed), up = [];
  const fought = (Array.isArray(b.fought) ? b.fought : []).filter((k) => keys.includes(k)).slice(0, FIGHT.side * 4);
  for (const k of fought) { const r = T.res[k]; if (!r || !r.uid) continue; const c = (rec.tamed || []).find((x) => x.uid === r.uid); if (c && exp) { if (levelUp(c, exp)) up.push(c.uid); r.lv = c.lv; } }
  // 殺された 住人：NPC は 出て いく・持って いる 子は 復活待ち
  const dead = [];
  for (const k of (Array.isArray(b.dead) ? b.dead : []).filter((k) => keys.includes(k))) { const r = T.res[k]; if (r.uid && !T.dead.includes(r.uid)) T.dead.push(r.uid); dead.push(r.name); delete T.res[k]; }
  T.def = null;
  log(T, `${won ? "守りきった" : "守れなかった"}（強さ ${D.strength}・${R.cr.toLocaleString("ja-JP")} cr${R.take ? `・取られた ${R.take.toLocaleString("ja-JP")}` : ""}）`, now);
  return { ok: true, won, cr: R.cr, take: R.take, sig: R.sig, mats: mats.length, mod, offer: mod ? T.modOffer.list : null, furn, bp, exp, up, dead };
}

// ---- アメジスト（門番の 計画。viewer.js の PLANS）----
export function tdRevivePlan(rec, b) {
  if (!tdOpen(rec)) return { ok: false, why: "ペットを むかえると 集合住宅に 入れます" };
  const T = ensureTd(rec), uid = b && b.uid, c = (rec.tamed || []).find((x) => x.uid === uid);
  if (!c || !T.dead.includes(uid)) return { ok: false, why: "復活を 待って いる 子を えらんで" };
  const rk = speciesOf(c.tree)?.rank, rank = typeof rk === "number" ? RANKS[rk] ?? "F" : rk ?? "F", cost = REVIVE[rank] ?? REVIVE.F;   // ランクは 0〜7（F〜EX）
  return { costs: [{ kind: "res", d: -cost }], why: "td.revive:" + uid, take: () => { T.dead = T.dead.filter((x) => x !== uid); }, info: { cost, rank } };
}
export function tdBoardPlan(rec, now = Date.now()) {
  if (!tdOpen(rec)) return { ok: false, why: "ペットを むかえると 集合住宅に 入れます" };
  const T = ensureTd(rec), B = boardOf(rec, T, now);
  return { costs: [{ kind: "res", d: -BOARD_REFRESH }], why: "td.board", take: () => { T.board = { h: B.h, n: B.n + 1, taken: [] }; }, info: { cost: BOARD_REFRESH } };
}
