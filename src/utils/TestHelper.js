/**
 * Test Helper - Exposes game internals for e2e testing.
 * Only activates when URL contains ?test=1
 */
export class TestHelper {
  static init(game) {
    try {
      const api = {
        game,
        getScene: () => {
        const scenes = game.scene.getScenes(true);
        // Prefer gameplay scenes over UI scenes
        const levelScene = scenes.find(s => s.scene.key.includes('Level') || s.scene.key.includes('Scene'));
        return levelScene || scenes[0];
      },
        getMozart: () => {
          const scene = api.getScene();
          return scene?.mozart || null;
        },
      
      // God mode - disable damage
      godMode: false,
      enableGodMode: () => {
        api.godMode = true;
        const mozart = api.getMozart();
        if (mozart) mozart.isInvincible = true;
      },
      
      // Teleport mozart to x,y
      teleport: (x, y) => {
        const mozart = api.getMozart();
        if (mozart) {
          mozart.setPosition(x, y);
          mozart.setVelocity(0, 0);
        }
      },
      
      // Auto-walk right at a given speed
      autoWalk: (speed = 150) => {
        api._autoWalkSpeed = speed;
        api._autoWalking = true;
      },
      
      stopAutoWalk: () => {
        api._autoWalking = false;
        const mozart = api.getMozart();
        if (mozart) mozart.setVelocityX(0);
      },
      
      // Skip/advance dialogues automatically
      autoAdvanceDialogues: true,
      
      // Get current scene key
      getSceneKey: () => {
        const scene = api.getScene();
        return scene?.scene?.key || null;
      },
      
      // Check if level is complete
      isLevelComplete: () => {
        const scene = api.getScene();
        return scene?.levelComplete || false;
      },
      
      // Check if game over
      isGameOver: () => {
        const scene = api.getScene();
        return scene?.isGameOver || false;
      },
      
      // Get mozart position
      getPosition: () => {
        const mozart = api.getMozart();
        return mozart ? { x: mozart.x, y: mozart.y } : null;
      },
      
      // Navigate to a specific scene
      startScene: (sceneKey, data = {}) => {
        game.scene.start(sceneKey, data);
      },
      
      // Skip menus and go directly to a level
      skipToLevel: (levelNum) => {
        // Set up registry as if player progressed normally
        game.registry.set('lives', 5);
        game.registry.set('score', 0);
        game.registry.set('instruments', []);
        game.registry.set('currentLevel', levelNum);
        game.registry.set('tutorialShown', true);
        
        const sceneKey = `Level${levelNum}Scene`;
        // Stop all currently running scenes
        const running = game.scene.getScenes(true);
        running.forEach(s => {
          if (s.scene.key !== sceneKey) {
            game.scene.stop(s.scene.key);
          }
        });
        return api._loadAndStartLevel(sceneKey, levelNum);
      },
      
      _loadAndStartLevel: async (sceneKey, levelNum) => {
        const { loadScene } = await import('../utils/SceneLoader.js');
        await loadScene(game.scene, sceneKey);
        game.scene.start(sceneKey);
      },
      
      // Errors captured during gameplay
      errors: [],
      
      // Internal state
      _autoWalking: false,
      _autoWalkSpeed: 150,
      _updateInterval: null
    };
    
    // Set up update loop for auto-walk and dialogue skipping
    api._updateInterval = setInterval(() => {
      if (api._autoWalking) {
        const mozart = api.getMozart();
        if (mozart && !mozart.isDead) {
          mozart.setVelocityX(api._autoWalkSpeed);
          // Auto-jump when hitting a wall or near edge
          if (mozart.body && mozart.body.blocked.right && mozart.body.blocked.down) {
            mozart.setVelocityY(-350);
          }
        }
      }
      
      // Auto-advance dialogues
      if (api.autoAdvanceDialogues) {
        const scene = api.getScene();
        if (scene?.dialogueBox?.isShowing) {
          scene.dialogueBox.advance();
        }
      }
      
      // God mode enforcement
      if (api.godMode) {
        const mozart = api.getMozart();
        if (mozart) mozart.isInvincible = true;
      }
    }, 100);
    
    // Capture errors
    window.addEventListener('error', (e) => {
      api.errors.push({ message: e.message, filename: e.filename, lineno: e.lineno });
    });
    
    window.__TEST = api;
    console.log('[TestHelper] E2E test mode active');
    } catch (e) {
      console.error('[TestHelper] Init failed:', e);
      window.__TEST = { error: e.message };
    }
  }
}
