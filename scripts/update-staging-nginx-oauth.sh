#!/bin/bash
# Update staging nginx configuration with OAuth support
# This runs as part of the deployment process

set -e

echo "=== Updating Staging Nginx Configuration with OAuth Support ==="

DOMAIN="green.flippi.ai"
BACKEND_PORT="3001"
FRONTEND_PORT="8081"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

# Check if already has OAuth
if grep -q "location /auth" "$NGINX_CONFIG" 2>/dev/null; then
    echo "✅ OAuth routes already configured for $DOMAIN"
    exit 0
fi

echo "Adding OAuth routes to $DOMAIN..."

# Backup existing configuration
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="$NGINX_CONFIG.backup-$(date +%Y%m%d-%H%M%S)"
    echo "Backing up to $BACKUP_FILE"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
fi

# Create new configuration with OAuth support
cat > "$NGINX_CONFIG" << 'EOF'
server {
    server_name green.flippi.ai;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = green.flippi.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name green.flippi.ai;
    return 404;
}
EOF

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading nginx..."
    systemctl reload nginx || nginx -s reload
    echo "✅ Nginx configuration updated successfully with OAuth support!"
    
    # Wait for nginx to stabilize
    sleep 2
    
    # Test OAuth endpoint
    echo "Testing OAuth endpoint..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google || echo "FAIL")
    echo "green.flippi.ai/auth/google returns: $STATUS"
    
    if [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
        echo "✅ OAuth is working correctly!"
    else
        echo "⚠️  OAuth endpoint returned $STATUS instead of 302"
    fi
else
    echo "❌ Nginx configuration test failed!"
    # Restore backup
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        nginx -s reload
        echo "Restored backup configuration"
    fi
    exit 1
fi