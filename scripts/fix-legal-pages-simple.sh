#!/bin/bash
# Simple fix for legal pages routing

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "Fixing legal pages for $DOMAIN..."

# Test if backend is serving legal pages
echo "Testing backend legal pages..."
curl -s "http://localhost:$PORT/terms" | head -5
echo ""

# Check current nginx config
echo "Current nginx status:"
sudo nginx -t

echo ""
echo "To manually test:"
echo "1. curl http://localhost:$PORT/terms (should show HTML)"
echo "2. curl https://$DOMAIN/terms (should show same HTML)"
echo ""
echo "If backend works but nginx doesn't, the issue is nginx proxy configuration."