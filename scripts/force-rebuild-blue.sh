#!/bin/bash
# Force rebuild blue.flippi.ai with complete cache clearing

echo "=== Force rebuilding blue.flippi.ai ==="
cd /var/www/blue.flippi.ai/mobile-app

# Stop any running expo processes
pkill -f expo || true

# Remove ALL caches and old builds
echo "Removing all caches and old builds..."
rm -rf node_modules .expo .cache dist web-build package-lock.json
rm -rf ~/.expo
rm -rf /tmp/metro-* /tmp/haste-map-* /tmp/react-*
find . -name "*.cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear npm cache
npm cache clean --force

# Fresh install
echo "Installing dependencies..."
npm install

# Build with --clear flag
echo "Building with expo..."
npx expo export --platform web --output-dir dist --clear

# Copy web assets
cp web-styles.css dist/ || echo "No web-styles.css to copy"

# Clear nginx cache (if any)
echo "Clearing nginx cache..."
find /var/cache/nginx -type f -delete 2>/dev/null || true

# Restart nginx to clear any in-memory caches
nginx -s reload

# Restart PM2 services
pm2 restart dev-backend dev-frontend

echo "Force rebuild complete!"
echo "New bundle files:"
ls -la dist/_expo/static/js/web/ | tail -5