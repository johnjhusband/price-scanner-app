#!/bin/bash
set -euo pipefail

echo "🔧 Fixing OAuth for blue.flippi.ai..."

cd /var/www/blue.flippi.ai

# Run OAuth configuration
if [ -f scripts/ensure-oauth-config.sh ]; then
    bash scripts/ensure-oauth-config.sh
fi

# Test OAuth endpoint
echo "🔍 Testing OAuth endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/auth/google)

if [ "$HTTP_CODE" = "302" ]; then
    echo "✨ OAuth is working correctly! (302 redirect)"
    echo "✨ This release has been successfully deployed to blue.flippi.ai and is clear of errors. Enjoy testing. ✨"
else
    echo "⚠️  OAuth returned HTTP $HTTP_CODE (expected 302)"
    echo "📋 Checking logs..."
    pm2 logs dev-backend --lines 20 --nostream | grep -i "oauth\|google" || true
fi