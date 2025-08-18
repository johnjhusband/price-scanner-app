#!/bin/bash
# Simple, reliable nginx config deployment
set -e  # Exit on any error

DOMAIN="blue.flippi.ai"
TEMPLATE="/var/www/blue.flippi.ai/nginx-templates/blue.flippi.ai.conf"
TARGET="/etc/nginx/sites-available/blue.flippi.ai"

echo "=== Deploying nginx config for $DOMAIN ==="

# 1. Check template exists
if [ ! -f "$TEMPLATE" ]; then
    echo "❌ ERROR: Template not found: $TEMPLATE"
    exit 1
fi

# 2. Show what we're deploying
echo "Deploying from: $TEMPLATE"
echo "Deploying to: $TARGET"

# 3. Check if growth routes are in template
if grep -q "location /growth" "$TEMPLATE"; then
    echo "✅ Template contains growth routes"
else
    echo "❌ ERROR: Template missing growth routes!"
    exit 1
fi

# 4. Deploy the config
echo "Copying configuration..."
sudo cp "$TEMPLATE" "$TARGET"

# 5. Verify it was copied
if grep -q "location /growth" "$TARGET"; then
    echo "✅ Growth routes successfully copied to nginx config"
else
    echo "❌ ERROR: Growth routes NOT in nginx config after copy!"
    exit 1
fi

# 6. Test nginx config
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ ERROR: Invalid nginx configuration!"
    exit 1
fi

# 7. Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx || sudo nginx -s reload

# 8. Final verification
echo ""
echo "=== Final Verification ==="
sleep 2

# Test the actual route
RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -50)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ SUCCESS: /growth/questions is serving backend content!"
elif echo "$RESPONSE" | grep -q "<title>flippi.ai</title>"; then
    echo "❌ FAILED: /growth/questions still serving React app!"
    echo "Nginx may be caching or not properly reloaded"
    exit 1
else
    echo "⚠️  Unknown response from /growth/questions"
fi

echo ""
echo "=== Deployment complete ==="