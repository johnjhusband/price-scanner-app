#!/bin/bash

# Deploy with Let's Encrypt for flippi.ai
echo "=== Deploying Let's Encrypt HTTPS for flippi.ai ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

# Copy files
echo "1. Copying configuration..."
sshpass -p "$SERVER_PASS" scp deployment/docker-compose-letsencrypt.yml root@$SERVER_IP:/root/price-scanner-app/deployment/

# Deploy on server
echo "2. Deploying on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Stop current setup
echo "3. Stopping current containers..."
docker compose -f docker-compose-https.yml down 2>/dev/null || docker compose down

# Create letsencrypt directory
echo "4. Creating Let's Encrypt directory..."
mkdir -p letsencrypt
chmod 600 letsencrypt

# Start with Let's Encrypt
echo "5. Starting services with Let's Encrypt..."
docker compose -f docker-compose-letsencrypt.yml up -d

# Wait for certificate
echo "6. Waiting for Let's Encrypt certificate..."
sleep 15

# Check status
echo "7. Checking service status..."
docker ps
echo ""
echo "Checking certificate status:"
docker logs thrifting_buddy_traefik 2>&1 | grep -E "(acme|certificate)" | tail -5

EOF

echo "=== Deployment Complete ==="
echo "Your app is now available at: https://app.flippi.ai"
echo "Camera feature will work with real HTTPS!"