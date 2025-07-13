/**
 * Feature: F-001 - Image Upload via File Browser
 * 
 * Description: Tests for standard file upload functionality
 * 
 * Test Cases:
 * - TC-001.1: Upload JPEG image successfully
 * - TC-001.2: Upload PNG image successfully
 * - TC-001.3: Upload GIF image successfully
 * - TC-001.4: Upload WEBP image successfully
 * - TC-001.5: Upload HEIC/HEIF image (Mac) successfully
 * - TC-001.6: Reject non-image files (PDF, TXT, etc.)
 * - TC-001.7: Reject images over 10MB
 * - TC-001.8: Handle multiple file selection (take first)
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const TEST_URL = process.env.TEST_ENV === 'blue' 
  ? 'https://blue.flippi.ai'
  : process.env.TEST_ENV === 'local'
    ? 'http://localhost:8080'
    : 'https://green.flippi.ai';

test.describe('F-001: Image Upload via File Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    // Wait for app to load
    await expect(page.locator('text=My Thrifting Buddy')).toBeVisible();
  });

  test('TC-001.1: Upload JPEG image successfully', async ({ page }) => {
    // Test metadata for reporting
    test.info().annotations.push(
      { type: 'test_id', description: 'TC-001.1' },
      { type: 'feature', description: 'F-001' },
      { type: 'priority', description: 'P1' }
    );

    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/valid-shirt.jpg'));

    // Verify upload starts
    await expect(page.locator('text=Analyzing...')).toBeVisible();

    // Wait for and verify results
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Item:')).toBeVisible();
    await expect(page.locator('text=Resale Value:')).toBeVisible();
    await expect(page.locator('text=Best Platform:')).toBeVisible();
  });

  test('TC-001.2: Upload PNG image successfully', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.2' });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/valid-shoes.png'));

    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('TC-001.3: Upload GIF image successfully', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.3' });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/valid-accessory.gif'));

    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('TC-001.4: Upload WEBP image successfully', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.4' });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/valid-bag.webp'));

    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('TC-001.5: Upload HEIC/HEIF image (Mac) successfully', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.5' });
    
    // Skip on non-webkit browsers for HEIC support
    test.skip(browserName !== 'webkit', 'HEIC support varies by browser');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/iphone-photo.heic'));

    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('TC-001.6: Reject non-image files', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.6' });

    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload a PDF
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/document.pdf'));

    // Should show error message
    await expect(page.locator('text=Please select an image file')).toBeVisible();
    
    // Should not show analyzing
    await expect(page.locator('text=Analyzing...')).not.toBeVisible();
  });

  test('TC-001.7: Reject images over 10MB', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.7' });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/large-image.jpg'));

    // Should show size error
    await expect(page.locator('text=/too large|under 10MB/i')).toBeVisible();
    
    // Should not show analyzing
    await expect(page.locator('text=Analyzing...')).not.toBeVisible();
  });

  test('TC-001.8: Handle multiple file selection', async ({ page }) => {
    test.info().annotations.push({ type: 'test_id', description: 'TC-001.8' });

    const fileInput = page.locator('input[type="file"]');
    
    // Select multiple files
    await fileInput.setInputFiles([
      path.join(__dirname, 'fixtures/valid-shirt.jpg'),
      path.join(__dirname, 'fixtures/valid-shoes.png')
    ]);

    // Should process first file
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
    
    // Verify only one analysis happened
    const results = await page.locator('text=Results:').count();
    expect(results).toBe(1);
  });
});

// Helper function to create test data
test.describe('Test Data Generation', () => {
  test.skip('Generate test fixtures', async () => {
    // This test is skipped but documents how to create test data
    console.log('Test fixtures should include:');
    console.log('- valid-shirt.jpg: 500KB clothing item');
    console.log('- valid-shoes.png: 1MB footwear');
    console.log('- valid-accessory.gif: 200KB accessory');
    console.log('- valid-bag.webp: 800KB handbag');
    console.log('- iphone-photo.heic: HEIC format from iPhone');
    console.log('- document.pdf: Non-image file');
    console.log('- large-image.jpg: 11MB image (over limit)');
  });
});