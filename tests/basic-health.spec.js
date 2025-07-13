/**
 * Basic health checks - no complex testing yet
 */
const { test, expect } = require('@playwright/test');

const TEST_URL = process.env.TEST_ENV === 'blue' 
  ? 'https://blue.flippi.ai'
  : 'https://green.flippi.ai';

test.describe('Basic App Health', () => {
  test('App loads', async ({ page }) => {
    await page.goto(TEST_URL);
    await expect(page.locator('text=My Thrifting Buddy')).toBeVisible();
  });

  test('Upload button exists', async ({ page }) => {
    await page.goto(TEST_URL);
    await expect(page.locator('text=Browse Files')).toBeVisible();
  });

  test('API is responding', async ({ page }) => {
    const response = await page.request.get(`${TEST_URL}/health`);
    expect(response.status()).toBe(200);
  });
});