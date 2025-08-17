#!/bin/bash
# Server-side fix for bundle error
# Run this on the blue.flippi.ai server

echo "=== FIXING JAVASCRIPT BUNDLE ERROR ==="
echo ""

# Change to blue directory
cd /var/www/blue.flippi.ai

# Option 1: Copy working build from green (fastest)
echo "Option 1: Copying working build from green.flippi.ai..."
if [ -d "/var/www/green.flippi.ai/mobile-app/dist" ]; then
    # Backup current broken build
    mv mobile-app/dist mobile-app/dist.broken.$(date +%s) 2>/dev/null || true
    
    # Copy entire dist folder
    cp -r /var/www/green.flippi.ai/mobile-app/dist mobile-app/
    
    # Restart PM2
    pm2 restart dev-frontend
    
    echo "✅ Copied working build from green"
    echo "Testing..."
    sleep 2
    curl -s -I https://blue.flippi.ai | head -n 1
    
    echo ""
    echo "DONE! Check https://blue.flippi.ai"
    exit 0
fi

# Option 2: Rebuild with fixed dependencies
echo ""
echo "Option 2: Clean rebuild with fixed dependencies..."

cd mobile-app

# Clean everything
rm -rf dist .expo node_modules package-lock.json

# Install specific working versions
cat > package.json << 'EOF'
{
  "name": "flippi-ai",
  "version": "2.2.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:web": "expo export --platform web --output-dir dist"
  },
  "dependencies": {
    "@expo/metro-runtime": "~3.1.3",
    "@expo/vector-icons": "^14.0.0",
    "expo": "~50.0.0",
    "expo-camera": "~14.1.3",
    "expo-image-picker": "~14.7.0",
    "expo-status-bar": "~1.11.1",
    "@react-native-async-storage/async-storage": "1.21.0",
    "lucide-react-native": "^0.260.0",
    "qrcode": "^1.5.3",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.73.6",
    "react-native-web": "~0.19.6"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

# Install dependencies
npm install

# Build
npx expo export --platform web --output-dir dist

# Restart
pm2 restart dev-frontend

echo ""
echo "✅ Rebuild complete"
echo "Check https://blue.flippi.ai"