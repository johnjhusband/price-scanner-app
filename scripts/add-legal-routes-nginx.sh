#!/bin/bash
# Add legal page routes to nginx configuration

CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
else
    echo "Unknown environment"
    exit 1
fi

echo "Adding legal page routes to nginx for $DOMAIN..."

# Check if routes already exist
if grep -q "location = /terms" /etc/nginx/sites-available/$DOMAIN 2>/dev/null; then
    echo "Legal routes already exist in nginx config"
    exit 0
fi

# Create the routes configuration
cat > /tmp/legal-routes.conf << EOF
    # Legal pages - proxy to backend Express routes
    location = /terms {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /privacy {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /mission {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /contact {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

EOF

echo ""
echo "Legal routes have been prepared in /tmp/legal-routes.conf"
echo ""
echo "To apply them:"
echo "1. Edit /etc/nginx/sites-available/$DOMAIN"
echo "2. Find the 'server {' block"
echo "3. Insert the contents of /tmp/legal-routes.conf"
echo "4. Make sure it's BEFORE any 'location /' block"
echo "5. Test with: sudo nginx -t"
echo "6. Reload with: sudo systemctl reload nginx"
echo ""
echo "Or run: sudo bash /var/www/$DOMAIN/scripts/manual-nginx-insert.sh"