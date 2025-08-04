# Staging Release Plan - August 2025

## Release Overview
**Target Environment:** green.flippi.ai (staging)  
**Source Branch:** develop  
**Target Branch:** staging  
**Date:** August 2025  

## Features to be Released

### Completed on Blue (develop branch):
1. ✅ **OAuth Authentication Fixes** (Issue #84)
   - Fixed 502 Bad Gateway on Google Authentication
   - Authentication routes and middleware restored

2. ✅ **Stricter Authenticity Scoring** (Issue #81)
   - AI now defaults to low scores for luxury items without clear authentication
   - Post-processing for items with replica keywords

3. ✅ **Console.log Removal** (Issue #82)
   - All console.log statements removed from production code
   - Console.error retained for debugging

4. ✅ **Trademark Updates** (Issue #80)
   - Updated to "Boca Belle" throughout the application
   - Legal pages show correct trademark text

5. ✅ **Low Authenticity Pricing Fix** (Issue #85)
   - Items ≤30% authenticity get $5-$50 pricing
   - Platform recommendations show "Unknown"
   - Market insights show "⚠️ Unknown market research on this product. Upload a clearer image to retry."

6. ✅ **Visual Replica Detection** (Issue #86)
   - AI assumes luxury items might be fake by default
   - Must find proof of authenticity in images
   - No longer relies only on text keywords

7. ✅ **Environmental Impact Tags** (Issue #87)
   - Shows messages like "♻️ Saved 35 showers" based on item category
   - Auto-detects category (bags, apparel, shoes, kitchenware)
   - Displays in green container below results

8. ✅ **UI Updates**
   - Disclaimer text: "*ai makes mistakes. check important info" (moved to footer)
   - Footer trademark: "Flippi™ and Flippi.ai™ are trademarks of Boca Belle"
   - Legal pages accessible at /terms and /privacy
   - Contact and Mission links in login page footer

9. ✅ **Mission Page Implementation**
   - Mission modal accessible from login page
   - Framed Mission and Contact pages created
   - Backend routes added for /mission and /contact
   - All legal pages updated with brand guidelines

10. ✅ **Environmental Message Updates**
   - Comprehensive new environmental impact messages
   - Messages updated for all categories
   - Removed "Impact:" prefix per user preference

## Pre-Release Checklist

### Code Verification
- [ ] All features tested successfully on blue.flippi.ai
- [ ] No critical bugs reported in last 4 hours
- [ ] All GitHub issues marked as completed
- [ ] Code review completed for major changes

### Testing on Blue
- [ ] OAuth login/logout working
- [ ] Upload replica luxury item - verify low authenticity scoring
- [ ] Upload authentic item - verify normal scoring
- [ ] Check environmental tags display correctly
- [ ] Legal pages load with correct content
- [ ] Mobile responsive testing completed

## Release Steps

### 1. Pre-Deployment (Local Machine)
```bash
# Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# Check current status
git status
git log --oneline -5

# Switch to staging branch
git checkout staging
git pull origin staging

# Merge develop into staging
git merge develop

# If conflicts, resolve and commit
# git add .
# git commit -m "Merge develop into staging for August 2025 release"
```

### 2. Deploy to Staging
```bash
# Push to staging branch (triggers auto-deployment)
git push origin staging

# Monitor GitHub Actions
# Go to: https://github.com/johnjhusband/price-scanner-app/actions
# Watch "Deploy Staging" workflow
```

### 3. Post-Deployment Verification

#### Immediate Checks:
- [ ] Visit https://green.flippi.ai
- [ ] Check health endpoint: `curl https://green.flippi.ai/health`
- [ ] No console errors in browser
- [ ] Login with Google OAuth works

#### Feature Testing:
1. **Authenticity Scoring**
   - [ ] Upload luxury item image without text - should get low score if unclear
   - [ ] Upload with "DHGate" in description - should get 20% and $5-$50 pricing

2. **Environmental Tags**
   - [ ] Upload bag image - see environmental message
   - [ ] Upload clothing - see different environmental message
   - [ ] Verify random selection works

3. **UI Elements**
   - [ ] Footer shows "Boca Belle" trademark
   - [ ] Disclaimer shows "ai can make mistakes"
   - [ ] Legal pages accessible and show correct content

4. **Performance**
   - [ ] Image analysis completes < 5 seconds
   - [ ] Page load time < 3 seconds
   - [ ] Mobile experience smooth

### 4. Fix Any Deployment Issues

If nginx configuration needed:
```bash
ssh root@157.245.142.145
cd /var/www/green.flippi.ai
./scripts/post-deploy-nginx.sh
```

### 5. Monitoring Period
- Monitor for 2-4 hours before considering production release
- Check PM2 logs periodically
- Watch for any user-reported issues

## Rollback Plan

If critical issues found:
```bash
# On local machine
git checkout staging
git reset --hard HEAD~1  # Or to specific commit
git push --force origin staging

# On server (if needed)
ssh root@157.245.142.145
cd /var/www/green.flippi.ai
git reset --hard HEAD~1
pm2 restart staging-backend staging-frontend
```

## Success Criteria
- [ ] All features working as on blue
- [ ] No 500 errors in logs
- [ ] No PM2 process restarts
- [ ] Performance metrics maintained
- [ ] 2+ hours of stable operation

## Notes
- OAuth fix already on staging (#80) - verify it's still working
- This release includes significant AI behavior changes - monitor closely
- Environmental tags are new user-facing feature - watch for feedback

## Next Steps
After successful staging deployment and testing:
1. Document any issues found
2. Fix issues if any
3. Plan production release
4. Update release taxonomy documentation