import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Nannerl } from '../sprites/Nannerl.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupPause } from '../utils/PauseHelper.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getMariaTheresaPhases } from '../mechanics/BossPhaseDefinitions.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { setupCamera, setupCoopCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2Scene' });
  }

  create() {
    setupPause(this);
    this.particles = new ParticleManager(this);
    this.coopMode = this.registry.get('coopMode') || false;
    this.lastCheckpoint = null;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(2);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(2);

    // Parallax background layers
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level2);
    const worldWidth = GAME_WIDTH * 4.2;

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'The Grand Tour', {
      font: '24px monospace',
      fill: '#90EE90',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1763–1766', {
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

    // Ground with gaps
    const groundSegments = [
      { start: 0, end: 300 },
      { start: 380, end: 700 },
      { start: 780, end: 1100 },
      { start: 1200, end: 1600 },
      { start: 1700, end: 2000 },
      { start: 2100, end: 2500 },
      { start: 2600, end: 2950 },
      { start: 3050, end: 3360 },
    ];

    groundSegments.forEach(seg => {
      for (let x = seg.start; x < seg.end; x += TILE_SIZE) {
        this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'forestGround')
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .refreshBody();
      }
    });

    // Static platforms
    this.oneWayPlatforms = this.physics.add.staticGroup();

    const platformData = [
      { x: 320, y: 380, w: 2 },
      { x: 180, y: 300, w: 2 },
      { x: 400, y: 240, w: 3 },
      { x: 650, y: 300, w: 2 },
      { x: 850, y: 250, w: 2 },
      { x: 1050, y: 300, w: 3 },
      { x: 1300, y: 240, w: 2 },
      { x: 1500, y: 200, w: 2 },
      { x: 1700, y: 280, w: 3 },
      { x: 1950, y: 220, w: 2 },
      { x: 2200, y: 260, w: 3 },
      { x: 2400, y: 200, w: 2 },
      { x: 2680, y: 260, w: 3 },
      { x: 2880, y: 200, w: 2 },
      { x: 3060, y: 260, w: 3 },
      { x: 3260, y: 220, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 200, y: 210, w: 1 },
      { x: 220, y: 130, w: 1 },
      { x: 460, y: 160, w: 1 },
      { x: 780, y: 160, w: 1 },
      { x: 950, y: 160, w: 1 },
      { x: 1200, y: 160, w: 1 },
      { x: 1170, y: 90, w: 1 },
      { x: 1690, y: 190, w: 1 },
      { x: 2700, y: 170, w: 1 },
      { x: 3080, y: 150, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.oneWayPlatforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Moving platforms
    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    const movingData = [
      { x: 750, y: 350, rangeX: 100, rangeY: 0 },
      { x: 1150, y: 200, rangeX: 0, rangeY: 80 },
      { x: 1600, y: 320, rangeX: 80, rangeY: 0 },
      { x: 2050, y: 160, rangeX: 0, rangeY: 60 },
    ];

    movingData.forEach(mp => {
      const plat = this.movingPlatforms.create(mp.x, mp.y, 'platform')
        .setDisplaySize(TILE_SIZE * 2, TILE_SIZE / 2);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);

      this.tweens.add({
        targets: plat,
        x: mp.x + mp.rangeX,
        y: mp.y + mp.rangeY,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Player 1
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Player 2 (co-op)
    this.nannerl = null;
    if (this.coopMode) {
      this.nannerl = new Nannerl(this, 140, GAME_HEIGHT - 100);
    }

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    // Drum Trolls (reduced for level 2 difficulty curve)
    const trollPositions = [500, 1400, 1900, 2750, 3100];
    if (this.coopMode) {
      trollPositions.push(750, 2950);
    }
    trollPositions.forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    // Broken Instruments (reduced for level 2)
    const biPositions = [1300, 2200, 2850, 3200];
    if (this.coopMode) {
      biPositions.push(1800, 3000);
    }
    biPositions.forEach(x => {
      const bi = new BrokenInstrument(this, x, GAME_HEIGHT - 80);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Floating notes
    const floatingNotes = [{ x: 600, y: 200 }, { x: 1100, y: 160 }, { x: 1800, y: 150 }, { x: 2650, y: 170 }, { x: 3050, y: 150 }];
    if (this.coopMode) {
      floatingNotes.push({ x: 900, y: 180 }, { x: 2920, y: 180 });
    }
    floatingNotes.forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 200, y: 260 }, { x: 420, y: 200 }, { x: 660, y: 260 },
      { x: 870, y: 210 }, { x: 1070, y: 260 }, { x: 1320, y: 200 },
      { x: 1520, y: 160 }, { x: 1720, y: 240 }, { x: 1970, y: 180 },
      { x: 2220, y: 220 }, { x: 2420, y: 160 }, { x: 2670, y: 220 },
      { x: 2880, y: 160 }, { x: 3070, y: 220 }, { x: 3260, y: 180 },
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
    this.instrument = this.physics.add.sprite(3220, GAME_HEIGHT - 100, 'flute');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 16);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Empress Maria Theresa
    this.bossManager = new BossPhaseManager(this, {
      x: 3120,
      y: GAME_HEIGHT - 120,
      texture: 'bossEmpressMaria',
      name: 'Empress Maria Theresa',
      activateX: 2700,
      phases: getMariaTheresaPhases(this.difficulty),
      dialogue: [
        '"A child prodigy seeks audience with the Empress?"',
        '"Prove yourself worthy of the Imperial court!"',
        '"My guards shall test your resolve, young Mozart."'
      ],
      victoryQuote: '"The Empress kissed me and took me on her lap."\n— Mozart, age 6'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level2';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: Above a gap, requires precise moving platform timing
      { x: 760, y: 100 },
      // Page 2: High above the vertical moving platform, top of the map
      { x: 1170, y: 80 },
      // Page 3: Far corner past the extended route, dangerous jump over gap
      { x: 3240, y: 100 },
    ];

    sheetMusicPositions.forEach((pos, index) => {
      const pageKey = `${levelKey}_page${index}`;
      if (savedSheetMusic[pageKey]) {
        this.sheetMusicCollected++;
        return;
      }
      const page = this.sheetMusicPages.create(pos.x, pos.y, 'sheetMusic');
      page.body.setAllowGravity(false);
      page.setDisplaySize(24, 32);
      page.setAlpha(0.8);
      page.setData('pageKey', pageKey);
      page.setData('pageIndex', index);

      this.tweens.add({
        targets: page,
        y: pos.y - 5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    this.registry.set('sheetMusicCurrentLevel', { found: this.sheetMusicCollected, total: 3 });

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.mozart, this.oneWayPlatforms, null, this._oneWayCheck, this);
    this.physics.add.collider(this.mozart, this.movingPlatforms, null, this._oneWayCheck, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.oneWayPlatforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);
    this.physics.add.overlap(this.mozart, this.sheetMusicPages, this.collectSheetMusic, null, this);

    // Set up musical combat projectile collisions
    if (this.mozart.combat) {
      this.mozart.combat.setupCollision(this.enemies);
    }

    // Set up instrument weapon collisions
    if (this.mozart.instrumentWeapons) {
      this.mozart.instrumentWeapons.setupCollision(this.enemies);
    }

    if (this.coopMode && this.nannerl) {
      this.physics.add.collider(this.nannerl, this.platforms);
      this.physics.add.collider(this.nannerl, this.oneWayPlatforms, null, this._oneWayCheck, this);
      this.physics.add.collider(this.nannerl, this.movingPlatforms, null, this._oneWayCheck, this);
      this.physics.add.overlap(this.nannerl, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.nannerl, this.collectibles, this.collectNote, null, this);
      this.physics.add.overlap(this.nannerl, this.instrument, this.collectInstrument, null, this);

      // Player bounce
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 900, y: GAME_HEIGHT - 64 },
      { x: 1500, y: GAME_HEIGHT - 64 },
      { x: 2300, y: GAME_HEIGHT - 64 },
      { x: 2920, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // Practice Stage (rhythm mini-game trigger)
    this.practiceStages = this.physics.add.staticGroup();
    const practiceStage = this.practiceStages.create(1800, GAME_HEIGHT - 80, 'practiceStage')
      .setDisplaySize(64, 48)
      .refreshBody();
    practiceStage.difficulty = 2;

    this.add.text(1800, GAME_HEIGHT - 115, '♪ Practice ♪', {
      font: '10px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: practiceStage,
      alpha: { from: 0.8, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.physics.add.overlap(this.mozart, this.practiceStages, this.enterPracticeStage, null, this);

    // Camera
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);

    if (this.coopMode && this.nannerl) {
      this.cameraTarget = this.add.zone(0, 0, 1, 1);
      setupCoopCamera(this, this.cameraTarget, worldWidth);
    } else {
      setupCamera(this, this.mozart, worldWidth);
    }

    this.mozart.setCollideWorldBounds(true);
    if (this.nannerl) this.nannerl.setCollideWorldBounds(true);

    // Background music
    if (this.sound.get('music_forest')) {
      this.sound.play('music_forest', { loop: true, volume: 0.25 });
    }

    // Handle resume from rhythm scene - apply power-up
    this.events.on('resume', () => {
      try {
        this.sound.resumeAll();
        if (this.mozartSoundtrack) this.mozartSoundtrack.play('level2');
        if (this.adaptiveMusic) this.adaptiveMusic.start('exploration');
      } catch (e) {
        // Ignore audio resume errors
      }
      const powerUp = this.registry.get('rhythmPowerUp');
      if (powerUp) {
        this.registry.set('rhythmPowerUp', null);
        this.applyRhythmPowerUp(powerUp);
      }
    });
    // Background music - Mozart's Magic Flute overture K.620
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level2');

    // Background music - adaptive system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('exploration');
  }
  _oneWayCheck(player, platform) {
    return player.body.bottom <= platform.body.top + 8 && player.body.velocity.y >= 0;
  }

  update(time, delta) {
    // If any dialogue is active, freeze gameplay
    if ((this.dialogueBox && this.dialogueBox.isActive) ||
        (this.bossManager && this.bossManager.dialogueActive)) {
      if (this.dialogueBox && this.dialogueBox.isActive) {
        if (Phaser.Input.Keyboard.JustDown(this.mozart.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ENTER'))) {
          this.dialogueBox.advance();
        }
      }
      return;
    }

    if (this.mozart && !this.mozart.isDead) this.mozart.update(time, delta);
    if (this.nannerl && !this.nannerl.isDead) this.nannerl.update();

    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }
    // Boss AI: Empress Maria Theresa multi-phase battle
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Camera follows midpoint in co-op
    if (this.coopMode && this.cameraTarget) {
      const p1 = this.mozart;
      const p2 = this.nannerl;
      if (p1 && p2 && !p1.isDead && !p2.isDead) {
        this.cameraTarget.setPosition((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      } else if (p1 && !p1.isDead) {
        this.cameraTarget.setPosition(p1.x, p1.y);
      } else if (p2 && !p2.isDead) {
        this.cameraTarget.setPosition(p2.x, p2.y);
      }
    } else {
      updateCameraLookAhead(this, this.mozart);
    }

    // Parallax scrolling
    this.parallaxBg.update(time, delta);

    // Fall death
    if (this.mozart && !this.mozart.isDead && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
    if (this.nannerl && !this.nannerl.isDead && this.nannerl.y > GAME_HEIGHT + 50) {
      this.nannerl.die();
    }

    // Check game over in co-op
    if (this.coopMode) {
      const bothDead = (this.mozart.isDead) && (this.nannerl && this.nannerl.isDead);
      const noLives = this.registry.get('lives') <= 0;
      if (bothDead || noLives) {
        this.time.delayedCall(1500, () => {
          this.scene.stop('UIScene');
          this.scene.start('MenuScene');
        });
      }
    }
  }

  playerBounce(player1, player2) {
    if (player1.body.velocity.y > 0 && player1.y < player2.y - 20) {
      player1.setVelocityY(-500);
    } else if (player2.body.velocity.y > 0 && player2.y < player1.y - 20) {
      player2.setVelocityY(-500);
    }
  }

  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
      enemy.destroy();
      this.enemyList = this.enemyList.filter(e => e !== enemy);
      player.setVelocityY(-200);

      const multiplier = this.combo.registerAction();
      const points = 100 * multiplier;
      const score = this.registry.get('score') + points;
      this.registry.set('score', score);
      this.registry.set('comboMultiplier', this.combo.getMultiplier());
      this.registry.set('comboCount', this.combo.getComboCount());

      // Achievement tracking
      const achievements = getAchievementManager();
      if (achievements) {
        achievements.onEnemyDefeated();
        achievements.onComboUpdate(this.combo.getComboCount());
      }

      if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.2 });

      // Victory fanfare on enemy defeat streak
      if (this.adaptiveMusic && multiplier >= 2) {
        this.adaptiveMusic.playVictoryFanfare();
      }
    } else {
      player.hit();
      // Damage stinger
      if (this.adaptiveMusic) {
        const lives = this.registry.get('lives') || 0;
        if (lives <= 1) {
          this.adaptiveMusic.playNearDeathStinger();
        } else {
          this.adaptiveMusic.playDamageStinger();
        }
      }

      // Achievement tracking - damage taken
      const achievements = getAchievementManager();
      if (achievements) achievements.onDamageTaken();
    }
  }

  collectNote(player, note) {
    this.particles.emitNoteCollect(note.x, note.y);
    note.destroy();

    // Refill energy on collectible pickup
    if (player.combat) {
      player.combat.addEnergy(10);
    }

    const multiplier = this.combo.registerAction();
    const points = 50 * multiplier;
    const score = this.registry.get('score') + points;
    this.registry.set('score', score);
    this.registry.set('comboMultiplier', this.combo.getMultiplier());
    this.registry.set('comboCount', this.combo.getComboCount());

    // Achievement tracking - combo
    const achievements = getAchievementManager();
    if (achievements) achievements.onComboUpdate(this.combo.getComboCount());

    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
  }

  collectInstrument(player, instrument) {
    this.particles.emitSparkleCollect(instrument.x, instrument.y);
    if (this.instrumentSparkle) this.instrumentSparkle.destroy();
    instrument.destroy();
    player.collectInstrument('flute');

    // Stop background music
    this.sound.stopAll();
    if (this.mozartSoundtrack) {
      this.mozartSoundtrack.stop();
    }
    if (this.adaptiveMusic) {
      this.adaptiveMusic.stop();
    }

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    const levelScore = this.registry.get('score') - this.levelStartScore;
    const timeBonus = ScoreManager.calculateTimeBonus(2, elapsedSeconds);

    this.registry.set('score', this.registry.get('score') + timeBonus);
    this.combo.destroy();

    // Mark level as completed
    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(2)) {
      completedLevels.push(2);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(2, elapsedSeconds);

    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 3);
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 2,
          levelScore,
          timeBonus,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 2 }
        });
      }
    });
  }

  collectSheetMusic(player, page) {
    const pageKey = page.getData('pageKey');

    // Spin + sparkle collection animation
    this.tweens.add({
      targets: page,
      angle: 720,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => page.destroy()
    });
    this.particles.emitSheetMusicCollect(page.x, page.y);

    // Update collection state
    this.sheetMusicCollected++;
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    savedSheetMusic[pageKey] = true;
    this.registry.set('sheetMusic', savedSheetMusic);
    localStorage.setItem('sheetMusicCollected', JSON.stringify(savedSheetMusic));

    this.registry.set('sheetMusicCurrentLevel', { found: this.sheetMusicCollected, total: 3 });

    // Check if all sheet music collected for this level
    if (this.sheetMusicCollected >= 3) {
      const achievements = getAchievementManager();
      if (achievements) achievements.onAllSheetMusicCollected();
    }

    const score = this.registry.get('score') + 200;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.4 });
    }

    page.body.enable = false;
  }

  activateCheckpoint(player, flag) {
    if (flag.activated) return;
    flag.activated = true;
    this.lastCheckpoint = { x: flag.x, y: flag.y };

    flag.setTint(0xFFD700);
    this.particles.emitSparkleCollect(flag.x, flag.y - 20);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.2 });
    }
  }

  enterPracticeStage(player, stage) {
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;
    if (this.rhythmCooldown) return;
    this.rhythmCooldown = true;
    this.time.delayedCall(1000, () => { this.rhythmCooldown = false; });

    try {
      // Stop adaptive music (uses its own Web Audio context, not Phaser sound)
      if (this.adaptiveMusic) this.adaptiveMusic.stop();
      if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
      this.sound.pauseAll();
    } catch (e) {
      // Ignore audio errors to prevent blocking scene transition
    }

    // Launch RhythmScene BEFORE pausing so it initializes while Level2 is still active
    this.scene.launch('RhythmScene', {
      returnScene: 'Level2Scene',
      difficulty: stage.difficulty || 2,
      playerX: player.x,
      playerY: player.y
    });
    this.scene.bringToTop('RhythmScene');
    this.scene.pause();
  }

  applyRhythmPowerUp(powerUp) {
    const indicator = this.add.text(this.mozart.x, this.mozart.y - 40, '⚡ SPEED BOOST ⚡', {
      font: '12px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: indicator,
      alpha: 0,
      y: indicator.y - 30,
      duration: 2000,
      onComplete: () => indicator.destroy()
    });

    const originalSpeed = this.mozart.moveSpeed || 200;
    this.mozart.moveSpeed = originalSpeed * powerUp.multiplier;
    this.mozart.setTint(0xFFD700);

    this.time.delayedCall(powerUp.duration, () => {
      if (this.mozart && !this.mozart.isDead) {
        this.mozart.moveSpeed = originalSpeed;
        this.mozart.clearTint();
      }
    });
  }
}

