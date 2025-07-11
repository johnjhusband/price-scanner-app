#!/bin/bash

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Comprehensive Fix - Production and Blue ==="

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. Cleaning up everything..."
docker compose -f docker-compose-nginx.yml down
docker compose -f docker-compose-nginx-blue.yml down

echo "2. Fixing nginx configs..."
# Production nginx config
cat > nginx/nginx.conf << 'PRODCONF'
# Production - app.flippi.ai
server {
    listen 80;
    server_name app.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name app.flippi.ai;
    
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location /api {
        proxy_pass http://backend:3000;
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
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location / {
        proxy_pass http://frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Blue - blue.flippi.ai
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
    
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location /api {
        proxy_pass http://thrifting_buddy_api_blue:3000;
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
        proxy_pass http://thrifting_buddy_api_blue:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location / {
        proxy_pass http://thrifting_buddy_frontend_blue:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
PRODCONF

echo "3. Starting production..."
docker compose -f docker-compose-nginx.yml up -d

echo "4. Starting blue containers (without nginx)..."
docker compose -f docker-compose-nginx-blue.yml up -d backend frontend certbot

echo "5. Connecting blue containers to production network..."
docker network connect thrifting_buddy_network thrifting_buddy_api_blue
docker network connect thrifting_buddy_network thrifting_buddy_frontend_blue

echo "6. Waiting for services..."
sleep 10

echo "7. Testing both environments..."
echo "Production test:"
curl -s https://app.flippi.ai/health || echo "Production failed"
echo -e "\nBlue test:"
curl -s https://blue.flippi.ai/health || echo "Blue failed"

echo -e "\n8. Current status:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo -e "\n=== Fix complete ==="
echo "Production: https://app.flippi.ai"
echo "Blue Dev: https://blue.flippi.ai"
EOF