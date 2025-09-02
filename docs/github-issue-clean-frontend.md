# P0: Implement Clean Frontend Architecture - Build in GitHub Actions, Deploy Static Files Only

## Problem
The current architecture builds Expo on the production server, which has proven fragile:
- Expo's aggressive caching causes contaminated builds
- Server builds are unpredictable and hard to debug
- Old account migration cache persists despite clearing attempts
- Bundle hash `454acd2934be93420f33a84462ce4be2` is stuck with inheritance errors

## Proposed Solution: Frontend as Pure Static Files

### Architecture Changes

**Current (Broken)**:
```
/var/www/blue.flippi.ai/
├── mobile-app/
│   ├── package.json
│   ├── node_modules/    ❌ Expo installed on server
│   ├── .expo/          ❌ Cache contamination
│   └── dist/           ❌ Built on server
```

**Proposed (Clean)**:
```
/var/www/blue.flippi.ai/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/    ✅ Backend deps only
└── frontend/            ✅ Renamed from mobile-app
    └── dist/           ✅ Static files only (no node_modules!)
```

### Implementation Plan

1. **New GitHub Actions Workflow** (`.github/workflows/deploy-develop-v2.yml`):
   - Build frontend in GitHub's clean environment
   - Transfer only built files to server
   - Server never runs npm install or expo commands

2. **Server Cleanup**:
   - Delete entire mobile-app directory with all Expo cruft
   - Create clean frontend/dist directory
   - Update PM2 to serve from new location

3. **Benefits**:
   - ✅ No Expo on server
   - ✅ No contaminated caches
   - ✅ Predictable, reproducible builds
   - ✅ Server just serves static files
   - ✅ Faster deployments

### Migration Steps

1. Create new workflow file
2. Test deployment to blue.flippi.ai
3. Clean up server directories
4. Update nginx paths from /mobile-app to /frontend
5. Remove old deployment workflow

### Success Criteria
- New bundle hash (not 454acd2934be93420f33a84462ce4be2)
- App loads without "Super expression" errors
- No node_modules in frontend directory on server
- Deployment takes < 5 minutes

### Notes
- This is a P0 priority fix as blue.flippi.ai is currently broken
- Maintains all existing code, only changes build/deploy process
- Similar approach can be applied to staging/production later

### Labels
- bug
- enhancement
- P0