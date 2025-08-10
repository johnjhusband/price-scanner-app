#!/bin/bash
# Final fix for legal pages - create a working nginx config

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "Final legal pages fix for $DOMAIN on port $PORT"

# Create a clean nginx config with legal routes
cat << 'EOF' > /tmp/nginx-legal-template
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    # Legal pages - proxy to backend Express routes
    location = /terms {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /privacy {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /mission {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /contact {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Frontend - serve static files
    location / {
        root /var/www/DOMAIN_PLACEHOLDER/mobile-app/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /tmp/nginx-legal-template
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /tmp/nginx-legal-template

echo "Template created. To apply:"
echo "1. sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.manual"
echo "2. sudo cp /tmp/nginx-legal-template /etc/nginx/sites-available/$DOMAIN"
echo "3. sudo nginx -t"
echo "4. sudo systemctl reload nginx"