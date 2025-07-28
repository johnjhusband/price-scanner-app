#!/bin/bash
# Fix NGINX Config on Staging - Add OAuth Route
# Ticket: Fix /auth/* not proxying to backend on green.flippi.ai

set -e

echo "🎫 Fixing NGINX OAuth Configuration on Staging"
echo "📍 Environment: green.flippi.ai"
echo "🔧 Adding /auth location block to proxy to backend port 3001"
echo

# Configuration
NGINX_CONFIG="/etc/nginx/sites-available/green.flippi.ai"
BACKUP_FILE="$NGINX_CONFIG.backup-$(date +%Y%m%d-%H%M%S)"

# Check if we can write to nginx config
if [ ! -w "$NGINX_CONFIG" ] && [ "$EUID" -ne 0 ]; then
    echo "⚠️  Need sudo access to modify nginx config"
    exec sudo "$0" "$@"
fi

# Backup current config
echo "1️⃣ Backing up current nginx config..."
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "   ✅ Backup saved to: $BACKUP_FILE"

# Check if /auth location already exists
echo "2️⃣ Checking existing configuration..."
if grep -q "location /auth" "$NGINX_CONFIG"; then
    echo "   ⚠️  Found existing /auth location block"
    echo "   🔍 Verifying it points to correct port..."
    if grep -A5 "location /auth" "$NGINX_CONFIG" | grep -q "proxy_pass http://localhost:3001"; then
        echo "   ✅ OAuth configuration already correct!"
        echo "   🔄 Reloading nginx anyway..."
        nginx -t && nginx -s reload
        echo "   ✅ Done!"
        exit 0
    else
        echo "   ❌ /auth exists but with wrong configuration"
    fi
fi

# Create the OAuth location block
echo "3️⃣ Adding OAuth location block..."
cat > /tmp/oauth-location.txt << 'EOF'

    # OAuth routes - Added by fix-staging-nginx-oauth.sh
    location /auth/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
EOF

# Insert after /api location block
echo "4️⃣ Updating nginx configuration..."
# Create working copy
cp "$NGINX_CONFIG" /tmp/nginx-working.conf

# Use awk to insert after /api block
awk '
    /location \/api/ { in_api_block = 1 }
    in_api_block && /}/ { 
        print $0
        system("cat /tmp/oauth-location.txt")
        in_api_block = 0
        next
    }
    { print }
' /tmp/nginx-working.conf > /tmp/nginx-updated.conf

# Apply the updated config
cp /tmp/nginx-updated.conf "$NGINX_CONFIG"

# Test nginx configuration
echo "5️⃣ Testing nginx configuration..."
if nginx -t; then
    echo "   ✅ Configuration test passed!"
    
    # Reload nginx
    echo "6️⃣ Reloading nginx..."
    nginx -s reload
    echo "   ✅ Nginx reloaded successfully!"
    
    # Wait a moment
    sleep 2
    
    # Test the OAuth endpoint
    echo "7️⃣ Verifying OAuth fix..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
    
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
        echo "   ✅ SUCCESS! OAuth is now working (returns $RESPONSE)"
        echo
        echo "🎉 OAuth has been fixed on staging!"
        echo "📍 Users can now sign in at https://green.flippi.ai"
    else
        echo "   ⚠️  OAuth endpoint returned $RESPONSE (expected 302)"
        echo "   📋 Check if backend is running on port 3001"
    fi
else
    echo "   ❌ Nginx configuration test failed!"
    echo "   🔄 Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -s reload
    echo "   ✅ Backup restored"
    exit 1
fi

# Cleanup
rm -f /tmp/oauth-location.txt /tmp/nginx-working.conf /tmp/nginx-updated.conf

echo
echo "✅ Script completed successfully!"