// 英語の 名前（id ごと。鹿さんの頼み、2026-10-25：ラウンジ・派遣まわりの 英語ローカライズ）
// lounge-en-dict.js が データの 日本語の 名前と ならべて「日本語 → 英語」の 辞書に する（日本語の 名前を かえても、id が 同じなら 英語は そのまま）
// ここに ない id（新しく 足した 敵・素材 など）は 日本語の まま 出る。足すのは id と 英語だけ
import { EFFECTS } from "./effects.js";
import { ENEMY_TREES } from "./enemy-trees.js";
import { TYPES, COMMON, TREES } from "./skills.js";
import { DUNGEONS, PURPOSES, TOOLS, RUNS } from "./dungeons.js";
import { GATHER, ENEMY_MAT } from "./materials.js";
import { KINDS, SLOTS, FORMS, MATS, COLS, BASES, UPPER, OPS } from "./equip.js";
import { FACILITIES, SNACK_RECIPES, PC } from "./facilities.js";
import { WS_ITEMS, ATT_KINDS, ATT_BASES } from "./workshop.js";
import { FURN } from "./lounge-rules.js";
import { PETS, QUIZ } from "./quiz.js";
import { TRADERS, SPECIAL } from "./deeplink.js";

const SL = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", int: "INT", res: "RES", agi: "AGI", dex: "DEX", luk: "LUK" };

// ---- 素材 ----
export const MAT_EN = {
  herb: "Herb", pebble: "Shiny Pebble", straw: "Straw", berry: "Wild Berry", clover: "Four-Leaf Clover",
  brick: "Old Brick", sleepmoss: "Sleepy Moss", stardust: "Star Sand", oldcloth: "Faded Cloth", dreamshard: "Dream Shard",
  oldnail: "Old Nail", nightbloom: "Night Bloom", wellwater: "Well Water", candle: "Candle", moondrop: "Moon Drop",
  crystalbit: "Crystal Shard", glowstone: "Glowstone", deepwater: "Deep Water", ironore: "Iron Ore", rainbowcrystal: "Rainbow Crystal",
  hare_horn: "Rabbit Horn", goblin_knife: "Goblin Knife", kobold_fur: "Kobold Fur", old_score: "Old Sheet Music", crown_shard: "Crown Shard",
  golem_stone: "Golem Stone", ghost_cloth: "Spirit Cloth", mimic_tooth: "Mimic Tooth", dream_feather: "Dreaming Feather", sleep_hourglass: "Sleep Hourglass",
  wolf_fang: "Wolf Fang", shadow_shard: "Shadow Shard", poison_vial: "Poison Vial", light_drop: "Lamplight Drop", midnight_bell: "Midnight Bell",
  crystal_scale: "Crystal Scale", bat_wing: "Bat Wing", slime_core: "Slime Core", rainbow_shell: "Rainbow Shell Piece", dragon_crystal: "Dragon Crystal",
  // ニライ諸島（2 つめの 島）
  whitesand: "White Sand", seashell: "Tiny Seashell", coconut: "Coconut", aasa: "Aasa Seaweed", pinkcoral: "Pink Coral",
  sailcloth: "Old Sailcloth", emptybottle: "Empty Bottle", rustchain: "Rusty Chain", oldcoin: "Old Gold Coin", mapscrap: "Treasure Map Scrap",
  seagrass: "Sea Breeze Grass", lampglass: "Lighthouse Glass", capestone: "Cape Stone", akabanaa: "Akabanaa Hibiscus", suncrystal: "Sun Crystal",
  shipwood: "Ship Timber", barnacle: "Barnacle", rustfitting: "Rusty Fitting", brasspart: "Brass Part", sunkengold: "Sunken Gold Coin",
  pearl: "Pearl", fallwater: "Waterfall Water", bluestone: "Blue Stone", glowmoss: "Glowing Moss", mermaidtear: "Mermaid's Tear",
  ash: "Volcanic Ash", sulfur: "Sulfur", obsidian: "Obsidian", lavarock: "Lava Rock", fireheart: "Heart of Fire",
  driftwood: "Driftwood", thunderstone: "Thunder Stone", seafeather: "Seabird Feather", stormcloud: "Storm Cloud", windorb: "Wind Orb",
  marble: "White Marble", bluecoral: "Blue Coral", holyshell: "Holy Shell", oldbell: "Old Bell", seagodpearl: "Sea God's Pearl",
  blacksail: "Black Sail", onibi: "Blue Will-o'-Wisp", shipbell: "Old Ship's Bell", bonechip: "Bone Fragment", logbook: "Captain's Log",
  abyssmud: "Abyssal Mud", glowbubble: "Glowing Bubble", abyssstone: "Abyssal Stone", oldgear: "Ancient Gear", gatestone: "Gate Keystone",
  crab_claw: "Coconut Crab Claw", gull_feather: "Gull Feather", sahagin_scale: "Sahagin Scale", rainbow_fin: "Rainbow Fin", king_shell: "King's Shell",
  pirate_bandana: "Pirate Bandana", parrot_feather: "Parrot Feather", barrel_hoop: "Barrel Hoop", old_compass: "Old Compass", red_beard: "Red Beard",
  keeper_key: "Lighthouse Key", harpy_talon: "Harpy Talon", shisa_tile: "Shisa Roof Tile", glimmer_dust: "Glimmer Dust", fog_core: "Fog Core",
  sailor_bone: "Sailor's Bone", barnacle_plate: "Barnacle Plate", jelly_gel: "Jellyfish Gel", gold_claw: "Golden Claw", octo_ink: "Giant Octopus Ink",
  siren_scale: "Siren Scale", eel_skin: "Eel Skin", clam_shell: "Giant Clam Shell", song_pearl: "Singing Pearl", queen_comb: "Queen's Comb",
  lava_scale: "Lava Scale", hidama_ember: "Hidama Ember", obsidian_core: "Obsidian Core", firechick_down: "Firebird Down", salamander_tail: "Salamander Tail",
  thunder_feather: "Thunder Feather", whirl_pearl: "Whirlpool Orb", storm_plank: "Storm Plank", vane_feather: "Weathervane Feather", irabu_fang: "Irabu Fang",
  guard_crest: "Guard's Crest", trident_tip: "Trident Tip", priest_scale: "Priest's Scale", white_fin: "White Fin", seagod_scale: "Sea God's Scale",
  ghost_rope: "Ghost Rope", majimun_mask: "Majimun Mask", doll_button: "Doll's Button", cat_bell: "Cat's Bell", captain_hat: "Captain's Hat",
  angler_lamp: "Anglerfish Lure", squid_beak: "Squid Beak", giant_shell: "Giant's Shell", deep_glow: "Deep-Sea Glow", gate_shard: "Gate Shard",
};

