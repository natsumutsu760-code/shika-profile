// クローラーの 迷宮の 地図の 文字・色と、小さな 地図（2D）の 印。M-012（モデリング）。
// three を 使わない ので、画面の どこでも 読める（3D は crawler3d.js が ここを 読む）。
// 地図は 文字の 行（1 区画 16×16 マス）。meta は "x,y" ごとの 付けたし（会社・鍵・状態）。

// 地図の 文字
export const LEGEND = {
  "#": "壁", ".": "床", S: "入口", E: "出口", D: "扉", B: "隔壁", K: "鍵の 区画の 扉", L: "昇降機",
  C: "施錠クレート", c: "キャビネット", l: "個人ロッカー", w: "残骸", g: "採取マス", h: "痕跡ポイント",
  T: "端末", P: "制御点", v: "監視カメラ", G: "発電機", R: "砲台", V: "保管庫", F: "防壁", N: "湧き点",
};
// しかけの 状態（はじめは 左の 物）。P は 占拠の ゲージ 0〜1 の 数（meta.owner：me・enemy で 色）
export const STATES = {
  D: ["closed", "open"], B: ["open", "closed"], K: ["locked", "open"], L: ["idle", "up", "down"],
  C: ["locked", "open"], c: ["full", "looted"], l: ["full", "looted"], w: ["full", "looted"], g: ["full", "taken"], h: ["new", "read"],
  T: ["idle", "seized", "alarm"], P: [0, 0.5, 1], v: ["watch", "alarm", "hacked"], G: ["on", "broken"], R: ["on", "broken"],
  V: ["locked", "open"], F: ["up", "broken"], N: ["alive", "dead"],
};
// クレートの 色（会社ごと。mono-link-briefing-styles.md の 色）。meta.co で えらぶ。tier（格）は 1〜3
export const COMPANY = {
  harmonia: { name: "ハルモニア", body: "#E9ECE8", trim: "#B9C2BF", band: "#2EC4B6", glow: "#7FF2E6" },
  sva: { name: "SVA", body: "#2A2D2A", trim: "#4A5034", band: "#F2C200", glow: "#FF5A1F" },
  tcu: { name: "TCU", body: "#3B4650", trim: "#8C949A", band: "#D08A2E", glow: "#9FC9D6" },
  nox: { name: "NOX", body: "#17151B", trim: "#2E2838", band: "#9B5CFF", glow: "#C9A2FF" },
  foundation: { name: "ファウンデーション", body: "#1D3A6E", trim: "#C9D4E6", band: "#F3F6FA", glow: "#9CC4FF" },
  linkers: { name: "LINKERS", body: "#B9BDBF", trim: "#2A2C2E", band: "#2A2C2E", glow: "#F3F6FA" },
};
// 傘下の 会社（mono-link-briefing-styles.md の「傘下の 会社の 差分」の 差し色）。group が 親の グループ（形は グループ、差し色だけ かわる）
export const SUBSIDIARY = {
  mlv: { name: "MLV メルヴィル製薬", group: "harmonia", color: "#2EC4B6" }, amb: { name: "AMB アンバー相互保証", group: "harmonia", color: "#C98A2E" },
  srn: { name: "SRN セレナ信託", group: "harmonia", color: "#6F8FA8" }, clr: { name: "CLR クロロシス・バイオテック", group: "harmonia", color: "#5E9E3A" },
  vlc: { name: "VLC ヴァルコ火器", group: "sva", color: "#FF5A1F" }, odh: { name: "ODH オルド・ハウンド社", group: "sva", color: "#B3262B" },
  drn: { name: "DRN ドルン鉱業", group: "sva", color: "#B07A3A" }, hlx: { name: "HLX ヘリクス電力", group: "sva", color: "#36C8F0" },
  grn: { name: "GRN グラナート建設", group: "tcu", color: "#9A3A44" }, rsl: { name: "RSL ローゼル繊工", group: "tcu", color: "#B48C8C" },
  ldn: { name: "LDN リンデン家具工房", group: "tcu", color: "#B39A6B" }, crv: { name: "CRV キャラバン運送", group: "tcu", color: "#D08A2E" },
};
// 鍵の 区画（meta.key）：宝物庫・近道・企業の 秘密の 研究区画・高価値スフィア
export const KEYS = { vault: "#E3B341", shortcut: "#57D17A", research: "#C35BD8", sphere: "#5FE3F0" };
export const OWNER = { me: "#57D17A", enemy: "#FF4B4B", none: "#9AA3A8" };

