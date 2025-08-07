# Deployment Troubleshooting Guide

## 🚨 Most Common Issue: Legal Pages Not Working

### Problem
Legal pages (/terms, /privacy, /mission, /contact) show "Loading flippi.ai..." or the React app instead of the actual legal content.

### Cause
Missing SSL configuration files prevent nginx from loading the site configuration:
- `/etc/letsencrypt/options-ssl-nginx.conf`
- `/etc/letsencrypt/ssl-dhparams.pem`

### Quick Fix
Run the comprehensive SSL fix script (already in deployment workflows):
```bash
cd /var/www/[domain] && bash scripts/fix-nginx-ssl-comprehensive.sh
```

### Diagnosis Steps
1. Check nginx configuration test:
   ```bash
   sudo nginx -t
   # Look for: "No such file or directory" errors
   ```

2. Verify active configuration:
   ```bash
   nginx -T | grep "location = /terms"
   # If empty, config isn't loaded
   ```

3. Test the actual response:
   ```bash
   curl https://[domain]/terms
   # If you see React app HTML, nginx is using default config
   ```

### Why This Happens
- Let's Encrypt creates SSL certificates but not always the supplementary files
- Without these files, nginx can't load the site config
- Nginx silently falls back to default behavior (serving everything as static files)
- The main site works but specific routes fail

### Prevention
The fix script runs automatically in all deployments, but always verify legal pages after deploy.

---

## Overview
This guide documents common deployment issues encountered with Flippi.ai and their solutions, based on real deployment experiences. Use this when deployments fail or services don't work as expected after deployment.

## Quick Diagnosis Flowchart

```
Deployment Failed?
├── GitHub Actions Failed?
│   └── Check workflow logs → Fix code/config → Retry
├── Site Shows 502 Error?
│   └── Backend not running → Check PM2 → Restart service
├── Site Shows "Index of dist/"?
│   └── Frontend build failed → Rebuild manually → Restart PM2
└── Features Not Working?
    └── Check env variables → Verify nginx config → Check logs
```

## Common Issues & Solutions

### 1. Frontend Shows "Index of dist/" Instead of App

**Symptoms:**
- Browser shows directory listing
- No Flippi app interface
- URL shows file structure

**Root Cause:**
- Expo build failed during deployment
- PM2 serving wrong directory
- Missing dist folder

**Solution:**
```bash
# SSH to server
ssh root@157.245.142.145
cd /var/www/[environment].flippi.ai/mobile-app

# Check if dist exists
ls -la | grep dist

# If missing, build manually
npx expo export --platform web --output-dir dist

# If build fails, check for errors
npm install  # Ensure dependencies installed
npx expo export --platform web --output-dir dist

# Restart frontend
pm2 restart [env]-frontend

# Verify PM2 is serving correct directory
pm2 describe [env]-frontend | grep "exec cwd"
# Should show: /var/www/[environment].flippi.ai/mobile-app/dist
```

**Prevention:**
- Add build verification to deployment workflow
- Check for syntax errors before pushing

### 2. Backend Returns 502 Bad Gateway

**Symptoms:**
- API calls fail
- Health check returns 502
- Site loads but can't analyze images

**Root Cause:**
- Node process crashed
- Missing environment variables
- Port conflicts

**Solution:**
```bash
# Check if backend is running
pm2 show [env]-backend

# View error logs
pm2 logs [env]-backend --lines 100

# Common fixes:
# 1. Missing env variables
cd /var/www/[environment].flippi.ai/backend
cat .env  # Verify OPENAI_API_KEY exists

# 2. Port mismatch
# Ensure .env PORT matches PM2 config:
# dev: 3002, staging: 3001, prod: 3000

# 3. Restart with updated env
pm2 restart [env]-backend --update-env

# 4. If process keeps crashing
pm2 delete [env]-backend
pm2 start ecosystem.config.js --only [env]-backend
```

### 3. Deployment Succeeds but Old Code Still Running

**Symptoms:**
- GitHub Actions shows success
- Changes not visible on site
- Git log shows old commits

**Root Cause:**
- Git pull failed due to local changes
- PM2 cached old code
- Nginx serving cached responses

**Solution:**
```bash
# Force update to latest code
cd /var/www/[environment].flippi.ai
git fetch origin [branch]
git reset --hard origin/[branch]

# Rebuild everything
cd backend && npm install --production
cd ../mobile-app && npm install && npx expo export --platform web --output-dir dist

# Hard restart PM2
pm2 delete [env]-backend [env]-frontend
pm2 resurrect

# Clear nginx cache
nginx -s reload
```

