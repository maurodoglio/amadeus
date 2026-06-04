import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1Scene' });
  }

  create() {
    // Background
    if (this.textures.exists('bgVienna')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgVienna');
    } else {
      this.cameras.main.setBackgroundColor('#87CEEB');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Vienna Streets', {
      font: '24px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

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

    // Player
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Enemies
    this.enemies = this.physics.add.group();

    const singerPositions = [
      { x: 350, y: GAME_HEIGHT - 80 },
      { x: 700, y: GAME_HEIGHT - 80 },
      { x: 1100, y: GAME_HEIGHT - 80 },
      { x: 1500, y: GAME_HEIGHT - 80 },
    ];

    this.singers = [];
    singerPositions.forEach(pos => {
      const singer = new Singer(this, pos.x, pos.y);
      this.enemies.add(singer);
      this.singers.push(singer);
    });

    const notePositions = [
      { x: 500, y: 250 },
      { x: 900, y: 200 },
      { x: 1300, y: 220 },
      { x: 1800, y: 180 },
    ];

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

    // Instrument reward at end
    this.instrument = this.physics.add.sprite(2200, GAME_HEIGHT - 100, 'violin');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(32, 48);

    // Glow effect on instrument
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);

    // World bounds for player
    this.mozart.setCollideWorldBounds(true);
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();

    this.singers.forEach(s => s.update());
    this.notes.forEach(n => n.update(time, delta));

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  hitEnemy(player, enemy) {
    // If player is falling on enemy, kill the enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      enemy.destroy();
      this.singers = this.singers.filter(s => s !== enemy);
      this.notes = this.notes.filter(n => n !== enemy);
      player.setVelocityY(-200);

      const score = this.registry.get('score') + 100;
      this.registry.set('score', score);

      if (this.sound.get('sfx_coin')) {
        this.sound.play('sfx_coin', { volume: 0.2 });
      }
    } else {
      player.hit();
    }
  }

  collectNote(player, note) {
    note.destroy();
    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.3 });
    }
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('violin');

    // Level complete - transition
    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 2);
        this.scene.start('Level2Scene');
      }
    });
  }
}
