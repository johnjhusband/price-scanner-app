#!/bin/bash
# Nginx configuration checker and reporter
# This script checks if OAuth is properly configured and reports status

ENVIRONMENTS=("blue.flippi.ai:3002" "green.flippi.ai:3001" "app.flippi.ai:3000")

echo "=== Nginx OAuth Configuration Status ==="
echo "Date: $(date)"
echo

for ENV in "${ENVIRONMENTS[@]}"; do
    DOMAIN="${ENV%:*}"
    PORT="${ENV#*:}"
    
    echo "Checking $DOMAIN (backend port: $PORT)..."
    
    # Check OAuth endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I https://$DOMAIN/auth/google 2>/dev/null)
    
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "301" ]; then
        echo "  ✅ OAuth configured correctly (returns $RESPONSE redirect)"
    else
        echo "  ❌ OAuth NOT configured (returns $RESPONSE)"
        echo "     Fix needed: Add /auth location block to nginx config"
    fi
    
    # Check health endpoint
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null)
    if [ "$HEALTH" = "200" ]; then
        echo "  ✅ Backend is healthy"
    else
        echo "  ⚠️  Backend health check returned $HEALTH"
    fi
    
    echo
done

echo "=== Configuration Instructions ==="
echo "For any environment showing ❌ for OAuth:"
echo "1. The nginx config needs the /auth location block added"
echo "2. Use the apply-[environment]-oauth-fix.sh script"
echo "3. Or see nginx/README.md for manual instructions"