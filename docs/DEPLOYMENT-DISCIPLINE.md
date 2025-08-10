# Deployment Discipline & Rollback Procedures

## Core Principle
**Staging is sacred.** It represents the exact code that will go to production. No exceptions.

## Standard Release Flow

```
develop (blue) → staging (green) → master (prod)
```

### Rules for Each Environment

#### Development (blue.flippi.ai)
- All new features land here first
- Can be unstable/experimental
- Merge freely from feature branches
- Test thoroughly before promoting

#### Staging (green.flippi.ai)
- **ONLY receives code via planned promotions**
- Must match exactly what was tested
- No direct commits or feature additions
- Bug fixes only if documented in release notes

#### Production (app.flippi.ai)
- Receives exact staging code after QA
- No direct deployments ever
- Rollback immediately if issues arise

## Deployment Checklist

Before promoting to staging:
```
□ All features tested in blue
□ Release notes updated
□ Known issues documented
□ Release taxonomy updated
□ No WIP or experimental code
□ Database migrations tested
```

## Rollback Procedures

### When to Rollback
- Environment becomes non-functional
- Untested code appears in environment
- Features not in release notes appear
- Critical bugs discovered not in known issues

### How to Rollback

1. **Find the last stable commit**:
   ```bash
   git log staging --oneline | head -20
   # Look for the release commit
   ```

2. **Reset staging to stable state**:
   ```bash
   git checkout staging
   git reset --hard <stable-commit-hash>
   git push origin staging --force
   ```

3. **Verify deployment**:
   - Check health endpoint
   - Test core functionality
   - Confirm release features work

### Example Rollback

Today's incident:
```bash
# Staging had release-004 + unwanted release-005 features
# Found stable release-004 commit: 215ed54
git checkout staging
git reset --hard 215ed54
git push origin staging --force
# Staging now matches tested release-004 exactly
```

## Personal Rules

Since I'm the only developer:

1. **No "quick fixes" to staging** - Everything through develop
2. **Document before deploying** - Update release notes first
3. **Test before promoting** - No assumptions about "simple" changes
4. **Rollback immediately** - Don't try to fix forward in staging
5. **Keep releases small** - Easier to test and rollback

## Common Mistakes to Avoid

❌ "I'll just add this one feature to staging"
❌ "It's a small fix, no need to test in blue"
❌ "I'll document it after deployment"
❌ "Let me fix it directly in staging"

✅ Always: develop → test → document → staging → test → production

## Emergency Contacts

Since it's just me:
- Take a break if frustrated
- Rollback first, investigate later
- Check docs before making changes
- Keep changelog updated

## Quick Reference Commands

```bash
# Check what's in each environment
git log develop -5 --oneline
git log staging -5 --oneline
git log master -5 --oneline

# See differences
git diff staging..develop --name-only
git diff master..staging --name-only

# Rollback staging
git checkout staging
git reset --hard <commit>
git push origin staging --force

# Rollback production (rare)
git checkout master
git reset --hard <commit>
git push origin master --force
```

Remember: **Discipline now saves debugging later.**