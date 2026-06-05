import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { createCurtainRise, COLORS } from '../ui/UITheme.js';

/**
 * Theater curtain transition scene with level name card.
 * Red curtains part to reveal the level.
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

    // Dark stage background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0a).setDepth(0);

    // Level name card (displayed behind curtain, revealed when curtain opens)
    const nameText = this.add.text(cx, cy - 30, this.levelName, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    const subtitleText = this.add.text(cx, cy + 15, '~ The Stage is Set ~', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#F5E6C8',
    }).setOrigin(0.5).setDepth(1);

    // Musical ornaments around title
    this.add.text(cx - 120, cy - 30, '𝄞', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#B8860B',
    }).setOrigin(0.5).setDepth(1);

    this.add.text(cx + 120, cy - 30, '𝄞', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#B8860B',
    }).setOrigin(0.5).setDepth(1);

    // Phase 1: Show name card for a moment
    this.time.delayedCall(1200, () => {
      // Fade out text
      this.tweens.add({
        targets: [nameText, subtitleText],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          // Launch the next scene behind this one
          this.scene.launch(this.nextScene, this.sceneData);
          this.scene.bringToTop();

          // Phase 2: Theater curtain rise effect reveals the level
          this.time.delayedCall(200, () => {
            createCurtainRise(this, GAME_WIDTH, GAME_HEIGHT, () => {
              this.scene.stop();
            });
          });
        }
      });
    });
  }
}
