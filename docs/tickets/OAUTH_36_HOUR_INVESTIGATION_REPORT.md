# OAuth Nginx Configuration: 36-Hour Investigation Report

## Executive Summary

After 36 hours of attempted fixes, the OAuth nginx configuration on staging (green.flippi.ai) continues to return HTTP 200 instead of the expected 302 redirect. This investigation has identified the root cause: **the OAuth fix scripts are updating `/etc/nginx/sites-available/` but nginx is actually using `/etc/nginx/sites-enabled/`, and the scripts do not handle the symlink between them.**

## Timeline of Attempts

1. **Initial Problem**: OAuth returns 200 on staging, works on development
2. **Multiple Scripts Created**:
   - `fix-staging-nginx.sh` (uses sudo, fails in CI/CD)
   - `fix-staging-nginx-oauth.sh` 
   - `fix-staging-oauth-verbose.sh` (most recent)
   - Various other iterations
3. **Workflow Updates**: Deploy-staging.yml modified to run OAuth fix
4. **Postinstall Issues**: Package.json postinstall script uses sudo, hidden failures

## Root Cause Identified

### The Critical Issue

All OAuth fix scripts have the same fundamental flaw:

```bash
# They write to:
/etc/nginx/sites-available/green.flippi.ai

# But nginx actually reads from:
/etc/nginx/sites-enabled/green.flippi.ai
```

The scripts do NOT:
1. Create or update the symlink from sites-enabled to sites-available
2. Verify which configuration nginx is actually using
3. Check if sites-enabled exists or is properly linked

### Evidence

1. **From `fix-staging-oauth-verbose.sh`**:
   - Writes complete config to sites-available
   - Tests with `nginx -t`
   - Reloads nginx
   - BUT never touches sites-enabled

2. **From `update-nginx-blue.sh`** (working script for blue.flippi.ai):
   ```bash
   # This script DOES handle the symlink:
   if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
       sudo ln -s "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$DOMAIN"
   fi
   ```

3. **Hidden Failures**:
   - Grep checks use `2>/dev/null` hiding permission errors
   - Postinstall script uses `|| true` hiding failures
   - No logging of which files are actually being modified

## Why It Keeps Failing

1. **Script writes new config** → sites-available/green.flippi.ai ✅
2. **Script tests config** → nginx -t passes ✅
3. **Script reloads nginx** → nginx reloads ✅
4. **But nginx still uses old config** → because sites-enabled is not updated ❌

## The Solution

A new script has been created: `fix-staging-oauth-complete.sh` that:

1. **Checks the actual running nginx config** using `nginx -T`
2. **Updates BOTH sites-available AND sites-enabled**
3. **Properly manages the symlink**
4. **Includes comprehensive logging**
5. **Verifies the fix actually worked**

Key additions:
```bash
# Remove old sites-enabled entry
rm -f /etc/nginx/sites-enabled/green.flippi.ai

# Create proper symlink
ln -s /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/green.flippi.ai

# Verify nginx is using the new config
nginx -T | grep -A 20 "server_name green.flippi.ai" | grep "location /auth"
```

## Immediate Action Required

1. **Deploy the new script** to staging branch
2. **Update workflow** to use `fix-staging-oauth-complete.sh`
3. **Or manually run** on the server:
   ```bash
   ssh root@157.245.142.145
   cd /var/www/green.flippi.ai
   bash scripts/fix-staging-oauth-complete.sh
   ```

## Lessons Learned

1. **Always verify the actual config nginx is using** (`nginx -T`)
2. **Handle both sites-available and sites-enabled**
3. **Don't hide errors** with `2>/dev/null`
4. **Log everything** during deployment scripts
5. **Test the actual behavior**, not just config syntax

## Prevention

For future nginx modifications:
1. Always update both sites-available and sites-enabled
2. Use `nginx -T` to verify active configuration
3. Include symlink management in all nginx scripts
4. Add verbose logging to deployment scripts
5. Test endpoint behavior, not just nginx syntax

## Current Status

- **Development (blue.flippi.ai)**: ✅ OAuth working
- **Staging (green.flippi.ai)**: ❌ Still broken (awaiting fix deployment)
- **Production (app.flippi.ai)**: Not yet deployed

## Next Steps

1. Deploy `fix-staging-oauth-complete.sh`
2. Verify OAuth returns 302 on staging
3. Apply same fix pattern to production deployment
4. Update all nginx management scripts to handle symlinks