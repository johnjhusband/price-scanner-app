#!/bin/bash
# Direct fix for blue.flippi.ai nginx configuration
set -e

echo "=== Fixing blue.flippi.ai nginx configuration ==="

# The actual nginx config file on the server
CONFIG_FILE="/etc/nginx/sites-available/blue.flippi.ai"

# Check if the infra-nginx config exists and has growth routes
INFRA_CONFIG="/var/www/blue.flippi.ai/infra-nginx/sites/flippi-blue.conf"

if [ -f "$INFRA_CONFIG" ]; then
    echo "Found infra-nginx config at: $INFRA_CONFIG"
    
    # Check if it has growth routes
    if grep -q "location.*growth" "$INFRA_CONFIG"; then
        echo "✅ Config has growth routes"
        
        # Backup current config
        sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Copy the infra-nginx config to the actual nginx location
        sudo cp "$INFRA_CONFIG" "$CONFIG_FILE"
        echo "✅ Copied infra-nginx config to nginx"
        
        # Test configuration
        if sudo nginx -t; then
            echo "✅ Nginx configuration is valid"
            sudo systemctl reload nginx
            echo "✅ Nginx reloaded"
            
            # Test the route
            sleep 2
            echo ""
            echo "Testing /growth/questions..."
            RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -50)
            if echo "$RESPONSE" | grep -q "Questions Found"; then
                echo "✅ SUCCESS: Growth routes are working!"
            else
                echo "⚠️  Growth routes may still need time to propagate"
            fi
        else
            echo "❌ Nginx config invalid - restoring backup"
            LATEST_BACKUP=$(ls -t ${CONFIG_FILE}.backup.* | head -1)
            sudo cp "$LATEST_BACKUP" "$CONFIG_FILE"
            sudo systemctl reload nginx
        fi
    else
        echo "❌ ERROR: infra-nginx config missing growth routes"
    fi
else
    echo "❌ ERROR: infra-nginx config not found at $INFRA_CONFIG"
    echo "The deployment may not have pulled the latest code"
fi

echo ""
echo "=== Fix complete ==="