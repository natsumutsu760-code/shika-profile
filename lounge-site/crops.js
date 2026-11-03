// 作物の 表の 読みこみ口（大工事の 農業。docs/mono-link-farm.md）。数は すべて 案
// 島ごとの 表（crops-isle<N>.js）を まとめる。畑の 決まり（farm-core.js）・絵（crop-art.js）・資料（tools/crop-check.mjs）は ここだけ 見る
// ・作物を 足す：島の 表に 1 行 足す → `node stream-layouts/tools/crop-check.mjs`。ほかの ファイルは 直さない（足し方：.claude/skills/farm-crops）
// ・島を 足す：crops-isle<N>.js を 作って、下の ISLES に 1 つ 足す
//
// 1 行の 中身
//   id     英小文字と _。とれる 素材の id にも なる（いまの 素材と 同じ id なら、その 素材が とれる。例：herb＝薬草）
//   name・en  日本語と 英語の 名前
//   kind   seed（種から。CLR で 買える・宝箱と 採取で 拾える）／cross（かけ合わせで 生まれる）／special（かけ合わせで だけ・まれ）
//   lv     seed だけ。種が 手に 入る 農業の Lv
//   at     seed だけ。種を 拾える 行き先（dungeons.js の id）。派遣の 採取で 素材と いっしょに たまに 出る（鹿さんの 決め 2026-11-03：種は ダンジョンの 採取から）
//   from   cross・special だけ。親 2 つの id（同じ 物 2 つでも よい）。同じ 親の 組で 生まれる 物は 1 つだけ
//   soil   （なくて よい）この 土だと かけ合わせで 2 倍 出やすい
//   h      育つ 時間（時間）
//   get    （なくて よい）1 マスで とれる 数 [少ない, 多い]。書かなければ KIND の ふつう
//   after  （なくて よい）実って 猶予が すぎたら。書かなければ 枯れる。{ into: 素材の id, taps: たたく 回数 }＝かわる（taps なしは 1）。"flee"＝歩いて 逃げる
//   use    使い道（短く）
//   look   { form: 絵の 型（crop-art.js の FORMS）, c: [実や 花の 色, そえる 色] }。ほかは 何も 描かなくて よい
//   value  （なくて よい）相場（1 こ）。書かなければ cropMarket の 線から
//   land   （なくて よい）名前を とった 土地（資料に 出る。名前の 世界観を そろえる ための メモ）
import isle1 from "./crops-isle1.js";
import isle2 from "./crops-isle2.js";

export const ISLES = [isle1, isle2];
// 大工事で 農業の 畑が ゲームに つながったら true。それまでは 作物を 使う レシピ（工房の 加工・薬・おやつ など）は 出さない（作物が 手に 入らない ため。docs/mono-link-crafting.md）
// 2026-11-03 鹿さんの 決め（カード）：試しの 形で 門番に つないで 開く（いまは 大工事の ロックと PET_OPEN で 鹿さんと おたこまるさんだけ。lounge-server/lounge-lock.js）
export const FARM_OPEN = true;
export const farmOpen = () => (globalThis.MONO_FARM_OPEN === false ? false : FARM_OPEN || globalThis.MONO_FARM_OPEN === true);   // 試験と 見本で 開いた 形・閉じた 形を 見る ため（門番の 中は だれも 書きかえられない）

// 種類ごとの ふつう（get：1 マスで とれる 数・cross：かけ合わせで 芽が 出る 重み）
export const KIND = {
  seed: { label: "種から", get: [2, 4], cross: 0 },
  cross: { label: "かけ合わせ", get: [2, 4], cross: 1 },
  special: { label: "とくべつ", get: [1, 1], cross: 0.2 },   // ふつうの かけ合わせの 1/5
};

export const CROPS = ISLES.flatMap((f) => f.crops.map((c) => ({ isle: f.isle, ...c, get: c.get || KIND[c.kind].get, mat: c.mat || c.id })));
export const CROP = Object.fromEntries(CROPS.map((c) => [c.id, c]));
// 作物から できる 新しい 素材（放っておくと かわる 物。鉄竹・世界樹の葉 など）
export const CROP_MATS = ISLES.flatMap((f) => (f.mats || []).map((m) => ({ isle: f.isle, ...m })));

// 放っておくと どう なるか → { kind: "wither" } ／ { kind: "turn", into, taps } ／ { kind: "flee" }
export const afterOf = (c) => (!c.after ? { kind: "wither" } : c.after === "flee" ? { kind: "flee" } : { kind: "turn", into: c.after.into, taps: c.after.taps || 1 });

// かけ合わせ：親の 組（順番は 問わない）→ 生まれる 作物
const pairKey = (a, b) => [a, b].sort().join("+");
export const CROSS = {};
for (const c of CROPS) if (c.from) (CROSS[pairKey(...c.from)] ||= []).push(c);
export const crossOf = (a, b) => (CROSS[pairKey(a, b)] || [])[0] || null;
// その 作物が 親に なる かけ合わせ（図鑑の「この 作物から 生まれる」）
export const childrenOf = (id) => CROPS.filter((c) => c.from && c.from.includes(id));

// 相場（掲示板の めやす。1 こ。docs/mono-link-numbers.md の 7）：書いて いない 物は 種類と 島ごとに 育つ 時間で 線を 引く
// [短い 時間, その 値, 長い 時間, その 値]。島が 表に ない ときは いちばん 後ろの 島の 線。はしは こえない。CLR の 買い取りは この 3 割
export const MARKET = {
  seed: [[2, 5, 6, 15], [4, 15, 8, 30]],   // 島 1 で 5〜15・島 2 で 15〜30
  cross: [[3, 20, 10, 80]],                // 20〜80
  special: [[8, 200, 36, 1000]],           // 200〜1,000
};
export const COLOR_MULT = { gold: 5, rainbow: 25 };
export const cropMarket = (c) => {
  if (c.value) return c.value;
  const ls = MARKET[c.kind], [h0, v0, h1, v1] = ls[Math.min(c.isle, ls.length) - 1], t = Math.max(0, Math.min(1, (c.h - h0) / (h1 - h0)));
  return Math.round(v0 + (v1 - v0) * t);
};
