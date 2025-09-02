# Issue #158: Clean Frontend Architecture Implementation

## Overview
This document provides the complete implementation plan for migrating from server-side Expo builds to a clean static file deployment architecture.

## Problem Summary
- Current architecture builds Expo on production server causing cache contamination
- Bundle hash `454acd2934be93420f33a84462ce4be2` is stuck with inheritance errors
- Server builds are unpredictable and hard to debug

## Solution Architecture

### New Directory Structure
```
/var/www/blue.flippi.ai/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/    # Backend dependencies only
└── frontend/            # Renamed from mobile-app
    └── dist/           # Static files only (no node_modules!)
        ├── bundle.js
        ├── index.html
        ├── assets/
        └── web-styles.css
```

## Implementation Steps

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy-develop-clean.yml`:

```yaml
name: Deploy to Blue (Clean Architecture)

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: mobile-app/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('mobile-app/package-lock.json') }}
          
      - name: Install frontend dependencies
        working-directory: ./mobile-app
        run: npm ci
        
      - name: Build frontend
        working-directory: ./mobile-app
        run: |
          npm run build:web
          # Or if using expo:
          # npx expo export --platform web --output-dir dist
          
      - name: Prepare deployment package
        run: |
          mkdir -p deploy/frontend/dist
          cp -r mobile-app/dist/* deploy/frontend/dist/
          # Include only necessary static files
          
      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.5
        with:
          host: ${{ secrets.BLUE_HOST }}
          username: ${{ secrets.BLUE_USER }}
          key: ${{ secrets.BLUE_SSH_KEY }}
          source: "deploy/frontend"
          target: "/var/www/blue.flippi.ai"
          
      - name: Update server configuration
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.BLUE_HOST }}
          username: ${{ secrets.BLUE_USER }}
          key: ${{ secrets.BLUE_SSH_KEY }}
          script: |
            cd /var/www/blue.flippi.ai
            
            # Backup old mobile-app directory
            if [ -d "mobile-app" ]; then
              sudo mv mobile-app mobile-app.backup.$(date +%Y%m%d_%H%M%S)
            fi
            
            # Set permissions
            sudo chown -R www-data:www-data frontend
            sudo chmod -R 755 frontend
            
            # Restart backend only (frontend is static)
            pm2 restart prod-backend
            
            # Clear any CDN/nginx cache
            sudo nginx -s reload
```

### Step 2: Server Migration Script

Create `scripts/migrate-to-clean-architecture.sh`:

```bash
#!/bin/bash
# Migration script for clean frontend architecture

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
```

### Step 3: Local Build Test Script

Create `scripts/test-clean-build.sh`:

```bash
#!/bin/bash
# Test the clean build process locally

set -e

echo "Testing clean frontend build..."

cd mobile-app

# Clean everything
rm -rf node_modules dist .expo .expo-shared web-build

# Fresh install
npm ci

# Build
echo "Building frontend..."
npm run build:web || npx expo export --platform web --output-dir dist

# Check output
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build successful!"
    echo "Output files:"
    find dist -type f | head -20
else
    echo "❌ Build failed - no dist directory created"
    exit 1
fi

# Check bundle hash
BUNDLE_FILE=$(find dist -name "bundle*.js" | head -1)
if [ -f "$BUNDLE_FILE" ]; then
    HASH=$(echo "$BUNDLE_FILE" | grep -oE '[a-f0-9]{32}' || echo "no hash found")
    echo "Bundle hash: $HASH"
    
    if [ "$HASH" = "454acd2934be93420f33a84462ce4be2" ]; then
        echo "⚠️  WARNING: Old contaminated bundle hash detected!"
    else
        echo "✅ New bundle hash generated"
    fi
fi
```

### Step 4: Update Backend Server Configuration

Update `backend/server.js` to serve frontend from new location:

```javascript
// Add after other middleware
if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files from new location
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Fallback to index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
```

## Verification Steps

1. **Check new bundle hash**:
   ```bash
   find /var/www/blue.flippi.ai/frontend/dist -name "bundle*.js" | head -1
   ```

2. **Verify no node_modules in frontend**:
   ```bash
   ls -la /var/www/blue.flippi.ai/frontend/
   # Should only show 'dist' directory
   ```

3. **Test the app**:
   - Visit https://blue.flippi.ai
   - Check browser console for errors
   - Verify no "Super expression" errors

4. **Check deployment time**:
   - Should be < 5 minutes
   - No expo commands run on server

## Rollback Plan

If issues occur:

```bash
# Quick rollback
cd /var/www/blue.flippi.ai
sudo mv frontend frontend.failed
sudo mv mobile-app.backup.[timestamp] mobile-app
sudo nginx -s reload
pm2 restart prod-backend
```

## Benefits Achieved

- ✅ No Expo installed on production server
- ✅ No cache contamination possible
- ✅ Predictable builds in clean CI environment
- ✅ Faster deployments (no server-side building)
- ✅ Easy rollback capability
- ✅ Clear separation of frontend/backend

## Next Steps

1. Apply same architecture to staging environment
2. Consider CDN for static asset delivery
3. Implement blue-green deployment strategy