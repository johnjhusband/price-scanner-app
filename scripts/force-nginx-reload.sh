#!/bin/bash
# Force nginx to reload configuration
# Based on historical OAuth fix patterns

# Detect environment
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

echo "Force reloading nginx for $DOMAIN..."

# Check which config nginx is actually using
echo "Current nginx configuration source:"
nginx -T 2>/dev/null | grep -B2 "server_name $DOMAIN" | head -5

# Ensure sites-enabled is properly linked
if [ -f /etc/nginx/sites-available/$DOMAIN ]; then
    echo "Updating sites-enabled symlink..."
    sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
    echo "Symlink updated."
fi

# Clear any nginx cache
echo "Clearing nginx cache..."
sudo rm -rf /var/cache/nginx/*

# Test configuration
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "Configuration valid. Performing hard reload..."
    
    # Try reload first
    sudo nginx -s reload
    
    # If that doesn't work, restart
    if [ $? -ne 0 ]; then
        echo "Reload failed, performing full restart..."
        sudo systemctl restart nginx
    fi
    
    echo "Nginx reloaded successfully."
    
    # Verify it's serving the right content
    echo ""
    echo "Testing endpoints:"
    curl -s -o /dev/null -w "Health check: %{http_code}\n" http://localhost:3002/health || echo "Backend not responding"
    curl -s -o /dev/null -w "Frontend check: %{http_code}\n" http://localhost:8082/ || echo "Frontend not responding"
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

echo "Force reload complete."

# Also run legal pages configuration
echo ""
echo "Configuring legal pages..."
if [ -f /var/www/$DOMAIN/scripts/post-deploy-legal-pages.sh ]; then
    bash /var/www/$DOMAIN/scripts/post-deploy-legal-pages.sh $DOMAIN || echo "Legal pages configuration failed"
else
    echo "Legal pages script not found, skipping..."
fi