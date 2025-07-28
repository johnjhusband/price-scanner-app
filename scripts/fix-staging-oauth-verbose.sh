#!/bin/bash
# Verbose OAuth fix for staging with full diagnostics
set -x  # Enable debug mode to see every command
set -e  # Exit on error

echo "🔍 VERBOSE OAUTH FIX FOR STAGING"
echo "================================"
echo "Date: $(date)"
echo "Running as: $(whoami)"
echo "Current directory: $(pwd)"

# Configuration
NGINX_CONFIG="/etc/nginx/sites-available/green.flippi.ai"
LOG_FILE="/tmp/oauth-fix-verbose-$(date +%s).log"

# Redirect all output to log file AND screen
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo
echo "📁 STEP 1: Check if nginx config exists"
if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ Found nginx config at: $NGINX_CONFIG"
    echo "📊 File permissions: $(ls -la $NGINX_CONFIG)"
else
    echo "❌ ERROR: Nginx config not found at $NGINX_CONFIG"
    echo "📂 Listing /etc/nginx/sites-available/:"
    ls -la /etc/nginx/sites-available/
    exit 1
fi

echo
echo "📜 STEP 2: Show CURRENT nginx config"
echo "===== CURRENT NGINX CONFIG START ====="
cat "$NGINX_CONFIG"
echo "===== CURRENT NGINX CONFIG END ====="

echo
echo "🔍 STEP 3: Check if /auth location exists"
if grep -q "location /auth" "$NGINX_CONFIG"; then
    echo "⚠️  Found existing /auth location"
    echo "📋 Current /auth config:"
    grep -A 10 "location /auth" "$NGINX_CONFIG" || true
else
    echo "❌ No /auth location found - MUST ADD IT"
fi

echo
echo "💾 STEP 4: Backup current config"
BACKUP="/tmp/nginx-backup-$(date +%s).conf"
cp "$NGINX_CONFIG" "$BACKUP"
echo "✅ Backup saved to: $BACKUP"

echo
echo "🛠️ STEP 5: Create new config with OAuth"
# Use sed to insert the /auth block after /api block
sed '/location \/api {/,/^[[:space:]]*}/ {
    /^[[:space:]]*}/ a\
\
    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)\
    location /auth/ {\
        proxy_pass http://localhost:3001/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
    }
}' "$BACKUP" > /tmp/nginx-new.conf

echo
echo "📜 STEP 6: Show NEW nginx config"
echo "===== NEW NGINX CONFIG START ====="
cat /tmp/nginx-new.conf
echo "===== NEW NGINX CONFIG END ====="

echo
echo "🔄 STEP 7: Apply new config"
cp /tmp/nginx-new.conf "$NGINX_CONFIG"
echo "✅ New config copied to $NGINX_CONFIG"

echo
echo "🧪 STEP 8: Test nginx configuration"
nginx -t 2>&1 || {
    echo "❌ Nginx test failed! Restoring backup..."
    cp "$BACKUP" "$NGINX_CONFIG"
    exit 1
}

echo
echo "♻️ STEP 9: Reload nginx"
systemctl reload nginx || nginx -s reload || {
    echo "❌ Failed to reload nginx!"
    exit 1
}
echo "✅ Nginx reloaded"

echo
echo "⏱️ STEP 10: Wait for nginx to stabilize"
sleep 3

echo
echo "🔍 STEP 11: Verify the fix"
echo "Testing OAuth endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
echo "OAuth endpoint response: $RESPONSE"

if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
    echo "✅ SUCCESS! OAuth is working!"
else
    echo "❌ FAILED! OAuth still returning $RESPONSE"
    echo
    echo "📋 Final nginx config check:"
    grep -A 10 "location /auth" "$NGINX_CONFIG" || echo "NO /auth block found!"
fi

echo
echo "📊 STEP 12: Show final nginx config"
echo "===== FINAL NGINX CONFIG START ====="
cat "$NGINX_CONFIG"
echo "===== FINAL NGINX CONFIG END ====="

echo
echo "📁 Log file saved to: $LOG_FILE"
echo "🏁 Script completed at: $(date)"