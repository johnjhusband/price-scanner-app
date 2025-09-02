#!/bin/bash
# Add admin routes to nginx configuration

DOMAIN=$1
PORT=$2

if [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
  echo "Usage: $0 <domain> <backend-port>"
  echo "Example: $0 blue.flippi.ai 3002"
  exit 1
fi

echo "=== Adding admin routes to $DOMAIN nginx config ==="

# Create a temporary file with the admin location block
cat > /tmp/admin-routes.conf << 'EOF'
    # Admin routes
    location /admin {
        proxy_pass http://localhost:PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Replace PORT placeholder
sed -i "s/PORT/$PORT/g" /tmp/admin-routes.conf

# Check if admin routes already exist
if grep -q "location /admin" /etc/nginx/sites-available/$DOMAIN; then
  echo "Admin routes already configured"
else
  echo "Adding admin routes..."
  # Insert admin routes before the catch-all location /
  sudo sed -i '/location \/ {/i\
\
    # Admin routes\
    location /admin {\
        proxy_pass http://localhost:'$PORT';\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' /etc/nginx/sites-available/$DOMAIN
fi

# Test nginx configuration
if sudo nginx -t; then
  echo "Nginx config valid, reloading..."
  sudo nginx -s reload
  echo "✅ Admin routes added successfully!"
else
  echo "❌ Nginx config error!"
  sudo nginx -t
fi

# Test the admin route
sleep 2
echo ""
echo "Testing admin route..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/admin/automation)
echo "Admin automation endpoint response: $RESPONSE"

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Admin routes working!"
else
  echo "⚠️ Admin routes may need time to propagate"
fi