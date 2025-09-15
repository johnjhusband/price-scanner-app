#!/bin/bash
set -euo pipefail

# Growth Service Deployment Script for blue.flippi.ai
echo "✨ Deploying Growth Service..."

# Navigate to project directory
cd /var/www/blue.flippi.ai

# Install growth dependencies if needed
echo "📦 Installing growth service dependencies..."
npm install --production cors dotenv express

# Ensure data directory exists
mkdir -p data

# Start Growth Service with PM2
echo "🚀 Starting Growth Service with PM2..."
NODE_PATH=./backend/node_modules \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
ENABLE_REDDIT_AUTOMATION="false" \
GROWTH_PORT="3003" \
FEEDBACK_DB_PATH="./data/feedback.db" \
pm2 start growth.js --name "growth-service" --env production

# Save PM2 configuration
pm2 save

# Update Nginx configuration with growth routes
echo "🔧 Updating Nginx configuration..."
if [ -f nginx/blue.flippi.ai.with-growth.conf ]; then
    sudo cp nginx/blue.flippi.ai.with-growth.conf /etc/nginx/sites-available/blue.flippi.ai
    echo "✅ Nginx configuration updated with growth routes"
else
    echo "❌ Warning: nginx/blue.flippi.ai.with-growth.conf not found"
fi

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

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