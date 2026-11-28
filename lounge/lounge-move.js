// プライベートラウンジの 引越しの 門番（2026-11-27 鹿さんの カード。決まりは lounge-proto/move.js）
// 払い：アメジスト（帳簿の 計画。OBS の 財布）か エコポイント（その場で）。家具は そのまま・入りきらない 物は しまう（持ち物の 数は かわらない）
// 記録：rec.room.type（いまの 部屋）・rec.room.owned（買った 部屋。いまの 部屋〈room〉は はじめから）・rec.room.rank・rec.room.size（その 部屋の 広さ）
// 2026-11-27 鹿さんの カード：スキンと 同じ（どれでも 買える・買った 部屋は ただで 切りかえ・部屋ごとの 広さ）
import { N, F, fits } from "./lounge-rules.js";
import { MOVE_TYPES, rankOfSize, ROOM_RANK, layoutCells, roomSize, roomPrice } from "./move.js";

const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);
export const roomRank = (rec) => (Number.isInteger(rec.room && rec.room.rank) ? rec.room.rank : rankOfSize((rec.room && rec.room.size) || N));
export const roomType = (rec) => (has(MOVE_TYPES, rec.room && rec.room.type) ? rec.room.type : "room");
// 新しい 広さに 入る 家具だけ 残す（はみ出す・かさなる 物は しまう）
export function fitItems(items, n, extra = null) {
  const ok = [], out = [];
  for (const it of Array.isArray(items) ? items : []) { const f = F(it.id); if (f && fits(ok, it, -1, n, extra)) ok.push({ ...it, uid: ok.length + 1 }); else out.push(it.id); }
  return { items: ok.map(({ uid, ...it }) => it), out };
}
// 買った 部屋（いまの 部屋は はじめから・いま いる 部屋も 入れる）
export function ownedOf(rec) {
  const s = new Set(["room"]); for (const t of (rec.room && Array.isArray(rec.room.owned) ? rec.room.owned : [])) if (has(MOVE_TYPES, t)) s.add(t);
  if (has(MOVE_TYPES, rec.room && rec.room.type)) s.add(rec.room.type); return [...s];
}
// 引越しの 計画（PLANS の room.move）。b：{ type, pay: "res"|"eco" }。買って ある 部屋は ただで 切りかえ
export function movePlan(rec, b) {
  const pay = b && b.pay === "eco" ? "eco" : "res", type = b && has(MOVE_TYPES, b.type) ? b.type : null;
  if (!type || !rec.room) return { ok: false, why: "部屋を えらんで" };
  if (((rec.ledger && rec.ledger.unknown) || []).some((x) => x && x.grant && x.grant.room)) return { ok: false, why: "前の 引越しの 支払いを 待って います" };   // おくれた アメジストの 払いが 決まるまで 次を しない
  if (type === roomType(rec)) return { ok: false, why: "いまと 同じ 部屋" };
  if (ownedOf(rec).includes(type)) { const out = applyMove(rec, { type }); return { ok: true, type, size: rec.room.size, pay: "free", cost: 0, stored: out.length }; }   // 買った 部屋は ただで 切りかえ
  const cost = roomPrice(type, pay), size = roomSize(type);
  if (pay === "eco") {
    const pts = Number.isFinite(rec.eco) && rec.eco > 0 ? Math.floor(rec.eco) : 0;
    if (cost > pts) return { ok: false, why: `エコポイントが 足りない：あと ${(cost - pts).toLocaleString("ja-JP")}` };
    rec.eco = pts - cost; const out = applyMove(rec, { type });
    return { ok: true, type, size, pay, cost, stored: out.length, eco: rec.eco };
  }
  // アメジスト：払えたと わかった ときに 買って 引っ越す（grant の room。返事が おくれた ときは 帳簿が 決まってから）
  return { costs: [{ kind: "res", d: -cost }], why: "room.move", grant: { room: { type } }, info: { type, size, pay, cost } };
}
// 引っ越す（買った 部屋に 入れて 切りかえる。give の room からも 呼ぶ）。入りきらない 家具は しまう。しまった 物を かえす
export function applyMove(rec, m) {
  const type = m && has(MOVE_TYPES, m.type) ? m.type : null; if (!type || !rec.room) return [];
  rec.room.owned = [...new Set([...ownedOf(rec), type])].filter((t) => t !== "room");
  const size = roomSize(type), f = fitItems(rec.room.items, size, layoutCells(type, size));
  rec.room.items = f.items; rec.room.rank = ROOM_RANK[type]; rec.room.size = size; rec.room.type = type;
  return f.out;
}
