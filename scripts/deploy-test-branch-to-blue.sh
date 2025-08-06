#!/bin/bash
# Deploy test/2025-design-refresh branch to blue.flippi.ai temporarily

echo "=== Deploying test/2025-design-refresh to blue.flippi.ai ==="
echo "This will temporarily replace the develop branch deployment"
echo ""

# SSH command to deploy test branch
ssh root@157.245.142.145 << 'EOF'
cd /var/www/blue.flippi.ai

# Save current branch for later
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Fetch and checkout test branch
git fetch origin test/2025-design-refresh
git checkout test/2025-design-refresh
git reset --hard origin/test/2025-design-refresh

# Install and build
cd backend && npm install --production
cd ../mobile-app && npm install && npx expo export --platform web --output-dir dist

# Restart services
pm2 restart dev-backend dev-frontend

# Wait for services
sleep 5

# Check status
pm2 status
curl -s http://localhost:3002/health | jq '.'

echo ""
echo "=== Deployment complete! ==="
echo "blue.flippi.ai is now running test/2025-design-refresh branch"
echo "To restore develop branch later, run: git checkout develop && git pull"
EOF