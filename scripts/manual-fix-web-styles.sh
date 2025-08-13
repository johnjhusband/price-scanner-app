#!/bin/bash
# Manual fix for web-styles.css MIME type error
# This script copies the CSS file to the dist directory for all environments

echo "=== Manual Fix for web-styles.css ==="
echo "This script will copy web-styles.css to the dist directory"
echo ""

# Function to fix CSS in a specific environment
fix_css_for_env() {
    local env_path=$1
    local env_name=$2
    
    echo "Fixing $env_name..."
    
    if [ -d "$env_path/mobile-app" ]; then
        if [ -f "$env_path/mobile-app/web-styles.css" ]; then
            if [ -d "$env_path/mobile-app/dist" ]; then
                cp "$env_path/mobile-app/web-styles.css" "$env_path/mobile-app/dist/"
                echo "✓ Copied web-styles.css to $env_name dist directory"
                
                # Verify the file exists
                if [ -f "$env_path/mobile-app/dist/web-styles.css" ]; then
                    echo "✓ Verified: web-styles.css exists in dist"
                    ls -la "$env_path/mobile-app/dist/web-styles.css"
                else
                    echo "✗ Error: Copy failed for $env_name"
                fi
            else
                echo "✗ Error: dist directory not found for $env_name"
            fi
        else
            echo "✗ Error: web-styles.css not found in $env_name"
        fi
    else
        echo "✗ Error: $env_name directory not found"
    fi
    
    echo ""
}

# Fix all environments
fix_css_for_env "/var/www/blue.flippi.ai" "blue.flippi.ai"
fix_css_for_env "/var/www/green.flippi.ai" "green.flippi.ai"
fix_css_for_env "/var/www/flippi" "app.flippi.ai"

echo "=== Manual fix complete ==="
echo ""
echo "To run this on the server:"
echo "1. SSH into the server"
echo "2. Run: cd /var/www/blue.flippi.ai && bash scripts/manual-fix-web-styles.sh"
echo ""
echo "To make this permanent, add to the deployment workflow after 'npx expo export':"
echo "cp web-styles.css dist/"