#!/bin/bash
# Comprehensive fix for nginx SSL configuration issues
# This script creates all missing SSL files needed for nginx to load

set -e

DOMAIN=$(basename $(pwd))

echo "=== Comprehensive Nginx SSL Fix for $DOMAIN ==="
echo ""

# Step 1: Show current nginx test results
echo "Step 1: Current nginx configuration test:"
sudo nginx -t 2>&1 || true
echo ""

# Step 2: Create missing SSL options file if needed
if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
    echo "Step 2: Creating missing /etc/letsencrypt/options-ssl-nginx.conf"
    
    # Create with Let's Encrypt recommended settings
    sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null << 'EOF'
# This file contains important security parameters. Do not modify this file
# manually. Updates to this file will be lost when the certbot
# Let's Encrypt client is updated.
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
    echo "✓ Created SSL options file"
else
    echo "Step 2: SSL options file already exists"
fi
echo ""

# Step 3: Create DH params if missing
DH_LOCATIONS=(
    "/etc/letsencrypt/ssl-dhparams.pem"
    "/etc/ssl/certs/dhparam.pem"
)

echo "Step 3: Checking DH params..."
DH_EXISTS=0
for DH_FILE in "${DH_LOCATIONS[@]}"; do
    if [ -f "$DH_FILE" ]; then
        echo "✓ Found DH params at: $DH_FILE"
        DH_EXISTS=1
        break
    fi
done

if [ "$DH_EXISTS" -eq 0 ]; then
    echo "Creating DH params (this may take a moment)..."
    sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
    echo "✓ Created DH params at /etc/letsencrypt/ssl-dhparams.pem"
fi
echo ""

# Step 4: Test nginx configuration again
echo "Step 4: Testing nginx configuration after fixes:"
if sudo nginx -t; then
    echo "✅ Nginx configuration is now valid!"
    echo ""
    
    # Step 5: Reload nginx
    echo "Step 5: Reloading nginx..."
    sudo nginx -s reload
    echo "✅ Nginx reloaded successfully!"
    echo ""
    
    # Step 6: Verify legal pages are working
    echo "Step 6: Verifying legal pages..."
    sleep 2
    
    # Test backend
    PORT=3002
    if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
    if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi
    
    echo -n "Backend /terms: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms || echo "Failed"
    echo ""
    
    echo -n "Public /terms: "
    PUBLIC_TERMS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms)
    echo "$PUBLIC_TERMS"
    
    echo -n "Public /privacy: "
    PUBLIC_PRIVACY=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy)
    echo "$PUBLIC_PRIVACY"
    echo ""
    
    # Check content
    if curl -s https://$DOMAIN/terms | grep -q "Terms of Service"; then
        echo "✅ SUCCESS! Legal pages are now working!"
    elif curl -s https://$DOMAIN/terms | grep -q "id=\"root\""; then
        echo "⚠️  Still showing React app. Checking active nginx config..."
        echo ""
        echo "Active config for /terms:"
        sudo nginx -T 2>/dev/null | grep -A 10 "location = /terms" | head -15
    else
        echo "⚠️  Unexpected response from /terms"
    fi
else
    echo "❌ Nginx configuration still has errors:"
    sudo nginx -t 2>&1
    echo ""
    echo "Manual intervention may be required."
fi

echo ""
echo "=== Comprehensive SSL Fix Complete ==="