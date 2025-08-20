# Session Summary - August 20, 2025

## Initial State
- **User**: Continuing from previous session where blue.flippi.ai was broken
- **Context**: Account migration from "tarahusband" to "flippi" had broken GitHub deployments
- **Previous work**: Fixed SSH keys, but blue.flippi.ai showed "Super expression must either be null or a function" error

## Key Discovery
The app was working when the session started, but my changes broke it.

## Timeline of Actions

### 1. Initial Diagnosis
- Identified JavaScript error preventing React Native Web app from loading
- Error: "Super expression must either be null or a function" 
- Bundle hash stuck at: 454acd2934be93420f33a84462ce4be2

### 2. Failed Attempts (3 total as per protocol)
1. **Polyfill approach**:
   - Added polyfills.js to intercept inheritance errors
   - Modified babel.config.js with runtime transforms
   - Created index.web.js entry point
   - Result: Bundle still had same hash and error

2. **Enhanced cache clearing**:
   - Added ~/.expo clearing to deployment
   - Added `npx expo prebuild --clear`
   - Fixed missing expo-font dependency
   - Result: Still generating same bundle hash

3. **Force version bump**:
   - Changed build version in App.js
   - Deployment succeeded but same bundle generated
   - Result: Expo deterministically creating same output

### 3. Root Cause Analysis
- **Critical mistake**: Removed `npx expo start --clear` from deployment (it was hanging)
- This command was essential for clearing Expo's cache after account migration
- Cached bundles contain hardcoded paths: `/Users/tarahusband/...`
- New account uses: `/Users/flippi/...`
- Expo's deterministic build keeps using cached data with old paths

### 4. Documentation Review
Reviewed CLAUDE.md and found:
- Nuclear Rebuild option exists (lines 437-452)
- Maximum 3 attempts rule
- Must create snapshot document after failures

### 5. Current Status
- Created deployment failure snapshot: `/docs/snapshots/2025-08-20-deployment-failure.md`
- Identified Nuclear Rebuild as the solution
- blue.flippi.ai remains broken with loading screen

## Technical Details

### What is Expo?
- Framework for React Native applications
- Compiles React Native code to run in web browsers
- Creates bundle files like `AppEntry-[hash].js`
- Uses deterministic hashing (same input = same output)

### The Problem
```
GitHub (source) → Server clones → Expo builds → Uses LOCAL cache → Same broken bundle
```

### The Solution (Nuclear Rebuild)
```bash
cd /var/www/blue.flippi.ai && tar -czf ~/backup-blue-$(date +%F-%H%M).tgz .
pm2 stop all
rm -rf node_modules .expo .cache dist web-build
npm cache clean --force
npm i && npm run build
pm2 start all
```

## Key Lessons
1. Account migrations can leave deep caches with wrong paths
2. Expo's build cache persists beyond normal clearing
3. Removing cache-clearing commands during "fixes" can cause bigger problems
4. The code source of truth is GitHub - server should have no persistent state

## Next Steps
Need manual intervention to perform Nuclear Rebuild on server since:
- Deployment automation keeps using cached data
- 3 attempts have been made per protocol
- SSH changes are forbidden by CLAUDE.md rules

## Files Modified
- `.github/workflows/deploy-develop.yml` - Enhanced cache clearing
- `mobile-app/babel.config.js` - Reverted to original
- `mobile-app/App.js` - Version bump attempt
- Various polyfill files (later removed)
- Created multiple scripts and documentation files

## Current Blockers
1. Expo cache contamination requires nuclear option
2. Cannot SSH to fix per rules
3. Automated deployments keep generating same bundle
4. User cannot login to blue.flippi.ai