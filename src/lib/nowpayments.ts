// ============================================================================
// NOWPayments API クライアント
//
// 本モジュールは NOWPayments の Custody / Payout 機能を利用して
// 「決済代行」を実現する。暗号資産の売買行為は行わない。
// NOWPayments が提供するインフラを通じて購入者の暗号資産支払いを受け付け、
// 加盟店へは法定通貨で売上を渡す。
// ============================================================================

import { NOWPAYMENTS_API_URL } from "./constants";
import { PaymentCreationError, PayoutCreationError } from "./errors";

const headers = (): Record<string, string> => ({
  "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
  "Content-Type": "application/json",
});

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

export interface CreatePaymentParams {
  /** 請求額（法定通貨） — 商品代金 + プラットフォーム手数料 */
  priceAmount: number;
  /** 法定通貨コード (JPY, USD, …) */
  priceCurrency: string;
  /** 購入者が支払う暗号資産の通貨コード (btc, eth, …) */
  payCurrency: string;
  /** IPN (Webhook) コールバック URL */
  ipnCallbackUrl: string;
  /** 加盟店側の注文ID（冪等キー） */
  orderId: string;
  /** 商品説明（任意） */
  orderDescription?: string;
}

export interface NowPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description?: string;
  purchase_id: number;
  created_at: string;
}

export interface CreatePayoutParams {
  /** 出金先アドレスまたは口座情報（Fiat Payout の場合は別途仕様に従う） */
  address: string;
  /** 出金額（法定通貨） */
  amount: number;
  /** 通貨コード */
  currency: string;
  /** 内部参照 ID */
  ipnCallbackUrl: string;
}

export interface NowPayoutResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// API 関数
// ---------------------------------------------------------------------------

/**
 * NOWPayments で決済インボイスを作成する。
 *
 * POST /payment — 購入者が暗号資産で支払うための送金先情報を取得。
 * クリプトペイは「決済の仲介」を行い、暗号資産の売買は行わない。
 *
 * DEMO_MODE=true または NOWPAYMENTS_API_KEY 未設定の場合はモックデータを返す。
 */
export async function createPayment(
  params: CreatePaymentParams,
): Promise<NowPaymentResponse> {
  const isDemoMode =
    process.env.DEMO_MODE === "true" || !process.env.NOWPAYMENTS_API_KEY;

  if (isDemoMode) {
    // JPY換算: 1 BTC ≈ 15,000,000 JPY（デモ用の仮レート）
    const btcAmount = (params.priceAmount / 15_000_000).toFixed(8);
    return {
      payment_id: Date.now(),
      payment_status: "waiting",
      pay_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      pay_amount: parseFloat(btcAmount),
      pay_currency: params.payCurrency,
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      purchase_id: Date.now(),
      created_at: new Date().toISOString(),
    };
  }

  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      pay_currency: params.payCurrency,
      ipn_callback_url: params.ipnCallbackUrl,
      order_id: params.orderId,
      order_description: params.orderDescription,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new PaymentCreationError(
      `NOWPayments API ${res.status}: ${body}`,
    );
  }

  return res.json();
}

/**
 * NOWPayments の決済ステータスを照会する。
 *
 * GET /payment/{payment_id}
 */
export async function getPaymentStatus(
  paymentId: string,
): Promise<NowPaymentResponse> {
  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new PaymentCreationError(
      `ステータス照会失敗 ${res.status}: ${body}`,
    );
  }

  return res.json();
}

/**
 * NOWPayments Fiat Payout を実行する。
 *
 * POST /payout — 暗号資産を法定通貨に換金して加盟店へ送金。
 * この処理は「加盟店の売上金を法定通貨で渡す」ための決済代行機能であり、
 * クリプトペイ自身が暗号資産の売買を行うものではない。
 */
export async function createPayout(
  params: CreatePayoutParams,
): Promise<NowPayoutResponse> {
  const res = await fetch(`${NOWPAYMENTS_API_URL}/payout`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      address: params.address,
      amount: params.amount,
      currency: params.currency,
      ipn_callback_url: params.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new PayoutCreationError(
      `NOWPayments Payout API ${res.status}: ${body}`,
    );
  }

  return res.json();
}

/**
 * 利用可能な暗号資産通貨一覧を取得する。
 */
export async function getAvailableCurrencies(): Promise<
  { id: number; code: string; name: string }[]
> {
  const res = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.currencies ?? [];
}
