import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
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

export class Level3Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level3Scene' });
  }

  create() {
    setupPause(this);
    this.bossDefeated = false;
    this.particles = new ParticleManager(this);
    this.coopMode = this.registry.get('coopMode') || false;
    this.lastCheckpoint = null;
    this.combo = new ComboSystem(this);
    this.levelStartTime = this.time.now;
    this.levelStartScore = this.registry.get('score') || 0;

    // Parallax background layers
    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxPalace_far')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxPalace_mid')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
    this.bgNear = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'parallaxPalace_near')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);

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

    // Player 1
    this.mozart = new Mozart(this, 100, GAME_HEIGHT - 100);

    // Player 2 (co-op)
    this.nannerl = null;
    if (this.coopMode) {
      this.nannerl = new Nannerl(this, 140, GAME_HEIGHT - 100);
    }

    // Regular enemies before boss
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    // Mix of all enemy types
    const singerPositions = [300, 800, 1200];
    if (this.coopMode) singerPositions.push(500, 1000);
    singerPositions.forEach(x => {
      const singer = new Singer(this, x, GAME_HEIGHT - 80);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    const trollPositions = [600, 1000, 1600];
    if (this.coopMode) trollPositions.push(1400);
    trollPositions.forEach(x => {
      const troll = new DrumTroll(this, x, GAME_HEIGHT - 80);
      this.enemies.add(troll);
      this.enemyList.push(troll);
    });

    const noteEnemyPositions = [{ x: 450, y: 180 }, { x: 1100, y: 160 }, { x: 1700, y: 170 }];
    if (this.coopMode) noteEnemyPositions.push({ x: 800, y: 150 });
    noteEnemyPositions.forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    const biPositions = [900, 1400];
    if (this.coopMode) biPositions.push(1800);
    biPositions.forEach(x => {
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

    // Sheet music pages (hidden secrets in hard-to-reach spots)
    this.sheetMusicPages = this.physics.add.group();
    this.sheetMusicCollected = 0;
    const levelKey = 'level3';
    const savedSheetMusic = this.registry.get('sheetMusic') || {};
    this.levelSheetMusicKey = levelKey;

    const sheetMusicPositions = [
      // Page 1: Very high, above the initial platforms, requires wall-jumping skill
      { x: 380, y: 100 },
      // Page 2: Above boss arena, only reachable from the highest platform
      { x: 2250, y: 80 },
      // Page 3: Behind the starting area, requires backtracking up high
      { x: 50, y: 140 },
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
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);
    this.physics.add.overlap(this.mozart, this.sheetMusicPages, this.collectSheetMusic, null, this);

    if (this.coopMode && this.nannerl) {
      this.physics.add.collider(this.nannerl, this.platforms);
      this.physics.add.overlap(this.nannerl, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.nannerl, this.collectibles, this.collectNote, null, this);
      this.physics.add.overlap(this.nannerl, this.instrument, this.collectInstrument, null, this);
      this.physics.add.overlap(this.nannerl, this.boss, this.hitBoss, null, this);

      // Player bounce
      this.physics.add.collider(this.mozart, this.nannerl, this.playerBounce, null, this);
    }

    // Checkpoint flags
    this.checkpoints = this.physics.add.staticGroup();
    const checkpointPositions = [
      { x: 700, y: GAME_HEIGHT - 64 },
      { x: 1400, y: GAME_HEIGHT - 64 },
      { x: 2100, y: GAME_HEIGHT - 64 },
    ];

    checkpointPositions.forEach(pos => {
      const flag = this.checkpoints.create(pos.x, pos.y, 'checkpointFlag')
        .setDisplaySize(24, 40)
        .refreshBody();
      flag.activated = false;
    });

    this.physics.add.overlap(this.mozart, this.checkpoints, this.activateCheckpoint, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.5, GAME_HEIGHT);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.5, GAME_HEIGHT);

    if (this.coopMode && this.nannerl) {
      this.cameraTarget = this.add.zone(0, 0, 1, 1);
      this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
    } else {
      this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    }

    this.mozart.setCollideWorldBounds(true);
    if (this.nannerl) this.nannerl.setCollideWorldBounds(true);

    // Background music - starts with palace theme
    if (this.sound.get('music_palace')) {
      this.sound.play('music_palace', { loop: true, volume: 0.25 });
    }
  }

  createBoss() {
    // The Discordant Maestro - a large enemy at the end
    this.boss = this.physics.add.sprite(2500, GAME_HEIGHT - 120, 'drumTroll');
    this.boss.setScale(2.5);
    this.boss.body.setAllowGravity(true);
    this.boss.setCollideWorldBounds(true);
    // More health in co-op for balance
    this.boss.health = this.coopMode ? 7 : 5;
    this.boss.maxHealth = this.boss.health;
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
    if (this.mozart && !this.mozart.isDead) this.mozart.update();
    if (this.nannerl && !this.nannerl.isDead) this.nannerl.update();

    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // Camera follows midpoint in co-op
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
    }

    // Parallax scrolling
    const camX = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgNear.tilePositionX = camX * 0.5;

    // Activate boss when any player gets close
    if (this.boss && this.boss.active && !this.boss.isActive) {
      const anyPlayerClose = (this.mozart && !this.mozart.isDead && this.mozart.x > 2100) ||
        (this.nannerl && !this.nannerl.isDead && this.nannerl.x > 2100);
      if (anyPlayerClose) {
        this.boss.isActive = true;
        this.bossHealthBg.setVisible(true).setPosition(GAME_WIDTH / 2, 60);
        this.bossHealthBar.setVisible(true).setPosition(GAME_WIDTH / 2, 60);
        this.bossLabel.setVisible(true).setPosition(GAME_WIDTH / 2, 40);

        // Switch to boss music
        this.sound.stopAll();
        if (this.sound.get('music_boss')) {
          this.sound.play('music_boss', { loop: true, volume: 0.3 });
        }
      }
    }

    // Boss AI
    if (this.boss && this.boss.active && this.boss.isActive) {
      this.updateBoss(time);
    }

    // Fall death
    if (this.mozart && !this.mozart.isDead && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
    if (this.nannerl && !this.nannerl.isDead && this.nannerl.y > GAME_HEIGHT + 50) {
      this.nannerl.die();
    }

    // Check game over in co-op
    if (this.coopMode) {
      const bothDead = (this.mozart.isDead) && (this.nannerl && this.nannerl.isDead);
      const noLives = this.registry.get('lives') <= 0;
      if (bothDead || noLives) {
        this.time.delayedCall(1500, () => {
          this.scene.stop('UIScene');
          this.scene.start('MenuScene');
        });
      }
    }
  }

  updateBoss(time) {
    const boss = this.boss;

    // In co-op, target the nearest living player
    let target = this.mozart;
    if (this.coopMode && this.nannerl && !this.nannerl.isDead) {
      if (this.mozart.isDead) {
        target = this.nannerl;
      } else {
        // Target closest player
        const d1 = Math.abs(this.mozart.x - boss.x);
        const d2 = Math.abs(this.nannerl.x - boss.x);
        target = d1 < d2 ? this.mozart : this.nannerl;
      }
    }

    // Move toward target player
    if (target.x > boss.x + 30) {
      boss.setVelocityX(100);
      boss.setFlipX(false);
    } else if (target.x < boss.x - 30) {
      boss.setVelocityX(-100);
      boss.setFlipX(true);
    } else {
      boss.setVelocityX(0);
    }

    // Periodic jump attack
    if (time > boss.attackTimer && (boss.body.blocked.down || boss.body.touching.down)) {
      boss.setVelocityY(-350);
      boss.attackTimer = time + (this.coopMode ? 2000 : 2500);
    }
  }

  hitBoss(player, boss) {
    if (this.bossDefeated) return;

    if (player.body.velocity.y > 0 && player.y < boss.y - 20) {
      // Player stomps boss
      boss.health--;
      player.setVelocityY(-300);

      const multiplier = this.combo.registerAction();
      const points = 200 * multiplier;
      const score = this.registry.get('score') + points;
      this.registry.set('score', score);
      this.registry.set('comboMultiplier', this.combo.getMultiplier());
      this.registry.set('comboCount', this.combo.getComboCount());

      // Screen shake on boss hit
      this.particles.screenShake(0.015, 300);
      this.particles.emitStomp(boss.x, boss.y - 20);

      // Update health bar
      const healthPercent = boss.health / boss.maxHealth;
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

    // Big screen shake and poof on boss defeat
    this.particles.screenShake(0.025, 500);
    this.particles.emitStomp(this.boss.x, this.boss.y);
    this.particles.emitSparkleCollect(this.boss.x, this.boss.y);

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

    // Sparkle on the piano instrument
    this.instrumentSparkle = this.particles.emitSparkle(2700, GAME_HEIGHT - 100);

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

  playerBounce(player1, player2) {
    if (player1.body.velocity.y > 0 && player1.y < player2.y - 20) {
      player1.setVelocityY(-500);
    } else if (player2.body.velocity.y > 0 && player2.y < player1.y - 20) {
      player2.setVelocityY(-500);
    }
  }

  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      this.particles.emitStomp(enemy.x, enemy.y);
      enemy.destroy();
      this.enemyList = this.enemyList.filter(e => e !== enemy);
      player.setVelocityY(-200);

      const multiplier = this.combo.registerAction();
      const points = 100 * multiplier;
      const score = this.registry.get('score') + points;
      this.registry.set('score', score);
      this.registry.set('comboMultiplier', this.combo.getMultiplier());
      this.registry.set('comboCount', this.combo.getComboCount());

      if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.2 });
    } else {
      player.hit();
    }
  }

  collectNote(player, note) {
    this.particles.emitNoteCollect(note.x, note.y);
    note.destroy();

    const multiplier = this.combo.registerAction();
    const points = 50 * multiplier;
    const score = this.registry.get('score') + points;
    this.registry.set('score', score);
    this.registry.set('comboMultiplier', this.combo.getMultiplier());
    this.registry.set('comboCount', this.combo.getComboCount());

    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
  }

  collectInstrument(player, instrument) {
    this.particles.emitSparkleCollect(instrument.x, instrument.y);
    if (this.instrumentSparkle) this.instrumentSparkle.destroy();
    instrument.destroy();
    player.collectInstrument('piano');

    // Stop background music
    this.sound.stopAll();

    const elapsedSeconds = Math.floor((this.time.now - this.levelStartTime) / 1000);
    const levelScore = this.registry.get('score') - this.levelStartScore;
    const timeBonus = ScoreManager.calculateTimeBonus(3, elapsedSeconds);

    this.registry.set('score', this.registry.get('score') + timeBonus);
    this.combo.destroy();

    // Mark level as completed
    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(3)) {
      completedLevels.push(3);
      this.registry.set('completedLevels', completedLevels);
    }

    this.cameras.main.fade(1500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene', {
          level: 3,
          levelScore,
          timeBonus,
          nextScene: 'Level4Scene'
        });
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

  activateCheckpoint(player, flag) {
    if (flag.activated) return;
    flag.activated = true;
    this.lastCheckpoint = { x: flag.x, y: flag.y };

    flag.setTint(0xFFD700);
    this.particles.emitSparkleCollect(flag.x, flag.y - 20);

    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.2 });
    }
  }
}
