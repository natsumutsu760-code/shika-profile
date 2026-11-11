// 新しい 農園（3D の 畑。鹿さんの 決め 2026-11-03：試しの 形で つなぐ。docs/mono-link-release-plan.md）。畑の 決まりは lounge-proto/farm-core.js
// 受付：farmv.plant {i, id, fert?}・farmv.harvest {i}・farmv.harvestAll {}・farmv.preset {slot, cells}・farmv.plantPreset {slot, fert?}・farmv.spr {i, kind?}・farmv.soil {soil}・farmv.grow {h, max}・farmv.skin {skin}。どれも はじめに 時間を 進めて、かけ合わせを 起こす
// 記録：rec.farmv = { field, known：図鑑に のった 作物の id, skin }・rec.seeds = { 作物の id: 数 }
//   種：「種から」の 作物は 派遣の 採取で 拾う（作物の 表の at）。生まれた 品種は 収穫で 種も とれる（どちらも 鹿さんの 決め）。植えると 1 こ へる
//   とれた 作物は 倉庫の 素材へ（派遣と 同じ putMats。入りきらない 分は あずかり箱）
//   肥料と スプリンクラーは 工房で 作って rec.items に 入る（前の 隠れ家の 畑は 2026-11-03 に 消して ここに まとめた。鹿さんの 決め）
//   土は CLR が 売る：かえる たびに 土の 値段（クレジット）を 払う
import { CROP, farmOpen } from "./crops.js";
import { newField, plant, harvest, advance, setSoil, addXp, XP, inField, FERT, SPRINKLERS, placeSpr, takeSpr, SOILS, stageAt, W, GROW_H, growPrice, growApply } from "./farm-core.js";
import { sellPrice } from "./materials.js";
import { putMats } from "./lounge-game.js";
import { sale } from "./lounge-stock.js";
import { growMs } from "./farm-core.js";
import { fxOf } from "./lounge-furn.js";   // 部屋の 家具の 効果（2026-11-11。./furn-fx.js）


export const SEED_BACK = [1, 2];                 // 生まれた 品種を 収穫した ときに とれる 種（Claude の 仮）
export const FARM_SKINS = ["box", "greenhouse"];  // 畑の 見た目（lounge-proto/farm3d.js の SKINS と 同じ id。門番は three.js を 読まない）
const CLOSED = { ok: false, why: "農園は まだ 開いて いない" };

export function ensureFarmv(rec, now = Date.now()) {
  rec.farmv ||= { field: newField(now), known: [], skin: "box" };
  rec.seeds ||= {};
  return rec.farmv;
}
// 前に 進めた 時から now まで、1 時間ずつ かけ合わせを 進める
function tick(rec, now, R) { const F = ensureFarmv(rec, now), cr = fxOf(rec, "cross"), co = fxOf(rec, "color"); if (cr || co) F.field.fx = { cross: cr, color: co }; else delete F.field.fx; advance(F.field, now, R, new Set(F.known)); return F; }   // fx：家具（鉢植え・じょうろ・ネオン）

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
  { const cf = fxOf(rec, "crop"), cell = F.field.cells[b.i]; if (cf > 0 && cell) cell.at -= Math.round(growMs(c, F.field.soil, cell.fert) * cf); }   // 家具（コーヒーメーカー・観葉植物）：育つ 時間が 少し 短い
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
  const cell = F.field.cells[b.i], was = cell && !cell.obj ? CROP[cell.id] : null;
  const r = harvest(F.field, b.i, now, R); if (!r.ok) return r;
  const items = (r.items || []).map(({ id, q, n }) => ({ id, q, n }));
  const crop = was && items.some((x) => x.id === was.mat) ? was : null;   // 放っておいて かわった 物（街道麦 → 麦わら）は その 作物の 収穫に 数えない（図鑑・種なし）
  if (items.length) putMats(rec, items, now);
  let ups = addXp(F.field, r.xp || 0).length, isNew = false, seeds = 0;
  if (crop && items.length) {
    if (!F.known.includes(crop.id)) { F.known.push(crop.id); isNew = true; ups += addXp(F.field, XP.discover).length; }
    if (crop.kind !== "seed") { seeds = SEED_BACK[0] + Math.floor(R() * (SEED_BACK[1] - SEED_BACK[0] + 1)); rec.seeds[crop.id] = (rec.seeds[crop.id] || 0) + seeds; }
  }
  return { ok: true, items, color: r.color || null, left: r.left || 0, gone: r.gone || null, isNew, seeds, lv: F.field.lv, ups, ...(crop ? { crop: crop.id } : {}) };
}

