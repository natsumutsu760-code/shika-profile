// プライベートラウンジの 引越し（2026-11-27 鹿さんの カード。docs/mono-link-border-zone.md「完成に 向けて」）
// 鹿さんの 言葉「広さも内容も違う部屋へ引っ越せる」・「ランクによってアメジスト150～5000まで エコポイントは少し安く30000～」→「ランク＝広さ」
// - ランク 1＝8×8（アメジスト 150／エコ 30,000）・2＝10×10（400／80,000）・3＝12×12（1,000／200,000）・4＝14×14（2,500／500,000）・5＝16×16（5,000／1,000,000）
//   その 先も 1 段 5,000／1,000,000 で 広がる（上限なし）。いまの 部屋（6×6）は ランク 0
// - 部屋：いまの 部屋・屋上・倉庫・和室・前線基地・緑の 廃墟・夜景の 高層・海の 見える 部屋・VIP ラウンジ（ランクは 下の ROOM_RANK）。家具は そのまま・入りきらない 物は しまう
// 2026-11-27 鹿さんの カード「引っ越しはスキンと同じ考え方。購入したら自由に変更できる。」→「部屋ごとの 広さ」「どれでも 買える」
//   部屋を 1 つずつ 買う（値段は その 部屋の ランクの 値段）・買った 部屋は いつでも ただで 切りかえ・広さは その 部屋の ランクの 広さ（せまく なると 入りきらない 家具は しまう）
//   （前の「1 段ずつ」〔C〕・「種類だけ かえる ときは 1 割」・「その ランクまでの 部屋 ぜんぶ」は この 形で なくなった）
export const MOVE_RANKS = [{ n: 6 }, { n: 8, res: 150, eco: 30000 }, { n: 10, res: 400, eco: 80000 }, { n: 12, res: 1000, eco: 200000 }, { n: 14, res: 2500, eco: 500000 }, { n: 16, res: 5000, eco: 1000000 }];
export const MOVE_TOP = { res: 5000, eco: 1000000 };   // ランク 6 から 先（〔C〕1 段ごとに 2 マス 広い。ランク 7 から 先の 部屋は まだ ない）
export const moveSize = (rank) => (rank <= 5 ? MOVE_RANKS[Math.max(0, rank | 0)].n : 16 + 2 * ((rank | 0) - 5));
export const movePrice = (rank, pay) => { const r = Math.max(1, rank | 0), P = r <= 5 ? MOVE_RANKS[r] : MOVE_TOP; return pay === "eco" ? P.eco : P.res; };
export const MOVE_TYPES = { room: "いまの 部屋", roof: "屋上", warehouse: "倉庫", washitsu: "和室", base: "前線基地", ruin: "緑の 廃墟", night: "夜景の 高層", ocean: "海の 見える 部屋", vip: "VIP ラウンジ" };
export const MOVE_TYPE_TEXT = { room: "いまの 部屋の まま", roof: "空と フェンス", warehouse: "コンテナと 鉄骨", washitsu: "畳と 障子", base: "土のう・有刺線・地図", ruin: "コンクリートと つる・手前と 右に 草地", night: "ガラスの かべと 夜の 街・ロフト", ocean: "ガラスの かべと 海・テラス", vip: "水の 帯と 泡の 柱・プール・通路" };
// 部屋（種類）ごとの ランク（2026-11-27 鹿さん「広さの基準はランクで決めますが間取り(ロフト付き)や構造はその部屋毎に変わる」「スキンと同じ考え方というのはデザインについてです。」）
// ランクの わりふり：鹿さんの カード「この まま」（1 屋上・倉庫／2 和室・前線基地／3 緑の 廃墟／4 夜景の 高層／5 海の 見える 部屋／6 VIP ラウンジ）。部屋を 足す ときは 7 から 先も 足せる（上限なし）
export const ROOM_RANK = { room: 0, roof: 1, warehouse: 1, washitsu: 2, base: 2, ruin: 3, night: 4, ocean: 5, vip: 6 };
const hasRoom = (t) => typeof t === "string" && Object.prototype.hasOwnProperty.call(ROOM_RANK, t);
export const roomSize = (type) => moveSize(hasRoom(type) ? ROOM_RANK[type] : 0);   // その 部屋の 広さ（部屋ごとの 広さ）
export const roomPrice = (type, pay) => (hasRoom(type) && ROOM_RANK[type] > 0 ? movePrice(ROOM_RANK[type], pay) : 0);   // その 部屋の 値段（いまの 部屋は はじめから 持って いる）
// 間取り（鹿さんの カード：間取りに 家具を「置ける」）。マスは 部屋の 床の 左奥が (0, 0)・x は 右・z は 手前
//   areas：床の 外で 家具を 置ける 所（y は 床の 高さ）／blocks：ふさがる 所（プール・作りつけ・柱・木）
//   〔C〕形と 数は Claude の 案（参考の 絵から）。広い ランクでも 同じ 形が のびる
export function roomLayout(type, n) {
  if (type === "vip") { const P = Math.max(4, Math.round(n * 0.55)); return { areas: [{ x: 0, z: n, w: n + 3, d: 5, y: 0 }, { x: n, z: 0, w: 2, d: n, y: 0 }],
    blocks: [{ x: 1, z: n + 1, w: P, d: 3, k: "pool" }, { x: P + 2, z: n + 1, w: 4, d: 4, k: "sofa" }, { x: n, z: 0, w: 1, d: 1, k: "pillar" }, { x: 0, z: n, w: 1, d: 1, k: "pillar" }, { x: 0, z: n + 4, w: 1, d: 1, k: "palm" }, { x: n + 2, z: n, w: 1, d: 1, k: "palm" }, { x: n + 1, z: 1, w: 1, d: 1, k: "palm" }] }; }
  if (type === "ocean") return { areas: [{ x: 0, z: n, w: n, d: 3, y: 0 }], blocks: [{ x: 0, z: n + 2, w: 1, d: 1, k: "palm" }, { x: n - 1, z: n + 2, w: 1, d: 1, k: "palm" }, { x: 2, z: n, w: 1, d: 2, k: "lounger" }, { x: 4, z: n, w: 1, d: 2, k: "lounger" }, { x: 3, z: n, w: 1, d: 1, k: "table" }] };
  if (type === "night") { const L = Math.min(n, 8); return { areas: [{ x: n, z: 0, w: 4, d: L, y: 2.4, k: "loft" }, { x: n + 1, z: L, w: 3, d: 3, y: 0 }], blocks: [{ x: n + 3, z: L - 1, w: 1, d: 1, k: "plant" }], loft: { L, y: 2.4 } }; }
  if (type === "ruin") return { areas: [{ x: 0, z: n, w: n + 3, d: 3, y: 0 }, { x: n, z: 0, w: 3, d: n, y: 0 }], blocks: [{ x: 0, z: n + 2, w: 1, d: 1, k: "bush" }, { x: n + 2, z: n + 1, w: 1, d: 2, k: "bush" }, { x: n + 2, z: 2, w: 1, d: 1, k: "bush" }, { x: Math.round(n * 0.55), z: n + 2, w: 1, d: 1, k: "bush" }] };
  return { areas: [], blocks: [] };
}
// 床の 外の 置ける マス（"x,z" → 床の 高さ）。門番と 画面で 同じ 物を 使う
export function layoutCells(type, n) {
  const L = roomLayout(type, n), out = new Map(), bl = new Set();
  for (const b of L.blocks) for (let x = b.x; x < b.x + b.w; x++) for (let z = b.z; z < b.z + b.d; z++) bl.add(x + "," + z);
  for (const a of L.areas) for (let x = a.x; x < a.x + a.w; x++) for (let z = a.z; z < a.z + a.d; z++) { const k = x + "," + z; if (!bl.has(k) && !(x < n && z < n) && !out.has(k)) out.set(k, a.y); }
  return out;
}
export const rankOfSize = (n) => { const k = n | 0; if (k <= 6) return 0; if (k <= 16) return MOVE_RANKS.findIndex((x) => x.n === k) >= 0 ? MOVE_RANKS.findIndex((x) => x.n === k) : 0; return 5 + Math.floor((k - 16) / 2); };
