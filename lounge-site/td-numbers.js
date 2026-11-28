// 集合住宅（TD）の 数の 表（資料 docs/mono-link-td-numbers.md）。〔決〕＝ 鹿さんの 決め（2026-11-14 で ぜんぶ 〔決〕に なった）
// 数を かえる ときは ここと 資料を いっしょに 直す。三つの 画面（td.html）・門番・試験が ここを 読む

// ---- 1. 家賃 〔決〕（2026-11-14 カード「この案でよい」）：（15 ＋ Lv）× 20（基礎値。2026-11-15）× 満足度の 倍率（満足度 0 で 0.5・100 で 1.2）× 家賃の 高さ。1 日 1 回 ----
// 〔決〕基礎値は 20 倍（2026-11-15 カード「20 倍」。鹿さん「家賃の基礎値を大幅に上げる。」）：（15 ＋ Lv）× 20 ＝ 300 ＋ 20 × Lv
export const RENT = { base: 15, perLv: 1, x: 20, satLo: 0.5, satHi: 1.2 };
// 〔決〕家賃の 高さ（部屋ごと。2026-11-15 カード。鹿さん「家賃収入の上限を引き上げてください。しかし家賃の高さによって不満が溜まる設定もつけてください。部屋に見合った家賃設定でなければ満足度は上がらない。」）：
//   上限は いまの 家賃の 5 倍（強気）・部屋に 見合う 家賃（相場）を 1 段 超えるごとに 満足度が 毎日 −3・相場を 超えた 部屋では 家具・設備・広さの 満足度が 効かない
//   〔C〕段の 倍率（ふつう ＝ いままでの 家賃）・相場の 線（下の gradeOf の 部屋の 格）・相場より 下げると 不満が 1 段ごとに 毎日 3 もどる・相場を 超えた 部屋には 新しい 住人が 入らない
export const RENT_STEP = [
  { name: "安い", mul: 0.8, grade: 0 }, { name: "ふつう", mul: 1, grade: 0 }, { name: "高い", mul: 2, grade: 10 },
  { name: "とても高い", mul: 3, grade: 25 }, { name: "強気", mul: 5, grade: 45 },
];
export const RENT_MID = 1;   // ふつう（はじめは みんな ここ）
export const GRUDGE = { perStep: 3, max: 100 };   // 不満：相場との 段の ちがい 1 つごとに 1 日 3（超えると たまり、下げると もどる）
export const rentOf = (lv, sat, step = RENT_MID) => Math.round((RENT.base + RENT.perLv * lv) * RENT.x * (RENT.satLo + ((RENT.satHi - RENT.satLo) * Math.max(0, Math.min(100, sat))) / 100) * (RENT_STEP[step] || RENT_STEP[RENT_MID]).mul);

// ---- 1c. 住人の 仕事 〔決〕（2026-11-16 カード 2 回。鹿さん「モンスターが適度に家賃を払える量は就いている仕事によって決めましょう。」）----
//   種類は 系統で 4 つ・職種は その 種類の 4 つから 入居の ときに くじ。腕は 働いた 日数で 上がる（上限なし。名人の 先の 腕と 段は 家賃の 段を 足す ときに）
//   払える 段（腕）＋ がまん（0〜2 段の くじ）までは 全額。それより 高いと 払うのは 払える 段＋がまん の 分まで・さらに 超えた 1 段ごとに その日は 30% で 払わない
//   〔C〕入居希望の 腕（7 割 見習い・2 割 一人前・8% 腕利き・2% 名人）・出かける 時間帯（WORK_HOURS）
export const WORK = { 力仕事: ["荷運び", "鍛冶屋", "石工", "大工"], 店の仕事: ["店員", "料理人", "洗い屋", "花屋"], 見回り: ["夜警", "墓守", "門番", "用心棒"], 学び: ["占い師", "神官", "記者", "学者"] };
export const WORK_OF = { beast: "力仕事", dragon: "力仕事", mineral: "力仕事", insect: "力仕事", humanoid: "店の仕事", yokai: "店の仕事", jelly: "店の仕事", plant: "店の仕事",
  undead: "見回り", spirit: "見回り", specter: "見回り", aberration: "見回り", demon: "学び", divine: "学び", avian: "学び", aquatic: "学び" };
