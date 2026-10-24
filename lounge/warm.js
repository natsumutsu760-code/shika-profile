// 読みこむ ときに 1 回だけ、小さな 派遣を 計算して おく（温める）
// JavaScript は はじめて 動かす ところが おそい（派遣の 計算で 3〜4 倍）。Cloudflare の 無料の プランは 1 回 10 ミリ秒までなので、
// 1 人目の 計算が おそい 1 回目に ならない ように、はじまる ときに すませて おく（はじまる ときの 上限は べつ。この PC で 40 ミリ秒くらい）
// ダンジョンの 地図（5 か所 × 5 階）も ここで 作って おく（1 まい 1 ミリ秒くらい。いちど 作れば おぼえて いる）
import { tripInit, tripStep, tripResult, tamedOf, petAt, floorMap, DUNGEONS, FLOORS } from "./game.js";

try {
  for (const d of DUNGEONS) for (let n = 1; n <= FLOORS; n++) floorMap(d.id, n);
  const d = DUNGEONS[0], eq = [{ base: "straw", star: 3, ops: ["hp", "evade", "dmgCut"] }, { base: "gold", star: 5, ops: ["hp", "endure", "focusStart", "crit", "drain"] }];
  const party = [{ ...petAt("healer", 8), name: "warm", lv: 8, equip: eq }, tamedOf(d.foes[0], 8, eq), tamedOf(d.foes[1], 8, eq)];
  const S = JSON.parse(JSON.stringify(tripInit(party, d.id, "long", 1, { lite: true })));
  while (!tripStep(S, 2));
  tripResult(S);
} catch (e) { /* 温めは なくても 動く */ }
