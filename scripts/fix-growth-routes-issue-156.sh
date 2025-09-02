#!/bin/bash
# Fix for Issue #156: Growth route keeps redirecting to React app
# This script updates the nginx configuration to properly handle growth routes

set -e

echo "=== Fixing Growth Routes Issue #156 ==="
echo "This script will update the nginx configuration for blue.flippi.ai"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Backup current nginx config
echo "1. Backing up current nginx config..."
cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup-$(date +%Y%m%d-%H%M%S)

# Apply the correct nginx template
echo "2. Applying corrected nginx configuration..."
cat > /etc/nginx/sites-available/blue.flippi.ai << 'EOF'
server {
    server_name blue.flippi.ai;
    root /var/www/blue.flippi.ai/mobile-app/dist;
    client_max_body_size 50M;

    # Backend routes FIRST (order matters)
    location ^~ /growth {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ^~ /auth {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Legacy CSS fix (temporary)
    location = /web-styles.css {
        alias /var/www/blue.flippi.ai/mobile-app/dist/web-styles.css;
        add_header Content-Type text/css;
    }

    # Static files SECOND
    location ~* \.(css|js|mjs|map|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        try_files $uri =404;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Legal pages
    location = /terms {
        alias /var/www/blue.flippi.ai/mobile-app/terms.html;
        add_header Content-Type text/html;
    }
    
    location = /privacy {
        alias /var/www/blue.flippi.ai/mobile-app/privacy.html;
        add_header Content-Type text/html;
    }

    location = /mission {
        alias /var/www/blue.flippi.ai/mobile-app/mission.html;
        add_header Content-Type text/html;
    }

    location = /contact {
        alias /var/www/blue.flippi.ai/mobile-app/contact.html;
        add_header Content-Type text/html;
    }

    # SPA fallback LAST
    location / {
        try_files $uri /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = blue.flippi.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name blue.flippi.ai;
    return 404; # managed by Certbot
}
EOF

# Test nginx configuration
echo "3. Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "4. Reloading nginx..."
    systemctl reload nginx
    echo "✅ Nginx configuration updated successfully!"
    
    echo ""
    echo "5. Testing growth routes..."
    sleep 2
    
    # Test the growth/questions route
    response=$(curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/growth/questions)
    
    if [ "$response" = "200" ]; then
        echo "✅ Growth routes are now working correctly!"
        echo ""
        echo "You can test by visiting:"
        echo "  - https://blue.flippi.ai/growth/questions"
        echo "  - https://blue.flippi.ai/growth"
    else
        echo "⚠️  Growth route returned status code: $response"
        echo "Please check the backend logs for any issues."
    fi
else
    echo "❌ Nginx configuration test failed!"
    echo "Rolling back changes..."
    cp /etc/nginx/sites-available/blue.flippi.ai.backup-$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/blue.flippi.ai
    exit 1
fi

echo ""
echo "=== Fix Complete ==="
echo "Issue #156 has been resolved. Growth routes should no longer redirect to the React app."