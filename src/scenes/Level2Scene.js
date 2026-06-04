import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { ParticleManager } from '../utils/ParticleManager.js';

export class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2Scene' });
  }

  create() {
    this.particles = new ParticleManager(this);

    // Parallax background layers
    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxForest_far')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxForest_mid')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
    this.bgNear = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxForest_near')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Enchanted Forest', {
      font: '24px monospace',
      fill: '#90EE90',
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

    // Ground with gaps
    const groundSegments = [
      { start: 0, end: 300 },
      { start: 380, end: 700 },
      { start: 780, end: 1100 },
      { start: 1200, end: 1600 },
      { start: 1700, end: 2000 },
      { start: 2100, end: 2500 },
    ];

    groundSegments.forEach(seg => {
      for (let x = seg.start; x < seg.end; x += TILE_SIZE) {
        this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'forestGround')
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .refreshBody();
      }
    });

    // Static platforms
    const platformData = [
      { x: 320, y: 380, w: 2 },
      { x: 180, y: 300, w: 2 },
      { x: 400, y: 240, w: 3 },
      { x: 650, y: 300, w: 2 },
      { x: 850, y: 250, w: 2 },
      { x: 1050, y: 300, w: 3 },
      { x: 1300, y: 240, w: 2 },
      { x: 1500, y: 200, w: 2 },
      { x: 1700, y: 280, w: 3 },
      { x: 1950, y: 220, w: 2 },
      { x: 2200, y: 260, w: 3 },
      { x: 2400, y: 200, w: 2 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
      }
    });

    // Moving platforms
    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    const movingData = [
      { x: 750, y: 350, rangeX: 100, rangeY: 0 },
      { x: 1150, y: 200, rangeX: 0, rangeY: 80 },
      { x: 1600, y: 320, rangeX: 80, rangeY: 0 },
      { x: 2050, y: 160, rangeX: 0, rangeY: 60 },
    ];

    movingData.forEach(mp => {
      const plat = this.movingPlatforms.create(mp.x, mp.y, 'platform')
        .setDisplaySize(TILE_SIZE * 2, TILE_SIZE / 2);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);

      this.tweens.add({
        targets: plat,
        x: mp.x + mp.rangeX,
        y: mp.y + mp.rangeY,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Player
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    // Drum Trolls
    [500, 1000, 1400, 1900].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    // Broken Instruments
    [800, 1300, 2200].forEach(x => {
      const bi = new BrokenInstrument(this, x, GAME_HEIGHT - 80);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Floating notes
    [{ x: 600, y: 200 }, { x: 1100, y: 160 }, { x: 1800, y: 150 }].forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 200, y: 260 }, { x: 420, y: 200 }, { x: 660, y: 260 },
      { x: 870, y: 210 }, { x: 1070, y: 260 }, { x: 1320, y: 200 },
      { x: 1520, y: 160 }, { x: 1720, y: 240 }, { x: 1970, y: 180 },
      { x: 2220, y: 220 }, { x: 2420, y: 160 },
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
    this.instrument = this.physics.add.sprite(2450, GAME_HEIGHT - 100, 'flute');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 16);
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Sparkle particles around instrument
    this.instrumentSparkle = this.particles.emitSparkle(2450, GAME_HEIGHT - 100);

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level2';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: Above a gap, requires precise moving platform timing
      { x: 760, y: 100 },
      // Page 2: High above the vertical moving platform, top of the map
      { x: 1170, y: 80 },
      // Page 3: Far corner past the last platform, dangerous jump over gap
      { x: 2430, y: 100 },
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
    this.physics.add.collider(this.mozart, this.movingPlatforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);
    this.physics.add.overlap(this.mozart, this.sheetMusicPages, this.collectSheetMusic, null, this);

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

    // Parallax scrolling
    const camX = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgNear.tilePositionX = camX * 0.5;

    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
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
    this.particles.emitNoteCollect(note.x, note.y);
    note.destroy();
    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);
    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
  }

  collectInstrument(player, instrument) {
    this.particles.emitSparkleCollect(instrument.x, instrument.y);
    if (this.instrumentSparkle) this.instrumentSparkle.destroy();
    instrument.destroy();
    player.collectInstrument('flute');

    this.cameras.main.fade(1000, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', 3);
        this.scene.start('CutsceneScene', { cutscene: 'afterLevel2', nextScene: 'Level3Scene' });
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

    const score = this.registry.get('score') + 200;
    this.registry.set('score', score);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.4 });
    }

    page.body.enable = false;
  }
}
