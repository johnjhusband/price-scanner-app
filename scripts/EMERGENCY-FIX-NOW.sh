#!/bin/bash
# EMERGENCY FIX - Get app working immediately

echo "=== EMERGENCY FIX FOR BLUE.FLIPPI.AI ==="
echo ""

# This script will run on the server to fix the JavaScript error immediately

cat > /tmp/emergency-fix.sh << 'SCRIPT'
#!/bin/bash
cd /var/www/blue.flippi.ai

echo "1. Checking if green.flippi.ai has working files..."
if [ -d "/var/www/green.flippi.ai/mobile-app/dist/_expo" ]; then
    echo "✅ Found working build on green"
    
    # Copy the entire working dist from green
    echo "2. Copying working frontend..."
    rm -rf mobile-app/dist.broken
    mv mobile-app/dist mobile-app/dist.broken 2>/dev/null || true
    cp -r /var/www/green.flippi.ai/mobile-app/dist mobile-app/
    
    echo "✅ Frontend copied from green"
else
    echo "❌ No working build on green, trying production..."
    
    if [ -d "/var/www/app.flippi.ai/mobile-app/dist/_expo" ]; then
        echo "✅ Found working build on production"
        rm -rf mobile-app/dist.broken
        mv mobile-app/dist mobile-app/dist.broken 2>/dev/null || true
        cp -r /var/www/app.flippi.ai/mobile-app/dist mobile-app/
        echo "✅ Frontend copied from production"
    else
        echo "❌ No working builds found, need to rebuild"
        
        # Use the fallback App.js
        if [ -f "mobile-app/App.fallback.js" ]; then
            echo "3. Using fallback App.js..."
            cp mobile-app/App.js mobile-app/App.original.js
            cp mobile-app/App.fallback.js mobile-app/App.js
        fi
        
        # Clean rebuild
        echo "4. Clean rebuild..."
        cd mobile-app
        rm -rf dist node_modules/.cache .expo
        npm install
        npx expo export --platform web --output-dir dist
        cd ..
    fi
fi

# Verify the fix
echo ""
echo "5. Verifying fix..."
if [ -f "mobile-app/dist/_expo/static/js/web/AppEntry-"*.js ]; then
    BUNDLE=$(ls mobile-app/dist/_expo/static/js/web/AppEntry-*.js | head -1)
    SIZE=$(stat -c%s "$BUNDLE" 2>/dev/null || stat -f%z "$BUNDLE" 2>/dev/null)
    echo "✅ Bundle size: $((SIZE/1024))KB"
    
    # Quick check for the error
    if grep -q "Super expression must" "$BUNDLE"; then
        echo "⚠️  Bundle still contains error - trying alternative fix"
        
        # Last resort - minimal working HTML
        cat > mobile-app/dist/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Flippi.ai - Maintenance</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 20px;
        }
        h1 { color: #1a3a52; }
        p { color: #666; }
        a {
            color: #0099ff;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Flippi.ai</h1>
        <p>We're performing maintenance. Please try again in a few minutes.</p>
        <p>For immediate access, visit <a href="https://green.flippi.ai">green.flippi.ai</a></p>
    </div>
</body>
</html>
HTML
    else
        echo "✅ Bundle appears clean"
    fi
fi

# Restart PM2
echo ""
echo "6. Restarting services..."
pm2 restart dev-backend dev-frontend

echo ""
echo "=== EMERGENCY FIX COMPLETE ==="
echo "Check: https://blue.flippi.ai"
SCRIPT

echo ""
echo "Emergency fix script created at: /tmp/emergency-fix.sh"
echo ""
echo "To run on server:"
echo "  ssh user@server 'bash -s' < /tmp/emergency-fix.sh"
echo ""
echo "Or manually:"
echo "  1. Copy /tmp/emergency-fix.sh to server"
echo "  2. Run: bash emergency-fix.sh"