#!/bin/bash
# This script should be run as part of the deployment to fix nginx OAuth routes

echo "=== Fixing nginx OAuth routes for staging ==="

# For green.flippi.ai (staging)
if [ -f /etc/nginx/sites-available/green.flippi.ai ]; then
    # Check if OAuth routes already exist
    if ! grep -q "location /auth" /etc/nginx/sites-available/green.flippi.ai; then
        echo "Adding OAuth routes to green.flippi.ai nginx config..."
        
        # Create a temporary file with the OAuth location block
        cat > /tmp/oauth-routes.conf << 'EOF'
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF
        
        # Insert OAuth routes before the last closing brace
        # This assumes the nginx config ends with a closing brace
        sudo sed -i '/^}$/i\    # OAuth routes\n    location /auth {\n        proxy_pass http://localhost:3001;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }' /etc/nginx/sites-available/green.flippi.ai
        
        # Test and reload
        sudo nginx -t && sudo nginx -s reload
        echo "OAuth routes added successfully!"
    else
        echo "OAuth routes already configured for green.flippi.ai"
    fi
fi

# Also run this during deployment
if [[ "$PWD" == *"green.flippi.ai"* ]]; then
    bash /var/www/green.flippi.ai/scripts/fix-staging-nginx.sh 2>/dev/null || true
fi