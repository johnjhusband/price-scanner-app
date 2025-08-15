#!/bin/bash
# Comprehensive route fixing script that ensures all backend routes work correctly

echo "=== Comprehensive Route Fix Script ==="
echo "This script fixes nginx routing for growth, admin, and legal pages"
echo ""

# Function to add growth and admin routes to a domain
add_backend_routes() {
    local DOMAIN=$1
    local PORT=$2
    
    echo "Processing $DOMAIN (port $PORT)..."
    
    # Create a temporary file with the new location blocks
    cat > /tmp/backend-routes.txt << EOF
    # Growth routes
    location /growth {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin routes
    location /admin {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

EOF
    
    # Check if the routes already exist
    local NEEDS_UPDATE=false
    
    if ! grep -q "location /growth" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
        echo "  Missing /growth route"
        NEEDS_UPDATE=true
    fi
    
    if ! grep -q "location /admin" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
        echo "  Missing /admin route"
        NEEDS_UPDATE=true
    fi
    
    if [ "$NEEDS_UPDATE" = true ]; then
        # Backup the original
        cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/${DOMAIN}.backup.$(date +%s)
        
        # Find the line number of "location / {" and insert before it
        LINE_NUM=$(grep -n "location / {" /etc/nginx/sites-available/$DOMAIN | head -1 | cut -d: -f1)
        
        if [ -n "$LINE_NUM" ]; then
            # Create a new file with the routes inserted
            head -n $((LINE_NUM - 1)) /etc/nginx/sites-available/$DOMAIN > /tmp/${DOMAIN}.new
            cat /tmp/backend-routes.txt >> /tmp/${DOMAIN}.new
            tail -n +${LINE_NUM} /etc/nginx/sites-available/$DOMAIN >> /tmp/${DOMAIN}.new
            
            # Replace the original
            mv /tmp/${DOMAIN}.new /etc/nginx/sites-available/$DOMAIN
            echo "  ✅ Added backend routes to $DOMAIN"
        else
            echo "  ❌ Could not find location / block in $DOMAIN config"
        fi
    else
        echo "  ✅ Backend routes already exist for $DOMAIN"
    fi
    
    rm -f /tmp/backend-routes.txt
}

# Function to ensure SSL files exist
ensure_ssl_files() {
    echo "Ensuring SSL configuration files exist..."
    
    # Create nginx SSL options if missing
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
    fi
    
    # Create DH parameters if missing
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
    fi
}

# Main execution
echo "Step 1: Ensuring SSL files exist"
ensure_ssl_files

echo ""
echo "Step 2: Adding backend routes to nginx configs"

# Add routes for each environment
if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    add_backend_routes "blue.flippi.ai" "3002"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    add_backend_routes "green.flippi.ai" "3001"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    add_backend_routes "app.flippi.ai" "3000"
fi

# Test nginx configuration
echo ""
echo "Step 3: Testing nginx configuration..."
if nginx -t 2>/dev/null; then
    echo "✅ Nginx config is valid"
    echo "Reloading nginx..."
    nginx -s reload
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx config has errors!"
    nginx -t
    exit 1
fi

# Test the routes
echo ""
echo "Step 4: Testing routes..."
sleep 2

test_routes() {
    local DOMAIN=$1
    local PORT=$2
    
    echo "Testing $DOMAIN..."
    
    # Test growth route
    local RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:${PORT}/growth/questions 2>/dev/null || echo "000")
    echo "  /growth/questions via backend: HTTP $RESPONSE"
    
    # Test admin route
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:${PORT}/admin 2>/dev/null || echo "000")
    echo "  /admin via backend: HTTP $RESPONSE"
    
    # Test API health
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/health 2>/dev/null || echo "000")
    echo "  /health via backend: HTTP $RESPONSE"
    
    # Test via domain
    if command -v curl &> /dev/null && [ "$DOMAIN" != "" ]; then
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions 2>/dev/null || echo "000")
        echo "  /growth/questions via domain: HTTP $RESPONSE"
    fi
}

if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    test_routes "blue.flippi.ai" "3002"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    test_routes "green.flippi.ai" "3001"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    test_routes "app.flippi.ai" "3000"
fi

echo ""
echo "=== Comprehensive route fix complete ==="
echo "Growth, admin, and API routes should now be properly routed to the backend"