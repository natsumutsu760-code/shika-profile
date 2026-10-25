// 地下の 隠れ家（鹿さんの決め、2026-10-22）。ななめ見下ろしの 1 部屋、うす暗い 秘密基地（ランプ・ネオン・画面が 光る）
// makeHideout(lv) が THREE.Group を返す。lv は { bench: 0〜3, ... }。施設の Lv で 見た目が かわる（Lv0 は 箱と 設計図だけの 空き地）
// ラウンジと 同じ ローポリ（箱と 筒の 組み合わせ）。1 マス ＝ 1。部屋は 12 × 10。地下の 拡張（lv.dig）で 奥の かべの 向こうへ 6・12・18 マス 広がる
import * as THREE from "three";

const M = {}, mat = (c, o = {}) => (M[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, flatShading: true, ...o }));
const glow = (c, k = 1.6) => mat(c, { emissive: c, emissiveIntensity: k, roughness: 0.4 });
function box(p, w, h, d, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? mat(c) : c); m.position.set(x, y + h / 2, z); p.add(m); return m; }
function cyl(p, rt, rb, h, c, x = 0, y = 0, z = 0, seg = 8) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof c === "string" ? mat(c) : c); m.position.set(x, y + h / 2, z); p.add(m); return m; }
function ball(p, r, c, x = 0, y = 0, z = 0, seg = 8) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), typeof c === "string" ? mat(c) : c); m.position.set(x, y, z); p.add(m); return m; }
// 横に ねかせた 棒（まんなかを x,y,z に 置く）。axis は "x" か "z"
function rod(p, r, len, c, x, y, z, axis = "x", seg = 8) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), typeof c === "string" ? mat(c) : c); m.position.set(x, y, z); if (axis === "x") m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; p.add(m); return m; }
function lamp(p, c, k, x, y, z, dist = 4) { const L = new THREE.PointLight(c, k, dist, 1.6); L.position.set(x, y, z); p.add(L); return L; }

// Lv0：床の テープの わく・段ボール・まるめた 設計図（ここに 作れる）
function empty(g, w = 2.2, d = 1.2) {
  const tape = mat("#E8B23A", { roughness: 0.5 });
  [[w, 0.06, 0, -d / 2], [w, 0.06, 0, d / 2], [0.06, d, -w / 2, 0], [0.06, d, w / 2, 0]].forEach(([a, b, x, z]) => box(g, a, 0.02, b, tape, x, 0, z));
  box(g, 0.6, 0.45, 0.5, "#B98A55", -0.5, 0, 0.1).rotation.y = 0.2; box(g, 0.45, 0.35, 0.4, "#A97A48", -0.45, 0.45, 0.1).rotation.y = -0.1;
  rod(g, 0.07, 0.8, "#3E7BE6", 0.45, 0.07, 0.2);
}
const legs = (g, w, d, h, c) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => box(g, 0.08, h, 0.08, c, (i * (w - 0.12)) / 2, 0, (j * (d - 0.12)) / 2));

