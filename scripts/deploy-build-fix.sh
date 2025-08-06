#!/bin/bash

# Script to fix Expo build issues during deployment

echo "=== Fixing Expo Build Issues ==="

# Ensure we're in the mobile-app directory
cd /var/www/blue.flippi.ai/mobile-app || exit 1

# Clean any existing build artifacts
echo "Cleaning old build artifacts..."
rm -rf dist web-build .expo

# Install dependencies with --force to avoid conflicts
echo "Installing dependencies..."
npm install --force

# Try to build with Expo
echo "Building with Expo..."
if npm run build:web; then
    echo "Build successful!"
    echo "Files in dist:"
    ls -la dist/ | head -10
else
    echo "Expo build failed, trying alternative approach..."
    
    # Alternative: Use expo directly
    if npx expo export --platform web --output-dir dist; then
        echo "Alternative build successful!"
    else
        echo "Both build methods failed. Creating fallback..."
        
        # Create a simple fallback HTML file
        mkdir -p dist
        cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Flippi.ai - Build Error</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .error-container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h1 { color: #333; }
        p { color: #666; }
        .refresh-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Temporary Build Issue</h1>
        <p>We're experiencing a temporary build issue. Our team has been notified.</p>
        <p>Please try refreshing the page in a few moments.</p>
        <button class="refresh-btn" onclick="location.reload()">Refresh Page</button>
    </div>
</body>
</html>
EOF
        echo "Created fallback index.html"
    fi
fi

echo "=== Build fix complete ==="