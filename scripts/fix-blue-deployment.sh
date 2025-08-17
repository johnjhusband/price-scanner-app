#!/bin/bash

# Emergency fix script for blue.flippi.ai deployment issues

echo "=== Fixing blue.flippi.ai deployment ==="

# This script should be run on the server after deployment if the site shows 500 error

cd /var/www/blue.flippi.ai/mobile-app || exit 1

# Clean everything first
echo "Cleaning build artifacts..."
rm -rf dist node_modules package-lock.json .expo

# Fresh install
echo "Installing dependencies..."
npm install

# Try to build
echo "Attempting Expo build..."
if npm run build:web; then
    echo "Build successful!"
else
    echo "Expo build failed, trying npx expo export..."
    if npx expo export --platform web --output-dir dist; then
        echo "Alternative build successful!"
    else
        echo "Both methods failed. Creating minimal working site..."
        
        # Create dist directory
        mkdir -p dist
        
        # Create a minimal index.html that loads from CDN
        cat > dist/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Flippi.ai™ - Never Over Pay</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 {
            color: #2c68d0;
            margin-bottom: 20px;
        }
        .error-msg {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #3478f6;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .btn:hover {
            background: #2c68d0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Flippi.ai™</h1>
        <div class="error-msg">
            <h2>Temporary Maintenance</h2>
            <p>We're currently updating our system. Please check back in a few minutes.</p>
            <p>If you continue to see this message, please try:</p>
            <ul style="text-align: left; max-width: 400px; margin: 10px auto;">
                <li>Clearing your browser cache</li>
                <li>Using a different browser</li>
                <li>Visiting <a href="https://app.flippi.ai">app.flippi.ai</a> instead</li>
            </ul>
        </div>
        <a href="/" class="btn" onclick="location.reload(); return false;">Refresh Page</a>
    </div>
</body>
</html>
HTML
        
        echo "Created fallback index.html"
    fi
fi

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart dev-backend
pm2 restart dev-frontend

# Reload nginx
echo "Reloading nginx..."
nginx -s reload

echo "=== Fix complete ==="
echo "Check https://blue.flippi.ai/"