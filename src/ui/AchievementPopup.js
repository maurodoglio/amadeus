import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';

/**
 * Toast notification scene that displays when an achievement is unlocked.
 * Runs as a parallel scene overlay so it doesn't interrupt gameplay.
 */
export class AchievementPopup extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementPopup' });
    this.queue = [];
    this.isShowing = false;
  }

  create() {
    // Listen for achievement events from the game
    this.game.events.on('achievement-unlocked', this.enqueue, this);
  }

  enqueue(achievement) {
    this.queue.push(achievement);
    if (!this.isShowing) {
      this.showNext();
    }
  }

  showNext() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const achievement = this.queue.shift();
    this.displayPopup(achievement);
  }

  displayPopup(achievement) {
    const popupWidth = 280;
    const popupHeight = 60;
    const startX = GAME_WIDTH / 2;
    const startY = -popupHeight;
    const targetY = 50;

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(startX - popupWidth / 2, startY, popupWidth, popupHeight, 8);
    bg.lineStyle(2, 0xFFD700, 1);
    bg.strokeRoundedRect(startX - popupWidth / 2, startY, popupWidth, popupHeight, 8);

    // Icon
    const icon = this.add.text(startX - popupWidth / 2 + 20, startY + popupHeight / 2, achievement.icon, {
      font: '24px Arial'
    }).setOrigin(0, 0.5);

    // Title
    const title = this.add.text(startX - popupWidth / 2 + 52, startY + 14, 'Achievement Unlocked!', {
      font: '10px monospace',
      fill: '#FFD700'
    });

    // Achievement name
    const name = this.add.text(startX - popupWidth / 2 + 52, startY + 30, achievement.name, {
      font: 'bold 14px monospace',
      fill: '#FFFFFF'
    });

    const container = this.add.container(0, 0, [bg, icon, title, name]);

    // Play unlock sound
    this.playUnlockSound();

    // Slide in from top
    this.tweens.add({
      targets: container,
      y: targetY - startY,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2.5 seconds, then slide out
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: container,
            y: startY - 80,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              container.destroy();
              this.showNext();
            }
          });
        });
      }
    });
  }

  playUnlockSound() {
    // Generate a short celebratory sound using Web Audio
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const duration = 0.4;
      const sampleRate = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Rising arpeggio chime
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteLen = duration / notes.length;

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const noteIndex = Math.min(Math.floor(t / noteLen), notes.length - 1);
        const freq = notes[noteIndex];
        const localT = t - noteIndex * noteLen;
        const envelope = Math.exp(-localT * 6);
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => ctx.close();
    } catch { /* Audio not available */ }
  }

  shutdown() {
    this.game.events.off('achievement-unlocked', this.enqueue, this);
  }
}
