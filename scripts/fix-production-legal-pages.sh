#!/bin/bash
# Fix legal pages (terms and privacy) for production

echo "=== Fixing Production Legal Pages ==="

# Check if nginx config has legal pages
if ! grep -q "location = /privacy" /etc/nginx/sites-available/app.flippi.ai; then
    echo "Legal pages not configured in nginx. Adding them..."
    
    # Create backup
    cp /etc/nginx/sites-available/app.flippi.ai /tmp/app-nginx-backup-legal-$(date +%s).conf
    
    # Add legal pages configuration before the catch-all location
    sed -i '/location \/ {/i\
    # Legal pages - must be defined before catch-all\
    location = /privacy {\
        alias /var/www/app.flippi.ai/mobile-app/privacy.html;\
    }\
\
    location = /terms {\
        alias /var/www/app.flippi.ai/mobile-app/terms.html;\
    }\
' /etc/nginx/sites-available/app.flippi.ai
    
    echo "Testing nginx configuration..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Config valid! Reloading nginx..."
        systemctl reload nginx
        echo "Legal pages fixed!"
    else
        echo "❌ Nginx test failed, restoring backup..."
        cp /tmp/app-nginx-backup-legal-*.conf /etc/nginx/sites-available/app.flippi.ai
        nginx -t
    fi
else
    echo "Legal pages already configured in nginx"
fi

# Verify files exist
echo ""
echo "Checking if legal page files exist..."
if [ -f /var/www/app.flippi.ai/mobile-app/privacy.html ]; then
    echo "✅ privacy.html exists"
else
    echo "❌ privacy.html missing!"
fi

if [ -f /var/www/app.flippi.ai/mobile-app/terms.html ]; then
    echo "✅ terms.html exists"
else
    echo "❌ terms.html missing!"
fi

# Test the endpoints
echo ""
echo "Testing endpoints..."
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.flippi.ai/privacy)
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.flippi.ai/terms)

echo "Privacy page returns: $PRIVACY_STATUS"
echo "Terms page returns: $TERMS_STATUS"

if [ "$PRIVACY_STATUS" = "200" ] && [ "$TERMS_STATUS" = "200" ]; then
    echo "✅ Legal pages are working!"
else
    echo "⚠️ Legal pages may need additional configuration"
fi