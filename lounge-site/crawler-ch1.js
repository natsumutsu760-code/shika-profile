// 第 1 章 REGISTRY の 先行体験版：15 本の 並び・目的の 決まり・迷宮の 中の 台詞（資料 docs/mono-link-story-ch1.md・mono-link-story-missions.md）
// 地図・場所・台本は crawler-ch1-data.js（ブリーフィングの JSON から 写した 物。tools/crawler-ch1.mjs）
// 数（敵の Lv・数・ターン）は 仮（2026-11-03 Claude。戦いの 長さの 目安「雑魚は 3〜4 ターン」と 今の 戦いの 計算が 合わない 件は 鹿さんに 聞く）
import { CH1_DATA } from "./crawler-ch1-data.js";
import { addFoe, say, note, finish, cellAt, stateAt, distOf, passable, DIRV, visibleFrom, liftTo } from "./crawler-game.js";
import { unitOf, linkerPet } from "./crawler-battle.js";

export const LV = { me: 50, unit: 40, pom: 45, elite: 48, merc: 45 }; // 仮の Lv（第 1 章の 帯は Lv 50〜。傭兵は プレイヤーの 9 割）
export const NEED = 9; // 1-15 が 開く 数（1-14 を ふくめて 1-01〜1-14 の うち 9 本。鹿さんの 決め）

// LINKER（精鋭）の 札（番付の 番号と 所属。エンブレムは 所属の 色）
export const LINKERS = {
  STOPWATCH: { pet: "pelican", code: "LNK-26", co: "linkers" },
  "NEW MOON": { pet: "kurage", code: "IND-32", co: null },
  "RABBIT HOLE": { pet: "shika", code: "CRV-31", co: "tcu" },
  SPLINT: { pet: "pelican", code: "GRN-25", co: "tcu" },
  BOOKMARK: { pet: "saboten", code: "CLR-30", co: "harmonia" },
  "ONE SHOE": { pet: "mouse", code: "ODH-29", co: "sva" },
  "GHOST NOTE": { pet: "tv", code: "???", co: "nox" },
};

// 精鋭の 台詞（戦いの 節目。docs/mono-link-crawler-elites.md の 4 場面：接敵 meet・戦闘中 fight・倒されたとき down・味方のとき ally）
// fall は「だれかが 力つきた とき」（foe：相手側が・mate：自分の 側が）。資料に まだ ないので Claude の 案（2026-11-04）。ときどき ランダムにも しゃべる（いまの 台詞から）
export const ELITE_LINES = {
  "ONE SHOE": { meet: "獲物だ！獲物だ！", fight: "待てない！行く！", down: "……師匠に、怒られる", ally: "先に行って見てくる！すぐ戻る！", fall: { foe: "一匹しとめた！次！", mate: "あっ、待って、置いてかないで！" } },
  SPLINT: { meet: "すみません、ここは通せない決まりなんです", fight: "師匠なら、ここで引かない", down: "……まだ、支えが甘かった", ally: "直すのは任せてください！支えます！", fall: { foe: "……すみません。仕事、なので", mate: "支えます、まだ立てます！" } },
  "GHOST NOTE": { meet: "死人に会うのは初めてか", fight: "生きてる奴は、うるさいな", down: "……また、死にそこねた", ally: "影は俺が歩く。お前は明るい所を行け", fall: { foe: "静かになったな", mate: "……先に行くなよ" } },
  STOPWATCH: { meet: "試験を始めます。手加減はしません", fight: "その判断、減点です", down: "……合格。次はもっと上で会いましょう", ally: "見学をかねて同行します。採点はしませんよ", fall: { foe: "一つ、処理", mate: "立ってください。記録は、まだ終わっていません" } },
  "RABBIT HOLE": { meet: "この先、通行止め！……なんてね、通さないけど", fight: "あと少し！あと3マス！", down: "……道を、まちがえた", ally: "近道知ってる！こっち！", fall: { foe: "一つ抜けた！道があいたよ！", mate: "だいじょうぶ！全員、連れて帰るから！" } },
  BOOKMARK: { meet: "き、記録を取らせていただきます", fight: "サンプル番号、控えました", down: "……記録、ここまでです", ally: "傭兵として同行します。邪魔はしません", fall: { foe: "……撃破、一。記録します", mate: "て、手当てします！動かないでください！" } },
  "NEW MOON": { meet: "やっと会えた。……同期、だよね", fight: "負けない、君には！", down: "……次は、僕が勝つ", ally: "同期のよしみだ。今日は組もう", fall: { foe: "一体！君より先だ！", mate: "まだだ、まだ終わってない！" } },
  "MODIFIED BOM": { fight: "―― 熱源、出力 上昇", fall: { foe: "―― 対象、沈黙" } },
};

