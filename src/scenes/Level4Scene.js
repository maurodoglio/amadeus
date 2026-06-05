import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getSalieriPhases } from '../mechanics/BossPhaseDefinitions.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { ChordDoor } from '../mechanics/ChordDoor.js';
import { setupCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level4Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level4Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);
    this.rhythmActive = false;
    this.rhythmTimer = 0;
    this.rhythmBeat = false;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(4);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(4);

    // Parallax background
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level4);

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'Vienna Opera', {
      font: '24px monospace',
      fill: '#FF6347',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1781', {
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
    for (let x = 0; x < GAME_WIDTH * 3; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'operaGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Opera house platforms (balconies, stages)
    const platformData = [
      { x: 200, y: 360, w: 3 },
      { x: 450, y: 300, w: 2 },
      { x: 650, y: 240, w: 3 },
      { x: 900, y: 320, w: 2 },
      { x: 1100, y: 260, w: 3 },
      { x: 1350, y: 200, w: 2 },
      { x: 1550, y: 280, w: 3 },
      { x: 1800, y: 220, w: 2 },
      { x: 2000, y: 300, w: 3 },
      { x: 2200, y: 240, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 230, y: 270, w: 1 },
      { x: 250, y: 180, w: 1 },
      { x: 550, y: 160, w: 1 },
      { x: 720, y: 160, w: 1 },
      { x: 1030, y: 170, w: 1 },
      { x: 1760, y: 150, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Rhythm platforms - only solid on the beat
    this.rhythmPlatforms = this.physics.add.staticGroup();
    this.rhythmPlatformSprites = [];

    const rhythmData = [
      { x: 350, y: 280 },
      { x: 800, y: 240 },
      { x: 1250, y: 220 },
      { x: 1700, y: 200 },
      { x: 2100, y: 180 },
    ];

    rhythmData.forEach(rp => {
      for (let i = 0; i < 2; i++) {
        const plat = this.rhythmPlatforms.create(rp.x + i * TILE_SIZE, rp.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody()
          .setTint(0xFF4500);
        this.rhythmPlatformSprites.push(plat);
      }
    });

    // Player
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    const singerPositions = [
      { x: 400, y: GAME_HEIGHT - 80 },
      { x: 750, y: GAME_HEIGHT - 80 },
      { x: 1150, y: GAME_HEIGHT - 80 },
      { x: 1600, y: GAME_HEIGHT - 80 },
    ];

    singerPositions.forEach(pos => {
      const singer = new Singer(this, pos.x, pos.y);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    const notePositions = [
      { x: 550, y: 200 },
      { x: 1000, y: 180 },
      { x: 1900, y: 150 },
    ];

    notePositions.forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 250, y: 320 }, { x: 470, y: 260 }, { x: 680, y: 200 },
      { x: 920, y: 280 }, { x: 1120, y: 220 }, { x: 1370, y: 160 },
      { x: 1570, y: 240 }, { x: 1820, y: 180 }, { x: 2020, y: 260 },
      { x: 2220, y: 200 },
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
    this.instrument = this.physics.add.sprite(2350, GAME_HEIGHT - 100, 'harpsichord');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 32);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Antonio Salieri - Musical duel
    this.bossManager = new BossPhaseManager(this, {
      x: 2250,
      y: GAME_HEIGHT - 120,
      texture: 'bossSalieri',
      name: 'Antonio Salieri',
      activateX: 1900,
      phases: getSalieriPhases(this.difficulty),
      dialogue: [
        '"Ah, the great Mozart... Let us see who truly commands music."',
        '"My dark melodies shall overwhelm your bright compositions!"',
        '"Only one of us can be the Emperor\'s Kapellmeister!"'
      ],
      victoryQuote: '"Salieri admitted that Mozart\'s music was sublime."\n— Historical accounts'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Rhythm beat indicator (UI)
    this.beatIndicator = this.add.circle(GAME_WIDTH / 2, 30, 15, 0xFF4500, 0.5)
      .setScrollFactor(0);
    this.beatText = this.add.text(GAME_WIDTH / 2, 30, '♪', {
      font: '16px serif', fill: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0);

    // Composition melody collectibles (Non più andrai - backstage areas)
    this.compositionCollector = new CompositionCollector(this, 4);
    const compositionNotePositions = [
      { x: 250, y: 130 },
      { x: 500, y: 110 },
      { x: 750, y: 140 },
      { x: 1000, y: 100 },
      { x: 1250, y: 120 },
      { x: 1500, y: 130 },
      { x: 1750, y: 110 }
    ];
    this.compositionCollector.create(compositionNotePositions);
    this.compositionCollector.setupOverlap(this.mozart);

    // Pitch Puzzle
    this.pitchPuzzle = new PitchPuzzle(this, 4, { x: 1400, y: GAME_HEIGHT - 130 });
    this.pitchPuzzle.create();
    this.pitchPuzzle.setupOverlap(this.mozart);
    // Chord Door puzzle (main path)
    this.chordDoor = new ChordDoor(this, 4, 1200, GAME_HEIGHT - TILE_SIZE, {
      health: true, score: true, compositionNote: true
    });
    this.chordDoor.setupOverlap(this.mozart);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.mozart, this.rhythmPlatforms);
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
    setupCamera(this, this.mozart, GAME_WIDTH * 3);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 800, y: GAME_HEIGHT - 64 },
      { x: 1500, y: GAME_HEIGHT - 64 },
      { x: 2000, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // NPC - Nannerl (Mozart's sister, gives power-up hints)
    const nannerlData = NPC_DIALOGUES.nannerlNPC;
    this.nannerlNPC = new NPC(this, 200, GAME_HEIGHT - 80, nannerlData.texture, {
      name: nannerlData.name,
      dialogues: nannerlData.firstMeeting,
      repeatDialogues: nannerlData.repeat,
      interactionRadius: 70
    });

    // Dialogue system
    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    // Mozart's Marriage of Figaro overture K.492
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level4');

    // Adaptive music system
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

    if (this.mozart) this.mozart.update(time, delta);
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    updateCameraLookAhead(this, this.mozart);

    // NPC updates and interaction
    if (this.nannerlNPC) {
      this.nannerlNPC.update(this.mozart, this.dialogueBox);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.nannerlNPC.interact(this.dialogueBox);
      }
    }
    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }
    // Boss AI: Antonio Salieri multi-phase battle
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Rhythm mechanic: platforms toggle on/off every 1.2 seconds
    this.rhythmTimer += delta;
    if (this.rhythmTimer >= 1200) {
      this.rhythmTimer = 0;
      this.rhythmBeat = !this.rhythmBeat;

      this.rhythmPlatformSprites.forEach(plat => {
        if (this.rhythmBeat) {
          plat.setAlpha(1);
          plat.body.enable = true;
          plat.setTint(0x00FF00);
        } else {
          plat.setAlpha(0.3);
          plat.body.enable = false;
          plat.setTint(0xFF4500);
        }
      });

      // Beat indicator pulse
      this.tweens.add({
        targets: this.beatIndicator,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 150,
        yoyo: true
      });
      this.beatIndicator.setFillStyle(this.rhythmBeat ? 0x00FF00 : 0xFF4500, 0.8);
    }

    // Parallax scrolling
    this.parallaxBg.update(time, delta);

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
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
    player.collectInstrument('harpsichord');

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    this.combo.destroy();

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(4)) {
      completedLevels.push(4);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(4, elapsedSeconds);

    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 4,
          levelScore: this.registry.get('score'),
          timeBonus: 0,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 4 }
        });
      }
    });
  }
}

