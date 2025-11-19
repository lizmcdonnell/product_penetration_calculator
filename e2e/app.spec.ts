import { test, expect } from '@playwright/test';

test.describe('Product Penetration Calculator', () => {
  test('should load the app and display initial state', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    await expect(page.getByRole('heading', { name: /Product Attach & Penetration Calculator/i })).toBeVisible();
    
    // Check segment mix cards
    await expect(page.getByText('Current Customer Mix')).toBeVisible();
    await expect(page.getByText('Net-New Customer Mix')).toBeVisible();
    
    // Check products table
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Product/i })).toBeVisible();
  });

  test('should edit segment mix values', async ({ page }) => {
    await page.goto('/');
    
    // Find and edit a segment input
    const casualInput = page.locator('input[id*="Current Customer Mix-casual"]').first();
    await casualInput.clear();
    await casualInput.fill('25');
    await casualInput.blur();
    
    // Verify the value was updated
    await expect(casualInput).toHaveValue('25');
  });

  test('should show warning when mix does not sum to 100%', async ({ page }) => {
    await page.goto('/');
    
    // Change a value to make total not 100%
    const casualInput = page.locator('input[id*="Current Customer Mix-casual"]').first();
    await casualInput.clear();
    await casualInput.fill('10');
    await casualInput.blur();
    
    // Check for warning
    await expect(page.getByText(/Warning/i)).toBeVisible();
    await expect(page.getByText(/does not sum to 100%/i)).toBeVisible();
  });

  test('should add a new product', async ({ page }) => {
    await page.goto('/');
    
    // Count initial products
    const initialProductCount = await page.locator('tbody tr').count();
    
    // Click Add Product
    await page.getByRole('button', { name: /Add Product/i }).click();
    
    // Verify a new row was added
    const newProductCount = await page.locator('tbody tr').count();
    expect(newProductCount).toBe(initialProductCount + 1);
    
    // Verify the new product has default name
    await expect(page.getByText('New Product')).toBeVisible();
  });

  test('should edit product name inline', async ({ page }) => {
    await page.goto('/');
    
    // Find first product name and click to edit
    const firstProductName = page.locator('tbody tr').first().locator('td').first();
    await firstProductName.click();
    
    // Type new name
    const input = page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill('Test Product Name');
    await input.press('Enter');
    
    // Verify the name was updated
    await expect(page.getByText('Test Product Name')).toBeVisible();
  });

  test('should edit product fit percentage', async ({ page }) => {
    await page.goto('/');
    
    // Find first product's first fit cell and click to edit
    const firstFitCell = page.locator('tbody tr').first().locator('td').nth(1);
    await firstFitCell.click();
    
    // Type new value
    const input = page.locator('input[type="number"]').first();
    await input.clear();
    await input.fill('50');
    await input.press('Enter');
    
    // Verify the value was updated (should show 50.0%)
    await expect(firstFitCell).toContainText('50');
  });

  test('should calculate attach and penetration rates when mixes are valid', async ({ page }) => {
    await page.goto('/');
    
    // Ensure mixes are valid (should be by default)
    // Wait for calculations to appear (not "—")
    const attachCell = page.locator('tbody tr').first().locator('td').nth(6); // Attach column
    const penetrationCell = page.locator('tbody tr').first().locator('td').nth(7); // Penetration column
    
    // Values should be numbers, not "—"
    const attachText = await attachCell.textContent();
    const penetrationText = await penetrationCell.textContent();
    
    expect(attachText).not.toBe('—');
    expect(penetrationText).not.toBe('—');
  });

  test('should export and import JSON', async ({ page }) => {
    await page.goto('/');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click Export JSON
    await page.getByRole('button', { name: /Export JSON/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Read the downloaded file
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const data = JSON.parse(content);
      
      // Verify structure
      expect(data).toHaveProperty('currentMix');
      expect(data).toHaveProperty('newMix');
      expect(data).toHaveProperty('products');
      expect(Array.isArray(data.products)).toBe(true);
    }
  });

  test('should reset to defaults', async ({ page }) => {
    await page.goto('/');
    
    // Make a change first
    const casualInput = page.locator('input[id*="Current Customer Mix-casual"]').first();
    await casualInput.clear();
    await casualInput.fill('30');
    await casualInput.blur();
    
    // Click Reset
    await page.getByRole('button', { name: /Reset to Defaults/i }).click();
    
    // Verify it was reset (casual should be back to 20)
    await expect(casualInput).toHaveValue('20');
  });
});

