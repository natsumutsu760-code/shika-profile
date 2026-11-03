// 敵の スキルツリーを 書く 道具（enemy-trees.js と 配合限定の ランクごとの ファイル enemy-trees-fusion-*.js が 使う）
import { EFFECTS } from "./effects.js";

const SL = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", int: "INT", res: "RES", agi: "AGI", dex: "DEX", luk: "LUK" };
const NUM = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
// ---------- 効果の書き方（短く）----------
export const D = (pow, o = {}) => ({ t: "dmg", pow, ...o });                                       // ダメージ
export const F = (id, a, o = {}) => ({ t: "fx", id, who: "foe", ...(typeof a === "number" && EFFECTS[id].dur === "stack" ? { amt: a } : a != null ? { turns: a } : {}), ...o });   // 相手に
export const M = (id, a, o = {}) => ({ t: "fx", id, who: "me", ...(typeof a === "number" && EFFECTS[id].dur !== "turn" && EFFECTS[id].dur !== "once" ? { amt: a } : a != null ? { turns: a } : {}), ...o });   // 自分に
export const H = (pct) => ({ t: "heal", pct }), CURE = { t: "cure" }, DIS = (n) => ({ t: "dispel", n }), MPD = (n) => ({ t: "mpDrain", n }), SH = (pct) => ({ t: "shield", pct });

// fx から説明文を作る
export function describe(fx) {
  const out = [];
  for (const x of fx) {
    if (x.t === "dmg") {
      let s = x.consume ? `${EFFECTS[x.consume].label}をはじけさせる。威力 ${x.pow}` : `威力 ${x.pow}`;
      if (x.hits) s += ` × ${x.hits}`;
      if (x.stat) s += `（${SL[x.stat]}）`;
      if (x.perAmt) s += `、${EFFECTS[x.consume].label}の量 ${Math.round(1 / x.perAmt)} につき威力 +1`;
      if (x.perTurn) s += `、残りターン 1 につき威力 +${x.perTurn}`;
      if (x.burst) s += `、残りの${EFFECTS[x.consume].label}のダメージを一度に与える`;
      if (x.ignore) s += x.ignore >= 1 ? "。相手の守りを無視" : `。相手の守りを ${Math.round(x.ignore * 10)} 割無視`;
      if (x.sure) s += "。かならず当たる";
      if (x.vsFx) s += "。" + Object.entries(x.vsFx).map(([id, v]) => `${EFFECTS[id].label}の相手には ${v >= 1 ? `${v + 1} 倍` : `+${Math.round(v * 100)}%`}`).join("・");
      if (x.drain) s += `。与えたダメージの ${Math.round(x.drain * 100)}% を回復`;
      if (x.recoil) s += `。与えたダメージの ${Math.round(x.recoil * 100)}% を自分も受ける`;
      out.push(s);
    } else if (x.t === "fx") {
      const E = EFFECTS[x.id], who = x.who === "me" ? "自分に" : "";
      let s = `${who}${E.label}${x.amt != null ? ` +${x.amt}` : ""}${x.turns != null ? `（${x.turns} ターン）` : ""}`;
      if (x.id === "counter" && x.amt) s = `カウンター（受けた直接ダメージの ${x.amt}% を返す）`;
      if (x.chance) s = `${Math.round(x.chance * 100)}% で${s}`;
      if (x.atLeast) s = `${EFFECTS[x.atLeast.id].label}が ${x.atLeast.n} 以上なら${s}`;
      if (x.ifConsumed != null) s = `はじけさせたら${s}`;
      if (x.ifCrit) s = `会心のとき${s}`;
      out.push(s);
    } else if (x.t === "heal") out.push(x.pct >= 1 ? "HP を全回復" : `HP を ${Math.round(x.pct * 100)}% 回復`);
    else if (x.t === "cure") out.push("浄化（自分のデバフを全部消す）");
    else if (x.t === "dispel") out.push(x.n >= 99 ? "相手のバフを全部消す" : `相手のバフを ${NUM[x.n]} つ消す`);
    else if (x.t === "mpDrain") out.push(`相手の MP −${x.n}`);
    else if (x.t === "shield") out.push(`シールド（最大 HP の ${Math.round(x.pct * 100)}%）`);
  }
  return out.join("。");
}

// 技とパッシブ（slot は S1〜S8・P1〜P7。S4・S5 と S6・S7 は分岐の左右）
export const S = (n, id, name, kind, mp, fx, o = {}) => ({ slot: `S${n}`, id, name, kind, mp, fx, text: describe(fx), ...o });
export const P = (n, id, name, text, p) => ({ slot: `P${n}`, id, name, kind: "passive", text, p });
export const G = (cond, v, skill) => ({ if: v === undefined ? [cond] : [cond, v], do: skill });
