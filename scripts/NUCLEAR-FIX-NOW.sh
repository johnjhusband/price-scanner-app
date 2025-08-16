#!/bin/bash
# NUCLEAR OPTION - Copy working green to blue

echo "=== NUCLEAR FIX - COPYING GREEN TO BLUE ==="

# This WILL work because green is working
rsync -av --delete /var/www/green.flippi.ai/mobile-app/dist/ /var/www/blue.flippi.ai/mobile-app/dist/

echo "=== Files copied. Restarting PM2 ==="
pm2 restart dev-frontend

echo "=== DONE. App should work NOW. ==="