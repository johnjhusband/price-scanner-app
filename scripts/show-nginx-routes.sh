#!/bin/bash
# Show the actual nginx route blocks for debugging

DOMAIN=$(basename $(pwd))

echo "=== Current Nginx Routes for $DOMAIN ==="
echo ""

echo "1. RAW CONFIG FILE (/etc/nginx/sites-available/$DOMAIN):"
echo "==========================================="
if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    sudo cat /etc/nginx/sites-available/$DOMAIN
else
    echo "File not found!"
fi
echo ""
echo "==========================================="
echo ""

echo "2. ACTIVE CONFIG (from nginx -T) - Only location blocks:"
echo "==========================================="
sudo nginx -T 2>/dev/null | awk '/server_name.*'$DOMAIN'/{p=1} p && /location/{print; getline; while($0 !~ /location/ && $0 !~ /^}/ && $0 !~ /server/) {print; getline} print ""}'
echo "==========================================="
echo ""

echo "3. LOCATION BLOCKS ORDER in sites-available/$DOMAIN:"
echo "==========================================="
sudo grep -n "location" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "No location blocks found"
echo "==========================================="
echo ""

echo "4. SYMLINK STATUS:"
echo "==========================================="
ls -la /etc/nginx/sites-enabled/$DOMAIN 2>/dev/null || echo "No symlink in sites-enabled!"
echo "==========================================="
echo ""

echo "5. NGINX CONFIG TEST:"
echo "==========================================="
sudo nginx -t
echo "==========================================="