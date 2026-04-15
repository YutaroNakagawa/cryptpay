// ============================================================================
// POST /api/payout — 出金リクエスト
//
// 出金バリデーション:
//   1. デポジット残高 ≧ 出金手数料 であることを検証
//   2. 不足時は HTTP 403 + DEPOSIT_INSUFFICIENT_FOR_WITHDRAWAL_FEE で拒否
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requestPayout } from "@/lib/payout-service";
import { requestPayoutSchema } from "@/lib/validations";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestPayoutSchema.parse(body);

    const payout = await requestPayout({
      merchantId: validated.merchantId,
      amountFiat: validated.amountFiat,
      destinationAddress: validated.destinationAddress,
    });

    return NextResponse.json({
      message: "出金リクエストを受け付けました",
      payoutRequestId: payout.id,
      status: "PROCESSING",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error("[payout] Error:", error);
    return NextResponse.json(
      { error: "出金処理に失敗しました", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
