#!/bin/bash

# Remove the Test API Connection button that was added for debugging

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Removing Test Button from Blue ==="

# Remove the test button code from App.js
echo "1. Removing test button from App.js..."

# Find and remove the test button section
sed -i '/Platform\.OS === '\''web'\'' && (/,/Test API Connection<\/Text>/d' blue/mobile-app/App.js

# Also remove the test button styles
sed -i '/testButton: {/,/},/d' blue/mobile-app/App.js
sed -i '/testButtonText: {/,/},/d' blue/mobile-app/App.js

# Build and deploy
echo "2. Building and deploying cleaned version..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-clean .

cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-clean | gzip > /tmp/blue-clean.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-clean.tar.gz root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-clean.tar.gz | docker load
rm /tmp/blue-clean.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-clean|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Testing deployment..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue is up"
EOF

rm -f /tmp/blue-clean.tar.gz

echo ""
echo "=== Test button removed ==="