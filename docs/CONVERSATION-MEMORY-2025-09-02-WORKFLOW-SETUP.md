# Conversation Memory - Blue.flippi.ai Server Deployment Session (Part 2)

**Date**: 2025-09-02
**Time**: Started ~03:24 AM, continuing through ~05:00 AM
**Context**: Continuing deployment of blue.flippi.ai to new server 137.184.24.201 after setup workflow success

## 1. Key Context from Previous Session

- Successfully ran setup-new-server workflow on new server 137.184.24.201
- GitHub Secrets configured: OPENAI_API_KEY, SESSION_SECRET
- Previous session identified line ending corruption issues from faulty .gitattributes
- Master and develop branches had diverged significantly

## 2. Critical Problem: Line Ending Corruption

### The Issue
- I created a faulty .gitattributes file that corrupted line endings across the entire repository
- 227+ files showing as modified with CRLF→LF conflicts
- Git operations (stash, branch switching) failing due to line ending mismatches
- Both local files AND GitHub repository contain CRLF when they should be LF

### Root Cause
- I added a .gitattributes file without understanding the consequences
- This forced line ending conversions that broke everything
- Removing .gitattributes didn't fix the damage - files were already corrupted

### The Solution Applied
1. Created proper .gitattributes file with correct line ending rules
2. Applied line ending normalization to develop branch only (to avoid touching production)
3. This created a massive commit touching 245 files to fix all line endings

## 3. Branch Divergence Issue

### Discovery
- Master had commits that develop didn't have (our infrastructure fixes)
- Develop had 139 commits that master didn't have (WIP features including FotoFlip)
- The ecosystems had diverged:
  - Master: Clean ecosystem.config.js without frontend process
  - Develop: Broken ecosystem.config.js with crashing frontend process + FotoFlip env vars

### The Merge Strategy
Instead of merging all of master→develop or develop→master, we did surgical fixes:

1. **ecosystem.config.js**: Merged properly by:
   - Keeping FotoFlip environment variables from develop
   - Removing broken frontend process from master
   - Result: Backend-only with full feature support

2. **backend/server.js**: Fixed uncaught exception handling
   - Changed from: Only exit in production mode
   - To: Always exit so PM2 can restart properly

## 4. Deployment Workflow Issues

### What Happened
1. Pushed fixes to develop branch (commit eb363a1)
2. Deploy-develop workflow triggered automatically
3. Workflow appeared to complete but actually failed:
   - Said "Deployment complete"
   - Then error: "ls: cannot access 'dist/_expo/static/js/web/'"
   - Then timeout after 10 minutes

### Investigation Results
- Server still on old commit 8f0ec9f instead of new eb363a1
- GitHub has the correct commit in develop branch
- Server's origin/develop was updated but working directory wasn't reset
- The deployment workflow's `git reset --hard origin/develop` failed silently

### Root Cause
The deployment partially failed - it fetched the latest code but didn't apply it to the working directory, leaving the old broken ecosystem.config.js in place.

## 5. Current State

### Server Status
- Backend running fine (health check passes)
- Frontend process still crashing (3491+ restarts)
- Old ecosystem.config.js still in place on server
- Server has fetched latest code but not applied it

### DNS Status
- User updated DNS for blue.flippi.ai → 137.184.24.201
- Propagation should be complete

### Code Status
- Develop branch has all fixes (line endings + ecosystem.config.js + server.js)
- Master branch unchanged (avoiding production impact)
- Server needs deployment to apply the fixes

## 6. Important Discoveries

### Production Auto-Deploy
- **CRITICAL**: Production auto-deploys on every push to master
- We've been accidentally deploying to production this whole time
- Production survived because line ending issues don't break runtime

### Workflow Constraints
- GitHub Actions workflows must be in default branch (master) to be visible
- OAuth Apps cannot modify workflow files (security restriction)
- This is why we had to work from master branch initially

### Line Ending Facts
- Line ending issues cause git workflow problems but not runtime problems
- The 3400+ frontend crashes are from broken PM2 config, not line endings
- Deployment workflows need proper error handling for git operations

## 7. TODO List

### High Priority
1. ✅ Create proper .gitattributes file to fix line endings
2. ✅ Apply line ending normalization to develop branch only
3. ✅ Merge ecosystem.config.js in develop - keep FotoFlip vars, remove frontend process
4. ✅ Merge server.js in develop - fix uncaught exception to always exit for PM2 restart
5. ✅ Commit and push develop branch fixes
6. ✅ Run deploy-develop workflow to update blue server
7. 🔄 **Fix deployment - ecosystem.config.js not updated on server**
8. ⏳ Verify blue.flippi.ai deployment is working properly
9. ✅ Update DNS for blue.flippi.ai to point to new server (user completed)
10. ⏳ Run SSL certificate workflow for blue.flippi.ai

### Next Immediate Steps
1. **Run deployment again** - The git fetch worked, just need to complete the reset
2. **Verify ecosystem.config.js** is updated on server (no frontend process)
3. **Confirm PM2 frontend crashes stop** after proper ecosystem.config.js applied
4. **Test blue.flippi.ai** is accessible via domain (after deployment completes)
5. **Run SSL certificate workflow** once deployment is verified

### Future Considerations
- Fix production auto-deploy workflow (should require manual approval)
- Consider fixing line endings in staging/master branches eventually
- Document the line ending fix process for future reference
- Add better error handling to deployment workflows

## 8. Key Commands for Verification

```bash
# Check deployment status
gh run list --workflow=deploy-develop.yml --limit=1

# Check PM2 status on server
ssh -i ~/.ssh/flippi_blue_key root@137.184.24.201 "pm2 status"

# Check what commit is deployed
ssh -i ~/.ssh/flippi_blue_key root@137.184.24.201 "cd /var/www/blue.flippi.ai && sudo -u www-data git log --oneline -1"

# Check ecosystem.config.js on server
ssh -i ~/.ssh/flippi_blue_key root@137.184.24.201 "cat /var/www/blue.flippi.ai/ecosystem.config.js"

# Check health endpoint
ssh -i ~/.ssh/flippi_blue_key root@137.184.24.201 "curl -s http://localhost:3002/health"
```

## 9. Critical Learnings

1. **Never modify .gitattributes without understanding impacts**
2. **Always verify deployment actually applied changes** - don't trust "complete" status
3. **Check actual files on server**, not just workflow logs
4. **Production auto-deploy is dangerous** - this needs to be fixed
5. **Line ending issues are git problems, not runtime problems**
6. **Deployment workflows need better error handling** for git operations

## 10. Current Blocker

The deployment workflow failed to apply our ecosystem.config.js fix. The server has fetched the latest code but the working directory wasn't updated. Need to run deployment again to complete the git reset and apply our fixes.