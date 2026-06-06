import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLevelDifficulty } from '../config/difficultyConfig.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupBoss, updateBossAI, getBossTarget, showBossDialogue } from '../utils/BossFight.js';
import { BossPhaseManager } from '../mechanics/BossPhaseManager.js';
import { getDebtCollectorPhases } from '../mechanics/BossPhaseDefinitions.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { setupCamera, updateCameraLookAhead } from '../utils/CameraManager.js';
import { ParallaxBackground, PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level5Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level5Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);
    this.windTimer = 0;
    this.windDirection = 1;
    this.windStrength = 0;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;
    this.lastCheckpoint = null;

    // Difficulty scaling
    this.difficulty = getLevelDifficulty(5);
    const currentLives = this.registry.get('lives') || 0;
    if (currentLives < this.difficulty.startingLives) {
      this.registry.set('lives', this.difficulty.startingLives);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(5);

    // Parallax background
    this.parallaxBg = new ParallaxBackground(this, PARALLAX_CONFIGS.level5);
    const worldWidth = GAME_WIDTH * 4.3;

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'Storm & Struggle', {
      font: '24px monospace',
      fill: '#ADD8E6',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 78, '1786', {
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

    // Ground with gaps (mountain terrain)
    const groundSegments = [
      { start: 0, end: 250 },
      { start: 350, end: 600 },
      { start: 700, end: 950 },
      { start: 1050, end: 1350 },
      { start: 1450, end: 1700 },
      { start: 1800, end: 2100 },
      { start: 2200, end: 2600 },
      { start: 2700, end: 3000 },
      { start: 3100, end: 3440 },
    ];

    groundSegments.forEach(seg => {
      for (let x = seg.start; x < seg.end; x += TILE_SIZE) {
        this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'mountainGround')
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .refreshBody();
      }
    });

    // Rocky platforms
    this.oneWayPlatforms = this.physics.add.staticGroup();

    const platformData = [
      { x: 270, y: 370, w: 2 },
      { x: 450, y: 300, w: 2 },
      { x: 620, y: 340, w: 2 },
      { x: 800, y: 260, w: 3 },
      { x: 1000, y: 300, w: 2 },
      { x: 1200, y: 230, w: 2 },
      { x: 1400, y: 280, w: 3 },
      { x: 1650, y: 220, w: 2 },
      { x: 1850, y: 280, w: 2 },
      { x: 2050, y: 200, w: 3 },
      { x: 2300, y: 260, w: 2 },
      { x: 2500, y: 200, w: 2 },
      { x: 2720, y: 260, w: 3 },
      { x: 2960, y: 220, w: 2 },
      { x: 3180, y: 280, w: 3 },
      { x: 1260, y: 330, w: 2 },
      { x: 1480, y: 190, w: 2 },
      { x: 1720, y: 320, w: 2 },
      { x: 1960, y: 150, w: 2 },
      { x: 2140, y: 300, w: 2 },
      // Stepping-stone platforms for bonus collectibles
      { x: 350, y: 210, w: 1 },
      { x: 300, y: 130, w: 1 },
      { x: 650, y: 180, w: 1 },
      { x: 850, y: 170, w: 1 },
      { x: 900, y: 100, w: 1 },
      { x: 1200, y: 140, w: 1 },
      { x: 1530, y: 140, w: 1 },
      { x: 1800, y: 190, w: 1 },
      { x: 2760, y: 180, w: 1 },
      { x: 3230, y: 160, w: 1 },
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

    [500, 900, 1300, 1700, 2100, 2550, 3000].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [{ x: 650, y: 200 }, { x: 1050, y: 180 }, { x: 1550, y: 160 }, { x: 2000, y: 150 }, { x: 2450, y: 180 }, { x: 2900, y: 160 }].forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 200, y: 330 }, { x: 470, y: 260 }, { x: 640, y: 300 },
      { x: 820, y: 220 }, { x: 1020, y: 260 }, { x: 1220, y: 190 },
      { x: 1420, y: 240 }, { x: 1670, y: 180 }, { x: 1870, y: 240 },
      { x: 2070, y: 160 }, { x: 2320, y: 220 }, { x: 2520, y: 180 },
      { x: 2740, y: 220 }, { x: 2970, y: 180 }, { x: 3200, y: 240 },
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
    this.instrument = this.physics.add.sprite(3300, GAME_HEIGHT - 100, 'trumpet');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 24);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: Muzio Clementi - Piano duel rival
    this.bossManager = new BossPhaseManager(this, {
      x: 3200,
      y: GAME_HEIGHT - 120,
      texture: 'bossClementi',
      name: 'Muzio Clementi',
      activateX: 2800,
      phases: getDebtCollectorPhases(this.difficulty),
      dialogue: [
        '"Mozart! The Emperor pits us against each other!"',
        '"My rapid scales shall outrun your melodies!"',
        '"Let us see whose fingers are truly faster!"'
      ],
      victoryQuote: '"He plays well, but has no taste or feeling."\n— Mozart on Clementi, 1782'
    });
    this.bossManager.create();
    this.bossProjectiles = this.bossManager.projectiles;

    // Wind indicator UI
    this.windArrow = this.add.text(GAME_WIDTH / 2, 30, '→ Wind →', {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Wind particles (visual indicator)
    this.windParticles = [];
    for (let i = 0; i < 8; i++) {
      const particle = this.add.text(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(50, GAME_HEIGHT - 100),
        '~',
        { font: '12px monospace', fill: '#FFFFFF' }
      ).setAlpha(0.3);
      this.windParticles.push(particle);
    }

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
      { x: 1300, y: GAME_HEIGHT - 64 },
      { x: 2100, y: GAME_HEIGHT - 64 },
      { x: 2850, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // Melody Memory Portal (mini-game trigger)
    this.melodyPortals = this.physics.add.staticGroup();
    const melodyPortal = this.melodyPortals.create(1400, GAME_HEIGHT - 80, 'practiceStage')
      .setDisplaySize(64, 48)
      .setTint(0xaa66ff)
      .refreshBody();
    melodyPortal.difficulty = 4;

    this.add.text(1400, GAME_HEIGHT - 115, '♪ Melody ♪', {
      font: '10px monospace',
      fill: '#AA66FF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: melodyPortal,
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.physics.add.overlap(this.mozart, this.melodyPortals, this.enterMelodyMemory, null, this);

    // Mozart's Symphony No.40 K.550
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('level5');

    // Adaptive music system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('exploration');

    // Handle resume from melody memory mini-game
    this._resumeHandler = () => {
      this.sound.resumeAll();
      this.time.delayedCall(300, () => { this.melodyEntered = false; });
      const bonus = this.registry.get('melodyMemoryBonus');
      if (bonus) {
        this.registry.set('melodyMemoryBonus', null);
        const currentScore = this.registry.get('score') || 0;
        this.registry.set('score', currentScore + bonus);
        const indicator = this.add.text(this.mozart.x, this.mozart.y - 40, `+${bonus} ♪`, {
          font: '14px monospace', fill: '#AA66FF', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);
        this.tweens.add({
          targets: indicator, y: indicator.y - 30, alpha: 0, duration: 1500,
          onComplete: () => indicator.destroy()
        });
      }
    };
    this.events.on('resume', this._resumeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('resume', this._resumeHandler);
      if (this.mozartSoundtrack) this.mozartSoundtrack.stop();
      if (this.adaptiveMusic) this.adaptiveMusic.stop();
    });
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
    // Boss AI: Debt Collector / Clementi multi-phase battle
    if (this.bossManager) {
      this.bossManager.update(time);
    }

    // Wind gust mechanic: changes direction every 3 seconds with varying strength
    this.windTimer += delta;
    if (this.windTimer >= 3000) {
      this.windTimer = 0;
      this.windDirection = Phaser.Math.RND.pick([-1, 1]);
      this.windStrength = Phaser.Math.Between(40, 120);

      // Update wind indicator
      const arrowText = this.windDirection > 0 ? '→ Wind →' : '← Wind ←';
      this.windArrow.setText(arrowText);
      this.windArrow.setAlpha(1);
      this.tweens.add({
        targets: this.windArrow,
        alpha: 0,
        delay: 2000,
        duration: 500
      });
    }

    // Apply wind force to player when airborne
    if (this.mozart && !this.mozart.body.blocked.down) {
      this.mozart.setVelocityX(
        this.mozart.body.velocity.x + this.windDirection * this.windStrength * (delta / 1000)
      );
    }

    // Animate wind particles
    this.windParticles.forEach(p => {
      p.x += this.windDirection * 2;
      if (p.x > GAME_WIDTH + 50) p.x = -50;
      if (p.x < -50) p.x = GAME_WIDTH + 50;
    });

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

  enterMelodyMemory(player, portal) {
    if (!this.mozart.cursors.up.isDown && !this.mozart.wasdKeys?.W?.isDown) return;
    if (this.melodyEntered) return;
    this.melodyEntered = true;
    this.scene.pause();
    this.sound.pauseAll();
    this.scene.launch('MelodyMemoryScene', { difficulty: portal.difficulty, returnScene: 'Level5Scene' });
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('trumpet');

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    this.combo.destroy();

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(5)) {
      completedLevels.push(5);
      this.registry.set('completedLevels', completedLevels);
    }

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelComplete(5, elapsedSeconds);

    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 5,
          levelScore: this.registry.get('score') - this.levelStartScore,
          timeBonus: 0,
          nextScene: 'MapScene',
          nextSceneData: { completedLevel: 5 }
        });
      }
    });
  }
}

