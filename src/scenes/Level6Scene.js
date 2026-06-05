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
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getGreyMessengerPhases } from '../mechanics/BossPhaseDefinitions.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
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
    const worldWidth = GAME_WIDTH * 4.2;

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
    for (let x = 0; x < worldWidth; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave ceiling (top boundary)
    for (let x = 0; x < worldWidth; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave platforms (stalactites and stalagmites as platforms)
    this.oneWayPlatforms = this.physics.add.staticGroup();

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
      { x: 2580, y: 240, w: 2 },
      { x: 2800, y: 320, w: 3 },
      { x: 3040, y: 240, w: 2 },
      { x: 3260, y: 280, w: 3 },
      { x: 1240, y: 320, w: 2 },
      { x: 1480, y: 180, w: 2 },
      { x: 1720, y: 330, w: 2 },
      { x: 1960, y: 150, w: 2 },
      { x: 2180, y: 290, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 360, y: 210, w: 1 },
      { x: 650, y: 170, w: 1 },
      { x: 830, y: 170, w: 1 },
      { x: 1120, y: 160, w: 1 },
      { x: 1350, y: 210, w: 1 },
      { x: 1590, y: 140, w: 1 },
      { x: 2650, y: 180, w: 1 },
      { x: 3090, y: 170, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.oneWayPlatforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Player
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    [450, 850, 1250, 1650, 2050, 2500, 2950].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [700, 1100, 1500, 1900, 2300, 2700, 3150].forEach(x => {
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
      { x: 2570, y: 200 }, { x: 2790, y: 260 }, { x: 3020, y: 200 }, { x: 3250, y: 240 },
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
    this.instrument = this.physics.add.sprite(3300, GAME_HEIGHT - 100, 'drums');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 36);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: The Grey Messenger - commissioned the Requiem
    this.bossManager = new BossPhaseManager(this, {
      x: 3200,
      y: GAME_HEIGHT - 120,
      texture: 'bossGreyMessenger',
      name: 'The Grey Messenger',
      activateX: 2800,
      phases: getGreyMessengerPhases(this.difficulty),
      dialogue: [
        '"I come with a commission... a Requiem Mass."',
        '"Who sends me? That you need not know..."',
        '"Complete the work, Mozart. Time grows short."'
      ],
      victoryQuote: '"I feel that I shall not last much longer... the Requiem... for myself."\n— Mozart, 1791'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Darkness overlay - limited visibility
    this.darkness = this.add.graphics();
    this.darkness.setScrollFactor(0);
    this.darkness.setDepth(100);

    // Glow light around player
    this.glowRadius = 120;

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.mozart, this.oneWayPlatforms, null, this._oneWayCheck, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.oneWayPlatforms);

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
    setupCamera(this, this.mozart, worldWidth);
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 700, y: GAME_HEIGHT - 64 },
      { x: 1200, y: GAME_HEIGHT - 64 },
      { x: 2050, y: GAME_HEIGHT - 64 },
      { x: 2850, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // Instrument Lesson Portal (mini-game trigger)
    this.lessonPortals = this.physics.add.staticGroup();
    const lessonPortal = this.lessonPortals.create(1300, GAME_HEIGHT - 80, 'practiceStage')
      .setDisplaySize(64, 48)
      .setTint(0x66aaff)
      .refreshBody();
    lessonPortal.difficulty = 5;

    this.add.text(1300, GAME_HEIGHT - 115, '♪ Lesson ♪', {
      font: '10px monospace',
      fill: '#66AAFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: lessonPortal,
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.physics.add.overlap(this.mozart, this.lessonPortals, this.enterInstrumentLesson, null, this);

    // Mozart's Lacrimosa from Requiem K.626
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level6');

    // Adaptive music system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('tension');

    // Handle resume from instrument lesson
    this.events.on('resume', () => {
      this.sound.resumeAll();
      this.time.delayedCall(300, () => { this.lessonEntered = false; });
      const bonus = this.registry.get('lessonBonus');
      if (bonus) {
        this.registry.set('lessonBonus', null);
        const currentScore = this.registry.get('score') || 0;
        this.registry.set('score', currentScore + bonus);
        const indicator = this.add.text(this.mozart.x, this.mozart.y - 40, `+${bonus} ♪`, {
          font: '14px monospace', fill: '#66AAFF', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);
        this.tweens.add({
          targets: indicator, y: indicator.y - 30, alpha: 0, duration: 1500,
          onComplete: () => indicator.destroy()
        });
      }
    });
  }
  _oneWayCheck(player, platform) {
    return player.body.bottom <= platform.body.top + 8 && player.body.velocity.y >= 0;
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
    // Boss AI: The Grey Messenger multi-phase battle
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Draw darkness with circular cutout around player
    this.updateDarkness();

    // Parallax scrolling
    this.parallaxBg.update(time, delta);

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  enterInstrumentLesson(player, portal) {
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;
    if (this.lessonEntered) return;
    this.lessonEntered = true;
    this.scene.pause();
    this.sound.pauseAll();
    this.scene.launch('InstrumentLessonScene', { difficulty: portal.difficulty, instrument: 'drums', level: 6, returnScene: 'Level6Scene' });
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

