#!/bin/bash
set -euo pipefail

echo "✨ Fixing nginx to proxy legal pages to backend..."

# Replace static file serving with backend proxy for all routes
sed -i.bak 's|location / {.*|location / {\
    proxy_pass http://localhost:8082;\
    proxy_http_version 1.1;\
    proxy_set_header Upgrade $http_upgrade;\
    proxy_set_header Connection "upgrade";\
    proxy_set_header Host $host;\
    proxy_cache_bypass $http_upgrade;\
}|g' /etc/nginx/sites-available/blue.flippi.ai

# Fix the multiline replacement
sed -i ':a;N;$!ba;s|location / {\n.*try_files.*\n.*}|location / {\n        proxy_pass http://localhost:8082;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }|g' /etc/nginx/sites-available/blue.flippi.ai

nginx -t && nginx -s reload
echo "✅ Legal pages now proxy to backend"