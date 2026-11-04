// 英語の 名前：ミカネル島（3 つめの 島）の 行き先 17・ミシック 17・敵の ツリー 85・技と パッシブ 1,275・素材 170。lounge-en-names.js が 読んで、はじめの 島の 表に 足す
// 名前は id で 引く（日本語の 名前が かわっても 英語が はずれない）。パッシブと 技の 説明は 形の 決まり（lounge-en-fx.js）で 訳す
// 訳は Claude の 案（2026-11-05。データの 名前が Claude の 案の まま なので 英語も。鹿さんの カード「このまま第 5 章と英語に進む」）

export const DUNGEON_I3_EN = {
  mika: { name: "Lake Mika", text: "An oasis lake, the waterside where your journey begins" },
  karegawa: { name: "Dry River Valley", text: "The bed of a river that forgot the rain, where beasts lurk in the valley" },
  shiohara: { name: "White Salt Flats", text: "A plain of white salt that stretches on forever" },
  akaiwa: { name: "Red Rock Plateau", text: "A plateau of red rock cut by deep canyons" },
  kaseki: { name: "Giant Dragon Fossil", text: "The bones of a giant dragon buried in the sand" },
  seran: { name: "Tomb of King Seran", text: "A pyramid buried in the sand, where an ancient king sleeps" },
  noru: { name: "Fort Noru", text: "An old fort still standing atop the plateau" },
  yaei: { name: "Caravan Camp", text: "An oasis camp where caravans rest, the gateway to the northern island" },
  sakyu: { name: "Great Dunes", text: "Vast dunes whose shape the wind keeps changing" },
  kaze: { name: "Wind Canyon", text: "A canyon of red rock where the wind howls" },
  ena: { name: "Ena Ruins", text: "Ruins on a small island in the salty inland sea" },
  daimon: { name: "Great Rock Gate", text: "An arch of rock spanning the sky" },
  tiruka: { name: "Tiruka Lighthouse", text: "A lighthouse fortress on the northern cape" },
  kyozo: { name: "Colossus of Seran", text: "A king's colossus buried in the sand, at the island's farthest reach" },
  shizumu: { name: "Sinking Sands", text: "A quicksand pit gaping open beneath the southern sands" },
  gekka: { name: "Moonlit Quicksand", text: "Quicksand that appears only on moonlit nights" },
  kazeme: { name: "Wind's Eye", text: "A whirlwind spinning in the middle of the inland sea" },
};

export const MYTHIC_I3_EN = {
  mikaJar: ["Mika Water Jar", "Lake's Blessing: heal 2% HP at the start of your turn"],
  jackalFang: ["Dry Valley Fang Necklace", "Pack Hunt: Critical +10%, critical damage +20%"],
  saltCrown: ["White Salt Crown", "Salt's Protection: damage taken −8%; Barrier +20 at the start of battle"],
  rocPlume: ["Roc Feather Plume", "Great Wings: AGI +20%, Evasion +8%"],
  dragonboneSword: ["Dragonbone Greatsword", "Dragon Bone: 20% chance on attack to inflict Weakness +20"],
  seranMask: ["Golden Mask of King Seran", "Royal Majesty: at the start of battle, all foes ATK −10, INT −10"],
  noruShield: ["General's Shield of Noru", "Fort's Protection: damage taken −10%"],
  caravanCharm: ["Caravan Talisman", "Traveler's Protection: Regen +15 at the start of battle"],
  wormFang: ["Sandworm Fang", "Engulf: 25% chance on attack to inflict Fatigue (3 turns)"],
  griffonPlume: ["Griffon Wing Ornament", "Royal Wind: AGI +25%; act first on turn 1"],
  enaBell: ["Ena Priestess's Bell", "Prayer: all allies heal 1.5% HP each turn; damage taken −4%"],
  giantFist: ["Giant's Fist", "Brace: Counter at the start of battle (returns 60% of direct damage taken)"],
  tirukaLens: ["Great Lens of Tiruka", "Illuminate: foe evasion −15%, Critical +8%"],
  seranScepter: ["Scepter of King Seran", "Royal Decree: every 3 turns, a sand attack hits all foes"],
  antlionRing: ["Sand Funnel Ring", "Pull In: at the start of battle, all foes AGI −15"],
  moonScaleNecklace: ["Moonlit Scale Necklace", "Moon's Protection: damage taken −8%; heal 1% HP at the start of your turn"],
  djinnBangle: ["Wind Djinn's Bangle", "Great Storm: Prank damage +12%, foe accuracy −5%"],
};

// ツリー id → [敵の 名前, ツリーの 名前]
export const TREE_I3_EN = {
  e3_mizuhebi: ["Water Snake", "Venom Fangs in the Waterweed"],
  e3_yumegaeru: ["Dreaming Frog", "Evening Lullaby"],
  e3_oasiswani: ["Oasis Crocodile", "Waterside Ambush"],
  e3_flamingo: ["Pink Flamingo", "One-Legged Rest"],
  e3_boss_namazu: ["Great Catfish of Mika", "Ripples on the Lakebed"],
  e3_jackal: ["Jackal", "Dry Valley Pack Hunt"],
  e3_honeuo: ["Bonefish", "Curse of the Parched River"],
  e3_togetokage: ["Thorny Lizard", "Napping in Thorn Armor"],
  e3_amagumo: ["Rain Cloud Spirit", "Blessing of a Passing Shower"],
  e3_boss_mukade: ["Giant Centipede", "Poison Jaws of a Thousand Legs"],
  e3_shiomushi: ["Salt Pillbug", "March of the Salt Shells"],
  e3_saltslime: ["Salt-Licking Slime", "Bone-Dry Salt Bubbles"],
  e3_mirafox: ["Mirage Fox", "Shimmering White Shadow"],
  e3_saltfairy: ["Salt Fairy", "White Sparkle"],
  e3_boss_pillar: ["Salt Pillar Warden", "Oath of the White Pillar"],
  e3_hagetaka: ["Vulture", "Waiting in the Plateau Sky"],
  e3_iwayagi: ["Rock Goat", "Cliff-Climbing Horns"],
  e3_redgolem: ["Red Rock Golem", "Red Rock Retaliation"],
  e3_sunsetlizard: ["Sunset Lizard", "Legs That Chase the Sunset"],
  e3_boss_roc: ["Plateau Roc", "Plateau-Gripping Talons"],
  e3_raptor: ["Bone Raptor", "Hunter Made of Bones"],
  e3_bonewisp: ["Dragonbone Ghost", "Whispers of the Bone Valley"],
  e3_amberbug: ["Amber Bug", "Time Sealed in Amber"],
  e3_dragonegg: ["Dragon Egg", "Sleeping Life"],
  e3_boss_bonedragon: ["Bone Dragon", "Breath of the Risen Dragon"],
  e3_mummy: ["Bandaged Mummy", "Bandages That Never Unwind"],
  e3_scarab: ["Golden Scarab", "Poison That Rolls the Sun"],
  e3_cursepot: ["Cursed Urn", "Never Lift the Lid"],
  e3_tombcat: ["Tombkeeper Cat", "Guarding the King's Sleep"],
  e3_boss_sphinx: ["Sphinx", "Gate of Riddles"],
  e3_sandguard: ["Sandstone Sentry", "Last Shield Standing"],
  e3_ghostarcher: ["Ghost Archer", "Endless Rain of Arrows"],
  e3_sapper: ["Sapper", "Scent of Gunpowder"],
  e3_bugler: ["Fort Bugler", "Morning Bugle Call"],
  e3_boss_general: ["Sand General", "Fort-Guarding Greatsword"],
  e3_camel: ["Pack Camel", "Back That Bears the Long Road"],
  e3_jerboa: ["Jerboa", "Hopping Feet on the Sand"],
  e3_bandit: ["Sand Bandit Grunt", "Night Raid on the Camp"],
  e3_fortune: ["Traveling Fortune-Teller", "Reading the Stars"],
  e3_boss_bodyguard: ["Caravan Bodyguard", "Sword for Hire"],
  e3_sunamoguri: ["Sand Burrower", "Eyes Beneath the Sand"],
  e3_dunescorpion: ["Dune Scorpion", "One Sting of the Tail"],
  e3_hotsand: ["Hot Sand Spirit", "Midday Heat"],
  e3_desertrose: ["Desert Rose", "Petals of Sand"],
  e3_boss_sandworm: ["Great Sandworm", "Maw That Swallows the Dunes"],
  e3_falcon: ["Windcutter Falcon", "Wings That Cut the Wind"],
  e3_leopard: ["Canyon Leopard", "Ambush on the Ledge"],
  e3_twister: ["Tornado Spirit", "Spinning Wind"],
  e3_chimebat: ["Wind Chime Bat", "Tones of the Wind"],
  e3_boss_griffon: ["Griffon", "Throne of the Canyon Sky"],
  e3_gargoyle: ["Ruin Gargoyle", "Lookout on the Ruin Roofs"],
  e3_saltjelly: ["Inland Salt Jellyfish", "Numbing Salty Sea"],
  e3_stonesoldier: ["Guardian Stone Soldier", "Thousand-Year Watch"],
  e3_scribe: ["Ancient Scribe", "Letters That Never Fade"],
  e3_boss_priestess: ["Priestess of Ena", "Prayer of the Inland Sea"],
  e3_gatespider: ["Great Gate Spider", "Web Across the Gate"],
  e3_troll: ["Rock Troll", "Snoring Under the Great Gate"],
  e3_mossgolem: ["Moss Golem", "Mossy Gatekeeper"],
  e3_hermit: ["Rock Hermit", "Stillness of the Rock Cave"],
  e3_boss_gategiant: ["Gate Giant", "Arms That Hold Up the Gate"],
  e3_torchknight: ["Torch Knight", "Burning Blade Patrol"],
  e3_bigcrab: ["Giant Lighthouse Crab", "Red Pincers on the Rocks"],
  e3_lightsprite: ["Light Spirit", "Dazzling Rounds"],
  e3_oldkeeper: ["Old Lighthouse Keeper", "Keeping the Light Alive"],
  e3_boss_lightwarden: ["Light Warden", "Great Lens of the Lighthouse"],
  e3_stonechip: ["Living Stone Chip", "Stone Fallen from the Colossus"],
  e3_royalguard: ["Royal Guard of Seran", "Spear in the King's Service"],
  e3_sandmage: ["Sand Mage", "Spell of the Night Sand"],
  e3_kingshadow: ["King's Shadow", "Shadow Behind the King"],
  e3_boss_colossus: ["Colossus of Seran", "Awakened Royal Statue"],
  e3_antlion: ["Antlion", "Bottom of the Sand Funnel"],
  e3_sandcatfish: ["Quicksand Catfish", "Gaping Mouth in the Sand"],
  e3_sandmouth: ["Sand Mouth", "Whispers of the Sand"],
  e3_sandfirefly: ["Sand Firefly", "Light at the Pit's Bottom"],
  e3_boss_antlion: ["Great Antlion", "King of the Sand Funnel"],
  e3_moonscorpion: ["Moonlight Scorpion", "Moonlit Stinger"],
  e3_nightsnake: ["Night Sand Snake", "Shimmer of the Night Sand"],
  e3_moonsprite: ["Moon Spirit", "Cold Moonlight"],
  e3_moonrabbit: ["Moon Rabbit", "Mochi-Pounding on the Moon"],
  e3_boss_moonserpent: ["Great Moonlit Serpent", "Serpent That Swallows the Moon"],
  e3_stormsprite: ["Storm Spirit", "Lightning at the Center"],
  e3_galebird: ["Gale Bird", "Wind's Eye Patrol"],
  e3_windwarden: ["Wind Guardian", "Wall of Wind"],
  e3_windbird: ["Little Wind Bird", "Song of the Wind"],
  e3_boss_djinn: ["Wind Djinn", "King of the Whirlwind"],
};

