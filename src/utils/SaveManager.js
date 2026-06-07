/**
 * Manages game progress persistence using localStorage.
 * Handles auto-save on level completion and manual save/load from the menu.
 */

const SAVE_KEY = 'amadeus_save';

export class SaveManager {
  /**
   * Save current game progress to localStorage.
   * @param {Phaser.Game | Phaser.Scene} gameOrScene - Game instance or any scene
   */
  static save(gameOrScene) {
    const registry = gameOrScene.registry || gameOrScene.game.registry;
    const data = {
      currentLevel: registry.get('currentLevel') || 1,
      score: registry.get('score') || 0,
      lives: registry.get('lives') || 3,
      instruments: registry.get('instruments') || [],
      completedLevels: registry.get('completedLevels') || [],
      coopMode: registry.get('coopMode') || false,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load saved game progress from localStorage.
   * @returns {object|null} The saved data, or null if no save exists.
   */
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Basic validation
      if (typeof data.currentLevel !== 'number' || !Array.isArray(data.completedLevels)) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Check whether a saved game exists.
   * @returns {boolean}
   */
  static hasSave() {
    return this.load() !== null;
  }

  /**
   * Delete the saved game progress.
   */
  static deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // localStorage unavailable
    }
  }

  /**
   * Restore saved data into the Phaser registry.
   * @param {Phaser.Game | Phaser.Scene} gameOrScene
   * @param {object} data - The save data from load()
   */
  static restoreToRegistry(gameOrScene, data) {
    const registry = gameOrScene.registry || gameOrScene.game.registry;
    registry.set('currentLevel', data.currentLevel);
    registry.set('score', data.score);
    registry.set('lives', data.lives);
    registry.set('instruments', data.instruments);
    registry.set('completedLevels', data.completedLevels);
    registry.set('coopMode', data.coopMode || false);
    registry.set('comboMultiplier', 1);
    registry.set('comboCount', 0);
  }

  /**
   * Get the highest score from a save (for display on menu).
   * @returns {number}
   */
  static getSavedScore() {
    const data = this.load();
    return data ? data.score : 0;
  }
}
