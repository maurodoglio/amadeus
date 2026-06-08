import { settingsManager } from '../utils/SettingsManager.js';

/**
 * Adds pause functionality to a level scene.
 * Call setupPause(scene) in the scene's create() method.
 */
export function setupPause(scene) {
  if (!scene.input.keyboard) return;
  scene.input.keyboard.on('keydown-ESC', () => togglePause(scene));
  scene.input.keyboard.on('keydown-P', () => togglePause(scene));
}

function togglePause(scene) {
  if (scene.scene.isPaused()) return;
  // Don't allow pause during level completion or boss defeat sequences
  if (scene.bossDefeated || scene.levelCompleting) return;

  scene.registry.set('pausedScene', scene.scene.key);
  scene.scene.pause();
  scene.scene.launch('PauseScene');
}
