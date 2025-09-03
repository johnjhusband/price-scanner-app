#!/bin/bash
set -euo pipefail

echo "✨ Simplifying nginx routing..."

# Remove all special legal page rules from nginx config
# Let everything go through the normal proxy like contact/mission do
sed -i.bak '
/# Legal pages (if static files exist)/,/}$/d
/location = \/terms {/,/}$/d
/location = \/privacy {/,/}$/d
' /etc/nginx/sites-available/blue.flippi.ai

# Ensure symlink exists
if [ ! -L /etc/nginx/sites-enabled/blue.flippi.ai ]; then
    ln -s /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/
fi

nginx -t && nginx -s reload
echo "✅ Done - all pages now use same routing"