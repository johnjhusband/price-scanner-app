#!/bin/bash
# Ensure growth routes are in nginx config and working
set -e

echo "=== Ensuring growth routes work on blue.flippi.ai ==="

CONFIG_FILE="/etc/nginx/sites-available/blue.flippi.ai"

# Check current state
echo "Checking if growth routes exist in nginx config..."
if sudo grep -q "location /growth" "$CONFIG_FILE"; then
    echo "Growth routes found in config"
    
    # Test if they're actually working
    RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -50)
    if echo "$RESPONSE" | grep -q "Questions Found"; then
        echo "✅ Growth routes are working correctly!"
        exit 0
    else
        echo "❌ Growth routes in config but not working - may need nginx reload"
    fi
else
    echo "❌ Growth routes NOT found in nginx config - adding them now"
fi

# Add growth routes if missing or not working
echo ""
echo "Adding/fixing growth routes..."

# Create a temporary file with the growth location block
cat > /tmp/growth-location.conf << 'EOF'
    # Growth routes (added by ensure-growth-routes-work.sh)
    location /growth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Backup current config
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# If growth routes don't exist, add them before the catch-all location /
if ! sudo grep -q "location /growth" "$CONFIG_FILE"; then
    echo "Inserting growth routes into nginx config..."
    
    # Find the line number of "location / {" (the catch-all)
    LINE_NUM=$(sudo grep -n "location / {" "$CONFIG_FILE" | head -1 | cut -d: -f1)
    
    if [ -n "$LINE_NUM" ]; then
        # Insert growth routes before the catch-all
        sudo sed -i "${LINE_NUM}i\\$(cat /tmp/growth-location.conf)" "$CONFIG_FILE"
        echo "✅ Growth routes added to config"
    else
        echo "❌ ERROR: Could not find catch-all location /"
        exit 1
    fi
fi

# Test configuration
echo ""
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx || sudo nginx -s reload
    echo "✅ Nginx reloaded"
    
    # Wait and verify
    echo ""
    echo "Verifying growth routes work..."
    sleep 3
    
    RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -50)
    if echo "$RESPONSE" | grep -q "Questions Found"; then
        echo "✅ SUCCESS: Growth routes are now working!"
        echo "The /growth/questions page is serving backend content."
    else
        echo "❌ FAILED: Growth routes still not working"
        echo "The issue may be more complex than just nginx config"
        exit 1
    fi
else
    echo "❌ ERROR: Invalid nginx configuration"
    # Restore backup
    LATEST_BACKUP=$(ls -t ${CONFIG_FILE}.backup.* | head -1)
    sudo cp "$LATEST_BACKUP" "$CONFIG_FILE"
    sudo nginx -s reload
    echo "Restored previous configuration"
    exit 1
fi

# Clean up
rm -f /tmp/growth-location.conf

echo ""
echo "=== Growth routes verified and working ==="