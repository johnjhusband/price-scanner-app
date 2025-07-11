#!/bin/bash

# Fix production by removing conflicting containers and restarting

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Fixing Production Environment ==="

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. Stopping all conflicting containers..."
docker stop nginx_blue_cert 2>/dev/null || true
docker rm nginx_blue_cert 2>/dev/null || true
docker stop thrifting_buddy_nginx_blue 2>/dev/null || true
docker rm thrifting_buddy_nginx_blue 2>/dev/null || true

echo "2. Cleaning up blue environment temporarily..."
docker compose -f docker-compose-nginx-blue.yml down 2>/dev/null || true

echo "3. Restarting production environment..."
docker compose -f docker-compose-nginx.yml down
docker compose -f docker-compose-nginx.yml up -d

echo "4. Waiting for services to start..."
sleep 10

echo "5. Checking production status..."
docker ps | grep -E "(thrifting_buddy_nginx|thrifting_buddy_api|thrifting_buddy_frontend)" | grep -v blue

echo "6. Testing production..."
curl -s https://app.flippi.ai/health || echo "Health check failed"

echo "=== Production should now be running at https://app.flippi.ai ==="
EOF