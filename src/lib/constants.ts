// ============================================================================
// ビジネス定数
//
// 法的ポジション: クリプトペイは「決済代行プラットフォーム」であり、
// 加盟店に対して「システム利用料」を徴収する。
// 手数料は暗号資産の売買差益ではなく、SaaS 利用料として設定される。
// ============================================================================

/** 決済1件あたりのプラットフォーム手数料率（%）*/
export const PLATFORM_FEE_RATE = parseFloat(
  process.env.PLATFORM_FEE_RATE ?? "3.5",
);

/** 出金1件あたりの固定手数料（法定通貨単位）*/
export const WITHDRAWAL_FEE_FIXED = parseFloat(
  process.env.WITHDRAWAL_FEE_FIXED ?? "500",
);

/** NOWPayments API base URL */
export const NOWPAYMENTS_API_URL =
  process.env.NOWPAYMENTS_API_URL ?? "https://api.nowpayments.io/v1";

/** 対応する法定通貨 */
export const SUPPORTED_FIAT_CURRENCIES = ["JPY", "USD", "EUR"] as const;

/** デフォルトの暗号資産通貨 */
export const DEFAULT_PAY_CURRENCY = "btc";
