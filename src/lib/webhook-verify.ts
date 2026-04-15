// ============================================================================
// Webhook 署名検証
// NOWPayments IPN (Instant Payment Notification) のペイロードを検証する。
// ============================================================================

import { createHmac } from "crypto";
import { WebhookValidationError } from "./errors";

/**
 * NOWPayments IPN の HMAC 署名を検証する。
 *
 * NOWPayments はリクエストボディを IPN Secret で HMAC-SHA512 署名し、
 * ヘッダー `x-nowpayments-sig` に含めて送信する。
 */
export function verifyNowpaymentsSignature(
  rawBody: string,
  signatureHeader: string | null,
): void {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    throw new WebhookValidationError("IPN Secret が設定されていません");
  }

  if (!signatureHeader) {
    throw new WebhookValidationError("署名ヘッダーが見つかりません");
  }

  // NOWPayments の仕様: ボディの JSON キーをソートしてから HMAC を計算
  const parsed = JSON.parse(rawBody);
  const sorted = sortObject(parsed);
  const hmac = createHmac("sha512", secret)
    .update(JSON.stringify(sorted))
    .digest("hex");

  if (hmac !== signatureHeader) {
    throw new WebhookValidationError("署名が一致しません");
  }
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = obj[key];
        return result;
      },
      {} as Record<string, unknown>,
    );
}
