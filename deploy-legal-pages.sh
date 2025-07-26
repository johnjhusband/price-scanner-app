#!/bin/bash

# Deploy legal pages nginx fix
# This script updates the nginx configuration to properly serve the legal pages

echo "Deploying legal pages nginx fix..."

# Function to deploy to a specific environment
deploy_to_env() {
    local DOMAIN=$1
    local ENV_NAME=$2
    
    echo ""
    echo "Deploying to $ENV_NAME ($DOMAIN)..."
    
    # Copy nginx config
    echo "1. Copying updated nginx config..."
    scp nginx-templates/${DOMAIN}.conf root@157.245.142.145:/etc/nginx/sites-available/${DOMAIN}
    
    # Test nginx configuration
    echo "2. Testing nginx configuration..."
    ssh root@157.245.142.145 "nginx -t"
    
    if [ $? -eq 0 ]; then
        echo "3. Reloading nginx..."
        ssh root@157.245.142.145 "systemctl reload nginx"
        
        # Verify the legal pages are accessible
        echo "4. Verifying legal pages..."
        echo "   Testing /privacy..."
        curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/privacy
        echo ""
        
        echo "   Testing /terms..."
        curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/terms
        echo ""
        
        # Also verify the HTML files exist on server
        echo "5. Checking if HTML files exist on server..."
        ssh root@157.245.142.145 "ls -la /var/www/${DOMAIN}/mobile-app/*.html 2>/dev/null || echo 'HTML files not found!'"
        
    else
        echo "ERROR: Nginx configuration test failed!"
        return 1
    fi
}

# Deploy to all environments
deploy_to_env "blue.flippi.ai" "Development"
deploy_to_env "green.flippi.ai" "Staging"
deploy_to_env "app.flippi.ai" "Production"

echo ""
echo "Deployment complete!"
echo ""
echo "Test the pages by visiting:"
echo "  - https://blue.flippi.ai/privacy"
echo "  - https://blue.flippi.ai/terms"
echo ""
echo "If the pages still show the app instead of the legal content, check:"
echo "1. That the HTML files exist at /var/www/[domain]/mobile-app/"
echo "2. That nginx has read permissions on the files"
echo "3. The nginx error logs: tail -f /var/log/nginx/error.log"