// ラウンジの 施設（大工事で 作り直し。鹿さんの 決め、2026-10-29 の 11〜14 回目の カード・2026-11-03「施設から」。数は docs/mono-link-numbers.md の 4 章の 案）
// - 11 こ（地下の 拡張は なくした）。Lv1〜100 で なめらかに のびる（無線機だけ 島ごとに 1 段）
// - つまみ：上げた Lv までの どこでも えらべる（rec.knob）。効果と 維持費は えらんだ Lv。倉庫・武器庫・無線機は つまみ なし
// - 建設：クレジットを 払って 始め、素材を 分けて 入れる。進み ＝「入れた 素材の 割合」と「経った 時間 ÷ 工期」の 小さい 方
//   グラナート建設（残りの 時間を 半分・残りの 分 × 1 クレジット、最低 50）・ヘリクス電力の 燃料（60 クレジットで 30 分）で 早く なる
// - 維持費：探索の 施設は 派遣ごと、作る 施設は 作るたび、坑道は うけとる たび。倉庫・武器庫・無線機は なし
// - 前の Lv1〜4 の 段で 開いた 物（★の 上限・合成・とくべつおやつ・アタッチメントの ★・坑道の 枠）は Lv1・20・50・80 で 開く（作業台の ★の 上限の 区切りと 同じ。Claude の 案）
// - Lv41 から 島 2 の 素材が いる ので、無線機を 作るまで Lv40 まで（Claude の 案）
// - 払いは クレジットだけ（玉と アメジストは 使わない。経済の 決め）
// 画面は hideout.html。門番は lounge-facility.js
import { GATHER, ENEMY_MAT, ORE_MAT } from "./materials.js";
import { DUNGEONS, DUNGEONS_ALL, ISLAND_OPEN } from "./dungeons.js";
import { FARM_OPEN } from "./crops.js";
import { MINE_ADD } from "./mine.js";

export const FAC_MAX = 100;
export const BAND_AT = [1, 20, 50, 80];
export const band = (lv) => BAND_AT.filter((x) => (lv || 0) >= x).length;   // 0〜4（前の Lv に あたる 段）
export const NO_RADIO_MAX = 40;   // 無線機が ない ときに 上げられる Lv

// kind：make（作る たびに 維持費）・trip（派遣ごと）・mine（うけとる たび）・keep（維持費 なし）・radio（島ごとに 1 段）
const ALL = [
  { id: "bench", kind: "make", name: "作業台", text: "装備を 作る・合成する" },
  { id: "lab", kind: "make", name: "研究所", text: "捕まえた 敵の 研究が 安く・早く なる" },
  { id: "snack", kind: "make", name: "おやつ工房", text: "素材から 懐柔の おやつを 作る" },
  { id: "maproom", kind: "trip", name: "地図室", text: "採取と 敵の 素材が ふえる" },
  { id: "medic", kind: "trip", name: "救護室", text: "休憩の 回復と、倒れた 子の 起きあがり" },
  { id: "gym", kind: "trip", name: "トレーニング室", text: "派遣の 経験値が ふえる" },
  { id: "storage", kind: "keep", name: "倉庫", text: "1 しゅるいに 置ける 数が ふえる（はじめは 50 こ）" },
  { id: "armory", kind: "keep", name: "武器庫", text: "装備を 持てる 数が ふえる（はじめは 200 こ）" },
  { id: "workshop", kind: "make", name: "工房", text: "道具と 武器の アタッチメントを 作る・精錬・加工" },
  { id: "mine", kind: "mine", name: "坑道", text: "パーティに いない なかまが 鉱石と ガラクタを 掘る" },
  { id: "radio", kind: "radio", name: "無線機", isle: 2, max: 1, text: "島の 電波を ひろって、ほかの 島へ 船を 出す" },   // 段 ＝ 行ける 島。Lv2 で ミカネル島（鹿さんの 決め、2026-11-03。島 3 が 出るまでは 1 段）
];
export const FACILITIES_ALL = ALL;
export const FACILITIES = ALL.filter((f) => (f.isle || 1) <= ISLAND_OPEN);
export const facOf = (id) => FACILITIES.find((f) => f.id === id) || null;
export const facMax = (f, open = ISLAND_OPEN) => (f && f.id === "radio" ? Math.max(1, open - 1) : (f && f.max) || FAC_MAX);   // 無線機は 出て いる 島の 数 − 1 段
// その人が 行ける 島の 数（無線機が あれば 2）と、その人が 上げられる Lv の 上限（hide：rec.hideout）
export const isleOf = (hide, open = ISLAND_OPEN) => Math.max(1, Math.min(open, 1 + (((hide || {}).radio) || 0)));   // 無線機 Lv1 で 島 2・Lv2 で 島 3
export const facCap = (f, hide, open = ISLAND_OPEN) => (!f || (f.isle || 1) > open ? 0 : f.max ? facMax(f, open) : isleOf(hide, open) >= 2 ? FAC_MAX : NO_RADIO_MAX);
export const hasKnob = (f) => !!f && (f.kind === "make" || f.kind === "trip" || f.kind === "mine");
// 効く Lv（つまみ）。knob が ない・上げた Lv より 上なら 上げた Lv
export const facLv = (rec, id) => { const lv = ((rec && rec.hideout) || {})[id] || 0, k = ((rec && rec.knob) || {})[id]; return hasKnob(facOf(id)) && Number.isInteger(k) && k >= 0 && k < lv ? k : lv; };

