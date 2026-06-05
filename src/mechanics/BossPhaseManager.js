import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * BossPhaseManager — Manages multi-phase boss battles with musical mechanics.
 * Each boss has defined phases with unique attack patterns, HP pools,
 * vulnerability windows, and transition animations.
 */
export class BossPhaseManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.bossName = config.name || 'Boss';
    this.texture = config.texture;
    this.x = config.x;
    this.y = config.y;
    this.scale = config.scale || 2.5;
    this.activateX = config.activateX || (config.x - 400);
    this.dialogue = config.dialogue || [];
    this.victoryQuote = config.victoryQuote || 'Boss Defeated!';
    this.phases = config.phases || [];
    this.coopHealthBonus = config.coopHealthBonus || 2;

    this.currentPhaseIndex = 0;
    this.phaseHP = 0;
    this.totalHP = 0;
    this.maxTotalHP = 0;
    this.isActive = false;
    this.isDefeated = false;
    this.isTransitioning = false;
    this.isVulnerable = false;
    this.dialogueActive = false;
    this.dialogueShown = false;
    this.attackTimer = 0;
    this.vulnerabilityTimer = 0;
    this.patternIndex = 0;

    this.boss = null;
    this.projectiles = null;
    this.ui = null;
  }

  create() {
    const scene = this.scene;
    const coopMode = scene.coopMode || false;

    // Create boss sprite
    this.boss = scene.physics.add.sprite(this.x, this.y, this.texture);
    this.boss.setScale(this.scale);
    this.boss.body.setAllowGravity(true);
    this.boss.setCollideWorldBounds(true);
    scene.boss = this.boss;
    scene.bossDefeated = false;

    // Calculate total HP across all phases
    this.totalHP = 0;
    this.phases.forEach(phase => {
      const hp = coopMode ? phase.hp + this.coopHealthBonus : phase.hp;
      phase._effectiveHP = hp;
      this.totalHP += hp;
    });
    this.maxTotalHP = this.totalHP;
    this.phaseHP = this.phases[0]._effectiveHP;

    // Collider with platforms
    if (scene.platforms) {
      scene.physics.add.collider(this.boss, scene.platforms);
    }

    // Projectile group
    this.projectiles = scene.physics.add.group();
    scene.bossProjectiles = this.projectiles;

    // Create the boss UI
    this._createUI();

    // Player overlap for hitting boss
    this._setupPlayerOverlap();

    // Projectile overlap with players
    this._setupProjectileOverlap();
  }

  _createUI() {
    const scene = this.scene;
    const barWidth = 300;
    const barHeight = 20;
    const barX = GAME_WIDTH / 2;
    const barY = 50;

    // Background bar
    this.uiBg = scene.add.rectangle(barX, barY, barWidth + 4, barHeight + 4, 0x000000)
      .setScrollFactor(0).setVisible(false).setDepth(100);
    // Health bar background
    this.uiBarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x333333)
      .setScrollFactor(0).setVisible(false).setDepth(101);
    // Health bar fill
    this.uiBar = scene.add.rectangle(barX - barWidth / 2, barY, barWidth, barHeight - 4, 0xFF0000)
      .setOrigin(0, 0.5).setScrollFactor(0).setVisible(false).setDepth(102);

    // Phase markers on the health bar
    this.phaseMarkers = [];
    let hpAccum = 0;
    for (let i = 0; i < this.phases.length - 1; i++) {
      hpAccum += this.phases[i]._effectiveHP;
      const markerX = barX - barWidth / 2 + (1 - hpAccum / this.maxTotalHP) * barWidth;
      const marker = scene.add.rectangle(markerX, barY, 2, barHeight + 2, 0xFFD700)
        .setScrollFactor(0).setVisible(false).setDepth(103);
      this.phaseMarkers.push(marker);
    }

    // Boss name label
    this.uiLabel = scene.add.text(barX, barY - 20, this.bossName, {
      font: '14px monospace', fill: '#FFD700', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(103);

    // Phase indicator
    this.uiPhaseText = scene.add.text(barX + barWidth / 2 + 20, barY, `Phase 1/${this.phases.length}`, {
      font: '10px monospace', fill: '#FFFFFF'
    }).setOrigin(0, 0.5).setScrollFactor(0).setVisible(false).setDepth(103);
  }

  _showUI() {
    this.uiBg.setVisible(true);
    this.uiBarBg.setVisible(true);
    this.uiBar.setVisible(true);
    this.uiLabel.setVisible(true);
    this.uiPhaseText.setVisible(true);
    this.phaseMarkers.forEach(m => m.setVisible(true));
  }

  _hideUI() {
    this.uiBg.setVisible(false);
    this.uiBarBg.setVisible(false);
    this.uiBar.setVisible(false);
    this.uiLabel.setVisible(false);
    this.uiPhaseText.setVisible(false);
    this.phaseMarkers.forEach(m => m.setVisible(false));
  }

  _updateHealthBar() {
    const barWidth = 300;
    const percent = Math.max(0, this.totalHP / this.maxTotalHP);
    this.uiBar.setSize(barWidth * percent, 16);

    // Change color based on phase
    const phase = this.currentPhaseIndex;
    const colors = [0xFF0000, 0xFF6600, 0xFF00FF, 0x9900FF];
    this.uiBar.setFillStyle(colors[phase] || 0xFF0000);

    this.uiPhaseText.setText(`Phase ${this.currentPhaseIndex + 1}/${this.phases.length}`);
  }

  _setupPlayerOverlap() {
    const scene = this.scene;
    const hitCallback = (player, boss) => this._onPlayerHitBoss(player, boss);

    scene.physics.add.overlap(scene.mozart, this.boss, hitCallback, null, scene);
    if (scene.coopMode && scene.nannerl) {
      scene.physics.add.overlap(scene.nannerl, this.boss, hitCallback, null, scene);
    }
  }

  _setupProjectileOverlap() {
    const scene = this.scene;
    const projHit = (player, proj) => {
      proj.destroy();
      player.hit();
    };
    scene.physics.add.overlap(scene.mozart, this.projectiles, projHit);
    if (scene.coopMode && scene.nannerl) {
      scene.physics.add.overlap(scene.nannerl, this.projectiles, projHit);
    }
  }

  _onPlayerHitBoss(player, boss) {
    if (this.isDefeated || this.isTransitioning) return;

    if (this.isVulnerable && player.body.velocity.y > 0 && player.y < boss.y - 20) {
      this._takeDamage(player);
    } else if (player.body.velocity.y > 0 && player.y < boss.y - 20 && !this.isVulnerable) {
      // Player bounces off but no damage during invulnerable phase
      player.setVelocityY(-200);
      // Visual feedback that boss is shielded
      this.scene.tweens.add({
        targets: boss, alpha: 0.7, duration: 50, yoyo: true, repeat: 1
      });
    } else {
      player.hit();
    }
  }

  _takeDamage(player) {
    const scene = this.scene;
    this.phaseHP--;
    this.totalHP--;
    player.setVelocityY(-300);

    // Combo scoring
    if (scene.combo) {
      const multiplier = scene.combo.registerAction();
      const points = 200 * multiplier;
      const score = scene.registry.get('score') + points;
      scene.registry.set('score', score);
      scene.registry.set('comboMultiplier', scene.combo.getMultiplier());
      scene.registry.set('comboCount', scene.combo.getComboCount());
    }

    // Effects
    if (scene.particles) {
      scene.particles.screenShake(0.015, 300);
      scene.particles.emitStomp(this.boss.x, this.boss.y - 20);
    }
    if (scene.sound.get('sfx_hit')) scene.sound.play('sfx_hit', { volume: 0.3 });

    // Flash boss
    scene.tweens.add({
      targets: this.boss, alpha: 0.3, duration: 100, yoyo: true, repeat: 3
    });

    this._updateHealthBar();

    if (this.totalHP <= 0) {
      this._defeatBoss();
    } else if (this.phaseHP <= 0) {
      this._transitionToNextPhase();
    }
  }

  _transitionToNextPhase() {
    this.isTransitioning = true;
    this.isVulnerable = false;
    const scene = this.scene;

    // Clear projectiles
    this.projectiles.clear(true, true);

    // Phase transition animation
    scene.tweens.add({
      targets: this.boss,
      scaleX: this.scale * 1.3,
      scaleY: this.scale * 1.3,
      alpha: 0.5,
      duration: 400,
      yoyo: true,
      onComplete: () => {
        this.currentPhaseIndex++;
        if (this.currentPhaseIndex < this.phases.length) {
          this.phaseHP = this.phases[this.currentPhaseIndex]._effectiveHP;
          this.patternIndex = 0;
          this.attackTimer = 0;

          // Phase transition text
          const phaseText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            `Phase ${this.currentPhaseIndex + 1}`, {
              font: '28px monospace', fill: '#FF4500',
              stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
          scene.tweens.add({
            targets: phaseText, alpha: 0, y: GAME_HEIGHT / 2 - 40,
            delay: 800, duration: 500,
            onComplete: () => phaseText.destroy()
          });

          // Screen shake
          if (scene.particles) scene.particles.screenShake(0.02, 400);

          this._updateHealthBar();
          this.isTransitioning = false;
        }
      }
    });
  }

  _defeatBoss() {
    this.isDefeated = true;
    const scene = this.scene;
    scene.bossDefeated = true;

    // Slow-motion effect
    scene.time.timeScale = 0.5;
    scene.time.delayedCall(1500, () => { scene.time.timeScale = 1; });

    // Screen shake
    if (scene.particles) {
      scene.particles.screenShake(0.025, 500);
      scene.particles.emitSparkleCollect(this.boss.x, this.boss.y);
    }

    // Musical note explosion
    this._emitNoteExplosion();

    // Defeat animation
    scene.tweens.add({
      targets: this.boss,
      scaleX: 0, scaleY: 0, alpha: 0, angle: 360,
      duration: 1000,
      onComplete: () => {
        this.boss.destroy();
        this._hideUI();
        this._showVictory();
      }
    });

    // Clear projectiles
    this.projectiles.clear(true, true);
  }

  _emitNoteExplosion() {
    const scene = this.scene;
    const x = this.boss.x;
    const y = this.boss.y;

    const particles = scene.add.particles(x, y, 'particleNote', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1200,
      quantity: 20,
      tint: [0xFFD700, 0xFFFFFF, 0xFF69B4, 0x87CEEB],
      rotate: { min: 0, max: 360 },
      gravityY: -30,
      emitting: false
    });
    particles.explode();
    scene.time.delayedCall(1500, () => particles.destroy());
  }

  _showVictory() {
    const scene = this.scene;

    // Show instrument reward
    if (scene.instrument) {
      scene.instrument.setVisible(true);
      scene.instrument.body.enable = true;
      scene.tweens.add({
        targets: scene.instrument,
        scaleX: 1.2, scaleY: 1.2,
        duration: 800, yoyo: true, repeat: -1
      });
      if (scene.particles) {
        scene.particles.emitSparkle(scene.instrument.x, scene.instrument.y);
      }
    }

    // Victory quote
    const victoryText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.victoryQuote, {
      font: '20px monospace', fill: '#FFD700',
      stroke: '#000000', strokeThickness: 4,
      wordWrap: { width: GAME_WIDTH - 100 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    scene.tweens.add({
      targets: victoryText, alpha: 0, delay: 3000, duration: 1000
    });

    if (scene.sound.get('sfx_levelComplete')) {
      scene.sound.play('sfx_levelComplete', { volume: 0.5 });
    }
  }

  /**
   * Show dramatic intro dialogue before fight starts.
   */
  showDialogue(lines, onComplete) {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const scene = this.scene;
    this.dialogueActive = true;
    this.boss.setVelocityX(0);
    this.boss.setVelocityY(0);

    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH - 80, 70, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(200);
    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, lines[0], {
      font: '14px monospace', fill: '#FFFFFF',
      wordWrap: { width: GAME_WIDTH - 120 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    let lineIndex = 0;
    const advanceKey = scene.input.keyboard.addKey('SPACE');
    const advanceDialogue = () => {
      lineIndex++;
      if (lineIndex < lines.length) {
        text.setText(lines[lineIndex]);
      } else {
        bg.destroy();
        text.destroy();
        advanceKey.off('down', advanceDialogue);
        this.dialogueActive = false;
        if (onComplete) onComplete();
      }
    };
    advanceKey.on('down', advanceDialogue);
  }

  /**
   * Call in the scene's update() method.
   */
  update(time) {
    if (!this.boss || !this.boss.active) return;
    if (this.isDefeated || this.isTransitioning || this.dialogueActive) return;

    // Activate boss when player approaches
    if (!this.isActive) {
      const scene = this.scene;
      const anyClose = (scene.mozart && !scene.mozart.isDead && scene.mozart.x > this.activateX) ||
        (scene.nannerl && !scene.nannerl.isDead && scene.nannerl.x > this.activateX);
      if (anyClose) {
        this.isActive = true;
        this._showUI();

        // Stop current music, play boss music
        scene.sound.stopAll();
        if (scene.sound.get('music_boss')) {
          scene.sound.play('music_boss', { loop: true, volume: 0.3 });
        }

        // Show dialogue
        if (this.dialogue.length > 0 && !this.dialogueShown) {
          this.dialogueShown = true;
          this.showDialogue(this.dialogue);
        }
      }
      return;
    }

    // Run current phase's update function
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (currentPhase && currentPhase.update) {
      currentPhase.update(this, time);
    }
  }

  /**
   * Open a vulnerability window for the specified duration.
   */
  openVulnerability(duration = 2000) {
    if (this.isVulnerable) return;
    this.isVulnerable = true;

    // Visual indicator: boss flashes gold
    this.scene.tweens.add({
      targets: this.boss,
      tint: 0xFFD700,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(duration / 400) - 1,
      onStart: () => { this.boss.setTint(0xFFD700); },
      onComplete: () => {
        this.boss.clearTint();
        this.isVulnerable = false;
      }
    });

    this.scene.time.delayedCall(duration, () => {
      this.isVulnerable = false;
      this.boss.clearTint();
    });
  }

  /**
   * Get the nearest player target.
   */
  getTarget() {
    const scene = this.scene;
    let target = scene.mozart;
    if (scene.coopMode && scene.nannerl && !scene.nannerl.isDead) {
      if (scene.mozart.isDead) {
        target = scene.nannerl;
      } else {
        const d1 = Math.abs(scene.mozart.x - this.boss.x);
        const d2 = Math.abs(scene.nannerl.x - this.boss.x);
        target = d1 < d2 ? scene.mozart : scene.nannerl;
      }
    }
    return target;
  }

  /**
   * Fire a projectile toward the target player.
   */
  fireProjectile(speed = 150, texture = 'bossProjectile') {
    const target = this.getTarget();
    const proj = this.projectiles.create(this.boss.x, this.boss.y - 10, texture);
    if (!proj) return;
    proj.body.setAllowGravity(false);
    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, target.x, target.y);
    proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.scene.time.delayedCall(4000, () => { if (proj.active) proj.destroy(); });
    return proj;
  }

  /**
   * Fire a shockwave along the ground.
   */
  fireShockwave(speed = 200, direction = 1) {
    const proj = this.projectiles.create(
      this.boss.x + direction * 30,
      this.boss.y + 20,
      'bossShockwave'
    );
    if (!proj) return;
    proj.body.setAllowGravity(false);
    proj.setVelocityX(speed * direction);
    proj.setScale(1.5, 0.5);
    this.scene.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
    return proj;
  }

  /**
   * Move boss toward target.
   */
  moveTowardTarget(speed = 100) {
    const target = this.getTarget();
    if (target.x > this.boss.x + 30) {
      this.boss.setVelocityX(speed);
      this.boss.setFlipX(false);
    } else if (target.x < this.boss.x - 30) {
      this.boss.setVelocityX(-speed);
      this.boss.setFlipX(true);
    } else {
      this.boss.setVelocityX(0);
    }
  }

  /**
   * Make boss jump.
   */
  jump(force = -350) {
    if (this.boss.body.blocked.down || this.boss.body.touching.down) {
      this.boss.setVelocityY(force);
    }
  }

  /**
   * Spawn minion enemies during the boss fight.
   */
  spawnMinion(x, y, texture = 'bossMinion', speed = 80) {
    const minion = this.scene.physics.add.sprite(x, y, texture);
    minion.body.setAllowGravity(true);
    minion.setScale(1.5);
    if (this.scene.platforms) {
      this.scene.physics.add.collider(minion, this.scene.platforms);
    }
    // Move toward player
    const target = this.getTarget();
    const dir = target.x > x ? 1 : -1;
    minion.setVelocityX(speed * dir);
    // Player can stomp minions
    const stompCallback = (player, m) => {
      if (player.body.velocity.y > 0 && player.y < m.y - 10) {
        m.destroy();
        player.setVelocityY(-250);
        if (this.scene.sound.get('sfx_hit')) this.scene.sound.play('sfx_hit', { volume: 0.2 });
      } else {
        player.hit();
      }
    };
    this.scene.physics.add.overlap(this.scene.mozart, minion, stompCallback);
    if (this.scene.coopMode && this.scene.nannerl) {
      this.scene.physics.add.overlap(this.scene.nannerl, minion, stompCallback);
    }
    this.scene.time.delayedCall(8000, () => { if (minion.active) minion.destroy(); });
    return minion;
  }
}
