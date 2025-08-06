#!/bin/bash
# Emergency fix for Expo build failures

echo "=== Fixing Expo Build Issues ==="

cd /var/www/blue.flippi.ai/mobile-app

# Clean everything first
echo "1. Cleaning build artifacts..."
rm -rf dist/ .expo/ node_modules/.cache/

# Reinstall dependencies
echo "2. Reinstalling dependencies..."
npm ci

# Try different build approaches
echo "3. Attempting Expo build..."
if ! npx expo export --platform web --output-dir dist; then
    echo "Standard build failed, trying with clear cache..."
    npx expo export --platform web --output-dir dist --clear
fi

# Verify build succeeded
if [ ! -f dist/index.html ]; then
    echo "ERROR: Build failed - creating fallback page"
    mkdir -p dist
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Flippi.ai - Maintenance</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .message {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="message">
        <h1>Temporarily Unavailable</h1>
        <p>We're updating Flippi.ai. Please check back in a few minutes.</p>
    </div>
</body>
</html>
EOF
fi

echo "4. Restarting services..."
pm2 restart dev-backend dev-frontend

echo "=== Fix attempt complete ==="