#!/bin/bash
# Trace what happens when we request /terms

DOMAIN=$(basename $(pwd))
PORT=3002
if [[ "$DOMAIN" == "green.flippi.ai" ]]; then PORT=3001; fi
if [[ "$DOMAIN" == "app.flippi.ai" ]]; then PORT=3000; fi

echo "=== Tracing Legal Pages Request Flow for $DOMAIN ==="
echo ""

# Start monitoring logs in background
echo "Starting log monitoring..."
sudo tail -f /var/log/nginx/access.log > /tmp/nginx-access-trace.log 2>&1 &
NGINX_PID=$!

# Also monitor backend logs
pm2 logs --lines 0 > /tmp/pm2-trace.log 2>&1 &
PM2_PID=$!

# Give logs a moment to start
sleep 2

# Make a test request with a unique identifier
TRACE_ID="TRACE-$(date +%s)"
echo "Making test request to /terms with trace ID: $TRACE_ID"
echo ""

# Make requests from localhost
echo "1. Testing from localhost:"
curl -H "X-Trace-Id: $TRACE_ID" -s -I http://localhost:$PORT/terms | head -5
echo ""

# Make request to public URL
echo "2. Testing from public URL:"
curl -H "X-Trace-Id: $TRACE_ID" -s -I https://$DOMAIN/terms | head -5
echo ""

# Wait for logs to catch up
sleep 3

# Stop monitoring
kill $NGINX_PID 2>/dev/null
kill $PM2_PID 2>/dev/null

# Check what we captured
echo "3. Nginx access log entries for /terms:"
grep "/terms" /tmp/nginx-access-trace.log || echo "No /terms requests found in nginx access log!"
echo ""

echo "4. PM2 backend logs during request:"
grep -E "terms|TRACE" /tmp/pm2-trace.log | head -10 || echo "No related entries in PM2 logs"
echo ""

# Check if frontend is intercepting
echo "5. Checking what's actually served for /terms:"
echo "First 20 lines of response body:"
curl -s https://$DOMAIN/terms | head -20
echo ""

# Check if it's the React app
if curl -s https://$DOMAIN/terms | grep -q "id=\"root\""; then
    echo "⚠️  WARNING: /terms is serving the React app (id='root' found)"
    echo "This means the frontend SPA is intercepting the route!"
    echo ""
    echo "Possible causes:"
    echo "1. Nginx is not routing /terms to backend"
    echo "2. React Router or frontend code is handling all routes"
    echo "3. Service Worker might be intercepting requests"
else
    echo "✓ /terms is NOT serving the React app"
fi

# Check for service worker
echo ""
echo "6. Checking for service worker in the app:"
curl -s https://$DOMAIN/ | grep -i "service.?worker" || echo "No service worker references found"

# Clean up
rm -f /tmp/nginx-access-trace.log /tmp/pm2-trace.log

echo ""
echo "=== Trace Complete ==="
echo ""
echo "Key findings:"
echo "- If no /terms requests appear in nginx logs, the browser isn't reaching nginx"
echo "- If requests appear but serve React app, nginx config is wrong"
echo "- If you see 'id=root' in the response, the SPA is handling the route"