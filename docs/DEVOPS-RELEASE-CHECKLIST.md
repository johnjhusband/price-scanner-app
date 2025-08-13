# DevOps Release Checklist for Flippi.ai

## Overview
This document provides comprehensive checklists for deploying to all three environments of Flippi.ai. Each environment has specific requirements and verification steps.

## Environment Overview
- **Development (blue.flippi.ai)**: Branch: `develop`, Port: 3002/8082
- **Staging (green.flippi.ai)**: Branch: `staging`, Port: 3001/8081  
- **Production (app.flippi.ai)**: Branch: `master`, Port: 3000/8080

## Critical Warnings

### ⚠️ Workflow File Restrictions
- **NEVER** include changes to `.github/workflows/` files in OAuth commits
- GitHub blocks OAuth Apps from modifying workflow files
- Update workflows manually through GitHub UI only
- Separate infrastructure changes from code changes

### ⚠️ Branch Divergence Check
Before any deployment, check for divergent branches:
```bash
git fetch origin
git status
# If divergent, DO NOT use git pull
# Use: git reset --hard origin/<branch>
```

### ⚠️ Test Branch Deployments
For risky changes to blue environment:
1. Create test branch: `git checkout -b test/feature-name`
2. Deploy: `git push origin test/feature-name:develop --force`
3. Revert: `git push origin develop --force`
4. Only use for blue environment testing

## Pre-Deployment Checklist (All Environments)

### Code Quality
- [ ] All console.log statements removed (except critical errors)
- [ ] No hardcoded URLs or API keys
- [ ] Error handling implemented for all API endpoints
- [ ] Input validation on all user inputs
- [ ] No debug code or test data

### Frontend Checks
- [ ] Mobile responsiveness verified
- [ ] All images optimized and loading correctly
- [ ] No broken links or missing assets
- [ ] Cross-browser testing completed (Chrome, Safari, Firefox)
- [ ] Loading states implemented for all async operations

### Backend Checks
- [ ] All API endpoints tested with Postman/curl
- [ ] File upload limits enforced (10MB)
- [ ] Error responses return proper status codes
- [ ] Health endpoint returns correct version
- [ ] No sensitive data in responses
- [ ] Database migrations run successfully
- [ ] Feedback system endpoints responding
- [ ] Payment endpoints configured (if applicable)

### Security
- [ ] Environment variables properly set
- [ ] CORS configuration appropriate for environment
- [ ] No exposed credentials in code
- [ ] API rate limiting configured (if applicable)

## Development Deployment (blue.flippi.ai)

### Pre-Deployment
1. **Verify branch status**
   ```bash
   git status
   git branch
   # Should be on develop branch
   ```

2. **Check for uncommitted changes**
   ```bash
   git diff
   git diff --staged
   ```

3. **Pull latest changes**
   ```bash
   git pull origin develop
   ```

4. **Run local tests**
   ```bash
   # Backend
   cd backend && npm test
   
   # Frontend build test
   cd ../mobile-app && npx expo export --platform web --output-dir dist
   ```

### Deployment
1. **Push to develop branch**
   ```bash
   git push origin develop
   ```

2. **Monitor GitHub Actions**
   - Go to GitHub → Actions tab
   - Watch "Deploy Development" workflow
   - Check for any errors in the logs

3. **SSH Verification (if needed)**
   ```bash
   ssh root@157.245.142.145
   cd /var/www/blue.flippi.ai
   
   # Check deployment status
   git log -1 --oneline
   
   # Check PM2 processes
   pm2 show dev-backend
   pm2 show dev-frontend
   
   # Check logs
   pm2 logs dev-backend --lines 50
   ```

### Post-Deployment Verification
- [ ] Visit https://blue.flippi.ai
- [ ] Check browser console for errors
- [ ] Test health endpoint: `curl https://blue.flippi.ai/health`
- [ ] Upload test image
- [ ] Verify analysis results display
- [ ] Test "Scan Another Item" flow
- [ ] Check mobile view

### Common Issues & Fixes
1. **502 Bad Gateway**
   ```bash
   # SSH to server
   pm2 restart dev-backend
   pm2 logs dev-backend --lines 100
   ```

