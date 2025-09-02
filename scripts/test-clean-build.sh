#!/bin/bash
# Test the clean build process locally
# Issue #158: Implement Clean Frontend Architecture

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