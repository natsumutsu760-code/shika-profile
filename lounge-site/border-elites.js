// ボーダーゾーンに 出る 精鋭 LINKER（2026-11-16 鹿さんの カード「敵として 呼ぶ」「その 領地の 会社から」「1 人まで」・2026-11-03「精鋭も境界に出す」）
// 機体（pet）と 所属（co）は クローラーの LINKERS（crawler-ch1.js・crawler-ch2.js）の 写し。門番に 迷宮の 重い データを 読ませない ため ここに 写した
// （test-border.mjs で LINKERS と そろって いるか 確かめる）。戦う 形（技 5・目玉 1・パッシブ 3）は crawler-elite-units.js の ELITE_UNITS
// 会社の 領地（BZ_AREAS の group）では その 会社の 精鋭・境界（group なし）では 全員。章を 作って 精鋭が ふえたら ここに 足す
export const BZ_ELITES = {
  "ONE SHOE": { pet: "mouse", co: "sva" }, BACKBONE: { pet: "mogura", co: "sva" }, SPARKY: { pet: "chokin", co: "sva" },
  BOOKMARK: { pet: "saboten", co: "harmonia" }, PORCELAIN: { pet: "mouse", co: "harmonia" }, STALEMATE: { pet: "chokin", co: "harmonia" }, "DEJA VU": { pet: "kurage", co: "harmonia" },
  SPLINT: { pet: "pelican", co: "tcu" }, "RABBIT HOLE": { pet: "shika", co: "tcu" }, BRUISER: { pet: "mogura", co: "tcu" }, HUSH: { pet: "saboten", co: "tcu" },
  "GHOST NOTE": { pet: "tv", co: "nox" }, NOBODY: { pet: "mouse", co: "nox" },
  STOPWATCH: { pet: "pelican", co: "linkers" }, "NEW MOON": { pet: "kurage", co: null }, "FIRST LIGHT": { pet: "shika", co: null }, AFTERTHOUGHT: { pet: "tv", co: null },
};
export const bzElitePool = (group) => Object.keys(BZ_ELITES).filter((n) => !group || BZ_ELITES[n].co === group);
export const BZ_ELITE = { codes: 2, call: 1 };   // 〔決〕倒すと 解析コード 2 こ（＋貴重サンプル 1 こ）・1 回の 出撃で 呼べるのは 1 人