2. **Frontend shows "Index of dist/"**
   ```bash
   cd /var/www/blue.flippi.ai/mobile-app
   npx expo export --platform web --output-dir dist
   pm2 restart dev-frontend
   ```

3. **Missing environment variables**
   ```bash
   cd /var/www/blue.flippi.ai/backend
   nano .env
   # Add missing variables
   pm2 restart dev-backend
   ```

## Staging Deployment (green.flippi.ai)

### Pre-Deployment
1. **Ensure develop is stable**
   - Test thoroughly on blue.flippi.ai
   - No critical bugs for at least 2 hours

2. **Merge develop to staging**
   ```bash
   git checkout staging
   git pull origin staging
   git merge develop
   # Resolve any conflicts
   git push origin staging
   ```

### Deployment
1. **Monitor GitHub Actions**
   - Watch "Deploy Staging" workflow
   - Verify successful completion

2. **Run post-deployment scripts (if needed)**
   ```bash
   ssh root@157.245.142.145
   cd /var/www/green.flippi.ai
   
   # Fix nginx if needed
   ./scripts/post-deploy-nginx.sh green.flippi.ai
   
   # Fix legal pages if needed
   ./scripts/post-deploy-legal-pages.sh green.flippi.ai
   ```

### Post-Deployment Verification
- [ ] Full functionality test on green.flippi.ai
- [ ] Legal pages accessible (/terms, /privacy)
- [ ] Performance check (load time < 3 seconds)
- [ ] Mobile device testing
- [ ] Cross-browser testing
- [ ] Monitor for 2-4 hours before production

### Staging-Specific Tests
- [ ] User flow from landing to analysis
- [ ] Error handling (upload large file, wrong format)
- [ ] Network interruption handling
- [ ] Multiple concurrent users test

## Production Deployment (app.flippi.ai)

### Pre-Deployment
1. **Staging stability confirmation**
   - [ ] Staging stable for minimum 4 hours
   - [ ] No error logs in PM2
   - [ ] All features working correctly

2. **CRITICAL: Verify deployment workflow**
   ```bash
   # Ensure production workflow handles divergent branches properly
   # Must use: git fetch + git reset --hard (NOT git pull)
   grep -A5 "git fetch" .github/workflows/deploy-production.yml
   # If not found, update workflow BEFORE deployment
   ```

3. **Backup current production**
   ```bash
   ssh root@157.245.142.145
   cd /var/www/app.flippi.ai
   git tag -a backup-$(date +%Y%m%d-%H%M%S) -m "Pre-deployment backup"
   ```

3. **Announcement (if applicable)**
   - Notify users of potential brief downtime
   - Schedule deployment during low-traffic hours

### Deployment
1. **Merge staging to master**
   ```bash
   git checkout master
   git pull origin master
   git merge staging
   git push origin master
   ```

2. **Monitor deployment closely**
   - GitHub Actions workflow
   - Real-time logs: `pm2 logs prod-backend --lines 100`

3. **Immediate verification**
   ```bash
   # Health check
   curl https://app.flippi.ai/health
   
   # Monitor logs
   pm2 logs prod-backend --lines 50
   pm2 logs prod-frontend --lines 50
   ```

### Post-Deployment Verification
- [ ] Complete user journey test
- [ ] Performance metrics (response time, load time)
- [ ] Error rate monitoring
- [ ] Server resource usage check
- [ ] Analytics verification

### Production Monitoring (First 24 Hours)
1. **Every hour for first 4 hours**
   - Check error logs
   - Monitor response times
   - Verify no 500 errors

2. **After 4 hours**
   - Review user feedback
   - Check server metrics
   - Analyze any error patterns

## Rollback Procedures

### Quick Rollback (All Environments)
```bash
# Example for development
cd /var/www/blue.flippi.ai
git reset --hard HEAD~1
pm2 restart dev-backend dev-frontend

# For staging/production, use the backup tag
git reset --hard backup-[timestamp]
```

