/**
 * Shared helpers for e2e level tests.
 * Each test navigates to the game with ?test=1, waits for the test API,
 * skips to the target level, enables god mode + auto-walk, and verifies
 * the level completes without crashes.
 */

/**
 * Wait for the game to be ready and __TEST API available.
 */
export async function waitForTestAPI(page) {
  await page.goto('/?test=1');
  
  // Wait for game instance
  await page.waitForFunction(() => {
    return typeof window.game !== 'undefined';
  }, { timeout: 20000 });
  
  // Click to dismiss any audio context requirement / start screen
  await page.click('canvas', { force: true }).catch(() => {});
  await page.waitForTimeout(1000);
  
  // Wait for __TEST
  await page.waitForFunction(() => {
    return typeof window.__TEST !== 'undefined';
  }, { timeout: 10000 });
  
  // Wait for boot scene to finish
  await page.waitForFunction(() => {
    const scenes = window.game.scene.getScenes(true);
    return scenes.length > 0 && scenes[0].scene.key !== 'BootScene';
  }, { timeout: 15000 });
}

/**
 * Skip to a specific level and set up test automation.
 */
export async function skipToLevel(page, levelNum) {
  await page.evaluate(async (num) => {
    const api = window.__TEST;
    api.enableGodMode();
    await api.skipToLevel(num);
  }, levelNum);
  
  // Wait for the level scene to be active
  await page.waitForFunction((num) => {
    const api = window.__TEST;
    const key = api.getSceneKey();
    return key === `Level${num}Scene`;
  }, levelNum, { timeout: 15000 });
}

/**
 * Run auto-walk and wait for level completion or timeout.
 * Returns { completed, errors, timeout }
 */
export async function autoPlayLevel(page, { maxDuration = 45000, walkSpeed = 200 } = {}) {
  // Start auto-walk
  await page.evaluate((speed) => {
    window.__TEST.autoWalk(speed);
  }, walkSpeed);
  
  // Poll until level complete, game over, or timeout
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxDuration) {
    const state = await page.evaluate(() => {
      const api = window.__TEST;
      return {
        completed: api.isLevelComplete(),
        gameOver: api.isGameOver(),
        errors: api.errors,
        position: api.getPosition(),
        sceneKey: api.getSceneKey()
      };
    });
    
    if (state.completed) {
      return { completed: true, errors: state.errors, timeout: false };
    }
    
    if (state.errors.length > 0) {
      return { completed: false, errors: state.errors, timeout: false };
    }
    
    // Wait a bit before next poll
    await page.waitForTimeout(500);
  }
  
  const finalErrors = await page.evaluate(() => window.__TEST.errors);
  return { completed: false, errors: finalErrors, timeout: true };
}

/**
 * Verify no JS errors were thrown during gameplay.
 */
export function collectConsoleErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
}
