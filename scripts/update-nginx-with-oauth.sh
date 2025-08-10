#!/bin/bash
# Update nginx configuration with OAuth support for all environments

set -e

echo "=== Updating Nginx Configuration with OAuth Support ==="

# Function to update nginx config for a domain
update_nginx_config() {
    local DOMAIN=$1
    local BACKEND_PORT=$2
    local FRONTEND_PORT=$3
    local NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
    
    echo "Updating $DOMAIN (backend: $BACKEND_PORT, frontend: $FRONTEND_PORT)..."
    
    # Backup existing configuration
    if [ -f "$NGINX_CONFIG" ]; then
        BACKUP_FILE="$NGINX_CONFIG.backup-$(date +%Y%m%d-%H%M%S)"
        echo "Backing up to $BACKUP_FILE"
        sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
    fi
    
    # Create new configuration with OAuth support
    sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    server_name $DOMAIN;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if (\$host = $DOMAIN) {
        return 301 https://\$host\$request_uri;
    }
    listen 80;
    server_name $DOMAIN;
    return 404;
}
EOF
    
    echo "✅ Updated $DOMAIN with OAuth support"
}

# Update all environments
update_nginx_config "app.flippi.ai" 3000 8080
update_nginx_config "green.flippi.ai" 3001 8081
update_nginx_config "blue.flippi.ai" 3002 8082

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading nginx..."
    sudo nginx -s reload
    echo "✅ All nginx configurations updated successfully with OAuth support!"
    
    # Test OAuth endpoints
    echo ""
    echo "=== Testing OAuth endpoints ==="
    for domain in app.flippi.ai green.flippi.ai blue.flippi.ai; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://$domain/auth/google)
        echo "$domain/auth/google returns: $STATUS"
    done
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi