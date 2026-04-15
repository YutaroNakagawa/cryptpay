// ============================================================================
// POST /api/webhooks/payment — NOWPayments IPN (決済完了通知)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyNowpaymentsSignature } from "@/lib/webhook-verify";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-nowpayments-sig");

    verifyNowpaymentsSignature(rawBody, signature);

    const payload = JSON.parse(rawBody);
    const paymentId = String(payload.payment_id);
    const paymentStatus = payload.payment_status as string;
    const db = getDb();

    // 冪等チェック
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const eventId = `${paymentId}_${paymentStatus}`;

    const { data: existing } = await db
      .from("webhook_events")
      .select("processed")
      .eq("provider", "nowpayments")
      .eq("event_id", eventId)
      .single();

    if (existing?.processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    await db.from("webhook_events").upsert(
      { provider: "nowpayments", event_id: eventId, payload_hash: payloadHash, processed: false },
      { onConflict: "provider,event_id" },
    );

    // トランザクション検索
    const { data: transaction } = await db
      .from("transactions")
      .select("*")
      .eq("nowpayments_payment_id", paymentId)
      .single();

    if (!transaction) {
      console.warn(`[webhook] Unknown payment_id: ${paymentId}`);
      return NextResponse.json({ status: "unknown_payment" });
    }

    const statusMap: Record<string, string> = {
      waiting: "WAITING", confirming: "CONFIRMING", confirmed: "CONFIRMING",
      sending: "CONFIRMING", finished: "FINISHED", partially_paid: "PARTIALLY_PAID",
      failed: "FAILED", expired: "EXPIRED", refunded: "REFUNDED",
    };
    const newStatus = statusMap[paymentStatus] ?? "PENDING";

    await db
      .from("transactions")
      .update({
        status: newStatus,
        completed_at: newStatus === "FINISHED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    // 決済完了 → 売上残高を加算
    if (newStatus === "FINISHED") {
      const { data: merchant } = await db
        .from("merchants")
        .select("sales_balance")
        .eq("id", transaction.merchant_id)
        .single();

      if (merchant) {
        await db
          .from("merchants")
          .update({
            sales_balance: Number(merchant.sales_balance) + Number(transaction.amount_fiat),
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.merchant_id);
      }
    }

    await db
      .from("webhook_events")
      .update({ processed: true })
      .eq("provider", "nowpayments")
      .eq("event_id", eventId);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook/payment] Error:", error);
    const status = error instanceof Error && error.message.includes("署名") ? 401 : 500;
    return NextResponse.json({ error: "Webhook processing failed" }, { status });
  }
}
