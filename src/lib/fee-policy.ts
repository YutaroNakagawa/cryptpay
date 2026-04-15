// ============================================================================
// 手数料ポリシー
//
// 法的位置づけ:
//   これらの手数料は「暗号資産の売買に対するスプレッド」ではなく、
//   「決済代行プラットフォームのシステム利用料」として設定される。
//   加盟店は本サービスを利用して決済を受け付ける対価として手数料を支払う。
// ============================================================================

import { PLATFORM_FEE_RATE, WITHDRAWAL_FEE_FIXED } from "./constants";

/**
 * 決済時のプラットフォーム手数料を計算する。
 *
 * @param amountFiat - 商品代金（法定通貨）
 * @returns プラットフォーム手数料額（法定通貨）
 *
 * 手数料は「システム利用料」であり、暗号資産の売買差益ではない。
 */
export function calculatePlatformFee(amountFiat: number): number {
  return Math.ceil(amountFiat * (PLATFORM_FEE_RATE / 100));
}

/**
 * 購入者が支払うべき総額を算出する（商品代金 + プラットフォーム手数料）。
 *
 * @param amountFiat - 商品代金（法定通貨）
 * @returns { total, fee } — 請求総額とプラットフォーム手数料
 */
export function calculateInvoiceTotal(amountFiat: number): {
  total: number;
  fee: number;
} {
  const fee = calculatePlatformFee(amountFiat);
  return { total: amountFiat + fee, fee };
}

/**
 * 出金時の手数料を取得する。
 *
 * 現在は固定額。将来的にティアや出金額に応じた計算に拡張可能。
 */
export function getWithdrawalFee(): number {
  return WITHDRAWAL_FEE_FIXED;
}
