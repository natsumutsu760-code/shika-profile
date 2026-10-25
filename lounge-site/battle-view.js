// 戦いの ようすを 3D で 見せる 部品（battle.html の 帯の 試作から 切り出した。2026-10-25）。闘技場の 画面・オーバーレイの 帯（⑤）で 使う
// mountBattle(host, { A, B, seed }, opts) → { duration, end, play(), skip(), frame(t), destroy() }
//   A・B：戦う 形（lounge-pet.js の fighterOf ＋ owner）。seed：くじの 種（門番と 同じ 種で 同じ 戦いに なる）
//   opts：W・H（絵の 大きさ px）・ground（地面の 高さ px）・home（2 匹の 立つ x px）・S（1 単位 ＝ px）・turnY（ターンの 札の 高さ）・winY（決着の 文字の 高さ）
//         plates（"side"：名札は キャラクターの 外がわ・"top"：上の 左右。せまい 画面用）・onEnd（終わった とき）・fit（host の はばに 合わせて 縮める。ふつう true）
// three.js は ページの importmap（"three"）から。動きの 決まりは battle.html と 同じ（1 手 1.9 秒・8 ターンまで 見せて、あとは 計算で まとめる）
import * as THREE from "three";
import { makePet3 } from "./pets.js";
import { simulate } from "./battle-sim.js";
import { TYPES } from "./skills.js";
import { EFFECTS } from "./effects.js";

