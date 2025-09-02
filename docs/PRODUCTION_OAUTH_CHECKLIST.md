# Production OAuth Deployment Checklist

## Pre-Deployment Verification ✅

### 1. Staging Confirmation
- [x] Staging OAuth returns 302 redirect
- [x] Staging OAuth login flow tested successfully
- [x] No nginx errors in staging logs

### 2. Production Scripts Ready
- [x] `scripts/production-oauth-fix.sh` exists
- [x] Script has NO broken SSL includes (no `options-ssl-nginx.conf`)
- [x] Script has Unix line endings (not Windows CRLF)
- [x] Script updates both sites-available AND creates sites-enabled symlink

### 3. Production Workflow Updated
- [x] `.github/workflows/deploy-production.yml` includes OAuth fix
- [x] OAuth fix runs AFTER git pull, BEFORE npm install
- [x] Script execution doesn't use sudo (runs as root via SSH)

### 4. Environment Configuration
- [ ] Production `.env` has all OAuth variables:
  ```bash
  PORT=3000
  GOOGLE_CLIENT_ID=<production_client_id>
  GOOGLE_CLIENT_SECRET=<production_secret>
  GOOGLE_REDIRECT_URI=https://app.flippi.ai/auth/google/callback
  SESSION_SECRET=<strong_random_string>
  JWT_SECRET=<strong_random_string>
  ```

### 5. Google OAuth Console
- [ ] Production redirect URI added: `https://app.flippi.ai/auth/google/callback`
- [ ] Production origin added: `https://app.flippi.ai`
- [ ] OAuth consent screen configured

## Deployment Steps

### 1. Final Pre-Flight Check
```bash
# Run from local machine
bash scripts/verify-production-ready.sh
```

### 2. Deploy to Production
```bash
# Merge staging to master
git checkout master
git merge staging
git push origin master
```

### 3. Monitor Deployment
- Watch GitHub Actions: https://github.com/johnjhusband/price-scanner-app/actions
- Look for "Applying OAuth fix" in logs
- Verify nginx test passes

### 4. Post-Deployment Verification
```bash
# Test OAuth redirect (should return 302)
curl -I https://app.flippi.ai/auth/google

# Check redirect location
curl -s -I https://app.flippi.ai/auth/google | grep -i location

# Test health endpoint
curl https://app.flippi.ai/health

# Test actual login flow in browser
# Visit: https://app.flippi.ai/auth/google
```

## Success Criteria
- [ ] OAuth endpoint returns HTTP 302
- [ ] Redirect location starts with https://accounts.google.com/o/oauth2/v2/auth
- [ ] Users can complete Google login
- [ ] Backend health check passes
- [ ] No nginx errors in deployment logs

## Rollback Plan
If OAuth doesn't work after deployment:

```bash
# SSH to production
ssh root@157.245.142.145
cd /var/www/app.flippi.ai

# Check nginx config
cat /etc/nginx/sites-available/app.flippi.ai | grep -A5 "location /auth"

# Restore backup if needed
ls -la /tmp/app-nginx-backup-*
cp /tmp/app-nginx-backup-<latest>.conf /etc/nginx/sites-available/app.flippi.ai
nginx -t && nginx -s reload
```

## Key Learnings from Staging
1. **SSL Include Issue**: Never include `/etc/letsencrypt/options-ssl-nginx.conf`
2. **Line Endings**: Always check scripts have Unix line endings
3. **Directory Issue**: Update sites-available AND create sites-enabled symlink
4. **No Sudo in CI**: Scripts run as root via SSH, don't need sudo
5. **Test First**: Always run `nginx -t` before reload

## Final Sign-Off
- [ ] All checklist items completed
- [ ] CEO briefed on deployment plan
- [ ] Team ready to monitor
- [ ] Rollback plan understood

Ready to deploy OAuth to production!