import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { Nannerl } from '../sprites/Nannerl.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupPause } from '../utils/PauseHelper.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';
import { PitchPuzzle } from '../mechanics/PitchPuzzle.js';
import { ChordDoor } from '../mechanics/ChordDoor.js';
import { setupCamera, setupCoopCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';

export class BaseLevelScene extends Phaser.Scene {
  constructor(config) {
    super(config);
  }

  // Subclasses MUST override this
  getLevelConfig() {
    throw new Error('getLevelConfig() must be implemented by subclass');
  }

  create() {
    const config = this.getLevelConfig();
    this.levelConfig = config;

    // Common initialization
    setupPause(this);
    this.particles = new ParticleManager(this);
    this.coopMode = this.registry.get('coopMode') || false;
    this.lastCheckpoint = null;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(config.levelNumber);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(config.levelNumber);

    // Parallax background
    this.parallaxBg = new ParallaxBackground(this, config.parallaxConfig);

    // Level title
    this.createLevelTitle(config);

    // Platforms
    this.createPlatforms(config);

    // Players
    this.createPlayers(config);

    // Enemies
    this.createEnemies(config);

    // Collectibles
    this.createCollectibles(config);

    // Instrument reward
    this.createInstrument(config);

    // Boss
    this.createBoss(config);

    // Sheet music (optional)
    if (config.sheetMusicPositions) {
      this.createSheetMusic(config);
    }

    // Composition collector
    this.createCompositionCollector(config);

    // Pitch Puzzle & Chord Door
    this.createPuzzles(config);

    // Collisions
    this.setupCollisions(config);

    // Checkpoints
    this.createCheckpoints(config);

    // NPCs (optional)
    if (config.npc) {
      this.createNPC(config);
    }

    // Practice stage / mini-game portal (optional)
    if (config.practiceStage) {
      this.createPracticeStage(config);
    }

    // Camera
    this.setupLevelCamera(config);

    // Music
    this.setupMusic(config);

    // Resume handler
    this.setupResumeHandler(config);

    // Hook for subclass-specific setup
    this.createLevelSpecific(config);
  }

  // --- Creation methods (can be overridden) ---

  createLevelTitle(config) {
    const title = this.add.text(GAME_WIDTH / 2, 50, config.title, {
      font: '24px monospace',
      fill: config.titleColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, config.year, {
      font: '14px monospace',
      fill: '#c8a96e'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0.8);

    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });
  }

  createPlatforms(config) {
    this.platforms = this.physics.add.staticGroup();

    // Ground
    if (config.groundTexture) {
      if (config.groundSegments) {
        // Segmented ground (with gaps)
        config.groundSegments.forEach(seg => {
          for (let x = seg.start; x < seg.end; x += TILE_SIZE) {
            this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, config.groundTexture)
              .setDisplaySize(TILE_SIZE, TILE_SIZE)
              .refreshBody();
          }
        });
      } else {
        // Full ground
        for (let x = 0; x < config.worldWidth; x += TILE_SIZE) {
          this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, config.groundTexture)
            .setDisplaySize(TILE_SIZE, TILE_SIZE)
            .refreshBody();
        }
      }
    }

    // Ceiling (optional, Level 6 uses it)
    if (config.ceiling) {
      for (let x = 0; x < config.worldWidth; x += TILE_SIZE) {
        this.platforms.create(x + TILE_SIZE / 2, TILE_SIZE / 2, config.ceiling.texture)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .refreshBody();
      }
    }

    // Static platforms (one-way: passable from below)
    this.oneWayPlatforms = this.physics.add.staticGroup();
    if (config.platformData) {
      config.platformData.forEach(p => {
        for (let i = 0; i < p.w; i++) {
          const plat = this.oneWayPlatforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
            .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
            .refreshBody();
          if (p.tint) plat.setTint(p.tint);
        }
      });
    }

    // Moving platforms (optional)
    if (config.movingPlatforms) {
      this.movingPlatforms = this.physics.add.group({
        allowGravity: false,
        immovable: true
      });

      config.movingPlatforms.forEach(mp => {
        const plat = this.movingPlatforms.create(mp.x, mp.y, 'platform')
          .setDisplaySize(TILE_SIZE * 2, TILE_SIZE / 2);
        plat.body.setAllowGravity(false);
        plat.body.setImmovable(true);

        this.tweens.add({
          targets: plat,
          x: mp.x + (mp.rangeX || 0),
          y: mp.y + (mp.rangeY || 0),
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }

    // Buildings (decorative, optional)
    if (config.buildings) {
      const b = config.buildings;
      for (let i = 0; i < b.count; i++) {
        const bx = b.startX + i * b.spacing;
        const bh = Phaser.Math.Between(3, 6);
        for (let j = 0; j < bh; j++) {
          this.add.image(bx, GAME_HEIGHT - TILE_SIZE - (j * TILE_SIZE) - TILE_SIZE / 2, 'building')
            .setDisplaySize(TILE_SIZE, TILE_SIZE)
            .setAlpha(0.3)
            .setDepth(-1);
        }
      }
    }
  }

  createPlayers(config) {
    const pos = config.playerStartPos || { x: 100, y: GAME_HEIGHT - 100 };
    this.mozart = new Mozart(this, pos.x, pos.y);

    this.nannerl = null;
    if (this.coopMode) {
      this.nannerl = new Nannerl(this, pos.x + 40, pos.y);
    }
  }

  createEnemies(config) {
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    const enemies = config.enemies || {};
    const coopExtra = (this.coopMode && config.coopExtraEnemies) ? config.coopExtraEnemies : {};

    // Singers
    const singerPositions = [...(enemies.singers || []), ...(coopExtra.singers || [])];
    singerPositions.forEach(pos => {
      const p = typeof pos === 'number' ? { x: pos, y: GAME_HEIGHT - 80 } : pos;
      const singer = new Singer(this, p.x, p.y);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    // Drum Trolls
    const trollPositions = [...(enemies.drumTrolls || []), ...(coopExtra.drumTrolls || [])];
    trollPositions.forEach(pos => {
      const p = typeof pos === 'number' ? { x: pos, y: GAME_HEIGHT - 80 } : pos;
      const troll = new DrumTroll(this, p.x, p.y);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    // Dissonant Notes
    const notePositions = [...(enemies.dissonantNotes || []), ...(coopExtra.dissonantNotes || [])];
    notePositions.forEach(pos => {
      const p = typeof pos === 'number' ? { x: pos, y: 200 } : pos;
      const note = new DissonantNote(this, p.x, p.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    // Broken Instruments
    const biPositions = [...(enemies.brokenInstruments || []), ...(coopExtra.brokenInstruments || [])];
    biPositions.forEach(pos => {
      const p = typeof pos === 'number' ? { x: pos, y: GAME_HEIGHT - 80 } : pos;
      const bi = new BrokenInstrument(this, p.x, p.y);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });
  }

  createCollectibles(config) {
    this.collectibles = this.physics.add.group();

    (config.collectiblePositions || []).forEach(pos => {
      const note = this.collectibles.create(pos.x, pos.y, 'musicNote');
      note.body.setAllowGravity(false);
      note.setDisplaySize(20, 24);
      this.tweens.add({
        targets: note,
        y: pos.y - (config.collectibleFloatRange || 10),
        duration: config.collectibleFloatDuration || 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createInstrument(config) {
    const inst = config.instrument;
    if (!inst) return;
    this.instrument = this.physics.add.sprite(inst.x, inst.y, inst.texture);
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(inst.displaySize.w, inst.displaySize.h);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;
  }

  createBoss(config) {
    const boss = config.boss;
    if (!boss) return;

    this.bossManager = new BossPhaseManager(this, {
      x: boss.x,
      y: boss.y,
      texture: boss.texture,
      name: boss.name,
      activateX: boss.activateX,
      phases: boss.phasesGetter(this.difficulty),
      dialogue: boss.dialogue,
      victoryQuote: boss.victoryQuote
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;
  }

  createSheetMusic(config) {
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = `level${config.levelNumber}`;
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    config.sheetMusicPositions.forEach((pos, index) => {
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

    this.registry.set('sheetMusicCurrentLevel', { found: this.sheetMusicCollected, total: config.sheetMusicPositions.length });
  }

  createCompositionCollector(config) {
    const comp = config.compositionNotes;
    if (!comp) return;
    this.compositionCollector = new CompositionCollector(this, comp.levelNum);
    this.compositionCollector.create(comp.positions);
    this.compositionCollector.setupOverlap(this.mozart);
  }

  createPuzzles(config) {
    if (config.pitchPuzzle) {
      const pp = config.pitchPuzzle;
      this.pitchPuzzle = new PitchPuzzle(this, pp.levelNum, { x: pp.position.x, y: pp.position.y });
      this.pitchPuzzle.create();
      this.pitchPuzzle.setupOverlap(this.mozart);
    }

    if (config.chordDoor) {
      const cd = config.chordDoor;
      this.chordDoor = new ChordDoor(this, cd.levelNum, cd.x, cd.y, cd.rewards);
      this.chordDoor.setupOverlap(this.mozart);
    }
  }

  setupCollisions(config) {
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    // One-way platforms: only collide when player is falling onto them from above
    this.physics.add.collider(this.mozart, this.oneWayPlatforms, null, this._oneWayCheck, this);
    this.physics.add.collider(this.enemies, this.oneWayPlatforms);

    if (this.movingPlatforms) {
      this.physics.add.collider(this.mozart, this.movingPlatforms, null, this._oneWayCheck, this);
    }

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    if (this.instrument) {
      this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);
    }
    if (this.sheetMusicPages) {
      this.physics.add.overlap(this.mozart, this.sheetMusicPages, this.collectSheetMusic, null, this);
    }

    // Musical combat
    if (this.mozart.combat) {
      this.mozart.combat.setupCollision(this.enemies);
    }
    if (this.mozart.instrumentWeapons) {
      this.mozart.instrumentWeapons.setupCollision(this.enemies);
    }

    // Co-op collisions
    if (this.coopMode && this.nannerl) {
      this.physics.add.collider(this.nannerl, this.platforms);
      this.physics.add.collider(this.nannerl, this.oneWayPlatforms, null, this._oneWayCheck, this);
      if (this.movingPlatforms) {
        this.physics.add.collider(this.nannerl, this.movingPlatforms, null, this._oneWayCheck, this);
      }
      this.physics.add.overlap(this.nannerl, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.nannerl, this.collectibles, this.collectNote, null, this);
      if (this.instrument) {
        this.physics.add.overlap(this.nannerl, this.instrument, this.collectInstrument, null, this);
      }
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }
  }

  /** One-way platform check: only collide when player is above the platform and falling */
  _oneWayCheck(player, platform) {
    const playerBottom = player.body.bottom;
    const platTop = platform.body.top || platform.body.y;
    // Allow collision only when player's feet are at or above platform top
    // and the player is moving downward (or stationary)
    return playerBottom <= platTop + 8 && player.body.velocity.y >= 0;
  }

  createCheckpoints(config) {
    this.checkpoints = this.physics.add.staticGroup();

    (config.checkpointPositions || []).forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);
  }

  createNPC(config) {
    const npcConfig = config.npc;
    const npcData = NPC_DIALOGUES[npcConfig.dataKey];
    this.npcInstance = new NPC(this, npcConfig.x, npcConfig.y, npcData.texture, {
      name: npcData.name,
      dialogues: npcData.firstMeeting,
      repeatDialogues: npcData.repeat,
      interactionRadius: 70
    });

    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  createPracticeStage(config) {
    const ps = config.practiceStage;

    if (ps.type === 'rhythm') {
      this.practiceStages = this.physics.add.staticGroup();
      const stage = this.practiceStages.create(ps.x, GAME_HEIGHT - 80, 'practiceStage')
        .setDisplaySize(64, 48)
        .refreshBody();
      stage.difficulty = ps.difficulty;

      this.add.text(ps.x, GAME_HEIGHT - 115, '♪ Practice ♪', {
        font: '10px monospace',
        fill: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.tweens.add({
        targets: stage,
        alpha: { from: 0.8, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.physics.add.overlap(this.mozart, this.practiceStages, this.enterPracticeStage, null, this);
    } else if (ps.type === 'melody') {
      this.melodyPortals = this.physics.add.staticGroup();
      const portal = this.melodyPortals.create(ps.x, GAME_HEIGHT - 80, 'practiceStage')
        .setDisplaySize(64, 48)
        .setTint(0xaa66ff)
        .refreshBody();
      portal.difficulty = ps.difficulty;

      this.add.text(ps.x, GAME_HEIGHT - 115, '♪ Melody ♪', {
        font: '10px monospace',
        fill: '#AA66FF',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.tweens.add({
        targets: portal,
        alpha: { from: 0.7, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      this.physics.add.overlap(this.mozart, this.melodyPortals, this.enterMelodyMemory, null, this);
    }
  }

  setupLevelCamera(config) {
    this.physics.world.setBounds(0, 0, config.worldWidth, GAME_HEIGHT);

    if (this.coopMode && this.nannerl) {
      this.cameraTarget = this.add.zone(0, 0, 1, 1);
      setupCoopCamera(this, this.cameraTarget, config.worldWidth);
    } else {
      setupCamera(this, this.mozart, config.worldWidth);
    }

    this.mozart.setCollideWorldBounds(true);
    if (this.nannerl) this.nannerl.setCollideWorldBounds(true);
  }

  setupMusic(config) {
    if (config.backgroundMusic && this.sound.get(config.backgroundMusic.key)) {
      this.sound.play(config.backgroundMusic.key, { loop: true, volume: config.backgroundMusic.volume || 0.25 });
    }

    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play(config.soundtrackKey);

    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start(config.adaptiveMusicMode || 'exploration');
  }

  setupResumeHandler(config) {
    this._baseResumeHandler = () => {
      this.sound.resumeAll();

      // Rhythm power-up
      const powerUp = this.registry.get('rhythmPowerUp');
      if (powerUp) {
        this.registry.set('rhythmPowerUp', null);
        this.applyRhythmPowerUp(powerUp);
      }

      // Melody memory bonus
      const bonus = this.registry.get('melodyMemoryBonus');
      if (bonus) {
        this.registry.set('melodyMemoryBonus', null);
        const currentScore = this.registry.get('score') || 0;
        this.registry.set('score', currentScore + bonus);
        const indicator = this.add.text(this.mozart.x, this.mozart.y - 40, `+${bonus} ♪`, {
          font: '14px monospace',
          fill: '#AA66FF',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        this.tweens.add({
          targets: indicator,
          y: indicator.y - 30,
          alpha: 0,
          duration: 1500,
          onComplete: () => indicator.destroy()
        });
      }
    };
    this.events.on('resume', this._baseResumeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('resume', this._baseResumeHandler);
      if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
      if (this.adaptiveMusic) this.adaptiveMusic.stop();
    });
  }

  // Hook for subclass-specific setup (override in subclasses)
  createLevelSpecific(_config) {
    // No-op by default
  }

  // --- Update ---

  update(time, delta) {
    // If dialogue is active, only handle dialogue input
    if (this.dialogueBox && this.dialogueBox.isActive) {
      if ((this.mozart.spaceKey && Phaser.Input.Keyboard.JustDown(this.mozart.spaceKey)) ||
          (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.input.keyboard?.addKey('ENTER')))) {
        this.dialogueBox.advance();
      }
      return;
    }

    if (this.mozart && !this.mozart.isDead) this.mozart.update(time, delta);
    if (this.nannerl && !this.nannerl.isDead) this.nannerl.update();

    // Enemy updates
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // NPC updates
    if (this.npcInstance) {
      this.npcInstance.update(this.mozart, this.dialogueBox);
      if ((this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.npcInstance.interact(this.dialogueBox);
      }
    }

    // Adaptive music
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    if (this.mozartSoundtrack && this.bossActive && !this.mozartSoundtrack.isBossMode) {
      this.mozartSoundtrack.setBossMode(true);
    }

    // Boss
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Camera
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

    // Parallax
    this.parallaxBg.update(time, delta);

    // Level-specific update hook
    this.updateLevelSpecific(time, delta);

    // Fall death
    if (this.mozart && !this.mozart.isDead && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
    if (this.nannerl && !this.nannerl.isDead && this.nannerl.y > GAME_HEIGHT + 50) {
      this.nannerl.die();
    }

    // Game over check
    const noLives = this.registry.get('lives') <= 0;
    if (this.coopMode) {
      const bothDead = (this.mozart.isDead) && (this.nannerl && this.nannerl.isDead);
      if (bothDead || noLives) {
        this.showGameOver();
      }
    } else if (this.mozart && this.mozart.isDead && noLives) {
      this.showGameOver();
    }
  }

  // Hook for subclass-specific update logic (override in subclasses)
  updateLevelSpecific(_time, _delta) {
    // No-op by default
  }

  // --- Shared game logic methods ---

  playerBounce(player1, player2) {
    if (player1.body.velocity.y > 0 && player1.y < player2.y - 20) {
      player1.setVelocityY(-500);
    } else if (player2.body.velocity.y > 0 && player2.y < player1.y - 20) {
      player2.setVelocityY(-500);
    }
  }

  hitEnemy(player, enemy) {
    // Guard: if enemy was already destroyed, skip
    if (!enemy || !enemy.body || !enemy.active) return;

    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
      // Stop any running animation before destroy to prevent stale frame references
      if (enemy.anims) enemy.anims.stop();
      enemy.destroy();
      this.enemyList = this.enemyList.filter(e => e !== enemy);
      player.setVelocityY(-200);

      const multiplier = this.combo.registerAction();
      const points = 100 * multiplier;
      const score = this.registry.get('score') + points;
      this.registry.set('score', score);
      this.registry.set('comboMultiplier', this.combo.getMultiplier());
      this.registry.set('comboCount', this.combo.getComboCount());

      const achievements = getAchievementManager();
      if (achievements) {
        achievements.onEnemyDefeated();
        achievements.onComboUpdate(this.combo.getComboCount());
      }

      SFXGenerator.play(this, 'sfx_defeatEnemy', 0.3);

      if (this.adaptiveMusic && multiplier >= 2) {
        this.adaptiveMusic.playVictoryFanfare();
      }
    } else {
      player.hit(enemy);
      if (this.adaptiveMusic) {
        const lives = this.registry.get('lives') || 0;
        if (lives <= 1) {
          this.adaptiveMusic.playNearDeathStinger();
        } else {
          this.adaptiveMusic.playDamageStinger();
        }
      }
      const achievements = getAchievementManager();
      if (achievements) achievements.onDamageTaken();
    }
  }

  collectNote(player, note) {
    this.particles.emitNoteCollect(note.x, note.y);
    note.destroy();

    if (player.combat) {
      player.combat.addEnergy(10);
    }

    const multiplier = this.combo.registerAction();
    const points = 50 * multiplier;
    const score = this.registry.get('score') + points;
    this.registry.set('score', score);
    this.registry.set('comboMultiplier', this.combo.getMultiplier());
    this.registry.set('comboCount', this.combo.getComboCount());

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

    const config = this.levelConfig;
    player.collectInstrument(config.instrument.name);

    // Stop background music
    this.sound.stopAll();
    if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
    if (this.adaptiveMusic) this.adaptiveMusic.stop();

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    const levelScore = this.registry.get('score') - this.levelStartScore;
    let timeBonus = 0;
    if (config.usesTimeBonus) {
      timeBonus = ScoreManager.calculateTimeBonus(config.levelNumber, elapsedSeconds);
      this.registry.set('score', this.registry.get('score') + timeBonus);
    }
    this.combo.destroy();

    // Mark level as completed
    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(config.levelNumber)) {
      completedLevels.push(config.levelNumber);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(config.levelNumber, elapsedSeconds);

    // Hook for pre-transition logic (e.g., Level 6 darkness fade, Level 7 gravity restore)
    this.onInstrumentCollected(config);

    // Transition
    const fadeColor = config.fadeToWhite ? [255, 255, 255] : [0, 0, 0];
    const fadeDuration = config.fadeDuration || 1000;
    this.cameras.main.fade(fadeDuration, ...fadeColor, false, (cam, progress) => {
      if (progress === 1) {
        if (config.nextLevel) {
          this.registry.set('currentLevel', config.nextLevel);
        }
        this.scene.stop('UIScene');
        if (config.nextScene === 'LevelCompleteScene') {
          this.scene.start('LevelCompleteScene', {
            level: config.levelNumber,
            levelScore,
            timeBonus,
            nextScene: 'MapScene',
            nextSceneData: { completedLevel: config.levelNumber }
          });
        } else {
          this.scene.start(config.nextScene);
        }
      }
    });
  }

  // Hook for subclass pre-transition logic
  showGameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;

    this.time.delayedCall(1000, () => {
      // Pause physics
      this.physics.pause();

      // Dark overlay
      const overlay = this.add.rectangle(
        this.cameras.main.scrollX + GAME_WIDTH / 2,
        this.cameras.main.scrollY + GAME_HEIGHT / 2,
        GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7
      ).setDepth(1000).setScrollFactor(0);

      // Game Over text
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'GAME OVER', {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '36px', color: '#FFD700',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

      // Retry button
      const retryBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '▶ Retry Level', {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: '#C9A84C'
      }).setOrigin(0.5).setDepth(1001).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      retryBtn.on('pointerover', () => retryBtn.setColor('#FFD700'));
      retryBtn.on('pointerout', () => retryBtn.setColor('#C9A84C'));
      retryBtn.on('pointerdown', () => {
        this.sound.stopAll();
        this.registry.set('lives', this.coopMode ? 5 : 3);
        this.scene.stop('UIScene');
        this.scene.restart();
      });

      // Back to menu
      const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '← Back to Menu', {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: '#888888'
      }).setOrigin(0.5).setDepth(1001).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      menuBtn.on('pointerover', () => menuBtn.setColor('#C9A84C'));
      menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
      menuBtn.on('pointerdown', () => {
        this.sound.stopAll();
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });

      // Keyboard controls
      this.input.keyboard?.once('keydown-ENTER', () => {
        this.sound.stopAll();
        this.registry.set('lives', this.coopMode ? 5 : 3);
        this.scene.stop('UIScene');
        this.scene.restart();
      });
      this.input.keyboard?.once('keydown-ESC', () => {
        this.sound.stopAll();
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
    });
  }

  onInstrumentCollected(_config) {
    // No-op by default
  }

  collectSheetMusic(player, page) {
    const pageKey = page.getData('pageKey');

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

    this.sheetMusicCollected++;
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    savedSheetMusic[pageKey] = true;
    this.registry.set('sheetMusic', savedSheetMusic);
    localStorage.setItem('sheetMusicCollected', JSON.stringify(savedSheetMusic));

    const total = this.levelConfig.sheetMusicPositions.length;
    this.registry.set('sheetMusicCurrentLevel', { found: this.sheetMusicCollected, total });

    if (this.sheetMusicCollected >= total) {
      const achievements = getAchievementManager();
      if (achievements) achievements.onAllSheetMusicCollected();
    }

    const score = this.registry.get('score') + 200;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.4 });
    }
    SFXGenerator.play(this, 'sfx_collectSheetMusic', 0.3);

    page.body.enable = false;
  }

  activateCheckpoint(player, flag) {
    if (flag.activated) return;
    flag.activated = true;
    this.lastCheckpoint = { x: flag.x, y: flag.y };

    flag.setTint(0xFFD700);
    this.particles.emitSparkleCollect(flag.x, flag.y - 20);

    SFXGenerator.play(this, 'sfx_checkpoint', 0.3);
  }

  enterPracticeStage(player, stage) {
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;
    if (this.rhythmCooldown) return;
    this.rhythmCooldown = true;
    this.time.delayedCall(1000, () => { this.rhythmCooldown = false; });

    this.scene.pause();
    this.sound.pauseAll();
    if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
    if (this.adaptiveMusic) this.adaptiveMusic.stop();
    this.scene.launch('RhythmScene', {
      returnScene: this.levelConfig.sceneKey,
      difficulty: stage.difficulty || this.levelConfig.levelNumber,
      playerX: player.x,
      playerY: player.y
    });
  }

  enterMelodyMemory(player, portal) {
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;
    if (this.melodyCooldown) return;
    this.melodyCooldown = true;
    this.time.delayedCall(1000, () => { this.melodyCooldown = false; });

    this.scene.pause();
    this.sound.pauseAll();
    if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
    if (this.adaptiveMusic) this.adaptiveMusic.stop();
    this.scene.launch('MelodyMemoryScene', {
      returnScene: this.levelConfig.sceneKey,
      difficulty: portal.difficulty || 2,
      playerX: player.x,
      playerY: player.y
    });
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
