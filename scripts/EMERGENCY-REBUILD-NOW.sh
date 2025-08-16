#!/bin/bash
# EMERGENCY REBUILD SCRIPT - FORCE REBUILD ON SERVER

echo "=== EMERGENCY REBUILD - FIXING BUILD FAILURE ==="

cd /var/www/blue.flippi.ai/mobile-app

# Clean everything
echo "Cleaning old build..."
rm -rf dist node_modules package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install

# Force rebuild with proper environment
echo "Building app..."
export NODE_ENV=production
npx expo export --platform web --output-dir dist

# Verify build
if [ -f "dist/index.html" ] && [ -d "dist/_expo" ]; then
    echo "✅ Build successful!"
    ls -la dist/_expo/static/js/web/
    
    # Restart PM2
    pm2 restart dev-frontend
    echo "✅ Frontend restarted"
else
    echo "❌ Build failed! Copying from green as backup..."
    rsync -av /var/www/green.flippi.ai/mobile-app/dist/ /var/www/blue.flippi.ai/mobile-app/dist/
    pm2 restart dev-frontend
fi

echo "=== DONE ==="