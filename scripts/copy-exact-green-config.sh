#!/bin/bash
# Copy EXACT working configuration from green to blue
# This script analyzes what's different and replicates it exactly

echo "=== Copying EXACT green.flippi.ai configuration to blue.flippi.ai ==="

# Function to copy green's nginx config to blue
copy_green_nginx_to_blue() {
    echo "Step 1: Creating blue nginx config based on working green config"
    
    # This is the EXACT working configuration from green
    # Just changing the domain name and ports
    cat > /tmp/blue.nginx.exact.conf << 'EOF'
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

    # Growth routes (MUST BE BEFORE CATCH-ALL)
    location /growth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin routes
    location /admin {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Value routes
    location /value {
        proxy_pass http://localhost:3002;
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

    echo "✅ Created exact copy of green's working nginx config"
}

# Check if on server
if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    echo "On server - updating nginx configuration"
    
    # Backup current
    cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)
    
    # Copy exact config
    copy_green_nginx_to_blue
    cp /tmp/blue.nginx.exact.conf /etc/nginx/sites-available/blue.flippi.ai
    
    # Test and reload
    if nginx -t; then
        nginx -s reload
        echo "✅ Nginx reloaded with green's exact configuration"
        
        # Test
        sleep 2
        echo ""
        echo "Testing /growth/questions..."
        curl -sL https://blue.flippi.ai/growth/questions | head -20
    else
        echo "❌ Nginx config error - restoring backup"
        LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/blue.flippi.ai.backup.* | head -1)
        cp $LATEST_BACKUP /etc/nginx/sites-available/blue.flippi.ai
        nginx -s reload
    fi
else
    echo "Not on server - showing what would be configured"
    copy_green_nginx_to_blue
    echo ""
    echo "The exact green configuration has been prepared."
    echo "This is EXACTLY what works on green, just with blue's domain and ports."
fi

echo ""
echo "=== Key insight ==="
echo "Green's config has NO special handling for static assets or _expo folders"
echo "It simply proxies everything except specific routes to the frontend port"
echo "The growth routes work because they're defined BEFORE the catch-all /"