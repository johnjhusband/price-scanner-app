# Manual OAuth Fix for Staging

## Problem
OAuth on staging (green.flippi.ai) returns 200 instead of 302 because the nginx configuration is missing the `/auth` location block.

## Root Cause
The postinstall script `fix-staging-nginx.sh` uses sudo commands which fail in GitHub Actions CI/CD environment. This prevents the OAuth nginx configuration from being applied during automated deployments.

## Manual Fix Instructions

### Step 1: SSH to the Staging Server
```bash
ssh root@157.245.142.145
```

### Step 2: Navigate to the Repository
```bash
cd /var/www/green.flippi.ai
```

### Step 3: Run the Manual Fix Script
```bash
sudo bash scripts/manual-fix-staging-oauth.sh
```

This script will:
1. Add the `/auth` location block to nginx
2. Test the nginx configuration
3. Reload nginx
4. Verify OAuth returns 302

### Step 4: Verify the Fix
```bash
curl -I https://green.flippi.ai/auth/google
```

Expected output:
```
HTTP/2 302
location: https://accounts.google.com/o/oauth2/v2/auth?...
```

## Alternative Manual Fix

If the script doesn't exist or fails, manually edit nginx:

### Step 1: Edit Nginx Config
```bash
sudo nano /etc/nginx/sites-available/green.flippi.ai
```

### Step 2: Add OAuth Location Block
Add this block after the `/api` location block:

```nginx
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

### Step 3: Test and Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Long-term Solution

The postinstall script has been updated to only check (not modify) the nginx configuration. This prevents CI/CD failures while still alerting when OAuth routes are missing.

## Production Deployment

When deploying OAuth to production:
1. Add the same `/auth` location block to the production nginx config
2. Update the backend to use production OAuth credentials
3. Test thoroughly before making live