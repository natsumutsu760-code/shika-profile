// ブランクコア（鹿さんの決め、2026-10-25）：装備から OP を 1 つ 抜き出す（core.take）・コアを 別の 装備に 付ける（core.set）
// 決まりの 中身は lounge-proto/equip.js の「ブランクコア」。ブランクコアは rec.items.blankcore（工房・ボス・ヨルの 店）、コアは rec.own.cores に { uid, op, star }
// 抜くと 装備は なくなる（付いて いた アタッチメントは のこって 付いて いない に もどる）。付けた OP の 強さは 抜いた 装備の ★の まま（it.opStar）
import { OPS, KINDS, baseOf, opCount, opStarOf, CORE_MAX } from "./game.js";
import { equippedUids } from "./lounge-pet.js";

const newUid = (rec, p) => p + (++rec.uidN).toString(36);
const kindOf = (it) => { const b = baseOf(it.base); return b && KINDS[b.slot] ? b.slot : "weapon"; };
// その 装備を 付けて いる 子が 出かけて いるか（出かけて いる あいだは 強さを かえない）
function wornAway(rec, uid) {
  const who = [...rec.pets, ...rec.tamed].filter((x) => x.equip && Object.values(x.equip).includes(uid)).map((x) => x.uid);
  return who.length > 0 && rec.trips.some((t) => !t.done && t.party.some((u) => who.includes(u)));
}

// 抜く。b：{ uid：装備, i：何番めの OP }
export function coreTake(rec, b) {
  rec.items ||= {}; rec.own.cores ||= [];
  if (!((rec.items.blankcore || 0) > 0)) return { ok: false, why: "ブランクコアを 持って いない（工房で 作る・ヨルの 店）" };
  const it = rec.own.equip.find((e) => e.uid === b.uid);
  if (!it) return { ok: false, why: "その 装備は ない" };
  if (equippedUids(rec).has(it.uid)) return { ok: false, why: "付けて いる 装備からは 抜けない（はずして から）" };
  if (!Number.isInteger(b.i) || b.i < 0 || b.i >= it.ops.length) return { ok: false, why: "抜く OP を えらんで" };
  if (rec.own.cores.length >= CORE_MAX) return { ok: false, why: `コアは ${CORE_MAX} こまで（付けて へらして から）` };
  const core = { uid: newUid(rec, "c"), op: it.ops[b.i], star: opStarOf(it, b.i) };
  rec.own.equip = rec.own.equip.filter((e) => e !== it);
  for (const a of rec.own.att || []) if (a.on === it.uid) a.on = null;
  rec.items.blankcore--; rec.own.cores.push(core);
  return { ok: true, core };
}

// 付ける。b：{ core：コアの uid, uid：装備, i：入れかえる OP（あいて いる 枠へ 付ける ときは なし） }
export function coreSet(rec, b) {
  rec.own.cores ||= [];
  const core = rec.own.cores.find((c) => c.uid === b.core), it = rec.own.equip.find((e) => e.uid === b.uid);
  if (!core) return { ok: false, why: "その コアは ない" };
  if (!it) return { ok: false, why: "その 装備は ない" };
  if (!OPS[core.op]) return { ok: false, why: "こわれた コア" };
  if (wornAway(rec, it.uid)) return { ok: false, why: "出かけて いる 子の 装備は かえられない（帰って から）" };
  const n = opCount(kindOf(it), it.star), op = core.op;
  const opStar = { ...(it.opStar || {}) };
  if (b.i == null) {
    if (it.ops.length >= n) return { ok: false, why: "OP の 枠が いっぱい（入れかえる OP を えらんで）" };
    if (it.ops.includes(op)) return { ok: false, why: `${OPS[op].label}は もう 付いて いる（入れかえなら できる）` };
    it.ops = [...it.ops, op]; opStar[it.ops.length - 1] = core.star;
  } else {
    if (!Number.isInteger(b.i) || b.i < 0 || b.i >= it.ops.length) return { ok: false, why: "入れかえる OP を えらんで" };
    if (it.ops.some((o, k) => o === op && k !== b.i)) return { ok: false, why: `${OPS[op].label}は もう 付いて いる（同じ OP と 入れかえて）` };
    it.ops = it.ops.map((o, k) => (k === b.i ? op : o)); opStar[b.i] = core.star;
  }
  for (const k of Object.keys(opStar)) if (opStar[k] === it.star || +k >= it.ops.length) delete opStar[k];   // 装備と 同じ ★なら しるしは いらない
  if (Object.keys(opStar).length) it.opStar = opStar; else delete it.opStar;
  rec.own.cores = rec.own.cores.filter((c) => c !== core);
  return { ok: true, uid: it.uid, op, star: core.star };
}
