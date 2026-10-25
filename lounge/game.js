// 見本（lounge-proto）の 計算を 門番から 読む ための 橋。画面と 門番で 同じ 決まりを 使う
// 本物（shika-profile）に 入れる ときは copy-to.sh が 見本の ファイルを lounge/ に ならべ、ここの「./」を「./」に かえる
export { PETS, QUIZ, score } from "./quiz.js";
export { PLANS, petAt, gambitSlots } from "./builds.js";
export { SHAPE, SP_PER_LV, SET_SLOTS, TREE_SLOTS, FREE_PER_LV, BASE_STATS, canTake, autoTake, learned, growthStats } from "./trees.js";
export { ENEMY_TREES } from "./enemy-trees.js";
export { SKILL } from "./skills.js";
export { EFFECTS } from "./effects.js";
export { runDungeon, tripInit, tripStep, tripResult, startFloor, floorsOpen, newProgress, diaryOf, dungeonRatio, floorRatio, tamedOf, rankOf } from "./dungeon-sim.js";
export { rng, COND_TEXT, simulate, fighterPower } from "./battle-sim.js";
export { DUEL, duelPay, pickFoes, TOUR, TOUR_PAY, tourDay, tourAt, bracketOf, matchSeed } from "./arena.js";   // 闘技場
export { floorMap, FLOORS } from "./floors.js";
export { DUNGEONS, RUNS, TICK, TOOLS, PURPOSES, SNACK_NEED, SNACK_PRICE, RESEARCH } from "./dungeons.js";
export { FACILITIES, STORAGE_CAP, SNACK_RECIPES, snackMats, SNACK_CRAFT_MAX } from "./facilities.js";
export { toStash, stashHave, BOX_DAYS, MAT_NAME, GATHER, sellPrice } from "./materials.js";
export { CRAFT, SYNTH, craftOpen, synthOpen, synthBalls, rollCraft, rollSynth } from "./recipes.js";
export { OPS, baseOf, BASES, SLOTS, KINDS, FORMS, MATS, COLS, OLD_SLOT, comboOf, opCount, SCRAP_BALLS, SCRAP_CREDITS, recycleOf } from "./equip.js";
export { TRADERS, SPECIAL, repLv, REQ_FEE, RES_VALUE, NOTE_PRESETS, NOTE_MAX, NOTE_HIDE_AT, noteBlock } from "./deeplink.js";
export { chainTask, dailyTask, TASK_TIDS } from "./tasks.js";
export { WS_ITEMS, WS_MAX, ATT_BASES, ATT_KINDS, ATT_MAX, attBase, rollAtt, withAtt, attName } from "./workshop.js";   // 工房（道具・アタッチメント）
export { CROPS, cropOf, ROW, plotCount, growMs, SPRINKLERS, harvestPlot, mineSlots, mineHours, mineRate, mineDig } from "./farm.js";   // 畑と 坑道
