#!/bin/bash

# Deploy script for blue environment
echo "=== Deploying Blue Environment (dev) ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
SUDO_PASS="a"

# Build and transfer backend
echo "1. Building blue backend..."
cd /mnt/c/Users/jhusband/price-scanner-app/backend
echo $SUDO_PASS | sudo -S docker build -f Dockerfile.backend-blue -t thrifting-buddy/backend:blue .

echo "2. Building blue frontend..."
cd /mnt/c/Users/jhusband/price-scanner-app/mobile-app
echo $SUDO_PASS | sudo -S docker build -f Dockerfile.frontend-blue -t thrifting-buddy/frontend:blue .

echo "3. Saving images..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $SUDO_PASS | sudo -S docker save thrifting-buddy/backend:blue thrifting-buddy/frontend:blue | gzip > /tmp/blue-images.tar.gz

echo "4. Transferring to server..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-images.tar.gz root@$SERVER_IP:/root/
sshpass -p "$SERVER_PASS" scp deployment/docker-compose-nginx-blue.yml root@$SERVER_IP:/root/price-scanner-app/deployment/
sshpass -p "$SERVER_PASS" scp deployment/nginx/nginx-blue.conf root@$SERVER_IP:/root/price-scanner-app/deployment/nginx/
sshpass -p "$SERVER_PASS" scp backend/server-blue.js root@$SERVER_IP:/root/price-scanner-app/backend/
sshpass -p "$SERVER_PASS" scp mobile-app/App-blue.js root@$SERVER_IP:/root/price-scanner-app/mobile-app/

echo "5. Loading and starting on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /root/blue-images.tar.gz | docker load
cd /root/price-scanner-app/deployment

# Check if certificate exists, if not try to get it
if [ ! -d "certbot-blue/conf/live/blue.flippi.ai" ]; then
  echo "Certificate not found, attempting to obtain..."
  
  # Start temp nginx
  docker run -d --name temp_nginx_blue \
    -p 8080:80 \
    -v $(pwd)/nginx/nginx-blue.conf:/etc/nginx/conf.d/default.conf:ro \
    -v $(pwd)/certbot-blue/www:/var/www/certbot:ro \
    nginx:alpine
  
  sleep 5
  
  # Try to get certificate
  docker run --rm \
    -v $(pwd)/certbot-blue/conf:/etc/letsencrypt \
    -v $(pwd)/certbot-blue/www:/var/www/certbot \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@flippi.ai \
    --agree-tos \
    --no-eff-email \
    -d blue.flippi.ai
  
  docker stop temp_nginx_blue
  docker rm temp_nginx_blue
fi

# Start blue environment
docker compose -f docker-compose-nginx-blue.yml up -d
docker ps | grep blue
rm /root/blue-images.tar.gz
EOF

echo "6. Cleanup..."
rm /tmp/blue-images.tar.gz

echo "=== Blue Deployment Complete ==="
echo "Dev environment is now running at https://blue.flippi.ai"