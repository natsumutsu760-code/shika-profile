// 集合住宅（TD）の 数の 表（資料 docs/mono-link-td-numbers.md）。〔決〕＝ 鹿さんの 決め（2026-11-14 で ぜんぶ 〔決〕に なった）
// 数を かえる ときは ここと 資料を いっしょに 直す。三つの 画面（td.html）・門番・試験が ここを 読む

// ---- 1. 家賃 〔決〕（2026-11-14 カード「この案でよい」）：（15 ＋ Lv）× 満足度の 倍率（満足度 0 で 0.5・100 で 1.2）。1 日 1 回 ----
export const RENT = { base: 15, perLv: 1, satLo: 0.5, satHi: 1.2 };
export const rentOf = (lv, sat) => Math.round((RENT.base + RENT.perLv * lv) * (RENT.satLo + ((RENT.satHi - RENT.satLo) * Math.max(0, Math.min(100, sat))) / 100));

// ---- 2. 増築 〔決〕値段の 形は 部屋の 数 × 高さ（2026-11-14）・〔決〕もとの 値段の 10〜50 倍（「家具や区画の価格想定を10～50倍で用意してください。」）----
//   〔決〕倍率は パーツごと（「区画パーツによりけり」）。前の 案の「建物の 部屋の 数で 10 → 50 倍」は つかわない
export const BUILD = { perFloor: 0.2, mulLo: 10, mulHi: 50 };
export const floorMul = (floor) => 1 + BUILD.perFloor * (Math.max(1, floor) - 1);   // 高さの 倍率：1 ＋ 0.2 ×（階 − 1）

// ---- 2b. パーツ・小物 1 つずつの 値段 〔決〕（鹿さんの カード「区画パーツによりけり」「よりけり」→ 表は 4 回目の カード「この案でよい」2026-11-14。10〜50 倍の 中）----
//   per：部屋（箱は × 高さの 倍率）・階・マス・1 つ。lv：不動産価値で 使える ように なる Lv
export const PARTS = {
  box: { lv: 1, per: "room", price: 5000 }, addFloor: { lv: 1, per: "room", price: 5000 }, overhang: { lv: 1, per: "box", mul: 1.5 },
  ell: { lv: 3, per: "room", price: 10000 }, wide: { lv: 5, per: "room", price: 15000 }, roofHut: { lv: 7, per: "one", price: 20000 },
  stair: { lv: 1, per: "floor", price: 3000 }, bridge: { lv: 1, per: "cell", price: 1500 }, tower: { lv: 1, per: "floor", price: 9000 },
  ladder: { lv: 2, per: "floor", price: 1500 }, spiral: { lv: 4, per: "floor", price: 15000 }, fire: { lv: 6, per: "floor", price: 9000 },
  rope: { lv: 8, per: "cell", price: 4000 }, elevator: { lv: 9, per: "floor", price: 30000 },
};
export const DECOR = { sign: { lv: 1, price: 3000 }, outdoor: { lv: 1, price: 3000 }, laundry: { lv: 2, price: 3000 }, pipe: { lv: 3, price: 4500 }, neon: { lv: 4, price: 9000 }, dish: { lv: 5, price: 6000 }, plant: { lv: 5, price: 6000 }, tank: { lv: 6, price: 9000 }, bigSign: { lv: 8, price: 15000 } };
export const GEAR = { light: { lv: 1, price: 15000 }, vacuum: { lv: 1, price: 15000 }, aircon: { lv: 2, price: 22500 }, heater: { lv: 3, price: 30000 }, soundproof: { lv: 4, price: 37500 }, purifier: { lv: 5, price: 45000 } };
export const partPrice = (id, n = 1, floor = 1, boxPrice0 = 0) => { const P = PARTS[id]; if (!P) return null; if (P.per === "box") return Math.round(boxPrice0 * P.mul); return Math.round(P.price * n * (P.per === "room" ? floorMul(floor) : 1)); };

// ---- 3. 住人の 家具 〔決〕1 つずつ（「よりけり」2026-11-14）・〔決〕幅（4 回目の カード「この案でよい」）。1 部屋 家具 3 つ まで ----
//   住人の 家具の 一覧は まだ ない。一覧を 作る ときに 1 つずつ この 幅の 中で 値段と 満足度を 付ける（設備は 上の GEAR）
export const FURN_RANGE = { lo: 3000, hi: 150000, satLo: 3, satHi: 10 };   // 10 倍（もと 300）〜 50 倍（もと 3,000）
export const FURN_MAX = 3;

// ---- 4. アメジスト 〔決〕（2026-11-14 カード「この案でよい」）：殺された 持って いる 子の 復活（ランク）・掲示板を すぐ かえる ----
export const REVIVE = { F: 3, E: 5, D: 8, C: 12, B: 20, A: 30, S: 50, EX: 80 };
export const BOARD_REFRESH = 1;

