// ============================================================================
// データアクセス層 — Supabase JS Client
//
// Supabase REST API 経由でデータベース操作を行う。
// Prisma の代わりに Supabase PostgREST を使用。
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _client;
}

// ---------------------------------------------------------------------------
// 型定義 (DB テーブルに対応)
// ---------------------------------------------------------------------------

export interface Merchant {
  id: string;
  supabase_user_id: string;
  name: string;
  email: string;
  fiat_currency: string;
  deposit_balance: number;
  sales_balance: number;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus =
  | "PENDING" | "WAITING" | "CONFIRMING" | "FINISHED"
  | "PARTIALLY_PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export interface Transaction {
  id: string;
  merchant_id: string;
  order_id: string | null;
  nowpayments_payment_id: string | null;
  amount_fiat: number;
  platform_fee_fiat: number;
  pay_currency: string | null;
  pay_amount: number | null;
  status: TransactionStatus;
  pay_address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type DepositLedgerType = "TOPUP" | "FEE_DEDUCT" | "ADJUSTMENT";

export interface DepositLedgerEntry {
  id: string;
  merchant_id: string;
  amount: number;
  type: DepositLedgerType;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export type PayoutStatus =
  | "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "FAILED";

export interface PayoutRequest {
  id: string;
  merchant_id: string;
  amount_fiat: number;
  withdrawal_fee_fiat: number;
  nowpayments_payout_id: string | null;
  status: PayoutStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string;
  payload_hash: string;
  processed: boolean;
  created_at: string;
}