// ---------- 効果（Lv100 で 前の Lv4 と 同じ くらい）----------
export const benchStarMax = (lv) => (lv ? band(lv) + 1 : 0);         // 作業台：Lv1 ★2・Lv20 ★3・Lv50 ★4・Lv80 ★5
export const benchTopUp = (lv) => 0.003 * (lv || 0);                 // 高い ★の 出やすさ ＋0.3% / Lv
export const SYNTH_LV = 20, SYNTH_HALF_LV = 50;                      // 合成は Lv20 から（前の Lv2）・合成の 玉が 半分は Lv50 から（前の Lv3）
export const labOff = (lv) => 0.005 * (lv || 0);                     // 研究所：研究の アメジスト −0.5% / Lv
export const LAB_H = { 通常: 1, 希少: 4, 配合: 6, ボス: 12 };          // 研究の もとの 時間（時間）
export const labMs = (rank, lv) => Math.round((LAB_H[rank] || 1) * 3600e3 * (1 - 0.005 * (lv || 0)));   // −0.5% / Lv
export const snackMore = (lv) => 0.01 * (lv || 0);                   // おやつ工房：1 回で 2 こ できる 確率 ＋1% / Lv
export const snackSave = (lv) => 0.01 * (lv || 0);                   // 素材が 3 → 2 に なる 確率 ＋1% / Lv
export const wsMore = (lv) => 0.01 * (lv || 0);                      // 工房：道具が 1 こ 多く できる 確率 ＋1% / Lv
export const wsSave = (lv) => 0.003 * (lv || 0);                     // 素材 −0.3% / Lv
export const mapAdd = (lv) => 0.005 * (lv || 0);                     // 地図室：採取 ＋0.5% / Lv・敵の 素材が 落ちる 確率 30% に ＋0.15% / Lv（＝ 素材 1 こごとに ＋0.5%）
export const restMul = (lv) => 1 + (lv || 0) / 100;                  // 救護室：休憩の 回復 ×（1 ＋ Lv / 100）
export const riseHp = (lv) => (lv ? 0.003 * lv : 0);                 // 倒れた 子が 休憩で 起きる HP ＋0.3% / Lv
export const gymMul = (lv) => 1 + 0.004 * (lv || 0);                 // トレーニング室：派遣の 経験値 ＋0.4% / Lv
export const storageCap = (lv) => (lv ? 100 + 7 * lv : 50);          // 倉庫：1 しゅるい 100 ＋ 7 × Lv（Lv100 で 800）
export const equipCapOf = (lv) => 200 + 10 * (lv || 0);              // 武器庫：200 ＋ 10 × Lv（Lv100 で 1,200）
// 前の 形の 表（いまは 試験と 見本の ため。Lv の 段 0〜4）
export const STORAGE_CAP = [0, 1, 20, 50, 80].map(storageCap), EQUIP_CAP = [0, 1, 20, 50, 80, 100].map(equipCapOf);