export const WORK_HOURS = { 力仕事: [8, 17], 店の仕事: [10, 20], 見回り: [21, 5], 学び: [9, 15] };   // 〔C〕出かけて いる 時間（時。見回りは 夜を またぐ）
export const SKILL = [{ name: "見習い", days: 0, pay: 1 }, { name: "一人前", days: 7, pay: 2 }, { name: "腕利き", days: 30, pay: 3 }, { name: "名人", days: 90, pay: 4 }];
export const skillOf = (days) => SKILL.reduce((m, s, i) => (days >= s.days ? i : m), 0);
export const SKILL_IN = [[0.02, 90], [0.1, 30], [0.3, 7]];   // 〔C〕入居希望の 腕（くじが この 数 未満なら その 日数から）
export const PAY = { tolMax: 2, skipP: 0.3 };
// 〔決〕住人の 暮らし（2026-11-18 鹿さんの カード「本物の時刻」「約 7 日」「7 日」「NPC の子」）：日本時間の 本物の 時刻で 進む。
//   となりの 部屋の 2 人が 朝と 夜の 話す 時刻に どちらも 家に いて 起きて いれば 話して なかよし ＋7（1 日 ＋14・100 で 子。毎日 そろうと 約 7 日）。
//   子は 親の 部屋で 育ち、生まれて 7 日で 大きく なって 空き部屋へ 自分で 移る（その 日から 家賃。空き部屋が ない あいだは 親の 部屋で 待つ）。子は 1 部屋に 1 体まで。
//   子の 持ち主：両方の 親が 自分の 子の ときだけ 自分の 子・ほかは NPC の 子（満足度 マックスで スカウト）
//   〔C〕話す 時刻は 7:30 と 20:30（ほとんどの 子が 起きて 家に いる 時刻）・子が 生まれたら なかよしは 0 から・まとめて 進めるのは 14 日前まで
export const LIFE = { talk: 7, full: 100, slots: [450, 1230], growDays: 7, backDays: 14, diaryMax: 8 };
// その日 払う 額：cap ＝ 払える 段 ＋ がまん・u ＝ その日の くじ（0〜1）
export const payOf = (lv, sat, step, cap, u) => (step <= cap ? rentOf(lv, sat, step) : u < Math.min(1, PAY.skipP * (step - cap)) ? 0 : rentOf(lv, sat, cap));

// ---- 2. 増築 〔決〕値段の 形は 部屋の 数 × 高さ（2026-11-14）・〔決〕もとの 値段の 10〜50 倍（「家具や区画の価格想定を10～50倍で用意してください。」）----
//   〔決〕倍率は パーツごと（「区画パーツによりけり」）。前の 案の「建物の 部屋の 数で 10 → 50 倍」は つかわない
export const BUILD = { perFloor: 0.2, mulLo: 10, mulHi: 50 };
export const floorMul = (floor) => 1 + BUILD.perFloor * (Math.max(1, floor) - 1);   // 高さの 倍率：1 ＋ 0.2 ×（階 − 1）

// ---- 2b. パーツ・小物 1 つずつの 値段 〔決〕（鹿さんの カード「区画パーツによりけり」「よりけり」→ 表は 4 回目の カード「この案でよい」2026-11-14。10〜50 倍の 中）----
//   per：部屋（箱は × 高さの 倍率）・階・マス・1 つ。lv：不動産価値で 使える ように なる Lv
export const PARTS = {
  box: { lv: 1, per: "room", price: 5000 }, addFloor: { lv: 1, per: "room", price: 5000 }, overhang: { lv: 1, per: "box", mul: 1.5 },
  ell: { lv: 3, per: "room", price: 10000 }, wide: { lv: 5, per: "room", price: 15000 }, roofHut: { lv: 7, per: "one", price: 20000 },
  stair: { lv: 1, per: "floor", price: 3000 }, bridge: { lv: 1, per: "cell", price: 1500 }, tower: { lv: 1, per: "floor", price: 9000 },
  ladder: { lv: 2, per: "floor", price: 1500 }, spiral: { lv: 4, per: "floor", price: 15000 }, fire: { lv: 6, per: "floor", price: 9000 },
  rope: { lv: 8, per: "cell", price: 4000 }, elevator: { lv: 9, per: "floor", price: 30000 },
};
export const DECOR = { sign: { lv: 1, price: 3000 }, outdoor: { lv: 1, price: 3000 }, laundry: { lv: 2, price: 3000 }, pipe: { lv: 3, price: 4500 }, neon: { lv: 4, price: 9000 }, dish: { lv: 5, price: 6000 }, plant: { lv: 5, price: 6000 }, tank: { lv: 6, price: 9000 }, bigSign: { lv: 8, price: 15000 } };
export const GEAR = { light: { lv: 1, price: 15000, name: "照明" }, vacuum: { lv: 1, price: 15000, name: "掃除機" }, aircon: { lv: 2, price: 22500, name: "空調" }, heater: { lv: 3, price: 30000, name: "給湯器" }, soundproof: { lv: 4, price: 37500, name: "防音かべ" }, purifier: { lv: 5, price: 45000, name: "空気清浄機" } };
export const partPrice = (id, n = 1, floor = 1, boxPrice0 = 0) => { const P = PARTS[id]; if (!P) return null; if (P.per === "box") return Math.round(boxPrice0 * P.mul); return Math.round(P.price * n * (P.per === "room" ? floorMul(floor) : 1)); };

