#!/bin/bash
# Fix growth routes in nginx configuration

echo "=== Fixing growth routes in nginx configs ==="

# Function to add growth routes to a domain
add_growth_routes() {
    local DOMAIN=$1
    local PORT=$2
    
    echo "Processing $DOMAIN (port $PORT)..."
    
    # Create a temporary file with the new location block
    cat > /tmp/growth-routes.txt << 'EOF'
    # Growth routes
    location /growth {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF
    
    # Replace the port placeholder
    sed -i "s/PORT_PLACEHOLDER/$PORT/g" /tmp/growth-routes.txt
    
    # Check if growth routes already exist
    if grep -q "location /growth" /etc/nginx/sites-available/$DOMAIN; then
        echo "  Growth routes already exist for $DOMAIN"
    else
        # Find the line number of "location / {" and insert before it
        LINE_NUM=$(grep -n "location / {" /etc/nginx/sites-available/$DOMAIN | head -1 | cut -d: -f1)
        
        if [ -n "$LINE_NUM" ]; then
            # Insert the growth routes before the catch-all location
            sed -i "${LINE_NUM}r /tmp/growth-routes.txt" /etc/nginx/sites-available/$DOMAIN
            echo "  ✅ Added growth routes to $DOMAIN"
        else
            echo "  ❌ Could not find location / block in $DOMAIN config"
        fi
    fi
    
    rm -f /tmp/growth-routes.txt
}

# Add routes for each environment
if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    add_growth_routes "blue.flippi.ai" "3002"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    add_growth_routes "green.flippi.ai" "3001"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    add_growth_routes "app.flippi.ai" "3000"
fi

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx config is valid"
    echo "Reloading nginx..."
    nginx -s reload
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx config has errors!"
    exit 1
fi

# Test the routes
echo ""
echo "Testing growth routes..."
sleep 2

test_route() {
    local DOMAIN=$1
    local RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions)
    echo "$DOMAIN/growth/questions: HTTP $RESPONSE"
    
    if [ "$RESPONSE" = "200" ]; then
        # Check if it's the backend response or React app
        if curl -s https://$DOMAIN/growth/questions | grep -q "Questions Found - Manual Blog Post Selection"; then
            echo "  ✅ Backend route working correctly"
        else
            echo "  ⚠️  Getting React app instead of backend"
        fi
    fi
}

if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    test_route "blue.flippi.ai"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    test_route "green.flippi.ai"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    test_route "app.flippi.ai"
fi

echo ""
echo "=== Growth routes fix complete ==="