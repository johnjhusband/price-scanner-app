#!/bin/bash
# Force fix for production legal pages

echo "=== FORCE FIX: Production Legal Pages ==="

# Create the complete nginx configuration with legal pages
cat > /tmp/app.flippi.ai.conf << 'EOF'
server {
    server_name app.flippi.ai;
    client_max_body_size 50M;

    # Legal pages - MUST be before catch-all
    location = /privacy {
        alias /var/www/app.flippi.ai/mobile-app/privacy.html;
    }

    location = /terms {
        alias /var/www/app.flippi.ai/mobile-app/terms.html;
    }

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
}

server {
    if ($host = app.flippi.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name app.flippi.ai;
    return 404;
}
EOF

# Backup current config
cp /etc/nginx/sites-available/app.flippi.ai /tmp/app-nginx-backup-$(date +%s).conf 2>/dev/null || true

# Apply new config
cp /tmp/app.flippi.ai.conf /etc/nginx/sites-available/app.flippi.ai

# Ensure symlink exists
ln -sf /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-enabled/app.flippi.ai

# Test and reload
nginx -t && systemctl reload nginx

echo "Testing legal pages..."
sleep 2
TERMS=$(curl -s -o /dev/null -w "%{http_code}" https://app.flippi.ai/terms)
PRIVACY=$(curl -s -o /dev/null -w "%{http_code}" https://app.flippi.ai/privacy)

echo "Terms: $TERMS, Privacy: $PRIVACY"

if [ "$TERMS" = "200" ] && [ "$PRIVACY" = "200" ]; then
    echo "✅ Legal pages FIXED!"
else
    echo "❌ Still not working"
fi