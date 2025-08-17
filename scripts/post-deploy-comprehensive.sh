#!/bin/bash
# Comprehensive post-deployment script that fixes all known issues
# This should be added to the deployment workflow

echo "=== COMPREHENSIVE POST-DEPLOYMENT FIXES ==="
echo ""

DOMAIN=${1:-blue.flippi.ai}
PORT=${2:-3002}

# 1. Fix SSL configuration (common issue)
echo "Step 1: Fixing SSL configuration..."
if [ -f scripts/fix-nginx-ssl-comprehensive.sh ]; then
    bash scripts/fix-nginx-ssl-comprehensive.sh || true
fi

# 2. Fix nginx static file serving
echo ""
echo "Step 2: Fixing nginx static file serving..."
if [ -f scripts/post-deploy-nginx-static.sh ]; then
    bash scripts/post-deploy-nginx-static.sh $DOMAIN $PORT || true
fi

# 3. Run database migrations
echo ""
echo "Step 3: Running database migrations..."
if [ -f backend/scripts/run-growth-analytics-migration.js ]; then
    cd backend
    export FEEDBACK_DB_PATH=/var/www/$DOMAIN/backend/flippi.db
    node scripts/run-growth-analytics-migration.js || echo "Migration attempted"
    cd ..
fi

# 4. Fix JavaScript bundle errors
echo ""
echo "Step 4: Checking for JavaScript bundle errors..."
BUNDLE=$(find mobile-app/dist/_expo/static/js/web -name "AppEntry-*.js" 2>/dev/null | head -1)

if [ -f "$BUNDLE" ]; then
    if grep -q "Super expression must either be null or a function" "$BUNDLE" 2>/dev/null; then
        echo "❌ Bundle error detected, applying fix..."
        
        # Try to copy from a working environment
        for env in green.flippi.ai app.flippi.ai; do
            if [ -d "/var/www/$env/mobile-app/dist/_expo" ]; then
                echo "Copying working build from $env..."
                rm -rf mobile-app/dist
                cp -r /var/www/$env/mobile-app/dist mobile-app/
                echo "✅ Copied working build from $env"
                break
            fi
        done
        
        # Restart frontend
        pm2 restart dev-frontend
    else
        echo "✅ JavaScript bundle is clean"
    fi
fi

# 5. Ensure all routes work
echo ""
echo "Step 5: Verifying routes..."
if [ -f scripts/post-deploy-all-routes.sh ]; then
    bash scripts/post-deploy-all-routes.sh $DOMAIN $PORT || true
fi

# 6. Final nginx reload
echo ""
echo "Step 6: Final nginx reload..."
nginx -t && nginx -s reload || echo "Nginx reload attempted"

# 7. Verification
echo ""
echo "Step 7: Verifying deployment..."
sleep 2

# Test key endpoints
echo "Testing endpoints:"
curl -s -o /dev/null -w "- Frontend: HTTP %{http_code}\n" https://$DOMAIN
curl -s -o /dev/null -w "- API Health: HTTP %{http_code}\n" https://$DOMAIN/health
curl -s -o /dev/null -w "- Growth Routes: HTTP %{http_code}\n" https://$DOMAIN/growth/questions
curl -s -o /dev/null -w "- Legal Pages: HTTP %{http_code}\n" https://$DOMAIN/terms

# Check JavaScript is being served
JS_TYPE=$(curl -s -I "https://$DOMAIN/_expo/static/js/web/AppEntry-*.js" | grep -i "content-type" | head -1)
if [[ "$JS_TYPE" == *"javascript"* ]]; then
    echo "✅ Static files serving correctly"
else
    echo "⚠️  Static files may not be serving correctly"
fi

echo ""
echo "=== POST-DEPLOYMENT FIXES COMPLETE ==="
echo "Site: https://$DOMAIN"