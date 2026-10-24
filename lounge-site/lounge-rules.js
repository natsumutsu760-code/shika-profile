// プライベートラウンジの 家具の 決まり（3D なし）。ブラウザ（lounge-furniture.js・lounge-room.html・lounge-shop.html）と 門番（../lounge-server/）の 両方が 読む
// 決まりが ずれないように、置けるか・値段・お店の くじは ここだけに 書く。決めごとは docs/mono-link-lounge.md、門番の 作りは docs/mono-link-lounge-server.md
// place：floor（床。マスを ふさぐ）・rug（しく 物。ほかの 家具を 上に 置ける）・wall（奥と 左の かべに かける）
// size：床は [よこ, おく]（マス）、かべは はば（マス）。keep：しまえない（PC は DEEP LINK/: の 入口）

export const N = 6;                                   // 部屋の マス（6×6 から。設備「部屋の拡張」で 8×8 → 10×10）
export const PRICE = { 1: 5, 2: 15, 3: 40, 4: 120, 5: 300 };   // 値段（リソース）
export const HATCH = { x: 0, z: 5 };                  // 地下の 隠れ家への はしご（動かせない）

export const FURN = [
  { id: "plant", name: "観葉植物", star: 1, place: "floor", size: [1, 1] },
  { id: "cushion", name: "クッション", star: 1, place: "floor", size: [1, 1] },
  { id: "rug", name: "ラグ", star: 1, place: "rug", size: [3, 2] },
  { id: "mat", name: "マット", star: 1, place: "rug", size: [1, 1] },
  { id: "window", name: "窓", star: 1, place: "wall", size: 2 },
  { id: "sofa", name: "ソファ", star: 2, place: "floor", size: [2, 1] },
  { id: "lowtable", name: "ローテーブル", star: 2, place: "floor", size: [2, 1] },
  { id: "shelf", name: "本棚", star: 2, place: "floor", size: [1, 1] },
  { id: "lamp", name: "フロアランプ", star: 2, place: "floor", size: [1, 1], glows: true },
  { id: "desk", name: "ゲーミングデスク", star: 3, place: "floor", size: [2, 1], glows: true },
  { id: "chair", name: "ゲーミングチェア", star: 3, place: "floor", size: [1, 1] },
  { id: "bed", name: "ベッド", star: 3, place: "floor", size: [1, 2] },
  { id: "tank", name: "水槽", star: 3, place: "floor", size: [2, 1], glows: true },
  { id: "neon", name: "ネオンサイン", star: 4, place: "wall", size: 2, glows: true },
  { id: "arcade", name: "アーケード筐体", star: 4, place: "floor", size: [1, 1], glows: true },
  { id: "bigmon", name: "壁の大型モニター", star: 4, place: "wall", size: 2, glows: true },
  { id: "holo", name: "鹿のホログラム", star: 5, place: "floor", size: [1, 1], glows: true },
  { id: "spacewin", name: "宇宙の見える窓", star: 5, place: "wall", size: 2, glows: true },
  { id: "rack", name: "サーバーラック", star: 0, kind: "設備", place: "floor", size: [1, 1], glows: true },
  { id: "pc", name: "PC", star: 0, kind: "DEEP LINK/: の 入口", place: "floor", size: [1, 1], glows: true, keep: true },
];
export const F = (id) => FURN.find((f) => f.id === id);