// ---- 行き先と 敵（敵は ツリーの id で） ----
export const DUNGEON_EN = {
  hals: { name: "Hals Road", text: "An old road through the meadows. Perfect for a first adventure" },
  morph: { name: "Morpheus Ruins", text: "Stone ruins of a dreaming god. Walking here makes you sleepy" },
  kurai: { name: "Dark Village", text: "A village where dawn never comes. Nobody lives there, yet the lights turn on" },
  crystal: { name: "Crystal Cave", text: "A cave of glowing crystals. Something big waits deep inside" },
};
export const MYTHIC_EN = {
  halsCloak: ["Hals Travel Cloak", "Seasoned Feet: AGI +30% and Evasion +10% for the first 2 turns"],
  morphMask: ["Mask of Morpheus", "God of Dreams: 15% chance to put the foe to sleep at the start of your turn"],
  kuraiLantern: ["Dark Village Lantern", "Shadow Light: Prank damage +10%, foe accuracy −5%"],
  crystalCrown: ["Crystal Crown", "Crystal Body: damage taken −8%; extra damage from critical hits becomes cracks, taken over 3 turns"],
};
export const ENEMY_EN = {
  e_hare: ["Horn Rabbit", "Meadow Hopper"], e_thief: ["Goblin", "Thief's Tricks"], e_watch: ["Kobold", "Sentry Shield"], e_bard: ["Lost Bard", "Traveling Songs"], e_boss_thief: ["Goblin King", "Chief's Command"],
  e_sentinel: ["Stone Golem", "Stone Guard"], e_ghost: ["Phantom", "Ghost Whispers"], e_trapper: ["Mimic", "Trapper's Gadgets"], e_owl: ["Dream Owl", "Dreaming Feather"], e_boss_sleep: ["Hypnos", "Temple of Sleep"],
  e_wolf: ["Werewolf", "Night Wolf's Fang"], e_shade: ["Shadow", "Shadow Stitch"], e_witch: ["Witch of the Old Well", "Poison from the Well"], e_lantern: ["Wisp", "Lamplight Prayer"], e_boss_mayor: ["Mayor's Shadow", "Shadow Mayor"],
  e_lizard: ["Crystal Lizard", "Crystal Scale"], e_bat: ["Cave Bat", "Ultrasonic"], e_crystal: ["Gem Slime", "Crystal Chill"], e_turtle: ["Rainbow Turtle", "Rainbow Shell"], e_boss_crystal: ["Crystal Dragon", "Guardian Crystal"],
};

