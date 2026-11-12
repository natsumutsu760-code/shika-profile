// ネビュラ（鹿物語）の ペットの 戦いを 帯で 見せる 部品（2026-11-12 鹿さんの カード）。OBS の オーバーレイ（overlay-obs.html）が 門番の /lounge/ から 読む
// mountNebula(host, m, o) → battle-view の api（play・skip・destroy）
//   m：鹿物語からの 知らせ（shika-neb-bat）{ id, kind: "pet" | "pom" | "peregrine", owner, pet（門番から もらった ペットの 戦う 形。なければ 精鋭 POM）, round, spins, boss: { name, hp, max, c, c2, img }, seed }
//   o：W・H・ground・home など battle-view と 同じ ＋ onEv({ k, hurt, heal, boss }) 1 手ごと（回転数の 減り・回復・盤面の ボスへの ダメージ）・onEnd()
// 左に 3D の ペット（精鋭 POM・PEREGRINE）、右に 盤面の ボスの 絵を 光る ホログラムで（鹿さんの カード「ホログラムで向き合う」）。ペットの HP は 回転数で 見せる
import * as THREE from "three";
import { mountBattle } from "./battle-view.js";
import { makePet3 } from "./pets.js";
import { makeElitePOM } from "./pom3d.js";
import { makePeregrine } from "./peregrine3d.js";
import { nebBossFighter, nebEliteFighter, nebPeregrineFighter, nebDmgK, MERYL } from "./nebula-fighters.js";

const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// 盤面の ボスの 絵を 光る 板に（下に 映写の 輪・走る 走査線）
function holo(boss) {
  const g = new THREE.Group(), inner = new THREE.Group(); inner.rotation.y = 0.9; inner.rotation.x = -0.12; g.add(inner);   // battle-view が 右の 子を 左へ 向けるので、板は カメラへ 向け直す
  const tex = new THREE.TextureLoader().load(boss.img || ""); tex.colorSpace = THREE.SRGBColorSpace;
  const S = 1.5, mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(S, S), mat); plane.position.y = S / 2 + 0.06; inner.add(plane);
  const c = new THREE.Color(boss.c || "#FF4FD8");
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(S * 1.15, S * 1.15), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(0, S / 2 + 0.06, -0.01); inner.add(glow);
  const cv = document.createElement("canvas"); cv.width = 8; cv.height = 64; const x = cv.getContext("2d");
  for (let y = 0; y < 64; y += 4) { x.fillStyle = `rgba(255,255,255,${y % 8 ? 0.0 : 0.22})`; x.fillRect(0, y, 8, 2); }
  const lt = new THREE.CanvasTexture(cv); lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set(1, 6);
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshBasicMaterial({ map: lt, color: c, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.position.set(0, S / 2 + 0.06, 0.01); inner.add(lines);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 48), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06 + S, 32, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.07, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.y = (0.06 + S) / 2; g.add(beam);
  g.userData.tick = (t) => {
    plane.position.y = glow.position.y = lines.position.y = S / 2 + 0.06 + Math.sin(t * 1.6) * 0.03;   // ふわふわ
    lt.offset.y = -t * 0.4; mat.opacity = 0.84 + 0.08 * Math.sin(t * 9) + ((t * 7) % 5 < 0.15 ? -0.3 : 0);   // 走査線と ちらつき
    ring.scale.setScalar(1 + 0.05 * Math.sin(t * 3));
  };
  return g;
}

export function mountNebula(host, m, o = {}) {
  const R = rnd(m.seed || 1), round = m.round || 1, bossMax = m.boss.max || m.boss.hp;
  let A;
  if (m.kind === "peregrine") A = nebPeregrineFighter(round);
  else if (m.kind === "pet" && m.pet && m.pet.stats) A = { ...m.pet };
  else A = nebEliteFighter(R(), round);
  A = { ...A, pool: Math.max(1, m.spins || 1), owner: m.kind === "pet" ? m.owner : m.kind === "peregrine" ? "" : `${m.owner} の 代わり` };
  const B = nebBossFighter(m.boss, round, A.lv), K = nebDmgK(bossMax, B);
  const makeA = m.kind === "peregrine" ? () => makePeregrine() : m.kind === "pom" || !A.species ? () => makeElitePOM(A.elite) || makePet3("mouse") : () => makePet3(A.species);
  const spins0 = A.pool, hp0 = m.boss.hp;
  let prev = null, sayAt = -1, say = "";
  const view = mountBattle(host, { A, B, seed: m.seed || 1 }, {
    // simOpts.pve：ゲームの 中の 敵との 戦い（がんばり なし）
    ...o, simOpts: { until: 8, pve: true }, noResult: true, make: [makeA, () => holo(m.boss)],
    poolView: [(s) => ({ lab: "回転", v: spins0 - (s.ph || 0) + (s.pl || 0), max: Math.max(spins0, spins0 - (s.ph || 0) + (s.pl || 0)) }),
      (s) => ({ lab: "体力", v: hp0 - K * ((s.ph || 0) - (s.pl || 0)), max: bossMax })],
    onSeg: (k, e) => {
      if (!e.after) return;
      const a = e.after[0], b = e.after[1], p = prev || { ah: 0, al: 0, bh: 0, bl: 0 };
      const ev = { k, turn: e.turn || 0, hurt: Math.round((a.ph || 0) - p.ah), heal: Math.round((a.pl || 0) - p.al), boss: Math.round(K * (((b.ph || 0) - p.bh) - ((b.pl || 0) - p.bl))) };
      prev = { ah: a.ph || 0, al: a.pl || 0, bh: b.ph || 0, bl: b.pl || 0 };
      if (ev.hurt || ev.heal || ev.boss) o.onEv && o.onEv(ev);
    },
    // メリル（PEREGRINE の オペレーター）の 字幕：はじめ・予告の 大技・まん中
    overlay: m.kind !== "peregrine" ? null : (t, e) => {
      let line = "";
      if (!e && t < 4) line = MERYL.join;
      else if (e && e.type === "act" && MERYL[e.skill]) line = MERYL[e.skill];
      else if (e && e.turn === 4) line = MERYL.mid;
      if (line && line !== say) { say = line; sayAt = t; }
      if (!say || t - sayAt > 4.5) return "";
      return `<div class="meryl" style="opacity:${Math.min(1, (t - sayAt) * 4, (4.5 - (t - sayAt)) * 3)}"><small>メリル（PEREGRINE の オペレーター）</small>${say.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</div>`;
    },
    onEnd: () => o.onEnd && o.onEnd(),
  });
  return view;
}
