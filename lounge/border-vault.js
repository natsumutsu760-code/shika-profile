// サンプル保管庫（隠れ家の 施設。ボーダーゾーン専用の 設備。2026-11-27 鹿さんの カード「隠れ家の施設」「サンプル保管庫」）
// Lv で よく なる 4 つ（鹿さんの カード）：持てる サンプル・鑑定の 値段・運び屋の 1 回の 数・保険が 届く 時間。Lv の 上限は なし
// もとの 数（Lv0）は ここ 1 か所（border.js の APPRAISE_FEE・BZ_SHIP、門番の SAMPLE_MAX は ここを 読む）
export const VAULT_BASE = { samples: 60, appraise: 20, mats: 30, ship: 2 };
export const VAULT_STEP = { samples: 5, appraise: 1, appraiseMin: 5, mats: 5, shipPer: 5, ins: 5 * 60e3, insMin: 15 * 60e3 };
const L = (lv) => Math.max(0, Math.floor(lv || 0));
export const vaultSamples = (lv) => VAULT_BASE.samples + VAULT_STEP.samples * L(lv);                                   // 持てる サンプル：60 ＋ 5 × Lv
export const vaultAppraise = (lv) => Math.max(VAULT_STEP.appraiseMin, VAULT_BASE.appraise - VAULT_STEP.appraise * L(lv));   // 鑑定 1 こ：20 − Lv（下は 5）
export const vaultShip = (lv) => ({ mats: VAULT_BASE.mats + VAULT_STEP.mats * L(lv), samples: VAULT_BASE.ship + Math.floor(L(lv) / VAULT_STEP.shipPer) });   // 運び屋 1 回：素材 30 ＋ 5 × Lv・サンプル 2 ＋ 5 Lv ごとに 1
// 保険が 届く 時間：Lv ごとに −5 分（下は 15 分）。ボーダーゾーンの 保険だけ（専用の 設備なので）。ふつう（2 時間）も 手厚い（30 分）も 同じ だけ 早く なる〔Claude の 案：カードは ふつうの 2 時間の 例〕
export const vaultIns = (lv, wait) => (wait <= VAULT_STEP.insMin ? wait : Math.max(VAULT_STEP.insMin, wait - VAULT_STEP.ins * L(lv)));
