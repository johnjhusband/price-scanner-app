#!/bin/bash
# Fix legal pages routing by ensuring they're proxied to backend

set -e

# Detect environment based on current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
else
    echo "Unknown environment, exiting"
    exit 0
fi

echo "=== Fixing legal pages for $DOMAIN ==="

# Test if backend is serving legal pages
echo "Testing backend legal pages endpoints..."
for page in terms privacy mission contact; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/$page || echo "000")
    echo "Backend /$page response: $RESPONSE"
done

echo ""
echo "IMPORTANT: Legal pages must be configured in nginx to proxy to the backend."
echo "The backend Express server has middleware to serve these pages."
echo ""
echo "Required nginx configuration for each legal page:"
echo "  location = /terms {"
echo "      proxy_pass http://localhost:$PORT;"
echo "      proxy_http_version 1.1;"
echo "      proxy_set_header Host \$host;"
echo "      proxy_set_header X-Real-IP \$remote_addr;"
echo "      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "      proxy_set_header X-Forwarded-Proto \$scheme;"
echo "  }"
echo ""
echo "These location blocks must appear BEFORE any catch-all location / block."
echo ""

# If we have sudo access, offer to update nginx
if sudo -n true 2>/dev/null; then
    echo "Would you like to automatically update nginx configuration? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        # Backup current config
        sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.legal.$(date +%Y%m%d_%H%M%S)
        
        echo "Creating updated nginx configuration..."
        # This would need actual implementation to modify the nginx config
        echo "Manual intervention required to properly position the location blocks."
    fi
else
    echo "No sudo access. Manual nginx configuration update required."
fi

echo ""
echo "After updating nginx, run: sudo nginx -t && sudo systemctl reload nginx"