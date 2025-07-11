#!/bin/bash

# Initialize green.flippi.ai environment
echo "=== Setting up green.flippi.ai test environment ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
DOMAIN="green.flippi.ai"

echo "Please ensure DNS A record for green.flippi.ai points to $SERVER_IP"
echo "Press Enter to continue..."
read

echo "1. Getting certificate for green.flippi.ai..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

# Create certbot directories for green
mkdir -p certbot-green/conf certbot-green/www

# Use existing nginx to get green cert
docker exec thrifting_buddy_nginx sh -c "echo 'server { listen 80; server_name green.flippi.ai; location /.well-known/acme-challenge/ { root /var/www/certbot-green; } }' > /etc/nginx/conf.d/green-temp.conf && nginx -s reload"

# Mount green certbot directory
docker run --rm \
  -v $(pwd)/certbot-green/conf:/etc/letsencrypt \
  -v $(pwd)/certbot-green/www:/var/www/certbot \
  --network thrifting_buddy_network \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@flippi.ai \
  --agree-tos \
  --no-eff-email \
  -d green.flippi.ai

# Remove temp config
docker exec thrifting_buddy_nginx sh -c "rm /etc/nginx/conf.d/green-temp.conf && nginx -s reload"
EOF

echo "=== Green SSL setup complete ==="
echo "green.flippi.ai will be ready when you deploy green containers"