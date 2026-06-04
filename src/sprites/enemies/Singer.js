import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class Singer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'singer');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.body.setAllowGravity(true);
    this.setSize(24, 36);
    this.setOffset(4, 2);

    this.speed = ENEMIES.SINGER.SPEED;
    this.direction = 1;
    this.patrolDistance = 100;
    this.startX = x;

    this.setVelocityX(this.speed * this.direction);
  }

  update() {
    // Patrol back and forth
    if (this.x > this.startX + this.patrolDistance) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.x < this.startX - this.patrolDistance) {
      this.direction = 1;
      this.setFlipX(false);
    }

    this.setVelocityX(this.speed * this.direction);

    // Turn at edges
    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(false);
    }
  }
}
