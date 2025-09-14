#!/bin/bash
set -euo pipefail

# Quick Growth Service Status Check
echo "🔍 Checking Growth Service Status on blue.flippi.ai..."

# Test external endpoints
echo ""
echo "🌐 Testing External Endpoints..."

echo "📡 /api/growth/status:"
if curl -s https://blue.flippi.ai/api/growth/status | jq . 2>/dev/null; then
    echo "✅ Growth API working"
else
    echo "❌ Growth API not working"
fi

echo ""
echo "📡 /story route:"
STORY_RESPONSE=$(curl -s -I https://blue.flippi.ai/story)
echo "$STORY_RESPONSE"

if echo "$STORY_RESPONSE" | grep -q "200 OK"; then
    echo "✅ /story route responding"
    
    # Check if it's serving the right content
    STORY_CONTENT=$(curl -s https://blue.flippi.ai/story | head -5)
    if echo "$STORY_CONTENT" | grep -q "growth-ui\|marketing\|story"; then
        echo "✅ /story serving growth marketing site"
    else
        echo "❌ /story serving main app instead of growth site"
        echo "📋 Content preview:"
        echo "$STORY_CONTENT"
    fi
else
    echo "❌ /story route not responding"
fi

echo ""
echo "📡 /growth route:"
GROWTH_RESPONSE=$(curl -s -I https://blue.flippi.ai/growth)
echo "$GROWTH_RESPONSE"

if echo "$GROWTH_RESPONSE" | grep -q "200 OK"; then
    echo "✅ /growth route responding"
    
    # Check if it's serving the right content
    GROWTH_CONTENT=$(curl -s https://blue.flippi.ai/growth | head -5)
    if echo "$GROWTH_CONTENT" | grep -q "growth-ui\|admin\|dashboard"; then
        echo "✅ /growth serving growth admin dashboard"
    else
        echo "❌ /growth serving main app instead of growth dashboard"
        echo "📋 Content preview:"
        echo "$GROWTH_CONTENT"
    fi
else
    echo "❌ /growth route not responding"
fi

echo ""
echo "🔍 Summary:"
echo "  - Growth API: $(curl -s https://blue.flippi.ai/api/growth/status >/dev/null 2>&1 && echo "✅ Working" || echo "❌ Not working")"
echo "  - /story route: $(curl -s -I https://blue.flippi.ai/story | grep -q "200 OK" && echo "✅ Responding" || echo "❌ Not responding")"
echo "  - /growth route: $(curl -s -I https://blue.flippi.ai/growth | grep -q "200 OK" && echo "✅ Responding" || echo "❌ Not responding")"

echo ""
echo "💡 If issues persist, run the full diagnosis script on the server:"
echo "   ssh blue.flippi.ai 'bash -s' < scripts/diagnose-growth-deployment.sh"
