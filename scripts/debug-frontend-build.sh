#!/bin/bash
# Debug frontend build issues

echo "=== Frontend Build Debug Script ==="
echo "Running at: $(date)"
echo "Current directory: $(pwd)"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "ERROR: Not in mobile-app directory!"
    exit 1
fi

# Check node and npm versions
echo ""
echo "=== Environment ==="
node --version
npm --version
npx --version

# Check if dist exists
echo ""
echo "=== Checking dist directory ==="
if [[ -d "dist" ]]; then
    echo "dist/ exists with $(ls -1 dist | wc -l) files"
    ls -la dist | head -5
else
    echo "dist/ does not exist!"
fi

# Check dependencies
echo ""
echo "=== Checking dependencies ==="
if [[ ! -d "node_modules" ]]; then
    echo "node_modules missing! Running npm install..."
    npm install
fi

# Try to build
echo ""
echo "=== Attempting Expo build ==="
npx expo export --platform web --output-dir dist 2>&1 | tee /tmp/expo-build.log

# Check build result
if [[ $? -eq 0 ]]; then
    echo "Build succeeded!"
    echo "dist/ now contains $(ls -1 dist | wc -l) files"
else
    echo "Build FAILED! Check /tmp/expo-build.log"
    tail -20 /tmp/expo-build.log
fi

# Check PM2 configuration
echo ""
echo "=== PM2 Configuration ==="
pm2 list | grep frontend || echo "No frontend process found"

# For staging specifically
if [[ "$1" == "staging" ]]; then
    echo ""
    echo "=== Staging-specific checks ==="
    pm2 describe staging-frontend | grep -E "exec cwd|script|args" || echo "staging-frontend not found"
    
    # Check if PM2 is serving the right directory
    SERVE_DIR=$(pm2 describe staging-frontend 2>/dev/null | grep "args" | grep -oE "/var/www/[^ ]+/dist" || echo "")
    if [[ -n "$SERVE_DIR" ]]; then
        echo "PM2 serving from: $SERVE_DIR"
        if [[ -d "$SERVE_DIR" ]]; then
            echo "Directory exists with $(ls -1 "$SERVE_DIR" 2>/dev/null | wc -l) files"
        else
            echo "ERROR: Serve directory does not exist!"
        fi
    fi
fi

echo ""
echo "=== Debug script completed ==="