// 効果の 1 行（画面）
export function facFx(id, lv) {
  const p = (x) => `${Math.round(x * 1000) / 10}%`;
  switch (id) {
    case "bench": return lv ? `★${benchStarMax(lv)} まで・高い ★ ＋${p(benchTopUp(lv))}${lv >= SYNTH_LV ? "・合成" : ""}` : "まだ ない";
    case "lab": return `研究の アメジストと 時間 −${p(labOff(lv))}`;
    case "snack": return lv ? `2 こ できる ${p(snackMore(lv))}・素材が 2 こ ${p(snackSave(lv))}${band(lv) >= 3 ? "・とくべつおやつ" : ""}` : "まだ ない";
    case "workshop": return lv ? `アタッチメント ★${benchStarMax(lv)} まで・道具 ＋1 こ ${p(wsMore(lv))}・素材 −${p(wsSave(lv))}` : "まだ ない";
    case "maproom": return `採取と 敵の 素材 ＋${p(mapAdd(lv))}${lv ? "・着いた 階の 階段が 見える" : ""}`;
    case "medic": return `休憩の 回復 ×${restMul(lv).toFixed(2)}・倒れた 子が HP ${p(riseHp(lv))} で 起きる`;
    case "gym": return `派遣の 経験値 ＋${p(gymMul(lv) - 1)}`;
    case "storage": return `1 しゅるい ${storageCap(lv)} こ まで`;
    case "armory": return `装備 ${equipCapOf(lv).toLocaleString("ja-JP")} こ まで`;
    case "mine": return lv ? `${mineSlotsOf(lv)} 体・1 時間に ${mineRateOf(lv).toFixed(1)} こ` : "まだ ない";
    case "radio": return lv >= 2 ? "ビサイ諸島と ミカネル島へ 行ける・ほかの 施設を Lv41 から 上げられる" : lv ? "ビサイ諸島へ 行ける・ほかの 施設を Lv41 から 上げられる" : "まだ ない";
  }
  return "";
}
// 坑道：掘る 子の 数は 段（1〜4）・1 時間に 2 ＋ Lv / 25 こ
export const mineSlotsOf = (lv) => band(lv);
export const mineRateOf = (lv) => (lv ? 2 + lv / 25 : 0);

// ---------- 維持費 ----------
export function upkeep(id, lv) {
  const f = facOf(id); if (!f || !lv) return 0;
  if (f.kind === "trip" || f.kind === "mine") return Math.round(0.075 * lv ** 1.65);
  if (f.kind === "make") return Math.round(0.3 * lv ** 1.65);
  return 0;
}

