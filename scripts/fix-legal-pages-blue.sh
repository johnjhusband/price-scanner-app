#!/bin/bash

# Fix legal pages on blue.flippi.ai
# This script needs to be run on the server to fix nginx routing

DOMAIN="blue.flippi.ai"
PORT="3002"  # Development port

echo "=== Fixing Legal Pages for $DOMAIN ==="
echo ""

# Check current nginx config
echo "Checking current nginx configuration..."
if grep -q "location = /terms" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
    echo "✓ Legal pages routes already exist in nginx config"
else
    echo "✗ Legal pages routes missing from nginx config"
    echo ""
    echo "To fix this issue, SSH to the server and run:"
    echo ""
    echo "sudo bash /var/www/blue.flippi.ai/scripts/post-deploy-nginx.sh"
    echo ""
    echo "Or manually add these location blocks before 'location /' in /etc/nginx/sites-available/$DOMAIN:"
    echo ""
    cat << 'EOF'
    # Legal pages - proxy to backend
    location = /terms {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /privacy {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF
fi

echo ""
echo "Testing legal pages endpoints..."
echo ""

# Test backend directly
echo "1. Testing backend directly (port $PORT):"
for page in terms privacy; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/$page 2>/dev/null || echo "000")
    echo "   http://localhost:$PORT/$page - Status: $RESPONSE"
done

echo ""
echo "2. Testing through nginx:"
for page in terms privacy; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/$page 2>/dev/null || echo "000")
    echo "   https://$DOMAIN/$page - Status: $RESPONSE"
done

echo ""
echo "3. Checking if pages return HTML content:"
for page in terms privacy; do
    CONTENT=$(curl -s https://$DOMAIN/$page | head -5)
    if echo "$CONTENT" | grep -q "<title>"; then
        if echo "$CONTENT" | grep -q "flippi.ai" && ! echo "$CONTENT" | grep -qi "terms\|privacy"; then
            echo "   ✗ /$page is returning the React app instead of static HTML"
        else
            echo "   ✓ /$page appears to be returning correct content"
        fi
    else
        echo "   ✗ /$page is not returning HTML content"
    fi
done

echo ""
echo "=== Summary ==="
echo ""
echo "If legal pages are showing the React app instead of terms/privacy content:"
echo "1. The nginx config needs the location blocks added (shown above)"
echo "2. These blocks must come BEFORE the 'location /' block"
echo "3. After adding, run: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "The backend is configured correctly with setupLegalPages middleware."
echo "The issue is nginx routing all requests to the frontend."