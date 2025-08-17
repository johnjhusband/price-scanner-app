#!/bin/bash
# Final working fix for legal pages

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Fixing Legal Pages for $DOMAIN ==="

# First verify backend is working
BACKEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/terms)
if [ "$BACKEND_OK" != "200" ]; then
    echo "ERROR: Backend not serving legal pages!"
    exit 1
fi

echo "✓ Backend serving legal pages correctly"

# Instead of replacing entire nginx config, let's use a targeted approach
# Check if legal routes already exist
HAS_TERMS=$(grep -c "location = /terms" /etc/nginx/sites-available/$DOMAIN || echo "0")

if [ "$HAS_TERMS" -eq "0" ]; then
    echo "Adding legal page routes to nginx..."
    
    # Create a temporary file with just the legal routes
    cat > /tmp/legal-routes.conf << EOF
    # Legal pages - proxy to backend
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

    # Backup current config
    sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.$(date +%s)
    
    # Insert legal routes BEFORE the catch-all location /
    # This is critical - specific routes must come before general ones
    sudo awk '
    /location \/ {/ && !done {
        while ((getline line < "/tmp/legal-routes.conf") > 0) {
            print line
        }
        close("/tmp/legal-routes.conf")
        print ""
        done = 1
    }
    { print }
    ' /etc/nginx/sites-available/$DOMAIN > /tmp/nginx-$DOMAIN-new
    
    # Apply the new config
    sudo mv /tmp/nginx-$DOMAIN-new /etc/nginx/sites-available/$DOMAIN
    
    # Update symlink
    sudo rm -f /etc/nginx/sites-enabled/$DOMAIN
    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
    
    echo "✓ Legal routes added to nginx config"
else
    echo "Legal routes already exist in nginx config"
fi

# Test and reload
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx config valid"
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
    
    # Verify it works
    sleep 2
    PUBLIC_TERMS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/terms)
    if [ "$PUBLIC_TERMS" == "200" ]; then
        echo "✅ SUCCESS! Legal pages are now working!"
    else
        echo "⚠️  Legal pages may still be cached. Try in a moment."
    fi
else
    echo "ERROR: Nginx config test failed!"
    # Try to restore backup
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/$DOMAIN.backup.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/$DOMAIN
        sudo systemctl reload nginx
        echo "Restored from backup"
    fi
    exit 1
fi

echo "=== Legal Pages Fix Complete ==="