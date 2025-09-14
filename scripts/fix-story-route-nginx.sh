#!/bin/bash
set -euo pipefail

# Fix /story route nginx configuration
echo "🔧 Fixing /story route nginx configuration..."

# Check if we're on the server
if [[ "$(hostname)" == "blue.flippi.ai" ]]; then
    echo "📡 Running on blue.flippi.ai server"
    
    # Update the active nginx configuration
    echo "🔄 Updating nginx configuration..."
    
    # Create the growth service nginx snippet
    sudo tee /etc/nginx/snippets/growth-service.conf > /dev/null << 'EOF'
    # Growth Service - Marketing Site (/story routes)
    location ^~ /story {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
    
    # Growth Service - API endpoints
    location ^~ /api/growth {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
    
    # Growth Service - Admin Dashboard
    location ^~ /growth {
        include /etc/nginx/snippets/proxy_defaults.conf;
        proxy_pass http://127.0.0.1:3003;
    }
EOF

    # Update the main nginx site configuration
    echo "📝 Updating blue.flippi.ai nginx configuration..."
    
    # Remove old growth configuration if it exists
    sudo sed -i '/# Growth backend endpoints/,/^[[:space:]]*}/d' /etc/nginx/sites-available/blue.flippi.ai
    
    # Add the new growth service configuration before the admin routes
    sudo sed -i '/# Admin routes/i\
    # Growth Service Routes\
    include /etc/nginx/snippets/growth-service.conf;\
' /etc/nginx/sites-available/blue.flippi.ai

    # Test nginx configuration
    echo "🧪 Testing nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
        
        # Reload nginx
        echo "🔄 Reloading nginx..."
        sudo systemctl reload nginx
        
        echo "✨ /story route nginx configuration updated successfully!"
        echo "🌐 Marketing site should now be available at: https://blue.flippi.ai/story"
    else
        echo "❌ Nginx configuration test failed"
        exit 1
    fi
    
else
    echo "💻 Running locally - nginx configuration files updated"
    echo "📁 Updated files:"
    echo "   - nginx-templates/blue.flippi.ai.conf"
    echo "   - infra-nginx/sites/flippi-blue.conf"
    echo "   - infra-nginx/sites/flippi-green.conf"
    echo "   - infra-nginx/sites/flippi-prod.conf"
    echo ""
    echo "🚀 These changes will be deployed automatically via GitHub Actions"
fi

echo "✨ /story route nginx fix complete! ✨"
