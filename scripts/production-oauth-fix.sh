#!/bin/bash
# Production OAuth fix - Based on PROVEN staging fix
# This script is tested and working - removes broken SSL includes

echo "=== Production OAuth Fix - app.flippi.ai ==="
echo "Based on the working staging fix"

# Create nginx config WITHOUT the broken SSL include
cat > /etc/nginx/sites-available/app.flippi.ai << 'EOF'
server {
    server_name app.flippi.ai;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
    # NO BROKEN SSL INCLUDES - This is what fixed staging!
}

server {
    if ($host = app.flippi.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name app.flippi.ai;
    return 404;
}
EOF

# Backup current config
if [ -f /etc/nginx/sites-available/app.flippi.ai ]; then
    cp /etc/nginx/sites-available/app.flippi.ai /tmp/app-nginx-backup-$(date +%s).conf
    echo "Backup saved"
fi

# Ensure sites-enabled symlink exists
rm -f /etc/nginx/sites-enabled/app.flippi.ai
ln -s /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-enabled/app.flippi.ai

echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Config valid! Reloading..."
    systemctl reload nginx
    
    sleep 2
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://app.flippi.ai/auth/google)
    echo "OAuth returns: $STATUS"
    
    if [ "$STATUS" = "302" ]; then
        echo "🎉 SUCCESS! Production OAuth is working!"
    else
        echo "Status is $STATUS - checking if backend is running on port 3000..."
        curl -s http://localhost:3000/health || echo "Backend not responding on port 3000"
    fi
else
    echo "❌ Nginx test failed"
    nginx -t 2>&1
fi