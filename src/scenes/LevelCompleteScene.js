import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { drawParchmentBackground, createGoldConfetti, drawStaffDivider, drawTrebleClef, COLORS } from '../ui/UITheme.js';

const LEVEL_INSTRUMENTS = {
  1: 'violin',
  2: 'flute',
  3: 'piano',
  4: 'harpsichord',
  5: 'trumpet',
  6: 'drums',
  7: 'harp'
};

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data) {
    this.levelNumber = data.level || 1;
    this.levelScore = data.levelScore || 0;
    this.timeBonus = data.timeBonus || 0;
    this.nextScene = data.nextScene || 'MenuScene';
    this.nextSceneData = data.nextSceneData || {};
    this.cutscene = data.cutscene || null;
  }

  create() {
    // Parchment background
    drawParchmentBackground(this, GAME_WIDTH, GAME_HEIGHT);

    const totalScore = this.levelScore + this.timeBonus;
    const grade = ScoreManager.getGrade(this.levelNumber, totalScore);
    const gradeColor = ScoreManager.getGradeColor(grade);

    // Save score
    ScoreManager.saveScore(this.levelNumber, totalScore);

    // Treble clef ornaments
    drawTrebleClef(this, 80, 40, 1.5);
    drawTrebleClef(this, GAME_WIDTH - 100, 40, 1.5);

    // Title
    this.add.text(GAME_WIDTH / 2, 55, 'LEVEL COMPLETE!', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Staff divider
    drawStaffDivider(this, GAME_WIDTH / 2 - 100, 85, 200);

    // Score breakdown
    let yPos = 120;
    this.add.text(GAME_WIDTH / 2, yPos, `Level Score: ${this.levelScore}`, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2B1810',
    }).setOrigin(0.5);

    yPos += 32;
    this.add.text(GAME_WIDTH / 2, yPos, `Time Bonus: +${this.timeBonus}`, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#4A3728',
    }).setOrigin(0.5);

    yPos += 32;
    this.add.text(GAME_WIDTH / 2, yPos, `Total: ${totalScore}`, {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#B8860B',
    }).setOrigin(0.5);

    // Grade display with animation
    yPos += 55;
    const gradeText = this.add.text(GAME_WIDTH / 2, yPos, grade, {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: gradeColor,
      stroke: '#8B4513',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: gradeText,
      scale: 1,
      duration: 500,
      delay: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Gold confetti burst when grade appears
        createGoldConfetti(this, GAME_WIDTH / 2, yPos - 30, 50);
      }
    });

    // Gentle pulsing on grade
    this.tweens.add({
      targets: gradeText,
      scale: 1.08,
      duration: 1000,
      delay: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Staff divider
    drawStaffDivider(this, GAME_WIDTH / 2 - 80, yPos + 50, 160);

    // High scores
    yPos += 70;
    this.add.text(GAME_WIDTH / 2, yPos, `— Level ${this.levelNumber} Best —`, {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#808080',
    }).setOrigin(0.5);

    const highScores = ScoreManager.getHighScores(this.levelNumber);
    highScores.slice(0, 5).forEach((entry, i) => {
      yPos += 22;
      const highlight = entry.score === totalScore ? '#FFD700' : '#4A3728';
      this.add.text(GAME_WIDTH / 2, yPos, `${i + 1}. ${entry.score}`, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: highlight,
      }).setOrigin(0.5);
    });

    // Continue prompt
    const continueText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '♩ Press SPACE to continue ♩', {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: '#B8860B',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: continueText,
      alpha: 1,
      duration: 500,
      delay: 2000
    });

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
    const instrument = LEVEL_INSTRUMENTS[this.levelNumber];
    if (instrument) {
      // Route through the instrument lesson tutorial before continuing
      this.scene.start('InstrumentLessonScene', {
        instrument: instrument,
        level: this.levelNumber,
        nextScene: this.nextScene,
        nextSceneData: this.nextSceneData,
        cutscene: this.cutscene
      });
    } else if (this.cutscene) {
      this.scene.start('CutsceneScene', { cutscene: this.cutscene, nextScene: this.nextScene });
    } else {
      this.scene.start(this.nextScene, this.nextSceneData);
    }
  }
}
