import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 100, 'AMADEUS', {
      font: '64px monospace',
      fill: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 160, "Mozart's Musical Quest", {
      font: '24px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Mozart sprite
    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2, 280, 'mozart').setScale(3);
    }

    // Instructions
    this.add.text(GAME_WIDTH / 2, 380, 'Press SPACE, ENTER, or Tap to start', {
      font: '18px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 420, 'Arrow Keys / Touch D-pad to move | SPACE / Button to jump', {
      font: '12px monospace',
      fill: '#808080'
    }).setOrigin(0.5);

    // Blinking effect on "Press to start"
    this.tweens.add({
      targets: this.children.list[3],
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Input
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    // Reset game state
    this.registry.set('lives', 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);

    this.scene.start('CutsceneScene', { cutscene: 'intro', nextScene: 'Level1Scene' });
    this.scene.launch('UIScene');
    this.scene.launch('TouchControls');
  }
}
