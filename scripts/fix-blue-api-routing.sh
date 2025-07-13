#!/bin/bash

# Fix Blue API Routing
# The issue is that /api/scan requests to blue.flippi.ai aren't being routed to blue_backend

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Fixing Blue API Routing ==="

# First, check current nginx config
echo "1. Checking current nginx configuration..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "Current nginx config for blue:"
docker exec thrifting_buddy_nginx cat /etc/nginx/conf.d/default.conf | grep -B2 -A20 "blue.flippi.ai" || echo "No blue config found in default.conf"

echo -e "\nChecking all nginx configs:"
docker exec thrifting_buddy_nginx ls -la /etc/nginx/conf.d/
docker exec thrifting_buddy_nginx find /etc/nginx -name "*.conf" -exec grep -l "blue.flippi.ai" {} \;
EOF

# Check if blue is using a separate nginx config
echo -e "\n2. Checking blue's nginx routing..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
# Find the config file that handles blue.flippi.ai
config_file=$(docker exec thrifting_buddy_nginx find /etc/nginx -name "*.conf" -exec grep -l "blue.flippi.ai" {} \; | head -1)
if [ -n "$config_file" ]; then
    echo "Found blue config in: $config_file"
    echo "Blue server block:"
    docker exec thrifting_buddy_nginx cat "$config_file" | grep -A30 "server_name.*blue.flippi.ai"
else
    echo "No blue.flippi.ai config found!"
fi

# Check if blue_backend is running
echo -e "\nBlue backend status:"
docker ps | grep blue_backend
EOF

# Create proper nginx config for blue
echo -e "\n3. Creating fixed nginx config for blue..."
cat > /tmp/blue-nginx.conf << 'NGINX'
server {
    listen 443 ssl http2;
    server_name blue.flippi.ai;

    ssl_certificate /etc/letsencrypt/live/flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flippi.ai/privkey.pem;

    # API routes to blue backend
    location /api {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Everything else to blue frontend
    location / {
        proxy_pass http://blue_frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Deploy the fix
echo "4. Deploying nginx fix..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-nginx.conf root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
# Backup current config
docker exec thrifting_buddy_nginx cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup

# Add blue config to nginx
docker cp /tmp/blue-nginx.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf

# Test nginx config
docker exec thrifting_buddy_nginx nginx -t

# Reload nginx
docker exec thrifting_buddy_nginx nginx -s reload

echo "Testing blue routing..."
sleep 2

# Test health endpoint
echo -e "\nHealth check:"
curl -s https://blue.flippi.ai/health

# Test if API endpoint is reachable
echo -e "\n\nAPI test (should return error about missing image):"
curl -s -X POST https://blue.flippi.ai/api/scan | head -c 100
EOF

rm -f /tmp/blue-nginx.conf

echo -e "\n\n=== Blue API routing should now work ==="
echo "Test at https://blue.flippi.ai"
echo "The /api/* and /health routes now go to blue_backend"
echo "Everything else goes to blue_frontend"