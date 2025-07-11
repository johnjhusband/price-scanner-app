#!/bin/bash

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== FIXING PRODUCTION - NO MORE BULLSHIT ==="

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. STOPPING EVERYTHING"
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker network prune -f

echo "2. RESTORING ORIGINAL SIMPLE NGINX CONFIG"
cat > nginx/nginx.conf << 'NGINX'
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
NGINX

echo "3. REMOVING ALL BLUE SHIT"
rm -f nginx/nginx-blue*.conf
rm -f docker-compose-nginx-blue.yml.backup

echo "4. STARTING ONLY PRODUCTION"
docker compose -f docker-compose-nginx.yml up -d

echo "5. WAITING FOR SERVICES"
sleep 15

echo "6. VERIFYING PRODUCTION IS UP"
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "Testing health endpoint:"
curl -s https://app.flippi.ai/health && echo -e "\n\nPRODUCTION IS WORKING" || echo -e "\n\nPRODUCTION STILL BROKEN"

echo "7. CHECKING NGINX LOGS IF BROKEN"
docker logs thrifting_buddy_nginx 2>&1 | tail -10

echo ""
echo "=== DONE. PRODUCTION SHOULD BE AT https://app.flippi.ai ==="
echo "=== BLUE IS DEAD. WE'LL DEAL WITH IT LATER ==="
EOF