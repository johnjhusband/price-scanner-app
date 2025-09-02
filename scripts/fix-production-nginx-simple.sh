#!/bin/bash
# Simple working nginx config for production

echo "=== Applying simple working nginx config ==="

# Backup current config
sudo cp /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-available/app.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Create simple working config
sudo tee /etc/nginx/sites-available/app.flippi.ai > /dev/null << 'EOF'
server {
    server_name app.flippi.ai;
    client_max_body_size 50M;

    # Frontend - serve from PM2
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legal pages
    location = /terms {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /privacy {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /mission {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /contact {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = app.flippi.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name app.flippi.ai;
    return 404; # managed by Certbot
}
EOF

# Test config
if sudo nginx -t; then
    echo "Config valid, reloading nginx..."
    sudo systemctl reload nginx
    
    # Ensure PM2 frontend is running on port 8080
    echo "Checking PM2 frontend..."
    if ! pm2 describe prod-frontend > /dev/null 2>&1; then
        echo "Starting PM2 frontend on port 8080..."
        cd /var/www/app.flippi.ai/mobile-app
        pm2 start "npx serve -s dist -l 8080" --name prod-frontend
    else
        pm2 restart prod-frontend
    fi
    
    echo "✅ Nginx fixed and PM2 frontend running!"
else
    echo "❌ Config invalid!"
    sudo nginx -t
fi