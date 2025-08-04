# Deployment Lessons Learned - Release-001

## Release Overview
- **Release**: release-001 (62 commits)
- **Date**: August 4, 2025
- **Features**: Environmental tagging, authenticity scoring, Mission modal, OAuth improvements

## Issues Encountered

### 1. Workflow File Modification Restrictions
**Problem**: GitHub OAuth API blocks modification of workflow files (`.github/workflows/`)
**Impact**: Could not update deployment workflows programmatically
**Root Cause**: Security restriction - OAuth Apps cannot modify workflow files
**Solution**: Had to modify workflow files directly in repository

### 2. Git Divergent Branches on Production
**Problem**: Production deployment failed with "fatal: Need to specify how to reconcile divergent branches"
**Impact**: Multiple failed deployments, production remained on old code
**Root Cause**: Production workflow used `git pull` which failed on divergent history
**Solution**: Updated workflow to use `git fetch` + `git reset --hard origin/master`

### 3. Nginx Duplicate Location Blocks
**Problem**: Nginx configuration had duplicate `/privacy` location blocks
**Impact**: Nginx reload failed during deployment
**Root Cause**: Multiple deployment scripts adding same location blocks
**Solution**: Added deduplication logic in post-deploy scripts

### 4. Force Push Complications
**Problem**: Force pushing to master created divergent history
**Impact**: Confused deployment process
**Root Cause**: Attempting to fix deployment by force pushing
**Solution**: Avoid force pushes; use proper git workflow

## Key Learnings

1. **Workflow Consistency**: All deployment workflows should use same git update pattern:
   ```bash
   git fetch origin [branch]
   git reset --hard origin/[branch]
   ```

2. **Never Force Push**: Creates more problems than it solves
3. **Test Deployment Workflows**: Changes to workflows should be tested in develop first
4. **Document OAuth Limitations**: Cannot modify workflow files via OAuth API

## Successful Resolution
- Updated production workflow to match develop/staging pattern
- All release-001 features successfully deployed to production
- Deployment now handles divergent branches gracefully