import Phaser from 'phaser';
import { PixelArtGenerator } from '../utils/PixelArtGenerator.js';
import { AudioGenerator } from '../utils/AudioGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Simulate loading progress
    let progress = 0;
    const timer = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += 0.1;
        progressBar.clear();
        progressBar.fillStyle(0xFFD700, 1);
        progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * Math.min(progress, 1), 30);
        if (progress >= 1) {
          timer.destroy();
        }
      },
      loop: true
    });
  }

  create() {
    // Generate all pixel art textures
    const pixelArt = new PixelArtGenerator(this);
    pixelArt.generateAll();

    // Generate audio
    const audio = new AudioGenerator(this);
    audio.generateAll();

    // Initialize game state
    this.registry.set('lives', 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);

    // Small delay to let audio decode
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }
}
