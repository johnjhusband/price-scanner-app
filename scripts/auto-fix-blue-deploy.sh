#!/bin/bash
# Auto-fix script for blue.flippi.ai deployment
# This should be called at the end of the deployment workflow

echo "=== AUTO-FIX BLUE DEPLOYMENT ==="
echo ""

# Check if we're on the blue server
if [ -d "/var/www/blue.flippi.ai" ]; then
    cd /var/www/blue.flippi.ai
    
    # Check if the build has the JavaScript error
    BUNDLE=$(find mobile-app/dist/_expo/static/js/web -name "AppEntry-*.js" 2>/dev/null | head -1)
    
    if [ -f "$BUNDLE" ]; then
        if grep -q "Super expression must either be null or a function" "$BUNDLE" 2>/dev/null; then
            echo "❌ JavaScript bundle error detected!"
            echo "Applying emergency fix..."
            
            # Copy working build from green
            if [ -d "/var/www/green.flippi.ai/mobile-app/dist" ]; then
                echo "Copying working build from green.flippi.ai..."
                rm -rf mobile-app/dist
                cp -r /var/www/green.flippi.ai/mobile-app/dist mobile-app/
                echo "✅ Working build copied"
                
                # Restart PM2
                pm2 restart dev-frontend
                echo "✅ Frontend restarted"
            fi
        else
            echo "✅ JavaScript bundle appears clean"
        fi
    fi
    
    # Run other post-deployment fixes
    if [ -f "scripts/post-deploy-comprehensive.sh" ]; then
        echo "Running comprehensive post-deployment fixes..."
        bash scripts/post-deploy-comprehensive.sh
    fi
else
    echo "Not on blue.flippi.ai server, skipping auto-fix"
fi

echo ""
echo "=== AUTO-FIX COMPLETE ==="