import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

export class Singer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'singer');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.body.setAllowGravity(true);
    this.setSize(24, 36);
    this.setOffset(4, 2);

    this.speed = options.speed || ENEMIES.SINGER.SPEED;
    this.direction = 1;
    this.patrolDistance = options.patrolDistance || 100;
    this.startX = x;

    // Projectile shooting
    this.canShoot = options.canShoot !== undefined ? options.canShoot : true;
    this.shootInterval = options.shootInterval || 2500;
    this.lastShot = 0;
    this.projectileSpeed = options.projectileSpeed || 150;
    this.detectionRange = options.detectionRange || 200;
    this.projectiles = [];

    // Player tracking
    this.isAggro = false;
    this.aggroRange = options.aggroRange || 180;

    this.setVelocityX(this.speed * this.direction);
  }

  update(time, _delta) {
    const player = this.scene.mozart;

    // Player detection and aggro
    if (player && !player.isDead) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (dist < this.aggroRange) {
        this.isAggro = true;
        // Face the player when aggro
        if (player.x < this.x) {
          this.direction = -1;
          this.setFlipX(true);
        } else {
          this.direction = 1;
          this.setFlipX(false);
        }

        // Shoot projectiles toward player
        if (this.canShoot && time > this.lastShot + this.shootInterval) {
          this.shootProjectile(player);
          this.lastShot = time;
        }
      } else if (dist > this.aggroRange * 1.5) {
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

    // Turn at edges
    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(false);
    }

    // Clean up projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
  }

  shootProjectile(player) {
    const projectile = this.scene.physics.add.sprite(this.x, this.y - 10, 'musicNote');
    projectile.setDisplaySize(14, 14);
    projectile.body.setAllowGravity(false);
    projectile.setTint(0xff0066);
    projectile.isProjectile = true;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    projectile.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed
    );

    // Add to enemies group for collision
    if (this.scene.enemies) {
      this.scene.enemies.add(projectile);
    }
    this.projectiles.push(projectile);

    // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (projectile.active) projectile.destroy();
    });
  }
}
