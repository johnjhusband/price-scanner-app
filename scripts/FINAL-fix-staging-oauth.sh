#!/bin/bash
# FINAL OAuth fix - This WILL work because it handles the sites-enabled symlink
# After 36 hours, we discovered nginx reads from sites-enabled, not sites-available!

set -e

echo "=== FINAL OAuth Fix for Staging ==="
echo "This addresses the 36-hour issue: nginx reads from sites-enabled!"

# Show what nginx is ACTUALLY using
echo ""
echo "Current nginx configuration source:"
ls -la /etc/nginx/sites-enabled/ | grep green || echo "No green.flippi.ai in sites-enabled!"

# Update sites-available with OAuth
echo ""
echo "Creating complete nginx config with OAuth in sites-available..."
cat > /etc/nginx/sites-available/green.flippi.ai << 'EOF'
server {
    server_name green.flippi.ai;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = green.flippi.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name green.flippi.ai;
    return 404;
}
EOF

# THE CRITICAL FIX: Update sites-enabled symlink!
echo ""
echo "CRITICAL: Updating sites-enabled symlink..."
rm -f /etc/nginx/sites-enabled/green.flippi.ai
ln -s /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/green.flippi.ai

echo "Symlink created:"
ls -la /etc/nginx/sites-enabled/green.flippi.ai

# Test and reload
echo ""
echo "Testing nginx configuration..."
nginx -t

echo ""
echo "Reloading nginx..."
systemctl reload nginx

# Verify OAuth works
echo ""
echo "Testing OAuth endpoint..."
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
echo "OAuth endpoint returns: $STATUS"

if [ "$STATUS" = "302" ]; then
    echo ""
    echo "🎉 SUCCESS! After 36 hours, OAuth is finally working!"
    echo "The issue was nginx reading from sites-enabled, not sites-available"
else
    echo ""
    echo "Still returns $STATUS. Checking nginx active config:"
    nginx -T | grep -A5 "location /auth" || echo "OAuth block still missing!"
fi