// ---------- 建設（Lv を 1 つ 上げる。L は 上げた あとの Lv）----------
export const buildCredits = (L) => Math.round(20 * L ** 1.5);
export const buildMs = (L) => Math.round(10 * 60e3 * L ** 1.2);
export const RUSH = { perMin: 1, min: 50 }, FUEL = { price: 60, ms: 30 * 60e3 };
// ボルトの 店の「建設の 時間 −10%・−20%」（−20% は −10% に おきかわる。買い取り ＋10%・＋20% と 同じ 形。Claude の 案、2026-11-03）
export const BUILD_PERK = { build10: 0.1, build20: 0.2 };
export const buildOff = (perks) => (perks && perks.build20 ? BUILD_PERK.build20 : perks && perks.build10 ? BUILD_PERK.build10 : 0);
// 素材：Lv が 上がるほど 奥の 行き先の 素材（Claude の 案。資料の「Lv1〜20 は 島 1 の 前半、21〜40 は 暗い村・水晶洞窟と 延べ棒、41〜60 は 島 2 の 前半と 鉄竹・夜竹、61〜100 は 島 2 の 奥・銀と 金の 延べ棒・黒竹」）
const gath = (ids) => ids.flatMap((d) => ((GATHER[d] || {}).mats || []).map(([id]) => id)).filter((id) => !ORE_MAT.has(id) && id !== "ironore");   // 鉱石は そのまま 使わず、延べ棒に して から（水晶洞窟の 鉄鉱石も）
const foes = (ids) => ids.flatMap((d) => { const x = DUNGEONS_ALL.find((y) => y.id === d); return x ? x.foes.map((f) => ENEMY_MAT[f.tree][0]) : []; });
const I2 = DUNGEONS_ALL.filter((d) => d.isle === 2 && !d.hidden).sort((a, b) => a.lv - b.lv).map((d) => d.id);
const TIERS = [
  { to: 20, gather: gath(["hals", "morph"]), extra: foes(["hals", "morph"]), n: (L) => 1 + Math.floor(L / 10) },
  { to: 40, gather: gath(["kurai", "crystal"]), extra: [...foes(["kurai", "crystal"]), "copper_bar", "iron_bar"], n: (L) => 1 + Math.floor((L - 20) / 6) },
  { to: 60, gather: gath(I2.slice(0, 4)), extra: [...(FARM_OPEN ? ["iron_bamboo", "night_bamboo", "bamboo_lumber", "nightbamboo_lumber"] : []), "iron_bar", "silver_bar"], n: (L) => 2 + Math.floor((L - 40) / 5) },
  { to: 100, gather: gath(I2.slice(4)), extra: [...(FARM_OPEN ? ["black_bamboo", "blackbamboo_lumber"] : []), "silver_bar", "gold_bar"], n: (L) => 2 + Math.floor((L - 60) / 10) },
];
export const tierOf = (L) => TIERS.findIndex((t) => L <= t.to);
// 延べ棒の もとの 鉱石が 坑道で 出る Lv（坑道を 上げる ときは、その Lv より 下で 出る 鉱石の 延べ棒だけ ── まだ 掘れない 鉱石の 延べ棒で 行き止まりに しない）
const BAR_ORE = { copper_bar: "copperore", iron_bar: "ironore", silver_bar: "silverore", gold_bar: "goldore" };
const ORE_AT = {}; for (const [at, add] of MINE_ADD) for (const k of Object.keys(add)) if (!(k in ORE_AT)) ORE_AT[k] = at;
export const barMineLv = (id) => (BAR_ORE[id] ? ORE_AT[BAR_ORE[id]] || 0 : 0);
export function buildNeed(id, L) {
  const fi = Math.max(0, ALL.findIndex((f) => f.id === id)), T = TIERS[Math.max(0, tierOf(L))];
  if (id === "radio" && L >= 2) return { credits: 20000, ms: buildMs(50), mats: [["silver_bar", 8], ["thunderstone", 12], ["windorb", 2]] };   // 無線機 Lv2（ミカネル島へ。Claude の 案：ビサイ諸島の 雷の石と 風のオーブ・銀の延べ棒。金の延べ棒は 施設の Lv61〜 だけの 決まりなので 使わない）
  if (id === "radio") return { credits: 5000, ms: buildMs(10), mats: [["iron_bar", 4], ["crystalbit", 6]] };   // 無線機（島 2 へ。前の いる 物を 延べ棒に）
  const g1 = T.gather[(fi * 3 + L) % T.gather.length], g2 = T.gather[(fi * 3 + L + 1 + Math.floor(T.gather.length / 2)) % T.gather.length];
  const xs = id === "mine" ? T.extra.filter((x) => barMineLv(x) < L) : T.extra;   // 坑道は いまの Lv（L − 1）で 掘れる 鉱石の 延べ棒だけ
  const ex = xs[(fi + L) % xs.length], gn = 4 + Math.floor(L * 0.4);
  const mats = [[g1, gn], ...(g2 !== g1 ? [[g2, gn]] : []), [ex, T.n(L)]];
  return { credits: buildCredits(L), ms: buildMs(L), mats };
}
// 建設の 進み（0〜1）：入れた 素材の 割合と 経った 時間 ÷ 工期 の 小さい 方。b：{ to, at, ms, skip, mats, put }
export const buildMatRatio = (b) => { const all = b.mats.reduce((a, [, n]) => a + n, 0), put = b.mats.reduce((a, [id, n]) => a + Math.min(n, (b.put || {})[id] || 0), 0); return all ? put / all : 1; };
export const buildTimeRatio = (b, now) => Math.min(1, Math.max(0, (now - b.at + (b.skip || 0)) / b.ms));
export const buildProg = (b, now) => Math.min(buildMatRatio(b), buildTimeRatio(b, now));
export const buildLeftMs = (b, now) => Math.max(0, b.ms - (now - b.at + (b.skip || 0)));
export const rushPrice = (b, now) => Math.max(RUSH.min, Math.ceil(buildLeftMs(b, now) / 60e3) * RUSH.perMin);

// 前の Lv（1〜4）を 新しい Lv に うつす（段の はじめに。前の Lv4 は Lv100）
export const MIGRATE_LV = { 1: 20, 2: 50, 3: 80, 4: 100 };

// ---------- おやつ工房（鹿さんの決め、2026-10-25）----------
// lv は 段（band）：とくべつおやつは 段 3（Lv50）から。素材 3 → 2・1 回で 2 こ は 確率（snackSave・snackMore）
export const SNACK_RECIPES = [
  { id: "snack", name: "懐柔のおやつ", gauge: 1, lv: 1, mats: [["herb", 2], ["berry", 1]], lv2: [["herb", 1], ["berry", 1]] },
  { id: "snack3", name: "とくべつおやつ", gauge: 3, lv: 3, mats: [["berry", 3], ["clover", 1]] },
];
export const snackOpen = (r, lv) => !!r && band(lv) >= r.lv;
export const snackMats = (r, save) => (save && r.lv2 ? r.lv2 : r.mats);
export const SNACK_CRAFT_MAX = 50;   // 1 回に 作れる 数

// ---------- 地図室 ----------
// 派遣の 計算の あと、うけとる 素材に 足す（トレーニング室の 経験値と 同じ 形。派遣の 中の ようすと 配信の 中継は かわらない）。lv は 出かけた ときの Lv（t.map）
// 採取の 素材と ふつうの 敵の 素材 1 こごとに mapAdd(lv) で ＋1（Lv100 で ＋50%）
export function mapExtra(lv, mats, did, R) {
  const d = DUNGEONS_ALL.find((x) => x.id === did), gs = new Set(((GATHER[did] || {}).mats || []).map(([id]) => id));
  const foe = new Set(((d && d.foes) || []).map((f) => (ENEMY_MAT[f.tree] || [])[0])), add = mapAdd(lv);
  let gather = 0, drop = 0;
  const out = mats.map((m) => {
    const g = gs.has(m.id), f = foe.has(m.id); if ((!g && !f) || !add) return m;
    let k = 0; for (let i = 0; i < m.n; i++) if (R() < add) k++;
    if (g) gather += k; else drop += k;
    return k ? { ...m, n: m.n + k } : m;
  });
  return { mats: out, gather, drop };
}
export const PC = { id: "pc", name: "PC", text: "DEEP LINK/: に 入れる。置くだけ（Lv なし）" };
