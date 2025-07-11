#!/bin/bash

# Initialize blue.flippi.ai environment
echo "=== Setting up blue.flippi.ai development environment ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
DOMAIN="blue.flippi.ai"

echo "Please ensure DNS A record for blue.flippi.ai points to $SERVER_IP"
echo "Press Enter to continue..."
read

echo "1. Creating blue nginx config for cert generation..."
cat > nginx/nginx-blue-init.conf << 'EOF'
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
EOF

echo "2. Copying files to server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP 'mkdir -p /root/price-scanner-app/deployment/nginx /root/price-scanner-app/deployment/certbot-blue'
sshpass -p "$SERVER_PASS" scp nginx/nginx-blue-init.conf root@$SERVER_IP:/root/price-scanner-app/deployment/nginx/nginx-blue.conf
sshpass -p "$SERVER_PASS" scp docker-compose-nginx-blue.yml root@$SERVER_IP:/root/price-scanner-app/deployment/

echo "3. Getting certificate for blue.flippi.ai..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Create certbot directories
mkdir -p certbot-blue/conf certbot-blue/www

# Start temp nginx for cert generation
docker run -d --name temp_nginx_blue \
  -p 8080:80 \
  -v $(pwd)/nginx/nginx-blue.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/certbot-blue/www:/var/www/certbot:ro \
  nginx:alpine

# Wait for nginx
sleep 5

# Get certificate for blue.flippi.ai
docker run --rm \
  -v $(pwd)/certbot-blue/conf:/etc/letsencrypt \
  -v $(pwd)/certbot-blue/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@flippi.ai \
  --agree-tos \
  --no-eff-email \
  -d blue.flippi.ai

# Stop temp nginx
docker stop temp_nginx_blue
docker rm temp_nginx_blue
EOF

echo "4. Copying full blue nginx config..."
sshpass -p "$SERVER_PASS" scp nginx/nginx-blue.conf root@$SERVER_IP:/root/price-scanner-app/deployment/nginx/

echo "=== Blue environment setup complete ==="
echo "Note: Blue containers will run alongside green containers on different ports"
echo "Use deploy-blue.sh to deploy the blue environment"