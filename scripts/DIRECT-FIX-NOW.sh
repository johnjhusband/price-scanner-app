#!/bin/bash
# DIRECT FIX - Get app working NOW

echo "=== DIRECT FIX - Making blue.flippi.ai work NOW ==="

# 1. Copy working files from green
echo "Step 1: Copying working frontend from green..."
rsync -av /var/www/green.flippi.ai/mobile-app/dist/ /var/www/blue.flippi.ai/mobile-app/dist/

# 2. Fix nginx to serve static files
echo "Step 2: Fixing nginx configuration..."
cat > /tmp/nginx-fix << 'EOF'
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
    
    # Create SSL files if missing
    if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
        echo "ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers \"ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256\";" > /etc/letsencrypt/options-ssl-nginx.conf
    fi
    
    if [ ! -f "/etc/letsencrypt/ssl-dhparams.pem" ]; then
        openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
    fi

    root /var/www/blue.flippi.ai/mobile-app/dist;
    index index.html;

    # SERVE STATIC FILES FIRST
    location /_expo/ {
        try_files $uri =404;
    }
    
    location /assets/ {
        try_files $uri =404;
    }
    
    location = /favicon.ico {
        try_files $uri =404;
    }
    
    location = /web-styles.css {
        try_files $uri =404;
    }

    # Growth routes
    location /growth {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
    }

    # Admin routes  
    location /admin {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3002;
    }

    # Legal pages
    location = /terms {
        proxy_pass http://localhost:3002/terms.html;
    }
    location = /privacy {
        proxy_pass http://localhost:3002/privacy.html;
    }

    # React catch-all - MUST BE LAST
    location / {
        try_files $uri /index.html;
    }
}
EOF

# 3. Apply nginx config
echo "Step 3: Applying nginx configuration..."
sudo cp /tmp/nginx-fix /etc/nginx/sites-available/blue.flippi.ai
sudo nginx -t && sudo nginx -s reload

# 4. Run database migration
echo "Step 4: Running database migration..."
cd /var/www/blue.flippi.ai/backend
export FEEDBACK_DB_PATH=/var/www/blue.flippi.ai/backend/flippi.db
node scripts/run-growth-analytics-migration.js || echo "Migration attempted"

# 5. Restart services
echo "Step 5: Restarting services..."
pm2 restart dev-backend dev-frontend

echo ""
echo "=== DONE - App should work NOW ==="
echo "Test at: https://blue.flippi.ai"