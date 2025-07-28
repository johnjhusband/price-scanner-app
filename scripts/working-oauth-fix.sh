#!/bin/bash
# The ACTUAL working fix - no broken SSL includes

echo "=== Working OAuth Fix - No Broken SSL Includes ==="

# Create nginx config WITHOUT the broken SSL include
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

    # OAuth routes
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
    # NO BROKEN INCLUDES HERE!
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

# Ensure sites-enabled symlink exists
rm -f /etc/nginx/sites-enabled/green.flippi.ai
ln -s /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/green.flippi.ai

echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Config valid! Reloading..."
    systemctl reload nginx
    
    sleep 2
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://green.flippi.ai/auth/google)
    echo "OAuth returns: $STATUS"
    
    if [ "$STATUS" = "302" ]; then
        echo "🎉 SUCCESS!"
    fi
else
    echo "❌ Test failed - showing error:"
    nginx -t 2>&1
fi