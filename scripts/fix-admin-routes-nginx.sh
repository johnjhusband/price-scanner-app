#!/bin/bash
# Fix nginx routing for admin pages

# Detect environment
if [ -f "/var/www/blue.flippi.ai/.env" ]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
elif [ -f "/var/www/green.flippi.ai/.env" ]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
else
    DOMAIN="app.flippi.ai"
    PORT="3000"
fi

echo "=== Fixing admin routes for $DOMAIN ==="

# Check current nginx config
echo "Current nginx config:"
grep -E "location /admin|location /api" /etc/nginx/sites-available/$DOMAIN || echo "No admin routes found"

# Backup current config
sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.$(date +%s)

# Add admin and API routes if not present
if ! grep -q "location /admin" /etc/nginx/sites-available/$DOMAIN; then
    echo "Adding admin routes..."
    
    # Find the main location / block and insert admin routes before it
    sudo sed -i '/location \/ {/i\
\
    # Admin routes\
    location /admin {\
        proxy_pass http://localhost:'$PORT';\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
\
    # API routes\
    location /api {\
        proxy_pass http://localhost:'$PORT';\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' /etc/nginx/sites-available/$DOMAIN
else
    echo "Admin routes already present"
fi

# Test nginx configuration
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "Nginx config valid, reloading..."
    sudo nginx -s reload
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx config error! Rolling back..."
    sudo cp /etc/nginx/sites-available/$DOMAIN.backup.$(date +%s) /etc/nginx/sites-available/$DOMAIN
    sudo nginx -s reload
    exit 1
fi

# Test the routes
echo ""
echo "Testing routes..."
sleep 2

# Test admin automation page
echo -n "Testing /admin/automation: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/admin/automation)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Working ($RESPONSE)"
else
    echo "❌ Not working ($RESPONSE)"
fi

# Test admin questions page
echo -n "Testing /admin/questions: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/admin/questions)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Working ($RESPONSE)"
else
    echo "❌ Not working ($RESPONSE)"
fi

# Test API status
echo -n "Testing /api/automation/status: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/automation/status)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Working ($RESPONSE)"
else
    echo "❌ Not working ($RESPONSE)"
fi

echo ""
echo "=== Admin routes configuration complete ==="
echo "Access the manual selection page at: https://$DOMAIN/admin/questions"