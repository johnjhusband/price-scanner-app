#!/bin/bash
# Force the growth route fix to apply immediately
# This script triggers a minimal re-deployment to apply the nginx fixes

echo "=== Forcing Growth Route Fix ==="
echo "This will trigger the deployment scripts to fix the nginx routing"
echo ""

# Change to the blue.flippi.ai directory
cd /var/www/blue.flippi.ai || exit 1

# Pull the latest scripts
echo "1. Pulling latest scripts from repository..."
git pull origin develop || git fetch origin develop && git reset --hard origin/develop

# Make sure we have the latest ensure-growth-routes.sh
echo ""
echo "2. Checking for ensure-growth-routes.sh..."
if [ ! -f scripts/ensure-growth-routes.sh ]; then
    echo "Creating ensure-growth-routes.sh..."
    cat > scripts/ensure-growth-routes.sh << 'EOF'
#!/bin/bash
# Ensure growth routes are configured in nginx
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
else
    echo "❌ Nginx config has errors!"
    nginx -t
fi

echo ""
echo "=== Growth routes check complete ==="
EOF
    chmod +x scripts/ensure-growth-routes.sh
fi

# Run the post-deploy script
echo ""
echo "3. Running post-deploy-nginx-fix.sh..."
if [ -f scripts/post-deploy-nginx-fix.sh ]; then
    bash scripts/post-deploy-nginx-fix.sh
else
    echo "post-deploy-nginx-fix.sh not found, running ensure-growth-routes.sh directly..."
    bash scripts/ensure-growth-routes.sh
fi

# Double-check by running ensure-growth-routes directly
echo ""
echo "4. Double-checking with ensure-growth-routes.sh..."
bash scripts/ensure-growth-routes.sh

# Test the result
echo ""
echo "5. Testing the fix..."
sleep 2

# Check nginx config
echo "Nginx growth location check:"
grep -A5 "location /growth" /etc/nginx/sites-available/blue.flippi.ai || echo "Growth location NOT FOUND in nginx!"

# Test the actual route
echo ""
echo "Testing https://blue.flippi.ai/growth/questions..."
RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -20)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ SUCCESS: Growth route is working!"
else
    echo "❌ FAILED: Still getting React app"
    echo ""
    echo "Manual fix required:"
    echo "1. Edit /etc/nginx/sites-available/blue.flippi.ai"
    echo "2. Add this BEFORE 'location / {' line:"
    echo ""
    echo "    # Growth routes"
    echo "    location /growth {"
    echo "        proxy_pass http://localhost:3002;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
    echo ""
    echo "3. Run: nginx -t && nginx -s reload"
fi

echo ""
echo "=== Force fix complete ==="