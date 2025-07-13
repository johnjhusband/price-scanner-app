#!/bin/bash

# Fix Blue API Routing by adding blue routes to main nginx

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Fixing Blue API Routing ==="

# Create a config that routes blue.flippi.ai to the blue containers
cat > /tmp/blue-routes.conf << 'NGINX'
# Blue environment routing
server {
    listen 80;
    server_name blue.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name blue.flippi.ai;
    
    # Use the wildcard cert for flippi.ai
    ssl_certificate /etc/letsencrypt/live/flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # API routes to blue backend
    location /api {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }
    
    location /health {
        proxy_pass http://blue_backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Frontend - everything else
    location / {
        proxy_pass http://blue_frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

echo "Deploying nginx configuration..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-routes.conf root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
# Add blue routes to nginx
docker cp /tmp/blue-routes.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf

# Test the configuration
echo "Testing nginx configuration..."
docker exec thrifting_buddy_nginx nginx -t

# Reload nginx
echo "Reloading nginx..."
docker exec thrifting_buddy_nginx nginx -s reload

# Verify blue containers are accessible
echo -e "\nChecking if containers are on the same network..."
docker network inspect thrifting_buddy_network | grep -E "blue_backend|blue_frontend" || echo "Blue containers not on main network!"

# Test the routes
echo -e "\nTesting routes:"
echo "1. Health check:"
curl -s https://blue.flippi.ai/health || echo "Health check failed"

echo -e "\n2. API endpoint (should return error about missing image):"
curl -s -X POST https://blue.flippi.ai/api/scan | head -c 100

echo -e "\n\n3. Checking blue backend logs:"
docker logs blue_backend --tail 5
EOF

rm -f /tmp/blue-routes.conf

echo -e "\n=== Configuration deployed ==="
echo "Blue should now process images correctly"