import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPaymentStatus } from "@/lib/nowpayments";

// NOWPayments のステータス → 内部ステータスのマッピング
const STATUS_MAP: Record<string, string> = {
  waiting: "WAITING",
  confirming: "CONFIRMING",
  confirmed: "CONFIRMING",
  sending: "CONFIRMING",
  finished: "FINISHED",
  partially_paid: "PARTIALLY_PAID",
  failed: "FAILED",
  expired: "EXPIRED",
  refunded: "REFUNDED",
};

// 未確定のステータス（NOWPayments に再確認が必要）
const PENDING_STATUSES = new Set(["PENDING", "WAITING", "CONFIRMING"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { data: transaction, error } = await db
      .from("transactions")
      .select(
        "id, merchant_id, order_id, nowpayments_payment_id, amount_fiat, platform_fee_fiat, pay_currency, pay_amount, pay_address, status, description, created_at, completed_at",
      )
      .eq("id", id)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: "決済が見つかりません", code: "TRANSACTION_NOT_FOUND" },
        { status: 404 },
      );
    }

    // ローカル開発・Webhook未設定でも動くよう、未確定状態なら NOWPayments に直接照会して DB を同期
    if (
      PENDING_STATUSES.has(transaction.status) &&
      transaction.nowpayments_payment_id &&
      process.env.NOWPAYMENTS_API_KEY
    ) {
      try {
        const npStatus = await getPaymentStatus(
          transaction.nowpayments_payment_id,
        );
        const mappedStatus =
          STATUS_MAP[npStatus.payment_status] ?? transaction.status;

        if (mappedStatus !== transaction.status) {
          const updatePayload: Record<string, unknown> = {
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          };
          if (mappedStatus === "FINISHED") {
            updatePayload.completed_at = new Date().toISOString();
          }

          await db
            .from("transactions")
            .update(updatePayload)
            .eq("id", transaction.id);

          // 決済完了 → 売上残高を加算
          if (mappedStatus === "FINISHED") {
            const { data: merchant } = await db
              .from("merchants")
              .select("sales_balance")
              .eq("id", transaction.merchant_id)
              .single();

            if (merchant) {
              await db
                .from("merchants")
                .update({
                  sales_balance:
                    Number(merchant.sales_balance) +
                    Number(transaction.amount_fiat),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", transaction.merchant_id);
            }
          }

          transaction.status = mappedStatus;
        }
      } catch (syncErr) {
        // NOWPayments 照会失敗は無視してDB値を返す
        console.warn("[payments/get] NOWPayments sync failed:", syncErr);
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[payments/get] Error:", error);
    return NextResponse.json(
      { error: "内部エラー", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
