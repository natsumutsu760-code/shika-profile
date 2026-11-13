// クローラーの 報酬と ドロップ（資料 docs/mono-link-story-missions.md「報酬と ドロップ」「第 1 章の 報酬の 数」。数は 仮）
// 決め（鹿さん）：報酬金は 物語なので 多め／完全成功は 報酬金 +50%・04 の 品を 記録に・会社の 素材／雑魚は 派遣と 同じ／
//   精鋭は 解析コード（はじめて 倒すと 1 こ。ランダムと 境界は 2 倍）＋貴重サンプル、POM は ときどき 貴重サンプル／
//   2 回目からは 経験値だけ（漁れる マスは 回れる）／失敗したら 拾った 物を 失い 報酬なし
// 迷宮の 中で 拾った 物は S.loot に ためて、終わりに settle で 財布（保存）へ 入れる。three を 使わない（node でも 動く）
import { ENEMY_MAT, QUALITY, dropRate, SCRAP, VALUE } from "./materials.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { EXP_PER_LV, CREDIT } from "./dungeons.js";
import { ANALYSIS } from "./crawler-analysis-data.js";

// ---- 報酬金（はじめて 成功した とき）：1 分 あたり 約 62 クレジット（派遣の 2 倍）× 長さの 目安 ----
export const PAY = { short: 600, mid: 900, long: 1200 };
const LEN = {
  c1m01: "short", c1m02: "short", c1m03: "short", c1m11: "short", c1m12: "short",
  c1m04: "long", c1m06: "long", c1m15: "long",
}; // ほかは ふつう（15 分）
export const payOf = (m) => PAY[LEN[m.id] ?? "mid"];
export const BONUS_PAY = 0.5; // 完全成功で 報酬金 +50%
// 完全成功で ラウンジに 残る「記録」（04 の 品。中身の 読み物は あとで）
export const RECORDS = { c1m01: "制御信号の 記録", c1m04: "研究者の 手記", c1m12: "荷の 中身の 記録", hcc01: "記録媒体", c1m14: "盗まれた 名簿" };
// 記録の 中身（ラウンジで 読む。第 1 章は 崩壊を 語らず 兆しだけ。Claude の 案、2026-11-04。資料 docs/mono-link-story-ch1.md の「記録」）
export const RECORD_TEXT = {
  "制御信号の 記録": ["鉛の倉庫街 試験区画　TEST UNIT 07-A〜D", "制御率　92% → 88% → 85%（試験の 3 日間）", "04:12　同じ 周波数の 外からの 信号。発信元 レグルス自治区", "04:13　部隊が 指示を 受けつけない。制御を 奪われたと 判断", "記録の 終わりに 手書きの 書き足し：「奪われる 前から、数値は 下がって いた」"],
  "研究者の 手記": ["MLV 第 9 研究棟。名前の 欄は 破れて いる", "十一日目　MLV-118 は 安定して いる。上は「量産の 目処」と 言う", "十四日目　118 を 打った 個体が、指示より 半拍 早く 動く。誤差だと 書けと 言われた", "十九日目　研究棟を 閉じる 命令。試料は 一本 残して 運び出す", "残した 一本は 私の 判断だ。誰かが 確かめに 来る ことを 願う"],
  "荷の 中身の 記録": ["霧の港 第 3 桟橋で 確かめた 物", "防護繊維の 箱　12 こ。うち 1 こは 底が 二重", "底の 容器　貴重サンプル（生体）。封の 型は 製薬の 物だが、刻印が 削られて いる", "札　「宛先：――」。送り主の 欄も 空白", "受け取りに 来た POM の 肩に、どこの 会社の 物でも ない 識別票"],
  "記録媒体": ["灰の運河 地下 試験場 最下層の 端末から", "TEST-07　制御率 61%。外部からの干渉なし。……試験を継続", "TEST-07　夜の あいだに 指示の ない 動き 3 回。記録から 外す", "TEST-07　別の 区画の 個体と 同じ 時刻に 鳴いた。原因は わからない", "指示　数値の 報告は 上へ だけ。ほかの 会社へは 出さない"],
  "盗まれた 名簿": ["管理機構 第 1 記録庫　取り返した 写し", "新しい 登録者（島 3 が 開いた 週）", "番付 C　あなたの 名前　推薦人：――", "ほかの 行は 黒く 塗られて いる", "欄外に 鉛筆の 字：「推薦人 空白。上の 判断で 通す」"],
};
export const BONUS_MATS = 3; // 完全成功で 依頼主の 会社の 迷宮だけの 素材 3 こ

