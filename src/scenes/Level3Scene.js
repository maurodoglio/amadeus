import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DrumTroll } from '../sprites/enemies/DrumTroll.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { SaveManager } from '../utils/SaveManager.js';

export class Level3Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level3Scene' });
  }

  create() {
    this.bossDefeated = false;

    // Background
    if (this.textures.exists('bgPalace')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgPalace');
    } else {
      this.cameras.main.setBackgroundColor('#1a1a2e');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Royal Palace', {
      font: '24px monospace',
      fill: '#FFD700',
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
    for (let x = 0; x < GAME_WIDTH * 3.5; x += TILE_SIZE) {
      this.platforms.create(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, 'palaceGround')
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .refreshBody();
    }

    // Palace platforms with more vertical complexity
    const platformData = [
      { x: 200, y: 360, w: 2 },
      { x: 350, y: 280, w: 3 },
      { x: 550, y: 320, w: 2 },
      { x: 700, y: 240, w: 2 },
      { x: 900, y: 300, w: 3 },
      { x: 1100, y: 220, w: 2 },
      { x: 1300, y: 280, w: 3 },
      { x: 1500, y: 200, w: 2 },
      { x: 1700, y: 260, w: 2 },
      { x: 1900, y: 320, w: 3 },
      // Boss arena platforms
      { x: 2200, y: 340, w: 4 },
      { x: 2400, y: 260, w: 3 },
      { x: 2200, y: 180, w: 3 },
      { x: 2500, y: 180, w: 2 },
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

    // Regular enemies before boss
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    // Mix of all enemy types
    [300, 800, 1200].forEach(x => {
      const singer = new Singer(this, x, GAME_HEIGHT - 80);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    [600, 1000, 1600].forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    [{ x: 450, y: 180 }, { x: 1100, y: 160 }, { x: 1700, y: 170 }].forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    [900, 1400].forEach(x => {
      const bi = new BrokenInstrument(this, x, GAME_HEIGHT - 80);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Boss: The Discordant Maestro
    this.createBoss();

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 220, y: 320 }, { x: 370, y: 240 }, { x: 570, y: 280 },
      { x: 720, y: 200 }, { x: 920, y: 260 }, { x: 1120, y: 180 },
      { x: 1320, y: 240 }, { x: 1520, y: 160 }, { x: 1720, y: 220 },
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

    // Piano (instrument) - appears after boss defeat
    this.instrument = this.physics.add.sprite(2700, GAME_HEIGHT - 100, 'piano');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(48, 32);
    this.instrument.setVisible(false);
    this.instrument.body.enable = false;

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.5, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.5, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);
  }

  createBoss() {
    // The Discordant Maestro - a large enemy at the end
    this.boss = this.physics.add.sprite(2500, GAME_HEIGHT - 120, 'drumTroll');
    this.boss.setScale(2.5);
    this.boss.body.setAllowGravity(true);
    this.boss.setCollideWorldBounds(true);
    this.boss.health = 5;
    this.boss.isActive = false;
    this.boss.attackTimer = 0;
    this.boss.direction = 1;

    this.physics.add.collider(this.boss, this.platforms);

    // Boss health bar
    this.bossHealthBg = this.add.rectangle(2500, 80, 200, 20, 0x333333).setScrollFactor(0).setVisible(false);
    this.bossHealthBar = this.add.rectangle(2500, 80, 196, 16, 0xFF0000).setScrollFactor(0).setVisible(false);
    this.bossLabel = this.add.text(2500, 55, 'The Discordant Maestro', {
      font: '12px monospace', fill: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    this.physics.add.overlap(this.mozart, this.boss, this.hitBoss, null, this);
  }

  update(time, delta) {
    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // Activate boss when player gets close
    if (this.boss && this.boss.active && !this.boss.isActive && this.mozart.x > 2100) {
      this.boss.isActive = true;
      this.bossHealthBg.setVisible(true).setPosition(GAME_WIDTH / 2, 60);
      this.bossHealthBar.setVisible(true).setPosition(GAME_WIDTH / 2, 60);
      this.bossLabel.setVisible(true).setPosition(GAME_WIDTH / 2, 40);
    }

    // Boss AI
    if (this.boss && this.boss.active && this.boss.isActive) {
      this.updateBoss(time);
    }

    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  updateBoss(time) {
    const boss = this.boss;

    // Move toward player
    if (this.mozart.x > boss.x + 30) {
      boss.setVelocityX(100);
      boss.setFlipX(false);
    } else if (this.mozart.x < boss.x - 30) {
      boss.setVelocityX(-100);
      boss.setFlipX(true);
    } else {
      boss.setVelocityX(0);
    }

    // Periodic jump attack
    if (time > boss.attackTimer && (boss.body.blocked.down || boss.body.touching.down)) {
      boss.setVelocityY(-350);
      boss.attackTimer = time + 2500;
    }
  }

  hitBoss(player, boss) {
    if (this.bossDefeated) return;

    if (player.body.velocity.y > 0 && player.y < boss.y - 20) {
      // Player stomps boss
      boss.health--;
      player.setVelocityY(-300);

      // Update health bar
      const healthPercent = boss.health / 5;
      this.bossHealthBar.setSize(196 * healthPercent, 16);

      if (this.sound.get('sfx_hit')) this.sound.play('sfx_hit', { volume: 0.3 });

      // Flash boss
      this.tweens.add({
        targets: boss,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 3
      });

      if (boss.health <= 0) {
        this.defeatBoss();
      }
    } else {
      player.hit();
    }
  }

  defeatBoss() {
    this.bossDefeated = true;
    this.boss.destroy();
    this.bossHealthBg.setVisible(false);
    this.bossHealthBar.setVisible(false);
    this.bossLabel.setVisible(false);

    // Show instrument
    this.instrument.setVisible(true);
    this.instrument.body.enable = true;

    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Victory text
    const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Boss Defeated!', {
      font: '32px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: victoryText,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });

    if (this.sound.get('sfx_levelComplete')) {
      this.sound.play('sfx_levelComplete', { volume: 0.5 });
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
    player.collectInstrument('piano');

    // Game complete - save high score
    SaveManager.updateHighScore(this.registry.get('score'));

    this.cameras.main.fade(1500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('ConcertScene');
      }
    });
  }
}
