#!/bin/bash
# Add growth routes to nginx configuration

DOMAIN=$1
PORT=$2

if [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
  # Try to detect from environment
  if [ "$PORT" = "3002" ] || [ -f "/var/www/blue.flippi.ai/.env" ]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
  elif [ "$PORT" = "3001" ] || [ -f "/var/www/green.flippi.ai/.env" ]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
  else
    DOMAIN="app.flippi.ai"
    PORT="3000"
  fi
fi

echo "=== Adding growth routes to $DOMAIN nginx config ==="

# Check if growth routes already exist
if grep -q "location /growth" /etc/nginx/sites-available/$DOMAIN; then
  echo "Growth routes already configured"
else
  echo "Adding growth routes..."
  # Insert growth routes before the catch-all location /
  sudo sed -i '/location \/ {/i\
\
    # Growth routes\
    location /growth {\
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
  echo "✅ Growth routes added successfully!"
else
  echo "❌ Nginx config error!"
  sudo nginx -t
fi

# Test the growth route
sleep 2
echo ""
echo "Testing growth route..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/growth/questions)
echo "Growth questions route response: $RESPONSE"

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Growth routes working!"
else
  echo "⚠️ Growth routes may need time to propagate"
fi