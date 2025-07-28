# Production OAuth Deployment Guide

## Pre-Deployment Verification ✅

### 1. Staging OAuth Confirmed Working
- ✅ Staging returns 302 redirect
- ✅ OAuth login flow tested successfully
- ✅ No nginx configuration errors

### 2. Key Differences for Production
- **Domain**: app.flippi.ai
- **Backend Port**: 3000 (not 3001)
- **Frontend Port**: 8080
- **Branch**: master

### 3. Scripts Ready
- `scripts/production-oauth-fix.sh` - Created based on working staging fix
- Removes broken SSL includes that caused 36-hour delay
- Uses exact same approach that fixed staging

## Deployment Steps

### Step 1: Update Production Workflow
Add OAuth fix to `.github/workflows/deploy-production.yml` after line 21:

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

### Step 2: Environment Variables
Ensure production `.env` has:
```bash
PORT=3000
GOOGLE_CLIENT_ID=<production_oauth_client_id>
GOOGLE_CLIENT_SECRET=<production_oauth_secret>
GOOGLE_REDIRECT_URI=https://app.flippi.ai/auth/google/callback
SESSION_SECRET=<strong_random_string>
JWT_SECRET=<strong_random_string>
```

### Step 3: Google OAuth Console
Verify in Google Cloud Console:
- Authorized redirect URIs includes: `https://app.flippi.ai/auth/google/callback`
- Authorized JavaScript origins includes: `https://app.flippi.ai`

### Step 4: Deploy
1. Merge staging → master
2. GitHub Actions will auto-deploy
3. Monitor deployment logs

### Step 5: Verify
```bash
# Test OAuth redirect
curl -I https://app.flippi.ai/auth/google
# Should return: HTTP/2 302

# Check redirect location
curl -s -I https://app.flippi.ai/auth/google | grep -i location
# Should show: Location: https://accounts.google.com/o/oauth2/v2/auth...
```

## Rollback Plan
If issues occur:
```bash
# SSH to server
ssh root@157.245.142.145
cd /var/www/app.flippi.ai

# Restore backup
cp /tmp/app-nginx-backup-*.conf /etc/nginx/sites-available/app.flippi.ai
nginx -t && nginx -s reload
```

## Success Criteria
- [ ] OAuth endpoint returns 302
- [ ] Users can log in with Google
- [ ] Session persists after login
- [ ] No nginx errors in logs
- [ ] Backend health check passes

## Common Issues & Solutions

### Issue: OAuth returns 200 instead of 302
**Solution**: Run `bash scripts/production-oauth-fix.sh` on server

### Issue: SSL certificate errors
**Solution**: Our script doesn't include broken SSL files

### Issue: Wrong redirect URI
**Solution**: Check GOOGLE_REDIRECT_URI in .env matches Google Console

## Final Checklist
- [x] Staging OAuth working (302 redirect)
- [x] Production script ready (no SSL includes)
- [x] Environment variables documented
- [x] Rollback plan prepared
- [ ] Production workflow updated
- [ ] Google OAuth configured for production
- [ ] Ready to deploy