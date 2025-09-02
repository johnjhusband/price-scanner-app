#!/bin/bash
# Migration script for clean frontend architecture
# Issue #158: Implement Clean Frontend Architecture

set -e

echo "Starting migration to clean frontend architecture..."

# Variables
SITE_ROOT="/var/www/blue.flippi.ai"
BACKUP_DIR="$SITE_ROOT/backups/migration-$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current state
echo "Creating backup..."
if [ -d "$SITE_ROOT/mobile-app" ]; then
    cp -r "$SITE_ROOT/mobile-app" "$BACKUP_DIR/"
fi

# Clean up Expo caches
echo "Cleaning Expo caches..."
rm -rf "$SITE_ROOT/mobile-app/.expo"
rm -rf "$SITE_ROOT/mobile-app/.expo-shared"
rm -rf "$SITE_ROOT/mobile-app/node_modules"
rm -rf "$SITE_ROOT/mobile-app/web-build"
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Update nginx configuration
echo "Updating nginx configuration..."
sudo sed -i 's|/mobile-app/|/frontend/dist/|g' /etc/nginx/sites-available/blue.flippi.ai

# Create new frontend directory structure
mkdir -p "$SITE_ROOT/frontend/dist"

# Copy only static files if they exist
if [ -d "$SITE_ROOT/mobile-app/dist" ]; then
    cp -r "$SITE_ROOT/mobile-app/dist/"* "$SITE_ROOT/frontend/dist/"
fi

# Set permissions
sudo chown -R www-data:www-data "$SITE_ROOT/frontend"
sudo chmod -R 755 "$SITE_ROOT/frontend"

# Update PM2 ecosystem file if needed
if [ -f "$SITE_ROOT/ecosystem.config.js" ]; then
    echo "Note: You may need to update ecosystem.config.js to reflect new paths"
fi

# Reload nginx
sudo nginx -t && sudo nginx -s reload

echo "Migration complete!"
echo "Old mobile-app directory backed up to: $BACKUP_DIR"
echo "New frontend served from: $SITE_ROOT/frontend/dist"