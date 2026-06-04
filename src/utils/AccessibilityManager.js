import { settingsManager } from './SettingsManager.js';

const ACCESSIBILITY_STORAGE_KEY = 'amadeus_accessibility';

const DEFAULT_ACCESSIBILITY = {
  // Visual
  highContrast: false,
  colorblindMode: 'none', // 'none', 'deuteranopia', 'protanopia', 'tritanopia'
  reduceFlashes: false,
  largeText: false,

  // Motor
  controlScheme: 'default', // 'default', 'oneHanded'
  gameSpeed: 1, // 0.5, 0.75, 1
  keyBindings: {
    left: 'LEFT',
    right: 'RIGHT',
    jump: 'SPACE',
    down: 'DOWN',
    up: 'UP',
    pause: 'P'
  },

  // Difficulty
  easyMode: false,
  invincible: false,
  moreCheckpoints: false
};

// Color matrices for colorblind simulation correction
const COLOR_MATRICES = {
  none: null,
  deuteranopia: [
    0.625, 0.375, 0, 0, 0,
    0.7, 0.3, 0, 0, 0,
    0, 0.3, 0.7, 0, 0,
    0, 0, 0, 1, 0
  ],
  protanopia: [
    0.567, 0.433, 0, 0, 0,
    0.558, 0.442, 0, 0, 0,
    0, 0.242, 0.758, 0, 0,
    0, 0, 0, 1, 0
  ],
  tritanopia: [
    0.95, 0.05, 0, 0, 0,
    0, 0.433, 0.567, 0, 0,
    0, 0.475, 0.525, 0, 0,
    0, 0, 0, 1, 0
  ]
};

class AccessibilityManager {
  constructor() {
    this.settings = { ...DEFAULT_ACCESSIBILITY };
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = {
          ...DEFAULT_ACCESSIBILITY,
          ...parsed,
          keyBindings: { ...DEFAULT_ACCESSIBILITY.keyBindings, ...(parsed.keyBindings || {}) }
        };
      }
    } catch (e) {
      this.settings = { ...DEFAULT_ACCESSIBILITY };
    }
  }

  save() {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      // localStorage unavailable
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  getKeyBinding(action) {
    return this.settings.keyBindings[action] || DEFAULT_ACCESSIBILITY.keyBindings[action];
  }

  setKeyBinding(action, key) {
    this.settings.keyBindings[action] = key;
    this.save();
  }

  resetKeyBindings() {
    this.settings.keyBindings = { ...DEFAULT_ACCESSIBILITY.keyBindings };
    this.save();
  }

  getColorMatrix() {
    return COLOR_MATRICES[this.settings.colorblindMode] || null;
  }

  getTextScale() {
    return this.settings.largeText ? 1.4 : 1.0;
  }

  getEasyModeHealth() {
    return this.settings.easyMode ? 5 : 3;
  }

  getEnemySpeedMultiplier() {
    return this.settings.easyMode ? 0.6 : 1.0;
  }

  getPlatformWidthBonus() {
    return this.settings.easyMode ? 2 : 0;
  }

  shouldReduceFlashes() {
    return this.settings.reduceFlashes || settingsManager.get('screenShake') === false;
  }

  applyToScene(scene) {
    // Apply game speed
    if (scene.time) {
      scene.time.timeScale = 1 / this.settings.gameSpeed;
    }
    if (scene.physics && scene.physics.world) {
      scene.physics.world.timeScale = 1 / this.settings.gameSpeed;
    }

    // Apply color filter
    this.applyColorFilter(scene);

    // Apply high contrast
    if (this.settings.highContrast) {
      this.applyHighContrast(scene);
    }
  }

  applyColorFilter(scene) {
    const matrix = this.getColorMatrix();
    if (!matrix && scene._accessibilityFilter) {
      scene.cameras.main.resetPostPipeline();
      scene._accessibilityFilter = null;
      return;
    }
    if (matrix && scene.cameras && scene.cameras.main) {
      try {
        scene.cameras.main.resetPostPipeline();
        const pipeline = scene.cameras.main.setPostPipeline('ColorMatrixPostFX');
        if (pipeline && pipeline.length > 0) {
          const fx = pipeline[0];
          if (fx && fx.set) {
            fx.set(matrix);
            scene._accessibilityFilter = true;
          }
        }
      } catch (e) {
        // Post-processing not supported in this renderer
      }
    }
  }

  applyHighContrast(scene) {
    if (scene.cameras && scene.cameras.main) {
      try {
        scene.cameras.main.setPostPipeline('ColorMatrixPostFX');
        const pipelines = scene.cameras.main.getPostPipeline('ColorMatrixPostFX');
        if (pipelines) {
          const fx = Array.isArray(pipelines) ? pipelines[pipelines.length - 1] : pipelines;
          if (fx && fx.brightness) {
            fx.brightness(0.15);
            fx.contrast(0.3);
          }
        }
      } catch (e) {
        // Post-processing not supported
      }
    }
  }
}

export const accessibilityManager = new AccessibilityManager();
