#!/bin/bash

# Initial Let's Encrypt setup for nginx
echo "=== Initializing Let's Encrypt for app.flippi.ai ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
DOMAIN="app.flippi.ai"
EMAIL="admin@flippi.ai"

echo "1. Creating initial nginx config for cert generation..."
cat > nginx/nginx-init.conf << 'EOF'
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
EOF

echo "2. Copying files to server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP 'mkdir -p /root/price-scanner-app/deployment/nginx /root/price-scanner-app/deployment/certbot'
sshpass -p "$SERVER_PASS" scp nginx/nginx-init.conf root@$SERVER_IP:/root/price-scanner-app/deployment/nginx/nginx.conf
sshpass -p "$SERVER_PASS" scp docker-compose-nginx.yml root@$SERVER_IP:/root/price-scanner-app/deployment/

echo "3. Starting nginx for initial cert..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Stop old containers
docker compose -f docker-compose-letsencrypt.yml down 2>/dev/null

# Create certbot directories
mkdir -p certbot/conf certbot/www

# Start only nginx for cert generation
docker run -d --name temp_nginx \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/certbot/www:/var/www/certbot:ro \
  nginx:alpine

# Wait for nginx
sleep 5

# Get initial certificate
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@flippi.ai \
  --agree-tos \
  --no-eff-email \
  -d app.flippi.ai

# Stop temp nginx
docker stop temp_nginx
docker rm temp_nginx
EOF

echo "4. Copying full nginx config..."
sshpass -p "$SERVER_PASS" scp nginx/nginx.conf root@$SERVER_IP:/root/price-scanner-app/deployment/nginx/

echo "5. Starting full stack with nginx..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment
docker compose -f docker-compose-nginx.yml up -d
docker ps
EOF

echo "=== Setup Complete ==="
echo "Your app should now be available at https://app.flippi.ai"