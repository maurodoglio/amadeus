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
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getLeopoldPhases } from '../mechanics/BossPhaseDefinitions.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
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
    const worldWidth = GAME_WIDTH * 4;
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
    for (let x = 0; x < worldWidth; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'ground')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Platforms - Vienna buildings and ledges
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });

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
      { x: 2350, y: 320, w: 3 },
      { x: 2550, y: 260, w: 2 },
      { x: 2720, y: 220, w: 3 },
      { x: 2920, y: 300, w: 2 },
      { x: 3120, y: 240, w: 3 },
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
      { x: 2480, y: 200, w: 1 },
      { x: 2750, y: 170, w: 1 },
      { x: 3010, y: 140, w: 1 },
      // Boss arena platforms (reachable for jumping on boss)
      { x: 2700, y: 350, w: 4 },
      { x: 2850, y: 270, w: 3 },
      { x: 3000, y: 200, w: 3 },
      { x: 3150, y: 270, w: 3 },
      { x: 2950, y: 350, w: 4 },
      { x: 3100, y: 380, w: 2 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.oneWayPlatforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Buildings (decorative background)
    for (let i = 0; i < Math.ceil(worldWidth / 300); i++) {
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

    // Tutorial dialogue (first time only)
    if (!this.registry.get('tutorialShown')) {
      this.time.delayedCall(500, () => {
        this.dialogueBox = new DialogueBox(this);
        this.physics.pause();
        if (this.mozart) this.mozart.setVelocity(0, 0);
        this.dialogueBox.show([
          { name: 'Mozart', text: 'Welcome! Use ARROW KEYS to move and UP to jump.' },
          { name: 'Mozart', text: 'Collect musical notes for points. Jump on enemies to defeat them!' },
          { name: 'Mozart', text: 'Find the magic instrument at the end to become a great musician!' }
        ], () => {
          this.registry.set('tutorialShown', true);
          this.physics.resume();
        });

        // Handle dialogue input
        if (this.input.keyboard) {
          const spaceKey = this.input.keyboard?.addKey('SPACE');
          const enterKey = this.input.keyboard?.addKey('ENTER');
          if (spaceKey && enterKey) {
            const advanceDialogue = () => {
              if (this.dialogueBox && this.dialogueBox.isActive) {
                this.dialogueBox.advance();
              } else {
                spaceKey.off('down', advanceDialogue);
                enterKey.off('down', advanceDialogue);
              }
            };
            spaceKey.on('down', advanceDialogue);
            enterKey.on('down', advanceDialogue);
          }
        }
      });
    }

    // Enemies
    this.enemies = this.physics.add.group();

    const singerPositions = [
      { x: 700, y: GAME_HEIGHT - 80 },
      { x: 1500, y: GAME_HEIGHT - 80 },
      { x: 2450, y: GAME_HEIGHT - 80 },
      { x: 3000, y: GAME_HEIGHT - 80 },
    ];

    // Add extra enemies for co-op balance
    if (this.coopMode) {
      singerPositions.push({ x: 900, y: GAME_HEIGHT - 80 });
      singerPositions.push({ x: 1800, y: GAME_HEIGHT - 80 });
      singerPositions.push({ x: 2700, y: GAME_HEIGHT - 80 });
    }

    this.singers = [];
    singerPositions.forEach(pos => {
      const singer = new Singer(this, pos.x, pos.y);
      this.enemies.add(singer);
      this.singers.push(singer);
    });

    const notePositions = [
      { x: 900, y: 200 },
      { x: 2620, y: 190 },
      { x: 2960, y: 170 },
    ];

    if (this.coopMode) {
      notePositions.push({ x: 1600, y: 200 });
      notePositions.push({ x: 2820, y: 180 });
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
      { x: 2250, y: 280 },
      { x: 2480, y: 220 },
      { x: 2700, y: 180 },
      { x: 2920, y: 260 },
      { x: 3140, y: 200 },
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

    // Contextual hint near first enemy
    if (!this.registry.get('tutorialShown')) {
      const enemyHint = this.add.text(700, GAME_HEIGHT - 130, '↓ Jump on enemies!', {
        font: '11px monospace', fill: '#FFD700', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: enemyHint, alpha: 1, delay: 3000, duration: 1000 });

      const noteHint = this.add.text(250, 290, '↑ Collect notes!', {
        font: '11px monospace', fill: '#FFD700', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: noteHint, alpha: 1, delay: 5000, duration: 1000 });
    }

    // Instrument reward at end (hidden until boss defeated)
    this.instrument = this.physics.add.sprite(3150, GAME_HEIGHT - 100, 'violin');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(32, 48);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Leopold Mozart (Father/Teacher - Multi-phase boss)
    this.bossManager = new BossPhaseManager(this, {
      x: 3000,
      y: GAME_HEIGHT - 120,
      texture: 'bossLeopoldMozart',
      name: 'Leopold Mozart',
      activateX: 2600,
      phases: getLeopoldPhases(this.difficulty),
      dialogue: [
        '"Wolfgang! You think you can surpass your own father?"',
        '"Show me what I taught you — prove your independence!"',
        '"Let us see if the student has outgrown the teacher..."'
      ],
      victoryQuote: '"I am convinced that my son can stand on his own."\n— Leopold Mozart'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level1';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: High above the first building cluster, requires precise jump chain
      { x: 130, y: 120 },
      // Page 2: Far right, behind the extended platform run, requires backtracking from top
      { x: 2720, y: 140 },
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

      // Player bounce: players can bounce off each other's heads
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 800, y: GAME_HEIGHT - 64 },
      { x: 1500, y: GAME_HEIGHT - 64 },
      { x: 2400, y: GAME_HEIGHT - 64 },
      { x: 2900, y: GAME_HEIGHT - 64 },
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
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Camera
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);

    if (this.coopMode && this.nannerl) {
      this.cameraTarget = this.add.zone(0, 0, 1, 1);
      setupCoopCamera(this, this.cameraTarget, worldWidth);
    } else {
      setupCamera(this, this.mozart, worldWidth);
    }

    // World bounds for players
    this.mozart.setCollideWorldBounds(true);
    if (this.nannerl) this.nannerl.setCollideWorldBounds(true);

    // Background music
    try {
      this.sound.play('music_vienna', { loop: true, volume: 0.25 });
    } catch (e) { /* audio not available */ }

    // Background music - Mozart's Eine kleine Nachtmusik K.525
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level1');

    // Background music - adaptive system for combat transitions
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
        if ((this.mozart.spaceKey && Phaser.Input.Keyboard.JustDown(this.mozart.spaceKey)) ||
            (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.input.keyboard?.addKey('ENTER')))) {
          this.dialogueBox.advance();
        }
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
      if ((this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) ||
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
    // Boss AI: Leopold Mozart multi-phase battle
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

    // Check game over in co-op (both dead or no lives)
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
    // If one player is above the other and falling, bounce them up
    if (player1.body.velocity.y > 0 && player1.y < player2.y - 20) {
      player1.setVelocityY(-500); // Extra height bounce
    } else if (player2.body.velocity.y > 0 && player2.y < player1.y - 20) {
      player2.setVelocityY(-500); // Extra height bounce
    }
  }

  hitEnemy(player, enemy) {
    // Guard: if enemy was already destroyed, skip
    if (!enemy || !enemy.body || !enemy.active) return;

    // If player is falling on enemy, kill the enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
      // Stop any running animation before destroy to prevent stale frame references
      if (enemy.anims) enemy.anims.stop();
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
      player.hit(enemy);
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