// ---- 技（職業と 敵） ----
export const SKILL_EN = {
  kogeki: "Attack", bougyo: "Guard",
  yamakan: "Lucky Guess Punch", udemakuri: "Roll Up Sleeves", chop: "Knife-Hand Chop", tossin: "Flying Headbutt", elbow: "Elbow Drop", brazil: "Brazilian Kick", swing: "Giant Swing", chabudai: "Table Flip",
  yaruki: "Fired Up", kyusho: "Sees Weak Spots", ukemi: "Good at Falling", oiuchi: "Pursuit", kokozo: "Clutch Hit", nori: "In the Groove", kajiba: "Adrenaline Rush",
  bakuchiku: "Firecrackers", note: "Check the Game Plan", kamifubuki: "All the Confetti", lighter: "Lighter Spray", kutsushita: "Stinky Sock Toss", mushimegane: "Magnifying Glass Sunbeam", tamago: "Rotten Egg Toss", hanabi: "Fireworks Rocket",
  monoshiri: "Know-It-All", hirameki: "Bright Idea", hiasobi: "Playing with Fire", nioi: "Lingering Smell", fullpower: "Full Power", oyatsu: "Snack Break", kaigi: "Solo Strategy Meeting",
  chokomaka: "Scurry Tap", kancho: "Sneaky Poke", hanakuso: "Booger Flick", banana: "Banana Peel Trap", patchin: "Clap in the Face", kinoko: "Feed a Weird Mushroom", kori: "Ice Down the Back", decopin: "Finishing Forehead Flick",
  sekkachi: "Impatient", ijiwaru: "Mean Streak", shibire: "Numbing Pro", metsubushi: "Blinding Pro", mawaru: "Poison Spreads", shitsukoi: "Persistent", tensai: "Prank Genius",
  okashi: "Snack Time", sekkyo: "Long Lecture", mizu: "Water Splash", genetsu: "Fever Medicine", drink: "Energy Drink", negi: "Leek Scarf", bansoko: "Band-Aid", hirune: "Deep Nap",
  kuishinbo: "Big Eater", hayane: "Early to Bed", ugai: "Gargle & Wash Hands", radio: "Morning Exercises", atsugi: "Bundled Up", bansokoP: "Band-Aid Pro", akiramenai: "Never Give Up",
  peekaboo: "Peekaboo Stance", manju: "Push and Shove", clinch: "Clinch", tomoe: "Circle Throw", ground: "Ground Position", noshikakari: "Body Press", danboru: "Hide in a Box", kotatsu: "Get in the Kotatsu",
  ishiatama: "Hard Head", funbari: "Hold the Line", togefuku: "Spiky Clothes", newaza: "Grappling Master", minokonashi: "Light on Your Feet", danboruP: "Cardboard Craftsman", makezu: "Sore Loser",
  // 敵
  e_hopkick: "Hop Kick", e_ashibarai: "Leg Sweep", e_stepin: "Step In", e_parakick: "Paralyze Kick", e_nidan: "Double Jump Kick", e_shippu: "Gale Kick", e_shibirekona: "Numbing Powder Leap", e_moonsault: "Moonsault Kick",
  e_migaru: "Light-Footed", e_shibirekokoro: "Numbing Know-How", e_raikyaku: "Thunder Legs", e_rentobi: "Chain Hops", e_sakigake: "Vanguard", e_datto: "Bolt Like a Hare", e_shippukago: "Blessing of the Gale",
  e_knife: "Knife Slash", e_suri: "Pickpocket", e_kayakudama: "Powder Ball", e_dokasen: "Fuse", e_haigo: "Backstab", e_kaenbin: "Firebomb", e_kemuridama: "Smoke Ball", e_daitozoku: "Master Thief's Strike",
  e_nukiashi: "Sneak Step", e_kayaku: "Powder Handling", e_kajidoro: "Looting the Fire", e_kyushonerai: "Aim for Vitals", e_hinoko: "Sparks", e_nigeashi: "Quick Escape", e_tozokukan: "Thief's Instinct",
  e_tatenaguri: "Shield Smack", e_shieldup: "Shield Up", e_mihari: "Sentry Stance", e_bash: "Shield Bash", e_keiteki: "Alarm Whistle", e_teppeki: "Iron Wall", e_nakama: "Call for Backup", e_jouheki: "Rampart Shield",
  e_katai: "Tough Body", e_miharime: "Sentry's Eye", e_tatekokoro: "Shield Know-How", e_menekikokoro: "Immunity Know-How", e_bougyokokoro: "Guard Know-How", e_fukutsu: "Indomitable", e_teppekimuso: "Impregnable",
  e_lute: "Lute Bonk", e_komoriuta: "Lullaby", e_iyashi: "Healing Song", e_akumu: "Nightmare Tune", e_yuuki: "Song of Courage", e_nemuri: "Sleep Melody", e_shukufuku: "Song of Blessing", e_owari: "Song of Journey's End",
  e_koe: "Carrying Voice", e_tabinare: "Seasoned Traveler", e_yumemi: "Dreamer's Know-How", e_ouen: "Great Cheerleader", e_komori: "Master Babysitter", e_iyashikoe: "Soothing Voice", e_ginyu: "Bard's Blessing",
  e_kyokuto: "Scimitar Flash", e_gorei: "Chief's Command", e_tame: "Power Up", e_nitoryu: "Dual Wield", e_iatsu: "Intimidate", e_arashi: "Storm Combo", e_takara: "Sit on the Treasure", e_ogiri: "Chief's Great Slash",
  e_chikara: "Show of Strength", e_shuraba: "Battle-Hardened", e_kyusho2: "Aim for Vitals", e_kowai: "Scary Face", e_rengeki: "Combo Master", e_ganjo: "Sturdy", e_kanroku: "Chief's Presence",
  e_ishikobushi: "Stone Fist", e_sekka: "Petrify Stance", e_stonewall: "Stone Wall", e_iwakudaki: "Rock Smash", e_mayoke: "Warding Stone", e_press: "Golem Press", e_ishinemuri: "Stone Slumber", e_shugojo: "Guardian's Rampart",
  e_ishikarada: "Stone Body", e_omoi: "Heavy Body", e_kudaku: "Crushing Power", e_mahajiki: "Repel Evil", e_fudo: "Immovable", e_ishiuroko: "Stone Scales", e_shugosha: "Stone Guardian",
  e_ghosttouch: "Ghost Touch", e_sasayaki: "Whisper", e_jubaku: "Binding Curse", e_mindcrash: "Mind Crash", e_tamanuki: "Soul Drain", e_kyoki: "Whisper of Madness", e_reiki: "Spirit Wall", e_meikai: "Underworld Wail",
  e_reitai: "Spirit Form", e_kodai: "Ancient Knowledge", e_kyokikokoro: "Madness Know-How", e_tamagui: "Soul Eater", e_madowashi: "Bewitching Voice", e_surinuke: "Phase Through", e_onnen: "Grudge",
  e_nagenaif: "Throwing Knife", e_torabasami: "Bear Trap", e_metsubushiko: "Blinding Powder", e_bakudan: "Rigged Bomb", e_kusari: "Chain Weight", e_otoshiana: "Pitfall", e_dokuya: "Poison Dart", e_oshikake: "Trapper's Grand Scheme",
  e_kiyo: "Nimble Hands", e_wanakokoro: "Trap Know-How", e_bakuyaku: "Explosives Expertise", e_hayate: "Quick Hands", e_torabasamimeijin: "Bear Trap Master", e_dokuatsukai: "Poison Handling", e_junbi: "All Set",
  e_tsutsuku: "Peck", e_habataki: "Sleep Feather", e_hazukuroi: "Preen", e_yumegui: "Dream Eater", e_tsukinohikari: "Moonlight", e_fukainemuri: "Deep Sleep", e_chienome: "Eye of Wisdom", e_yumenokuni: "Dreamland",
  e_yorume: "Night Vision", e_shizukahane: "Silent Wings", e_akumukokoro: "Nightmare Know-How", e_tsukikago: "Moon's Blessing", e_nemurikona: "Sleep Powder", e_kenja: "Sage's Eye", e_yumemikago: "Dreamer's Blessing",
  e_nemuritsue: "Staff of Sleep", e_sleepmist: "Sleep Mist", e_shindenkago: "Temple's Blessing", e_nightmare: "Nightmare", e_madoromi: "Drowsy Fog", e_eien: "Eternal Sleep", e_yumenomon: "Gate of Dreams", e_sabaki: "Judgment of Morpheus",
  e_shindenmamori: "Temple Guard", e_nemuritsukai: "Sleep Master", e_akumunushi: "Lord of Nightmares", e_madoromika: "Drowsy Incense", e_yumefukami: "Depths of Dreams", e_yumebannin: "Dream Keeper", e_nemurigami: "God of Sleep",
  e_kamitsuki: "Bite", e_tooboe: "Howl", e_tsumetogi: "Claw Sharpening", e_nodobue: "Go for the Throat", e_renzokugami: "Rapid Bites", e_mureboe: "Pack Howl", e_chinokawaki: "Bloodthirst", e_tsukiyo: "Moonlit Hunt",
  e_ookaminoashi: "Wolf Legs", e_yakosei: "Nocturnal", e_karihonno: "Hunting Instinct", e_murerenkei: "Pack Tactics", e_kyofu: "Terrifying Voice", e_chinonioi: "Scent of Blood", e_tsukiookami: "Moon Wolf",
  e_kagenote: "Shadow Hand", e_kagekakushi: "Shadow Veil", e_bunshin: "Shadow Clone", e_stitch: "Shadow Stitch", e_ashimoto: "Shadow Underfoot", e_tobari: "Curtain of Night", e_kagewatari: "Shadow Walk", e_kagegui: "Shadow Eater",
  e_yami: "Melt into Darkness", e_kagenome: "Shadow Eye", e_kagenui: "Shadow-Stitch Art", e_kagenoashi: "Shadow Feet", e_fukaiyami: "Deep Darkness", e_kagemusha: "Body Double", e_kagenoo: "Shadow King",
  e_hishaku: "Ladle Whack", e_poisonsplash: "Poison Splash", e_ayashiikusuri: "Shady Potion", e_venomburst: "Venom Burst", e_idonosasoi: "Lure to the Well", e_poisonmist: "Poison Mist", e_noroiningyo: "Cursed Doll", e_ogama: "Witch's Cauldron",
  e_dokusen: "Venom Gland", e_dokuatsukai2: "Poison Handling", e_koidoku: "Thick Poison", e_majosasayaki: "Witch's Whisper", e_dokunokiri: "Toxic Fog", e_majokakei: "Witch Bloodline", e_modokukarada: "Venomous Body",
  e_lanterntataku: "Lantern Bonk", e_chiisanaakari: "Little Light", e_kiyomenohi: "Purifying Flame", e_tomoshibi: "Lamplight Shield", e_mabushii: "Dazzling Light", e_inorinohi: "Prayer Light", e_onibi: "Will-o'-Wisp", e_michibiki: "Guiding Light",
  e_akarimamori: "Light's Protection", e_atatakai: "Warm Hands", e_hinomamori: "Fire's Protection", e_hikarinome: "Eye of Light", e_inorinokokoro: "Prayerful Heart", e_moeruakari: "Burning Light", e_mayoibikago: "Blessing of the Lost Light",
  e_kagetsue: "Shadow Staff", e_okite: "Village Law", e_kageiyashi: "Shadow Mend", e_kagesui: "Shadow Siphon", e_yaminokeiyaku: "Dark Pact", e_yorunokane: "Midnight Bell", e_kagekekkai: "Shadow Barrier", e_shinpan: "Judgment of Night",
  e_chorochie: "Elder's Wisdom", e_kagekago: "Shadow's Blessing", e_seikikyushu: "Life Drain", e_igen: "Mayor's Dignity", e_shikitari: "Village Custom", e_kagenokabe: "Shadow Wall", e_fushi: "Undying Shadow",
  e_shippouchi: "Tail Whip", e_sakadateru: "Bristle Scales", e_kesshoyoroi: "Crystal Armor", e_hansha: "Mirror Scales", e_suishokiba: "Crystal Fang", e_crystalshell: "Crystal Shell", e_onorengeki: "Tail Combo", e_shoheki: "Crystal Wall",
  e_kataiuroko: "Hard Scales", e_togetoge: "Spiky", e_tsumetaiuroko: "Cold Scales", e_karinokiba: "Hunting Fang", e_ganjokara: "Sturdy Shell", e_rengekishippo: "Combo Tail", e_suishokarada: "Crystal Body",
  e_batkami: "Bite", e_choonpa: "Ultrasonic", e_kyuketsu: "Blood Suck", e_onpaho: "Sonic Cannon", e_haoto: "Wings in the Dark", e_kyoranhabataki: "Frenzied Flapping", e_kyuketsuutage: "Blood Feast", e_taigun: "Bat Swarm",
  e_batbata: "Flutter", e_echo: "Echolocation", e_otonotatsujin: "Sound Master", e_yaminohane: "Dark Wings", e_choonpakokoro: "Ultrasonic Know-How", e_chinomeguri: "Circulation", e_yorushihai: "Ruler of the Night",
  e_iceshot: "Ice Shot", e_frosttouch: "Frost Touch", e_korinokagami: "Ice Mirror", e_crystalbreak: "Crystal Break", e_freeze: "Freeze", e_blizzard: "Blizzard", e_korinoro: "Ice Prison", e_zettaireido: "Absolute Zero",
  e_tsumetaikarada: "Cold Body", e_reiki2: "Chill", e_kudakureiki: "Shattering Chill", e_kogoeru: "Freezing Fingers", e_fubuki: "Blizzard Know-How", e_korimamori: "Ice Guard", e_suishokokoro: "Crystal Heart",
  e_koraattack: "Shell Attack", e_komoru: "Withdraw", e_nanairo: "Rainbow Light", e_prism: "Prism Guard", e_nijihansha: "Rainbow Reflect", e_yosai: "Shell Fortress", e_senko: "Rainbow Flash", e_mannen: "Ancient Shell",
  e_jobukora: "Tough Shell", e_yukkuri: "Slowpoke", e_hikarikabe: "Wall of Light", e_hanshakora: "Reflecting Shell", e_koramamori: "Shell Guard", e_mabushikora: "Dazzling Shell", e_choju: "Longevity",
  e_kesshokobushi: "Crystal Fist", e_kesshoka: "Crystallize", e_mamoritekamae: "Guardian Stance", e_lance: "Crystal Lance", e_shoko: "Crystal Gleam", e_kesshoarashi: "Crystal Storm", e_suishosaisei: "Crystal Regrowth", e_daikessho: "Great Guardian Crystal",
  e_kesshokarada: "Crystalline Body", e_hokori: "Guardian's Pride", e_suishoyaiba: "Crystal Blade", e_hikaruhitomi: "Glowing Eyes", e_arashikessho: "Storm Crystal", e_saiseikessho: "Regenerating Crystal", e_suishoou: "Crystal King",
};
// 職業の 技の 説明（手で 書いた 文なので id ごと）
export const SKILL_TEXT_EN = {
  kogeki: "Power 8. Strength uses the highest of ATK, INT and DEX",
  bougyo: "Guard (half direct damage until your next turn), MP +2",
  yamakan: "A wild swing. Power 13. Strength uses LUK (luck) instead of ATK. Crit +20%",
  udemakuri: "Charge (next direct attack ×2) and Focus (3 turns. Recover 20% of max MP after acting)",
  chop: "Power 22. Acts last next turn",
  tossin: "Power 25. Take 1/4 of the damage dealt yourself",
  elbow: "Power 15. ×2 if the foe's HP is 35% or less",
  brazil: "Power 15. It comes down from above, ignoring half the foe's DEF. 60% chance to hit the head: Daze (2 turns)",
  swing: "Spin them around. Power 17. 60% chance the foe gets dizzy: Confusion (2 turns)",
  chabudai: "Power 40. Never misses",
  yaruki: "ATK +20%. The momentum perks you up: heal 9% of damage dealt",
  kyusho: "Crit +5%",
  ukemi: "Recoil damage halved",
  oiuchi: "Moves +15% when the foe's HP is half or less",
  kokozo: "Critical damage +30%",
  nori: "Moves +10% if you hit last turn",
  kajiba: "ATK +30% when your HP is 30% or less",
  bakuchiku: "Power 6 × 3 (each hit rolls to land)",
  note: "Charge (next direct attack ×2) and Focus (1 turn. Recover 20% of max MP after acting)",
  kamifubuki: "Throw all the saved-up paper. Power 14. Strength uses current MP instead of INT (more MP, more power)",
  lighter: "Power 20. Scalds the foe (3 turns. Direct damage taken ×1.1)",
  kutsushita: "The smell inflicts Sickness +5 (INT-based damage over time. 30% chance of Fatigue)",
  mushimegane: "Power 12. Ignores half the foe's RES",
  tamago: "Poison +7, Rot (3 turns. Healing turns into damage)",
  hanabi: "Power 44",
  monoshiri: "INT +3%",
  hirameki: "Prank crit +12%",
  hiasobi: "Pranks +30% when the foe is Scalded or Burning",
  nioi: "Sickness and Poison you inflict last +1 turn",
  fullpower: "Pranks +10% while MP is half or more",
  oyatsu: "MP +1 every turn",
  kaigi: "Focus at battle start (3–5 turns. Recover 20% MP after acting)",
  chokomaka: "Two quick pokes (Power 8 × 2). Strength uses AGI (speed). Always acts first",
  kancho: "Power 9 (DEX). Ignores 30% of the foe's RES. Paralysis +30 (0.5% chance per point to be unable to move)",
  hanakuso: "Power 4 (DEX). Blinds the foe (3 turns. Move accuracy halved). Picking your nose calms you down: Focus (2 turns)",
  banana: "Pops Paralysis. Power 4 (DEX), +1 power per 5 Paralysis on the foe. On hit, clears Paralysis; if it was 30+, 65% chance they slip and are Stunned (1 turn)",
  patchin: "Pops Blind. Power 4 (DEX), +6 power per turn of Blind left. On hit, clears Blind; 70% chance of Daze (2 turns)",
  kinoko: "Poison +8 (damage of max HP × amount% at the start of each turn). An upset stomach causes Rot (2 turns. Healing turns into damage)",
  kori: "Power 6 (DEX). Frostbite +2. If Frostbite is 4+, 60% chance to Freeze (1 turn)",
  decopin: "Power 6 (DEX). +4 power per debuff on the foe. On hit, pops and clears all of the foe's debuffs",
  sekkachi: "AGI +10%",
  ijiwaru: "Damage dealt +6% per debuff on the foe (up to +30%)",
  shibire: "Paralysis you inflict +50%. Numb foes can't put power into it, so Counter and Thorns damage they return is halved",
  metsubushi: "Blind you inflict +1 turn. Crit +10% vs. Blinded foes",
  mawaru: "Poison you inflict deals ×1.2 damage",
  shitsukoi: "Debuffs you inflict last +1 turn",
  tensai: "Debuffs you inflict ignore half of the foe's resistance and Immunity",
  okashi: "Heal 35% HP. The excess becomes Overheal (5 turns)",
  sekkyo: "A long, nagging lecture. Power 15. Strength uses RES (patience) instead of INT",
  mizu: "Power 12. Removes 1 buff from the foe (healing and MP buffs first). Soaked: Fatigue (1 turn. Removes Focus; lose 10% MP at the start of each turn)",
  genetsu: "Cleanse (remove all your debuffs), heal 20% HP, Immunity +22",
  drink: "A pick-me-up: ATK Up 20 and INT Up 30 (3 turns), Cleanse (remove all your debuffs), Focus (1 turn)",
  negi: "Cleanse (remove all your debuffs), Regen +13 (heal max HP × amount% at the start of each turn, then the amount halves)",
  bansoko: "Shield (absorbs damage up to 28% of max HP)",
  hirune: "Cleanse and fully heal HP. Then you fall asleep (1 turn. 50% chance to wake when hit)",
  kuishinbo: "Healing +5%. You eat so happily that when your own moves heal you, the foe gets jealous and takes damage equal to 18% of the heal",
  hayane: "Heal 0.6% HP every turn",
  ugai: "Immunity +15 at battle start",
  radio: "Stat-up buffs you cast on yourself last +2 turns",
  atsugi: "RES +10%. All bundled up: Prank damage taken −15% (works even if RES is ignored)",
  bansokoP: "Your Shields +55%",
  akiramenai: "Once per match, when HP hits 0, get back up with 30% HP",
  peekaboo: "Protect your face. Guard (half direct damage until your next turn), Armor +13 and Ward +13 (halve each time you're hit). Catch your breath: Focus (2 turns)",
  manju: "Power 16. Strength uses DEF instead of ATK. Each push builds power: Pierce +5 (adds 5 to your next direct attack)",
  clinch: "Grab on: foe ATK Down 45 and INT Down 30 (2 turns). The squeeze causes Fatigue (2 turns. Removes Focus; lose 10% MP at the start of each turn)",
  tomoe: "Brace first: Counter (until your next turn, throw back 90% of direct damage taken). Always acts first",
  ground: "Pin them down. 60% chance: for 2 turns neither side can move and the foe loses 7.5% HP each turn (40% chance they break free)",
  noshikakari: "Flop on top of them. Power 10. Strength uses your max HP instead of ATK (heavier hurts more: 4 HP = 1 ATK)",
  danboru: "Barrier +1 (blocks 1 direct attack)",
  kotatsu: "Armor +50, Ward +50, Regen +20",
  ishiatama: "Immunity +60 at battle start (blocks debuffs 60% of the time. 2–3 turns)",
  funbari: "Rebirth at battle start (once, hang on with 1 HP)",
  togefuku: "Thorns +80 at battle start (when hit directly, return ATK × amount%, then the amount halves). Counter damage also adds 17% of DEF",
  newaza: "Pin damage ×1.1",
  minokonashi: "Evasion +12%",
  danboruP: "Barriers you give yourself +1",
  makezu: "DEF and RES +30% when HP is half or less",
};
// 職業（タイプ）
export const TYPE_EN = {
  attacker: ["Attacker", "Big damage with moves"], caster: ["Caster", "Attacks with pranks"], technician: ["Technician", "Stacks status effects, then pops them"],
  healer: ["Healer", "Healing and buffs"], defender: ["Defender", "Protects, endures, strikes back"],
};

