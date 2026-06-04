import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'AMADEUS', {
      font: '64px monospace',
      fill: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 115, "Mozart's Musical Quest", {
      font: '24px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Mozart sprite
    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2 - 30, 190, 'mozart').setScale(2.5);
    }

    // Nannerl sprite
    if (this.textures.exists('nannerl')) {
      this.add.image(GAME_WIDTH / 2 + 30, 190, 'nannerl').setScale(2.5);
    }

    // High Scores section
    this.add.text(GAME_WIDTH / 2, 250, '— HIGH SCORES —', {
      font: '14px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);

    const levelNames = ['Vienna Streets', 'Enchanted Forest', 'Royal Palace'];
    let yPos = 275;

    for (let level = 1; level <= 3; level++) {
      const scores = ScoreManager.getHighScores(level);
      const bestScore = scores.length > 0 ? scores[0].score : '---';
      const grade = scores.length > 0 ? ScoreManager.getGrade(level, scores[0].score) : '-';
      const gradeColor = scores.length > 0 ? ScoreManager.getGradeColor(grade) : '#808080';

      this.add.text(GAME_WIDTH / 2 - 160, yPos, `${level}. ${levelNames[level - 1]}`, {
        font: '12px monospace',
        fill: '#AAAAAA'
      });

      this.add.text(GAME_WIDTH / 2 + 80, yPos, `${bestScore}`, {
        font: '12px monospace',
        fill: '#FFFFFF'
      });

      this.add.text(GAME_WIDTH / 2 + 150, yPos, `[${grade}]`, {
        font: '12px monospace',
        fill: gradeColor
      });

      yPos += 22;
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

    // Accessibility button
    const accessBtn = this.add.text(GAME_WIDTH / 2, 440, 'Accessibility Options', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    accessBtn.on('pointerover', () => accessBtn.setStyle({ fill: '#FFD700' }));
    accessBtn.on('pointerout', () => accessBtn.setStyle({ fill: '#87CEEB' }));
    accessBtn.on('pointerdown', () => {
      this.scene.sleep();
      this.scene.launch('AccessibilityScene', { returnScene: 'MenuScene' });
    });

    // Controls help
    this.add.text(GAME_WIDTH / 2, 470, 'Arrow Keys / ENTER to select | Touch D-pad to move', {
      font: '14px monospace',
      fill: '#808080'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 490, 'P1: Arrows + SPACE | P2: WASD + E', {
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

    // Play menu music
    if (this.sound.get('music_menu')) {
      this.sound.play('music_menu', { loop: true, volume: 0.3 });
    }
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
    // Stop menu music
    this.sound.stopAll();

    // Reset game state
    this.registry.set('lives', coopMode ? 5 : 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', coopMode);
    this.registry.set('comboMultiplier', 1);
    this.registry.set('comboCount', 0);
    if (!this.registry.get('completedLevels')) {
      this.registry.set('completedLevels', []);
    }

    this.scene.start('MapScene', { completedLevel: 0 });
    this.scene.launch('TouchControls');
  }
}
