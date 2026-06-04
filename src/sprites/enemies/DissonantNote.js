import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class DissonantNote extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dissonantNote');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setSize(18, 24);
    this.setOffset(3, 4);

    this.speed = ENEMIES.DISSONANT_NOTE.SPEED;
    this.startY = y;
    this.floatAmplitude = ENEMIES.DISSONANT_NOTE.FLOAT_AMPLITUDE;
    this.floatSpeed = 2;
    this.elapsed = 0;
    this.direction = 1;
    this.startX = x;
    this.patrolDistance = 60;
  }

  update(time, delta) {
    // Float up and down
    this.elapsed += delta * 0.001 * this.floatSpeed;
    this.y = this.startY + Math.sin(this.elapsed * Math.PI) * this.floatAmplitude;

    // Patrol horizontally
    if (this.x > this.startX + this.patrolDistance) {
      this.direction = -1;
    } else if (this.x < this.startX - this.patrolDistance) {
      this.direction = 1;
    }
    this.x += this.speed * this.direction * (delta / 1000);
  }
}
