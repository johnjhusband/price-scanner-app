#!/bin/bash
# Post-deployment verification script for Flippi.ai
# Usage: ./post-deploy-verification.sh [prod|staging|dev]

set -e

ENV=$1
if [ -z "$ENV" ]; then
    echo "Usage: $0 [prod|staging|dev]"
    exit 1
fi

# Define environment mappings
case "$ENV" in
    "prod")
        DOMAIN="app.flippi.ai"
        EXPECTED_VERSION="release-004"
        ;;
    "staging")
        DOMAIN="green.flippi.ai"
        EXPECTED_VERSION="release-004"
        ;;
    "dev")
        DOMAIN="blue.flippi.ai"
        EXPECTED_VERSION="develop"
        ;;
    *)
        echo "Invalid environment. Use: prod, staging, or dev"
        exit 1
        ;;
esac

echo "=== Post-Deployment Verification for $DOMAIN ==="
echo "Expected version: $EXPECTED_VERSION"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Track verification results
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check endpoint
check_endpoint() {
    local ENDPOINT=$1
    local DESCRIPTION=$2
    local EXPECTED_STATUS=${3:-200}
    
    echo -n "Checking $DESCRIPTION... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN$ENDPOINT")
    
    if [ "$HTTP_STATUS" = "$EXPECTED_STATUS" ]; then
        echo "✅ PASS (HTTP $HTTP_STATUS)"
        ((CHECKS_PASSED++))
        return 0
    else
        echo "❌ FAIL (Expected $EXPECTED_STATUS, got $HTTP_STATUS)"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# 1. Check health endpoint
check_endpoint "/health" "Health endpoint"

# 2. Check version endpoint and verify commit
echo -n "Checking version endpoint... "
VERSION_DATA=$(curl -s "https://$DOMAIN/api/version" 2>/dev/null)
if [ -n "$VERSION_DATA" ] && echo "$VERSION_DATA" | jq . >/dev/null 2>&1; then
    echo "✅ PASS"
    ((CHECKS_PASSED++))
    
    # Display version info
    echo "  Version: $(echo "$VERSION_DATA" | jq -r .version)"
    echo "  Commit: $(echo "$VERSION_DATA" | jq -r .commit)"
    echo "  Build Time: $(echo "$VERSION_DATA" | jq -r .buildTime)"
    
    # Verify it's the expected version
    ACTUAL_VERSION=$(echo "$VERSION_DATA" | jq -r .version)
    if [[ "$ACTUAL_VERSION" == *"$EXPECTED_VERSION"* ]]; then
        echo "  ✅ Version matches expected: $EXPECTED_VERSION"
        ((CHECKS_PASSED++))
    else
        echo "  ❌ Version mismatch! Expected: $EXPECTED_VERSION, Got: $ACTUAL_VERSION"
        ((CHECKS_FAILED++))
    fi
else
    echo "❌ FAIL (Invalid or missing response)"
    ((CHECKS_FAILED++))
fi

# 3. Check legal pages
echo ""
echo "Legal Pages:"
check_endpoint "/terms" "Terms page"
check_endpoint "/privacy" "Privacy page"
check_endpoint "/mission" "Mission page"
check_endpoint "/contact" "Contact page"

# 4. Check API endpoints
echo ""
echo "API Endpoints:"
check_endpoint "/api/feedback/patterns" "Feedback patterns" 200
check_endpoint "/api/feedback/admin" "Admin feedback" 401  # Should require auth

# 5. Check static assets
echo ""
echo "Static Assets:"
check_endpoint "/_expo/static/js/web/AppEntry-2d6b3eb685bbbba5de362e81010b86d5.js" "Main JS bundle" 200

# 6. Feature smoke tests
echo ""
echo "Feature Tests:"

# Check if feedback learning system is active
echo -n "Checking feedback learning system... "
PATTERNS_RESPONSE=$(curl -s "https://$DOMAIN/api/feedback/patterns" 2>/dev/null)
if echo "$PATTERNS_RESPONSE" | grep -q "success"; then
    echo "✅ PASS"
    ((CHECKS_PASSED++))
else
    echo "❌ FAIL"
    ((CHECKS_FAILED++))
fi

# 7. Performance check
echo ""
echo -n "Page load time test... "
LOAD_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN")
if (( $(echo "$LOAD_TIME < 3" | bc -l) )); then
    echo "✅ PASS (${LOAD_TIME}s)"
    ((CHECKS_PASSED++))
else
    echo "⚠️  SLOW (${LOAD_TIME}s > 3s threshold)"
    ((CHECKS_FAILED++))
fi

# Summary
echo ""
echo "=== Verification Summary ==="
echo "Total checks: $((CHECKS_PASSED + CHECKS_FAILED))"
echo "Passed: $CHECKS_PASSED"
echo "Failed: $CHECKS_FAILED"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo "✅ All checks passed! Deployment verified."
    exit 0
else
    echo ""
    echo "❌ Deployment verification failed. Please investigate."
    exit 1
fi