const CSS = `
.bv { position:relative; overflow:hidden; transform-origin:0 0; color:#14164A; --ink:#14164A; --pop:"Dela Gothic One", "Zen Maru Gothic", sans-serif; --body:"M PLUS Rounded 1c", "Zen Maru Gothic", sans-serif; }
.bv canvas { position:absolute; left:0; top:0; }
.bv .ui { position:absolute; inset:0; pointer-events:none; }
.bv .ui > div { position:absolute; }
.bv .plate { z-index:21; transform:translateX(-50%); width:230px; background:#fff; border:4px solid var(--ink); border-radius:16px; padding:6px 11px 8px; box-shadow:4px 4px 0 var(--ink); }
.bv .plate .nm { display:flex; align-items:baseline; gap:8px; white-space:nowrap; overflow:hidden; }
.bv .plate .nm b { font:400 21px/1 var(--pop); }
.bv .plate .nm span { font:800 13px/1 var(--body); color:#4A4F86; overflow:hidden; text-overflow:ellipsis; }
.bv .plate .nm em { margin-left:auto; font:400 14px/1 var(--pop); font-style:normal; color:#1E6BFF; }
.bv .gauge { margin-top:6px; display:grid; grid-template-columns:26px 1fr 58px; gap:6px; align-items:center; font:800 12px/1 var(--body); }
.bv .gauge s { text-decoration:none; text-align:right; font:400 12px/1 var(--pop); }
.bv .gauge div { height:12px; border:3px solid var(--ink); border-radius:99px; background:#E7EBF7; overflow:hidden; }
.bv .gauge i { display:block; height:100%; background:#19E3B1; } .bv .gauge.mp i { background:#6FA0FF; } .bv .gauge i.low { background:#FF2E9A; }
.bv .chip { position:absolute; right:10px; top:-14px; padding:3px 8px; border-radius:99px; border:3px solid var(--ink); background:#FFF4B3; font:800 12px/1 var(--body); }
.bv .ty { display:inline-block; padding:2px 6px; border-radius:6px; font:800 11px/1 var(--body); color:#fff; }
.bv .sts { position:absolute; left:6px; top:-38px; display:flex; gap:4px; white-space:nowrap; }
.bv .sts i { font-style:normal; padding:3px 7px; border-radius:99px; border:3px solid var(--ink); font:800 12px/1 var(--body); background:#fff; }
.bv .sts i.y { background:#FFE45C; } .bv .sts i.p { background:#C9A5FF; } .bv .sts i.b { background:#BFE3FF; } .bv .sts i.g { background:#D8F0A0; } .bv .sts i.r { background:#FFB3A0; } .bv .sts i.up { background:#B8F5D8; }
.bv .bubble { z-index:23; transform:translateX(-50%); background:#FF2E9A; color:#fff; border:4px solid var(--ink); border-radius:16px; padding:7px 15px; font:400 22px/1 var(--pop); box-shadow:4px 4px 0 var(--ink); white-space:nowrap; }
.bv .bubble::after { content:""; position:absolute; bottom:-14px; left:calc(50% - 9px); width:18px; height:18px; background:inherit; border-right:4px solid var(--ink); border-bottom:4px solid var(--ink); transform:rotate(45deg); }
.bv .bubble.blue { background:#1E6BFF; } .bv .bubble.green { background:#19B37A; }
.bv .bubble .gb { display:inline-grid; place-items:center; min-width:26px; height:26px; margin-right:8px; padding:0 6px; border-radius:99px; background:#fff; color:var(--ink); font:400 15px/1 var(--pop); vertical-align:2px; }
.bv .bubble .gb.auto { font:800 12px/1 var(--body); }
.bv .num { z-index:24; transform:translateX(-50%); font:400 46px/1 var(--pop); color:#FFD60A; -webkit-text-stroke:3px var(--ink); paint-order:stroke fill; text-shadow:4px 4px 0 var(--ink); white-space:nowrap; }
.bv .num.crit { font-size:62px; color:#FF6A3D; } .bv .num.heal { color:#7CFFB2; } .bv .num.miss { font-size:34px; color:#fff; }
.bv .num small { display:block; font-size:22px; text-align:center; -webkit-text-stroke:2px var(--ink); }
.bv .zzz { z-index:24; font:400 24px/1 var(--pop); color:#FFD60A; -webkit-text-stroke:2px var(--ink); paint-order:stroke fill; }
.bv .center { z-index:25; transform:translate(-50%, -50%); text-align:center; white-space:nowrap; }
.bv .vs { font:400 96px/1 var(--pop); color:#FFD60A; -webkit-text-stroke:4px var(--ink); paint-order:stroke fill; text-shadow:6px 6px 0 var(--ink); }
.bv .win { font:400 72px/1 var(--pop); color:#FF2E9A; -webkit-text-stroke:4px var(--ink); paint-order:stroke fill; text-shadow:6px 6px 0 var(--ink); }
.bv .win small { display:block; margin-top:10px; font:400 30px/1 var(--pop); color:#fff; -webkit-text-stroke:3px var(--ink); }
.bv .simnote { font:400 44px/1.15 var(--pop); color:#fff; -webkit-text-stroke:4px var(--ink); paint-order:stroke fill; text-shadow:5px 5px 0 var(--ink); }
.bv .simnote small { display:block; margin-top:8px; font:400 26px/1 var(--pop); color:#FFD60A; -webkit-text-stroke:3px var(--ink); }
.bv .turn { z-index:21; transform:translateX(-50%); background:var(--ink); color:#fff; border-radius:99px; padding:8px 18px; font:400 20px/1 var(--pop); white-space:nowrap; }
.bv .lab { z-index:24; transform:translateX(-50%); white-space:nowrap; font:400 26px/1 var(--pop); color:#fff; -webkit-text-stroke:3px var(--ink); paint-order:stroke fill; text-shadow:3px 3px 0 var(--ink); }
.bv .lab.y { color:#FFE45C; } .bv .lab.g { color:#7CFFB2; } .bv .lab.p { color:#D9B8FF; } .bv .lab.b { color:#BFE3FF; } .bv .lab.r { color:#FF9AB0; }
.bv .banana { z-index:19; transform:translate(-50%, -100%); font-size:34px; }
.bv .note { z-index:21; transform:translateX(-50%); background:rgba(20,22,74,.82); color:#fff; border-radius:12px; padding:6px 14px; font:800 16px/1.3 var(--body); white-space:nowrap; }
`;
let cssOn = false;
const addCss = () => { if (cssOn) return; cssOn = true; const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); };

