# Frontend Test Plan - My Thrifting Buddy Mobile App

## Overview
This document outlines the comprehensive testing strategy for the My Thrifting Buddy React Native mobile application. The app allows users to photograph secondhand items and receive AI-powered price estimates across multiple resale platforms.

## Test Structure
```
mobile-app/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── screens/
│   │   └── navigation/
│   └── e2e/
│       └── flows/
├── __mocks__/
└── test-utils/
```

## Unit Tests

### 1. Context Tests

#### AuthContext (`__tests__/unit/contexts/AuthContext.test.js`)
**Status**: Not implemented

**Test Cases**:
- Initial unauthenticated state
- Login action updates state correctly
- Logout clears user data and tokens
- Token refresh updates state
- Auto-login on app start with valid token
- Secure token storage and retrieval

**Example Test**:
```javascript
describe('AuthContext', () => {
  test('should handle login successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

#### AppStateContext (`__tests__/unit/contexts/AppStateContext.test.js`)
**Status**: Not implemented

**Test Cases**:
- Loading state management
- Error state handling
- Network connectivity tracking
- App foreground/background state
- Pending actions queue

#### ScanHistoryContext (`__tests__/unit/contexts/ScanHistoryContext.test.js`)
**Status**: Not implemented

**Test Cases**:
- Add new scan to history
- Remove scan from history
- Update scan notes/favorite status
- Pagination handling
- Search functionality
- Offline queue management

### 2. Service Tests

#### API Service (`__tests__/unit/services/apiService.test.js`)
**Status**: Not implemented

**Test Cases**:
- Dynamic API URL detection
- Request retry logic (3 attempts)
- Token refresh on 401
- Network error handling
- Request/response interceptors
- FormData for image upload
- Base64 fallback for image upload
- Cache management

**Example Test**:
```javascript
describe('ApiService', () => {
  test('should retry failed requests', async () => {
    // Mock fetch to fail twice then succeed
    let attempts = 0;
    global.fetch = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network request failed'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
    
    const result = await apiService.get('/test');
    expect(attempts).toBe(3);
    expect(result.data.success).toBe(true);
  });
});
```

### 3. Component Tests

#### ErrorBoundary (`__tests__/unit/components/ErrorBoundary.test.js`)
**Status**: Not implemented

**Test Cases**:
- Catches and displays render errors
- Logs errors to Sentry
- Provides recovery action
- Resets on navigation change

#### CameraScreen Components (`__tests__/unit/components/Camera.test.js`)
**Status**: Not implemented

**Test Cases**:
- Permission request handling
- Camera flip functionality
- Image capture and preview
- Image compression settings
- Retake functionality
- Loading states during analysis

#### LoadingOverlay (`__tests__/unit/components/LoadingOverlay.test.js`)
**Status**: Not implemented

**Test Cases**:
- Shows/hides based on prop
- Displays custom messages
- Prevents user interaction when visible
- Accessibility attributes

#### OptimizedList (`__tests__/unit/components/OptimizedList.test.js`)
**Status**: Not implemented

**Test Cases**:
- Virtualization performance
- Pull-to-refresh functionality
- Empty state rendering
- Load more on scroll
- Item separators

### 4. Utility Tests

#### Platform Styles (`__tests__/unit/utils/platformStyles.test.js`)
**Status**: Not implemented

**Test Cases**:
- iOS-specific styles
- Android-specific styles
- Responsive dimensions
- Safe area handling

## Integration Tests

### 1. Screen Integration Tests

#### HomeScreen (`__tests__/integration/screens/HomeScreen.test.js`)
**Status**: Not implemented

**Test Cases**:
- Renders welcome message for new users
- Shows scan history for returning users
- Navigation to camera screen
- Pull-to-refresh updates history
- Search functionality
- Network status indicator

#### CameraScreen (`__tests__/integration/screens/CameraScreen.test.js`)
**Status**: Not implemented

**Test Cases**:
- Full camera flow from permission to capture
- Error handling for permission denial
- Image analysis integration
- Navigation to results on success
- Error alerts on failure

#### ResultsScreen (`__tests__/integration/screens/ResultsScreen.test.js`)
**Status**: Not implemented

**Test Cases**:
- Displays analysis results correctly
- Platform price comparisons
- Save to history (authenticated)
- Share functionality
- Navigation back to home

### 2. Navigation Tests (`__tests__/integration/navigation/Navigation.test.js`)
**Status**: Not implemented

**Test Cases**:
- Stack navigation flow
- Deep linking support
- Navigation state persistence
- Back button handling
- Gesture navigation

## End-to-End Tests

### 1. First-Time User Flow (`__tests__/e2e/flows/firstTimeUser.e2e.js`)
```javascript
describe('First Time User Flow', () => {
  test('complete onboarding and first scan', async () => {
    // 1. Launch app
    // 2. View onboarding
    // 3. Skip login
    // 4. Grant camera permission
    // 5. Take photo
    // 6. Wait for analysis
    // 7. View results
    // 8. Prompt to create account
  });
});
```

### 2. Authenticated User Flow (`__tests__/e2e/flows/authenticatedUser.e2e.js`)
```javascript
describe('Authenticated User Flow', () => {
  test('login and scan with history', async () => {
    // 1. Launch app
    // 2. Login with credentials
    // 3. View scan history
    // 4. Take new photo
    // 5. Analyze item
    // 6. Save to favorites
    // 7. Add notes
    // 8. Verify in history
  });
});
```

### 3. Offline Mode (`__tests__/e2e/flows/offlineMode.e2e.js`)
```javascript
describe('Offline Mode', () => {
  test('queue actions when offline', async () => {
    // 1. Login while online
    // 2. Go offline
    // 3. Attempt scan
    // 4. See offline message
    // 5. Go online
    // 6. Verify queued scan processes
  });
});
```

### 4. Error Recovery (`__tests__/e2e/flows/errorRecovery.e2e.js`)
```javascript
describe('Error Recovery', () => {
  test('handles API errors gracefully', async () => {
    // 1. Simulate server error
    // 2. Verify error message
    // 3. Test retry action
    // 4. Verify recovery
  });
});
```

## Performance Tests

### 1. Component Performance
- FlatList rendering with 1000+ items
- Image loading and caching
- Navigation transition smoothness
- Memory usage during camera operation
- App launch time

### 2. Network Performance
- API response caching
- Image upload optimization
- Concurrent request handling
- Offline data sync

## Platform-Specific Tests

### 1. iOS Tests
- iOS 14+ compatibility
- Face ID integration (future)
- iOS-specific permissions
- Haptic feedback
- Safe area handling

### 2. Android Tests
- Android 6+ compatibility
- Back button handling
- Permission dialogs
- Material Design compliance
- Various screen densities

### 3. Web Tests (Expo Web)
- Responsive design
- Mouse/keyboard interactions
- Browser compatibility
- PWA functionality

## Accessibility Tests

### 1. Screen Reader Support
- VoiceOver (iOS) compatibility
- TalkBack (Android) compatibility
- Proper accessibility labels
- Navigation announcements

### 2. Visual Accessibility
- Color contrast ratios
- Text scaling support
- Focus indicators
- Touch target sizes

## Test Setup and Configuration

### 1. Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@unimodules)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test-utils/**'
  ]
};
```

