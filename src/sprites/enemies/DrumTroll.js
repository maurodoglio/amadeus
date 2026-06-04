import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class DrumTroll extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'drumTroll');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.body.setAllowGravity(true);
    this.setSize(24, 32);
    this.setOffset(4, 2);

    this.speed = ENEMIES.DRUM_TROLL.SPEED;
    this.direction = 1;
    this.startX = x;
    this.patrolDistance = 80;
    this.jumpTimer = 0;
    this.jumpInterval = 2000;

    this.setVelocityX(this.speed * this.direction);
  }

  update(time) {
    // Patrol
    if (this.x > this.startX + this.patrolDistance) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.x < this.startX - this.patrolDistance) {
      this.direction = 1;
      this.setFlipX(false);
    }

    this.setVelocityX(this.speed * this.direction);

    // Periodic jumping
    if (time > this.jumpTimer && (this.body.blocked.down || this.body.touching.down)) {
      this.setVelocityY(ENEMIES.DRUM_TROLL.JUMP_FORCE);
      this.jumpTimer = time + this.jumpInterval;
    }

    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(false);
    }
  }
}
