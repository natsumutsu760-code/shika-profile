// クローラーの コマンドの 戦い（資料 docs/mono-link-crawler-battle.md）。three を 使わない（node でも 動く）
// 計算は 自動戦と 同じ battle-sim.js の simulateTeams。毎ターン、それまでの コマンドを 全部 渡して 最初から 計算しなおし（opts.pick・opts.until）、
// 同じ 種なら 同じ 結果に なる。新しい 数は 作らない（ダメージ・命中・状態は ぜんぶ 自動戦の 決まり）
//   const B = newBattle({ party, foes, seed, items });   // party・foes は petAt／foeOf の 形（startHp・startMp で 持ちこし）
//   commit(B, { 0: { id: "kogeki" } });                    // 番号ごとの コマンド（null・なしは ガンビット／オート）→ B.turnEv（この ターンの 出来事）・B.now（いまの HP など）・B.over
import { simulateTeams, usable, mpCost, makeFighter } from "./battle-sim.js";
import { SKILL } from "./skills.js";
import { foeOf } from "./dungeon-sim.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { petAt } from "./builds.js";
import { MAIN_TREES } from "./main-trees.js";

// ---- クローラーの 薬（鹿さんの 決め、2026-10-30。MLV メルヴィル製薬の 製品。HP の 回復と 起こすだけ）----
export const CRAWL_ITEMS = {
  mlv_patch_s: { name: "メルヴィル外傷パッチ S", text: "HP を 3 割 回復", fx: [{ t: "heal", pct: 0.3 }] },
  mlv_patch_m: { name: "メルヴィル外傷パッチ M", text: "HP を 6 割 回復", fx: [{ t: "heal", pct: 0.6 }] },
  mlv_patch_l: { name: "メルヴィル外傷パッチ L", text: "HP を ぜんぶ 回復", fx: [{ t: "heal", pct: 1 }] },
  mlv_revive: { name: "メルヴィル蘇生アンプル", text: "力つきた 味方を HP 3 割で 起こす（戦いの 中でも あとでも）", fx: [{ t: "revive", pct: 0.3 }], down: true },
};
for (const [id, it] of Object.entries(CRAWL_ITEMS)) SKILL[id] ??= { id, name: it.name, kind: "item", group: "薬", mp: 0, fx: it.fx, text: it.text, type: null, item: true };
// その場の しかけ（修理・爆薬・端末）：戦いの 行動の かわりに 使う（鹿さんの 決め）。戦いの 中では 何も しない 1 手で、しかけは 迷宮の 側で はたらく
SKILL.c_field ??= { id: "c_field", name: "その場の しかけ", kind: "waza", mp: 0, fx: [], text: "戦いの 行動の かわりに しかけを 使う", type: null };
export const BRING_MAX = 5; // 持ちこみは 1 人 5 こまで（鹿さんの 決め）

// ---- 戦う 子を 作る ----
// プレイヤーの ペット：メインの ツリー（type）の Lv の お手本（分岐は 左）。名前と 種類を そえる
// subs：サブツリー [[ツリーの id, SP]]（解析 100% の 精鋭の ツリー など。crawler-elite-trees.js を 読みこんで おく）
export const playerPet = (type, lv, name, subs = []) => ({ ...petAt(type, lv, { species: MAIN_TREES[type].pet, subs }), name, lv, species: MAIN_TREES[type].pet, owner: "あなた" });
// 傭兵・味方の LINKER（ペットの 種類から ツリーを 引く）。強さは プレイヤーに 合わせる（いっしょに 行く 人の Lv の 9 割。鹿さんの 決め）
export const typeOfPet = (pet) => Object.keys(MAIN_TREES).find((k) => MAIN_TREES[k].pet === pet) ?? "drowsy";
export const linkerPet = (pet, lv, name, owner = "LINKER") => ({ ...petAt(typeOfPet(pet), lv, { species: pet }), name, lv, species: pet, owner });
// 制御された モンスター（ユニット）：ドット絵の 名前＝敵の ツリー
export const unitOf = (sprite, lv, name) => {
  const T = ENEMY_TREES[sprite];
  if (!T) throw new Error(`敵の ツリーが ない：${sprite}`);
  return { ...foeOf({ tree: sprite, type: T.type, lv, name: name ?? T.enemy }), sprite };
};