// ---------- 施設（正面は +z。lv ごとに 道具が ふえる） ----------
const ST = {
  bench(g, lv, fx) {   // 作業台：つくえ・万力 → 道具の 板 → ランプと 光る 線
    if (!lv) return empty(g);
    const top = lv >= 2 ? "#8E96AC" : "#B07A45";
    legs(g, 2.2, 1, 0.9, "#5B4636"); box(g, 2.2, 0.12, 1, top, 0, 0.9, 0);
    box(g, 0.3, 0.2, 0.25, "#6A7088", -0.8, 1.02, 0.25); box(g, 0.5, 0.05, 0.08, "#C9CED8", 0.3, 1.02, 0.2).rotation.y = 0.4;
    if (lv >= 2) { box(g, 2.1, 1.1, 0.06, "#C9A06A", 0, 1.35, -0.47); [["#E8393C", -0.6], ["#2EA8FF", -0.1], ["#FFC21A", 0.4], ["#22CC88", 0.8]].forEach(([c, x]) => box(g, 0.08, 0.45, 0.04, c, x, 1.6, -0.42)); box(g, 0.7, 0.55, 0.7, "#5E6680", 0.65, 0, 0); }
    if (lv >= 3) { cyl(g, 0.03, 0.03, 0.7, "#3A3550", -0.95, 1.02, -0.3); const b = ball(g, 0.1, glow("#FFD38A", 2.2), -0.7, 1.75, -0.15); b.scale.set(1.3, 0.7, 1.3); box(g, 2.2, 0.03, 0.03, glow("#FFB547", 2.5), 0, 0.88, 0.51); fx.push({ glow: b }); }
    lamp(g, "#FFB561", [0, 0.6, 1.2, 1.9][lv], 0, 2.2, 0.8);
  },
  lab(g, lv, fx) {   // 研究所：フラスコ → 画面と たな → 光る 液の 筒
    if (!lv) return empty(g);
    legs(g, 2, 0.9, 0.85, "#3E3A55"); box(g, 2, 0.1, 0.9, "#D9DCEB", 0, 0.85, 0);
    [["#B57BFF", -0.6], ["#4BE0A0", -0.35], ["#FF7AC8", -0.1]].forEach(([c, x]) => { cyl(g, 0.11, 0.13, 0.22, mat("#E8F0FF", { transparent: true, opacity: 0.55 }), x, 0.95, 0.15); cyl(g, 0.1, 0.11, 0.12, glow(c, 1.4), x, 0.95, 0.15); });
    if (lv >= 2) { box(g, 0.7, 0.45, 0.08, "#24203A", 0.5, 1.1, -0.25); box(g, 0.6, 0.36, 0.02, glow("#8E6CFF", 1.8), 0.5, 1.145, -0.2); box(g, 1.8, 0.06, 0.35, "#4A4466", 0, 1.7, -0.3); [-0.6, -0.2, 0.2, 0.6].forEach((x) => cyl(g, 0.08, 0.08, 0.22, mat("#C9B8FF", { transparent: true, opacity: 0.7 }), x, 1.76, -0.3)); }
    if (lv >= 3) { const tube = new THREE.Group(); tube.position.set(1.35, 0, 0.1); g.add(tube); cyl(tube, 0.32, 0.36, 0.2, "#3A3550"); cyl(tube, 0.3, 0.3, 1.6, mat("#CDE8FF", { transparent: true, opacity: 0.3 }), 0, 0.2); const liq = cyl(tube, 0.26, 0.26, 1.3, glow("#7CF2C2", 1.2), 0, 0.25); cyl(tube, 0.32, 0.32, 0.15, "#3A3550", 0, 1.8); fx.push({ bob: liq }); lamp(g, "#7CF2C2", 1.4, 1.35, 1.2, 0.6, 3); }
    lamp(g, "#C9A8FF", [0, 0.7, 1.1, 1.3][lv], 0, 2.1, 0.8);
  },
  snack(g, lv, fx) {   // おやつ工房：台と オーブン → ミキサーと クッキー → クッキーの ネオン
    if (!lv) return empty(g);
    box(g, 2.2, 0.9, 0.9, "#E9D9C2", 0, 0, 0); box(g, 2.25, 0.08, 0.95, "#C98A3A", 0, 0.9, 0);
    box(g, 0.8, 0.7, 0.7, "#7A5A44", -0.55, 0.98, -0.05); box(g, 0.5, 0.32, 0.02, glow("#FF9B3D", 1.6), -0.55, 1.12, 0.31);
    cyl(g, 0.15, 0.15, 0.28, mat("#F6F0E6", { transparent: true, opacity: 0.7 }), 0.55, 0.98, 0.1); cyl(g, 0.16, 0.16, 0.05, "#C98A3A", 0.55, 1.26, 0.1);
    if (lv >= 2) { box(g, 0.25, 0.5, 0.3, "#FF6F8E", 0.15, 0.98, -0.15); box(g, 0.6, 0.03, 0.4, "#9AA3B8", 0.6, 1.3, -0.2); [-0.15, 0, 0.15].forEach((x) => cyl(g, 0.06, 0.06, 0.03, "#B97A3E", 0.6 + x, 1.33, -0.2, 10)); }
    if (lv >= 3) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 20), glow("#FFB04A", 2.4)); s.position.set(0, 2, -0.45); g.add(s); [[-0.1, 0.1], [0.12, 0.05], [0, -0.13]].forEach(([x, y]) => ball(g, 0.04, glow("#FF7A3A", 2.4), x, 2 + y, -0.43, 6)); fx.push({ flicker: s }); lamp(g, "#FFB04A", 1.2, 0, 2, 0.4, 3); }
    lamp(g, "#FFC58A", [0, 0.6, 1, 1.2][lv], 0, 2.1, 0.8);
  },
  maproom(g, lv, fx) {   // 地図室：地図の つくえ → かべの 板と ピン → 光る 地球儀
    if (!lv) return empty(g);
    legs(g, 1.8, 1.2, 0.8, "#4A3A2E"); box(g, 1.8, 0.1, 1.2, "#6B4F3A", 0, 0.8, 0);
    box(g, 1.6, 0.02, 1.0, "#3E9E6E", 0, 0.9, 0); [[-0.4, -0.2, 0.5, 0.3], [0.3, 0.15, 0.6, 0.35], [0.1, -0.25, 0.3, 0.2]].forEach(([x, z, w, d]) => box(g, w, 0.025, d, "#7FD39A", x, 0.9, z));
    cyl(g, 0.22, 0.22, 0.5, "#5B4636", 0.95, 0, 0.6);
    if (lv >= 2) { box(g, 1.8, 1, 0.06, "#C9A06A", 0, 1.3, -0.62); [[-0.5, 1.6], [0.2, 1.9], [0.6, 1.5], [-0.1, 1.45]].forEach(([x, y]) => ball(g, 0.04, "#E8393C", x, y, -0.57, 6)); }
    if (lv >= 3) { const gl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), glow("#46D4FF", 1.6)); gl.material = gl.material.clone(); gl.material.wireframe = true; gl.position.set(0, 1.45, 0); g.add(gl); cyl(g, 0.12, 0.16, 0.08, glow("#46D4FF", 1.2), 0, 0.92, 0); fx.push({ spin: gl }); lamp(g, "#46D4FF", 1.5, 0, 1.6, 0.4, 3); }
    lamp(g, "#BFF2C8", [0, 0.6, 1, 1.1][lv], 0, 2.1, 0.8);
  },
  medic(g, lv, fx) {   // 救護室：ベッドと 赤い 十字 → 薬の たなと 点滴 → 心ぞうの 画面
    if (!lv) return empty(g);
    legs(g, 2, 0.9, 0.45, "#9AA3B8"); box(g, 2, 0.1, 0.9, "#C9CED8", 0, 0.45, 0); box(g, 1.9, 0.15, 0.85, "#F4F6FB", 0, 0.55, 0); box(g, 0.45, 0.12, 0.6, "#DCE6FF", -0.7, 0.7, 0);
    box(g, 0.5, 0.15, 0.04, glow("#FF5A64", 1.2), 0, 1.6, -0.45); box(g, 0.15, 0.5, 0.04, glow("#FF5A64", 1.2), 0, 1.43, -0.45);
    if (lv >= 2) { box(g, 0.7, 1.2, 0.4, "#F4F6FB", 1.35, 0, -0.2); box(g, 0.2, 0.06, 0.02, "#FF5A64", 1.35, 0.85, 0.01); box(g, 0.06, 0.2, 0.02, "#FF5A64", 1.35, 0.78, 0.01); cyl(g, 0.02, 0.02, 1.7, "#9AA3B8", -1.25, 0, 0.3); box(g, 0.18, 0.25, 0.08, mat("#BFE8FF", { transparent: true, opacity: 0.7 }), -1.25, 1.45, 0.3); }
    if (lv >= 3) { box(g, 0.55, 0.4, 0.3, "#24203A", 1.35, 1.2, -0.15); const sc = box(g, 0.45, 0.28, 0.02, glow("#4BE07A", 1.8), 1.35, 1.26, 0.01); fx.push({ flicker: sc }); lamp(g, "#7CF2A0", 1, 1.3, 1.6, 0.4, 3); }
    lamp(g, "#FFE0E0", [0, 0.6, 0.9, 1.1][lv], 0, 2.1, 0.8);
  },
  gym(g, lv, fx) {   // トレーニング室：マットと ダンベル → ランニングマシン → サンドバッグと ネオン
    if (!lv) return empty(g);
    box(g, 2, 0.05, 1.3, "#2E6FD9", 0, 0, 0);
    [-0.5, -0.1].forEach((z) => { rod(g, 0.03, 0.5, "#9AA3B8", -0.4, 0.12, z + 0.5); [-0.2, 0.2].forEach((d) => rod(g, 0.09, 0.08, "#2A2533", -0.4 + d, 0.12, z + 0.5)); });
    if (lv >= 2) { box(g, 0.7, 0.2, 1.3, "#3A3550", 0.6, 0.05, -0.05); box(g, 0.6, 0.04, 1.1, "#1E1A2A", 0.6, 0.25, -0.05); [-0.25, 0.25].forEach((x) => box(g, 0.05, 0.9, 0.05, "#9AA3B8", 0.6 + x, 0.25, -0.55)); box(g, 0.6, 0.08, 0.2, glow("#2EA8FF", 1.2), 0.6, 1.1, -0.55); }
    if (lv >= 3) { cyl(g, 0.02, 0.02, 0.6, "#5A5470", -0.6, 2.2, -0.3); const bag = cyl(g, 0.2, 0.2, 0.8, "#D9443C", -0.6, 1.3, -0.3, 10); fx.push({ swing: bag }); [[0, 0.25, 0.3], [0.12, 0.05, 0.25]].forEach(([x, y, l]) => box(g, 0.05, l, 0.03, glow("#46D4FF", 2.4), 0.4 + x, 1.7 + y, -0.6).rotation.z = 0.5); lamp(g, "#46B4FF", 1.2, 0, 1.8, 0.2, 3); }
    lamp(g, "#BFDFFF", [0, 0.6, 0.9, 1.1][lv], 0, 2.1, 0.8);
  },
  storage(g, lv, fx) {   // 倉庫：たなが ふえる（Lv1 1 つ・Lv2 2 つ・Lv3 3 つと 光る ふだ）
    if (!lv) return empty(g, 2.6, 1.2);
    const racks = lv, crate = ["#B98A55", "#7A8299", "#3E7BE6", "#22CC88", "#E8B23A"];
    for (let r = 0; r < racks; r++) {
      const x = (r - (racks - 1) / 2) * 1.05, R = new THREE.Group(); R.position.set(x, 0, 0); g.add(R);
      [-1, 1].forEach((i) => box(R, 0.06, 2, 0.06, "#5E6680", i * 0.45, 0, -0.25)); [-1, 1].forEach((i) => box(R, 0.06, 2, 0.06, "#5E6680", i * 0.45, 0, 0.25));
      [0.1, 0.75, 1.4].forEach((y, k) => { box(R, 0.96, 0.05, 0.56, "#7A8299", 0, y, 0); box(R, 0.35, 0.3, 0.35, crate[(r * 3 + k) % crate.length], -0.2, y + 0.05, 0); if ((r + k) % 2 === 0) box(R, 0.3, 0.25, 0.3, crate[(r * 3 + k + 2) % crate.length], 0.22, y + 0.05, 0.02); });
      if (lv >= 3) box(R, 0.5, 0.06, 0.02, glow("#FFC21A", 1.8), 0, 1.95, 0.29);
    }
    lamp(g, "#E6ECFF", [0, 0.6, 0.9, 1.1][lv], 0, 2.4, 1);
  },
  workshop(g, lv, fx) {   // 工房：つくえと 歯車の 板・部品の 箱 → ボール盤と 火花 → 光る 3D プリンター（鹿さんの頼み、2026-10-25）
    if (!lv) return empty(g);
    legs(g, 2.2, 1, 0.9, "#4A3A2E"); box(g, 2.2, 0.12, 1, "#8A6A4A", 0, 0.9, 0);
    box(g, 2.1, 1.05, 0.06, "#4B4560", 0, 1.25, -0.47);   // かべの 板
    [[-0.65, 0.2, "#E0662E"], [-0.15, 0.14, "#C9CED8"], [0.4, 0.18, "#FFB547"]].forEach(([x, r, c], i) => { const m = cyl(g, r, r, 0.05, c, x, 1.65, -0.42, 10); m.rotation.x = Math.PI / 2; m.position.y = 1.7 - (i % 2) * 0.25; if (lv >= 2) fx.push({ gear: m, s: i % 2 ? -1 : 1 }); });
    [["#E0662E", -0.75], ["#2EA8FF", -0.45], ["#22CC88", -0.15]].forEach(([c, x]) => box(g, 0.24, 0.12, 0.3, c, x, 1.02, 0.15));   // 部品の 箱
    box(g, 0.25, 0.18, 0.22, "#6A7088", 0.75, 1.02, 0.2);   // 万力
    if (lv >= 2) {   // ボール盤：柱と 頭、下で 火花
      const D = new THREE.Group(); D.position.set(1.45, 0, -0.1); g.add(D);
      box(D, 0.5, 0.08, 0.5, "#3E4658"); cyl(D, 0.05, 0.05, 1.6, "#9AA3B8", 0, 0.08, -0.12); box(D, 0.32, 0.3, 0.42, "#E0662E", 0, 1.35, 0); cyl(D, 0.02, 0.02, 0.3, "#C9CED8", 0, 1.05, 0.08);
      const sp = ball(D, 0.06, glow("#FFD38A", 2.5), 0, 0.95, 0.08, 6); fx.push({ flicker: sp });
    }
    if (lv >= 3) {   // 3D プリンター：わくと 光る ノズル
      const P = new THREE.Group(); P.position.set(-0.6, 0.96, -0.1); g.add(P);
      [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]].forEach(([x, z]) => box(P, 0.04, 0.7, 0.04, "#2B3040", x, 0, z)); box(P, 0.58, 0.04, 0.48, "#2B3040", 0, 0.7, 0);
      const nz = box(P, 0.1, 0.1, 0.1, glow("#FF8A3D", 2.2), 0, 0.45, 0); box(P, 0.24, 0.12, 0.24, glow("#FFB547", 0.8), 0, 0.02, 0); fx.push({ bob: nz });
    }
    lamp(g, "#FFB561", [0, 0.7, 1.1, 1.6][lv], 0, 2.2, 0.8);
  },
};

