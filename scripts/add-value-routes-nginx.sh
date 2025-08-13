#!/bin/bash
# Add value routes to nginx configuration for blog posts

DOMAIN=$1
PORT=$2

if [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
  echo "Usage: $0 <domain> <backend-port>"
  echo "Example: $0 blue.flippi.ai 3002"
  exit 1
fi

echo "=== Adding value routes to $DOMAIN nginx config ==="

# Check if value routes already exist
if grep -q "location /value" /etc/nginx/sites-available/$DOMAIN; then
  echo "Value routes already configured"
else
  echo "Adding value routes..."
  # Insert value routes before the catch-all location /
  sudo sed -i '/location \/ {/i\
\
    # Valuation blog post routes\
    location /value {\
        proxy_pass http://localhost:'$PORT';\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
\
    # RSS feed for valuations\
    location /rss/valuations.xml {\
        proxy_pass http://localhost:'$PORT';\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
    }\
' /etc/nginx/sites-available/$DOMAIN
fi

# Test nginx configuration
if sudo nginx -t; then
  echo "Nginx config valid, reloading..."
  sudo nginx -s reload
  echo "✅ Value routes added successfully!"
else
  echo "❌ Nginx config error!"
  sudo nginx -t
fi

# Test the value route
sleep 2
echo ""
echo "Testing value route..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/value/hello-kitty-thrifted-shirt-vintage-find)
echo "Value route response: $RESPONSE"

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Value routes working!"
else
  echo "⚠️ Value routes may need time to propagate"
fi