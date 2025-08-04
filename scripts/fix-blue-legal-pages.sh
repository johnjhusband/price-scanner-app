#!/bin/bash

# Fix script specifically for blue.flippi.ai legal pages
# This adds nginx location blocks to serve terms and privacy pages

set -e

echo "=== Fixing Legal Pages for blue.flippi.ai ==="

# Create nginx configuration snippet
cat > /tmp/blue-legal-pages.conf << 'EOF'
    # Legal pages - serve static HTML files directly
    location = /terms {
        alias /var/www/blue.flippi.ai/mobile-app/terms.html;
        default_type text/html;
        add_header Cache-Control "public, max-age=3600";
    }
    
    location = /privacy {
        alias /var/www/blue.flippi.ai/mobile-app/privacy.html;
        default_type text/html;
        add_header Cache-Control "public, max-age=3600";
    }
EOF

echo "Configuration snippet created. To apply:"
echo "1. SSH into the server"
echo "2. Edit /etc/nginx/sites-available/blue.flippi.ai"
echo "3. Add the above configuration inside the server block, before other location blocks"
echo "4. Test with: sudo nginx -t"
echo "5. Reload with: sudo nginx -s reload"

echo
echo "Or run this command on the server:"
echo "sudo nano /etc/nginx/sites-available/blue.flippi.ai"