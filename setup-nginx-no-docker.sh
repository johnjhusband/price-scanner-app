#!/bin/bash

# Nginx configuration for non-Docker setup
# Run this after setup-server-no-docker.sh

set -e

echo "🔧 Setting up Nginx for three environments"

# Check if running as root
if [[ $EUID -ne 0 ]]; then 
   echo "This script must be run as root" 
   exit 1
fi

# Step 1: Remove default nginx config
echo "1️⃣ Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default

# Step 2: Create production config (app.flippi.ai)
cat > /etc/nginx/sites-available/app.flippi.ai << 'EOF'
server {
    listen 80;
    server_name app.flippi.ai;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.flippi.ai;

    # SSL configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Step 3: Create staging config (green.flippi.ai)
cat > /etc/nginx/sites-available/green.flippi.ai << 'EOF'
server {
    listen 80;
    server_name green.flippi.ai;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name green.flippi.ai;

    # SSL configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Step 4: Create development config (blue.flippi.ai)
cat > /etc/nginx/sites-available/blue.flippi.ai << 'EOF'
server {
    listen 80;
    server_name blue.flippi.ai;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blue.flippi.ai;

    # SSL configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    location /health {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Step 5: Enable all sites
echo "2️⃣ Enabling sites..."
ln -sf /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/

# Step 6: Test nginx configuration
echo "3️⃣ Testing Nginx configuration..."
nginx -t

# Step 7: Reload nginx
echo "4️⃣ Reloading Nginx..."
systemctl reload nginx

# Step 8: Set up SSL certificates
echo "5️⃣ Setting up SSL certificates..."
echo ""
echo "Would you like to set up SSL certificates now? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Production
    certbot --nginx -d app.flippi.ai --non-interactive --agree-tos --email admin@flippi.ai || true
    
    # Staging
    certbot --nginx -d green.flippi.ai --non-interactive --agree-tos --email admin@flippi.ai || true
    
    # Development
    certbot --nginx -d blue.flippi.ai --non-interactive --agree-tos --email admin@flippi.ai || true
    
    # Reload nginx with SSL
    systemctl reload nginx
fi

echo ""
echo "✅ Nginx configuration complete!"
echo ""
echo "🌐 Your sites are available at:"
echo "  - https://app.flippi.ai (Production)"
echo "  - https://green.flippi.ai (Staging)"
echo "  - https://blue.flippi.ai (Development)"
echo ""
echo "📍 Port mapping:"
echo "  - app.flippi.ai → Backend: 3000, Frontend: 8080"
echo "  - green.flippi.ai → Backend: 3001, Frontend: 8081"
echo "  - blue.flippi.ai → Backend: 3002, Frontend: 8082"
echo ""
echo "To check nginx status: systemctl status nginx"
echo "To view nginx logs: tail -f /var/log/nginx/error.log"