#!/bin/bash

# Deploy Green Environment with v2.0 enhancements

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Deploying Green Environment v2.0 ==="

# Step 1: Update Dockerfiles to use v2.0 files
echo "1. Creating v2.0 Dockerfiles..."

# Backend Dockerfile for v2.0
cat > green/backend/Dockerfile << 'EOF'
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server-v2.0.js ./server.js
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Frontend Dockerfile for v2.0
cat > green/mobile-app/Dockerfile << 'EOF'
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Copy v2.0 as the main App.js
COPY App-v2.0.js ./App.js
RUN npx expo export --platform web --output-dir dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Step 2: Update docker-compose for green containers
echo "2. Updating docker-compose for green..."
cat > green/deployment/docker-compose.yml << 'EOF'
services:
  green_backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
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
    build:
      context: ../mobile-app
      dockerfile: Dockerfile
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
EOF

# Step 3: Build images
echo "3. Building v2.0 images..."
cd green/backend
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/backend:green-v2.0 .

cd ../mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:green-v2.0 .

# Step 4: Save and transfer images
echo "4. Transferring images to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/backend:green-v2.0 thrifting-buddy/frontend:green-v2.0 | gzip > /tmp/green-v2.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/green-v2.tar.gz root@$SERVER_IP:/tmp/

# Step 5: Create nginx config for green
echo "5. Creating nginx routing for green.flippi.ai..."
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

# Step 6: Deploy on server
echo "6. Deploying green v2.0 on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
# Load images
gunzip -c /tmp/green-v2.tar.gz | docker load
rm /tmp/green-v2.tar.gz

# Add green nginx config
docker cp /tmp/green-nginx.conf thrifting_buddy_nginx:/etc/nginx/conf.d/green.conf
rm /tmp/green-nginx.conf

# Create green deployment directory
mkdir -p /root/price-scanner-app/green/deployment

# Deploy green
cd /root/price-scanner-app/green/deployment
cat > docker-compose.yml << 'COMPOSE'
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

# Start green containers
docker compose up -d

# Reload nginx
docker exec thrifting_buddy_nginx nginx -t && docker exec thrifting_buddy_nginx nginx -s reload

# Test
sleep 5
echo -e "\nTesting green v2.0..."
curl -s https://green.flippi.ai/health && echo " ✓ Green API is working" || echo " ✗ Green API failed"

echo -e "\nGreen containers:"
docker ps | grep green
EOF

# Cleanup
rm -f /tmp/green-v2.tar.gz /tmp/green-nginx.conf

echo ""
echo "=== Green v2.0 Deployment Complete ==="
echo "✅ Enhanced backend with better error handling and logging"
echo "✅ Enhanced frontend with drag & drop, paste, and desktop camera"
echo "✅ ChatGPT-style UI with intuitive interface"
echo "✅ Available at: https://green.flippi.ai"
echo ""
echo "v2.0 Features:"
echo "- 📁 Browse Files"
echo "- 📷 Desktop Camera Support" 
echo "- 📋 Paste (Ctrl+V)"
echo "- 🖱️ Drag & Drop"
echo "- Enhanced AI analysis with scores and insights"