// ============================================================================
// アプリケーション固有エラー定義
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * デポジット残高不足エラー
 *
 * 法的根拠: 加盟店がシステム利用料（手数料）を事前にデポジットし、
 * 出金時にそこから充当する。残高不足の場合は出金をブロックし、
 * 追加のデポジットを促す。
 */
export class DepositInsufficientError extends AppError {
  constructor(
    public required: number,
    public available: number,
  ) {
    super(
      `手数料デポジット残高が不足しています。必要額: ${required}, 残高: ${available}。出金にはデポジットの追加が必要です。`,
      "DEPOSIT_INSUFFICIENT_FOR_WITHDRAWAL_FEE",
      403,
    );
    this.name = "DepositInsufficientError";
  }
}

export class PaymentCreationError extends AppError {
  constructor(detail: string) {
    super(
      `決済の作成に失敗しました: ${detail}`,
      "PAYMENT_CREATION_FAILED",
      502,
    );
    this.name = "PaymentCreationError";
  }
}

export class PayoutCreationError extends AppError {
  constructor(detail: string) {
    super(`出金処理に失敗しました: ${detail}`, "PAYOUT_CREATION_FAILED", 502);
    this.name = "PayoutCreationError";
  }
}

export class WebhookValidationError extends AppError {
  constructor(detail: string) {
    super(
      `Webhook 検証に失敗しました: ${detail}`,
      "WEBHOOK_VALIDATION_FAILED",
      401,
    );
    this.name = "WebhookValidationError";
  }
}

export class MerchantNotFoundError extends AppError {
  constructor() {
    super("加盟店が見つかりません。", "MERCHANT_NOT_FOUND", 404);
    this.name = "MerchantNotFoundError";
  }
}
