#!/bin/bash
# Check nginx logs via deployment workflow

echo "=== Checking Nginx Error Logs ==="
echo ""

echo "Last 50 lines of nginx error log:"
sudo tail -50 /var/log/nginx/error.log

echo ""
echo "=== Recent 500 errors in access log ==="
sudo tail -100 /var/log/nginx/access.log | grep " 500 " | tail -20

echo ""
echo "=== Current nginx config test ==="
sudo nginx -t

echo ""
echo "=== PM2 status ==="
pm2 list