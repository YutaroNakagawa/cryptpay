// ============================================================================
// POST /api/payments/create — 決済インボイス作成
//
// 法的位置づけ:
//   加盟店が指定した商品代金に「システム利用料（プラットフォーム手数料）」を
//   上乗せした総額で NOWPayments インボイスを生成する。
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createPayment } from "@/lib/nowpayments";
import { calculateInvoiceTotal } from "@/lib/fee-policy";
import { createPaymentSchema } from "@/lib/validations";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);
    const db = getDb();

    const { data: merchant, error: fetchErr } = await db
      .from("merchants")
      .select("*")
      .eq("id", validated.merchantId)
      .single();

    if (fetchErr || !merchant) {
      return NextResponse.json(
        { error: "加盟店が見つかりません", code: "MERCHANT_NOT_FOUND" },
        { status: 404 },
      );
    }

    const { total, fee } = calculateInvoiceTotal(validated.amountFiat);

    const npPayment = await createPayment({
      priceAmount: total,
      priceCurrency: merchant.fiat_currency,
      payCurrency: validated.payCurrency,
      ipnCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`,
      orderId: validated.orderId,
      orderDescription: validated.description,
    });

    const { data: transaction, error: insertErr } = await db
      .from("transactions")
      .insert({
        merchant_id: merchant.id,
        order_id: validated.orderId,
        nowpayments_payment_id: String(npPayment.payment_id),
        amount_fiat: validated.amountFiat,
        platform_fee_fiat: fee,
        pay_currency: npPayment.pay_currency,
        pay_amount: npPayment.pay_amount,
        pay_address: npPayment.pay_address,
        status: "PENDING",
        description: validated.description,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: `DB記録失敗: ${insertErr.message}`, code: "DB_ERROR" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      transactionId: transaction.id,
      paymentId: npPayment.payment_id,
      payAddress: npPayment.pay_address,
      payAmount: npPayment.pay_amount,
      payCurrency: npPayment.pay_currency,
      priceAmount: total,
      priceCurrency: merchant.fiat_currency,
      productAmount: validated.amountFiat,
      platformFee: fee,
      status: "PENDING",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error("[payments/create] Error:", error);
    return NextResponse.json(
      { error: "決済の作成に失敗しました", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
