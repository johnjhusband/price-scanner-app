#!/bin/bash
# Emergency fix for /story route - run this on the blue server
# This will immediately fix the nginx configuration

echo "🚨 Emergency fix for /story route..."

# Check if we're on the server
if [[ "$(hostname)" != "blue.flippi.ai" ]]; then
    echo "❌ This must be run on blue.flippi.ai server"
    echo "💡 Run: ssh blue.flippi.ai 'bash -s' < scripts/emergency-fix-story-route.sh"
    exit 1
fi

echo "📡 Running on blue.flippi.ai server"

# 1. Start growth service if not running
echo "🔧 Starting growth service..."
cd /var/www/blue.flippi.ai

# Kill any existing growth service
pm2 delete growth-service 2>/dev/null || true

# Start growth service
mkdir -p data
NODE_PATH=./backend/node_modules \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
ENABLE_REDDIT_AUTOMATION="false" \
GROWTH_PORT="3003" \
FEEDBACK_DB_PATH="./data/feedback.db" \
pm2 start growth.js --name "growth-service" --env production

pm2 save
echo "✅ Growth service started on port 3003"

# 2. Fix nginx configuration
echo "🔧 Fixing nginx configuration..."

# Create the story route configuration
sudo tee /tmp/story-route-fix.conf > /dev/null << 'EOF'
    # Growth Service Routes - Emergency Fix
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

# Remove any existing story route configuration
sudo sed -i '/# Growth Service Routes/,/^[[:space:]]*}/d' /etc/nginx/sites-available/blue.flippi.ai

# Add the new configuration before the catch-all location
sudo sed -i '/^[[:space:]]*location \/ {/i\
    # Growth Service Routes - Emergency Fix\
    include /tmp/story-route-fix.conf;\
' /etc/nginx/sites-available/blue.flippi.ai

# 3. Test and reload nginx
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    
    # 4. Test the fix
    echo "🔍 Testing /story route..."
    sleep 3
    
    if curl -s http://localhost/story | grep -q "growth-ui\|marketing\|story"; then
        echo "✅ /story route now serving growth marketing site!"
    else
        echo "❌ /story route still not working"
        echo "📋 Response:"
        curl -s http://localhost/story | head -5
    fi
    
    echo "🌐 Testing external /story route..."
    if curl -s https://blue.flippi.ai/story | grep -q "growth-ui\|marketing\|story"; then
        echo "✅ External /story route working!"
        echo "🎉 Growth marketing site is now live at: https://blue.flippi.ai/story"
    else
        echo "❌ External /story route still not working"
    fi
    
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo "✨ Emergency fix complete! ✨"
