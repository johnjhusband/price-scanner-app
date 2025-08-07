#!/bin/bash

echo "Testing Expo build..."

# Check if expo is available
if ! command -v expo &> /dev/null; then
    echo "Expo CLI not found. Installing..."
    npm install -g expo-cli
fi

# Try to build
echo "Running expo export..."
npx expo export --platform web --output-dir test-dist

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "Files in test-dist:"
    ls -la test-dist/ | head -10
else
    echo "Build failed!"
    exit 1
fi