// 技・パッシブの id → 名前（敵 1 体ずつ 1 行）
export const SKILL_I3_EN = {
  // ミズヘビ
  e3_mizuhebi_s1: "Bite", e3_mizuhebi_s2: "Venom Fang", e3_mizuhebi_s3: "Blend into the Reeds", e3_mizuhebi_s4: "Squeeze", e3_mizuhebi_s5: "Deep Bite", e3_mizuhebi_s6: "Rapid Bites", e3_mizuhebi_s7: "Submerge", e3_mizuhebi_s8: "Strike from the Lakebed", e3_mizuhebi_p1: "Slick Scales", e3_mizuhebi_p2: "Eye for Venom", e3_mizuhebi_p3: "Weakened Prey", e3_mizuhebi_p4: "Supple Body", e3_mizuhebi_p5: "Honed Venom Fangs", e3_mizuhebi_p6: "Long Body", e3_mizuhebi_p7: "Lord of the Reeds",
  // 夢見ガエル
  e3_yumegaeru_s1: "Tongue Flick", e3_yumegaeru_s2: "Lullaby", e3_yumegaeru_s3: "Croak", e3_yumegaeru_s4: "Rude Awakening", e3_yumegaeru_s5: "Song of Deep Sleep", e3_yumegaeru_s6: "Sing in Rounds", e3_yumegaeru_s7: "Rest Under the Leaves", e3_yumegaeru_s8: "Grand Chorus", e3_yumegaeru_p1: "Moist Skin", e3_yumegaeru_p2: "Lake's Protection", e3_yumegaeru_p3: "Catch Them Napping", e3_yumegaeru_p4: "Power of Song", e3_yumegaeru_p5: "Lullaby Master", e3_yumegaeru_p6: "Plump Belly", e3_yumegaeru_p7: "Lord of the Evening Lake",
  // オアシスワニ
  e3_oasiswani_s1: "Bite", e3_oasiswani_s2: "Tail Whip", e3_oasiswani_s3: "Patient Wait", e3_oasiswani_s4: "Bite the Weakened", e3_oasiswani_s5: "Death Roll", e3_oasiswani_s6: "Slam Down", e3_oasiswani_s7: "Gorge on Prey", e3_oasiswani_s8: "Great Jaw Strike", e3_oasiswani_p1: "Hard Scales", e3_oasiswani_p2: "Way of the Ambush", e3_oasiswani_p3: "Strike the Weak Spot", e3_oasiswani_p4: "Strong Jaws", e3_oasiswani_p5: "Sap Strength", e3_oasiswani_p6: "Thick Torso", e3_oasiswani_p7: "Lord of the Oasis",
  // 桃色フラミンゴ
  e3_flamingo_s1: "Beak Peck", e3_flamingo_s2: "Preen", e3_flamingo_s3: "Bird Bath", e3_flamingo_s4: "Charm of the Shallows", e3_flamingo_s5: "Flutter", e3_flamingo_s6: "Comfort of the Flock", e3_flamingo_s7: "Double Peck", e3_flamingo_s8: "Dance in Pink", e3_flamingo_p1: "Gentle Feathers", e3_flamingo_p2: "Life by the Water", e3_flamingo_p3: "One-Legged Rest", e3_flamingo_p4: "Wise Eyes", e3_flamingo_p5: "Relaxed Breathing", e3_flamingo_p6: "Flock's Protection", e3_flamingo_p7: "Dancer of the Lake",
  // ミカの大ナマズ
  e3_boss_namazu_s1: "Whisker Whip", e3_boss_namazu_s2: "Ground Shaker", e3_boss_namazu_s3: "Coat in Mud", e3_boss_namazu_s4: "Tackle the Fallen", e3_boss_namazu_s5: "Great Tremor", e3_boss_namazu_s6: "Tail Fin Flurry", e3_boss_namazu_s7: "Sink into the Mud", e3_boss_namazu_s8: "Great Lakebed Quake", e3_boss_namazu_p1: "Thick Skin", e3_boss_namazu_p2: "Unshakable Body", e3_boss_namazu_p3: "Exploit the Tremor", e3_boss_namazu_p4: "Rocklike Body", e3_boss_namazu_p5: "Eye for Vitals", e3_boss_namazu_p6: "Big Belly", e3_boss_namazu_p7: "Lord of Lake Mika",
  // ジャッカル
  e3_jackal_s1: "Bite", e3_jackal_s2: "Howl", e3_jackal_s3: "Pack Encirclement", e3_jackal_s4: "Hunter's War Cry", e3_jackal_s5: "Go for the Throat", e3_jackal_s6: "Pack Bite", e3_jackal_s7: "Gorge on Prey", e3_jackal_s8: "Full Pack Assault", e3_jackal_p1: "Sharp Fangs", e3_jackal_p2: "Tireless", e3_jackal_p3: "Hunter's Craft", e3_jackal_p4: "Strong Jaws", e3_jackal_p5: "Supple Legs", e3_jackal_p6: "Aim for the Vitals", e3_jackal_p7: "Dry River Pack Leader",
  // ホネウオ
  e3_honeuo_s1: "Bone Spike", e3_honeuo_s2: "Rotten Water", e3_honeuo_s3: "Memory of the River", e3_honeuo_s4: "Rot Flick", e3_honeuo_s5: "Curse of Stagnation", e3_honeuo_s6: "Bone Volley", e3_honeuo_s7: "Phantom Water", e3_honeuo_s8: "Grudge of the Dry River", e3_honeuo_p1: "Parched Bones", e3_honeuo_p2: "Eye for Rot", e3_honeuo_p3: "Strike the Rotten Spot", e3_honeuo_p4: "Curse Lore", e3_honeuo_p5: "Lingering Rot", e3_honeuo_p6: "Bone Core", e3_honeuo_p7: "Ghost Fish of the Dry River",
  // トゲトカゲ
  e3_togetokage_s1: "Tail Whip", e3_togetokage_s2: "Raise Thorns", e3_togetokage_s3: "Intimidate", e3_togetokage_s4: "Thorny Curl", e3_togetokage_s5: "Thorn Charge", e3_togetokage_s6: "Thorn Tackle", e3_togetokage_s7: "Sunbathing", e3_togetokage_s8: "A Thousand Thorns", e3_togetokage_p1: "Tough Skin", e3_togetokage_p2: "Way of Thorns", e3_togetokage_p3: "Way of Defense", e3_togetokage_p4: "Sturdy Body", e3_togetokage_p5: "Thick Tail", e3_togetokage_p6: "Eye for Vitals", e3_togetokage_p7: "Thorn Lord of the Dry River",
  // 雨雲の精
  e3_amagumo_s1: "Raindrop", e3_amagumo_s2: "Life-Giving Rain", e3_amagumo_s3: "Cloud Cradle", e3_amagumo_s4: "Cleansing Shower", e3_amagumo_s5: "Thunder Shot", e3_amagumo_s6: "Downpour's Bounty", e3_amagumo_s7: "Hail", e3_amagumo_s8: "Evening Shower", e3_amagumo_p1: "Gentle Rain", e3_amagumo_p2: "Moist Breeze", e3_amagumo_p3: "Soft Drizzle", e3_amagumo_p4: "Wisdom of the Sky", e3_amagumo_p5: "Drifting Clouds", e3_amagumo_p6: "After the Rain", e3_amagumo_p7: "Rain Cloud of the Dry River",
  // 大ムカデ
  e3_boss_mukade_s1: "Bite", e3_boss_mukade_s2: "Poison Jaws", e3_boss_mukade_s3: "Thousand-Leg Stance", e3_boss_mukade_s4: "Strike the Poisoned", e3_boss_mukade_s5: "Venomous Bite", e3_boss_mukade_s6: "Thousand-Leg Flurry", e3_boss_mukade_s7: "Devour Prey", e3_boss_mukade_s8: "Great Jaws of the Dry River", e3_boss_mukade_p1: "Hard Segments", e3_boss_mukade_p2: "Toxic Fog", e3_boss_mukade_p3: "Poison Savvy", e3_boss_mukade_p4: "Strong Jaws", e3_boss_mukade_p5: "Poison Potency", e3_boss_mukade_p6: "Long Body", e3_boss_mukade_p7: "Dry River Great Centipede",
  // シオムシ
  e3_shiomushi_s1: "Tackle", e3_shiomushi_s2: "Harden Salt Shell", e3_shiomushi_s3: "Scatter Salt", e3_shiomushi_s4: "Shell Hideaway", e3_shiomushi_s5: "Shell Charge", e3_shiomushi_s6: "Salt Shell Tackle", e3_shiomushi_s7: "Rest in the Salt", e3_shiomushi_s8: "Great Salt March", e3_shiomushi_p1: "Salt Shell", e3_shiomushi_p2: "Hardened Shell", e3_shiomushi_p3: "Way of Defense", e3_shiomushi_p4: "Hard Body", e3_shiomushi_p5: "Stout Body", e3_shiomushi_p6: "Eye for Vitals", e3_shiomushi_p7: "Shell Lord of the Salt Flats",
  // 塩なめスライム
  e3_saltslime_s1: "Squishy Tackle", e3_saltslime_s2: "Salty Bubbles", e3_saltslime_s3: "Lick Salt", e3_saltslime_s4: "Prey on Fatigue", e3_saltslime_s5: "Great Salt Wave", e3_saltslime_s6: "Triple Bubble", e3_saltslime_s7: "Wobbly Rest", e3_saltslime_s8: "Salt Deluge", e3_saltslime_p1: "Soft Body", e3_saltslime_p2: "Eye for Fatigue", e3_saltslime_p3: "Hunt the Weary", e3_saltslime_p4: "Salt Wisdom", e3_saltslime_p5: "Lingering Fatigue", e3_saltslime_p6: "Swelling Body", e3_saltslime_p7: "Slime King of the Salt Flats",
  // 蜃気楼ギツネ
  e3_mirafox_s1: "Scratch", e3_mirafox_s2: "Heat Haze", e3_mirafox_s3: "Trickery", e3_mirafox_s4: "Phantom Pack", e3_mirafox_s5: "Strike from Behind", e3_mirafox_s6: "Snatch", e3_mirafox_s7: "Hide in Illusion", e3_mirafox_s8: "Mirage Horde", e3_mirafox_p1: "Nimble Legs", e3_mirafox_p2: "Wavering Form", e3_mirafox_p3: "Artful Dodge", e3_mirafox_p4: "Light Footwork", e3_mirafox_p5: "Fluffy Tail", e3_mirafox_p6: "Aim for the Vitals", e3_mirafox_p7: "Lord of the White Mirage",
  // 塩の妖精
  e3_saltfairy_s1: "Salt Grain", e3_saltfairy_s2: "Sparkling Remedy", e3_saltfairy_s3: "Salt Barrier", e3_saltfairy_s4: "Purifying Salt", e3_saltfairy_s5: "Salt Arrow", e3_saltfairy_s6: "White Prayer", e3_saltfairy_s7: "Twin Salt Grains", e3_saltfairy_s8: "White Radiance", e3_saltfairy_p1: "Gentle Hands", e3_saltfairy_p2: "Crystal Guard", e3_saltfairy_p3: "Glow of Salt", e3_saltfairy_p4: "Clear Mind", e3_saltfairy_p5: "Gentle Current", e3_saltfairy_p6: "White Robe", e3_saltfairy_p7: "Fairy Queen of the Salt Flats",
  // 塩柱の番人
  e3_boss_pillar_s1: "Pillar Strike", e3_boss_pillar_s2: "Salt Ward", e3_boss_pillar_s3: "Glare", e3_boss_pillar_s4: "Ward of the Oath", e3_boss_pillar_s5: "Pillar Thrust", e3_boss_pillar_s6: "Salt Pillar Strike", e3_boss_pillar_s7: "Hide in the Pillar", e3_boss_pillar_s8: "Salt Pillar Collapse", e3_boss_pillar_p1: "Body of Salt", e3_boss_pillar_p2: "Oath of Protection", e3_boss_pillar_p3: "Way of Defense", e3_boss_pillar_p4: "Solid Pillar", e3_boss_pillar_p5: "Thick Pillar", e3_boss_pillar_p6: "Eye for Vitals", e3_boss_pillar_p7: "Warden of the Salt Flats",
  // ハゲタカ
  e3_hagetaka_s1: "Peck", e3_hagetaka_s2: "Gouging Talons", e3_hagetaka_s3: "Soar High", e3_hagetaka_s4: "Dive on Weakened Prey", e3_hagetaka_s5: "Deep Gash", e3_hagetaka_s6: "Flock Peck", e3_hagetaka_s7: "Updraft", e3_hagetaka_s8: "Red Sky Dive", e3_hagetaka_p1: "Broad Wings", e3_hagetaka_p2: "Scent of Death", e3_hagetaka_p3: "Strike the Weak Spot", e3_hagetaka_p4: "Sharp Eyes", e3_hagetaka_p5: "Gouge Out", e3_hagetaka_p6: "Tough Body", e3_hagetaka_p7: "Lord of the Red Rock Sky",
  // 岩ヤギ
  e3_iwayagi_s1: "Horn Jab", e3_iwayagi_s2: "Headbutt", e3_iwayagi_s3: "Scale the Cliff", e3_iwayagi_s4: "Gore the Staggered", e3_iwayagi_s5: "All-Out Headbutt", e3_iwayagi_s6: "Horn Flurry", e3_iwayagi_s7: "Graze", e3_iwayagi_s8: "Great Cliff Charge", e3_iwayagi_p1: "Hard Horns", e3_iwayagi_p2: "Sure Footing", e3_iwayagi_p3: "Seize the Opening", e3_iwayagi_p4: "Strong Neck", e3_iwayagi_p5: "Eye for Vitals", e3_iwayagi_p6: "Brawny Body", e3_iwayagi_p7: "Lord of the Red Rock Cliffs",
  // 赤岩ゴーレム
  e3_redgolem_s1: "Rock Fist", e3_redgolem_s2: "Rock Stance", e3_redgolem_s3: "Stony Glare", e3_redgolem_s4: "Red Rock Bulwark", e3_redgolem_s5: "Great Rock Fist", e3_redgolem_s6: "Counter Fist", e3_redgolem_s7: "Hide in the Rock", e3_redgolem_s8: "Red Rock Collapse", e3_redgolem_p1: "Body of Rock", e3_redgolem_p2: "Retaliation Stance", e3_redgolem_p3: "Way of Defense", e3_redgolem_p4: "Solid Rock", e3_redgolem_p5: "Huge Body", e3_redgolem_p6: "Eye for Vitals", e3_redgolem_p7: "Red Rock Guardian",
  // 夕焼けトカゲ
  e3_sunsetlizard_s1: "Bite", e3_sunsetlizard_s2: "Run into the Sunset", e3_sunsetlizard_s3: "Sand Plume", e3_sunsetlizard_s4: "Sunset Sprint", e3_sunsetlizard_s5: "Passing Strike", e3_sunsetlizard_s6: "Running Bite", e3_sunsetlizard_s7: "Hide Behind Rocks", e3_sunsetlizard_s8: "Sunset Flash", e3_sunsetlizard_p1: "Light Legs", e3_sunsetlizard_p2: "Dusk Wind", e3_sunsetlizard_p3: "Artful Dodge", e3_sunsetlizard_p4: "Quick Legs", e3_sunsetlizard_p5: "Red Body", e3_sunsetlizard_p6: "Aim for the Vitals", e3_sunsetlizard_p7: "Sunset Runner",
  // 台地の大鷲
  e3_boss_roc_s1: "Claw Slash", e3_boss_roc_s2: "Sharpen Claws", e3_boss_roc_s3: "Looming Shadow", e3_boss_roc_s4: "Hunting Stance", e3_boss_roc_s5: "Grab and Drop", e3_boss_roc_s6: "Claw Combo", e3_boss_roc_s7: "Feast on Prey", e3_boss_roc_s8: "Great Claw from the Sky", e3_boss_roc_p1: "Great Wings", e3_boss_roc_p2: "Sharp Claws", e3_boss_roc_p3: "Hunter's Craft", e3_boss_roc_p4: "Strong Legs", e3_boss_roc_p5: "Huge Body", e3_boss_roc_p6: "Aim for the Vitals", e3_boss_roc_p7: "King of the Red Rock Sky",
  // ホネラプトル
  e3_raptor_s1: "Hooked Talons", e3_raptor_s2: "Bone Kick", e3_raptor_s3: "Rattle Bones", e3_raptor_s4: "Claw the Staggering", e3_raptor_s5: "Pounce", e3_raptor_s6: "Talon Flurry", e3_raptor_s7: "Bone Crunch", e3_raptor_s8: "Ancient Hunt", e3_raptor_p1: "Light Bones", e3_raptor_p2: "Hunter's Instinct", e3_raptor_p3: "Exploit the Stagger", e3_raptor_p4: "Strong Legs", e3_raptor_p5: "Lingering Daze", e3_raptor_p6: "Bone Core", e3_raptor_p7: "Fossil Hunter",
  // 竜骨の亡霊
  e3_bonewisp_s1: "Cold Hands", e3_bonewisp_s2: "Hushing Voice", e3_bonewisp_s3: "Vanish", e3_bonewisp_s4: "Strike the Voiceless", e3_bonewisp_s5: "Sealing Scream", e3_bonewisp_s6: "Triple Wraith Strike", e3_bonewisp_s7: "Lurk Among the Bones", e3_bonewisp_s8: "Dragon's Lament", e3_bonewisp_p1: "Wispy Body", e3_bonewisp_p2: "Read the Stillness", e3_bonewisp_p3: "Target the Silent", e3_bonewisp_p4: "Sharp Eyes", e3_bonewisp_p5: "Long Silence", e3_bonewisp_p6: "Wandering Soul", e3_bonewisp_p7: "Ghost of Dragonbone Valley",
  // コハクムシ
  e3_amberbug_s1: "Tackle", e3_amberbug_s2: "Amber Shell", e3_amberbug_s3: "Sticky Sap", e3_amberbug_s4: "Retreat into Amber", e3_amberbug_s5: "Shell Charge", e3_amberbug_s6: "Amber Tackle", e3_amberbug_s7: "Seal with Sap", e3_amberbug_s8: "Ancient Amber", e3_amberbug_p1: "Amber Shell", e3_amberbug_p2: "Amber's Protection", e3_amberbug_p3: "Way of Defense", e3_amberbug_p4: "Hard Shell", e3_amberbug_p5: "Stout Body", e3_amberbug_p6: "Eye for Vitals", e3_amberbug_p7: "Amber of the Fossil Valley",
  // 竜のたまご
  e3_dragonegg_s1: "Roll", e3_dragonegg_s2: "Warm Shell", e3_dragonegg_s3: "Warmth of Life", e3_dragonegg_s4: "Shell Cleansing", e3_dragonegg_s5: "Light Through the Cracks", e3_dragonegg_s6: "Cradle Prayer", e3_dragonegg_s7: "Double Roll", e3_dragonegg_s8: "Light of Awakening", e3_dragonegg_p1: "Gentle Warmth", e3_dragonegg_p2: "Sleeping Power", e3_dragonegg_p3: "Heartbeat of Life", e3_dragonegg_p4: "Dragon Blood", e3_dragonegg_p5: "Slumbering Hours", e3_dragonegg_p6: "Hard Shell", e3_dragonegg_p7: "Egg of the Fossil Valley",
  // ボーンドラゴン
  e3_boss_bonedragon_s1: "Bone Claw", e3_boss_bonedragon_s2: "Rotting Breath", e3_boss_bonedragon_s3: "Ancient Awakening", e3_boss_bonedragon_s4: "Flame on the Rotting", e3_boss_bonedragon_s5: "Roar of Revival", e3_boss_bonedragon_s6: "Rain of Bones", e3_boss_bonedragon_s7: "Reassemble Bones", e3_boss_bonedragon_s8: "Dragon's Death Breath", e3_boss_bonedragon_p1: "Dragon Bones", e3_boss_bonedragon_p2: "Eye for Rot", e3_boss_bonedragon_p3: "Exploit the Rot", e3_boss_bonedragon_p4: "Dragon's Wisdom", e3_boss_bonedragon_p5: "Lingering Rot", e3_boss_bonedragon_p6: "Big Bones", e3_boss_bonedragon_p7: "King of the Dragon Fossil",
  // 包帯マミー
  e3_mummy_s1: "Bandage Whip", e3_mummy_s2: "Bandage of Sickness", e3_mummy_s3: "Rewrap Bandages", e3_mummy_s4: "Squeeze the Sick", e3_mummy_s5: "Cursed Bandage", e3_mummy_s6: "Triple Bandage Lash", e3_mummy_s7: "Rest in the Coffin", e3_mummy_s8: "Great Tomb Squeeze", e3_mummy_p1: "Dried Body", e3_mummy_p2: "Scent of Sickness", e3_mummy_p3: "Exploit Sickness", e3_mummy_p4: "Tough Bandages", e3_mummy_p5: "Deep Sickness", e3_mummy_p6: "Long Bandages", e3_mummy_p7: "Bandaged Tomb Warden",
  // 黄金スカラベ
  e3_scarab_s1: "Horn Jab", e3_scarab_s2: "Poison Horn", e3_scarab_s3: "Roll the Sun", e3_scarab_s4: "Gore the Poisoned", e3_scarab_s5: "Venom Horn", e3_scarab_s6: "Triple Horn Jab", e3_scarab_s7: "Burrow in Sand", e3_scarab_s8: "Great Golden Roll", e3_scarab_p1: "Golden Shell", e3_scarab_p2: "Toxic Fog", e3_scarab_p3: "Poison Savvy", e3_scarab_p4: "Deft Legs", e3_scarab_p5: "Thick Poison", e3_scarab_p6: "Round Body", e3_scarab_p7: "Scarab King of the Tomb",
  // 呪いの壺
  e3_cursepot_s1: "Lid Strike", e3_cursepot_s2: "Cursed Smoke", e3_cursepot_s3: "Something Stirs Inside", e3_cursepot_s4: "Pelt the Confused", e3_cursepot_s5: "Great Curse", e3_cursepot_s6: "Triple Smoke Puff", e3_cursepot_s7: "Shut the Lid", e3_cursepot_s8: "Nightmare in the Urn", e3_cursepot_p1: "Sturdy Urn", e3_cursepot_p2: "Read the Bewildered", e3_cursepot_p3: "Target the Confused", e3_cursepot_p4: "Curse Lore", e3_cursepot_p5: "Long Confusion", e3_cursepot_p6: "Thick-Walled Urn", e3_cursepot_p7: "Cursed Urn of the Tomb",
  // 墓守ネコ
  e3_tombcat_s1: "Scratch", e3_tombcat_s2: "Lick the Wounds", e3_tombcat_s3: "Tomb Keeper's Prayer", e3_tombcat_s4: "Purifying Bell", e3_tombcat_s5: "Glaring Eyes", e3_tombcat_s6: "Royal Grace", e3_tombcat_s7: "Double Scratch", e3_tombcat_s8: "Tomb Keeper's Great Rite", e3_tombcat_p1: "Gentle Tongue", e3_tombcat_p2: "Bell Chime", e3_tombcat_p3: "Warmth", e3_tombcat_p4: "Wise Eyes", e3_tombcat_p5: "Quiet Night", e3_tombcat_p6: "Supple Body", e3_tombcat_p7: "Keeper of the Royal Tomb",
  // スフィンクス
  e3_boss_sphinx_s1: "Paw Strike", e3_boss_sphinx_s2: "Riddle", e3_boss_sphinx_s3: "Eye of Wisdom", e3_boss_sphinx_s4: "Judge the Unanswering", e3_boss_sphinx_s5: "The Great Question", e3_boss_sphinx_s6: "Three Riddles", e3_boss_sphinx_s7: "Stone Repose", e3_boss_sphinx_s8: "The Final Riddle", e3_boss_sphinx_p1: "Stone Body", e3_boss_sphinx_p2: "Read the Silence", e3_boss_sphinx_p3: "Target the Silent", e3_boss_sphinx_p4: "Ancient Wisdom", e3_boss_sphinx_p5: "Long Silence", e3_boss_sphinx_p6: "Huge Body", e3_boss_sphinx_p7: "Warden of Seran's Tomb",
  // 砂岩の衛兵
  e3_sandguard_s1: "Shield Strike", e3_sandguard_s2: "Raise Shield", e3_sandguard_s3: "Glare", e3_sandguard_s4: "Fortress Defense", e3_sandguard_s5: "Shield Charge", e3_sandguard_s6: "Shield Barrage", e3_sandguard_s7: "Hide Behind the Shield", e3_sandguard_s8: "Great Fortress Shield", e3_sandguard_p1: "Sandstone Body", e3_sandguard_p2: "Defensive Stance", e3_sandguard_p3: "Way of Defense", e3_sandguard_p4: "Hard Shield", e3_sandguard_p5: "Stout Body", e3_sandguard_p6: "Eye for Vitals", e3_sandguard_p7: "Fort Noru Guard Captain",
  // 亡霊の弓兵
  e3_ghostarcher_s1: "Arrow Shot", e3_ghostarcher_s2: "Numbing Arrow", e3_ghostarcher_s3: "Take Aim", e3_ghostarcher_s4: "Shoot the Numbed", e3_ghostarcher_s5: "Mighty Bow", e3_ghostarcher_s6: "Three Arrows", e3_ghostarcher_s7: "Take Cover", e3_ghostarcher_s8: "Rain of Arrows", e3_ghostarcher_p1: "Old Bow", e3_ghostarcher_p2: "Numbing Poison", e3_ghostarcher_p3: "Exploit the Numbness", e3_ghostarcher_p4: "Sharp Eyes", e3_ghostarcher_p5: "Deep Numbness", e3_ghostarcher_p6: "Wandering Soul", e3_ghostarcher_p7: "Fort Noru Archer Captain",
  // 火薬兵
  e3_sapper_s1: "Bayonet", e3_sapper_s2: "Powder Ball", e3_sapper_s3: "Pack the Powder", e3_sapper_s4: "Strike the Burning", e3_sapper_s5: "Big Powder Ball", e3_sapper_s6: "Triple Powder Ball", e3_sapper_s7: "Stoke the Fire", e3_sapper_s8: "Great Fortress Blast", e3_sapper_p1: "Old Helmet", e3_sapper_p2: "Sparks", e3_sapper_p3: "Exploit the Burn", e3_sapper_p4: "Strong Arms", e3_sapper_p5: "Extra Powder", e3_sapper_p6: "Brawny Body", e3_sapper_p7: "Fort Noru Chief Sapper",
  // 砦のらっぱ吹き
  e3_bugler_s1: "Bugle Bash", e3_bugler_s2: "Rallying Note", e3_bugler_s3: "Bugle of Focus", e3_bugler_s4: "Reveille", e3_bugler_s5: "Sound the Charge", e3_bugler_s6: "Victory Fanfare", e3_bugler_s7: "Double Bugle", e3_bugler_s8: "Grand March Fanfare", e3_bugler_p1: "Gentle Sound", e3_bugler_p2: "Morning Call", e3_bugler_p3: "Bugle's Echo", e3_bugler_p4: "Wisdom of Sound", e3_bugler_p5: "Long Breath", e3_bugler_p6: "Military Uniform", e3_bugler_p7: "Fort Noru Bandmaster",
  // 砂の将軍
  e3_boss_general_s1: "Greatsword", e3_boss_general_s2: "Armor Breaker", e3_boss_general_s3: "General's Command", e3_boss_general_s4: "Strike the Broken Guard", e3_boss_general_s5: "Great Armor Breaker", e3_boss_general_s6: "Triple Greatsword Slash", e3_boss_general_s7: "Soldier's Rations", e3_boss_general_s8: "Great Fortress Command", e3_boss_general_p1: "General's Armor", e3_boss_general_p2: "Battle Insight", e3_boss_general_p3: "Exploit the Breach", e3_boss_general_p4: "Strong Arms", e3_boss_general_p5: "Deep Wounds", e3_boss_general_p6: "Brawny Body", e3_boss_general_p7: "General of Fort Noru",
  // 荷ラクダ
  e3_camel_s1: "Kick", e3_camel_s2: "Hump Water", e3_camel_s3: "Spit", e3_camel_s4: "Hump Reserves", e3_camel_s5: "Big Kick", e3_camel_s6: "Back Tackle", e3_camel_s7: "Take a Break", e3_camel_s8: "Great Caravan March", e3_camel_p1: "Thick Fur", e3_camel_p2: "Full Hump", e3_camel_p3: "Way of Defense", e3_camel_p4: "Sturdy Legs", e3_camel_p5: "Huge Body", e3_camel_p6: "Eye for Vitals", e3_camel_p7: "Caravan Camel",
  // トビネズミ
  e3_jerboa_s1: "Kick", e3_jerboa_s2: "Jump Kick", e3_jerboa_s3: "Hop Around", e3_jerboa_s4: "Kick the Staggering", e3_jerboa_s5: "Big Jump", e3_jerboa_s6: "Triple Jump", e3_jerboa_s7: "Hide in the Burrow", e3_jerboa_s8: "Leap to the Moon", e3_jerboa_p1: "Long Legs", e3_jerboa_p2: "Hopper's Instinct", e3_jerboa_p3: "Exploit the Stagger", e3_jerboa_p4: "Quick Legs", e3_jerboa_p5: "Long Daze", e3_jerboa_p6: "Long Tail", e3_jerboa_p7: "Camp Hopper",
  // 砂賊の下っぱ
  e3_bandit_s1: "Scimitar Slash", e3_bandit_s2: "Sweep the Legs", e3_bandit_s3: "Lick the Blade", e3_bandit_s4: "Slash the Weakened", e3_bandit_s5: "Great Slash", e3_bandit_s6: "Triple Scimitar Slash", e3_bandit_s7: "Stolen Meal", e3_bandit_s8: "Sand Bandits' Great Raid", e3_bandit_p1: "Cloth Mask", e3_bandit_p2: "Surprise Attack", e3_bandit_p3: "Strike the Weak Spot", e3_bandit_p4: "Strong Arms", e3_bandit_p5: "Deep Wounds", e3_bandit_p6: "Brawny Body", e3_bandit_p7: "Sand Bandit Vanguard",
  // 行商の占い師
  e3_fortune_s1: "Crystal Ball", e3_fortune_s2: "Fortune-Teller's Care", e3_fortune_s3: "Read the Stars", e3_fortune_s4: "Purifying Incense", e3_fortune_s5: "Ominous Prophecy", e3_fortune_s6: "Good Luck Spell", e3_fortune_s7: "Twin Crystal Balls", e3_fortune_s8: "Star of Fate", e3_fortune_p1: "Gentle Voice", e3_fortune_p2: "Course of the Stars", e3_fortune_p3: "Incense Smoke", e3_fortune_p4: "Diviner's Wisdom", e3_fortune_p5: "Calm Heart", e3_fortune_p6: "Traveler's Robe", e3_fortune_p7: "Caravan Fortuneteller",
  // 隊商の用心棒
  e3_boss_bodyguard_s1: "Slash", e3_boss_bodyguard_s2: "Ready Stance", e3_boss_bodyguard_s3: "Gap in the Armor", e3_boss_bodyguard_s4: "Bodyguard's Stance", e3_boss_bodyguard_s5: "Great Slash", e3_boss_bodyguard_s6: "Riposte Slash", e3_boss_bodyguard_s7: "Take a Swig", e3_boss_bodyguard_s8: "One-Stroke Cleave", e3_boss_bodyguard_p1: "Well-Worn Armor", e3_boss_bodyguard_p2: "Riposte Stance", e3_boss_bodyguard_p3: "Swordsmanship", e3_boss_bodyguard_p4: "Strong Arms", e3_boss_bodyguard_p5: "Brawny Body", e3_boss_bodyguard_p6: "Aim for the Vitals", e3_boss_bodyguard_p7: "Caravan Bodyguard",
  // スナモグリ
  e3_sunamoguri_s1: "Bite", e3_sunamoguri_s2: "Sand Toss", e3_sunamoguri_s3: "Burrow in Sand", e3_sunamoguri_s4: "Ambush the Unseeing", e3_sunamoguri_s5: "Dust Cloud Ambush", e3_sunamoguri_s6: "Triple Sand Toss", e3_sunamoguri_s7: "Rest in the Sand", e3_sunamoguri_s8: "Great Dune Ambush", e3_sunamoguri_p1: "Smooth Scales", e3_sunamoguri_p2: "Sand Sight", e3_sunamoguri_p3: "Blinding Expert", e3_sunamoguri_p4: "Swift Body", e3_sunamoguri_p5: "Sand Cloud", e3_sunamoguri_p6: "Long Body", e3_sunamoguri_p7: "Great Dune Burrower",
  // 砂丘サソリ
  e3_dunescorpion_s1: "Pinch", e3_dunescorpion_s2: "Venom Stinger", e3_dunescorpion_s3: "Harden Shell", e3_dunescorpion_s4: "Blow to the Envenomed", e3_dunescorpion_s5: "Deep Sting", e3_dunescorpion_s6: "Pincer-and-Sting Combo", e3_dunescorpion_s7: "Burrow in Sand", e3_dunescorpion_s8: "Dune Death Sting", e3_dunescorpion_p1: "Hard Shell", e3_dunescorpion_p2: "Eye for Venom", e3_dunescorpion_p3: "Strike the Envenomed", e3_dunescorpion_p4: "Strong Pincers", e3_dunescorpion_p5: "Lingering Venom", e3_dunescorpion_p6: "Thick Torso", e3_dunescorpion_p7: "Great Dune Scorpion King",
  // 熱砂の精
  e3_hotsand_s1: "Hot Sand Grains", e3_hotsand_s2: "Hot Sand Swirl", e3_hotsand_s3: "Build Up Heat", e3_hotsand_s4: "Hot Wind on the Scalded", e3_hotsand_s5: "Scorching Sandstorm", e3_hotsand_s6: "Triple Hot Sand", e3_hotsand_s7: "Become Heat Haze", e3_hotsand_s8: "Midday Inferno", e3_hotsand_p1: "Hot Body", e3_hotsand_p2: "Eye for Heat", e3_hotsand_p3: "Strike the Scalded", e3_hotsand_p4: "Heat Wisdom", e3_hotsand_p5: "Lingering Scald", e3_hotsand_p6: "Wavering Body", e3_hotsand_p7: "Great Dune Heat Spirit",
  // 砂漠のバラ
  e3_desertrose_s1: "Petal Toss", e3_desertrose_s2: "Flower Remedy", e3_desertrose_s3: "Sand Flower's Protection", e3_desertrose_s4: "Purifying Scent", e3_desertrose_s5: "Thorn Prick", e3_desertrose_s6: "Full Bloom Prayer", e3_desertrose_s7: "Twin Petals", e3_desertrose_s8: "Desert Petal Flurry", e3_desertrose_p1: "Gentle Scent", e3_desertrose_p2: "Flower's Protection", e3_desertrose_p3: "Flower's Breath", e3_desertrose_p4: "Flower Wisdom", e3_desertrose_p5: "Slow Bloom", e3_desertrose_p6: "Tough Petals", e3_desertrose_p7: "Great Dune Bloom",
  // 大サンドワーム
  e3_boss_sandworm_s1: "Tackle", e3_boss_sandworm_s2: "Upthrust from the Sand", e3_boss_sandworm_s3: "Writhe in the Sand", e3_boss_sandworm_s4: "Swallow the Helpless", e3_boss_sandworm_s5: "Great Upthrust", e3_boss_sandworm_s6: "Triple Writhing Slam", e3_boss_sandworm_s7: "Devour Sand", e3_boss_sandworm_s8: "Great Gulp of the Dunes", e3_boss_sandworm_p1: "Thick Hide", e3_boss_sandworm_p2: "Unshakable Body", e3_boss_sandworm_p3: "Seize the Opening", e3_boss_sandworm_p4: "Strong Body", e3_boss_sandworm_p5: "Eye for Vitals", e3_boss_sandworm_p6: "Long Body", e3_boss_sandworm_p7: "Lord of the Great Dunes",
  // 風切りハヤブサ
  e3_falcon_s1: "Peck", e3_falcon_s2: "Ride the Wind", e3_falcon_s3: "Headwind", e3_falcon_s4: "Gale Stance", e3_falcon_s5: "Nosedive", e3_falcon_s6: "Fly-By Talons", e3_falcon_s7: "Hide in the Clouds", e3_falcon_s8: "Great Wind-Cutter Dive", e3_falcon_p1: "Light Wings", e3_falcon_p2: "Canyon Wind", e3_falcon_p3: "Artful Dodge", e3_falcon_p4: "Swift Wings", e3_falcon_p5: "Tough Body", e3_falcon_p6: "Aim for the Vitals", e3_falcon_p7: "Wind Canyon Hunter",
  // 峡谷ヒョウ
  e3_leopard_s1: "Scratch", e3_leopard_s2: "Growl", e3_leopard_s3: "Circle Behind", e3_leopard_s4: "Thrill of the Hunt", e3_leopard_s5: "Go for the Throat", e3_leopard_s6: "Claw Combo", e3_leopard_s7: "Gorge on Prey", e3_leopard_s8: "Great Ledge Pounce", e3_leopard_p1: "Supple Body", e3_leopard_p2: "Way of the Hunt", e3_leopard_p3: "Hunter's Craft", e3_leopard_p4: "Strong Legs", e3_leopard_p5: "Brawny Body", e3_leopard_p6: "Aim for the Vitals", e3_leopard_p7: "Wind Canyon Champion",
  // 竜巻の精
  e3_twister_s1: "Wind Volley", e3_twister_s2: "Whirlwind", e3_twister_s3: "Gather the Wind", e3_twister_s4: "Gust at the Confused", e3_twister_s5: "Great Tornado", e3_twister_s6: "Triple Whirlwind", e3_twister_s7: "Melt into Wind", e3_twister_s8: "Great Canyon Tornado", e3_twister_p1: "Wind Body", e3_twister_p2: "Read the Bewildered", e3_twister_p3: "Target the Confused", e3_twister_p4: "Wind Wisdom", e3_twister_p5: "Long Confusion", e3_twister_p6: "Swelling Wind", e3_twister_p7: "Wind Canyon Spirit",
  // 風鈴コウモリ
  e3_chimebat_s1: "Flutter", e3_chimebat_s2: "Cooling Tone", e3_chimebat_s3: "Wind Chime Ring", e3_chimebat_s4: "Purifying Tone", e3_chimebat_s5: "Ultrasonic", e3_chimebat_s6: "Prayer to the Wind", e3_chimebat_s7: "Double Wingbeat", e3_chimebat_s8: "Canyon Symphony", e3_chimebat_p1: "Gentle Sound", e3_chimebat_p2: "Sound of the Wind", e3_chimebat_p3: "Cool Breeze", e3_chimebat_p4: "Keen Ears", e3_chimebat_p5: "Quiet of Night", e3_chimebat_p6: "Thin Membrane", e3_chimebat_p7: "Wind Canyon Chime",
  // 風獅子
  e3_boss_griffon_s1: "Claw Slash", e3_boss_griffon_s2: "Wing Blast", e3_boss_griffon_s3: "King's Roar", e3_boss_griffon_s4: "Claw the Sluggish", e3_boss_griffon_s5: "Great Wind Blast", e3_boss_griffon_s6: "Claw-and-Beak Combo", e3_boss_griffon_s7: "Feast on Prey", e3_boss_griffon_s8: "Sky King's Dive", e3_boss_griffon_p1: "Great Wings", e3_boss_griffon_p2: "King's Wind", e3_boss_griffon_p3: "Strike the Sluggish", e3_boss_griffon_p4: "Strong Legs", e3_boss_griffon_p5: "Strong Wind", e3_boss_griffon_p6: "Huge Body", e3_boss_griffon_p7: "Wind Canyon King",
  // 遺跡ガーゴイル
  e3_gargoyle_s1: "Claw", e3_gargoyle_s2: "Stone Gaze", e3_gargoyle_s3: "Turn to Stone", e3_gargoyle_s4: "Claw the Clumsy", e3_gargoyle_s5: "Nosedive", e3_gargoyle_s6: "Triple Claw", e3_gargoyle_s7: "Rest on the Roof", e3_gargoyle_s8: "Great Ruins Dive", e3_gargoyle_p1: "Stone Body", e3_gargoyle_p2: "Glare", e3_gargoyle_p3: "Strike the Sluggish", e3_gargoyle_p4: "Sharp Claws", e3_gargoyle_p5: "Heavy Gaze", e3_gargoyle_p6: "Hard Wings", e3_gargoyle_p7: "Ena Ruins Sentinel",
  // 内海の塩クラゲ
  e3_saltjelly_s1: "Tentacle Lash", e3_saltjelly_s2: "Numbing Tentacle", e3_saltjelly_s3: "Float Gently", e3_saltjelly_s4: "Shock the Paralyzed", e3_saltjelly_s5: "Great Discharge", e3_saltjelly_s6: "Triple Tentacle Lash", e3_saltjelly_s7: "Melt into Brine", e3_saltjelly_s8: "Great Inland Sea Discharge", e3_saltjelly_p1: "Soft Body", e3_saltjelly_p2: "Numbing Poison", e3_saltjelly_p3: "Exploit the Numbness", e3_saltjelly_p4: "Electric Wisdom", e3_saltjelly_p5: "Deep Numbness", e3_saltjelly_p6: "Swelling Body", e3_saltjelly_p7: "Inland Sea Jelly Queen",
  // 守りの石兵
  e3_stonesoldier_s1: "Stone Spear", e3_stonesoldier_s2: "Stone Armor", e3_stonesoldier_s3: "Glare", e3_stonesoldier_s4: "Millennial Defense", e3_stonesoldier_s5: "Stone Spear Thrust", e3_stonesoldier_s6: "Stone Spear Barrage", e3_stonesoldier_s7: "Return to Stone", e3_stonesoldier_s8: "Great Ruins Collapse", e3_stonesoldier_p1: "Stone Body", e3_stonesoldier_p2: "Old Armor", e3_stonesoldier_p3: "Way of Defense", e3_stonesoldier_p4: "Hard Stone", e3_stonesoldier_p5: "Stout Body", e3_stonesoldier_p6: "Eye for Vitals", e3_stonesoldier_p7: "Ena Ruins Stone Captain",
  // 古代の書記
  e3_scribe_s1: "Brush Stroke", e3_scribe_s2: "Rewrite", e3_scribe_s3: "Protective Glyph", e3_scribe_s4: "Purifying Glyph", e3_scribe_s5: "Cursed Glyph", e3_scribe_s6: "Tome of Healing", e3_scribe_s7: "Double Brush Stroke", e3_scribe_s8: "Great Ancient Tome", e3_scribe_p1: "Gentle Brush", e3_scribe_p2: "Protective Glyph", e3_scribe_p3: "Scent of Ink", e3_scribe_p4: "Ancient Wisdom", e3_scribe_p5: "Unhurried Pen", e3_scribe_p6: "Old Robe", e3_scribe_p7: "Ena Ruins Scribe",
  // エナの巫女
  e3_boss_priestess_s1: "Bell Swing", e3_boss_priestess_s2: "Sleep Dance", e3_boss_priestess_s3: "Voice of Prayer", e3_boss_priestess_s4: "Judgment on the Sleeping", e3_boss_priestess_s5: "Prayer of Deep Sleep", e3_boss_priestess_s6: "Triple Bell Swing", e3_boss_priestess_s7: "Healing Prayer", e3_boss_priestess_s8: "Great Inland Sea Prayer", e3_boss_priestess_p1: "Pure Robe", e3_boss_priestess_p2: "Prayer's Protection", e3_boss_priestess_p3: "Strike the Sleeping", e3_boss_priestess_p4: "Wisdom of Prayer", e3_boss_priestess_p5: "Sleep Expert", e3_boss_priestess_p6: "Long Hair", e3_boss_priestess_p7: "Ena Ruins Shrine Maiden",
  // 大門グモ
  e3_gatespider_s1: "Bite", e3_gatespider_s2: "Web Spit", e3_gatespider_s3: "Spin Thread", e3_gatespider_s4: "Bite the Entangled", e3_gatespider_s5: "Toxic Bite", e3_gatespider_s6: "Triple Web Shot", e3_gatespider_s7: "Hide in the Web", e3_gatespider_s8: "Great Web of the Gate", e3_gatespider_p1: "Slender Legs", e3_gatespider_p2: "Web Foresight", e3_gatespider_p3: "Strike the Entangled", e3_gatespider_p4: "Deft Legs", e3_gatespider_p5: "Sticky Thread", e3_gatespider_p6: "Round Belly", e3_gatespider_p7: "Rock Gate Spider Lord",
  // 岩トロール
  e3_troll_s1: "Club Strike", e3_troll_s2: "Heavy Blow", e3_troll_s3: "Raise the Club", e3_troll_s4: "Club the Fatigued", e3_troll_s5: "Big Swing", e3_troll_s6: "Triple Club Strike", e3_troll_s7: "Quick Nap", e3_troll_s8: "Shake the Great Gate", e3_troll_p1: "Thick Hide", e3_troll_p2: "Eye for Fatigue", e3_troll_p3: "Hunt the Weary", e3_troll_p4: "Strong Arms", e3_troll_p5: "Lingering Fatigue", e3_troll_p6: "Huge Body", e3_troll_p7: "Rock Gate Troll",
  // 苔ゴーレム
  e3_mossgolem_s1: "Moss Fist", e3_mossgolem_s2: "Moss Guard", e3_mossgolem_s3: "Moss Spores", e3_mossgolem_s4: "Mossy Bulwark", e3_mossgolem_s5: "Great Moss Fist", e3_mossgolem_s6: "Moss Fist Barrage", e3_mossgolem_s7: "Wrap in Moss", e3_mossgolem_s8: "Great Moss Collapse", e3_mossgolem_p1: "Mossy Body", e3_mossgolem_p2: "Moss Barrier", e3_mossgolem_p3: "Way of Defense", e3_mossgolem_p4: "Solid Rock", e3_mossgolem_p5: "Huge Body", e3_mossgolem_p6: "Eye for Vitals", e3_mossgolem_p7: "Rock Gate Moss Warden",
  // 岩の隠者
  e3_hermit_s1: "Staff Whack", e3_hermit_s2: "Herbal Remedy", e3_hermit_s3: "Blessing of Stillness", e3_hermit_s4: "Purifying Water", e3_hermit_s5: "Chastening Staff", e3_hermit_s6: "Grotto Prayer", e3_hermit_s7: "Double Staff Strike", e3_hermit_s8: "Hermit's Great Prayer", e3_hermit_p1: "Gentle Hands", e3_hermit_p2: "Stillness", e3_hermit_p3: "Herbal Scent", e3_hermit_p4: "Years of Training", e3_hermit_p5: "Unshakable Mind", e3_hermit_p6: "Old Robe", e3_hermit_p7: "Rock Gate Hermit",
  // 門の巨人
  e3_boss_gategiant_s1: "Giant's Fist", e3_boss_gategiant_s2: "Catch the Blow", e3_boss_gategiant_s3: "Glare", e3_boss_gategiant_s4: "Gate's Protection", e3_boss_gategiant_s5: "Great Fist", e3_boss_gategiant_s6: "Counter Fist", e3_boss_gategiant_s7: "Lean on the Gate", e3_boss_gategiant_s8: "Great Gate Slam", e3_boss_gategiant_p1: "Rock Skin", e3_boss_gategiant_p2: "Bracing Stance", e3_boss_gategiant_p3: "Way of Defense", e3_boss_gategiant_p4: "Hard Body", e3_boss_gategiant_p5: "Huge Body", e3_boss_gategiant_p6: "Eye for Vitals", e3_boss_gategiant_p7: "Rock Gate Giant",
  // 灯火の騎士
  e3_torchknight_s1: "Sword Slash", e3_torchknight_s2: "Burning Sword", e3_torchknight_s3: "Kindle the Blade", e3_torchknight_s4: "Pierce the Burning", e3_torchknight_s5: "Great Flame Sword", e3_torchknight_s6: "Triple Flame Slash", e3_torchknight_s7: "Lamplight Warmth", e3_torchknight_s8: "Lighthouse Blaze Slash", e3_torchknight_p1: "Knight's Armor", e3_torchknight_p2: "Sparks", e3_torchknight_p3: "Exploit the Burn", e3_torchknight_p4: "Strong Arms", e3_torchknight_p5: "Extra Oil", e3_torchknight_p6: "Brawny Body", e3_torchknight_p7: "Tiruka Lighthouse Knight",
  // 灯台の大ガニ
  e3_bigcrab_s1: "Pincer Strike", e3_bigcrab_s2: "Raise Spiny Shell", e3_bigcrab_s3: "Menacing Pincers", e3_bigcrab_s4: "Shell Hideaway", e3_bigcrab_s5: "Giant Pincers", e3_bigcrab_s6: "Spiny Shell Tackle", e3_bigcrab_s7: "Rest on the Rocks", e3_bigcrab_s8: "Pincers Beneath the Light", e3_bigcrab_p1: "Hard Shell", e3_bigcrab_p2: "Spiked Shell", e3_bigcrab_p3: "Way of Defense", e3_bigcrab_p4: "Sturdy Shell", e3_bigcrab_p5: "Huge Body", e3_bigcrab_p6: "Eye for Vitals", e3_bigcrab_p7: "Giant Crab of Tiruka",
  // 光の精
  e3_lightsprite_s1: "Motes of Light", e3_lightsprite_s2: "Dazzling Light", e3_lightsprite_s3: "Gather Light", e3_lightsprite_s4: "Beam on the Blinded", e3_lightsprite_s5: "Great Flash", e3_lightsprite_s6: "Triple Light", e3_lightsprite_s7: "Melt into Light", e3_lightsprite_s8: "Great Lighthouse Flash", e3_lightsprite_p1: "Body of Light", e3_lightsprite_p2: "Glare Insight", e3_lightsprite_p3: "Blinding Expert", e3_lightsprite_p4: "Wisdom of Light", e3_lightsprite_p5: "Lingering Glare", e3_lightsprite_p6: "Swelling Light", e3_lightsprite_p7: "Light of Tiruka",
  // 灯台守の老人
  e3_oldkeeper_s1: "Staff Whack", e3_oldkeeper_s2: "First Aid", e3_oldkeeper_s3: "Lamplight Barrier", e3_oldkeeper_s4: "Purifying Lamp", e3_oldkeeper_s5: "Admonishing Lamp", e3_oldkeeper_s6: "Dawn Prayer", e3_oldkeeper_s7: "Double Staff Strike", e3_oldkeeper_s8: "Great Lighthouse Lamp", e3_oldkeeper_p1: "Gentle Hands", e3_oldkeeper_p2: "Light's Protection", e3_oldkeeper_p3: "Lamp's Warmth", e3_oldkeeper_p4: "Years of Experience", e3_oldkeeper_p5: "Night Watch", e3_oldkeeper_p6: "Thick Cloak", e3_oldkeeper_p7: "Keeper of Tiruka",
  // 光の番人
  e3_boss_lightwarden_s1: "Needle of Light", e3_boss_lightwarden_s2: "Scalding Light", e3_boss_lightwarden_s3: "Polish the Lens", e3_boss_lightwarden_s4: "Beam on the Scalded", e3_boss_lightwarden_s5: "Great Scalding Light", e3_boss_lightwarden_s6: "Rain of Light", e3_boss_lightwarden_s7: "Behind the Lens", e3_boss_lightwarden_s8: "Great Ray of Tiruka", e3_boss_lightwarden_p1: "Armor of Light", e3_boss_lightwarden_p2: "Eye for Heat", e3_boss_lightwarden_p3: "Strike the Scalded", e3_boss_lightwarden_p4: "Wisdom of Light", e3_boss_lightwarden_p5: "Lingering Scald", e3_boss_lightwarden_p6: "Huge Body", e3_boss_lightwarden_p7: "Warden of Tiruka",
  // 動く石片
  e3_stonechip_s1: "Tackle", e3_stonechip_s2: "Stone Ward", e3_stonechip_s3: "Stone Volley", e3_stonechip_s4: "Colossus Guard", e3_stonechip_s5: "Heavy Tackle", e3_stonechip_s6: "Stone Barrage", e3_stonechip_s7: "Lean on the Colossus", e3_stonechip_s8: "Great Stone Avalanche", e3_stonechip_p1: "Stone Body", e3_stonechip_p2: "Guardian Stone", e3_stonechip_p3: "Way of Defense", e3_stonechip_p4: "Hard Stone", e3_stonechip_p5: "Massive Stone", e3_stonechip_p6: "Eye for Vitals", e3_stonechip_p7: "Lord of Colossus Shards",
  // セランの近衛
  e3_royalguard_s1: "Spear Jab", e3_royalguard_s2: "Hone the Spear", e3_royalguard_s3: "Gap in the Armor", e3_royalguard_s4: "Royal Guard Stance", e3_royalguard_s5: "Great Spear Thrust", e3_royalguard_s6: "Triple Spear Thrust", e3_royalguard_s7: "King's Sustenance", e3_royalguard_s8: "Royal Decree Thrust", e3_royalguard_p1: "Royal Guard Armor", e3_royalguard_p2: "Sharp Tip", e3_royalguard_p3: "Spearmanship", e3_royalguard_p4: "Strong Arms", e3_royalguard_p5: "Brawny Body", e3_royalguard_p6: "Aim for the Vitals", e3_royalguard_p7: "Captain of Seran's Guard",
  // 砂の魔術師
  e3_sandmage_s1: "Sand Volley", e3_sandmage_s2: "Night Chill", e3_sandmage_s3: "Prepare the Spell", e3_sandmage_s4: "Ice Sand on the Chilled", e3_sandmage_s5: "Freezing Sandstorm", e3_sandmage_s6: "Triple Ice Sand", e3_sandmage_s7: "Hide in Sand Shadows", e3_sandmage_s8: "Desert Night Cold Snap", e3_sandmage_p1: "Robe of Sand", e3_sandmage_p2: "Chill Insight", e3_sandmage_p3: "Hunt the Chilled", e3_sandmage_p4: "Sorcerer's Wisdom", e3_sandmage_p5: "Deep Chill", e3_sandmage_p6: "Long Robe", e3_sandmage_p7: "Court Mage of Seran",
  // 王の影
  e3_kingshadow_s1: "Shadow Claw", e3_kingshadow_s2: "Melt into Shadow", e3_kingshadow_s3: "Shadow Trickery", e3_kingshadow_s4: "Shadow Swarm", e3_kingshadow_s5: "Strike from Behind", e3_kingshadow_s6: "Passing Shadow", e3_kingshadow_s7: "Hide in the Shadows", e3_kingshadow_s8: "King's Shadow Legion", e3_kingshadow_p1: "Wispy Body", e3_kingshadow_p2: "Wavering Shadow", e3_kingshadow_p3: "Artful Dodge", e3_kingshadow_p4: "Swift Shadow", e3_kingshadow_p5: "Deep Shadow", e3_kingshadow_p6: "Aim for the Vitals", e3_kingshadow_p7: "Shadow of King Seran",
  // セランの巨像
  e3_boss_colossus_s1: "Stone Arm Strike", e3_boss_colossus_s2: "Earth Shaker", e3_boss_colossus_s3: "Stone Awakening", e3_boss_colossus_s4: "Stomp the Staggering", e3_boss_colossus_s5: "Great Tremor", e3_boss_colossus_s6: "Triple Stone Arm", e3_boss_colossus_s7: "Sink into the Sand", e3_boss_colossus_s8: "King's Great Hammer", e3_boss_colossus_p1: "Stone Skin", e3_boss_colossus_p2: "Unshakable Body", e3_boss_colossus_p3: "Seize the Opening", e3_boss_colossus_p4: "Hard Stone", e3_boss_colossus_p5: "Eye for Vitals", e3_boss_colossus_p6: "Huge Body", e3_boss_colossus_p7: "Royal Statue of Mikaneru",
  // アリジゴク
  e3_antlion_s1: "Great Jaws", e3_antlion_s2: "Sand Slide", e3_antlion_s3: "Wait at the Bottom", e3_antlion_s4: "Jaws on the Fallen", e3_antlion_s5: "Great Jaw Clamp", e3_antlion_s6: "Triple Sand Toss", e3_antlion_s7: "Burrow in Sand", e3_antlion_s8: "Great Funnel Gulp", e3_antlion_p1: "Hard Jaws", e3_antlion_p2: "Funnel Pit", e3_antlion_p3: "Strike the Fallen", e3_antlion_p4: "Deft Jaws", e3_antlion_p5: "Crumbling Sand", e3_antlion_p6: "Round Body", e3_antlion_p7: "Lord of the Sinking Sands",
  // 流砂ナマズ
  e3_sandcatfish_s1: "Whisker Whip", e3_sandcatfish_s2: "Fatten in the Sand", e3_sandcatfish_s3: "Kick Up Sand", e3_sandcatfish_s4: "Buried Reserves", e3_sandcatfish_s5: "Big Maw Tackle", e3_sandcatfish_s6: "Tail Fin Flurry", e3_sandcatfish_s7: "Sink into the Sand", e3_sandcatfish_s8: "Quicksand Maw", e3_sandcatfish_p1: "Thick Skin", e3_sandcatfish_p2: "Sand's Bounty", e3_sandcatfish_p3: "Way of Defense", e3_sandcatfish_p4: "Tough Skin", e3_sandcatfish_p5: "Big Belly", e3_sandcatfish_p6: "Eye for Vitals", e3_sandcatfish_p7: "Sinking Sands Catfish",
  // 砂の口
  e3_sandmouth_s1: "Sand Volley", e3_sandmouth_s2: "Seal with Sand", e3_sandmouth_s3: "Gather Sand", e3_sandmouth_s4: "Sandstorm on the Silent", e3_sandmouth_s5: "Great Sand Maw", e3_sandmouth_s6: "Triple Sand Grains", e3_sandmouth_s7: "Melt into Sand", e3_sandmouth_s8: "Great Pit Sandstorm", e3_sandmouth_p1: "Body of Sand", e3_sandmouth_p2: "Read the Silence", e3_sandmouth_p3: "Target the Silent", e3_sandmouth_p4: "Wisdom of the Sands", e3_sandmouth_p5: "Long Silence", e3_sandmouth_p6: "Swelling Body", e3_sandmouth_p7: "Maw of the Sinking Sands",
  // 砂のホタル
  e3_sandfirefly_s1: "Light Tackle", e3_sandfirefly_s2: "Faint Glow", e3_sandfirefly_s3: "Cocoon of Light", e3_sandfirefly_s4: "Purifying Light", e3_sandfirefly_s5: "Dazzling Light", e3_sandfirefly_s6: "Light of the School", e3_sandfirefly_s7: "Double Tackle", e3_sandfirefly_s8: "Light Swarm of the Pit", e3_sandfirefly_p1: "Gentle Light", e3_sandfirefly_p2: "Guarding Light", e3_sandfirefly_p3: "Faint Glowing Breath", e3_sandfirefly_p4: "Wisdom of Light", e3_sandfirefly_p5: "Slow Glow", e3_sandfirefly_p6: "Hard Wings", e3_sandfirefly_p7: "Sinking Sands Firefly",
  // 大アリジゴク
  e3_boss_antlion_s1: "Great Jaws", e3_boss_antlion_s2: "Sand Toxin", e3_boss_antlion_s3: "Widen the Funnel", e3_boss_antlion_s4: "Jaws on the Weakened", e3_boss_antlion_s5: "Great Jaw Strike", e3_boss_antlion_s6: "Triple Jaws", e3_boss_antlion_s7: "Slurp the Prey", e3_boss_antlion_s8: "Great Funnel Gulp", e3_boss_antlion_p1: "Hard Shell", e3_boss_antlion_p2: "Funnel Trap", e3_boss_antlion_p3: "Strike the Weak Spot", e3_boss_antlion_p4: "Strong Jaws", e3_boss_antlion_p5: "Deep Wounds", e3_boss_antlion_p6: "Huge Body", e3_boss_antlion_p7: "King of the Sinking Sands",
  // 月光サソリ
  e3_moonscorpion_s1: "Pinch", e3_moonscorpion_s2: "Moon Venom Sting", e3_moonscorpion_s3: "Blend into Moonshadow", e3_moonscorpion_s4: "Sting the Envenomed", e3_moonscorpion_s5: "Deep Sting", e3_moonscorpion_s6: "Pincer and Sting Combo", e3_moonscorpion_s7: "Burrow in Sand", e3_moonscorpion_s8: "Full Moon Death Sting", e3_moonscorpion_p1: "Blue Shell", e3_moonscorpion_p2: "Eye for Venom", e3_moonscorpion_p3: "Strike the Envenomed", e3_moonscorpion_p4: "Deft Pincers", e3_moonscorpion_p5: "Lingering Venom", e3_moonscorpion_p6: "Thick Torso", e3_moonscorpion_p7: "Moonlit Quicksand Scorpion",
  // 夜の砂ヘビ
  e3_nightsnake_s1: "Bite", e3_nightsnake_s2: "Swaying Gaze", e3_nightsnake_s3: "Coil Up", e3_nightsnake_s4: "Bite the Sleeping", e3_nightsnake_s5: "Gaze of Deep Sleep", e3_nightsnake_s6: "Triple Bite", e3_nightsnake_s7: "Rest in the Sand", e3_nightsnake_s8: "Great Night Gulp", e3_nightsnake_p1: "Smooth Scales", e3_nightsnake_p2: "Night Ward", e3_nightsnake_p3: "Catch Them Napping", e3_nightsnake_p4: "Strong Jaws", e3_nightsnake_p5: "Sleep Expert", e3_nightsnake_p6: "Long Body", e3_nightsnake_p7: "Moonlit Quicksand Snake",
  // 月の精
  e3_moonsprite_s1: "Moonlight", e3_moonsprite_s2: "Freezing Light", e3_moonsprite_s3: "Revere the Moon", e3_moonsprite_s4: "Light on the Frozen", e3_moonsprite_s5: "Great Freezing Light", e3_moonsprite_s6: "Triple Moonlight", e3_moonsprite_s7: "Hide in the Clouds", e3_moonsprite_s8: "Full Moon Cold Snap", e3_moonsprite_p1: "Body of the Moon", e3_moonsprite_p2: "Frost's Protection", e3_moonsprite_p3: "Hunt the Frozen", e3_moonsprite_p4: "Wisdom of the Moon", e3_moonsprite_p5: "Eye for Vitals", e3_moonsprite_p6: "Round Body", e3_moonsprite_p7: "Moonlit Quicksand Spirit",
  // 月うさぎ
  e3_moonrabbit_s1: "Mallet Strike", e3_moonrabbit_s2: "Mochi First Aid", e3_moonrabbit_s3: "Moon's Blessing", e3_moonrabbit_s4: "Purifying Moon", e3_moonrabbit_s5: "Great Mallet Strike", e3_moonrabbit_s6: "Full Moon Prayer", e3_moonrabbit_s7: "Double Mallet Strike", e3_moonrabbit_s8: "Great Moon Mochi Pound", e3_moonrabbit_p1: "Soft Fur", e3_moonrabbit_p2: "Lunar Cycle", e3_moonrabbit_p3: "Warm Mochi", e3_moonrabbit_p4: "Long Ears", e3_moonrabbit_p5: "Unshakable Mind", e3_moonrabbit_p6: "Fluffy Body", e3_moonrabbit_p7: "Moonlit Quicksand Rabbit",
  // 月下の大蛇
  e3_boss_moonserpent_s1: "Tail Lash", e3_boss_moonserpent_s2: "Lunar Miasma", e3_boss_moonserpent_s3: "Look Up at the Moon", e3_boss_moonserpent_s4: "Bite the Sickly", e3_boss_moonserpent_s5: "Great Miasma", e3_boss_moonserpent_s6: "Triple Tail Lash", e3_boss_moonserpent_s7: "Molting", e3_boss_moonserpent_s8: "Moon-Swallowing Serpent", e3_boss_moonserpent_p1: "Silver Scales", e3_boss_moonserpent_p2: "Miasma Insight", e3_boss_moonserpent_p3: "Exploit Sickness", e3_boss_moonserpent_p4: "Wisdom of the Moon", e3_boss_moonserpent_p5: "Thick Miasma", e3_boss_moonserpent_p6: "Long Body", e3_boss_moonserpent_p7: "Moonlit Quicksand Serpent",
  // 嵐の精
  e3_stormsprite_s1: "Thunder Sparks", e3_stormsprite_s2: "Numbing Thunder", e3_stormsprite_s3: "Summon Clouds", e3_stormsprite_s4: "Lightning on the Numbed", e3_stormsprite_s5: "Great Lightning Strike", e3_stormsprite_s6: "Triple Thunder", e3_stormsprite_s7: "Melt into the Clouds", e3_stormsprite_s8: "Wind's Eye Thunderbolt", e3_stormsprite_p1: "Body of Thunder", e3_stormsprite_p2: "Numbing Static", e3_stormsprite_p3: "Exploit the Numbness", e3_stormsprite_p4: "Wisdom of the Storm", e3_stormsprite_p5: "Deep Numbness", e3_stormsprite_p6: "Swelling Cloud", e3_stormsprite_p7: "Wind's Eye Storm Spirit",
  // ハヤテドリ
  e3_galebird_s1: "Peck", e3_galebird_s2: "Gale Strike", e3_galebird_s3: "Catch the Wind", e3_galebird_s4: "Claw the Staggering", e3_galebird_s5: "Gale Nosedive", e3_galebird_s6: "Triple Claw", e3_galebird_s7: "Rest Above the Clouds", e3_galebird_s8: "Wind's Eye Great Dive", e3_galebird_p1: "Light Feathers", e3_galebird_p2: "Gale Instinct", e3_galebird_p3: "Exploit the Stagger", e3_galebird_p4: "Swift Wings", e3_galebird_p5: "Long Daze", e3_galebird_p6: "Tough Body", e3_galebird_p7: "Wind's Eye Gale Bird",
  // 風の守り手
  e3_windwarden_s1: "Wind Fist", e3_windwarden_s2: "Wind Wall", e3_windwarden_s3: "Repelling Wind", e3_windwarden_s4: "Great Wind Wall", e3_windwarden_s5: "Great Wind Fist", e3_windwarden_s6: "Wind Fist Barrage", e3_windwarden_s7: "Wrapped in Wind", e3_windwarden_s8: "Wind's Eye Great Wall", e3_windwarden_p1: "Wind Body", e3_windwarden_p2: "Wind's Protection", e3_windwarden_p3: "Way of Defense", e3_windwarden_p4: "Solid Wind", e3_windwarden_p5: "Huge Body", e3_windwarden_p6: "Eye for Vitals", e3_windwarden_p7: "Wind's Eye Guardian",
  // 風の小鳥
  e3_windbird_s1: "Flutter", e3_windbird_s2: "Soothing Breeze", e3_windbird_s3: "Wind's Momentum", e3_windbird_s4: "Purifying Wind", e3_windbird_s5: "Headwind", e3_windbird_s6: "Song of the Wind", e3_windbird_s7: "Double Wingbeat", e3_windbird_s8: "Wind's Eye Grand Chorus", e3_windbird_p1: "Gentle Feathers", e3_windbird_p2: "Circling Wind", e3_windbird_p3: "Gentle Breeze", e3_windbird_p4: "Wind Wisdom", e3_windbird_p5: "Unshakable Mind", e3_windbird_p6: "Light Body", e3_windbird_p7: "Wind's Eye Songbird",
  // 風の魔人
  e3_boss_djinn_s1: "Wind Blade", e3_boss_djinn_s2: "Bewildering Wind", e3_boss_djinn_s3: "Wind King's Awakening", e3_boss_djinn_s4: "Gale on the Bewildered", e3_boss_djinn_s5: "Great Tornado", e3_boss_djinn_s6: "Triple Wind Blade", e3_boss_djinn_s7: "Melt into Wind", e3_boss_djinn_s8: "Wind's Eye Tempest", e3_boss_djinn_p1: "Robe of Wind", e3_boss_djinn_p2: "Read the Bewildered", e3_boss_djinn_p3: "Target the Confused", e3_boss_djinn_p4: "Djinn's Wisdom", e3_boss_djinn_p5: "Long Confusion", e3_boss_djinn_p6: "Huge Body", e3_boss_djinn_p7: "Lord of the Wind's Eye",
};

