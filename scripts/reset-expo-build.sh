#!/bin/bash

# Script to completely reset Expo build environment
# This is the nuclear option when expo keeps generating the same bundle

echo "=== Resetting Expo Build Environment ==="
echo "This will clear ALL caches and force a complete rebuild"

# Navigate to mobile-app directory
cd mobile-app || exit 1

echo "1. Stopping any running expo processes..."
pkill -f expo || true
pkill -f metro || true
pkill -f react-native || true

echo "2. Removing all build artifacts and caches..."
rm -rf node_modules
rm -rf .expo
rm -rf .cache
rm -rf dist
rm -rf web-build
rm -f package-lock.json
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
rm -rf $TMPDIR/react-*
rm -rf ~/.expo
rm -rf ~/.metro

echo "3. Clearing npm cache..."
npm cache clean --force

echo "4. Installing fresh dependencies..."
npm install

echo "5. Clearing watchman cache (if available)..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping"

echo "6. Running expo doctor..."
npx expo doctor || echo "Expo doctor check complete"

echo "7. Building with completely clean environment..."
npx expo export --platform web --output-dir dist --clear

echo "=== Reset Complete ==="
echo "New build should have a different hash"
ls -la dist/_expo/static/js/web/AppEntry-*.js 2>/dev/null || echo "Build may have failed"