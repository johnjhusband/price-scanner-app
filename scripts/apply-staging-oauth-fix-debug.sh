#!/bin/bash
set -e
LOG_FILE="/tmp/oauth-fix-$(date +%s).log"

echo "🚀 Running OAuth Fix Script" | tee -a $LOG_FILE
echo "📁 Current Dir: $(pwd)" | tee -a $LOG_FILE
echo "👤 Running as: $(whoami)" | tee -a $LOG_FILE
echo "📅 Timestamp: $(date)" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Configuration
DOMAIN="green.flippi.ai"
BACKEND_PORT="3001"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Log check: is this the right Nginx file?
echo "🔍 Preview nginx config target: $NGINX_CONFIG" | tee -a $LOG_FILE
echo "📄 Current nginx config:" | tee -a $LOG_FILE
cat $NGINX_CONFIG | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Check if OAuth routes already exist
echo "🔍 Checking for existing /auth location..." | tee -a $LOG_FILE
if grep -q "location /auth" "$NGINX_CONFIG"; then
    echo "⚠️  OAuth routes already exist in nginx" | tee -a $LOG_FILE
    echo "🔍 Checking if they point to correct port..." | tee -a $LOG_FILE
    
    if grep -q "proxy_pass http://localhost:$BACKEND_PORT" "$NGINX_CONFIG"; then
        echo "✅ OAuth routes are correctly configured" | tee -a $LOG_FILE
        echo "🔍 Final verification..." | tee -a $LOG_FILE
        curl -I https://green.flippi.ai/auth/google | tee -a $LOG_FILE
        echo "📋 Log saved to: $LOG_FILE"
        exit 0
    else
        echo "⚠️  OAuth routes exist but may have wrong port" | tee -a $LOG_FILE
    fi
else
    echo "❌ No /auth location found - will add it" | tee -a $LOG_FILE
fi

# Backup current configuration
echo "💾 Backing up current nginx configuration..." | tee -a $LOG_FILE
cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup-$TIMESTAMP"
echo "✅ Backup saved to: $NGINX_CONFIG.backup-$TIMESTAMP" | tee -a $LOG_FILE

# Create OAuth location block
echo "🔧 Creating OAuth location block..." | tee -a $LOG_FILE
cat > "/tmp/oauth-block.txt" << 'EOF'

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

echo "📝 OAuth block content:" | tee -a $LOG_FILE
cat /tmp/oauth-block.txt | tee -a $LOG_FILE

# Insert the OAuth block after the /api location block
echo "🔧 Updating nginx config..." | tee -a $LOG_FILE
cp "$NGINX_CONFIG" "/tmp/$DOMAIN.conf.work"

# Use awk to insert the OAuth block
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

# Show the updated config
echo "📄 Updated nginx config preview:" | tee -a $LOG_FILE
cat "/tmp/$DOMAIN.conf.new" | tee -a $LOG_FILE

# Apply the new configuration
echo "📝 Applying new configuration..." | tee -a $LOG_FILE
cp "/tmp/$DOMAIN.conf.new" "$NGINX_CONFIG"

# Test nginx configuration
echo "🧪 Testing nginx configuration..." | tee -a $LOG_FILE
if nginx -t 2>&1 | tee -a $LOG_FILE; then
    echo "✅ nginx config test passed, reloading..." | tee -a $LOG_FILE
    
    # Reload nginx
    if systemctl reload nginx 2>&1 | tee -a $LOG_FILE; then
        echo "✅ Nginx reloaded successfully" | tee -a $LOG_FILE
    else
        echo "❌ Failed to reload nginx" | tee -a $LOG_FILE
    fi
    
    # Wait a moment
    sleep 2
    
    # Final confirmation
    echo "🔍 Final OAuth endpoint test:" | tee -a $LOG_FILE
    curl -I https://green.flippi.ai/auth/google 2>&1 | tee -a $LOG_FILE
    
    echo "" | tee -a $LOG_FILE
    echo "✅ Script completed!" | tee -a $LOG_FILE
else
    echo "❌ Nginx configuration test failed!" | tee -a $LOG_FILE
    echo "🔄 Restoring backup..." | tee -a $LOG_FILE
    cp "$NGINX_CONFIG.backup-$TIMESTAMP" "$NGINX_CONFIG"
    nginx -s reload
    echo "📋 Log saved to: $LOG_FILE"
    exit 1
fi

# Cleanup
rm -f "/tmp/$DOMAIN.conf.work" "/tmp/$DOMAIN.conf.new" "/tmp/oauth-block.txt"

echo "📋 Log saved to: $LOG_FILE"
echo "📊 Summary: Check OAuth at https://green.flippi.ai/auth/google"