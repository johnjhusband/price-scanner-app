#!/bin/bash
# Verify which nginx configuration is actually active

DOMAIN=$(basename $(pwd))

echo "=== Verifying Active Nginx Configuration for $DOMAIN ==="
echo ""

# Check nginx version and compile options
echo "1. Nginx version and configuration:"
sudo nginx -V 2>&1 | head -5
echo ""

# Check which config files are being loaded
echo "2. Main nginx config file:"
sudo nginx -t 2>&1 | grep "configuration file"
echo ""

# Check if our domain config is actually included
echo "3. Checking if $DOMAIN config is included:"
sudo grep -r "include.*sites-enabled" /etc/nginx/nginx.conf
echo ""

# Check what's in sites-enabled
echo "4. Files in sites-enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""

# Check if our symlink is correct
echo "5. Checking symlink for $DOMAIN:"
ls -la /etc/nginx/sites-enabled/$DOMAIN
echo ""

# Dump the ACTUAL running config and look for our domain
echo "6. Searching for $DOMAIN in active config:"
sudo nginx -T 2>/dev/null | grep -A 5 "server_name.*$DOMAIN" | head -20
echo ""

# Look for /terms in the active config
echo "7. Searching for /terms location in active config:"
sudo nginx -T 2>/dev/null | grep -B 2 -A 10 "location.*terms"
echo ""

# Check if there are multiple server blocks for our domain
echo "8. Count of server blocks for $DOMAIN:"
sudo nginx -T 2>/dev/null | grep -c "server_name.*$DOMAIN"
echo ""

# Show the actual path being used for our domain
echo "9. Actual config being used (first 50 lines of our server block):"
sudo nginx -T 2>/dev/null | grep -A 50 "server_name.*$DOMAIN" | head -50
echo ""

# Check default site
echo "10. Checking if default site exists:"
ls -la /etc/nginx/sites-enabled/default 2>/dev/null || echo "No default site"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "If /terms is not found in the active config above, then:"
echo "- The config file may not be properly linked in sites-enabled"
echo "- There may be a syntax error preventing the config from loading"
echo "- Another server block may be taking precedence"