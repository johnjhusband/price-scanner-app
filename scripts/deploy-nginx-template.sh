#!/bin/bash
# Deploy nginx template to server
# This script copies the nginx template from the repository to the server config

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 blue.flippi.ai"
    exit 1
fi

TEMPLATE_FILE="/var/www/$DOMAIN/nginx-templates/$DOMAIN.conf"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo "Deploying nginx config for $DOMAIN"
echo "Template: $TEMPLATE_FILE"
echo "Target: $NGINX_CONFIG"

# Backup current config
if [ -f "$NGINX_CONFIG" ]; then
    sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy template to nginx config
sudo cp "$TEMPLATE_FILE" "$NGINX_CONFIG"

# Test nginx configuration
if sudo nginx -t; then
    echo "Nginx config test passed"
    sudo nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "Error: Nginx config test failed"
    exit 1
fi