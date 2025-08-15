#!/bin/bash
# Emergency fix for growth routes - to be run on server

echo "=== EMERGENCY GROWTH ROUTE FIX ==="
echo "This script forcefully fixes the growth routing issue"
echo ""

# Function to completely rebuild nginx config with proper routes
fix_nginx_for_domain() {
    local DOMAIN=$1
    local PORT=$2
    local CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"
    
    echo "Fixing $DOMAIN (backend port $PORT)..."
    
    # First, check current state
    echo "Current growth route check:"
    if grep -q "location /growth" "$CONFIG_FILE"; then
        echo "✓ Growth location block exists"
        grep -A5 "location /growth" "$CONFIG_FILE"
    else
        echo "✗ Growth location block MISSING"
    fi
    
    # Backup current config
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%s)"
    
    # Create a temporary file with the complete server block
    cat > /tmp/nginx-${DOMAIN}-fixed << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $DOMAIN;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Backend API routes - MUST come before catch-all
    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    # Growth routes - MUST come before catch-all
    location /growth {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin routes - MUST come before catch-all
    location /admin {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Legal pages served by backend
    location = /terms {
        proxy_pass http://localhost:$PORT/terms;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /privacy {
        proxy_pass http://localhost:$PORT/privacy;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /mission {
        proxy_pass http://localhost:$PORT/mission;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /contact {
        proxy_pass http://localhost:$PORT/contact;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Blog/value pages
    location /value {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend - catch-all MUST be last
    location / {
        root /var/www/$DOMAIN/mobile-app/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Expo static assets
    location /_expo {
        root /var/www/$DOMAIN/mobile-app/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Other static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/$DOMAIN/mobile-app/dist;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

    # Replace the config
    mv /tmp/nginx-${DOMAIN}-fixed "$CONFIG_FILE"
    
    # Update sites-enabled symlink
    rm -f /etc/nginx/sites-enabled/$DOMAIN
    ln -s "$CONFIG_FILE" /etc/nginx/sites-enabled/$DOMAIN
    
    echo "✓ Nginx config replaced with proper route ordering"
}

# Ensure SSL files exist first
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    echo "Creating SSL options file..."
    mkdir -p /etc/letsencrypt
    cat > /etc/letsencrypt/options-ssl-nginx.conf << 'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    echo "Creating DH params file..."
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
fi

# Fix each environment
echo ""
echo "Applying fixes to all environments..."

if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    fix_nginx_for_domain "blue.flippi.ai" "3002"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    fix_nginx_for_domain "green.flippi.ai" "3001"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    fix_nginx_for_domain "app.flippi.ai" "3000"
fi

# Test configuration
echo ""
echo "Testing nginx configuration..."
if nginx -t; then
    echo "✓ Configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    systemctl reload nginx || nginx -s reload
    echo "✓ Nginx reloaded"
    
    # Wait for it to settle
    sleep 2
    
    # Test the routes
    echo ""
    echo "Testing routes..."
    
    # Test blue.flippi.ai
    echo ""
    echo "Testing blue.flippi.ai:"
    echo -n "  Backend health: "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/health
    
    echo -n "  Growth route (direct): "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/growth/questions
    
    echo -n "  Growth route (via domain): "
    RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -20)
    if echo "$RESPONSE" | grep -q "Questions Found"; then
        echo "✓ WORKING - Backend response"
    else
        echo "✗ BROKEN - Getting React app"
    fi
    
else
    echo "✗ Configuration has errors!"
    nginx -t
fi

echo ""
echo "=== Emergency fix complete ==="
echo ""
echo "If growth routes are still broken:"
echo "1. Check PM2 status: pm2 list"
echo "2. Check backend logs: pm2 logs dev-backend"
echo "3. Verify backend is running on port 3002"
echo "4. Check nginx error logs: tail -f /var/log/nginx/error.log"