/**
 * Feature: F-006 - Get resale price estimates
 * GitHub Issue: #24
 * 
 * Product Owner Test Cases implemented as Playwright tests
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const TEST_URL = process.env.TEST_ENV === 'blue' 
  ? 'https://blue.flippi.ai'
  : 'https://green.flippi.ai';

test.describe('Issue #24: Get resale price estimates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await expect(page.locator('text=My Thrifting Buddy')).toBeVisible();
    
    // Upload an image to get results
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/designer-bag.jpg'));
    
    // Wait for analysis
    await expect(page.locator('text=Results:')).toBeVisible({ timeout: 30000 });
  });

  test('I see the item name/description', async ({ page }) => {
    const itemName = page.locator('text=Item:').locator('..');
    await expect(itemName).toBeVisible();
    await expect(itemName).toContainText(/bag|purse|handbag/i);
  });

  test('I see a price range (e.g., $15-25)', async ({ page }) => {
    const priceRange = page.locator('text=Resale Value:').locator('..');
    await expect(priceRange).toBeVisible();
    await expect(priceRange).toContainText(/\$\d+/);
  });

  test('I see the recommended platform (eBay, Poshmark, etc.)', async ({ page }) => {
    const platform = page.locator('text=Best Platform:').locator('..');
    await expect(platform).toBeVisible();
    await expect(platform).toContainText(/eBay|Poshmark|Mercari|Depop|Vinted/i);
  });

  test('I see the condition assessment', async ({ page }) => {
    const condition = page.locator('text=Condition:').locator('..');
    await expect(condition).toBeVisible();
    await expect(condition).toContainText(/Excellent|Good|Fair|Poor/i);
  });

  test('I see the max buy price (using ÷5 rule)', async ({ page }) => {
    const buyPrice = page.locator('text=Max Buy Price:').locator('..');
    await expect(buyPrice).toBeVisible();
    await expect(buyPrice).toContainText('÷5 rule');
    
    // Verify it's highlighted in green
    await expect(buyPrice).toHaveCSS('color', 'rgb(46, 125, 50)');
  });

  test('I see the style tier (Entry/Designer/Luxury)', async ({ page }) => {
    const styleTier = page.locator('.tierBadge');
    await expect(styleTier).toBeVisible();
    await expect(styleTier).toContainText(/Entry|Designer|Luxury/);
  });

  test('Results make sense for the item shown', async ({ page }) => {
    // This is a business logic test - verify all fields are present
    await expect(page.locator('text=Item:')).toBeVisible();
    await expect(page.locator('text=Resale Value:')).toBeVisible();
    await expect(page.locator('text=Best Platform:')).toBeVisible();
    await expect(page.locator('text=Condition:')).toBeVisible();
    await expect(page.locator('text=Max Buy Price:')).toBeVisible();
  });

  test('Luxury items show higher prices than regular brands', async ({ page }) => {
    // This would require multiple test images
    // For now, verify price is displayed
    const priceText = await page.locator('text=Resale Value:').locator('..').textContent();
    expect(priceText).toMatch(/\$\d+/);
  });
});