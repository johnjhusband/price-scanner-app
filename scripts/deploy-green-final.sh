#!/bin/bash

# Deploy Green Environment with v2.0 features
# Both backend and frontend have been integrated

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Deploying Green Environment v2.0 ==="
echo "Backend: Enhanced with v2.0 features (authenticity, Boca scores, insights)"
echo "Frontend: Enhanced with drag & drop, paste, desktop camera"
echo ""

# Step 1: Build backend
echo "1. Building green backend..."
cd green/backend
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/backend:green-v2.0 .

# Step 2: Build frontend
echo -e "\n2. Building green frontend..."
cd ../mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:green-v2.0 .

# Step 3: Save and transfer
echo -e "\n3. Transferring images to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/backend:green-v2.0 thrifting-buddy/frontend:green-v2.0 | gzip > /tmp/green-v2-final.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/green-v2-final.tar.gz root@$SERVER_IP:/tmp/

# Step 4: Create nginx config for green
echo -e "\n4. Creating nginx configuration..."
cat > /tmp/green-nginx.conf << 'NGINX'
server {
    listen 80;
    server_name green.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name green.flippi.ai;
    
    # Use the app.flippi.ai cert
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # API routes to green backend
    location /api {
        proxy_pass http://green_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://green_backend:3000;
        proxy_set_header Host $host;
    }
    
    # Frontend
    location / {
        proxy_pass http://green_frontend:8080;
        proxy_set_header Host $host;
    }
}
NGINX

sshpass -p "$SERVER_PASS" scp /tmp/green-nginx.conf root@$SERVER_IP:/tmp/

# Step 5: Deploy on server
echo -e "\n5. Deploying on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "Loading Docker images..."
gunzip -c /tmp/green-v2-final.tar.gz | docker load
rm /tmp/green-v2-final.tar.gz

echo "Adding green nginx config..."
docker cp /tmp/green-nginx.conf thrifting_buddy_nginx:/etc/nginx/conf.d/green.conf
rm /tmp/green-nginx.conf

echo "Creating green deployment directory..."
mkdir -p /root/price-scanner-app/green/deployment

echo "Creating docker-compose for green..."
cat > /root/price-scanner-app/green/deployment/docker-compose.yml << 'COMPOSE'
services:
  green_backend:
    image: thrifting-buddy/backend:green-v2.0
    container_name: green_backend
    restart: unless-stopped
    env_file:
      - /root/price-scanner-app/shared/.env
    networks:
      - thrifting_buddy_network
    expose:
      - "3000"

  green_frontend:
    image: thrifting-buddy/frontend:green-v2.0
    container_name: green_frontend
    restart: unless-stopped
    networks:
      - thrifting_buddy_network
    expose:
      - "8080"

networks:
  thrifting_buddy_network:
    external: true
COMPOSE

echo "Starting green containers..."
cd /root/price-scanner-app/green/deployment
docker compose down 2>/dev/null || true
docker compose up -d

echo "Testing nginx configuration..."
docker exec thrifting_buddy_nginx nginx -t

echo "Reloading nginx..."
docker exec thrifting_buddy_nginx nginx -s reload

# Wait for services to start
sleep 10

echo -e "\n=== Testing Green Deployment ==="
echo "1. Health check:"
curl -s https://green.flippi.ai/health | jq . || curl -s https://green.flippi.ai/health

echo -e "\n2. API test (should show error about missing image):"
curl -s -X POST https://green.flippi.ai/api/scan | head -c 200

echo -e "\n\n3. Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep green

echo -e "\n4. Checking logs:"
docker logs green_backend --tail 5
docker logs green_frontend --tail 5
EOF

# Cleanup
rm -f /tmp/green-v2-final.tar.gz /tmp/green-nginx.conf

echo -e "\n=== Green v2.0 Deployment Complete ==="
echo "✅ Backend Features:"
echo "   - Enhanced AI analysis (authenticity, Boca scores)"
echo "   - Better error handling with hints"
echo "   - Request timing and processing metadata"
echo "   - Market insights and selling tips"
echo ""
echo "✅ Frontend Features:"
echo "   - Drag & drop file upload"
echo "   - Paste support (Ctrl+V)"
echo "   - Desktop camera detection"
echo "   - ChatGPT-style upload UI"
echo "   - Enhanced score displays"
echo "   - Expandable details section"
echo ""
echo "🌐 Access at: https://green.flippi.ai"
echo ""
echo "Test all features:"
echo "- Try drag & drop on desktop"
echo "- Test Ctrl+V paste"
echo "- Check if camera button appears on laptops"
echo "- Verify new scores and insights display"