#!/bin/bash
# Smoke tests for nginx configuration
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 blue.flippi.ai"
    exit 1
fi

DOMAIN=$1
FAILED=0

echo "=== Running smoke tests for $DOMAIN ==="

# Test health endpoint
echo -n "Testing /health endpoint... "
if curl -f -s "https://$DOMAIN/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    FAILED=1
fi

# Test API endpoint
echo -n "Testing /api/public/valuations endpoint... "
if curl -f -s "https://$DOMAIN/api/public/valuations" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    FAILED=1
fi

# Test growth/questions endpoint
echo -n "Testing /growth/questions endpoint... "
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://$DOMAIN/growth/questions")
if [[ "$HTTP_CODE" =~ ^(200|302)$ ]]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    FAILED=1
fi

# Test legal pages
for PAGE in terms privacy mission contact; do
    echo -n "Testing /$PAGE endpoint... "
    HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://$DOMAIN/$PAGE")
    if [[ "$HTTP_CODE" == "200" ]]; then
        echo "✅ OK"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
        FAILED=1
    fi
done

# Test OAuth endpoint
echo -n "Testing /auth/github endpoint... "
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://$DOMAIN/auth/github")
if [[ "$HTTP_CODE" =~ ^(302|303)$ ]]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed!"
    exit 1
fi