#!/bin/bash
# Force update staging nginx configuration with OAuth support
# This ALWAYS updates, even if OAuth routes appear to exist

set -e

echo "=== FORCE Update Staging Nginx Configuration with OAuth ==="
echo "Running as: $(whoami)"
echo "Current directory: $(pwd)"

DOMAIN="green.flippi.ai"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

# Show current nginx config
echo ""
echo "=== Current Nginx Config ==="
if [ -f "$NGINX_CONFIG" ]; then
    echo "File exists at $NGINX_CONFIG"
    echo "Checking for /auth location:"
    grep -n "location /auth" "$NGINX_CONFIG" || echo "No /auth location found"
else
    echo "ERROR: Nginx config not found at $NGINX_CONFIG"
    ls -la /etc/nginx/sites-available/
    exit 1
fi

# Backup existing configuration
BACKUP_FILE="$NGINX_CONFIG.backup-force-$(date +%Y%m%d-%H%M%S)"
echo ""
echo "=== Creating Backup ==="
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "Backed up to: $BACKUP_FILE"

# Create new configuration with OAuth support
echo ""
echo "=== Creating New Config with OAuth ==="
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

echo "New config written"

# Show the new config
echo ""
echo "=== Verifying OAuth in New Config ==="
grep -n "location /auth" "$NGINX_CONFIG" || echo "ERROR: OAuth not found in new config!"

# Test nginx configuration
echo ""
echo "=== Testing Nginx Configuration ==="
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Reloading Nginx ==="
    systemctl reload nginx || nginx -s reload
    echo "✅ Nginx reloaded successfully!"
    
    # Wait for nginx to stabilize
    sleep 3
    
    # Test OAuth endpoint
    echo ""
    echo "=== Testing OAuth Endpoint ==="
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google || echo "FAIL")
    echo "green.flippi.ai/auth/google returns: $STATUS"
    
    if [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
        echo "✅ SUCCESS - OAuth is working correctly!"
    else
        echo "❌ FAILED - OAuth endpoint returned $STATUS instead of 302"
        echo ""
        echo "Checking if backend is running:"
        curl -s http://localhost:3001/health || echo "Backend not responding on port 3001"
    fi
else
    echo "❌ Nginx configuration test failed!"
    # Restore backup
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -s reload
    echo "Restored backup configuration"
    exit 1
fi

echo ""
echo "=== Script Complete ==="