const ORB = { mizu: ["#9FD8FF", "#2EA8FF"], hanakuso: ["#C8E66B", "#7FA82E"], bakuchiku: ["#FF8A7A", "#FF2E2E"], lighter: ["#FFB36B", "#FF5A00"], kamifubuki: ["#FFE08A", "#FF7AC8"], sekkyo: ["#FFE7B0", "#FFB13B"], default: ["#C9A5FF", "#9C6BFF"] };
const MELEE = new Set(["chokomaka", "kancho", "kori", "decopin"]);   // 近づいて 当てる イタズラ（技の こうげきも 近づく）
const FX_CLS = { paralysis: "y", stun: "y", poison: "p", venom: "p", sickness: "p", rot: "p", frostbite: "b", freeze: "b", sleep: "b", blind: "g", burn: "r", scald: "r", silence: "w", confusion: "w", daze: "w", fatigue: "w", curse: "p" };
const CIRC = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3), clamp01 = (x) => Math.min(1, Math.max(0, x)), seg = (u, a, b) => clamp01((u - a) / (b - a));
const impact = (j) => 0.62 + j * 0.24;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let REF = 0;   // しかの 高さ（ほかの 種類を この 高さに そろえる）
const heightOf = (o) => { const b = new THREE.Box3().setFromObject(o); return b.max.y - b.min.y; };

