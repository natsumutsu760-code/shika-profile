// モンスターの 配合と なかまの スキルポイント（鹿さんの決め、2026-10-25。決まりは docs/mono-link-haigou.md と lounge-proto/fusion.js・monster.js）
// tame.fuse：なかよしの なかま 2 体（Lv10 以上・♂ × ♀）から 子を 1 体。親は いなく なる（付けて いた 装備は 持ち物に のこる）
// tame.sp：なかまの スキルポイントを 手で 振る（振った 分は もどせない）・自動の 入り切り
import { candidates, skillOptions, makeChild, canFuse, SNACK_NEED, rankOf, spSplit, treesOf, TREE_FULL, SUB_MAX } from "./game.js";

const newUid = (rec, p) => p + (++rec.uidN).toString(36);
const full = (c) => c.gauge >= SNACK_NEED[rankOf(c)];
const away = (rec, uid) => rec.trips.some((t) => !t.done && t.party.includes(uid));

// 配合する。b：{ pa, pb：親の uid（a は やることの 名前なので 使わない）, child：子の 種族（候補から）, subs：受けつぐ サブスキル（2 つまで） }
// leave(uid)：たしかめが すんで、親が いなく なる 前に 呼ぶ（坑道で 掘って いた 分を 渡す など）
export function tameFuse(rec, b, R, leave = () => {}) {
  const A = rec.tamed.find((c) => c.uid === b.pa), B = rec.tamed.find((c) => c.uid === b.pb);
  const ok = canFuse(A, B, full); if (!ok.ok) return ok;
  if (away(rec, A.uid) || away(rec, B.uid)) return { ok: false, why: "出かけて いる 子は 配合できない（帰って から）" };
  const cand = candidates(A, B);
  if (!cand.some((x) => x.tree === b.child)) return { ok: false, why: "生まれる 子を 候補から えらんで" };
  const opts = skillOptions(A, B, b.child).map((o) => o.id), subs = Array.isArray(b.subs) ? [...new Set(b.subs)] : [];
  if (subs.length > SUB_MAX || subs.some((id) => !opts.includes(id))) return { ok: false, why: `受けつぐ スキルは 親の スキルから ${SUB_MAX} つまで` };
  const child = makeChild(A, B, b.child, subs, R, newUid(rec, "t"));
  if (!child) return { ok: false, why: "その 子は 生まれない" };
  const mined = [A.uid, B.uid].flatMap((u) => { const m = leave(u); return (m && m.got) || []; });
  const wasParty = rec.party.some((u) => u === A.uid || u === B.uid);
  rec.tamed = rec.tamed.filter((c) => c !== A && c !== B);
  rec.party = rec.party.filter((u) => u !== A.uid && u !== B.uid);
  rec.tamed.push(child);
  if (wasParty) rec.party.push(child.uid);   // 親が パーティに いたら、子が かわりに 入る
  return { ok: true, child, how: cand.find((x) => x.tree === b.child).how, ...(mined.length ? { mined } : {}) };
}

// スキルポイント。b：{ uid, auto?：true／false, add?：{ ツリー id：足す SP } }
// 自動を 切る ときは、いま 自動で 振って いる 分を 振った ことに する（もどせない ポイントは 自動でも 手でも 同じ）
export function tameSp(rec, b) {
  const c = rec.tamed.find((x) => x.uid === b.uid);
  if (!c) return { ok: false, why: "その 子は いない" };
  if (away(rec, c.uid)) return { ok: false, why: "出かけて いる あいだは 振れない（帰って から）" };
  if (typeof b.auto === "boolean" && b.auto !== (c.auto !== false)) {
    if (!b.auto) c.sp = { ...spSplit(c).sp };
    c.auto = b.auto;
  }
  if (b.add && typeof b.add === "object") {
    if (c.auto !== false) return { ok: false, why: "自動を 切ってから 手で 振る" };
    const ids = treesOf(c), now = spSplit(c);
    let free = now.free;
    const add = Object.entries(b.add).filter(([id, n]) => Number.isInteger(n) && n > 0);
    if (!add.length) return { ok: false, why: "振る ポイントを えらんで" };
    for (const [id, n] of add) {
      if (!ids.includes(id)) return { ok: false, why: "その ツリーは 持って いない" };
      if (n > free) return { ok: false, why: `ポイントが 足りない（のこり ${free}）` };
      if ((now.sp[id] || 0) + n > TREE_FULL) return { ok: false, why: `その ツリーは ${TREE_FULL} まで` };
      free -= n;
    }
    c.sp ||= {};
    for (const [id, n] of add) c.sp[id] = (c.sp[id] || 0) + n;
  }
  return { ok: true, sp: spSplit(c) };
}
