#!/bin/bash

# SECURITY NOTE: Use SSH key authentication instead of passwords
# To set up SSH keys:
# 1. Generate a key pair: ssh-keygen -t ed25519 -f ~/.ssh/flippi_server_key
# 2. Copy to server: ssh-copy-id -i ~/.ssh/flippi_server_key.pub root@157.245.142.145
# 3. Use: ssh -i ~/.ssh/flippi_server_key root@157.245.142.145

echo "Connecting to server..."
echo "Note: This script requires SSH key authentication to be configured"
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