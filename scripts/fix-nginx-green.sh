#!/bin/bash

# Fix nginx configuration after SSL certificate generation

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Fixing Nginx Configuration ==="

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "1. Checking current nginx configuration files..."
docker exec thrifting_buddy_nginx ls -la /etc/nginx/conf.d/

echo -e "\n2. Checking what's looking for flippi.ai certificate..."
docker exec thrifting_buddy_nginx grep -r "flippi.ai" /etc/nginx/conf.d/ || true

echo -e "\n3. Removing any config that references non-existent flippi.ai cert..."
docker exec thrifting_buddy_nginx find /etc/nginx/conf.d/ -name "*.conf" -exec grep -l "/etc/letsencrypt/live/flippi.ai/" {} \; | while read conf; do
    echo "Removing problematic config: $conf"
    docker exec thrifting_buddy_nginx rm "$conf"
done

echo -e "\n4. Verifying green.conf is using correct certificate..."
docker exec thrifting_buddy_nginx cat /etc/nginx/conf.d/green.conf | grep ssl_certificate

echo -e "\n5. Testing nginx configuration..."
docker exec thrifting_buddy_nginx nginx -t

echo -e "\n6. Reloading nginx..."
docker exec thrifting_buddy_nginx nginx -s reload

echo -e "\n7. Checking nginx status..."
docker exec thrifting_buddy_nginx ps aux | grep nginx

echo -e "\n=== Testing Green Site ==="
sleep 3

echo "1. Testing HTTPS connection..."
curl -I https://green.flippi.ai 2>&1 | grep -E "(HTTP|SSL|certificate)" | head -5

echo -e "\n2. Testing health endpoint..."
curl -s https://green.flippi.ai/health && echo "" || echo "Health check failed"

echo -e "\n3. Testing main page..."
curl -s https://green.flippi.ai | grep -o "<title>.*</title>" | head -1
EOF

echo -e "\n=== Done ==="
echo "✅ Nginx should now be properly configured for green.flippi.ai"