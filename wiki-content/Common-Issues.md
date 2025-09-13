# Common Issues

## 🐛 Frequently Encountered Problems

### 1. Git Diverged Branches

**Issue**: "Your branch and 'origin/develop' have diverged"

**Cause**: Local commits conflict with remote changes

**Solution**:
```bash
# Option 1: Rebase (recommended)
git pull --rebase origin develop

# Option 2: Reset to remote (loses local changes)
git fetch origin
git reset --hard origin/develop
```

---

### 2. Build Failing on Blue Environment

**Issue**: GitHub Actions shows red X

**Common Causes**:
- Missing dependencies in package.json
- Syntax error in JavaScript
- Environment variable not set

**Debug Steps**:
1. Click on failed action in GitHub
2. Check "Build and Deploy" step logs
3. Look for error messages
4. Fix locally and push again

---

### 3. Changes Not Visible After Deploy

**Issue**: Pushed code but blue.flippi.ai shows old version

**Checklist**:
- [ ] Did GitHub Actions complete? (green checkmark)
- [ ] Clear browser cache (Cmd+Shift+R)
- [ ] Check correct branch (`develop` for blue)
- [ ] Verify file was actually changed

**Verify Deployment**:
```bash
# Check latest commit on server
curl -s https://blue.flippi.ai/bundle.js | grep -i "your-change"
```

---

### 4. Database Lock Errors

**Issue**: "SQLITE_BUSY: database is locked"

**Cause**: Multiple processes accessing SQLite

**Fix**: Restart backend through PM2 (via deployment)

---

### 5. Platform.OS Not Working

**Issue**: Web-specific code showing on mobile

**Correct Implementation**:
```javascript
// Wrong
if (Platform.OS === 'web') {
  // This runs on both web and mobile
}

// Right
{Platform.OS === 'web' && (
  <WebOnlyComponent />
)}
```

---

### 6. Permission Denied Errors

**Issue**: Can't create or modify files

**Common Locations**:
- FlippiMaster is the correct working directory
- Don't use FlippiGitHub (old, has conflicts)
- Don't modify files in fotoflip

---

### 7. API Returning 404

**Issue**: API endpoints not found

**Check**:
- Backend running? (PM2 status)
- Correct port? (3002 for backend)
- Nginx configured properly?

---

### 8. React Native Web Build Fails

**Issue**: `npm run build:web` errors

**Common Fixes**:
```bash
# Clear cache
rm -rf node_modules/.cache
rm -rf mobile-app/dist

# Reinstall and rebuild
npm install
npm run build:web
```

---

## 🔥 Emergency Procedures

### If Blue Environment is Down

1. Check server status
2. Review recent deployments
3. Check GitHub Actions logs
4. Rollback if needed:
```bash
git revert HEAD
git push origin develop
```

### If Can't Push to GitHub

1. Check git remote: `git remote -v`
2. Verify credentials
3. Check branch protection rules
4. Ensure you're in FlippiMaster directory

---

## 💡 Prevention Tips

1. **Always test locally first**
2. **Check GitHub Actions after push**
3. **Use descriptive commit messages**
4. **Don't skip the deployment checklist**
5. **Follow [[Coding-Practices]]**

---

## 📞 Getting Help

If issue persists:
1. Check [[Troubleshooting]] for detailed steps
2. Review [[Architecture]] to understand system
3. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - What you tried

[[Home]] | [[Troubleshooting]] | [[Development-Workflow]]