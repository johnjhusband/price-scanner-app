#!/bin/bash
# Check if frontend is intercepting legal page routes

DOMAIN=$(basename $(pwd))

echo "=== Checking Frontend Routing for $DOMAIN ==="
echo ""

# Check the built frontend files
echo "1. Checking if frontend build contains routing code:"
if [ -d "/var/www/$DOMAIN/mobile-app/dist" ]; then
    echo "Searching for 'terms' or 'privacy' in built files..."
    grep -r "terms\|privacy" /var/www/$DOMAIN/mobile-app/dist/*.js 2>/dev/null | grep -v ".map" | head -5 || echo "No references found"
else
    echo "Frontend dist directory not found!"
fi
echo ""

# Check index.html for any routing setup
echo "2. Checking index.html for routing configuration:"
if [ -f "/var/www/$DOMAIN/mobile-app/dist/index.html" ]; then
    grep -E "router|Router|route|history" /var/www/$DOMAIN/mobile-app/dist/index.html || echo "No router references in index.html"
else
    echo "index.html not found!"
fi
echo ""

# Check if there's a base href that might affect routing
echo "3. Checking for base href in index.html:"
grep -i "base.*href" /var/www/$DOMAIN/mobile-app/dist/index.html 2>/dev/null || echo "No base href found"
echo ""

# Test if JavaScript is required for the page
echo "4. Testing if /terms works without JavaScript:"
echo "Fetching /terms with curl (no JS execution):"
curl -s https://$DOMAIN/terms | grep -E "<title>|<h1>|Terms" | head -5
echo ""

# Check for any .htaccess or web.config that might affect routing
echo "5. Checking for routing config files:"
ls -la /var/www/$DOMAIN/mobile-app/dist/.htaccess 2>/dev/null || echo "No .htaccess found"
ls -la /var/www/$DOMAIN/mobile-app/dist/web.config 2>/dev/null || echo "No web.config found"
echo ""

# Check nginx try_files directive
echo "6. Current nginx try_files configuration:"
grep -A 2 -B 2 "try_files" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "No try_files directive found"
echo ""

echo "=== Analysis ==="
echo ""
echo "If you see 'try_files \$uri \$uri/ /index.html', this means:"
echo "- ALL routes that don't exist as files go to index.html"
echo "- The React app then handles routing client-side"
echo "- This is why /terms shows the React app instead of proxying to backend"
echo ""
echo "The fix requires ensuring nginx location blocks for /terms come BEFORE"
echo "the catch-all location / block, and they must be in the active config."