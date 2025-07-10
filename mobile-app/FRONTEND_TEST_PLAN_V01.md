# Frontend Test Plan v0.1 - Simplified Architecture

## Overview
This test plan covers the simplified React Native app consisting of a single 150-line App.js file with image selection and price display functionality.

## Architecture Summary
- Single file: `App.js`
- No authentication screens
- No navigation (single screen)
- Direct backend communication
- Platform-specific image selection (camera for mobile, file picker for web)

## Test Categories

### 1. Build and Setup Tests

#### Test 1.1: Expo Web Build
```bash
cd mobile-app
npx expo export --platform web --output-dir dist
# Expected: Successful build with dist/ folder created
```

#### Test 1.2: Container Build
```bash
docker build -f Dockerfile.frontend-node -t frontend-v01 .
# Expected: Successful build
```

#### Test 1.3: Static Server
```bash
# After build, verify index.html exists
ls dist/index.html
# Expected: File exists
```

### 2. UI Component Tests

#### Test 2.1: Initial Screen Load
```bash
# Access http://localhost:8080
curl -s http://localhost:8080 | grep -i "thrifting"
# Expected: HTML contains app title
```

#### Test 2.2: Platform Detection
- **Web Browser**: Should show "Select Image" button
- **Mobile Device**: Should show "Take Photo" button

### 3. Image Selection Tests

#### Test 3.1: Web File Picker
```javascript
// Manual test in browser
// 1. Click "Select Image"
// 2. File dialog should open
// 3. Can select JPEG/PNG files
// 4. Image preview appears after selection
```

#### Test 3.2: File Type Validation
```javascript
// Manual test
// 1. Try selecting non-image file
// 2. Should show error or be prevented
```

### 4. Backend Communication Tests

#### Test 4.1: API URL Configuration
```bash
# Check if frontend can reach backend
curl http://localhost:8080 # Frontend
curl http://localhost:3000/health # Backend
# Both should respond
```

#### Test 4.2: Image Upload
```javascript
// Manual test
// 1. Select image
// 2. Click "Analyze"
// 3. Should see loading state
// 4. Should receive price analysis
```

#### Test 4.3: Error Handling
```javascript
// Manual test with backend stopped
// 1. Stop backend container
// 2. Try to analyze image
// 3. Should show connection error
```

### 5. Results Display Tests

#### Test 5.1: Price Display
```javascript
// After successful analysis
// Should display:
// - Item name
// - Price range
// - Confidence level
// - Platform-specific prices
```

#### Test 5.2: Error Display
```javascript
// On analysis failure
// Should display:
// - User-friendly error message
// - Option to retry
```

## Test Execution Script

Create `test-frontend.sh`:
```bash
#!/bin/bash

echo "=== Frontend v0.1 Test Suite ==="

# Test 1: Container running
echo -n "Testing frontend container... "
if curl -s -I http://localhost:8080 | grep -q "200 OK"; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 2: HTML content
echo -n "Testing HTML content... "
if curl -s http://localhost:8080 | grep -q "<title>"; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 3: JavaScript bundle
echo -n "Testing JavaScript bundle... "
if curl -s http://localhost:8080 | grep -q "bundle.js"; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 4: Backend connectivity (from frontend perspective)
echo -n "Testing backend reachability... "
if curl -s http://localhost:3000/health | grep -q "healthy"; then
  echo "PASS"
else
  echo "FAIL - Backend not reachable"
fi

echo "=== Test Suite Complete ==="
```

## Manual Testing Checklist

### Web Platform
- [ ] Page loads without errors
- [ ] "Select Image" button visible
- [ ] File picker opens on button click
- [ ] Can select JPEG image
- [ ] Can select PNG image
- [ ] Image preview displays after selection
- [ ] "Analyze" button becomes active
- [ ] Loading state shows during analysis
- [ ] Results display correctly
- [ ] Error messages display on failure
- [ ] Can analyze another image

### Mobile Platform (if testing on device)
- [ ] App loads without errors
- [ ] "Take Photo" button visible
- [ ] Camera opens with permission
- [ ] Can capture photo
- [ ] Photo preview displays
- [ ] Analysis works same as web

## Integration Tests

### Test 6.1: Full Flow - Success
1. Start both containers
2. Open frontend in browser
3. Select test image
4. Click analyze
5. Verify results display

### Test 6.2: Full Flow - Backend Error
1. Stop backend container
2. Try to analyze image
3. Verify error message appears

### Test 6.3: Full Flow - Invalid Image
1. Select very small or corrupt image
2. Analyze
3. Verify appropriate error handling

## Performance Tests

### Test 7.1: Page Load Time
```bash
time curl -s http://localhost:8080 -o /dev/null
# Expected: < 2 seconds
```

### Test 7.2: Bundle Size
```bash
du -h dist/
# Expected: < 10MB total
```

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

## Success Criteria

- Frontend loads without errors
- Can select/capture images
- Successfully communicates with backend
- Displays results clearly
- Handles errors gracefully
- Works on web platform
- Responsive UI

## Notes

- No authentication tests (feature removed)
- No navigation tests (single screen)
- No state management tests (minimal state)
- No offline tests (not supported)
- Focus on core image selection and display functionality