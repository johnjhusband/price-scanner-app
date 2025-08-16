#!/bin/bash

# Force rebuild frontend on deployment
echo "=== Force Frontend Rebuild ==="

# Ensure we're in the right directory
if [ -d "mobile-app" ]; then
    cd mobile-app
elif [ -d "../mobile-app" ]; then
    cd ../mobile-app
else
    echo "Error: Could not find mobile-app directory"
    exit 1
fi

echo "Current directory: $(pwd)"

# Clean old build
echo "Cleaning old build..."
rm -rf dist test-dist

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the app
echo "Building frontend..."
npx expo export --platform web --output-dir dist

if [ $? -eq 0 ]; then
    echo "✅ Frontend build completed successfully"
    echo "Build artifacts:"
    ls -la dist/_expo/static/js/web/
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "=== Build complete ==="