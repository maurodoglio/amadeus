import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { ParticleManager } from '../utils/ParticleManager.js';

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);

    // Parallax background layers
    const worldWidth = GAME_WIDTH * 3;
    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxVienna_far')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxVienna_mid')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
    this.bgNear = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxVienna_near')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);

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

    // Sparkle particles around instrument
    this.instrumentSparkle = this.particles.emitSparkle(2200, GAME_HEIGHT - 100);

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level1';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: High above the first building cluster, requires precise jump chain
      { x: 130, y: 120 },
      // Page 2: Far right, behind the last platform, requires backtracking from top
      { x: 1680, y: 140 },
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
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);
    this.physics.add.overlap(this.mozart, this.sheetMusicPages, this.collectSheetMusic, null, this);

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

    // Parallax scrolling
    const camX = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgNear.tilePositionX = camX * 0.5;

    // Fall death
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  hitEnemy(player, enemy) {
    // If player is falling on enemy, kill the enemy
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
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
    this.particles.emitNoteCollect(note.x, note.y);
    note.destroy();
    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.3 });
    }
  }

  collectInstrument(player, instrument) {
    this.particles.emitSparkleCollect(instrument.x, instrument.y);
    if (this.instrumentSparkle) this.instrumentSparkle.destroy();
    instrument.destroy();
    player.collectInstrument('violin');

    // Level complete - transition through cutscene
    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 2);
        this.scene.start('CutsceneScene', { cutscene: 'afterLevel1', nextScene: 'Level2Scene' });
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

    // Score bonus
    const score = this.registry.get('score') + 200;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.4 });
    }

    // Disable physics body immediately to prevent double-collection
    page.body.enable = false;
  }
}
