// 大工事の あとの リセット（鹿さんの 決め、2026-11-03。docs/mono-link-release-plan.md）
// 門番を 公開した あと、1 人ずつの 箱（Viewer）は 次に 開いた とき、みんなの 箱（Market）は 次に 動いた ときに 1 回だけ 消す
// RESET_GEN を 1 つ 上げると、その 公開で リセットに なる。ふだんは 0（ほかの 直しの 公開で 消さない ため）
// 上げるのは リセットを 出す ときだけ。上げる 前に 鹿さんの OK を カードで もらい、写しを とる
export const RESET_GEN = 1;   // 2026-11-03 build 112 で 1（鹿さんの OK・カード「ぜんぶ 出す」）。次に 消す ときだけ 2 に

// 消す 物（カードの 決め）：ペットと 仲間・派遣・探索の 地図・装備・持ち物・栄養（ペットの 中）・施設と 素材・道具・クレジット・
//   商人の 好感度と タスク・闘技場の 記録・会った 敵の 記録。アメジストは オーバーレイの 帳簿の 側（overlay-obs.html）
// 残す 物：名前・ログイン・玉と アメジストの 帳簿の やりとり（ledger・ops）・部屋と 家具（room・own.furniture）・数の 番号（uidN）
const WIPE = ["pets", "tamed", "party", "trips", "loop", "explore", "seen", "met", "items", "snacks", "tools", "autoSell",
  "hideout", "lab", "mine", "smelt", "farm", "farmv", "seeds", "arena", "enc", "traders", "perks", "recipes", "tally", "au"];   // farmv・seeds：新しい 農園と 種
const WIPE_OWN = ["equip", "att", "cores", "mats", "box"];

// まだ 消して いない 記録か（Viewer は 消す 前に 写しを とる）
export const resetDue = (rec, gen = RESET_GEN) => !!rec && (rec.resetGen || 0) < gen;

// Viewer：古い 記録なら 消して true。届いた 知らせの 覚え（req.done）だけは 残す（同じ 知らせを 2 回 受けない ため）
export function resetOld(rec, gen = RESET_GEN) {
  if (!rec || (rec.resetGen || 0) >= gen) return false;
  for (const k of WIPE) delete rec[k];
  if (rec.own) for (const k of WIPE_OWN) delete rec.own[k];
  rec.credits = 0;
  const done = rec.req && Array.isArray(rec.req.done) ? rec.req.done : [];
  rec.req = { mine: null, wait: {}, out: [], done, n: 0 };
  rec.resetGen = gen;
  return true;
}

// Market：まだ 消して いなければ 消す。st は state.storage
//   開いて いる 依頼：預けた 玉だけ 持ち主に 返す（玉は リセットしない）。素材・装備・アメジストは 返さない
//   送る 箱（"o:"）：玉だけ 残す（素材・装備・クレジット・アメジストは 消す）
//   闘技場（"a:"）：名簿・守りの 記録・大会・出会いの 数を ぜんぶ 消す
// 消す・書きかえる 前の 物は "bak:" ＋ もとの 鍵で 残す（いちど 写したら 上書きしない）
export async function marketReset(st, gen = RESET_GEN) {
  if (((await st.get("resetGen")) || 0) >= gen) return false;
  const bak = async (k, v) => { if ((await st.get("bak:" + k)) === undefined) await st.put("bak:" + k, v); };
  for (const p of ["o:", "r:", "a:", "au:"]) for (const [k, v] of await st.list({ prefix: p })) await bak(k, v);
  for (const [k, m] of await st.list({ prefix: "o:" })) {
    const earn = (Array.isArray(m.earn) ? m.earn : []).filter((e) => e && e.kind === "balls" && e.d > 0);
    if (earn.length) await st.put(k, { to: m.to, mid: m.mid, earn, ...(m.why ? { why: m.why } : {}), ...(m.clear ? { clear: m.clear } : {}) });
    else await st.delete(k);
  }
  for (const [k, r] of await st.list({ prefix: "r:" })) {
    const balls = r && r.status === "open" && r.reward ? r.reward.balls || 0 : 0;
    if (balls > 0) await st.put("o:" + r.rid + ":reset", { to: r.by, mid: r.rid + ":reset", earn: [{ kind: "balls", d: balls }], why: "reset:" + r.rid, clear: r.rid });
    await st.delete(k);
  }
  for (const k of (await st.list({ prefix: "a:" })).keys()) await st.delete(k);
  for (const k of (await st.list({ prefix: "au:" })).keys()) await st.delete(k);   // 競り・フリマの 出品（品は 消す 決まりの 物。2026-11-07 から）
  await st.put("resetGen", gen);
  return true;
}
