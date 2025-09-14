#!/bin/bash
set -euo pipefail

# Growth Service Deployment Script for blue.flippi.ai
echo "✨ Deploying Growth Service..."

# Navigate to project directory
cd /var/www/blue.flippi.ai

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

# Configure Nginx for /story and /api/growth routes
echo "🔧 Configuring Nginx..."
cat > /tmp/growth-nginx.conf << 'EOF'
    # Growth Service - Marketing Site
    location /story {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Growth Service - API
    location /api/growth {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Growth UI Assets
    location /assets {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
EOF

# Insert growth config into nginx site config
# This inserts before the last closing brace of the HTTPS server block
sudo sed -i '/^[[:space:]]*location \/ {/i\
    # Growth Service Routes\
    include /tmp/growth-nginx.conf;
' /etc/nginx/sites-available/blue.flippi.ai

# Copy the config to the proper location
sudo cp /tmp/growth-nginx.conf /etc/nginx/snippets/growth-service.conf

# Update the nginx config to use the snippet
sudo sed -i 's|include /tmp/growth-nginx.conf;|include /etc/nginx/snippets/growth-service.conf;|' /etc/nginx/sites-available/blue.flippi.ai

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