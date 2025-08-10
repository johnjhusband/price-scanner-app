#!/bin/bash
# Complete fix for staging nginx OAuth configuration
# This script properly handles both sites-available AND sites-enabled

set -e

echo "=== Complete OAuth Fix for Staging Nginx ==="
echo "Script started at: $(date)"

DOMAIN="green.flippi.ai"
BACKEND_PORT="3001"
FRONTEND_PORT="8081"
NGINX_AVAILABLE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
LOG_FILE="/tmp/oauth-fix-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting OAuth fix for $DOMAIN"

# Check current nginx configuration
log "Checking current nginx configuration..."
if nginx -T 2>/dev/null | grep -A 20 "server_name $DOMAIN" | grep -q "location /auth"; then
    log "✅ OAuth routes already active in running nginx config"
    nginx -T 2>/dev/null | grep -A 5 "location /auth" | tee -a "$LOG_FILE"
    exit 0
else
    log "⚠️  OAuth routes NOT found in running nginx config"
fi

# Check sites-available
log "Checking sites-available..."
if [ -f "$NGINX_AVAILABLE" ]; then
    if grep -q "location /auth" "$NGINX_AVAILABLE"; then
        log "OAuth found in sites-available"
    else
        log "OAuth NOT found in sites-available"
    fi
else
    log "sites-available file does not exist"
fi

# Check sites-enabled
log "Checking sites-enabled..."
if [ -L "$NGINX_ENABLED" ]; then
    log "sites-enabled is a symlink pointing to: $(readlink -f $NGINX_ENABLED)"
elif [ -f "$NGINX_ENABLED" ]; then
    log "sites-enabled is a regular file (not a symlink)"
else
    log "sites-enabled does not exist"
fi

# Backup existing configurations
if [ -f "$NGINX_AVAILABLE" ]; then
    BACKUP_FILE="$NGINX_AVAILABLE.backup-$(date +%Y%m%d-%H%M%S)"
    log "Backing up sites-available to $BACKUP_FILE"
    cp "$NGINX_AVAILABLE" "$BACKUP_FILE"
fi

# Create new configuration with OAuth support
log "Creating new nginx configuration with OAuth..."
cat > "$NGINX_AVAILABLE" << 'EOF'
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

log "Configuration written to sites-available"

# Ensure sites-enabled symlink is correct
log "Updating sites-enabled symlink..."
if [ -e "$NGINX_ENABLED" ]; then
    log "Removing existing sites-enabled entry"
    rm -f "$NGINX_ENABLED"
fi

log "Creating symlink from sites-enabled to sites-available"
ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
log "Symlink created: $NGINX_ENABLED -> $NGINX_AVAILABLE"

# Verify the symlink
if [ -L "$NGINX_ENABLED" ]; then
    log "✅ Symlink verified: $(ls -la $NGINX_ENABLED)"
else
    log "❌ ERROR: Symlink creation failed!"
    exit 1
fi

# Test nginx configuration
log "Testing nginx configuration..."
if nginx -t 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ Nginx configuration test passed"
    
    log "Reloading nginx..."
    if systemctl reload nginx 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Nginx reloaded successfully"
    else
        log "⚠️  systemctl reload failed, trying nginx -s reload"
        nginx -s reload 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Wait for nginx to stabilize
    sleep 3
    
    # Verify OAuth is now working
    log "Verifying OAuth endpoint..."
    
    # Check if OAuth routes are in the active config
    if nginx -T 2>/dev/null | grep -A 20 "server_name $DOMAIN" | grep -q "location /auth"; then
        log "✅ OAuth routes confirmed in active nginx config"
    else
        log "❌ OAuth routes still not in active config!"
    fi
    
    # Test the actual endpoint
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google 2>&1 || echo "FAIL")
    log "OAuth endpoint test: https://green.flippi.ai/auth/google returns $STATUS"
    
    if [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
        log "✅ OAuth is working correctly!"
    else
        log "⚠️  OAuth endpoint returned $STATUS instead of 302"
        log "This might be due to DNS propagation or backend not configured"
    fi
    
    # Show the current nginx config for OAuth
    log "Current OAuth configuration in nginx:"
    nginx -T 2>/dev/null | grep -A 10 "location /auth" | tee -a "$LOG_FILE" || log "Could not extract OAuth config"
    
else
    log "❌ Nginx configuration test failed!"
    # Restore backup
    if [ -f "$BACKUP_FILE" ]; then
        log "Restoring backup configuration"
        cp "$BACKUP_FILE" "$NGINX_AVAILABLE"
        # Ensure symlink still exists
        [ -L "$NGINX_ENABLED" ] || ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
        nginx -s reload 2>&1 | tee -a "$LOG_FILE"
    fi
    exit 1
fi

log "OAuth fix completed. Log saved to: $LOG_FILE"
echo "=== OAuth Fix Complete ==="

# Output key information
echo "Summary:"
echo "- Config written to: $NGINX_AVAILABLE"
echo "- Symlink created: $NGINX_ENABLED -> $NGINX_AVAILABLE"
echo "- OAuth endpoint status: $STATUS"
echo "- Full log: $LOG_FILE"