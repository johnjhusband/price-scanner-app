#!/bin/bash

echo "Please run this script and enter the password when prompted: Thisismynewpassword!"
echo ""
echo "Connecting to server..."
ssh root@157.245.142.145 << 'EOF'
echo "=== Checking /var/www/blue.flippi.ai/mobile-app/dist/_expo/static/js/web/ ==="
ls -la /var/www/blue.flippi.ai/mobile-app/dist/_expo/static/js/web/
echo ""
echo "=== Looking for bundle files ==="
find /var/www/blue.flippi.ai/mobile-app/dist/_expo/static/js/web/ -name "*.js" -type f -exec ls -la {} \;
echo ""
echo "=== Checking for 454acd2934be93420f33a84462ce4be2 bundle ==="
ls -la /var/www/blue.flippi.ai/mobile-app/dist/_expo/static/js/web/ | grep 454acd2934be93420f33a84462ce4be2 || echo "Old bundle 454acd2934be93420f33a84462ce4be2 not found"
EOF