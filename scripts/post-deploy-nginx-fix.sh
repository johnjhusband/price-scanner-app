#!/bin/bash
# Temporary fix script to clean up duplicate nginx locations

# Detect environment based on current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
else
    echo "Unknown environment, exiting"
    exit 0
fi

echo "Fixing nginx configuration for $DOMAIN..."

# Check if there are duplicate location blocks
PRIVACY_COUNT=$(grep -c "location = /privacy" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "0")

if [ "$PRIVACY_COUNT" -gt 1 ]; then
    echo "Found $PRIVACY_COUNT duplicate /privacy location blocks. Creating cleaned config..."
    
    # Backup current config
    sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.fix.$(date +%Y%m%d_%H%M%S)
    
    # Create a cleaned version by removing all legal page locations first
    # then adding them back only once
    sudo cp /etc/nginx/sites-available/$DOMAIN /tmp/nginx-$DOMAIN-temp
    
    # Remove all existing legal page locations
    sudo sed -i '/location = \/terms {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/privacy {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/mission {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/contact {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    
    # Copy cleaned config back
    sudo cp /tmp/nginx-$DOMAIN-temp /etc/nginx/sites-available/$DOMAIN
    
    echo "Removed duplicate locations. Testing nginx config..."
    
    # Test nginx config
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx configuration fixed and reloaded!"
    else
        echo "ERROR: Nginx config test failed! Restoring backup..."
        sudo cp /etc/nginx/sites-available/$DOMAIN.backup.fix.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/$DOMAIN
        exit 1
    fi
else
    echo "No duplicate locations found."
fi

echo "Nginx fix complete."