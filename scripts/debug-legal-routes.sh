#!/bin/bash
# Debug script to understand why legal pages aren't working

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Legal Pages Debug for $DOMAIN ==="
echo ""

# Test backend directly
echo "1. Testing backend directly on localhost:$PORT"
echo -n "   /terms: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms
echo ""
echo -n "   /privacy: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/privacy
echo ""

# Test via nginx
echo ""
echo "2. Testing via nginx (public URL)"
echo -n "   /terms: "
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms
echo ""
echo -n "   /privacy: "
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy
echo ""

# Check nginx config
echo ""
echo "3. Checking nginx configuration"
echo "   Looking for legal page routes in nginx config:"
grep -n "location = /terms" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "   No /terms route found in nginx!"
grep -n "location = /privacy" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "   No /privacy route found in nginx!"

# Check if catch-all route comes before legal routes
echo ""
echo "4. Checking route order (catch-all vs specific routes):"
grep -n "location /" /etc/nginx/sites-available/$DOMAIN | head -5

echo ""
echo "5. Files exist check:"
ls -la /var/www/$DOMAIN/mobile-app/terms.html 2>/dev/null || echo "   terms.html NOT FOUND"
ls -la /var/www/$DOMAIN/mobile-app/privacy.html 2>/dev/null || echo "   privacy.html NOT FOUND"

echo ""
echo "=== Debug Complete ==="