// ---- 3. 住人の 家具 〔決〕1 つずつ（「よりけり」2026-11-14）・〔決〕幅（4 回目の カード「この案でよい」）。1 部屋 家具 3 つ まで ----
//   住人の 家具の 一覧は まだ ない。一覧を 作る ときに 1 つずつ この 幅の 中で 値段と 満足度を 付ける（設備は 上の GEAR）
export const FURN_RANGE = { lo: 3000, hi: 150000, satLo: 3, satHi: 10 };   // 10 倍（もと 300）〜 50 倍（もと 3,000）
export const FURN_MAX = 3;
// 〔決〕住人の 家具の 一覧（2026-11-15 カード「この案でよい」）。1 部屋 3 つまで・クレジット・プライベートラウンジの 家具とは 別枠
export const TD_FURN = {
  futon: { name: "せんべいぶとん", price: 3000, sat: 3 }, chabudai: { name: "ちゃぶ台", price: 5000, sat: 3 }, cbox: { name: "カラーボックス", price: 8000, sat: 4 },
  cushion: { name: "ふかふかクッション", price: 12000, sat: 4 }, fridge: { name: "小さな 冷蔵庫", price: 18000, sat: 5 }, shelf: { name: "木の 本だな", price: 25000, sat: 5 },
  sofa: { name: "ソファ", price: 35000, sat: 6 }, tank: { name: "大きな 水槽", price: 50000, sat: 7 }, game: { name: "ゲーム機と テレビ", price: 65000, sat: 7 },
  armchair: { name: "革の ひじかけいす", price: 85000, sat: 8 }, canopy: { name: "天蓋つきベッド", price: 110000, sat: 9 }, starlight: { name: "星空の プロジェクター", price: 150000, sat: 10 },
};
// 〔決〕好み：配合の 16 系統ごとに 好きな 家具 2 つ。置くと その 家具の 満足度が 1.5 倍（嫌いな 家具は なし）。どの 系統が どれかは 〔C〕
export const TD_LIKES = {
  jelly: ["tank", "cushion"], dragon: ["canopy", "armchair"], beast: ["futon", "sofa"], demon: ["starlight", "armchair"], undead: ["shelf", "futon"], mineral: ["cbox", "fridge"],
  plant: ["tank", "shelf"], insect: ["cbox", "chabudai"], divine: ["canopy", "starlight"], spirit: ["starlight", "cushion"], avian: ["sofa", "shelf"], aquatic: ["tank", "fridge"],
  humanoid: ["chabudai", "game"], yokai: ["chabudai", "futon"], specter: ["game", "shelf"], aberration: ["game", "fridge"],
};
// 〔決〕満足度（2026-11-15 カード）：入居 60 ＋ 家具（好みは 1.5 倍）＋ 設備 ＋ 広さ − 汚れ（0〜100）。戦いでは 変わらない（「戦闘では下がりません」「入れない」）
//   設備：温度＝空調・環境＝照明と 防音・清潔感＝掃除機と 空気清浄機・設備＝給湯器。汚れは 1 日 −2（最大 −20）、掃除機か 空気清浄機が ある 部屋は たまらない
//   病気：毎日の くじ（下の SICK。8 回目の カード）→ 3 日 全ステータス 半分・仕事に 出ない（家賃 なし）。夜逃げ：15 未満で 出て いく。100 で スカウト（研究ノートの 決め）
export const SAT = { base: 60, max: 100, gear: { aircon: 6, light: 3, soundproof: 4, vacuum: 3, purifier: 4, heater: 6 }, size: { ell: 5, wide: 10, big: 5, huge: 10 }, likeMul: 1.5,
  dirtDay: 2, dirtMax: 20, clean: ["vacuum", "purifier"], fleeBelow: 15, scout: 100 };   // big・huge は 設計図の 区画の 部屋（★3・4 広い・★5 とても 広い）
//   over：家賃が 相場を 超えて いる（家具・設備・広さの ＋が 効かない。汚れ止めは 効く）・grudge：家賃の 不満（下の GRUDGE）
export function satOf({ furn = [], gear = [], size = null, dirtDays = 0, fam = null, over = false, grudge = 0 } = {}) {
  const like = new Set(TD_LIKES[fam] || []);
  let v = SAT.base;
  if (!over) {
    for (const id of furn.slice(0, FURN_MAX)) { const F = TD_FURN[id]; if (F) v += Math.round(F.sat * (like.has(id) ? SAT.likeMul : 1)); }
    for (const id of new Set(gear)) v += SAT.gear[id] || 0;
    v += SAT.size[size] || 0;
  }
  if (!gear.some((g) => SAT.clean.includes(g))) v -= Math.min(SAT.dirtMax, SAT.dirtDay * Math.max(0, dirtDays));
  v -= Math.max(0, grudge);
  return Math.max(0, Math.min(SAT.max, Math.round(v)));
}
// 部屋の 格〔C〕：家具（好みは 数えない。部屋の 物なので）＋ 設備 ＋ 広さの 満足度の 合計（0〜66）。格で 相場（見合う 家賃の 段）が 決まる：10 で 高い・25 で とても高い・45 で 強気
export const gradeOf = ({ furn = [], gear = [], size = null } = {}) =>
  furn.slice(0, FURN_MAX).reduce((a, id) => a + (TD_FURN[id]?.sat || 0), 0) + [...new Set(gear)].reduce((a, id) => a + (SAT.gear[id] || 0), 0) + (SAT.size[size] || 0);
