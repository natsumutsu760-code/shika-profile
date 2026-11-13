// 英語の 辞書：タワーディフェンス（集合住宅）の 画面の 見本（td.html。2026-11-12・M-026）
// 住人の 名前の うち、TD の まざった 子（246 体）の 英語は まだ ない。見本に 出る 2 体だけ ここに 置く
export const WORDS = {
  "集合住宅": "Apartments", "防衛中": "Defending", "ターン": "Turn", "敵": "Enemies", "ターン #・敵 #": "Turn # · Enemies #",
  "東棟": "East Wing", "西棟": "West Wing", "南棟": "South Wing", "北棟": "North Wing", "上の 階": "Floor up", "下の 階": "Floor down", "住人": "Residents", "増築": "Expand", "電波塔": "Radio Tower", "入居希望": "Applicants",
  "住人 #": "Residents #", "入居希望 #": "Applicants #", "棟": "Wing", "状態": "Status", "満足度が 低い": "Least satisfied", "満足度": "Satisfaction", "家賃": "Rent", "#／日": "#/day",
  "#号室": "Room #", "西#号室": "Room W#", "Lv#・#号室": "Lv# · Room #", "Lv#・西#号室": "Lv# · Room W#",
  "在宅": "Home", "ねている": "Asleep", "仕事中": "At work", "病気": "Sick", "子": "Child", "自分の 子": "Your monster",
  "世話する": "Care for", "看病する": "Nurse", "夜に 帰る": "Back tonight", "世話した（満足度 +5）": "Cared for them (Satisfaction +5)",
  "プライベートラウンジ": "Private Lounge", "MONO ペットが いる": "Your MONO pet is here", "ラウンジへ": "To the Lounge",
  "空き部屋": "Vacant", "入居希望を 見る": "See applicants", "希望の 家賃": "Asking rent", "#号室に 入れる": "Move into Room #", "空き部屋が ない": "No vacant rooms",
  "掲示板を かえる・アメジスト 1": "New listings · 1 Amethyst", "掲示板を かえた（見本）": "Refreshed the listings (sample)", "#が 入居した": "# moved in",
  "部屋を 足す": "Add a room", "階を 足す": "Add a floor", "渡り廊下を かける": "Build a skybridge", "置く 場所を えらぶ": "Choose a spot", "置く 場所を えらぶ（見本）": "Choose a spot (sample)",
  "流れて きた モンスター": "Wandering monsters", "脅迫": "Threat", "ガマの隠れ港の 海賊": "Pirates of Gama Hidden Port", "アトゥイ号の 沈没船": "The Wreck of the Atui",
  "ほかの 会社の POM 部隊": "Another company's POM squad", "# 体・Lv#〜#": "# foes · Lv#–#", "POM # 機・Lv#": "# POMs · Lv#",
  "勝ち": "Win", "負け": "Lose", "シグナル": "Signal", "迎え撃つ": "Defend", "強さ #": "Danger #",
  "住人を えらぶ": "Pick a resident", "待機": "Hold", "移動": "Move", "待ち伏せ": "Ambush", "ターン おわり": "End turn",
  "アタッカー": "Attacker", "ディフェンダー": "Defender", "テクニシャン": "Technician", "キャスター": "Caster", "ヒーラー": "Healer",
  "アタッカー・#号室": "Attacker · Room #", "ディフェンダー・#号室": "Defender · Room #", "テクニシャン・#号室": "Technician · Room #", "キャスター・#号室": "Caster · Room #", "ヒーラー・#号室": "Healer · Room #",
    "移動する マスを えらぶ（見本）": "Pick a tile to move to (sample)", "待ち伏せ！ チャージで 戦う": "Ambush! Charged attack", "出撃した 住人が 戦う": "Your resident engages",
  "MONO ペットが 戦う": "Your MONO pet fights", "守りきった": "Defended!", "クレジット": "Credits", "もどる": "Back", "小さな 地図": "Minimap", "閉じる": "Close",
  "ツノミハリ": "Hornwatch", "墓守の船猫": "Gravekeeper Ship Cat",
  "戦い #/#": "Battle #/#", "#F 廊下": "#F Hallway", "次の 戦い": "Next battle", "建物へ もどる": "Back to building",
  "左の部屋": "Left room", "右の部屋": "Right room", "前": "Front", "うしろ": "Back", "加勢": "Joined", "チャージ": "Charge", "2 マス 先": "2 tiles away",
  "力つきた": "Down", "たおした": "Defeated", "→": "→", "こうげき": "Attack", "ホップキック": "Hop Kick", "ホップキック（チャージ）": "Hop Kick (Charged)",
  "足払い": "Leg Sweep", "盾で殴る": "Shield Smack", "船長のサーベル": "Captain's Saber", "カトラス斬り": "Cutlass Slash",
  "突撃": "Rush", "ふさぐ": "Block", "足止め": "Hinder", "遠くから": "Ranged", "回復": "Heal", "退避": "Retreat",
  "1 ターンに 2 マス 進む（見本）": "Moves 2 tiles per turn (sample)", "廊下を ふさいで 敵を 止める（見本）": "Blocks the hallway and stops enemies (sample)",
  "となりの マスの 敵に デバフ（見本）": "Debuffs enemies on adjacent tiles (sample)", "2 マス 先の 敵とも 戦える（見本）": "Can fight enemies 2 tiles away (sample)",
  "となりの 部屋の 住人を 回復（見本）": "Heals residents in adjacent rooms (sample)", "部屋へ 退避（AGI の くらべっこ・見本）": "Retreat to room (AGI check · sample)",
};
// 部屋の 番号（頭の 字は 棟：南・西・東・北）
const WG = { 南: "S", 西: "W", 東: "E", 北: "N" };
export const RULES = [
  [/^([南西東北])(\d+)号室$/, (m) => `Room ${WG[m[1]]}${m[2]}`],
  [/^([南西東北])(\d+)号室に 入れる$/, (m) => `Move into Room ${WG[m[1]]}${m[2]}`],
  [/^(.+)・([南西東北])(\d+)号室$/, (m, p) => { const a = p(m[1]); return a != null ? `${a} · Room ${WG[m[2]]}${m[3]}` : null; }],
];
