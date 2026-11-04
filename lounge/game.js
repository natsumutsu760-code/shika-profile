// 見本（lounge-proto）の 計算を 門番から 読む ための 橋。画面と 門番で 同じ 決まりを 使う
// 本物（shika-profile）に 入れる ときは copy-to.sh が 見本の ファイルを lounge/ に ならべ、ここの「./」を「./」に かえる
export { PETS, QUIZ, score, UNLOCK, unlockCost } from "./quiz.js";
export { PLANS, petAt, gambitSlots } from "./builds.js";
export { SHAPE, SP_PER_LV, SET_SLOTS, TREE_SLOTS, FREE_PER_LV, BASE_STATS, canTake, autoTake, learned, growthStats, freeAlloc, freeIsAuto } from "./trees.js";
export { ENEMY_TREES } from "./enemy-trees.js";
export { SKILL } from "./skills.js";
export { EFFECTS } from "./effects.js";
export { runDungeon, tripInit, tripStep, tripResult, startFloor, floorsOpen, newProgress, diaryOf, dungeonRatio, floorRatio, tamedOf, rankOf, invaderFighter } from "./dungeon-sim.js";
export { rng, COND_TEXT, simulate, fighterPower } from "./battle-sim.js";
export { REC_MODES, REC_SCOPES, recommend } from "./recommend.js";   // おすすめ装備
export { DUEL, duelPay, pickFoes, TOUR, TOUR_PAY, tourDay, tourAt, bracketOf, bandMatches, matchSeed, ENC } from "./arena.js";   // 闘技場・派遣先の 戦い
export { floorMap, FLOORS } from "./floors.js";
export { DUNGEONS, DUNGEONS_ALL, ISLAND_OPEN, canGo, tripCost, RUNS, TICK, TOOLS, TOOL_MAX, PURPOSES, SNACK_NEED, SNACK_PRICE, RESEARCH, MAP_STAIRS } from "./dungeons.js";
export { FACILITIES, STORAGE_CAP, EQUIP_CAP, SNACK_RECIPES, snackMats, snackOpen, SNACK_CRAFT_MAX, mapExtra, facCap, facOf, facMax, facLv, hasKnob, band, BAND_AT, upkeep, storageCap, equipCapOf,
  labOff, labMs, snackMore, snackSave, wsMore, wsSave, gymMul, SYNTH_LV, SYNTH_HALF_LV, buildNeed, buildProg, buildMatRatio, buildTimeRatio, buildLeftMs, rushPrice, FUEL, MIGRATE_LV, facFx, buildOff, BUILD_PERK, barMineLv, benchStarMax, benchTopUp } from "./facilities.js";
export { toStash, stashHave, BOX_DAYS, MAT_NAME, MAT_FROM, GATHER, sellPrice } from "./materials.js";
export { CRAFT, SYNTH, craftOpen, synthOpen, synthCredits, rollCraft, rollSynth } from "./recipes.js";
export { OPS, ALL_OPS, opVal, baseOf, BASES, SLOTS, KINDS, FORMS, MATS, COLS, OLD_SLOT, comboOf, opCount, recycleOf, AUTO_SELL_STARS, AUTO_SELL_HOW, autoSellOf, BOSS_CORE, CORE_MAX, opStarOf } from "./equip.js";
export { DEV_IDS, devBase, devNeed, devStarW, devWhere, CRYSTAL_GRADE, CRYSTAL_N } from "./equip-dev.js";   // 装備開発（2026-11-04 に つないだ）
export { SPHERE_LOOK, SPHERE_MAX, opLive, DRAW, rollDraw } from "./sphere.js";   // 宝箱の スフィア
export { TRADERS, SPECIAL, repLv, insPrice, INS_PLAN, REQ_FEE, RES_VALUE, NOTE_PRESETS, NOTE_MAX, NOTE_HIDE_AT, noteBlock } from "./deeplink.js";
export { PRIMARY, PRI_REP, lvOf, lvCap, curTask, curChapter, chapterOpen, chaptersOf, isDone, unlockedBy, KEY_BY, CH_LV } from "./primary.js";
export { chainTask, dailyTask, TASK_TIDS } from "./tasks.js";
export { WS_ITEMS, wsOpen, wsLvOk, attBand, attStarW, WS_MAX, ATT_BASES, ATT_KINDS, ATT_MAX, attBase, rollAtt, withAtt, attName, SMELT, SMELT_MAX, furnaces, smeltOf, smeltDone, WS_PROC, PROC_MAX, procOpen, procOf } from "./workshop.js";   // 工房（道具・アタッチメント）
export { PRIZE_ALWAYS, prizeOf, FURN_PRICE, furnLineup, prizeSlot, slotUntil } from "./prizes.js";   // パチンコの 景品（シーズンラインナップ）
export { mineSlots, mineHours, mineRate, mineDig, MINE_BOOST, boostH, mineCount } from "./mine.js";   // 坑道（前の 隠れ家の 畑は 2026-11-03 に 消した）
export { RANKS, FAMILIES, SPECIES, speciesOf, famOf, candidates, skillOptions, makeChild, canFuse, TWIN_RATE, inbred, researchLeaf } from "./fusion.js";
export { BITEMS, isBItem, bagOf } from "./battle-items.js";   // 戦いで 使う アイテム
export { detailOpen, DETAIL, NUT_SNACKS, nutSnack, NUT_CROP_N, NUT_CRAFT_MAX, NUT, nutOf, nutTotal, nutCap, nutSettle, nutAway, isSweet, eatWait, mysteryRoll } from "./nutrition.js";   // 詳細ステータス・栄養   // モンスターの 配合
export { SUB_MAX, TREE_FULL, PLUS_RATE, FUSE_LV, treesOf, spTotal, spSplit, sexOf, sexByUid, sexOk } from "./monster.js";   // なかまの スキルポイント・性別
