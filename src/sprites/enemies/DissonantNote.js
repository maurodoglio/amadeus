import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';
import { AnimationManager } from '../../utils/AnimationManager.js';

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
    this.isAggro = false;
    this.aggroRadius = 120;

    // Register and play pulse animation
    const animManager = new AnimationManager(scene);
    animManager.registerEnemyAnimations();

    if (scene.anims.exists('dissonantNote_pulse')) {
      this.play('dissonantNote_pulse');
    }
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

    // Check aggro state based on player proximity
    const player = this.scene.mozart;
    if (player && !player.isDead) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.aggroRadius && !this.isAggro) {
        this.isAggro = true;
        if (this.scene.anims.exists('dissonantNote_aggro')) {
          this.play('dissonantNote_aggro');
        }
        this.speed = ENEMIES.DISSONANT_NOTE.SPEED * 1.5;
      } else if (dist >= this.aggroRadius * 1.5 && this.isAggro) {
        this.isAggro = false;
        if (this.scene.anims.exists('dissonantNote_pulse')) {
          this.play('dissonantNote_pulse');
        }
        this.speed = ENEMIES.DISSONANT_NOTE.SPEED;
      }
    }
  }
}
