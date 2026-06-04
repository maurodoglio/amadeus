import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';

export class Level4Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level4Scene' });
  }

  create() {
    this.rhythmActive = false;
    this.rhythmTimer = 0;
    this.rhythmBeat = false;

    // Background
    if (this.textures.exists('bgOpera')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgOpera');
    } else {
      this.cameras.main.setBackgroundColor('#2a0a0a');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Opera House', {
      font: '24px monospace',
      fill: '#FF6347',
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
      { x: 2050, y: GAME_HEIGHT - 80 },
    ];

    singerPositions.forEach(pos => {
      const singer = new Singer(this, pos.x, pos.y);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    const notePositions = [
      { x: 550, y: 200 },
      { x: 1000, y: 180 },
      { x: 1450, y: 160 },
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

    // Instrument at end
    this.instrument = this.physics.add.sprite(2350, GAME_HEIGHT - 100, 'harpsichord');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 32);
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Rhythm beat indicator (UI)
    this.beatIndicator = this.add.circle(GAME_WIDTH / 2, 30, 15, 0xFF4500, 0.5)
      .setScrollFactor(0);
    this.beatText = this.add.text(GAME_WIDTH / 2, 30, '♪', {
      font: '16px serif', fill: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0);

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.mozart, this.rhythmPlatforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

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
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('harpsichord');

    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 5);
        this.scene.start('Level5Scene');
      }
    });
  }
}