// まとめて とる（鹿さんの 頼み、2026-11-05「農園でまとめて収穫できるようにして欲しい」。2 回目「農園で一括で収穫できるように」→ カード「ぜんぶ」）
// 実った 作物・かわった 物（たたく 回数 ぶん まとめて）・放っておいた 物（かわる 物は かわってから とる・枯れた／逃げた 物は 片づける）。
// スプリンクラーと まだ 実って いない 物は そのまま。1 マスずつの「とる」（farmvHarvest）と 同じ 決まりで 順に とる
export function farmvHarvestAll(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), f = F.field;
  const idx = f.cells.map((c, i) => (takeable(f, c, i, now) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return { ok: false, why: "とれる 物が ない" };
  const got = [], news = []; let seeds = 0, ups = 0, cleared = 0;
  for (const i of idx) {
    for (let k = 0; k < 50 && f.cells[i]; k++) {   // かわった 物は たたく 回数 ぶん くり返す
      const r = farmvHarvest(rec, { i }, now, R); if (!r.ok) break;
      if (r.gone) { cleared++; break; }
      if (!r.items.length) continue;
      got.push({ i, crop: r.crop || null, mat: r.crop ? null : r.items[0].id, color: r.color, n: r.items.reduce((a, x) => a + x.n, 0) });
      seeds += r.seeds; ups += r.ups; if (r.isNew) news.push(r.crop);
    }
  }
  return { ok: true, got, n: got.reduce((a, x) => a + x.n, 0), seeds, ups, news, cleared, lv: f.lv };
}
// とれる マス（画面の「まとめて とる N」と 同じ 数え方）
export const takeable = (f, c, i, now) => !!c && !c.spr && inField(f.lv, i) && (!!c.obj || (!!CROP[c.id] && ["ripe", "over"].includes(stageAt(c, now, f.soil).stage)));

// プリセット（鹿さんの 頼み、2026-11-05「プリセットを組んで植える機能を追加してください」→ カード「A 塗って組む」）
// 3 つまで。cells は マスの 番号 → 作物の id。種が なくても 組める（かけ合わせの 並びを 先に 組む）。空に すると 消える
export const PRESET_MAX = 3;
export function farmvPreset(rec, b, now) {
  if (!farmOpen()) return CLOSED;
  const F = ensureFarmv(rec, now), slot = b && b.slot, src = b && b.cells;
  if (!Number.isInteger(slot) || slot < 0 || slot >= PRESET_MAX) return { ok: false, why: "その プリセットは ない" };
  if (!src || typeof src !== "object" || Array.isArray(src)) return { ok: false, why: "こわれた プリセット" };
  const cells = {};
  for (const [k, id] of Object.entries(src)) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= W * W || typeof id !== "string" || !Object.prototype.hasOwnProperty.call(CROP, id)) return { ok: false, why: "こわれた プリセット" };
    cells[i] = id;
  }
  F.presets = Array.from({ length: PRESET_MAX }, (_, k) => (F.presets || [])[k] || null);
  F.presets[slot] = Object.keys(cells).length ? { cells } : null;
  return { ok: true };
}
// プリセットで 植える：あいて いる マスだけ。種が 足りない・農業の Lv が 足りない マスは とばして 知らせる。肥料は えらべば ある 分だけ まく
export function farmvPlantPreset(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), slot = b && b.slot, p = Number.isInteger(slot) ? (F.presets || [])[slot] : null;
  if (!p) return { ok: false, why: "その プリセットは 空" };
  const fert = b.fert == null || b.fert === "" ? null : b.fert;
  if (fert != null && !Object.prototype.hasOwnProperty.call(FERT, fert)) return { ok: false, why: "その 肥料は ない" };
  let planted = 0, busy = 0, fed = 0; const short = {}, lvNeed = {};
  for (const [k, id] of Object.entries(p.cells)) {
    const i = Number(k), c = CROP[id];
    if (!c || !inField(F.field.lv, i)) continue;   // まだ 使えない マス（畑が 広がったら 植わる）
    if (F.field.cells[i]) { busy++; continue; }
    if (c.kind === "seed" && F.field.lv < c.lv) { lvNeed[id] = c.lv; continue; }
    if (!((rec.seeds[id] || 0) > 0)) { short[id] = (short[id] || 0) + 1; continue; }
    const useF = fert && ((rec.items || {})[fert] || 0) > 0 ? fert : null;
    const r = farmvPlant(rec, { i, id, ...(useF ? { fert: useF } : {}) }, now, R);
    if (r.ok) { planted++; if (useF) fed++; }
  }
  const why = Object.keys(short).length ? `種が 足りない：${Object.entries(short).slice(0, 2).map(([id, n]) => `${CROP[id].name} あと ${n}`).join("・")}` : Object.keys(lvNeed).length ? `農業 Lv${Math.min(...Object.values(lvNeed))} から 植えられる 種が ある` : busy ? "あいて いる マスが ない" : "植えられる マスが ない";
  if (!planted) return { ok: false, why, short, lvNeed, busy };
  return { ok: true, planted, fed, short, lvNeed, busy };
}

