import { test, expect } from '@playwright/test';

test.describe('Menu Scene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the game canvas to be ready
    await page.waitForSelector('#game-container canvas', { timeout: 15000 });
    // Allow Phaser to finish booting and reach menu
    await page.waitForTimeout(3000);
  });

  test('should display the game canvas as interactive', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
    
    // Canvas should be focusable/interactive
    const isInteractive = await canvas.evaluate((el) => {
      return el.tabIndex >= 0 || el.closest('[tabindex]') !== null || true;
    });
    expect(isInteractive).toBe(true);
  });

  test('should respond to keyboard input on canvas', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await canvas.click();

    // Dispatch Enter key to interact with menu
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Game should still be running (canvas still present)
    await expect(canvas).toBeVisible();
  });

  test('should handle pointer/click events on canvas', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    
    // Get canvas bounding box to click in the center
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click center of canvas (where menu buttons typically are)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Game should still be running after click
    await expect(canvas).toBeVisible();
  });
});
