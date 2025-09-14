#!/bin/bash
# Quick fix for /story route on blue environment
# Run this directly on the server: bash scripts/quick-fix-story-route.sh

echo "🔧 Quick fix for /story route..."

# Add /story route to nginx config
sudo tee -a /etc/nginx/sites-available/blue.flippi.ai > /dev/null << 'EOF'

    # Growth Service Routes
    location ^~ /story {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ^~ /api/growth {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ^~ /growth {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx && echo "✅ Fixed! /story route should now work"
