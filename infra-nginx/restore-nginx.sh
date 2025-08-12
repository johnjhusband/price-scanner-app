#!/bin/bash
# Restore nginx configuration from Git repository
set -euo pipefail

# Check arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 blue.flippi.ai"
    exit 1
fi

DOMAIN=$1

# Validate domain
if [[ ! "$DOMAIN" =~ ^(blue|green|app)\.flippi\.ai$ ]]; then
    echo "Error: Invalid domain. Must be blue.flippi.ai, green.flippi.ai, or app.flippi.ai"
    exit 1
fi

echo "Restoring Nginx config for $DOMAIN..."

# Remove immutability if set
sudo chattr -i /etc/nginx/sites-available/$DOMAIN 2>/dev/null || true
sudo chattr -i /etc/nginx/sites-enabled/$DOMAIN 2>/dev/null || true

# Copy config from Git repository location
sudo cp /opt/flippi/nginx/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN

# Create/update symlink
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test configuration
if ! sudo nginx -t; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Reload nginx
sudo systemctl reload nginx

# Set immutability
sudo chattr +i /etc/nginx/sites-available/$DOMAIN
sudo chattr +i /etc/nginx/sites-enabled/$DOMAIN

echo "✅ Nginx config restored from Git for $DOMAIN"

# Log the restoration
echo "[$(date -Iseconds)] Nginx config restored for $DOMAIN by $(whoami)" | sudo tee -a /var/log/nginx-restore.log