#!/bin/bash
# Clean rebuild of frontend to fix JavaScript errors

echo "=== CLEAN FRONTEND REBUILD ==="
echo ""

# Navigate to mobile-app directory
cd /var/www/blue.flippi.ai/mobile-app

# 1. Clean previous build
echo "Step 1: Cleaning previous build..."
rm -rf dist/
rm -rf .expo/
rm -rf node_modules/.cache/

# 2. Clear npm cache
echo ""
echo "Step 2: Clearing npm cache..."
npm cache clean --force

# 3. Reinstall dependencies
echo ""
echo "Step 3: Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# 4. Export for web
echo ""
echo "Step 4: Building for web..."
npx expo export --platform web --output-dir dist

# 5. Verify build
echo ""
echo "Step 5: Verifying build..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html created"
    JS_COUNT=$(find dist/_expo -name "*.js" 2>/dev/null | wc -l)
    echo "✅ Found $JS_COUNT JavaScript files"
    
    # Check main bundle size
    MAIN_JS=$(find dist/_expo/static/js/web -name "AppEntry-*.js" | head -1)
    if [ -f "$MAIN_JS" ]; then
        SIZE=$(stat -f%z "$MAIN_JS" 2>/dev/null || stat -c%s "$MAIN_JS" 2>/dev/null)
        echo "✅ Main bundle size: $((SIZE/1024))KB"
    fi
else
    echo "❌ Build failed - no index.html found"
    exit 1
fi

# 6. Restart PM2
echo ""
echo "Step 6: Restarting PM2 processes..."
pm2 restart dev-frontend

echo ""
echo "=== REBUILD COMPLETE ==="
echo "Test at: https://blue.flippi.ai"