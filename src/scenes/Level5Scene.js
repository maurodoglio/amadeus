import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { AdaptiveMusicManager } from '../utils/AdaptiveMusicManager.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { setupBoss, updateBossAI, getBossTarget } from '../utils/BossFight.js';
import { ComboSystem } from '../utils/ComboSystem.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import { CompositionCollector } from '../mechanics/CompositionCollector.js';

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

    // Achievement tracking
    const achievements = getAchievementManager();
    if (achievements) achievements.onLevelStart(5);

    // Background
    if (this.textures.exists('bgMountain')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgMountain');
    } else {
      this.cameras.main.setBackgroundColor('#4a6fa5');
    }

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
    ];

    groundSegments.forEach(seg => {
      for (let x = seg.start; x < seg.end; x += TILE_SIZE) {
        this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'mountainGround')
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .refreshBody();
      }
    });

    // Rocky platforms
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

    [500, 900, 1300, 1700, 2100].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [{ x: 650, y: 200 }, { x: 1050, y: 180 }, { x: 1550, y: 160 }, { x: 2000, y: 150 }].forEach(pos => {
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
      { x: 2070, y: 160 }, { x: 2320, y: 220 },
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
    this.instrument = this.physics.add.sprite(2550, GAME_HEIGHT - 100, 'trumpet');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 24);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Boss: The Storm Trumpeter
    setupBoss(this, {
      x: 2450,
      y: GAME_HEIGHT - 120,
      texture: 'bossStormTrumpeter',
      name: 'The Storm Trumpeter',
      health: 3,
      speed: 110,
      jumpForce: -360,
      attackInterval: 2400,
      activateX: 2100
    });
    this.bossProjectiles = this.physics.add.group();

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

    // Composition melody collectibles (Symphony 40 - along mountain peaks)
    this.compositionCollector = new CompositionCollector(this, 5);
    const compositionNotePositions = [
      { x: 300, y: 90 },
      { x: 600, y: 110 },
      { x: 900, y: 80 },
      { x: 1200, y: 100 },
      { x: 1500, y: 90 },
      { x: 1800, y: 120 }
    ];
    this.compositionCollector.create(compositionNotePositions);
    this.compositionCollector.setupOverlap(this.mozart);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.3, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.3, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);

    // Adaptive music system
    this.adaptiveMusic = new AdaptiveMusicManager(this);
    this.adaptiveMusic.start('exploration');
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // Update adaptive music system
    if (this.adaptiveMusic) this.adaptiveMusic.update(this);
    // Boss AI: Storm Trumpeter - wind blasts push player
    updateBossAI(this, time, (scene, t) => {
      const boss = scene.boss;
      const target = getBossTarget(scene);
      const speedMult = boss.phase === 3 ? 1.5 : boss.phase === 2 ? 1.3 : 1;

      if (target.x > boss.x + 40) {
        boss.setVelocityX(boss.speed * speedMult);
        boss.setFlipX(false);
      } else if (target.x < boss.x - 40) {
        boss.setVelocityX(-boss.speed * speedMult);
        boss.setFlipX(true);
      } else {
        boss.setVelocityX(0);
      }

      // Wind blast attack: fires fast horizontal projectiles
      const interval = boss.attackInterval / boss.phase;
      if (t > boss.attackTimer && (boss.body.blocked.down || boss.body.touching.down)) {
        boss.attackTimer = t + interval;
        const direction = target.x > boss.x ? 1 : -1;
        for (let i = 0; i < boss.phase; i++) {
          scene.time.delayedCall(i * 200, () => {
            if (!boss.active) return;
            const proj = scene.bossProjectiles.create(boss.x + direction * 20, boss.y - 10 - i * 15, 'bossProjectile');
            proj.body.setAllowGravity(false);
            proj.setVelocity(direction * 280, 0);
            scene.time.delayedCall(2500, () => { if (proj.active) proj.destroy(); });
          });
        }
      }
    });

    // Projectile collision
    if (this.bossProjectiles) {
      this.physics.add.overlap(this.mozart, this.bossProjectiles, (player, proj) => {
        proj.destroy();
        player.hit();
      });
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
          levelScore: this.registry.get('score'),
          timeBonus: 0,
          nextScene: 'Level6Scene'
        });
      }
    });
  }
}
