import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data) {
    this.levelNumber = data.level || 1;
    this.levelScore = data.levelScore || 0;
    this.timeBonus = data.timeBonus || 0;
    this.nextScene = data.nextScene || 'MenuScene';
    this.cutscene = data.cutscene || null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const totalScore = this.levelScore + this.timeBonus;
    const grade = ScoreManager.getGrade(this.levelNumber, totalScore);
    const gradeColor = ScoreManager.getGradeColor(grade);

    // Save score
    ScoreManager.saveScore(this.levelNumber, totalScore);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'LEVEL COMPLETE!', {
      font: '32px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Score breakdown
    let yPos = 140;
    this.add.text(GAME_WIDTH / 2, yPos, `Level Score: ${this.levelScore}`, {
      font: '18px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    yPos += 35;
    this.add.text(GAME_WIDTH / 2, yPos, `Time Bonus: +${this.timeBonus}`, {
      font: '18px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);

    yPos += 35;
    this.add.text(GAME_WIDTH / 2, yPos, `Total: ${totalScore}`, {
      font: '22px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);

    // Grade display with animation
    yPos += 60;
    const gradeText = this.add.text(GAME_WIDTH / 2, yPos, grade, {
      font: '72px monospace',
      fill: gradeColor,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: gradeText,
      scale: 1,
      duration: 500,
      delay: 500,
      ease: 'Back.easeOut'
    });

    // Pulsing effect on grade
    this.tweens.add({
      targets: gradeText,
      scale: 1.1,
      duration: 800,
      delay: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // High scores for this level
    yPos += 80;
    this.add.text(GAME_WIDTH / 2, yPos, `ΓÇö Level ${this.levelNumber} Best ΓÇö`, {
      font: '14px monospace',
      fill: '#808080'
    }).setOrigin(0.5);

    const highScores = ScoreManager.getHighScores(this.levelNumber);
    highScores.slice(0, 5).forEach((entry, i) => {
      yPos += 22;
      const highlight = entry.score === totalScore ? '#FFD700' : '#AAAAAA';
      this.add.text(GAME_WIDTH / 2, yPos, `${i + 1}. ${entry.score}`, {
        font: '14px monospace',
        fill: highlight
      }).setOrigin(0.5);
    });

    // Continue prompt
    const continueText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Press SPACE to continue', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: continueText,
      alpha: 1,
      duration: 500,
      delay: 2000
    });

    // Blinking
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      delay: 2500,
      yoyo: true,
      repeat: -1
    });

    // Input after delay
    this.time.delayedCall(2000, () => {
      this.input.keyboard.once('keydown-SPACE', () => this.proceed());
      this.input.keyboard.once('keydown-ENTER', () => this.proceed());
    });
  }

  proceed() {
    if (this.cutscene) {
      this.scene.start('CutsceneScene', { cutscene: this.cutscene, nextScene: this.nextScene });
    } else {
      this.scene.start(this.nextScene);
    }
  }
}
