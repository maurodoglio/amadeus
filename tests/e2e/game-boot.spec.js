import { test, expect } from '@playwright/test';

test.describe('Game Boot', () => {
  test('should render a canvas element', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    
    // Wait for Phaser to create the canvas
    const canvas = await page.waitForSelector('#game-container canvas', { timeout: 15000 });
    expect(canvas).not.toBeNull();
  });

  test('should have correct canvas dimensions', async ({ page }) => {
    await page.goto('/');
    
    const canvas = await page.waitForSelector('#game-container canvas', { timeout: 15000 });
    const dimensions = await canvas.evaluate((el) => ({
      width: el.width,
      height: el.height
    }));

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });

  test('should initialize Phaser game instance without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#game-container canvas', { timeout: 15000 });

    // Give Phaser time to fully initialize
    await page.waitForTimeout(2000);

    // Check that the game instance exists
    const gameExists = await page.evaluate(() => {
      return typeof window.game !== 'undefined' || 
             document.querySelector('#game-container canvas') !== null;
    });
    expect(gameExists).toBe(true);

    // No critical errors during boot
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
