// リサイクルと エコポイントの 門番（2026-11-27 鹿さんの カード。決まりは lounge-proto/eco.js）
// 記録：rec.eco（ポイント）。ボーダーゾーンが 開いた 人だけ（bzReqOpen と 同じ）
import { ECO, recyclable, ecoOf, ECO_KEYS, ecoBuyPrice } from "./eco.js";
import { putMats } from "./lounge-game.js";

const has = (m, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k);
const ptsOf = (rec) => (Number.isFinite(rec.eco) && rec.eco > 0 ? Math.floor(rec.eco) : 0);
export const ecoView = (rec, open) => (open ? { pts: ptsOf(rec) } : null);

// リサイクル（b.items：[{ id, n }]。n が ない ときは その 素材 ぜんぶ）
export function ecoRecycle(rec, b, open) {
  if (!open) return { ok: false, why: "ボーダーゾーンが 開いて から" };
  const items = Array.isArray(b && b.items) ? b.items.slice(0, 80) : [];
  const own = (rec.own && rec.own.mats) || [];
  let pts = 0, n = 0;
  for (const it of items) {
    const id = it && it.id; if (!recyclable(id)) continue;
    const have = own.filter((x) => x.id === id).reduce((t, x) => t + x.n, 0);
    let want = Number.isInteger(it.n) && it.n > 0 ? Math.min(it.n, ECO.max * 100, have) : have;
    if (want <= 0) continue;
    for (const x of own.filter((y) => y.id === id).sort((p, q) => (p.q || 0) - (q.q || 0))) { const k = Math.min(want, x.n); x.n -= k; want -= k; pts += k * ecoOf(id); n += k; if (!want) break; }   // 品質の 低い 物から
  }
  if (!n) return { ok: false, why: "リサイクルする 素材を えらんで" };
  rec.own.mats = own.filter((x) => x.n > 0); rec.eco = ptsOf(rec) + pts;
  return { ok: true, n, pts, eco: rec.eco };
}

// 交換（b.what：key_bz・key_crate・mat。b.n：数）
export function ecoBuy(rec, b, open, now) {
  if (!open) return { ok: false, why: "ボーダーゾーンが 開いて から" };
  const n = Number.isInteger(b && b.n) && b.n > 0 && b.n <= ECO.max ? b.n : 0;
  if (!n) return { ok: false, why: "数を えらんで" };
  if (has(ECO_KEYS, b.what)) {
    const cost = ECO.key * n; if (cost > ptsOf(rec)) return { ok: false, why: `エコポイントが 足りない：あと ${(cost - ptsOf(rec)).toLocaleString("ja-JP")}` };
    rec.eco = ptsOf(rec) - cost; (rec.items ||= {})[b.what] = (rec.items[b.what] || 0) + n;
    return { ok: true, what: b.what, n, cost, eco: rec.eco };
  }
  if (b.what === "mat") {
    const price = ecoBuyPrice(b.id); if (!price) return { ok: false, why: "交換できない 素材" };
    const cost = price * n; if (cost > ptsOf(rec)) return { ok: false, why: `エコポイントが 足りない：あと ${(cost - ptsOf(rec)).toLocaleString("ja-JP")}` };
    rec.eco = ptsOf(rec) - cost; putMats(rec, [{ id: b.id, q: 0, n, b: 1 }], now);   // b：買った 物（タスクの「派遣で 拾った 物だけ」に 数えない。自動の 安全確認の 指摘）
    return { ok: true, what: "mat", id: b.id, n, cost, eco: rec.eco };
  }
  return { ok: false, why: "交換する 物を えらんで" };
}
