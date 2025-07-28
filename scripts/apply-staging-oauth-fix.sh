#!/bin/bash
# Script to fix Google OAuth on staging (green.flippi.ai)
# This script must be run with sudo on the server

set -e

echo "=== Fixing Google OAuth for green.flippi.ai (staging) ==="

# Configuration
DOMAIN="green.flippi.ai"
BACKEND_PORT="3001"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Check if running with proper permissions
if [ ! -w "$NGINX_CONFIG" ] && [ "$EUID" -ne 0 ]; then 
    echo "WARNING: No write access to nginx configs. Attempting with sudo..."
    # Try to run ourselves with sudo
    if command -v sudo >/dev/null 2>&1; then
        exec sudo "$0" "$@"
    else
        echo "ERROR: This script needs write access to nginx configs."
        exit 1
    fi
fi

# Backup current configuration
echo "1. Backing up current nginx configuration..."
cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup-$TIMESTAMP"
echo "   Backup saved to: $NGINX_CONFIG.backup-$TIMESTAMP"

# Check if OAuth routes already exist
if grep -q "location /auth" "$NGINX_CONFIG"; then
    echo "   ✓ OAuth routes already configured in nginx"
    echo "   Checking if they're correct..."
    
    if grep -q "proxy_pass http://localhost:$BACKEND_PORT" "$NGINX_CONFIG"; then
        echo "   ✓ OAuth routes are correctly configured"
        exit 0
    else
        echo "   ⚠ OAuth routes exist but may have wrong port, updating..."
    fi
fi

# Create updated configuration
echo "2. Creating updated nginx configuration..."
cat > "/tmp/$DOMAIN.conf" << 'EOF'
server {
    server_name green.flippi.ai;
    
    # Backend API routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
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
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
    }
    
    # Legal pages
    location = /terms {
        alias /var/www/green.flippi.ai/mobile-app/terms.html;
    }
    
    location = /privacy {
        alias /var/www/green.flippi.ai/mobile-app/privacy.html;
    }
    
    # Frontend - all other routes
    location / {
        root /var/www/green.flippi.ai/mobile-app/dist;
        try_files $uri /index.html;
    }
    
    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name green.flippi.ai;
    return 301 https://$server_name$request_uri;
}
EOF

# Apply the configuration
echo "3. Applying new configuration..."
cp "/tmp/$DOMAIN.conf" "$NGINX_CONFIG"

# Test nginx configuration
echo "4. Testing nginx configuration..."
if command -v sudo >/dev/null 2>&1 && [ "$EUID" -ne 0 ]; then
    sudo nginx -t
else
    nginx -t
fi

if [ $? -eq 0 ]; then
    echo "   ✓ Configuration test passed"
    
    # Reload nginx
    echo "5. Reloading nginx..."
    if command -v sudo >/dev/null 2>&1 && [ "$EUID" -ne 0 ]; then
        sudo systemctl reload nginx
    else
        systemctl reload nginx || nginx -s reload
    fi
    echo "   ✓ Nginx reloaded successfully"
    
    # Test OAuth endpoint
    echo "6. Testing OAuth endpoint..."
    sleep 2
    
    # Check if /auth/google returns a redirect (302) instead of HTML (200)
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://$DOMAIN/auth/google)
    
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
        echo "   ✓ OAuth endpoint is responding with redirect (good!)"
        echo ""
        echo "=== SUCCESS ==="
        echo "Google OAuth has been fixed for $DOMAIN!"
        echo "Users can now log in with Google on staging."
    else
        echo "   ⚠ OAuth endpoint returned $RESPONSE (expected 302)"
        echo "   The configuration was applied but may need troubleshooting"
    fi
    
else
    echo "   ✗ Configuration test failed!"
    echo "   Restoring backup..."
    cp "$NGINX_CONFIG.backup-$TIMESTAMP" "$NGINX_CONFIG"
    if command -v sudo >/dev/null 2>&1 && [ "$EUID" -ne 0 ]; then
        sudo systemctl reload nginx
    else
        systemctl reload nginx || nginx -s reload
    fi
    echo "   Backup restored. Please check the error messages above."
    exit 1
fi

# Cleanup
rm -f "/tmp/$DOMAIN.conf"

echo ""
echo "Next steps:"
echo "1. Test login at https://green.flippi.ai"
echo "2. Click 'Sign in with Google'"
echo "3. Verify you're redirected to Google"
echo "4. Complete login and verify redirect back to app"