// ---- 小さな 道具 ----
const at = (S, p) => S.me.x === p[0] && S.me.y === p[1];
const near1 = (S, p) => Math.abs(S.me.x - p[0]) + Math.abs(S.me.y - p[1]) <= 1;
const cells = (S, ch) => S.rows.flatMap((r, y) => [...r].map((c, x) => (c === ch ? [x, y] : null))).filter(Boolean);
const target = (S, ch, a) => (a.ch === ch ? [a.x, a.y] : a.here === ch ? [S.me.x, S.me.y] : null); // 前か 足もとの その 文字
const pick = (S, a) => a[Math.floor(S.R() * a.length)];
const adj = (S, ch) => [[0, -1], [1, 0], [0, 1], [-1, 0], [0, 0]].map(([dx, dy]) => [S.me.x + dx, S.me.y + dy]).filter(([x, y]) => cellAt(S, x, y) === ch); // となりか 足もとの その 文字
const squadOf = (S, n = 1) => Array.from({ length: n }, () => { const m = pick(S, S.def.monsters); return unitOf(m.sprite, LV.unit, m.name); });
const wave = (S, list, n, opts = {}) => list.map((p) => addFoe(S, { kind: "unit", x: p[0], y: p[1], name: "WAVE", sprite: S.def.monsters[0]?.sprite, squad: squadOf(S, n), move: "goto", to: S.def.map.goal, ...opts }));
const linker = (name, lv = LV.elite) => linkerPet(LINKERS[name].pet, lv, name, name);
const T = (S, who, text) => say(S, who, text, LINKERS[who]?.co ?? null);

// ---- 種類ごとの 決まり（目的・失敗・ボーナス） ----
// 共通：squad（見えない 雑魚の 部隊）・status（画面の 目的の 行）
const base = { squad: (S) => squadOf(S, 1) };