### Full Rollback Process
1. **Identify the issue**
   - Check PM2 logs
   - Review nginx error logs
   - Identify failing component

2. **Revert code**
   ```bash
   # On GitHub
   git revert [commit-hash]
   git push origin [branch]
   
   # Or force reset
   git reset --hard [known-good-commit]
   git push --force origin [branch]
   ```

3. **Verify rollback**
   - Test all critical functions
   - Monitor for recurring issues

## Critical Debugging Commands

### PM2 Process Management
```bash
# List all processes
pm2 list

# Detailed process info
pm2 show [process-name]

# Real-time monitoring
pm2 monit

# Restart with updated env
pm2 restart [process-name] --update-env

# Emergency reset
pm2 delete all
pm2 resurrect
```

### Nginx Debugging
```bash
# Test configuration
nginx -t

# View error logs
tail -f /var/log/nginx/error.log

# Reload safely
nginx -s reload

# Emergency restart
systemctl restart nginx
```

### Git Troubleshooting
```bash
# Fix diverged branches (COMMON ISSUE)
git fetch origin
git reset --hard origin/[branch]

# Clean working directory
git clean -fd
git reset --hard HEAD

# View deployment history
git log --oneline -10
```

### Common Deployment Issues (Release-001 Lessons)
1. **Workflow File Restrictions**
   - Cannot modify .github/workflows/ via OAuth API
   - Must edit workflow files directly in repository

2. **Git Pull Failures**
   - Never use `git pull` in deployment scripts
   - Always use `git fetch` + `git reset --hard origin/[branch]`
   - Prevents "divergent branches" errors

3. **Nginx Duplicate Locations**
   - Check for duplicate location blocks before deployment
   - Run nginx -t to verify configuration

## Environment Variable Reference

### Development (.env)
```
PORT=3002
NODE_ENV=development
OPENAI_API_KEY=sk-...
FEEDBACK_DB_PATH=/var/www/blue.flippi.ai/data/feedback.db
# Payment (when ready)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Staging (.env)
```
PORT=3001
NODE_ENV=staging
OPENAI_API_KEY=sk-...
FEEDBACK_DB_PATH=/var/www/green.flippi.ai/data/feedback.db
# Payment (when ready)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production (.env)
```
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-...
FEEDBACK_DB_PATH=/var/www/app.flippi.ai/data/feedback.db
# Payment (when ready)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Success Metrics

### Deployment Success Indicators
- [ ] No 500 errors in first hour
- [ ] Response time < 2 seconds
- [ ] All health checks passing
- [ ] No PM2 restarts due to crashes
- [ ] Frontend loads without console errors

### User Experience Metrics
- [ ] Image analysis completes in < 5 seconds
- [ ] Mobile experience smooth
- [ ] All UI elements interactive
- [ ] Error messages user-friendly

## Emergency Contacts & Resources

### Server Access
- IP: 157.245.142.145
- User: root
- Auth: SSH key

### Quick Commands
```bash
# Full system check
for env in app green blue; do echo "=== $env ==="; curl -s https://$env.flippi.ai/health | jq '.'; done

# Process status
pm2 list

# Disk space
df -h

# Memory usage
free -m
```

### Log Locations
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## Notes

1. **Always test in development first** - Never skip environments
2. **Monitor after deployment** - First hour is critical
3. **Document any issues** - Update this checklist with new findings
4. **Backup before major changes** - Use git tags
5. **Communicate deployment status** - Keep team informed

### Feedback System Setup (New Deployments)
1. **Set FEEDBACK_DB_PATH** to a persistent directory (not /tmp)
2. **Create data directory** with write permissions: `mkdir -p /var/www/[environment]/data`
3. **Database will auto-create** on first run with all necessary tables
4. **Test feedback submission** after deployment to verify database connectivity
5. **Generate initial weekly report** to verify reporting functionality

### Payment System Setup (Future)
1. **Configure Stripe keys** in environment variables
2. **Set up webhook endpoints** in Stripe dashboard
3. **Test payment flows** in test mode before enabling
4. **Monitor first transactions** closely

Remember: A successful deployment is one where users don't notice anything changed except improvements!