// 素材（敵の 素材 85・採取 68・かくし 17）
export const MAT_I3_EN = {
  "mizuhebi_skin": "Water Snake Skin", "frog_vocal": "Frog Vocal Sac", "croc_tooth": "Crocodile Tooth", "pink_feather": "Pink Feather",
  "catfish_whisker": "Great Catfish Whisker", "jackal_fang": "Jackal Fang", "dry_fishbone": "Dried Fish Bone", "thorny_scale": "Thorny Scale",
  "raincloud_wisp": "Rain Cloud Wisp", "centipede_jaw": "Giant Centipede Jaw", "salt_shell": "Salt Shell", "salt_slime": "Salt Jelly",
  "mirage_fur": "Mirage Fur", "salt_sparkle": "Salt Sparkle", "salt_pillar": "Salt Pillar Shard", "vulture_feather": "Vulture Feather",
  "goat_horn": "Rock Goat Horn", "red_golemcore": "Red Rock Core", "sunset_scale": "Sunset Scale", "roc_talon": "Roc Talon",
  "raptor_bone": "Raptor Bone", "bone_wisp": "Bone Will-o'-Wisp", "amber_lump": "Amber Lump", "dragon_eggshell": "Dragon Eggshell",
  "dragon_fossil": "Dragon Fossil", "old_bandage": "Old Bandages", "gold_scarab": "Golden Scarab Shell", "cursed_shard": "Cursed Urn Shard",
  "tomb_cat_bell": "Tombkeeper Cat's Bell", "sphinx_stone": "Sphinx Stone", "sandstone_shard": "Sandstone Shield Shard", "ghost_arrow": "Ghost Arrow",
  "damp_powder": "Damp Gunpowder", "brass_mouthpiece": "Bugle Mouthpiece", "general_crest": "General's Crest", "camel_hair": "Camel Hair",
  "jerboa_tail": "Jerboa Tail", "bandit_scarf": "Sand Bandit Mask", "fortune_card": "Fortune Card", "guard_tsuba": "Bodyguard's Sword Guard",
  "sand_scale": "Sand Scale", "scorpion_stinger": "Scorpion Stinger", "hot_sand": "Hot Sand", "desert_rose": "Desert Rose",
  "worm_hide": "Sandworm Hide", "falcon_feather": "Falcon Feather", "leopard_fur": "Leopard Pelt", "whirlwind_core": "Whirlwind Core",
  "windchime_wing": "Wind Chime Bat Wing", "griffon_feather": "Griffon Feather", "gargoyle_horn": "Gargoyle Horn", "salt_jellycap": "Salt Jellyfish Bell",
  "ancient_stone": "Ancient Stone", "ancient_scroll": "Ancient Scroll", "shrine_bell": "Priestess's Bell", "spider_silk": "Great Gate Spider Silk",
  "troll_club": "Troll Club", "golem_moss": "Golem Moss", "hermit_herb": "Hermit's Herb", "giant_knuckle": "Giant's Fist Stone",
  "torch_crest": "Torch Knight's Crest", "lighthouse_claw": "Giant Crab Claw", "light_mote": "Motes of Light", "keeper_lamp": "Lighthouse Keeper's Lamp",
  "giant_lens": "Great Lens Shard", "colossus_chip": "Colossus Stone Chip", "royal_spearhead": "Royal Guard's Spearhead", "night_sand": "Night Sand",
  "king_shadow": "King's Shadow Shard", "colossus_core": "Colossus Core", "antlion_jaw": "Antlion Jaw", "sandcat_whisker": "Quicksand Catfish Whisker",
  "sinking_sand": "Sinking Sand", "sand_firefly": "Sand Firefly Glow", "antlion_shell": "Great Antlion Shell", "moon_stinger": "Moonlight Scorpion Stinger",
  "night_snakeskin": "Night Sand Snake Skin", "moonbeam_shard": "Moonbeam Shard", "moon_mochi": "Moon Mochi", "moon_serpent_scale": "Moonlit Serpent Scale",
  "storm_core": "Storm Core", "gale_feather": "Gale Bird Feather", "windwall_core": "Wind Wall Core", "breeze_feather": "Breeze Feather",
  "djinn_bangle": "Djinn Bangle Shard", "oasis_water": "Oasis Water", "date_fruit": "Dates", "lake_reed": "Lake Reed",
  "lotus": "Water Lily", "mika_pearl": "Lake Mika Pearl", "dry_clay": "Dried Clay", "river_pebble": "Dry River Pebble",
  "desert_sage": "Desert Sage", "fossil_shell": "Fossil Shell", "water_vein": "Water Vein Stone", "rock_salt": "Rock Salt",
  "salt_crystal": "Salt Crystal", "white_mud": "White Mud", "saltbush": "Saltbush", "salt_rose": "Salt Rose",
  "red_sandstone": "Red Sandstone", "iron_sand": "Iron Sand", "cactus": "Cactus", "ochre": "Ochre",
  "fire_agate": "Fire Agate", "fossil_bone": "Fossilized Bone", "amber_bit": "Amber Chip", "ancient_fern": "Ancient Fern",
  "bone_dust": "Bone Dust", "dragon_heartstone": "Dragon Heartstone", "gold_leaf": "Gold Leaf", "papyrus": "Papyrus",
  "lapis": "Lapis Lazuli", "old_incense": "Old Incense", "seran_seal": "Seal of King Seran", "fort_brick": "Fort Brick",
  "rusty_spear": "Rusty Spear", "old_flag": "Old Banner", "saltpeter": "Saltpeter", "noru_medal": "Medal of Noru",
  "camel_milk": "Camel Milk", "spice": "Spices", "woven_rug": "Woven Rug", "caravan_tea": "Caravan Tea Leaves",
  "caravan_map": "Caravan Map", "fine_sand": "Fine Sand", "desert_glass": "Desert Glass", "dune_grass": "Dune Grass",
  "sun_stone": "Sunstone", "sand_pearl": "Sand Pearl", "wind_stone": "Wind Stone", "hawk_down": "Hawk Down",
  "canyon_moss": "Canyon Moss", "red_crystal": "Red Crystal", "wind_harp": "Wind Harp", "sea_salt": "Inland Sea Salt",
  "ruin_tile": "Ruin Tile", "blue_glass": "Blue Glass", "salt_coral": "Salt Coral", "ena_tablet": "Ena Stone Tablet",
  "arch_stone": "Great Gate Stone", "rock_moss": "Rock Moss", "cliff_flower": "Cliff Flower", "granite": "Granite",
  "gate_keystone": "Great Gate Keystone", "lamp_oil": "Lighthouse Oil", "lens_glass": "Lens Glass", "old_rope": "Old Rope",
  "signal_mirror": "Signal Mirror", "eternal_flame": "Undying Flame", "colossus_sand": "Colossus Sand", "bronze_piece": "Bronze Fragment",
  "royal_cloth": "Royal Cloth", "star_chart": "Star Chart", "seran_crown": "Crown of King Seran", "quicksand": "Quicksand",
  "sunk_pottery": "Sunken Pottery", "bottom_sand": "Pit-Bottom Sand", "sand_root": "Sand Root", "abyss_stone": "Bottomless Stone",
  "moon_sand": "Moon Sand", "night_flower": "Night Flower", "silver_sand": "Silver Sand", "night_dew": "Night Dew",
  "moon_tear": "Moon's Tear", "thunderhead": "Thunderhead", "thunder_shard": "Thunder Shard", "wind_pearl": "Wind Pearl",
  "vortex_sand": "Vortex Sand", "wind_eye_orb": "Wind's Eye Orb",
};
