/**
 * Centralized animation registration for all game characters.
 * Generates multi-frame sprite sheets and registers Phaser animations.
 */
export class AnimationManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Register all character animations. Call once after textures are generated.
   */
  registerAll() {
    this.registerMozartAnimations();
    this.registerNPCAnimations();
    this.registerEnemyAnimations();
    this.registerBossAnimations();
  }

  registerMozartAnimations() {
    const scene = this.scene;

    // Idle: 4 frames — gentle sway with occasional wig adjust
    if (!scene.anims.exists('mozart_idle')) {
      scene.anims.create({
        key: 'mozart_idle',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [0, 1, 2, 1] }),
        frameRate: 4,
        repeat: -1
      });
    }

    // Run: 6 frames — cape flowing, smooth multi-frame run cycle
    if (!scene.anims.exists('mozart_run')) {
      scene.anims.create({
        key: 'mozart_run',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [3, 4, 5, 6, 7, 8] }),
        frameRate: 10,
        repeat: -1
      });
    }

    // Walk (slower): uses run frames at lower framerate
    if (!scene.anims.exists('mozart_walk')) {
      scene.anims.create({
        key: 'mozart_walk',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [3, 4, 5, 6, 7, 8] }),
        frameRate: 8,
        repeat: -1
      });
    }

    // Jump ascent: arms up
    if (!scene.anims.exists('mozart_jump_up')) {
      scene.anims.create({
        key: 'mozart_jump_up',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [9, 10] }),
        frameRate: 8,
        repeat: 0
      });
    }

    // Jump descent: tuck
    if (!scene.anims.exists('mozart_jump_down')) {
      scene.anims.create({
        key: 'mozart_jump_down',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [11, 12] }),
        frameRate: 8,
        repeat: 0
      });
    }

    // Legacy jump (fallback)
    if (!scene.anims.exists('mozart_jump')) {
      scene.anims.create({
        key: 'mozart_jump',
        frames: [{ key: 'mozart', frame: 9 }],
        frameRate: 1
      });
    }

    // Attack: dramatic conductor pose (4 frames)
    if (!scene.anims.exists('mozart_attack')) {
      scene.anims.create({
        key: 'mozart_attack',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [13, 14, 15, 16] }),
        frameRate: 12,
        repeat: 0
      });
    }

    // Damage: wig askew, stagger (3 frames)
    if (!scene.anims.exists('mozart_damage')) {
      scene.anims.create({
        key: 'mozart_damage',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [17, 18, 19] }),
        frameRate: 10,
        repeat: 0
      });
    }

    // Victory: theatrical bow (4 frames)
    if (!scene.anims.exists('mozart_victory')) {
      scene.anims.create({
        key: 'mozart_victory',
        frames: scene.anims.generateFrameNumbers('mozart', { frames: [20, 21, 22, 23] }),
        frameRate: 6,
        repeat: 0
      });
    }
  }

  registerNPCAnimations() {
    const scene = this.scene;
    const npcKeys = ['npc_haydn', 'npc_salieri', 'npc_nannerl', 'npc_beethoven'];

    for (const key of npcKeys) {
      if (!scene.textures.exists(key)) continue;

      // Idle sway: 4 frames
      if (!scene.anims.exists(`${key}_idle`)) {
        scene.anims.create({
          key: `${key}_idle`,
          frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
          frameRate: 4,
          repeat: -1
        });
      }

      // Turn to face: 2 frames
      if (!scene.anims.exists(`${key}_turn`)) {
        scene.anims.create({
          key: `${key}_turn`,
          frames: scene.anims.generateFrameNumbers(key, { frames: [0, 4] }),
          frameRate: 6,
          repeat: 0
        });
      }
    }
  }

  registerEnemyAnimations() {
    const scene = this.scene;

    // Dissonant Note: pulse/vibrate (4 frames)
    if (scene.textures.exists('dissonantNote') && !scene.anims.exists('dissonantNote_pulse')) {
      scene.anims.create({
        key: 'dissonantNote_pulse',
        frames: scene.anims.generateFrameNumbers('dissonantNote', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // Dissonant Note aggro: color shift (4 frames)
    if (scene.textures.exists('dissonantNote') && !scene.anims.exists('dissonantNote_aggro')) {
      scene.anims.create({
        key: 'dissonantNote_aggro',
        frames: scene.anims.generateFrameNumbers('dissonantNote', { frames: [4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
      });
    }
  }

  registerBossAnimations() {
    const scene = this.scene;

    // Salieri conducting idle (4 frames)
    if (scene.textures.exists('bossSalieri') && !scene.anims.exists('bossSalieri_idle')) {
      scene.anims.create({
        key: 'bossSalieri_idle',
        frames: scene.anims.generateFrameNumbers('bossSalieri', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    // Colloredo pounds staff (4 frames)
    if (scene.textures.exists('bossArchbishopColloredo') && !scene.anims.exists('bossColloredo_idle')) {
      scene.anims.create({
        key: 'bossColloredo_idle',
        frames: scene.anims.generateFrameNumbers('bossArchbishopColloredo', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }
  }
}
