#!/bin/bash

# Fix production nginx configuration to use correct template
# This script can be called from deployment workflows

set -e

echo "=== Fixing production nginx configuration ==="

# Copy the correct template to nginx sites-available
cp /var/www/app.flippi.ai/nginx-templates/app.flippi.ai.conf /etc/nginx/sites-available/app.flippi.ai

# Test the configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration test passed. Reloading..."
    nginx -s reload
    echo "✅ Production nginx configuration fixed!"
    echo "Frontend now serves from disk instead of proxying to staging port"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

echo "=== Production nginx fix complete ==="