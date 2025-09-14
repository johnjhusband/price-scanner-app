#!/bin/bash
set -euo pipefail

# Fix /story route specifically for blue environment
echo "🔧 Fixing /story route for blue environment..."

# Check if we're on the server
if [[ "$(hostname)" != "blue.flippi.ai" ]]; then
    echo "❌ This script must be run on the blue.flippi.ai server"
    echo "💡 Run: ssh blue.flippi.ai 'bash -s' < scripts/fix-blue-nginx-story-route.sh"
    exit 1
fi

echo "📡 Running on blue.flippi.ai server"

# 1. Check current nginx configuration
echo ""
echo "🔍 Current nginx configuration for /story:"
if grep -A 5 "location.*story" /etc/nginx/sites-available/blue.flippi.ai 2>/dev/null; then
    echo "✅ /story route already configured"
else
    echo "❌ /story route not found - needs to be added"
fi

# 2. Check if growth service is running
echo ""
echo "🔍 Checking if growth service is running on port 3003..."
if curl -f http://localhost:3003/health 2>/dev/null; then
    echo "✅ Growth service is running on port 3003"
else
    echo "❌ Growth service not running on port 3003"
    echo "🔧 Starting growth service..."
    
    cd /var/www/blue.flippi.ai
    
    # Ensure data directory exists
    mkdir -p data
    
    # Start growth service with PM2
    NODE_PATH=./backend/node_modules \
    OPENAI_API_KEY="${OPENAI_API_KEY}" \
    ENABLE_REDDIT_AUTOMATION="false" \
    GROWTH_PORT="3003" \
    FEEDBACK_DB_PATH="./data/feedback.db" \
    pm2 start growth.js --name "growth-service" --env production
    
    pm2 save
    echo "✅ Growth service started"
fi

# 3. Update nginx configuration
echo ""
echo "🔧 Updating nginx configuration..."

# Create backup of current config
sudo cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Add /story route before the catch-all location
sudo tee /tmp/story-route.conf > /dev/null << 'EOF'
    # Growth Service - Marketing Site (/story routes)
    location ^~ /story {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Growth Service - API endpoints
    location ^~ /api/growth {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Growth Service - Admin Dashboard
    location ^~ /growth {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Insert the story route configuration before the catch-all location
sudo sed -i '/^[[:space:]]*location \/ {/i\
    # Growth Service Routes\
    include /tmp/story-route.conf;\
' /etc/nginx/sites-available/blue.flippi.ai

# 4. Test and apply nginx configuration
echo ""
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    
    # 5. Test the routes
    echo ""
    echo "🔍 Testing routes..."
    
    echo "🌐 Testing /story route..."
    sleep 2
    if curl -s http://localhost/story | grep -q "growth-ui\|marketing\|story"; then
        echo "✅ /story route serving growth marketing site"
    else
        echo "❌ /story route still serving main app"
        echo "📋 Response preview:"
        curl -s http://localhost/story | head -3
    fi
    
    echo "🌐 Testing /api/growth/status..."
    if curl -s http://localhost/api/growth/status | grep -q "success"; then
        echo "✅ /api/growth/status working"
    else
        echo "❌ /api/growth/status not working"
    fi
    
    echo "🌐 Testing /growth route..."
    if curl -s http://localhost/growth | grep -q "growth-ui\|admin\|dashboard"; then
        echo "✅ /growth route serving growth admin dashboard"
    else
        echo "❌ /growth route still serving main app"
        echo "📋 Response preview:"
        curl -s http://localhost/growth | head -3
    fi
    
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup configuration..."
    sudo cp /etc/nginx/sites-available/blue.flippi.ai.backup.* /etc/nginx/sites-available/blue.flippi.ai
    exit 1
fi

echo ""
echo "✨ Blue environment /story route fix complete! ✨"
echo "🌐 Marketing site should now be available at: https://blue.flippi.ai/story"
