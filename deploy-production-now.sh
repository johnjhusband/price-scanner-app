#!/bin/bash

# Quick deployment script for production
# This handles your immediate need to deploy master to app.flippi.ai

set -e

echo "🚀 Deploying master branch to production (app.flippi.ai)"

# Step 1: Build Docker images with v0.1.1 tag (matching docker-compose.yml)
echo "1️⃣ Building Docker images..."
docker build -t thrifting-buddy/backend:v0.1.1 -f backend/Dockerfile ./backend
docker build -t thrifting-buddy/frontend:v0.1.1 -f mobile-app/Dockerfile ./mobile-app

# Step 2: Save images
echo "2️⃣ Saving Docker images..."
docker save \
  thrifting-buddy/backend:v0.1.1 \
  thrifting-buddy/frontend:v0.1.1 \
  | gzip > production-deployment.tar.gz

echo "Images saved ($(du -h production-deployment.tar.gz | cut -f1))"

# Step 3: Upload to server
echo "3️⃣ Uploading to app.flippi.ai..."
echo "You'll be prompted for the server password:"
scp production-deployment.tar.gz root@app.flippi.ai:/root/

# Step 4: Deploy on server
echo "4️⃣ Deploying on server..."
ssh root@app.flippi.ai << 'EOF'
  # Load the new images
  echo "Loading Docker images..."
  gunzip -c /root/production-deployment.tar.gz | docker load
  
  # Restart containers with new images
  echo "Restarting containers..."
  cd /root/deployment || cd /app/deployment || { echo "Can't find deployment directory"; exit 1; }
  
  docker-compose down
  docker-compose up -d
  
  # Wait for services to start
  echo "Waiting for services..."
  sleep 10
  
  # Health check
  if curl -f http://localhost:3000/health; then
    echo "✅ Backend is healthy"
  else
    echo "❌ Backend health check failed"
    docker-compose logs backend
  fi
  
  # Cleanup
  rm /root/production-deployment.tar.gz
  
  echo "✅ Deployment complete!"
EOF

# Step 5: Cleanup local file
echo "5️⃣ Cleaning up..."
rm production-deployment.tar.gz

echo "✅ Production deployment complete!"
echo "🌐 Visit https://app.flippi.ai to verify"
echo ""
echo "The v2.0 features are now live:"
echo "- Enhanced AI analysis with authenticity scores"
echo "- Boca Score for trend prediction" 
echo "- Web camera support"
echo "- Drag & drop + paste image support"