// ---- 状態（バフ・デバフ） ----
export const FX_EN = {
  regen: ["Regen", "At the start of each turn, heal max HP × amount%, then the amount halves"],
  focus: ["Focus", "Recover 20% of max MP after acting"],
  blessing: ["Blessing", "Recover 20% of max HP after acting"],
  reincarnation: ["Rebirth", "When HP would hit 0, hang on with 1 HP"],
  guard: ["Guard", "Direct damage taken is halved"],
  barrier: ["Barrier", "Nullifies 1 direct attack; the amount drops by 1"],
  substitute: ["Substitute", "Takes direct attacks for an ally (unused in 1-on-1)"],
  shield: ["Shield", "Absorbs that much damage"],
  overheal: ["Overheal", "Stores healing beyond max HP and absorbs damage with it (before Shield)"],
  thorns: ["Thorns", "When hit directly, return your ATK × amount% (reduced by the foe's DEF), then the amount halves"],
  armor: ["Armor", "Move damage −amount% (up to 90%), then the amount halves"],
  ward: ["Ward", "Prank damage −amount% (up to 90%), then the amount halves"],
  conceal: ["Conceal", "Can't be targeted (unused in 1-on-1)"],
  immunity: ["Immunity", "Blocks debuffs (amount − Weakness)% of the time (up to 95%)"],
  activation: ["Activation", "Move MP cost halved (rounded up)"],
  counter: ["Counter", "When hit directly, return 50% of the damage taken"],
  mirage: ["Mirage", "Dodge direct attacks amount% of the time (total evasion up to 75%); dodging halves the amount"],
  pierce: ["Pierce", "Adds the amount to direct attack damage as-is, then the amount halves"],
  frenzy: ["Frenzy", "Damage dealt ×2, damage taken ×1.5. Uses random moves"],
  clarity: ["Clarity", "Attacks always crit"],
  mastery: ["Mastery", "On a move crit, add DEX × amount%, then the amount halves"],
  haste: ["Haste", "Multi-hit moves get +1–3 hits (damage split across hits)"],
  charge: ["Charge", "Next direct attack deals ×2 damage"],
  poison: ["Poison", "At the start of each turn, take max HP × amount% damage"],
  venom: ["Venom", "Take 20% of max HP as damage after acting"],
  burn: ["Burn", "At the start of each turn, take the inflicter's ATK × 0.1 × amount damage (reduced by DEF). 30% chance of Scald"],
  sickness: ["Sickness", "At the start of each turn, take the inflicter's INT × 0.2 × amount damage (reduced by RES). 30% chance of Fatigue"],
  frostbite: ["Frostbite", "At the start of each turn, take the inflicter's DEX × 0.2 × amount damage (reduced by DEF). On Freeze, take amount × DEX ÷ 10 damage"],
  freeze: ["Freeze", "Can't move. A direct hit thaws it and deals 10% of max HP as piercing damage"],
  stun: ["Stun", "Can't move"],
  scald: ["Scald", "Direct damage taken ×1.1, Burn damage ×1.5"],
  silence: ["Silence", "Can only use Attack"],
  fatigue: ["Fatigue", "AGI halved. Lose 10% of max MP at the start of each turn"],
  weakness: ["Weakness", "Cancels amount% of Immunity"],
  sleep: ["Sleep", "Can't move. 50% chance to wake when hit directly"],
  paralysis: ["Paralysis", "Each turn, amount × 0.5% chance to be unable to move (up to 50%)"],
  blind: ["Blind", "Move accuracy halved"],
  confusion: ["Confusion", "Uses random moves on yourself or the foe"],
  daze: ["Daze", "Attacks taken always crit. 10% chance of Stun when hit directly"],
  rot: ["Rot", "Healing turns into that much damage"],
  curse: ["Curse", "Unused"],
};
for (const k of Object.keys(SL)) { FX_EN[`up_${k}`] = [`${SL[k]} Up`, `${SL[k]} +amount%`]; FX_EN[`down_${k}`] = [`${SL[k]} Down`, `${SL[k]} −amount%`]; }
const L = (id) => (FX_EN[id] || [id])[0];
const turns = (n) => `${n} turn${n === 1 ? "" : "s"}`;
// 敵の 技の 説明（enemy-trees.js の describe と 同じ 組み立てで 英語に）
export function describeEn(fx) {
  const NUM = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"], out = [];
  for (const x of fx) {
    if (x.t === "dmg") {
      let s = x.consume ? `Pops ${L(x.consume)}. Power ${x.pow}` : `Power ${x.pow}`;
      if (x.hits) s += ` × ${x.hits}`;
      if (x.stat) s += ` (${SL[x.stat]})`;
      if (x.perAmt) s += `, +1 power per ${Math.round(1 / x.perAmt)} ${L(x.consume)}`;
      if (x.perTurn) s += `, +${x.perTurn} power per turn left`;
      if (x.burst) s += `, deals the remaining ${L(x.consume)} damage at once`;
      if (x.ignore) s += x.ignore >= 1 ? ". Ignores the foe's defense" : `. Ignores ${Math.round(x.ignore * 100)}% of the foe's defense`;
      if (x.sure) s += ". Never misses";
      if (x.vsFx) s += ". " + Object.entries(x.vsFx).map(([id, v]) => `${v >= 1 ? `×${v + 1}` : `+${Math.round(v * 100)}%`} vs. ${L(id)}`).join(" · ");
      if (x.drain) s += `. Heals ${Math.round(x.drain * 100)}% of damage dealt`;
      if (x.recoil) s += `. Take ${Math.round(x.recoil * 100)}% of damage dealt yourself`;
      out.push(s);
    } else if (x.t === "fx") {
      let s = `${x.who === "me" ? "Self: " : ""}${L(x.id)}${x.amt != null ? ` +${x.amt}` : ""}${x.turns != null ? ` (${turns(x.turns)})` : ""}`;
      if (x.id === "counter" && x.amt) s = `Counter (returns ${x.amt}% of direct damage taken)`;
      if (x.chance) s = `${Math.round(x.chance * 100)}% chance: ${s}`;
      if (x.atLeast) s = `If ${L(x.atLeast.id)} is ${x.atLeast.n}+: ${s}`;
      if (x.ifConsumed != null) s = `If popped: ${s}`;
      if (x.ifCrit) s = `On a crit: ${s}`;
      out.push(s);
    } else if (x.t === "heal") out.push(x.pct >= 1 ? "Fully heal HP" : `Heal ${Math.round(x.pct * 100)}% HP`);
    else if (x.t === "cure") out.push("Cleanse (remove all your debuffs)");
    else if (x.t === "dispel") out.push(x.n >= 99 ? "Remove all of the foe's buffs" : `Remove ${NUM[x.n]} of the foe's buffs`);
    else if (x.t === "mpDrain") out.push(`Foe MP −${x.n}`);
    else if (x.t === "shield") out.push(`Shield (${Math.round(x.pct * 100)}% of max HP)`);
  }
  return out.join(". ");
}

