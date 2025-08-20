#!/bin/bash
# Test script to verify growth routes are properly configured in nginx
# This prevents the regression where growth routes fall through to React app

echo "=== Testing Growth Routes Configuration ==="

# Function to test a domain
test_growth_routes() {
    local DOMAIN=$1
    local EXPECTED_CONTENT=$2
    
    echo ""
    echo "Testing $DOMAIN..."
    
    # Test /growth/questions endpoint
    RESPONSE=$(curl -s -L https://$DOMAIN/growth/questions 2>/dev/null)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions 2>/dev/null)
    
    echo "  HTTP Status: $HTTP_CODE"
    
    # Check if response contains expected backend content
    if echo "$RESPONSE" | grep -q "$EXPECTED_CONTENT"; then
        echo "  ✅ Growth routes properly configured - backend content found"
        return 0
    else
        # Check if we got React app instead
        if echo "$RESPONSE" | grep -q "Loading flippi.ai"; then
            echo "  ❌ FAIL: Growth routes falling through to React app"
            echo "  This means nginx is missing the /growth location block"
            return 1
        else
            echo "  ⚠️  Unknown response - might be an error"
            return 1
        fi
    fi
}

# Test all environments
FAILED=0

# Test blue (development)
if ! test_growth_routes "blue.flippi.ai" "Questions Found"; then
    FAILED=1
fi

# Test green (staging) 
if ! test_growth_routes "green.flippi.ai" "Questions Found"; then
    FAILED=1
fi

# Test app (production)
if ! test_growth_routes "app.flippi.ai" "Questions Found"; then
    FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo "✅ All growth routes tests passed!"
    exit 0
else
    echo "❌ Some growth routes tests failed!"
    echo "Run 'bash scripts/ensure-growth-routes.sh' on the affected servers"
    exit 1
fi