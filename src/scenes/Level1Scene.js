import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Nannerl } from '../sprites/Nannerl.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupPause } from '../utils/PauseHelper.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { ChordDoor } from '../mechanics/ChordDoor.js';
import { setupCamera, setupCoopCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1Scene' });
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
    this.difficulty = getLevelDifficulty(1);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(1);

    // Parallax background layers
    const worldWidth = GAME_WIDTH * 3;
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level1);

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'Salzburg Beginnings', {
      font: '24px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1762', {
      font: '14px monospace',
      fill: '#c8a96e'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0.8);

    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });

    // Create platforms group
    this.platforms = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < GAME_WIDTH * 3; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'ground')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Platforms - Vienna buildings and ledges
    const platformData = [
      { x: 200, y: 360, w: 3 },
      { x: 400, y: 300, w: 2 },
      { x: 600, y: 340, w: 3 },
      { x: 850, y: 280, w: 2 },
      { x: 1050, y: 320, w: 3 },
      { x: 1250, y: 260, w: 2 },
      { x: 1450, y: 300, w: 3 },
      { x: 1650, y: 240, w: 2 },
      { x: 1900, y: 300, w: 4 },
      { x: 2150, y: 260, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 160, y: 270, w: 1 },
      { x: 130, y: 180, w: 1 },
      { x: 100, y: 90, w: 1 },
      { x: 340, y: 210, w: 1 },
      { x: 300, y: 130, w: 1 },
      { x: 590, y: 250, w: 1 },
      { x: 600, y: 155, w: 1 },
      { x: 870, y: 190, w: 1 },
      { x: 900, y: 100, w: 1 },
      { x: 1220, y: 170, w: 1 },
      { x: 1200, y: 90, w: 1 },
      { x: 1480, y: 210, w: 1 },
      { x: 1500, y: 130, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Buildings (decorative background)
    for (let i = 0; i < 8; i++) {
      const bx = 100 + i * 300;
      const bh = Phaser.Math.Between(3, 6);
      for (let j = 0; j < bh; j++) {
        this.add.image(bx, GAME_HEIGHT - TILE_SIZE - (j * TILE_SIZE) - TILE_SIZE / 2, 'building')
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setAlpha(0.3)
          .setDepth(-1);
      }
    }

    // Player 1
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Player 2 (co-op)
    this.nannerl = null;
    if (this.coopMode) {
      this.nannerl = new Nannerl(this, 140, GAME_HEIGHT - 100);
    }

    // Enemies
    this.enemies = this.physics.add.group();

    const singerPositions = [
      { x: 700, y: GAME_HEIGHT - 80 },
      { x: 1500, y: GAME_HEIGHT - 80 },
    ];

    // Add extra enemies for co-op balance
    if (this.coopMode) {
      singerPositions.push({ x: 900, y: GAME_HEIGHT - 80 });
      singerPositions.push({ x: 1800, y: GAME_HEIGHT - 80 });
    }

    this.singers = [];
    singerPositions.forEach(pos => {
      const singer = new Singer(this, pos.x, pos.y);
      this.enemies.add(singer);
      this.singers.push(singer);
    });

    const notePositions = [
      { x: 900, y: 200 },
    ];

    if (this.coopMode) {
      notePositions.push({ x: 1600, y: 200 });
    }

    this.notes = [];
    notePositions.forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.notes.push(note);
    });

    // Collectible music notes (score items)
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 250, y: 320 },
      { x: 450, y: 260 },
      { x: 650, y: 300 },
      { x: 900, y: 240 },
      { x: 1100, y: 280 },
      { x: 1300, y: 220 },
      { x: 1500, y: 260 },
      { x: 1700, y: 200 },
      { x: 1950, y: 260 },
    ];

    collectiblePositions.forEach(pos => {
      const note = this.collectibles.create(pos.x, pos.y, 'musicNote');
      note.body.setAllowGravity(false);
      note.setDisplaySize(20, 24);

      // Float animation
      this.tweens.add({
        targets: note,
        y: pos.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Instrument reward at end (hidden until boss defeated)
    this.instrument = this.physics.add.sprite(2200, GAME_HEIGHT - 100, 'violin');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(32, 48);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Leopold Mozart (Father/Teacher - Tutorial Boss)
    setupBoss(this, {
      x: 2100,
      y: GAME_HEIGHT - 120,
      texture: 'bossLeopoldMozart',
      name: 'Leopold Mozart',
      health: this.difficulty.boss.health,
      speed: this.difficulty.boss.speed,
      jumpForce: this.difficulty.boss.jumpForce,
      attackInterval: this.difficulty.boss.attackInterval,
      activateX: 1800,
      dialogue: [
        '"Wolfgang! You think you can surpass your own father?"',
        '"Show me what I taught you — prove your independence!"',
        '"Let us see if the student has outgrown the teacher..."'
      ],
      victoryQuote: '"I am convinced that my son can stand on his own."\n— Leopold Mozart'
    });
    this.bossProjectiles = this.physics.add.group();

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level1';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: High above the first building cluster, requires precise jump chain
      { x: 130, y: 120 },
      // Page 2: Far right, behind the last platform, requires backtracking from top
      { x: 1680, y: 140 },
      // Page 3: Hidden above the gap between platforms, high jump required
      { x: 880, y: 130 },
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

      // Subtle float animation
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

    // Composition melody collectibles (hidden in challenging spots)
    this.compositionCollector = new CompositionCollector(this, 1);
    const compositionNotePositions = [
      { x: 180, y: 140 },
      { x: 420, y: 180 },
      { x: 640, y: 150 },
      { x: 870, y: 160 },
      { x: 1070, y: 130 },
      { x: 1270, y: 170 },
      { x: 1470, y: 120 },
      { x: 1700, y: 140 }
    ];
    this.compositionCollector.create(compositionNotePositions);
    this.compositionCollector.setupOverlap(this.mozart);

    // Pitch Puzzle
    this.pitchPuzzle = new PitchPuzzle(this, 1, { x: 1600, y: GAME_HEIGHT - 130 });
    this.pitchPuzzle.create();
    this.pitchPuzzle.setupOverlap(this.mozart);
    // Chord Door puzzle (main path)
    this.chordDoor = new ChordDoor(this, 1, 1000, GAME_HEIGHT - TILE_SIZE, {
      health: true, score: true, compositionNote: true
    });
    this.chordDoor.setupOverlap(this.mozart);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

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
      this.physics.add.overlap(this.nannerl, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.nannerl, this.collectibles, this.collectNote, null, this);
      this.physics.add.overlap(this.nannerl, this.instrument, this.collectInstrument, null, this);

      // Player bounce: players can bounce off each other's heads
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 800, y: GAME_HEIGHT - 64 },
      { x: 1500, y: GAME_HEIGHT - 64 },
      { x: 1900, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // NPC - Haydn (teaches basic mechanics)
    const haydnData = NPC_DIALOGUES.haydn;
    this.haydn = new NPC(this, 300, GAME_HEIGHT - 80, haydnData.texture, {
      name: haydnData.name,
      dialogues: haydnData.firstMeeting,
      repeatDialogues: haydnData.repeat,
      interactionRadius: 70
    });

    // Dialogue system
    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    // Practice Stage (rhythm mini-game trigger)
    this.practiceStages = this.physics.add.staticGroup();
    const practiceStage = this.practiceStages.create(1200, GAME_HEIGHT - 80, 'practiceStage')
      .setDisplaySize(64, 48)
      .refreshBody();
    practiceStage.difficulty = 1;

    // Practice Stage label
    this.add.text(1200, GAME_HEIGHT - 115, '♪ Practice ♪', {
      font: '10px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Sparkle on practice stage
    this.tweens.add({
      targets: practiceStage,
      alpha: { from: 0.8, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.physics.add.overlap(this.mozart, this.practiceStages, this.enterPracticeStage, null, this);

    // Camera
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);

    if (this.coopMode && this.nannerl) {
      this.cameraTarget = this.add.zone(0, 0, 1, 1);
      setupCoopCamera(this, this.cameraTarget, GAME_WIDTH * 3);
    } else {
      setupCamera(this, this.mozart, GAME_WIDTH * 3);
    }

    // World bounds for players
    this.mozart.setCollideWorldBounds(true);
    if (this.nannerl) this.nannerl.setCollideWorldBounds(true);

    // Background music
    if (this.sound.get('music_vienna')) {
      this.sound.play('music_vienna', { loop: true, volume: 0.25 });
    }

    // Handle resume from rhythm scene - apply power-up
    this.events.on('resume', () => {
      this.sound.resumeAll();
      const powerUp = this.registry.get('rhythmPowerUp');
      if (powerUp) {
        this.registry.set('rhythmPowerUp', null);
        this.applyRhythmPowerUp(powerUp);
      }
    });
    // Background music - Mozart's Eine kleine Nachtmusik K.525
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level1');

    // Background music - adaptive system for combat transitions
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('exploration');
  }

  update(time, delta) {
    // If dialogue is active, only handle dialogue input
    if (this.dialogueBox && this.dialogueBox.isActive) {
      if (Phaser.Input.Keyboard.JustDown(this.mozart.spaceKey) ||
          Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ENTER'))) {
        this.dialogueBox.advance();
      }
      return;
    }

    if (this.mozart && !this.mozart.isDead) this.mozart.update(time, delta);
    if (this.nannerl && !this.nannerl.isDead) this.nannerl.update();

    this.singers.forEach(s => s.update());
    this.notes.forEach(n => n.update(time, delta));

    // NPC updates and interaction
    if (this.haydn) {
      this.haydn.update(this.mozart, this.dialogueBox);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.haydn.interact(this.dialogueBox);
      }
    }
    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }
    // Boss AI: Off-Key Conductor fires note projectiles
    // Boss AI: Leopold Mozart throws sheet music pages gently
    updateBossAI(this, time, (scene, t) => {
      const boss = scene.boss;
      const target = getBossTarget(scene);
      const speedMult = boss.phase === 3 ? 1.3 : boss.phase === 2 ? 1.15 : 1;

      if (target.x > boss.x + 30) {
        boss.setVelocityX(boss.speed * speedMult);
        boss.setFlipX(false);
      } else if (target.x < boss.x - 30) {
        boss.setVelocityX(-boss.speed * speedMult);
        boss.setFlipX(true);
      } else {
        boss.setVelocityX(0);
      }

      // Throws sheet music pages as gentle projectiles
      const interval = boss.attackInterval / boss.phase;
      if (t > boss.attackTimer) {
        boss.attackTimer = t + interval;
        const proj = scene.bossProjectiles.create(boss.x, boss.y - 10, 'bossProjectile');
        proj.body.setAllowGravity(false);
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, target.x, target.y);
        const speed = this.difficulty.bossProjectileSpeed + boss.phase * 20;
        proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        scene.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
      }
    });

    // Projectile collision with players
    if (this.bossProjectiles) {
      this.physics.add.overlap(this.mozart, this.bossProjectiles, (player, proj) => {
        proj.destroy();
        player.hit();
      });
      if (this.nannerl) {
        this.physics.add.overlap(this.nannerl, this.bossProjectiles, (player, proj) => {
          proj.destroy();
          player.hit();
        });
      }
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

    // Check game over in co-op (both dead or no lives)
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
    // If one player is above the other and falling, bounce them up
    if (player1.body.velocity.y > 0 && player1.y < player2.y - 20) {
      player1.setVelocityY(-500); // Extra height bounce
    } else if (player2.body.velocity.y > 0 && player2.y < player1.y - 20) {
      player2.setVelocityY(-500); // Extra height bounce
    }
  }

  hitEnemy(player, enemy) {
    // If player is falling on enemy, kill the enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
      enemy.destroy();
      this.singers = this.singers.filter(s => s !== enemy);
      this.notes = this.notes.filter(n => n !== enemy);
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

      SFXGenerator.play(this, 'sfx_defeatEnemy', 0.3);

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

    const multiplier = this.combo.registerAction();
    const points = 50 * multiplier;
    const score = this.registry.get('score') + points;
    this.registry.set('score', score);
    this.registry.set('comboMultiplier', this.combo.getMultiplier());
    this.registry.set('comboCount', this.combo.getComboCount());

    // Refill energy on collectible pickup
    if (player.combat) {
      player.combat.addEnergy(10);
    }

    // Achievement tracking - combo
    const achievements = getAchievementManager();
    if (achievements) achievements.onComboUpdate(this.combo.getComboCount());

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.3 });
    }
    SFXGenerator.play(this, 'sfx_collectNote', 0.25);
  }

  collectInstrument(player, instrument) {
    this.particles.emitSparkleCollect(instrument.x, instrument.y);
    if (this.instrumentSparkle) this.instrumentSparkle.destroy();
    instrument.destroy();
    player.collectInstrument('violin');

    // Stop background music
    this.sound.stopAll();
    if (this.mozartSoundtrack) {
      this.mozartSoundtrack.stop();
    }
    if (this.adaptiveMusic) {
      this.adaptiveMusic.stop();
    }

    // Calculate level score and time bonus
    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    const levelScore = this.registry.get('score') - this.levelStartScore;
    const timeBonus = ScoreManager.calculateTimeBonus(1, elapsedSeconds);

    // Add time bonus to total score
    this.registry.set('score', this.registry.get('score') + timeBonus);
    this.combo.destroy();

    // Mark level as completed
    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(1)) {
      completedLevels.push(1);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(1, elapsedSeconds);

    // Level complete - show results then transition
    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 2);
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 1,
          levelScore,
          timeBonus,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 1 }
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

    // Score bonus
    const score = this.registry.get('score') + 200;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.4 });
    }
    SFXGenerator.play(this, 'sfx_collectSheetMusic', 0.3);

    // Disable physics body immediately to prevent double-collection
    page.body.enable = false;
  }

  enterPracticeStage(player, stage) {
    // Only trigger if player presses up while overlapping
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;

    // Prevent re-triggering
    if (this.rhythmCooldown) return;
    this.rhythmCooldown = true;
    this.time.delayedCall(1000, () => { this.rhythmCooldown = false; });

    // Pause this scene and launch rhythm mini-game
    this.scene.pause();
    this.sound.pauseAll();
    this.scene.launch('RhythmScene', {
      returnScene: 'Level1Scene',
      difficulty: stage.difficulty || 1,
      playerX: player.x,
      playerY: player.y
    });
  }

  applyRhythmPowerUp(powerUp) {
    // Visual indicator
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

    // Apply speed multiplier
    const originalSpeed = this.mozart.moveSpeed || 200;
    this.mozart.moveSpeed = originalSpeed * powerUp.multiplier;
    this.mozart.setTint(0xFFD700);

    // Remove power-up after duration
    this.time.delayedCall(powerUp.duration, () => {
      if (this.mozart && !this.mozart.isDead) {
        this.mozart.moveSpeed = originalSpeed;
        this.mozart.clearTint();
      }
    });
  }

  activateCheckpoint(player, flag) {
    if (flag.activated) return;
    flag.activated = true;
    this.lastCheckpoint = { x: flag.x, y: flag.y };

    // Visual feedback - flag turns gold
    flag.setTint(0xFFD700);
    this.particles.emitSparkleCollect(flag.x, flag.y - 20);

    SFXGenerator.play(this, 'sfx_checkpoint', 0.3);
  }
}


