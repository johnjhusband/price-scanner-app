#!/bin/bash
# Quick fix script to copy web-styles.css to the dist directory on all environments

set -e

echo "=== Fixing web-styles.css issue on all environments ==="

# Function to fix CSS for a specific environment
fix_css_for_env() {
    local env_path=$1
    local env_name=$2
    
    echo "Checking $env_name..."
    
    if [ -d "$env_path" ]; then
        if [ -f "$env_path/mobile-app/web-styles.css" ] && [ -d "$env_path/mobile-app/dist" ]; then
            echo "Copying web-styles.css to $env_name dist directory..."
            cp "$env_path/mobile-app/web-styles.css" "$env_path/mobile-app/dist/"
            
            if [ -f "$env_path/mobile-app/dist/web-styles.css" ]; then
                echo "✓ Fixed: web-styles.css copied to $env_name"
                ls -la "$env_path/mobile-app/dist/web-styles.css"
            else
                echo "✗ Failed to copy web-styles.css for $env_name"
            fi
        else
            echo "⚠ Skipping $env_name: Missing web-styles.css or dist directory"
        fi
    else
        echo "⚠ $env_name environment not found at $env_path"
    fi
    
    echo ""
}

# Fix all environments
fix_css_for_env "/var/www/blue.flippi.ai" "blue.flippi.ai (develop)"
fix_css_for_env "/var/www/green.flippi.ai" "green.flippi.ai (staging)"
fix_css_for_env "/var/www/flippi.ai" "app.flippi.ai (production)"

echo "=== Fix completed ==="
echo ""
echo "To verify the fix worked, check:"
echo "- https://blue.flippi.ai (should load without CSS errors)"
echo "- https://green.flippi.ai (should load without CSS errors)"
echo "- https://app.flippi.ai (should load without CSS errors)"