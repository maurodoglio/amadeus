import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

/**
 * Sheet Music Bat - Flies in formation patterns (sine wave, V-shape, circle).
 * Multiple bats can be spawned together for coordinated flight patterns.
 * Appears from Level 3 onwards.
 */
export class SheetMusicBat extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'sheetMusicBat');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setSize(20, 16);
    this.setOffset(2, 4);

    const config = ENEMIES.SHEET_MUSIC_BAT;
    this.speed = options.speed || config.SPEED;
    this.pattern = options.pattern || 'sine'; // 'sine', 'circle', 'dive'
    this.formationIndex = options.formationIndex || 0;
    this.formationOffset = options.formationOffset || 0;

    this.startX = x;
    this.startY = y;
    this.elapsed = 0;
    this.amplitude = options.amplitude || config.AMPLITUDE;
    this.frequency = options.frequency || 1.5;
    this.diveSpeed = config.DIVE_SPEED;

    // Dive attack state
    this.isDiving = false;
    this.diveTarget = null;
    this.diveCooldown = 0;
    this.diveCooldownTime = options.diveCooldownTime || 3000;
    this.detectionRange = options.detectionRange || 180;
  }

  update(time, delta) {
    this.elapsed += delta * 0.001;

    const player = this.scene.mozart;

    // Check for dive attack
    if (player && !player.isDead && !this.isDiving && time > this.diveCooldown) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.detectionRange && player.y > this.y) {
        this.startDive(player);
      }
    }

    if (this.isDiving) {
      this.updateDive(delta);
    } else {
      this.updateFormation(time, delta);
    }
  }

  updateFormation(_time, _delta) {
    const phaseOffset = this.formationIndex * 0.5 + this.formationOffset;

    switch (this.pattern) {
      case 'sine':
        this.x = this.startX + this.speed * this.elapsed;
        this.y = this.startY + Math.sin((this.elapsed + phaseOffset) * this.frequency * Math.PI) * this.amplitude;
        // Reverse when too far from start
        if (Math.abs(this.x - this.startX) > 200) {
          this.speed = -this.speed;
          this.startX = this.x;
        }
        break;

      case 'circle':
        this.x = this.startX + Math.cos((this.elapsed + phaseOffset) * this.frequency) * this.amplitude;
        this.y = this.startY + Math.sin((this.elapsed + phaseOffset) * this.frequency) * this.amplitude * 0.6;
        break;

      case 'dive':
        // Hover and swoop pattern
        this.x = this.startX + Math.sin(this.elapsed * 0.8 + phaseOffset) * 60;
        this.y = this.startY + Math.sin(this.elapsed * 2 + phaseOffset) * 20;
        break;
    }

    // Flip based on movement direction
    this.setFlipX(this.speed < 0 || (this.pattern === 'circle' && Math.sin(this.elapsed * this.frequency) < 0));
  }

  startDive(player) {
    this.isDiving = true;
    this.diveTarget = { x: player.x, y: player.y + 10 };
    this.setTint(0xff4444);
  }

  updateDive(delta) {
    if (!this.diveTarget) {
      this.endDive();
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y);
    this.x += Math.cos(angle) * this.diveSpeed * (delta / 1000);
    this.y += Math.sin(angle) * this.diveSpeed * (delta / 1000);

    // End dive when reaching target or going below
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y);
    if (dist < 20 || this.y > this.diveTarget.y + 30) {
      this.endDive();
    }
  }

  endDive() {
    this.isDiving = false;
    this.diveTarget = null;
    this.diveCooldown = this.scene.time.now + this.diveCooldownTime;
    this.clearTint();

    // Return to start position
    this.scene.tweens.add({
      targets: this,
      x: this.startX,
      y: this.startY,
      duration: 800,
      ease: 'Sine.easeOut'
    });
  }
}
