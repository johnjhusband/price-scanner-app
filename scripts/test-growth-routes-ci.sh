#!/bin/bash
# CI smoke test for growth routes
# Exit with error if growth routes are not properly configured

DOMAIN=${1:-blue.flippi.ai}

echo "Testing growth routes on $DOMAIN..."

# Test the growth/questions endpoint
RESPONSE=$(curl -fsS https://$DOMAIN/growth/questions 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ FAIL: Could not reach $DOMAIN/growth/questions"
    exit 1
fi

# Check if we got the backend response (not React app)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ PASS: Growth routes properly configured"
    exit 0
elif echo "$RESPONSE" | grep -q "Loading flippi.ai"; then
    echo "❌ FAIL: Growth routes falling through to React app"
    echo "Nginx is missing the /growth location block"
    exit 1
else
    echo "⚠️  WARNING: Unexpected response from growth routes"
    echo "First 200 chars: ${RESPONSE:0:200}"
    exit 1
fi