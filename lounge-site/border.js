// ボーダーゾーン（docs/mono-link-border-zone.md）：決まりの データと、1 回の 出撃の 計算
// 鹿さんの 決め（2026-10-30）：派遣と 同じ 自動・集めて 脱出・力つきたら 集めた 物を ぜんぶ 失う・1・3・10 分・外縁／中／奥・レベル帯・★の 出方・値段・鑑定 20
// 決まって いない 所（Claude の 案。数は 仮）：素材の 落ちる 割合・出来事の 起きる 割合・封鎖された 所と クレートの 中身・帰り道の 長さ
// 計算は 門番が 1 歩ずつ（Cloudflare の 1 回 10 ミリ秒に 収まる ように、戦いは 1 歩に 1 回まで）。同じ 種なら 同じ 結果
// 「帰還」を 押したら、その 歩の 控え（snaps）から 帰り道に 切りかえて 計算しなおす
import { BORDER, VALUE } from "./materials.js";
import { simulateTeams, vitalsOf } from "./battle-sim.js";
import { foeOf } from "./dungeon-sim.js";
import { petAt } from "./builds.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { MAIN_TREES } from "./main-trees.js";
import { ROSTER } from "./fusion-only.js";
import { EXP_PER_LV } from "./dungeons.js";
import { INS_PLAN } from "./deeplink.js";

