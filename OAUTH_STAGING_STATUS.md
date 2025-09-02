# OAuth Staging Status & Resolution Guide

## Current Status
- **Development (blue.flippi.ai)**: ✅ OAuth WORKING
- **Staging (green.flippi.ai)**: ❌ OAuth NOT WORKING (returns 200 instead of 302)
- **Production (app.flippi.ai)**: Not yet deployed

## Problem
The nginx configuration for staging is missing the `/auth` location block, causing OAuth requests to be served by the frontend instead of being proxied to the backend.

## Quick Test
```bash
curl -I https://green.flippi.ai/auth/google
```
- ❌ Current: Returns `200 OK` (serving frontend HTML)
- ✅ Expected: Returns `302 Found` (redirect to Google)

## Resolution Steps

### Option 1: Check GitHub Actions (Recommended)
1. Go to: https://github.com/johnjhusband/price-scanner-app/actions
2. Find the latest "Deploy Staging" workflow run
3. Check if the OAuth fix script ran successfully
4. Look for output like:
   ```
   === Applying OAuth fix ===
   Applying new configuration...
   ✓ Configuration test passed
   ✓ Nginx reloaded successfully
   ```

### Option 2: Manual Fix (If GitHub Actions didn't work)
The nginx configuration needs this block added after the `/api` location:

```nginx
# OAuth routes (REQUIRED FOR GOOGLE LOGIN)
location /auth {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Option 3: Use the Fix Script
If the script exists on the server:
```bash
ssh root@157.245.142.145
cd /var/www/green.flippi.ai
bash scripts/apply-staging-oauth-fix.sh
```

## Files Created for This Fix
1. `scripts/apply-staging-oauth-fix.sh` - Automated fix script
2. `nginx/green.flippi.ai.conf` - Complete nginx configuration template
3. `nginx/README.md` - Documentation for nginx OAuth requirements
4. `STAGING_OAUTH_MANUAL_FIX.md` - Manual fix instructions

## Next Steps
1. Verify OAuth is working on staging
2. Update production nginx configuration when ready to deploy
3. Consider adding nginx configuration to version control or automated deployment

## Success Criteria
- OAuth endpoint returns 302 redirect
- Users can click "Sign in with Google" and authenticate
- Authentication persists across page refreshes