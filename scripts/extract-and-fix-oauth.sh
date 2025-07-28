#!/bin/bash
# Extract working nginx config and add OAuth - The REAL fix after 36 hours

echo "=== Extracting Working Nginx Config and Adding OAuth ==="

# First, check current OAuth status
echo "Current OAuth status:"
curl -s -o /dev/null -w "%{http_code}\n" -I https://green.flippi.ai/auth/google

# Get the current WORKING config from nginx
echo ""
echo "Extracting current working nginx config..."
nginx -T 2>/dev/null > /tmp/nginx-dump.txt

# Extract just the green.flippi.ai server blocks
awk '/server_name green\.flippi\.ai;/,/^}$/ { 
    if (/server {/) { if (in_block) print buf; buf=""; in_block=1 }
    if (in_block) buf = buf $0 "\n"
    if (/^}$/ && in_block) { print buf; in_block=0; buf="" }
}' /tmp/nginx-dump.txt > /tmp/green-current.conf

# Check if we have SSL server block
if grep -q "listen 443" /tmp/green-current.conf; then
    echo "Found SSL server block"
    
    # Extract SSL server block and add OAuth
    awk '
    /listen 443/ { in_ssl=1 }
    in_ssl && /location \// && !oauth_added {
        print "    # OAuth routes (ADDED BY SCRIPT)"
        print "    location /auth {"
        print "        proxy_pass http://localhost:3001;"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        oauth_added=1
    }
    { print }
    ' /tmp/green-current.conf > /etc/nginx/sites-available/green.flippi.ai
else
    echo "ERROR: No SSL server block found"
    exit 1
fi

echo ""
echo "Testing new configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Config valid! Reloading nginx..."
    systemctl reload nginx
    
    sleep 2
    echo ""
    echo "Testing OAuth endpoint..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
    echo "OAuth endpoint returns: $STATUS"
    
    if [ "$STATUS" = "302" ]; then
        echo ""
        echo "🎉 SUCCESS! OAuth is finally working after 36 hours!"
    else
        echo "Still not working. Checking if OAuth block was added:"
        grep -A5 "location /auth" /etc/nginx/sites-available/green.flippi.ai || echo "OAuth block missing!"
    fi
else
    echo "ERROR: Nginx config test failed!"
    nginx -t 2>&1
fi