#!/bin/bash

# Fix PM2 Process Issues Script
# Issue #171: Fix PM2 Process Issues - Missing prod-frontend, dev-frontend errored
#
# Run this script on the production server to fix PM2 process issues

set -e

echo "=== PM2 Process Fix Script ==="
echo "This script will fix PM2 process configuration issues"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check PM2 status
check_pm2_status() {
    echo -e "${YELLOW}Current PM2 processes:${NC}"
    pm2 status
    echo ""
}

# Show current status
check_pm2_status

# Fix dev-frontend (errored state)
echo -e "${YELLOW}Fixing dev-frontend process...${NC}"
pm2 delete dev-frontend 2>/dev/null || true
cd /var/www/blue.flippi.ai

# Check if ecosystem.config.js exists
if [ -f "ecosystem.config.js" ]; then
    echo "Starting dev-frontend from ecosystem.config.js..."
    pm2 start ecosystem.config.js --only dev-frontend
else
    echo -e "${RED}Warning: ecosystem.config.js not found in /var/www/blue.flippi.ai${NC}"
    echo "Creating minimal dev-frontend process..."
    pm2 start "cd mobile-app && npm run start:web" --name dev-frontend
fi

echo -e "${GREEN}✓ dev-frontend fixed${NC}"
echo ""

# Fix missing prod-frontend
echo -e "${YELLOW}Fixing prod-frontend process...${NC}"
cd /var/www/app.flippi.ai

# Check if ecosystem.config.js exists
if [ -f "ecosystem.config.js" ]; then
    echo "Starting prod-frontend from ecosystem.config.js..."
    pm2 start ecosystem.config.js --only prod-frontend
else
    echo -e "${RED}Warning: ecosystem.config.js not found in /var/www/app.flippi.ai${NC}"
    echo "Checking if mobile-app directory exists..."
    if [ -d "mobile-app" ]; then
        echo "Creating prod-frontend process..."
        cd mobile-app
        pm2 start "npm run start:web" --name prod-frontend
    else
        echo -e "${RED}Error: mobile-app directory not found${NC}"
        echo "Production frontend may be served differently (e.g., nginx static files)"
    fi
fi

echo ""

# Save PM2 configuration
echo -e "${YELLOW}Saving PM2 configuration...${NC}"
pm2 save

# Set PM2 to restart on reboot
echo -e "${YELLOW}Setting PM2 startup configuration...${NC}"
pm2 startup systemd -u root --hp /root || true

echo ""

# Show final status
echo -e "${GREEN}=== Final PM2 Status ===${NC}"
check_pm2_status

# Check logs for any errors
echo -e "${YELLOW}Recent error logs:${NC}"
pm2 logs --lines 20 --err

echo ""
echo -e "${GREEN}=== PM2 Process Fix Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Check if all processes are running: pm2 status"
echo "2. Monitor logs: pm2 logs"
echo "3. If issues persist, check individual process logs:"
echo "   - pm2 logs dev-frontend"
echo "   - pm2 logs prod-frontend"