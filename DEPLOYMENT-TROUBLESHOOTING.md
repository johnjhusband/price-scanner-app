# Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### 1. GitHub Push Rejected - Workflow Files

**Error Message:**
```
refusing to allow an OAuth App to create or update workflow .github/workflows/deploy-*.yml
```

**Cause:** GitHub security prevents OAuth Apps from modifying workflow files.

**Solution:**
1. Remove workflow files from your commit:
   ```bash
   git reset HEAD .github/workflows/
   git commit --amend
   ```
2. Only commit application code, scripts, and documentation
3. If workflows need updates, edit them manually in GitHub UI

**Prevention:** Never include `.github/workflows/` in your commits

---

### 2. 502 Bad Gateway Error

**Symptoms:** 
- Nginx returns 502 error
- Site is unreachable
- API calls fail

**Common Causes:**
1. Backend Node.js process not running
2. Wrong port configuration
3. PM2 didn't restart properly
4. Backend crashed due to code error

**Debugging Steps:**
```bash
# 1. Check PM2 status (via SSH - read only!)
pm2 status

# 2. Check PM2 logs
pm2 logs [env]-backend --lines 100

# 3. Verify correct port in .env
# Development: PORT=3002
# Staging: PORT=3001  
# Production: PORT=3000

# 4. Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Solutions:**
- If PM2 process is stopped: Fix the code error and push again
- If port mismatch: Update `.env` file and push
- If PM2 didn't restart: The deployment script may have failed

---

### 3. Authentication Not Working

**Symptoms:**
- "Login with Google" returns 502 or 404
- OAuth redirect fails
- No redirect to Google

**Common Causes:**
1. Missing OAuth environment variables
2. Nginx not configured for `/auth` routes
3. Wrong redirect URLs in Google Console
4. Backend auth module not loaded

**Debugging:**
```bash
# Check if auth routes are registered
curl https://[environment].flippi.ai/auth/status

# Check nginx config has auth proxy
grep -n "location /auth" /etc/nginx/sites-enabled/[environment].flippi.ai
```

**Solutions:**
1. Verify in `.env`:
   ```
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   JWT_SECRET=xxx
   ```
2. Run OAuth fix script:
   ```bash
   ./scripts/fix-staging-oauth-verbose.sh
   ```
3. Check Google Console redirect URIs match environment

---

### 4. Frontend Shows "Index of dist/"

**Symptoms:**
- Instead of app, see directory listing
- Build artifacts missing
- Blank white page

**Cause:** Expo build failed during deployment

**Debugging:**
```bash
# Check GitHub Actions logs for build errors
gh run view [run-id] --log | grep -A 10 "expo export"

# Check if dist directory exists
ls -la /var/www/[environment].flippi.ai/mobile-app/dist/
```

**Solutions:**
1. Check for syntax errors in `App.js`
2. Ensure all imports are valid
3. Check GitHub Actions logs for specific error
4. Common fix: Missing dependency or syntax error

---

### 5. Old Code Still Running After Deploy

**Symptoms:**
- Changes don't appear after deployment
- Old bugs still present
- Features missing

**Causes:**
1. Git pull failed
2. PM2 didn't restart
3. Browser cache
4. Deployment failed but showed success

**Debugging:**
```bash
# Check current commit on server
cd /var/www/[environment].flippi.ai && git log -1

# Compare with your local
git log -1

# Check deployment time
pm2 show [env]-backend | grep "uptime"
```

**Solutions:**
1. Force refresh browser (Ctrl+Shift+R)
2. Check GitHub Actions completed successfully
3. Verify git commit matches on server
4. Check PM2 actually restarted

---

### 6. Legal Pages Return 404

**Symptoms:**
- /terms and /privacy return 404
- Legal footer links broken

**Cause:** Nginx not configured to serve static legal pages

**Solution:**
```bash
# Run post-deploy script
./scripts/post-deploy-legal-pages.sh [environment]

# Where environment is: development, staging, or production
```

---

### 7. Environment Variable Issues

**Symptoms:**
- 500 Internal Server Error
- "Cannot read property of undefined"
- API key errors

**Common Missing Variables:**
```bash
# Required for all environments
OPENAI_API_KEY=
PORT=           # 3000/3001/3002

# Required for auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=

# Required for feedback
FEEDBACK_DB_PATH=/tmp/flippi-feedback.db
```

**Debugging:**
```bash
# Check which env file is being used
pm2 show [env]-backend | grep "script"
```

---

### 8. GitHub Actions Failing

**Symptoms:**
- Red X on GitHub commit
- Deployment not triggered
- Workflow errors

**Common Causes:**
1. SSH key expired
2. Server disk full
3. NPM registry down
4. Syntax error in code

**Debugging:**
```bash
# View workflow runs
gh run list --limit=5

# View specific run details
gh run view [run-id] --log

# Re-run failed workflow
gh run rerun [run-id]
```

---

### 9. Console.log Statements in Production

**Issue:** Sensitive data exposed in logs

**Quick Fix:**
```bash
# Find all console.log statements
grep -r "console\.log" backend/ mobile-app/ --exclude-dir=node_modules

# Remove them and push fix
```

---

### 10. PM2 Process Keeps Crashing

**Symptoms:**
- PM2 shows "errored" status
- Constant restarts
- 502 errors intermittent

**Debugging:**
```bash
# Check error details
pm2 logs [env]-backend --err --lines 200

# Check PM2 process details
pm2 show [env]-backend
```

**Common Causes:**
1. Missing required environment variable
2. Port already in use
3. Memory limit exceeded
4. Uncaught exception in code

---

## Quick Reference - Environment Ports

| Environment | URL | Backend Port | PM2 Process |
|------------|-----|--------------|-------------|
| Development | blue.flippi.ai | 3002 | dev-backend |
| Staging | green.flippi.ai | 3001 | staging-backend |
| Production | app.flippi.ai | 3000 | prod-backend |

---

## Emergency Recovery Procedures

### If Production is Down:

1. **Don't Panic** - Follow the rollback procedure
2. **Check PM2 First:**
   ```bash
   pm2 status
   pm2 logs prod-backend --lines 100
   ```
3. **Quick Rollback:**
   ```bash
   git checkout master
   git revert HEAD
   git push origin master
   ```
4. **Monitor Recovery:**
   - Watch GitHub Actions
   - Check health endpoint
   - Monitor PM2 logs

### If Deployment is Stuck:

Sometimes GitHub Actions can hang. After 10 minutes:
1. Cancel the run in GitHub UI
2. Re-run the workflow
3. If still failing, check server disk space and connectivity

---

## Preventive Measures

1. **Always Test Locally First**
2. **Check GitHub Actions Logs**
3. **Monitor PM2 After Deploy**
4. **Never Skip Staging**
5. **Keep This Guide Updated**

---

Last Updated: 2025-08-02
Version: 1.0