import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';

export class Level5Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level5Scene' });
  }

  create() {
    this.windTimer = 0;
    this.windDirection = 1;
    this.windStrength = 0;

    // Background
    if (this.textures.exists('bgMountain')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgMountain');
    } else {
      this.cameras.main.setBackgroundColor('#4a6fa5');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Mountain Pass', {
      font: '24px monospace',
      fill: '#ADD8E6',
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

    // Instrument at end
    this.instrument = this.physics.add.sprite(2550, GAME_HEIGHT - 100, 'trumpet');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(40, 24);
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

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
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.3, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.3, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

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
    player.collectInstrument('trumpet');

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(5)) {
      completedLevels.push(5);
      this.registry.set('completedLevels', completedLevels);
    }

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