export function mountBattle(host, { A, B, seed }, o = {}) {
  addCss();
  const W = o.W || 1200, H = o.H || 520, GROUND = o.ground || 440, S = o.S || 150, HOMEPX = o.home || [W * 0.34, W * 0.66], TURN_Y = o.turnY ?? 18, WIN_Y = o.winY ?? GROUND - 250, TOP = o.plates === "top";
  const EV = simulate(A, B, seed), START = EV[0], END = EV.at(-1);
  // 時間割：1 手 1.9 秒（動けない 手は 1.2 秒）・ターンの 終わりの 回復・どくは 0.7 秒
  const T_INTRO = 3.2, T_OUT = 3, SEGS = []; let tt = T_INTRO;
  for (const e of EV) {
    if (e.sim) continue;
    if (e.type === "act") { const d = e.kind === "skip" ? 1.2 : 1.9 + Math.max(0, (e.hits?.length || 0) - 2) * 0.24; SEGS.push({ t0: tt, d, e }); tt += d; }
    else if (e.type === "tick" && e.items.length) { SEGS.push({ t0: tt, d: 0.7, e }); tt += 0.7; }
  }
  const SIM_LAST = EV.filter((e) => e.sim && e.after).at(-1)?.after;
  if (END.overtime && SIM_LAST) { SEGS.push({ t0: tt, d: 2.8, e: { type: "sim", turn: `9〜${END.turns}`, after: SIM_LAST } }); tt += 2.8; }
  const T_END = tt, DUR = T_END + T_OUT;

  // 舞台：host の 中に W × H の 絵。はばに 合わせて 縮める
  const stage = document.createElement("div"); stage.className = "bv" + (o.cls ? " " + o.cls : ""); stage.style.width = W + "px"; stage.style.height = H + "px";
  const cv = document.createElement("canvas"), ui = document.createElement("div"); ui.className = "ui"; stage.append(cv, ui); host.appendChild(stage);
  const fit = () => { if (o.fit === false) return; const k = Math.min(1, host.clientWidth / W); stage.style.transform = `scale(${k})`; host.style.height = H * k + "px"; };
  fit(); const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null; ro && ro.observe(host);

  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W, H, false); cv.style.width = W + "px"; cv.style.height = H + "px";
  r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0, 0);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight("#FFFFFF", "#B9D3A8", 1.25));
  const key = new THREE.DirectionalLight("#FFF6EA", 2.2); key.position.set(-1.4, 2.4, 2.6); scene.add(key);
  const fill = new THREE.DirectionalLight("#E6F0FF", 0.7); fill.position.set(2, 1.2, -1.2); scene.add(fill);
  const gy = GROUND / S, cam = new THREE.OrthographicCamera(0, W / S, gy, gy - H / S, -10, 10); cam.position.set(0, 0, 5); scene.add(cam);
  const px = (x) => x * S, py = (y) => GROUND - y * S, HOME = HOMEPX.map((x) => x / S), FACE = [0.9, -0.9];
  if (!REF) REF = heightOf(makePet3("shika"));
  const pets = [A, B].map((f, i) => {
    const holder = new THREE.Group(); holder.position.x = HOME[i]; scene.add(holder);
    const pet = makePet3(f.species); pet.rotation.y = FACE[i]; pet.rotation.x = 0.12; holder.add(pet);
    pet.scale.setScalar(Math.min(1.5, Math.max(0.75, REF / Math.max(0.1, heightOf(pet)))));
    const box = new THREE.Box3().setFromObject(pet), mats = [];
    pet.traverse((m) => { if (m.material && m.material.emissive) mats.push([m.material, m.material.emissive.clone()]); });
    return { holder, pet, top: box.max.y, half: (box.max.x - box.min.x) / 2, mats };
  });
  const flash = (p, k, c = "#FFFFFF") => p.mats.forEach(([m, base]) => m.emissive.copy(base).lerp(new THREE.Color(c), k));
  const orbMat = new THREE.MeshStandardMaterial({ color: "#C9A5FF", emissive: "#9C6BFF", emissiveIntensity: 1.2 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), orbMat); orb.visible = false; scene.add(orb);

  const el = (cls, html, x, y, extra = "") => `<div class="${cls}" style="left:${x}px;top:${y}px;${extra}">${html}</div>`;
  const gauge = (lab, v, max, cls = "") => `<div class="gauge ${cls}"><span>${lab}</span><div><i class="${lab === "HP" && v / max < 0.35 ? "low" : ""}" style="width:${(v / max) * 100}%"></i></div><s>${Math.round(v)}/${max}</s></div>`;
  function stateAt(t) {
    let snap = START.fighters.map((f) => ({ hp: f.maxHp, mp: f.maxMp, fx: [], up: false, down: false }));
    for (const sg of SEGS) {
      if (t < sg.t0) break;
      const u = t - sg.t0, nx = sg.e.after;
      if (u >= sg.d) { snap = nx.map((x) => ({ ...x })); continue; }
      const hitEnd = sg.e.type === "act" && sg.e.hits?.length ? impact(sg.e.hits.length - 1) + 0.3 : 0.6;
      const f = sg.e.type === "sim" ? ease(seg(u, 0.5, 2.3)) : sg.e.type === "tick" ? ease(u / 0.5) : ease((u - 0.55) / Math.max(0.3, hitEnd - 0.55)), g = sg.e.type === "sim" ? f : ease((u - 0.1) / 0.3);
      snap = snap.map((x, i) => ({ hp: x.hp + (nx[i].hp - x.hp) * f, mp: x.mp + (nx[i].mp - x.mp) * g, fx: u > 0.7 ? nx[i].fx : x.fx, up: u > 0.7 ? nx[i].up : x.up, down: u > 0.7 ? nx[i].down : x.down }));
    }
    return snap;
  }

  const MID = W / 2;
  function frame(t) {
    let html = "";
    pets.forEach((p, i) => { p.pet.userData.tick?.(t); p.holder.position.set(HOME[i], 0, 0); p.holder.rotation.set(0, 0, 0); p.holder.scale.set(1, 1, 1); flash(p, 0); });
    orb.visible = false;
    pets.forEach((p, i) => { const q = seg(t, 0.15 + i * 0.25, 0.75 + i * 0.25); p.holder.position.y = q < 1 ? 2.4 * Math.pow(1 - q, 2) : Math.abs(Math.sin(seg(t, 0.75 + i * 0.25, 1.05 + i * 0.25) * Math.PI)) * 0.12; });   // 上から 飛び乗る
    const sg = SEGS.find((x) => t >= x.t0 && t < x.t0 + x.d), e = sg?.e, u = sg ? t - sg.t0 : 0;
    const bi = SEGS.findIndex((x) => x.e.type === "act" && x.e.skill === "banana" && x.t0 + 0.7 <= t);   // バナナの 皮：相手が 動くまで 足もとに
    if (bi >= 0) { const tgt = 1 - SEGS[bi].e.who, until = SEGS.find((x, j) => j > bi && x.e.type === "act" && x.e.who === tgt); if (!until || t < until.t0 + 0.6) html += el("banana", "🍌", px(HOME[tgt]) + (tgt ? -70 : 70), GROUND + 4); }
    if (e && e.type === "act") {
      const me = pets[e.who], foe = pets[1 - e.who], dir = e.who === 0 ? 1 : -1, gapX = Math.abs(HOME[1] - HOME[0]);
      const numAt = (j, a, h) => { const x = px(foe.holder.position.x) + (j % 2 ? 34 : -16) * dir, y = py(foe.top * 0.75) - 40 - a * 60; html += el(`num ${h.miss ? "miss" : h.crit ? "crit" : ""}`, h.miss ? "ミス" : `${h.dmg}${h.crit ? "<small>会心！</small>" : ""}`, x, y, `opacity:${1 - seg(a, 0.7, 1.0)}`); };
      if (e.kind === "skip") {
        if (/凍って/.test(e.name)) { me.holder.position.x += 0.012 * Math.sin(u * 80) * (u < 1 ? 1 : 0); flash(me, 0.55, "#9FE4FF"); }
        else if (/転んだ/.test(e.name)) { me.holder.rotation.z = -dir * 1.2 * Math.sin(seg(u, 0.1, 0.9) * Math.PI); me.holder.position.y = 0.15 * Math.sin(seg(u, 0.1, 0.5) * Math.PI); }
        else if (/しびれ/.test(e.name)) { me.holder.position.x += 0.03 * Math.sin(u * 60) * (u < 1 ? 1 : 0); flash(me, 0.5 * Math.abs(Math.sin(u * 20)) * (u < 1 ? 1 : 0), "#FFE45C"); }
        else me.holder.rotation.z = -dir * 0.12 * Math.sin(seg(u, 0.1, 1.3) * Math.PI);
        if (u < 1.1) html += el(`lab ${/しびれ/.test(e.name) ? "y" : /凍って/.test(e.name) ? "b" : ""}`, esc(e.name), px(HOME[e.who]), py(me.top) - 70 - u * 20, `font-size:24px;opacity:${1 - seg(u, 0.85, 1.1)}`);
      } else {
        const melee = e.kind === "waza" || MELEE.has(e.skill), hits = e.hits || [];
        if (hits.length && melee) {
          const last = impact(hits.length - 1), reach = gapX - me.half - foe.half - 0.08;
          const go = ease(seg(u, 0.3, 0.6)) * (1 - ease(seg(u, last + 0.35, last + 0.75)));
          me.holder.position.x = HOME[e.who] + dir * reach * go; me.holder.position.y = 0.18 * Math.sin(seg(u, 0.3, 0.6) * Math.PI);
        }
        if (hits.length && !melee) {
          const c = ORB[e.skill] || ORB.default; orbMat.color.set(c[0]); orbMat.emissive.set(c[1]);
          const q = seg(u, 0.3, impact(0)); orb.visible = u > 0.3 && u < impact(0) + 0.04;
          orb.position.set(HOME[e.who] + (HOME[1 - e.who] - HOME[e.who]) * q, 0.55 + 0.35 * Math.sin(q * Math.PI), 0.3); orb.scale.setScalar(1 + 0.3 * Math.sin(u * 30));
          me.holder.position.y = 0.1 * Math.sin(seg(u, 0.1, 0.4) * Math.PI);
        }
        hits.forEach((h, j) => {
          const a = u - impact(j); if (a < 0) return;
          if (h.miss) { foe.holder.position.x = HOME[1 - e.who] + dir * 0.35 * Math.sin(seg(a, 0, 0.5) * Math.PI); foe.holder.position.y = 0.2 * Math.sin(seg(a, 0, 0.5) * Math.PI); }
          else { foe.holder.position.x += dir * 0.16 * Math.exp(-a * 5) * (a < 0.6 ? 1 : 0); foe.holder.rotation.z = -dir * 0.18 * Math.exp(-a * 6); flash(foe, Math.max(0, 1 - a / 0.18)); }
          if (a < 1.0) numAt(j, a, h);
        });
        if (!hits.length) me.holder.position.y = 0.16 * Math.abs(Math.sin(seg(u, 0.3, 0.9) * Math.PI * 2));
        const a = u - impact(0), tags = e.tags || [];
        if (e.heal && a > 0 && a < 1.1) { html += el("num heal", `+${e.heal}`, px(HOME[e.who]) + 90 * dir, py(me.top * 0.45) - a * 50, `opacity:${1 - seg(a, 0.8, 1.1)}`); flash(me, Math.max(0, 0.6 - a), "#7CFFB2"); }
        const lab = (txt, cls, who, k = 0) => { if (a > 0 && a < 1.2) { const self = who === e.who, sx = self ? px(HOME[who]) + (who ? -1 : 1) * 130 : px(HOME[who]), sy = (self ? py(pets[who].top * 0.7) - a * 20 : py(pets[who].top) - 60 - a * 26) - k * 34; html += el(`lab ${cls}`, txt, sx, sy, `opacity:${1 - seg(a, 0.9, 1.2)}`); } };
        const foeTags = tags.filter((id) => EFFECTS[id] && !EFFECTS[id].buff && !e.self), selfTags = tags.filter((id) => EFFECTS[id]?.buff);
        foeTags.forEach((id, k) => { if (a > k * 0.18) lab(`${EFFECTS[id].label}${id === "frostbite" || id === "paralysis" ? `<small style="font-size:18px"> ${e.after[1 - e.who].fx.find((x) => x.id === id)?.amt ?? ""}</small>` : ""}！`, FX_CLS[id] || "", 1 - e.who, k); });
        if (selfTags.length) lab(selfTags.map((id) => EFFECTS[id].label).join("・"), selfTags.includes("charge") ? "y" : "g", e.who);
        if (tags.includes("cure")) lab("浄化", "g", e.who, 1);
        if (e.popped && e.notes.some((n) => n.includes("はじけた")) && a > 0) html += el("center", `<div class="win" style="font-size:54px;scale:${0.6 + 0.4 * ease(seg(a, 0, 0.2))};opacity:${1 - seg(a, 1.0, 1.3)}">デバフ ${e.popped} つ はじけた！</div>`, px(HOME[1 - e.who]), py(pets[1 - e.who].top) - 150);
        const notes = (e.notes || []).filter((n) => !n.includes("はじけた"));
        if (notes.length && a > 0.2 && a < 1.4) html += el("note", esc(notes.join("　")), MID, GROUND - 168);
        if (e.skill !== "kogeki" && u < 1.6) {
          const gb = e.by === "auto" ? `<span class="gb auto">オート</span>` : `<span class="gb">${CIRC[e.by] || ""}</span>`;
          const cls = !hits.length && (e.heal || (e.tags || []).some((x) => EFFECTS[x]?.buff || x === "cure")) ? "green" : e.kind === "itazura" ? "blue" : "";
          html += el(`bubble ${cls}`, gb + esc(e.name), px(HOME[e.who]), py(me.top) - 62, `opacity:${1 - seg(u, 1.3, 1.6)};scale:${0.85 + 0.15 * ease(seg(u, 0, 0.15))}`);
        }
      }
    }
    if (e && e.type === "tick") e.items.forEach((it, k) => {
      const p = pets[it.who], dy = k * 72;
      if (it.heal) html += el("num heal", `+${it.heal}`, px(HOME[it.who]) + (it.who ? -80 : 80), py(p.top * 0.8) - u * 40 - dy, `font-size:34px;opacity:${1 - seg(u, 0.6, 0.9)}`);
      if (it.dmg) html += el("num", `${it.dmg}<small>${esc(it.why)}</small>`, px(HOME[it.who]) + (it.who ? -80 : 80), py(p.top * 0.8) - u * 40 - dy, `font-size:34px;color:#D9B8FF;opacity:${1 - seg(u, 0.6, 0.9)}`);
    });
    if (t >= T_END - 0.6) {   // 決着：負けた 子は ぺたん、勝った 子は はねる
      const a = t - (T_END - 0.6), L = 1 - END.winner, Wn = END.winner, dirL = L === 0 ? -1 : 1;
      const q = ease(seg(a, 0, 0.35)); pets[L].holder.scale.set(1 + 0.22 * q, 1 - 0.42 * q, 1 + 0.22 * q); pets[L].holder.rotation.z = dirL * -0.18 * q;
      if (a > 0.3) for (let s2 = 0; s2 < 3; s2++) { const ang = (a - 0.3) * 4 + s2 * 2.1; html += el("zzz", "★", px(HOME[L]) + Math.cos(ang) * 46 - 12, py(pets[L].top * 0.58) - 30 + Math.sin(ang) * 12); }
      if (a > 0.8) pets[Wn].holder.position.y = 0.22 * Math.abs(Math.sin((a - 0.8) * 5));
    }
    const st = stateAt(t);   // 名札（キャラクターの 外がわ）
    pets.forEach((p, i) => {
      const f = START.fighters[i], ty = TYPES[f.type] || { color: "#888", label: "" }, x = TOP ? W * (i ? 0.75 : 0.25) : px(HOME[i]) + (i === 0 ? -1 : 1) * (p.half * S + 24 + 115), s = st[i];
      const dbs = s.fx.filter((z) => EFFECTS[z.id] && !EFFECTS[z.id].buff), sts = [...dbs.slice(0, 3).map((z) => `<i class="${FX_CLS[z.id] || ""}">${EFFECTS[z.id].label}${z.amt != null && EFFECTS[z.id].dur === "stack" ? ` ${z.amt}` : ""}</i>`), dbs.length > 3 ? `<i>+${dbs.length - 3}</i>` : "", s.up ? `<i class="up">▲バフ</i>` : ""].join("");
      html += el("plate", `<div class="sts">${sts}</div><div class="nm"><b>${esc(f.name)}</b><span>${esc(f.owner)}</span><em>Lv${f.lv}</em></div><div style="margin-top:4px"><span class="ty" style="background:${ty.color}">${ty.label}</span></div>${gauge("HP", s.hp, f.maxHp)}${gauge("MP", s.mp, f.maxMp, "mp")}${START.ganbari === i ? `<span class="chip">がんばり</span>` : ""}`, x, TOP ? 46 : GROUND - 126, `opacity:${seg(t, 0.9 + i * 0.25, 1.2 + i * 0.25)}`);
    });
    if (t > 1.1 && t < T_INTRO) html += el("center", `<div class="vs" style="scale:${0.6 + 0.4 * ease(seg(t, 1.1, 1.35))}">VS</div>`, MID, GROUND - 170, `opacity:${1 - seg(t, T_INTRO - 0.4, T_INTRO)}`);
    if (e) html += el("turn", `ターン ${e.turn}`, MID, TURN_Y);
    if (e && e.type === "sim") html += el("center", `<div class="simnote" style="scale:${0.7 + 0.3 * ease(seg(u, 0, 0.3))}">8 ターンで決着せず<small>ターン ${e.turn} は計算で進めた</small></div>`, MID, GROUND - 230, `opacity:${1 - seg(u, 2.4, 2.8)}`);
    if (t >= T_END + 0.2) {
      const a = t - T_END - 0.2, w = START.fighters[END.winner].name;
      html += el("center", `<div class="win" style="scale:${0.5 + 0.5 * ease(seg(a, 0, 0.3))}">${END.upset ? "下克上！" : "勝負あり！"}<small>${esc(w)} の勝ち${END.ko ? (END.overtime ? `（${END.turns} ターン目で決着）` : "") : "（30 ターンでも決着せず・HP の割合）"}</small></div>`, MID, WIN_Y);
    }
    ui.innerHTML = html;
    r.render(scene, cam);
  }

  let raf = 0, t0 = 0, ended = false;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion:reduce)").matches;
  const done = () => { if (!ended) { ended = true; o.onEnd && o.onEnd(END); } };
  const loop = () => { const t = (performance.now() - t0) / 1000; frame(Math.min(t, DUR)); if (t >= T_END + 1) done(); if (t < DUR) raf = requestAnimationFrame(loop); };
  const api = {
    duration: DUR, end: END, start: START, frame,
    play() { cancelAnimationFrame(raf); ended = false; if (reduce) return api.skip(); t0 = performance.now(); loop(); },
    skip() { cancelAnimationFrame(raf); frame(T_END + 1.2); done(); },
    destroy() { cancelAnimationFrame(raf); ro && ro.disconnect(); r.dispose(); stage.remove(); host.style.height = ""; },
  };
  frame(0);
  return api;
}
