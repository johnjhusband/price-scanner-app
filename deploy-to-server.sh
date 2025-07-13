#!/bin/bash

# Deployment script for branch-based Docker deployment
# Usage: ./deploy-to-server.sh [environment] [branch]
# Example: ./deploy-to-server.sh production master

set -e

# Configuration
ENVIRONMENT=${1:-production}
BRANCH=${2:-master}
VERSION=$(date +%Y%m%d-%H%M%S)

# Server mapping
case $ENVIRONMENT in
  production)
    SERVER="app.flippi.ai"
    DOCKER_TAG="prod-$VERSION"
    ;;
  staging)
    SERVER="green.flippi.ai"
    BRANCH="staging"
    DOCKER_TAG="staging-$VERSION"
    ;;
  development)
    SERVER="blue.flippi.ai"
    BRANCH="develop"
    DOCKER_TAG="dev-$VERSION"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging|development] [branch]"
    exit 1
    ;;
esac

echo "🚀 Deploying $BRANCH to $ENVIRONMENT ($SERVER)"
echo "Docker tag: $DOCKER_TAG"

# Step 1: Ensure we're on the right branch
echo "1️⃣ Switching to $BRANCH branch..."
git checkout $BRANCH
git pull origin $BRANCH

# Step 2: Build Docker images
echo "2️⃣ Building Docker images..."
docker build -t thrifting-buddy/backend:$DOCKER_TAG -f backend/Dockerfile ./backend
docker build -t thrifting-buddy/frontend:$DOCKER_TAG -f mobile-app/Dockerfile ./mobile-app

# Step 3: Save images to tar file
echo "3️⃣ Saving Docker images..."
docker save \
  thrifting-buddy/backend:$DOCKER_TAG \
  thrifting-buddy/frontend:$DOCKER_TAG \
  | gzip > deployment-$ENVIRONMENT-$VERSION.tar.gz

echo "Images saved to deployment-$ENVIRONMENT-$VERSION.tar.gz"

# Step 4: Upload to server
echo "4️⃣ Uploading to $SERVER..."
scp deployment-$ENVIRONMENT-$VERSION.tar.gz root@$SERVER:/root/

# Step 5: Deploy on server
echo "5️⃣ Deploying on server..."
ssh root@$SERVER << EOF
  # Load the new images
  echo "Loading Docker images..."
  gunzip -c deployment-$ENVIRONMENT-$VERSION.tar.gz | docker load
  
  # Update docker-compose to use new tags
  cd /root/deployment
  
  # Backup current docker-compose.yml
  cp docker-compose.yml docker-compose.yml.backup
  
  # Update image tags in docker-compose.yml
  sed -i "s|thrifting-buddy/backend:.*|thrifting-buddy/backend:$DOCKER_TAG|g" docker-compose.yml
  sed -i "s|thrifting-buddy/frontend:.*|thrifting-buddy/frontend:$DOCKER_TAG|g" docker-compose.yml
  
  # Stop and restart containers
  echo "Restarting containers..."
  docker-compose down
  docker-compose up -d
  
  # Health check
  sleep 10
  curl -f https://$SERVER/health || exit 1
  
  echo "✅ Deployment complete!"
  
  # Cleanup
  rm deployment-$ENVIRONMENT-$VERSION.tar.gz
EOF

# Step 6: Cleanup local file
echo "6️⃣ Cleaning up..."
rm deployment-$ENVIRONMENT-$VERSION.tar.gz

echo "✅ Deployment to $ENVIRONMENT complete!"
echo "🌐 Visit https://$SERVER to verify"