#!/bin/bash
# Comprehensive fix for legal pages - ensures they work properly

# Detect environment
DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Comprehensive Legal Pages Fix for $DOMAIN ==="
echo "Port: $PORT"
echo ""

# Step 1: Verify backend is serving legal pages
echo "Step 1: Testing backend legal pages..."
BACKEND_TERMS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms)
BACKEND_PRIVACY=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/privacy)

echo "Backend /terms status: $BACKEND_TERMS"
echo "Backend /privacy status: $BACKEND_PRIVACY"

if [ "$BACKEND_TERMS" != "200" ] || [ "$BACKEND_PRIVACY" != "200" ]; then
    echo "ERROR: Backend is not serving legal pages correctly!"
    echo "Checking if files exist..."
    ls -la /var/www/$DOMAIN/mobile-app/terms.html 2>/dev/null || echo "terms.html not found!"
    ls -la /var/www/$DOMAIN/mobile-app/privacy.html 2>/dev/null || echo "privacy.html not found!"
    exit 1
fi

echo "✓ Backend is serving legal pages correctly"
echo ""

# Step 2: Backup current nginx config
echo "Step 2: Backing up nginx config..."
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.legal.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"
echo ""

# Step 3: Create clean nginx config with legal routes
echo "Step 3: Creating clean nginx config..."
cat > /tmp/nginx-$DOMAIN-legal << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    # Redirect HTTP to HTTPS
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
    
    # Legal pages - MUST come before catch-all location /
    location = /terms {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /privacy {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /mission {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /contact {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload settings
        client_max_body_size 10M;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Frontend - MUST come last
    location / {
        root /var/www/DOMAIN_PLACEHOLDER/mobile-app/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /tmp/nginx-$DOMAIN-legal
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /tmp/nginx-$DOMAIN-legal

echo "✓ Clean config created"
echo ""

# Step 4: Apply new config
echo "Step 4: Applying new nginx config..."
sudo cp /tmp/nginx-$DOMAIN-legal /etc/nginx/sites-available/$DOMAIN

# Update symlink
sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

echo "✓ Config applied"
echo ""

# Step 5: Test and reload nginx
echo "Step 5: Testing nginx config..."
if sudo nginx -t; then
    echo "✓ Nginx config is valid"
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "ERROR: Nginx config test failed! Restoring backup..."
    sudo cp /etc/nginx/sites-available/$DOMAIN.backup.legal.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/$DOMAIN
    sudo systemctl reload nginx
    exit 1
fi

echo ""

# Step 6: Verify legal pages work
echo "Step 6: Verifying legal pages..."
sleep 2

PUBLIC_TERMS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms)
PUBLIC_PRIVACY=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/privacy)

echo "Public /terms status: $PUBLIC_TERMS"
echo "Public /privacy status: $PUBLIC_PRIVACY"

if [ "$PUBLIC_TERMS" == "200" ] && [ "$PUBLIC_PRIVACY" == "200" ]; then
    echo ""
    echo "✅ SUCCESS! Legal pages are working correctly."
    echo ""
    echo "Test URLs:"
    echo "- https://$DOMAIN/terms"
    echo "- https://$DOMAIN/privacy"
    echo "- https://$DOMAIN/mission"
    echo "- https://$DOMAIN/contact"
else
    echo ""
    echo "⚠️  WARNING: Legal pages may not be accessible publicly yet."
    echo "This could be due to caching. Please test manually in a few moments."
fi

echo ""
echo "=== Legal Pages Fix Complete ==="