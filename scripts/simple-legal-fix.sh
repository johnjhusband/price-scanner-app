#!/bin/bash
# Simple approach to check and report legal pages status

CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
else
    echo "Not on blue.flippi.ai"
    exit 0
fi

echo "=== Legal Pages Status Check ==="
echo ""

# Check if backend is serving pages
echo "1. Backend endpoints:"
for page in terms privacy mission contact; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/$page)
    echo "   http://localhost:$PORT/$page: $STATUS"
done

echo ""
echo "2. Checking nginx config for legal routes..."
if grep -q "location = /terms" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
    echo "   ✓ Legal page routes found in nginx config"
else
    echo "   ✗ Legal page routes NOT found in nginx config"
    echo ""
    echo "   The nginx config needs these location blocks added INSIDE the 'server {' block"
    echo "   but BEFORE any 'location /' block:"
    echo ""
    echo "   location = /terms { proxy_pass http://localhost:$PORT; ... }"
    echo "   location = /privacy { proxy_pass http://localhost:$PORT; ... }"
    echo "   location = /mission { proxy_pass http://localhost:$PORT; ... }"
    echo "   location = /contact { proxy_pass http://localhost:$PORT; ... }"
fi

echo ""
echo "3. Public access test:"
for page in terms privacy; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/$page)
    echo "   https://$DOMAIN/$page: $STATUS"
done