### 4. Legal Pages Return 404

**Symptoms:**
- /terms and /privacy return 404
- Terms & Privacy links broken
- OAuth redirects may fail

**Root Cause:**
- Nginx configuration missing routes
- Legal page files not in correct location
- Post-deployment script didn't run

**Solution:**
```bash
# Run the post-deployment script
cd /var/www/[environment].flippi.ai
./scripts/post-deploy-legal-pages.sh [environment].flippi.ai

# If script doesn't exist
cd /var/www/[environment].flippi.ai/backend
./scripts/post-deploy-legal-pages.sh [environment].flippi.ai

# Manual fix if needed
# 1. Verify files exist
ls -la mobile-app/terms.html mobile-app/privacy.html

# 2. Check nginx config
cat /etc/nginx/sites-available/[environment].flippi.ai | grep -A5 "location = /terms"

# 3. If missing, add manually (see nginx templates)
```

### 5. GitHub Actions Deployment Hangs

**Symptoms:**
- Workflow runs forever
- No output in logs
- Previous deployments worked

**Root Cause:**
- SSH connection issues
- NPM install hanging
- Git conflicts on server

**Solution:**
```bash
# 1. Cancel workflow in GitHub

# 2. SSH manually and check
ssh root@157.245.142.145
ps aux | grep npm  # Check for stuck processes
ps aux | grep git

# 3. Kill stuck processes
killall npm
killall git

# 4. Clean and retry
cd /var/www/[environment].flippi.ai
git reset --hard HEAD
git clean -fd
npm cache clean --force

# 5. Retry deployment
```

### 6. Environment Variables Not Loading

**Symptoms:**
- OpenAI API errors
- Wrong ports being used
- Features not working

**Root Cause:**
- .env file missing or corrupted
- PM2 not reading updated env
- Wrong NODE_ENV setting

**Solution:**
```bash
# 1. Verify .env exists and is correct
cd /var/www/[environment].flippi.ai/backend
cat .env

# 2. Create if missing
cat > .env << EOF
PORT=[appropriate port]
NODE_ENV=[environment]
OPENAI_API_KEY=sk-...
EOF

# 3. Restart with env update
pm2 restart [env]-backend --update-env

# 4. Verify env loaded
pm2 env [env]-backend | grep PORT
```

## Deployment Workflow Issues

### GitHub Actions Can't Connect

**Error:** `ssh: connect to host 157.245.142.145 port 22: Connection refused`

**Fix:**
1. Check if SSH service is running on server
2. Verify SSH_PRIVATE_KEY secret in GitHub
3. Check firewall rules

### NPM Install Fails

**Error:** `npm ERR! code ENOSPC`

**Fix:**
```bash
# Check disk space
df -h

# Clean npm cache
npm cache clean --force

# Remove node_modules and retry
rm -rf node_modules package-lock.json
npm install
```

### Expo Build Errors

**Common errors and fixes:**

1. **"Cannot find module"**
   ```bash
   rm -rf node_modules
   npm install
   npx expo install
   ```

2. **"JavaScript heap out of memory"**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npx expo export --platform web --output-dir dist
   ```

3. **Build succeeds but app broken**
   - Check for syntax errors in App.js
   - Verify all imports are correct
   - Test build locally first

## PM2 Specific Issues

### Process Keeps Restarting

**Check restart count:**
```bash
pm2 describe [env]-backend | grep restart
```

**Common causes:**
1. Memory leaks - increase max memory
2. Uncaught exceptions - check logs
3. Port already in use - verify ports

**Fix:**
```bash
# Increase memory limit
pm2 delete [env]-backend
pm2 start ecosystem.config.js --only [env]-backend --max-memory-restart 1G
```

### PM2 Shows Online but Service Not Working

```bash
# Full restart
pm2 delete all
pm2 resurrect
pm2 save

# Verify processes
pm2 list
pm2 show [process-name]
```

## Nginx Issues

### Changes Not Reflected

1. **Test configuration:**
   ```bash
   nginx -t
   ```

2. **Reload (safe):**
   ```bash
   nginx -s reload
   ```

3. **Hard restart (last resort):**
   ```bash
   systemctl restart nginx
   ```

### SSL Certificate Issues

```bash
# Renew certificates
certbot renew

