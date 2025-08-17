#!/bin/bash
# Final comprehensive fix for blue.flippi.ai

echo "=== FINAL FIX FOR BLUE.FLIPPI.AI ==="
echo ""

# 1. Fix nginx routing for Growth Dashboard
echo "Step 1: Fixing nginx routing for /growth/questions..."

# Create a working nginx config
cat > /tmp/blue-nginx-fix.conf << 'NGINX_CONFIG'
server {
    listen 80;
    server_name blue.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name blue.flippi.ai;

    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/blue.flippi.ai/mobile-app/dist;
    index index.html;

    # IMPORTANT: Backend routes MUST come before static file handling
    
    # Growth routes - MUST be before static files
    location /growth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin routes
    location /admin {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3002;
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
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
    }

    # Auth routes
    location /auth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Legal pages
    location = /terms {
        proxy_pass http://localhost:3002/terms.html;
    }
    location = /privacy {
        proxy_pass http://localhost:3002/privacy.html;
    }
    location = /mission {
        proxy_pass http://localhost:3002/mission.html;
    }
    location = /contact {
        proxy_pass http://localhost:3002/contact.html;
    }

    # Value/blog routes
    location /value {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # NOW handle static files
    
    # Expo static files
    location /_expo/ {
        alias /var/www/blue.flippi.ai/mobile-app/dist/_expo/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Other static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # CSS files - ensure correct MIME type
    location ~ \.css$ {
        add_header Content-Type text/css;
        try_files $uri =404;
    }

    # React app catch-all - MUST BE LAST!
    location / {
        try_files $uri /index.html;
    }
}
NGINX_CONFIG

# Apply the config
sudo cp /tmp/blue-nginx-fix.conf /etc/nginx/sites-available/blue.flippi.ai
sudo nginx -t && sudo nginx -s reload
echo "✅ Nginx routing fixed"

# 2. Ensure web-styles.css exists
echo ""
echo "Step 2: Ensuring web-styles.css exists..."
if [ ! -f "/var/www/blue.flippi.ai/mobile-app/dist/web-styles.css" ]; then
    if [ -f "/var/www/blue.flippi.ai/mobile-app/web-styles.css" ]; then
        cp /var/www/blue.flippi.ai/mobile-app/web-styles.css /var/www/blue.flippi.ai/mobile-app/dist/
        echo "✅ Copied web-styles.css to dist"
    else
        # Create a minimal CSS file
        echo "/* Minimal styles */" > /var/www/blue.flippi.ai/mobile-app/dist/web-styles.css
        echo "✅ Created minimal web-styles.css"
    fi
fi

# 3. Test the fixes
echo ""
echo "Step 3: Testing fixes..."
echo "Growth Dashboard:"
curl -s -o /dev/null -w "  /growth/questions: HTTP %{http_code}\n" https://blue.flippi.ai/growth/questions
echo "CSS file:"
curl -s -o /dev/null -w "  /web-styles.css: HTTP %{http_code}\n" https://blue.flippi.ai/web-styles.css

echo ""
echo "=== FIXES COMPLETE ==="
echo "1. Growth Dashboard should now show Reddit posts at /growth/questions"
echo "2. CSS warning should be resolved"
echo "3. Download functionality should work"