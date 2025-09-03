#!/bin/bash
set -euo pipefail

echo "✨ Replacing nginx configuration..."

# Backup current config
cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Copy new clean config
cp /var/www/blue.flippi.ai/nginx/blue.flippi.ai.clean.conf /etc/nginx/sites-available/blue.flippi.ai

# Ensure symlink exists
ln -sf /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/blue.flippi.ai

# Test and reload
nginx -t && nginx -s reload

echo "✅ Nginx configuration replaced with clean version"