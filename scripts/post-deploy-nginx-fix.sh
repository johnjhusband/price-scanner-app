#!/bin/bash
# Temporary fix script to clean up duplicate nginx locations

# Detect environment based on current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
else
    echo "Unknown environment, exiting"
    exit 0
fi

echo "Fixing nginx configuration for $DOMAIN..."

# Add growth routes if missing
if ! grep -q "location /growth" /etc/nginx/sites-available/$DOMAIN; then
    echo "Adding growth routes..."
    # Find line number of "location / {" and insert before it
    LINE_NUM=$(grep -n "location / {" /etc/nginx/sites-available/$DOMAIN | head -1 | cut -d: -f1)
    if [ -n "$LINE_NUM" ]; then
        sed -i "${LINE_NUM}i\\
\\
    # Growth routes\\
    location /growth {\\
        proxy_pass http://localhost:${PORT};\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }\\
" /etc/nginx/sites-available/$DOMAIN
        echo "Growth routes added"
    fi
fi

# Check if there are duplicate location blocks
PRIVACY_COUNT=$(grep -c "location = /privacy" /etc/nginx/sites-available/$DOMAIN 2>/dev/null || echo "0")

if [ "$PRIVACY_COUNT" -gt "1" ]; then
    echo "Found $PRIVACY_COUNT duplicate /privacy location blocks. Creating cleaned config..."
    
    # Backup current config
    sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.fix.$(date +%Y%m%d_%H%M%S)
    
    # Create a cleaned version by removing all legal page locations first
    # then adding them back only once
    sudo cp /etc/nginx/sites-available/$DOMAIN /tmp/nginx-$DOMAIN-temp
    
    # Remove all existing legal page locations
    sudo sed -i '/location = \/terms {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/privacy {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/mission {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    sudo sed -i '/location = \/contact {/,/^    }/d' /tmp/nginx-$DOMAIN-temp
    
    # Copy cleaned config back
    sudo cp /tmp/nginx-$DOMAIN-temp /etc/nginx/sites-available/$DOMAIN
    
    echo "Removed duplicate locations. Testing nginx config..."
    
    # Ensure sites-enabled is updated too
    echo "Updating sites-enabled..."
    
    # Remove old symlink if exists
    sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
    
    # Create new symlink
    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
    
    # Test nginx config
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx configuration fixed and reloaded!"
        echo "Both sites-available and sites-enabled updated."
    else
        echo "ERROR: Nginx config test failed! Restoring backup..."
        sudo cp /etc/nginx/sites-available/$DOMAIN.backup.fix.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/$DOMAIN
        sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
        exit 1
    fi
else
    echo "No duplicate locations found."
fi

echo "Nginx fix complete."

# Run comprehensive route fix (includes growth, admin, and legal pages)
echo ""
echo "Running comprehensive route fix..."
if [ -f /var/www/$DOMAIN/scripts/fix-all-routes-comprehensive.sh ]; then
    bash /var/www/$DOMAIN/scripts/fix-all-routes-comprehensive.sh
elif [ -f /var/www/$DOMAIN/scripts/comprehensive-legal-fix.sh ]; then
    bash /var/www/$DOMAIN/scripts/comprehensive-legal-fix.sh
else
    # Fallback: Run post-deploy-all-fixes if available
    if [ -f /var/www/$DOMAIN/scripts/post-deploy-all-fixes.sh ]; then
        bash /var/www/$DOMAIN/scripts/post-deploy-all-fixes.sh
    fi
fi

# Diagnose legal pages
echo ""
echo "Legal pages diagnostic..."
if [ -f /var/www/$DOMAIN/scripts/diagnose-legal.sh ]; then
    bash /var/www/$DOMAIN/scripts/diagnose-legal.sh
else
    echo "Backend /terms status: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/terms)"
    echo "Backend /privacy status: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/privacy)"
fi