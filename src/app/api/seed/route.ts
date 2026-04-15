// デモ加盟店をデータベースに作成するシードエンドポイント。
// DEMO_MODE=true の時のみ動作します。

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const DEMO_MERCHANT_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "DEMO_MODE が有効ではありません" },
      { status: 403 },
    );
  }

  const db = getDb();

  const { error } = await db.from("merchants").upsert(
    {
      id: DEMO_MERCHANT_ID,
      supabase_user_id: "demo-user-00000000-0000-0000-0000-000000000001",
      name: "デモ加盟店",
      email: "demo@cryptopay.example",
      fiat_currency: "JPY",
      deposit_balance: 10000,
      sales_balance: 0,
    },
    { onConflict: "id" },
  );

  if (error) {
    return NextResponse.json(
      { error: `シード失敗: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    merchantId: DEMO_MERCHANT_ID,
    message: "デモ加盟店を作成しました。/dashboard にアクセスしてください。",
  });
}
