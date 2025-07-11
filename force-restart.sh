#!/bin/bash

# Force restart with correct image
# Usage: ./force-restart.sh

echo "=== Force Restart Script ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "Forcing complete restart on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. Stopping all containers..."
docker compose down

echo "2. Starting fresh..."
docker compose up -d

echo "3. Waiting for startup..."
sleep 5

echo "4. Verifying new deployment..."
CONTAINER_ID=$(docker ps --filter "name=thrifting_buddy_frontend" -q)
JS_FILE=$(docker exec $CONTAINER_ID ls /app/dist/_expo/static/js/web/ | grep AppEntry)
echo "New JS file: $JS_FILE"
BUTTON_COUNT=$(docker exec $CONTAINER_ID cat /app/dist/_expo/static/js/web/$JS_FILE | grep -o "uploadButton" | wc -l)
echo "uploadButton found $BUTTON_COUNT times"

echo "5. Container status:"
docker ps
EOF

echo "=== Force Restart Complete ==="