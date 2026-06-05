import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { drawConcertHallBackground } from '../ui/UITheme.js';

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
  }

  create() {
    drawConcertHallBackground(this, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 40, 'HIGH SCORES', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 1,
    }).setOrigin(0.5);

    const levelNames = [
      'Vienna Streets', 'Enchanted Forest', 'Royal Palace',
      'Cathedral Depths', 'Clockwork Tower', 'Shadow Realm', 'Grand Finale'
    ];

    let yPos = 85;

    for (let level = 1; level <= 7; level++) {
      const scores = ScoreManager.getHighScores(level);
      const bestScore = scores.length > 0 ? scores[0].score : '—';
      const grade = scores.length > 0 ? ScoreManager.getGrade(level, scores[0].score) : '—';
      const gradeColor = scores.length > 0 ? ScoreManager.getGradeColor(grade) : '#555555';

      // Level name
      this.add.text(GAME_WIDTH / 2 - 180, yPos, `${level}. ${levelNames[level - 1]}`, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#B8A070'
      });

      // Score
      this.add.text(GAME_WIDTH / 2 + 100, yPos, `${bestScore}`, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#E8D8A0'
      });

      // Grade
      this.add.text(GAME_WIDTH / 2 + 180, yPos, `[${grade}]`, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: gradeColor
      });

      yPos += 32;

      // Show top 3 scores if available
      if (scores.length > 1) {
        for (let i = 1; i < Math.min(scores.length, 3); i++) {
          this.add.text(GAME_WIDTH / 2 - 140, yPos, `#${i + 1}: ${scores[i].score}`, {
            fontFamily: 'Georgia, serif', fontSize: '11px', color: '#777'
          });
          yPos += 18;
        }
      }
    }

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '← Back to Menu', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '16px', color: '#C9A84C',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'));
    backBtn.on('pointerout', () => backBtn.setColor('#C9A84C'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
  }
}