// ---- 戦い ----
export function newBattle({ party, foes, seed = 1, items = null, elite = false }) {
  return { party, foes, seed, items: items ? { ...items } : null, elite, picks: [], turn: 0, turnEv: [], ev: [], now: null, over: null, first: null };
}
const run = (B, until) => simulateTeams(B.party, B.foes, B.seed, { pve: true, until, items: B.items ? { ...B.items } : null, pick: (i, f, tgt, turn) => B.picks[turn - 1]?.[i] ?? null });
// はじめの ようす（だれも 動く 前）
export function look(B) {
  const ev = run(B, 0), st = ev[0], fin = ev[ev.length - 1].final;
  B.fighters = st.fighters; B.now = fin;
  return B;
}
// コマンドを 入れて 1 ターン 進める
export function commit(B, cmds) {
  B.picks.push(cmds || {});
  B.turn += 1;
  const ev = run(B, B.turn), end = ev[ev.length - 1];
  B.ev = ev; B.fighters = ev[0].fighters;
  B.turnEv = ev.filter((e) => e.type === "act" && e.turn === B.turn);
  B.now = end.final;
  const side = (i) => (i < B.party.length ? 0 : 1); // 1 対 1 の 記録には side が 付かないので 番号で
  const dead = (s) => B.fighters.every((_, i) => side(i) !== s || B.now[i].hp <= 0);
  B.over = dead(1) ? "win" : dead(0) ? "lose" : null;
  B.used = end.items || {};
  return B;
}
// 撤退（雑魚だけ。成否は AGI の くらべっこ。鹿さんの 決め）。味方の AGI の 高い 方と 敵の 高い 方
export function retreatChance(B) {
  if (B.elite) return 0;
  const n = B.party.length, agi = (s) => Math.max(...B.fighters.map((_, i) => ((i < n ? 0 : 1) === s && B.now[i].hp > 0 ? (i < n ? B.party[i] : B.foes[i - n]).stats.agi : 0)));
  const a = agi(0), b = agi(1);
  return Math.max(0.2, Math.min(0.9, 0.5 + (a - b) / Math.max(40, a + b)));
}
// コマンドの 一覧（攻撃・アビリティ・防御・アイテム）と 使えるか
// アビリティは ガンビットに 入って いる 技だけ（2026-11-05 鹿さんの 決め「クローラーのアビリティもガンビットに設定されているもの以外は表示しないようにしてください」）。攻撃・防御は いつでも
export function commandsOf(B, i) {
  const c = i < B.party.length ? B.party[i] : null;
  if (!c) return null;
  const f = makeFighter({ ...c, startHp: B.now?.[i]?.hp, startMp: B.now?.[i]?.mp }, 0);
  if (B.items) f.bag = B.items;
  const ok = (id) => !!SKILL[id] && usable(f, id), inG = new Set((c.gambits || []).filter((g) => g.on !== false).map((g) => g.do));
  return {
    attack: { id: "kogeki", ok: true },
    guard: { id: "bougyo", ok: true },
    abilities: (c.set || []).filter((id) => inG.has(id) && SKILL[id] && !SKILL[id].item && id !== "kogeki" && id !== "bougyo").map((id) => ({ id, name: SKILL[id].name, mp: mpCost(f, id), text: SKILL[id].text, ok: ok(id) })),
    items: Object.entries(B.items || {}).filter(([id, n]) => n > 0 && SKILL[id]).map(([id, n]) => ({ id, name: SKILL[id].name, n, text: SKILL[id].text, ok: !CRAWL_ITEMS[id]?.down || B.now.some((s, j) => j < B.party.length && j !== i && s.hp <= 0) })),   // 起こす 薬は 力つきた 味方が いる ときだけ
  };
}
export const skillName = (id) => SKILL[id]?.name ?? id;
