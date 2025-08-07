#!/bin/bash
# Check required nginx include files before reload

set -e

echo "🔍 Checking for required NGINX include files..."

REQUIRED_FILES=(
  "/etc/letsencrypt/options-ssl-nginx.conf"
  "/etc/ssl/certs/dhparam.pem"
  "/etc/letsencrypt/ssl-dhparams.pem"
)

MISSING=0

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "❌ MISSING: $FILE"
    MISSING=1
  else
    echo "✅ Found: $FILE"
  fi
done

# Also check if the nginx config references files that don't exist
DOMAIN=$(basename $(pwd))
if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
  echo ""
  echo "🔍 Checking files referenced in nginx config..."
  
  # Extract all file paths from include and ssl_certificate directives
  REFERENCED_FILES=$(grep -E "include|ssl_certificate|ssl_dhparam" "/etc/nginx/sites-available/$DOMAIN" | grep -v "^#" | sed -E 's/.*(\/[^;]+);.*/\1/' | tr -d '"' | sort -u)
  
  for FILE in $REFERENCED_FILES; do
    if [[ "$FILE" == *"$"* ]]; then
      # Skip variables like $server_name
      continue
    fi
    
    if [ ! -f "$FILE" ] && [ ! -d "$FILE" ]; then
      echo "❌ Config references missing file: $FILE"
      MISSING=1
    fi
  done
fi

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "❗ One or more required files are missing."
  echo "❗ This will cause nginx config test to fail."
  echo ""
  echo "To fix missing Let's Encrypt files:"
  echo "1. Run: sudo certbot --nginx -d $DOMAIN"
  echo "2. Or create them manually with fix-ssl-and-legal.sh"
  exit 1
else
  echo ""
  echo "✅ All required NGINX files are present."
  echo "✅ Safe to reload nginx."
fi