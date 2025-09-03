#!/bin/bash
set -euo pipefail

echo "✨ Fixing terms and privacy pages..."

# Update nginx config to proxy to backend instead of using alias
cat > /tmp/legal-pages.conf << 'EOF'
    # Legal pages - proxy to backend
    location = /terms {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location = /privacy {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
EOF

# Replace the alias approach with proxy approach
sed -i.bak '
/# Legal pages (if static files exist)/,/location = \/privacy {/{
    /# Legal pages/r /tmp/legal-pages.conf
    d
}
/alias.*terms\.html/d
/alias.*privacy\.html/d
' /etc/nginx/sites-available/blue.flippi.ai

nginx -t && nginx -s reload
echo "✅ Done"