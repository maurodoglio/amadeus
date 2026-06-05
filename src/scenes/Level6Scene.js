import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { ChordDoor } from '../mechanics/ChordDoor.js';
import { setupCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level6Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level6Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;
    this.lastCheckpoint = null;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(6);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(6);

    // Parallax background
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level6);

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'The Requiem Mystery', {
      font: '24px monospace',
      fill: '#9370DB',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1791', {
      font: '14px monospace',
      fill: '#c8a96e'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0.8);

    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });

    // Platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < GAME_WIDTH * 3.2; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave ceiling (top boundary)
    for (let x = 0; x < GAME_WIDTH * 3.2; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave platforms (stalactites and stalagmites as platforms)
    const platformData = [
      { x: 200, y: 360, w: 2 },
      { x: 380, y: 300, w: 3 },
      { x: 600, y: 340, w: 2 },
      { x: 780, y: 260, w: 2 },
      { x: 950, y: 320, w: 3 },
      { x: 1150, y: 240, w: 2 },
      { x: 1350, y: 300, w: 3 },
      { x: 1550, y: 220, w: 2 },
      { x: 1750, y: 280, w: 2 },
      { x: 1950, y: 200, w: 3 },
      { x: 2150, y: 260, w: 2 },
      { x: 2350, y: 300, w: 3 },
      // Stepping-stone platforms for bonus collectibles
      { x: 360, y: 210, w: 1 },
      { x: 650, y: 170, w: 1 },
      { x: 830, y: 170, w: 1 },
      { x: 1120, y: 160, w: 1 },
      { x: 1350, y: 210, w: 1 },
      { x: 1590, y: 140, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Player
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    [450, 850, 1250, 1650, 2050].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [700, 1100, 1500, 1900, 2300].forEach(x => {
      const bi = new BrokenInstrument(this, x, GAME_HEIGHT - 80);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 220, y: 320 }, { x: 400, y: 260 }, { x: 620, y: 300 },
      { x: 800, y: 220 }, { x: 970, y: 280 }, { x: 1170, y: 200 },
      { x: 1370, y: 260 }, { x: 1570, y: 180 }, { x: 1770, y: 240 },
      { x: 1970, y: 160 }, { x: 2170, y: 220 }, { x: 2370, y: 260 },
    ];

    collectiblePositions.forEach(pos => {
      const note = this.collectibles.create(pos.x, pos.y, 'musicNote');
      note.body.setAllowGravity(false);
      note.setDisplaySize(20, 24);
      this.tweens.add({
        targets: note,
        y: pos.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Instrument at end (hidden until boss defeated)
    this.instrument = this.physics.add.sprite(2500, GAME_HEIGHT - 100, 'drums');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 36);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: The Grey Messenger - commissioned the Requiem
    setupBoss(this, {
      x: 2400,
      y: GAME_HEIGHT - 120,
      texture: 'bossGreyMessenger',
      name: 'The Grey Messenger',
      health: this.difficulty.boss.health,
      speed: this.difficulty.boss.speed,
      jumpForce: this.difficulty.boss.jumpForce,
      attackInterval: this.difficulty.boss.attackInterval,
      activateX: 2050,
      dialogue: [
        '"I come with a commission... a Requiem Mass."',
        '"Who sends me? That you need not know..."',
        '"Complete the work, Mozart. Time grows short."'
      ],
      victoryQuote: '"I feel that I shall not last much longer... the Requiem... for myself."\n— Mozart, 1791'
    });

    // Darkness overlay - limited visibility
    this.darkness = this.add.graphics();
    this.darkness.setScrollFactor(0);
    this.darkness.setDepth(100);

    // Glow light around player
    this.glowRadius = 120;

    // Composition melody collectibles (Lacrimosa - hidden in darkness)
    this.compositionCollector = new CompositionCollector(this, 6);
    const compositionNotePositions = [
      { x: 350, y: 120 },
      { x: 600, y: 100 },
      { x: 850, y: 130 },
      { x: 1100, y: 90 },
      { x: 1350, y: 110 },
      { x: 1600, y: 100 },
      { x: 1850, y: 120 }
    ];
    this.compositionCollector.create(compositionNotePositions);
    this.compositionCollector.setupOverlap(this.mozart);

    // Pitch Puzzle
    this.pitchPuzzle = new PitchPuzzle(this, 6, { x: 1300, y: GAME_HEIGHT - 130 });
    this.pitchPuzzle.create();
    this.pitchPuzzle.setupOverlap(this.mozart);
    // Chord Door puzzle (main path)
    this.chordDoor = new ChordDoor(this, 6, 1000, GAME_HEIGHT - TILE_SIZE, {
      health: true, score: true, compositionNote: true
    });
    this.chordDoor.setupOverlap(this.mozart);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Set up musical combat projectile collisions
    if (this.mozart.combat) {
      this.mozart.combat.setupCollision(this.enemies);
    }

    // Set up instrument weapon collisions
    if (this.mozart.instrumentWeapons) {
      this.mozart.instrumentWeapons.setupCollision(this.enemies);
    }

    // Camera
    setupCamera(this, this.mozart, GAME_WIDTH * 3.2);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.2, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 700, y: GAME_HEIGHT - 64 },
      { x: 1400, y: GAME_HEIGHT - 64 },
      { x: 2050, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // Mozart's Lacrimosa from Requiem K.626
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level6');

    // Adaptive music system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('tension');
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update(time, delta);
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    updateCameraLookAhead(this, this.mozart);

    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }
    // Boss AI: Crystal Drummer - shockwave ground pounds
    // Boss AI: The Grey Messenger - teleports, shadow attacks, disappears/reappears
    updateBossAI(this, time, (scene, t) => {
      const boss = scene.boss;
      const target = getBossTarget(scene);
      const speedMult = boss.phase === 3 ? 1.5 : boss.phase === 2 ? 1.2 : 1;

      if (target.x > boss.x + 30) {
        boss.setVelocityX(boss.speed * speedMult);
        boss.setFlipX(false);
      } else if (target.x < boss.x - 30) {
        boss.setVelocityX(-boss.speed * speedMult);
        boss.setFlipX(true);
      } else {
        boss.setVelocityX(0);
      }

      // Teleport and shadow attack: disappears, reappears near player
      const interval = boss.attackInterval / boss.phase;
      if (t > boss.attackTimer && (boss.body.blocked.down || boss.body.touching.down)) {
        boss.attackTimer = t + interval;

        // Teleport effect: fade out, reposition, fade in
        scene.tweens.add({
          targets: boss,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            if (!boss.active) return;
            // Reappear near player but with some offset
            const offset = Phaser.Math.RND.pick([-150, 150]);
            const newX = Phaser.Math.Clamp(target.x + offset, 100, scene.physics.world.bounds.width - 100);
            boss.setPosition(newX, boss.y);
            scene.tweens.add({
              targets: boss,
              alpha: 1,
              duration: 300
            });
            // Screen shake on reappear
            scene.particles.screenShake(0.012 * boss.phase, 300);
            scene.particles.emitStomp(boss.x, boss.y + 20);
            // Push nearby player away
            if (Math.abs(target.x - boss.x) < 150) {
              const pushDir = target.x > boss.x ? 1 : -1;
              target.setVelocityX(pushDir * 200 * boss.phase);
            }
          }
        });
      }
    });

    // Draw darkness with circular cutout around player
    this.updateDarkness();

    // Parallax scrolling
    this.parallaxBg.update(time, delta);

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  updateDarkness() {
    this.darkness.clear();
    this.darkness.fillStyle(0x000000, 0.85);
    this.darkness.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Create a "light" effect by drawing a radial gradient-like circle
    const playerScreenX = this.mozart.x - this.cameras.main.scrollX;
    const playerScreenY = this.mozart.y - this.cameras.main.scrollY;

    // Pulsing glow effect
    const pulse = Math.sin(this.time.now / 500) * 10;
    const radius = this.glowRadius + pulse;

    // Clear circle around player using blendMode
    this.darkness.setBlendMode(Phaser.BlendModes.ERASE);
    this.darkness.fillStyle(0xFFFFFF, 1);
    this.darkness.fillCircle(playerScreenX, playerScreenY, radius);

    // Smaller bright core
    this.darkness.fillCircle(playerScreenX, playerScreenY, radius * 0.6);

    this.darkness.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      enemy.destroy();
      this.enemyList = this.enemyList.filter(e => e !== enemy);
      player.setVelocityY(-200);
      const score = this.registry.get('score') + 100;
      this.registry.set('score', score);
      this.combo.registerAction();
      this.registry.set('comboMultiplier', this.combo.getMultiplier());
      this.registry.set('comboCount', this.combo.getComboCount());

      // Achievement tracking
      const achievements = getAchievementManager();
      if (achievements) {
        achievements.onEnemyDefeated();
        achievements.onComboUpdate(this.combo.getComboCount());
      }

      if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.2 });

      // Victory fanfare
      if (this.adaptiveMusic) this.adaptiveMusic.playVictoryFanfare();
    } else {
      player.hit();
      if (this.adaptiveMusic) this.adaptiveMusic.playDamageStinger();

      // Achievement tracking - damage taken
      const achievements = getAchievementManager();
      if (achievements) achievements.onDamageTaken();
    }
  }

  collectNote(player, note) {
    note.destroy();

    // Refill energy on collectible pickup
    if (player.combat) {
      player.combat.addEnergy(10);
    }

    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);
    this.combo.registerAction();
    this.registry.set('comboMultiplier', this.combo.getMultiplier());
    this.registry.set('comboCount', this.combo.getComboCount());

    // Achievement tracking - combo
    const achievements = getAchievementManager();
    if (achievements) achievements.onComboUpdate(this.combo.getComboCount());

    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
    // Collecting notes slightly increases visibility
    this.glowRadius = Math.min(this.glowRadius + 5, 180);
  }

  activateCheckpoint(player, flag) {
    if (flag.activated) return;
    flag.activated = true;
    flag.setTint(0x00FF00);
    this.lastCheckpoint = flag;
    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.2 });
    }
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('drums');

    if (this.darkness) {
      this.tweens.add({ targets: this.darkness, alpha: 0, duration: 800 });
    }
    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    this.combo.destroy();

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(6)) {
      completedLevels.push(6);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(6, elapsedSeconds);

    // Light up the cave on instrument collect
    this.tweens.add({
      targets: this.darkness,
      alpha: 0,
      duration: 800
    });

    this.cameras.main.fade(1500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 6,
          levelScore: this.registry.get('score'),
          timeBonus: 0,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 6 }
        });
      }
    });
  }
}