// ---- 経験値 〔決〕入るのは 防衛の 戦いと 仕事（2026-11-14 カード「戦い、仕事」）・数も 〔決〕（2 回目の カード「この案でよい」）----
//   戦い：倒した 敵 1 体ごとに 敵の Lv × 0.3（派遣と 同じ EXP_PER_LV）を その 戦いに 出た 持って いる 子 みんなに。仕事：1 日ぶんの 仕事で Lv × 4
export const EXP = { perFoeLv: 0.3, workPerLv: 4 };
export const battleExp = (foeLvs) => Math.round(foeLvs.reduce((a, lv) => a + lv * EXP.perFoeLv, 0));
export const workExp = (lv, days = 1) => Math.round(lv * EXP.workPerLv * days);

// ---- 5. 防衛の 報酬（強さ 1〜5）〔決〕（2026-11-14 カード「この案でよい」）。行き先も 〔決〕本編と 共有（素材・スクラップは 倉庫・クレジットは 財布）----
export const REWARD = [
  null,
  { cr: 300, sig: 2, mat: 2, scrap: 3, module: 0.04 },
  { cr: 500, sig: 4, mat: 3, scrap: 4, module: 0.08 },
  { cr: 800, sig: 6, mat: 4, scrap: 5, module: 0.12 },
  { cr: 1200, sig: 8, mat: 5, scrap: 6, module: 0.16 },
  { cr: 1800, sig: 10, mat: 6, scrap: 8, module: 0.2 },
];
export const LOSE = { keep: 0.2, take: 0.5 };   // 負け：報酬の 2 割（倒した 分）・クレジットを 報酬の 半分 取られる
export const HELP_SHARE = 0.4;                  // 手伝って 守りきった 人：報酬の 4 割
// 防衛の 報酬：勝ち＝表の まま・負け＝2 割（倒した 分）と 取られる クレジット・手伝い＝4 割（負けたら なし）
export function rewardOf(strength, { won = true, helper = false } = {}) {
  const R = REWARD[Math.max(1, Math.min(5, strength | 0))], k = helper ? (won ? HELP_SHARE : 0) : won ? 1 : LOSE.keep;
  return { cr: Math.round(R.cr * k), sig: Math.round(R.sig * k), mat: Math.round(R.mat * k), scrap: Math.round(R.scrap * k), module: won ? R.module : 0, take: !won && !helper ? Math.round(R.cr * LOSE.take) : 0 };
}

// ---- 6. シグナルの 値段 〔決〕（2026-11-14）----
export const SIGNAL = { room: 300, furnLo: 20, furnHi: 80, pomCall: 30 };

// ---- 7. 攻めて くる 敵の 数と Lv 〔決〕（2026-11-14）----
export const FOE = { base: 2, perRooms: 8, max: 16, lvMul: [null, 0.8, 0.9, 1.0, 1.1, 1.25], every: 2 };
export const foeCount = (strength, rooms) => Math.min(FOE.max, FOE.base + strength + Math.floor(rooms / FOE.perRooms));
export const foeLv = (strength, lvs) => { const top = [...lvs].sort((a, b) => b - a).slice(0, 3); const avg = top.length ? top.reduce((a, v) => a + v, 0) / top.length : 1; return Math.max(1, Math.round(avg * FOE.lvMul[strength])); };

// ---- 8. 戦いの 数（M-028 の 決めの 中の 数）----
export const FIGHT = {
  side: 4,            // 〔決〕1 つの 戦いは 片方 4 体まで（上下左右）
  chargeMul: 2,       // 〔決〕待ち伏せの チャージ：最初の 与ダメージ 2 倍（バフの 原案の チャージ）
  rush: 2,            // 〔決〕アタッカーの 突撃：1 ターンに 2 マス
  reach: 2,           // 〔決〕キャスター：2 マス 先の 敵の 戦いにも 加われる
  blockDef: 4 / 3,    // 〔決〕2026-11-14ディフェンダーの ふさぐ：受ける ダメージ −25%（DEF を 4/3 倍で あらわす）
  slowTurns: 2,       // 〔決〕2026-11-14テクニシャンの 足止め：疲労（AGI 半分）2 ターン・その あいだ 2 ターンに 1 歩
  healPct: 0.2,       // 〔決〕2026-11-14ヒーラー：となりの 部屋の 住人を 最大 HP の 20% 回復
  revivePct: 0.3,     // 〔決〕起こす：HP 3 割（クローラーの 蘇生と 同じ）
};
// 〔決〕退避の くらべっこ（クローラーの 撤退と 同じ 式）：0.5 ＋（自分の AGI − 敵の いちばん 高い AGI）÷ 合計（最低 40）、20〜90%
export const retreatOdds = (mine, theirs) => Math.max(0.2, Math.min(0.9, 0.5 + (mine - theirs) / Math.max(40, mine + theirs)));
