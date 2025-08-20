# Deployment Failure Snapshot - 2025-08-20

## What Broke
- blue.flippi.ai stuck on loading screen with JavaScript error: "Super expression must either be null or a function"
- Expo continues generating the same bundle hash (454acd2934be93420f33a84462ce4be2) despite cache clearing
- Account migration from `/Users/tarahusband` to `/Users/flippi` left cached build artifacts

## What Was Tried (3 Attempts)
1. **Added polyfills and babel transforms** - Didn't fix root cause
2. **Enhanced cache clearing in deployment workflow** - Still generated same bundle
3. **Force version bump in App.js** - Bundle hash remained unchanged

## Why It Failed
- Expo's deterministic build process is using deeply cached data that our current cache clearing doesn't remove
- The bundle contains hardcoded paths from the old user account
- Standard cache clearing (rm -rf .expo ~/.expo node_modules/.cache) is insufficient

## Root Cause Analysis
- Account migration changed system paths from `/Users/tarahusband` to `/Users/flippi`
- I removed `npx expo start --clear` from deployment workflow (which was hanging)
- First successful deployment after SSH fix deployed the cached bundle with wrong paths
- Expo's build cache persists beyond what we're clearing

## Recommendation: Nuclear Rebuild Required

Based on CLAUDE.md lines 437-452 and DEPLOYMENT-TROUBLESHOOTING.md lines 475-500, perform a complete environment reset on the server:

```bash
# 1. Backup current state
cd /var/www/blue.flippi.ai && tar -czf ~/backup-blue-$(date +%F-%H%M).tgz .

# 2. Stop all processes
pm2 stop all

# 3. Complete cache removal
rm -rf node_modules .expo .cache dist web-build
rm -rf ~/.expo ~/.npm ~/.cache
rm -f package-lock.json
npm cache clean --force

# 4. Fresh install and build
npm install
npx expo export --platform web --output-dir dist --clear

# 5. Restart services
pm2 start all
```

## Additional Measures Needed
1. Add more aggressive cache clearing to deployment workflow
2. Consider adding a cache-bust parameter to force new builds
3. Document account migration impacts on Expo builds
4. Add bundle hash verification to deployment process

## Status
After 3 attempts as per protocol, escalating for manual intervention or approval for nuclear rebuild option.