// ---- 解析コード・貴重サンプル ----
export const CODE_NEED = 10; // 解析 100% に 10 こ（1 こ 10%）
export const POM_SAMPLE = 0.25; // POM は ときどき（25%）
export const SAMPLES = {
  鉱物: ["歪んだ 鉱脈の 核", "熱を もつ 石", "鳴る 鉱石"],
  生体: ["変異した 組織", "光る 胞子", "焼けた 制御神経"],
  遺物: ["古い 時代の 部品", "読めない 記録媒体", "旧政府の 刻印板"],
};
const FAMILY = { sva: "鉱物", harmonia: "生体", tcu: "遺物" }; // 依頼主の グループが 好む 系統
const FAV = 0.6; // 好む 系統を 多く（6 割。仮）。ファウンデーション・管理機構は 3 系統から 同じ ように
// ---- Lv（派遣と 同じ 表：lounge-server/lounge-game.js の expNeed。Lv 10 から いる 経験値は Lv × Lv ÷ 2）----
export const LV_START = 50; // 第 1 章は Lv 50 から（仮）
export const expNeed = (lv) => Math.ceil((lv * lv) / (lv < 10 ? 4 : 2));
export const lvOf = (save) => save.lv ?? LV_START;
export const mercLv = (lv) => Math.round(lv * 0.9); // 傭兵は いっしょに 行く 人の Lv の 9 割（鹿さんの 決め）
export const MAT_Q = 3; // 雑魚の 素材の 品質の 段（派遣の 階の 表 QUALITY。第 1 章は 3 ＝ 品質 2〜3。仮）

// ---- 漁れる マス（残骸 w・キャビネット c）。中身の 割合は まだ 決めて いない（Claude の 仮） ----
export const SCAV = { w: "残骸", c: "キャビネット" };
const SCAV_RARE = 0.05, SCAV_CO = 0.25, SCAV_PATCH = 0.1, SCAV_SAMPLE = 0.03;

const pick = (R, a) => a[Math.floor(R() * a.length)];
const pickW = (R, w) => { let r = R() * Object.values(w).reduce((s, v) => s + v, 0); for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) return +k; return +Object.keys(w)[0]; };
// 安い 物ほど 出やすい（値の 逆数で 重み）
const cheap = (R, list) => { const w = list.map(([id]) => 1 / (VALUE[id] || 5)); let r = R() * w.reduce((s, v) => s + v, 0); for (let i = 0; i < list.length; i++) if ((r -= w[i]) < 0) return list[i]; return list[0]; };

export const newLoot = () => ({ exp: 0, credits: 0, mats: [], codes: {}, samples: [], picked: 0 });
const addMat = (L, id, name, q, from) => { const o = L.mats.find((x) => x.id === id && x.q === q); if (o) o.n += 1; else L.mats.push({ id, name, q, n: 1, from }); };
const sampleOf = (R, group) => { const fav = FAMILY[group], fams = Object.keys(SAMPLES); const fam = fav && R() < FAV ? fav : pick(R, fav ? fams.filter((f) => f !== fav) : fams); return { fam, name: pick(R, SAMPLES[fam]), star: null }; }; // ★は ガラクで 鑑定するまで わからない
export const coScrap = (group) => SCRAP[group] ?? null; // 会社の 迷宮だけの スクラップ（ファウンデーション・管理機構は なし）

// 勝った 戦いの 取り分（b：S.battle、first：その ミッションを はじめて 遊ぶか、mult：ランダム・境界は 2）
export function battleLoot(S, b, { first = S.first !== false, mult = 1 } = {}) {
  const L = (S.loot ??= newLoot()), R = S.LR ?? S.R, got = [];
  for (const f of b.foes) {
    L.exp += (f.lv ?? 0) * EXP_PER_LV;
    if (!first) continue; // 2 回目からは 経験値だけ
    const tr = f.tree ?? (f.sprite && ENEMY_TREES[f.sprite] ? f.sprite : null); // 制御された モンスターは ドット絵の 名前＝敵の ツリー
    if (tr && ENEMY_MAT[tr]) { // 雑魚：派遣と 同じ（クレジットは 派遣も 0。素材は 落ちにくさの 決まりの まま。ボスは 品質 5 を 2 こ）
      L.credits += (f.lv ?? 0) * CREDIT.perLv;
      const [id, name] = ENEMY_MAT[tr], rk = f.boss ? "ボス" : ENEMY_TREES[tr].rank ?? "通常";
      if (R() < dropRate(rk, id)) {
        const q = rk === "ボス" ? 5 : Math.min(5, pickW(R, QUALITY[MAT_Q]) + (rk === "希少" ? 1 : 0));
        for (let i = 0; i < (rk === "ボス" ? 2 : 1); i++) addMat(L, id, name, q, "enemy");
        got.push(`${name}（品質 ${q}）${rk === "ボス" ? " ×2" : ""}`);
      }
    }
  }
  if (first && b.kind === "elite" && b.foe && ANALYSIS[b.foe.name]) { // 精鋭の LINKER：解析コードと 貴重サンプル（かならず）
    const n = mult;
    L.codes[b.foe.name] = (L.codes[b.foe.name] ?? 0) + n;
    got.push(`${ANALYSIS[b.foe.name].tree} の 解析コード ×${n}`);
    const s = sampleOf(R, S.def.group); L.samples.push(s); got.push(`貴重サンプル（${s.fam}）`);
  } else if (first && b.kind === "pom" && R() < POM_SAMPLE) { const s = sampleOf(R, S.def.group); L.samples.push(s); got.push(`貴重サンプル（${s.fam}）`); }
  return got;
}

// 漁る（前の マスの 残骸・キャビネット。1 マス 1 回。2 回目の ミッションでも 回れる）
export function scavenge(S, ch) {
  const L = (S.loot ??= newLoot()), R = S.LR ?? S.R, co = coScrap(S.def.group);
  L.picked += 1;
  if (R() < SCAV_SAMPLE) { const s = sampleOf(R, S.def.group); L.samples.push(s); return `貴重サンプル（${s.fam}）`; }
  if (ch === "c" && R() < SCAV_PATCH) { S.items.mlv_patch_s = (S.items.mlv_patch_s ?? 0) + 1; return "メルヴィル外傷パッチ S（すぐ 使える）"; }
  if (ch === "w" && R() < SCAV_RARE) { const [id, name] = pick(R, SCRAP.rare); addMat(L, id, name, null, "scrap"); return name; }
  const [id, name] = co && R() < SCAV_CO ? pick(R, co) : cheap(R, ch === "w" ? SCRAP.wreck : SCRAP.cabinet);
  addMat(L, id, name, null, "scrap");
  return name;
}

// 終わりの 精算：財布（保存）へ。返す：画面に 出す 内訳
// save = { done:[id], full:[id], credits, exp, mats:{ "id:q": {id,name,q,n} }, codes:{ 精鋭: n }, samples:[...], records:[...] }（done は 掲示板の 進みと 同じ 物。full は 完全成功 済み）
// 完全成功を あとから した とき（2 回目 以降）は「記録と 上乗せ分だけ 貰える」（鹿さんの 決め、2026-11-04 カード）。会社の 素材は はじめての 成功の ときだけ
export function settle(S, save) {
  const m = S.def, r = S.result, L = S.loot ?? newLoot(), first = !save.done?.includes(m.id);
  const out = { ok: !!r?.ok, bonus: !!r?.bonus, first, exp: Math.round(L.exp), pay: 0, bonusPay: 0, credits: 0, mats: [], codes: {}, samples: [], record: null, lost: null };
  save.exp = (save.exp ?? 0) + out.exp; // 経験値は 失敗でも 残る（派遣と 同じ：倒した 分は 勝った ときと 同じ）
  save.lv = lvOf(save); save.xp = (save.xp ?? 0) + out.exp; out.lvUp = 0;
  while (save.xp >= expNeed(save.lv)) { save.xp -= expNeed(save.lv); save.lv++; out.lvUp++; }
  out.lv = save.lv;
  if (!out.ok) { out.lost = { mats: L.mats.reduce((s, x) => s + x.n, 0), samples: L.samples.length, codes: Object.values(L.codes).reduce((s, n) => s + n, 0) }; return out; }
  const mats = L.mats.map((x) => ({ ...x }));
  if (first) {
    out.pay = payOf(m);
    if (out.bonus) {
      out.bonusPay = Math.round(out.pay * BONUS_PAY);
      out.record = RECORDS[m.id] ?? null;
      const co = coScrap(m.group) ?? SCRAP.wreck, R = S.LR ?? S.R;
      for (let i = 0; i < BONUS_MATS; i++) { const [id, name] = pick(R, co); const o = mats.find((x) => x.id === id && x.q == null); if (o) o.n += 1; else mats.push({ id, name, q: null, n: 1, from: "bonus" }); }
    }
    (save.done ??= []).push(m.id);
  } else if (out.bonus && !save.full?.includes(m.id)) { out.bonusPay = Math.round(payOf(m) * BONUS_PAY); out.record = RECORDS[m.id] ?? null; out.late = true; }
  if (out.bonus && !save.full?.includes(m.id)) (save.full ??= []).push(m.id);
  out.credits = out.pay + out.bonusPay + Math.round(L.credits);
  out.mats = mats; out.codes = { ...L.codes }; out.samples = L.samples.map((s) => ({ ...s }));
  save.credits = (save.credits ?? 0) + out.credits;
  save.mats ??= {}; for (const x of mats) { const k = `${x.id}:${x.q ?? 0}`; save.mats[k] = { id: x.id, name: x.name, q: x.q, n: (save.mats[k]?.n ?? 0) + x.n }; }
  save.codes ??= {}; for (const [k, n] of Object.entries(out.codes)) save.codes[k] = Math.min(CODE_NEED, (save.codes[k] ?? 0) + n);
  (save.samples ??= []).push(...out.samples);
  if (out.record && !(save.records ??= []).includes(out.record)) save.records.push(out.record);
  return out;
}
export const analysisPct = (save, name) => Math.min(100, ((save.codes?.[name] ?? 0) * 100) / CODE_NEED);
