#!/bin/bash
# Manually insert legal routes into nginx config
# This script needs to be run with sudo

if [ "$EUID" -ne 0 ]; then 
    echo "This script must be run with sudo"
    exit 1
fi

CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    DOMAIN="blue.flippi.ai"
    PORT="3002"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    DOMAIN="green.flippi.ai"
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    DOMAIN="app.flippi.ai"
    PORT="3000"
else
    echo "Unknown environment"
    exit 1
fi

CONFIG="/etc/nginx/sites-available/$DOMAIN"

# Backup
cp $CONFIG $CONFIG.backup.$(date +%Y%m%d_%H%M%S)

# Create a new config with legal routes inserted
awk -v port="$PORT" '
/^[[:space:]]*server_name/ { 
    print $0
    if (!inserted) {
        print ""
        print "    # Legal pages - proxy to backend Express routes"
        print "    location = /terms {"
        print "        proxy_pass http://localhost:" port ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        print "    location = /privacy {"
        print "        proxy_pass http://localhost:" port ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        print "    location = /mission {"
        print "        proxy_pass http://localhost:" port ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        print "    location = /contact {"
        print "        proxy_pass http://localhost:" port ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        inserted = 1
    }
    next
}
{ print }
' $CONFIG > $CONFIG.new

# Test the new config
nginx -t -c /etc/nginx/nginx.conf -g "include $CONFIG.new;"
if [ $? -eq 0 ]; then
    mv $CONFIG.new $CONFIG
    systemctl reload nginx
    echo "✅ Legal routes added successfully!"
else
    echo "❌ Configuration test failed"
    rm $CONFIG.new
    exit 1
fi