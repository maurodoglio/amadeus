import Phaser from 'phaser';

/**
 * Manages particle effects throughout the game.
 * Provides reusable methods for dust, musical notes, poof, sparkle effects.
 */
export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Emit dust particles when player lands on ground.
   */
  emitDust(x, y) {
    const particles = this.scene.add.particles(x, y, 'particleDust', {
      speed: { min: 20, max: 60 },
      angle: { min: 200, max: 340 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 6,
      gravityY: 100,
      emitting: false
    });

    particles.explode();
    this.scene.time.delayedCall(600, () => particles.destroy());
  }

  /**
   * Emit musical note particles when collecting an item.
   */
  emitNoteCollect(x, y) {
    const particles = this.scene.add.particles(x, y, 'particleNote', {
      speed: { min: 50, max: 120 },
      angle: { min: 220, max: 320 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 8,
      gravityY: -50,
      rotate: { min: 0, max: 360 },
      emitting: false
    });

    particles.explode();
    this.scene.time.delayedCall(800, () => particles.destroy());
  }

  /**
   * Emit poof particles when stomping an enemy.
   */
  emitStomp(x, y) {
    const particles = this.scene.add.particles(x, y, 'particlePoof', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 500,
      quantity: 10,
      emitting: false
    });

    particles.explode();
    this.scene.time.delayedCall(700, () => particles.destroy());
  }

  /**
   * Emit sparkle particles around instruments.
   * Returns the emitter so it can be destroyed when needed.
   */
  emitSparkle(x, y) {
    const particles = this.scene.add.particles(x, y, 'particleSparkle', {
      speed: { min: 10, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      frequency: 200,
      quantity: 1,
      gravityY: -20,
      emitting: true
    });

    return particles;
  }

  /**
   * Emit a burst of sparkles (for instrument collection).
   */
  emitSparkleCollect(x, y) {
    const particles = this.scene.add.particles(x, y, 'particleSparkle', {
      speed: { min: 80, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 15,
      tint: [0xFFD700, 0xFFFFFF, 0xFFA500],
      emitting: false
    });

    particles.explode();
    this.scene.time.delayedCall(1200, () => particles.destroy());
  }

  /**
   * Screen shake effect for boss hits.
   */
  screenShake(intensity = 0.01, duration = 200) {
    this.scene.cameras.main.shake(duration, intensity);
  }
}