export const KINDS = {
  // 殲滅 TARGET UNIT（1-01）：POM と 護衛。護衛の 群れが 1 つ 崩れると POM が 出口へ 逃げる（足あと）。逃げきられたら 失敗
  target: {
    ...base,
    init(S) {
      const p = S.def.map.pom;
      S.obj.pom = addFoe(S, { kind: "pom", name: "REGULUS POM", pet: "beagle", co: null, x: p[0], y: p[1], move: "wait", squad: [linkerPet("beagle", LV.pom, "RGL-01", "REGULUS")] });
    },
    onMeet(S, f) { if (f === S.obj.pom) say(S, "REGULUS", "企業の新しい首輪か。……下がれ。お前と戦う理由はない"); },
    onWin(S, b) {
      if (b?.fixed && !S.obj.flee && S.obj.pom.alive) {
        S.obj.flee = true; const e = S.rows.flatMap((r, y) => [...r].map((c, x) => (c === "E" ? [x, y] : null))).find(Boolean);
        Object.assign(S.obj.pom, { move: "goto", to: e, trail: true, every: 2 });
        say(S, "REGULUS", "くそ、間に合わなかったか"); note(S, "POM が 出口へ 逃げはじめた");
      }
      if (b?.foe === S.obj.pom) { say(S, "REGULUS", "奪ったんじゃない。……止めに来たんだ。こいつらを、あの試験から"); finish(S, true, "POM を 倒した", S.obj.data); }
    },
    onFoeMove(S, f) { if (f === S.obj.pom && cellAt(S, f.x, f.y) === "E") finish(S, false, "POM が 出口から 逃げきった"); },
    onUse(S, a) { const it = S.def.map.item; if (it && !S.obj.data && (at(S, it) || (a.x === it[0] && a.y === it[1]))) { S.obj.data = true; note(S, "制御信号の 記録を 手に 入れた"); return; } return false; },
    status: (S) => [S.obj.pom.alive ? (S.obj.flee ? "逃げる POM を 止める" : "POM と 部隊を 倒す") : "完了", S.obj.data ? "制御信号の 記録 ✓" : "制御信号の 記録（端末）"],
  },
  // 制圧 SEIZE（1-02）：奥の 端末を 握って 規定の ターン 保つ。早く 握りきれば ボーナス
  seize: {
    ...base,
    init(S) { S.obj.hold = 0; S.obj.need = 5; T(S, "STOPWATCH", "見学をかねて同行します。採点はしませんよ。……今日以外は"); },
    onUse(S, a) {
      const t = target(S, "T", a); if (!t) return false;
      if (stateAt(S, ...t) !== "seized") { S.state[`${t[0]},${t[1]}`] = "seized"; S.obj.term = t; S.obj.from = S.turn; note(S, "端末を 占拠した"); wave(S, [[1, 1], [8, 1]], 1, { move: "chase" }); }
    },
    onTick(S) {
      if (!S.obj.term) return;
      if (near1(S, S.obj.term)) S.obj.hold += 1; else if (S.obj.hold > 0) { S.obj.hold = 0; T(S, "STOPWATCH", "その判断、減点です"); }
      if (S.obj.hold >= S.obj.need) {
        T(S, "STOPWATCH", "記録、終了。……悪くありません");
        say(S, "NEW MOON", "やっと会えた。……同期、だよね"); say(S, "NEW MOON", "僕も昨日、同じ試験を受けたんだ。厳しかったでしょ");
        finish(S, true, "端末を 握りきった", S.turn - S.obj.from <= S.obj.need + 3);
      }
    },
    status: (S) => [S.obj.term ? `端末の そばで 保つ ${S.obj.hold} / ${S.obj.need}` : "奥の 端末を 占拠する", "早く 握りきる（ボーナス）"],
  },
  // 運搬 DELIVERY・RELAY・FRAGILE（1-03・1-09・1-10）：荷を 持つと 足が 遅い（2 ターンで 1 歩）。HP が 3 割を 切ると 荷を 落とす
  delivery: {
    ...base,
    init(S) {
      S.obj.carry = !S.def.pickAt; S.obj.intact = true;
      for (const l of S.def.lines?.start ?? []) T(S, l[0], l[1]);
    },
    slow: (S) => !!S.obj.carry, // 荷を 持つ 方は 足が 遅く なる（ブリーフィングの 台本）
    onStep(S) {
      if (!S.obj.carry && S.obj.drop && at(S, S.obj.drop)) { S.obj.carry = true; S.obj.drop = null; note(S, "荷を 拾った"); }
      if (!S.obj.carry && S.def.pickAt && !S.obj.drop && !S.obj.got && at(S, S.def.pickAt)) { S.obj.carry = true; S.obj.got = true; note(S, "荷を 受け取った"); }
      for (const m of S.def.map.marks ?? []) if (at(S, m.at) && !S.flags[m.code]) { S.flags[m.code] = 1; const l = S.def.lines?.[m.code]; if (l) T(S, l[0], l[1]); }
      const goal = S.def.dropAt ?? S.def.map.goal;
      if (S.obj.carry && at(S, goal)) { for (const l of S.def.lines?.end ?? []) T(S, l[0], l[1]); finish(S, true, "荷を 届けた", S.obj.intact); }
    },
    afterBattle(S) {
      if (S.def.fragile && S.obj.carry && S.obj.hit) { finish(S, false, "原本が 撃たれた"); return; }
      const p = S.party[0];
      if (S.obj.carry && p.hp < p.maxHp * 0.3) { S.obj.carry = false; S.obj.drop = [S.me.x, S.me.y]; S.obj.intact = false; note(S, "荷を 落とした（その マスで 拾える）"); }
    },
    hiddenOk: (S) => !S.def.fragile, // 原本を 運ぶ ときは 見えない 雑魚と 会わない（戦いを 避けて 進める 道）
    status: (S) => [S.obj.carry ? "荷を 運ぶ（足が 遅い）" : S.obj.drop ? "落とした 荷を 拾う" : S.def.pickAt && !S.obj.got ? "荷を 受け取りに 行く" : "荷を 届ける", S.def.fragile ? "撃たれずに 運ぶ" : S.obj.intact ? "一度も 落とさない ✓" : "一度も 落とさない ✗"],
  },
  // 捜索 RECOVERY（1-04）：痕跡（h）を 調べて 手がかりを 集める → 試料の 場所が わかる → 持って 入口へ。手記は ボーナス
  recovery: {
    ...base,
    init(S) { S.obj.clue = 0; S.obj.need = cells(S, "h").length; },
    onUse(S, a) {
      const h = target(S, "h", a), it = S.def.map.item, g = S.def.map.goal;
      if (h && stateAt(S, ...h) !== "read") {
        S.state[`${h[0]},${h[1]}`] = "read"; S.obj.clue += 1; note(S, `手がかり ${S.obj.clue} / ${S.obj.need}`);
        if (S.obj.clue === 2 && !S.obj.rival) {
          const far = [14, 14]; S.obj.rival = addFoe(S, { kind: "elite", elite: true, name: "ONE SHOE", pet: "mouse", co: "sva", x: far[0], y: far[1], move: "chase", every: 2, squad: [linker("ONE SHOE")] });
          T(S, "ONE SHOE", "獲物だ！獲物だ！");
        }
        if (S.obj.clue >= S.obj.need) note(S, "試料の 場所が わかった（保管庫）");
        return;
      }
      if (it && !S.obj.notes && (at(S, it) || (a.x === it[0] && a.y === it[1]))) { S.obj.notes = true; note(S, "研究者の 手記を 回収した"); return; }
      if (g && S.obj.clue >= S.obj.need && !S.obj.got && (at(S, g) || (a.x === g[0] && a.y === g[1]))) { S.obj.got = true; note(S, "試料 MLV-118 を 回収した。入口へ もどる"); return; }
      return false;
    },
    onMeet(S, f) { if (f === S.obj.rival) T(S, "ONE SHOE", "その試料、うちが先に嗅ぎつけたんだ！"); },
    onWin(S, b) { if (b?.foe === S.obj.rival) T(S, "ONE SHOE", "……師匠に、怒られる"); },
    onStep(S) { if (S.obj.got && cellAt(S, S.me.x, S.me.y) === "S") finish(S, true, "試料を 持ち帰った", S.obj.notes); },
    status: (S) => [S.obj.got ? "入口へ 持ち帰る" : S.obj.clue >= S.obj.need ? "保管庫で 試料を 回収する" : `痕跡を 調べる ${S.obj.clue} / ${S.obj.need}`, S.obj.notes ? "研究者の 手記 ✓" : "研究者の 手記（キャビネット）"],
  },
  // 殲滅 NEST PURGE（1-05）：湧き点（N）が ある かぎり 敵が 湧く。湧き点を 壊しきる。奥の 鉱脈で 戦わなければ ボーナス
  nest: {
    ...base,
    init(S) { S.obj.vein = S.def.vein ?? []; S.obj.ok = true; },
    onTick(S) {
      const alive = cells(S, "N").filter((p) => stateAt(S, ...p) !== "dead");
      if (S.turn % 7 === 0 && S.foes.filter((f) => f.alive && f.kind === "unit").length < 2) for (const p of alive.slice(0, 1)) addFoe(S, { kind: "unit", x: p[0], y: p[1], name: "SPAWN", squad: squadOf(S, 1), move: "chase", every: 2 });
    },
    onUse(S, a) {
      const n = target(S, "N", a); if (!n || stateAt(S, ...n) === "dead") return false;
      S.obj.hit = n; S.battle = { kind: "unit", foes: squadOf(S, 1), first: null, nest: n };
    },
    onWin(S, b) {
      if (b?.nest) { S.state[`${b.nest[0]},${b.nest[1]}`] = "dead"; note(S, "湧き点を 壊した"); }
      if (S.obj.vein.some((p) => at(S, p))) S.obj.ok = false;
      if (cells(S, "N").every((p) => stateAt(S, ...p) === "dead")) finish(S, true, "巣を 根こそぎに した", S.obj.ok);
    },
    status: (S) => [`湧き点を 壊す ${cells(S, "N").filter((p) => stateAt(S, ...p) === "dead").length} / ${cells(S, "N").length}`, S.obj.ok ? "鉱脈を 傷つけない ✓" : "鉱脈を 傷つけない ✗"],
  },
  // 防衛 HOLD THE LINE・SURVIVAL（1-06・1-15）：持ち場に 着くと 波が 始まる。5 波。波の 合間は 1 ターン
  hold: {
    ...base,
    init(S) { S.obj.wave = 0; S.obj.waves = S.def.waves ?? 5; S.obj.breach = 0; for (const l of S.def.lines?.start ?? []) T(S, l[0], l[1]); },
    onTick(S) {
      const g = S.def.map.goal, live = S.foes.filter((f) => f.alive && f.wave);
      if (!S.obj.on && at(S, g)) { S.obj.on = true; note(S, "持ち場に 着いた。波が 始まる"); S.obj.gap = 0; }
      if (!S.obj.on) return;
      // 門（F）を 越えて 入って きたら 破られた
      for (const f of live) if (S.def.gate && S.def.gate.some((p) => f.x === p[0] && f.y === p[1]) && !at(S, g) && !f.breached && S.obj.fort > 0) { f.breached = true; S.obj.fort -= 1; f.stay = 2; note(S, `補強した 門が 持ちこたえた（補強 あと ${S.obj.fort}）`); }
      for (const f of live) if (S.def.gate && S.def.gate.some((p) => f.x === p[0] && f.y === p[1]) && !at(S, g) && !f.breached) { f.breached = true; S.obj.breach += 1; note(S, "門を 破られた"); if (S.def.gateFail) { finish(S, false, "門が 破られた"); return; } }
      if (live.length) return;
      if (S.obj.wave >= S.obj.waves) { for (const l of S.def.lines?.end ?? []) T(S, l[0], l[1]); finish(S, true, "波を 耐えきった", S.def.bom ? S.obj.bomDown : S.obj.breach === 0); return; }
      if ((S.obj.gap += 1) < 2) return; // 合間 1 ターン（回復の 薬だけ）
      S.obj.gap = 0; S.obj.wave += 1;
      const n = Math.min(S.def.map.entries.length, 1 + Math.floor((S.obj.wave - 1) / 2));
      const from = S.def.map.entries.slice(0, n);
      for (const f of wave(S, from, 1, { every: 2, walkF: true })) f.wave = S.obj.wave;
      note(S, `WAVE ${S.obj.wave} / ${S.obj.waves}`);
      if (S.def.bom && S.obj.wave === 4 && !S.obj.bom) {
        say(S, "LINKERS", "区画付近に高出力の熱源");
        T(S, "STOPWATCH", "……想定外です。試験は中止。生き残ってください"); T(S, "NEW MOON", "なんだよ、あれ……！");
        const p = S.def.map.entries[0];
        S.obj.bom = addFoe(S, { kind: "elite", elite: true, name: "MODIFIED BOM", sprite: "e_boss_gatekeeper", x: p[0], y: p[1], move: "goto", to: S.def.map.goal, every: 3, wave: S.obj.wave, squad: [{ ...unitOf("e_boss_gatekeeper", LV.elite, "MODIFIED BOM"), boss: true }] });
      }
    },
    onWin(S, b) { if (b?.foe && b.foe === S.obj.bom) S.obj.bomDown = true; },
    // その場：持ち場で 門を 補強（戦いの 行動の かわり。2 まで。補強が あると 門を 越えようと した 敵を 1 回 止めて 破られない。数は Claude の 仮）
    field: (S) => (S.def.gate && S.obj.on && (S.obj.fort ?? 0) < 2 ? { name: "門を 補強", text: "門を 越える 敵を 1 回 止める（2 まで）", run: () => { S.obj.fort = (S.obj.fort ?? 0) + 1; note(S, `門を 補強した（${S.obj.fort} / 2）`); } } : null),
    hiddenOk: (S) => !S.obj.on,
    status: (S) => [S.obj.on ? `WAVE ${S.obj.wave} / ${S.obj.waves}` : "持ち場へ 行く（着くと 波が 始まる）", S.def.bom ? (S.obj.bomDown ? "BOM を 倒す ✓" : "BOM を 倒す（ボーナス）") : S.obj.breach ? "一度も 破られない ✗" : "一度も 破られない ✓"],
  },
  // 護衛 VIP ESCORT（1-07）：研究者の そばに 行くと ついて 来る。「待て」で 置ける。敵が 研究者に 触れると 傷（3 回で 失敗）
  escort: {
    ...base,
    init(S) {
      const v = S.def.map.marks.find((m) => m.code === "VIP").at; S.obj.vip = { x: v[0], y: v[1], follow: false, hits: 0 };
      for (const l of S.def.lines?.start ?? []) T(S, l[0], l[1]);
    },
    onStep(S) {
      const v = S.obj.vip;
      if (v.met && v.follow && S.prev) { v.x = S.prev[0]; v.y = S.prev[1]; } // 後ろを ついて 来る（1 歩 前の マスへ）
      if (!v.follow && !v.met && near1(S, [v.x, v.y])) { v.met = true; v.follow = true; note(S, "研究者が ついて 来る"); say(S, "研究者", "……おかしい。制御の数値が、合わない。こんな揺れ方は、設計にない"); for (const p of [[12, 7], [10, 12]]) addFoe(S, { kind: "unit", x: p[0], y: p[1], name: "UNIT", squad: squadOf(S, 1), move: "chase", every: 2 }); }
    },
    onTick(S) {
      const v = S.obj.vip;
      for (const f of S.foes) if (f.alive && f.x === v.x && f.y === v.y && !(S.me.x === v.x && S.me.y === v.y)) { v.hits += 1; f.stay = 2; note(S, `研究者が 傷を 負った（${v.hits} / 3）`); if (v.hits >= 3) finish(S, false, "研究者が 倒れた"); }
      if (v.met && (cellAt(S, v.x, v.y) === "E" || (v.follow && cellAt(S, S.me.x, S.me.y) === "E"))) { T(S, "BOOKMARK", "……記録、ここまでです。ありがとうございました"); finish(S, true, "研究者を 出口まで 送った", v.hits === 0); }
    },
    onUse(S) { const v = S.obj.vip; if (!v.met) return false; v.follow = !v.follow; note(S, v.follow ? "研究者に「ついて来い」" : "研究者に「待て」"); return false; },
    status: (S) => [S.obj.vip.met ? (S.obj.vip.follow ? "研究者を 出口へ（ついて 来る）" : "研究者は 待って いる（使う で 呼ぶ）") : "研究者を 迎えに 行く", S.obj.vip.hits ? `傷を 負わせない ✗（${S.obj.vip.hits}）` : "傷を 負わせない ✓"],
  },
  // 破壊 DEMOLITION（1-08）：発電機（G）を 3 回ずつ 叩いて 壊す。壊し 始めると POM が 押し寄せる。SPLINT が 守る。早く 終えれば ボーナス
  demolish: {
    ...base,
    init(S) { S.obj.hp = {}; S.obj.limit = S.def.limit ?? 90; },
    onUse(S, a) {
      const g = target(S, "G", a); if (!g || stateAt(S, ...g) === "broken") return false;
      const k = `${g[0]},${g[1]}`; S.obj.hp[k] = (S.obj.hp[k] ?? 3) - 1; note(S, `発電機を 叩いた（あと ${S.obj.hp[k]}）`);
      if (!S.obj.alarm) { S.obj.alarm = true; note(S, "守りが 寄って くる"); }
      if (S.obj.hp[k] <= 0) {
        S.state[k] = "broken"; note(S, "発電機が 止まった");
        if (!S.obj.splint) { const s = cells(S, "S")[0]; S.obj.splint = addFoe(S, { kind: "elite", elite: true, name: "SPLINT", pet: "pelican", co: "tcu", x: s[0], y: s[1], move: "chase", every: 2, squad: [linker("SPLINT")] }); }
        if (cells(S, "G").every((p) => stateAt(S, ...p) === "broken")) finish(S, true, "発電機を 3 基 壊した", S.turn <= S.obj.limit);
      }
    },
    onTick(S) { if (S.obj.alarm && S.turn % 8 === 0 && S.foes.filter((f) => f.alive && f.kind === "pom").length < 2) { const s = cells(S, "S")[0]; addFoe(S, { kind: "pom", name: "GRN POM", pet: "mogura", co: "tcu", x: s[0], y: s[1], move: "chase", every: 2, squad: [linkerPet("mogura", LV.pom, "POM-G1", "GRN")] }); } },
    onMeet(S, f) { if (f === S.obj.splint) T(S, "SPLINT", S.flags.metSplint ? "……この前の。……仕事、なんですよね。わかってます" : "すみません、ここは通せない決まりなんです"); },
    onWin(S, b) { if (b?.foe === S.obj.splint) T(S, "SPLINT", "……まだ、支えが甘かった"); },
    // その場：となりの 発電機に 爆薬（戦いの 行動の かわりに 叩くのと 同じ 1）
    field: (S) => { const g = adj(S, "G").find((p) => stateAt(S, ...p) !== "broken"); return g ? { name: "発電機に 爆薬", text: "となりの 発電機の 耐久 −1", run: () => KINDS.demolish.onUse(S, { x: g[0], y: g[1], ch: "G" }) } : null; },
    status: (S) => [`発電機を 壊す ${cells(S, "G").filter((p) => stateAt(S, ...p) === "broken").length} / ${cells(S, "G").length}`, `${S.obj.limit} ターン以内（いま ${S.turn}）`],
  },
  // 制圧 CAPTURE POINTS（1-11）：制御点（P）の 上で 2 ターン → 握る。NEW MOON が 1 か所を 受け持つ。3 つ 同時に 握れば 成功
  capture: {
    ...base,
    init(S) {
      S.obj.own = {}; S.obj.stand = 0; S.obj.lost = false;
      const ps = cells(S, "P"); S.obj.mercAt = ps.reduce((b, p) => (distOf(S, [S.me.x, S.me.y], p) < distOf(S, [S.me.x, S.me.y], b) ? p : b), ps[0]);
      T(S, "NEW MOON", "同期のよしみだ。今日は組もう");
    },
    onTick(S) {
      const ps = cells(S, "P"), k = (p) => `${p[0]},${p[1]}`;
      // NEW MOON は 受け持ちに 着いて 3 ターンで 握る（迷宮の 上の 動きは 省く）
      if (S.turn === 4) { S.obj.own[k(S.obj.mercAt)] = "merc"; T(S, "NEW MOON", "負けない、君には！"); }
      const here = ps.find((p) => at(S, p));
      if (here && S.obj.own[k(here)] !== "me" && S.obj.own[k(here)] !== "merc") { if ((S.obj.stand += 1) >= 2) { S.obj.own[k(here)] = "me"; S.obj.stand = 0; note(S, "制御点を 握った"); } } else if (!here) S.obj.stand = 0;
      // 増援：握って いる 間 7 ターンごとに 四隅から。だれも いない 握った 点に 着くと 奪い返す
      if (Object.keys(S.obj.own).length && S.turn % 7 === 0) { const e = pick(S, S.def.map.entries), tg = ps.find((p) => S.obj.own[k(p)] === "me" && !at(S, p)); if (tg) addFoe(S, { kind: "unit", x: e[0], y: e[1], name: "REINFORCE", squad: squadOf(S, 1), move: "goto", to: tg, every: 2, retake: tg }); }
      for (const f of S.foes) if (f.alive && f.retake && f.x === f.retake[0] && f.y === f.retake[1] && S.obj.own[k(f.retake)] === "me") { delete S.obj.own[k(f.retake)]; S.obj.lost = true; note(S, "制御点を 奪い返された"); f.move = "chase"; }
      if (ps.every((p) => S.obj.own[k(p)])) { T(S, "NEW MOON", "……次は、僕が先に握る"); finish(S, true, "3 か所を 同時に 握った", !S.obj.lost); }
    },
    status: (S) => [`制御点 ${Object.keys(S.obj.own).length} / ${cells(S, "P").length}（上で 2 ターン）`, S.obj.lost ? "奪い返されない ✗" : "奪い返されない ✓"],
  },
  // 追跡 TRACER（1-12）：運び屋を 近づきすぎず 離れすぎず 追う（道の 長さ 2〜6）。気づかれるか 見失うと 1 回（3 回で 失敗）。受け渡しの 荷を 確かめれば ボーナス
  tracer: {
    ...base,
    init(S) {
      const t = S.def.map.track; S.obj.strike = 0;
      S.obj.c = addFoe(S, { kind: "pom", name: "COURIER", pet: "tv", co: null, x: t[0][0], y: t[0][1], move: "goto", way: t.slice(1), to: t[1], every: 2, noMeet: true, squad: [linkerPet("tv", LV.pom, "POM-?1", "ESCORT"), linkerPet("mouse", LV.pom, "POM-?2", "ESCORT")] });
    },
    onTick(S) {
      const c = S.obj.c; if (!c.alive) return;
      if (c.to && c.x === c.to[0] && c.y === c.to[1]) { c.way.shift(); c.to = c.way[0] ?? null; if (!c.to && !S.obj.arrived) { S.obj.arrived = true; S.obj.leave = S.turn + 6; say(S, "ESCORT", "荷は受け取った。……上の連中に、よろしくな"); } }
      const d = distOf(S, [S.me.x, S.me.y], [c.x, c.y]);
      if (S.obj.arrived) { if (S.turn >= S.obj.leave) finish(S, true, "受け渡しの 場所を 突き止めた", S.obj.checked); return; } // 受け渡しの あいだ（6 ターン）に 荷を 確かめられる
      if (S.obj.cool > 0) { S.obj.cool -= 1; return; }
      if (d <= 1 || (d > 6 && S.turn > 6)) { S.obj.strike += 1; S.obj.cool = 4; note(S, d <= 1 ? `気づかれた（${S.obj.strike} / 3）` : `見失った（${S.obj.strike} / 3）`); if (S.obj.strike >= 3) finish(S, false, "気づかれて 見失った"); }
    },
    onBlocked(S, f) { if (f === S.obj.c && !S.obj.arrived && !(S.obj.cool > 0)) { S.obj.strike += 1; S.obj.cool = 4; note(S, `気づかれた（${S.obj.strike} / 3）`); if (S.obj.strike >= 3) finish(S, false, "気づかれて 見失った"); } },
    onUse(S, a) { const c = S.obj.c; if (S.obj.arrived && near1(S, [c.x, c.y])) { S.battle = { kind: "pom", foes: c.squad, first: null, foe: c, name: "ESCORT" }; return; } return false; },
    onWin(S, b) { if (b?.foe === S.obj.c) { S.obj.checked = true; note(S, "防護繊維の 箱の 底に 貴重サンプルの 容器。札は「宛先：――」"); finish(S, true, "受け渡しの 場所を 突き止めた", true); } },
    status: (S) => [S.obj.arrived ? "受け渡しの 場所（荷を 確かめるなら 運び屋に 近づいて 使う）" : `運び屋を 追う（近すぎ・遠すぎ ${S.obj.strike} / 3）`, S.obj.checked ? "荷を 確かめる ✓" : "荷を 確かめる（ボーナス）"],
  },
  // 破壊 VAULT BREAK（1-13）：警備室（T）を 取ると 隔壁（B）が 開く → 最下層の 保管庫（V）を 壊す。記録媒体を 先に 回収すれば ボーナス
  vault: {
    ...base,
    init(S) { S.obj.hp = 3; },
    onUse(S, a) {
      const t = target(S, "T", a), v = target(S, "V", a);
      if (t && stateAt(S, ...t) !== "seized") { S.state[`${t[0]},${t[1]}`] = "seized"; for (const b of cells(S, "B")) S.state[`${b[0]},${b[1]}`] = "open"; note(S, "警備室の 制御を 奪った。隔壁が 開く"); return; }
      if (v) {
        if (!S.obj.media) { S.obj.media = true; note(S, "記録媒体を 回収した"); say(S, "記録端末", "TEST-07：制御率 61%。外部からの干渉なし。……試験を継続"); return; }
        S.obj.hp -= 1; note(S, `保管庫を 壊して いる（あと ${S.obj.hp}）`);
        if (S.obj.hp <= 0) { S.state[`${v[0]},${v[1]}`] = "open"; finish(S, true, "保管庫ごと 破壊した", S.obj.media); }
        return;
      }
      return false;
    },
    // その場：となりの 端末で 隔壁を 開ける・保管庫を 壊す（戦いの 行動の かわり）
    field: (S) => { const tm = adj(S, "T").find((p) => stateAt(S, ...p) !== "seized"), v = adj(S, "V")[0];
      if (tm) return { name: "端末で 隔壁を 開ける", text: "警備室の 制御を 奪う", run: () => KINDS.vault.onUse(S, { x: tm[0], y: tm[1], ch: "T" }) };
      if (v && stateAt(S, ...v) !== "open") return { name: S.obj.media ? "保管庫を 壊す" : "記録媒体を 回収", text: S.obj.media ? "保管庫の 耐久 −1" : "保管庫の 記録媒体を 取る", run: () => KINDS.vault.onUse(S, { x: v[0], y: v[1], ch: "V" }) };
      return null; },
    status: (S) => [cells(S, "B").some((b) => stateAt(S, ...b) !== "open") ? "警備室の 端末を 取る（隔壁が 開く）" : "最下層の 保管庫を 壊す", S.obj.media ? "記録媒体 ✓" : "記録媒体（保管庫で 先に 使う）"],
  },
  // 追跡 RUNNER（1-14）：盗んだ 者の 足あとを たどる。足あとは 数ターンで 消える。昇降機で 追いつけば 精鋭の 戦い。時間切れで 失敗
  runner: {
    ...base,
    init(S) {
      const t = S.def.map.track; S.obj.limit = S.def.limit ?? 140;
      S.obj.g = addFoe(S, { kind: "elite", elite: true, name: "GHOST NOTE", pet: "tv", co: "nox", x: t[0][0], y: t[0][1], move: "goto", way: t.slice(1), to: t[1], every: 2, noMeet: true, trail: true, squad: [linker("GHOST NOTE")] });
      T(S, "ONE SHOE", "先に行って見てくる！すぐ戻る！");
    },
    onTick(S) {
      const g = S.obj.g; if (!g.alive) return;
      if (g.to && g.x === g.to[0] && g.y === g.to[1]) {
        g.way.shift(); g.to = g.way[0] ?? null;
        const lp = liftTo(S, g.x, g.y); // 昇降機で 下の 区画へ（2 つ目の 区画。資料の「2 区画」）
        if (lp && g.to && g.to[0] === lp[0] && g.to[1] === lp[1]) { g.x = lp[0]; g.y = lp[1]; T(S, "ONE SHOE", "下に降りた！昇降機だ！"); g.way.shift(); g.to = g.way[0] ?? null; }
        if (!g.to) { g.noMeet = false; g.move = "wait"; }
      }
      S.obj.trail = (S.obj.trail ?? []).filter((p) => S.turn - p.turn < 8); // 足あとは 数ターンで 消える
      if (S.turn % 9 === 0) T(S, "ONE SHOE", "獲物だ！獲物だ！");
      if (S.turn > S.obj.limit) finish(S, false, "見失った まま 時間切れ");
    },
    onMeet(S, f) { if (f === S.obj.g) { say(S, "GHOST NOTE", "死人に会うのは初めてか"); } },
    onBlocked(S, f) { if (f === S.obj.g && !S.battle) { S.battle = { kind: "elite", foes: f.squad, first: null, foe: f, elite: true, name: f.name }; KINDS.runner.onMeet(S, f); } },
    onWin(S, b) { if (b?.foe === S.obj.g) { say(S, "GHOST NOTE", "生きてる奴は、うるさいな"); say(S, "GHOST NOTE", "新しい登録者の名簿だ。お前の名前も、載ってたぜ。……推薦人の欄は、空白だったがな"); finish(S, true, "追いつめた（相手は 逃げた）", true); } },
    afterBattle(S, b) { if (b?.foe === S.obj.g && !S.result) finish(S, true, "追いつめた（記録は 取り返せなかった）", false); },
    status: (S) => [S.obj.g.alive && S.obj.g.to ? "足あとを たどる" : "昇降機で 追いつく", `${S.obj.limit} ターン以内（いま ${S.turn}）`],
  },
};

