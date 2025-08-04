# URGENT: Fix Legal Pages on Blue Environment

The legal pages (/terms and /privacy) are currently showing the React app instead of the actual terms and privacy content. This needs to be fixed immediately.

## Quick Fix (2 minutes)

SSH into the server and run these commands:

```bash
# 1. SSH to server
ssh root@157.245.142.145

# 2. Add legal pages routes to nginx config
sudo nano /etc/nginx/sites-available/blue.flippi.ai

# 3. Add these location blocks BEFORE the "location /" block:

    # Legal pages - proxy to backend
    location = /terms {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /privacy {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

# 4. Save and exit (Ctrl+X, Y, Enter)

# 5. Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 6. Verify the fix
curl -I https://blue.flippi.ai/terms
curl -I https://blue.flippi.ai/privacy
```

## What This Fixes

- Currently: All routes go to the React frontend
- After fix: /terms and /privacy routes go to the backend Express server
- The backend already has the correct middleware to serve the static HTML files

## Verification

After applying the fix, visit:
- https://blue.flippi.ai/terms - Should show Terms of Service
- https://blue.flippi.ai/privacy - Should show Privacy Policy

These should NOT show the main Flippi app interface.

## Root Cause

The nginx configuration is missing specific routes for legal pages. Without these routes, nginx sends all requests to the frontend, which shows the React app for any URL.

The backend has the correct setup (`setupLegalPages.js` middleware), but nginx never routes the requests there.

## Permanent Fix

The deployment workflow already includes a script to fix this (`scripts/post-deploy-nginx.sh`), but it's not executing properly. After manually fixing, we should ensure future deployments run this script.