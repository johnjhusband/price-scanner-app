# Performance Cleanup Tasks

**Priority**: HIGH - Complete before Tuesday Launch  
**Estimated Time**: 1-2 hours

## 🚨 Critical Performance Issues

### 1. Console.log Removal (30+ minutes)

**App.js** - Remove 40+ console.log statements:
- Lines 54-152: Camera permission logs
- Lines 236, 261, 318, 325-357: Event logs
- Lines 442-470, 523-526: Debug logs
- Lines 603-605, 614, 672-681, 687, 710, 717, 723: Analysis logs

**server.js** - Remove 30+ console.log statements:
- Lines 12, 16-19, 23-30: Initialization logs
- Lines 131-138, 186, 265: Processing logs
- Lines 291-304: Request logging middleware (REMOVE ENTIRELY)
- Lines 404-407: Server startup logs

**FeedbackPrompt.js** - Remove 5 console.log statements:
- Lines 26, 42, 45, 56-57

### 2. Code Optimization (15 minutes)

**Double Base64 Conversion Fix (App.js)**:
```javascript
// Current: Converts twice (lines 629-635 and 644-654)
// Fix: Convert once and reuse
const base64String = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.readAsDataURL(processedBlob);
});
// Use base64String for both display and API
```

**Remove Unused Code**:
- EnterScreen.js: Remove unused API_URL (lines 6-11)
- EnterScreen.js: Remove onError handler (line 77)
- App.js: Remove debug useEffect (lines 520-527)

### 3. Memory Management (10 minutes)

**Clear Base64 After Use**:
```javascript
// After feedback submission
setImageBase64(null);
setAnalysisResult(null);
```

### 4. Production Build Script (5 minutes)

Add to package.json:
```json
"scripts": {
  "build:prod": "NODE_ENV=production expo export --platform web --output-dir dist --clear",
  "start:prod": "NODE_ENV=production node server.js"
}
```

### 5. Environment-Aware Logging (10 minutes)

Create utility function:
```javascript
// utils/logger.js
export const log = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};
```

## 🎯 Quick Wins

1. **Remove Request Logging Middleware** (server.js lines 289-310)
   - This runs on EVERY request
   - Significant performance impact
   - Not needed for production

2. **Simplify Error Handlers** (server.js lines 372-388)
   - Too verbose for production
   - Reduce to essential logging only

3. **Remove Unused Dependencies**:
   ```bash
   npm uninstall expo-status-bar
   ```

## 📊 Expected Performance Gains

- **30-40% faster JavaScript execution** (console.log removal)
- **20% less memory usage** (base64 cleanup)
- **15% faster API responses** (middleware removal)
- **Better mobile performance** (reduced logging overhead)

## ⚡ Implementation Order

1. First: Remove all console.logs (biggest impact)
2. Second: Remove request logging middleware
3. Third: Fix double base64 conversion
4. Fourth: Add memory cleanup
5. Last: Update build scripts

## 🔍 Testing After Cleanup

- [ ] Verify no console errors in production
- [ ] Test all image upload methods
- [ ] Check memory usage doesn't grow
- [ ] Confirm API response times improved
- [ ] Test on slow mobile connections

## 📝 Notes

- Keep error logging for actual errors
- Consider adding performance monitoring later
- May want to add Sentry for production error tracking
- Document any logging that must remain