#!/bin/bash

# Debug Blue Frontend Blank Screen Issue
# This script checks all potential causes of the blank screen after analysis

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Debugging Blue Frontend Blank Screen Issue ==="
echo "Will check: container logs, API response, code issues, console errors"
echo ""

# 1. Check frontend container logs
echo "1. Checking frontend container logs..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP "docker logs blue_frontend --tail 100" > /tmp/blue-frontend-logs.txt 2>&1
echo "   Frontend logs saved to /tmp/blue-frontend-logs.txt"
grep -i "error\|warn\|fail" /tmp/blue-frontend-logs.txt | head -10

# 2. Check backend container logs
echo -e "\n2. Checking backend container logs..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP "docker logs blue_backend --tail 100" > /tmp/blue-backend-logs.txt 2>&1
echo "   Backend logs saved to /tmp/blue-backend-logs.txt"
grep -i "error\|warn\|fail" /tmp/blue-backend-logs.txt | head -10

# 3. Test API response directly
echo -e "\n3. Testing API response format..."
# Create a test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png

# Test the API
echo "   Sending test request to https://blue.flippi.ai/api/scan..."
curl -s -X POST https://blue.flippi.ai/api/scan \
  -F "image=@/tmp/test.png" \
  -H "Accept: application/json" > /tmp/blue-api-response.json 2>&1

echo "   API Response:"
cat /tmp/blue-api-response.json | jq . 2>/dev/null || cat /tmp/blue-api-response.json
echo ""

# 4. Check if API returns expected fields
echo -e "\n4. Checking API response structure..."
if [ -f /tmp/blue-api-response.json ]; then
    echo -n "   Has 'success' field: "
    grep -q '"success"' /tmp/blue-api-response.json && echo "YES" || echo "NO"
    
    echo -n "   Has 'analysis' field: "
    grep -q '"analysis"' /tmp/blue-api-response.json && echo "YES" || echo "NO"
    
    echo -n "   Has 'item_name' field: "
    grep -q '"item_name"' /tmp/blue-api-response.json && echo "YES" || echo "NO"
    
    echo -n "   Has 'authenticity_score' field: "
    grep -q '"authenticity_score"' /tmp/blue-api-response.json && echo "YES" || echo "NO"
    
    echo -n "   Has 'boca_score' field: "
    grep -q '"boca_score"' /tmp/blue-api-response.json && echo "YES" || echo "NO"
fi

# 5. Check App.js for syntax issues
echo -e "\n5. Checking App.js for potential issues..."
cd /mnt/c/Users/jhusband/price-scanner-app

# Check for incomplete style definitions
echo "   Checking for style issues..."
grep -n "styles\." blue/mobile-app/App.js | grep -v "StyleSheet" | while read line; do
    style_name=$(echo "$line" | grep -o "styles\.[a-zA-Z0-9_]*" | sed 's/styles\.//')
    if ! grep -q "$style_name:" blue/mobile-app/App.js; then
        echo "   WARNING: Style '$style_name' used but not defined at $line"
    fi
done

# Check for mismatched braces
echo -e "\n   Checking for brace mismatches..."
open_braces=$(grep -o "{" blue/mobile-app/App.js | wc -l)
close_braces=$(grep -o "}" blue/mobile-app/App.js | wc -l)
echo "   Open braces: $open_braces, Close braces: $close_braces"
if [ "$open_braces" -ne "$close_braces" ]; then
    echo "   ERROR: Brace mismatch detected!"
fi

# 6. Check specific rendering code
echo -e "\n6. Checking results rendering code..."
echo "   Looking for results rendering section..."
grep -n -A20 "{results &&" blue/mobile-app/App.js > /tmp/results-render.txt
echo "   Results render code saved to /tmp/results-render.txt"

# Check if getAuthenticityColor function exists
echo -e "\n   Checking helper functions..."
echo -n "   getAuthenticityColor function: "
grep -q "getAuthenticityColor" blue/mobile-app/App.js && echo "EXISTS" || echo "MISSING"

echo -n "   getBocaScoreColor function: "
grep -q "getBocaScoreColor" blue/mobile-app/App.js && echo "EXISTS" || echo "MISSING"

# 7. Compare with production App.js
echo -e "\n7. Comparing with production (working) version..."
echo "   Key differences in results rendering:"
diff -u prod/mobile-app/App.js blue/mobile-app/App.js | grep -A5 -B5 "results\." | head -20

# 8. Check for JavaScript errors in console
echo -e "\n8. Creating browser console error checker..."
cat > /tmp/check-console.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Blue Console Error Check</title>
</head>
<body>
    <h1>Open Developer Console (F12) and check for errors</h1>
    <iframe src="https://blue.flippi.ai" style="width:100%; height:600px;"></iframe>
</body>
</html>
EOF
echo "   Open /tmp/check-console.html in browser to check console errors"

# 9. Check specific style definitions that might be missing
echo -e "\n9. Checking for missing style definitions..."
missing_styles=""
for style in scoreContainer scoreText scoreDescription label; do
    if ! grep -q "$style:" blue/mobile-app/App.js; then
        missing_styles="$missing_styles $style"
    fi
done
if [ -n "$missing_styles" ]; then
    echo "   ERROR: Missing styles:$missing_styles"
else
    echo "   All score-related styles are defined"
fi

# 10. Check if the issue is in the StyleSheet
echo -e "\n10. Analyzing StyleSheet structure..."
# Find where buyPrice style ends and what comes after
grep -n -A10 "buyPrice:" blue/mobile-app/App.js > /tmp/buyprice-area.txt
echo "   Area around buyPrice style saved to /tmp/buyprice-area.txt"

# Summary
echo -e "\n=== SUMMARY ==="
echo "Potential issues found:"

# Check if we found the problem
if [ -n "$missing_styles" ]; then
    echo "- CRITICAL: Missing style definitions:$missing_styles"
    echo "- This would cause React Native to crash when rendering"
    echo "- FIX: Need to add missing styles to StyleSheet.create()"
fi

if grep -q "error\|Error" /tmp/blue-api-response.json 2>/dev/null; then
    echo "- API is returning an error response"
fi

if [ "$open_braces" -ne "$close_braces" ]; then
    echo "- Syntax error: Mismatched braces in App.js"
fi

echo -e "\nDetailed logs saved to:"
echo "- /tmp/blue-frontend-logs.txt"
echo "- /tmp/blue-backend-logs.txt"
echo "- /tmp/blue-api-response.json"
echo "- /tmp/results-render.txt"
echo "- /tmp/buyprice-area.txt"

echo -e "\nScript complete. Found the issue? Press Ctrl+C to stop."