// 小さな 地図の 色（3D の 色に 合わせた）
export const MAP_LOOK = {
  mine: { name: "坑道", bg: "#0E0906", wall: "#3B2A1E", floor: "#6B5340", edge: "#A07A52", gather: "#F0A640" },
  plant: { name: "発電所", bg: "#080C0E", wall: "#2C3338", floor: "#4A555C", edge: "#7A8A94", gather: "#5FE3D0" },
  lab: { name: "研究所", bg: "#5E696C", wall: "#9AA6A4", floor: "#DDE2E0", edge: "#2EC4B6", gather: "#5FE3D0" },
  greenhouse: { name: "試験場（温室）", bg: "#3A4A38", wall: "#2F5A3A", floor: "#8A9A84", edge: "#9CC29A", gather: "#7BD06A" },
  warehouse: { name: "倉庫", bg: "#120F0C", wall: "#3A3F44", floor: "#7B786F", edge: "#D8B030", gather: "#5FE3D0" },
  building: { name: "建てかけの ビル", bg: "#141518", wall: "#55544F", floor: "#8E8D88", edge: "#C9C6BD", gather: "#5FE3D0" },
  rail: { name: "地下の 線路", bg: "#050807", wall: "#2E3A34", floor: "#5B5650", edge: "#2F6B4F", gather: "#5FE3D0" },
  harbor: { name: "港の 台場", bg: "#16202A", wall: "#4E5358", floor: "#5D6268", edge: "#8FB0C8", gather: "#8FB8A0" },
};

// 印（7×7 の ドット。k 縁・a 主・b 差し・w 白）
const ICON = {
  C: [".......", ".kkkkk.", ".kaaak.", ".kbbbk.", ".kaaak.", ".kkkkk.", "......."],
  c: [".kkkkk.", ".kaaak.", ".kkkkk.", ".kaaak.", ".kkkkk.", ".kaaak.", ".kkkkk."],
  l: [".kkkkk.", ".kakak.", ".kakak.", ".kakak.", ".kakak.", ".kakak.", ".kkkkk."],
  w: [".......", ".a...a.", "..a.a..", "...b...", "..a.a..", ".a...a.", "......."],
  g: ["...a...", "..aba..", "..aba..", ".aabaa.", "..aba..", "...a...", "......."],
  h: ["..aaa..", ".a...a.", ".....a.", "....a..", "...a...", ".......", "...a..."],
  T: [".kkkkk.", ".kaaak.", ".kaaak.", ".kkkkk.", "...k...", "..kkk..", "......."],
  P: ["..aaa..", ".a...a.", "a..b..a", "a.bbb.a", "a..b..a", ".a...a.", "..aaa.."],
  v: [".......", "kkkkk..", "kaaakb.", "kaaak..", "kkkkk..", ".k.....", ".k....."],
  G: ["....a..", "...a...", "..aaaa.", "....a..", "...a...", "..a....", "......."],
  R: ["...a...", "..aaa..", ".a.a.a.", "aaa.aaa", ".a.a.a.", "..aaa..", "...a..."],
  V: ["..kkk..", ".kaaak.", "kaabaak", "kabbbak", "kaabaak", ".kaaak.", "..kkk.."],
  F: [".......", ".......", ".aa.aa.", "aaaaaaa", "aaaaaaa", ".......", "......."],
  N: [".......", "..aaa..", ".abaaa.", "aaaabaa", "abaaaaa", ".aaaba.", "......."],
  L: ["...k...", "..kak..", ".kaaak.", ".......", ".kaaak.", "..kak..", "...k..."],
  S: [".......", ".a...a.", "..a.a..", "...a...", ".......", ".aaaaa.", "......."],
  E: ["aaaaaaa", "a.....a", "a.aaa.a", "a.a...a", "a.aa..a", "a.aaa.a", "aaaaaaa"],
};
// 印の 色（状態で かわる 物も ある）
function iconColors(ch, look, m, st) {
  const k = "#14141A";
  switch (ch) {
    case "C": { const co = COMPANY[m.co] || COMPANY.linkers; return { k, a: st === "open" ? "#555" : co.body, b: co.band }; }
    case "c": case "l": return { k, a: st === "looted" ? "#4A4E52" : "#9AA3A8" };
    case "w": return { a: "#8A9298", b: st === "looted" ? "#555" : "#FFB040" };
    case "g": return { a: st === "taken" ? "#555" : look.gather, b: "#FFFFFF" };
    case "h": return { a: st === "read" ? "#4A5A60" : "#7FE8FF" };
    case "T": return { k, a: st === "seized" ? "#57D17A" : st === "alarm" ? "#FF4B4B" : "#2EC4B6" };
    case "P": { const g = +st || 0; return { a: g > 0 ? OWNER[m.owner || "me"] : OWNER.none, b: g >= 1 ? OWNER[m.owner || "me"] : "#FFFFFF" }; }
    case "v": return { k, a: "#D8DCDC", b: st === "hacked" ? "#57D17A" : "#FF3030" };
    case "G": return { a: st === "broken" ? "#3A4A50" : "#36C8F0" };
    case "R": return { a: st === "broken" ? "#5A3A3A" : "#FF5A5A" };
    case "V": return { k, a: "#8A9298", b: st === "open" ? "#57D17A" : "#C9A44C" };
    case "F": return { a: st === "broken" ? "#5A5444" : "#B0A070" };
    case "N": return { a: st === "dead" ? "#3A3036" : "#7A3A8A", b: st === "dead" ? "#4A4048" : "#FF7AFF" };
    case "L": return { k, a: "#57D17A" };
    case "S": return { a: "#7FC8FF" };
    case "E": return { a: "#45E08A" };
  }
  return { a: "#FFF" };
}

