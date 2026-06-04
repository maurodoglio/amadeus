import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class BrokenInstrument extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'brokenInstrument');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.body.setAllowGravity(true);
    this.setSize(20, 36);
    this.setOffset(4, 2);

    this.speed = ENEMIES.BROKEN_INSTRUMENT.SPEED;
    this.chargeSpeed = ENEMIES.BROKEN_INSTRUMENT.CHARGE_SPEED;
    this.direction = 1;
    this.startX = x;
    this.patrolDistance = 80;
    this.isCharging = false;
    this.chargeTimer = 0;
    this.chargeInterval = 3000;

    this.setVelocityX(this.speed * this.direction);
  }

  update(time) {
    const player = this.scene.mozart;
    if (!player) return;

    // Check if player is nearby to charge
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distToPlayer < 150 && time > this.chargeTimer && !this.isCharging) {
      this.isCharging = true;
      this.chargeTimer = time + this.chargeInterval;

      // Charge toward player
      const chargeDir = player.x > this.x ? 1 : -1;
      this.setVelocityX(this.chargeSpeed * chargeDir);
      this.setFlipX(chargeDir < 0);

      // End charge after a short duration
      this.scene.time.delayedCall(800, () => {
        this.isCharging = false;
      });
    }

    if (!this.isCharging) {
      // Normal patrol
      if (this.x > this.startX + this.patrolDistance) {
        this.direction = -1;
        this.setFlipX(true);
      } else if (this.x < this.startX - this.patrolDistance) {
        this.direction = 1;
        this.setFlipX(false);
      }

      this.setVelocityX(this.speed * this.direction);

      if (this.body.blocked.right) {
        this.direction = -1;
        this.setFlipX(true);
      } else if (this.body.blocked.left) {
        this.direction = 1;
        this.setFlipX(false);
      }
    }
  }
}
