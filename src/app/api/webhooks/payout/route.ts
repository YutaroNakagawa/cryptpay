// ============================================================================
// POST /api/webhooks/payout — NOWPayments Payout IPN (出金完了通知)
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
    const payoutId = String(payload.id);
    const payoutStatus = payload.status as string;
    const db = getDb();

    const payloadHash = createHash("sha256").update(rawBody).digest("hex");
    const eventId = `payout_${payoutId}_${payoutStatus}`;

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

    const { data: payoutRequest } = await db
      .from("payout_requests")
      .select("*")
      .eq("nowpayments_payout_id", payoutId)
      .single();

    if (!payoutRequest) {
      console.warn(`[webhook/payout] Unknown payout_id: ${payoutId}`);
      return NextResponse.json({ status: "unknown_payout" });
    }

    const statusMap: Record<string, string> = {
      finished: "COMPLETED", failed: "FAILED", processing: "PROCESSING",
    };
    const newStatus = statusMap[payoutStatus] ?? "PROCESSING";

    await db
      .from("payout_requests")
      .update({
        status: newStatus,
        completed_at: newStatus === "COMPLETED" ? new Date().toISOString() : null,
        rejection_reason: newStatus === "FAILED" ? `NP status: ${payoutStatus}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutRequest.id);

    await db
      .from("webhook_events")
      .update({ processed: true })
      .eq("provider", "nowpayments")
      .eq("event_id", eventId);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook/payout] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