// 小さな 地図を 描く。seen：見た マスの Set（"x,y"。null なら ぜんぶ）。me：{x,y,d}。mates：[{x,y,color}]。state：{"x,y": 状態}
export function drawMap(cv, rows, { theme = "mine", px = 14, seen = null, me = null, mates = [], meta = {}, state = {} } = {}) {
  const look = MAP_LOOK[theme] || MAP_LOOK.mine, GH = rows.length, GW = rows[0].length;
  cv.width = GW * px; cv.height = GH * px;
  const g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
  const at = (x, y) => (y < 0 || y >= GH || x < 0 || x >= GW ? "#" : rows[y][x]);
  const open = (x, y) => at(x, y) !== "#";
  const vis = (x, y) => !seen || seen.has(`${x},${y}`);
  g.fillStyle = look.bg; g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (!vis(x, y)) continue;
    if (open(x, y)) { g.fillStyle = look.floor; g.fillRect(x * px, y * px, px, px); }
  }
  // 床の ふち（壁と の さかい目に 線）と 壁
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (!vis(x, y) || !open(x, y)) continue;
    g.fillStyle = look.wall;
    if (!open(x, y - 1)) g.fillRect(x * px, y * px - 2, px, 2);
    if (!open(x, y + 1)) g.fillRect(x * px, (y + 1) * px, px, 2);
    if (!open(x - 1, y)) g.fillRect(x * px - 2, y * px, 2, px);
    if (!open(x + 1, y)) g.fillRect((x + 1) * px, y * px, 2, px);
    g.fillStyle = look.edge;
    if (!open(x, y - 1)) g.fillRect(x * px, y * px, px, 1);
    if (!open(x - 1, y)) g.fillRect(x * px, y * px, 1, px);
  }
  const s = Math.max(1, Math.floor(px / 7)), o = Math.floor((px - s * 7) / 2);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const ch = at(x, y); if (!vis(x, y) || ch === "#" || ch === ".") continue;
    const m = meta[`${x},${y}`] || {}, st = state[`${x},${y}`] ?? m.state ?? (STATES[ch] ? STATES[ch][0] : null);
    if (ch === "D" || ch === "B" || ch === "K") {   // 扉は 通り道を ふさぐ 線
      const ns = !open(x - 1, y) && !open(x + 1, y);
      const c = ch === "D" ? "#C9A060" : ch === "K" ? KEYS[m.key] || KEYS.vault : "#F2C200";
      const shut = ch === "D" ? st !== "open" : ch === "K" ? st !== "open" : st === "closed";
      const th = shut ? Math.max(2, Math.floor(px / 4)) : 1;
      g.fillStyle = c;
      if (ns) g.fillRect(x * px, y * px + (px - th) / 2, px, th); else g.fillRect(x * px + (px - th) / 2, y * px, th, px);
      if (ch === "B" && shut) { g.fillStyle = "#1B1D1B"; for (let i = 0; i < px; i += 4) ns ? g.fillRect(x * px + i, y * px + (px - th) / 2, 2, th) : g.fillRect(x * px + (px - th) / 2, y * px + i, th, 2); }
      if (ch === "K") { g.fillStyle = c; g.fillRect(x * px + px / 2 - s, y * px + px / 2 - s, s * 2, s * 2); }
      continue;
    }
    const ic = ICON[ch]; if (!ic) continue;
    const col = iconColors(ch, look, m, st);
    ic.forEach((row, iy) => [...row].forEach((c, ix) => { if (c === "." || !col[c]) return; g.fillStyle = col[c]; g.fillRect(x * px + o + ix * s, y * px + o + iy * s, s, s); }));
  }
  for (const mt of mates) { g.fillStyle = "#14141A"; g.fillRect(mt.x * px + px / 2 - 3, mt.y * px + px / 2 - 3, 6, 6); g.fillStyle = mt.color || "#FFD24A"; g.fillRect(mt.x * px + px / 2 - 2, mt.y * px + px / 2 - 2, 4, 4); }
  if (me) {   // 自分：向きの ある 三角
    const cx = me.x * px + px / 2, cy = me.y * px + px / 2, r = px * 0.42, a = (me.d * Math.PI) / 2 - Math.PI / 2;
    const pt = (t, k) => [cx + Math.cos(a + t) * r * k, cy + Math.sin(a + t) * r * k];
    g.beginPath(); g.moveTo(...pt(0, 1)); g.lineTo(...pt(2.4, 0.85)); g.lineTo(...pt(-2.4, 0.85)); g.closePath();
    g.fillStyle = "#FFFFFF"; g.fill(); g.lineWidth = 1.5; g.strokeStyle = "#14141A"; g.stroke();
  }
}
