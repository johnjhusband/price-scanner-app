#!/bin/bash

echo "=== Checking Blue.flippi.ai Deployment Status ==="
echo "Date: $(date)"
echo ""

# Check git status
echo "1. Git status on server:"
echo "cd /var/www/blue.flippi.ai && git log -1 --oneline"
echo ""

# Check if download button exists in source
echo "2. Checking for download button in source code:"
echo "grep -n 'Download Image' /var/www/blue.flippi.ai/mobile-app/App.js || echo 'Not found in source'"
echo ""

# Check if deployment test message exists
echo "3. Checking for deployment test banner:"
echo "grep -n 'DEPLOYMENT BROKEN' /var/www/blue.flippi.ai/mobile-app/App.js || echo 'Test banner not found'"
echo ""

# Check dist directory
echo "4. Checking dist directory timestamp:"
echo "ls -la /var/www/blue.flippi.ai/mobile-app/dist/ | head -5"
echo ""

# Check if dist contains old code
echo "5. Checking if dist contains download button:"
echo "grep -r 'Download Image' /var/www/blue.flippi.ai/mobile-app/dist/ | wc -l"
echo ""

# Check PM2 status
echo "6. PM2 frontend status:"
echo "pm2 describe dev-frontend | grep -E 'status|uptime|restart time'"
echo ""

echo "=== Manual SSH commands to run: ==="
echo "ssh root@157.245.142.145"
echo "cd /var/www/blue.flippi.ai"
echo "git log -1 --oneline"
echo "grep 'Download Image' mobile-app/App.js"
echo "ls -la mobile-app/dist/"