export const BZ_STEP_S = 10;   // 1 歩 10 秒（Claude の 案）
// 時間（分）：1 分は 外縁だけ、3 分で 中、10 分なら 奥まで（鹿さんの 決め）
export const BZ_RUNS = { 1: { steps: 6, depth: 0 }, 3: { steps: 18, depth: 1 }, 10: { steps: 60, depth: 2 } };
export const BZ_DEPTH = ["外縁", "中", "奥"];
// エリア（ゾーン）。レベル帯は 外縁・中・奥（鹿さんの 決め）
// 鹿さんの 頼み（2026-11-05）：「〇〇の領地という名称が気に食わないです。」「もっとゾーンを細かく分けてください。ハルモニア側には農業プラント郡などを設定してください。」
//   「農業プラント郡という名称から察しませんか？ネーミングか良くないからこのように1つ提案しました。」
//   → 各社の 側に 3 つ・境界に 2 つ（Claude の 案）。名前は 鹿さんの 見本「農業プラント群」に そろえた 施設・区画の 呼び名（Claude の 案）。境界に 近いほど Lv が 高い（Claude の 案）
// side：どの 会社の 側か（色・名物の サンプル）、group：出て くる POM の 会社と 好感度（境界は 毎回 くじ）、mats：素材の 表、like：出やすい サンプルの 系統（Claude の 案）
// map：衛星写真の 地図（bzmap.py の 絵。絵の m 座標・3000×2100）の 上の 線と 札の 位置
const Z = (name, side, lv, like, pts, label) => ({ name, side, group: side === "edge" ? null : side, mats: side, lv, like, map: { pts, label } });
export const BZ_AREAS = {
  h_plant: Z("農業プラント群", "harmonia", [50, 55, 60], "bio", [[560, 60], [1400, 60], [1420, 480], [1180, 495], [880, 500], [560, 485]], [1000, 285]),
  h_pivot: Z("灌漑試験農場", "harmonia", [52, 57, 62], null, [[40, 520], [540, 510], [760, 540], [760, 1190], [420, 1230], [50, 1210]], [380, 1000]),
  h_seed: Z("種苗センター", "harmonia", [55, 60, 65], "bio", [[810, 540], [1420, 510], [1430, 700], [1290, 750], [1100, 830], [1060, 1000], [960, 1190], [810, 1190]], [1010, 665]),
  s_mine: Z("第 7 採掘場", "sva", [60, 65, 70], "mineral", [[2060, 600], [2400, 570], [2660, 640], [2680, 900], [2560, 1080], [2330, 1090], [2170, 1000], [2090, 820]], [2430, 1015]),
  s_power: Z("発電コンビナート", "sva", [62, 67, 72], "relic", [[1600, 60], [2400, 60], [2420, 520], [2100, 555], [1700, 555], [1580, 420]], [1990, 445]),
  s_range: Z("砲兵演習場", "sva", [65, 70, 75], "mineral", [[1880, 640], [2020, 640], [2040, 830], [2110, 1030], [2290, 1140], [2280, 1240], [2010, 1250], [1950, 1100], [1930, 880]], [2150, 1205]),
  t_cargo: Z("南部貨物ターミナル", "tcu", [70, 75, 80], "relic", [[1530, 1520], [1880, 1520], [2040, 1570], [2040, 1730], [1540, 1730]], [1760, 1550]),
  t_dig: Z("遺構発掘区画", "tcu", [72, 77, 82], "relic", [[760, 1330], [1140, 1330], [1470, 1380], [1490, 1730], [1060, 1730], [700, 1660], [650, 1500]], [950, 1415]),
  t_forest: Z("林道検問所", "tcu", [75, 80, 85], "bio", [[2120, 1300], [2480, 1300], [2700, 1260], [2760, 1500], [2700, 1720], [2120, 1730], [2080, 1560]], [2530, 1420]),
  e_admin: Z("旧行政区", "edge", [80, 90, 100], "relic", [[1530, 770], [1810, 830], [1870, 1040], [1760, 1250], [1520, 1320], [1400, 1300], [1440, 1140], [1520, 980]], [1610, 1075]),
  e_ford: Z("第 1 渡河点", "edge", [85, 92, 100], null, [[1180, 820], [1340, 790], [1470, 800], [1450, 960], [1360, 1120], [1300, 1290], [1150, 1270], [1100, 1060]], [1250, 925]),
};
export const SIDE_NAME = { harmonia: "ハルモニア側", sva: "SVA 側", tcu: "TCU 側", edge: "境界" };
export const BZ_MAP_SIZE = [3000, 2100];
// ゾーンの 線を かこむ 箱（X0・Y0・X1・Y1）。出撃中・記録の 地図では、遊びの 円（半径 8）を この 箱に 合わせた 楕円に うつす
export const bzBox = (id) => { const P = BZ_AREAS[id].map.pts, xs = P.map((q) => q[0]), ys = P.map((q) => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
// 出撃中・記録の 地図の 切り抜き（X0・Y0・幅・高さ。絵の 内側に おさめる。横長は 1.6 まで・縦長は 1.2 まで）。bzmap_post.py も これを 読む
export const bzCrop = (id) => {
  const [x0, y0, x1, y1] = bzBox(id), [MW, MH] = BZ_MAP_SIZE; let w = (x1 - x0) * 1.12, h = (y1 - y0) * 1.12;
  if (w / h > 1.6) h = w / 1.6; if (h / w > 1.2) w = h / 1.2;
  w = Math.min(w, MW); h = Math.min(h, MH);
  const cx = Math.min(Math.max((x0 + x1) / 2, w / 2), MW - w / 2), cy = Math.min(Math.max((y0 + y1) / 2, h / 2), MH - h / 2);
  return [Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h)];
};
export const GROUP_NAME = { harmonia: "ハルモニア", sva: "SVA", tcu: "TCU" };
// 帯の 上限（レベル帯を こえた ペットは ステータスを この Lv の 強さに そろえる。装備と スキルツリーは そのまま。鹿さんの 決め）
export const capLv = (area) => BZ_AREAS[area].lv[2];
// 帯の 下限（外縁の Lv）より 低い 子は 入れない（2026-11-06 鹿さんの 質問「ボーダーゾーンの下限以下のレベルのペットは入れないようになっていますか？」で 足した。ペットと なかま 全員）
export const floorLv = (area) => BZ_AREAS[area].lv[0];
export const bzLow = (team, area) => team.filter((x) => x && (+x.lv || 1) < floorLv(area));
export const bzLowWhy = (low, area) => `Lv が 足りない：${low.slice(0, 2).map((x) => `${x.name} Lv${+x.lv || 1}`).join("・")}${low.length > 2 ? ` ほか ${low.length - 2}` : ""}（Lv${floorLv(area)} から）`;
// 島 3（ミカネル島）へ 行けるように なるまで 出撃できない（2026-11-06 鹿さん「ボーダーゾーンは島3解放までクローズにしてください。」）
// 島 3 へ 行けるのは 隠れ家の 無線機 Lv2 から（dungeons.js の canGo と 同じ）。出て いる 出撃・記録・サンプル（鑑定・納める）は そのまま 使える
export const BZ_RADIO = 2;
export const bzIsleOk = (hideout) => ((hideout && hideout.radio) || 0) >= BZ_RADIO;
export const BZ_ISLE_WHY = "ミカネル島へ 行けるように なってから（隠れ家の 無線機を Lv2 に すると 開く）";

// 貴重サンプル（名前は 2026-10-30 に 鹿さんの OK）。line：系統（鉱物は SVA・生体は ハルモニア・遺物は TCU が 高く 買う）、local：その 側（BZ_AREAS の side）の 名物
export const SAMPLES = {
  bzs_core: { name: "歪んだ鉱脈の核", line: "mineral" }, bzs_hot: { name: "熱をもつ石", line: "mineral" }, bzs_ring: { name: "鳴る鉱石", line: "mineral" },
  bzs_tissue: { name: "変異した組織", line: "bio" }, bzs_spore: { name: "光る胞子", line: "bio" }, bzs_nerve: { name: "焼けた制御神経", line: "bio" },
  bzs_part: { name: "古い時代の部品", line: "relic" }, bzs_media: { name: "読めない記録媒体", line: "relic" }, bzs_seal: { name: "旧政府の刻印板", line: "relic" },
  bzs_glass: { name: "砲火のガラス砂", line: "mineral", local: "sva" }, bzs_sprout: { name: "逃げた苗", line: "bio", local: "harmonia" },
  bzs_stone: { name: "古い礎石", line: "relic", local: "tcu" }, bzs_tag: { name: "持ち主のいない識別票", line: null, local: "edge" },
};
export const LINE_NAME = { mineral: "鉱物", bio: "生体", relic: "遺物" };
export const LINE_BUYER = { mineral: "sva", bio: "harmonia", relic: "tcu" };
export const SAMPLE_PRICE = [40, 70, 125, 225, 400];   // 納める 値段 ★1〜5（鹿さんの 決め）
export const SAMPLE_STAR = [[50, 30, 15, 5, 0], [40, 30, 18, 9, 3], [25, 30, 25, 14, 6]];   // 深さごとの ★の 出方（鹿さんの 決め）
export const APPRAISE_FEE = 20;   // 鑑定（ガラク）1 こ 20（鹿さんの 決め）
export const OFF_LINE = 0.5;      // 好みで ない 会社に 納める ときの 値（Claude の 案）
// 納める 値段：鑑定して いない 物は ★1 の 値段（鹿さんの 決め）・好感度が 盟友（75 から）なら ＋20%（mono-link-numbers.md）
export function samplePrice(s, group, aff = 0) {
  const S = SAMPLES[s.id]; if (!S) return 0;
  const fit = !S.line || LINE_BUYER[S.line] === group ? 1 : OFF_LINE;
  return Math.round(SAMPLE_PRICE[(s.known ? s.star : 1) - 1] * fit * (aff >= 75 ? 1.2 : 1));
}
// 好感度の 高い 会社の 領地では、その 会社の POM が 襲って こない ことが ある（なじみ 10%・信頼 25%・盟友 50%。鹿さんの 決め）
export const affSkip = (aff) => (aff >= 75 ? 0.5 : aff >= 50 ? 0.25 : aff >= 25 ? 0.1 : 0);

// 1 歩の 出来事の 割合（Claude の 案）。10 分（探索 53 歩）で サンプル 約 4・素材 約 250 の 分・戦い 5〜6 回
export const BZ_RATE = { mat: 0.36, sample: 4 / 53, unit: 0.065, pom: 0.04, elite: 0.003, crate: 1 / 53, sealed: 1 / 30 };
export const BZ_INVADE = [0.01, 0.03, 0.05];   // S・EX の 侵入：外縁 1%・中 3%・奥 5%（1 回ごと。鹿さんの 決め）
export const PRIORITY = ["none", "sample", "mat", "crate"];   // 探し物の 優先：えらんだ 物 ×1.5・ほか ×0.75（Claude の 案）
export const RETURN = ["none", "samples", "hp"];   // 帰る 条件：なし・サンプルが n こ・HP が 半分（鹿さんの 決めの 例から）
export const KEY_MAX = 3;          // 持って いく 封鎖された 所の 鍵（Claude の 案）
export const exitSteps = (depth) => depth * 3 + 1;   // 脱出口までの 歩（奥ほど 遠い。Claude の 案）
// 封鎖された 所（鹿さんの 決め：4 種類）。中身は Claude の 案
export const SEALED = { store: "会社の 倉庫", lab: "研究棟", old: "古い 時代の 区画", exit: "必ず 開く 脱出口" };
const POM_PETS = ["mogura", "tv", "beagle", "kurage", "mouse", "pelican", "saboten", "shika"];
const typeOfPet = (pet) => Object.keys(MAIN_TREES).find((k) => MAIN_TREES[k].pet === pet) ?? "drowsy";
const UNIT_TREES = Object.keys(ENEMY_TREES).filter((id) => ["通常", "希少"].includes(ENEMY_TREES[id].rank));
const INVADERS = ROSTER.filter((s) => [6, 7].includes(s.rank) && ENEMY_TREES[s.tree]);

// ---------- 乱数（しまえる 形：状態は 数 1 つ）----------
function rnd(S) { S.R = (S.R + 0x6D2B79F5) >>> 0; let t = S.R; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pickW = (S, list, w) => { const tot = list.reduce((a, x) => a + w(x), 0); let x = rnd(S) * tot; for (const it of list) if ((x -= w(it)) < 0) return it; return list[list.length - 1]; };
const pick = (S, list) => list[Math.floor(rnd(S) * list.length)];

// ---------- 出撃の はじめ ----------
// cfg：{ area, run, pri, ret: { k, n }, keys：持って いく 封鎖の 鍵, crate：クレートの カードキーの 数, aff：領地の 会社の 好感度 }
// team：戦う 形（門番が レベル帯に そろえて 渡す）。seed：くじの 種
export function bzInit(cfg, team, seed) {
  const R = BZ_RUNS[cfg.run], maxDepth = R.depth, explore = Math.max(1, R.steps - exitSteps(maxDepth));
  const S = { cfg, team, R: seed >>> 0, i: 0, explore, maxDepth, depth: 0, hp: team.map(() => 1), mp: team.map(() => 1), mode: "go", left: 0, keys: cfg.keys || 0, crate: cfg.crate || 0,
    haul: { mats: {}, samples: [] }, exp: 0, ev: [], pos: [], snaps: [], sealed: null, safe: false, fin: false, reason: null, inv: null };
  // 入る 所と 出る 所：外縁の どこか（ランダム。鹿さんの 決め）。地図は 中心が 奥の 輪（半径 0〜8）
  const ang = rnd(S) * Math.PI * 2, out = rnd(S) * Math.PI * 2;
  S.at = [Math.cos(ang) * 8, Math.sin(ang) * 8]; S.exit = [Math.cos(out) * 8, Math.sin(out) * 8]; S.pos.push(S.at.map((v) => +v.toFixed(2)));
  if (rnd(S) < BZ_INVADE[maxDepth] && INVADERS.length) {   // 侵入：出撃の はじめに 決める（いつ・だれ）
    const s = pick(S, INVADERS), lv = BZ_AREAS[cfg.area].lv[maxDepth] + 30 + Math.floor(rnd(S) * 30);   // 帯 ＋30〜59（Claude の 案）
    S.inv = { at: Math.floor(explore * (0.3 + 0.6 * rnd(S))), tree: s.tree, name: s.name, type: s.type, lv };
  }
  return S;
}
const ringOf = (depth) => [8 - depth * 3, 6 - depth * 3];   // 深さの 輪の 半径（外縁 6〜8・中 3〜5・奥 0〜2）
const depthAt = (S) => Math.min(S.maxDepth, Math.floor((S.i / S.explore) * (S.maxDepth + 1)));
const alive = (S) => S.hp.map((h, k) => k).filter((k) => S.hp[k] > 0);

// ---------- 1 歩 ----------
// 戦いを max 回 したら 止める。終わったら true
export function bzStep(S, max = 1) {
  let n = 0;
  while (!S.fin && n < max) {
    snap(S);
    if (oneStep(S)) n++;
  }
  return S.fin;
}
function snap(S) {
  S.snaps.push({ i: S.i, R: S.R, hp: [...S.hp], mp: [...S.mp], mode: S.mode, left: S.left, depth: S.depth, keys: S.keys, crate: S.crate, sealed: S.sealed, safe: S.safe, exp: S.exp,
    haul: { mats: { ...S.haul.mats }, samples: S.haul.samples.map((x) => ({ ...x })) }, ev: S.ev.length, pos: S.pos.length });
}
function move(S) {   // 地図の 上の 点：行きは 深さの 輪へ、帰りは 出口へ（1 歩 1.2 マス）
  const [x, y] = S.pos[S.pos.length - 1];
  let tx, ty;
  if (S.mode === "exit") [tx, ty] = S.exit;
  else { const [hi, lo] = ringOf(S.depth), r = Math.hypot(x, y), a = Math.atan2(y, x) + (rnd(S) - 0.5) * 0.9, want = r > hi ? hi : r < lo ? lo : r + (rnd(S) - 0.5) * 1.5; tx = Math.cos(a) * want; ty = Math.sin(a) * want; }
  const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1, s = Math.min(d, 1.2);
  S.pos.push([+(x + (dx / d) * s).toFixed(2), +(y + (dy / d) * s).toFixed(2)]);
}
const mul = (S, k) => (S.cfg.pri === "none" || !S.cfg.pri ? 1 : S.cfg.pri === k ? 1.5 : 0.75);
function oneStep(S) {
  const A = BZ_AREAS[S.cfg.area];
  let fought = false;
  if (S.mode === "go") {
    S.depth = depthAt(S); move(S);
    if (S.inv && S.inv.at === S.i) fought = invade(S);
    else {
      const r = rnd(S), b = BZ_RATE;
      if (r < b.elite) fought = battle(S, "elite");
      else if (r < b.elite + b.pom) fought = battle(S, "pom");
      else if (r < b.elite + b.pom + b.unit) fought = battle(S, "unit");
      if (!S.fin) finds(S, A);
    }
    if (!S.fin) {
      regen(S); S.i++;
      if (wantBack(S) || S.i >= S.explore) toExit(S, S.i >= S.explore ? "time" : "cond");
    }
  } else if (S.mode === "exit") {
    if (S.left <= 0) { end(S, "back"); return fought; }
    move(S);
    if (!S.safe) { const r = rnd(S); if (r < BZ_RATE.pom * 0.6) fought = battle(S, "pom"); else if (r < (BZ_RATE.pom + BZ_RATE.unit) * 0.6) fought = battle(S, "unit"); }
    if (!S.fin) { regen(S); S.left--; S.i++; }
  }
  return fought;
}
function toExit(S, why) {
  S.mode = "exit"; S.left = S.safe ? 0 : exitSteps(S.depth);
  S.ev.push({ i: S.i, k: "turn", why, safe: S.safe || undefined });
}
function wantBack(S) {
  const ret = S.cfg.ret || {};
  if (ret.k === "samples") return S.haul.samples.length >= (ret.n || 1);
  if (ret.k === "hp") { const a = alive(S); return a.length > 0 && a.reduce((t, k) => t + S.hp[k], 0) / a.length < 0.5; }
  return false;
}
const regen = (S) => { for (const k of alive(S)) { S.hp[k] = Math.min(1, S.hp[k] + 0.03); S.mp[k] = Math.min(1, S.mp[k] + 0.03); } };   // 歩きながら 少し 回復（Claude の 案）
function end(S, reason) { S.fin = true; S.reason = reason; S.ev.push({ i: S.i, k: "end", why: reason }); }

// 拾う：素材・サンプル・クレート・封鎖された 所
function finds(S, A) {
  const b = BZ_RATE;
  if (rnd(S) < b.mat * mul(S, "mat")) {
    const pool = [...BORDER.any, ...BORDER[A.mats]].map(([id]) => id), k = [1.2, 0.8, 0.5][S.depth];   // 値の 高い 物ほど 出にくい（奥ほど ゆるい）
    const id = pickW(S, pool, (x) => Math.pow(VALUE[x] || 10, -k));
    S.haul.mats[id] = (S.haul.mats[id] || 0) + 1; S.ev.push({ i: S.i, k: "mat", id });
  }
  if (rnd(S) < b.sample * mul(S, "sample")) addSample(S, A, S.depth, null, "find");
  if (S.crate > 0 && rnd(S) < b.crate * mul(S, "crate")) {   // 施錠された クレート（クレートの カードキーで 開ける）：サンプル 1（★2 から）・素材 2（品質 1）
    S.crate--; S.ev.push({ i: S.i, k: "crate" });
    addSample(S, A, Math.min(2, S.depth + 1), 2, "crate");
    for (let j = 0; j < 2; j++) { const id = pick(S, [...BORDER.any, ...BORDER[A.mats]]).at(0), key = id + "@1"; S.haul.mats[key] = (S.haul.mats[key] || 0) + 1; }
  }
  if (S.keys > 0 && !S.sealed && S.depth >= 1 && rnd(S) < b.sealed) {   // 封鎖された 所：鍵を 1 枚 使う（1 回の 出撃で 1 か所まで）
    const kind = pickW(S, Object.keys(SEALED), (x) => (x === "exit" ? 1 : 2));
    S.keys--; S.sealed = kind; S.ev.push({ i: S.i, k: "sealed", kind });
    if (kind === "store") for (let j = 0; j < 3; j++) { const id = pick(S, BORDER[A.mats])[0], key = id + "@2"; S.haul.mats[key] = (S.haul.mats[key] || 0) + 1; }
    else if (kind === "lab") { addSample(S, A, 2, 2, "lab"); addSample(S, A, 2, 2, "lab"); }
    else if (kind === "old") { addSample(S, A, S.depth, null, "old", "relic"); addSample(S, A, S.depth, null, "old", "relic"); }
    else S.safe = true;   // 必ず 開く 脱出口：帰り道で 襲われない・すぐ 出られる
  }
}
function addSample(S, A, depth, minStar, how, line) {
  const loc = Object.keys(SAMPLES).find((id) => SAMPLES[id].local === A.side);
  let id;
  if (line) id = pick(S, Object.keys(SAMPLES).filter((x) => SAMPLES[x].line === line && !SAMPLES[x].local));
  else if (rnd(S) < 0.25) id = loc;   // 名物は 4 こに 1 こ（Claude の 案）
  else { const L = A.like && rnd(S) < 0.5 ? A.like : null; id = pick(S, Object.keys(SAMPLES).filter((x) => !SAMPLES[x].local && (!L || SAMPLES[x].line === L))); }   // ゾーンの 出やすい 系統は 半分（Claude の 案）
  const w = SAMPLE_STAR[depth], star = Math.max(minStar || 1, 1 + pickW(S, [0, 1, 2, 3, 4], (j) => w[j]));
  S.haul.samples.push({ id, star }); S.ev.push({ i: S.i, k: "sample", id, how });
}

// ---------- 戦い（いまの 自動戦闘。鹿さんの 決め）----------
function foesOf(S, kind) {
  const A = BZ_AREAS[S.cfg.area], lv = A.lv[S.depth];
  if (kind === "unit") { const n = 1 + (rnd(S) < 0.4 ? 1 : 0); return { foes: Array.from({ length: n }, () => { const t = pick(S, UNIT_TREES); return foeOf({ tree: t, type: ENEMY_TREES[t].type, lv, name: ENEMY_TREES[t].enemy }); }), lv }; }
  const group = A.group || pick(S, Object.keys(GROUP_NAME));
  const n = kind === "pom" && rnd(S) < 0.3 ? 2 : 1, sp = () => pick(S, POM_PETS);
  const foes = Array.from({ length: n }, () => { const s = sp(); return { ...petAt(typeOfPet(s), lv + (kind === "elite" ? 5 : 0), { species: s }), name: `${GROUP_NAME[group]} POM`, lv, species: s, owner: GROUP_NAME[group], co: group }; });
  return { foes, lv, group };
}
function battle(S, kind) {
  const { foes, lv, group } = foesOf(S, kind);
  if (kind === "pom" && group && group === BZ_AREAS[S.cfg.area].group && rnd(S) < affSkip(S.cfg.aff || 0)) { S.ev.push({ i: S.i, k: "pass", group }); return false; }   // 好感度で 見逃して くれた
  return fight(S, kind, foes, lv, group);
}
function invade(S) {
  const v = S.inv, f = { ...foeOf({ tree: v.tree, name: v.name, type: v.type, lv: v.lv }), owner: "侵入者" };
  return fight(S, "inv", [f], v.lv, null);
}
function fight(S, kind, foes, lv, group) {
  const idx = alive(S); if (!idx.length) { end(S, "wipe"); return false; }
  const party = idx.map((k) => { const c = S.team[k], v = vitalsOf(c); return { ...c, startHp: Math.max(1, Math.round(S.hp[k] * v.maxHp)), startMp: Math.round(S.mp[k] * v.maxMp) }; });
  const seed = Math.floor(rnd(S) * 2 ** 31), ev = simulateTeams(party, foes, seed, { pve: true, quiet: true }), last = ev[ev.length - 1], win = last.winner === 0;
  idx.forEach((k, j) => { const v = vitalsOf(S.team[k]); S.hp[k] = Math.max(0, last.final[j].hp / v.maxHp); S.mp[k] = Math.max(0, last.final[j].mp / v.maxMp); });
  if (win) S.exp += Math.round(foes.reduce((a, f) => a + (f.lv || lv), 0) * EXP_PER_LV);
  const drawn = !win && alive(S).length > 0;   // 時間切れで 勝ち負けが つかなかった（全滅は して いない）：引いて 先へ
  S.ev.push({ i: S.i, k: "fight", kind, win, ...(drawn ? { draw: true } : {}), lv, n: foes.length, ...(group ? { group } : {}), names: foes.map((f) => f.name), seed });
  if (!alive(S).length) end(S, "wipe");
  return true;
}

// ---------- 帰還（いつでも 押せる。鹿さんの 決め）----------
// i 歩めの はじめの 控えに もどして、帰り道に 切りかえる（その 歩からは 出口へ 向かう。着くまでは 襲われる ことが ある）
export function bzRecall(S, i) {
  if (S.mode === "exit" && S.recall != null) return false;
  const k = S.snaps.findIndex((x) => x.i >= i); if (k < 0) return false;
  const s = S.snaps[k];
  if (s.mode !== "go") return false;   // もう 帰り道
  Object.assign(S, { i: s.i, R: s.R, hp: [...s.hp], mp: [...s.mp], mode: s.mode, left: s.left, depth: s.depth, keys: s.keys, crate: s.crate, sealed: s.sealed, safe: s.safe, exp: s.exp,
    haul: { mats: { ...s.haul.mats }, samples: s.haul.samples.map((x) => ({ ...x })) }, fin: false, reason: null, recall: i });
  S.ev.length = s.ev; S.pos.length = s.pos; S.snaps.length = k;
  toExit(S, "recall");
  return true;
}
// 結果（帰り または 力つきた）
export function bzResult(S) {
  const mats = Object.entries(S.haul.mats).map(([key, n]) => { const [id, q] = key.split("@"); return { id, q: +(q || 0), n }; });
  return { reason: S.reason, wipe: S.reason === "wipe", steps: S.i, mats, samples: S.haul.samples, exp: S.exp, keys: (S.cfg.keys || 0) - S.keys, crate: (S.cfg.crate || 0) - S.crate, sealed: S.sealed, ev: S.ev, pos: S.pos, inv: S.inv };
}
// 保険料（Claude の 案）：生きて 帰った ときの 稼ぎの 目安（10 分 620）× 15%。手厚いは 2 倍（派遣と 同じ INS_PLAN）
export const bzInsPrice = (run, plan, perks = {}) => (INS_PLAN[plan] ? Math.max(1, Math.round(620 * (run / 10) * 0.15 * INS_PLAN[plan].mult * (perks.insCheap ? 0.8 : 1))) : 0);
// 素材の 値の 合計（目安の 計算・画面の まとめ）
export const matValue = (mats) => mats.reduce((a, m) => a + (VALUE[m.id] || 0) * m.n, 0);
