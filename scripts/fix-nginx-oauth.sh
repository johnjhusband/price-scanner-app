#!/bin/bash
# Fix nginx configuration for OAuth routes

echo "=== Fixing nginx configuration for OAuth routes ==="

# Function to update nginx config for a domain
update_nginx_config() {
    local DOMAIN=$1
    local PORT=$2
    local CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"
    
    echo "Updating $DOMAIN (backend port $PORT)..."
    
    # Backup current config
    cp $CONFIG_FILE $CONFIG_FILE.bak-$(date +%Y%m%d-%H%M%S)
    
    # Create new config
    cat > /tmp/$DOMAIN.conf << EOF
server {
    server_name $DOMAIN;
    
    # Backend API routes
    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
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
    }
    
    # Legal pages
    location = /terms {
        alias /var/www/$DOMAIN/mobile-app/terms.html;
    }
    
    location = /privacy {
        alias /var/www/$DOMAIN/mobile-app/privacy.html;
    }
    
    # Frontend - all other routes
    location / {
        root /var/www/$DOMAIN/mobile-app/dist;
        try_files \$uri /index.html;
    }
    
    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF
    
    # Copy new config
    cp /tmp/$DOMAIN.conf $CONFIG_FILE
    
    echo "Updated $DOMAIN configuration"
}

# Update all three environments
update_nginx_config "app.flippi.ai" "3000"
update_nginx_config "green.flippi.ai" "3001"
update_nginx_config "blue.flippi.ai" "3002"

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration test passed. Reloading nginx..."
    nginx -s reload
    echo "Nginx reloaded successfully!"
    
    # Test OAuth routes
    echo ""
    echo "Testing OAuth routes:"
    echo "- Production: $(curl -s -o /dev/null -w "%{http_code}" -I https://app.flippi.ai/auth/google)"
    echo "- Staging: $(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)"
    echo "- Development: $(curl -s -o /dev/null -w "%{http_code}" -I https://blue.flippi.ai/auth/google)"
else
    echo "ERROR: Nginx configuration test failed!"
    echo "Configs have been backed up with timestamp suffix"
    exit 1
fi