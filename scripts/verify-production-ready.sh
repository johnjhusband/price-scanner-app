#!/bin/bash
# Verify we're ready for production OAuth deployment

echo "=== Production OAuth Readiness Check ==="
echo ""

# Check staging is working
echo "1. Staging OAuth Status:"
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
if [ "$STAGING_STATUS" = "302" ]; then
    echo "   ✅ Staging returns 302 (working)"
else
    echo "   ❌ Staging returns $STAGING_STATUS (not working)"
    exit 1
fi

echo ""
echo "2. Production Script Check:"
if [ -f scripts/production-oauth-fix.sh ]; then
    echo "   ✅ production-oauth-fix.sh exists"
    # Check it doesn't have broken SSL includes
    if grep -q "options-ssl-nginx.conf" scripts/production-oauth-fix.sh; then
        echo "   ❌ WARNING: Script contains broken SSL includes!"
    else
        echo "   ✅ No broken SSL includes found"
    fi
else
    echo "   ❌ production-oauth-fix.sh missing"
fi

echo ""
echo "3. Key Configuration:"
echo "   Production domain: app.flippi.ai"
echo "   Production backend port: 3000"
echo "   Production frontend port: 8080"
echo "   SSL certificate path: /etc/letsencrypt/live/app.flippi.ai/"

echo ""
echo "4. Current Production OAuth Status:"
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://app.flippi.ai/auth/google)
echo "   Currently returns: $PROD_STATUS (expected 200 before deployment)"

echo ""
echo "5. Deployment Workflow:"
if [ -f .github/workflows/deploy-production.yml ]; then
    echo "   ✅ Production workflow exists"
    echo "   ⚠️  Remember to add OAuth fix script execution to workflow"
else
    echo "   ❌ Production workflow missing"
fi

echo ""
echo "=== READY FOR PRODUCTION? ==="
if [ "$STAGING_STATUS" = "302" ] && [ -f scripts/production-oauth-fix.sh ]; then
    echo "✅ YES - All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Update production workflow to run OAuth fix"
    echo "2. Ensure production .env has OAuth credentials"
    echo "3. Merge staging → master"
    echo "4. Monitor deployment"
else
    echo "❌ NO - Fix issues above first"
fi