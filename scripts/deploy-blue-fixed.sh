#!/bin/bash

# Simple deployment of the fixed blue environment

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Deploying Fixed Blue ==="

# Fix Dockerfiles
echo "1. Fixing Dockerfiles..."
# Backend Dockerfile
cat > blue/backend/Dockerfile << 'EOF'
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Frontend already has correct Dockerfile

# Build images
echo "2. Building images..."
cd blue/backend
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/backend:blue-final .

cd ../mobile-app  
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-final .

# Transfer
echo "3. Transferring..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/backend:blue-final thrifting-buddy/frontend:blue-final | gzip > /tmp/blue-final.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-final.tar.gz root@$SERVER_IP:/tmp/

# Deploy
echo "4. Deploying..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-final.tar.gz | docker load
rm /tmp/blue-final.tar.gz

# Create deployment directory if missing
mkdir -p /root/price-scanner-app/blue/deployment

# Create simple docker-compose
cat > /root/price-scanner-app/blue/deployment/docker-compose.yml << 'YAML'
services:
  blue_backend:
    image: thrifting-buddy/backend:blue-final
    container_name: blue_backend
    restart: unless-stopped
    env_file:
      - /root/price-scanner-app/shared/.env
    networks:
      - thrifting_buddy_network
    expose:
      - "3000"

  blue_frontend:
    image: thrifting-buddy/frontend:blue-final
    container_name: blue_frontend
    restart: unless-stopped
    networks:
      - thrifting_buddy_network
    expose:
      - "8080"

networks:
  thrifting_buddy_network:
    external: true
YAML

cd /root/price-scanner-app/blue/deployment
docker compose down
docker compose up -d

sleep 10
echo "Testing..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue working"

docker ps | grep blue
EOF

rm -f /tmp/blue-final.tar.gz

echo "Done!"