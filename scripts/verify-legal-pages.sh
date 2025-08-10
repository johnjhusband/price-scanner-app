#!/bin/bash
# Simple verification of legal pages status

echo "=== Legal Pages Status Check ==="
echo ""
echo "Testing https://blue.flippi.ai/terms"
RESPONSE=$(curl -s https://blue.flippi.ai/terms)

if echo "$RESPONSE" | grep -q "Terms of Service"; then
    echo "✅ SUCCESS! Terms page is working!"
elif echo "$RESPONSE" | grep -q "id=\"root\""; then
    echo "❌ FAILED! Still showing React app"
    echo ""
    echo "Checking nginx status:"
    echo "- SSL cert exists: $([ -f /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem ] && echo "YES" || echo "NO")"
    echo "- SSL options exists: $([ -f /etc/letsencrypt/options-ssl-nginx.conf ] && echo "YES" || echo "NO")"
    echo "- DH params exists: $([ -f /etc/letsencrypt/ssl-dhparams.pem ] && echo "YES" || echo "NO")"
    echo "- Nginx test: $(sudo nginx -t 2>&1 | grep -q "successful" && echo "PASS" || echo "FAIL")"
else
    echo "❌ UNKNOWN RESPONSE"
fi

echo ""
echo "Testing https://blue.flippi.ai/privacy"
if curl -s https://blue.flippi.ai/privacy | grep -q "Privacy Policy"; then
    echo "✅ SUCCESS! Privacy page is working!"
else
    echo "❌ FAILED! Privacy page not working"
fi