// 置き場所：左の かべ（作業台・おやつ工房）、奥の かべ（研究所・地図室・救護室）、右（トレーニング室・倉庫）。はしごは 手前
export const SPOTS = {
  bench: { x: 0.9, z: 3.2, r: Math.PI / 2 }, snack: { x: 0.9, z: 7.2, r: Math.PI / 2 },
  lab: { x: 3.3, z: 0.9, r: 0 }, maproom: { x: 6.6, z: 1, r: 0 }, medic: { x: 9.9, z: 0.9, r: 0 },
  gym: { x: 10.3, z: 4.6, r: 0 }, storage: { x: 9.8, z: 8.2, r: 0 },
  workshop: { x: 0.9, z: -3, r: Math.PI / 2, dig: 1 },   // dig：その 場所が 掘れる 地下の 拡張の Lv（奥の かべの 向こう）
};
export const ROOM = { w: 12, d: 10, h: 3.4 };
// 地下の 拡張（鹿さんの決め、2026-10-25：いまの 部屋を 奥へ 広げる）。奥の かべ（z = 0）の 向こうへ Lv ごとに 6 マス
export const EXT = [0, 6, 12, 18];
export const DOOR = { x0: 4.4, x1: 5.5 };   // いまの 部屋から 奥への 入口（研究所と 地図室の あいだ）
export const areaOf = (dig = 0) => ({ x0: 0, x1: ROOM.w, z0: -EXT[Math.max(0, Math.min(3, dig))], z1: ROOM.d });