### 2. Test Utilities
```javascript
// test-utils/render.js
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';

export const renderWithProviders = (component, options = {}) => {
  return render(
    <NavigationContainer>
      <PaperProvider>
        {component}
      </PaperProvider>
    </NavigationContainer>,
    options
  );
};
```

### 3. Mocks
```javascript
// __mocks__/expo-camera.js
export const Camera = {
  Constants: {
    Type: {
      back: 'back',
      front: 'front'
    }
  },
  requestCameraPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  )
};

// __mocks__/@react-native-async-storage/async-storage.js
export default {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
```

## Test Execution

### 1. Local Development
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- HomeScreen.test.js

# Update snapshots
npm test -- -u
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/mobile-test.yml
test:
  - npm install
  - npm test -- --coverage
  - npm run lint
  - npm run type-check
```

### 3. E2E Testing with Detox
```bash
# Build for testing
detox build -c ios.sim.debug

# Run E2E tests
detox test -c ios.sim.debug

# Run specific test
detox test -c ios.sim.debug --testNamePattern="First Time User"
```

## Coverage Requirements

- Overall: 70% minimum
- Critical paths: 90%
- New features: 80% minimum
- UI Components: 60% minimum

## Test Data

### 1. Mock API Responses
```javascript
// __mocks__/api-responses.js
export const mockAnalysisResponse = {
  analysis: {
    itemIdentification: {
      name: "Vintage Denim Jacket",
      category: "Clothing",
      brand: "Levi's",
      condition: "Good"
    },
    priceEstimates: {
      eBay: { min: 45, max: 65 },
      facebookMarketplace: { min: 40, max: 55 },
      poshmark: { min: 50, max: 70 }
    }
  },
  confidence: "High"
};
```

### 2. Test Images
```javascript
// test-utils/test-images.js
export const testImages = {
  validJpeg: require('./assets/test-item.jpg'),
  largeImage: require('./assets/large-item.jpg'),
  corruptImage: require('./assets/corrupt.jpg')
};
```

## Continuous Improvement

### 1. Test Metrics
- Test execution time
- Flaky test identification
- Coverage trends
- Bug detection rate

### 2. Test Maintenance
- Regular mock updates
- Snapshot reviews
- Performance baseline updates
- Accessibility audit updates

## AI-Assisted Test Execution Methods

### What I Can Execute for Frontend Testing

1. **Run React Native Tests**
```bash
cd mobile-app
npm test                    # Run all tests
npm test -- --coverage     # With coverage report
npm test -- --watch        # Watch mode
```

2. **Web Version Testing with Puppeteer**
```javascript
// test-web-app.js - I can write and execute this
const puppeteer = require('puppeteer');

async function testMobileWebApp() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  
  // Navigate to web version
  await page.goto('http://localhost:19006'); // Expo web
  
  // Test navigation
  await page.waitForSelector('[data-testid="scan-button"]');
  await page.click('[data-testid="scan-button"]');
  
  // Test file upload
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('[data-testid="upload-button"]')
  ]);
  await fileChooser.accept(['./test-images/item.jpg']);
  
  // Wait for and verify results
  await page.waitForSelector('[data-testid="results"]', { timeout: 30000 });
  const results = await page.$eval('[data-testid="results"]', el => el.textContent);
  
  console.log('Test passed! Results:', results);
  await browser.close();
}

// Run the test
testMobileWebApp().catch(console.error);
```

3. **API Integration Tests from Mobile Context**
```javascript
// mobile-api-test.js
const { analyzeImage, checkServerHealth } = require('./src/services/apiService');

async function testMobileAPIIntegration() {
  // Test health check
  const health = await checkServerHealth();
  console.log('Server health:', health);
  
  // Test image analysis
  const mockBase64 = 'base64encodedimagedata...';
  const result = await analyzeImage('file://test.jpg', mockBase64);
  console.log('Analysis result:', result);
}
```

4. **Expo Web Testing Commands**
```bash
# Start Expo web version
cd mobile-app
npx expo start --web

# In another terminal, run Puppeteer tests
node test-web-app.js
```

5. **Component Testing with Jest**
```bash
# Run specific component tests
npm test -- HomeScreen.test.js
npm test -- components/

# Update snapshots
npm test -- -u
```

### What I Cannot Do for Mobile Testing
- Interact with physical devices
- Test native mobile features (camera, GPS) directly
- Run iOS Simulator or Android Emulator
- Execute Detox tests (requires device/emulator)
- Test platform-specific gestures

### Automated Testing I Can Set Up

1. **Puppeteer Mobile Web Tests**
   - Full user flows in mobile web view
   - Responsive design testing
   - Touch event simulation
   - File upload testing

2. **Jest Unit/Integration Tests**
   - Component rendering
   - Context state management
   - API service mocking
   - Navigation testing

3. **API Contract Testing**
   - Verify mobile app expectations match backend
   - Test error scenarios
   - Network failure simulation

### Testing Strategy Execution Plan

1. **Phase 1: Immediate Testing**
```bash
# Test the web version is accessible
curl http://localhost:19006

# Run existing Jest tests
cd mobile-app && npm test

# Check for TypeScript errors
npx tsc --noEmit
```

2. **Phase 2: Automated Web Testing**
```bash
# Install Puppeteer
npm install --save-dev puppeteer

# Create and run web tests
node puppeteer-tests/full-flow.js
```

3. **Phase 3: Continuous Testing**
```bash
# Set up test watchers
npm test -- --watch

# Run on file changes
nodemon --exec "npm test"
```

## Next Steps

1. **Immediate Priority**:
   - Verify Expo web build works
   - Create Puppeteer test suite for web version
   - Run and fix existing Jest tests

2. **Short Term**:
   - Write missing unit tests
   - Create API integration test suite
   - Set up GitHub Actions for CI

3. **Long Term**:
   - Contract testing between frontend/backend
   - Performance monitoring
   - Accessibility automation
   - Cross-browser testing