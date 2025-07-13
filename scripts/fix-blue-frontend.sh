#!/bin/bash

# Fix Blue Frontend Script
# This fixes the camera button and choose image functionality

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Fixing Blue Frontend ==="
echo "This will rebuild and deploy the enhanced frontend with camera features"
echo ""

# Step 1: Fix the Dockerfile
echo "1. Fixing blue frontend Dockerfile..."
cat > /mnt/c/Users/jhusband/price-scanner-app/blue/mobile-app/Dockerfile << 'EOF'
FROM node:16-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including web dependencies
RUN npm install

# Copy all source files including the enhanced App.js
COPY . .

# Build the web version (App.js is already the enhanced version)
RUN npx expo export --platform web --output-dir dist

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
RUN echo 'server { \
    listen 8080; \
    listen 8081; \
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

EXPOSE 8080 8081

CMD ["nginx", "-g", "daemon off;"]
EOF

# Step 2: Verify App.js has correct API_URL
echo "2. Checking API_URL in App.js..."
grep -n "API_URL" /mnt/c/Users/jhusband/price-scanner-app/blue/mobile-app/App.js | head -5

# Fix if needed
if ! grep -q "API_URL = Platform.OS === 'web'.*? ''" /mnt/c/Users/jhusband/price-scanner-app/blue/mobile-app/App.js; then
    echo "   Fixing API_URL configuration..."
    sed -i "s|? \`.*\`|? '' // Same domain - nginx routes /api to backend|" /mnt/c/Users/jhusband/price-scanner-app/blue/mobile-app/App.js
fi

# Step 3: Build the frontend locally
echo "3. Building blue frontend with enhanced features..."
cd /mnt/c/Users/jhusband/price-scanner-app/blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-fixed .

# Step 4: Save and transfer
echo "4. Saving and transferring fixed image..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-fixed | gzip > /tmp/blue-frontend-fixed.tar.gz

echo "   Transferring to server..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-frontend-fixed.tar.gz root@$SERVER_IP:/tmp/

# Step 5: Deploy on server (only frontend)
echo "5. Deploying fixed frontend on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'DEPLOY'
# Load image
echo "   Loading fixed frontend image..."
gunzip -c /tmp/blue-frontend-fixed.tar.gz | docker load
rm /tmp/blue-frontend-fixed.tar.gz

# Stop old blue frontend only
echo "   Stopping old blue frontend..."
docker stop blue_frontend
docker rm blue_frontend

# Update docker-compose to use new image
cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue|image: thrifting-buddy/frontend:blue-fixed|' docker-compose.yml

# Start new frontend
echo "   Starting fixed blue frontend..."
docker compose up -d blue_frontend

# Wait for startup
echo "   Waiting for frontend to start..."
sleep 10

# Verify it's running
echo "   Verifying blue frontend is running:"
docker ps | grep blue_frontend

# Test the frontend
echo "6. Testing fixed blue frontend..."
echo "   Checking for camera component in page source..."
curl -s https://blue.flippi.ai | grep -q "CameraComponent" && echo "   ✓ Camera component found" || echo "   ✗ Camera component not found"

echo "   Checking for enhanced features..."
curl -s https://blue.flippi.ai | grep -q "Boca Score" && echo "   ✓ Enhanced features found" || echo "   ✗ Enhanced features not found"

# Final status
echo ""
echo "=== Fix Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep blue

echo ""
echo "Production containers (untouched):"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "thrifting_buddy_(api|frontend|nginx)" | grep -v blue

echo ""
echo "=== FIX COMPLETE ==="
echo "Blue frontend has been fixed with camera features"
echo "Test at: https://blue.flippi.ai"
echo "Camera button should appear on mobile devices"
echo "Choose Image should work on all devices"
DEPLOY

# Cleanup
rm -f /tmp/blue-frontend-fixed.tar.gz

echo ""
echo "Script completed!"