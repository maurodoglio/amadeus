import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Reusable dialogue UI component with typewriter effect and character portraits.
 */
export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.canAdvance = false;
    this.dialogues = [];
    this.currentIndex = 0;
    this.textTimer = null;
    this.onComplete = null;

    this.createUI();
    this.hide();
  }

  createUI() {
    const boxWidth = GAME_WIDTH - 80;
    const boxHeight = 130;
    const boxY = GAME_HEIGHT - 90;

    this.container = this.scene.add.container(GAME_WIDTH / 2, boxY);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // Background panel
    const bg = this.scene.add.rectangle(0, 0, boxWidth, boxHeight, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xFFD700);
    this.container.add(bg);

    // Portrait frame (left side)
    this.portraitBg = this.scene.add.rectangle(
      -boxWidth / 2 + 45, 0, 70, 70, 0x222222
    );
    this.portraitBg.setStrokeStyle(2, 0xFFD700);
    this.container.add(this.portraitBg);

    // Portrait image
    this.portraitImage = this.scene.add.image(-boxWidth / 2 + 45, 0, 'mozart');
    this.portraitImage.setScale(2);
    this.container.add(this.portraitImage);

    // Character name
    this.nameText = this.scene.add.text(
      -boxWidth / 2 + 90, -boxHeight / 2 + 12, '', {
        font: 'bold 14px monospace',
        fill: '#FFD700'
      }
    );
    this.container.add(this.nameText);

    // Dialogue text
    this.dialogText = this.scene.add.text(
      -boxWidth / 2 + 90, -boxHeight / 2 + 32, '', {
        font: '13px monospace',
        fill: '#FFFFFF',
        wordWrap: { width: boxWidth - 120 }
      }
    );
    this.container.add(this.dialogText);

    // Continue indicator
    this.continueIndicator = this.scene.add.text(
      boxWidth / 2 - 20, boxHeight / 2 - 20, '▼', {
        font: '14px monospace',
        fill: '#FFD700'
      }
    ).setOrigin(1, 1);
    this.container.add(this.continueIndicator);

    // Blink animation for continue indicator
    this.scene.tweens.add({
      targets: this.continueIndicator,
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Hint text
    this.hintText = this.scene.add.text(
      0, -boxHeight / 2 - 14, 'SPACE / ENTER to continue', {
        font: '10px monospace',
        fill: '#808080'
      }
    ).setOrigin(0.5);
    this.container.add(this.hintText);
  }

  show(dialogues, onComplete) {
    this.dialogues = dialogues;
    this.currentIndex = -1;
    this.onComplete = onComplete || null;
    this.isActive = true;
    this.container.setVisible(true);
    this.container.setAlpha(0);

    // Pause game physics and freeze Mozart during dialogue
    this.scene.physics.world.pause();
    if (this.scene.mozart) {
      this.scene.mozart.setVelocity(0, 0);
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    this.showNext();
  }

  hide() {
    this.isActive = false;
    this.container.setVisible(false);
    if (this.textTimer) {
      this.textTimer.destroy();
      this.textTimer = null;
    }

    // Resume game physics when dialogue ends
    this.scene.physics.world.resume();
  }

  showNext() {
    this.currentIndex++;

    if (this.currentIndex >= this.dialogues.length) {
      this.close();
      return;
    }

    const entry = this.dialogues[this.currentIndex];
    this.canAdvance = false;
    this.continueIndicator.setVisible(false);

    // Update name
    this.nameText.setText(entry.name || '');

    // Update portrait
    if (entry.portrait && this.scene.textures.exists(entry.portrait)) {
      this.portraitBg.setVisible(true);
      this.portraitImage.setTexture(entry.portrait);
      this.portraitImage.setVisible(true);
    } else {
      this.portraitBg.setVisible(false);
      this.portraitImage.setVisible(false);
    }

    // Typewriter text
    this.dialogText.setText('');
    this.revealText(entry.text);
  }

  revealText(fullText) {
    let charIndex = 0;
    this.textTimer = this.scene.time.addEvent({
      delay: 25,
      callback: () => {
        charIndex++;
        this.dialogText.setText(fullText.substring(0, charIndex));

        if (charIndex >= fullText.length) {
          this.textTimer.destroy();
          this.textTimer = null;
          this.canAdvance = true;
          this.continueIndicator.setVisible(true);
        }
      },
      repeat: fullText.length - 1
    });
  }

  advance() {
    if (!this.isActive) return;

    if (!this.canAdvance) {
      // Skip typewriter, show full text
      if (this.textTimer) {
        this.textTimer.destroy();
        this.textTimer = null;
      }
      const entry = this.dialogues[this.currentIndex];
      if (entry) {
        this.dialogText.setText(entry.text);
      }
      this.canAdvance = true;
      this.continueIndicator.setVisible(true);
      return;
    }

    this.showNext();
  }

  close() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.hide();
        if (this.onComplete) {
          this.onComplete();
        }
      }
    });
  }

  destroy() {
    if (this.textTimer) {
      this.textTimer.destroy();
    }
    this.container.destroy();
  }
}
