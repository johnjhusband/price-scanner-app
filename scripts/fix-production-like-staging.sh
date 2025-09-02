#!/bin/bash
# Fix production to work like staging (which is working)

echo "=== Fixing production nginx to match staging setup ==="

# Create nginx config that proxies to PM2 like staging
sudo tee /etc/nginx/sites-available/app.flippi.ai > /dev/null << 'EOF'
server {
    server_name app.flippi.ai;
    client_max_body_size 50M;

    # Frontend - proxy to PM2 serve
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
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

# Test nginx config
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx config updated"
else
    echo "❌ Nginx config failed"
    exit 1
fi

# Ensure PM2 is serving frontend on port 8080
echo "Setting up PM2 frontend..."
cd /var/www/app.flippi.ai/mobile-app

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory not found!"
    ls -la
    exit 1
fi

# Stop any existing prod-frontend
pm2 delete prod-frontend 2>/dev/null || true

# Start frontend serve
pm2 start "npx serve -s dist -l 8080" --name prod-frontend
pm2 save

echo "✅ Production fixed to match staging setup!"
pm2 list