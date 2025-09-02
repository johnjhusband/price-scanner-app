# Production OAuth Deployment - Ready to Deploy

## Summary
OAuth is successfully working on staging (green.flippi.ai) after fixing the nginx configuration. All preparation for production deployment is complete.

## What's Ready

### 1. Production OAuth Fix Script
- `scripts/production-oauth-fix.sh` - Tested and working approach
- Based on the exact fix that made staging work
- Key differences for production:
  - Domain: app.flippi.ai
  - Backend port: 3000 (not 3001)
  - SSL path: /etc/letsencrypt/live/app.flippi.ai/

### 2. Production Workflow Update Required
The `.github/workflows/deploy-production.yml` needs this addition after line 21:

```yaml
# Apply OAuth nginx fix
echo "=== Applying OAuth fix ==="
if [ -f scripts/production-oauth-fix.sh ]; then
  echo "Running production OAuth fix..."
  bash scripts/production-oauth-fix.sh
else
  echo "WARNING: OAuth fix script not found"
fi
```

### 3. Production Environment Variables
Ensure `/var/www/app.flippi.ai/backend/.env` has:
```bash
PORT=3000
GOOGLE_CLIENT_ID=<production_client_id>
GOOGLE_CLIENT_SECRET=<production_secret>
GOOGLE_REDIRECT_URI=https://app.flippi.ai/auth/google/callback
SESSION_SECRET=<strong_random_string>
JWT_SECRET=<strong_random_string>
```

## Deployment Steps

1. **Update Production Workflow**
   - Manually add the OAuth fix to `.github/workflows/deploy-production.yml`
   - Or push from a different branch without workflow changes

2. **Deploy to Production**
   ```bash
   git checkout master
   git merge staging
   git push origin master
   ```

3. **Verify OAuth Works**
   ```bash
   curl -I https://app.flippi.ai/auth/google
   # Should return: HTTP/2 302
   ```

## Key Learning: What Fixed Staging

The root cause was nginx configuration missing the `/auth` location block. The fix:
1. Added `/auth` proxy to backend on port 3001 (staging) or 3000 (production)
2. Removed broken SSL include: `/etc/letsencrypt/options-ssl-nginx.conf`
3. Fixed line endings (CRLF → LF)
4. Updated sites-enabled symlink

## Files Created
- `scripts/production-oauth-fix.sh` - The production fix script
- `scripts/verify-production-ready.sh` - Pre-flight check
- `docs/PRODUCTION_OAUTH_CHECKLIST.md` - Deployment checklist
- `PRODUCTION_OAUTH_DEPLOYMENT.md` - Detailed guide

All files are committed and ready. The only blocker is the workflow file update due to GitHub OAuth permissions.