// 入れない 人（BAN・ブロック・フォローして いない）：その 人の 部屋・依頼・中継・闘技場の 名前は 見せない。記録は 消さない（鹿さんの決め）
// lounge-api.js（門番の 入口）と lounge-arena.js（闘技場）で 同じ 決まりを 使う
export function hidden(gate, id) {
  if (!gate) return true;
  if (id === gate.owner || (gate.mods && gate.mods[id])) return false;
  if ((gate.ban && gate.ban[id]) || (gate.block && gate.block[id])) return true;
  return !!gate.follow && !gate.follow[id];
}