// ---- 派遣の 決まり ----
export const PURPOSE_EN = {
  explore: ["Explore", "Fill in unexplored tiles. At 100% on a floor, go down. Once everything is seen, wander and fight"],
  boss: ["Boss First", "Start from the deepest floor you've reached and head straight to the boss room"],
  gather: ["Gather First", "On the deepest floor you've reached, visit gathering spots from nearest to farthest"],
  target: ["Target Only", "Fight only the chosen enemy (fewer encounters). Doesn't enter the boss room. Starts from the deepest floor you've reached"],
};
export const TOOL_EN = {
  lure: ["Lure Whistle", "Meet the chosen enemy more often"],
  net: ["Capture Net", "Double capture chance"],
  tea: ["Pep Tea", "If everyone falls, fully heal once and keep going"],
};

// ---- 装備 ----
export const KIND_EN = {
  head: ["Head", "Defense (DEF · RES)"], neck: ["Neck", "Vitality (HP · MP)"], arm: ["Arms", "Dexterity (DEX · ATK)"], leg: ["Legs", "Speed (AGI · DEF)"],
  weapon: ["Weapon", "Offense (ATK · INT)"], off: ["Off-hand", "Defense & magic (DEF · INT · MP)"], acc: ["Accessory", "Luck & extras (LUK)"],
};
export const SLOT_EN = { head: "Head", neck: "Neck", arm: "Arms", leg: "Legs", weapon: "Weapon", off: "Off-hand", acc1: "Accessory 1", acc2: "Accessory 2", acc3: "Accessory 3" };
export const FORM_EN = {
  helmet: "Helmet", cap: "Cap", hat: "Hat", hood: "Hood", tie: "Necktie", scarf: "Scarf", bib: "Bib", necklace: "Necklace",
  glove: "Gloves", bangle: "Bangle", band: "Wristband", gauntlet: "Gauntlet", boots: "Boots", sneakers: "Sneakers", geta: "Geta", socks: "Socks",
  stick: "Stick", hammer: "Hammer", gun: "Water Gun", balloon: "Balloon", shield: "Shield", book: "Book", fan: "Hand Fan", lantern: "Lantern",
  amulet: "Charm", brooch: "Brooch", ring: "Ring", keychain: "Keychain",
};
export const EQMAT_EN = {
  cloth: "Cloth", wood: "Wooden", paper: "Paper", straw: "Straw", leather: "Leather", stone: "Stone", wool: "Wool", copper: "Copper",
  iron: "Iron", bone: "Bone", silver: "Silver", spirit: "Spirit Cloth", crystal: "Crystal", gold: "Gold", dragon: "Dragon Scale", star: "Star",
};
export const COL_EN = [null, "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink"];
export const BASE_EN = {
  helmet: ["Hard Hat"], knit: ["Knit Cap"], straw: ["Straw Hat"], nabe: ["Pot Lid", "Sturdy but heavy"],
  bowtie: ["Bow Tie"], omamori: ["Lucky Charm"], bib: ["Bib"], gold: ["Gold Necklace", "A little luckier"],
  stick: ["Wooden Stick"], pikopiko: ["Squeaky Hammer"], mizudeppo: ["Water Pistol"], kamifusen: ["Paper Balloon"],
  stonehelm: ["Stone Helm"], ghosthood: ["Spirit Cloth Hood"], kingstraw: ["King's Straw Hat", null, "Royal Dignity: at battle start, foe ATK and INT −15% (3 turns)"], crystalnabe: ["Crystal Pot Lid"],
  fangchoker: ["Fang Choker"], dreamcharm: ["Dreaming Charm"], sleepbib: ["Sleepy Bib", null, "Sleepy Face: can't be put to sleep by foes"], nightgold: ["Midnight Necklace", null, "Midnight Bell: MP +1 every 3 turns"],
  goblinclub: ["Goblin Club"], mimichammer: ["Mimic Hammer"], lampgun: ["Lamplight Water Pistol"], dragonfusen: ["Dragon Crystal Balloon", null, "Dragon's Breath: first attack deals +30% damage"],
};
// OP の 文（OPS の fmt と 同じ 形で 英語）
export const OP_FMT_EN = {
  wazaDmg: (x) => `Move damage +${x}%`, itazuraDmg: (x) => `Prank damage +${x}%`, crit: (x) => `Crit +${x}%`, critDmg: (x) => `Crit damage +${x}%`, dmgCut: (x) => `Damage taken −${x}%`,
  evade: (x) => `Evasion +${x}%`, drain: (x) => `Heal ${x}% of damage dealt`, statusRes: (x) => `Status resistance +${x}%`, healUp: (x) => `Healing +${x}%`,
  mpRegen: (x) => (x >= 1 ? "MP +1 every turn" : `MP +1 every ${Math.round(1 / x)} turns`), firstStrike: () => "Always acts first on the first turn", endure: () => "Once per match, endure with 1 HP",
  focusStart: (x) => `Focus at battle start (${x} turn${x === 1 ? "" : "s"}. Recover 20% MP after acting)`,
};
export const OP_EN = {
  wazaDmg: "Move Damage", itazuraDmg: "Prank Damage", crit: "Crit", critDmg: "Crit Damage", dmgCut: "Damage Taken", evade: "Evasion", drain: "Drain",
  statusRes: "Status Resistance", healUp: "Healing", mpRegen: "MP Regen", firstStrike: "First Strike", endure: "Endure", focusStart: "Focus",
};

