#!/bin/bash
# Script to copy web-specific assets to the dist directory after Expo build

set -e

echo "=== Copying web assets to dist directory ==="

# Check if we're in the right directory
if [ ! -d "mobile-app" ]; then
    echo "Error: mobile-app directory not found. Run this script from the project root."
    exit 1
fi

# Check if dist directory exists
if [ ! -d "mobile-app/dist" ]; then
    echo "Error: mobile-app/dist directory not found. Run 'npx expo export' first."
    exit 1
fi

# Copy web-styles.css to dist directory
if [ -f "mobile-app/web-styles.css" ]; then
    echo "Copying web-styles.css to dist directory..."
    cp mobile-app/web-styles.css mobile-app/dist/
    echo "✓ web-styles.css copied successfully"
else
    echo "Warning: web-styles.css not found in mobile-app directory"
fi

# Verify the file was copied
if [ -f "mobile-app/dist/web-styles.css" ]; then
    echo "✓ Verified: web-styles.css exists in dist directory"
    ls -la mobile-app/dist/web-styles.css
else
    echo "✗ Error: web-styles.css was not copied to dist directory"
    exit 1
fi

echo "=== Web assets copy completed ==="