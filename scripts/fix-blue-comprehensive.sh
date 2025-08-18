#!/bin/bash
# Comprehensive fix for blue.flippi.ai - ensures backend is running and nginx is configured

echo "=== Comprehensive fix for blue.flippi.ai ==="

# Function to check if a process is listening on a port
check_port() {
    local PORT=$1
    if netstat -tuln | grep -q ":$PORT "; then
        echo "✅ Port $PORT is listening"
        return 0
    else
        echo "❌ Port $PORT is NOT listening"
        return 1
    fi
}

# 1. Check and fix PM2 processes
echo ""
echo "=== Checking PM2 processes ==="

# Check if dev-backend is running
if pm2 show dev-backend >/dev/null 2>&1; then
    echo "dev-backend process exists"
    
    # Check if it's actually running
    STATUS=$(pm2 show dev-backend | grep status | awk '{print $4}')
    if [ "$STATUS" != "online" ]; then
        echo "❌ dev-backend is $STATUS, restarting..."
        pm2 restart dev-backend
        sleep 5
    else
        echo "✅ dev-backend is online"
    fi
else
    echo "❌ dev-backend not found, starting it..."
    cd /var/www/blue.flippi.ai/backend
    pm2 start server.js --name dev-backend -- --port 3002
    pm2 save
    sleep 5
fi

# Check if dev-frontend is running
if pm2 show dev-frontend >/dev/null 2>&1; then
    echo "dev-frontend process exists"
    
    STATUS=$(pm2 show dev-frontend | grep status | awk '{print $4}')
    if [ "$STATUS" != "online" ]; then
        echo "❌ dev-frontend is $STATUS, restarting..."
        pm2 restart dev-frontend
        sleep 5
    else
        echo "✅ dev-frontend is online"
    fi
else
    echo "❌ dev-frontend not found, starting it..."
    cd /var/www/blue.flippi.ai/mobile-app
    pm2 start "npx serve dist -p 8082" --name dev-frontend
    pm2 save
    sleep 5
fi

# 2. Verify ports are listening
echo ""
echo "=== Verifying ports ==="
check_port 3002
check_port 8082

# 3. Test backend health
echo ""
echo "=== Testing backend health ==="
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
    echo "Checking PM2 logs..."
    pm2 logs dev-backend --lines 20 --nostream
fi

# 4. Update nginx configuration with working setup
echo ""
echo "=== Updating nginx configuration ==="

# Backup current config
cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%Y%m%d_%H%M%S)

# Create comprehensive nginx config
cat > /etc/nginx/sites-available/blue.flippi.ai << 'EOF'
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # OAuth routes
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

    # Growth routes
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

    # Legal pages
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

    # Static assets
    location ~ ^/(.*\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map))$ {
        root /var/www/blue.flippi.ai/mobile-app/dist;
        try_files /$1 @frontend;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Frontend fallback
    location @frontend {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

echo "✅ Nginx configuration updated"

# 5. Test and reload nginx
echo ""
echo "=== Testing nginx configuration ==="
if nginx -t 2>&1; then
    echo "✅ Nginx configuration is valid"
    nginx -s reload
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration has errors!"
    # Restore backup
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/blue.flippi.ai.backup.* | head -1)
    cp $LATEST_BACKUP /etc/nginx/sites-available/blue.flippi.ai
    nginx -s reload
    echo "Restored previous configuration"
fi

# 6. Final verification
echo ""
echo "=== Final verification ==="
sleep 3

# Test critical endpoints
echo "Testing endpoints..."
echo -n "Backend health: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/health || echo "FAILED"

echo -n "API payment status: "
curl -s -o /dev/null -w "%{http_code}\n" https://blue.flippi.ai/api/payment/flip-status || echo "FAILED"

echo -n "Growth questions: "
curl -s -o /dev/null -w "%{http_code}\n" https://blue.flippi.ai/growth/questions || echo "FAILED"

echo -n "Static CSS: "
curl -s -o /dev/null -w "%{http_code}\n" https://blue.flippi.ai/web-styles.css || echo "FAILED"

# Show current PM2 status
echo ""
echo "=== PM2 Status ==="
pm2 list

echo ""
echo "=== Comprehensive fix complete ==="
echo "If issues persist, check PM2 logs with: pm2 logs dev-backend"