// ---- 15 本（段・★・目的の 種類・場所ごとの 足し） ----
const ROWS = [
  ["c1m01", "1-01", "TOUCHSTONE", "first", true, "target", {}],
  ["c1m02", "1-02", "FIELD TEST", "second", true, "seize", { allies: ["STOPWATCH"] }],
  ["c1m03", "1-03", "FIRST CARGO", "A", false, "delivery", { allies: ["RABBIT HOLE"], lines: { start: [["RABBIT HOLE", "近道知ってる！こっち！"]], end: [["RABBIT HOLE", "はじめてにしては上出来！また運ぼうね"]] } }],
  ["c1m04", "1-04", "LOST AMPOULE", "A", false, "recovery", {}],
  ["sva01", "1-05", "NEST", "A", false, "nest", { vein: [[12, 13], [13, 13]] }],
  ["c1m06", "1-06", "HOLD THE GATE", "B", false, "hold", { allies: ["SPLINT"], gate: [[7, 4], [8, 4]], lines: { start: [["SPLINT", "直すのは任せてください！支えます！"]], end: [["SPLINT", "……ありがとうございました。また、どこかで"]] } }],
  ["c1m07", "1-07", "QUIET PASSENGER", "B", false, "escort", { allies: ["BOOKMARK"], lines: { start: [["BOOKMARK", "傭兵として同行します。邪魔はしません"]] } }],
  ["c1m08", "1-08", "BREAKER", "B", false, "demolish", {}],
  ["tcu01", "1-09", "RELAY", "C", false, "delivery", { allies: ["RABBIT HOLE"], lines: { start: [["RABBIT HOLE", "近道知ってる！こっち！"]], "HP-1": ["RABBIT HOLE", "あと少し！"], end: [["RABBIT HOLE", "また会ったね！今日も全員、送り届けた！"]] } }],
  ["hcc02", "1-10", "FRAGILE", "C", false, "delivery", { fragile: true, pickAt: [9, 13], dropAt: [1, 1], lines: { start: [["HOUND", "匂うぞ。紙と、インクの匂いだ"]] } }],
  ["c1m11", "1-11", "THREE SWITCHES", "C", false, "capture", {}],
  ["c1m12", "1-12", "SHADOW LINE", "D", false, "tracer", {}],
  ["hcc01", "1-13", "VAULT", "D", false, "vault", {}],
  ["c1m14", "1-14", "RUNNER", "D", true, "runner", { allies: ["ONE SHOE"], limit: 170 }], // 2 区画に した ので 時間を のばした（仮）
  ["c1m15", "1-15", "REVIEW", "end", true, "hold", { allies: ["STOPWATCH", "NEW MOON"], bom: true, lines: { end: [["STOPWATCH", "合格。次はもっと上で会いましょう"], ["STOPWATCH", "……この件は、上に報告します"], ["NEW MOON", "……次は、僕が勝つ"]] } }],
];
// 終わった あとの ORDER の 通信（字幕だけ・名前は ORDER）
export const AFTER = {
  c1m01: "悪くない初陣だ。だが、君が倒した相手が何者だったのか、いずれ知ることになる",
  c1m14: "君の記録を探している者がいる。気にすることはない。記録など、いくらでも書きかえられる",
  c1m15: "見たかね。あれが、グラウンドの今だ",
};
export const MISSIONS = ROWS.map(([id, no, title, stage, star, kind, extra]) => {
  const d = CH1_DATA[id], enemy = d.briefing.sections.find((s) => s.view === "enemy");
  return { ...d, no, title, stage, star, kindName: kind, monsters: (enemy?.monsters ?? []).length ? enemy.monsters : [{ sprite: "e_guard", name: "GUARD" }], ...extra };
});
export const kindOf = (m) => KINDS[m.kindName];

// ---- 進み方（1-01・1-02 は 順に。1-03 から 3 本ずつの 段。どれか 1 本で 次の 段。1-15 は 1-14 を ふくむ 9 本） ----
const STAGES = ["first", "second", "A", "B", "C", "D"];
export function offered(done) {
  const ok = (id) => done.includes(id), out = [];
  for (let i = 0; i < STAGES.length; i++) {
    const g = MISSIONS.filter((m) => m.stage === STAGES[i]);
    out.push(...g);
    if (!g.some((m) => ok(m.id))) break; // この 段を 1 本も 終えて いなければ 次は まだ
  }
  const n = MISSIONS.filter((m) => m.stage !== "end" && ok(m.id)).length;
  if (ok("c1m14") && n >= NEED) out.push(MISSIONS.find((m) => m.stage === "end"));
  return out;
}
export const countDone = (done) => MISSIONS.filter((m) => m.stage !== "end" && done.includes(m.id)).length;
