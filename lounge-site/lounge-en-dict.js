// 英語の 辞書（lounge-en.js が 英語の ときだけ 読み込む。鹿さんの頼み、2026-10-25）
// WORDS：画面の 日本語（前後の 空白を とった 形）→ 英語。数字は # に して 書く（「装備 # こ」）。答えの #1・#2 は 何番目の 数字か
// RULES：形の 決まり [正規表現, 答え]。答えが 関数なら (m, p) を もらう。p(文字) は 日本語なら 訳す（訳せないと null）・ほかは そのまま
//   人が つけた 名前は 訳せないので p(x) || x で そのまま 出す。null を かえすと 次の 決まりへ
// ゲームの 名前（素材・敵・技 など）は lounge-en-names.js、画面の 文は ページごとの ファイル
import { nameWords, PET_EN } from "./lounge-en-names.js";
import { PETS } from "./quiz.js";
import * as UI from "./lounge-en-ui.js";
import * as TRIP from "./lounge-en-trip.js";
import * as PET from "./lounge-en-pet.js";
import * as BASE from "./lounge-en-base.js";
import * as ARENA from "./lounge-en-arena.js";
import * as DL from "./lounge-en-dl.js";
import * as SRV from "./lounge-en-srv.js";

const pages = [SRV, UI, TRIP, PET, BASE, DL, ARENA];   // せまい 決まりの 多い 順（闘技場の「X は Y」は いちばん 広いので 最後）
export const WORDS = Object.assign({}, nameWords(), ...pages.map((x) => x.WORDS));

// ペットの 名前と しゅるい（「ペリカンのポスケ」→「Posuke the Pelican」）
const SP = Object.values(PETS).map((p) => p.label).join("|"), PN = Object.fromEntries(Object.entries(PETS).map(([id, p]) => [p.name, (PET_EN[id] || [])[0]]));
export const RULES = [
  ...pages.flatMap((x) => x.RULES || []),
  [new RegExp(`^(${SP})の(.+)$`), (m, p) => `${PN[m[2]] || m[2]} the ${p(m[1])}`],
  // 「名前（状態）」：両方 訳せる とき
  [/^(.+?)（(.+)）$/, (m, p) => { const b = p(m[2]), a = p(m[1]) ?? (/^[^\s　（）]{1,12}$/.test(m[1]) ? m[1] : null); return a != null && b != null ? `${a} (${b})` : null; }],   // 名前（人が つけた 名前は そのまま）
  // 「名前 ★3」「名前 ×5」「名前 Lv12」
  [/^(.+?) ?([★×]\d+|Lv ?\d+)$/, (m, p) => { const a = p(m[1]); return a != null ? `${a} ${m[2]}` : null; }],
];
