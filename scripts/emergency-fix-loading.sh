#!/bin/bash

# Emergency fix for loading screen issue
echo "=== Emergency Loading Fix ==="

# This script forces a rebuild with minimal changes
cd /var/www/blue.flippi.ai/mobile-app || exit 1

# Clean everything
rm -rf dist node_modules package-lock.json

# Reinstall dependencies
npm install

# Force rebuild
npx expo export --platform web --output-dir dist

echo "=== Rebuild complete ==="