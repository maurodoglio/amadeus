import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LEVELS } from '../config/constants.js';
import { SaveManager } from '../utils/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'AMADEUS', {
      font: '64px monospace',
      fill: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 140, "Mozart's Musical Quest", {
      font: '24px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Mozart sprite
    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2, 240, 'mozart').setScale(3);
    }

    // High score display
    const highScore = SaveManager.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_WIDTH / 2, 310, `High Score: ${highScore}`, {
        font: '18px monospace',
        fill: '#FFD700'
      }).setOrigin(0.5);
    }

    // Menu options
    const hasSave = SaveManager.hasSave();
    this.menuItems = [];
    this.selectedIndex = 0;

    let menuY = 350;

    if (hasSave) {
      const continueText = this.add.text(GAME_WIDTH / 2, menuY, '▶ Continue', {
        font: '22px monospace',
        fill: '#90EE90'
      }).setOrigin(0.5).setInteractive();
      continueText.on('pointerdown', () => this.continueGame());
      this.menuItems.push({ text: continueText, action: () => this.continueGame() });
      menuY += 40;
    }

    const newGameText = this.add.text(GAME_WIDTH / 2, menuY, '▶ New Game', {
      font: '22px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive();
    newGameText.on('pointerdown', () => this.newGame());
    this.menuItems.push({ text: newGameText, action: () => this.newGame() });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 450, 'Arrow Keys to move | SPACE to jump', {
      font: '14px monospace',
      fill: '#808080'
    }).setOrigin(0.5);

    // Highlight selected menu item
    this.updateMenuSelection();

    // Input
    this.input.keyboard.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateMenuSelection();
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
      this.updateMenuSelection();
    });
    this.input.keyboard.on('keydown-SPACE', () => this.menuItems[this.selectedIndex].action());
    this.input.keyboard.on('keydown-ENTER', () => this.menuItems[this.selectedIndex].action());
  }

  updateMenuSelection() {
    this.menuItems.forEach((item, i) => {
      item.text.setAlpha(i === this.selectedIndex ? 1 : 0.5);
    });
  }

  continueGame() {
    const saveData = SaveManager.load();
    if (!saveData) {
      this.newGame();
      return;
    }

    this.registry.set('lives', 3);
    this.registry.set('score', saveData.score || 0);
    this.registry.set('instruments', saveData.instruments || []);
    this.registry.set('currentLevel', saveData.currentLevel);

    const levelScenes = ['Level1Scene', 'Level2Scene', 'Level3Scene'];
    const levelIndex = Math.min(saveData.currentLevel - 1, levelScenes.length - 1);
    this.scene.start(levelScenes[levelIndex]);
    this.scene.launch('UIScene');
  }

  newGame() {
    SaveManager.reset();
    this.registry.set('lives', 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);

    this.scene.start('Level1Scene');
    this.scene.launch('UIScene');
  }
}
