import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Nannerl } from '../sprites/Nannerl.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { SheetMusicBat } from '../sprites/enemies/SheetMusicBat.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupPause } from '../utils/PauseHelper.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { setupCamera, setupCoopCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { showBossDialogue } from '../utils/BossFight.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getColloredoPhases } from '../mechanics/BossPhaseDefinitions.js';

export class Level3Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level3Scene' });
  }

  create() {
    setupPause(this);
    this.bossDefeated = false;
    this.particles = new ParticleManager(this);
    this.coopMode = this.registry.get('coopMode') || false;
    this.lastCheckpoint = null;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(3);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(3);

    // Parallax background layers
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level3);
    const worldWidth = GAME_WIDTH * 4.5;

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, "Archbishop's Palace", {
      font: '24px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1772', {
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
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'palaceGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Palace platforms with more vertical complexity
    this.oneWayPlatforms = this.physics.add.staticGroup();

    const platformData = [
      { x: 200, y: 360, w: 2 },
      { x: 350, y: 280, w: 3 },
      { x: 550, y: 320, w: 2 },
      { x: 700, y: 240, w: 2 },
      { x: 900, y: 300, w: 3 },
      { x: 1100, y: 220, w: 2 },
      { x: 1300, y: 280, w: 3 },
      { x: 1500, y: 200, w: 2 },
      { x: 1700, y: 260, w: 2 },
      { x: 1900, y: 320, w: 3 },
      { x: 2200, y: 260, w: 2 },
      { x: 2400, y: 320, w: 3 },
      { x: 2600, y: 260, w: 2 },
      { x: 2820, y: 320, w: 3 },
      // Boss arena platforms
      { x: 3000, y: 340, w: 4 },
      { x: 3200, y: 260, w: 3 },
      { x: 3000, y: 180, w: 3 },
      { x: 3300, y: 180, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 120, y: 270, w: 1 },
      { x: 70, y: 190, w: 1 },
      { x: 360, y: 190, w: 1 },
      { x: 350, y: 110, w: 1 },
      { x: 600, y: 160, w: 1 },
      { x: 750, y: 160, w: 1 },
      { x: 1060, y: 140, w: 1 },
      { x: 1290, y: 190, w: 1 },
      { x: 1300, y: 110, w: 1 },
      { x: 2420, y: 220, w: 1 },
      { x: 2860, y: 210, w: 1 },
      { x: 3250, y: 140, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.oneWayPlatforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Player 1
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Player 2 (co-op)
    this.nannerl = null;
    if (this.coopMode) {
      this.nannerl = new Nannerl(this, 140, GAME_HEIGHT - 100);
    }

    // Regular enemies before boss
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    // Mix of all enemy types (6 total for medium difficulty)
    const singerPositions = [300, 1200, 2400, 2900];
    if (this.coopMode) singerPositions.push(500, 1000, 2700);
    singerPositions.forEach(x => {
      const singer = new Singer(this, x, GAME_HEIGHT - 80);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    const trollPositions = [600, 1600, 2500, 3000];
    if (this.coopMode) trollPositions.push(1400, 2800);
    trollPositions.forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    const noteEnemyPositions = [{ x: 450, y: 180 }, { x: 1100, y: 160 }, { x: 2550, y: 180 }, { x: 3150, y: 150 }];
    if (this.coopMode) noteEnemyPositions.push({ x: 800, y: 150 }, { x: 2860, y: 170 });
    noteEnemyPositions.forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    const biPositions = [900, 1400, 2300, 2750];
    if (this.coopMode) biPositions.push(1800, 3050);
    biPositions.forEach(x => {
      const bi = new BrokenInstrument(this, x, GAME_HEIGHT - 80);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Sheet Music Bats - fly in sine formation
    const batPositions = [{ x: 700, y: 130 }, { x: 1800, y: 120 }, { x: 2600, y: 140 }];
    if (this.coopMode) batPositions.push({ x: 1300, y: 110 });
    batPositions.forEach((pos, index) => {
      const bat = new SheetMusicBat(this, pos.x, pos.y, { pattern: 'sine', formationIndex: index });
      this.enemies.add(bat);
      this.enemyList.push(bat);
    });

    // Boss: The Discordant Maestro
    this.createBoss();

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 220, y: 320 }, { x: 370, y: 240 }, { x: 570, y: 280 },
      { x: 720, y: 200 }, { x: 920, y: 260 }, { x: 1120, y: 180 },
      { x: 1320, y: 240 }, { x: 1520, y: 160 }, { x: 1720, y: 220 },
      { x: 2250, y: 220 }, { x: 2480, y: 280 }, { x: 2710, y: 220 },
      { x: 3050, y: 300 }, { x: 3270, y: 220 },
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

    // Piano (instrument) - appears after boss defeat
    this.instrument = this.physics.add.sprite(3450, GAME_HEIGHT - 100, 'piano');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 32);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level3';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: Very high, above the initial platforms, requires wall-jumping skill
      { x: 380, y: 100 },
      // Page 2: Above the extended boss arena, only reachable from the highest platform
      { x: 3050, y: 80 },
      // Page 3: Behind the starting area, requires backtracking up high
      { x: 50, y: 140 },
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

    // Pitch Puzzle
    this.pitchPuzzle = new PitchPuzzle(this, 3, { x: 1500, y: GAME_HEIGHT - 130 });
    this.pitchPuzzle.create();
    this.pitchPuzzle.setupOverlap(this.mozart);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.mozart, this.oneWayPlatforms, null, this._oneWayCheck, this);
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
      this.physics.add.overlap(this.nannerl, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.nannerl, this.collectibles, this.collectNote, null, this);
      this.physics.add.overlap(this.nannerl, this.instrument, this.collectInstrument, null, this);
      this.physics.add.overlap(this.nannerl, this.boss, this.hitBoss, null, this);

      // Player bounce
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 700, y: GAME_HEIGHT - 64 },
      { x: 1400, y: GAME_HEIGHT - 64 },
      { x: 2400, y: GAME_HEIGHT - 64 },
      { x: 3000, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

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

    // Background music - starts with palace theme
    try {
      this.sound.play('music_palace', { loop: true, volume: 0.25 });
    } catch (e) { /* audio not available */ }

    // NPC - Salieri (rival who becomes ally)
    const salieriData = NPC_DIALOGUES.salieri;
    this.salieri = new NPC(this, 500, GAME_HEIGHT - 80, salieriData.texture, {
      name: salieriData.name,
      dialogues: salieriData.firstMeeting,
      repeatDialogues: salieriData.repeat,
      interactionRadius: 70
    });

    // Dialogue system
    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    // Background music - Mozart's Alla Turca K.331
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level3');

    // Background music - adaptive system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('exploration');

  }

  createBoss() {
    // Archbishop Colloredo - multi-phase boss fight
    this.bossManager = new BossPhaseManager(this, {
      x: 3300,
      y: GAME_HEIGHT - 120,
      texture: 'bossArchbishopColloredo',
      name: 'Archbishop Colloredo',
      activateX: 2900,
      phases: getColloredoPhases(this.difficulty),
      dialogue: [
        '"You ungrateful servant! You belong to me, Mozart!"',
        '"I shall bind you with obligations you cannot escape!"',
        '"No one leaves my service without permission!"'
      ],
      victoryQuote: '"I am no longer so unfortunate as to be in Salzburg service."\n— Mozart, 1781'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;
    this.bossDialogueShown = false;
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

    // NPC updates and interaction
    if (this.salieri) {
      this.salieri.update(this.mozart, this.dialogueBox);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.salieri.interact(this.dialogueBox);
      }
    }
    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
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

    // Boss AI: Archbishop Colloredo multi-phase battle
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Fall death
    if (this.mozart && !this.mozart.isDead && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
    if (this.nannerl && !this.nannerl.isDead && this.nannerl.y > GAME_HEIGHT + 50) {
      this.nannerl.die();
    }

    // Check game over in co-op
    if (this.coopMode && !this._gameOverTriggered) {
      const bothDead = (this.mozart.isDead) && (this.nannerl && this.nannerl.isDead);
      const noLives = this.registry.get('lives') <= 0;
      if (bothDead || noLives) {
        this._gameOverTriggered = true;
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
    player.collectInstrument('piano');

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
    const timeBonus = ScoreManager.calculateTimeBonus(3, elapsedSeconds);

    this.registry.set('score', this.registry.get('score') + timeBonus);
    this.combo.destroy();

    // Mark level as completed
    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(3)) {
      completedLevels.push(3);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(3, elapsedSeconds);

    this.cameras.main.fade(1500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 3,
          levelScore,
          timeBonus,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 3 }
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

}


