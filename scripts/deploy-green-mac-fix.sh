#!/bin/bash

# Deploy green environment with Mac compatibility fixes

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Deploying Green Environment with Mac Fixes ==="
echo "Fixes include:"
echo "- Enhanced paste handling for Mac Safari/Chrome"
echo "- Improved drag & drop with proper event handling"
echo "- Support for HEIC/HEIF image formats"
echo "- Better clipboard data access"
echo ""

# Step 1: Build frontend with Mac fixes
echo "1. Building green frontend with Mac fixes..."
cd green/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:green-mac-fix .

# Step 2: Save and transfer
echo -e "\n2. Transferring image to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:green-mac-fix | gzip > /tmp/green-mac-fix.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/green-mac-fix.tar.gz root@$SERVER_IP:/tmp/

# Step 3: Deploy on server
echo -e "\n3. Deploying on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "Loading Docker image..."
gunzip -c /tmp/green-mac-fix.tar.gz | docker load
rm /tmp/green-mac-fix.tar.gz

echo "Updating docker-compose to use Mac-fixed image..."
cd /root/price-scanner-app/green/deployment
sed -i 's|image: thrifting-buddy/frontend:green-.*|image: thrifting-buddy/frontend:green-mac-fix|' docker-compose.yml

echo "Restarting green frontend..."
docker compose stop green_frontend
docker compose up -d green_frontend

# Wait for service to start
sleep 10

echo -e "\n=== Testing Deployment ==="
echo "1. Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep green_frontend

echo -e "\n2. Frontend logs:"
docker logs green_frontend --tail 10

echo -e "\n3. Testing site availability:"
curl -s -I https://green.flippi.ai | head -5
EOF

# Cleanup
rm -f /tmp/green-mac-fix.tar.gz

echo -e "\n=== Mac Compatibility Fixes Deployed ==="
echo "✅ Enhanced paste handling (preventDefault, capture phase)"
echo "✅ Improved drag & drop (stopPropagation, dropEffect)"
echo "✅ HEIC/HEIF support for Mac photos"
echo "✅ Better clipboard data access for Safari"
echo "✅ Enhanced debugging logs"
echo ""
echo "🌐 Test at: https://green.flippi.ai"
echo ""
echo "🧪 Mac Testing Checklist:"
echo "1. Open in Safari and Chrome on Mac"
echo "2. Test drag & drop from Finder"
echo "3. Test paste with Cmd+V"
echo "4. Test with HEIC images from Photos app"
echo "5. Check browser console for debug logs"