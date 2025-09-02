# DevOps Release Checklist for Flippi.ai

## Overview
This document provides comprehensive checklists for deploying code to each environment. Follow these checklists to ensure smooth deployments and avoid common pitfalls.

## Critical Rules

### 🚨 NEVER MODIFY WORKFLOW FILES 🚨
- GitHub blocks OAuth Apps from modifying `.github/workflows/` files
- Any commit including workflow changes will be rejected
- Workflow updates must be done manually through GitHub UI
- This is a security feature that cannot be bypassed

### 🚨 NO MANUAL SERVER CHANGES 🚨
- ALL changes must go through Git and automated deployment
- SSH access is READ-ONLY for debugging
- Manual fixes mask problems and break automation

## Pre-Deployment Checklist (All Environments)

### 1. Code Quality Checks
- [ ] All console.log statements removed (except error handlers)
- [ ] No hardcoded API keys or secrets
- [ ] Code follows existing patterns and conventions
- [ ] All imports are used (no unused imports)
- [ ] Error handling is comprehensive

### 2. Local Testing
- [ ] Image upload from gallery works
- [ ] Camera capture works (web and mobile)
- [ ] Paste image (Ctrl/Cmd+V) works
- [ ] Drag and drop works
- [ ] Text description with image works
- [ ] Analysis results display correctly
- [ ] Error handling for large files works
- [ ] "Scan Another Item" flow works
- [ ] Authentication flow works (if applicable)

### 3. Git Status Check
```bash
git status  # Ensure you're on the correct branch
git diff    # Review all changes
git log -5  # Verify recent commits
```

### 4. Environment Variables Check
Verify `.env` file has all required variables:
- [ ] OPENAI_API_KEY is set
- [ ] PORT is correct for environment
- [ ] JWT_SECRET is set (if using auth)
- [ ] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (if using OAuth)

## Development Environment (blue.flippi.ai) Checklist

### Pre-Deploy
1. [ ] Currently on `develop` branch
2. [ ] All changes committed locally
3. [ ] No workflow files in staged changes
4. [ ] Run final test of features locally

### Deploy Process
```bash
# 1. Check what will be pushed
git status
git diff origin/develop

# 2. Push to develop branch
git push origin develop

# 3. Monitor deployment (takes ~30-60 seconds)
gh run list --limit=1
gh run watch  # Select the latest run
```

### Post-Deploy Verification
1. [ ] Check GitHub Actions completed successfully
2. [ ] Visit https://blue.flippi.ai
3. [ ] Test core functionality:
   - [ ] Homepage loads
   - [ ] Image analysis works
   - [ ] Authentication works (click "Login with Google")
   - [ ] Terms and Privacy pages load
4. [ ] Check backend health: https://blue.flippi.ai/health
5. [ ] Monitor for errors:
   ```bash
   # If you have SSH access (read-only!)
   pm2 logs dev-backend --lines 50
   ```

### Common Issues - Development
- **502 Bad Gateway**: Backend crashed or not running
  - Check PM2 status: `pm2 status`
  - Check logs: `pm2 logs dev-backend`
  - Verify PORT=3002 in `.env`
- **Old code running**: Deployment may have failed
  - Check GitHub Actions logs
  - Verify git commit on server matches
- **Frontend blank**: Build may have failed
  - Check for syntax errors in App.js
  - Check GitHub Actions build step

## Staging Environment (green.flippi.ai) Checklist

### Pre-Deploy
1. [ ] Development (blue) is stable and tested
2. [ ] All features work correctly on blue
3. [ ] No critical bugs in development
4. [ ] Currently on `develop` branch

### Deploy Process
```bash
# 1. Ensure develop is up to date
git pull origin develop

# 2. Switch to staging branch
git checkout staging

# 3. Merge develop into staging
git merge develop

# 4. Resolve any conflicts (if any)
# If conflicts exist, resolve them carefully

# 5. Push to staging
git push origin staging

# 6. Monitor deployment
gh run list --limit=1
gh run watch
```

### Post-Deploy Verification
1. [ ] Check GitHub Actions completed successfully
2. [ ] Visit https://green.flippi.ai
3. [ ] Test ALL functionality thoroughly:
   - [ ] Full user flow from start to finish
   - [ ] All image input methods
   - [ ] Authentication flow
   - [ ] Feedback submission
   - [ ] Legal pages
   - [ ] Error scenarios
4. [ ] Check backend health: https://green.flippi.ai/health
5. [ ] Run post-deploy scripts if needed:
   ```bash
   # For legal pages nginx fix
   ./scripts/post-deploy-legal-pages.sh staging
   ```

### Staging-Specific Checks
- [ ] OAuth redirect URLs are correct (should redirect to green.flippi.ai)
- [ ] No console.log statements in responses
- [ ] Performance is acceptable
- [ ] No 502 errors during testing

## Production Environment (app.flippi.ai) Checklist

