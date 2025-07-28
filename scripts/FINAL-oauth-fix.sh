#!/bin/bash
# FINAL OAuth fix - Direct and simple

echo "FINAL OAUTH FIX - DIRECT APPROACH"
echo "================================="

# The EXACT nginx config we need
cat > /tmp/green-nginx-oauth.conf << 'EOF'
server {
    server_name green.flippi.ai;
    client_max_body_size 50M;

    # Frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
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

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = green.flippi.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name green.flippi.ai;
    return 404; # managed by Certbot
}
EOF

# Backup and replace
echo "Backing up current nginx config..."
cp /etc/nginx/sites-available/green.flippi.ai /tmp/nginx-backup-$(date +%s).conf

echo "Applying new config with OAuth..."
cp /tmp/green-nginx-oauth.conf /etc/nginx/sites-available/green.flippi.ai

echo "Testing nginx..."
nginx -t || { echo "FAILED nginx test"; exit 1; }

echo "Reloading nginx..."
systemctl reload nginx || nginx -s reload

echo "Testing OAuth..."
sleep 2
RESULT=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
echo "OAuth endpoint returns: $RESULT"

if [ "$RESULT" = "302" ] || [ "$RESULT" = "301" ]; then
    echo "✅ SUCCESS! OAuth is working!"
else
    echo "❌ FAILED - Still returns $RESULT"
fi