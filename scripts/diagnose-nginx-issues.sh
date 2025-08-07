#!/bin/bash
# Diagnose common nginx configuration issues

DOMAIN=$(basename $(pwd))

echo "=== Nginx Configuration Diagnosis for $DOMAIN ==="
echo ""

# Check for syntax errors
echo "1. Checking for syntax errors:"
sudo nginx -t
echo ""

# Check for duplicate location blocks
echo "2. Checking for duplicate location blocks:"
echo "Count of 'location /' blocks:"
sudo grep -c "location / {" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "0"
echo "Count of 'location = /terms' blocks:"
sudo grep -c "location = /terms" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "0"
echo ""

# Check if there's a default catch-all server
echo "3. Checking for default server blocks that might intercept requests:"
sudo nginx -T 2>/dev/null | grep -B 5 "default_server" | grep -v "^#"
echo ""

# Check if the correct ports are being used
echo "4. Checking listen directives for $DOMAIN:"
sudo grep -E "listen|server_name" /etc/nginx/sites-available/$DOMAIN 2>/dev/null | grep -v "^#"
echo ""

# Check for conflicting server names
echo "5. Checking all server_name directives in nginx:"
sudo find /etc/nginx -name "*.conf" -o -name "*" -type f | xargs grep -h "server_name" 2>/dev/null | grep -v "^#" | sort | uniq
echo ""

# Check the order of location blocks
echo "6. Order of location blocks in $DOMAIN config:"
sudo grep -n "location" /etc/nginx/sites-available/$DOMAIN 2>/dev/null | grep -v "^#"
echo ""

# Check if config file has correct permissions
echo "7. File permissions:"
ls -la /etc/nginx/sites-available/$DOMAIN 2>/dev/null
ls -la /etc/nginx/sites-enabled/$DOMAIN 2>/dev/null
echo ""

# Check nginx error log for recent issues
echo "8. Recent nginx errors (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"
echo ""

# Check if the backend is actually running on expected port
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "9. Checking if backend is running on port $PORT:"
sudo netstat -tlnp | grep ":$PORT" || echo "Nothing listening on port $PORT"
echo ""

# Show the exact location / block that's catching everything
echo "10. The catch-all 'location /' block (if it exists):"
sudo awk '/location \/ \{/{p=1} p{print} /^\s*\}/{if(p) exit}' /etc/nginx/sites-available/$DOMAIN 2>/dev/null
echo ""

echo "=== Common Issues Found ==="
if sudo nginx -T 2>/dev/null | grep -q "location = /terms"; then
    echo "✓ Legal pages routes ARE in the active configuration"
else
    echo "✗ Legal pages routes are NOT in the active configuration!"
    echo "  This means either:"
    echo "  - The config file is not properly linked"
    echo "  - There's a syntax error preventing it from loading"
    echo "  - The routes are not in the config file"
fi