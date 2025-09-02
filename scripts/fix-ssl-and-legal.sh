#!/bin/bash
# Fix SSL configuration and legal pages

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Fixing SSL and Legal Pages for $DOMAIN ==="

# Check if SSL options file exists
if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
    echo "SSL options file missing! Creating it..."
    
    # Create the missing SSL options file
    sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null << 'EOF'
# This file contains important security parameters. Do not modify it.

ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
    echo "✓ SSL options file created"
fi

# Check if dhparams file exists (can be in different locations)
DH_PARAM_LOCATIONS=(
    "/etc/letsencrypt/ssl-dhparams.pem"
    "/etc/ssl/certs/dhparam.pem"
)

DH_EXISTS=0
for DH_FILE in "${DH_PARAM_LOCATIONS[@]}"; do
    if [ -f "$DH_FILE" ]; then
        echo "✓ Found DH params at: $DH_FILE"
        DH_EXISTS=1
        break
    fi
done

if [ "$DH_EXISTS" -eq 0 ]; then
    echo "DH params file missing! Creating it..."
    sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
    echo "✓ DH params file created"
fi

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx configuration is valid!"
    
    # Reload nginx to apply the config
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
    
    # Test if legal pages work now
    echo ""
    echo "Testing legal pages..."
    sleep 1
    
    echo -n "Backend /terms: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms
    echo ""
    
    echo -n "Public /terms: "
    curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms
    echo ""
    
    echo -n "Public /privacy: "
    curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy
    echo ""
    
    # Check if we're getting the actual legal page
    if curl -s https://$DOMAIN/terms | grep -q "Terms"; then
        echo "✅ SUCCESS! Legal pages are working!"
    else
        echo "⚠️  Still serving React app. Checking active config..."
        sudo nginx -T 2>/dev/null | grep -A 2 "location = /terms" | head -10
    fi
else
    echo "❌ Nginx configuration still has errors:"
    sudo nginx -t
fi

echo ""
echo "=== SSL and Legal Pages Fix Complete ==="