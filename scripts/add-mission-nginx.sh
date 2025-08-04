#!/bin/bash
# Add only the mission route to nginx configuration

DOMAIN="blue.flippi.ai"
PORT="3002"

echo "Adding mission route to nginx configuration for $DOMAIN..."

# Check if mission route already exists
if grep -q "location = /mission" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
    echo "Mission route already exists!"
    exit 0
fi

# Create a temporary file with just the mission route
cat > /tmp/mission-route.conf << 'EOF'

    location = /mission {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Backup current config
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.mission.$(date +%Y%m%d_%H%M%S)

# Find the line with "location /" and insert mission route before it
sudo sed -i '/location \/ {/i\
    location = /mission {\
        proxy_pass http://localhost:3002;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' /etc/nginx/sites-available/$DOMAIN

# Test nginx config
if sudo nginx -t; then
    echo "Nginx config test passed! Reloading nginx..."
    sudo systemctl reload nginx
    echo "Mission route added successfully!"
else
    echo "Nginx config test failed! Rolling back..."
    sudo cp /etc/nginx/sites-available/$DOMAIN.backup.mission.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/$DOMAIN
    exit 1
fi