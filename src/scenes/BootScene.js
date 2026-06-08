import Phaser from 'phaser';
import { PixelArtGenerator } from '../utils/PixelArtGenerator.js';
import { AudioGenerator } from '../utils/AudioGenerator.js';
import { drawParchmentBackground, COLORS } from '../ui/UITheme.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';
import { AnimationManager } from '../utils/AnimationManager.js';
import { safeCall } from '../utils/ErrorBoundary.js';
import { loadCompletedLevels, loadSheetMusic } from '../utils/LevelStateUtils.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Error handling for asset loading
    this.load.on('loaderror', (file) => {
      console.warn('[BootScene] Failed to load asset:', file.key, file.url);
    });

    // Parchment background
    drawParchmentBackground(this, width, height);

    // Quill writing "Loading..." text
    const loadingText = this.add.text(width / 2, height / 2 - 40, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#2B1810',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Animate quill writing text character by character
    const fullText = 'Loading...';
    let charIndex = 0;
    this.time.addEvent({
      delay: 150,
      callback: () => {
        if (charIndex < fullText.length) {
          loadingText.setText(fullText.substring(0, charIndex + 1));
          // Ink drop particle at current text position
          this.createInkDrop(
            width / 2 + (charIndex - fullText.length / 2) * 10,
            height / 2 - 35
          );
          charIndex++;
        }
      },
      repeat: fullText.length - 1
    });

    // Progress bar styled as an ink line
    const progressBox = this.add.graphics();
    progressBox.lineStyle(2, COLORS.goldDark, 0.8);
    progressBox.strokeRoundedRect(width / 2 - 150, height / 2 + 10, 300, 20, 4);

    const progressBar = this.add.graphics();

    // Quill icon (procedural)
    this.drawQuill(width / 2 - 170, height / 2 + 10);

    // Simulate loading progress
    let progress = 0;
    const timer = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += 0.1;
        progressBar.clear();
        progressBar.fillStyle(COLORS.goldDark, 1);
        progressBar.fillRoundedRect(width / 2 - 148, height / 2 + 12, 296 * Math.min(progress, 1), 16, 3);
        if (progress >= 1) {
          timer.destroy();
        }
      },
      loop: true
    });
  }

  createInkDrop(x, y) {
    const drop = this.add.circle(x, y + 10, Phaser.Math.Between(1, 3), COLORS.ink, 0.7);
    this.tweens.add({
      targets: drop,
      y: y + Phaser.Math.Between(20, 40),
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: Phaser.Math.Between(400, 800),
      onComplete: () => drop.destroy()
    });
  }

  drawQuill(x, y) {
    const g = this.add.graphics();
    // Feather shaft
    g.lineStyle(2, COLORS.inkLight, 1);
    g.beginPath();
    g.moveTo(x, y + 18);
    g.lineTo(x + 14, y - 8);
    g.strokePath();
    // Feather barbs
    g.lineStyle(1, COLORS.parchmentEdge, 0.7);
    for (let i = 0; i < 5; i++) {
      const bx = x + 3 + i * 2;
      const by = y + 12 - i * 4;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - 4, by - 3);
      g.strokePath();
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + 4, by - 3);
      g.strokePath();
    }
    // Nib
    g.fillStyle(COLORS.ink, 1);
    g.fillTriangle(x, y + 18, x - 1, y + 22, x + 1, y + 22);
  }

  create() {
    // Generate all pixel art textures
    const pixelArt = new PixelArtGenerator(this);
    pixelArt.generateAll();

    // Register all animations globally
    const animManager = new AnimationManager(this);
    animManager.registerAll();

    // Generate audio
    safeCall(() => {
      const audio = new AudioGenerator(this);
      audio.generateAll();
    });

    // Generate musical SFX
    safeCall(() => {
      const sfx = new SFXGenerator(this);
      sfx.generateAll();
    });

    // Initialize game state
    this.registry.set('lives', 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', false);
    this.registry.set('completedLevels', loadCompletedLevels());

    // Initialize sheet music collection state
    const savedSheetMusic = loadSheetMusic();
    this.registry.set('sheetMusic', savedSheetMusic);
    this.registry.set('sheetMusicCurrentLevel', { found: 0, total: 3 });

    // Small delay to let audio decode
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
      this.scene.launch('AchievementPopup');
    });
  }
}


