# Test Suite Documentation

## Test Structure

Our tests are organized by feature, with each test file containing related test cases:

```
tests/
├── README.md                 # This file
├── fixtures/                 # Test data and images
│   ├── valid-shirt.jpg
│   ├── invalid-file.pdf
│   └── large-image.jpg
├── upload.spec.js           # F-001: Image Upload tests
├── camera.spec.js           # F-002/F-003: Camera tests
├── drag-drop.spec.js        # F-004: Drag & Drop tests
├── paste.spec.js            # F-005: Paste tests
├── analysis.spec.js         # F-006/F-007: AI Analysis tests
├── ui-display.spec.js       # F-008/F-009: Results Display tests
├── errors.spec.js           # F-011: Error Handling tests
└── cross-browser.spec.js    # F-013: Browser Compatibility tests
```

## Test Case Naming Convention

Each test maps to our Feature Traceability Matrix:

```javascript
test.describe('F-001: Image Upload via File Browser', () => {
  test('TC-001.1: Upload JPEG image successfully', async ({ page }) => {
    // Test implementation
  });
  
  test('TC-001.2: Upload PNG image successfully', async ({ page }) => {
    // Test implementation
  });
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific feature tests
npx playwright test upload.spec.js

# Run specific test case
npx playwright test -g "TC-001.1"

# Run with UI mode
npx playwright test --ui

# Run on specific browser
npx playwright test --project=chromium
```

## Test Data

Test fixtures are stored in `tests/fixtures/`:
- `valid-shirt.jpg` - Standard test image (500KB)
- `large-image.jpg` - Over 10MB for size limit testing
- `invalid-file.pdf` - Non-image file for error testing
- `heic-sample.heic` - HEIC format for Mac testing

## Environment Configuration

Tests can run against different environments:

```bash
# Test blue environment
TEST_ENV=blue npx playwright test

# Test green environment (default)
TEST_ENV=green npx playwright test

# Test local development
TEST_ENV=local npx playwright test
```

## Test Reports

After running tests, view reports:

```bash
# Open HTML report
npx playwright show-report

# Generate JSON report for CI
npx playwright test --reporter=json

# Generate JUnit report for test management tools
npx playwright test --reporter=junit
```

## Writing New Tests

When adding new test cases:

1. Check the Feature Traceability Matrix for the test case ID
2. Add test to appropriate feature file
3. Use consistent naming: `TC-XXX.X: Description`
4. Include relevant assertions
5. Add error handling for debugging

Example:
```javascript
test('TC-XXX.X: New test case description', async ({ page }) => {
  // Arrange
  await page.goto('/');
  
  // Act
  await page.click('button.upload');
  
  // Assert
  await expect(page.locator('.results')).toBeVisible();
});
```