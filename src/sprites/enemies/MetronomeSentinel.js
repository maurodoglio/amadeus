import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

/**
 * Metronome Sentinel - Attacks on a predictable rhythmic beat.
 * Players can learn the timing pattern to dodge attacks.
 * The sentinel swings its arm/pendulum and releases shockwaves on the beat.
 * Appears from Level 4 onwards.
 */
export class MetronomeSentinel extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'metronomeSentinel');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.body.setAllowGravity(true);
    this.setSize(22, 40);
    this.setOffset(5, 2);

    const config = ENEMIES.METRONOME_SENTINEL;
    this.beatInterval = options.beatInterval || config.BEAT_INTERVAL;
    this.attackRange = options.attackRange || config.ATTACK_RANGE;
    this.shockwaveSpeed = options.shockwaveSpeed || config.SHOCKWAVE_SPEED;

    this.lastBeat = 0;
    this.beatPhase = 0; // 0 = wind up, 1 = attack
    this.windUpDuration = this.beatInterval * 0.3;
    this.isAttacking = false;
    this.shockwaves = [];
    this.detectionRange = options.detectionRange || 250;

    // Visual pendulum indicator
    this.pendulumAngle = 0;
    this.pendulumDirection = 1;
  }

  update(time, delta) {
    const player = this.scene.mozart;
    if (!player || player.isDead) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Update pendulum swing (visual rhythm indicator)
    this.pendulumAngle += this.pendulumDirection * (delta / this.beatInterval) * Math.PI * 2;
    if (Math.abs(this.pendulumAngle) > Math.PI / 3) {
      this.pendulumDirection *= -1;
    }

    // Tint to indicate beat phase
    const beatProgress = ((time - this.lastBeat) % this.beatInterval) / this.beatInterval;
    if (beatProgress > 0.7) {
      // Wind-up - telegraph the attack with a red tint
      this.setTint(Phaser.Display.Color.GetColor(
        255,
        Math.floor(255 * (1 - (beatProgress - 0.7) / 0.3)),
        Math.floor(255 * (1 - (beatProgress - 0.7) / 0.3))
      ));
    } else {
      this.clearTint();
    }

    // Attack on the beat
    if (time > this.lastBeat + this.beatInterval) {
      this.lastBeat = time;
      if (dist < this.detectionRange) {
        this.releaseShockwave(player);
      }
    }

    // Face the player
    if (dist < this.detectionRange) {
      this.setFlipX(player.x < this.x);
    }

    // Update shockwaves
    this.shockwaves = this.shockwaves.filter(sw => sw.active);
  }

  releaseShockwave(player) {
    this.isAttacking = true;

    // Create shockwave projectile that travels along the ground
    const direction = player.x > this.x ? 1 : -1;
    const shockwave = this.scene.physics.add.sprite(
      this.x + (direction * 20),
      this.y + 10,
      'dissonantNote'
    );
    shockwave.setDisplaySize(24, 12);
    shockwave.body.setAllowGravity(false);
    shockwave.setTint(0xff8800);
    shockwave.setAlpha(0.8);
    shockwave.isShockwave = true;

    shockwave.setVelocityX(this.shockwaveSpeed * direction);

    // Add to enemies group for collision
    if (this.scene.enemies) {
      this.scene.enemies.add(shockwave);
    }
    this.shockwaves.push(shockwave);

    // Auto-destroy after travelling its range
    this.scene.time.delayedCall(this.attackRange / this.shockwaveSpeed * 1000, () => {
      if (shockwave.active) {
        this.scene.tweens.add({
          targets: shockwave,
          alpha: 0,
          duration: 200,
          onComplete: () => shockwave.destroy()
        });
      }
    });

    // Brief attack animation
    this.scene.time.delayedCall(200, () => {
      this.isAttacking = false;
    });
  }
}