// ---------- 置けるか ----------
export const isWall = (id) => F(id).place === "wall";
export const dims = (it) => { const [w, d] = F(it.id).size; return it.rot % 2 ? [d, w] : [w, d]; };
export const cellsOf = (it) => { const [w, d] = dims(it), out = []; for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) out.push([it.x + a, it.z + b]); return out; };
export const slotsOf = (it) => Array.from({ length: F(it.id).size }, (_, k) => it.i + k);
// items（いま 置いて いる 物）の 中に it を 置けるか。skip は 動かして いる 物の uid
export function fits(items, it, skip, n = N) {
  if (isWall(it.id)) {
    if (it.i < 0 || it.i + F(it.id).size > n) return false;
    const mine = new Set(slotsOf(it));
    return !items.some((o) => o.uid !== skip && o.wall === it.wall && slotsOf(o).some((k) => mine.has(k)));
  }
  const cells = cellsOf(it); if (cells.some(([x, z]) => x < 0 || z < 0 || x >= n || z >= n || (x === HATCH.x && z === HATCH.z))) return false;
  const layer = F(it.id).place, mine = new Set(cells.map(([x, z]) => x + "," + z));
  return !items.some((o) => o.uid !== skip && !o.wall && F(o.id).place === layer && cellsOf(o).some(([x, z]) => mine.has(x + "," + z)));
}
// 部屋の 置き方 ぜんぶを たしかめる（門番が 受けとった とき）。own は 持って いる 数。だめなら 理由（文字）を 返す
export function checkRoom(items, own, n = N) { const r = cleanRoom(items, own, n); return typeof r === "string" ? r : ""; }
// たしかめて、しまって よい 形（床か 壁かは 家具の しゅるいで 決める。送られた ほかの 値は すてる）を 返す。だめなら 理由（文字）
export function cleanRoom(items, own, n = N) {
  if (!Array.isArray(items) || items.length > 200) return "置き方の 形が ちがう";
  const used = {}, ok = [];
  for (const raw of items) {
    const f = raw && F(raw.id); if (!f) return "知らない 家具";
    const it = f.place === "wall"
      ? { id: f.id, wall: raw.wall, i: raw.i }
      : { id: f.id, x: raw.x, z: raw.z, rot: raw.rot || 0 };
    const ints = f.place === "wall" ? [it.i] : [it.x, it.z, it.rot];
    if (ints.some((v) => !Number.isInteger(v)) || (f.place === "wall" ? !["back", "left"].includes(it.wall) : it.rot < 0 || it.rot > 3)) return "置き方の 形が ちがう";
    used[f.id] = (used[f.id] || 0) + 1; if (used[f.id] > (own[f.id] || 0)) return `${f.name}を 持って いる 数より 多い`;
    if (!fits(ok, it, -1, n)) return `${f.name}が ほかの 物と かさなる`;
    ok.push({ ...it, uid: ok.length + 1 });
  }
  for (const f of FURN) if (f.keep && (own[f.id] || 0) > 0 && !used[f.id]) return `${f.name}は しまえない`;
  return ok.map(({ uid, ...it }) => it);
}

// ---------- お店（鹿さんの決め：日替わりの 棚・カタログ・インテリアガチャ）----------
export const SALE_IDS = FURN.filter((f) => f.star > 0).map((f) => f.id);   // お店に ならぶ 家具（設備と PC は べつ）
export const DAILY_N = 3, DAILY_OFF = 0.2;                      // 日替わり：毎日 0 時（日本時間）に 3 つ。いつもの 2 割引き。みんな 同じ 品
export const GACHA_COST = 10, GACHA_RATE = { 1: 50, 2: 30, 3: 14, 4: 5, 5: 1 };   // 1 回 10 リソース。かぶったら 2 こ目として 持てる
export const salePrice = (f) => Math.round(PRICE[f.star] * (1 - DAILY_OFF));
export const jstDay = (t = Date.now()) => Math.floor((t + 9 * 3600e3) / 86400e3);
const mul = (s) => () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// その日の 3 品（日が 同じなら だれが 見ても 同じ）
export function dailyIds(day) { const R = mul(day * 2654435761), pool = SALE_IDS.slice(), out = []; while (out.length < DAILY_N) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
export function pullId(R = Math.random) {
  let r = R() * 100, star = 1; for (const [s, w] of Object.entries(GACHA_RATE)) { if (r < w) { star = +s; break; } r -= w; }
  const list = SALE_IDS.filter((id) => F(id).star === star); return list[Math.floor(R() * list.length)];
}
// 値段：日替わりの 日に その品なら 2 割引き
export const priceOn = (id, day) => (dailyIds(day).includes(id) ? salePrice(F(id)) : PRICE[F(id).star]);

// 見本の 持ち物（はじめての 人に わたす 物と 同じに する予定）
export const SAMPLE_OWN = { plant: 2, cushion: 2, rug: 1, mat: 1, window: 1, sofa: 1, lowtable: 1, shelf: 1, lamp: 1, desk: 1, chair: 1, bed: 1, tank: 1, neon: 1, arcade: 1, bigmon: 1, holo: 1, spacewin: 1, rack: 1, pc: 1 };

// はじめての 人の 部屋（ラウンジに はじめて 入った とき。PC は かならず。あとは お店と ガチャで ふやす）。数は 案
export const STARTER_OWN = { pc: 1, plant: 1, sofa: 1, rug: 1, lamp: 1, window: 1 };
export const STARTER_ROOM = [{ id: "pc", x: 2, z: 0, rot: 0 }, { id: "plant", x: 0, z: 0, rot: 0 }, { id: "sofa", x: 2, z: 2, rot: 0 }, { id: "rug", x: 1, z: 3, rot: 0 }, { id: "lamp", x: 0, z: 4, rot: 0 }, { id: "window", wall: "left", i: 3 }];
