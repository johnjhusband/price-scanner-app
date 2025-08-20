#!/bin/bash

# Create GitHub issue for nginx static files problem
gh issue create \
  --title "P0 BUG: Nginx serving index.html for all static files - App won't load" \
  --body "## Problem
The app is stuck on the loading screen because nginx is serving index.html for ALL requests, including JavaScript and CSS files.

## Root Cause
Our nginx fixes for growth routes have overridden the static file serving configuration. The nginx catch-all rule is intercepting requests to \`/_expo/\` static files and returning index.html instead.

## Evidence
- Request to \`/_expo/static/js/web/AppEntry-*.js\` returns HTML content (969 bytes)
- The deployment workflow builds correctly, but nginx misconfiguration prevents files from being served
- This happened after implementing growth route fixes

## Impact
- **Severity**: P0 - Complete app failure
- **Affected**: All users on blue.flippi.ai
- **Since**: After growth route nginx fixes

## Solution
Fix nginx configuration to:
1. Serve static files from \`/_expo/\` directory directly
2. Serve other static assets (images, fonts) directly  
3. Only fall back to index.html for actual React routes

## Nginx Config Fix Needed
\`\`\`nginx
# Serve Expo static files directly
location /_expo/ {
    alias /var/www/blue.flippi.ai/mobile-app/dist/_expo/;
    expires 1y;
    add_header Cache-Control \"public, immutable\";
}

# Serve other static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control \"public, immutable\";
}

# React app catch-all (MUST be last)
location / {
    try_files \$uri /index.html;
}
\`\`\`

## Acceptance Criteria
- [ ] JavaScript files load correctly (not HTML)
- [ ] CSS files load correctly
- [ ] App loads without errors
- [ ] Growth routes still work
- [ ] All static assets served with proper caching headers" \
  --label "bug" \
  --label "P0" \
  --milestone "Release 006"

echo "Issue created!"