// ---- 隠れ家・工房・家具 ----
export const FAC_EN = {
  bench: ["Workbench", "Craft and fuse gear", ["Craft gear (★1–2)", "Fusion (make upgraded gear) unlocked · ★3 can appear", "★4 can appear · Fusion costs half the balls", "★5 can appear · Fusion is more likely to give ★5"]],
  lab: ["Lab", "Cheaper research on captured enemies", ["Research Resources −20%", "Research Resources −35%", "Research Resources −50%", "Research Resources −65%"]],
  snack: ["Treat Kitchen", "Make taming treats from materials", ["Make treats (2 Herb + 1 Wild Berry → 1 treat)", "Treats take 2 materials instead of 3", "Make special treats (Friendship gauge +3)", "Regular treats come out 2 per craft"]],
  maproom: ["Map Room", "Makes exploring easier", ["Shows where the stairs are on each floor you enter", "Gathering spots give +50% materials", "Regular enemies drop materials 30% → 45% (gathering +50% still applies)", "Rare enemy and boss materials also get a 50% chance of +1 (earlier effects still apply)"]],
  medic: ["Infirmary", "Recover faster when resting on expeditions", ["Rest recovery ×1.25", "Rest recovery ×1.5", "Fallen members get back up when resting (10% HP)", "Rest recovery ×2 · Fallen members get back up with 30% HP"]],
  gym: ["Training Room", "More expedition XP", ["Expedition XP +10%", "Expedition XP +20%", "Expedition XP +30%", "Expedition XP +40%"]],
  storage: ["Storage", "Hold more of each item type (starts at 50)", ["Up to 100 per type", "Up to 200 per type", "Up to 400 per type", "Up to 800 per type"]],
  armory: ["Armory", "Hold more gear (starts at 200)", ["Hold up to 300 gear", "Hold up to 500 gear", "Hold up to 800 gear", "Hold up to 1,200 gear"]],
  dig: ["Basement Expansion", "Dig the basement deeper and add new facilities", ["Expands deeper (Workshop and Farm can be built)", "Even deeper (dig the Mine)", "All the way down (more farm plots and mine slots)", "Down to the island bedrock (one more farm row and mine slot)"]],
  workshop: ["Workshop", "Make tools and weapon attachments from materials", ["Make tools, sprinklers and attachments (★1–2)", "★3 attachments · Pep Tea · Better Sprinkler", "★4 attachments (2 OPs) · Star Sprinkler", "★5 attachments (3 OPs)"]],
  farm: ["Farm", "Plant and grow plant materials (sprinklers raise quality)", ["Grow on 4 plots (1 row)", "8 plots · grow time −20%", "12 plots · grow time −35%", "16 plots · grow time −50%"]],
  mine: ["Mine", "Companions not in your party dig ore and junk", ["1 companion can dig (Shiny Pebble, Old Brick, Old Nail, Iron Ore)", "2 companions · Candle, Faded Cloth and Crystal Shard can appear", "3 companions · Glowstone, and sometimes Rainbow Crystal", "4 companions · Nirai Isles stones (Cape Stone, Blue Stone, Obsidian, Thunder Stone) can appear"]],
  radio: ["Radio", "Pick up island signals and send a boat to other islands", ["Travel to the Nirai Isles · Other facilities can reach Lv4"]],
};
export const SNACK_EN = { snack: "Taming Treat", snack3: "Special Treat" };
export const PC_EN = ["PC", "Enter DEEP LINK/:. Just place it (no levels)"];
export const WS_EN = {
  lure: ["Lure Whistle", "Expedition tool: meet the chosen enemy more often"], net: ["Capture Net", "Expedition tool: double capture chance"],
  sprinkler: ["Sprinkler", "Raises the quality of nearby crops on the farm"], tea: ["Pep Tea", "Expedition tool: if everyone falls, fully heal once"],
  sprinkler2: ["Better Sprinkler", "Raises quality more, and reaches farther"], sprinkler3: ["Star Sprinkler", "Raises quality the most"],
  blankcore: ["Blank Core", "Extracts 1 OP from a piece of gear (the gear is used up; put the core on other gear)"],
};
export const ATTK_EN = { tip: "Tip", grip: "Grip" };
export const ATT_EN = { spike: "Spike Cap", lens: "Magnifier", bulb: "Tiny Bulb", rubber: "Rubber Cap", tape: "Grip Tape", strap: "Strap", weight: "Weight", bell: "Bell" };
export const FURN_EN = {
  plant: "Houseplant", cushion: "Cushion", rug: "Rug", mat: "Mat", window: "Window", sofa: "Sofa", lowtable: "Coffee Table", shelf: "Bookshelf", lamp: "Floor Lamp",
  desk: "Gaming Desk", chair: "Gaming Chair", bed: "Bed", tank: "Aquarium", neon: "Neon Sign", arcade: "Arcade Cabinet", bigmon: "Big Wall Monitor",
  holo: "Deer Hologram", spacewin: "Space Window", rack: "Server Rack", pc: "PC",
};

