// クローラーの 戦いの エフェクト（2026-11-05 鹿さん「クローラーの戦闘時エフェクトがないことに気が付きました。エフェクトは必要です。」）
// 1 手の 出来事（B.turnEv）を 1 つずつ 見せる：動いた 側が 前に 出る → 技の 名前 → 斬撃の 線か 光の 輪 → 当たった 側が 揺れて 白く 光る・数が 浮かぶ
//   会心は 大きな 数と 画面の 揺れ・外れは MISS・防いだら BLOCK・回復は 緑の 数と 粒・状態は 札・倒れたら 崩れ落ちる。HP の 棒は 当たる たびに 減る
// 見せる だけ（計算は crawler-battle.js が もう 終えて いる）。押すと 早送り。動きを へらす 設定では 揺れと 移動を 出さない
// 絵の エフェクトは pixelfx（MIT。pixelfx/ORIGIN.md）：鹿さん「これを使えませんか？」（2026-11-05）。1 ドット ＝ 2px の キャンバスを 戦いの 上に 重ねる。読めない ときは CSS の 線と 輪で 代わり
// playTurnFx(root, evs, o) → Promise。o：{ n（味方の 数）, hp（手の 前の HP の 配列。書きかえる）, maxHp（配列）, skillName(id), onLog(文), over }
import { EFFECTS } from "./effects.js";
import { SKILL } from "./skills.js";
import { createFrame, clearFrame, createFx, composite } from "./pixelfx/core/index.js";

// ---- どの 出来事に どの 絵を 出すか ----
const ST_FX = { poison: "status/poisoned", venom: "status/poisoned", burn: "status/burning", scald: "status/burning", frostbite: "status/frozen", freeze: "status/frozen",
  stun: "status/stunned", daze: "status/stunned", sleep: "status/sleep", confusion: "status/confused", silence: "status/confused", blind: "status/confused",
  curse: "status/cursed", rot: "status/cursed", sickness: "status/cursed", weakness: "status/cursed", fatigue: "status/slowed", paralysis: "lightning/zap-hit",
  haste: "status/haste", up_agi: "status/haste", frenzy: "status/rage", guard: "holy/divine-shield", barrier: "holy/divine-shield", shield: "holy/divine-shield", ward: "holy/divine-shield", armor: "holy/divine-shield" };
const EL_FX = { burn: "fire/flame-pillar", scald: "fire/flame-pillar", frostbite: "ice/ice-shatter", freeze: "ice/ice-shatter", poison: "nature/acid-splash", venom: "nature/acid-splash",
  curse: "shadow/curse", rot: "shadow/curse", sickness: "shadow/curse", weakness: "shadow/curse", paralysis: "lightning/zap-hit", stun: "lightning/zap-hit" };
const statusFx = (id) => ST_FX[id] || (id.startsWith("down_") ? "status/slowed" : EFFECTS[id]?.buff ? "holy/blessing" : null);
// 技の 当たりの 絵：状態を 付ける 技は その しゅるい（炎・氷・毒・呪い・雷）、INT の 技は 術、ほかは 斬撃（連打は 二連）
function hitFx(e) {
  const sk = SKILL[e.skill] || {}, fx = sk.fx || [], dmg = fx.find((x) => x.t === "dmg" || x.t === "fixed"), st = fx.find((x) => x.t === "fx" && x.who === "foe");
  if (st && EL_FX[st.id]) return EL_FX[st.id];
  if (sk.kind === "item") return "impacts/blunt-hit";
  if (e.kind === "itazura" || (dmg && dmg.stat === "int")) return "arcane/mana-burst";
  return (e.hits || []).length > 1 ? "melee/double-slash" : e.who >= 0 && e.kind === "beast" ? "melee/claw-swipe" : "melee/sword-slash";
}
const ALL = [...new Set([...Object.values(ST_FX), ...Object.values(EL_FX), "impacts/hit-spark", "impacts/crit-hit", "impacts/shield-block", "impacts/blunt-hit", "melee/sword-slash", "melee/double-slash", "melee/claw-swipe", "arcane/mana-burst", "holy/heal", "holy/blessing", "spawn/shatter-death"])];
const MODS = {};
const load = (name) => (MODS[name] ??= import(`./pixelfx/fx/${name}.js`).catch(() => null));
export const preloadFx = () => Promise.all(ALL.map(load));   // 戦いが 始まる ときに 読んで おく（最初の 1 手で 待たない）

