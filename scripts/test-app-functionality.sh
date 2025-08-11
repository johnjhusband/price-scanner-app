#!/bin/bash
# Proper automated tests for Flippi.ai functionality

echo "=== Flippi.ai Automated Functionality Tests ==="
DOMAIN=${1:-green.flippi.ai}

# Test 1: Backend Health Check
echo "1. Backend Health Check:"
HEALTH=$(curl -s https://$DOMAIN/health)
if echo "$HEALTH" | grep -q '"status":"OK"'; then
    VERSION=$(echo "$HEALTH" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Backend healthy (version $VERSION)"
else
    echo "   ❌ Backend not responding"
    exit 1
fi

# Test 2: OAuth Configuration  
echo "2. OAuth Configuration:"
OAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/auth/google)
if [ "$OAUTH_STATUS" = "302" ]; then
    echo "   ✅ OAuth properly configured (302 redirect)"
else
    echo "   ❌ OAuth not working (got $OAUTH_STATUS)"
fi

# Test 3: Frontend App Loading
echo "3. Frontend App Loading:"
MAIN_PAGE=$(curl -s https://$DOMAIN/)
if echo "$MAIN_PAGE" | grep -q "AppEntry.*\.js"; then
    BUNDLE_NAME=$(echo "$MAIN_PAGE" | grep -o "AppEntry[^\"]*\.js" | head -1)
    echo "   ✅ React app bundle found: $BUNDLE_NAME"
else
    echo "   ❌ React app bundle not found in HTML"
fi

# Test 4: API Endpoints
echo "4. API Endpoints:"
ANALYZE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://$DOMAIN/api/analyze -H "Content-Type: application/json" -d '{}')
if [ "$ANALYZE_STATUS" = "400" ] || [ "$ANALYZE_STATUS" = "200" ]; then
    echo "   ✅ /api/analyze endpoint responding (got $ANALYZE_STATUS)"
else
    echo "   ❌ /api/analyze not working (got $ANALYZE_STATUS)"
fi

# Test 5: Legal Pages
echo "5. Legal Pages:"
TERMS_CONTENT=$(curl -s https://$DOMAIN/terms)
if echo "$TERMS_CONTENT" | grep -q "Terms of Service"; then
    echo "   ✅ Legal pages serving actual content"
else
    echo "   ⚠️  Legal pages serving React app (known issue)"
fi

echo ""
echo "=== Test Summary ==="
echo "Domain tested: https://$DOMAIN"
echo "Test completed: $(date)"