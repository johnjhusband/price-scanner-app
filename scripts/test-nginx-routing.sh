#!/bin/bash
# Test different nginx routing scenarios

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Testing Nginx Routing for $DOMAIN ==="
echo ""

# Create a test file in dist
echo "<h1>TEST FILE IN DIST</h1>" > /var/www/$DOMAIN/mobile-app/dist/test-nginx.html

echo "1. Testing static file that exists in dist:"
curl -s https://$DOMAIN/test-nginx.html | grep -o "TEST FILE IN DIST" || echo "Not serving static file!"
echo ""

echo "2. Testing /terms (should proxy to backend):"
curl -s https://$DOMAIN/terms | head -5
echo ""

echo "3. Testing backend directly:"
curl -s http://localhost:$PORT/terms | head -5
echo ""

echo "4. Testing non-existent route (should show React app):"
curl -s https://$DOMAIN/nonexistent | grep -o "id=\"root\"" || echo "Not showing React app for non-existent route"
echo ""

echo "5. Current nginx location blocks in order:"
sudo nginx -T 2>/dev/null | grep -A 2 "server_name $DOMAIN" | grep -A 50 "server {" | grep "location" | head -20
echo ""

# Clean up
rm -f /var/www/$DOMAIN/mobile-app/dist/test-nginx.html

echo "=== Key Insights ==="
echo "- If test-nginx.html works, nginx serves static files correctly"
echo "- If /terms shows React app, the location block isn't working"
echo "- If backend shows correct content, the issue is nginx routing"