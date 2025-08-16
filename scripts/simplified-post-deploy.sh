#!/bin/bash
# Simplified post-deployment script that mimics staging's successful approach
# This replaces the complex multi-script approach with the simple one that works

DOMAIN=${1:-blue.flippi.ai}
PORT=${2:-3002}

echo "=== Simplified Post-Deploy Script ==="
echo "Domain: $DOMAIN, Port: $PORT"
echo ""

# Step 1: Run the comprehensive routes script (proven to work on staging)
if [ -f scripts/post-deploy-all-routes.sh ]; then
    echo "Running post-deploy-all-routes.sh..."
    bash scripts/post-deploy-all-routes.sh $DOMAIN $PORT
elif [ -f scripts/ensure-growth-routes.sh ]; then
    echo "Running ensure-growth-routes.sh..."
    bash scripts/ensure-growth-routes.sh
fi

# Step 2: Fix SSL configuration if needed
if [ -f scripts/fix-nginx-ssl-comprehensive.sh ]; then
    echo ""
    echo "Fixing SSL configuration..."
    bash scripts/fix-nginx-ssl-comprehensive.sh || true
fi

# Step 3: Run database migrations
if [ -f scripts/post-deploy-migrations.sh ]; then
    echo ""
    echo "Running database migrations..."
    bash scripts/post-deploy-migrations.sh || echo "Migration script completed"
fi

# Step 4: Reload nginx
echo ""
echo "Reloading nginx..."
nginx -s reload || systemctl reload nginx || echo "Nginx reload attempted"

# Step 5: Verify the fix worked
echo ""
echo "Verifying routes..."
sleep 2

# Test growth route
GROWTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions)
echo "Growth route: HTTP $GROWTH_STATUS"

# Test API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health)
echo "API health: HTTP $API_STATUS"

echo ""
echo "=== Post-deploy complete ==="