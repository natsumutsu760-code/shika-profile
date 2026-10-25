// 英語の 訳し方（lounge-en.js の 中身。画面の ない node の 試験でも 使えるように 分けた）
// 辞書の 引き方：① そのまま ② 数字を # に して（「装備 300 こ」も「装備 500 こ」も「装備 # こ」）③ 形の 決まり（正規表現）④ かっこ・記号を はずして ⑤「・」などで 分けて
export const JA = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const NUM = /\d[\d,]*(?:\.\d+)?/g;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
let W = null, RULES = [];
export const setDict = (words, rules) => { W = words; RULES = rules || []; };
export const hasDict = () => !!W;

// 数字を # に した 形の 答えに、数字を もどす（# は 順に。#1・#2 は 何番目か）
const fill = (v, nums) => { let i = 0; return v.replace(/#(\d)?/g, (_, d) => (d ? nums[d - 1] : nums[i++]) ?? ""); };
function look(k, wordsOnly) {
  if (own(W, k)) return W[k];
  const nums = [], n = k.replace(NUM, (m) => (nums.push(m), "#"));
  if (nums.length && own(W, n)) return fill(W[n], nums);
  if (wordsOnly) return null;
  for (const [re, to] of RULES) {
    const m = k.match(re); if (!m) continue;
    const r = typeof to === "function" ? to(m, part) : k.replace(re, to);
    if (r != null) return r;
  }
  return null;
}
// 決まりの 中で 使う：日本語の ない 所は そのまま、ある 所は 訳す（訳せなければ null）
export const part = (s) => (s == null ? null : JA.test(s) ? tr(s) : String(s).trim());
// まわりの 記号（かっこ・コロン など）は 英語の 記号に して、中だけ 引く
const PUNCT = { "（": "(", "）": ")", "「": "“", "」": "”", "『": "“", "』": "”", "【": "[", "】": "]", "［": "[", "］": "]", "：": ": ", "、": ", ", "。": ". ", "！": "!", "？": "?", "・": " · ", "／": " / ", "〜": "~" };
const EDGE = /^([\s（「『【［(\[・／:：〜…—–>＞▶▸★☆✓✔✕×+＋−\-]*)(.*?)([\s）」』】］)\]：:、。！？!?…〜／]*)$/;
const pmap = (s) => s.replace(/[（）「」『』【】［］：、。！？・／〜]/g, (c) => PUNCT[c]);
// 訳す（訳せないときは null）
export function tr(s) {
  if (!W || s == null) return null;
  const k = String(s).replace(/[^\S\u3000]+/g, " ").replace(/^[\s\u3000]+|[\s\u3000]+$/g, ""); if (!k || !JA.test(k)) return null;
  let r = look(k, true); if (r != null) return r;
  // 文が 2 つ 以上 ある ときは、先に 文（。）で 分ける（決まりの「(.+)で ねた」が 前の 文まで 名前と 見なさない ように）
  for (const [test, sep] of [[/。\s*\S/, /(?<=。)\s*/], [/\S\u3000+\S/, /\u3000+/]]) {   // 全角の 空白（戦いの 記録の 区切り）も 同じ
    if (!test.test(k)) continue;
    const out = k.split(sep).filter(Boolean).map((x) => (JA.test(x) ? tr(x) : x.trim())); if (out.every((x) => x != null)) return out.join(" ").replace(/\s+/g, " ").trim();
  }
  r = look(k); if (r != null) return r;
  const e = k.match(EDGE);
  if (e && (e[1] || e[3]) && e[2] && JA.test(e[2])) { const c = tr(e[2]); if (c != null) return pmap(e[1]) + c + pmap(e[3]); }   // 「・友好 ＋15」→「 · Rapport +15」（前の 字との 間の 空白も のこす）
  // 文の 区切り・「・」「、」「／」・空白で 分けて、ぜんぶ 訳せたら つなぐ（名前の ならび・日記 など）
  for (const [sep, join] of [[/(?<=。)\s*/, " "], ["　", " "], ["・", " · "], ["、", ", "], [" ／ ", " / "], ["／", " / "], [" ", " "]]) {
    const parts = k.split(sep); if (parts.length < 2) continue;
    const out = parts.map((p) => (JA.test(p) ? tr(p) : p.trim()));
    if (out.every((x) => x != null)) return out.join(join).replace(/\s+/g, " ").trim();
  }
  return null;
}
