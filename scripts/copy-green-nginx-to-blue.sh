#!/bin/bash
# Copy working nginx config from green.flippi.ai to blue.flippi.ai
# Since green is working correctly, we'll use it as the template

echo "=== Copying working nginx config from green to blue ==="

# Function to update nginx config
update_blue_nginx() {
    local CONFIG_FILE="/etc/nginx/sites-available/blue.flippi.ai"
    
    # Backup current config
    cp $CONFIG_FILE ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)
    
    # Create new config based on green but with blue settings
    cat > $CONFIG_FILE << 'EOF'
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

    location = /mission {
        alias /var/www/blue.flippi.ai/mobile-app/mission.html;
    }

    location = /contact {
        alias /var/www/blue.flippi.ai/mobile-app/contact.html;
    }

    # Static assets from dist directory
    location ~ ^/(.*\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
        root /var/www/blue.flippi.ai/mobile-app/dist;
        try_files /$1 =404;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
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

    echo "✅ Created new nginx config for blue.flippi.ai"
}

# Check if running on server
if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    echo "Running on server, updating nginx config..."
    update_blue_nginx
    
    # Test configuration
    if nginx -t; then
        echo "✅ Nginx configuration is valid"
        nginx -s reload
        echo "✅ Nginx reloaded"
        
        # Test the routes
        sleep 2
        echo ""
        echo "Testing routes..."
        curl -s -o /dev/null -w "GET /growth/questions: %{http_code}\n" https://blue.flippi.ai/growth/questions
        curl -s -o /dev/null -w "GET /web-styles.css: %{http_code}\n" https://blue.flippi.ai/web-styles.css
    else
        echo "❌ Nginx configuration has errors!"
        # Restore backup
        LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/blue.flippi.ai.backup.* | head -1)
        cp $LATEST_BACKUP /etc/nginx/sites-available/blue.flippi.ai
        echo "Restored previous configuration"
    fi
else
    echo "Not on server, showing what would be configured..."
    echo "The nginx config would include:"
    echo "- API routes on port 3002"
    echo "- Growth, admin, and value routes"
    echo "- Static asset handling for CSS/JS files"
    echo "- Legal pages"
    echo "- Frontend catch-all as last route"
fi

echo ""
echo "=== Complete ==="