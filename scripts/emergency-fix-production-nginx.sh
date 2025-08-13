#!/bin/bash
# Emergency fix for production nginx configuration
# This script replaces the broken nginx config to restore service

echo "=== EMERGENCY PRODUCTION NGINX FIX ==="
echo ""

# Backup current config
echo "1. Backing up current config..."
sudo cp /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-available/app.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Create the correct nginx configuration
echo "2. Creating correct nginx configuration..."
sudo tee /etc/nginx/sites-available/app.flippi.ai > /dev/null << 'EOF'
server {
    server_name app.flippi.ai;
    client_max_body_size 50M;

    # Handle web-styles.css - just serve the actual file
    location = /web-styles.css {
        root /var/www/app.flippi.ai/mobile-app;
        try_files /web-styles.css /dist/web-styles.css =404;
    }

    # Serve static files directly from dist directory
    location / {
        root /var/www/app.flippi.ai/mobile-app/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

    # Legal pages - serve directly from backend
    location = /terms {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /privacy {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /mission {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /contact {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

echo "3. Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx config is valid!"
    
    echo "4. Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "5. Testing site response..."
    sleep 2
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://app.flippi.ai/ || echo "000")
    echo "Site response: $RESPONSE"
    
    if [ "$RESPONSE" = "200" ]; then
        echo "🎉 SUCCESS! Site is back online!"
    else
        echo "⚠️  Site responding but may need more fixes"
    fi
else
    echo "❌ Nginx config test failed!"
    echo "Rolling back to backup..."
    sudo cp /etc/nginx/sites-available/app.flippi.ai.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/app.flippi.ai
    sudo nginx -t
fi

echo ""
echo "=== Emergency fix complete ==="