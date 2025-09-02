#!/bin/bash

# Fix growth routes in nginx configuration for blue.flippi.ai
# Issue #156: Growth routes redirecting to React app

echo "Fixing growth routes in nginx configuration..."

# Create backup
sudo cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Create the updated configuration
cat > /tmp/blue.flippi.ai.conf << 'EOF'
server {
    server_name blue.flippi.ai;
    client_max_body_size 50M;

    # Backend API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Growth routes - MUST be before catch-all
    # More specific paths first
    location ^~ /growth/questions {
        proxy_pass http://localhost:3002/growth/questions;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /growth/admin {
        proxy_pass http://localhost:3002/growth/admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /growth/analytics {
        proxy_pass http://localhost:3002/growth/analytics;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # General growth route
    location ^~ /growth {
        proxy_pass http://localhost:3002/growth;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Legal pages (if static files exist)
    location = /terms {
        alias /var/www/blue.flippi.ai/mobile-app/terms.html;
    }
    
    location = /privacy {
        alias /var/www/blue.flippi.ai/mobile-app/privacy.html;
    }

    # Frontend - all other routes (must be last)
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

# Copy the configuration
sudo cp /tmp/blue.flippi.ai.conf /etc/nginx/sites-available/blue.flippi.ai

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration test passed. Reloading nginx..."
    sudo nginx -s reload
    echo "Growth routes fix applied successfully!"
    
    # Test the routes
    echo ""
    echo "Testing growth routes..."
    echo "Testing /growth/questions:"
    curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/growth/questions
    echo ""
else
    echo "ERROR: nginx configuration test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/blue.flippi.ai
    exit 1
fi