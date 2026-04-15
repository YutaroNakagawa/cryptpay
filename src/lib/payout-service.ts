// ============================================================================
// 出金サービス — 売上金の法定通貨出金
//
// 出金フロー:
//   1. 加盟店が法定通貨での出金をリクエスト
//   2. デポジット残高 ≧ 出金手数料 であることを検証
//   3. デポジットから手数料を充当 + 売上残高を減算
//   4. NOWPayments Fiat Payout API を呼び出し
//
// 法的根拠:
//   この出金は「加盟店の売上金を法定通貨で渡す」処理であり、
//   暗号資産の売買行為ではない。
// ============================================================================

import { getDb } from "./db";
import { getWithdrawalFee } from "./fee-policy";
import { createPayout } from "./nowpayments";
import {
  DepositInsufficientError,
  MerchantNotFoundError,
  PayoutCreationError,
} from "./errors";

export interface PayoutRequestInput {
  merchantId: string;
  amountFiat: number;
  destinationAddress: string;
}

export async function requestPayout(input: PayoutRequestInput) {
  const { merchantId, amountFiat, destinationAddress } = input;
  const withdrawalFee = getWithdrawalFee();
  const db = getDb();

  const { data: merchant, error: fetchErr } = await db
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .single();
  if (fetchErr || !merchant) throw new MerchantNotFoundError();

  const depositBalance = Number(merchant.deposit_balance);
  if (depositBalance < withdrawalFee) {
    throw new DepositInsufficientError(withdrawalFee, depositBalance);
  }

  const salesBalance = Number(merchant.sales_balance);
  if (salesBalance < amountFiat) {
    throw new PayoutCreationError(
      `売上残高が不足しています。出金希望額: ${amountFiat}, 売上残高: ${salesBalance}`,
    );
  }

  // 出金リクエスト作成
  const { data: payout, error: createErr } = await db
    .from("payout_requests")
    .insert({
      merchant_id: merchantId,
      amount_fiat: amountFiat,
      withdrawal_fee_fiat: withdrawalFee,
      status: "PENDING",
    })
    .select()
    .single();
  if (createErr || !payout) throw new PayoutCreationError(createErr?.message ?? "作成失敗");

  // デポジットから手数料充当 + 売上減算
  const { error: ledgerErr } = await db.from("deposit_ledger").insert({
    merchant_id: merchantId,
    amount: -withdrawalFee,
    type: "FEE_DEDUCT",
    description: `出金手数料充当 (payout: ${payout.id})`,
    reference_id: payout.id,
    reference_type: "payout_request",
  });
  if (ledgerErr) throw new PayoutCreationError(`台帳記録失敗: ${ledgerErr.message}`);

  const { error: balanceErr } = await db
    .from("merchants")
    .update({
      deposit_balance: depositBalance - withdrawalFee,
      sales_balance: salesBalance - amountFiat,
      updated_at: new Date().toISOString(),
    })
    .eq("id", merchantId);
  if (balanceErr) throw new PayoutCreationError(`残高更新失敗: ${balanceErr.message}`);

  // NOWPayments Payout API 呼び出し
  try {
    const npPayout = await createPayout({
      address: destinationAddress,
      amount: amountFiat,
      currency: merchant.fiat_currency,
      ipnCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payout`,
    });

    await db
      .from("payout_requests")
      .update({ nowpayments_payout_id: npPayout.id, status: "PROCESSING" })
      .eq("id", payout.id);

    return { ...payout, nowpayments_payout_id: npPayout.id };
  } catch (error) {
    await db
      .from("payout_requests")
      .update({
        status: "FAILED",
        rejection_reason: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", payout.id);
    throw error;
  }
}

export async function getPayoutRequests(merchantId: string, limit = 50) {
  const db = getDb();
  const { data, error } = await db
    .from("payout_requests")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`出金履歴取得失敗: ${error.message}`);
  return data;
}