// 家具の オート（2026-11-25 鹿さんの カード「満足度を先に」「ぜんぶ置きなおす」「ボタンを押したときだけ」）：持ち物と 置いて ある 家具を 合わせて 配りなおす
//   1. 住人の 満足度：好きな 家具は 1.5 倍。満足度の 低い 住人ほど 先（〔C〕重み：15 未満 4 倍・40 未満 2 倍）。同じ くらいなら 相場が 上がる 部屋へ
//   2. のこりは 住人の いない 部屋へ（〔C〕格の 低い 部屋から・＋の 大きい 家具から）3. まだ のこれば 住人の いる 部屋の 空いた 枠へ（相場が 上がる 部屋から）
//   rooms：[{ key, gear, size, step, res: null | { fam, dirtDays, grudge } }]・pool：{ id: 数 } → { furn: { key: [id…] }, left: { id: 数 } }
export function autoFurn(rooms, pool) {
  const left = {}, furn = Object.fromEntries(rooms.map((r) => [r.key, []]));
  for (const [id, n] of Object.entries(pool || {})) if (Object.hasOwn(TD_FURN, id) && n >= 1) left[id] = Math.floor(n);
  const ids = () => Object.keys(TD_FURN).filter((id) => left[id] > 0).sort((a, b) => TD_FURN[b].sat - TD_FURN[a].sat);
  const gr = (r, f) => gradeOf({ furn: f, gear: r.gear || [], size: r.size || null }), mk = (r, f) => marketOf(gr(r, f));
  const sat = (r, f) => satOf({ furn: f, gear: r.gear || [], size: r.size || null, dirtDays: r.res.dirtDays || 0, fam: r.res.fam || null, over: stepOf(r) > mk(r, f), grudge: r.res.grudge || 0 });
  const w = (v) => v + 2 * Math.min(v, 15) + Math.min(v, 40);
  const put = (key, id) => { furn[key].push(id); if (!--left[id]) delete left[id]; };
  for (;;) {   // 1. 満足度
    let best = null; const L = ids();
    for (const r of rooms) {
      if (!r.res || furn[r.key].length >= FURN_MAX) continue;
      const f = furn[r.key], s0 = w(sat(r, f)), m0 = mk(r, f);
      for (const id of L) { const f1 = [...f, id], g = w(sat(r, f1)) - s0, dm = mk(r, f1) - m0; if (g > 0 && (!best || g > best.g || (g === best.g && dm > best.dm))) best = { key: r.key, id, g, dm }; }
    }
    if (!best) break; put(best.key, best.id);
  }
  for (const occ of [false, true]) for (;;) {   // 2. 住人の いない 部屋 → 3. 住人の いる 部屋の 空いた 枠
    const L = ids(), open = rooms.filter((r) => !r.res === !occ && furn[r.key].length < FURN_MAX); if (!L.length || !open.length) break;
    const id = L[0], dm = (r) => mk(r, [...furn[r.key], id]) - mk(r, furn[r.key]);
    put(open.reduce((a, b) => (dm(b) > dm(a) || (dm(b) === dm(a) && gr(b, furn[b.key]) < gr(a, furn[a.key])) ? b : a)).key, id);
  }
  return { furn, left };
}
export const BUY_MAX = 999;   // お店で 1 回に 買える 数〔C〕（2026-11-25 鹿さんの カード「家具と設備の両方」。打ちまちがいの 止め。持って いる 数の 上限では ない）
export const marketOf = (grade) => RENT_STEP.reduce((m, s, i) => (i > RENT_MID && grade >= s.grade ? i : m), RENT_MID);
export const stepOf = (room) => (room && Number.isInteger(room.step) && RENT_STEP[room.step] ? room.step : RENT_MID);
export const grudgeRate = (step, market) => GRUDGE.perStep * (step - market);   // 1 日に ＋ たまる／− もどる

// ---- 4. アメジスト 〔決〕（2026-11-14 カード「この案でよい」）：殺された 持って いる 子の 復活（ランク）・掲示板を すぐ かえる ----
export const REVIVE = { F: 3, E: 5, D: 8, C: 12, B: 20, A: 30, S: 50, EX: 80 };
export const BOARD_REFRESH = 1;
// 〔決〕スカウト（満足度 100 の NPC の 住人を なかまに）は ランクごとの シグナル（2026-11-15 カード「シグナルで」）
export const SCOUT_SIG = { F: 20, E: 30, D: 40, C: 60, B: 80, A: 120, S: 180, EX: 260 };

// ---- 経験値 〔決〕入るのは 防衛の 戦いと 仕事（2026-11-14 カード「戦い、仕事」）・数も 〔決〕（2 回目の カード「この案でよい」）----
//   戦い：倒した 敵 1 体ごとに 敵の Lv × 0.3（派遣と 同じ EXP_PER_LV）を その 戦いに 出た 持って いる 子 みんなに。仕事：1 日ぶんの 仕事で Lv × 4
export const EXP = { perFoeLv: 0.3, workPerLv: 4 };
export const battleExp = (foeLvs) => Math.round(foeLvs.reduce((a, lv) => a + lv * EXP.perFoeLv, 0));
export const workExp = (lv, days = 1) => Math.round(lv * EXP.workPerLv * days);

