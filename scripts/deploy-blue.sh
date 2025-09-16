#!/bin/bash
set -euo pipefail

# Direct deployment script for blue.flippi.ai
# Run this locally when GitHub Actions workflow is broken

echo "🚀 Deploying to blue.flippi.ai..."

ssh root@137.184.24.201 'bash -s' << 'ENDSSH'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

cd /var/www/blue.flippi.ai
echo "== Sync code =="
git fetch origin develop
git reset --hard origin/develop
echo "Server commit: $(git rev-parse --short HEAD)"

echo "== Backend deps =="
cd backend && npm ci --production && cd ..

echo "== Python/venv for FotoFlip =="
sudo apt-get update -yq
sudo apt-get install -yq python3 python3-venv python3-pip python3-dev
python3 -m venv .venv || true
. .venv/bin/activate
pip install -U pip
pip install -r backend/requirements.txt
python - <<'PY'
from rembg import new_session; new_session('u2net'); print("MODEL_OK")
PY
deactivate

echo "== Frontend build =="
cd mobile-app
npm ci
npx expo export --platform web --output-dir dist
cp ../web-styles.css dist/ || true
cd ..

echo "== Nginx & PM2 =="
sudo nginx -t && sudo nginx -s reload || true
pm2 restart flippi-backend || pm2 start ecosystem.config.js --only flippi-backend

echo "== Healthchecks =="
test "$(curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai)" = "200"
test "$(curl -s -o /dev/null -w "%{http_code}" -L https://blue.flippi.ai/auth/google)" = "200" || true
test "$(curl -s -o /dev/null -w "%{http_code}" -X POST https://blue.flippi.ai/api/fotoflip/health)" = "200"

echo "✅ Deployment complete!"
ENDSSH