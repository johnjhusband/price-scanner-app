#!/bin/bash

# Deploy HTTPS setup with Traefik
echo "=== Deploying HTTPS Setup ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

# Copy necessary files to server
echo "1. Copying files to server..."
sshpass -p "$SERVER_PASS" scp deployment/docker-compose-https.yml root@$SERVER_IP:/root/price-scanner-app/deployment/
sshpass -p "$SERVER_PASS" scp deployment/generate-self-signed-cert.sh root@$SERVER_IP:/root/price-scanner-app/deployment/

# Execute on server
echo "2. Setting up HTTPS on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Stop current containers
echo "3. Stopping current containers..."
docker compose down

# Generate certificates
echo "4. Generating self-signed certificate..."
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh

# Start with HTTPS
echo "5. Starting services with HTTPS..."
SERVER_IP=157.245.142.145 docker compose -f docker-compose-https.yml up -d

# Wait for services
echo "6. Waiting for services to start..."
sleep 10

# Check status
echo "7. Checking service status..."
docker ps
echo ""
echo "Testing HTTPS endpoint:"
curl -k https://localhost/health || echo "Backend might need more time to start"

EOF

echo "=== HTTPS Deployment Complete ==="
echo "Access your app at: https://$SERVER_IP"
echo "Note: Browser will warn about self-signed certificate - that's normal!"