# Build Strategies for Flippi.ai

## Overview

After resolving the "Super expression must either be null or a function" error in August 2025, Flippi.ai now supports two build strategies for deploying React Native Web applications.

## The Problem We Solved

### Root Cause
- **Issue**: Expo 50 compatibility with `expo-font@^13.3.2`
- **Symptom**: JavaScript inheritance error preventing app load
- **Impact**: Sites showed "Loading flippi.ai..." indefinitely

### Solution
Updated dependency in `mobile-app/package.json`:
```json
{
  "dependencies": {
    "expo-font": "~11.10.2"  // Was: "^13.3.2"
  }
}
```

The tilde (`~`) locks to patch versions only, preventing incompatible minor version updates.

## Build Strategy Options

### Strategy 1: Server-side Build (Current Default)

**Used by**:
- `deploy-develop.yml` → blue.flippi.ai
- `deploy-staging.yml` → green.flippi.ai  
- `deploy-production.yml` → app.flippi.ai

**How it works**:
```
GitHub → Server pulls code → Expo builds on server → PM2 serves
```

**Workflow**:
1. GitHub Actions SSHs to server
2. `git reset --hard origin/[branch]`
3. `npm install && npx expo export --platform web --output-dir dist`
4. `pm2 restart [services]`

**Directory structure**:
```
/var/www/[environment].flippi.ai/
├── mobile-app/
│   ├── node_modules/        # Expo installed
│   ├── dist/               # Built output
│   └── package.json
└── backend/
```

**Pros**:
✅ Simple workflow  
✅ Established and proven  
✅ All environments supported  

**Cons**:
❌ Build happens on production server  
❌ Potential for cache issues  
❌ Server needs build tools  

---

### Strategy 2: GitHub Actions Build (Alternative)

**Used by**:
- `deploy-develop-v2.yml` → blue.flippi.ai (experimental)

**How it works**:
```
GitHub builds → Transfers files → Server serves static files
```

**Workflow**:
1. GitHub Actions builds in clean Ubuntu environment
2. `npx expo export --platform web --output-dir dist --clear`
3. SCP transfers built files to server
4. PM2 serves static files only

**Directory structure**:
```
/var/www/blue.flippi.ai/
├── frontend/
│   └── dist/               # Static files only
└── backend/
    └── node_modules/       # Backend only
```

**Pros**:
✅ Clean build environment every time  
✅ No Expo on production server  
✅ Smaller server footprint  
✅ Eliminates cache contamination  

**Cons**:
❌ More complex workflow  
❌ File transfer dependency  
❌ Only implemented for development  

## Implementation Details

### Server-side Build Process

**Cache Clearing (Critical)**:
```bash
# Clean ALL possible caches
rm -rf node_modules .cache .expo dist web-build package-lock.json
rm -rf ~/.expo
npm cache clean --force

# Force Expo cache clear
npx expo start --clear --offline --no-dev --max-workers 1 &
EXPO_PID=$!
sleep 5
kill $EXPO_PID 2>/dev/null || true

# Build with clean cache
npx expo export --platform web --output-dir dist --clear
```

### GitHub Actions Build Process

**Build environment**:
```yaml
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
    with:
      node-version: '18'
  - run: |
      cd mobile-app
      npm install
      rm -rf .expo ~/.expo
      npx expo export --platform web --output-dir dist --clear
```

**File Transfer**:
```yaml
- uses: appleboy/scp-action@v0.1.5
  with:
    source: "mobile-app/dist/*"
    target: "/var/www/blue.flippi.ai/frontend/"
    strip_components: 2
```

## Troubleshooting

### Common Issues

**1. Same bundle hash after changes**
- **Cause**: Expo's deterministic builds + cached data
- **Solution**: Ensure all cache clearing steps run
- **Check**: New bundle should have different hash

**2. "Loading flippi.ai..." screen**
- **Cause**: JavaScript errors in bundle
- **Solution**: Check browser console for specific error
- **Common**: Inheritance errors from wrong expo-font version

**3. File transfer failures**
- **Cause**: SSH/SCP permissions or network issues
- **Solution**: Check GitHub Actions logs for specific error
- **Fallback**: Use server-side build strategy

### Verification Steps

**1. Verify bundle hash changed**:
```bash
# Server-side build
ls /var/www/[env].flippi.ai/mobile-app/dist/_expo/static/js/web/
# Should show: AppEntry-[NEW_HASH].js

# GitHub Actions build  
ls /var/www/blue.flippi.ai/frontend/_expo/static/js/web/
# Should show: AppEntry-[NEW_HASH].js
```

**2. Verify app loads**:
```bash
curl -s https://[environment].flippi.ai/ | grep -o "Loading flippi.ai"
# Should return nothing (no loading screen)
```

**3. Check PM2 status**:
```bash
pm2 list
# All services should show "online"
```

## Recommendations

### For Development (blue.flippi.ai)
- **Primary**: Use server-side build (`deploy-develop.yml`)
- **Alternative**: GitHub Actions build available for testing
- **Frequency**: Multiple times per day

### For Staging (green.flippi.ai)  
- **Strategy**: Server-side build (`deploy-staging.yml`)
- **Frequency**: Daily or before production releases
- **Purpose**: Final testing before production

### For Production (app.flippi.ai)
- **Strategy**: Server-side build (`deploy-production.yml`)
- **Frequency**: Weekly or milestone releases
- **Caution**: Always test on staging first

## Future Considerations

### Potential Improvements
1. **Extend GitHub Actions build** to staging and production
2. **Container-based builds** for even more isolation
3. **CDN deployment** for static assets
4. **Build caching** in GitHub Actions for faster builds

### Monitoring
- Track bundle generation times
- Monitor for inheritance errors
- Compare build reliability between strategies
- Measure deployment success rates

## Related Documentation
- [DEPLOYMENT-TROUBLESHOOTING.md](./DEPLOYMENT-TROUBLESHOOTING.md) - Issue resolution
- [TECHNICAL-GUIDE.md](./TECHNICAL-GUIDE.md) - Overall architecture
- [GitHub Issue #158](https://github.com/johnjhusband/price-scanner-app/issues/158) - Clean frontend architecture discussion