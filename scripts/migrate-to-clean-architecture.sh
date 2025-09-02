#!/bin/bash

# Migration script for Issue #158: Clean Frontend Architecture
# This script helps transition from the old mobile-app setup to the new frontend-only setup

echo "=== Clean Frontend Architecture Migration ==="
echo "This script will help migrate blue.flippi.ai to the new architecture"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on the server
if [ ! -d "/var/www/blue.flippi.ai" ]; then
    echo -e "${RED}Error: This script must be run on the blue.flippi.ai server${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backup current setup${NC}"
sudo cp -r /var/www/blue.flippi.ai /var/www/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"

echo -e "${YELLOW}Step 2: Clean up old Expo cache and build artifacts${NC}"
cd /var/www/blue.flippi.ai/mobile-app || exit 1

# Remove all Expo and build artifacts
rm -rf .expo
rm -rf .expo-shared
rm -rf dist
rm -rf web-build
rm -rf node_modules/.cache
rm -rf .cache

# Clean npm cache
npm cache clean --force

echo -e "${GREEN}✓ Old cache and artifacts removed${NC}"

echo -e "${YELLOW}Step 3: Create new frontend directory structure${NC}"
sudo mkdir -p /var/www/blue.flippi.ai/frontend
sudo chown $USER:$USER /var/www/blue.flippi.ai/frontend
echo -e "${GREEN}✓ New frontend directory created${NC}"

echo -e "${YELLOW}Step 4: Update PM2 configuration${NC}"
# Stop and remove old PM2 process
pm2 stop prod-frontend || true
pm2 delete prod-frontend || true

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✓ PM2 configuration updated${NC}"

echo -e "${YELLOW}Step 5: Create deployment marker${NC}"
cat > /var/www/blue.flippi.ai/.clean-architecture-ready << EOF
{
  "migrated": true,
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "oldPath": "/var/www/blue.flippi.ai/mobile-app",
  "newPath": "/var/www/blue.flippi.ai/frontend"
}
EOF

echo -e "${GREEN}✓ Migration marker created${NC}"

echo ""
echo -e "${GREEN}=== Migration Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Push code to develop branch to trigger the new deployment workflow"
echo "2. Monitor the GitHub Actions for successful deployment"
echo "3. Verify the site is working at https://blue.flippi.ai"
echo ""
echo "If issues occur, you can restore from backup:"
echo "  sudo rm -rf /var/www/blue.flippi.ai"
echo "  sudo mv /var/www/blue.flippi.ai.backup.[timestamp] /var/www/blue.flippi.ai"
echo ""
echo -e "${YELLOW}Note: The first deployment will take longer as it sets up the new structure${NC}"