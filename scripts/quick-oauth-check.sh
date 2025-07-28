#!/bin/bash
# Quick OAuth configuration check for staging

echo "=== Quick OAuth Check for Staging ==="
echo ""

# Check if OAuth is working externally
echo "Testing OAuth endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)

if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
    echo "✅ OAuth is working! (redirect detected)"
    echo ""
    echo "You can now log in at: https://green.flippi.ai"
    echo "Click 'Sign in with Google' to test the full flow"
else
    echo "❌ OAuth is NOT working (status: $RESPONSE)"
    echo ""
    if [ "$RESPONSE" = "200" ]; then
        echo "Issue: Nginx is serving frontend instead of proxying to backend"
        echo "Fix: Run 'sudo bash scripts/apply-staging-oauth-fix.sh'"
    elif [ "$RESPONSE" = "502" ]; then
        echo "Issue: Backend is not running"
        echo "Fix: Check PM2 status with 'pm2 list'"
    else
        echo "Unknown issue - run full verification:"
        echo "bash scripts/verify-oauth-config.sh staging"
    fi
fi

echo ""
echo "For detailed diagnostics, run:"
echo "bash scripts/verify-oauth-config.sh staging"