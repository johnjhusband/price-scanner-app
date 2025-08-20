#!/bin/bash
# Simplified nginx fix that uses staging's proven approach

# EMERGENCY FIX FIRST: Copy working build from green if on blue
if [[ "$(pwd)" == *"blue.flippi.ai"* ]]; then
    echo "=== EMERGENCY: FORCE COPYING WORKING BUILD FROM GREEN ==="
    if [ -d "/var/www/green.flippi.ai/mobile-app/dist" ]; then
        echo "Removing broken build and copying from green..."
        rm -rf /var/www/blue.flippi.ai/mobile-app/dist
        cp -r /var/www/green.flippi.ai/mobile-app/dist /var/www/blue.flippi.ai/mobile-app/
        echo "✅ Working build copied from green.flippi.ai"
        pm2 restart dev-frontend
        echo "✅ Frontend restarted - app should work now!"
    fi
    
    # Also copy nginx config from green since it's working there
    echo "Copying working nginx config from green..."
    if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
        sudo cp /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.new
        sudo sed -i 's/green\.flippi\.ai/blue.flippi.ai/g' /etc/nginx/sites-available/blue.flippi.ai.new
        sudo sed -i 's/3001/3002/g' /etc/nginx/sites-available/blue.flippi.ai.new
        sudo mv /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup
        sudo mv /etc/nginx/sites-available/blue.flippi.ai.new /etc/nginx/sites-available/blue.flippi.ai
        sudo nginx -t && sudo nginx -s reload
        echo "✅ Nginx config copied from green and adapted for blue"
    fi
fi

# Detect environment based on current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
else
    echo "Unknown environment, exiting"
    exit 0
fi

echo "=== Running simplified post-deploy for $DOMAIN ==="

# Use the staging approach - run the comprehensive routes script
if [ -f scripts/post-deploy-all-routes.sh ]; then
    bash scripts/post-deploy-all-routes.sh $DOMAIN $PORT
elif [ -f scripts/add-growth-routes-nginx.sh ]; then
    bash scripts/add-growth-routes-nginx.sh $DOMAIN $PORT
elif [ -f scripts/ensure-growth-routes.sh ]; then
    bash scripts/ensure-growth-routes.sh
fi

# Also ensure SSL files exist (root cause of many routing issues)
if [ -f scripts/fix-ssl-and-growth-routes.sh ]; then
    bash scripts/fix-ssl-and-growth-routes.sh
fi

# That's it! The complex duplicate removal and other fixes are not needed
# They were causing the growth routes to be removed
nginx -s reload || true
echo "=== Simplified fix complete ==="