import Phaser from 'phaser';

/**
 * On-screen virtual D-pad and jump button for touch-capable devices.
 * Renders as a Phaser Scene overlay (run in parallel with game scenes).
 */
export class TouchControls extends Phaser.Scene {
  constructor() {
    super({ key: 'TouchControls', active: false });
    this.isLeft = false;
    this.isRight = false;
    this.isJump = false;
  }

  create() {
    // Only show on touch-capable devices
    if (!this.sys.game.device.input.touch) {
      this.scene.stop();
      return;
    }

    const { width, height } = this.cameras.main;
    const padding = 20;
    const btnSize = 48;
    const dpadCenterX = padding + btnSize + 10;
    const dpadCenterY = height - padding - btnSize;

    this.createDpad(dpadCenterX, dpadCenterY, btnSize);
    this.createJumpButton(width - padding - btnSize, dpadCenterY, btnSize);

    // Ensure this scene renders on top
    this.scene.bringToTop();
  }

  createDpad(cx, cy, size) {
    const alpha = 0.4;

    // Left button
    this.leftBtn = this.add.circle(cx - size - 5, cy, size * 0.7, 0xffffff, alpha)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000);
    this.add.triangle(cx - size - 5, cy, 10, 0, -8, 12, -8, -12, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    // Right button
    this.rightBtn = this.add.circle(cx + size + 5, cy, size * 0.7, 0xffffff, alpha)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000);
    this.add.triangle(cx + size + 5, cy, -10, 0, 8, 12, 8, -12, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    // Bind pointer events
    this.leftBtn.on('pointerdown', () => { this.isLeft = true; });
    this.leftBtn.on('pointerup', () => { this.isLeft = false; });
    this.leftBtn.on('pointerout', () => { this.isLeft = false; });

    this.rightBtn.on('pointerdown', () => { this.isRight = true; });
    this.rightBtn.on('pointerup', () => { this.isRight = false; });
    this.rightBtn.on('pointerout', () => { this.isRight = false; });
  }

  createJumpButton(x, y, size) {
    const alpha = 0.4;

    this.jumpBtn = this.add.circle(x, y, size, 0x4488ff, alpha)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000);

    // Arrow pointing up
    this.add.triangle(x, y - 5, 0, -14, 12, 10, -12, 10, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    this.jumpBtn.on('pointerdown', () => { this.isJump = true; });
    this.jumpBtn.on('pointerup', () => { this.isJump = false; });
    this.jumpBtn.on('pointerout', () => { this.isJump = false; });
  }
}