// ---- はじめての 子（クイズ）と ペット ----
export const PET_EN = {
  nemu: ["Nemu", "Deer", "Sleeps 20 hours a day. Wakes up right on time for the stream", "Slept. Woke up. Slept. ……watched the stream. Slept."],
  posuke: ["Posuke", "Pelican", "A far-too-serious mail carrier. Always salutes when handing over a letter", "Delivered 3 letters. Put a seashell on every one."],
  kachi: ["Kachi", "Mouse", "Impatient, says everything twice. Praise it and it runs around the room 3 times", "Ran ran. Hid hid. Got found got found."],
  zaza: ["Zaza", "CRT TV", "A know-it-all with long stories about the old days. Its mood shows on its screen, but it thinks it's hiding it", "Things were better in the old days. (3rd time today)"],
  hori: ["Hori", "Mole", "Works too hard; before you know it, it's poking its head up through someone else's floor", "Dug to the right. Came out in the next room. Said hello. Went home."],
  yura: ["Yura", "Jellyfish", "Forgets what it wanted to say mid-sentence. Glows at night and gets way too excited", "Something happened today, I think. Sway, sway."],
  chiku: ["Chiku", "Cactus", "Acts quiet and cool… but stands nearby the whole time, waiting to be petted", "……. (Got petted 3 times today)"],
  charin: ["Charin", "Piggy Bank", "A big eater. Eats any coin. Eats too much and gets too heavy to move", "Tried to eat a button. It wasn't a coin. Got shaken. Went jingle jingle."],
};
export const QUIZ_EN = [
  ["On a day off, what do you do in the morning?", ["Turn off the alarm and go back to sleep", "Get up early and get things done first", "Pick up yesterday's game right away", "Breakfast first. And seconds"]],
  ["A letter arrived from a friend. What do you do?", ["Write back right away. Stamp perfectly straight", "Read it, then forget to reply", "Happy, but make a 'whatever' face", "Shake it first to see if there's money inside"]],
  ["There's a long line in front of a shop. What do you do?", ["Can't wait. Somehow you've left the line", "Doze off standing up", "Start telling the person ahead about lines in the old days", "Go look for a back door"]],
  ["What happens when you get praised?", ["Say 'Thank you very much!' really loudly", "So happy you run around the room 3 times", "Say nothing. But stay close, hoping for more praise", "Forget you were praised right away"]],
  ["If you could get a reward, which one?", ["Something shiny", "A toy that glows at night", "A sunny seat by the window", "A tunnel for shortcuts"]],
  ["What do you do on nights you can't sleep?", ["Never happens. Out like a light", "Neatly pack tomorrow's things", "Toss and turn 20 times", "Secretly turn on an old game"]],
];
export const SPECIES_EN = { shika: "Deer", pelican: "Pelican", mouse: "Mouse", tv: "CRT TV", mogura: "Mole", kurage: "Jellyfish", saboten: "Cactus", chokin: "Piggy Bank" };

