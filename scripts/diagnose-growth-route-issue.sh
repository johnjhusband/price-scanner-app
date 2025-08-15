#!/bin/bash
# Diagnose why growth routes aren't working

echo "=== GROWTH ROUTE DIAGNOSTIC ==="
echo "This script helps diagnose why /growth routes aren't working"
echo ""

# Function to check a domain
diagnose_domain() {
    local DOMAIN=$1
    local PORT=$2
    
    echo "Diagnosing $DOMAIN (port $PORT)..."
    echo "================================"
    
    # 1. Check if nginx config exists
    echo "1. Nginx config check:"
    if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
        echo "   ✓ Config file exists"
        
        # Check for growth location
        if grep -q "location /growth" "/etc/nginx/sites-available/$DOMAIN"; then
            echo "   ✓ Growth location block found"
            echo "   Content:"
            grep -A8 "location /growth" "/etc/nginx/sites-available/$DOMAIN" | sed 's/^/     /'
        else
            echo "   ✗ Growth location block MISSING!"
        fi
        
        # Check location order
        echo ""
        echo "   Location block order:"
        grep -n "location" "/etc/nginx/sites-available/$DOMAIN" | grep -E "(growth|api|admin|/\s*{)" | head -10
        
    else
        echo "   ✗ Config file missing!"
    fi
    
    # 2. Check if site is enabled
    echo ""
    echo "2. Sites-enabled check:"
    if [ -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
        echo "   ✓ Symlink exists"
    else
        echo "   ✗ Symlink missing!"
    fi
    
    # 3. Check backend
    echo ""
    echo "3. Backend check:"
    if curl -s -o /dev/null -w "   HTTP %{http_code}" http://localhost:$PORT/health; then
        echo " - Backend health endpoint"
    fi
    
    if curl -s -o /dev/null -w "   HTTP %{http_code}" http://localhost:$PORT/growth/questions; then
        echo " - Backend growth endpoint"
    fi
    
    # 4. Check via domain
    echo ""
    echo "4. Domain routing check:"
    RESPONSE=$(curl -s -L https://$DOMAIN/growth/questions 2>/dev/null | head -100)
    if echo "$RESPONSE" | grep -q "Questions Found"; then
        echo "   ✓ Getting backend response"
    elif echo "$RESPONSE" | grep -q "<title>flippi.ai</title>"; then
        echo "   ✗ Getting React app (WRONG!)"
    else
        echo "   ? Unknown response"
    fi
    
    echo ""
}

# Check deployment script execution
echo "Checking if post-deploy scripts ran..."
echo "======================================"

# Look for recent script execution
if [ -f "/var/www/blue.flippi.ai/scripts/post-deploy-nginx-fix.sh" ]; then
    echo "✓ post-deploy-nginx-fix.sh exists"
    MODIFIED=$(stat -c %Y "/var/www/blue.flippi.ai/scripts/post-deploy-nginx-fix.sh" 2>/dev/null || stat -f %m "/var/www/blue.flippi.ai/scripts/post-deploy-nginx-fix.sh" 2>/dev/null)
    NOW=$(date +%s)
    AGE=$((NOW - MODIFIED))
    echo "  Last modified: $((AGE / 60)) minutes ago"
fi

if [ -f "/var/www/blue.flippi.ai/scripts/fix-all-routes-comprehensive.sh" ]; then
    echo "✓ fix-all-routes-comprehensive.sh exists"
else
    echo "✗ fix-all-routes-comprehensive.sh MISSING"
fi

echo ""

# Run diagnostics for each environment
if [ -f "/etc/nginx/sites-available/blue.flippi.ai" ]; then
    diagnose_domain "blue.flippi.ai" "3002"
fi

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    diagnose_domain "green.flippi.ai" "3001"
fi

if [ -f "/etc/nginx/sites-available/app.flippi.ai" ]; then
    diagnose_domain "app.flippi.ai" "3000"
fi

# Check nginx errors
echo ""
echo "Recent nginx errors:"
echo "==================="
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Cannot read error log"

echo ""
echo "=== DIAGNOSTIC COMPLETE ==="
echo ""
echo "To fix the issue, run:"
echo "  cd /var/www/blue.flippi.ai && bash scripts/emergency-fix-growth-routes.sh"