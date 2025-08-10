#!/bin/bash
# Apply the KNOWN WORKING nginx configuration from NGINX-CERTIFICATION-GUIDE.md

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Applying KNOWN WORKING nginx configuration for $DOMAIN ==="
echo "Based on the configuration that was previously confirmed to work"
echo ""

# Backup current config
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.known-working.$(date +%s)

# Create the exact configuration that worked
cat > /tmp/nginx-$DOMAIN-working << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Backend routes (MUST come before catch-all)
    
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
        proxy_pass http://localhost:$PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10m;
    }
    
    # Legal pages (exact match)
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
    
    # Health check
    location = /health {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
    
    # Frontend (React app) - catch-all MUST be last
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

# Apply the configuration
echo "Applying configuration..."
sudo cp /tmp/nginx-$DOMAIN-working /etc/nginx/sites-available/$DOMAIN

# Update symlink
sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test configuration
echo "Testing configuration..."
if sudo nginx -t; then
    echo "✓ Configuration is valid"
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
    
    # Test endpoints
    echo ""
    echo "Testing endpoints:"
    echo -n "Backend health: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health
    echo ""
    echo -n "Backend /terms: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms
    echo ""
    echo -n "Public /terms: "
    curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms
    echo ""
    echo -n "Public /privacy: "
    curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy
    echo ""
    
    echo ""
    echo "✅ Known working configuration applied!"
else
    echo "❌ Configuration test failed! Rolling back..."
    sudo cp /etc/nginx/sites-available/$DOMAIN.backup.known-working.* /etc/nginx/sites-available/$DOMAIN
    sudo systemctl reload nginx
    exit 1
fi