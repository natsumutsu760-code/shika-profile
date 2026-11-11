// 工房で 作る 物の 小さな 絵（SVG。32 × 32）。道具・スプリンクラー・武器の アタッチメント
const W = (inner) => `<svg viewBox="0 0 32 32" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
const ICONS = {
  lure: W(`<rect x="5" y="12" width="18" height="10" rx="5" fill="#F2B544" stroke="#9A6A12" stroke-width="1.6"/><rect x="21" y="14" width="7" height="6" rx="2" fill="#E0A21C" stroke="#9A6A12" stroke-width="1.6"/><circle cx="11" cy="17" r="2.2" fill="#9A6A12"/><path d="M8 9c2-2 5-2 7 0" fill="none" stroke="#9A6A12" stroke-width="1.6"/>`),
  net: W(`<circle cx="13" cy="13" r="8.5" fill="#E7F3FF" stroke="#3E7BB8" stroke-width="1.8"/><path d="M6 10h14M5 15h16M9 6v14M14 4.5v17M18.5 6v13" stroke="#7FB8E8" stroke-width="1.1" fill="none"/><path d="M19 19l8 8" stroke="#8C5A38" stroke-width="3"/>`),
  tea: W(`<path d="M6 13h16v6a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z" fill="#6BBF59" stroke="#2F6B23" stroke-width="1.6"/><path d="M22 15h2.5a3 3 0 0 1 0 6H21" fill="none" stroke="#2F6B23" stroke-width="1.6"/><path d="M11 9c-1.5-2 1.5-3 0-5M16 9c-1.5-2 1.5-3 0-5" fill="none" stroke="#9AA3BE" stroke-width="1.5"/>`),
  sprinkler: W(`<rect x="11" y="20" width="10" height="6" rx="1.5" fill="#8F9AAA" stroke="#4A5468" stroke-width="1.5"/><rect x="14.5" y="12" width="3" height="9" fill="#AEB7C6" stroke="#4A5468" stroke-width="1.3"/><circle cx="16" cy="11" r="3" fill="#C9D1DE" stroke="#4A5468" stroke-width="1.3"/><path d="M8 8l-2-2M24 8l2-2M6 13H3.5M26 13h2.5M10 4.5L9 2M22 4.5l1-2.5" stroke="#4DABF7" stroke-width="2"/>`),
  sprinkler2: W(`<rect x="11" y="20" width="10" height="6" rx="1.5" fill="#E0A21C" stroke="#8A5F00" stroke-width="1.5"/><rect x="14.5" y="12" width="3" height="9" fill="#F3C24F" stroke="#8A5F00" stroke-width="1.3"/><circle cx="16" cy="11" r="3" fill="#FFE08A" stroke="#8A5F00" stroke-width="1.3"/><path d="M8 8l-2-2M24 8l2-2M6 13H3.5M26 13h2.5M10 4.5L9 2M22 4.5l1-2.5M16 5V2" stroke="#4DABF7" stroke-width="2"/>`),
  sprinkler3: W(`<rect x="11" y="20" width="10" height="6" rx="1.5" fill="#8E6CFF" stroke="#4B2FA8" stroke-width="1.5"/><rect x="14.5" y="13" width="3" height="8" fill="#B197FC" stroke="#4B2FA8" stroke-width="1.3"/><path d="M16 4.5l2 4 4.4.6-3.2 3 .8 4.4L16 14.4l-4 2.1.8-4.4-3.2-3 4.4-.6z" fill="#FFE57A" stroke="#B88A00" stroke-width="1.2"/><path d="M5 9l-2-1.5M27 9l2-1.5M4 16H1.5M28 16h2.5" stroke="#4DABF7" stroke-width="2"/>`),
  spike: W(`<path d="M7 20h18v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#8F9AAA" stroke="#3E4658" stroke-width="1.6"/><path d="M8 20l2.5-9 2.5 9M13.5 20l2.5-13 2.5 13M19 20l2.5-9 2.5 9" fill="#C9D1DE" stroke="#3E4658" stroke-width="1.5"/>`),
  lens: W(`<circle cx="13" cy="13" r="8" fill="#DDF7FF" stroke="#2E8AB8" stroke-width="2.4"/><path d="M10 9.5a4.5 4.5 0 0 1 5-1.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M19 19l8 8" stroke="#8C5A38" stroke-width="3.4"/>`),
  bulb: W(`<path d="M16 3.5a8.5 8.5 0 0 0-5 15.4V22h10v-3.1A8.5 8.5 0 0 0 16 3.5z" fill="#FFE57A" stroke="#B88A00" stroke-width="1.6"/><rect x="11.5" y="22" width="9" height="5.5" rx="1.5" fill="#AEB7C6" stroke="#4A5468" stroke-width="1.4"/><path d="M14 13l2 3 2-3" fill="none" stroke="#B88A00" stroke-width="1.4"/>`),
  rubber: W(`<path d="M6 22a10 10 0 0 1 20 0v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#FF8A80" stroke="#A8352B" stroke-width="1.6"/><path d="M10 17a6 6 0 0 1 4-4" fill="none" stroke="#FFD1CC" stroke-width="2"/>`),
  tape: W(`<rect x="11" y="3" width="10" height="26" rx="4" fill="#3E4658" stroke="#1B2340" stroke-width="1.5"/><path d="M11 9l10-4M11 14l10-4M11 19l10-4M11 24l10-4M12 28l9-3.5" stroke="#FF6B6B" stroke-width="2"/>`),
  strap: W(`<path d="M9 4c-3 6-3 12 4 16" fill="none" stroke="#B197FC" stroke-width="3.2"/><path d="M15 4c3 6 3 12-2 16" fill="none" stroke="#8E6CFF" stroke-width="3.2"/><circle cx="13" cy="24" r="4.5" fill="#FFD43B" stroke="#B88A00" stroke-width="1.5"/><path d="M13 22v4M11 24h4" stroke="#B88A00" stroke-width="1.3"/>`),
  weight: W(`<path d="M11 10a5 5 0 0 1 10 0" fill="none" stroke="#3E4658" stroke-width="3"/><path d="M7 14h18l2 10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#6A7088" stroke="#2B3040" stroke-width="1.6"/><path d="M10 18h6" stroke="#9AA3B8" stroke-width="1.8"/>`),
  bell: W(`<path d="M16 4a2 2 0 0 1 2 2v1a7 7 0 0 1 5 6.7V20l2.5 3H6.5L9 20v-6.3A7 7 0 0 1 14 7V6a2 2 0 0 1 2-2z" fill="#F3C24F" stroke="#9A6A12" stroke-width="1.6"/><circle cx="16" cy="25.5" r="2.4" fill="#9A6A12"/><path d="M12 13a4 4 0 0 1 3-3" fill="none" stroke="#FFF2C2" stroke-width="1.8"/>`),
  blankcore: W(`<path d="M16 3l11 6.5v13L16 29 5 22.5v-13z" fill="#EEE8FF" stroke="#6B4FD8" stroke-width="1.8"/><path d="M16 9l6 3.5v7L16 23l-6-3.5v-7z" fill="#fff" stroke="#B197FC" stroke-width="1.4" stroke-dasharray="2 1.6"/><path d="M8 10.5l3 1.8" stroke="#fff" stroke-width="1.6"/>`),   // ブランクコア（中が 空いた 結晶）
};
// 薬・エンチャント・お守り（鹿さんの 決め、2026-10-31）：形は 3 つ（小びん・光る 石・お守り袋）で 色だけ かえる。上の 版は 金の 星つき
const STAR = `<path d="M25 2.5l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#FFD43B" stroke="#9A6A12" stroke-width="1"/>`;
const bottle = (c, d) => `<rect x="13" y="3.5" width="6" height="4" rx="1" fill="#C89A6A" stroke="#7A5530" stroke-width="1.3"/><path d="M12 8h8v3l4 4v9a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-9l4-4z" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M11 17h10" stroke="#fff" stroke-width="1.6" opacity=".55"/>`;
const gem = (c, d) => `<path d="M16 3l9 9-9 17-9-17z" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M7 12h18M12 12l4-9 4 9-4 17z" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>`;
const pouch = (c, d) => `<path d="M10 9h12l2 16a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M10 9c1-3 3-4 6-4s5 1 6 4" fill="none" stroke="${d}" stroke-width="1.6"/><rect x="12.5" y="14" width="7" height="8" rx="1" fill="#fff" opacity=".85"/><path d="M14 16.5h4M14 19h4" stroke="${d}" stroke-width="1"/>`;
const ink = { burn: ["#FF8A5B", "#B8401A"], frost: ["#8FD3FF", "#2E7AB8"], poison: ["#B48CF0", "#6A3FB0"], sick: ["#A6D86A", "#4E7F22"], sleep: ["#9AA8FF", "#3F4FB8"], para: ["#FFE066", "#A8860A"], stun: ["#FFB3C7", "#B83A5E"] };
Object.assign(ICONS, {
  tea_heal: ICONS.tea,
  cure: W(bottle("#7FE0B0", "#2C8A5A")), cure2: W(bottle("#7FE0B0", "#2C8A5A") + STAR),
  revive: W(bottle("#FF9AA2", "#B83A4A")), revive2: W(bottle("#FF9AA2", "#B83A4A") + STAR),
  incense: W(`<path d="M15 6v18" stroke="#8C5A38" stroke-width="2.4"/><path d="M15 6c-3-2 2-3 0-5M18 8c-2-2 2-3 0-5" fill="none" stroke="#B9C3D6" stroke-width="1.3"/><rect x="8" y="22" width="16" height="6" rx="2" fill="#C9A06A" stroke="#7A5530" stroke-width="1.5"/>`),
  ...Object.fromEntries(["burn", "frost", "poison", "sick"].map((k) => ["ench_" + k, W(gem(...ink[k]))])),
  ...Object.fromEntries(["sleep", "poison", "burn", "frost", "para", "stun"].map((k) => ["charm_" + k, W(pouch(...ink[k]))])),
});
// 畑と 坑道で 使う 物（肥料・つるはし・ランプ）
const sack = (c, d) => `<path d="M9 9h14l2 16a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M11 9l2-4h6l2 4" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M13 18c1-3 5-3 6 0M16 15v8" stroke="#3F8A2E" stroke-width="1.8" fill="none"/>`;
Object.assign(ICONS, {
  fert: W(sack("#D9B98A", "#8A6A3A")), fert2: W(sack("#E8D0A8", "#8A6A3A") + STAR),
  scaffold: W(`<path d="M8 4v25M24 4v25" stroke="#B8935A" stroke-width="2.6"/><path d="M8 10h16M8 18h16M8 26h16" stroke="#8C6A3A" stroke-width="2.2"/><path d="M8 10l16 8M24 18L8 26" stroke="#D9B98A" stroke-width="1.6"/>`),
  pickaxe: W(`<path d="M6 10c5-5 15-5 20 0" fill="none" stroke="#8E9AAA" stroke-width="4"/><path d="M16 7v21" stroke="#8C5A38" stroke-width="3"/>`),
  lamp: W(`<path d="M12 6h8M16 3v3" stroke="#7A5530" stroke-width="1.8"/><path d="M11 8h10l1 4H10z" fill="#C97A3A" stroke="#7A4A20" stroke-width="1.4"/><rect x="11" y="12" width="10" height="11" rx="2" fill="#FFE08A" stroke="#C97A3A" stroke-width="1.6"/><path d="M16 15c-2 2-2 4 0 6 2-2 2-4 0-6z" fill="#FF8A3A"/><rect x="10" y="23" width="12" height="4" rx="1.5" fill="#C97A3A" stroke="#7A4A20" stroke-width="1.4"/>`),
});
ICONS.incense2 = W(ICONS.incense.slice(ICONS.incense.indexOf(">") + 1, -6) + STAR);
// 戦いの アイテム（鹿さんの 決め、2026-10-31）：爆弾は 丸い 玉に 導火線（色で 状態異常・大きさで 小中大）。薬は 小びんの 色（上の 版は 星）
const bomb = (c, d, r) => `<circle cx="15" cy="${29 - r}" r="${r}" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M${15 + r * 0.55} ${29 - r * 1.85}l3-3" stroke="#7A5530" stroke-width="2"/><path d="M${18 + r * 0.55} ${26 - r * 1.85}c1-2 3-2 3-4" fill="none" stroke="#FF8A3A" stroke-width="1.8"/><circle cx="${15 - r * 0.35}" cy="${29 - r * 1.35}" r="${r * 0.22}" fill="#fff" opacity=".55"/>`;
const BOMB_INK = { plain: ["#4A5268", "#1B2340"], burn: ink.burn, frost: ink.frost, poison: ink.poison };
for (const [k, [c, d]] of Object.entries(BOMB_INK)) for (const [sz, r] of [["s", 7], ["m", 9], ["l", 11]]) ICONS[`bomb_${k}_${sz}`] = W(bomb(c, d, r));
Object.assign(ICONS, {
  pot_hp: W(bottle("#FF7A8A", "#B8384A")), pot_hp2: W(bottle("#FF7A8A", "#B8384A") + STAR),
  pot_mp: W(bottle("#7AA8FF", "#2E56B8")), pot_mp2: W(bottle("#7AA8FF", "#2E56B8") + STAR),
  pot_atk: W(bottle("#FFB04A", "#B86A12")), pot_def: W(bottle("#9AA8BE", "#4A5468")), pot_agi: W(bottle("#7FE0D0", "#1E8A7A")),
});
ICONS.scaffold_board = ICONS.scaffold;   // 板の 足場（2026-11-11）は 足場と 同じ 物
export const wsIcon = (id) => ICONS[id] || W(`<circle cx="16" cy="16" r="10" fill="#DCE3F0"/>`);
