#!/bin/bash
# Quick fix for growth route issue - to be run on server

echo "=== Quick Growth Route Fix ==="

# Function to check if backend is handling growth routes
check_growth_route() {
    local DOMAIN=$1
    local RESPONSE=$(curl -s -I https://$DOMAIN/growth/questions | head -1)
    echo "$DOMAIN: $RESPONSE"
    
    # Check if we're getting the backend response
    if curl -s https://$DOMAIN/growth/questions | grep -q "Questions Found"; then
        echo "✅ Growth route is working correctly"
        return 0
    else
        echo "❌ Growth route is broken - getting React app"
        return 1
    fi
}

# First, let's check the current state
echo "Current state:"
check_growth_route "blue.flippi.ai"

# If broken, provide the manual fix commands
if [ $? -ne 0 ]; then
    echo ""
    echo "To fix this issue, run these commands on the server:"
    echo ""
    echo "1. SSH into the server:"
    echo "   ssh root@157.245.142.145"
    echo ""
    echo "2. Run the comprehensive fix:"
    echo "   cd /var/www/blue.flippi.ai && bash scripts/fix-all-routes-comprehensive.sh"
    echo ""
    echo "3. Or run the growth-specific fix:"
    echo "   cd /var/www/blue.flippi.ai && bash scripts/fix-growth-routes.sh"
    echo ""
    echo "The fix will:"
    echo "- Add /growth location block to nginx"
    echo "- Ensure it proxies to backend port 3002"
    echo "- Reload nginx configuration"
fi