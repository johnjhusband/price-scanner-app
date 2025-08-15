#!/bin/bash
# Fix SSL files and growth routes - addresses the root cause of route issues

echo "=== Fixing SSL Files and Growth Routes ==="
echo "This addresses the root cause: missing SSL files make nginx ignore our config"
echo ""

# Step 1: Ensure SSL files exist (from CLAUDE.md)
echo "1. Ensuring SSL configuration files exist..."

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    echo "Creating /etc/letsencrypt/options-ssl-nginx.conf..."
    mkdir -p /etc/letsencrypt
    cat > /etc/letsencrypt/options-ssl-nginx.conf << 'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
    echo "✅ Created SSL options file"
else
    echo "✅ SSL options file already exists"
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    echo "Creating /etc/letsencrypt/ssl-dhparams.pem..."
    cat > /etc/letsencrypt/ssl-dhparams.pem << 'EOF'
-----BEGIN DH PARAMETERS-----
MIIBCAKCAQEA//////////+t+FRYortKmq/cViAnPTzx2LnFg84tNpWp4TZBFGQz
+8yTnc4kmz75fS/jY2MMddj2gbICrsRhetPfHtXV/WVhJDP1H18GbtCFY2VVPe0a
87VXE15/V8k1mE8McODmi3fipona8+/och3xWKE2rec1MKzKT0g6eXq8CrGCsyT7
YdEIqUuyyOP7uWrat2DX9GgdT0Kj3jlN9K5W7edjcrsZCwenyO4KbXCeAvzhzffi
7MA0BM0oNC9hkXL+nOmFg/+OTxIy7vKBg8P+OxtMb61zO7X8vC7CIAXFjvGDfRaD
ssbzSibBsu/6iGtCOGEoXJf//////////wIBAg==
-----END DH PARAMETERS-----
EOF
    echo "✅ Created DH params file"
else
    echo "✅ DH params file already exists"
fi

# Step 2: Test nginx config can load
echo ""
echo "2. Testing nginx configuration..."
if nginx -t 2>&1 | grep -q "No such file or directory"; then
    echo "❌ Nginx still missing files!"
    nginx -t
else
    echo "✅ Nginx can load configuration files"
fi

# Step 3: Now add growth routes (they won't work without SSL files!)
echo ""
echo "3. Adding growth routes..."

# Use the working staging approach
if [ -f scripts/post-deploy-all-routes.sh ]; then
    bash scripts/post-deploy-all-routes.sh blue.flippi.ai 3002
elif [ -f scripts/ensure-growth-routes.sh ]; then
    bash scripts/ensure-growth-routes.sh
else
    echo "No growth route scripts found, adding manually..."
    # Add growth routes directly to nginx config
    CONFIG_FILE="/etc/nginx/sites-available/blue.flippi.ai"
    if [ -f "$CONFIG_FILE" ] && ! grep -q "location /growth" "$CONFIG_FILE"; then
        # Find line number of "location / {"
        LINE_NUM=$(grep -n "location / {" "$CONFIG_FILE" | head -1 | cut -d: -f1)
        if [ -n "$LINE_NUM" ]; then
            sed -i "${LINE_NUM}i\\
\\
    # Growth routes\\
    location /growth {\\
        proxy_pass http://localhost:3002;\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }\\
" "$CONFIG_FILE"
            echo "✅ Added growth routes manually"
        fi
    fi
fi

# Step 4: Reload nginx
echo ""
echo "4. Reloading nginx..."
nginx -s reload || systemctl reload nginx

# Step 5: Verify the fix
echo ""
echo "5. Verifying routes..."
sleep 2

# Check if nginx config is actually loaded
echo "Checking if nginx is using our config:"
nginx -T 2>/dev/null | grep -q "server_name blue.flippi.ai" && echo "✅ Config loaded" || echo "❌ Config NOT loaded"

# Test growth route
echo ""
echo "Testing growth route:"
RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -20)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ SUCCESS: Growth route is working!"
else
    echo "❌ Growth route still broken"
    
    # Debug info
    echo ""
    echo "Debug info:"
    echo "- SSL files exist: $([ -f /etc/letsencrypt/options-ssl-nginx.conf ] && echo YES || echo NO)"
    echo "- Nginx config test: $(nginx -t 2>&1 | head -1)"
    echo "- Growth location in config: $(grep -c "location /growth" /etc/nginx/sites-available/blue.flippi.ai 2>/dev/null || echo 0)"
fi

echo ""
echo "=== SSL and Growth Route Fix Complete ==="
echo ""
echo "Note: If routes still don't work, the nginx config file may need to be"
echo "manually edited in the GitHub UI since workflow files can't be modified via API."