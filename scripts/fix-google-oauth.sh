#!/bin/bash

# Fix Google OAuth integration for Blue environment
# Issue #84: 502 Bad Gateway on Google Authentication

echo "=== Fixing Google OAuth for Blue Environment ==="
echo ""

# Check if we're on the server
if [ ! -f "/var/www/blue.flippi.ai/backend/.env" ]; then
    echo "ERROR: This script must be run on the Blue environment server"
    echo "Please SSH into the server and run this script there."
    exit 1
fi

echo "1. Checking current OAuth configuration..."

# Check if Google OAuth credentials exist
if grep -q "GOOGLE_CLIENT_ID" /var/www/blue.flippi.ai/backend/.env; then
    echo "✓ Google OAuth credentials found in .env"
else
    echo "✗ Google OAuth credentials missing!"
    echo ""
    echo "Please add the following to /var/www/blue.flippi.ai/backend/.env:"
    echo ""
    echo "GOOGLE_CLIENT_ID=your-client-id-here"
    echo "GOOGLE_CLIENT_SECRET=your-client-secret-here"
    echo "JWT_SECRET=your-jwt-secret-here"
    echo ""
    echo "Get credentials from: https://console.cloud.google.com/apis/credentials"
    echo ""
    read -p "Have you added the credentials? (yes/no): " added
    if [ "$added" != "yes" ]; then
        echo "Please add credentials and run this script again."
        exit 1
    fi
fi

echo ""
echo "2. Verifying OAuth redirect URIs..."
echo ""
echo "Make sure these URIs are added in Google Cloud Console:"
echo "- https://blue.flippi.ai/auth/google/callback"
echo "- https://app.flippi.ai/auth/google/callback (for production)"
echo ""
read -p "Have you verified the redirect URIs? (yes/no): " verified
if [ "$verified" != "yes" ]; then
    echo "Please verify redirect URIs in Google Cloud Console."
    exit 1
fi

echo ""
echo "3. Installing passport dependencies..."
cd /var/www/blue.flippi.ai/backend
npm install passport passport-google-oauth20 express-session

echo ""
echo "4. Updating nginx configuration..."

# Create the updated nginx config
cat > /tmp/blue.flippi.ai.oauth.conf << 'EOF'
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
        proxy_set_header X-Forwarded-Host $host;
        
        # Important for OAuth callbacks
        proxy_redirect off;
        
        # Increase timeouts for OAuth flow
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

EOF

# Append the rest of the config
cat >> /tmp/blue.flippi.ai.oauth.conf << 'EOF'
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

# Backup current config
sudo cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.oauth.$(date +%Y%m%d_%H%M%S)

# Apply new config
sudo cp /tmp/blue.flippi.ai.oauth.conf /etc/nginx/sites-available/blue.flippi.ai

# Test nginx
echo ""
echo "5. Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration valid"
    echo ""
    echo "6. Reloading nginx..."
    sudo nginx -s reload
    
    echo ""
    echo "7. Restarting backend..."
    pm2 restart blue-backend
    
    sleep 5
    
    echo ""
    echo "8. Testing OAuth endpoint..."
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://blue.flippi.ai/auth/google
    
    echo ""
    echo "=== Google OAuth Fix Applied ==="
    echo ""
    echo "Next steps:"
    echo "1. Visit https://blue.flippi.ai"
    echo "2. Click on 'Sign in with Google'"
    echo "3. Complete the OAuth flow"
    echo ""
    echo "If you still see 502 errors, check:"
    echo "- pm2 logs blue-backend"
    echo "- /var/log/nginx/error.log"
    echo "- Ensure backend is running on port 3002"
else
    echo "✗ Nginx configuration test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/blue.flippi.ai.backup.oauth.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/blue.flippi.ai
    exit 1
fi