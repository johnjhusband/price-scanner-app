#!/bin/bash
# Quick fix for JavaScript inheritance error

echo "=== QUICK FIX FOR JS ERROR ==="
echo ""

cd /var/www/blue.flippi.ai

# Option 1: Try copying working build from green
echo "Option 1: Checking if green.flippi.ai has a working build..."
if [ -d "/var/www/green.flippi.ai/mobile-app/dist" ]; then
    echo "Found working build on green, copying..."
    
    # Backup current dist
    mv mobile-app/dist mobile-app/dist.backup.$(date +%s) 2>/dev/null || true
    
    # Copy working dist
    cp -r /var/www/green.flippi.ai/mobile-app/dist mobile-app/
    
    echo "✅ Copied working build from green"
    echo "Testing..."
    curl -s -o /dev/null -w "Frontend status: HTTP %{http_code}\n" https://blue.flippi.ai
else
    echo "No working build found on green"
fi

echo ""
echo "Option 2: Using fallback App.js if needed..."
if [ -f "mobile-app/App.fallback.js" ]; then
    echo "Fallback App.js available"
    echo "To use it: cp mobile-app/App.fallback.js mobile-app/App.js"
fi

echo ""
echo "Option 3: Clean rebuild with the script..."
echo "Run: bash scripts/rebuild-frontend-clean.sh"

echo ""
echo "=== Quick diagnostics ==="

# Check current bundle
MAIN_JS=$(find mobile-app/dist/_expo/static/js/web -name "AppEntry-*.js" 2>/dev/null | head -1)
if [ -f "$MAIN_JS" ]; then
    SIZE=$(stat -f%z "$MAIN_JS" 2>/dev/null || stat -c%s "$MAIN_JS" 2>/dev/null)
    echo "Current bundle size: $((SIZE/1024))KB"
    
    # Check for common issues
    if grep -q "class.*extends.*undefined" "$MAIN_JS" 2>/dev/null; then
        echo "⚠️  Found class extending undefined - build issue detected"
    fi
    
    if grep -q "Super expression must" "$MAIN_JS" 2>/dev/null; then
        echo "⚠️  Bundle contains error text - already failing"
    fi
else
    echo "No JavaScript bundle found"
fi

echo ""
echo "=== END ==="