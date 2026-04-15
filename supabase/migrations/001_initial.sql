-- ============================================================================
-- クリプトペイ — 初期スキーマ（冪等版）
-- 既にテーブルが存在する場合もエラーにならず実行できます。
-- ============================================================================

-- 列挙型（存在しない場合のみ作成）
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM (
    'PENDING', 'WAITING', 'CONFIRMING', 'FINISHED',
    'PARTIALLY_PAID', 'FAILED', 'EXPIRED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deposit_ledger_type AS ENUM (
    'TOPUP', 'FEE_DEDUCT', 'ADJUSTMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 加盟店
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  fiat_currency    VARCHAR(3) NOT NULL DEFAULT 'JPY',
  deposit_balance  DECIMAL(18, 2) NOT NULL DEFAULT 0,
  sales_balance    DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 決済トランザクション
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id              UUID NOT NULL REFERENCES merchants(id),
  order_id                 TEXT,
  nowpayments_payment_id   TEXT UNIQUE,
  amount_fiat              DECIMAL(18, 2) NOT NULL,
  platform_fee_fiat        DECIMAL(18, 2) NOT NULL,
  pay_currency             VARCHAR(10),
  pay_amount               DECIMAL(28, 18),
  status                   transaction_status NOT NULL DEFAULT 'PENDING',
  pay_address              TEXT,
  description              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ---------------------------------------------------------------------------
-- デポジット台帳
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposit_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
  amount          DECIMAL(18, 2) NOT NULL,
  type            deposit_ledger_type NOT NULL,
  description     TEXT,
  reference_id    UUID,
  reference_type  VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposit_ledger_merchant_id ON deposit_ledger(merchant_id);

-- ---------------------------------------------------------------------------
-- 出金リクエスト
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payout_requests (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id            UUID NOT NULL REFERENCES merchants(id),
  amount_fiat            DECIMAL(18, 2) NOT NULL,
  withdrawal_fee_fiat    DECIMAL(18, 2) NOT NULL,
  nowpayments_payout_id  TEXT UNIQUE,
  status                 payout_status NOT NULL DEFAULT 'PENDING',
  rejection_reason       TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_merchant_id ON payout_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- ---------------------------------------------------------------------------
-- Webhook イベントログ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      VARCHAR(50) NOT NULL,
  event_id      VARCHAR(255) NOT NULL,
  payload_hash  VARCHAR(64) NOT NULL,
  processed     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchants_updated_at ON merchants;
CREATE TRIGGER trg_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payout_requests_updated_at ON payout_requests;
CREATE TRIGGER trg_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
