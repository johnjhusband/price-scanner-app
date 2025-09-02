#!/bin/bash
# Deploy nginx configuration from Git to server
set -euo pipefail

# Check arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 <blue|green|prod>"
    exit 1
fi

HOST=$1
CONFIG_FILE="sites/flippi-${HOST}.conf"

# Validate host
if [[ ! "$HOST" =~ ^(blue|green|prod)$ ]]; then
    echo "Error: Invalid host. Must be 'blue', 'green', or 'prod'"
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "=== Deploying nginx config for $HOST ==="

# Remove immutability if set
echo "Removing immutability flags..."
sudo chattr -i /etc/nginx/sites-available/flippi.conf 2>/dev/null || true
sudo chattr -i /etc/nginx/sites-enabled/flippi.conf 2>/dev/null || true

# Copy snippets first
echo "Copying snippets..."
sudo mkdir -p /etc/nginx/snippets
sudo cp snippets/*.conf /etc/nginx/snippets/

# Backup existing config
if [ -f /etc/nginx/sites-available/flippi.conf ]; then
    echo "Backing up existing config..."
    sudo cp /etc/nginx/sites-available/flippi.conf "/etc/nginx/sites-available/flippi.conf.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Deploy new config
echo "Deploying new config..."
sudo cp "$CONFIG_FILE" /etc/nginx/sites-available/flippi.conf

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/flippi.conf ]; then
    echo "Creating symlink..."
    sudo ln -sf /etc/nginx/sites-available/flippi.conf /etc/nginx/sites-enabled/flippi.conf
fi

# Test configuration
echo "Testing nginx configuration..."
if ! sudo nginx -t; then
    echo "Error: Nginx configuration test failed!"
    echo "Rolling back..."
    # Restore backup if it exists
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/flippi.conf.backup.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/flippi.conf
        sudo nginx -t && sudo systemctl reload nginx
    fi
    exit 1
fi

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

# Set immutability
echo "Setting immutability flags..."
sudo chattr +i /etc/nginx/sites-available/flippi.conf
sudo chattr +i /etc/nginx/sites-enabled/flippi.conf

echo "✅ Nginx configuration deployed successfully!"

# Run smoke tests
echo ""
echo "Running smoke tests..."

# Determine domain based on host
case $HOST in
    blue) DOMAIN="blue.flippi.ai" ;;
    green) DOMAIN="green.flippi.ai" ;;
    prod) DOMAIN="app.flippi.ai" ;;
esac

# Test health endpoint
echo -n "Testing /health endpoint... "
if curl -f -s "https://$DOMAIN/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test API endpoint
echo -n "Testing /api/public/valuations endpoint... "
if curl -f -s "https://$DOMAIN/api/public/valuations" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test growth/questions endpoint
echo -n "Testing /growth/questions endpoint... "
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://$DOMAIN/growth/questions")
if [[ "$HTTP_CODE" =~ ^(200|302)$ ]]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== Deployment complete ==="