// ---- ドット絵の キャンバス（1 ドット ＝ PX px。動く 物が ある あいだだけ 描く） ----
const PX = 2;
function engine(lay, root) {
  let cv = lay.querySelector("canvas.fxc"); if (!cv) { cv = document.createElement("canvas"); cv.className = "fxc"; lay.appendChild(cv); }
  const w = Math.max(1, Math.ceil(root.clientWidth / PX)), h = Math.max(1, Math.ceil(root.clientHeight / PX));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  cv.style.width = `${w * PX}px`; cv.style.height = `${h * PX}px`;
  const ctx = cv.getContext("2d"), frame = createFrame(w, h), img = new ImageData(w, h), live = [];
  let raf = 0, last = 0;
  const paint = () => { clearFrame(frame); for (const f of live) f.draw(frame, "back"); for (const f of live) f.draw(frame, "front"); composite(frame, img.data, null); ctx.putImageData(img, 0, 0); };
  const tick = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    for (const f of live) f.update(dt);
    for (let i = live.length - 1; i >= 0; i--) if (live[i].t > (live[i].meta.duration ?? 1) + 0.05) live.splice(i, 1);
    paint(); raf = live.length ? requestAnimationFrame(tick) : 0;
  };
  return {
    async spawn(name, x, y, opt = {}) {
      const m = name && (await load(name)); if (!m) return false;
      live.push(createFx(m, { x: Math.round(x / PX), y: Math.round(y / PX), seed: (Math.random() * 1e6) | 0, ...opt }));
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
      return true;
    },
  };
}

const CSS = `
#fight { --fx-hit:#FFFFFF; }
#fight .fxl { position:absolute; inset:0; pointer-events:none; z-index:6; overflow:hidden; }
#fight .fxl canvas.fxc { position:absolute; left:0; top:0; image-rendering:pixelated; }
#fight .fx-num { position:absolute; transform:translate(-50%, -50%); font:800 26px/1 "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif; color:#FFE9B0; text-shadow:0 2px 0 #000, 0 0 10px #000c; letter-spacing:.02em; animation:fxNum .9s ease-out forwards; white-space:nowrap; }
#fight .fx-num.crit { font-size:38px; color:#FFD24A; }
#fight .fx-num.crit::before { content:"会心"; display:block; font-size:13px; letter-spacing:.3em; text-align:center; color:#FFB547; }
#fight .fx-num.mate { color:#FF8A8F; }
#fight .fx-num.heal { color:#7CF0B0; }
#fight .fx-num.miss { font-size:18px; color:#9C9BA4; letter-spacing:.2em; }
#fight .fx-num.tag { font-size:13px; padding:3px 9px; border-radius:6px; background:#000a; border:1px solid currentColor; letter-spacing:.1em; animation-duration:1.1s; }
#fight .fx-num.tag.buff { color:#7FD8FF; } #fight .fx-num.tag.debuff { color:#C9A2FF; }
#fight .fx-num.stun { font-size:14px; color:#9C9BA4; letter-spacing:.15em; }
@keyframes fxNum { 0% { opacity:0; margin-top:8px; } 15% { opacity:1; margin-top:-6px; } 70% { opacity:1; margin-top:-26px; } 100% { opacity:0; margin-top:-38px; } }
#fight .fx-slash { position:absolute; height:4px; border-radius:4px; background:linear-gradient(90deg, transparent, var(--fx-c, #fff) 30%, #fff 50%, var(--fx-c, #fff) 70%, transparent); box-shadow:0 0 12px var(--fx-c, #fff); transform-origin:50% 50%; animation:fxSlash .26s ease-out forwards; }
@keyframes fxSlash { 0% { opacity:0; scale:0 1; } 40% { opacity:1; scale:1 1; } 100% { opacity:0; scale:1.15 .4; } }
#fight .fx-ring { position:absolute; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%; border:3px solid var(--fx-c, #7FB6E8); box-shadow:0 0 18px var(--fx-c, #7FB6E8), inset 0 0 12px var(--fx-c, #7FB6E8); animation:fxRing .42s ease-out forwards; }
@keyframes fxRing { 0% { opacity:1; scale:.3; } 100% { opacity:0; scale:6; } }
#fight .fx-dot { position:absolute; width:7px; height:7px; border-radius:50%; background:#7CF0B0; box-shadow:0 0 8px #7CF0B0; animation:fxDot .8s ease-out forwards; }
@keyframes fxDot { 0% { opacity:0; transform:translateY(10px); } 30% { opacity:1; } 100% { opacity:0; transform:translateY(-48px); } }
#fight .fx-banner { position:absolute; left:50%; top:14px; transform:translateX(-50%); padding:6px 22px; font-size:15px; letter-spacing:.18em; color:var(--amber, #E8C25A); background:linear-gradient(90deg, transparent, #000c 20%, #000c 80%, transparent); border-top:1px solid #E8C25A66; border-bottom:1px solid #E8C25A66; white-space:nowrap; animation:fxBanner .7s ease-out forwards; }
@keyframes fxBanner { 0% { opacity:0; letter-spacing:.5em; } 20% { opacity:1; letter-spacing:.18em; } 80% { opacity:1; } 100% { opacity:0; } }
#fight .fx-end { position:absolute; left:50%; top:38%; transform:translate(-50%, -50%); font-size:34px; letter-spacing:.4em; font-weight:800; white-space:nowrap; text-shadow:0 0 18px currentColor; animation:fxEnd 1.4s ease-out forwards; }
@keyframes fxEnd { 0% { opacity:0; scale:1.3; } 20% { opacity:1; scale:1; } 80% { opacity:1; } 100% { opacity:.0; } }
#fight .foe img, #fight .mates .m { transition:filter .12s; }
#fight .foe.fx-act img { animation:fxLunge .32s ease-out; }
@keyframes fxLunge { 50% { transform:translateY(14px) scale(1.08); } }
#fight .mates .m.fx-act { box-shadow:0 0 0 2px var(--amber, #E8C25A) inset; }
#fight .fx-hit img, #fight .mates .m.fx-hit { animation:fxShake .28s linear; filter:brightness(2.4) saturate(.3); }
#fight .mates .m.fx-hit { background:#3A1A1E; }
@keyframes fxShake { 20% { translate:-6px 0; } 40% { translate:5px 0; } 60% { translate:-4px 0; } 80% { translate:2px 0; } }
#fight .fx-heal img, #fight .mates .m.fx-heal { filter:brightness(1.4) drop-shadow(0 0 10px #7CF0B0); }
#fight .foe.fx-ko img { animation:fxKo .6s ease-in forwards; }
@keyframes fxKo { 0% { opacity:1; } 30% { filter:brightness(3); } 100% { opacity:.25; transform:translateY(18px) scaleY(.85); filter:grayscale(1) brightness(.6); } }
#fight.fx-quake { animation:fxQuake .32s linear; }
@keyframes fxQuake { 25% { translate:0 4px; } 50% { translate:-3px -2px; } 75% { translate:2px 2px; } }
#fight .foe .bar i, #fight .mates .bar i { transition:width .35s ease-out; }
#foes .foe { animation:fxIn .45s ease-out backwards; } #foes .foe:nth-child(2) { animation-delay:.08s; } #foes .foe:nth-child(3) { animation-delay:.16s; }
@keyframes fxIn { from { opacity:0; transform:translateY(-14px); } }
@media (prefers-reduced-motion:reduce) {
  #fight .fx-hit img, #fight .mates .m.fx-hit, #fight.fx-quake, #fight .foe.fx-act img, #foes .foe { animation:none; }
  #fight .foe.fx-ko img { animation:none; opacity:.25; }
}`;

