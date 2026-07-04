// @ts-check
/**
 * @typedef {import('../types.js').DifficultySettings} DifficultySettings
 */

/**
 * Per-level difficulty configuration for progressive challenge scaling.
 * 
 * Design targets:
 * - Level 1-2: Tutorial/easy (2-3 min completion, 2-4 enemies, forgiving boss)
 * - Level 3-4: Medium (3-4 min, 5-7 enemies, moderate boss)
 * - Level 5-6: Hard (4-5 min, 7-9 enemies, challenging boss)
 * - Level 7: Expert (5+ min, 8-10 enemies, final boss)
 */

export const DIFFICULTY = {
  // Player lives granted at level start (only applied if current lives < this)
  startingLives: {
    1: 4,
    2: 4,
    3: 3,
    4: 3,
    5: 3,
    6: 3,
    7: 3
  },

  // Damage multiplier per level (how much damage enemies deal)
  // 1.0 = one hit removes one life. <1 means chance to resist damage.
  enemyDamageMultiplier: {
    1: 0.5,   // 50% chance hit does no damage (forgiving)
    2: 0.7,   // 30% chance hit does no damage
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0
  },

  // Enemy speed multiplier per level (applied to base speeds)
  enemySpeedMultiplier: {
    1: 0.8,
    2: 0.9,
    3: 1.0,
    4: 1.1,
    5: 1.2,
    6: 1.3,
    7: 1.4
  },

  // Enemy aggression scaling (affects detection range and attack frequency)
  enemyAggressionMultiplier: {
    1: 0.6,
    2: 0.8,
    3: 1.0,
    4: 1.1,
    5: 1.2,
    6: 1.3,
    7: 1.5
  },

  // Boss configurations per level
  boss: {
    1: { health: 3, speed: 70, jumpForce: -280, attackInterval: 3200 },
    2: { health: 4, speed: 80, jumpForce: -320, attackInterval: 3000 },
    3: { health: 5, speed: 95, jumpForce: -340, attackInterval: 2600 },
    4: { health: 6, speed: 110, jumpForce: -360, attackInterval: 2200 },
    5: { health: 7, speed: 125, jumpForce: -370, attackInterval: 2000 },
    6: { health: 8, speed: 100, jumpForce: -380, attackInterval: 2400 },
    7: { health: 9, speed: 130, jumpForce: -400, attackInterval: 1800 }
  },

  // Maximum platform gap in pixels (must be achievable with coyote time jump)
  // Player jump covers ~240px horizontal at full speed with coyote time
  maxPlatformGap: {
    1: 180,
    2: 200,
    3: 220,
    4: 240,
    5: 250,
    6: 260,
    7: 280
  },

  // Target enemy count per level (ground + flying combined, solo mode)
  enemyCount: {
    1: 3,   // Very few - tutorial
    2: 5,   // Gentle introduction
    3: 6,   // Moderate
    4: 7,   // Increasing
    5: 8,   // Challenging
    6: 9,   // Hard
    7: 10   // Maximum
  },

  // Checkpoint interval target (pixels between checkpoints)
  checkpointInterval: 1200,

  // Boss projectile speed scaling
  bossProjectileSpeed: {
    1: 120,
    2: 140,
    3: 160,
    4: 180,
    5: 200,
    6: 190,
    7: 220
  }
};

/**
 * Get difficulty settings for a specific level.
 * @param {number} level - Level number (1-7)
 * @returns {DifficultySettings} The difficulty settings for the specified level
 */
export function getLevelDifficulty(level) {
  return {
    startingLives: DIFFICULTY.startingLives[level] || 3,
    enemyDamageMultiplier: DIFFICULTY.enemyDamageMultiplier[level] || 1.0,
    enemySpeedMultiplier: DIFFICULTY.enemySpeedMultiplier[level] || 1.0,
    enemyAggressionMultiplier: DIFFICULTY.enemyAggressionMultiplier[level] || 1.0,
    boss: DIFFICULTY.boss[level] || DIFFICULTY.boss[7],
    maxPlatformGap: DIFFICULTY.maxPlatformGap[level] || 280,
    enemyCount: DIFFICULTY.enemyCount[level] || 10,
    checkpointInterval: DIFFICULTY.checkpointInterval,
    bossProjectileSpeed: DIFFICULTY.bossProjectileSpeed[level] || 200
  };
}
