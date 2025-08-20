#!/bin/bash
# Fix nginx to serve static files while preserving growth routes

DOMAIN=${1:-blue.flippi.ai}
echo "=== Fixing Nginx Static Files for $DOMAIN ==="

# Create a complete nginx config that includes EVERYTHING
cat > /tmp/nginx-site-config << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name DOMAIN_PLACEHOLDER;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/DOMAIN_PLACEHOLDER/mobile-app/dist;
    index index.html;

    # CRITICAL: Serve Expo static files FIRST
    location /_expo/ {
        alias /var/www/DOMAIN_PLACEHOLDER/mobile-app/dist/_expo/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Serve other static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Serve web-styles.css
    location = /web-styles.css {
        try_files $uri =404;
    }

    # Serve favicon
    location = /favicon.ico {
        try_files $uri =404;
    }

    # Growth routes (from Release 006)
    location /growth {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin routes (preserved)
    location /admin {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
    }

    # Legal pages
    location = /terms {
        proxy_pass http://localhost:PORT_PLACEHOLDER/terms.html;
    }
    location = /privacy {
        proxy_pass http://localhost:PORT_PLACEHOLDER/privacy.html;
    }
    location = /mission {
        proxy_pass http://localhost:PORT_PLACEHOLDER/mission.html;
    }
    location = /contact {
        proxy_pass http://localhost:PORT_PLACEHOLDER/contact.html;
    }

    # Value/blog routes
    location /value {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # React app catch-all - MUST BE LAST!
    location / {
        try_files $uri /index.html;
    }
}
EOF

# Determine port based on domain
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then
    PORT=3001
elif [[ "$DOMAIN" == "app.flippi.ai" ]]; then
    PORT=3000
fi

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /tmp/nginx-site-config
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /tmp/nginx-site-config

# Backup current config
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.$(date +%s)

# Apply new config
sudo cp /tmp/nginx-site-config /etc/nginx/sites-available/$DOMAIN

# Test nginx config
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    sudo nginx -s reload
    echo "✅ Nginx reloaded"
    
    # Test static file serving
    echo ""
    echo "Testing static file serving..."
    
    # Test JS file
    JS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/_expo/static/js/web/AppEntry-0ebd685d4b8a96c38ce187bfb06d785c.js)
    echo "JS file test: HTTP $JS_TEST"
    
    # Test growth route
    GROWTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions)
    echo "Growth route test: HTTP $GROWTH_TEST"
    
    # Test API
    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health)
    echo "API test: HTTP $API_TEST"
    
else
    echo "❌ Nginx configuration test failed! Rolling back..."
    sudo cp /etc/nginx/sites-available/$DOMAIN.backup.$(date +%s) /etc/nginx/sites-available/$DOMAIN
    exit 1
fi

echo ""
echo "=== Fix complete! App should load now ==="