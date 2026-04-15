#!/bin/bash
# ============================================================
# クリプトペイ — Vercel デプロイスクリプト
# 使い方: bash scripts/deploy-vercel.sh
# ============================================================
set -e

echo "=== クリプトペイ Vercel デプロイ ==="

# Vercel CLI チェック
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI をインストールします..."
  npm install -g vercel
fi

# 依存関係
echo "[1/3] 依存関係をインストール..."
npm ci

# ビルド確認
echo "[2/3] ビルドを確認..."
npm run build

# デプロイ
echo "[3/3] Vercel にデプロイ..."
vercel --prod

echo ""
echo "=== デプロイ完了 ==="
echo ""
echo "次の手順:"
echo "1. Vercel ダッシュボード → Settings → Environment Variables で環境変数を設定"
echo "2. NOWPayments の IPN Settings に Webhook URL を登録"
echo "3. https://あなたのドメイン/setup にアクセスして加盟店登録"