export function makeHideout(lv) {
  const g = new THREE.Group(), fx = [], dig = Math.max(0, Math.min(3, lv.dig || 0)), ext = EXT[dig];
  // ゆか（タイルの すじ）・かべ・はば木・パイプ
  box(g, ROOM.w, 0.2, ROOM.d, "#2B2838", ROOM.w / 2, -0.2, ROOM.d / 2);
  const lines = []; for (let i = 1; i < ROOM.w; i++) lines.push(i, 0.005, 0, i, 0.005, ROOM.d); for (let j = 1; j < ROOM.d; j++) lines.push(0, 0.005, j, ROOM.w, 0.005, j);
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: "#3A3650" })));
  if (!dig) box(g, ROOM.w, ROOM.h, 0.25, "#363049", ROOM.w / 2, 0, -0.125);
  else {   // 奥の かべに 入口（木の わく）
    box(g, DOOR.x0, ROOM.h, 0.25, "#363049", DOOR.x0 / 2, 0, -0.125); box(g, ROOM.w - DOOR.x1, ROOM.h, 0.25, "#363049", (ROOM.w + DOOR.x1) / 2, 0, -0.125);
    box(g, DOOR.x1 - DOOR.x0, ROOM.h - 2.4, 0.25, "#363049", (DOOR.x0 + DOOR.x1) / 2, 2.4, -0.125);
    [DOOR.x0 + 0.06, DOOR.x1 - 0.06].forEach((x) => box(g, 0.14, 2.4, 0.34, "#7A5636", x, 0, -0.125)); box(g, DOOR.x1 - DOOR.x0 + 0.1, 0.14, 0.34, "#7A5636", (DOOR.x0 + DOOR.x1) / 2, 2.32, -0.125);
    // 掘った 地面（土の 色）・岩の かべ・木の はり・あかり
    box(g, ROOM.w, 0.2, ext, "#2E2630", ROOM.w / 2, -0.2, -ext / 2);
    const dl = []; for (let i = 1; i < ROOM.w; i++) dl.push(i, 0.005, -ext, i, 0.005, 0); for (let j = 1; j < ext; j++) dl.push(0, 0.005, -j, ROOM.w, 0.005, -j);
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dl, 3)); g.add(new THREE.LineSegments(dg, new THREE.LineBasicMaterial({ color: "#3E3442" })));
    box(g, ROOM.w, ROOM.h, 0.3, "#3B3240", ROOM.w / 2, 0, -ext - 0.15); box(g, 0.3, ROOM.h, ext, "#352C3C", -0.15, 0, -ext / 2);
    for (let z = -6; z >= -ext; z -= 6) { box(g, 0.22, ROOM.h, 0.22, "#6B4A2E", 0.15, 0, z + 0.2); rod(g, 0.09, ROOM.w, "#6B4A2E", ROOM.w / 2, ROOM.h - 0.25, z + 0.2, "x"); }
    for (let k = 1; k <= dig; k++) lamp(g, "#FFC98A", 1.1, 6, 2.8, -6 * k + 3, 6.5);
    // まだ 設備の ない 区画：テープの わくと 段ボール（ここに 作れる）。畑・坑道は つぎの 作業で 作る
    const mark = (x, z, w, d) => { const M = new THREE.Group(); M.position.set(x, 0, z); g.add(M); empty(M, w, d); };
    mark(8, -3, 4.6, 3.6);                    // 畑（拡張 Lv1）
    if (dig >= 2) mark(6, -10.4, 3.2, 2);     // 坑道（拡張 Lv2）
    if (dig >= 3) mark(6, -15, 6, 3.6);        // 畑を 広げる（拡張 Lv3）
  }
  box(g, 0.25, ROOM.h, ROOM.d, "#2F2A42", -0.125, 0, ROOM.d / 2);
  box(g, ROOM.w, 0.18, 0.06, "#4A4466", ROOM.w / 2, 0, 0.03); box(g, 0.06, 0.18, ROOM.d, "#4A4466", 0.03, 0, ROOM.d / 2);
  [[2.9, "#5A5470"], [3.12, "#6A6488"]].forEach(([y, c]) => { rod(g, 0.07, ROOM.w, c, ROOM.w / 2, y, 0.2, "x"); rod(g, 0.07, ROOM.d, c, 0.2, y, ROOM.d / 2, "z"); });
  // 部屋の まんなか：ケーブルと 箱、手前に はしご（上の ラウンジから 光が さす）
  box(g, 0.5, 0.4, 0.5, "#4A4466", 5.2, 0, 5).rotation.y = 0.4; box(g, 0.4, 0.3, 0.4, "#5A5470", 5.6, 0, 5.4).rotation.y = -0.2;
  const L = new THREE.Group(); L.position.set(6.6, 0, 8.9); g.add(L);
  [-0.3, 0.3].forEach((x) => box(L, 0.07, 3, 0.07, "#9AA3B8", x, 0, 0)); for (let y = 0.35; y < 3; y += 0.45) box(L, 0.6, 0.05, 0.06, "#C9CED8", 0, y, 0);
  cyl(g, 0.7, 0.9, 2.8, mat("#FFE6B0", { transparent: true, opacity: 0.08, emissive: "#FFE6B0", emissiveIntensity: 0.6, depthWrite: false }), 6.6, 0.2, 8.9, 16);
  lamp(g, "#FFE6B0", 1.4, 6.6, 3, 8.9, 5);
  // 施設
  for (const [id, sp] of Object.entries(SPOTS)) { if ((sp.dig || 0) > dig) continue; const S = new THREE.Group(); S.position.set(sp.x + (sp.r ? 0.15 : 0), 0, sp.z + (sp.r ? 0 : 0.15)); S.rotation.y = sp.r; S.userData.id = id; g.add(S); ST[id](S, lv[id] || 0, fx); }
  g.userData.tick = (t) => fx.forEach((f) => {
    if (f.spin) f.spin.rotation.y = t * 0.8;
    if (f.gear) f.gear.rotation.y = t * 0.9 * f.s;
    if (f.bob) f.bob.scale.y = 1 + 0.03 * Math.sin(t * 2);
    if (f.swing) f.swing.rotation.z = 0.06 * Math.sin(t * 1.7);
    if (f.flicker) f.flicker.material.emissiveIntensity = 2 + 0.4 * Math.sin(t * 9) * Math.sin(t * 2.3);
  });
  return g;
}
