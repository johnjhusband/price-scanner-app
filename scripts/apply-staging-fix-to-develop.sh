#!/bin/bash
# Apply the working staging configuration approach to develop

echo "=== Applying Staging Growth Route Fix to Develop ==="
echo "This script applies the same simple approach that works on green.flippi.ai"
echo ""

# Simple and direct - just like staging
cd /var/www/blue.flippi.ai

# Run the exact same scripts that staging runs
echo "1. Running post-deploy-all-routes.sh (like staging)..."
if [ -f scripts/post-deploy-all-routes.sh ]; then
    bash scripts/post-deploy-all-routes.sh blue.flippi.ai 3002
elif [ -f scripts/add-growth-routes-nginx.sh ]; then
    bash scripts/add-growth-routes-nginx.sh blue.flippi.ai 3002
fi

# Ensure growth routes specifically
echo ""
echo "2. Ensuring growth routes..."
if [ -f scripts/ensure-growth-routes.sh ]; then
    bash scripts/ensure-growth-routes.sh
fi

# Fix SSL if needed
echo ""
echo "3. Fixing SSL configuration..."
if [ -f scripts/fix-nginx-ssl-comprehensive.sh ]; then
    bash scripts/fix-nginx-ssl-comprehensive.sh || true
fi

# Reload nginx
echo ""
echo "4. Reloading nginx..."
nginx -s reload || systemctl reload nginx || echo "Nginx reload attempted"

# Test the result
echo ""
echo "5. Testing growth route..."
sleep 2
RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -20)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ SUCCESS: Growth route is now working!"
else
    echo "❌ Still not working. Checking nginx config..."
    grep -A5 "location /growth" /etc/nginx/sites-available/blue.flippi.ai || echo "Growth location not found"
fi

echo ""
echo "=== Fix complete ==="