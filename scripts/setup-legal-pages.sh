#!/bin/bash

# Setup Legal Pages for Flippi.ai
# This script sets up static legal pages served directly by nginx
# for clean URLs and better SEO performance

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up Legal Pages for Flippi.ai ===${NC}"

# Define paths
LEGAL_DIR="/var/www/flippi/legal"
SOURCE_DIR="/home/flippi/app/mobile-app"
NGINX_CONFIG="/etc/nginx/sites-available/blue.flippi.ai"

# Create legal directory if it doesn't exist
echo -e "${YELLOW}Creating legal directory...${NC}"
sudo mkdir -p "$LEGAL_DIR"
sudo chown -R flippi:flippi "$LEGAL_DIR"

# Copy legal pages to the directory
echo -e "${YELLOW}Copying legal pages...${NC}"
if [ -f "$SOURCE_DIR/terms.html" ]; then
    sudo cp "$SOURCE_DIR/terms.html" "$LEGAL_DIR/"
    echo -e "${GREEN}✓ Copied terms.html${NC}"
else
    echo -e "${RED}✗ terms.html not found in $SOURCE_DIR${NC}"
fi

if [ -f "$SOURCE_DIR/privacy.html" ]; then
    sudo cp "$SOURCE_DIR/privacy.html" "$LEGAL_DIR/"
    echo -e "${GREEN}✓ Copied privacy.html${NC}"
else
    echo -e "${RED}✗ privacy.html not found in $SOURCE_DIR${NC}"
fi

# Set proper permissions
sudo chown -R www-data:www-data "$LEGAL_DIR"
sudo chmod -R 755 "$LEGAL_DIR"

# Check if the nginx config needs updating
echo -e "${YELLOW}Checking nginx configuration...${NC}"
if grep -q "try_files /legal/\$uri.html" "$NGINX_CONFIG"; then
    echo -e "${GREEN}✓ Nginx already configured for legal pages${NC}"
else
    echo -e "${YELLOW}Updating nginx configuration...${NC}"
    
    # Create a backup of the current config
    sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Add the legal pages location block before the main location /
    # This ensures legal pages are checked first
    sudo sed -i '/location \/ {/i\
    # Serve static legal pages\
    location ~ ^/(terms|privacy|about)$ {\
        root /var/www/flippi;\
        try_files /legal/$uri.html =404;\
        add_header Cache-Control "public, max-age=3600";\
    }\
' "$NGINX_CONFIG"
    
    echo -e "${GREEN}✓ Nginx configuration updated${NC}"
fi

# Test nginx configuration
echo -e "${YELLOW}Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
    
    # Reload nginx
    echo -e "${YELLOW}Reloading nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed!${NC}"
    echo -e "${RED}Rolling back changes...${NC}"
    sudo cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
    exit 1
fi

# Test the URLs
echo -e "${YELLOW}Testing legal page URLs...${NC}"
for page in terms privacy; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost/$page" | grep -q "200"; then
        echo -e "${GREEN}✓ /$page is accessible${NC}"
    else
        echo -e "${RED}✗ /$page returned an error${NC}"
    fi
done

echo -e "${GREEN}=== Legal pages setup complete! ===${NC}"
echo -e "${YELLOW}Future pages can be added by placing HTML files in: $LEGAL_DIR${NC}"
echo -e "${YELLOW}Example: $LEGAL_DIR/about.html will be available at /about${NC}"