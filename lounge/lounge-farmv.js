// 新しい 農園（3D の 畑。鹿さんの 決め 2026-11-03：試しの 形で つなぐ。docs/mono-link-release-plan.md）。畑の 決まりは lounge-proto/farm-core.js
// 受付：farmv.plant {i, id, fert?}・farmv.harvest {i}・farmv.spr {i, kind?}・farmv.soil {soil}・farmv.skin {skin}。どれも はじめに 時間を 進めて、かけ合わせを 起こす
// 記録：rec.farmv = { field, known：図鑑に のった 作物の id, skin }・rec.seeds = { 作物の id: 数 }
//   種：「種から」の 作物は 派遣の 採取で 拾う（作物の 表の at）。生まれた 品種は 収穫で 種も とれる（どちらも 鹿さんの 決め）。植えると 1 こ へる
//   とれた 作物は 倉庫の 素材へ（派遣と 同じ putMats。入りきらない 分は あずかり箱）
//   肥料と スプリンクラーは 工房で 作って rec.items に 入る（前の 隠れ家の 畑は 2026-11-03 に 消して ここに まとめた。鹿さんの 決め）
//   土は CLR が 売る：かえる たびに 土の 値段（クレジット）を 払う
import { CROP, farmOpen } from "./crops.js";
import { newField, plant, harvest, advance, setSoil, addXp, XP, inField, FERT, SPRINKLERS, placeSpr, takeSpr, SOILS } from "./farm-core.js";
import { putMats } from "./lounge-game.js";

export const SEED_BACK = [1, 2];                 // 生まれた 品種を 収穫した ときに とれる 種（Claude の 仮）
export const FARM_SKINS = ["box", "greenhouse"];  // 畑の 見た目（lounge-proto/farm3d.js の SKINS と 同じ id。門番は three.js を 読まない）
const CLOSED = { ok: false, why: "農園は まだ 開いて いない" };

export function ensureFarmv(rec, now = Date.now()) {
  rec.farmv ||= { field: newField(now), known: [], skin: "box" };
  rec.seeds ||= {};
  return rec.farmv;
}
// 前に 進めた 時から now まで、1 時間ずつ かけ合わせを 進める
function tick(rec, now, R) { const F = ensureFarmv(rec, now); advance(F.field, now, R, new Set(F.known)); return F; }

export function farmvPlant(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), c = CROP[b && b.id];
  if (!c) return { ok: false, why: "その 種は ない" };
  if (!Number.isInteger(b.i) || !inField(F.field.lv, b.i)) return { ok: false, why: "そこには 植えられない" };
  if (c.kind === "seed" && F.field.lv < c.lv) return { ok: false, why: `農業 Lv${c.lv} から 植えられる` };
  if (!((rec.seeds[c.id] || 0) > 0)) return { ok: false, why: `${c.name}の 種が ない（${c.kind === "seed" ? "派遣の 採取で 拾う" : "生まれた 品種を 収穫すると とれる"}）` };
  const fert = b.fert == null || b.fert === "" ? null : b.fert;
  if (fert != null && !Object.prototype.hasOwnProperty.call(FERT, fert)) return { ok: false, why: "その 肥料は ない" };
  if (fert && !(((rec.items || {})[fert] || 0) > 0)) return { ok: false, why: "肥料が ない（工房で 作る）" };
  const r = plant(F.field, b.i, c.id, now, fert); if (!r.ok) return r;
  rec.seeds[c.id]--; if (!rec.seeds[c.id]) delete rec.seeds[c.id];
  if (fert) rec.items[fert]--;
  return { ok: true };
}

// スプリンクラー：kind が あれば 置く（持ち物から 1 こ）、なければ はずす（持ち物に もどす）
export function farmvSpr(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), i = b && b.i, kind = b && b.kind;
  if (!Number.isInteger(i) || !inField(F.field.lv, i)) return { ok: false, why: "その マスは ない" };
  rec.items ||= {};
  if (kind == null || kind === "") { const r = takeSpr(F.field, i); if (!r.ok) return r; rec.items[r.kind] = (rec.items[r.kind] || 0) + 1; return { ok: true, kind: r.kind }; }
  if (!Object.prototype.hasOwnProperty.call(SPRINKLERS, kind)) return { ok: false, why: "その スプリンクラーは ない" };
  if (!((rec.items[kind] || 0) > 0)) return { ok: false, why: "スプリンクラーが ない（工房で 作る）" };
  const r = placeSpr(F.field, i, kind); if (!r.ok) return r;
  rec.items[kind]--; return { ok: true, kind };
}

export function farmvHarvest(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R);
  if (!Number.isInteger(b && b.i) || !inField(F.field.lv, b.i)) return { ok: false, why: "その マスは ない" };
  const cell = F.field.cells[b.i], crop = cell && !cell.obj ? CROP[cell.id] : null;
  const r = harvest(F.field, b.i, now, R); if (!r.ok) return r;
  const items = (r.items || []).map(({ id, q, n }) => ({ id, q, n }));
  if (items.length) putMats(rec, items, now);
  let ups = addXp(F.field, r.xp || 0).length, isNew = false, seeds = 0;
  if (crop && items.length) {
    if (!F.known.includes(crop.id)) { F.known.push(crop.id); isNew = true; ups += addXp(F.field, XP.discover).length; }
    if (crop.kind !== "seed") { seeds = SEED_BACK[0] + Math.floor(R() * (SEED_BACK[1] - SEED_BACK[0] + 1)); rec.seeds[crop.id] = (rec.seeds[crop.id] || 0) + seeds; }
  }
  return { ok: true, items, color: r.color || null, left: r.left || 0, gone: r.gone || null, isNew, seeds, lv: F.field.lv, ups };
}

export function farmvSoil(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), soil = b && b.soil, s = Object.prototype.hasOwnProperty.call(SOILS, soil) ? SOILS[soil] : null;
  if (!s) return { ok: false, why: "その 土は ない" };
  if (soil === F.field.soil) return { ok: false, why: "いまの 土と 同じ" };
  if (s.price > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${s.price - (rec.credits || 0)}` };
  const r = setSoil(F.field, soil, now); if (!r.ok) return r;
  rec.credits = (rec.credits || 0) - s.price; return { ok: true, paid: s.price };
}

export function farmvSkin(rec, b, now) {
  if (!farmOpen()) return CLOSED;
  if (!FARM_SKINS.includes(b && b.skin)) return { ok: false, why: "その 見た目は ない" };
  ensureFarmv(rec, now).skin = b.skin; return { ok: true };
}

// 画面に 渡す 形（/api/me）。開いて いなければ null
export function farmvView(rec, now = Date.now(), R) {
  if (!farmOpen()) return null;
  const F = R ? tick(rec, now, R) : ensureFarmv(rec, now);
  const items = rec.items || {}, tools = {}; for (const k of [...Object.keys(FERT), ...Object.keys(SPRINKLERS)]) if (items[k] > 0) tools[k] = items[k];
  return { field: F.field, known: F.known, skin: F.skin, seeds: { ...rec.seeds }, tools };   // tools：肥料と スプリンクラーの 数
}
