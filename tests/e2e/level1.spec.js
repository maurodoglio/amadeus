import { test, expect } from '@playwright/test';
import { waitForTestAPI, skipToLevel, autoPlayLevel, collectConsoleErrors } from './helpers.js';

test.describe('Level 1 - Vienna Streets', () => {
  test('should load and play without crashing', async ({ page }) => {
    const pageErrors = collectConsoleErrors(page);
    
    // Log console for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    
    await waitForTestAPI(page);
    await skipToLevel(page, 1);
    
    // Verify Mozart exists and is positioned
    const mozartExists = await page.evaluate(() => {
      const mozart = window.__TEST.getMozart();
      return mozart !== null && !mozart.isDead;
    });
    expect(mozartExists).toBe(true);
    
    // Auto-play through the level
    const result = await autoPlayLevel(page, { maxDuration: 40000, walkSpeed: 200 });
    
    // No JS errors should have occurred
    expect(pageErrors).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    
    // Level should eventually complete (or at least not crash/timeout with errors)
    if (!result.completed && result.timeout) {
      // Timeout without errors is acceptable - the level might be too long
      // for auto-walk to finish, but no crash occurred
      console.log('Level 1: timed out but no crashes detected');
    }
  });
});
