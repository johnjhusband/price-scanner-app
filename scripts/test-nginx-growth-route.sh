#!/bin/bash
# Test nginx growth route configuration

echo "=== Testing Growth Route Configuration ==="
echo ""

# Test 1: Backend directly
echo "1. Testing backend directly on port 3002:"
BACKEND_RESPONSE=$(curl -s http://blue.flippi.ai:3002/growth/questions | head -10)
if echo "$BACKEND_RESPONSE" | grep -q "Questions Found"; then
    echo "✅ Backend is serving the correct page"
else
    echo "❌ Backend not responding correctly"
    echo "$BACKEND_RESPONSE"
fi

echo ""
echo "2. Testing through nginx (https):"
NGINX_RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -20)
if echo "$NGINX_RESPONSE" | grep -q "Questions Found"; then
    echo "✅ Nginx is proxying correctly"
else
    echo "❌ Nginx is NOT proxying - returning:"
    echo "$NGINX_RESPONSE" | grep -E "(title|root)" | head -5
fi

echo ""
echo "3. Testing response headers:"
curl -sI https://blue.flippi.ai/growth/questions | grep -E "(HTTP|Content-Type|Server)" | head -5

echo ""
echo "4. Testing other backend routes through nginx:"
echo -n "  /api/health: "
curl -s https://blue.flippi.ai/api/health | head -20

echo ""
echo -n "  /terms: "
if curl -s https://blue.flippi.ai/terms | grep -q "Terms of Service"; then
    echo "✅ Working"
else
    echo "❌ Not working"
fi

echo ""
echo "=== Summary ==="
if echo "$NGINX_RESPONSE" | grep -q "Questions Found"; then
    echo "✅ Growth routes are working correctly!"
else
    echo "❌ Growth routes are NOT being proxied by nginx"
    echo "   The backend is working but nginx is serving the React app instead"
fi