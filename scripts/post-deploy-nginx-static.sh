#!/bin/bash
# Post-deployment nginx configuration fix
# This runs automatically after deployment to ensure static files are served correctly

DOMAIN=${1:-blue.flippi.ai}
PORT=${2:-3002}

echo "=== Post-Deploy Nginx Static File Fix ==="
echo "Ensuring static files are served correctly for $DOMAIN"

# Check if nginx config exists
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_SITE" ]; then
    echo "Error: Nginx site config not found at $NGINX_SITE"
    exit 1
fi

# Create backup
sudo cp "$NGINX_SITE" "$NGINX_SITE.backup.$(date +%s)"

# Check if static file rules already exist
if grep -q "location /_expo/" "$NGINX_SITE"; then
    echo "Static file rules already present"
else
    echo "Adding static file rules..."
    
    # Create temporary file with proper static file handling
    # Insert these rules BEFORE the catch-all location /
    sudo awk '
    /location \/ {/ {
        print "    # Serve Expo static files"
        print "    location /_expo/ {"
        print "        expires 1y;"
        print "        add_header Cache-Control \"public, immutable\";"
        print "        try_files $uri =404;"
        print "    }"
        print ""
        print "    # Serve other static assets"
        print "    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {"
        print "        expires 1y;"
        print "        add_header Cache-Control \"public, immutable\";"
        print "        try_files $uri =404;"
        print "    }"
        print ""
    }
    { print }
    ' "$NGINX_SITE" > "$NGINX_SITE.new"
    
    # Replace original with new config
    sudo mv "$NGINX_SITE.new" "$NGINX_SITE"
fi

# Test nginx configuration
if sudo nginx -t; then
    echo "✅ Nginx configuration valid"
    sudo nginx -s reload
    echo "✅ Nginx reloaded"
    
    # Verify fix worked
    sleep 2
    echo ""
    echo "Verifying static file serving..."
    
    # Check if JS files are being served correctly (should NOT return HTML)
    CONTENT_TYPE=$(curl -s -I "https://$DOMAIN/_expo/static/js/web/AppEntry-0ebd685d4b8a96c38ce187bfb06d785c.js" | grep -i "content-type" | head -1)
    
    if [[ "$CONTENT_TYPE" == *"javascript"* ]]; then
        echo "✅ Static files serving correctly!"
    else
        echo "⚠️  Static files may still be returning HTML. Manual intervention may be required."
        echo "Content-Type detected: $CONTENT_TYPE"
    fi
else
    echo "❌ Nginx configuration invalid! Rolling back..."
    sudo mv "$NGINX_SITE.backup.$(date +%s)" "$NGINX_SITE"
    sudo nginx -s reload
    exit 1
fi

echo ""
echo "=== Post-deploy nginx fix complete ==="