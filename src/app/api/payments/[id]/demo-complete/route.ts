// デモ専用: 決済を FINISHED に更新し、加盟店の売上残高を加算するエンドポイント。
// DEMO_MODE=true の時のみ動作します。

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "DEMO_MODE が有効ではありません" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const db = getDb();

  // トランザクションを取得
  const { data: transaction, error: fetchErr } = await db
    .from("transactions")
    .select("id, merchant_id, amount_fiat, platform_fee_fiat, status")
    .eq("id", id)
    .single();

  if (fetchErr || !transaction) {
    return NextResponse.json(
      { error: "決済が見つかりません", code: "TRANSACTION_NOT_FOUND" },
      { status: 404 },
    );
  }

  if (transaction.status === "FINISHED") {
    return NextResponse.json({ ok: true, message: "already finished" });
  }

  // トランザクションを FINISHED に更新
  const { error: updateTxErr } = await db
    .from("transactions")
    .update({ status: "FINISHED", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (updateTxErr) {
    return NextResponse.json(
      { error: `トランザクション更新失敗: ${updateTxErr.message}` },
      { status: 500 },
    );
  }

  // 加盟店の売上残高を加算、デポジットから手数料を減算
  const { data: merchant, error: merchantErr } = await db
    .from("merchants")
    .select("sales_balance, deposit_balance")
    .eq("id", transaction.merchant_id)
    .single();

  if (merchantErr || !merchant) {
    return NextResponse.json(
      { error: "加盟店が見つかりません" },
      { status: 404 },
    );
  }

  const newSalesBalance =
    Number(merchant.sales_balance) + Number(transaction.amount_fiat);
  const newDepositBalance =
    Number(merchant.deposit_balance) - Number(transaction.platform_fee_fiat);

  const { error: updateMerchantErr } = await db
    .from("merchants")
    .update({
      sales_balance: newSalesBalance,
      deposit_balance: Math.max(0, newDepositBalance),
    })
    .eq("id", transaction.merchant_id);

  if (updateMerchantErr) {
    return NextResponse.json(
      { error: `残高更新失敗: ${updateMerchantErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, status: "FINISHED" });
}
