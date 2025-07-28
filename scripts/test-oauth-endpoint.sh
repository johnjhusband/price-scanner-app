#!/bin/bash
# Test OAuth endpoint status

echo "Testing OAuth endpoints..."
echo "========================="

for env in blue green app; do
    DOMAIN="${env}.flippi.ai"
    if [ "$env" = "app" ]; then
        DOMAIN="app.flippi.ai"
    fi
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://$DOMAIN/auth/google 2>/dev/null || echo "FAIL")
    
    if [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
        echo "✅ $DOMAIN: OAuth working (returns $STATUS)"
    else
        echo "❌ $DOMAIN: OAuth NOT working (returns $STATUS)"
    fi
done

echo ""
echo "Note: OAuth should return 302 (redirect) to work properly"