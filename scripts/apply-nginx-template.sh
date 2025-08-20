#!/bin/bash
# Apply nginx template configuration during deployment
# This ensures the template in the repository is used

DOMAIN=$1
TEMPLATE_FILE="nginx-templates/$DOMAIN.conf"
TARGET_FILE="/etc/nginx/sites-available/$DOMAIN"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 blue.flippi.ai"
    exit 1
fi

echo "=== Applying nginx template for $DOMAIN ==="

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template not found: $TEMPLATE_FILE"
    exit 1
fi

# Backup current config
if [ -f "$TARGET_FILE" ]; then
    BACKUP_FILE="${TARGET_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    sudo cp "$TARGET_FILE" "$BACKUP_FILE"
    echo "✅ Backed up current config to $BACKUP_FILE"
fi

# Copy template to nginx sites-available
sudo cp "$TEMPLATE_FILE" "$TARGET_FILE"
echo "✅ Applied template from repository"

# Verify growth routes are in the config
if grep -q "location /growth" "$TARGET_FILE"; then
    echo "✅ Growth routes found in nginx config"
else
    echo "❌ WARNING: Growth routes NOT found in nginx config!"
fi

# Test configuration
if sudo nginx -t 2>&1; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    sudo nginx -s reload
    echo "✅ Nginx reloaded"
    
    # Test critical endpoints
    echo ""
    echo "Testing endpoints..."
    sleep 2
    
    # Test growth route
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/growth/questions" || echo "000")
    echo "/growth/questions: HTTP $RESPONSE"
    
    # Test API health
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" || echo "000")
    echo "/api/health: HTTP $RESPONSE"
    
    echo ""
    echo "✅ Nginx template applied successfully"
else
    echo "❌ Nginx configuration has errors!"
    
    # Restore backup if it exists
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        sudo cp "$BACKUP_FILE" "$TARGET_FILE"
        sudo nginx -s reload
        echo "⚠️  Restored previous configuration"
    fi
    
    exit 1
fi