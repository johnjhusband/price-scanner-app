# FotoFlip Rollback Guide

## 🎯 Quick Decision Tree

```
Is the site completely down?
├─ YES → Go to "Critical Rollback" 
└─ NO → Is only FotoFlip broken?
    ├─ YES → Go to "Feature Disable"
    └─ NO → Go to "Partial Issues"
```

## 🔴 Critical Rollback (Site Down)

**Time to fix: 30 seconds**

```bash
# 1. SSH to server
ssh blue.flippi.ai

# 2. Disable feature and restart
pm2 set ENABLE_LUXE_PHOTO false && pm2 restart dev-backend

# 3. Verify site is back
curl https://blue.flippi.ai/health
```

## 🟡 Feature Disable (Only Luxe Photo Broken)

**Time to fix: 1 minute**

```bash
# Option A: Disable via PM2 (Recommended)
ssh blue.flippi.ai
pm2 set ENABLE_LUXE_PHOTO false
pm2 restart dev-backend

# Option B: Emergency script
ssh blue.flippi.ai
bash /var/www/blue.flippi.ai/scripts/emergency-fotoflip-rollback.sh
# Select option 1
```

## 🟢 Partial Issues (Performance/Errors)

### High CPU Usage
```bash
# Check what's consuming resources
ssh blue.flippi.ai
top -n 1 | head -20

# If Python processes stuck
ps aux | grep python | grep rembg
# Kill stuck processes
pkill -f rembg

# Restart backend
pm2 restart dev-backend
```

### Memory Issues
```bash
# Check memory
free -h

# Clear PM2 logs if too large
pm2 flush

# Restart with memory limit
pm2 delete dev-backend
pm2 start backend/server.js --name dev-backend --max-memory-restart 1G
```

## 📝 Code Rollback Options

### Option 1: Git Revert (Clean)
```bash
# From local machine
git log --oneline | grep -i fotoflip  # Find the commit
git revert <commit-hash> --no-edit
git push origin develop

# Wait 2-3 minutes for auto-deploy
```

### Option 2: Manual Removal
```bash
# If git revert fails, remove manually
git rm -r backend/services/fotoflip
git rm backend/routes/fotoflip.js

# Edit backend/server.js - remove these lines:
# const fotoflipRoutes = require('./routes/fotoflip');
# app.use('/api/fotoflip', fotoflipRoutes);

# Edit mobile-app/App.js - remove:
# - handleLuxePhoto function
# - Luxe Photo button code

git add .
git commit -m "Emergency: Remove FotoFlip feature"
git push origin develop
```

## 🔍 Diagnostics Commands

### Check What's Wrong
```bash
# 1. Backend logs
pm2 logs dev-backend --lines 100 | grep -i error

# 2. FotoFlip specific logs
pm2 logs dev-backend --lines 100 | grep -i fotoflip

# 3. System resources
pm2 monit

# 4. Test endpoints
curl https://blue.flippi.ai/health
curl https://blue.flippi.ai/api/fotoflip/health
```

### Common Error Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module 'sharp'" | Missing dependency | `cd /var/www/blue.flippi.ai/backend && npm install` |
| "ENOSPC: no space left" | Disk full | Clear temp files: `rm -rf /tmp/fotoflip/*` |
| "spawn python3 ENOENT" | Python not installed | Disable feature until Python installed |
| "ImgBB upload failed" | API key issue | Check IMGBB_API_KEY env var |

## 🛡️ Prevention Checklist

Before deploying:
- [ ] Run `bash scripts/pre-deployment-snapshot.sh`
- [ ] Note current commit hash
- [ ] Ensure rollback scripts are on server
- [ ] Test on local first if possible

After deploying:
- [ ] Run `bash scripts/monitor-fotoflip-health.sh` for first hour
- [ ] Check error logs every 15 minutes
- [ ] Monitor CPU/memory usage
- [ ] Test feature with small image first

## 📞 Escalation Path

1. **Level 1** (0-5 mins): Feature flag disable
2. **Level 2** (5-15 mins): Process cleanup & restart  
3. **Level 3** (15-30 mins): Git revert
4. **Level 4** (30+ mins): Manual code removal

## ✅ Verification After Rollback

```bash
# 1. Feature is disabled
curl -s https://blue.flippi.ai/api/fotoflip/health | grep -q "ENABLE_LUXE_PHOTO.*false" && echo "✅ Disabled" || echo "❌ Still enabled"

# 2. Main app works
curl -s https://blue.flippi.ai/health | grep -q "OK" && echo "✅ App healthy" || echo "❌ App issues"

# 3. No stuck processes
ps aux | grep python | grep -v grep || echo "✅ No Python processes"

# 4. Normal resource usage
pm2 status | grep "dev-backend.*online" && echo "✅ Backend running"
```

## 📋 Post-Mortem Template

If rollback was needed, document:

```markdown
Date: ___________
Issue: ___________
Detection time: ___________
Resolution time: ___________
Rollback method used: ___________

Root cause:
- [ ] Missing dependency
- [ ] Environment variable
- [ ] Python not installed
- [ ] Resource exhaustion
- [ ] Code bug
- [ ] Other: ___________

Lessons learned:
___________
```

---

Remember: **Fast rollback is better than perfect diagnosis**. Disable first, investigate later.