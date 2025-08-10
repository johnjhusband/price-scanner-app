#!/bin/bash

# Post-deployment script to ensure legal pages are properly configured
# This runs after code deployment to set up nginx routes

set -e

# Get the domain from environment or parameter
DOMAIN=${1:-$DOMAIN}
if [ -z "$DOMAIN" ]; then
    echo "ERROR: Domain not specified"
    echo "Usage: $0 <domain>"
    echo "Example: $0 app.flippi.ai"
    exit 1
fi

echo "=== Configuring Legal Pages for $DOMAIN ==="

# Determine backend port based on domain
case $DOMAIN in
    "app.flippi.ai")
        BACKEND_PORT=3000
        ;;
    "green.flippi.ai")
        BACKEND_PORT=3001
        ;;
    "blue.flippi.ai")
        BACKEND_PORT=3002
        ;;
    *)
        echo "ERROR: Unknown domain $DOMAIN"
        exit 1
        ;;
esac

# Path to nginx config
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
SITE_ROOT="/var/www/$DOMAIN"

echo "Checking if legal pages exist..."
if [ ! -f "$SITE_ROOT/mobile-app/terms.html" ]; then
    echo "ERROR: terms.html not found at $SITE_ROOT/mobile-app/terms.html"
    exit 1
fi

if [ ! -f "$SITE_ROOT/mobile-app/privacy.html" ]; then
    echo "ERROR: privacy.html not found at $SITE_ROOT/mobile-app/privacy.html"
    exit 1
fi

echo "Legal page files found. Updating nginx configuration..."

# Create the legal pages configuration to proxy to backend
LEGAL_CONFIG=$(cat << EOF

    # Legal pages - proxy to backend Express routes
    location = /terms {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /privacy {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /mission {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /contact {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
EOF
)

# Check if legal pages config already exists
if grep -q "location = /terms" "$NGINX_CONFIG"; then
    echo "Legal pages configuration already exists, skipping..."
else
    echo "Adding legal pages configuration..."
    
    # Find where to insert - before the /api/ location if it exists
    if grep -q "location /api/" "$NGINX_CONFIG"; then
        # Create a temporary file with the new config
        TEMP_FILE="/tmp/nginx_legal_${DOMAIN}_$$.conf"
        
        # Process the file line by line
        while IFS= read -r line; do
            # If we find the /api/ location, insert our config before it
            if [[ "$line" == *"location /api/"* ]]; then
                echo "$LEGAL_CONFIG" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
            fi
            echo "$line" >> "$TEMP_FILE"
        done < "$NGINX_CONFIG"
        
        # Replace the original file
        mv "$TEMP_FILE" "$NGINX_CONFIG"
    else
        # No /api/ location found, try to insert before the closing brace
        # Find the last location block
        LAST_LOCATION_LINE=$(grep -n "location" "$NGINX_CONFIG" | tail -1 | cut -d: -f1)
        
        if [ -n "$LAST_LOCATION_LINE" ]; then
            # Find the closing brace after the last location
            CLOSE_BRACE_LINE=$(tail -n +$LAST_LOCATION_LINE "$NGINX_CONFIG" | grep -n "^    }" | head -1 | cut -d: -f1)
            
            if [ -n "$CLOSE_BRACE_LINE" ]; then
                INSERT_LINE=$((LAST_LOCATION_LINE + CLOSE_BRACE_LINE))
                
                # Insert the configuration
                head -n $INSERT_LINE "$NGINX_CONFIG" > /tmp/nginx_temp_$$
                echo "$LEGAL_CONFIG" >> /tmp/nginx_temp_$$
                echo "" >> /tmp/nginx_temp_$$
                tail -n +$((INSERT_LINE + 1)) "$NGINX_CONFIG" >> /tmp/nginx_temp_$$
                
                mv /tmp/nginx_temp_$$ "$NGINX_CONFIG"
            fi
        fi
    fi
fi

echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration test passed. Reloading nginx..."
    nginx -s reload
    echo "✅ Legal pages configured successfully for $DOMAIN!"
    echo
    echo "You can now access:"
    echo "- https://$DOMAIN/terms"
    echo "- https://$DOMAIN/privacy"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi