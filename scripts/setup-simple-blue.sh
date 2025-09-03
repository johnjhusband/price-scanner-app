#!/bin/bash
set -euo pipefail

echo "✨ Setting up simple configuration for blue.flippi.ai..."

# 1. Stop and remove broken PM2 frontend (we'll serve static files instead)
echo "💫 Cleaning up PM2..."
pm2 stop dev-frontend || true
pm2 delete dev-frontend || true
pm2 save

# 2. Ensure dist directory exists and has content
echo "💫 Checking frontend build..."
if [ ! -d "/var/www/blue.flippi.ai/mobile-app/dist" ]; then
    echo "❌ Error: dist directory not found"
    echo "   Frontend needs to be built first"
    exit 1
fi

# 3. Replace nginx config
echo "💫 Installing nginx configuration..."
cp /var/www/blue.flippi.ai/nginx/blue.flippi.ai.simple.conf /etc/nginx/sites-available/blue.flippi.ai

# 4. Test and reload nginx
echo "💫 Reloading nginx..."
nginx -t && nginx -s reload

echo "✅ Setup complete!"
echo "   - Legal pages: served as static files"
echo "   - API/Auth: proxied to backend on port 3002"
echo "   - Main app: served as static files from dist/"
echo "   - No PM2 frontend needed!"