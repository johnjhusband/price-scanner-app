#!/bin/bash
# Script to update nginx configuration for blue.flippi.ai (development environment)

set -e

echo "=== Updating Nginx Configuration for blue.flippi.ai ==="

# Configuration variables
DOMAIN="blue.flippi.ai"
BACKEND_PORT="3002"
FRONTEND_PORT="8082"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

# Backup existing configuration
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="$NGINX_CONFIG.backup-$(date +%Y%m%d-%H%M%S)"
    echo "Backing up existing configuration to $BACKUP_FILE"
    sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
fi

# Create new configuration
echo "Creating new nginx configuration..."
sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
server {
    listen 80;
    server_name blue.flippi.ai;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blue.flippi.ai;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Increase client body size for image uploads
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend - serve from PM2 server
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for API calls
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Handle large uploads
        client_max_body_size 50M;
        client_body_buffer_size 50M;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Exact match for /terms
    location = /terms {
        proxy_pass http://localhost:8082/terms;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Exact match for /privacy
    location = /privacy {
        proxy_pass http://localhost:8082/privacy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Logging
    access_log /var/log/nginx/blue.flippi.ai.access.log;
    error_log /var/log/nginx/blue.flippi.ai.error.log;
}
EOF

# Enable site if not already enabled
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    echo "Enabling site..."
    sudo ln -s "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$DOMAIN"
fi

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading nginx..."
    sudo nginx -s reload
    echo "✅ Nginx configuration updated successfully!"
    
    # Show the routes
    echo ""
    echo "=== Updated routes for blue.flippi.ai ==="
    grep -E "location|proxy_pass" "$NGINX_CONFIG" | grep -v "^#"
else
    echo "❌ Nginx configuration test failed!"
    echo "Rolling back to previous configuration..."
    
    # Find the most recent backup
    LATEST_BACKUP=$(ls -t $NGINX_CONFIG.backup-* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        sudo cp "$LATEST_BACKUP" "$NGINX_CONFIG"
        sudo nginx -s reload
        echo "Rolled back to: $LATEST_BACKUP"
    else
        echo "No backup found to roll back to!"
    fi
    exit 1
fi