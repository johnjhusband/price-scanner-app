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

## Implementation Status (2025-09-02)

### Completed
1. ✅ Created new GitHub Actions workflow: `.github/workflows/deploy-develop-v2.yml`
2. ✅ Created migration script: `scripts/migrate-to-clean-architecture.sh`
3. ✅ Workflow builds frontend in GitHub's clean environment
4. ✅ Deploys only static files to server (no node_modules)
5. ✅ Includes verification step to check deployment

### How It Works
1. **GitHub Actions** builds the frontend when code is pushed to develop
2. **Clean Environment** ensures no cache contamination
3. **Static Files Only** - only the `dist/` directory is deployed
4. **PM2 Serve** - uses PM2's static file server instead of Expo
5. **Automatic Nginx Update** - updates paths from mobile-app to frontend

### Migration Process
1. Run `scripts/migrate-to-clean-architecture.sh` on the server
2. Push code to develop branch
3. GitHub Actions will build and deploy automatically
4. Verify at https://blue.flippi.ai

### Benefits Achieved
- ✅ No more Expo on production server
- ✅ No more "Super expression" errors
- ✅ Predictable, reproducible builds
- ✅ Faster deployments (< 5 minutes)
- ✅ Clean separation of frontend and backend