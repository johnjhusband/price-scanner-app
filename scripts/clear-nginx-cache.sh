#!/bin/bash
# Clear Nginx cache for production deployment verification

echo "=== Clearing Nginx Cache ==="
echo "Environment: $1"

if [ -z "$1" ]; then
    echo "Usage: $0 [prod|staging|dev]"
    exit 1
fi

# Define environment mappings
case "$1" in
    "prod")
        DOMAIN="app.flippi.ai"
        ;;
    "staging")
        DOMAIN="green.flippi.ai"
        ;;
    "dev")
        DOMAIN="blue.flippi.ai"
        ;;
    *)
        echo "Invalid environment. Use: prod, staging, or dev"
        exit 1
        ;;
esac

echo "Clearing cache for: $DOMAIN"

# Clear Nginx cache directories (adjust paths as needed)
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/nginx/cache/*
sudo rm -rf /tmp/nginx-cache/*

# Clear any fastcgi cache
sudo rm -rf /var/cache/nginx-fastcgi/*

# Clear proxy cache
sudo rm -rf /var/cache/nginx-proxy/*

# Force reload Nginx to ensure changes take effect
echo "Reloading Nginx..."
sudo nginx -t && sudo nginx -s reload

# Verify Nginx is running
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Nginx configuration valid and reloaded"
else
    echo "❌ Nginx configuration error!"
    sudo nginx -t
    exit 1
fi

# Test the domain
echo ""
echo "Testing $DOMAIN..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_STATUS)"
else
    echo "❌ Health check failed (HTTP $HTTP_STATUS)"
fi

# Check version endpoint
echo ""
echo "Checking version endpoint..."
curl -s https://$DOMAIN/api/version | jq . 2>/dev/null || echo "Version endpoint not available yet"

echo ""
echo "=== Cache clearing complete ==="
echo "Note: CDN cache (if any) may still need manual purging"