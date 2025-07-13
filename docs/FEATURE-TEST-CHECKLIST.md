# Feature Test Checklist - Quick Reference

## Current Features in Production (Green Environment)

### ✅ Basic Features (v1.0)
- [ ] Upload image via "Browse Files" button
- [ ] Take photo with camera (mobile only)
- [ ] View analysis results (item, price, platform, condition)
- [ ] See buy price calculation (÷5 rule)
- [ ] Style tier badge displays correctly

### ✅ Enhanced Features (v2.0) 
- [ ] Drag image file to upload area (desktop)
- [ ] Paste image with Ctrl+V or Cmd+V
- [ ] Use camera on desktop/laptop (if available)
- [ ] See authenticity score with color coding
- [ ] See Boca score with trend indicator
- [ ] Expand/collapse detailed insights
- [ ] View market insights and selling tips

### ✅ Mac-Specific Fixes (Latest)
- [ ] Drag & drop works on Mac Safari
- [ ] Drag & drop works on Mac Chrome  
- [ ] Paste (Cmd+V) works on Mac Safari
- [ ] Paste (Cmd+V) works on Mac Chrome
- [ ] HEIC images from iPhone accepted

## Manual Test Script

### Test 1: Basic Upload Flow
1. Go to https://green.flippi.ai
2. Click "Browse Files"
3. Select a clothing/accessory image
4. Verify "Analyzing..." appears
5. Verify results show all fields
6. Check buy price is in green

### Test 2: Drag & Drop (Desktop)
1. Open image in file explorer/Finder
2. Drag image to the upload area
3. Verify border turns blue on hover
4. Drop image
5. Verify analysis starts

### Test 3: Paste Image
1. Copy an image (screenshot or from web)
2. Click in the upload area
3. Press Ctrl+V (Windows) or Cmd+V (Mac)
4. Verify image uploads and analyzes

### Test 4: Camera Capture
1. **Mobile**: Click "Use Camera" button
2. **Desktop**: Check if camera button appears
3. Take/capture photo
4. Verify analysis runs

### Test 5: Enhanced Results
1. After any analysis, look for:
   - Authenticity score (with color)
   - Boca score (with trend emoji)
2. Click "Show More Details"
3. Verify insights sections appear
4. Click "Hide Details" 
5. Verify sections collapse

## Automated Test Priorities

### Phase 1 - Core Tests (Playwright)
```javascript
// test/upload.spec.js
test('Upload JPEG via button', async ({ page }) => {
  await page.goto('https://green.flippi.ai');
  await page.setInputFiles('input[type="file"]', 'test-images/shirt.jpg');
  await expect(page.locator('text=Analyzing')).toBeVisible();
  await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
});

// test/dragdrop.spec.js  
test('Drag and drop upload', async ({ page }) => {
  await page.goto('https://green.flippi.ai');
  // Drag & drop simulation
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  // ... implementation
});

// test/results.spec.js
test('Verify all result fields present', async ({ page }) => {
  // After upload...
  await expect(page.locator('text=Item:')).toBeVisible();
  await expect(page.locator('text=Resale Value:')).toBeVisible();
  await expect(page.locator('text=Authenticity:')).toBeVisible();
});
```

### Phase 2 - Browser Matrix Tests
- Chrome on Windows ✅
- Chrome on Mac ✅
- Safari on Mac ✅
- Edge on Windows ⏳
- Firefox on Windows/Mac ⏳

### Phase 3 - Error Scenarios
- Upload non-image file
- Upload >10MB file
- Network disconnection during upload
- API timeout handling

## Quick Feature Toggle Reference

### Currently Enabled:
- ✅ Drag & Drop
- ✅ Paste Support  
- ✅ Desktop Camera
- ✅ Enhanced AI Analysis
- ✅ Mac Compatibility Fixes

### Feature Detection:
- Camera button only shows if camera detected
- Drag/drop only on web platform
- Paste listener only on web platform

## Bug Report Template

```markdown
**Feature**: [e.g., F-004 Drag & Drop]
**Test Case**: [e.g., TC-004.6]
**Environment**: [blue/green]
**Browser**: [Chrome/Safari/Firefox + version]
**OS**: [Windows 10/macOS 14/etc]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Screenshot/Error**: 
```

## Next Implementation Priority

1. **Playwright Tests** for:
   - Basic upload flow
   - Results verification
   - Error handling

2. **GitHub Action** for:
   - Running tests on PR
   - Blue/green deployment
   - Automated rollback

3. **Monitoring** for:
   - Feature usage rates
   - Error rates by browser
   - Performance metrics