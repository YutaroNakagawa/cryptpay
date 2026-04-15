import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { data: merchant, error } = await db
      .from("merchants")
      .select("id, name, email, fiat_currency, deposit_balance, sales_balance, created_at")
      .eq("id", id)
      .single();

    if (error || !merchant) {
      return NextResponse.json(
        { error: "加盟店が見つかりません", code: "MERCHANT_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("[merchant/get] Error:", error);
    return NextResponse.json(
      { error: "内部エラー", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
