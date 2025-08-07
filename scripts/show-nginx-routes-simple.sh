#!/bin/bash
# scripts/show-nginx-routes-simple.sh
# Debugging aid: Print out the live nginx config for this site

DOMAIN=$(basename $(pwd))
CONF_PATH="/etc/nginx/sites-available/$DOMAIN"

echo "=== Showing NGINX config for $DOMAIN ==="
echo ""
echo "File: $CONF_PATH"
echo "-----------------------------------------"

if [ -f "$CONF_PATH" ]; then
  grep -E "^\s*location|server_name|root|proxy_pass|try_files" $CONF_PATH | sed 's/^\s*/  /'
else
  echo "Config file not found at $CONF_PATH"
fi

echo ""
echo "-----------------------------------------"
echo "Full location blocks with context:"
echo "-----------------------------------------"
if [ -f "$CONF_PATH" ]; then
  awk '/location/ {print NR ": " $0; for(i=1; i<=5 && getline; i++) print NR ": " $0; print ""}' $CONF_PATH
fi