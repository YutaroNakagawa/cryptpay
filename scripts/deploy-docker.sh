#!/bin/bash
# ============================================================
# クリプトペイ — Docker デプロイスクリプト
# 使い方: bash scripts/deploy-docker.sh
# ============================================================
set -e

IMAGE_NAME="cryptopay"
TAG="${1:-latest}"

echo "=== クリプトペイ Docker ビルド & 起動 ==="

# .env チェック
if [ ! -f .env ]; then
  echo "エラー: .env ファイルが見つかりません"
  echo "cp .env.example .env を実行して環境変数を設定してください"
  exit 1
fi

# Docker ビルド
echo "[1/2] Docker イメージをビルド..."
docker build -t "${IMAGE_NAME}:${TAG}" .

# 起動
echo "[2/2] コンテナを起動..."
docker stop cryptopay 2>/dev/null || true
docker rm cryptopay 2>/dev/null || true

docker run -d \
  --name cryptopay \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  "${IMAGE_NAME}:${TAG}"

echo ""
echo "=== 起動完了 ==="
echo "アクセス: http://localhost:3000"
echo "ログ確認: docker logs -f cryptopay"
