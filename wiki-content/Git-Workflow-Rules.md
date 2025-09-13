# Git Workflow Rules

## 🚨 CRITICAL: DO NOT CREATE PULL REQUESTS BETWEEN BRANCHES

### The Golden Rule

**NEVER** create PRs from:
- develop → staging ❌
- staging → master ❌
- Any branch → another branch ❌

**ALWAYS** push directly to the target branch ✅

## 🔄 Correct Workflow

### 1. Development Flow
```bash
# Work in develop branch
git checkout develop
git add .
git commit -m "fix: description"
git push origin develop

# STOP HERE - GitHub Actions deploys to blue.flippi.ai
```

### 2. Staging Flow
```bash
# When ready for staging
git checkout staging
git merge develop
git push origin staging

# STOP HERE - GitHub Actions deploys to green.flippi.ai
```

### 3. Production Flow
```bash
# When ready for production
git checkout master
git merge staging
git push origin master

# STOP HERE - GitHub Actions deploys to app.flippi.ai
```

## 🚫 OAuth Workflow Restrictions

### CRITICAL: Cannot Modify Workflow Files

GitHub blocks OAuth Apps from modifying workflow files for security:

```
refusing to allow an OAuth App to create or update workflow 
.github/workflows/deploy-*.yml
```

### What This Means

**Never include** in commits:
- `.github/workflows/*` files
- Any workflow modifications
- GitHub Actions changes

**If accidentally included**:
```bash
# Remove from commit
git reset HEAD .github/workflows/
git commit --amend
```

## 📋 Deployment Rules

### Automatic Deployment

| Branch | Deploys To | URL |
|--------|------------|-----|
| develop | Blue (Dev) | blue.flippi.ai |
| staging | Green (Staging) | green.flippi.ai |
| master | Production | app.flippi.ai |

### No Manual Deployment
- ❌ Don't SSH to servers
- ❌ Don't run deploy scripts manually
- ❌ Don't restart PM2 manually
- ✅ Let GitHub Actions handle everything

## 🔐 SSH Access Protocol

### SSH is READ-ONLY for debugging

**Allowed**:
- `pm2 logs` - View logs
- `git log` - Check commits
- `git status` - Check state
- Reading files for debugging

**NOT Allowed**:
- Running git pull
- Restarting services
- Running npm install
- Making ANY changes

## 📝 Commit Guidelines

### Commit Message Format
```
type: description

Types:
- fix: Bug fixes
- feat: New features
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Test additions
- chore: Maintenance
```

### Examples
```bash
git commit -m "fix: resolve OAuth redirect issue"
git commit -m "feat: add image upload progress bar"
git commit -m "docs: update API documentation"
```

## 🎯 Branch Strategy

### Branch Purposes
- **master**: Production code only
- **staging**: Pre-production testing
- **develop**: Active development
- **feature/***: New features (optional)

### Feature Branch Workflow (Optional)
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work and commit
git add .
git commit -m "feat: implement new feature"

# Merge to develop
git checkout develop
git merge feature/new-feature
git push origin develop

# Delete feature branch
git branch -d feature/new-feature
```

## 🚨 Common Mistakes

### Mistake 1: Creating PRs
```bash
# WRONG ❌
gh pr create --base staging --head develop

# RIGHT ✅
git checkout staging
git merge develop
git push origin staging
```

### Mistake 2: Modifying on Server
```bash
# WRONG ❌
ssh server
cd /var/www/app
git pull
npm install

# RIGHT ✅
git push origin master
# Let GitHub Actions deploy
```

### Mistake 3: Force Pushing
```bash
# WRONG ❌
git push --force origin develop

# RIGHT ✅
# Resolve conflicts properly
git pull origin develop
# Fix conflicts
git push origin develop
```

## 🔄 Recovery Procedures

### If You Created a PR
1. Close the PR without merging
2. Use direct push instead

### If Deployment Failed
1. Check GitHub Actions logs
2. Fix issue in code
3. Push fix to branch
4. Let automation retry

### If You Modified Server
1. Document what was changed
2. Reset server to git state
3. Apply fix through git/deploy

## 📊 Git Commands Reference

### Daily Commands
```bash
# Check status
git status

# View recent commits
git log --oneline -10

# See what changed
git diff

# Update from remote
git pull origin develop
```

### Useful Aliases
```bash
# Add to ~/.gitconfig
[alias]
  st = status
  co = checkout
  br = branch
  cm = commit -m
  lg = log --oneline --graph
```

## 🎓 Best Practices

1. **Commit Often**: Small, focused commits
2. **Pull Before Push**: Avoid conflicts
3. **Test Locally**: Before pushing
4. **Watch Deployments**: Monitor GitHub Actions
5. **Document Changes**: Clear commit messages

## 📧 Help

For git workflow questions: teamflippi@gmail.com

[[Home]] | [[Development-Workflow]] | [[Deployment-Guide]]