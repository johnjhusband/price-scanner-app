#!/bin/bash
# Quick script to add mission route to nginx config

echo "This script will add the /mission route to nginx configuration for blue.flippi.ai"
echo "Run this on the server as: sudo bash add-mission-route.sh"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Backup current config
cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Check if mission route already exists
if grep -q "location = /mission" /etc/nginx/sites-available/blue.flippi.ai; then
    echo "Mission route already exists!"
    exit 0
fi

# Add mission route after privacy route
sed -i '/location = \/privacy {/,/}/a\
\
    location = /mission {\
        proxy_pass http://localhost:3002;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }' /etc/nginx/sites-available/blue.flippi.ai

# Test nginx config
if nginx -t; then
    echo "Nginx config test passed! Reloading nginx..."
    systemctl reload nginx
    echo "Mission route added successfully!"
    
    # Test the route
    echo ""
    echo "Testing mission route..."
    curl -I http://localhost:3002/mission
else
    echo "Nginx config test failed! Rolling back..."
    cp /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/blue.flippi.ai
    exit 1
fi