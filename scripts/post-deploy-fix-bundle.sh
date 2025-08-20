#!/bin/bash
# Post-deployment fix for JavaScript bundle errors
# This runs automatically after deployment to fix bundle issues

echo "=== Post-Deploy Bundle Fix ==="

# Check if the bundle has errors
BUNDLE=$(find /var/www/blue.flippi.ai/mobile-app/dist/_expo/static/js/web -name "AppEntry-*.js" 2>/dev/null | head -1)

if [ -f "$BUNDLE" ]; then
    # Check for the specific error
    if grep -q "Super expression must either be null or a function" "$BUNDLE" 2>/dev/null; then
        echo "❌ Bundle contains JavaScript error, attempting fix..."
        
        # Option 1: Copy from green if available
        if [ -d "/var/www/green.flippi.ai/mobile-app/dist/_expo" ]; then
            echo "Copying working build from green.flippi.ai..."
            rm -rf /var/www/blue.flippi.ai/mobile-app/dist
            cp -r /var/www/green.flippi.ai/mobile-app/dist /var/www/blue.flippi.ai/mobile-app/
            echo "✅ Copied working build from green"
        else
            # Option 2: Rebuild with clean dependencies
            echo "Rebuilding with clean dependencies..."
            cd /var/www/blue.flippi.ai/mobile-app
            rm -rf node_modules package-lock.json .expo dist
            npm install
            npx expo export --platform web --output-dir dist
            echo "✅ Clean rebuild complete"
        fi
        
        # Restart frontend
        pm2 restart dev-frontend
    else
        echo "✅ Bundle appears clean"
    fi
else
    echo "⚠️  No bundle found, may need rebuild"
fi

echo "=== Bundle fix complete ==="