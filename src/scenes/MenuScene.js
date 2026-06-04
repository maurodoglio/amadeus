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
      this.add.image(GAME_WIDTH / 2 - 30, 280, 'mozart').setScale(3);
    }

    // Nannerl sprite
    if (this.textures.exists('nannerl')) {
      this.add.image(GAME_WIDTH / 2 + 30, 280, 'nannerl').setScale(3);
    }

    // Menu options
    this.selectedOption = 0;
    this.menuOptions = [];

    const option1P = this.add.text(GAME_WIDTH / 2, 370, '1 Player', {
      font: '20px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);
    this.menuOptions.push(option1P);

    const option2P = this.add.text(GAME_WIDTH / 2, 400, '2 Players', {
      font: '20px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);
    this.menuOptions.push(option2P);

    // Selection indicator
    this.selector = this.add.text(GAME_WIDTH / 2 - 80, 370, '▶', {
      font: '20px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);

    // Controls help
    this.add.text(GAME_WIDTH / 2, 440, 'Arrow Keys / ENTER to select | Touch D-pad to move', {
      font: '14px monospace',
      fill: '#808080'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 460, 'P1: Arrows + SPACE | P2: WASD + E', {
      font: '12px monospace',
      fill: '#606060'
    }).setOrigin(0.5);

    // Blinking effect on selector
    this.tweens.add({
      targets: this.selector,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Input
    this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-W', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-S', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
    this.input.once('pointerdown', () => this.confirmSelection());
  }

  changeSelection(dir) {
    this.selectedOption = (this.selectedOption + dir + this.menuOptions.length) % this.menuOptions.length;
    this.selector.setY(this.menuOptions[this.selectedOption].y);
  }

  confirmSelection() {
    const coopMode = this.selectedOption === 1;
    this.startGame(coopMode);
  }

  startGame(coopMode) {
    // Reset game state
    this.registry.set('lives', coopMode ? 5 : 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', coopMode);
    if (!this.registry.get('completedLevels')) {
      this.registry.set('completedLevels', []);
    }

    this.scene.start('MapScene', { completedLevel: 0 });
    this.scene.launch('TouchControls');
  }
}
