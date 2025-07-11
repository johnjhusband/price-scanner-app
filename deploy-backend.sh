#!/bin/bash

# Deploy script for backend updates
# Usage: ./deploy-backend.sh

echo "=== Starting Backend Deployment ==="

# Set variables
SUDO_PASS="a"
SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

# 1. Build Docker image without cache
echo "Building backend image..."
cd /mnt/c/Users/jhusband/price-scanner-app/deployment
echo $SUDO_PASS | sudo -S docker compose build --no-cache backend

# 2. Tag the image
echo "Tagging image..."
echo $SUDO_PASS | sudo -S docker tag thrifting-buddy/backend:latest thrifting-buddy/backend:v0.1.1

# 3. Save the image
echo "Saving image..."
echo $SUDO_PASS | sudo -S docker save thrifting-buddy/backend:v0.1.1 | gzip > /tmp/backend-deploy.tar.gz

# 4. Transfer to server
echo "Transferring to server..."
sshpass -p "$SERVER_PASS" scp /tmp/backend-deploy.tar.gz root@$SERVER_IP:/root/

# 5. Load and restart on server
echo "Deploying on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /root/backend-deploy.tar.gz | docker load
cd /root/price-scanner-app/deployment
docker compose -f docker-compose-letsencrypt.yml restart backend
docker ps
rm /root/backend-deploy.tar.gz
EOF

# 6. Cleanup
rm /tmp/backend-deploy.tar.gz

echo "=== Deployment Complete ==="
echo "Backend API is now running at http://$SERVER_IP:3000"