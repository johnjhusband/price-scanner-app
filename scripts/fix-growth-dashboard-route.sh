#!/bin/bash
# Fix Growth Dashboard routing issue

echo "=== Fixing Growth Dashboard Route ==="

# Add specific nginx rule for /growth/questions to go to backend
NGINX_CONF="/etc/nginx/sites-available/blue.flippi.ai"

if [ -f "$NGINX_CONF" ]; then
    # Check if the specific route exists
    if ! grep -q "location = /growth/questions" "$NGINX_CONF"; then
        echo "Adding specific route for /growth/questions..."
        
        # Insert before the general /growth location
        sudo sed -i '/location \/growth {/i\
    # Specific route for growth questions page\
    location = /growth/questions {\
        proxy_pass http://localhost:3002;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' "$NGINX_CONF"
        
        sudo nginx -t && sudo nginx -s reload
        echo "✅ Growth Dashboard route fixed"
    else
        echo "Growth Dashboard route already exists"
    fi
else
    echo "❌ Nginx config not found"
fi

echo ""
echo "Testing route..."
curl -s -o /dev/null -w "Growth Dashboard: HTTP %{http_code}\n" https://blue.flippi.ai/growth/questions