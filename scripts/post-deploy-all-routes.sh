#!/bin/bash
# Add all necessary routes to nginx after deployment

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

echo "=== Adding all routes for $DOMAIN on port $PORT ==="

# Add value routes
bash scripts/add-value-routes-nginx.sh $DOMAIN $PORT

# Add admin routes
bash scripts/add-admin-routes-nginx.sh $DOMAIN $PORT

# Add growth routes
bash scripts/ensure-growth-routes.sh

echo "=== All routes added ==="