// ---- DEEP LINK/: の 店の 人 ----
export const TRADER_EN = {
  junk: ["Garaku", "Raccoon", "Buys and trades materials", "I'll buy anything you don't need."],
  doc: ["Dr. Wool", "Sheep", "Healing, treats, Infirmary parts", "Don't push yourself. Resting is part of the job."],
  hanger: ["Peeko", "Peacock", "Sells gear", "Come find something that suits you."],
  mecha: ["Bolt", "Beaver", "Facility parts, Workbench recipes", "Give me parts and I can build anything."],
  hunter: ["Hawk", "Hawk", "Tasks to defeat and capture enemies", "If it's about the hunt, leave it to me."],
  special: ["Yoru", "Black Cat", "Special items you can only buy with Resources", "Some things can only be bought with Resources.", "Special Shop"],
};
export const SHOP_EN = {
  "j-g1": ["Gathered Materials (Hals Road)", "Herb · Shiny Pebble · Straw · Wild Berry"], "j-sell": ["Sell Materials in Bulk", "Turn your materials into balls"],
  "j-g2": ["Gathered Materials (Morpheus Ruins · Dark Village)", "8 types"], "j-trade": ["Trade Materials", "3 materials from the same destination → 1 you want"],
  "j-g3": ["Gathered Materials (Crystal Cave)", "Crystal Shard · Glowstone · Deep Water · Iron Ore"], "j-sell10": ["Buyback +10%", "Always sell for more"],
  "j-rare": ["Rare Hidden-Passage Materials", "Four-Leaf Clover · Dream Shard · Moon Drop · Rainbow Crystal"], "j-sell20": ["Buyback +20%", "Stacks with +10%"],
  "d-snack": ["Taming Treat", "Friendship gauge +1"], "d-snack5": ["Set of 5 Treats", "46 balls each"], "d-herb": ["Herb", "Used in the Treat Kitchen and Infirmary"],
  "d-snack3": ["Special Treat", "Friendship gauge +3"], "d-tea": ["Pep Tea", "Take on an expedition: if everyone falls, fully heal once"],
  "h-acc1": ["Gear ★1", "Pick from 12 types. OPs are random"], "h-acc2": ["Gear ★2", "Pick from 12 types. OPs are random"], "h-acc3": ["Gear ★3", "Pick from 12 types. OPs are random"],
  "h-acc3op": ["Gear ★3 · Choose 1 OP", "The other OPs are random"],
  "m-nail": ["Old Nail", "Used at the Workbench and for facilities"], "m-recipe": ["Craft Recipe", "Unlock 1 recipe before finding the materials"],
  "m-iron": ["Iron Ore", "Used at the Workbench and for facilities"], "m-synth": ["Fusion Recipe", "Unlock 1 upgraded-gear recipe"], "m-shelf": ["Storage Shelf", "+25 per type in Storage"],
  "k-lure": ["Lure Whistle", "Take on an expedition: meet the chosen enemy more often"], "k-net": ["Capture Net", "Take on an expedition: double capture chance"],
  "k-mat2": ["Enemy Material (Quality 2)", "Regular enemy material. Choose the type"], "k-mat34": ["Enemy Material (Quality 3–4)", "Regular enemy material. Choose the type"],
  "k-boss": ["Boss Material", "1 per week"],
  "y-map": ["Hidden Passage Map", "Opens it on 1 floor without reaching 100%"], "y-collar": ["Friendship Collar", "Friendship gauge +5"],
  "y-core": ["Blank Core", "Extracts 1 OP from a piece of gear (the gear is used up)"], "y-charm": ["Lucky Charm (Crafting)", "Your next craft or fusion gets ★ +1"],
};

// ---- 日本語 → 英語 の 組み立て ----
export function nameWords() {
  const W = {}, put = (ja, en) => { if (ja && en && !Object.prototype.hasOwnProperty.call(W, ja)) W[ja] = en; };
  // 素材
  for (const g of Object.values(GATHER)) { for (const [id, ja] of g.mats) put(ja, MAT_EN[id]); put(g.hidden[1], MAT_EN[g.hidden[0]]); }
  for (const [id, ja] of Object.values(ENEMY_MAT)) put(ja, MAT_EN[id]);
  // 行き先・敵・ミシック
  for (const d of DUNGEONS) {
    const e = DUNGEON_EN[d.id]; if (e) { put(d.name, e.name); put(d.text, e.text); }
    for (const f of [...d.foes, d.rare, d.boss]) put(f.name, (ENEMY_EN[f.tree] || [])[0]);
    const m = MYTHIC_EN[d.mythic && d.mythic.id]; if (m) { put(d.mythic.name, m[0]); put(d.mythic.text, m[1]); }
  }
  for (const [id, t] of Object.entries(ENEMY_TREES)) {
    const e = ENEMY_EN[id]; if (e) { put(t.enemy, e[0]); put(t.name, e[1]); }
    for (const s of t.list) { put(s.name, SKILL_EN[s.id]); if (s.kind !== "passive" && s.fx) put(s.text, describeEn(s.fx)); }
  }
  // 職業の 技
  for (const [id, s] of Object.entries(COMMON)) { put(s.name, SKILL_EN[id]); put(s.text, SKILL_TEXT_EN[id]); }
  for (const list of Object.values(TREES)) for (const s of list) { put(s.name, SKILL_EN[s.id]); put(s.text, SKILL_TEXT_EN[s.id]); }
  for (const [id, t] of Object.entries(TYPES)) { const e = TYPE_EN[id]; if (e) { put(t.label, e[0]); put(t.role, e[1]); } }
  // 状態
  for (const [id, x] of Object.entries(EFFECTS)) { const e = FX_EN[id]; if (e) { put(x.label, e[0]); put(x.text, e[1]); } }
  // 派遣
  for (const [id, p] of Object.entries(PURPOSES)) { const e = PURPOSE_EN[id]; if (e) { put(p.name, e[0]); put(p.text, e[1]); } }
  for (const [id, t] of Object.entries(TOOLS)) { const e = TOOL_EN[id]; if (e) { put(t.name, e[0]); put(t.text, e[1]); } }
  for (const r of Object.values(RUNS)) put(r.label, r.label.replace("分", "min"));
  // 装備：部位・枠・形 × 素材（「鉄の手袋」→「Iron Gloves」）・名前の ある 装備・OP
  for (const [id, k] of Object.entries(KINDS)) { const e = KIND_EN[id]; if (e) { put(k.label, e[0]); put(k.role, e[1]); } }
  for (const [id, s] of Object.entries(SLOTS)) put(s.label, SLOT_EN[id]);
  for (const [f, F] of Object.entries(FORMS)) { put(F.name, FORM_EN[f]); for (const [m, M] of Object.entries(MATS)) if (FORM_EN[f] && EQMAT_EN[m]) put(`${M.name}の${F.name}`, `${EQMAT_EN[m]} ${FORM_EN[f]}`); }
  for (const [m, M] of Object.entries(MATS)) put(M.name, EQMAT_EN[m]);
  COLS.forEach((c, i) => c && put(c.name, COL_EN[i]));
  for (const b of [...BASES, ...UPPER]) { const e = BASE_EN[b.id]; if (e) { put(b.name, e[0]); if (b.note) put(b.note, e[1]); if (b.fx) put(b.fx, e[2]); } }
  for (const [id, o] of Object.entries(OPS)) { if (OP_EN[id]) put(o.label, OP_EN[id]); const f = OP_FMT_EN[id]; if (f) for (const v of new Set(o.v)) if (v) put(o.fmt(v), f(v)); }
  // 隠れ家
  for (const f of FACILITIES) { const e = FAC_EN[f.id]; if (!e) continue; put(f.name, e[0]); put(f.text, e[1]); f.lv.forEach((l, i) => put(l.fx, e[2][i])); }
  for (const r of SNACK_RECIPES) put(r.name, SNACK_EN[r.id]);
  put(PC.text, PC_EN[1]);
  for (const w of WS_ITEMS) { const e = WS_EN[w.id]; if (e) { put(w.name, e[0]); put(w.note, e[1]); } }
  for (const [id, k] of Object.entries(ATT_KINDS)) put(k.label, ATTK_EN[id]);
  for (const a of ATT_BASES) put(a.name, ATT_EN[a.id]);
  for (const f of FURN) put(f.name, FURN_EN[f.id]);
  // はじめての 子
  for (const [id, p] of Object.entries(PETS)) { const e = PET_EN[id]; if (e) { put(p.name, e[0]); put(p.label, e[1]); put(p.trait, e[2]); put(p.diary, e[3]); } }
  QUIZ.forEach((q, i) => { const e = QUIZ_EN[i]; if (!e) return; put(q.q, e[0]); q.a.forEach((a, j) => put(a[0], e[1][j])); });
  // DEEP LINK/:
  for (const t of [...TRADERS, SPECIAL]) {
    const e = TRADER_EN[t.id]; if (!e) continue; put(t.name, e[0]); put(t.animal, e[1]); put(t.role, e[2]); put(t.say, e[3]); if (t.dir) put(t.dir, e[4]);
    for (const it of t.items || t.shop || []) { const s = SHOP_EN[it.id]; if (s) { put(it.name, s[0]); put(it.note, s[1]); } }
  }
  return W;
}
