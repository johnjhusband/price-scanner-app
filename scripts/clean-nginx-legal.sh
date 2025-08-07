#!/bin/bash
# Clean up nginx config and add legal pages correctly

CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
else
    echo "Unknown environment"
    exit 1
fi

CONFIG="/etc/nginx/sites-available/$DOMAIN"

echo "=== Cleaning and fixing nginx config for $DOMAIN ==="

# First, let's see what's at line 61
echo "Checking line 61 of nginx config..."
sed -n '58,65p' $CONFIG 2>/dev/null || echo "Cannot read nginx config"

# Test backend
echo ""
echo "Testing backend legal pages..."
curl -s -o /dev/null -w "Backend /terms: %{http_code}\n" http://localhost:$PORT/terms
curl -s -o /dev/null -w "Backend /privacy: %{http_code}\n" http://localhost:$PORT/privacy

echo ""
echo "Current nginx test result:"
sudo nginx -t 2>&1 || true

echo ""
echo "IMPORTANT: The nginx config has an error at line 61."
echo "This needs to be fixed manually by:"
echo "1. sudo nano /etc/nginx/sites-available/$DOMAIN"
echo "2. Go to line 61 and check for misplaced location directives"
echo "3. Legal page routes should be INSIDE the 'server {' block"
echo "4. Save and test with: sudo nginx -t"
echo "5. If test passes: sudo systemctl reload nginx"