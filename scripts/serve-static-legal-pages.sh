#!/bin/bash
set -euo pipefail

echo "✨ Setting up static legal pages..."

# Create public directory for static files
mkdir -p /var/www/blue.flippi.ai/public/legal

# Copy HTML files to public directory
cp /var/www/blue.flippi.ai/mobile-app/terms.html /var/www/blue.flippi.ai/public/legal/
cp /var/www/blue.flippi.ai/mobile-app/privacy.html /var/www/blue.flippi.ai/public/legal/
cp /var/www/blue.flippi.ai/mobile-app/contact.html /var/www/blue.flippi.ai/public/legal/ 2>/dev/null || true
cp /var/www/blue.flippi.ai/mobile-app/mission.html /var/www/blue.flippi.ai/public/legal/ 2>/dev/null || true

# Simple nginx config - serve static files directly
cat > /etc/nginx/sites-available/blue.flippi.ai.legal << 'EOF'
# Static legal pages
location = /terms {
    root /var/www/blue.flippi.ai/public/legal;
    try_files /terms.html =404;
}

location = /privacy {
    root /var/www/blue.flippi.ai/public/legal;
    try_files /privacy.html =404;
}

location = /contact {
    root /var/www/blue.flippi.ai/public/legal;
    try_files /contact.html =404;
}

location = /mission {
    root /var/www/blue.flippi.ai/public/legal;
    try_files /mission.html =404;
}
EOF

# Include in main config before other locations
sed -i '/server_name blue.flippi.ai;/a\    include /etc/nginx/sites-available/blue.flippi.ai.legal;' /etc/nginx/sites-available/blue.flippi.ai 2>/dev/null || true

nginx -t && nginx -s reload
echo "✅ Legal pages now served as static files"