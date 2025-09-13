# Troubleshooting Guide

## 🚨 Common Issues

### Build Failures

#### Problem: GitHub Actions failing
```
Error: Process completed with exit code 1
```

**Solution:**
1. Check workflow logs in Actions tab
2. Verify npm dependencies are committed
3. Ensure branch protection rules allow deployment

---

### Deployment Issues

#### Problem: Changes not appearing on blue.flippi.ai
**Checklist:**
- [ ] Pushed to `develop` branch?
- [ ] GitHub Actions completed successfully?
- [ ] PM2 restarted? Check with `pm2 status`
- [ ] Browser cache cleared?

---

### Database Errors

#### Problem: SQLite locked
```
Error: SQLITE_BUSY: database is locked
```

**Solution:**
```bash
# On server (through deployment script)
pm2 restart flippi-backend-blue
```

---

## 🔍 Debugging Steps

### 1. Check Logs
```bash
# View recent commits
git log --oneline -10

# Check GitHub Actions
# Go to: https://github.com/johnjhusband/price-scanner-app/actions
```

### 2. Verify Deployment
```bash
# Check if file exists on server
curl https://blue.flippi.ai/bundle.js | grep "Building Blue"
```

### 3. Local Testing
```bash
cd /Users/flippi/Documents/FlippiMaster/price-scanner-app
npm install
npm run dev
```

---

## 📱 Frontend Issues

### Problem: White screen on load
**Causes:**
- JavaScript error in App.js
- Missing environment check
- Build process failed

**Fix:**
1. Check browser console for errors
2. Verify Platform.OS checks
3. Rebuild with `npm run build`

---

## 📞 Escalation

If issues persist after trying these solutions:
1. Check [[Common-Issues]] for known problems
2. Review [[Architecture]] for system understanding
3. Create GitHub issue with error logs

[[Home]] | [[Deployment-Guide]] | [[Common-Issues]]