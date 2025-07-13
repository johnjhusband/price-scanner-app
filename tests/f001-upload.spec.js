/**
 * Feature: F-001 - Upload images from device gallery
 * GitHub Issue: #19
 * 
 * Product Owner Test Cases implemented as Playwright tests
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const TEST_URL = process.env.TEST_ENV === 'blue' 
  ? 'https://blue.flippi.ai'
  : 'https://green.flippi.ai';

test.describe('Issue #19: Upload images from device gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await expect(page.locator('text=My Thrifting Buddy')).toBeVisible();
  });

  test('I can tap Browse Files and see my photo gallery', async ({ page }) => {
    // Find the Browse Files button
    const browseButton = page.locator('text=📁 Browse Files');
    await expect(browseButton).toBeVisible();
    
    // Click triggers file picker (we can't test the OS dialog, but can verify it's triggered)
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      browseButton.click()
    ]);
    
    expect(fileChooser).toBeTruthy();
  });

  test('I can select a photo of clothing and see it analyzed', async ({ page }) => {
    // Upload a clothing image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/clothing.jpg'));
    
    // Verify analyzing state
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    
    // Verify results appear
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Item:')).toBeVisible();
  });

  test('I can select a photo of shoes and see it analyzed', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/shoes.jpg'));
    
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('I can select a photo of accessories and see it analyzed', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/accessory.jpg'));
    
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('If I select a non-image file, I see a helpful error message', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/document.pdf'));
    
    // Should see error message
    await expect(page.locator('text=/Please select an image file|image file/i')).toBeVisible();
    
    // Should NOT see analyzing
    await expect(page.locator('text=Analyzing...')).not.toBeVisible();
  });

  test('If I select a very large photo (>10MB), I\'m told it\'s too big', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/large-image.jpg'));
    
    // Should see size error
    await expect(page.locator('text=/too large|under 10MB|10MB/i')).toBeVisible();
  });

  test('The app shows Analyzing... while processing my photo', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/clothing.jpg'));
    
    // Verify the analyzing message appears
    const analyzingText = page.locator('text=Analyzing...');
    await expect(analyzingText).toBeVisible();
    
    // And eventually disappears
    await expect(analyzingText).not.toBeVisible({ timeout: 30000 });
  });

  test('Results appear within 30 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/clothing.jpg'));
    
    // Wait for results with 30 second timeout
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    expect(duration).toBeLessThan(30);
  });
});