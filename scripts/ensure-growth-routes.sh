#!/bin/bash
# Ensure growth routes are configured in nginx
# This script is run automatically during deployment

echo "=== Ensuring growth routes in nginx configs ==="

# Function to add growth routes to a domain config
ensure_growth_routes() {
    local DOMAIN=$1
    local PORT=$2
    local CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "  Config file not found: $CONFIG_FILE"
        return
    fi
    
    echo "Processing $DOMAIN (port $PORT)..."
    
    # Check if growth routes already exist
    if grep -q "location /growth" "$CONFIG_FILE"; then
        echo "  ✅ Growth routes already configured for $DOMAIN"
    else
        echo "  Adding growth routes to $DOMAIN..."
        
        # Find the line number of "location / {" 
        LINE_NUM=$(grep -n "location / {" "$CONFIG_FILE" | head -1 | cut -d: -f1)
        
        if [ -n "$LINE_NUM" ]; then
            # Insert growth routes before the catch-all location /
            sed -i "${LINE_NUM}i\\
\\
    # Growth routes\\
    location /growth {\\
        proxy_pass http://localhost:${PORT};\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }\\
" "$CONFIG_FILE"
            echo "  ✅ Added growth routes to $DOMAIN"
        else
            echo "  ❌ Could not find 'location /' in $DOMAIN config"
        fi
    fi
}

# Ensure routes for each environment
ensure_growth_routes "blue.flippi.ai" "3002"
ensure_growth_routes "green.flippi.ai" "3001"
ensure_growth_routes "app.flippi.ai" "3000"

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if nginx -t 2>&1; then
    echo "✅ Nginx config is valid"
    echo "Reloading nginx..."
    nginx -s reload
    echo "✅ Nginx reloaded successfully"
    
    # Test the routes
    echo ""
    echo "Testing growth routes..."
    sleep 2
    
    for DOMAIN in blue.flippi.ai green.flippi.ai app.flippi.ai; do
        if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions 2>/dev/null || echo "000")
            echo "$DOMAIN/growth/questions: HTTP $RESPONSE"
        fi
    done
else
    echo "❌ Nginx config has errors!"
    nginx -t
fi

echo ""
echo "=== Growth routes check complete ==="