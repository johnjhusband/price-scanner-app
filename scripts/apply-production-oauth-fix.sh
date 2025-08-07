#!/bin/bash
# Script to fix Google OAuth on production (app.flippi.ai)
# This script must be run with sudo on the server

set -e

echo "=== Fixing Google OAuth for app.flippi.ai (production) ==="

# Configuration
DOMAIN="app.flippi.ai"
BACKEND_PORT="3000"
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

# Create a temporary file with the OAuth location block
echo "2. Creating OAuth location block..."
cat > "/tmp/oauth-block.txt" << 'EOF'

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Insert the OAuth block after the /api location block
echo "3. Updating nginx configuration..."
# Create a working copy
cp "$NGINX_CONFIG" "/tmp/$DOMAIN.conf.work"

# Use awk to insert the OAuth block after the /api location closing brace
awk '
    /location \/api/ { in_api_block = 1 }
    in_api_block && /}/ { 
        print $0
        system("cat /tmp/oauth-block.txt")
        in_api_block = 0
        next
    }
    { print }
' "/tmp/$DOMAIN.conf.work" > "/tmp/$DOMAIN.conf.new"

# Apply the new configuration
cp "/tmp/$DOMAIN.conf.new" "$NGINX_CONFIG"

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
        echo "Users can now log in with Google on production."
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
rm -f "/tmp/$DOMAIN.conf.work" "/tmp/$DOMAIN.conf.new" "/tmp/oauth-block.txt"

echo ""
echo "Next steps:"
echo "1. Test login at https://app.flippi.ai"
echo "2. Click 'Sign in with Google'"
echo "3. Verify you're redirected to Google"
echo "4. Complete login and verify redirect back to app"
echo ""
echo "If you need to rollback:"
echo "sudo cp $NGINX_CONFIG.backup-$TIMESTAMP $NGINX_CONFIG"
echo "sudo nginx -t && sudo systemctl reload nginx"