import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getMozartShadowPhases } from '../mechanics/BossPhaseDefinitions.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { ChordDoor } from '../mechanics/ChordDoor.js';
import { setupCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level7Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level7Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;
    this.lastCheckpoint = null;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(7);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(7);

    // Parallax background
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level7);

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'Eternal Legacy', {
      font: '24px monospace',
      fill: '#E0E0FF',
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

    // Low gravity for this level
    this.physics.world.gravity.y = 400;

    // Platforms
    this.platforms = this.physics.add.staticGroup();

    // Floating cloud/stone platforms (no continuous ground - sky level)
    const platformData = [
      { x: 50, y: 400, w: 4 },
      { x: 250, y: 340, w: 3 },
      { x: 450, y: 280, w: 2 },
      { x: 350, y: 200, w: 2 },
      { x: 600, y: 360, w: 3 },
      { x: 750, y: 260, w: 2 },
      { x: 900, y: 180, w: 3 },
      { x: 1050, y: 320, w: 2 },
      { x: 1200, y: 240, w: 3 },
      { x: 1400, y: 160, w: 2 },
      { x: 1350, y: 360, w: 3 },
      { x: 1550, y: 280, w: 2 },
      { x: 1700, y: 200, w: 3 },
      { x: 1900, y: 320, w: 2 },
      { x: 2050, y: 240, w: 3 },
      { x: 2250, y: 160, w: 2 },
      { x: 2200, y: 360, w: 3 },
      { x: 2450, y: 280, w: 4 },
      // Stepping-stone platforms for bonus collectibles
      { x: 380, y: 120, w: 1 },
      { x: 1240, y: 160, w: 1 },
      { x: 1630, y: 140, w: 1 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        const plat = this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
        plat.setTint(0xCCCCFF);
      }
    });

    // Decorative clouds
    for (let i = 0; i < 12; i++) {
      const cx = Phaser.Math.Between(0, GAME_WIDTH * 3.2);
      const cy = Phaser.Math.Between(50, GAME_HEIGHT - 100);
      const cloud = this.add.ellipse(cx, cy, Phaser.Math.Between(60, 120), Phaser.Math.Between(20, 40), 0xFFFFFF, 0.15);
      cloud.setDepth(-1);
      this.tweens.add({
        targets: cloud,
        x: cx + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Player
    this.mozart = new Mozart(this, 100, 350);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    [400, 900, 1400, 1900].forEach(x => {
      const singer = new Singer(this, x, 300);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    [{ x: 600, y: 200 }, { x: 1100, y: 150 }, { x: 1600, y: 130 }, { x: 2100, y: 120 }].forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    [800, 1300, 2000].forEach(x => {
      const bi = new BrokenInstrument(this, x, 280);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 270, y: 300 }, { x: 470, y: 240 }, { x: 620, y: 320 },
      { x: 770, y: 220 }, { x: 920, y: 140 }, { x: 1070, y: 280 },
      { x: 1220, y: 200 }, { x: 1420, y: 120 }, { x: 1570, y: 240 },
      { x: 1720, y: 160 }, { x: 1920, y: 280 }, { x: 2070, y: 200 },
      { x: 2270, y: 120 },
    ];

    collectiblePositions.forEach(pos => {
      const note = this.collectibles.create(pos.x, pos.y, 'musicNote');
      note.body.setAllowGravity(false);
      note.setDisplaySize(20, 24);
      this.tweens.add({
        targets: note,
        y: pos.y - 15,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Instrument at end (hidden until boss defeated)
    this.instrument = this.physics.add.sprite(2550, 240, 'harp');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(36, 48);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Mozart's Shadow (Self-Doubt) - Mirror match
    this.bossManager = new BossPhaseManager(this, {
      x: 2450,
      y: 200,
      texture: 'bossMozartShadow',
      name: "Mozart's Shadow",
      activateX: 2100,
      phases: getMozartShadowPhases(this.difficulty),
      dialogue: [
        '"You cannot escape yourself, Wolfgang..."',
        '"Every note you write, I write in darkness."',
        '"To defeat me, you must outplay your own doubt!"'
      ],
      victoryQuote: '"Neither a lofty degree of intelligence nor imagination... go to the making of genius. Love, love, love, that is the soul of genius."\n— Mozart'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Composition melody collectibles (Jupiter fugue - sky platforms)
    this.compositionCollector = new CompositionCollector(this, 7);
    const compositionNotePositions = [
      { x: 400, y: 80 },
      { x: 800, y: 100 },
      { x: 1200, y: 70 },
      { x: 1600, y: 90 }
    ];
    this.compositionCollector.create(compositionNotePositions);
    this.compositionCollector.setupOverlap(this.mozart);

    // Pitch Puzzle
    this.pitchPuzzle = new PitchPuzzle(this, 7, { x: 1300, y: GAME_HEIGHT - 130 });
    this.pitchPuzzle.create();
    this.pitchPuzzle.setupOverlap(this.mozart);
    // Chord Door puzzle (main path)
    this.chordDoor = new ChordDoor(this, 7, 1000, GAME_HEIGHT - TILE_SIZE, {
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

    // Checkpoint flags (on wider platforms in the sky)
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 700, y: 340 },
      { x: 1400, y: 300 },
      { x: 2100, y: 260 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // NPC - Young Beethoven (secret encounter, hidden high up)
    const beethovenData = NPC_DIALOGUES.beethoven;
    this.beethoven = new NPC(this, 920, 100, beethovenData.texture, {
      name: beethovenData.name,
      dialogues: beethovenData.firstMeeting,
      repeatDialogues: beethovenData.repeat,
      interactionRadius: 70
    });

    // Dialogue system
    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    // Mozart's Jupiter Symphony K.551 fugue
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level7');

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
    if (this.beethoven) {
      this.beethoven.update(this.mozart, this.dialogueBox);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.beethoven.interact(this.dialogueBox);
      }
    }
    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Sync Mozart soundtrack boss mode with game state
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }
    // Boss AI: Mozart's Shadow multi-phase battle (4 phases)
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Parallax scrolling
    this.parallaxBg.update(time, delta);

    // Fall death (fall off bottom of sky)
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
    player.collectInstrument('harp');

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    this.combo.destroy();

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(7)) {
      completedLevels.push(7);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(7, elapsedSeconds);

    // Restore gravity before transitioning
    this.physics.world.gravity.y = 800;

    this.cameras.main.fade(1500, 255, 255, 255, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('ConcertScene');
      }
    });
  }
}

