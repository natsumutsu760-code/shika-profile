// 集合住宅の 住人の 暮らし（2026-11-18 2 代目。鹿さんの カード「住人の暮らしを門番へ」・M-050）
// 門番（lounge-server/lounge-td.js）と 画面（td.html）が 同じ 式で 数える：1 日の 予定・となりの 部屋・話す 時刻・子の 種類と Lv
// three を 使わない（node・門番・ブラウザで 動く）。数は td-numbers.js の LIFE・WORK_HOURS
import { WORK_HOURS, LIFE } from "./td-numbers.js";
import { mixOf, TD_MIX } from "./td-mix.js";
const MIX_PAR = Object.fromEntries(Object.entries(TD_MIX).map(([k, [id]]) => [id, k.split("|")]));   // まざった 子 → 親 2 種（表から 逆に 引く）
import { makeChild, skillOptions } from "./fusion.js";
import { ENEMY_TREES } from "./enemy-trees.js";   // 子の 受けつぎは 配合と 同じ 式（2026-11-18 鹿さんの カード「配合と同じ」「自動」）

// 決まった ゆらぎ（見本の td.html と 同じ 式。住人ごとに 起きる・出かける・帰る・寝る 時刻が 少し ちがう）
const hash = (a, b, c = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };
export const sh = (str, n) => { let v = 7 + n * 131; for (const c of String(str)) v = (v * 31 + c.charCodeAt(0)) % 100003; return hash(v * 0.017, n * 1.7, 3); };
// 1 日の 予定（分）。seed は「r:部屋の 鍵」・wk は 仕事の 種類（見回りは 夜に 出て 朝 帰り、昼に 寝る）
export function planOf(seed, wk) {
  const [g, b] = WORK_HOURS[wk] || WORK_HOURS.力仕事;
  if (g > b) return { night: true, wake: 900 + Math.floor(sh(seed, 1) * 60), sleep: 420 + Math.floor(sh(seed, 2) * 60), go: g * 60 + Math.floor(sh(seed, 4) * 30), back: b * 60 + Math.floor(sh(seed, 5) * 60) };
  return { wake: 360 + Math.floor(sh(seed, 1) * 90), sleep: 1290 + Math.floor(sh(seed, 2) * 90), go: g * 60 + Math.floor(sh(seed, 4) * 45), back: b * 60 + Math.floor(sh(seed, 5) * 90) };
}
// その 時刻（分）の 様子：在宅・ねている・仕事中
export function stateAt(p, m) {
  if (p.night) return m >= p.go || m < p.back ? "仕事中" : m >= p.sleep && m < p.wake ? "ねている" : "在宅";
  return m < p.wake || m >= p.sleep ? "ねている" : m >= p.go && m < p.back ? "仕事中" : "在宅";
}
// その 日の 予定の できごと（日記 用。分の 早い 順）
export function dayEvents(p) {
  const ev = p.night ? [[p.back, "仕事から 帰った"], [p.sleep, "ねた"], [p.wake, "起きた"], [p.go, "仕事に 出かけた"]] : [[p.wake, "起きた"], [p.go, "仕事に 出かけた"], [p.back, "仕事から 帰った"], [p.sleep, "ねた"]];
  return ev.sort((a, b) => a[0] - b[0]);
}
// 日本時間
const JST = 9 * 3600000;
export const jstMin = (t) => Math.floor(((t + JST) % 86400000) / 60000);   // その 日の 何分目
export const jstDayOf = (t) => Math.floor((t + JST) / 86400000);
// a より あと・b まで の 話す 時刻（ミリ秒）。古い 順
export function slotTimes(a, b) {
  const out = [];
  for (let d = jstDayOf(a); d <= jstDayOf(b); d++) for (const m of LIFE.slots) { const t = d * 86400000 - JST + m * 60000; if (t > a && t <= b) out.push(t); }
  return out;
}
// となりの 部屋の 組（同じ 箱・同じ 階・番目が となり）。keys は 住人の いる 部屋の 鍵（「箱-階-番目」）
export function pairsOf(keys) {
  const set = new Set(keys), out = [];
  for (const k of keys) { const [bl, f, n] = k.split("-"); const nx = `${bl}-${f}-${+n + 1}`; if (set.has(nx)) out.push([k, nx]); }
  return out;
}
export const bondKeyOf = (a, b) => [a, b].sort().join("|");
// 子：同じ ランク・同じ 系統の 決まった 組は まざった 子（td-mix.js）・ほかは 親の どちらかの 種類。Lv は 親 2 匹の 平均の 半分。両方が 自分の 子なら 自分の 子
// 〔決〕まざった 子（td-mix.js の 246 体）は 親の ツリーの まま：戦いと 受けつぎは 親の ツリーを 土台（tree）・絵と 名前は まざった 子（tdMix）（2026-11-18 鹿さんの カード「親のツリーのまま」「まざった子の絵」）
export function kidOf(A, B, r) {
  const mx = mixOf(A.id, B.id), base = mx ? { id: mx[0], name: mx[1] } : r < 0.5 ? { id: A.id, name: A.name } : { id: B.id, name: B.name };
  const tree = ENEMY_TREES[base.id] ? base.id : [A.id, B.id].sort().find((id) => ENEMY_TREES[id]) || A.id;
  return { ...base, tree, par: [A.id, B.id], lv: Math.max(1, Math.round(((A.lv || 1) + (B.lv || 1)) / 4)), mine: !!(A.uid && B.uid) };
}
// 戦いの ツリー（住人・子）：受けついだ 物の tree → 自分の 種類 → 親の ツリー
export const treeOfRes = (r) => (r.kin && r.kin.tree) || (ENEMY_TREES[r.id] ? r.id : (r.par || MIX_PAR[r.id] || []).slice().sort().find((id) => ENEMY_TREES[id])) || r.id;
// 受けつぎ（配合と 同じ）：サブスキル 2 つ（候補は skillOptions・ゆらぎで 自動）・受けついだ 力 inh・＋値・スキルポイント。Lv は 集合住宅の 決まり（親の 平均の 半分）
// A・B は 親の 形 { tree, type, lv, name, plus?, inh?, subs?, sp?, carry? }（自分の 子は なかまの 記録、NPC は 住人の 記録 ＋ kin）。R は 0〜1 の くじ
export function kidInherit(A, B, childTree, lv, R, uid) {
  const opts = skillOptions(A, B, childTree).map((o) => o.id), subs = [];
  while (subs.length < 2 && opts.length) subs.push(opts.splice(Math.floor(R() * opts.length), 1)[0]);
  const c = makeChild(A, B, childTree, subs, R, uid); if (!c) return null;
  c.lv = lv; return c;
}
// 住人の 記録に のこす 分（戦いの 強さ：tamedOf({ ...kin, tree, type, lv, name })）
export const kinOf = (c) => (c ? { tree: c.tree, plus: c.plus || 0, inh: c.inh || {}, subs: c.subs || [], sp: c.sp || {}, carry: c.carry || 0, gen: c.gen || 1 } : null);
// 親の 形（NPC の 住人）。住人の 型は 日本語（門番の TYPES）なので 戦いの 式の 英語に 直す
export const TYPE_EN = { アタッカー: "attacker", ディフェンダー: "defender", テクニシャン: "technician", キャスター: "caster", ヒーラー: "healer" };
export const parentOf = (r) => ({ type: TYPE_EN[r.type] || r.type || "attacker", lv: r.lv || 1, name: r.name, ...(r.kin || {}), tree: treeOfRes(r) });
