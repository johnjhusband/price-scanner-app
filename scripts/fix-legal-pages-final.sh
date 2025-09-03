#!/bin/bash
set -euo pipefail

echo "✨ Final fix for legal pages..."

# Add specific routes for legal pages BEFORE the catch-all
cat > /tmp/legal-routes.conf << 'EOF'
    # Legal pages proxy to backend
    location = /terms {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location = /privacy {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location = /contact {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location = /mission {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
EOF

# Insert legal routes before the catch-all location /
sed -i '/location \/ {/i\
    # Legal pages proxy to backend\
    location = /terms {\
        proxy_pass http://localhost:3002;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
    }\
    \
    location = /privacy {\
        proxy_pass http://localhost:3002;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
    }\
' /etc/nginx/sites-available/blue.flippi.ai

nginx -t && nginx -s reload
echo "✅ Legal pages fixed"