export function farmvSoil(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), soil = b && b.soil, s = Object.prototype.hasOwnProperty.call(SOILS, soil) ? SOILS[soil] : null;
  if (!s) return { ok: false, why: "その 土は ない" };
  if (soil === F.field.soil) return { ok: false, why: "いまの 土と 同じ" };
  if (s.price > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${s.price - (rec.credits || 0)}` };
  const r = setSoil(F.field, soil, now); if (!r.ok) return r;
  rec.credits = (rec.credits || 0) - s.price; sale(rec, "CLR", s.price); return { ok: true, paid: s.price };   // 土は クロロシス・バイオテック（株）
}

// 時間の 肥料（2026-11-08 鹿さん「クレジットで買える植えた全作物を成長させる肥料を実装してください。」。決まりは farm-core.js の growPlan）
// h：1・3・5・10 時間。max：画面が 見せた 値段（時間が たつと 値段が かわるので、それより 高く なって いたら 払わずに 断る）。CLR が 売る（土と 同じ）
export function farmvGrow(rec, b, now, R) {
  if (!farmOpen()) return CLOSED;
  const F = tick(rec, now, R), h = b && b.h;
  if (!GROW_H.includes(h)) return { ok: false, why: "その 肥料は ない" };
  const price = growPrice(F.field, now, h, sellPrice);
  if (!price) return { ok: false, why: "育って いる 作物が ない" };
  if (b.max != null && price > b.max) return { ok: false, why: `値段が かわった：いま ${price.toLocaleString()} クレジット`, price };
  if (price > (rec.credits || 0)) return { ok: false, why: `クレジットが 足りない：あと ${(price - (rec.credits || 0)).toLocaleString()}`, price };
  const plan = growApply(F.field, now, h);
  rec.credits = (rec.credits || 0) - price; sale(rec, "CLR", price);   // クロロシス・バイオテック（株）
  return { ok: true, paid: price, h, n: plan.length, ripe: plan.filter((p) => p.ripe).length };
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
  return { field: F.field, known: F.known, skin: F.skin, seeds: { ...rec.seeds }, tools, presets: Array.from({ length: PRESET_MAX }, (_, k) => (F.presets || [])[k] || null) };   // tools：肥料と スプリンクラーの 数
}
