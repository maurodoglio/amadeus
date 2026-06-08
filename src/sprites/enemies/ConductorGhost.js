import Phaser from 'phaser';
import { ENEMIES } from '../../config/constants.js';

/**
 * Conductor Ghost - Teleports around and summons minion notes.
 * Appears in later levels (5+). Teleports to a new position periodically,
 * and summons small minion projectiles that float toward the player.
 */
export class ConductorGhost extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'conductorGhost');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setSize(24, 36);
    this.setOffset(4, 2);
    this.setAlpha(0.85);

    const config = ENEMIES.CONDUCTOR_GHOST;
    this.speed = options.speed || config.SPEED;
    this.teleportInterval = options.teleportInterval || config.TELEPORT_INTERVAL;
    this.summonInterval = options.summonInterval || config.SUMMON_INTERVAL;
    this.teleportRadius = options.teleportRadius || 150;
    this.detectionRange = options.detectionRange || 200;

    this.startX = x;
    this.startY = y;
    this.lastTeleport = 0;
    this.lastSummon = 0;
    this.isVisible = true;
    this.minions = [];
    this.maxMinions = 3;
  }

  update(time, _delta) {
    const player = this.scene.mozart;
    if (!player || player.isDead) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Teleport when player is nearby
    if (dist < this.detectionRange && time > this.lastTeleport + this.teleportInterval) {
      this.teleport();
      this.lastTeleport = time;
    }

    // Summon minions when player is in range
    if (dist < this.detectionRange * 1.5 && time > this.lastSummon + this.summonInterval) {
      this.summonMinion();
      this.lastSummon = time;
    }

    // Float gently
    this.y = this.startY + Math.sin(time * 0.002) * 15;

    // Update minions
    this.minions = this.minions.filter(m => m.active);
    this.minions.forEach(minion => {
      if (player && !player.isDead) {
        const angle = Phaser.Math.Angle.Between(minion.x, minion.y, player.x, player.y);
        minion.setVelocity(
          Math.cos(angle) * 60,
          Math.sin(angle) * 60
        );
      }
    });
  }

  teleport() {
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Move to new position within radius of start
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.FloatBetween(50, this.teleportRadius);
        this.x = this.startX + Math.cos(angle) * dist;
        this.y = this.startY + Math.sin(angle) * dist;

        // Clamp to world bounds
        this.x = Phaser.Math.Clamp(this.x, 50, this.scene.physics.world.bounds.width - 50);
        this.y = Phaser.Math.Clamp(this.y, 50, this.scene.physics.world.bounds.height - 100);

        // Fade back in
        this.scene.tweens.add({
          targets: this,
          alpha: 0.85,
          duration: 300
        });
      }
    });
  }

  summonMinion() {
    // Clean up destroyed minions
    this.minions = this.minions.filter(m => m.active);
    if (this.minions.length >= this.maxMinions) return;

    const minion = this.scene.physics.add.sprite(this.x, this.y, 'dissonantNote');
    minion.setDisplaySize(12, 16);
    minion.body.setAllowGravity(false);
    minion.setAlpha(0.7);
    minion.isMinion = true;

    // Add to enemies group for collision
    if (this.scene.enemies) {
      this.scene.enemies.add(minion);
    }
    this.minions.push(minion);

    // Auto-destroy after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      if (minion.active) minion.destroy();
    });
  }
}
