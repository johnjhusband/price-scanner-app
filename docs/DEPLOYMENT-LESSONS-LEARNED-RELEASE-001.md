# Deployment Lessons Learned - Release 001

## Overview
This document captures key lessons learned from the release-001 deployment and subsequent deployments, including workflow limitations, git strategies, and deployment best practices.

## Key Lessons

### 1. GitHub OAuth App Workflow Restrictions
**Issue**: OAuth Apps cannot modify workflow files (.github/workflows/*)
**Impact**: Deployment workflow updates fail when included in commits
**Solution**: 
- Never include workflow files in commits via OAuth
- Update workflows manually through GitHub UI
- Separate infrastructure changes from code changes

### 2. Git Divergent Branches in Production
**Issue**: Production deployment failed with "Need to specify how to reconcile divergent branches"
**Root Cause**: Git pull default behavior changed; production had local commits
**Solution**:
```yaml
# Updated workflow to use:
git fetch origin master
git reset --hard origin/master
# Instead of git pull
```

### 3. Test Branch Deployment Strategy
**Use Case**: Testing risky changes in blue environment without affecting develop
**Process**:
1. Create feature branch: `git checkout -b test/feature-name`
2. Make changes and commit to test branch
3. Deploy to blue: `git push origin test/feature-name:develop --force`
4. Test in blue.flippi.ai
5. Revert if needed: 
   ```bash
   git checkout develop
   git pull origin develop
   git push origin develop --force
   ```

### 4. Cherry-Pick Deployment Strategy
**Use Case**: Deploying specific features without all develop changes
**Process**:
1. Identify commits to deploy: `git log --oneline develop`
2. Create deployment branch from target
3. Cherry-pick specific commits
4. Handle conflicts carefully
5. Force push to target branch

### 5. Force Push Considerations
**When Appropriate**:
- Test branch deployments to blue
- Emergency rollbacks
- Fixing divergent branches

**When to Avoid**:
- Shared branches with active development
- Production without team coordination

### 6. Deployment Pipeline Validation
**Always Verify**:
- GitHub Actions completed successfully
- Git log on server matches expected commit
- PM2 processes restarted
- Health endpoint responds correctly

### 7. Manual Intervention Dangers
**Issue**: Manual fixes on server mask deployment problems
**Impact**: Future deployments may fail unexpectedly
**Solution**: Always fix deployment issues in the workflow/repository

## Best Practices Established

1. **Branch Protection**:
   - Keep master branch protected
   - Use staging as pre-production validation
   - Test risky changes in blue via test branches

2. **Deployment Communication**:
   - Document deployment intent in commits
   - Notify team of force pushes
   - Track deployments in issues/PRs

3. **Rollback Preparedness**:
   - Know previous good commit SHA
   - Have rollback commands ready
   - Test rollback procedure regularly

4. **Workflow Updates**:
   - Test workflow changes in non-production first
   - Keep workflows simple and readable
   - Document any manual steps required

## Common Pitfalls to Avoid

1. Including .github/workflows/ in OAuth commits
2. Using `git pull` in deployment scripts without specifying strategy
3. Making manual fixes on production servers
4. Not checking for branch divergence before deployment
5. Deploying without verifying GitHub Actions logs

## Quick Reference Commands

### Check branch divergence:
```bash
git fetch origin
git status
git log HEAD..origin/master --oneline
```

### Safe deployment reset:
```bash
git fetch origin <branch>
git reset --hard origin/<branch>
```

### Test branch deployment:
```bash
# Deploy test branch to blue
git push origin test/branch-name:develop --force

# Revert blue to develop
git checkout develop
git pull origin develop
git push origin develop --force
```

## Incident Timeline - Release 001

1. **Initial Deploy**: Staging → Master merge attempted
2. **Issue**: Divergent branches error in production
3. **Failed Fix**: Attempted git pull with merge strategy
4. **Root Cause**: Local commits on production server
5. **Resolution**: Updated workflow to use fetch + reset
6. **Lesson**: Never rely on git pull default behavior

## Future Improvements

1. Add automated branch divergence detection
2. Create deployment health dashboard
3. Implement automated rollback triggers
4. Add deployment notification system
5. Create staging/production diff tool

---

Last Updated: 2025-01-08
Next Review: After next major deployment