#!/bin/bash

# Simple fix for blue environment
# Just add the routing without modifying frontend

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Simple Blue Fix ==="

# Create nginx config that uses the correct SSL cert
cat > /tmp/blue-simple.conf << 'NGINX'
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
    
    # Use the app.flippi.ai cert (which exists)
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # API routes
    location /api {
        proxy_pass http://blue_backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://blue_backend:3000;
        proxy_set_header Host $host;
    }
    
    # Frontend
    location / {
        proxy_pass http://blue_frontend:8080;
        proxy_set_header Host $host;
    }
}
NGINX

echo "Deploying nginx fix..."
sshpass -p "$SERVER_PASS" scp /tmp/blue-simple.conf root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
# Remove old bad config
docker exec thrifting_buddy_nginx rm -f /etc/nginx/conf.d/blue.conf

# Add new config
docker cp /tmp/blue-simple.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue.conf

# Test
docker exec thrifting_buddy_nginx nginx -t && echo "Config is valid"

# Reload
docker exec thrifting_buddy_nginx nginx -s reload && echo "Nginx reloaded"

# Test API
echo -e "\nTesting API route:"
curl -s -X POST https://blue.flippi.ai/api/scan -H "Content-Type: multipart/form-data" -F "test=1" | head -c 100
EOF

rm -f /tmp/blue-simple.conf

echo -e "\n=== Done ==="
echo "API routing should now work for image processing"
echo "The 'Test API Connection' text is still there but won't affect functionality"