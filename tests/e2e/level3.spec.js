import { test, expect } from '@playwright/test';
import { waitForTestAPI, skipToLevel, autoPlayLevel, collectConsoleErrors } from './helpers.js';

test.describe('Level 3 - Royal Palace', () => {
  test('should load and play without crashing', async ({ page }) => {
    const pageErrors = collectConsoleErrors(page);
    
    await waitForTestAPI(page);
    await skipToLevel(page, 3);
    
    const mozartExists = await page.evaluate(() => {
      const mozart = window.__TEST.getMozart();
      return mozart !== null && !mozart.isDead;
    });
    expect(mozartExists).toBe(true);
    
    const result = await autoPlayLevel(page, { maxDuration: 40000, walkSpeed: 200 });
    
    expect(pageErrors).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    
    if (!result.completed && result.timeout) {
      console.log('Level 3: timed out but no crashes detected');
    }
  });
});
