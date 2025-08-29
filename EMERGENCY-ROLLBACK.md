# 🚨 EMERGENCY ROLLBACK PROCEDURES - FotoFlip Feature

## QUICK ROLLBACK (< 30 seconds)

### Option 1: Disable Feature Flag (FASTEST)
```bash
# SSH to blue server
ssh blue.flippi.ai

# Disable feature immediately
pm2 set ENABLE_LUXE_PHOTO false
pm2 restart dev-backend

# Verify disabled
curl https://blue.flippi.ai/api/fotoflip/health
```
**Impact**: Feature hidden, no code changes needed

### Option 2: Git Revert (CLEANEST)
```bash
# From local machine
git log --oneline -5  # Find the commit hash
git revert <commit-hash>
git push origin develop

# Wait for auto-deploy (2-3 minutes)
```

## DETAILED ROLLBACK SCENARIOS

### 🔴 Scenario 1: Backend Crashes
**Symptoms**: 502 errors, backend not responding

**Immediate Fix**:
```bash
ssh blue.flippi.ai
pm2 logs dev-backend --lines 50  # Check error
pm2 restart dev-backend           # Try restart

# If still broken, disable feature
pm2 set ENABLE_LUXE_PHOTO false
pm2 restart dev-backend
```

### 🔴 Scenario 2: Frontend Shows Errors
**Symptoms**: Button visible but clicking shows errors

**Fix**:
1. Disable feature flag (Option 1 above)
2. Clear browser cache
3. Test basic functionality still works

### 🔴 Scenario 3: Performance Degradation
**Symptoms**: Site slow, high CPU usage

**Fix**:
```bash
ssh blue.flippi.ai
pm2 monit  # Check resource usage

# If FotoFlip causing issues
pm2 set ENABLE_LUXE_PHOTO false
pm2 restart dev-backend

# Check if Python process stuck
ps aux | grep python
# Kill if needed: kill -9 <PID>
```

### 🔴 Scenario 4: Breaking Other Features
**Symptoms**: Share buttons not working, analysis failing

**Fix**: Full code rollback
```bash
# Get commit before FotoFlip
git log --oneline --grep="FotoFlip"
git revert <fotoflip-commit>
git push origin develop
```

## AUTOMATED ROLLBACK SCRIPT

Save this script on the server for emergencies: