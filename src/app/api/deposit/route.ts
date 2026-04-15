// ============================================================================
// POST /api/deposit — デポジット（システム利用料の前払い）入金
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { addDeposit } from "@/lib/deposit-service";
import { addDepositSchema } from "@/lib/validations";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = addDepositSchema.parse(body);

    const merchant = await addDeposit(
      validated.merchantId,
      validated.amount,
      validated.description,
    );

    return NextResponse.json({
      message: "デポジットが入金されました",
      depositBalance: Number(merchant.deposit_balance),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error("[deposit] Error:", error);
    return NextResponse.json(
      { error: "デポジットの処理に失敗しました", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
