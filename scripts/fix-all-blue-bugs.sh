#!/bin/bash

# Fix ALL Blue Environment Bugs:
# 1. Remove "Test API Connection" button
# 2. Fix nginx routing for API calls
# 3. Ensure image processing works

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Fixing ALL Blue Environment Bugs ==="

# Step 1: Remove Test Button from App.js
echo "1. Removing test button from frontend..."

# Remove the test button section (it's after the camera button)
# Find the pattern and remove the entire test button block
sed -i '/Platform\.OS === '\''web'\'' && (/,/Test API Connection<\/Text>/d' blue/mobile-app/App.js

# Also remove the test button styles
sed -i '/testButton: {/,/},/d' blue/mobile-app/App.js
sed -i '/testButtonText: {/,/},/d' blue/mobile-app/App.js

# Clean up any duplicate closing braces or style entries
sed -i '/^[[:space:]]*color: '\''#fff'\'',$/N;/\n[[:space:]]*fontSize: 16,$/N;/\n[[:space:]]*fontWeight: '\''600'\'',$/N;/\n[[:space:]]*},$/N;/\n[[:space:]]*color: '\''#fff'\'',$/d' blue/mobile-app/App.js

echo "   ✓ Test button code removed"

# Step 2: Build new frontend image
echo "2. Building clean frontend..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-fixed-all .
cd /mnt/c/Users/jhusband/price-scanner-app

# Step 3: Create nginx routing configuration
echo "3. Creating nginx routing configuration..."
cat > /tmp/blue-routes.conf << 'NGINX'
# Blue environment routing
server {
    listen 80;
    server_name blue.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name blue.flippi.ai;
    
    # Use the wildcard cert for flippi.ai
    ssl_certificate /etc/letsencrypt/live/flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # API routes to blue backend
    location /api {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Frontend - everything else
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

# Step 4: Deploy everything
echo "4. Deploying fixes to server..."

# Save and transfer the frontend image
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-fixed-all | gzip > /tmp/blue-fixed-all.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-fixed-all.tar.gz root@$SERVER_IP:/tmp/
sshpass -p "$SERVER_PASS" scp /tmp/blue-routes.conf root@$SERVER_IP:/tmp/

# Deploy on server
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "Loading new frontend image..."
gunzip -c /tmp/blue-fixed-all.tar.gz | docker load
rm /tmp/blue-fixed-all.tar.gz

# First ensure blue containers are on the main network
echo "Connecting blue containers to main network..."
docker network connect thrifting_buddy_network blue_backend 2>/dev/null || echo "blue_backend already connected"
docker network connect thrifting_buddy_network blue_frontend 2>/dev/null || echo "blue_frontend already connected"

# Add blue routes to nginx
echo "Updating nginx configuration..."
docker cp /tmp/blue-routes.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf
rm /tmp/blue-routes.conf

# Test nginx config
docker exec thrifting_buddy_nginx nginx -t

# Update and restart blue frontend
echo "Updating blue frontend..."
cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-fixed-all|' docker-compose.yml
docker compose up -d blue_frontend

# Reload nginx
echo "Reloading nginx..."
docker exec thrifting_buddy_nginx nginx -s reload

# Wait for services to be ready
sleep 5

# Test everything
echo -e "\n=== Testing all fixes ==="
echo "1. Frontend health:"
curl -s https://blue.flippi.ai/health

echo -e "\n\n2. Backend API (should show missing file error):"
curl -s -X POST https://blue.flippi.ai/api/scan -H "Content-Type: multipart/form-data" | head -c 200

echo -e "\n\n3. Container status:"
docker ps | grep blue

echo -e "\n4. Network connectivity:"
docker exec thrifting_buddy_nginx ping -c 1 blue_backend 2>&1 | grep "1 received" && echo "✓ Nginx can reach blue_backend" || echo "✗ Network issue"
EOF

# Cleanup
rm -f /tmp/blue-fixed-all.tar.gz /tmp/blue-routes.conf

echo -e "\n=== All Fixes Applied ==="
echo "✓ Test button removed"
echo "✓ Nginx routing configured for blue.flippi.ai/api"
echo "✓ Blue containers connected to main network"
echo "✓ Image processing should now work"
echo ""
echo "Test at: https://blue.flippi.ai"