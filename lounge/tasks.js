// DEEP LINK/: の 商人の タスク（鹿さんの決め、2026-10-22）。数はすべて案
// ・ランダムの タスク（つながった タスク）：1 つ おわると 次が 出る。終わりは ない（chainTask(商人, n) が n こ目を 決まりから 作る。同じ n なら いつも 同じ）
// ・毎日の タスク：商人 1 人に 1 日 1 つ（dailyTask(商人, 日, 進み)）
// ・しゅるい：納める（派遣で 拾った物だけ）・たおす・探索・捕まえる・作る・施設・ほか。じょうけんつき（力つきずに など）も 混ざる
// ・希少な 敵は たおす・捕まえるの 対象に しない（希少で ある 意味が なくなる。鹿さんの決め、2026-10-28）
// ・先へ 行くほど 行き先が 深く、数と ごほうびが 大きくなる
import { DUNGEONS, TOOLS } from "./dungeons.js";
import { GATHER, ENEMY_MAT, MAT_NAME } from "./materials.js";
import { FACILITIES } from "./facilities.js";

// 決まった 乱数（文字から 種を作る）
const seedOf = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (s) => { let a = seedOf(s); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (R, a) => a[Math.floor(R() * a.length)];
const round10 = (x) => Math.round(x / 10) * 10;

// 行き先：n が 進むと 深い所も 出る（新しい所が 出やすい）
export const TIER_AT = [1, 5, 11, 19];
const tierOf = (n) => TIER_AT.filter((x) => n >= x).length;
const destOf = (R, n) => { const t = tierOf(n), i = R() < 0.6 ? t - 1 : Math.floor(R() * t); return DUNGEONS[i]; };
// 数の のび方：はじめは 早く、20 こ目から ゆっくり（終わりが ないので 数が 大きく なりすぎない）
const grow = (n) => 1 + 0.15 * Math.min(n, 20) + 0.04 * Math.max(0, n - 20);
const quality = (n) => Math.min(5, 1 + Math.floor(n / 6));

// じょうけん：5 こ目から ときどき 付く。ごほうび ×1.5
export const CONDS = ["力つきずに 帰る 派遣で", "休憩を しない 派遣で", "道具を 持たない 派遣で", "1 回の 派遣で", "10 分 コースで"];
const COND_RATE = 0.25, COND_MULT = 1.5;
// 「1 回の 派遣で」の 上限（2026-11-11）：10 分の 派遣 1 回で 届く 数の 真ん中（測った 数：宝箱 3・採取 6・同じ 敵 8）。
// 鹿さんの カード「もっと少なく」（前の 案は 上 25%：宝箱 4・採取 8・たおす 12）。
// ボスは 1 回に 1 体、たまに 2 体 いっしょ（dungeons.js の BOSS_TWIN。鹿さんの 決め「たまに 2 体いっしょに出る」）なので 2
const ONE_TRIP = CONDS.indexOf("1 回の 派遣で"), ONE_MAX = { boss: 2, chest: 3, gather: 6, kill: 8 };

// ごほうびの クレジット（docs/mono-link-numbers.md の 1 章の 案：ランダムの タスクは 島 1 で 30〜60・島 2 で 60〜120。派遣 1 周の 2〜5 割。上限 なしで 出るので 小さめ）
// 進むほど 上がり、20 こ目で 頭打ち。毎日の タスクは その 半分（Claude の 案）。タスクの ごほうびは クレジット・素材・品の 解放〈2026-10-29〉。アメジストは タスクから 出さない〈2026-10-28〉
export const TASK_CREDITS = { 1: [30, 60], 2: [60, 120] }, TASK_TOP = 20;
const creditsOf = (d, n) => { const [lo, hi] = TASK_CREDITS[d.isle || 1] || TASK_CREDITS[2]; return lo + ((hi - lo) * Math.min(n, TASK_TOP)) / TASK_TOP; };

// 商人ごとの タスクの 型。(R, n, d) → { kind, text, need, unit, found?, goal }。d は 行き先。goal は 門番が 数える 中身（type と 行き先・敵・品質 など）
const T = {
  junk: [
    (R, n, d) => { const [id, name] = pick(R, GATHER[d.id].mats); return { kind: "納める", text: `${name}を 納める`, need: Math.round(5 * grow(n)), unit: "こ", found: true, mat: id, goal: { type: "deliver", mat: id, q: 0 } }; },
    (R, n, d) => { const f = pick(R, d.foes), [id, name] = ENEMY_MAT[f.tree], q = quality(n); return { kind: "納める", text: `品質 ${q} 以上の ${name}を 納める`, need: Math.round(2 * grow(n)), unit: "こ", found: true, mat: id, goal: { type: "deliver", mat: id, q } }; },
    (R, n, d) => n >= 8 ? { kind: "納める", text: `${GATHER[d.id].hidden[1]}を 納める`, need: 1 + Math.floor(n / 20), unit: "こ", found: true, mat: GATHER[d.id].hidden[0], goal: { type: "deliver", mat: GATHER[d.id].hidden[0], q: 0 } } : null,
    (R, n, d) => ({ kind: "探索", text: `${d.name}で 採取ポイントを 回る`, need: Math.round(6 * grow(n)), unit: "か所", cond: true, goal: { type: "gather", did: d.id } }),
    (R, n) => ({ kind: "ほか", text: "素材を 売る", need: Math.round(3 * grow(n)), unit: "回", goal: { type: "sell" } }),
  ],
  doc: [
    (R, n) => ({ kind: "ほか", text: "派遣で 休憩する", need: Math.round(8 * grow(n)), unit: "回", goal: { type: "rest" } }),
    (R, n, d) => ({ kind: "探索", text: `力つきずに ${d.name}から 帰る`, need: Math.round(2 * grow(n) ** 0.6), unit: "回", goal: { type: "safe", did: d.id } }),
    (R, n, d) => { const heal = [["herb", "薬草"], ["nightbloom", "夜咲き草"], ["wellwater", "井戸の水"], ["deepwater", "地底の水"]].slice(0, tierOf(n) + 1), [id, name] = pick(R, heal); return { kind: "納める", text: `${name}を 納める`, need: Math.round(6 * grow(n)), unit: "こ", found: true, mat: id, goal: { type: "deliver", mat: id, q: 0 } }; },
    (R, n) => ({ kind: "ほか", text: "仲間に おやつを あげる", need: Math.round(5 * grow(n)), unit: "こ", goal: { type: "feed" } }),
    (R, n) => { if (n > 18) return null; const lv = [1, 10, 20][Math.min(2, Math.floor(n / 6))] /* 施設の Lv1〜100（2026-11-03 の 作り直し）：前の Lv1・2・3 の かわりに Lv1・10・20（Claude の 案）*/, f = pick(R, ["medic", "snack"]); return { kind: "施設", text: `${FACILITIES.find((x) => x.id === f).name}を Lv${lv} に する`, need: 1, unit: "", goal: { type: "fac", fac: f, lv } }; },
  ],
  hanger: [
    (R, n, d) => ({ kind: "探索", text: `${d.name}で 宝箱を 開ける`, need: Math.round(3 * grow(n)), unit: "こ", cond: true, goal: { type: "chest", did: d.id } }),
    (R, n, d) => n >= 6 ? { kind: "探索", text: `${d.name}の かくし通路で 宝箱を 開ける`, need: 1 + Math.floor(n / 15), unit: "こ", goal: { type: "hchest", did: d.id } } : null,
    (R, n) => { const st = Math.min(4, 1 + Math.floor(n / 7)); return { kind: "作る", text: `作業台で ★${st} 以上の 防具を 作る`, need: 1 + Math.floor(n / 12), unit: "こ", goal: { type: "craft", star: st, slot: "armor" } }; },
    (R, n) => { const st = Math.min(5, 2 + Math.floor(n / 8)); return { kind: "納める", text: `★${st} 以上の 防具を 納める`, need: 1, unit: "こ", found: true, goal: { type: "deliverEq", star: st, slot: "armor" } }; },
  ],
  mecha: [
    (R, n, d) => { const metal = [["pebble", "きれいな小石"], ["brick", "古いレンガ"], ["oldnail", "古い釘"], ["ironore", "鉄鉱石"]][Math.min(tierOf(n), 4) - 1 - (R() < 0.4 && tierOf(n) > 1 ? 1 : 0)]; return { kind: "納める", text: `${metal[1]}を 納める`, need: Math.round(6 * grow(n)), unit: "こ", found: true, mat: metal[0], goal: { type: "deliver", mat: metal[0], q: 0 } }; },
    (R, n) => ({ kind: "作る", text: "作業台で 装備を 作る", need: Math.round(2 * grow(n)), unit: "回", goal: { type: "craft", star: 1 } }),
    (R, n) => n >= 6 ? { kind: "作る", text: "作業台で 合成する", need: 1 + Math.floor(n / 10), unit: "回", goal: { type: "synth" } } : null,
    (R, n) => { if (n > 18) return null; const lv = [1, 10, 20][Math.min(2, Math.floor(n / 7))], f = pick(R, FACILITIES.filter((x) => !x.max)) /* 無線機（1 段）は 入れない */; return { kind: "施設", text: `${f.name}を Lv${lv} に する`, need: 1, unit: "", goal: { type: "fac", fac: f.id, lv } }; },
    (R, n, d) => { const fl = Math.min(5, 1 + Math.floor(R() * Math.min(5, 1 + n / 4))); return { kind: "探索", text: `${d.name}の ${fl} 階を 100% に する`, need: 100, unit: "%", goal: { type: "floor", did: d.id, floor: fl } }; },
  ],
  hunter: [
    (R, n, d) => { const f = pick(R, d.foes); return { kind: "たおす", text: `${f.name}を たおす`, need: Math.round(8 * grow(n)), unit: "たい", cond: true, goal: { type: "kill", tree: f.tree } }; },
    (R, n, d) => n >= 4 ? ((f) => ({ kind: "捕まえる", text: `${f.name}を 捕まえる`, need: 1 + Math.floor(n / 25), unit: "たい", goal: { type: "capture", tree: f.tree } }))(pick(R, d.foes)) : null,
    (R, n, d) => n >= 5 ? { kind: "たおす", text: `ボスの ${d.boss.name}を たおす`, need: 1 + Math.floor(n / 30), unit: "回", cond: true, goal: { type: "boss", did: d.id } } : null,
  ],
  // 新しい 2 人と ヨル（2026-11-03。型は Claude の 案）
  anvil: [
    (R, n, d) => { const f = pick(R, d.foes); return { kind: "たおす", text: `${f.name}を たおす`, need: Math.round(6 * grow(n)), unit: "たい", cond: true, goal: { type: "kill", tree: f.tree } }; },
    (R, n) => { const st = Math.min(4, 1 + Math.floor(n / 7)); return { kind: "作る", text: `作業台で ★${st} 以上の 武器を 作る`, need: 1 + Math.floor(n / 12), unit: "こ", goal: { type: "craft", star: st, slot: "weapon" } }; },
    (R, n) => n >= 4 ? { kind: "作る", text: "工房で 武器の アタッチメントを 作る", need: 1 + Math.floor(n / 10), unit: "こ", goal: { type: "oproll" } } : null,
    (R, n) => n >= 3 ? { kind: "作る", text: "工房の 炉で 延べ棒を 作る", need: Math.round(2 * grow(n)), unit: "本", goal: { type: "smelt" } } : null,
    (R, n, d) => { const f = pick(R, d.foes), [id, name] = ENEMY_MAT[f.tree], q = quality(n); return { kind: "納める", text: `品質 ${q} 以上の ${name}を 納める`, need: Math.round(2 * grow(n)), unit: "こ", found: true, mat: id, goal: { type: "deliver", mat: id, q } }; },
  ],
  minerva: [
    (R, n, d) => ({ kind: "探索", text: `力つきずに ${d.name}から 帰る`, need: Math.round(2 * grow(n) ** 0.6), unit: "回", goal: { type: "safe", did: d.id } }),
    (R, n, d) => ({ kind: "探索", text: `保険を 掛けて ${d.name}へ 出かける`, need: Math.round(1 + grow(n) ** 0.5), unit: "回", goal: { type: "insured", did: d.id } }),
    (R, n) => ({ kind: "ほか", text: "派遣で 休憩する", need: Math.round(6 * grow(n)), unit: "回", goal: { type: "rest" } }),
    (R, n, d) => { const fl = Math.min(5, 1 + Math.floor(R() * Math.min(5, 1 + n / 4))); return { kind: "探索", text: `${d.name}の ${fl} 階を 100% に する`, need: 100, unit: "%", goal: { type: "floor", did: d.id, floor: fl } }; },
  ],
  special: [
    (R, n, d) => ({ kind: "探索", text: `${d.name}で 宝箱を 開ける`, need: Math.round(3 * grow(n)), unit: "こ", cond: true, goal: { type: "chest", did: d.id } }),
    (R, n, d) => n >= 4 ? { kind: "探索", text: `${d.name}の かくし通路で 宝箱を 開ける`, need: 1 + Math.floor(n / 15), unit: "こ", goal: { type: "hchest", did: d.id } } : null,
    (R, n, d) => { const [id, name] = pick(R, GATHER[d.id].mats); return { kind: "納める", text: `${name}を 納める`, need: Math.round(5 * grow(n)), unit: "こ", found: true, mat: id, goal: { type: "deliver", mat: id, q: 0 } }; },
  ],
};
// ごほうびの 物（3 こ目ごと）。GET は 門番が 渡す 中身（ITEM は 見せる 文）
const ITEM = {
  junk: (n) => `採取の素材 ×${5 + Math.floor(n / 5)}`, doc: (n) => `懐柔のおやつ ×${3 + Math.floor(n / 8)}`, hanger: (n) => `防具 ★${Math.min(4, 1 + Math.floor(n / 8))}`,
  mecha: () => "作るの レシピ", hunter: (n) => (n % 2 ? TOOLS.lure.name : TOOLS.net.name),
  anvil: (n) => `武器 ★${Math.min(4, 1 + Math.floor(n / 8))}`, minerva: (n) => `採取の素材 ×${5 + Math.floor(n / 5)}`, special: (n) => `採取の素材 ×${5 + Math.floor(n / 5)}`,
};

const matsOf = (n, d) => ({ mats: [[GATHER[d.id].mats[n % GATHER[d.id].mats.length][0], 5 + Math.floor(n / 5)]] });
const GET = {
  junk: matsOf, doc: (n) => ({ snacks: 3 + Math.floor(n / 8) }), hanger: (n) => ({ acc: Math.min(4, 1 + Math.floor(n / 8)), slot: "armor" }),
  mecha: () => ({ items: { recipe: 1 } }), hunter: (n) => ({ tools: { [n % 2 ? "lure" : "net"]: 1 } }),
  anvil: (n) => ({ acc: Math.min(4, 1 + Math.floor(n / 8)), slot: "weapon" }), minerva: matsOf, special: matsOf,
};

// 1 日では むずかしい 型（施設・捕まえる）は 毎日の タスクに 出さない
const NOT_DAILY = ["施設", "捕まえる"];
function build(tid, n, R, daily) {
  const d = destOf(R, n), list = T[tid];
  let k = n === 1 && !daily ? list[0](R, n, d) : null;   // 1 こ目は いちばん かんたんな 型
  for (let i = 0; i < 12 && !k; i++) { k = pick(R, list)(R, n, d); if (k && daily && NOT_DAILY.includes(k.kind)) k = null; }
  if (!k) k = list[0](R, n, d);
  let mult = 1;
  if (k.cond && n >= 5 && R() < COND_RATE) { k.condText = pick(R, CONDS); k.goal.cond = CONDS.indexOf(k.condText); mult = COND_MULT; }
  if (k.goal.cond === ONE_TRIP && ONE_MAX[k.goal.type]) k.need = Math.min(k.need, ONE_MAX[k.goal.type]);   // 1 回の 派遣で 届く 数まで
  delete k.cond;
  if (daily) { if (k.unit !== "%") k.need = Math.max(1, Math.round(k.need * 0.5)); k.reward = { credits: Math.max(10, round10((creditsOf(d, n) / 2) * mult)), rep: 4 }; return k; }
  k.reward = { credits: round10(creditsOf(d, n) * mult), rep: 12 + 3 * Math.min(n, 6) };   // 友好度 15〜30 点（資料の 案）
  if (n % 3 === 0) { k.reward.item = ITEM[tid](n); k.reward.get = GET[tid](n, d); }
  return k;
}
// n こ目の つながった タスク（1 から。いくつでも）。かくしダンジョンの 鍵は プライマリータスクの 第 4 章へ 移した（primary.js の KEY_BY）
export const chainTask = (tid, n) => ({ n, ...build(tid, n, rngOf(`${tid}:chain:${n}`), false) });
// 毎日の タスク：day は 日の番号。進み（いまの つながりの n）で 行き先と 数が かわる
export const dailyTask = (tid, day, n = 1) => ({ day, daily: true, ...build(tid, Math.max(1, n), rngOf(`${tid}:daily:${day}`), true) });
export const TASK_TIDS = Object.keys(T);
