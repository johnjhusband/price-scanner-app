#!/bin/bash
set -euo pipefail

# Comprehensive Growth Service Deployment Diagnosis and Fix
echo "🔍 Diagnosing Growth Service Deployment Issues..."

# Check if we're on the server
if [[ "$(hostname)" != "blue.flippi.ai" ]]; then
    echo "❌ This script must be run on the blue.flippi.ai server"
    echo "💡 Run: ssh blue.flippi.ai 'bash -s' < scripts/diagnose-growth-deployment.sh"
    exit 1
fi

echo "📡 Running on blue.flippi.ai server"

# 1. Check if growth service is running
echo ""
echo "🔍 1. Checking Growth Service Status..."
if pm2 list | grep -q "growth-service"; then
    echo "✅ Growth service found in PM2"
    pm2 show growth-service
else
    echo "❌ Growth service not found in PM2"
    echo "🔍 Checking for any Node.js processes on port 3003..."
    if lsof -i :3003 2>/dev/null; then
        echo "⚠️  Something is running on port 3003, but not managed by PM2"
    else
        echo "❌ Nothing running on port 3003"
    fi
fi

# 2. Check nginx configuration
echo ""
echo "🔍 2. Checking Nginx Configuration..."
echo "📝 Current nginx configuration for /story route:"
if grep -A 10 "location.*story" /etc/nginx/sites-available/blue.flippi.ai 2>/dev/null; then
    echo "✅ /story route found in nginx config"
else
    echo "❌ /story route NOT found in nginx config"
fi

echo ""
echo "📝 Current nginx configuration for /growth route:"
if grep -A 10 "location.*growth" /etc/nginx/sites-available/blue.flippi.ai 2>/dev/null; then
    echo "✅ /growth route found in nginx config"
else
    echo "❌ /growth route NOT found in nginx config"
fi

# 3. Test direct connections
echo ""
echo "🔍 3. Testing Direct Connections..."
echo "🌐 Testing localhost:3003 (growth service)..."
if curl -f http://localhost:3003/health 2>/dev/null; then
    echo "✅ Growth service responding on port 3003"
else
    echo "❌ Growth service not responding on port 3003"
fi

echo "🌐 Testing localhost:3002 (main backend)..."
if curl -f http://localhost:3002/health 2>/dev/null; then
    echo "✅ Main backend responding on port 3002"
else
    echo "❌ Main backend not responding on port 3002"
fi

# 4. Check nginx error logs
echo ""
echo "🔍 4. Checking Nginx Error Logs..."
echo "📋 Recent nginx error logs:"
sudo tail -20 /var/log/nginx/error.log | grep -E "(story|growth|3003)" || echo "No relevant errors found"

# 5. Fix issues if found
echo ""
echo "🔧 5. Attempting to Fix Issues..."

# Fix nginx configuration if needed
if ! grep -q "location.*story" /etc/nginx/sites-available/blue.flippi.ai; then
    echo "🔧 Adding /story route to nginx configuration..."
    
    # Create growth service snippet
    sudo tee /etc/nginx/snippets/growth-service.conf > /dev/null << 'EOF'
    # Growth Service - Marketing Site (/story routes)
    location ^~ /story {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
    
    # Growth Service - API endpoints
    location ^~ /api/growth {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
    
    # Growth Service - Admin Dashboard
    location ^~ /growth {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
EOF

    # Add to main nginx config
    sudo sed -i '/# Admin routes/i\
    # Growth Service Routes\
    include /etc/nginx/snippets/growth-service.conf;\
' /etc/nginx/sites-available/blue.flippi.ai

    echo "✅ Nginx configuration updated"
fi

# Start growth service if not running
if ! pm2 list | grep -q "growth-service"; then
    echo "🔧 Starting Growth Service..."
    cd /var/www/blue.flippi.ai
    
    # Ensure data directory exists
    mkdir -p data
    
    # Start with PM2
    NODE_PATH=./backend/node_modules \
    OPENAI_API_KEY="${OPENAI_API_KEY}" \
    ENABLE_REDDIT_AUTOMATION="false" \
    GROWTH_PORT="3003" \
    FEEDBACK_DB_PATH="./data/feedback.db" \
    pm2 start growth.js --name "growth-service" --env production
    
    pm2 save
    echo "✅ Growth service started"
fi

# Test and reload nginx
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# 6. Final verification
echo ""
echo "🔍 6. Final Verification..."
echo "🌐 Testing /story route..."
if curl -f http://localhost/story 2>/dev/null | grep -q "growth-ui"; then
    echo "✅ /story route serving growth marketing site"
else
    echo "❌ /story route still not working correctly"
    echo "📋 Response:"
    curl -s http://localhost/story | head -5
fi

echo "🌐 Testing /api/growth/status..."
if curl -f http://localhost/api/growth/status 2>/dev/null | grep -q "success"; then
    echo "✅ /api/growth/status working"
else
    echo "❌ /api/growth/status not working"
fi

echo ""
echo "✨ Growth Service Deployment Diagnosis Complete! ✨"
