/**
 * Manages achievement tracking, unlocking, and persistence via localStorage.
 * Emits events through the Phaser game registry for UI notifications.
 */
export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete Level 1',
    icon: '🎵',
    secret: false
  },
  MAESTRO: {
    id: 'maestro',
    name: 'Maestro',
    description: 'Complete all 7 levels',
    icon: '🎼',
    secret: false
  },
  PERFECTIONIST: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a level without taking damage',
    icon: '💎',
    secret: false
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a level under the time limit',
    icon: '⚡',
    secret: false
  },
  COLLECTOR: {
    id: 'collector',
    name: 'Collector',
    description: 'Find all sheet music in a level',
    icon: '📜',
    secret: false
  },
  COMBO_MASTER: {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Get a 50x combo',
    icon: '🔥',
    secret: true
  },
  PACIFIST: {
    id: 'pacifist',
    name: 'Pacifist',
    description: 'Complete a level without defeating enemies',
    icon: '☮️',
    secret: true
  },
  COOP_HARMONY: {
    id: 'coop_harmony',
    name: 'Co-op Harmony',
    description: 'Complete a level in co-op mode',
    icon: '🤝',
    secret: true
  },
  HIDDEN_VIRTUOSO: {
    id: 'hidden_virtuoso',
    name: 'Hidden Virtuoso',
    description: 'Find all secret areas',
    icon: '🗝️',
    secret: true
  }
};

const STORAGE_KEY = 'amadeus_achievements';
const TIME_LIMITS = { 1: 60, 2: 90, 3: 120, 4: 120, 5: 150, 6: 150, 7: 180 };

export class AchievementManager {
  constructor(game) {
    this.game = game;
    this.unlocked = this.load();
    this.levelState = {};
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.unlocked));
    } catch { /* storage full or unavailable */ }
  }

  isUnlocked(achievementId) {
    return !!this.unlocked[achievementId];
  }

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  getTotalCount() {
    return Object.keys(ACHIEVEMENTS).length;
  }

  getProgressPercent() {
    return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
  }

  getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(a => ({
      ...a,
      unlocked: this.isUnlocked(a.id),
      unlockedAt: this.unlocked[a.id] || null
    }));
  }

  unlock(achievementKey) {
    const achievement = ACHIEVEMENTS[achievementKey];
    if (!achievement || this.isUnlocked(achievement.id)) return false;

    this.unlocked[achievement.id] = Date.now();
    this.save();

    // Emit event for the popup UI
    this.game.events.emit('achievement-unlocked', achievement);
    return true;
  }

  // Called when a level starts to reset tracking state
  onLevelStart(levelNumber) {
    this.levelState = {
      level: levelNumber,
      damageTaken: 0,
      enemiesDefeated: 0,
      startTime: Date.now()
    };
  }

  // Called when player takes damage
  onDamageTaken() {
    this.levelState.damageTaken = (this.levelState.damageTaken || 0) + 1;
  }

  // Called when an enemy is defeated
  onEnemyDefeated() {
    this.levelState.enemiesDefeated = (this.levelState.enemiesDefeated || 0) + 1;
  }

  // Called when combo count changes
  onComboUpdate(comboCount) {
    if (comboCount >= 50) {
      this.unlock('COMBO_MASTER');
    }
  }

  // Called when a level is completed
  onLevelComplete(levelNumber, elapsedSeconds) {
    const coopMode = this.game.registry.get('coopMode') || false;

    // First Steps
    if (levelNumber === 1) {
      this.unlock('FIRST_STEPS');
    }

    // Maestro - all 7 levels completed
    const completedLevels = this.game.registry.get('completedLevels') || [];
    if (completedLevels.length >= 7) {
      this.unlock('MAESTRO');
    }

    // Perfectionist - no damage taken
    if (this.levelState.damageTaken === 0) {
      this.unlock('PERFECTIONIST');
    }

    // Speed Demon - under time limit
    const timeLimit = TIME_LIMITS[levelNumber] || 120;
    if (elapsedSeconds < timeLimit) {
      this.unlock('SPEED_DEMON');
    }

    // Pacifist - no enemies defeated
    if (this.levelState.enemiesDefeated === 0) {
      this.unlock('PACIFIST');
    }

    // Co-op Harmony
    if (coopMode) {
      this.unlock('COOP_HARMONY');
    }
  }

  // Called when all sheet music in a level is collected
  onAllSheetMusicCollected() {
    this.unlock('COLLECTOR');
  }

  // Called when all secret areas are found
  onAllSecretsFound() {
    this.unlock('HIDDEN_VIRTUOSO');
  }
}

// Singleton instance - initialized from main.js after game creation
let instance = null;

export function initAchievementManager(game) {
  instance = new AchievementManager(game);
  return instance;
}

export function getAchievementManager() {
  return instance;
}
