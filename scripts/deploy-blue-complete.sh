#!/bin/bash

# Complete Blue Deployment Script
# This adds blue.flippi.ai to the existing nginx without touching production

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Complete Blue Environment Deployment ==="
echo "This will add blue.flippi.ai without affecting production"
echo ""

# Step 1: Prepare blue nginx config locally
echo "1. Creating blue nginx config..."
cat > /tmp/blue-nginx.conf << 'EOF'
# Blue environment
server {
    listen 80;
    server_name blue.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name blue.flippi.ai;
    
    # SSL certificates (will generate on first access)
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # API routes
    location /api {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location / {
        proxy_pass http://blue_frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Step 2: Create blue docker-compose
echo "2. Creating blue docker-compose..."
cat > /tmp/docker-compose-blue.yml << 'EOF'
services:
  blue_backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: thrifting-buddy/backend:blue
    container_name: blue_backend
    restart: unless-stopped
    env_file:
      - /root/price-scanner-app/shared/.env
    networks:
      - thrifting_buddy_network
    expose:
      - "3000"

  blue_frontend:
    build:
      context: ../mobile-app
      dockerfile: Dockerfile
    image: thrifting-buddy/frontend:blue
    container_name: blue_frontend
    restart: unless-stopped
    depends_on:
      - blue_backend
    environment:
      REACT_APP_API_URL: https://blue.flippi.ai
    networks:
      - thrifting_buddy_network
    expose:
      - "8080"

networks:
  thrifting_buddy_network:
    external: true
EOF

# Step 3: Build blue images locally
echo "3. Building blue images locally..."
cd /mnt/c/Users/jhusband/price-scanner-app

# Build backend
echo "   Building blue backend..."
cd blue/backend
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/backend:blue .

# Build frontend  
echo "   Building blue frontend..."
cd ../mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue .

# Step 4: Transfer images to server
echo "4. Saving and transferring images..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/backend:blue thrifting-buddy/frontend:blue | gzip > /tmp/blue-images.tar.gz

echo "   Transferring to server..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-images.tar.gz root@$SERVER_IP:/tmp/

# Step 5: Deploy on server
echo "5. Deploying on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'DEPLOY'
# Load images
echo "   Loading images..."
gunzip -c /tmp/blue-images.tar.gz | docker load
rm /tmp/blue-images.tar.gz

# Create blue deployment directory
mkdir -p /root/price-scanner-app/blue/deployment
cd /root/price-scanner-app/blue/deployment

# Verify shared .env exists
if [ ! -f "/root/price-scanner-app/shared/.env" ]; then
  echo "   Creating shared .env from backend..."
  mkdir -p /root/price-scanner-app/shared
  cp /root/price-scanner-app/backend/.env /root/price-scanner-app/shared/.env
fi

echo "   Deploying blue containers..."
DEPLOY

# Copy docker-compose to server
sshpass -p "$SERVER_PASS" scp /tmp/docker-compose-blue.yml root@$SERVER_IP:/root/price-scanner-app/blue/deployment/docker-compose.yml

# Continue deployment
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'DEPLOY2'
cd /root/price-scanner-app/blue/deployment

# Stop any existing blue containers
docker stop blue_backend blue_frontend 2>/dev/null
docker rm blue_backend blue_frontend 2>/dev/null

# Start blue containers
docker compose up -d

# Wait for containers to start
echo "   Waiting for blue containers to start..."
sleep 10

# Verify blue containers are running
echo "   Verifying blue containers:"
docker ps | grep blue

# Step 6: Add blue to nginx
echo "6. Adding blue to nginx configuration..."
DEPLOY2

# Copy nginx config to server
sshpass -p "$SERVER_PASS" scp /tmp/blue-nginx.conf root@$SERVER_IP:/tmp/

# Add to nginx and get certificate
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'NGINX'
# First, get SSL certificate for blue.flippi.ai
echo "   Getting SSL certificate for blue.flippi.ai..."

# Copy blue config to nginx
docker cp /tmp/blue-nginx.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf

# Reload nginx to activate blue domain
docker exec thrifting_buddy_nginx nginx -s reload

# Get certificate using certbot through main nginx
docker run --rm \
  -v /root/price-scanner-app/deployment/certbot/conf:/etc/letsencrypt \
  -v /root/price-scanner-app/deployment/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@flippi.ai \
  --agree-tos \
  --no-eff-email \
  -d blue.flippi.ai

# Reload nginx again with certificate
docker exec thrifting_buddy_nginx nginx -s reload

# Step 7: Test blue environment
echo "7. Testing blue environment..."
sleep 5

# Test health endpoint
echo "   Testing https://blue.flippi.ai/health"
curl -s https://blue.flippi.ai/health && echo -e "\n   ✓ Blue health check passed" || echo -e "\n   ✗ Blue health check failed"

# Test main page
echo "   Testing https://blue.flippi.ai"
curl -s https://blue.flippi.ai | grep -q "Thrifting" && echo "   ✓ Blue frontend working" || echo "   ✗ Blue frontend not responding"

# Final status
echo ""
echo "=== Blue Deployment Status ==="
echo "Blue containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep blue
echo ""
echo "Production containers (unchanged):"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "thrifting_buddy_(api|frontend|nginx)" | grep -v blue

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Blue environment: https://blue.flippi.ai"
echo "Production remains at: https://app.flippi.ai"
NGINX

# Cleanup
rm -f /tmp/blue-nginx.conf /tmp/docker-compose-blue.yml /tmp/blue-images.tar.gz

echo ""
echo "Script completed successfully!"