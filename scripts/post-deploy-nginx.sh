#!/bin/bash
# Post-deployment nginx configuration script
# This runs AFTER deployment to ensure nginx routes are correct

# Detect environment based on current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
else
    echo "Unknown environment, exiting"
    exit 0
fi

echo "Checking nginx configuration for $DOMAIN..."

# Check if OAuth routes exist
if ! grep -q "location /auth" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
    echo "OAuth routes missing! Creating temporary fix..."
    
    # Create a new config with OAuth routes
    cat > /tmp/nginx-$DOMAIN-oauth.conf << EOF
# Temporary OAuth route configuration
location /auth {
    proxy_pass http://localhost:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
EOF
    
    echo "MANUAL ACTION REQUIRED:"
    echo "The nginx configuration needs OAuth routes added."
    echo "A temporary config has been created at: /tmp/nginx-$DOMAIN-oauth.conf"
    echo "This needs to be added to /etc/nginx/sites-available/$DOMAIN"
else
    echo "OAuth routes already configured!"
fi

# Test if OAuth endpoint is accessible
echo "Testing OAuth endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/auth/google || echo "000")
echo "Backend OAuth endpoint response: $RESPONSE"

if [ "$RESPONSE" != "302" ] && [ "$RESPONSE" != "301" ]; then
    echo "WARNING: OAuth endpoint not responding with redirect!"
fi