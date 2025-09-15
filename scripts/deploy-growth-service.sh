#!/bin/bash
set -euo pipefail

# Growth Service Deployment Script for blue.flippi.ai
echo "✨ Deploying Growth Service..."

# Navigate to project directory
cd /var/www/blue.flippi.ai

# Install growth service dependencies
echo "📦 Installing growth service dependencies..."
if [ -f "package-growth.json" ]; then
    cp package-growth.json package.json
    npm install --production
    echo "✅ Growth service dependencies installed"
else
    echo "⚠️  package-growth.json not found, installing express manually..."
    npm install express path --save
fi

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


# Verify Growth Service is running
echo "✅ Verifying Growth Service..."
sleep 5

# Test growth service directly
if curl -f http://127.0.0.1:3003/health; then
    echo "✅ Growth service responding on port 3003"
else
    echo "❌ Growth service health check failed"
    pm2 logs growth-service --lines 20
    exit 1
fi

# Test nginx routing
echo "🔍 Testing nginx routing..."

# Test /story route
if curl -s http://127.0.0.1/story | grep -q "growth-ui\|marketing\|story"; then
    echo "✅ /story route serving growth marketing site"
else
    echo "❌ /story route not serving growth content"
    echo "📋 Response preview:"
    curl -s http://127.0.0.1/story | head -3
fi

# Test /api/growth route
if curl -s http://127.0.0.1/api/growth/status | grep -q "success"; then
    echo "✅ /api/growth route working"
else
    echo "❌ /api/growth route not working"
fi

# Test /growth route
if curl -s http://127.0.0.1/growth | grep -q "growth-ui\|admin\|dashboard"; then
    echo "✅ /growth route serving admin dashboard"
else
    echo "❌ /growth route not serving admin content"
    echo "📋 Response preview:"
    curl -s http://127.0.0.1/growth | head -3
fi

echo "✨ Growth Service deployment complete! ✨"
echo "🌐 Marketing site available at: https://blue.flippi.ai/story"
echo "🌐 Admin dashboard available at: https://blue.flippi.ai/growth"