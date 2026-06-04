import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Iris wipe transition scene with level name card.
 * Displays a circle mask that closes/opens between levels.
 */
export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TransitionScene' });
  }

  init(data) {
    this.nextScene = data.nextScene || 'MenuScene';
    this.levelName = data.levelName || '';
    this.sceneData = data.sceneData || {};
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);

    // Black background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000).setDepth(0);

    // Level name card
    const nameText = this.add.text(cx, cy - 30, this.levelName, {
      font: '28px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    const subtitleText = this.add.text(cx, cy + 15, '~ Get Ready ~', {
      font: '14px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    // Iris close mask (rendered as a black overlay with circle cutout)
    const graphics = this.add.graphics().setDepth(10);

    // Phase 1: Iris closes (circle shrinks to zero)
    this.tweens.addCounter({
      from: maxRadius,
      to: 0,
      duration: 600,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => {
        const radius = tween.getValue();
        graphics.clear();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Cut a circle out using blend
        graphics.fillStyle(0x000000, 0);
        // Draw the mask by filling everything except the circle
        this.drawIrisMask(graphics, cx, cy, radius);
      },
      onComplete: () => {
        graphics.clear();
        // Full black screen - show level name
        this.tweens.add({
          targets: [nameText, subtitleText],
          alpha: 1,
          duration: 400,
          onComplete: () => {
            // Hold the name card
            this.time.delayedCall(1000, () => {
              this.tweens.add({
                targets: [nameText, subtitleText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  // Start the next scene underneath
                  this.scene.launch(this.nextScene, this.sceneData);
                  this.scene.bringToTop();

                  // Phase 2: Iris opens (circle grows from zero)
                  this.time.delayedCall(200, () => {
                    this.tweens.addCounter({
                      from: 0,
                      to: maxRadius,
                      duration: 600,
                      ease: 'Quad.easeOut',
                      onUpdate: (tween) => {
                        const radius = tween.getValue();
                        graphics.clear();
                        this.drawIrisMask(graphics, cx, cy, radius);
                      },
                      onComplete: () => {
                        graphics.destroy();
                        this.scene.stop();
                      }
                    });
                  });
                }
              });
            });
          }
        });
      }
    });
  }

  drawIrisMask(graphics, cx, cy, radius) {
    // Draw a full-screen black rect with a circular hole
    // We achieve this by drawing black everywhere except the circle
    graphics.clear();
    if (radius <= 0) {
      graphics.fillStyle(0x000000, 1);
      graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      return;
    }

    // Use a shape to create the mask effect
    // Draw the black border around the circle
    graphics.fillStyle(0x000000, 1);

    // Top
    graphics.fillRect(0, 0, GAME_WIDTH, Math.max(0, cy - radius));
    // Bottom
    graphics.fillRect(0, cy + radius, GAME_WIDTH, GAME_HEIGHT - (cy + radius));

    // Draw the sides row by row for smooth circle
    const steps = Math.ceil(radius * 2);
    for (let i = 0; i < steps; i++) {
      const y = cy - radius + i;
      if (y < 0 || y >= GAME_HEIGHT) continue;
      const dy = y - cy;
      const halfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));
      const left = cx - halfWidth;
      const right = cx + halfWidth;

      if (left > 0) graphics.fillRect(0, y, left, 1);
      if (right < GAME_WIDTH) graphics.fillRect(right, y, GAME_WIDTH - right, 1);
    }
  }
}
