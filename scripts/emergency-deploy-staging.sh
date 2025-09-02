#!/bin/bash
# Emergency deployment script for staging
# This bypasses GitHub Actions and deploys directly

echo "=== EMERGENCY STAGING DEPLOYMENT ==="
echo "Deploying directly to green.flippi.ai..."

# SSH command to deploy
ssh root@157.245.142.145 << 'ENDSSH'
cd /var/www/green.flippi.ai

echo "1. Resetting repository..."
git reset --hard HEAD
git clean -fd

echo "2. Pulling latest staging branch..."
git fetch origin staging
git reset --hard origin/staging

echo "3. Installing backend dependencies..."
cd backend
npm install --production

echo "4. Building frontend..."
cd ../mobile-app
npm install
# Add memory limit to prevent hanging
export NODE_OPTIONS="--max-old-space-size=4096"
npx expo export --platform web --output-dir dist

echo "5. Adding growth routes to nginx..."
cd /var/www/green.flippi.ai
if [ -f scripts/add-growth-routes-nginx.sh ]; then
    bash scripts/add-growth-routes-nginx.sh green.flippi.ai 3001
fi

echo "6. Restarting services..."
pm2 restart staging-backend staging-frontend

echo "7. Reloading nginx..."
nginx -s reload

echo "8. Verifying deployment..."
sleep 3
curl -s http://localhost:3001/health
pm2 status

echo "=== DEPLOYMENT COMPLETE ==="
ENDSSH