#!/bin/bash

# Deployment script for Thrifting Buddy
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
BRANCH=${2:-master}

echo "🚀 Deploying Thrifting Buddy - Environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Pull latest code
echo "📥 Pulling latest code from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Backend deployment
echo "🔧 Deploying backend..."
cd backend

# Install/update dependencies
npm ci

# Run migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Run tests
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Running tests..."
    npm test || true
fi

cd ..

# Mobile app build (if needed)
if [ "$BUILD_MOBILE" = "true" ]; then
    echo "📱 Building mobile app..."
    cd mobile-app
    npm ci
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npx expo build:android --release-channel production
        npx expo build:ios --release-channel production
    fi
    
    cd ..
fi

# Docker deployment
if [ "$USE_DOCKER" = "true" ]; then
    echo "🐳 Deploying with Docker..."
    docker-compose -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --build
else
    # PM2 deployment
    echo "⚡ Deploying with PM2..."
    
    # Stop existing processes
    pm2 stop ecosystem.config.js --env $ENVIRONMENT || true
    
    # Start services
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    
    # Save PM2 state
    pm2 save
fi

# Run post-deployment tasks
echo "🔄 Running post-deployment tasks..."

# Clear caches
if [ "$ENVIRONMENT" = "production" ]; then
    # Clear Redis cache
    redis-cli -a $REDIS_PASSWORD FLUSHDB || true
    
    # Clear CDN cache if using CloudFlare
    if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
             -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
             -H "Content-Type: application/json" \
             --data '{"purge_everything":true}'
    fi
fi

# Health check
echo "❤️ Running health check..."
sleep 5
curl -f http://localhost/health || exit 1

echo "✅ Deployment complete!"

# Send notification (optional)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
         --data "{\"text\":\"🚀 Thrifting Buddy deployed to $ENVIRONMENT successfully!\"}" \
         $SLACK_WEBHOOK
fi