### Pre-Deploy Requirements
1. [ ] Staging (green) has been stable for at least 24 hours
2. [ ] All features thoroughly tested on staging
3. [ ] No critical bugs reported
4. [ ] User has explicitly approved production deployment
5. [ ] Currently on `staging` branch

### Pre-Deploy Communication
- [ ] Notify team of upcoming deployment
- [ ] Check for any active users (if monitoring available)
- [ ] Have rollback plan ready

### Deploy Process
```bash
# 1. Ensure staging is up to date
git pull origin staging

# 2. Switch to master branch
git checkout master

# 3. Merge staging into master
git merge staging

# 4. Create a tag for this release
git tag -a v2.0.x -m "Release version 2.0.x - Brief description"

# 5. Push to master with tags
git push origin master --tags

# 6. Monitor deployment closely
gh run list --limit=1
gh run watch
```

### Post-Deploy Verification
1. [ ] Check GitHub Actions completed successfully
2. [ ] Visit https://app.flippi.ai
3. [ ] Complete FULL test suite:
   - [ ] New user registration flow
   - [ ] Returning user login
   - [ ] All image analysis features
   - [ ] Feedback submission
   - [ ] Legal pages
   - [ ] Mobile responsiveness
   - [ ] Cross-browser testing (Chrome, Safari, Firefox)
4. [ ] Check backend health: https://app.flippi.ai/health
5. [ ] Monitor logs for first 30 minutes:
   ```bash
   pm2 logs prod-backend --lines 100
   ```
6. [ ] Check for any user-reported issues

### Production-Specific Checks
- [ ] SSL certificates valid
- [ ] No development/debug code active
- [ ] Error messages are user-friendly
- [ ] Performance metrics acceptable
- [ ] Backup plan ready if rollback needed

## Rollback Procedures

### Quick Rollback (All Environments)
If issues are discovered post-deployment:

```bash
# 1. Switch to appropriate branch
git checkout [branch-name]  # develop/staging/master

# 2. Revert to previous commit
git revert HEAD
# OR reset to specific commit
git reset --hard [previous-commit-hash]

# 3. Force push (use with caution)
git push origin [branch-name] --force

# 4. Deployment will trigger automatically
```

### Emergency Fixes
For critical production issues:
1. [ ] Create hotfix branch from master
2. [ ] Make minimal fix
3. [ ] Test locally
4. [ ] Deploy directly to production
5. [ ] Backport fix to develop and staging

## Environment-Specific Details

### Development (blue.flippi.ai)
- **Branch**: develop
- **Backend Port**: 3002
- **PM2 Process**: dev-backend, dev-frontend
- **Auto-deploy**: On push to develop
- **Purpose**: Active development and testing

### Staging (green.flippi.ai)
- **Branch**: staging
- **Backend Port**: 3001
- **PM2 Process**: staging-backend, staging-frontend
- **Auto-deploy**: On push to staging
- **Purpose**: Pre-production testing

### Production (app.flippi.ai)
- **Branch**: master
- **Backend Port**: 3000
- **PM2 Process**: prod-backend, prod-frontend
- **Auto-deploy**: On push to master
- **Purpose**: Live user traffic

## Monitoring Commands

### GitHub Actions
```bash
# View recent workflow runs
gh run list --limit=10

# Watch specific run
gh run watch [run-id]

# View workflow run logs
gh run view [run-id] --log
```

### PM2 (via SSH - read only!)
```bash
# Check process status
pm2 status

# View logs
pm2 logs [process-name] --lines 50

# View process details
pm2 show [process-name]
```

### Server Health Checks
```bash
# Check nginx status
sudo systemctl status nginx

# Check disk space
df -h

# Check memory
free -m

# Check node processes
ps aux | grep node
```

## Best Practices

1. **Never skip environments**: Always deploy dev → staging → production
2. **Test after every deployment**: Don't assume it worked
3. **Monitor logs**: Watch for errors after deployment
4. **Document issues**: Update this checklist with new findings
5. **Communicate**: Keep team informed of deployment status

## Common Pitfalls to Avoid

1. **Including workflow files**: Will block your push
2. **Forgetting environment variables**: Causes 500 errors
3. **Not checking PM2 status**: Backend might not restart
4. **Skipping staging**: Never deploy directly to production
5. **Manual server fixes**: Breaks automation and masks issues
6. **Not testing auth flow**: OAuth is environment-specific
7. **Forgetting post-deploy scripts**: Legal pages need nginx config

## Success Metrics

A successful deployment has:
- ✅ GitHub Actions shows green checkmark
- ✅ Health endpoint returns 200 OK
- ✅ No 502 errors
- ✅ All features working as expected
- ✅ No errors in PM2 logs
- ✅ Response times under 3 seconds

## Emergency Contacts

Document your team's emergency contacts and escalation procedures here.

---

Last Updated: 2025-08-02
Version: 1.0