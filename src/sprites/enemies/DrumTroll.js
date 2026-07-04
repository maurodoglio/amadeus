import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class DrumTroll extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'drumTroll');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.body.setAllowGravity(true);
    this.setSize(24, 32);
    this.setOffset(4, 2);

    this.speed = options.speed || ENEMIES.DRUM_TROLL.SPEED;
    this.direction = 1;
    this.startX = x;
    this.patrolDistance = options.patrolDistance || 80;
    this.jumpTimer = 0;
    this.jumpInterval = options.jumpInterval || 2000;

    // Shockwave on landing
    this.canShockwave = options.canShockwave !== undefined ? options.canShockwave : true;
    this.shockwaveRange = options.shockwaveRange || 80;
    this.wasAirborne = false;
    this.shockwaves = [];

    // Player detection
    this.detectionRange = options.detectionRange || 200;
    this.isAggro = false;

    this.setVelocityX(this.speed * this.direction);
  }

  update(time) {
    const player = this.scene.mozart;
    const isGrounded = this.body.blocked.down || this.body.touching.down;

    // Shockwave on landing
    if (this.canShockwave && isGrounded && this.wasAirborne) {
      this.createShockwave();
    }
    this.wasAirborne = !isGrounded;

    // Player detection - jump more aggressively when player is near
    if (player && !player.isDead) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.detectionRange) {
        this.isAggro = true;
        // Face the player
        if (player.x < this.x) {
          this.direction = -1;
          this.setFlipX(true);
        } else {
          this.direction = 1;
          this.setFlipX(false);
        }
      } else if (dist > this.detectionRange * 1.5) {
        this.isAggro = false;
      }
    }

    if (!this.isAggro) {
      // Normal patrol
      if (this.x > this.startX + this.patrolDistance) {
        this.direction = -1;
        this.setFlipX(true);
      } else if (this.x < this.startX - this.patrolDistance) {
        this.direction = 1;
        this.setFlipX(false);
      }
    }

    this.setVelocityX(this.speed * this.direction);

    // Periodic jumping (faster when aggro)
    const interval = this.isAggro ? this.jumpInterval * 0.6 : this.jumpInterval;
    if (time > this.jumpTimer && isGrounded) {
      this.setVelocityY(ENEMIES.DRUM_TROLL.JUMP_FORCE);
      this.jumpTimer = time + interval;
    }

    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(false);
    }

    // Clean up shockwaves
    this.shockwaves = this.shockwaves.filter(sw => sw.active);
  }

  createShockwave() {
    // Create two shockwave sprites going left and right
    [-1, 1].forEach(dir => {
      const shockwave = this.scene.physics.add.sprite(
        this.x + (dir * 15),
        this.y + 12,
        'dissonantNote'
      );
      shockwave.setDisplaySize(20, 10);
      shockwave.body.setAllowGravity(false);
      shockwave.setTint(0xffaa00);
      shockwave.setAlpha(0.7);
      shockwave.isShockwave = true;

      shockwave.setVelocityX(150 * dir);

      if (this.scene.enemies) {
        this.scene.enemies.add(shockwave);
      }
      this.shockwaves.push(shockwave);

      // Fade and destroy
      this.scene.tweens.add({
        targets: shockwave,
        alpha: 0,
        scaleX: 1.5,
        duration: 600,
        onComplete: () => { if (shockwave.active) shockwave.destroy(); }
      });
    });
  }
}
