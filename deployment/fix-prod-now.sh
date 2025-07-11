#!/bin/bash

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Kill everything
docker compose -f docker-compose-nginx.yml down
docker compose -f docker-compose-nginx-blue.yml down

# Start only production
docker compose -f docker-compose-nginx.yml up -d

# Wait and test
sleep 10
curl -s https://app.flippi.ai/health
EOF