# Force renewal
certbot renew --force-renewal

# Restart nginx after renewal
nginx -s reload
```

## Git Branch Issues

### Divergent Branches Error

**Symptoms:**
- Deployment fails with "fatal: Need to specify how to reconcile divergent branches"
- Git pull fails during deployment
- Local and remote branches have different commits

**Root Cause:**
- Server has local commits not in remote
- Someone made manual changes on server
- Git configuration changed default behavior

**Solution:**
```bash
# In deployment workflow, replace git pull with:
git fetch origin <branch>
git reset --hard origin/<branch>
```

**Manual fix on server:**
```bash
cd /var/www/[environment].flippi.ai
git fetch origin
git reset --hard origin/[branch]
```

### Test Branch Deployment Strategy

**Use Case:** Testing risky changes without affecting main develop branch

**Deploy test branch to blue:**
```bash
# 1. Create test branch locally
git checkout -b test/feature-name
git add .
git commit -m "Test changes for feature"

# 2. Push to remote
git push origin test/feature-name

# 3. Deploy to blue by overwriting develop
git push origin test/feature-name:develop --force

# Blue.flippi.ai now runs test branch code
```

**Revert blue to normal develop:**
```bash
# 1. Ensure local develop is up to date
git checkout develop
git pull origin develop

# 2. Force push to restore
git push origin develop --force

# Blue.flippi.ai now back to develop branch
```

**Important Notes:**
- Only use for blue environment
- Always communicate with team before force pushing
- Document what test branch contains
- Test thoroughly before promoting to staging

## Recovery Procedures

### Emergency Rollback

```bash
# 1. Stop current deployment
cd /var/www/[environment].flippi.ai

# 2. Find last working commit
git log --oneline -10

# 3. Reset to that commit
git reset --hard [commit-hash]

# 4. Restart services
pm2 restart [env]-backend [env]-frontend
nginx -s reload
```

### Complete Environment Reset

```bash
# WARNING: This wipes everything
cd /var/www/[environment].flippi.ai

# Backup current state
tar -czf ~/backup-[env]-$(date +%Y%m%d).tar.gz .

# Full reset
git clean -fdx
git reset --hard origin/[branch]

# Reinstall everything
cd backend && npm install --production
cd ../mobile-app && npm install
npx expo export --platform web --output-dir dist

# Recreate .env
cd ../backend
nano .env  # Add required variables

# Restart PM2
pm2 delete [env]-backend [env]-frontend
pm2 start ecosystem.config.js --only "[env]-backend [env]-frontend"
```

## Monitoring & Verification

### Quick Health Check Script

```bash
#!/bin/bash
# Save as check-deployment.sh

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: ./check-deployment.sh [app|green|blue]"
  exit 1
fi

echo "=== Checking $ENV.flippi.ai ==="

# Health endpoint
echo -n "Health check: "
curl -s https://$ENV.flippi.ai/health | jq -r '.status' || echo "FAILED"

# Backend process
echo -n "Backend status: "
pm2 describe ${ENV}-backend | grep status | awk '{print $4}'

# Frontend process
echo -n "Frontend status: "
pm2 describe ${ENV}-frontend | grep status | awk '{print $4}'

# Recent logs
echo -e "\nRecent errors:"
pm2 logs ${ENV}-backend --err --lines 5 --nostream
```

### Deployment Success Criteria

Before marking deployment successful, verify:

1. **All services running:**
   ```bash
   pm2 list  # All show "online"
   ```

2. **No errors in logs:**
   ```bash
   pm2 logs --lines 50  # No errors in last 50 lines
   ```

3. **Features working:**
   - Health check returns 200
   - Image upload works
   - Analysis completes
   - UI loads properly

4. **Performance acceptable:**
   - Page load < 3 seconds
   - API response < 2 seconds
   - No memory leaks

## Prevention Best Practices

1. **Always test locally first:**
   ```bash
   npm test
   npx expo export --platform web
   ```

2. **Check syntax before pushing:**
   ```bash
   node -c backend/server.js
   npx eslint mobile-app/App.js
   ```

3. **Monitor after deployment:**
   - Watch logs for 10 minutes
   - Test all critical features
   - Check error rates

4. **Document issues:**
   - Add new problems to this guide
   - Update deployment workflows
   - Share with team

Remember: Most deployment issues are caused by:
- Missing environment variables
- Syntax errors in code
- Git conflicts on server
- PM2 configuration mismatches

Always check these first!