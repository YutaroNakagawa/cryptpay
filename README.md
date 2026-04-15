# クリプトペイ — 仮想通貨決済 SaaS

NOWPayments API を活用した仮想通貨決済代行プラットフォーム。  
顧客はビットコイン等の暗号資産で支払い、加盟店は日本円・ドルで売上を受け取れます。

## 法的ポジション

- **暗号資産交換業に該当しない設計**
- 手数料は「システム利用料」として事前デポジット制で徴収
- 暗号資産の売買差益を収益源としない「決済代行」スキーム

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 16 (App Router), Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Payment | NOWPayments API |

---

## セットアップ手順（本番デプロイ）

### 必要なアカウント

| サービス | 用途 |
|---------|------|
| [Supabase](https://supabase.com) | データベース（無料プランで可） |
| [NOWPayments](https://nowpayments.io) | 仮想通貨決済ゲートウェイ |
| [Vercel](https://vercel.com) 等 | ホスティング（無料プランで可） |

---

### Step 1: Supabase でデータベースを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. ダッシュボードの **SQL Editor** を開く
3. [`supabase/migrations/001_initial.sql`](./supabase/migrations/001_initial.sql) の内容を全てペーストして実行

これだけでテーブルが作成されます。

---

### Step 2: NOWPayments の設定

1. [nowpayments.io](https://nowpayments.io) でアカウント作成
2. ダッシュボード → **API Keys** で APIキーを生成
3. ダッシュボード → **IPN Settings** に以下を登録:
   ```
   https://あなたのドメイン/api/webhooks/payment
   ```
4. IPN Secret をメモしておく

---

### Step 3: 環境変数を設定

```bash
cp .env.example .env
```

`.env` を開いて以下を入力:

| 変数名 | 説明 | 取得場所 |
|--------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase → Settings → API |
| `NOWPAYMENTS_API_KEY` | NOWPayments APIキー | NOWPayments → API Keys |
| `NOWPAYMENTS_IPN_SECRET` | NOWPayments IPN Secret | NOWPayments → IPN Settings |
| `NEXT_PUBLIC_APP_URL` | デプロイ先URL | 例: `https://pay.your-domain.com` |
| `ADMIN_API_KEY` | 管理者用シークレットキー | 自分で生成: `openssl rand -hex 32` |

本番では必ず:
```
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

---

### Step 4: デプロイ

**Vercel（推奨）:**
```bash
npx vercel --prod
```
環境変数は Vercel ダッシュボードで設定する。

**セルフホスト:**
```bash
npm install
npm run build
npm start
```

---

### Step 5: 加盟店登録

デプロイ後、ブラウザで以下にアクセス:

```
https://あなたのドメイン/setup
```

店舗名・メールアドレスを入力するだけで **Merchant ID** が発行されます。  
このIDをECサイトの設定に使います。

---

## ECサイト連携ガイド

加盟店登録で取得した `merchantId` を使います。

### 方法A: リダイレクト方式（最も簡単）

購入者を以下のURLにリダイレクトするだけ:

```
https://あなたのドメイン/pay/new?amount=10000&merchant=YOUR_MERCHANT_ID
```

| パラメータ | 説明 |
|-----------|------|
| `amount` | 商品代金（法定通貨単位、例: 10000 = 1万円） |
| `merchant` | Merchant ID |

### 方法B: API方式（推奨）

サーバー側から決済インボイスを生成してURLを返す:

```bash
curl -X POST https://あなたのドメイン/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_ID",
    "amountFiat": 10000,
    "payCurrency": "btc",
    "orderId": "ORDER-001",
    "description": "商品名"
  }'
```

レスポンス:
```json
{
  "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "payAddress": "bc1q...",
  "payAmount": 0.00066667,
  "payCurrency": "BTC",
  "status": "PENDING"
}
```

取得した `transactionId` でステータスをポーリング:

```bash
curl https://あなたのドメイン/api/payments/TRANSACTION_ID
```

`status` が `FINISHED` になったら注文確定。

### 決済ステータス一覧

| status | 意味 |
|--------|------|
| `PENDING` | 決済作成済み |
| `WAITING` | ウォレット送金待ち |
| `CONFIRMING` | ブロックチェーン確認中 |
| `FINISHED` | **決済完了 ✅** |
| `EXPIRED` | 期限切れ（30分） |
| `FAILED` | 失敗 |

---

## 売上の出金

```bash
curl -X POST https://あなたのドメイン/api/payout \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_ID",
    "amountFiat": 50000,
    "destinationAddress": "出金先の銀行口座番号等"
  }'
```

> **注意:** 出金には手数料デポジット（¥500/件）が必要です。  
> デポジットが不足している場合は先にチャージしてください。

デポジット追加:
```bash
curl -X POST https://あなたのドメイン/api/deposit \
  -H "Content-Type: application/json" \
  -d '{ "merchantId": "YOUR_MERCHANT_ID", "amount": 5000 }'
```

---

## ダッシュボード

売上確認・QRコード生成:

```
https://あなたのドメイン/dashboard?merchantId=YOUR_MERCHANT_ID
```

---

## ローカル開発（デモモード）

```bash
# 1. 環境変数設定
cp .env.example .env
# .env の DEMO_MODE=true, NEXT_PUBLIC_DEMO_MODE=true に変更

# 2. 依存関係インストール
npm install

# 3. 開発サーバー起動
npm run dev

# 4. ブラウザで http://localhost:3000/setup にアクセスして加盟店登録
# （Supabaseの接続情報は必要）
```

デモモード時は「（Demo）支払いを完了する」ボタンが表示されるので、  
実際の仮想通貨送金なしで決済フローをテストできます。

---

## APIエンドポイント一覧

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | `/api/merchants/register` | なし | 加盟店セルフ登録 |
| POST | `/api/merchants` | `x-admin-key` | 管理者による加盟店登録 |
| POST | `/api/payments/create` | なし | 決済インボイス作成 |
| GET | `/api/payments/[id]` | なし | 決済ステータス照会 |
| POST | `/api/deposit` | なし | デポジット入金 |
| POST | `/api/payout` | なし | 売上出金リクエスト |
| GET | `/api/merchant/[id]` | なし | 加盟店情報取得 |
| GET | `/api/merchant/[id]/transactions` | なし | 決済履歴取得 |
| POST | `/api/webhooks/payment` | IPN署名 | NOWPayments 決済Webhook |
| POST | `/api/webhooks/payout` | IPN署名 | NOWPayments 出金Webhook |
