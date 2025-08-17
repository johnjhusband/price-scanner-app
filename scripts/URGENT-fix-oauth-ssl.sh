#!/bin/bash
# URGENT fix - Handle missing SSL files
set -e

echo "=== URGENT OAuth Fix - Handling SSL ==="

# Get the ACTUAL working nginx config
echo "Extracting current working config..."
nginx -T 2>/dev/null | awk '/server_name green.flippi.ai/,/^}/' > /tmp/current-green.conf

# Check if we got a config
if [ ! -s /tmp/current-green.conf ]; then
    echo "ERROR: Could not extract current nginx config"
    exit 1
fi

echo "Current config extracted. Adding OAuth..."

# Add OAuth location if missing
if ! grep -q "location /auth" /tmp/current-green.conf; then
    # Insert OAuth block before the last location or before SSL section
    awk '
    /listen 443 ssl/ && !done {
        print "    # OAuth routes"
        print "    location /auth {"
        print "        proxy_pass http://localhost:3001;"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        done = 1
    }
    { print }
    ' /tmp/current-green.conf > /tmp/green-with-oauth.conf
else
    cp /tmp/current-green.conf /tmp/green-with-oauth.conf
fi

# Save to sites-available
echo "Saving updated config..."
cp /tmp/green-with-oauth.conf /etc/nginx/sites-available/green.flippi.ai

# Test
echo "Testing nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading nginx..."
    systemctl reload nginx
    
    sleep 2
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
    echo "OAuth returns: $STATUS"
    
    if [ "$STATUS" = "302" ]; then
        echo "✅ SUCCESS!"
    fi
else
    echo "❌ Nginx test failed"
fi