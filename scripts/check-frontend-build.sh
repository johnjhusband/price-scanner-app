#!/bin/bash
# Check frontend build status on server

ENV=${1:-prod}
if [ "$ENV" = "prod" ]; then
    DOMAIN="app.flippi.ai"
    PM2_PREFIX="prod"
else
    echo "Usage: $0 [prod|staging|dev]"
    exit 1
fi

echo "=== Checking Frontend Build for $DOMAIN ==="
echo ""

echo "1. Check if dist directory exists:"
echo "   ssh root@157.245.142.145 'ls -la /var/www/$DOMAIN/mobile-app/ | grep dist'"
echo ""

echo "2. Check dist directory contents:"
echo "   ssh root@157.245.142.145 'ls -la /var/www/$DOMAIN/mobile-app/dist/ | head -10'"
echo ""

echo "3. Check index.html in dist:"
echo "   ssh root@157.245.142.145 'cat /var/www/$DOMAIN/mobile-app/dist/index.html | grep -E \"(script|title)\" | head -10'"
echo ""

echo "4. Check PM2 frontend configuration:"
echo "   ssh root@157.245.142.145 'pm2 describe $PM2_PREFIX-frontend | grep -E \"exec cwd|script\"'"
echo ""

echo "5. Check for build errors in recent deployment:"
echo "   ssh root@157.245.142.145 'cd /var/www/$DOMAIN && git log --oneline -1 && echo \"\" && ls -la mobile-app/dist/ 2>&1 | head -5'"
echo ""

echo "Run these commands manually to diagnose the issue."