// 玉と リソースの 帳簿（1 人分）。決まりは docs/mono-link-lounge-server.md の「玉と リソースの やりとり」（鹿さんの決め：ふだんは 門番・配信中は OBS）
// pending：配信して いない ときに ふえた・へった 分。品は もう 渡して ある。OBS に 届いたら（0 より 少なく なる 分は 0 で とめて）かならず 足す
// sent：OBS が 足した 分。OBS の 帳簿の 番号（seq）を 持つ。つぎに OBS が 上げる 記録の 番号（data.lg）が それ以上に なるまで 数に 入れる
//   OBS の PC の 時計と 門番の 時計は ずれるので、時刻では なく OBS の 番号で くらべる
// unknown：配信中に 返事が 来なかった 分。品は まだ 渡して いない。つぎに OBS に 届いた とき「足りれば 足す」で 送り、足せたら 品を 渡す（grant）
//   足せなかったら 先に 取った 素材などを もどす（refund）。いくつかの 数を いっしょに 払う とき（玉と リソース）は grp で まとめ、OBS は ぜんぶか なしで 足す
//   わかるまでは へった ことに して おく（多く 使えない ように）。同じ op は OBS が 2 回 足さない

export const emptyLedger = () => ({ pending: [], sent: [], unknown: [] });
const sum = (list, kind, f = () => true) => list.reduce((a, x) => a + (x.kind === kind && f(x) ? x.d : 0), 0);

// いまの 数。wallet は 門番が KV の data から 作った 物（{ balls, res, lg, known }）。わからない 人は null
export function balanceOf(L, wallet, kind) {
  if (!wallet || !wallet.known) return null;
  const base = kind === "balls" ? wallet.balls : wallet.res;
  return base + sum(L.pending, kind) + sum(L.sent, kind, (x) => x.seq > (wallet.lg || 0)) + sum(L.unknown, kind, (x) => x.d < 0);
}
// 新しい 記録が 上がったら、もう 入って いる sent を 消す
export function trimSent(L, wallet) { if (wallet && wallet.known) L.sent = L.sent.filter((x) => x.seq > (wallet.lg || 0)); }

// OBS に 送る 分（pending は かならず 足す・unknown は 足りれば 足す）。pending を 先に
export const toObs = (L) => [...L.pending.map((x) => ({ op: x.op, kind: x.kind, d: x.d })), ...L.unknown.map((x) => ({ op: x.op, kind: x.kind, d: x.d, need: 1, ...(x.grp ? { grp: x.grp } : {}) }))];

// OBS の 返事（res：[{ op, ok, seq, why }]）を 帳簿に 入れる。give は 物を 渡す 関数。のこりの 数を 返す
// pending が ok で なかった（OBS が その 人を まだ 知らない）ときは のこして つぎに また 送る
// unknown は ok で なければ 払えなかった ことに して refund を もどす。ただし もらう 分（d が プラス）で OBS が その 人を 知らない ときは のこす（ごほうびを なくさない）
export function settle(L, res, give) {
  for (const r of res || []) {
    if (!r || typeof r.op !== "string") continue;
    const p = L.pending.find((x) => x.op === r.op);
    if (p && r.ok) { L.pending = L.pending.filter((x) => x !== p); L.sent.push({ op: p.op, kind: p.kind, d: p.d, seq: +r.seq || 0 }); continue; }
    const u = L.unknown.find((x) => x.op === r.op);
    if (!u || (!r.ok && u.d > 0 && r.why === "id")) continue;
    L.unknown = L.unknown.filter((x) => x !== u);
    if (r.ok) { give(u.grant); L.sent.push({ op: u.op, kind: u.kind, d: u.d, seq: +r.seq || 0 }); } else give(u.refund);
  }
  return L.pending.length + L.unknown.length;
}
