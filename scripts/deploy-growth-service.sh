#!/bin/bash
set -euo pipefail

# Growth Service Deployment Script for blue.flippi.ai
echo "✨ Deploying Growth Service..."

# Navigate to project directory
cd /var/www/blue.flippi.ai

# Ensure data directory exists
mkdir -p data

# Start Growth Service with PM2 (restart if already running)
echo "🚀 Starting Growth Service with PM2..."
NODE_PATH=./backend/node_modules \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
ENABLE_REDDIT_AUTOMATION="false" \
GROWTH_PORT="3003" \
FEEDBACK_DB_PATH="./data/feedback.db" \
pm2 restart growth-service || \
pm2 start growth.js --name "growth-service" --env production

# Save PM2 configuration
pm2 save

# Fix SSL files and configure nginx with growth routes
echo "🔧 Fixing SSL files and growth routes..."
bash scripts/fix-ssl-and-growth-routes.sh

# Verify Growth Service is running
echo "✅ Verifying Growth Service..."
sleep 5
if curl -f http://localhost:3003/health; then
    echo "✨ Growth Service is running successfully!"
    echo "🌐 Marketing site available at: https://blue.flippi.ai/story"
else
    echo "❌ Growth Service health check failed"
    pm2 logs growth-service --lines 20
    exit 1
fi

echo "✨ Growth Service deployment complete! ✨"