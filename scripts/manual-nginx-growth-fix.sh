#!/bin/bash
# Manual fix for nginx growth routes
# This script adds the growth routes to the active nginx configuration

set -e

echo "=== Manual Nginx Growth Route Fix ==="
echo ""

# Find the active nginx configuration
echo "1. Finding active nginx configuration..."
ACTIVE_CONFIG=""

# Check sites-enabled for the actual config being used
for config in /etc/nginx/sites-enabled/*; do
    if [ -f "$config" ] && grep -q "server_name.*blue.flippi.ai" "$config" 2>/dev/null; then
        ACTIVE_CONFIG="$config"
        break
    fi
done

if [ -z "$ACTIVE_CONFIG" ]; then
    echo "ERROR: Could not find active nginx config for blue.flippi.ai"
    exit 1
fi

REAL_CONFIG=$(readlink -f "$ACTIVE_CONFIG")
echo "Found active config: $ACTIVE_CONFIG"
echo "Real file: $REAL_CONFIG"

# Check if growth routes already exist
echo ""
echo "2. Checking for existing growth routes..."
if grep -q "location.*growth" "$REAL_CONFIG"; then
    echo "Growth routes already exist in config"
    grep -n "growth" "$REAL_CONFIG" | head -5
else
    echo "Growth routes NOT found - will add them"
fi

# Backup the config
echo ""
echo "3. Creating backup..."
BACKUP_FILE="${REAL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$REAL_CONFIG" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Add growth routes if missing
if ! grep -q "location.*growth" "$REAL_CONFIG"; then
    echo ""
    echo "4. Adding growth routes..."
    
    # Create a temporary file with the new config
    TEMP_FILE="/tmp/nginx_config_$$.tmp"
    sudo cp "$REAL_CONFIG" "$TEMP_FILE"
    
    # Find the line with "location = /terms" or similar backend routes
    # We'll insert our growth route after the legal pages but before catch-all
    TERMS_LINE=$(grep -n "location = /terms" "$TEMP_FILE" | tail -1 | cut -d: -f1)
    
    if [ -n "$TERMS_LINE" ]; then
        # Find the closing brace for the /terms block
        CLOSE_LINE=$((TERMS_LINE + 5))
        
        # Insert after the terms block
        sudo sed -i "${CLOSE_LINE}a\\
\\
    # Growth backend endpoints\\
    location ^~ /growth {\\
        proxy_pass http://127.0.0.1:3002;\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }" "$TEMP_FILE"
    else
        # Fallback: insert before the catch-all "location /"
        CATCHALL_LINE=$(grep -n "location / {" "$TEMP_FILE" | head -1 | cut -d: -f1)
        
        if [ -n "$CATCHALL_LINE" ]; then
            sudo sed -i "${CATCHALL_LINE}i\\
    # Growth backend endpoints\\
    location ^~ /growth {\\
        proxy_pass http://127.0.0.1:3002;\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }\\
" "$TEMP_FILE"
        else
            echo "ERROR: Could not find where to insert growth routes"
            exit 1
        fi
    fi
    
    # Copy the temp file back
    sudo cp "$TEMP_FILE" "$REAL_CONFIG"
    rm -f "$TEMP_FILE"
    
    echo "Growth routes added successfully"
fi

# Test the configuration
echo ""
echo "5. Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed - restoring backup"
    sudo cp "$BACKUP_FILE" "$REAL_CONFIG"
    sudo nginx -t
    exit 1
fi

# Reload nginx
echo ""
echo "6. Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Test the route
echo ""
echo "7. Testing /growth/questions route..."
sleep 2

RESPONSE=$(curl -s https://blue.flippi.ai/growth/questions | head -100)
if echo "$RESPONSE" | grep -q "Questions Found"; then
    echo "✅ SUCCESS: Growth routes are working!"
    echo ""
    echo "Page title:"
    echo "$RESPONSE" | grep -o "<title>.*</title>" | head -1
else
    echo "❌ Growth routes still not working"
    echo ""
    echo "Nginx response (first 10 lines):"
    echo "$RESPONSE" | head -10
    echo ""
    echo "Backend test:"
    curl -s http://localhost:3002/growth/questions | head -5
fi

echo ""
echo "=== Fix complete ==="
echo ""
echo "To verify the fix worked:"
echo "  curl -s https://blue.flippi.ai/growth/questions | grep 'Questions Found'"