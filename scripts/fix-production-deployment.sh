#!/bin/bash
# Fix failed production deployment

echo "=== Fixing Production Deployment ==="
echo "This script will:"
echo "1. Force reset production to match master branch"
echo "2. Rebuild frontend and backend"
echo "3. Fix nginx configuration"
echo ""

# SSH command function
run_on_server() {
    ssh root@157.245.142.145 "$1"
}

echo "=== Step 1: Force reset git repository ==="
run_on_server "cd /var/www/app.flippi.ai && git fetch origin && git reset --hard origin/master && git clean -fd"

echo "=== Step 2: Check current commit ==="
run_on_server "cd /var/www/app.flippi.ai && git log --oneline -5"

echo "=== Step 3: Install backend dependencies ==="
run_on_server "cd /var/www/app.flippi.ai/backend && npm install --production"

echo "=== Step 4: Build frontend ==="
run_on_server "cd /var/www/app.flippi.ai/mobile-app && npm install && npx expo export --platform web --output-dir dist"

echo "=== Step 5: Fix nginx duplicate location issue ==="
run_on_server "sed -i '0,/location = \/privacy/{//!d;}' /etc/nginx/sites-available/app.flippi.ai && nginx -t"

echo "=== Step 6: Restart services ==="
run_on_server "pm2 restart prod-backend prod-frontend && nginx -s reload"

echo "=== Step 7: Verify deployment ==="
sleep 5
curl -s https://app.flippi.ai/health | jq '.'

echo "=== Deployment fix complete! ==="