// ---- 5. 防衛の 報酬（強さ 1〜5）〔決〕（2026-11-14 カード「この案でよい」）。行き先も 〔決〕本編と 共有（素材・スクラップは 倉庫・クレジットは 財布）----
export const REWARD = [
  null,
  { cr: 300, sig: 2, mat: 2, scrap: 3, module: 0.04 },
  { cr: 500, sig: 4, mat: 3, scrap: 4, module: 0.08 },
  { cr: 800, sig: 6, mat: 4, scrap: 5, module: 0.12 },
  { cr: 1200, sig: 8, mat: 5, scrap: 6, module: 0.16 },
  { cr: 1800, sig: 10, mat: 6, scrap: 8, module: 0.2 },
];
export const LOSE = { keep: 0.2, take: 0.5 };   // 負け：報酬の 2 割（倒した 分）・クレジットを 報酬の 半分 取られる
export const HELP_SHARE = 0.4;                  // 手伝って 守りきった 人：報酬の 4 割
// 〔決〕助けを よぶ 掲示板（2026-11-16 カード「自動行動」「この案でよい」）：募集 1 つに 3 体まで・手伝いの 子は 自動で 動く（入口に 近い 通り道で 待つ・型の 得意な 動き・HP 3 割で 引き上げ・殺されない）
//   〔C〕募集の 期限 6 時間・突撃で 寄って いく のは 3 マス 以内の 敵
//   〔C〕手伝いの ごほうびは 1 人 1 日 3 回まで（防衛の 結果は 画面の 報告を 信じる 作りなので、組んだ アカウントで ふやせない ように。2026-11-16 自動の 安全確認の 指摘）
export const HELP = { max: 3, postMs: 6 * 3600000, backAt: 0.3, rushNear: 3, dayMax: 3 };
// 防衛の 報酬：勝ち＝表の まま・負け＝2 割（倒した 分）と 取られる クレジット・手伝い＝4 割（負けたら なし）
export function rewardOf(strength, { won = true, helper = false } = {}) {
  const R = REWARD[Math.max(1, Math.min(5, strength | 0))], k = helper ? (won ? HELP_SHARE : 0) : won ? 1 : LOSE.keep;
  return { cr: Math.round(R.cr * k), sig: Math.round(R.sig * k), mat: Math.round(R.mat * k), scrap: Math.round(R.scrap * k), module: won ? R.module : 0, take: !won && !helper ? Math.round(R.cr * LOSE.take) : 0 };
}

// ---- 6. シグナルの 値段 〔決〕（2026-11-14）----
export const SIGNAL = { room: 300, furnLo: 20, furnHi: 80, pomCall: 30 };

// ---- 7. 攻めて くる 敵の 数と Lv 〔決〕（2026-11-14）----
export const FOE = { base: 2, perRooms: 8, max: 16, every: 2, top: { base: 10, perLv: 5 }, band: [null, [0.2, 0.4], [0.35, 0.55], [0.5, 0.7], [0.65, 0.85], [0.8, 1.0]] };
// 〔決〕襲撃の Lv（2026-11-16 鹿さん「電波塔lvと不動産価値で呼び出せる襲撃にlvの高いものが含まれるようになるというだけで全部強くするわけないでしょう」→ カード「この案でよい」）：
//   襲撃は 自分の Lv を 持つ（住人の Lv には あわせない）。届く 襲撃の Lv の 上 ＝ 10 ＋ 電波塔の Lv（＝ 不動産価値の Lv）× 5（上限なし）。★が 高いほど 上に 近い（★1 は 2〜4 割・★3 は 5〜7 割・★5 は 8〜10 割。〔C〕★2・★4 は その 間）
//   前の「住人の 上から 3 体の 平均 × 0.8〜1.25」は Claude の 案で、カードの 見本に だけ 書いて いた（やめた）
export const foeTopLv = (plv) => FOE.top.base + FOE.top.perLv * Math.max(1, plv | 0);
export const foeCount = (strength, rooms) => Math.min(FOE.max, FOE.base + strength + Math.floor(rooms / FOE.perRooms));
export const foeLv = (strength, plv, r = 0.5) => { const b = FOE.band[Math.max(1, Math.min(FOE.band.length - 1, strength | 0))]; return Math.max(1, Math.round(foeTopLv(plv) * (b[0] + (b[1] - b[0]) * Math.max(0, Math.min(1, r))))); };

// ---- 8. 戦いの 数（M-028 の 決めの 中の 数）----
export const FIGHT = {
  side: 4,            // 〔決〕1 つの 戦いは 片方 4 体まで（上下左右）
  chargeMul: 2,       // 〔決〕待ち伏せの チャージ：最初の 与ダメージ 2 倍（バフの 原案の チャージ）
  rush: 2,            // 〔決〕アタッカーの 突撃：1 ターンに 2 マス
  reach: 2,           // 〔決〕キャスター：2 マス 先の 敵の 戦いにも 加われる
  blockDef: 4 / 3,    // 〔決〕2026-11-14ディフェンダーの ふさぐ：受ける ダメージ −25%（DEF を 4/3 倍で あらわす）
  slowTurns: 2,       // 〔決〕2026-11-14テクニシャンの 足止め：疲労（AGI 半分）2 ターン・その あいだ 2 ターンに 1 歩
  healPct: 0.2,       // 〔決〕2026-11-14ヒーラー：となりの 部屋の 住人を 最大 HP の 20% 回復
  revivePct: 0.3,     // 〔決〕起こす：HP 3 割（クローラーの 蘇生と 同じ）
};
// 〔決〕自動（2026-11-16 カード「この形でよい」。鹿さん「自動とマニュアルを切り替えできるようにして体感時間を減らす」）：ターンは 0.5 秒ごと・HP 3 割を 切ると 退避・型ごとの 得意な 動き
export const AUTO = { turnMs: 500, retreatAt: 0.3, healBelow: 0.7 };
// 〔決〕退避の くらべっこ（クローラーの 撤退と 同じ 式）：0.5 ＋（自分の AGI − 敵の いちばん 高い AGI）÷ 合計（最低 40）、20〜90%
export const retreatOdds = (mine, theirs) => Math.max(0.2, Math.min(0.9, 0.5 + (mine - theirs) / Math.max(40, mine + theirs)));

