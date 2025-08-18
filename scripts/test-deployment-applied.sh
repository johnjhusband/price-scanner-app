#!/bin/bash
# Test if deployment actually applied the nginx config

echo "=== Testing if deployment applied nginx config ==="
echo ""
echo "Current /growth/questions response:"
curl -sI https://blue.flippi.ai/growth/questions | head -5
echo ""
echo "If you see 'HTTP/2 200', the route is working"
echo "If you see 'HTTP/2 404' or redirects, nginx config wasn't applied"
echo ""
echo "To manually check on server:"
echo "1. SSH to blue.flippi.ai"
echo "2. Run: grep -A5 'location /growth' /etc/nginx/sites-available/blue.flippi.ai"
echo "3. If no results, the growth routes aren't in nginx config"