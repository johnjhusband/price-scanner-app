#!/bin/bash

# Restore Enhanced Features to Blue
# This gets the enhanced App.js and server.js from git history

echo "=== Restoring Enhanced Features to Blue ==="

# Step 1: Get enhanced files from git
echo "1. Retrieving enhanced files from git history..."
cd /mnt/c/Users/jhusband/price-scanner-app

# Get App-enhanced.js from git and put it in blue
git show HEAD:mobile-app/App-enhanced.js > blue/mobile-app/App.js
echo "   ✓ Retrieved enhanced App.js ($(wc -l < blue/mobile-app/App.js) lines)"

# Get server-enhanced.js from git and put it in blue  
git show HEAD:backend/server-enhanced.js > blue/backend/server.js
echo "   ✓ Retrieved enhanced server.js ($(wc -l < blue/backend/server.js) lines)"

# Step 2: Verify enhanced features are present
echo "2. Verifying enhanced features..."
echo -n "   Camera component: "
grep -q "CameraComponent" blue/mobile-app/App.js && echo "✓ Found" || echo "✗ Not found"

echo -n "   Boca Score: "
grep -q "boca_score" blue/mobile-app/App.js && echo "✓ Found" || echo "✗ Not found"

echo -n "   Authenticity Score: "
grep -q "authenticity_score" blue/mobile-app/App.js && echo "✓ Found" || echo "✗ Not found"

echo -n "   Enhanced backend prompt: "
grep -q "Boca Score" blue/backend/server.js && echo "✓ Found" || echo "✗ Not found"

# Step 3: Fix API_URL in the enhanced App.js
echo "3. Fixing API_URL configuration..."
sed -i "s|const API_URL = Platform.OS === 'web'.*|const API_URL = Platform.OS === 'web' |" blue/mobile-app/App.js
sed -i "s|? \`.*\`|? '' // Same domain - nginx routes /api to backend|" blue/mobile-app/App.js

# Show the fixed line
echo "   API_URL set to:"
grep -n "const API_URL" blue/mobile-app/App.js | head -1

echo ""
echo "=== Enhanced files restored to blue ==="
echo "Now run: ./scripts/fix-blue-frontend.sh"
echo "This will rebuild and deploy with the correct enhanced features"