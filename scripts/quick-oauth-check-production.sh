#!/bin/bash
# Quick OAuth configuration check for production

echo "=== Quick OAuth Check for Production (app.flippi.ai) ==="
echo

# Check if OAuth is working externally
echo "Testing OAuth endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://app.flippi.ai/auth/google)

if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
    echo "✅ OAuth is working! (redirect detected)"
    echo
    echo "You can now log in at: https://app.flippi.ai"
    echo "Click 'Sign in with Google' to test the full flow"
else
    echo "❌ OAuth is NOT working (status: $RESPONSE)"
    echo
    if [ "$RESPONSE" = "200" ]; then
        echo "Issue: Nginx is serving frontend instead of proxying to backend"
        echo "Fix: Run 'sudo bash scripts/apply-production-oauth-fix.sh' on the server"
    elif [ "$RESPONSE" = "502" ]; then
        echo "Issue: Backend is not running"
        echo "Fix: Check PM2 status with 'pm2 list'"
    else
        echo "Unknown issue - check nginx and backend logs"
    fi
fi

echo
echo "Backend health check:"
curl -s https://app.flippi.ai/health | jq . || echo "Health check failed"