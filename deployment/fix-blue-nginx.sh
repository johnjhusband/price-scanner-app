#!/bin/bash

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Fixing Blue Nginx Certificate Path ==="

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. Fixing certificate structure..."
mkdir -p certbot-blue/conf/live/blue.flippi.ai
cp -r certbot/conf/live/blue.flippi.ai/* certbot-blue/conf/live/blue.flippi.ai/ 2>/dev/null || true
cp -r certbot/conf/archive certbot-blue/conf/ 2>/dev/null || true

echo "2. Creating proper blue nginx config..."
cat > nginx/nginx-blue.conf << 'NGINX'
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
    
    # SSL certificates - using shared production certs
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # API routes
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
    
    # Health check
    location /health {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Frontend - everything else
    location / {
        proxy_pass http://frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

echo "3. Using shared nginx approach..."
# Stop blue nginx and use production nginx for both
docker compose -f docker-compose-nginx-blue.yml stop nginx

# Add blue config to production nginx
docker cp nginx/nginx-blue.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf
docker exec thrifting_buddy_nginx nginx -s reload

echo "4. Testing blue.flippi.ai..."
sleep 3
curl -k https://blue.flippi.ai/health || echo "Blue health check failed"

echo "=== Blue should now be working at https://blue.flippi.ai ==="
EOF