// ---- 9. 不動産価値（Lv）〔決〕2026-11-15 カード 3〜6 回目。**上限なし**（鹿さん「上限は決めないでください。それだけ拡張性を狭めていることに気づいてください。」）----
//   点 ＝ 部屋 × 10 ＋ 家具 1 つ × 5 ＋ 設備 1 つ × 8 ＋ 住人の 満足度の 合計 ÷ 10 ＋ 集めた 家賃の 合計 ÷ 10,000 ＋ 防衛の 勝ち × 強さ × 20。上がった Lv は 下がらない
//   Lv N に いる 点 ＝ 50 × N ×（N − 1）（「上がりやすく」：Lv2 100・Lv5 1,000・Lv10 4,500・Lv15 10,500・Lv20 19,000…）
export const PROP = { room: 10, furn: 5, gear: 8, satDiv: 10, rentDiv: 10000, win: 20, k: 50 };   // 〔決〕家賃は ÷ 10,000（2026-11-16 カード。家賃が 20 倍に なったので）
export const propNeed = (L) => PROP.k * L * (L - 1);
export function propLvOf(pts) { const p = Number.isFinite(pts) ? Math.max(0, pts) : 0; let L = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * p) / PROP.k)) / 2)); while (propNeed(L + 1) <= p) L++; while (L > 1 && propNeed(L) > p) L--; return L; }
// 〔決〕1 つ目の 建物の 階：はじめ 2 階・2 Lv きざみで Lv10 に 5 階（「Lv10で5階までにしましょう。2lv刻み」。読みは カード 5 回目「この読みでよい」）
export const FIRST_FLOORS = { start: 2, at: [6, 8, 10] };
export const firstFloorsOf = (L) => FIRST_FLOORS.start + FIRST_FLOORS.at.filter((x) => L >= x).length;
// 〔決〕Lv10 から 先は Lv5 ごとに 区画を 1 つ（Lv15 で 1・Lv20 で 2…・上限なし）。区画は 設計図で 建てる
export const BLOCK_LV = { from: 10, every: 5 };
export const blockSlotsOf = (L) => Math.max(0, Math.floor((L - BLOCK_LV.from) / BLOCK_LV.every));
// 〔決〕住人の 家具の Lv（カード「4 段で」）。ドロップした 家具は Lv が 足りなくても 置ける
export const FURN_LV = { futon: 1, chabudai: 1, cbox: 1, cushion: 1, fridge: 3, shelf: 3, sofa: 3, tank: 5, game: 5, armchair: 5, canopy: 7, starlight: 7 };
// 〔決〕区画の 設計図（★が 高いほど 階が 多く・部屋が 広く・廊下が 広い。カード 5 回目「この案でよい」）。添え字 ＝ ★。★6 より 上は 行を 足すだけ
//   floors：区画の 階・size：部屋の 広さ（SAT.size の 鍵。満足度 ＋5／＋10）・hall：廊下の はば（2 は 住人が 横から 加勢しやすいが 敵も すれちがえる）
export const BLUEPRINT = [null,
  { floors: 2, size: null, hall: 1 }, { floors: 3, size: null, hall: 1 }, { floors: 3, size: "big", hall: 1 },
  { floors: 4, size: "big", hall: 2 }, { floors: 5, size: "huge", hall: 2 },
];
// 〔決〕設計図は 防衛の 報酬（守りきると）。鹿さん「全て出にくく」→ 読み：落ちる 割合 強さ × 1.5%（もとの 案の 半分）・★4 と ★5 は もとの 案の 半分（へった 分は ★1・★2 へ）
export const BP_DROP = 0.015;
export const BP_ODDS = [null, [70, 25, 5, 0, 0], [50.5, 35.5, 13, 1, 0], [32.5, 37.5, 25, 4.5, 0.5], [20.75, 35.75, 32, 9, 2.5], [11.25, 31.25, 35, 15, 7.5]];   // 強さ 1〜5 の ★1〜★5（%）
export const BP_SCRAP = [null, 3, 6, 12, 24, 48];   // 〔決〕分解で もらえる スクラップ
export function bpStar(strength, r) { const w = BP_ODDS[Math.max(1, Math.min(BP_ODDS.length - 1, strength | 0))]; let x = r * w.reduce((a, v) => a + v, 0); for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i + 1; } return 1; }
// 〔決〕家具の ドロップ：守りきると 強さ × 4% で 1 つ（カード「防衛の 報酬で」）。強いほど 高い 家具〔C〕：強さ s で 安い 方から 2s−4 番目〜2s+1 番目（強さ 1 は ふとん〜クッション・5 は ソファ〜プロジェクター）
export const FURN_DROP = 0.04;
export const furnDropPool = (s) => { const ids = Object.keys(TD_FURN), lo = Math.max(0, 2 * s - 4), hi = Math.min(ids.length - 1, 2 * s + 1); return ids.slice(lo, hi + 1); };
// 〔決〕病気の くじ（8 回目の カード）：1 日 ＝ 1% ＋（100 − 満足度）× 0.1% ＋ 汚れの 日数 × 0.5%（最大 5%）。3 日で 治る。病気の あいだ 全ステータス 半分・家賃 なし
export const SICK = { base: 0.01, perSat: 0.001, perDirt: 0.005, dirtMax: 0.05, days: 3 };
export const sickOdds = (sat, dirtDays) => SICK.base + SICK.perSat * Math.max(0, 100 - sat) + Math.min(SICK.dirtMax, SICK.perDirt * Math.max(0, dirtDays));

