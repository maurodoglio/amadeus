import { test, expect } from '@playwright/test';

test.describe('Gameplay Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-container canvas', { timeout: 15000 });
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
  });

  test('should accept arrow key input without crashing', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await canvas.click();

    // Simulate gameplay input - arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    // Game canvas should still be present (no crash)
    await expect(canvas).toBeVisible();
  });

  test('should accept space key input without crashing', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await canvas.click();

    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Game should still be running
    await expect(canvas).toBeVisible();
  });

  test('should maintain game state after multiple inputs', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await canvas.click();

    // Rapid input sequence
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);

    // Verify game is still running - canvas exists and has content
    await expect(canvas).toBeVisible();
    
    const canvasHasContent = await canvas.evaluate((el) => {
      return el.width > 0 && el.height > 0;
    });
    expect(canvasHasContent).toBe(true);
  });
});
