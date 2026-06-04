import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';

export class Level6Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level6Scene' });
  }

  create() {
    // Background - dark caves
    if (this.textures.exists('bgCaves')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgCaves');
    } else {
      this.cameras.main.setBackgroundColor('#0a0a0a');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Underground Caves', {
      font: '24px monospace',
      fill: '#9370DB',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });

    // Platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < GAME_WIDTH * 3.2; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave ceiling (top boundary)
    for (let x = 0; x < GAME_WIDTH * 3.2; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, TILE_SIZE / 2, 'caveGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Cave platforms (stalactites and stalagmites as platforms)
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

    [450, 850, 1250, 1650, 2050].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [700, 1100, 1500, 1900, 2300].forEach(x => {
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

    // Instrument at end
    this.instrument = this.physics.add.sprite(2500, GAME_HEIGHT - 100, 'drums');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 36);
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Darkness overlay - limited visibility
    this.darkness = this.add.graphics();
    this.darkness.setScrollFactor(0);
    this.darkness.setDepth(100);

    // Glow light around player
    this.glowRadius = 120;

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.2, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // Draw darkness with circular cutout around player
    this.updateDarkness();

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
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
      if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.2 });
    } else {
      player.hit();
    }
  }

  collectNote(player, note) {
    note.destroy();
    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);
    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
    // Collecting notes slightly increases visibility
    this.glowRadius = Math.min(this.glowRadius + 5, 180);
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('drums');

    if (this.darkness) {
      this.tweens.add({ targets: this.darkness, alpha: 0, duration: 800 });
    }

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(6)) {
      completedLevels.push(6);
      this.registry.set('completedLevels', completedLevels);
    }

    this.cameras.main.fade(1500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 6,
          levelScore: this.registry.get('score'),
          timeBonus: 0,
          nextScene: 'Level7Scene'
        });
      }
    });
  }
}