// ---- 10. モジュール 〔決〕（置き場所と 効果：研究ノート 2 回目・強さ：2026-11-15 カード「この案でよい」×3・★の 出方「設計図と 同じ」）----
//   置き場所 1 つに 1 つ（廊下と 階段の マス・区画〈箱〉・部屋）。同じ 置き場所・同じ ★は 同じ 量。★6 より 上は 表に 足すだけ
//   cell・foe：通る 敵 1 体に 1 回／cell・res：そばで 戦う 住人に 戦いの はじめ／block・res：箱の 住人 ぜんぶに 防衛の はじめ／block・foe：箱に 入った 敵 1 体に 1 回／room：その 部屋の 住人に 戦いの はじめ
export const MOD_AMT = {
  dot: [0, 3, 5, 8, 12, 16], turn: [0, 1, 1, 2, 2, 3], guard: [0, 5, 8, 12, 16, 20], regen: [0, 3, 5, 7, 9, 12], spd: [0, 5, 10, 15, 20, 25],
  cam: [0, 3, 5, 7, 9, 12], up: [0, 5, 10, 15, 20, 25], thorns: [0, 10, 20, 30, 40, 50], shield: [0, 5, 10, 15, 20, 25], once: [0, 1, 1, 1, 1, 1],
};
export const modAmt = (kind, star) => { const t = MOD_AMT[kind] || MOD_AMT.once; return t[Math.max(1, Math.min(t.length - 1, star | 0))]; };
export const MODULES = {
  pipe: { name: "もれる 配管", place: "cell", to: "foe", fx: [["poison", "dot"]] }, panel: { name: "古い 配電盤", place: "cell", to: "foe", fx: [["burn", "dot"]] },
  cold: { name: "冷気の 床", place: "cell", to: "foe", fx: [["frostbite", "dot"]] }, mold: { name: "カビの 換気口", place: "cell", to: "foe", fx: [["sickness", "dot"]] },
  static: { name: "静電気の 床", place: "cell", to: "foe", fx: [["paralysis", "dot"]] }, slip: { name: "すべる 床", place: "cell", to: "foe", fx: [["down_agi", "dot"]] },
  board: { name: "古い 床板", place: "cell", to: "foe", fx: [["weakness", "dot"]] }, neon: { name: "まぶしい ネオン", place: "cell", to: "foe", fx: [["blind", "turn"]] },
  firedoor: { name: "防火扉", place: "cell", to: "res", fx: [["armor", "guard"]] }, exitlight: { name: "非常灯", place: "cell", to: "res", fx: [["mastery", "guard"]] },
  beam: { name: "太い 鉄骨", place: "block", to: "res", fx: [["armor", "guard"]] }, soundpanel: { name: "防音 パネル", place: "block", to: "res", fx: [["ward", "guard"]] },
  boiler: { name: "共用の 給湯室", place: "block", to: "res", fx: [["regen", "regen"]] }, notice: { name: "住人会の 回覧板", place: "block", to: "res", fx: [["focus", "turn"]] },
  maze: { name: "迷路の 間取り", place: "block", to: "foe", fx: [["down_agi", "spd"]] }, camera: { name: "監視カメラ", place: "block", to: "foe", fx: [["down_atk", "cam"], ["down_int", "cam"]] },
  duct: { name: "換気ダクト", place: "block", to: "foe", fx: [["fatigue", "turn"]] },
  capsule: { name: "仮眠カプセル", place: "room", to: "res", fx: [["regen", "regen"]] }, gym: { name: "トレーニング器具", place: "room", to: "res", fx: [["up_atk", "up"]] },
  books: { name: "本棚", place: "room", to: "res", fx: [["up_int", "up"]] }, plant: { name: "観葉植物", place: "room", to: "res", fx: [["immunity", "up"]] },
  cactus: { name: "サボテンの 鉢", place: "room", to: "res", fx: [["thorns", "thorns"]] }, mirror: { name: "古い 鏡", place: "room", to: "res", fx: [["mirage", "up"]] },
  lockdoor: { name: "鍵 3 つの ドア", place: "room", to: "res", when: "ambush", fx: [["shield", "shield"]] },   // 待ち伏せで 出る とき 最大 HP の ％
  emerg: { name: "非常用カプセル", place: "room", to: "res", when: "init", star5: true, fx: [["reincarnation", "once"]] },   // ★5 だけ・防衛 1 回に 1 度
};
// 〔C〕スタックの デバフの ターン：効果の 決まりの いちばん 長い ターン（毒などは 3）。炎上・体調不良・凍傷の 強さ（付けた人の ATK・INT・DEX）は 住人の いちばん 高い 値
// 〔決〕落ちる：防衛の 報酬（REWARD の module。強さ 1 で 4%〜5 で 20%）。3 つから 1 つ えらぶ。★は 設計図と 同じ（BP_ODDS）〔C〕3 つは 同じ ★・ちがう モジュール。分解は 設計図と 同じ スクラップ
export const MOD_OFFER = 3;
// モジュールの クラフト（2026-11-27 鹿さんの カード「素材 3 しゅるい × 5 こ」：えらんだ モジュールを 1 つ。ボーダーゾーンの 素材 15 こ ＋ 3,000 クレジット）
// 素材は モジュールに 合う 物（鹿さんの 例：もれる 配管＝黒い 油・液化ガス、古い 配電盤＝小さな 回路基盤・真空管、太い 鉄骨＝古い 鉄骨・防壁の 石材）。のこりの 組み合わせは Claude の 案〔C〕
// ★は 防衛の 強さ 4 と 同じ 表（BP_ODDS[4]：★1 20.75・★2 35.75・★3 32・★4 9・★5 2.5%。2026-11-28 鹿さんの カード「強さ 4 の 表」。前は〔C〕強さ 3 の 表）
// 〔C〕★5 だけの 非常用カプセルは 作れない。境界の 6 しゅるい（CPUチップ など）は 使わない
export const MOD_CRAFT = { credits: 3000, n: 5, strength: 4 };
export const MOD_MATS = {
  pipe: ["black_oil", "liquefied_gas", "rubber_scrap"], panel: ["small_circuit", "vacuum_tube", "chip_shard"], cold: ["liquefied_gas", "extinguisher", "acrylic_sheet"],
  mold: ["culture_medium", "waste_root", "feral_grain"], static: ["broken_motor", "small_circuit", "barbed_wire"], slip: ["black_oil", "plastic_scrap", "polymer_chip"],
  board: ["weathered_canvas", "rampart_plaster", "scorched_soil"], neon: ["vacuum_tube", "acrylic_sheet", "chip_shard"], firedoor: ["extinguisher", "rampart_plaster", "old_girder"],
  exitlight: ["small_circuit", "acrylic_sheet", "extinguisher"], beam: ["old_girder", "rampart_stone", "slag"], soundpanel: ["kevlar_fiber", "weathered_canvas", "polymer_chip"],
  boiler: ["liquefied_gas", "broken_motor", "rubber_scrap"], notice: ["plastic_scrap", "weathered_canvas", "chip_shard"], maze: ["rampart_stone", "barbed_wire", "rampart_plaster"],
  camera: ["chip_shard", "small_circuit", "acrylic_sheet"], duct: ["slag", "broken_motor", "rubber_scrap"], capsule: ["polymer_chip", "culture_medium", "kevlar_fiber"],
  gym: ["shell_fragment", "old_girder", "rubber_scrap"], books: ["weathered_canvas", "feral_grain", "waste_root"], plant: ["waste_root", "feral_grain", "culture_medium"],
  cactus: ["barbed_wire", "scorched_soil", "waste_root"], mirror: ["acrylic_sheet", "slag", "polymer_chip"], lockdoor: ["carapace_shard", "old_girder", "kevlar_fiber"],
};
// 防衛に 効く 区画（2026-11-27 鹿さんの カード「新しい形の区画」→「防衛に効く区画」→「この案」）：住めない・素材 3 しゅるい × 10 こ ＋ 20,000 クレジット・1 つの 階に 1 つまで
// 建物の 横に 張り出す 小さな 区画（部屋・廊下・道は かえない）。〔C〕素材の 組み合わせ
// こわせる（2026-11-28 鹿さんの カード「② こわせる ように」→「素材の 半分が もどる」：素材 3 しゅるいが 5 こずつ もどる・クレジットは もどらない・その 階に また 建てられる）
export const SP_BLOCKS = {
  wire: { name: "有刺鉄線の 塀", text: "その 階を 通る 敵の すばやさ −20%", mats: ["barbed_wire", "rampart_stone", "scorched_soil"] },
  tower: { name: "監視塔", text: "その 階の 住人が 戦いの はじめに 先手", mats: ["old_girder", "small_circuit", "weathered_canvas"] },
  ammo: { name: "弾薬庫", text: "その 階の 住人の こうげき ＋15%", mats: ["shell_fragment", "kevlar_fiber", "extinguisher"] },
};
export const SP_COST = { credits: 20000, n: 10 };
export const SP_BACK = 0.5;   // こわした ときに もどる 素材の 割合（10 こ → 5 こ）
export const spBack = (id) => spMats(id).map(([m, n]) => [m, Math.floor(n * SP_BACK)]);
export const SP_FX = { wireAgi: 0.8, ammoAtk: 1.15 };   // すばやさ −20%・こうげき ＋15%（監視塔は 先手：battle-sim の firstStrike）
export const spMats = (id) => (SP_BLOCKS[id] ? SP_BLOCKS[id].mats.map((m) => [m, SP_COST.n]) : []);
export const modCraftMats = (id) => (MOD_MATS[id] || []).map((m) => [m, MOD_CRAFT.n]);
