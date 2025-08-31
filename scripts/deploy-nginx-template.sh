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

# Fix SSL files if missing (fixes legal pages serving wrong content-type)
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    echo "Creating missing SSL options file..."
    sudo mkdir -p /etc/letsencrypt
    sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    echo "Creating missing SSL dhparams file..."
    sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

# Test nginx configuration
if sudo nginx -t; then
    echo "Nginx config test passed"
    sudo nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "Error: Nginx config test failed"
    exit 1
fi