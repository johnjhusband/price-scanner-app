#!/bin/bash
# Fix nginx configuration to properly route legal pages

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

echo "=== Fixing nginx legal pages for $DOMAIN ==="

# Check if nginx config exists
if [ ! -f /etc/nginx/sites-available/$DOMAIN ]; then
    echo "ERROR: Nginx config not found at /etc/nginx/sites-available/$DOMAIN"
    exit 1
fi

# Backup current config
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.$(date +%Y%m%d_%H%M%S)

# Create a temporary file with the new configuration
TEMP_CONFIG="/tmp/nginx_$DOMAIN_legal_fix.conf"

# Read the current config and inject legal pages routes
sudo awk -v port="$PORT" '
/^[[:space:]]*location \/ \{/ {
    # Insert legal pages routes before the catch-all location /
    print "    # Legal pages - proxy to backend Express routes"
    print "    location = /terms {"
    print "        proxy_pass http://localhost:" port ";"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "    }"
    print ""
    print "    location = /privacy {"
    print "        proxy_pass http://localhost:" port ";"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "    }"
    print ""
    print "    location = /mission {"
    print "        proxy_pass http://localhost:" port ";"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "    }"
    print ""
    print "    location = /contact {"
    print "        proxy_pass http://localhost:" port ";"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "    }"
    print ""
}
{ print }
' /etc/nginx/sites-available/$DOMAIN > $TEMP_CONFIG

# Replace the original config
sudo mv $TEMP_CONFIG /etc/nginx/sites-available/$DOMAIN

# Update sites-enabled symlink
sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test the configuration
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "Configuration test passed. Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx configuration updated successfully!"
    
    # Test the endpoints
    echo ""
    echo "Testing legal pages endpoints:"
    for page in terms privacy mission contact; do
        echo -n "  /$page: "
        curl -s -o /dev/null -w "%{http_code}\n" http://localhost:$PORT/$page
    done
else
    echo "❌ Nginx configuration test failed! Rolling back..."
    # Find the most recent backup
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/$DOMAIN.backup.* | head -1)
    sudo cp $LATEST_BACKUP /etc/nginx/sites-available/$DOMAIN
    sudo systemctl reload nginx
    exit 1
fi