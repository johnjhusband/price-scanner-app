#!/bin/bash
# Simplified nginx fix that uses staging's proven approach

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