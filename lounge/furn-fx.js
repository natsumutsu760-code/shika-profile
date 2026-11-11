// 家具の 効果（リンデン家具工房・LDN・TCU。2026-11-11 鹿さん「8つの仕組み…作り実装してください」。決まりは docs/mono-link-services-plan.md 8 章）
// 〔決〕効果は 1〜5%・となりあう 組み合わせで シナジー・合計の 上限は なし（部屋の 広さで しばる）・新しい 家具は ぜんぶ 足す（カード「全部」）
// 〔原〕例：暖炉は 鉱石の 精錬が 早く なる・コーヒーメーカーは 収穫が 少し 早まる
// 部屋に 置いて いる 間だけ・いつも はたらく（デバフを うけた ときだけ などの 条件は つけない）。数は Claude の 案
// 効果の しゅるい（FX_NAME）：どこで 使うかは 右の とおり
export const FX_NAME = {
  smelt: "精錬の 時間",      // lounge-workshop.js の smeltPut（炉に 入れた ときの 時間）
  crop: "作物の 育つ 時間",   // lounge-farmv.js の 植える（植えた 時刻を 前に）
  cross: "かけ合わせ",        // farm-core.js の crossChance
  color: "色ちがい",          // farm-core.js の 金色・虹色
  research: "研究の 時間",    // 研究の 時間
  resCost: "研究の アメジスト",
  star: "開発で 高い ★",      // 装備開発・作る（★の くじ）
  opGood: "OP 抽選で 良い OP", // 工房の 素材の OP 抽選（素材の 得意な OP）
  snack: "おやつ ＋1 こ",      // おやつ工房（1 回で 1 こ 多く できる 確率）
  rest: "休憩の 回復",        // 派遣の 計算（dungeon-sim の 休憩）
  exp: "派遣の 経験値",       // 派遣の 帰り
  gather: "採取",             // 派遣の 帰り（採取の 素材が ふえる 確率）
  drop: "敵の 素材",          // 派遣の 帰り（敵の 素材が ふえる 確率）
  meet: "希少な 敵に 会う",   // 派遣の 計算（〔C〕資料の「会った ことの ない 敵」は 希少な 敵の 出やすさに した）
  escape: "力つきても 持ち帰る", // 力つきた ときに 素材を 失わない 確率（〔C〕資料の「力つきる 確率 −1%」）
  interest: "預金の 利子",
  insWait: "保険の 支払いが 届く 時間",
  fight: "ファイトマネー",    // Orbit Arena
  rank: "格付けの 点",        // Orbit Arena
};
export const FX_DOWN = new Set(["smelt", "crop", "research", "resCost", "insWait"]);   // へらす 効果（画面は −）
// いまの 家具（★1 で 1%〜★5 で 5%）
export const FURN_FX = {
  plant: { crop: 0.01 }, cushion: { rest: 0.01 }, rug: { exp: 0.01 }, mat: { gather: 0.01 }, window: { gather: 0.01 },
  sofa: { rest: 0.02 }, lowtable: { snack: 0.02 }, shelf: { research: 0.02 }, lamp: { smelt: 0.02 },
  desk: { star: 0.03 }, chair: { exp: 0.03 }, bed: { rest: 0.03 }, tank: { drop: 0.03 },
  neon: { color: 0.04 }, arcade: { fight: 0.04 }, bigmon: { rank: 0.04 },
  holo: { exp: 0.05 }, spacewin: { gather: 0.05 },
  // 新しい 家具（リンデン家具工房で クレジットで 買う。lounge-rules.js の ldn）。となりに 置く 物（薪置き場 など）は それだけでは はたらかない
  fireplace: { smelt: 0.03 }, coffee: { crop: 0.02 }, worklamp: { star: 0.01 }, hammock: { rest: 0.03 }, mapframe: { gather: 0.02 },
  pot: { cross: 0.02 }, vault: { interest: 0.01 }, trophy: { rank: 0.01 }, firstaid: { insWait: 0.05 },
};
// となりあうと はたらく 組み合わせ（1 こは 1 つの 組にだけ 数える）
export const FURN_SYN = [
  ["sofa", "lowtable", { rest: 0.02 }], ["desk", "chair", { star: 0.01 }], ["shelf", "lamp", { research: 0.01 }], ["fireplace", "rug", { smelt: 0.02 }],
  ["coffee", "plant", { crop: 0.01 }], ["arcade", "neon", { fight: 0.02 }], ["bed", "cushion", { rest: 0.01 }], ["tank", "plant", { drop: 0.01 }], ["hammock", "plant", { escape: 0.01 }],
  ["fireplace", "woodpile", { smelt: 0.02 }], ["coffee", "beans", { crop: 0.01 }], ["shelf", "writedesk", { resCost: 0.01 }], ["worklamp", "toolwall", { opGood: 0.01 }],
  ["mapframe", "globe", { meet: 0.02 }], ["pot", "wateringcan", { color: 0.01 }], ["trophy", "dummy", { fight: 0.02 }],
];
export const FX_MAX = 0.9;   // へらす 効果が 0 より 小さく ならない ための 止め（ふつうの 部屋では とどかない）

// 置いた 物の マス（床は その マス。かべの 物は かべの 前の 床の マス：おくの かべ z = 0・左の かべ x = 0）
function cellsOfItem(it, size) {
  if (it.wall) { const n = typeof size === "number" ? size : 1, out = []; for (let k = 0; k < n; k++) out.push(it.wall === "back" ? [it.i + k, 0] : [0, it.i + k]); return out; }
  const [w0, d0] = Array.isArray(size) ? size : [1, 1], [w, d] = it.rot % 2 ? [d0, w0] : [w0, d0], out = [];
  for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) out.push([it.x + a, it.z + b]);
  return out;
}
const near = (A, B) => A.some(([ax, az]) => B.some(([bx, bz]) => Math.abs(ax - bx) + Math.abs(az - bz) <= 1));   // かさなる（ラグの 上）か となり
// items：部屋の 置き方（rec.room.items）・sizeOf(id)：家具の 大きさ。かえす：{ fx：効果の 合計, syn：はたらいた 組み合わせ }
export function furnFx(items, sizeOf) {
  const fx = {}, add = (o) => { for (const [k, v] of Object.entries(o)) fx[k] = Math.round(((fx[k] || 0) + v) * 1000) / 1000; };
  const list = (Array.isArray(items) ? items : []).map((it) => ({ it, cells: cellsOfItem(it, sizeOf(it.id)) }));
  for (const { it } of list) if (FURN_FX[it.id]) add(FURN_FX[it.id]);
  const syn = [];
  for (const [a, b, o] of FURN_SYN) {
    const used = new Set();
    for (const x of list) { if (x.it.id !== a || used.has(x)) continue;
      const y = list.find((z) => z !== x && z.it.id === b && !used.has(z) && near(x.cells, z.cells));
      if (y) { used.add(x); used.add(y); add(o); syn.push([a, b]); } }
  }
  for (const k of FX_DOWN) if (fx[k] > FX_MAX) fx[k] = FX_MAX;
  return { fx, syn };
}
