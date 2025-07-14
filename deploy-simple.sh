#!/bin/bash

# Simple deployment script for non-Docker setup
# Usage: ./deploy-simple.sh [production|staging|development]

set -e

ENVIRONMENT=${1:-production}

case $ENVIRONMENT in
  production)
    DOMAIN="app.flippi.ai"
    BRANCH="master"
    PM2_BACKEND="prod-backend"
    PM2_FRONTEND="prod-frontend"
    ;;
  staging)
    DOMAIN="green.flippi.ai"
    BRANCH="staging"
    PM2_BACKEND="staging-backend"
    PM2_FRONTEND="staging-frontend"
    ;;
  development)
    DOMAIN="blue.flippi.ai"
    BRANCH="develop"
    PM2_BACKEND="dev-backend"
    PM2_FRONTEND="dev-frontend"
    ;;
  *)
    echo "Usage: $0 [production|staging|development]"
    exit 1
    ;;
esac

echo "🚀 Deploying $BRANCH to $ENVIRONMENT ($DOMAIN)"

# SSH into server and deploy
ssh root@app.flippi.ai << EOF
  set -e
  
  echo "📁 Navigating to /var/www/$DOMAIN..."
  cd /var/www/$DOMAIN
  
  echo "🔄 Pulling latest code from $BRANCH branch..."
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
  
  echo "📦 Installing backend dependencies..."
  cd backend
  npm install --production
  
  echo "📦 Installing frontend dependencies..."
  cd ../mobile-app
  npm install
  
  echo "🏗️  Building frontend..."
  EXPO_PUBLIC_API_URL="" npx expo build:web
  
  echo "🔄 Restarting services..."
  pm2 restart $PM2_BACKEND
  pm2 restart $PM2_FRONTEND
  
  echo "✅ Checking health..."
  sleep 5
  curl -f https://$DOMAIN/health || exit 1
  
  echo "✅ Deployment complete!"
  pm2 status
EOF

echo ""
echo "✅ $ENVIRONMENT deployment complete!"
echo "🌐 Visit https://$DOMAIN to verify"