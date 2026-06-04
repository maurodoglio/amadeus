/**
 * Combo multiplier system that builds when collecting notes or stomping
 * enemies in quick succession. Resets after a timeout.
 */
export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.multiplier = 1;
    this.comboCount = 0;
    this.comboTimeout = 3000; // Reset after 3 seconds idle
    this.lastActionTime = 0;
    this.maxMultiplier = 4;
    this.timer = null;
  }

  /**
   * Register a scoring action. Returns the current multiplier to apply.
   */
  registerAction() {
    const now = this.scene.time.now;
    this.comboCount++;

    // Increase multiplier at thresholds
    if (this.comboCount >= 8) {
      this.multiplier = 4;
    } else if (this.comboCount >= 5) {
      this.multiplier = 3;
    } else if (this.comboCount >= 2) {
      this.multiplier = 2;
    }

    this.lastActionTime = now;

    // Reset/restart the decay timer
    if (this.timer) {
      this.timer.remove(false);
    }
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => {
      this.reset();
    });

    return this.multiplier;
  }

  reset() {
    this.multiplier = 1;
    this.comboCount = 0;
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
    // Notify UI
    this.scene.registry.set('comboMultiplier', 1);
    this.scene.registry.set('comboCount', 0);
  }

  getMultiplier() {
    return this.multiplier;
  }

  getComboCount() {
    return this.comboCount;
  }

  destroy() {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
  }
}