const SLASH = new Set(["kogeki", "waza"]);   // 斬る（体で 当てる）技。ほかは 術の 光の 輪
const wait = (ms, st) => new Promise((ok) => { if (st.fast) return ok(); const t = setTimeout(ok, ms); st.wake.push(() => { clearTimeout(t); ok(); }); });

export function playTurnFx(root, evs, o) {
  if (!document.getElementById("crawler-fx-css")) { const s = document.createElement("style"); s.id = "crawler-fx-css"; s.textContent = CSS; document.head.appendChild(s); }
  let lay = root.querySelector(":scope > .fxl"); if (!lay) { lay = document.createElement("div"); lay.className = "fxl"; root.appendChild(lay); }
  const st = { fast: false, wake: [] };
  const ff = () => { st.fast = true; st.wake.splice(0).forEach((f) => f()); };
  root.addEventListener("pointerdown", ff, { once: true });   // 押すと 早送り（結果は 同じ）
  const R = root.getBoundingClientRect();
  const elOf = (i) => (i < o.n ? root.querySelector(`.mates .m[data-i="${i}"]`) : root.querySelector(`.foe[data-i="${i}"]`));
  const center = (i) => { const el = elOf(i), t = el && (el.querySelector("img") || el); if (!t) return { x: R.width / 2, y: R.height / 2, w: 80, foot: R.height / 2 }; const r = t.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height * (i < o.n ? 0.35 : 0.45), w: r.width, foot: r.top - R.top + r.height * (i < o.n ? 0.85 : 0.9) }; };
  const G = engine(lay, root);
  const fx = (name, c, opt) => G.spawn(name, c.x, c.foot, opt);   // 絵の エフェクト（足もとに 置く。読めない ときは false）
  const add = (cls, x, y, text, style = "") => { const d = document.createElement("div"); d.className = cls; d.style.cssText = `left:${x}px;top:${y}px;${style}`; if (text != null) d.textContent = text; lay.appendChild(d); setTimeout(() => d.remove(), 1500); return d; };
  const pulse = (el, cls, ms) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
  const bar = (i) => { const el = elOf(i), b = el && el.querySelector(".bar:not(.mp) i"); if (b) b.style.width = `${(100 * Math.max(0, o.hp[i])) / o.maxHp[i]}%`; const s = el && el.querySelector(".st"); if (s && i < o.n) s.textContent = s.textContent.replace(/^-?\d+/, String(Math.max(0, Math.round(o.hp[i])))); };

  return (async () => {
    for (const e of evs) {
      if (e.log) o.onLog?.(e.log);
      const me = e.who, side = me < o.n;
      if (e.kind === "skip") { const c = center(me); add("fx-num stun", c.x, c.y, "動けない"); await wait(380, st); continue; }
      pulse(elOf(me), "fx-act", 340);
      if (e.skill && !["kogeki", "bougyo"].includes(e.skill)) { const nm = o.skillName?.(e.skill); if (nm) add("fx-banner", 0, 0, nm).style.left = "50%"; }
      await wait(200, st);
      // 相手：1 対 1 の 戦いでは 出来事に tgt が ない → 反対側の 生きて いる 先頭（混乱で 自分に 使った ときは 自分）
      const self = (e.notes || []).some((x) => /自分に/.test(x)) || /自分に/.test(e.log || "");
      const opp = () => { const ids = o.hp.map((_, i) => i).filter((i) => (i < o.n) !== side); return ids.find((i) => o.hp[i] > 0) ?? ids[0]; };
      const hits = e.hits || [], t = e.tgt ?? (self ? me : opp());
      for (let k = 0; k < hits.length; k++) {
        const h = hits[k], to = h.tgt ?? t; if (to == null) continue;
        const c = center(to), mate = to < o.n;
        if (h.miss) { add("fx-num miss", c.x, c.y, "MISS"); }
        else if (h.blocked) { add("fx-num miss", c.x, c.y, "BLOCK"); fx("impacts/shield-block", c, { flip: mate }); }
        else {
          const col = e.kind === "itazura" ? "#C9A2FF" : SLASH.has(e.skill) || SLASH.has(e.kind) ? (h.crit ? "#FFD24A" : "#FFE9B0") : "#7FB6E8";
          const flip = { flip: mate || k % 2 === 1 }, main = k === 0 ? hitFx(e) : (e.hits.length > 1 ? "impacts/hit-spark" : null);
          const okFx = main ? await fx(main, c, flip) : true;
          if (h.crit) fx("impacts/crit-hit", c, flip); else if (k > 0 || main !== "impacts/blunt-hit") fx("impacts/hit-spark", c, { ...flip, height: Math.round((c.foot - c.y) / PX) });
          if (!okFx) { if (SLASH.has(e.skill) || SLASH.has(e.kind)) add("fx-slash", c.x - c.w * 0.45, c.y, null, `width:${c.w * 0.9}px;--fx-c:${col};rotate:${k % 2 ? 28 : -28}deg`); else add("fx-ring", c.x, c.y, null, `--fx-c:${col}`); }
          pulse(elOf(to), "fx-hit", 300);
          if (h.crit || (mate && h.dmg >= o.maxHp[to] * 0.25)) pulse(root, "fx-quake", 340);
          add(`fx-num${h.crit ? " crit" : ""}${mate ? " mate" : ""}`, c.x + (k % 2 ? 18 : -10), c.y - k * 6, String(h.dmg));
          const was = o.hp[to]; o.hp[to] = Math.max(0, o.hp[to] - (h.dmg || 0)); bar(to);
          if (was > 0 && o.hp[to] <= 0 && !mate) { pulse(elOf(to), "fx-ko", 4000); fx("spawn/shatter-death", c); }
        }
        await wait(170, st);
      }
      if (e.heal) {
        const to = t != null && (t < o.n) === side ? t : me, c = center(to);
        if (!(await fx("holy/heal", c))) for (let k = 0; k < 4; k++) add("fx-dot", c.x - 24 + k * 16, c.y + 10, null, `animation-delay:${k * 70}ms`);
        add("fx-num heal", c.x, c.y - 4, `+${e.heal}`); pulse(elOf(to), "fx-heal", 500);
        o.hp[to] = Math.min(o.maxHp[to], o.hp[to] + e.heal); bar(to);
      }
      const tags = (e.tags || []).filter((x) => EFFECTS[x]);
      tags.forEach((x, k) => { const buff = EFFECTS[x].buff, to = buff ? (t != null && (t < o.n) === side ? t : me) : t ?? me, c = center(to); add(`fx-num tag ${buff ? "buff" : "debuff"}`, c.x, c.y - 30 - k * 22, EFFECTS[x].label); if (k < 2) fx(statusFx(x), c); });
      await wait(260 + hits.length * 40, st);
    }
    if (o.over) { const win = o.over === "win"; add("fx-end", R.width / 2, R.height * 0.38, win ? "VICTORY" : "DOWN", `color:${win ? "#E8C25A" : "#E5484D"}`); await wait(900, st); }
    root.removeEventListener("pointerdown", ff);
  })();
}
