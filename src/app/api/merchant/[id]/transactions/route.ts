import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { data: transactions, error } = await db
      .from("transactions")
      .select("id, order_id, amount_fiat, platform_fee_fiat, pay_currency, pay_amount, status, description, created_at, completed_at")
      .eq("merchant_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: "取得に失敗しました", code: "DB_ERROR" },
        { status: 500 },
      );
    }

    return NextResponse.json({ transactions: transactions ?? [] });
  } catch (error) {
    console.error("[merchant/transactions] Error:", error);
    return NextResponse.json(
      { error: "内部エラー", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
