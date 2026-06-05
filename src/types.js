/**
 * @file Shared type definitions for the Amadeus platformer game.
 * These typedefs are used across multiple modules for consistent type annotations.
 */

/**
 * @typedef {Object} PlatformConfig
 * @property {number} x - X position of the platform
 * @property {number} y - Y position of the platform
 * @property {number} width - Width of the platform in pixels
 * @property {'static'|'moving'|'falling'|'ice'} [type] - Platform behavior type
 */

/**
 * @typedef {Object} EnemyConfig
 * @property {'ground'|'flying'|'ranged'|'boss'} type - Enemy archetype
 * @property {number} x - Spawn X position
 * @property {number} y - Spawn Y position
 * @property {'patrol'|'chase'|'stationary'|'flying'} [behavior] - Movement behavior
 * @property {number} [hp] - Hit points (defaults to enemy type default)
 */

/**
 * @typedef {Object} WeaponConfig
 * @property {string} name - Display name of the weapon
 * @property {number} damage - Base damage per hit
 * @property {number} cooldown - Cooldown between uses in milliseconds
 * @property {number} range - Effective range in pixels
 * @property {string} [projectileType] - Type of projectile fired (if ranged)
 * @property {number} [stunDuration] - Duration of stun effect in ms
 * @property {number} [charmDuration] - Duration of charm effect in ms
 * @property {number} [color] - Tint color for visual effects
 * @property {string} [icon] - Emoji icon for HUD display
 * @property {string} [description] - Human-readable description
 */

/**
 * @typedef {Object} BossPhaseConfig
 * @property {string} name - Phase display name
 * @property {number} hp - Hit points for this phase
 * @property {string[]} attacks - List of attack pattern names used in this phase
 * @property {string[]} [weaknesses] - Exploitable weaknesses during this phase
 * @property {function} [update] - Per-frame update function for this phase
 */

/**
 * @typedef {Object} LevelConfig
 * @property {PlatformConfig[]} platforms - Platform layout for the level
 * @property {EnemyConfig[]} enemies - Enemy placements
 * @property {{type: string, x: number, y: number}[]} collectibles - Collectible item placements
 * @property {'vienna'|'forest'|'palace'|'concert'|'dungeon'} theme - Visual/audio theme
 * @property {{name: string, phases: BossPhaseConfig[], texture: string, x: number, y: number}} [boss] - Boss configuration (if level has a boss)
 */

/**
 * @typedef {Object} DifficultySettings
 * @property {number} startingLives - Lives granted at level start
 * @property {number} enemyDamageMultiplier - Damage multiplier (1.0 = full, <1 = chance to resist)
 * @property {{health: number, speed: number, jumpForce: number, attackInterval: number}} boss - Boss stats
 * @property {number} maxPlatformGap - Maximum gap between platforms in pixels
 * @property {number} enemyCount - Target enemy count for the level
 * @property {number} checkpointInterval - Pixels between checkpoints
 * @property {number} bossProjectileSpeed - Speed of boss projectiles
 */
