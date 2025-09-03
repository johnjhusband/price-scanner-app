#!/bin/bash

# Fix missing SSL files on blue.flippi.ai ONLY
# This creates the missing files that prevent nginx from loading the config

set -e

echo "=== SSL Files Fix for blue.flippi.ai ONLY ==="
echo "This will create missing SSL configuration files"
echo

# Safety check - ensure we're on blue.flippi.ai
CURRENT_DIR=$(pwd)
HOSTNAME=$(hostname)

if [[ ! "$CURRENT_DIR" =~ "blue.flippi.ai" ]] && [[ "$HOSTNAME" != *"blue"* ]]; then
    echo "⚠️  WARNING: This script should only run on blue.flippi.ai server"
    echo "Current directory: $CURRENT_DIR"
    echo "Hostname: $HOSTNAME"
    read -p "Are you SURE you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo "1. Checking current nginx status..."
if sudo nginx -t 2>&1 | grep -q "No such file or directory"; then
    echo "   ❌ Nginx config has errors (expected - missing SSL files)"
else
    echo "   ✅ Nginx config is valid (files may already exist)"
fi

echo
echo "2. Checking for missing SSL files..."

# Check SSL options file
if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
    echo "   ❌ Missing: /etc/letsencrypt/options-ssl-nginx.conf"
    echo "   Creating SSL options file..."
    
    # Create directory if it doesn't exist
    sudo mkdir -p /etc/letsencrypt
    
    # Create the SSL options file with standard Let's Encrypt settings
    sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null << 'EOF'
# This file contains important security parameters for SSL

ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
    echo "   ✅ Created SSL options file"
else
    echo "   ✅ SSL options file already exists"
fi

# Check DH params file
if [ ! -f "/etc/letsencrypt/ssl-dhparams.pem" ]; then
    echo "   ❌ Missing: /etc/letsencrypt/ssl-dhparams.pem"
    echo "   Creating DH params file (this may take a minute)..."
    
    # Generate DH params
    sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
    echo "   ✅ Created DH params file"
else
    echo "   ✅ DH params file already exists"
fi

echo
echo "3. Testing nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Nginx configuration is now valid!"
    
    echo
    echo "4. Checking if legal pages routes are in nginx config..."
    if sudo nginx -T 2>/dev/null | grep -q "location = /terms"; then
        echo "   ✅ Legal pages routes are loaded in nginx"
    else
        echo "   ❌ Legal pages routes NOT found in nginx config"
        echo "   This suggests nginx is still not loading the site config"
    fi
    
    echo
    echo "5. Reloading nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded successfully"
    
    echo
    echo "6. Testing legal pages..."
    for page in terms privacy contact mission; do
        echo -n "   Testing /$page: "
        response=$(curl -s -I https://blue.flippi.ai/$page | head -1)
        echo "$response"
    done
    
    echo
    echo "✅ SSL files fix complete!"
    echo
    echo "To verify the fix worked:"
    echo "1. Visit https://blue.flippi.ai/terms"
    echo "2. You should see the Terms HTML page, NOT the React app"
    
else
    echo "   ❌ Nginx configuration still has errors!"
    echo "   Running nginx -t for details:"
    sudo nginx -t
    exit 1
fi

echo
echo "=== Fix Complete ==="
echo "Note: This fix ONLY affects blue.flippi.ai"
echo "Green and production environments remain untouched."# Trigger deployment with SSL fix
