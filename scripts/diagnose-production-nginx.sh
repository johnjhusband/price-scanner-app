#!/bin/bash
# Diagnose production nginx configuration issues

echo "=== Production Nginx Diagnosis ==="
echo ""

# Test different endpoints
echo "1. Testing main site:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" https://app.flippi.ai/

echo ""
echo "2. Testing static files:"
curl -s -o /dev/null -w "   /index.html: %{http_code}\n" https://app.flippi.ai/index.html
curl -s -o /dev/null -w "   /static/js/main.js: %{http_code}\n" https://app.flippi.ai/static/js/main.*.js
curl -s -o /dev/null -w "   /manifest.json: %{http_code}\n" https://app.flippi.ai/manifest.json

echo ""
echo "3. Testing API endpoints:"
curl -s -o /dev/null -w "   /api/version: %{http_code}\n" https://app.flippi.ai/api/version
curl -s -o /dev/null -w "   /health: %{http_code}\n" https://app.flippi.ai/health

echo ""
echo "4. Testing legal pages:"
curl -s -o /dev/null -w "   /terms: %{http_code}\n" https://app.flippi.ai/terms
curl -s -o /dev/null -w "   /privacy: %{http_code}\n" https://app.flippi.ai/privacy

echo ""
echo "5. Checking response content:"
echo "   Main page title:"
curl -s https://app.flippi.ai/ | grep -o "<title>[^<]*</title>" | head -1
echo "   Main page content sample:"
curl -s https://app.flippi.ai/ | grep -E "(Loading|id=\"root\"|Welcome)" | head -3

echo ""
echo "6. Testing OAuth endpoint:"
curl -s -o /dev/null -w "   /auth/google: %{http_code}\n" -I https://app.flippi.ai/auth/google

echo ""
echo "=== End Diagnosis ==="