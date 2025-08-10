#!/bin/bash
# Direct nginx fix - ensure legal pages are proxied to backend

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Direct Nginx Fix for Legal Pages on $DOMAIN ==="

# First, let's see what the current nginx config looks like
echo "Current nginx config structure:"
sudo grep -n "location" /etc/nginx/sites-available/$DOMAIN | head -20

# The issue is likely that the frontend location / block is catching everything
# We need to ensure legal routes are defined INSIDE the server block but BEFORE location /

# Create a working nginx config from scratch
cat > /tmp/nginx-$DOMAIN-fixed << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Legal pages - MUST come first
    location = /terms {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /privacy {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /mission {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /contact {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
    
    # Frontend - MUST come last
    location / {
        root /var/www/$DOMAIN/mobile-app/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Backup and apply
echo "Backing up current config..."
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.direct.$(date +%s)

echo "Applying fixed config..."
sudo cp /tmp/nginx-$DOMAIN-fixed /etc/nginx/sites-available/$DOMAIN

# Update symlink
sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✓ Config is valid, reloading nginx..."
    sudo systemctl reload nginx
    
    # Quick test
    sleep 1
    echo ""
    echo "Testing legal pages:"
    echo -n "Backend /terms: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms
    echo ""
    echo -n "Public /terms: "
    curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms
    echo ""
    
    echo "✅ Nginx fixed and reloaded!"
else
    echo "❌ Config test failed! Rolling back..."
    LATEST=$(ls -t /etc/nginx/sites-available/$DOMAIN.backup.* | head -1)
    sudo cp $LATEST /etc/nginx/sites-available/$DOMAIN
    sudo systemctl reload nginx
    exit 1
fi