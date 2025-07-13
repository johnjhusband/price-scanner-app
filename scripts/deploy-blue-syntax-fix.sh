#!/bin/bash

# Deploy the syntax-fixed blue frontend

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Deploying Syntax-Fixed Blue Frontend ==="

# Build
echo "1. Building fixed frontend..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-syntax-fixed .

# Save and transfer
echo "2. Transferring to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-syntax-fixed | gzip > /tmp/blue-syntax-fixed.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-syntax-fixed.tar.gz root@$SERVER_IP:/tmp/

# Deploy
echo "3. Deploying..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-syntax-fixed.tar.gz | docker load
rm /tmp/blue-syntax-fixed.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-syntax-fixed|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Testing deployment..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue frontend is up"

echo ""
echo "Current blue containers:"
docker ps | grep blue
EOF

rm -f /tmp/blue-syntax-fixed.tar.gz

echo ""
echo "=== Deployment Complete ==="
echo "The syntax error is fixed. Test 'Choose Image' at https://blue.flippi.ai"